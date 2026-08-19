import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDiversification, applyHysteresis, regimeMultiplier, riskGauge,
  scoreUniverse, tradeParameters, WEIGHTS,
} from '../scripts/lib/score.mjs';
import {
  averageInvestedCapital, crowdingPenalty, distressGate, gapTent, gapQuality,
  piotroski, roic, ttm,
} from '../scripts/lib/factors.mjs';
import { atr, ema } from '../scripts/lib/indicators.mjs';
import { makeBars, makeQuarters } from './fixtures/generate.mjs';
import { sectorForSic, SECTORS } from '../scripts/lib/sic.mjs';
import { maxDrawdown, buildEquityCurve, BOOK_SLOTS } from '../scripts/evaluate.mjs';
import { structurallyUnavailable, STATEMENT_FACTORS } from '../scripts/build-rankings.mjs';
import { MIN_PRESENT } from '../scripts/lib/score.mjs';

// ── factor shapes ──────────────────────────────────────────────────────────

test('gapTent peaks at +4% and penalizes exhaustion gaps', () => {
  assert.equal(gapTent(0), 0);
  assert.ok(Math.abs(gapTent(0.04) - 1) < 1e-9);
  assert.ok(gapTent(0.02) < gapTent(0.04));
  assert.ok(gapTent(0.08) < gapTent(0.04));
  assert.equal(gapTent(0.12), 0);
  // The substantive change from the original flat 2-8% band: a very large
  // unexplained gap is a reversal signal, so it must score NEGATIVE, not 0.
  assert.ok(gapTent(0.20) < 0, 'a +20% gap must be penalized');
  assert.equal(gapTent(-0.03), 0);
});

test('gapQuality separates a gap that held from one that was sold', () => {
  const base = { date: 'a', open: 100, high: 100, low: 100, close: 100, volume: 1 };
  const held = [base, { date: 'b', open: 104, high: 105, low: 103, close: 105, volume: 1 }];
  const sold = [base, { date: 'b', open: 104, high: 105, low: 103, close: 103, volume: 1 }];
  assert.ok(gapQuality(held) > gapQuality(sold));
});

test('crowdingPenalty fires only when price is extended beyond 2.5 ATR', () => {
  const calm = makeBars({ n: 120, drift: 0.0001, vol: 0.01, seed: 3 });
  assert.ok(crowdingPenalty(calm) >= 0);

  const extended = makeBars({ n: 120, drift: 0.0001, vol: 0.01, seed: 3 });
  const last = extended[extended.length - 1];
  const spike = last.close * 1.45;
  extended.push({ date: '2026-09-01', open: spike, high: spike, low: spike, close: spike, volume: 1 });
  assert.ok(crowdingPenalty(extended) > 0.2, 'a 45% spike above trend must be penalized');
});

test('piotroski returns null when too few tests are computable', () => {
  assert.equal(piotroski(null, null), null);
  assert.equal(piotroski({ netIncome: 1 }, { netIncome: 1 }), null);
});

test('piotroski scores an improving company above a deteriorating one', () => {
  const prev = {
    netIncome: 100, totalAssets: 1000, operatingCashFlow: 120, longTermDebt: 300,
    currentAssets: 400, currentLiabilities: 200, sharesOutstanding: 1000,
    grossProfit: 400, revenue: 1000,
  };
  const better = {
    netIncome: 150, totalAssets: 1000, operatingCashFlow: 200, longTermDebt: 250,
    currentAssets: 500, currentLiabilities: 200, sharesOutstanding: 990,
    grossProfit: 470, revenue: 1100,
  };
  const worse = {
    netIncome: 20, totalAssets: 1200, operatingCashFlow: -30, longTermDebt: 500,
    currentAssets: 300, currentLiabilities: 300, sharesOutstanding: 1200,
    grossProfit: 300, revenue: 900,
  };
  assert.ok(piotroski(better, prev).score > piotroski(worse, prev).score);
  assert.ok(piotroski(better, prev).score >= 7);
});

