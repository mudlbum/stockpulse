#!/usr/bin/env node
/**
 * Performance audit. METHODOLOGY §9.
 *
 * Walks the append-only ledger, marks fills, applies exits mechanically, and
 * publishes performance.json. No network I/O — it reads the committed price
 * store, so any commit can be replayed to the same numbers.
 *
 * The conventions here are deliberately unflattering, because a performance
 * page that flatters itself is worth nothing:
 *
 *  - FILL at the NEXT session's (open+close)/2, and only if that price is
 *    inside the published entry zone. Assuming a fill at the close the ranking
 *    was computed from would book a free edge that no reader could have taken.
 *  - Costs charged on every round trip: 10bps commission + spread, plus
 *    slippage of 5% of ATR, plus Korea's 0.18% securities transaction tax on
 *    sales.
 *  - Intrabar ambiguity — a session whose range contains BOTH the stop and the
 *    target — always resolves as the STOP. End-of-day data cannot tell which
 *    came first, and assuming the good one is how backtests lie.
 *  - A random-pick control is computed over the same universe on the same
 *    dates, because in a rising market a coin flip posts a good win rate.
 */

import path from 'node:path';
import { loadLedger, loadPrices, publish, readJson, writeJson, STORE } from './lib/store.mjs';
import { atr } from './lib/indicators.mjs';
import { isNum, median, quantile } from './lib/stats.mjs';

const COMMISSION_BPS = 10;            // round trip, each side
const SLIPPAGE_ATR_FRACTION = 0.05;
const KR_SALES_TAX = 0.0018;          // 증권거래세, sell side only
const BENCHMARK = { US: 'SPY', KR: 'KS11' };
const CONTROL_SEED = 20260815;        // fixed so the control is reproducible

/** Deterministic PRNG — the control set must be identical on every replay. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function main() {
  const ledger = await loadLedger();
  if (!ledger.entries.length) {
    console.log('[audit] ledger is empty — publishing an empty audit');
    await publishEmpty();
    return;
  }

  const prices = {};
  for (const m of ['US', 'KR']) prices[m] = await loadPrices(m);

  const closed = [];
  const open = [];
  const counts = {};

  for (const e of ledger.entries) {
    if (e.status === 'void') {
      closed.push(voidTrade(e));
      continue;
    }
    const bars = prices[e.market]?.bars?.[e.ticker];
    if (!bars?.length) continue;

    const result = simulate(e, bars, prices[e.market]?.bars?.[BENCHMARK[e.market]] ?? []);
    if (!result) continue;

    if (result.status === 'closed') {
      closed.push(result);
      const key = `${e.market}-${e.horizon}`;
      counts[key] = (counts[key] ?? 0) + 1;
    } else if (result.status === 'open') {
      open.push(result);
    } else {
      closed.push(result); // no_fill, recorded and shown
    }
  }

  const control = computeControl(ledger.entries, prices);

  const summary = {
    overall: statsFor(closed, control.overall),
    byHorizon: {},
  };
  for (const h of ['ultra_short', 'mid_term', 'long_term', 'ultra_long']) {
    summary.byHorizon[h] = statsFor(closed.filter((t) => t.horizon === h), control.byHorizon[h]);
  }

  const equityCurve = buildEquityCurve(closed, prices);

  await writeJson(path.join(STORE, 'audit-counts.json'), counts);
  await publish('performance', {
    summary,
    closed: closed.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 800),
    open: open.sort((a, b) => (a.date < b.date ? 1 : -1)),
    equityCurve,
    conventions: {
      fill: 'next session (open+close)/2, only if inside the published entry zone',
      commissionBps: COMMISSION_BPS,
      slippageAtrFraction: SLIPPAGE_ATR_FRACTION,
      krSalesTax: KR_SALES_TAX,
      intrabarAmbiguity: 'always resolved as the stop',
      control: 'random pick from the same universe on the same dates, fixed seed',
    },
  });

  console.log(`[audit] ${closed.length} closed, ${open.length} open`);
  console.log(`[audit] overall win rate ${fmtPct(summary.overall.winRate)} vs control ${fmtPct(summary.overall.controlWinRate)}`);
  console.log(`[audit] mean return ${fmtPct(summary.overall.meanReturn / 100)} vs benchmark ${fmtPct(summary.overall.benchmarkReturn / 100)}`);
  if (summary.overall.noFill > 0) {
    console.log(`[audit] ${summary.overall.noFill} picks were never fillable inside their entry zone`);
  }
}

const fmtPct = (x) => (isNum(x) ? `${(x * 100).toFixed(1)}%` : 'n/a');

function voidTrade(e) {
  return {
    date: e.date, market: e.market, horizon: e.horizon, ticker: e.ticker, name: e.name,
    rank: e.rank, entryPrice: null, exitPrice: null, exitDate: null, exitReason: 'void',
    returnPct: null, netReturnPct: null, holdDays: null, benchmarkReturnPct: null,
    status: 'void', voidReason: e.voidReason ?? 'marked void',
  };
}

/**
 * Replay one ledger entry against the price series.
 * Returns a trade record, or null when there is not yet a next session to fill in.
 */
