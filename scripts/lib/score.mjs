/**
 * Cross-sectional scoring engine. METHODOLOGY §2–§8.
 *
 * Takes the whole universe for one market on one day, normalizes every factor
 * across it, applies weights and gates, then hysteresis and diversification,
 * and emits a publishable board.
 */

import { correlation, isNum, normalizeBySector, normalizeFactor, toDisplayScore, weightedScore } from './stats.mjs';
import { atr, ema, returnSeries, sma } from './indicators.mjs';

export const WEIGHTS = {
  ultra_short: {
    relativeVolume: 0.30,
    gapQuality: 0.20,
    newsSentiment: 0.20,
    volatilityExpansion: 0.15,
    trendPosition: 0.15,
  },
  mid_term: {
    trendAlignment: 0.25,
    fundamentalMomentum: 0.22,
    earningsDrift: 0.20,
    moneyFlow: 0.18,
    sectorStrength: 0.15,
  },
  long_term: {
    growthQuality: 0.26,
    capitalEfficiency: 0.24,
    cashGeneration: 0.22,
    valuation: 0.18,
    fScore: 0.10,
  },
  ultra_long: {
    moatStrength: 0.28,
    cashFlowDurability: 0.24,
    reinvestmentRunway: 0.20,
    balanceSheetStrength: 0.16,
    shareholderYield: 0.12,
  },
};

export const MIN_PRESENT = {
  ultra_short: 4,
  mid_term: 4,
  long_term: 4,
  ultra_long: 4,
};

/** Which factors are log-transformed and which are sector-neutral. §2. */
const FACTOR_OPTS = {
  relativeVolume: { log: true },
  volatilityExpansion: { log: true },
  growthQuality: { sectorNeutral: true },
  capitalEfficiency: { sectorNeutral: true },
  cashGeneration: { sectorNeutral: true },
  valuation: { sectorNeutral: true },
  fScore: { sectorNeutral: true },
  moatStrength: { sectorNeutral: true },
  cashFlowDurability: { sectorNeutral: true },
  reinvestmentRunway: { sectorNeutral: true },
  balanceSheetStrength: { sectorNeutral: true },
  shareholderYield: { sectorNeutral: true },
};

/**
 * Market regime multiplier. METHODOLOGY §3.3.
 *
 * Scales ultra-short and mid-term scores down when the tape is hostile. It does
 * NOT reorder the board — it is a size signal, and the site surfaces the state
 * so a reader can see when a list is being published into a downtrend.
 */
export function regimeMultiplier({ benchmarkBars, universeBars }) {
  let indexOk = null;
  if (benchmarkBars && benchmarkBars.length >= 200) {
    const c = benchmarkBars.map((b) => b.close);
    const ma = sma(c, 200);
    if (isNum(ma)) indexOk = c[c.length - 1] > ma;
  }

  let breadth = null;
  if (universeBars && universeBars.length >= 20) {
    let above = 0;
    let counted = 0;
    for (const bars of universeBars) {
      if (!bars || bars.length < 200) continue;
      const c = bars.map((b) => b.close);
      const ma = sma(c, 200);
      if (!isNum(ma)) continue;
      counted++;
      if (c[c.length - 1] > ma) above++;
    }
    if (counted >= 20) breadth = above / counted;
  }

  if (indexOk === null || breadth === null) {
    return { multiplier: 1, state: 'unknown', indexAboveMA200: indexOk, breadth };
  }

  let multiplier;
  let state;
  if (indexOk && breadth >= 0.5) {
    multiplier = 1.0;
    state = 'risk_on';
  } else if (indexOk && breadth < 0.5) {
    multiplier = 0.85;
    state = 'narrowing';
  } else if (!indexOk && breadth >= 0.4) {
    multiplier = 0.7;
    state = 'caution';
  } else {
    multiplier = 0.5;
    state = 'risk_off';
  }
  return { multiplier, state, indexAboveMA200: indexOk, breadth };
}

/**
 * Score one horizon across a universe.
 *
 * @param {Array} rows  [{ ticker, sector, factors: {...}, bars, ... }]
 * @param {string} horizon
 * @param {{ multiplier: number, state: string }} regime
 */