test('distressGate catches sustained negative operating cash flow', () => {
  const bad = { quarters: makeQuarters({ n: 8 }).map((q) => ({ ...q, operatingCashFlow: -1000 })) };
  assert.equal(distressGate(bad), 'negative_operating_cash_flow');
  const good = { quarters: makeQuarters({ n: 8 }) };
  assert.equal(distressGate(good), null);
});

test('ttm requires four complete quarters', () => {
  const q = makeQuarters({ n: 8 });
  assert.ok(ttm(q, 'revenue') > 0);
  assert.equal(ttm(q.slice(-2), 'revenue'), null);
  assert.equal(ttm([...q.slice(-3), { revenue: null }], 'revenue'), null);
});

// ── cross-sectional scoring ────────────────────────────────────────────────

function universe(n = 40, seed = 1) {
  return Array.from({ length: n }, (_, i) => ({
    ticker: `T${i}`,
    name: `Test ${i}`,
    sector: ['Tech', 'Health', 'Energy', 'Financials'][i % 4],
    bars: makeBars({ n: 300, seed: seed + i, drift: 0.0002 + i * 0.00002 }),
    factors: {
      relativeVolume: 1 + i * 0.1,
      gapQuality: (i % 7) / 7,
      newsSentiment: ((i % 5) - 2) / 2,
      volatilityExpansion: (i % 3) * 0.4,
      trendPosition: (i % 11) / 11,
      _crowding: 0,
    },
  }));
}

test('scoreUniverse ranks, assigns ranks, and drops gated rows', () => {
  const rows = universe(40);
  rows[0].gate = 'price_limit_censored';
  const ranked = scoreUniverse(rows, 'ultra_short');
  assert.ok(ranked.length === 39, `expected 39, got ${ranked.length}`);
  assert.equal(ranked[0].rank, 1);
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i - 1].score >= ranked[i].score);
  assert.ok(!ranked.some((r) => r.ticker === 'T0'));
});

test('scoreUniverse drops rows below the completeness gate', () => {
  const rows = universe(20);
  rows[5].factors = { relativeVolume: 2, gapQuality: null, newsSentiment: null, volatilityExpansion: null, trendPosition: null, _crowding: 0 };
  const ranked = scoreUniverse(rows, 'ultra_short');
  assert.ok(!ranked.some((r) => r.ticker === 'T5'), 'a row with 1 of 5 factors must not be ranked');
});

test('every weight set sums to 1', () => {
  for (const [h, w] of Object.entries(WEIGHTS)) {
    const sum = Object.values(w).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-9, `${h} weights sum to ${sum}`);
  }
});

test('regime multiplier scales down in a hostile tape without reordering', () => {
  const down = Array.from({ length: 260 }, (_, i) => {
    const p = 200 - i * 0.3;
    return { date: `d${i}`, open: p, high: p, low: p, close: p, volume: 1 };
  });
  const weak = Array.from({ length: 30 }, () => down);
  const r = regimeMultiplier({ benchmarkBars: down, universeBars: weak });
  assert.equal(r.state, 'risk_off');
  assert.equal(r.multiplier, 0.5);

  const up = Array.from({ length: 260 }, (_, i) => {
    const p = 100 + i * 0.3;
    return { date: `d${i}`, open: p, high: p, low: p, close: p, volume: 1 };
  });
  const strong = regimeMultiplier({ benchmarkBars: up, universeBars: Array.from({ length: 30 }, () => up) });
  assert.equal(strong.state, 'risk_on');
  assert.equal(strong.multiplier, 1);

  // Ordering must be identical either way — the multiplier is a size signal.
  const rows = universe(30);
  const a = scoreUniverse(rows, 'ultra_short', { multiplier: 1, state: 'risk_on' }).map((x) => x.ticker);
  const b = scoreUniverse(rows, 'ultra_short', { multiplier: 0.5, state: 'risk_off' }).map((x) => x.ticker);
  assert.deepEqual(a, b);
});

test('regime returns unknown rather than guessing when history is short', () => {
  const r = regimeMultiplier({ benchmarkBars: [], universeBars: [] });
  assert.equal(r.state, 'unknown');
  assert.equal(r.multiplier, 1);
});

// ── diversification ────────────────────────────────────────────────────────