function simulate(e, bars, benchBars) {
  const i0 = bars.findIndex((b) => b.date > e.date);
  if (i0 < 0) {
    // Published, but the next session has not happened yet. Returning null here
    // would make today's picks vanish from the audit entirely — the reader
    // would see ten names on the board and nothing about them on the
    // performance page. They are shown as awaiting fill instead.
    return {
      date: e.date, market: e.market, horizon: e.horizon, ticker: e.ticker, name: e.name,
      rank: e.rank, entryPrice: null, exitPrice: null, exitDate: null, exitReason: 'open',
      returnPct: null, netReturnPct: null, holdDays: 0, benchmarkReturnPct: null,
      status: 'open', voidReason: null, awaitingFill: true,
    };
  }

  const fillBar = bars[i0];
  const fillPrice = (fillBar.open + fillBar.close) / 2;

  // The entry zone is a published commitment. A pick that gapped away from it
  // was not takeable, and counting it would credit the model with a fill the
  // reader could not have got.
  const lo = e.entry?.low;
  const hi = e.entry?.high;
  if (isNum(lo) && isNum(hi) && (fillPrice < lo || fillPrice > hi)) {
    return {
      date: e.date, market: e.market, horizon: e.horizon, ticker: e.ticker, name: e.name,
      rank: e.rank, entryPrice: null, exitPrice: null, exitDate: null, exitReason: 'no_fill',
      returnPct: null, netReturnPct: null, holdDays: null, benchmarkReturnPct: null,
      status: 'no_fill', voidReason: null,
    };
  }

  const a = atr(bars.slice(0, i0 + 1), 14);
  const slip = isNum(a) ? a * SLIPPAGE_ATR_FRACTION : fillPrice * 0.0005;
  const effectiveEntry = fillPrice + slip;

  const maxHold = e.maxHoldSessions ?? 5;
  const stop = e.stop;
  const target = e.targets?.base;

  let exitIdx = null;
  let exitPrice = null;
  let exitReason = null;

  for (let i = i0; i < bars.length && i - i0 < maxHold; i++) {
    const b = bars[i];
    const hitStop = isNum(stop) && b.low <= stop;
    const hitTarget = isNum(target) && b.high >= target;

    // Both inside one session: end-of-day data cannot order them, so the stop
    // wins. Assuming the target is exactly the optimism that makes backtests
    // untrue.
    if (hitStop) {
      exitIdx = i; exitPrice = stop; exitReason = 'stop'; break;
    }
    if (hitTarget) {
      exitIdx = i; exitPrice = target; exitReason = 'target'; break;
    }
  }

  const lastIdx = Math.min(bars.length - 1, i0 + maxHold - 1);
  if (exitIdx === null) {
    if (bars.length - 1 >= i0 + maxHold - 1) {
      exitIdx = lastIdx;
      exitPrice = bars[lastIdx].close;
      exitReason = 'max_hold';
    } else {
      // Still running.
      const cur = bars[bars.length - 1];
      const grossOpen = cur.close / effectiveEntry - 1;
      return {
        date: e.date, market: e.market, horizon: e.horizon, ticker: e.ticker, name: e.name,
        rank: e.rank, entryPrice: r2(effectiveEntry), exitPrice: r2(cur.close), exitDate: null,
        exitReason: 'open', returnPct: r2(grossOpen * 100),
        netReturnPct: r2(netOf(grossOpen, e.market) * 100),
        holdDays: bars.length - 1 - i0,
        benchmarkReturnPct: r2(benchReturn(benchBars, bars[i0].date, cur.date) * 100),
        status: 'open', voidReason: null,
      };
    }
  }

  const effectiveExit = exitPrice - slip;
  const gross = effectiveExit / effectiveEntry - 1;
  const net = netOf(gross, e.market);

  return {
    date: e.date, market: e.market, horizon: e.horizon, ticker: e.ticker, name: e.name,
    rank: e.rank,
    entryPrice: r2(effectiveEntry),
    exitPrice: r2(effectiveExit),
    exitDate: bars[exitIdx].date,
    exitReason,
    returnPct: r2(gross * 100),
    netReturnPct: r2(net * 100),
    holdDays: exitIdx - i0 + 1,
    benchmarkReturnPct: r2(benchReturn(benchBars, bars[i0].date, bars[exitIdx].date) * 100),
    status: 'closed',
    voidReason: null,
  };
}