export function scoreUniverse(rows, horizon, regime = { multiplier: 1, state: 'unknown' }) {
  const weights = WEIGHTS[horizon];
  const keys = Object.keys(weights);
  const sectors = rows.map((r) => r.sector ?? 'Unknown');

  // Normalize each factor across the whole universe (or within sector).
  const zByFactor = {};
  for (const k of keys) {
    const raw = rows.map((r) => (isNum(r.factors?.[k]) ? r.factors[k] : null));
    const opt = FACTOR_OPTS[k] ?? {};
    zByFactor[k] = opt.sectorNeutral
      ? normalizeBySector(raw, sectors, { log: opt.log ?? false })
      : normalizeFactor(raw, { log: opt.log ?? false });
  }

  const applyRegime = horizon === 'ultra_short' || horizon === 'mid_term';

  const scored = rows.map((r, i) => {
    const factorZ = {};
    for (const k of keys) factorZ[k] = zByFactor[k][i];

    const { score, completeness, used } = weightedScore(factorZ, weights, MIN_PRESENT[horizon]);
    if (score === null) {
      return { ...r, score: null, rawScore: null, factorZ, completeness, gate: 'insufficient_data' };
    }

    let s = score;
    if (horizon === 'ultra_short' && isNum(r.factors?._crowding)) s -= r.factors._crowding;
    if (applyRegime) s *= regime.multiplier;

    return {
      ...r,
      rawScore: score,
      score: s,
      displayScore: toDisplayScore(s),
      factorZ,
      completeness,
      factorsUsed: used,
      gate: r.gate ?? null,
    };
  });

  return scored
    .filter((r) => isNum(r.score) && !r.gate)
    .sort((a, b) => b.score - a.score)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/**
 * Diversification constraints. METHODOLOGY §8.
 *
 * Exposed as a stateful checker rather than a one-shot filter, because the
 * constraints have to be enforced DURING board assembly, not before it.
 *
 * The subtle failure this design exists to prevent: if diversification runs
 * first and hysteresis runs second over the full ranked list, hysteresis
 * happily refills seats with names diversification had just rejected, and the
 * sector cap silently does nothing. Handing the checker to the assembler
 * instead means every seat — incumbent or challenger — is tested against what
 * is already on the board.
 */
export function makeDiversificationChecker(ranked, {
  maxPerSector = 3, maxCorrelation = 0.85, maxPerCluster = 4,
} = {}) {
  const sectorCount = new Map();
  const clusterCount = new Map();
  const retSeries = new Map();
  const selected = [];
  const rejections = [];

  const seriesFor = (r) => {
    if (!retSeries.has(r.ticker)) retSeries.set(r.ticker, r.bars ? returnSeries(r.bars, 60) : []);
    return retSeries.get(r.ticker);
  };

  // With few distinct sectors in the universe, a cap of 3 would make a top 10
  // unfillable, so it relaxes by one.
  const distinctSectors = new Set(ranked.slice(0, 40).map((r) => r.sector ?? 'Unknown')).size;
  const sectorCap = distinctSectors < 6 ? maxPerSector + 1 : maxPerSector;

  function reasonToReject(r) {
    const sec = r.sector ?? 'Unknown';
    if ((sectorCount.get(sec) ?? 0) >= sectorCap) return 'sector_cap';

    const cluster = r.catalystCluster ?? null;
    if (cluster && (clusterCount.get(cluster) ?? 0) >= maxPerCluster) return 'catalyst_cluster_cap';

    // At most 2 names in the book above the correlation threshold with each
    // other. Ten correlated semis is one position, not ten, and presenting it
    // as a diversified list would be misleading.
    const mine = seriesFor(r);
    if (mine.length >= 10) {
      let highCorr = 0;
      for (const s of selected) {
        const c = correlation(mine, seriesFor(s));
        if (isNum(c) && c > maxCorrelation) highCorr++;
      }
      if (highCorr >= 2) return 'correlation_cap';
    }
    return null;
  }

  return {
    sectorCap,
    /** Test-and-commit. Returns true when the row was accepted onto the board. */
    tryAdd(r) {
      const reason = reasonToReject(r);
      if (reason) {
        rejections.push({ ...r, displacedBy: reason });
        return false;
      }
      selected.push(r);
      const sec = r.sector ?? 'Unknown';
      sectorCount.set(sec, (sectorCount.get(sec) ?? 0) + 1);
      if (r.catalystCluster) clusterCount.set(r.catalystCluster, (clusterCount.get(r.catalystCluster) ?? 0) + 1);
      return true;
    },
    rejections: () => rejections,
    selected: () => selected,
  };
}

/**
 * Convenience wrapper: greedily fill a top-N under the constraints.
 * Used by tests and by any caller that does not need hysteresis.
 */
export function applyDiversification(ranked, opts = {}) {
  const { topN = 10 } = opts;
  const checker = makeDiversificationChecker(ranked, opts);
  const selected = [];
  const displaced = [];
  for (const r of ranked) {
    if (selected.length >= topN) {
      displaced.push({ ...r, displacedBy: null });
      continue;
    }
    if (checker.tryAdd(r)) selected.push(r);
  }
  return { selected, displaced: [...checker.rejections(), ...displaced].slice(0, 10) };
}

/**
 * Rank hysteresis. METHODOLOGY §7.
 *
 * The original rule ("must fall below rank 15 to drop off") is applied here with
 * per-horizon thresholds, because uniform hysteresis is wrong at both ends: a
 * 1–5 day board is supposed to turn over fast, and a 5–10 year board rotating on
 * a 0.1-point wobble is noise dressed as research.
 *
 * @param {Array} candidates  today's ranked list (after diversification input)
 * @param {Array} previous    yesterday's published board
 * @param {{ exitRank: number, minHold: number, topN?: number }} opts
 */
export function applyHysteresis(candidates, previous, { exitRank, minHold, topN = 10, marginK = 0.15, checker = null }) {
  // A no-op checker keeps the unconstrained path (and the unit tests) simple.
  const gate = checker ?? { tryAdd: () => true, rejections: () => [] };

  if (!previous || previous.length === 0) {
    const board = [];
    for (const r of candidates) {
      if (board.length >= topN) break;
      if (r.gate || r.stoppedOut) continue;
      if (!gate.tryAdd(r)) continue;
      board.push({ ...r, heldSessions: 1, movement: 'NEW' });
    }
    return { board: board.map((r, i) => ({ ...r, rank: i + 1 })), turnover: 1, rejections: gate.rejections() };
  }

  const byTicker = new Map(candidates.map((r) => [r.ticker, r]));
  const prevByTicker = new Map(previous.map((r) => [r.ticker, r]));

  const scores = candidates.map((r) => r.score).filter(isNum);
  const mean = scores.reduce((a, b) => a + b, 0) / (scores.length || 1);
  const sd = Math.sqrt(scores.reduce((a, x) => a + (x - mean) ** 2, 0) / Math.max(1, scores.length - 1));
  const margin = marginK * (isNum(sd) ? sd : 0);

  const board = [];
  const usedTickers = new Set();

  // Pass 1 — incumbents that still qualify keep their seat.
  for (const p of previous) {
    // `previous` carries two kinds of row: names that were actually ON the
    // board (rank set), and cooldown carriers for names that stopped out and
    // are serving their sit-out (rank null). Only the former are incumbents.
    // Treating a carrier as an incumbent was how a stopped-out name walked
    // straight back onto the board the next session — pass 2 checked the
    // cooldown, pass 1 did not, so the name never reached pass 2.
    if (p.rank == null) continue;
    if ((p.cooldownUntilSession ?? 0) > 0) continue;

    const cur = byTicker.get(p.ticker);
    const held = (p.heldSessions ?? 1) + 1;

    // Hard gates and stop-outs override hysteresis entirely. §7.
    if (!cur) {
      continue; // fell out of the universe (delisted, gated, or no data today)
    }
    if (cur.gate || cur.stoppedOut) continue;
    if (cur.rank > exitRank && held > minHold) continue;

    // Incumbency does not exempt a name from the diversification caps — five
    // retained semiconductors is still one bet.
    if (!gate.tryAdd(cur)) continue;

    board.push({ ...cur, heldSessions: held, previousRank: p.rank });
    usedTickers.add(cur.ticker);
    if (board.length >= topN) break;
  }

  // Pass 2 — fill remaining seats with the best challengers.
  for (const c of candidates) {
    if (board.length >= topN) break;
    if (usedTickers.has(c.ticker)) continue;

    // A name that pass 1 ejected for a gate or a stop-out must not walk straight
    // back in through the challenger door in the same run. METHODOLOGY §7: a
    // stopped-out pick leaves, records the loss, and serves a cooldown.
    if (c.gate || c.stoppedOut) continue;
    const prevEntry = prevByTicker.get(c.ticker);
    if (prevEntry?.cooldownUntilSession > 0) continue;

    // A challenger must beat the weakest incumbent by more than the margin.
    const weakest = board.length >= topN ? board[board.length - 1] : null;
    if (weakest && c.score <= weakest.score + margin) continue;

    if (!gate.tryAdd(c)) continue;

    const prev = prevByTicker.get(c.ticker);
    const wasPublished = prev && prev.rank != null;
    board.push({
      ...c,
      heldSessions: wasPublished ? (prev.heldSessions ?? 1) + 1 : 1,
      previousRank: wasPublished ? prev.rank : null,
    });
    usedTickers.add(c.ticker);
  }

  board.sort((a, b) => b.score - a.score);
  const final = board.slice(0, topN).map((r, i) => {
    const rank = i + 1;
    let movement;
    if (r.previousRank == null) movement = 'NEW';
    else if (r.previousRank === rank) movement = 0;
    else movement = r.previousRank - rank; // positive = moved up
    return { ...r, rank, movement };
  });

  // Carriers were never published, so a name returning from cooldown is
  // correctly counted as new turnover rather than as a retained incumbent.
  const prevSet = new Set(previous.filter((r) => r.rank != null).map((r) => r.ticker));
  const changed = final.filter((r) => !prevSet.has(r.ticker)).length;
  return {
    board: final,
    turnover: final.length ? changed / final.length : 0,
    rejections: gate.rejections(),
  };
}

/**
 * Entry / stop / target derivation. METHODOLOGY §3.4, §4.4, §5.4, §6.4.
 *
 * ATR-based rather than percentage-based, because a fixed 5% stop is loose for
 * a utility and suicidally tight for a biotech. Long-horizon rows deliberately
 * carry NO price stop — see METHODOLOGY §5.4 for why publishing one on a 1–2
 * year thesis is actively harmful.
 */
export function tradeParameters(row, horizon) {
  const bars = row.bars;
  if (!bars || bars.length < 20) return null;
  const last = bars[bars.length - 1];
  const a = atr(bars, 14);
  if (!isNum(a) || a <= 0) return null;
  const close = last.close;

  const band = (loMult, hiMult) => ({
    low: round(close - loMult * a, close),
    high: round(close + hiMult * a, close),
  });

  switch (horizon) {
    case 'ultra_short':
      return {
        entry: band(0.25, 0.40),
        stop: round(Math.min(close - 1.5 * a, last.low - 0.1 * a), close),
        targets: {
          conservative: round(close + 1.0 * a, close),
          base: round(close + 1.8 * a, close),
          bull: round(close + 3.0 * a, close),
        },
        maxHoldSessions: 5,
        atr: a,
      };
    case 'mid_term':
      return {
        // The stop is the TIGHTER of a volatility stop and a trend stop.
        //
        // METHODOLOGY §4.4 has always specified both, but only the ATR leg was
        // implemented. The EMA50 leg matters: a mid-term thesis is "this trend
        // is intact", so once price closes decisively under the 50-day the
        // thesis is already wrong and a wider ATR stop just pays more to learn
        // it. Taking the min keeps whichever invalidates first.
        entry: band(0.6, 0.3),
        stop: round(midTermStop(row, close, a), close),
        targets: {
          conservative: round(close + 2.5 * a, close),
          base: round(close + 4.5 * a, close),
          bull: round(close + 7.0 * a, close),
        },
        maxHoldSessions: 45,
        forcedExit: 'close_below_ema50_3_sessions',
        atr: a,
      };
    case 'long_term':
      return {
        entry: band(1.0, 0.5),
        // No price stop, deliberately. METHODOLOGY §5.4: a 20% drawdown is an
        // ordinary event inside a two-year holding period, and a price stop
        // converts a fundamental thesis into a coin flip on volatility. The
        // honest analogue at this horizon is a thesis-invalidation trigger.
        stop: null,
        thesisInvalidation: [
          'Return on invested capital declines for two consecutive quarters',
          'Free cash flow turns negative on a trailing-twelve-month basis',
          'Revenue growth falls below zero year-over-year for two quarters',
        ],
        targets: fundamentalTargetBand(row, close),
        targetBasis: 'fair_value_band',
        maxHoldSessions: 504,
        atr: a,
      };
    case 'ultra_long':
      return {
        entry: band(1.5, 0.5),
        stop: null,
        thesisInvalidation: [
          'Return on invested capital declines for three consecutive fiscal years',
          'Gross margin falls below its 10-year 20th percentile',
          'Net debt to EBITDA rises above 3.5x',
          'Share count grows more than 2% per year for three consecutive years',
        ],
        targets: compoundingBand(row, close),
        targetBasis: 'compounding_scenarios',
        maxHoldSessions: 2520,
        atr: a,
      };
    default:
      return null;
  }
}

/**
 * Mid-term stop: `min(close - 2.5*ATR, EMA50 - 0.5*ATR)`. METHODOLOGY §4.4.
 * Falls back to the ATR leg alone when there is not enough history for an EMA50
 * (the EMA needs 3x its period before it is a real EMA rather than a seed SMA).
 */
function midTermStop(row, close, a) {
  const atrStop = close - 2.5 * a;
  const closes = (row.bars ?? []).map((b) => b.close);
  const e50 = ema(closes, 50);
  if (!isNum(e50)) return atrStop;
  return Math.min(atrStop, e50 - 0.5 * a);
}

/**
 * Fair-value band for the long-term board. METHODOLOGY §5.4.
 *
 * Deliberately NOT an ATR multiple: a 1–2 year target derived from 14-day
 * volatility is a category error. This is a simple reverse-multiple exercise —
 * where does the price go if the business grows at its realized rate and exits
 * at a conservative / current / optimistic multiple of today's EV/EBIT.
 *
 * Every assumption is published on the card so the reader can disagree with it,
 * which is the point. Falls back to a wide ATR band when fundamentals are thin.
 */
function fundamentalTargetBand(row, close) {
  const g = row?.factors?._growthRate;
  const evEbit = row?.factors?._evEbit;
  if (!isNum(g) || !isNum(evEbit) || evEbit <= 0) return null;

  const growth = Math.max(-0.1, Math.min(0.35, g));
  const twoYear = (1 + growth) ** 2;
  const mult = (m) => round(close * twoYear * m, close);
  return {
    // Multiple compression / flat / modest expansion, applied to two years of
    // realized growth. Not a forecast — a stated scenario.
    conservative: mult(0.75),
    base: mult(1.0),
    bull: mult(1.35),
  };
}

/**
 * Compounding scenario band for the ultra-long board. METHODOLOGY §6.4.
 * A 5–10 year "price target" is a fiction; what is shown instead is where the
 * price lands under stated annualized compounding assumptions over 7 years.
 */
function compoundingBand(row, close) {
  const g = row?.factors?._impliedGrowth ?? row?.factors?._growthRate;
  if (!isNum(g)) return null;
  const base = Math.max(0.02, Math.min(0.20, g));
  const years = 7;
  const at = (rate) => round(close * (1 + rate) ** years, close);
  return {
    conservative: at(Math.max(0.01, base * 0.55)),
    base: at(base),
    bull: at(Math.min(0.28, base * 1.5)),
  };
}

/** Sensible tick rounding: KRW prices are integers, USD prices are cents. */
function round(v, reference) {
  if (!isNum(v)) return null;
  if (reference >= 1000) return Math.round(v);
  return Math.round(v * 100) / 100;
}

/** Risk gauge 1–5 = quintile of ATR/close within the universe. METHODOLOGY §3.4. */
export function riskGauge(rows) {
  const vals = rows.map((r) => {
    const a = atr(r.bars ?? [], 14);
    const c = r.bars?.[r.bars.length - 1]?.close;
    return isNum(a) && isNum(c) && c > 0 ? a / c : null;
  });
  const present = vals.filter(isNum).sort((x, y) => x - y);
  if (present.length < 5) return vals.map(() => 3);
  const cuts = [0.2, 0.4, 0.6, 0.8].map((q) => present[Math.floor(q * (present.length - 1))]);
  return vals.map((v) => {
    if (!isNum(v)) return 3;
    let g = 1;
    for (const c of cuts) if (v > c) g++;
    return g;
  });
}