test('diversification caps names per sector and records why', () => {
  const ranked = Array.from({ length: 20 }, (_, i) => ({
    ticker: `S${i}`, name: `S${i}`, sector: i < 8 ? 'Tech' : 'Health',
    score: 10 - i * 0.1, bars: makeBars({ n: 80, seed: 100 + i }),
  }));
  const { selected, displaced } = applyDiversification(ranked, { topN: 10, maxPerSector: 3 });
  const techCount = selected.filter((r) => r.sector === 'Tech').length;
  assert.ok(techCount <= 4, `expected <=4 tech (cap relaxes with few sectors), got ${techCount}`);
  assert.ok(displaced.some((d) => d.displacedBy === 'sector_cap'));
});

test('diversification caps highly correlated names', () => {
  // Ten copies of the same series is one position, not ten.
  const shared = makeBars({ n: 120, seed: 5 });
  const ranked = Array.from({ length: 12 }, (_, i) => ({
    ticker: `C${i}`, name: `C${i}`, sector: `Sec${i}`, score: 10 - i * 0.1, bars: shared,
  }));
  const { selected, displaced } = applyDiversification(ranked, { topN: 10, maxCorrelation: 0.85 });
  assert.ok(selected.length < 10, `expected correlation cap to bite, selected ${selected.length}`);
  assert.ok(displaced.some((d) => d.displacedBy === 'correlation_cap'));
});

// ── hysteresis ─────────────────────────────────────────────────────────────

const mkRanked = (tickers) =>
  tickers.map((t, i) => ({ ticker: t, name: t, score: 10 - i, rank: i + 1, sector: 'X' }));

test('first run marks everything NEW', () => {
  const { board, turnover } = applyHysteresis(mkRanked(['A', 'B', 'C']), [], { exitRank: 12, minHold: 1, topN: 3 });
  assert.equal(turnover, 1);
  assert.ok(board.every((r) => r.movement === 'NEW'));
});

test('an incumbent inside the exit rank keeps its seat', () => {
  // B has slipped to rank 11 but the exit rank is 16, so it stays. This is the
  // original spec's stability rule, scaled by horizon.
  const today = mkRanked(['A', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'B']);
  const previous = [
    { ticker: 'B', rank: 2, heldSessions: 10 },
    { ticker: 'A', rank: 1, heldSessions: 10 },
  ];
  const { board } = applyHysteresis(today, previous, { exitRank: 16, minHold: 5, topN: 10 });
  assert.ok(board.some((r) => r.ticker === 'B'), 'B must be retained at rank 11 under a 16 exit rank');
});

test('an incumbent past the exit rank and past min hold is dropped', () => {
  const today = mkRanked(Array.from({ length: 30 }, (_, i) => `T${i}`).concat(['B']));
  const previous = [{ ticker: 'B', rank: 2, heldSessions: 40 }];
  const { board } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 10 });
  assert.ok(!board.some((r) => r.ticker === 'B'));
});

test('a stopped-out incumbent leaves immediately regardless of rank', () => {
  const today = mkRanked(['B', 'A', 'C']);
  today[0].stoppedOut = true;
  const previous = [{ ticker: 'B', rank: 1, heldSessions: 1 }];
  const { board } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 3 });
  assert.ok(!board.some((r) => r.ticker === 'B'), 'stop-out must override hysteresis');
});

test('a gated incumbent leaves immediately', () => {
  const today = mkRanked(['B', 'A', 'C']);
  today[0].gate = 'delisted';
  const previous = [{ ticker: 'B', rank: 1, heldSessions: 99 }];
  const { board } = applyHysteresis(today, previous, { exitRank: 25, minHold: 63, topN: 3 });
  assert.ok(!board.some((r) => r.ticker === 'B'));
});

test('movement badge is positive when a name moves up', () => {
  const today = mkRanked(['B', 'A']);
  const previous = [{ ticker: 'B', rank: 2, heldSessions: 3 }, { ticker: 'A', rank: 1, heldSessions: 3 }];
  const { board } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 2 });
  const b = board.find((r) => r.ticker === 'B');
  assert.equal(b.rank, 1);
  assert.equal(b.movement, 1, 'moved from 2 to 1 => +1');
});

