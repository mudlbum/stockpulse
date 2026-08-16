#!/usr/bin/env node
/**
 * Multi-day pipeline simulation.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * `smoke-test.mjs` runs the pipeline ONCE. Everything genuinely stateful in
 * this system only happens on the SECOND run and later:
 *
 *   - hysteresis retaining an incumbent that slipped in rank
 *   - the score-margin requirement blocking a marginal challenger
 *   - rank-movement badges (+3 / −1 / NEW)
 *   - 30-day turnover, which needs a board history to compute
 *   - `heldSessions` accumulating, and the min-hold gate that depends on it
 *   - stop-out detection, which compares today's lows to a stop published
 *     on a previous day
 *   - the ledger growing, and the audit closing positions as bars accrue
 *
 * None of that had ever executed before this script. A daily site whose
 * day-over-day logic has never run is a daily site that does not work.
 *
 * The simulation replays N sessions against a fixed synthetic market: on each
 * session it truncates every price series to that date, rewrites the universe
 * as-of, and runs the REAL `build-rankings.mjs` and `evaluate.mjs` as
 * subprocesses. Nothing is mocked below the store boundary.
 *
 * Usage:
 *   node scripts/simulate-days.mjs            # 25 sessions
 *   node scripts/simulate-days.mjs 40         # 40 sessions
 *   node scripts/simulate-days.mjs 25 --keep  # leave the store in place
 */

import { execFileSync } from 'node:child_process';
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { makeAnnual, makeBalance, makeBars, makeQuarters } from '../tests/fixtures/generate.mjs';
import { ROOT, STORE, SRC_DATA, PUBLIC_DATA, writeJson, readJson } from './lib/store.mjs';

const DAYS = Number(process.argv[2]) || 25;
const KEEP = process.argv.includes('--keep');
const BACKUP = path.join(ROOT, '.sim-backup');