/** Commission both sides, plus Korea's sell-side transaction tax. */
function netOf(gross, market) {
  const commission = (COMMISSION_BPS / 10_000) * 2;
  const tax = market === 'KR' ? KR_SALES_TAX : 0;
  return gross - commission - tax;
}

function benchReturn(bars, fromDate, toDate) {
  if (!bars?.length) return 0;
  const a = bars.find((b) => b.date >= fromDate);
  const bIdx = bars.reduce((acc, b, i) => (b.date <= toDate ? i : acc), -1);
  const b = bIdx >= 0 ? bars[bIdx] : null;
  if (!a || !b || !(a.close > 0)) return 0;
  return b.close / a.close - 1;
}

/**
 * Random-pick control over the same universe on the same dates. METHODOLOGY §9.
 * Without this, a 65% win rate in a bull market reads as skill when it may be
 * the base rate.
 */
function computeControl(entries, prices) {
  const rng = mulberry32(CONTROL_SEED);
  const byHorizon = {};
  const overall = [];

  const dates = [...new Set(entries.map((e) => `${e.market}|${e.date}|${e.horizon}|${e.maxHoldSessions}`))];
  for (const key of dates) {
    const [market, date, horizon, maxHoldStr] = key.split('|');
    const maxHold = Number(maxHoldStr) || 5;
    const pool = Object.keys(prices[market]?.bars ?? {});
    if (pool.length < 20) continue;

    // Five draws per publication date keeps the control's sampling error well
    // below the signal we are testing for, without unbounded cost.
    for (let k = 0; k < 5; k++) {
      const sym = pool[Math.floor(rng() * pool.length)];
      const bars = prices[market].bars[sym];
      const i0 = bars?.findIndex((b) => b.date > date) ?? -1;
      if (i0 < 0) continue;
      const exitIdx = Math.min(bars.length - 1, i0 + maxHold - 1);
      if (exitIdx <= i0) continue;
      const entry = (bars[i0].open + bars[i0].close) / 2;
      if (!(entry > 0)) continue;
      const ret = bars[exitIdx].close / entry - 1;
      overall.push(ret);
      (byHorizon[horizon] ??= []).push(ret);
    }
  }
  return { overall, byHorizon };
}