// ── trade parameters ───────────────────────────────────────────────────────

test('ultra short publishes a stop below the entry zone', () => {
  const row = { bars: makeBars({ n: 200, seed: 11 }) };
  const t = tradeParameters(row, 'ultra_short');
  assert.ok(t.stop < t.entry.low, 'stop must sit below the entry zone');
  assert.ok(t.targets.conservative < t.targets.base);
  assert.ok(t.targets.base < t.targets.bull);
  assert.equal(t.maxHoldSessions, 5);
});

test('long and ultra-long publish NO price stop, only thesis invalidation', () => {
  // METHODOLOGY §5.4 — a price stop on a 1-2 year thesis converts it into a coin
  // flip on volatility. This is a deliberate divergence from the original spec.
  const row = { bars: makeBars({ n: 300, seed: 12 }), factors: { _growthRate: 0.12, _evEbit: 18 } };
  for (const h of ['long_term', 'ultra_long']) {
    const t = tradeParameters(row, h);
    assert.equal(t.stop, null, `${h} must not publish a price stop`);
    assert.ok(Array.isArray(t.thesisInvalidation) && t.thesisInvalidation.length > 0);
  }
});

test('trade parameters scale with the stock own volatility', () => {
  const calm = { bars: makeBars({ n: 200, vol: 0.006, seed: 21 }) };
  const wild = { bars: makeBars({ n: 200, vol: 0.05, seed: 21 }) };
  const c = tradeParameters(calm, 'ultra_short');
  const w = tradeParameters(wild, 'ultra_short');
  const cWidth = (c.entry.high - c.entry.low) / c.entry.low;
  const wWidth = (w.entry.high - w.entry.low) / w.entry.low;
  assert.ok(wWidth > cWidth * 2, 'a volatile name must get a wider zone');
});

test('KRW prices round to whole won, USD to cents', () => {
  const krw = { bars: makeBars({ n: 100, start: 74000, seed: 4 }).map((b) => ({ ...b, open: b.open * 1000, high: b.high * 1000, low: b.low * 1000, close: b.close * 1000 })) };
  const t = tradeParameters(krw, 'ultra_short');
  assert.equal(t.stop, Math.round(t.stop), 'KRW levels must be integers');
});

test('riskGauge spreads across quintiles', () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ bars: makeBars({ n: 80, vol: 0.004 + i * 0.004, seed: 30 + i }) }));
  const g = riskGauge(rows);
  assert.ok(new Set(g).size >= 4, `expected spread across quintiles, got ${[...new Set(g)]}`);
  assert.ok(Math.min(...g) >= 1 && Math.max(...g) <= 5);
});

// ── regressions for the doc↔code mismatches found during content review ─────

test('mid-term stop takes the tighter of the ATR and EMA50 legs', () => {
  // METHODOLOGY §4.4 always specified both; only the ATR leg was implemented.
  // A name well above its 50-day should stop out on the EMA50 leg, because the
  // thesis ("this trend is intact") is already dead by the time price gets
  // there — a wider ATR stop just pays more to learn the same thing.
  const bars = makeBars({ n: 300, seed: 77, drift: 0.0018, vol: 0.008 });
  const t = tradeParameters({ bars }, 'mid_term');
  const close = bars[bars.length - 1].close;
  const a = atr(bars, 14);
  const e50 = ema(bars.map((b) => b.close), 50);

  assert.ok(Number.isFinite(e50));
  const expected = Math.min(close - 2.5 * a, e50 - 0.5 * a);
  assert.ok(Math.abs(t.stop - expected) < 0.02, `stop ${t.stop} vs expected ${expected}`);
  assert.ok(t.stop <= close - 2.5 * a + 0.02, 'must never be looser than the ATR leg');
});

test('mid-term stop falls back to the ATR leg without enough history for an EMA50', () => {
  const bars = makeBars({ n: 80, seed: 78 });
  const t = tradeParameters({ bars }, 'mid_term');
  const close = bars[bars.length - 1].close;
  const a = atr(bars, 14);
  assert.ok(Math.abs(t.stop - (close - 2.5 * a)) < 0.02);
});