const US_SECTORS = ['Information Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
  'Energy', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Communication Services', 'Consumer Staples'];
const SECTOR_ETFS = { XLK: 'Information Technology', XLV: 'Health Care', XLF: 'Financials',
  XLY: 'Consumer Discretionary', XLE: 'Energy', XLI: 'Industrials', XLB: 'Materials',
  XLU: 'Utilities', XLRE: 'Real Estate', XLC: 'Communication Services', XLP: 'Consumer Staples' };

const fail = [];
const pass = [];
const check = (name, cond, detail = '') => {
  if (cond) pass.push(name);
  else fail.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

/** Build the full market once; each session is a prefix of these series. */
function buildMarket() {
  const usFull = {};
  const usFund = {};
  const usTickers = [];
  for (let i = 0; i < 80; i++) {
    const ticker = `SIM${String(i).padStart(2, '0')}`;
    usFull[ticker] = makeBars({
      n: 430, seed: 4000 + i, start: 25 + i * 4,
      // Deliberately wide dispersion in drift and vol so the ranking genuinely
      // reshuffles between sessions. A flat market would make hysteresis look
      // like it works simply because nothing moved.
      drift: -0.0004 + (i % 13) * 0.00018, vol: 0.010 + (i % 7) * 0.006,
      volume: 2_500_000 + i * 80_000, volTrend: ((i % 5) - 2) * 0.4,
    });
    const quarters = makeQuarters({
      n: 16, revenue0: 700_000_000 + i * 9_000_000,
      growth: 0.004 + (i % 11) * 0.009, margin: 0.05 + (i % 9) * 0.038,
      marginTrend: ((i % 5) - 2) * 0.0022, endDate: '2026-06-30',
    });
    usFund[ticker] = {
      quarters,
      annual: makeAnnual({ n: 12, revenue0: 1_800_000_000 + i * 35_000_000, growth: 0.02 + (i % 9) * 0.021, margin: 0.16 + (i % 11) * 0.042 }),
      balance: makeBalance({ revenue: 2_800_000_000 + i * 45_000_000 }),
      lastFiled: '2026-08-05',
      entityName: `Simulated Company ${i}`,
      updatedAt: new Date().toISOString(),
    };
    usTickers.push({
      ticker, name: `Simulated Company ${i}`, cik: String(i).padStart(10, '0'),
      sector: US_SECTORS[i % US_SECTORS.length], marketCap: 2.5e9 + i * 5e7,
    });
  }
  for (const [etf, sector] of Object.entries(SECTOR_ETFS)) {
    usFull[etf] = makeBars({ n: 430, seed: 9000 + sector.length * 7, start: 100, drift: 0.00025, vol: 0.011 });
  }
  usFull.SPY = makeBars({ n: 430, seed: 4242, start: 500, drift: 0.0003, vol: 0.010 });

  const krFull = {};
  const krFund = {};
  const krTickers = [];
  const KR_SECTORS = ['반도체 제조업', '전자부품 제조업', '자동차 제조업', '의약품 제조업',
    '금융업', '화학물질 제조업', '소프트웨어 개발', '유통업', '건설업'];
  for (let i = 0; i < 50; i++) {
    const ticker = String(200000 + i * 173).padStart(6, '0');
    krFull[ticker] = makeBars({
      n: 430, seed: 6000 + i, start: 9000 + i * 1100,
      drift: -0.0002 + (i % 9) * 0.00016, vol: 0.013 + (i % 6) * 0.005,
      volume: 400_000 + i * 25_000,
    });
    const quarters = makeQuarters({ n: 12, revenue0: 180_000_000_000 + i * 1.1e10, growth: 0.003 + (i % 8) * 0.010, margin: 0.04 + (i % 7) * 0.033 });
    krFund[ticker] = {
      quarters, annual: [], balance: makeBalance({ revenue: 7e11 + i * 2.2e10 }),
      sector: KR_SECTORS[i % KR_SECTORS.length], updatedAt: new Date().toISOString(),
    };
    krTickers.push({
      ticker, name: `모의기업${i}`, sector: KR_SECTORS[i % KR_SECTORS.length],
      exchange: i % 3 === 0 ? 'KOSDAQ' : 'KOSPI', marketCap: 4e11 + i * 9e10, priceLimited: false,
    });
  }
  krFull.KS11 = makeBars({ n: 430, seed: 4141, start: 2600, drift: 0.0002, vol: 0.011 });

  return { usFull, usFund, usTickers, krFull, krFund, krTickers };
}

/** Truncate every series to the first `len` bars and write the store. */
async function writeSession(mkt, len) {
  const cut = (full) => Object.fromEntries(Object.entries(full).map(([k, v]) => [k, v.slice(0, len)]));
  const us = cut(mkt.usFull);
  const kr = cut(mkt.krFull);

  await writeJson(path.join(STORE, 'prices', 'us.json'), { market: 'US', bars: us });
  await writeJson(path.join(STORE, 'prices', 'kr.json'), { market: 'KR', bars: kr });
  await writeJson(path.join(STORE, 'fundamentals', 'us.json'), { market: 'US', companies: mkt.usFund });
  await writeJson(path.join(STORE, 'fundamentals', 'kr.json'), { market: 'KR', companies: mkt.krFund });

  const usAsOf = us.SIM00.at(-1).date;
  const krAsOf = kr[mkt.krTickers[0].ticker].at(-1).date;
  await writeJson(path.join(SRC_DATA, 'universe-us.json'),
    { market: 'US', asOf: usAsOf, count: mkt.usTickers.length, tickers: mkt.usTickers, sectorEtfs: SECTOR_ETFS });
  await writeJson(path.join(SRC_DATA, 'universe-kr.json'),
    { market: 'KR', asOf: krAsOf, count: mkt.krTickers.length, tickers: mkt.krTickers });

  return { usAsOf, krAsOf };
}

const run = (script) =>
  execFileSync('node', [script], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

async function main() {
  if (!KEEP) {
    for (const [dir, dest] of [[STORE, BACKUP], [SRC_DATA, `${BACKUP}-src`], [PUBLIC_DATA, `${BACKUP}-pub`]]) {
      await rm(dest, { recursive: true, force: true });
      if (existsSync(dir)) await cp(dir, dest, { recursive: true });
    }
  }
  await rm(STORE, { recursive: true, force: true });
  await mkdir(STORE, { recursive: true });

  console.log(`[sim] building market, replaying ${DAYS} sessions…`);
  const mkt = buildMarket();
  const startLen = 430 - DAYS;

  const timeline = [];
  for (let d = 0; d < DAYS; d++) {
    const { usAsOf } = await writeSession(mkt, startLen + d + 1);
    run('scripts/build-rankings.mjs');
    run('scripts/evaluate.mjs');

    const rankings = await readJson(path.join(SRC_DATA, 'rankings.json'));
    const perf = await readJson(path.join(SRC_DATA, 'performance.json'));
    const ledger = await readJson(path.join(STORE, 'ledger.json'));

    timeline.push({
      day: d, asOf: usAsOf,
      boards: Object.fromEntries(['ultra_short', 'mid_term', 'long_term', 'ultra_long'].map((h) => {
        const b = rankings.boards.US[h];
        return [h, {
          tickers: b.rows.map((r) => r.ticker),
          ranks: Object.fromEntries(b.rows.map((r) => [r.ticker, r.rank])),
          movements: Object.fromEntries(b.rows.map((r) => [r.ticker, r.movement])),
          held: Object.fromEntries(b.rows.map((r) => [r.ticker, r.heldSessions ?? null])),
          flags: Object.fromEntries(b.rows.map((r) => [r.ticker, r.flags])),
          turnover: b.turnover30d,
          stoppedOut: (b.stoppedOut ?? []).map((x) => x.ticker),
          stops: Object.fromEntries(b.rows.map((r) => [r.ticker, r.stop])),
        }];
      })),
      ledgerCount: ledger.entries.length,
      closed: perf.closed.filter((t) => t.status === 'closed').length,
      open: perf.open.length,
      noFill: perf.summary.overall.noFill,
      winRate: perf.summary.overall.winRate,
    });
    process.stdout.write(`\r[sim] session ${d + 1}/${DAYS} (${usAsOf})   `);
  }
  console.log('\n');

  // ══════════════════════════════════════════════════════════════ checks ═══

  // 1. Day 1 is all NEW; later days must not be.
  const d0 = timeline[0].boards.ultra_short;
  check('day 1 marks every row NEW', Object.values(d0.movements).every((m) => m === 'NEW'));

  const laterAllNew = timeline.slice(1).filter((t) =>
    Object.values(t.boards.ultra_short.movements).every((m) => m === 'NEW'));
  check('later sessions are not all-NEW (state is carrying over)',
    laterAllNew.length < timeline.length * 0.3,
    `${laterAllNew.length}/${timeline.length - 1} later sessions were entirely NEW`);

  // 2. heldSessions must actually accumulate for a retained name.
  const maxHeld = Math.max(...timeline.flatMap((t) =>
    Object.values(t.boards.long_term.held).filter((x) => typeof x === 'number')));
  check('heldSessions accumulates past 1 on the long board', maxHeld > 1, `max ${maxHeld}`);

  // 3. Turnover must be computed, in range, and ordered by horizon.
  //    METHODOLOGY §7 predicts ultra-short churns far more than ultra-long.
  const avgTurn = (h) => {
    const v = timeline.slice(5).map((t) => t.boards[h].turnover).filter(Number.isFinite);
    return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
  };
  const tUS = avgTurn('ultra_short');
  const tUL = avgTurn('ultra_long');
  check('turnover is in [0,1]', [tUS, tUL].every((x) => x >= 0 && x <= 1), `${tUS} / ${tUL}`);
  check('ultra-short turns over faster than ultra-long', tUS >= tUL,
    `ultra_short ${(tUS * 100).toFixed(0)}% vs ultra_long ${(tUL * 100).toFixed(0)}%`);

  // 4. Hysteresis: on the long board (exit rank 20, min hold 21) a name should
  //    persist for many consecutive sessions.
  const runs = new Map();
  let best = 0;
  for (const t of timeline) {
    const present = new Set(t.boards.long_term.tickers);
    for (const tk of present) runs.set(tk, (runs.get(tk) ?? 0) + 1);
    for (const tk of [...runs.keys()]) if (!present.has(tk)) runs.delete(tk);
    best = Math.max(best, ...[...runs.values(), 0]);
  }
  check('a long-term name holds its seat across many sessions', best >= Math.min(10, DAYS - 2),
    `longest unbroken run ${best} of ${DAYS}`);

  // 5. The ledger must grow monotonically and never shrink (append-only).
  let monotonic = true;
  for (let i = 1; i < timeline.length; i++) {
    if (timeline[i].ledgerCount < timeline[i - 1].ledgerCount) monotonic = false;
  }
  check('ledger is append-only across sessions', monotonic);
  check('ledger grew over the run', timeline.at(-1).ledgerCount > timeline[0].ledgerCount,
    `${timeline[0].ledgerCount} -> ${timeline.at(-1).ledgerCount}`);

  // 6. The audit must start closing positions as bars accrue.
  check('audit closes positions over time', timeline.at(-1).closed > 0,
    `${timeline.at(-1).closed} closed after ${DAYS} sessions`);
  check('audit tracks open positions', timeline.at(-1).open > 0);

  // 7. Movement badges must be arithmetically consistent with the prior board.
  let badMoves = 0;
  let checkedMoves = 0;
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1].boards.ultra_short.ranks;
    const cur = timeline[i].boards.ultra_short;
    for (const [tk, rank] of Object.entries(cur.ranks)) {
      const mv = cur.movements[tk];
      if (mv === 'NEW') {
        // NEW must mean it was genuinely absent from the previous published board.
        if (prev[tk] !== undefined) badMoves++;
        checkedMoves++;
      } else if (typeof mv === 'number') {
        checkedMoves++;
        if (prev[tk] === undefined || prev[tk] - rank !== mv) badMoves++;
      }
    }
  }
  check('every movement badge matches the previous published rank',
    badMoves === 0, `${badMoves} of ${checkedMoves} badges wrong`);

  // 8. A stopped-out name must not be back on the board the very next session.
  //    METHODOLOGY §7: "cannot re-enter for 5 sessions".
  let reentries = [];
  for (let i = 1; i < timeline.length; i++) {
    // A stopped-out name is ejected from the board, so it is reported on the
    // board's `stoppedOut` list rather than as a flag on a surviving row.
    const stoppedYesterday = timeline[i - 1].boards.ultra_short.stoppedOut;
    for (const tk of stoppedYesterday) {
      if (timeline[i].boards.ultra_short.tickers.includes(tk)) {
        reentries.push(`${timeline[i].asOf}:${tk}`);
      }
    }
  }
  // Guard against a vacuous pass: if no name ever stopped out, the check above
  // proves nothing. Count them and require the scenario to have occurred.
  const stopOutCount = timeline.reduce((n, t) => n + t.boards.ultra_short.stoppedOut.length, 0);
  check('the run actually produced stop-outs to test against', stopOutCount > 0,
    'no stop-out ever fired, so the cooldown check is vacuous');
  check('a stopped-out name serves its cooldown before returning',
    reentries.length === 0, `${reentries.length} immediate re-entries: ${reentries.slice(0, 4).join(', ')}`);

  // METHODOLOGY §7 says the cooldown is FIVE sessions, not one.
  const early = [];
  for (let i = 0; i < timeline.length; i++) {
    for (const tk of timeline[i].boards.ultra_short.stoppedOut) {
      for (let j = i + 1; j <= Math.min(i + 4, timeline.length - 1); j++) {
        if (timeline[j].boards.ultra_short.tickers.includes(tk)) {
          early.push(`${tk} back after ${j - i} session(s) on ${timeline[j].asOf}`);
        }
      }
    }
  }
  check('the cooldown lasts the full 5 sessions', early.length === 0,
    `${early.length} early returns: ${early.slice(0, 4).join('; ')}`);
  console.log(`[sim] stop-outs observed: ${stopOutCount}`);

  // 9. Ranks stay dense and boards stay within the cap on every session.
  let shapeBad = 0;
  for (const t of timeline) {
    for (const h of Object.keys(t.boards)) {
      const ranks = Object.values(t.boards[h].ranks).sort((a, b) => a - b);
      if (ranks.length > 10) shapeBad++;
      if (ranks.some((v, i) => v !== i + 1)) shapeBad++;
      if (new Set(t.boards[h].tickers).size !== t.boards[h].tickers.length) shapeBad++;
    }
  }
  check('board shape is valid on every session', shapeBad === 0, `${shapeBad} violations`);

  // 10. Reproducibility: re-running the ranking on unchanged inputs must
  //     produce an identical board. This is the property the README claims.
  const before = await readJson(path.join(SRC_DATA, 'rankings.json'));
  run('scripts/build-rankings.mjs');
  const after = await readJson(path.join(SRC_DATA, 'rankings.json'));
  const strip = (o) => JSON.stringify(o.boards);
  check('re-running on unchanged inputs reproduces the same boards',
    strip(before) === strip(after));

  // ─────────────────────────────────────────────────────────────── report ──
  console.log('session   US ultra-short board (rank order)                        turn  ledger closed');
  for (const t of timeline.filter((_, i) => i % Math.max(1, Math.floor(DAYS / 12)) === 0 || i === DAYS - 1)) {
    const b = t.boards.ultra_short;
    const names = b.tickers.map((tk) => {
      const m = b.movements[tk];
      const tag = m === 'NEW' ? '*' : m > 0 ? `+${m}` : m < 0 ? `${m}` : '=';
      return `${tk.replace('SIM', '')}${tag}`;
    }).join(' ');
    console.log(
      `${t.asOf}  ${names.padEnd(56).slice(0, 56)}  ${String(Math.round(b.turnover * 100)).padStart(3)}%  ${String(t.ledgerCount).padStart(6)} ${String(t.closed).padStart(6)}`,
    );
  }
  console.log(`\nturnover by horizon (sessions 6+): ultra_short ${(tUS * 100).toFixed(0)}%  ultra_long ${(tUL * 100).toFixed(0)}%`);
  console.log(`longest unbroken long-term seat: ${best} sessions`);
  const last = timeline.at(-1);
  console.log(`final: ledger ${last.ledgerCount}, closed ${last.closed}, open ${last.open}, no-fill ${last.noFill}, win rate ${last.winRate !== null ? (last.winRate * 100).toFixed(1) + '%' : 'n/a'}`);

  if (!KEEP) {
    for (const [dir, dest] of [[STORE, BACKUP], [SRC_DATA, `${BACKUP}-src`], [PUBLIC_DATA, `${BACKUP}-pub`]]) {
      if (!existsSync(dest)) continue;
      await rm(dir, { recursive: true, force: true });
      await cp(dest, dir, { recursive: true });
      await rm(dest, { recursive: true, force: true });
    }
    console.log('[sim] restored the previous store and published data');
  }

  console.log(`\n[sim] ${pass.length} checks passed, ${fail.length} failed`);
  for (const f of fail) console.error('  FAIL', f);
  if (fail.length) process.exit(1);
  console.log('[sim] OK');
}

main().catch((err) => {
  console.error('[sim] fatal:', err);
  process.exit(1);
});