function statsFor(trades, controlReturns = []) {
  const real = trades.filter((t) => t.status === 'closed' && isNum(t.netReturnPct));
  const noFill = trades.filter((t) => t.status === 'no_fill').length;
  const rets = real.map((t) => t.netReturnPct);
  const bench = real.map((t) => t.benchmarkReturnPct).filter(isNum);

  const wins = rets.filter((r) => r > 0).length;
  const controlWins = controlReturns.filter((r) => r > 0).length;

  return {
    picks: trades.length,
    filled: real.length,
    noFill,
    closedCount: real.length,
    winRate: rets.length ? wins / rets.length : null,
    controlWinRate: controlReturns.length ? controlWins / controlReturns.length : null,
    meanReturn: rets.length ? r2(rets.reduce((a, b) => a + b, 0) / rets.length) : null,
    medianReturn: rets.length ? r2(median(rets)) : null,
    benchmarkReturn: bench.length ? r2(bench.reduce((a, b) => a + b, 0) / bench.length) : null,
    excessReturn:
      rets.length && bench.length
        ? r2(rets.reduce((a, b) => a + b, 0) / rets.length - bench.reduce((a, b) => a + b, 0) / bench.length)
        : null,
    maxDrawdown: r2(maxDrawdown(real)),
    avgHoldDays: real.length ? r2(real.reduce((a, t) => a + (t.holdDays ?? 0), 0) / real.length) : null,
    // A 90% win rate with one −60% tail is a losing strategy; the distribution
    // is published, not just the average.
    p10: rets.length ? r2(quantile(rets, 0.1)) : null,
    p90: rets.length ? r2(quantile(rets, 0.9)) : null,
    worst: rets.length ? r2(Math.min(...rets)) : null,
    best: rets.length ? r2(Math.max(...rets)) : null,
    sampleWarning: real.length < 30,
  };
}

function maxDrawdown(trades) {
  const sorted = [...trades].sort((a, b) => (a.exitDate ?? '') < (b.exitDate ?? '') ? -1 : 1);
  let equity = 1;
  let peak = 1;
  let dd = 0;
  for (const t of sorted) {
    equity *= 1 + (t.netReturnPct ?? 0) / 100 / Math.max(1, sorted.length / 20);
    peak = Math.max(peak, equity);
    dd = Math.max(dd, (peak - equity) / peak);
  }
  return dd * 100;
}

/** Equal-weight equity curve of closed trades, with the benchmark alongside. */
function buildEquityCurve(trades) {
  const closed = trades
    .filter((t) => t.status === 'closed' && isNum(t.netReturnPct) && t.exitDate)
    .sort((a, b) => (a.exitDate < b.exitDate ? -1 : 1));
  if (!closed.length) return [];

  const byDate = new Map();
  for (const t of closed) {
    if (!byDate.has(t.exitDate)) byDate.set(t.exitDate, []);
    byDate.get(t.exitDate).push(t);
  }

  let value = 100;
  let benchmark = 100;
  const out = [];
  for (const [date, group] of [...byDate.entries()].sort()) {
    // Each closed trade is one equal-weight slot in a 20-position book, which
    // is the sizing the site's simulator defaults to.
    const slot = 1 / 20;
    for (const t of group) {
      value *= 1 + (t.netReturnPct / 100) * slot;
      benchmark *= 1 + ((t.benchmarkReturnPct ?? 0) / 100) * slot;
    }
    out.push({ date, value: r2(value), benchmark: r2(benchmark) });
  }
  return out;
}

async function publishEmpty() {
  const empty = {
    picks: 0, filled: 0, noFill: 0, closedCount: 0, winRate: null, controlWinRate: null,
    meanReturn: null, medianReturn: null, benchmarkReturn: null, excessReturn: null,
    maxDrawdown: null, avgHoldDays: null, p10: null, p90: null, worst: null, best: null,
    sampleWarning: true,
  };
  await publish('performance', {
    summary: {
      overall: empty,
      byHorizon: {
        ultra_short: { ...empty }, mid_term: { ...empty },
        long_term: { ...empty }, ultra_long: { ...empty },
      },
    },
    closed: [],
    open: [],
    equityCurve: [],
  });
}

const r2 = (x) => (isNum(x) ? Math.round(x * 100) / 100 : null);

export { simulate, statsFor, netOf, mulberry32 };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[audit] fatal:', err);
    process.exit(1);
  });
}