test('ROIC averages invested capital over four quarters, not the closing balance', () => {
  // A mid-year capital raise inflates the closing balance sheet and depresses
  // ROIC against a full year of NOPAT. Averaging the period the flow was earned
  // over is the standard treatment and is what METHODOLOGY §5.3 specifies.
  const base = makeQuarters({ n: 8 });
  const steady = base.map((q) => ({ ...q, totalEquity: 1000, longTermDebt: 0, cash: 0, operatingIncome: 100, pretaxIncome: 100, incomeTaxExpense: 21 }));
  // Same company, but it doubled its equity in the final quarter.
  const raised = steady.map((q, i) => (i === steady.length - 1 ? { ...q, totalEquity: 2000 } : q));

  const rSteady = roic(steady, steady.at(-1));
  const rRaised = roic(raised, raised.at(-1));
  assert.ok(Number.isFinite(rSteady) && Number.isFinite(rRaised));
  // Averaging must leave the raise only partly reflected, so ROIC sits between
  // the un-raised value and the naive closing-balance value.
  const naive = (400 * 0.79) / 2000;
  assert.ok(rRaised > naive, `averaged ${rRaised} should exceed naive closing-balance ${naive}`);
  assert.ok(rRaised < rSteady, 'a capital raise must still reduce ROIC');
});

test('averageInvestedCapital falls back to the balance sheet when quarters lack balance fields', () => {
  const q = makeQuarters({ n: 4 }).map(({ totalEquity, longTermDebt, ...rest }) => rest);
  const ic = averageInvestedCapital(q, { totalEquity: 500, longTermDebt: 100, cash: 50 });
  assert.equal(ic, 550);
});

// ── day-over-day state: only reachable on the second run and later ─────────

test('a cooldown carrier row is not treated as an incumbent', () => {
  // A stopped-out name is carried in `previous` with rank null so its cooldown
  // counter survives while it is off the board. Pass 1 used to treat that
  // carrier as an incumbent and hand it a seat, which made METHODOLOGY §7's
  // five-session cooldown a no-op — pass 2 checked the cooldown but the name
  // never reached pass 2.
  const today = mkRanked(['B', 'A', 'C', 'D']);
  const previous = [
    { ticker: 'A', rank: 1, heldSessions: 4, cooldownUntilSession: 0 },
    { ticker: 'B', rank: null, heldSessions: 0, cooldownUntilSession: 5 },
  ];
  const { board } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 4 });
  assert.ok(!board.some((r) => r.ticker === 'B'), 'B is serving a cooldown and must stay off');
  assert.ok(board.some((r) => r.ticker === 'A'));
});

test('a name returning from cooldown counts as NEW, not as a retained incumbent', () => {
  const today = mkRanked(['B', 'A']);
  const previous = [
    { ticker: 'A', rank: 1, heldSessions: 9, cooldownUntilSession: 0 },
    { ticker: 'B', rank: null, heldSessions: 0, cooldownUntilSession: 0 },
  ];
  const { board } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 2 });
  const b = board.find((r) => r.ticker === 'B');
  assert.equal(b.movement, 'NEW', 'never published means NEW, not a rank delta');
  assert.equal(b.heldSessions, 1, 'held count restarts');
});

test('turnover ignores carrier rows', () => {
  const today = mkRanked(['A', 'B']);
  const previous = [
    { ticker: 'A', rank: 1, heldSessions: 2 },
    { ticker: 'B', rank: null, cooldownUntilSession: 0 },
  ];
  const { turnover } = applyHysteresis(today, previous, { exitRank: 12, minHold: 1, topN: 2 });
  // B was never on the published board, so its arrival is real turnover.
  assert.ok(Math.abs(turnover - 0.5) < 1e-9, `expected 0.5, got ${turnover}`);
});

// ── sector classification and the missing-sector regression ────────────────

test('sectorForSic maps representative codes to the SPDR sector names', () => {
  // Ranges are evaluated in order, so each of these also pins the precedence of
  // a narrow override over the broad range it sits inside.
  const cases = [
    [3674, 'Information Technology'],  // NVIDIA — semiconductors
    [3571, 'Information Technology'],  // Apple — electronic computers
    [7372, 'Information Technology'],  // Microsoft — prepackaged software
    [2834, 'Health Care'],             // pharmaceutical preparations, inside 2800-2899 chemicals
    [8731, 'Health Care'],             // commercial biological research, inside 8700s services
    [3826, 'Health Care'],             // lab analytical instruments, inside the 3800s
    [6022, 'Financials'],              // state commercial banks
    [6798, 'Real Estate'],             // REIT, an island inside the 6700s
    [6512, 'Real Estate'],             // operators of apartment buildings
    [1311, 'Energy'],                  // crude petroleum and natural gas
    [4610, 'Energy'],                  // pipelines, carved out of transportation
    [4911, 'Utilities'],               // electric services
    [4953, 'Industrials'],             // refuse systems — waste is NOT a utility
    [3711, 'Consumer Discretionary'],  // motor vehicles — GICS, not SIC, wins
    [3721, 'Industrials'],             // aircraft
    [5812, 'Consumer Discretionary'],  // eating places
    [5411, 'Consumer Staples'],        // grocery stores, carved out of retail
    [5912, 'Consumer Staples'],        // drug stores, likewise
    [2011, 'Consumer Staples'],        // meat packing
    [4813, 'Communication Services'],  // telephone communications
    [7812, 'Communication Services'],  // motion picture production
    [2711, 'Communication Services'],  // newspapers
    [1531, 'Consumer Discretionary'],  // operative builders — homebuilders
    [3312, 'Materials'],               // steel works
  ];
  for (const [sic, want] of cases) {
    assert.equal(sectorForSic(sic), want, `SIC ${sic}`);
  }
});

test('sectorForSic returns null rather than a catch-all bucket', () => {
  // 9995 is SEC's own "non-classifiable establishments". Returning a sector
  // name here would be an invented fact, and every count-based rule downstream
  // would treat the invention as a real peer group.
  assert.equal(sectorForSic(9995), null);
  assert.equal(sectorForSic(null), null);
  assert.equal(sectorForSic(undefined), null);
  assert.equal(sectorForSic(0), null);
  assert.equal(sectorForSic('not a number'), null);
  // Strings are accepted, because SEC returns the code as a string.
  assert.equal(sectorForSic('3674'), 'Information Technology');
});

test('every mapped sector is one of the eleven composite buckets', () => {
  // A typo in the mapping table would produce a sector name with no composite,
  // so sectorStrength would be null for those names and nobody would notice.
  for (let sic = 1; sic <= 9999; sic++) {
    const s = sectorForSic(sic);
    if (s !== null) assert.ok(SECTORS.includes(s), `SIC ${sic} produced unknown sector "${s}"`);
  }
});

test('REGRESSION: a universe with no sector data still fills the whole board', () => {
  // The bug this pins: US rows shipped with sector null, everything downstream
  // coerced null to the string 'Unknown', the cap saw one enormous sector and
  // allowed four of it — so every US board published 4 names instead of 10,
  // silently, in production. Uncorrelated series so only the sector rule is
  // under test.
  const ranked = Array.from({ length: 20 }, (_, i) => ({
    ticker: `N${i}`, name: `N${i}`, sector: null,
    score: 10 - i * 0.1, bars: makeBars({ n: 120, seed: 900 + i * 7 }),
  }));
  const { selected } = applyDiversification(ranked, { topN: 10, maxPerSector: 3 });
  assert.equal(selected.length, 10, 'an unclassified universe must not be capped by the sector rule');

  // Undefined and empty string are the same absence, and must behave the same.
  for (const missing of [undefined, '']) {
    const rows = ranked.map((r) => ({ ...r, sector: missing }));
    assert.equal(applyDiversification(rows, { topN: 10, maxPerSector: 3 }).selected.length, 10);
  }
});

test('the sector cap still bites once sectors are known', () => {
  // The complement of the regression above: exempting nulls must not have
  // disabled the rule for rows that do carry a sector.
  const ranked = Array.from({ length: 30 }, (_, i) => ({
    ticker: `K${i}`, name: `K${i}`, sector: i < 12 ? 'Information Technology' : `Sec${i}`,
    score: 10 - i * 0.1, bars: makeBars({ n: 120, seed: 400 + i * 3 }),
  }));
  const { selected, displaced } = applyDiversification(ranked, { topN: 10, maxPerSector: 3 });
  const tech = selected.filter((r) => r.sector === 'Information Technology').length;
  assert.ok(tech <= 4, `sector cap must still apply to known sectors, got ${tech}`);
  assert.ok(displaced.some((d) => d.displacedBy === 'sector_cap'));
});

test('mixing classified and unclassified names caps only the classified ones', () => {
  const ranked = [
    ...Array.from({ length: 8 }, (_, i) => ({
      ticker: `T${i}`, name: `T${i}`, sector: 'Information Technology',
      score: 10 - i * 0.1, bars: makeBars({ n: 120, seed: 700 + i * 5 }),
    })),
    ...Array.from({ length: 10 }, (_, i) => ({
      ticker: `U${i}`, name: `U${i}`, sector: null,
      score: 5 - i * 0.1, bars: makeBars({ n: 120, seed: 800 + i * 5 }),
    })),
  ];
  const { selected } = applyDiversification(ranked, { topN: 10, maxPerSector: 3 });
  assert.ok(selected.filter((r) => r.sector === 'Information Technology').length <= 4);
  assert.equal(selected.length, 10, 'unclassified names should fill the remaining seats');
});

// ── performance audit arithmetic ───────────────────────────────────────────

const closedTrade = (exitDate, netReturnPct) => ({
  status: 'closed', exitDate, netReturnPct, benchmarkReturnPct: 0,
});

test('maxDrawdown does not depend on how many trades have been published', () => {
  // The bug: sizing was `1 / max(1, trades.length / 20)`, so one slot was 100%
  // of the book at 20 trades and 5.5% at 364. The published drawdown therefore
  // improved as the ledger grew, with no change in the strategy — on the one
  // page whose whole purpose is honest accounting.
  //
  // Same drawdown shape, three ledger sizes. The answer must not move.
  const shape = [10, -20, -20, 15];
  const sizes = [20, 60, 400];
  const results = sizes.map((n) => {
    const trades = [];
    for (let i = 0; i < n; i++) {
      // Pad with flat trades so only the count changes, not the path.
      trades.push(closedTrade(`2026-01-${String((i % 28) + 1).padStart(2, '0')}`, 0));
    }
    shape.forEach((r, k) => { trades.push(closedTrade(`2026-02-${String(k + 1).padStart(2, '0')}`, r)); });
    return maxDrawdown(trades);
  });
  for (const r of results) {
    assert.ok(Math.abs(r - results[0]) < 1e-9,
      `drawdown moved with ledger size: ${JSON.stringify(results)}`);
  }
  assert.ok(results[0] > 0, 'the fixture should actually draw down');
});

test('maxDrawdown agrees with the equity curve drawn beneath it', () => {
  // Two numbers describing one portfolio must come from one sizing. They were
  // computed with different ones.
  const trades = [
    closedTrade('2026-03-02', 12),
    closedTrade('2026-03-03', -18),
    closedTrade('2026-03-04', -25),
    closedTrade('2026-03-05', 6),
    closedTrade('2026-03-06', -9),
  ];
  const curve = buildEquityCurve(trades);
  let peak = -Infinity;
  let ddFromCurve = 0;
  for (const pt of curve) {
    peak = Math.max(peak, pt.value);
    ddFromCurve = Math.max(ddFromCurve, (peak - pt.value) / peak);
  }
  // buildEquityCurve rounds each published point to 2dp, so allow that much.
  assert.ok(Math.abs(maxDrawdown(trades) - ddFromCurve * 100) < 0.05,
    `curve says ${(ddFromCurve * 100).toFixed(3)}%, summary says ${maxDrawdown(trades).toFixed(3)}%`);
  assert.equal(BOOK_SLOTS, 20);
});

test('maxDrawdown ignores trades with no return rather than scoring them flat', () => {
  const withNulls = [
    closedTrade('2026-04-01', -30),
    { status: 'closed', exitDate: '2026-04-02', netReturnPct: null },
    closedTrade('2026-04-03', 5),
  ];
  const without = [closedTrade('2026-04-01', -30), closedTrade('2026-04-03', 5)];
  assert.equal(maxDrawdown(withNulls), maxDrawdown(without));
});

// ── honest empty boards ────────────────────────────────────────────────────

test('a KR board that can never fill says so, instead of promising it will', () => {
  // mid_term weights fundamentalMomentum and earningsDrift; long_term is
  // fundamental end to end. Korea has no keyless statement source — refresh-kr
  // stores a market-cap snapshot and nothing else — so neither board can reach
  // the completeness floor no matter how long the pipeline runs.
  //
  // The generic fallback told the reader "this resolves as the data store
  // fills." On a finance page, in two languages, that is a promise the pipeline
  // cannot keep.
  for (const horizon of ['mid_term', 'long_term', 'ultra_long']) {
    assert.equal(structurallyUnavailable('KR', horizon, false), true, `KR/${horizon}`);
  }
  // Ultra-short is pure price and volume: Korea can and does fill it.
  assert.equal(structurallyUnavailable('KR', 'ultra_short', false), false);
  // The US has SEC XBRL, so statements are present and nothing is structural.
  for (const horizon of ['ultra_short', 'mid_term', 'long_term', 'ultra_long']) {
    assert.equal(structurallyUnavailable('US', horizon, true), false, `US/${horizon}`);
  }
});

test('configuring DART must retire the "never" message, not keep repeating it', () => {
  // The check is keyed on measured statement availability, not on the string
  // 'KR'. The day Korea has statements, an empty board is a cold start again
  // and must be explained as one -- otherwise the site would go on explaining
  // an absence that had already been fixed.
  for (const horizon of ['mid_term', 'long_term', 'ultra_long']) {
    assert.equal(structurallyUnavailable('KR', horizon, true), false,
      `KR/${horizon} must stop reporting a structural limit once statements exist`);
  }
});

test('the counting behind structurallyUnavailable matches the published weights', () => {
  // Guard against the check silently going stale if weights are re-tuned: if a
  // horizon ever drops below the floor on non-statement factors alone, that is
  // a real change in what Korea can publish and must be a deliberate one.
  const reachable = (h) =>
    Object.keys(WEIGHTS[h]).filter((k) => !STATEMENT_FACTORS.has(k)).length;
  assert.equal(reachable('ultra_short'), 5);   // all price/volume/news
  assert.equal(reachable('mid_term'), 3);      // trend, money flow, sector strength
  assert.equal(reachable('long_term'), 0);
  assert.equal(reachable('ultra_long'), 0);
  assert.ok(reachable('ultra_short') >= MIN_PRESENT.ultra_short);
  assert.ok(reachable('mid_term') < MIN_PRESENT.mid_term);
});

test('gas transmission is Energy; gas distribution and electric stay Utilities', () => {
  // Williams, Kinder Morgan, Targa and ONEOK all file under SIC 4922/4923.
  // SIC files gas transmission in the 49xx utility block; GICS calls midstream
  // Energy. Leaving them in Utilities charged a pipeline operator against the
  // utility allowance in the sector cap and compared its margins against Duke
  // Energy's under sector-neutral scoring. It also contradicted the mapping's
  // own SIC 4600-4699 (pipelines) → Energy rule for the same activity.
  assert.equal(sectorForSic(4922), 'Energy');   // WMB, KMI, TRGP
  assert.equal(sectorForSic(4923), 'Energy');   // OKE
  assert.equal(sectorForSic(4610), 'Energy');   // the pipelines rule it now agrees with

  // The boundaries either side must not move.
  assert.equal(sectorForSic(4911), 'Utilities'); // electric services
  assert.equal(sectorForSic(4921), 'Utilities');
  assert.equal(sectorForSic(4924), 'Utilities'); // local gas distribution — a real LDC
  assert.equal(sectorForSic(4931), 'Utilities');
  assert.equal(sectorForSic(4932), 'Utilities');
  assert.equal(sectorForSic(4941), 'Utilities'); // water
  assert.equal(sectorForSic(4953), 'Industrials'); // refuse systems
});
