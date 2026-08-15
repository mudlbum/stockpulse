/**
 * Per-stock raw factor computation. METHODOLOGY §3–§6.
 *
 * Every function here takes ONE stock and returns RAW factor values. Nothing in
 * this file is normalized — cross-sectional z-scoring happens in score.mjs,
 * because it needs the whole universe. Keeping the two apart is what makes the
 * factors unit-testable against a single fixture.
 *
 * All fundamental inputs must already be point-in-time filtered (P2): the
 * caller passes only statements whose `filed` date is <= the as-of date.
 */

import {
  atr, atrPercentile, bollinger, chaikinMoneyFlow, closePosition, distanceFromHigh,
  ema, emaSeries, medianDollarVolume, overnightGap, rangePosition, relativeVolume,
  returnOver, rsi, sma, slope,
} from './indicators.mjs';
import { clip, isNum, ramp } from './stats.mjs';

// ───────────────────────────────────────────────────────────── ultra short ──

/**
 * Tent function over the overnight gap. METHODOLOGY §3.3.
 *
 * Peaks at +4%, decays to 0 at 0% and +12%, and goes NEGATIVE above +15%.
 * The negative arm is the substantive change from the original spec's flat
 * "2%–8%" band: very large unexplained gaps are a documented reversal signal,
 * so scoring them as merely "outside the band" (i.e. 0) understates the risk.
 */
export function gapTent(g) {
  if (!isNum(g)) return null;
  if (g >= 0.15) return -(g - 0.15) * 8;
  if (g <= 0 || g >= 0.12) return 0;
  if (g <= 0.04) return g / 0.04;
  return (0.12 - g) / 0.08;
}

export function gapQuality(bars) {
  if (bars.length < 2) return null;
  const g = overnightGap(bars);
  const tent = gapTent(g);
  if (tent === null) return null;
  const cp = closePosition(bars[bars.length - 1]);
  // A gap that closed on its low is not the same setup as one that held.
  return tent * (0.4 + 0.6 * cp);
}

export function volatilityExpansion(bars) {
  const bb = bollinger(bars, 20, 2);
  const a = atr(bars, 14);
  if (!bb || !isNum(a) || a <= 0) return null;
  const close = bars[bars.length - 1].close;
  const breakout = Math.max(0, (close - bb.upper) / a);
  const ratio = atrPercentile(bars, 14, 100);
  if (!isNum(ratio)) return null;
  // Multiplying by the ATR ratio distinguishes a real expansion from a drift
  // above a band that has been quietly narrowing.
  return breakout * Math.min(ratio, 2.5);
}

export function trendPosition(bars) {
  const c = bars.map((b) => b.close);
  const e20 = ema(c, 20);
  const e50 = ema(c, 50);
  const a = atr(bars, 14);
  const close = c[c.length - 1];
  if (!isNum(e20) || !isNum(a) || a <= 0) return null;

  const above20 = Math.sign(close - e20) * Math.min(1, Math.abs(close - e20) / (1.5 * a));
  const stack = isNum(e50) ? Math.sign(e20 - e50) : 0;
  const pos = rangePosition(bars, 252);
  if (!isNum(pos)) return null;

  return 0.5 * above20 + 0.3 * stack + 0.2 * pos;
}

/**
 * Crowding penalty — subtracted from the ultra-short score. METHODOLOGY §3.3.
 *
 * This is the highest-value addition to the original ultra-short spec.
 * Gap-up-on-volume-with-good-news is the most crowded setup in retail trading,
 * and the reversals concentrate in names that have already extended. Without
 * this term the model systematically buys the exhaustion bar.
 */
export function crowdingPenalty(bars) {
  const c = bars.map((b) => b.close);
  const e20 = ema(c, 20);
  const a = atr(bars, 14);
  if (!isNum(e20) || !isNum(a) || a <= 0) return 0;
  const ext = (c[c.length - 1] - e20) / a;
  let p = ext > 2.5 ? 0.35 * (ext - 2.5) : 0;
  const r = rsi(bars, 14);
  if (isNum(r) && r > 80) p += 0.25;
  return p;
}

export function ultraShortFactors(stock, sentimentScore) {
  const bars = stock.bars;
  const rv = relativeVolume(bars, 30);
  return {
    // RVOL below 1.2 means there is no unusual activity to detect. Null, not 0.
    relativeVolume: isNum(rv) && rv >= 1.2 ? rv : null,
    gapQuality: gapQuality(bars),
    newsSentiment: isNum(sentimentScore) ? sentimentScore : null,
    volatilityExpansion: volatilityExpansion(bars),
    trendPosition: trendPosition(bars),
    _crowding: crowdingPenalty(bars),
  };
}

// ─────────────────────────────────────────────────────────────── mid term ──

export function trendAlignment(bars) {
  const c = bars.map((b) => b.close);
  const e20 = ema(c, 20);
  const e50 = ema(c, 50);
  const e200 = ema(c, 200);
  const a = atr(bars, 14);
  const close = c[c.length - 1];
  if (!isNum(e20) || !isNum(e50) || !isNum(a) || a <= 0) return null;

  const s1 = Math.sign(e20 - e50);
  const s2 = isNum(e200) ? Math.sign(e50 - e200) : 0;
  const ext = clip((close - e20) / (2 * a), -1, 1);
  const dfh = distanceFromHigh(bars, 252);
  const nearHigh = isNum(dfh) ? clip(1 - dfh / 0.25, 0, 1) : null;
  if (nearHigh === null) return null;

  return 0.4 * s1 + 0.25 * s2 + 0.2 * ext + 0.15 * nearHigh;
}

/**
 * Fundamental momentum from reported quarterly statements. METHODOLOGY §4.3.
 *
 * `quarters` is ordered oldest-first and must already be point-in-time filtered.
 * Growth *acceleration* is weighted heavily because the level of growth is
 * largely in the price already; the change in it is what re-rates a stock.
 */
export function fundamentalMomentum(quarters) {
  if (!quarters || quarters.length < 8) return null;
  const q = quarters;
  const n = q.length;
  const at = (i) => q[n - 1 - i];

  const rev = (x) => (x && isNum(x.revenue) && x.revenue > 0 ? x.revenue : null);
  const r0 = rev(at(0));
  const r4 = rev(at(4));
  const r1 = rev(at(1));
  const r5 = rev(at(5));
  if (!r0 || !r4) return null;

  const yoyNow = r0 / r4 - 1;
  const yoyPrev = r1 && r5 ? r1 / r5 - 1 : null;
  const accel = isNum(yoyPrev) ? yoyNow - yoyPrev : null;

  const marginOf = (x) =>
    x && isNum(x.operatingIncome) && isNum(x.revenue) && x.revenue > 0
      ? x.operatingIncome / x.revenue
      : null;
  const m0 = marginOf(at(0));
  const m4 = marginOf(at(4));
  const marginDelta = isNum(m0) && isNum(m4) ? m0 - m4 : null;

  return { yoyNow, accel, marginDelta };
}

/**
 * Post-earnings drift: the market's own 3-day reaction to the last filing,
 * decayed by how long ago it was. METHODOLOGY §4.3.
 *
 * Substitutes for analyst EPS-revision momentum, which has no keyless source.
 * An honest downgrade, labelled as such on the site.
 */
export function earningsDrift(bars, lastFiledDate, sectorBars, asOf) {
  if (!lastFiledDate) return null;
  const filed = new Date(lastFiledDate);
  const days = (new Date(asOf) - filed) / 86_400_000;
  if (!Number.isFinite(days) || days < 0 || days > 90) return null;

  const idx = bars.findIndex((b) => new Date(b.date) >= filed);
  if (idx < 1 || idx + 2 >= bars.length) return null;

  const stockRet = bars[idx + 2].close / bars[idx - 1].close - 1;

  let benchRet = 0;
  if (sectorBars && sectorBars.length) {
    const si = sectorBars.findIndex((b) => new Date(b.date) >= filed);
    if (si >= 1 && si + 2 < sectorBars.length) {
      benchRet = sectorBars[si + 2].close / sectorBars[si - 1].close - 1;
    }
  }
  return (stockRet - benchRet) * Math.exp(-days / 45);
}

export function moneyFlow(bars) {
  const cmf = chaikinMoneyFlow(bars, 21);
  if (!isNum(cmf)) return null;
  const dv = bars.slice(-21).map((b) => b.close * b.volume);
  const sl = slope(dv);
  const base = dv.reduce((a, b) => a + b, 0) / dv.length;
  const trend = isNum(sl) && base > 0 ? clip((sl * dv.length) / base, -1, 1) : 0;
  return 0.7 * cmf + 0.3 * trend;
}

export function midTermFactors(stock, ctx) {
  return {
    trendAlignment: trendAlignment(stock.bars),
    fundamentalMomentum: (() => {
      const fm = fundamentalMomentum(stock.quarters);
      if (!fm) return null;
      // Combined here at raw scale; the three sub-terms are z-scored jointly
      // downstream. Weighted 0.45 / 0.30 / 0.25 per METHODOLOGY §4.3.
      const parts = [];
      if (isNum(fm.yoyNow)) parts.push([0.45, clip(fm.yoyNow, -1, 3)]);
      if (isNum(fm.accel)) parts.push([0.30, clip(fm.accel, -1, 1)]);
      if (isNum(fm.marginDelta)) parts.push([0.25, clip(fm.marginDelta, -0.5, 0.5)]);
      if (parts.length === 0) return null;
      const w = parts.reduce((a, [x]) => a + x, 0);
      return parts.reduce((a, [x, v]) => a + (x / w) * v, 0);
    })(),
    earningsDrift: earningsDrift(stock.bars, stock.lastFiled, ctx.sectorBars, ctx.asOf),
    moneyFlow: moneyFlow(stock.bars),
    sectorStrength: ctx.sectorStrength ?? null,
  };
}

// ────────────────────────────────────────────────────────────── long term ──

/** Trailing-twelve-month sum of a quarterly field. */
export function ttm(quarters, field) {
  if (!quarters || quarters.length < 4) return null;
  const last4 = quarters.slice(-4);
  let sum = 0;
  for (const q of last4) {
    if (!isNum(q[field])) return null;
    sum += q[field];
  }
  return sum;
}

/**
 * Return on invested capital. METHODOLOGY §5.3.
 *
 * The effective tax rate is clipped to [10%, 35%]. Without the clip, a company
 * with a one-off tax benefit prints a negative rate, NOPAT exceeds operating
 * income, and ROIC becomes nonsense — a failure mode that reliably puts a
 * handful of tax-settlement names at the top of an unclipped screen.
 */
export function roic(quarters, balance) {
  const ebit = ttm(quarters, 'operatingIncome');
  if (!isNum(ebit)) return null;
  const pretax = ttm(quarters, 'pretaxIncome');
  const taxExp = ttm(quarters, 'incomeTaxExpense');
  let rate = 0.21;
  if (isNum(pretax) && pretax > 0 && isNum(taxExp)) rate = clip(taxExp / pretax, 0.1, 0.35);
  const nopat = ebit * (1 - rate);

  // Average invested capital across the trailing four quarters, not the latest
  // balance sheet alone.
  //
  // NOPAT is a FLOW measured over twelve months; invested capital is a STOCK
  // measured at an instant. Dividing a year of profit by the closing balance
  // mismatches the two, and the error is largest exactly where it matters most:
  // a company that raised capital or closed an acquisition mid-year shows an
  // inflated denominator and an artificially depressed ROIC, while one that
  // bought back stock late in the year prints a flattering one. Averaging the
  // period the flow was earned over is the standard treatment.
  const ic = averageInvestedCapital(quarters, balance);
  if (!isNum(ic) || ic <= 0) return null;
  return nopat / ic;
}

/**
 * Mean invested capital over the trailing four quarters, falling back to the
 * latest balance sheet when the quarterly rows do not carry balance fields
 * (which is the norm for the Korean snapshot path).
 */
export function averageInvestedCapital(quarters, balance) {
  const last4 = (quarters ?? []).slice(-4);
  const values = last4.map(investedCapital).filter((x) => isNum(x) && x > 0);
  if (values.length >= 2) return values.reduce((a, b) => a + b, 0) / values.length;
  return investedCapital(balance);
}

export function investedCapital(b) {
  if (!b) return null;
  const debt = (isNum(b.longTermDebt) ? b.longTermDebt : 0) + (isNum(b.shortTermDebt) ? b.shortTermDebt : 0);
  if (!isNum(b.totalEquity)) return null;
  const cash = isNum(b.cash) ? b.cash : 0;
  const ic = debt + b.totalEquity - cash;
  return ic > 0 ? ic : null;
}

export function enterpriseValue(marketCap, b) {
  if (!isNum(marketCap) || !b) return null;
  const debt = (isNum(b.longTermDebt) ? b.longTermDebt : 0) + (isNum(b.shortTermDebt) ? b.shortTermDebt : 0);
  const cash = isNum(b.cash) ? b.cash : 0;
  const ev = marketCap + debt - cash;
  return ev > 0 ? ev : null;
}

/**
 * Piotroski F-score: nine binary accounting-quality tests. METHODOLOGY §5.3.
 *
 * Returns `{ score, tests }` where score is 0–9, or `null` when fewer than six
 * of the nine tests are computable — a partial F-score is not comparable to a
 * full one and would be unfair to companies with complete data.
 */
export function piotroski(cur, prev) {
  if (!cur || !prev) return null;
  const t = {};
  const put = (k, cond) => {
    if (cond !== null && cond !== undefined) t[k] = cond ? 1 : 0;
  };

  const roaCur = isNum(cur.netIncome) && isNum(cur.totalAssets) && cur.totalAssets > 0
    ? cur.netIncome / cur.totalAssets : null;
  const roaPrev = isNum(prev.netIncome) && isNum(prev.totalAssets) && prev.totalAssets > 0
    ? prev.netIncome / prev.totalAssets : null;

  put('roaPositive', isNum(roaCur) ? roaCur > 0 : null);
  put('cfoPositive', isNum(cur.operatingCashFlow) ? cur.operatingCashFlow > 0 : null);
  put('roaImproving', isNum(roaCur) && isNum(roaPrev) ? roaCur > roaPrev : null);
  put(
    'accrualQuality',
    isNum(cur.operatingCashFlow) && isNum(cur.netIncome) && isNum(cur.totalAssets) && cur.totalAssets > 0
      ? cur.operatingCashFlow / cur.totalAssets > cur.netIncome / cur.totalAssets
      : null,
  );

  const ltdRatio = (x) =>
    isNum(x.longTermDebt) && isNum(x.totalAssets) && x.totalAssets > 0 ? x.longTermDebt / x.totalAssets : null;
  const lc = ltdRatio(cur);
  const lp = ltdRatio(prev);
  put('leverageDown', isNum(lc) && isNum(lp) ? lc <= lp : null);

  const curRatio = (x) =>
    isNum(x.currentAssets) && isNum(x.currentLiabilities) && x.currentLiabilities > 0
      ? x.currentAssets / x.currentLiabilities : null;
  const cc = curRatio(cur);
  const cp = curRatio(prev);
  put('liquidityUp', isNum(cc) && isNum(cp) ? cc > cp : null);

  put(
    'noDilution',
    isNum(cur.sharesOutstanding) && isNum(prev.sharesOutstanding)
      ? cur.sharesOutstanding <= prev.sharesOutstanding * 1.02
      : null,
  );

  const gm = (x) =>
    isNum(x.grossProfit) && isNum(x.revenue) && x.revenue > 0 ? x.grossProfit / x.revenue : null;
  const gc = gm(cur);
  const gp = gm(prev);
  put('marginUp', isNum(gc) && isNum(gp) ? gc > gp : null);

  const turn = (x) =>
    isNum(x.revenue) && isNum(x.totalAssets) && x.totalAssets > 0 ? x.revenue / x.totalAssets : null;
  const tc = turn(cur);
  const tp = turn(prev);
  put('turnoverUp', isNum(tc) && isNum(tp) ? tc > tp : null);

  const keys = Object.keys(t);
  if (keys.length < 6) return null;
  const raw = keys.reduce((a, k) => a + t[k], 0);
  // Scale a partial score up to the 0–9 range so it stays comparable.
  return { score: (raw / keys.length) * 9, tests: t, computed: keys.length };
}

export function longTermFactors(stock) {
  const q = stock.quarters ?? [];
  const b = stock.balance;
  const annual = stock.annual ?? [];

  const revTtm = ttm(q, 'revenue');
  const rev3yr = stock.revenueTTM3yrAgo;
  const cagr3 = isNum(revTtm) && isNum(rev3yr) && rev3yr > 0 ? (revTtm / rev3yr) ** (1 / 3) - 1 : null;

  const last8 = q.slice(-8);
  let positives = 0;
  let comparable = 0;
  for (let i = 4; i < last8.length; i++) {
    const a = last8[i]?.revenue;
    const c = last8[i - 4]?.revenue;
    if (isNum(a) && isNum(c) && c > 0) {
      comparable++;
      if (a > c) positives++;
    }
  }
  const consistency = comparable >= 3 ? positives / comparable : null;

  const growthQuality =
    isNum(cagr3) || isNum(consistency)
      ? 0.55 * (ramp(cagr3, 0.12) ?? 0) + 0.45 * (consistency ?? 0)
      : null;

  const r = roic(q, b);
  const rPrev = stock.roic3yrAgo;
  const capitalEfficiency = isNum(r)
    ? 0.7 * (ramp(r, 0.15) ?? 0) + 0.3 * (isNum(rPrev) ? clip(r - rPrev, -0.3, 0.3) : 0)
    : null;

  const ocf = ttm(q, 'operatingCashFlow');
  const capex = ttm(q, 'capex');
  const fcf = isNum(ocf) && isNum(capex) ? ocf - Math.abs(capex) : null;
  const ev = enterpriseValue(stock.marketCap, b);
  const fcfYield = isNum(fcf) && isNum(ev) && ev > 0 ? fcf / ev : null;
  const ni = ttm(q, 'netIncome');
  const conversion = isNum(fcf) && isNum(ni) && ni > 0 ? clip(fcf / ni, 0, 2) : null;
  const cashGeneration =
    isNum(fcfYield) || isNum(conversion)
      ? 0.6 * (fcfYield ?? 0) + 0.4 * ((conversion ?? 0) / 2)
      : null;

  const ebit = ttm(q, 'operatingIncome');
  const evEbit = isNum(ev) && isNum(ebit) && ebit > 0 ? ev / ebit : null;
  const valuation =
    isNum(evEbit) || isNum(fcfYield)
      ? 0.6 * (isNum(evEbit) ? -Math.log(evEbit) : 0) + 0.4 * (fcfYield ?? 0) * 10
      : null;

  const f = piotroski(stock.fundamentalsCurrent, stock.fundamentalsPrior);

  return {
    growthQuality,
    capitalEfficiency,
    cashGeneration,
    valuation,
    fScore: f ? f.score : null,
    _fScoreDetail: f,
    _roic: r,
    _fcfYield: fcfYield,
    _evEbit: evEbit,
    _annualCount: annual.length,
  };
}

/**
 * Hard distress gate for the long-term board. METHODOLOGY §5.1(d).
 * Returns a reason string when the stock must be excluded, else null.
 */
export function distressGate(stock) {
  const q = stock.quarters ?? [];
  const last4 = q.slice(-4);
  const negCfo = last4.filter((x) => isNum(x.operatingCashFlow) && x.operatingCashFlow < 0).length;
  if (last4.length === 4 && negCfo >= 3) return 'negative_operating_cash_flow';

  const ebit = ttm(q, 'operatingIncome');
  const interest = ttm(q, 'interestExpense');
  if (isNum(ebit) && isNum(interest) && interest > 0 && ebit / interest < 1.5) {
    return 'interest_coverage_below_1_5';
  }
  return null;
}

// ───────────────────────────────────────────────────────────── ultra long ──

/**
 * Sector groups that need their own balance-sheet rules. METHODOLOGY §6.1(c).
 * Net Debt/EBITDA below 2.0 excludes every bank, REIT and most utilities by
 * construction — deposits are liabilities and leverage is the business model.
 */
export const SPECIAL_BALANCE_SECTORS = new Set([
  'Financials', 'Real Estate', 'Utilities', '금융', '부동산', '유틸리티',
]);

export function ultraLongFactors(stock) {
  const annual = stock.annual ?? [];
  if (annual.length < 5) return null;

  const gmSeries = annual
    .map((a) => (isNum(a.grossProfit) && isNum(a.revenue) && a.revenue > 0 ? a.grossProfit / a.revenue : null))
    .filter(isNum);

  const gm5 = gmSeries.slice(-5);
  const gmMean = gm5.length ? gm5.reduce((a, b) => a + b, 0) / gm5.length : null;
  const gmSd =
    gm5.length > 1
      ? Math.sqrt(gm5.reduce((a, x) => a + (x - gmMean) ** 2, 0) / (gm5.length - 1))
      : null;
  const gmStability = isNum(gmMean) && gmMean > 0 && isNum(gmSd) ? clip(1 - gmSd / gmMean, 0, 1) : null;
  const gmTrend = gm5.length >= 3 ? Math.sign(slope(gm5) ?? 0) : null;

  const roicHistory = stock.roicHistory ?? [];
  const roicPersistence =
    roicHistory.length >= 5
      ? roicHistory.filter((x) => isNum(x) && x > 0.12).length / roicHistory.length
      : null;

  // gmMedian is z-scored against sector peers downstream, which is what makes
  // it a moat proxy rather than a sector proxy. METHODOLOGY §6.1(a).
  const moatStrength =
    isNum(gmMean) || isNum(roicPersistence)
      ? 0.30 * (gmMean ?? 0) + 0.25 * (gmStability ?? 0) + 0.15 * ((gmTrend ?? 0) + 1) / 2 +
        0.30 * (roicPersistence ?? 0)
      : null;

  const fcfHistory = (stock.fcfHistory ?? []).filter(isNum);
  const yearsPositive = fcfHistory.length >= 5 ? fcfHistory.filter((x) => x > 0).length / fcfHistory.length : null;
  const fcfFirst = fcfHistory[0];
  const fcfLast = fcfHistory[fcfHistory.length - 1];
  const fcfCagr =
    isNum(fcfFirst) && fcfFirst > 0 && isNum(fcfLast) && fcfLast > 0 && fcfHistory.length >= 5
      ? (fcfLast / fcfFirst) ** (1 / (fcfHistory.length - 1)) - 1
      : null;
  let peak = -Infinity;
  let maxDd = 0;
  for (const v of fcfHistory) {
    if (v > peak) peak = v;
    if (peak > 0) maxDd = Math.max(maxDd, (peak - v) / peak);
  }
  const cashFlowDurability = isNum(yearsPositive)
    ? 0.45 * yearsPositive + 0.35 * (ramp(fcfCagr, 0.08) ?? 0) / 2 + 0.20 * (1 - Math.min(1, maxDd))
    : null;

  const reinvest = stock.reinvestmentRate;
  const r = stock.roicCurrent;
  const impliedGrowth = isNum(reinvest) && isNum(r) ? clip(reinvest * r, -0.5, 0.6) : null;
  const rpsCagr = stock.revenuePerShareCagr10;
  const reinvestmentRunway =
    isNum(impliedGrowth) || isNum(rpsCagr)
      ? 0.6 * (impliedGrowth ?? 0) + 0.4 * clip(rpsCagr ?? 0, -0.3, 0.5)
      : null;

  const balanceSheetStrength = balanceStrength(stock);

  const bb = stock.buybackYield;
  const dy = stock.dividendYield;
  const dg = stock.dividendGrowth5y;
  const dilution = isNum(stock.shareCountCagr5) && stock.shareCountCagr5 > 0.02 ? -1.0 : 0;
  const shareholderYield =
    isNum(bb) || isNum(dy)
      ? 0.4 * clip(bb ?? 0, -0.2, 0.15) + 0.3 * clip(dy ?? 0, 0, 0.12) +
        0.3 * ((ramp(dg, 0.05) ?? 0) / 2) + dilution
      : null;

  return {
    moatStrength,
    cashFlowDurability,
    reinvestmentRunway,
    balanceSheetStrength,
    shareholderYield,
    _gmMedian: gmMean,
    _roicPersistence: roicPersistence,
    _yearsPositiveFcf: yearsPositive,
  };
}

function balanceStrength(stock) {
  const b = stock.balance;
  if (!b) return null;
  const sector = stock.sector ?? '';

  if (SPECIAL_BALANCE_SECTORS.has(sector)) {
    // Equity-to-assets is the sector-appropriate solvency measure here.
    if (isNum(b.totalEquity) && isNum(b.totalAssets) && b.totalAssets > 0) {
      const eta = b.totalEquity / b.totalAssets;
      return clip(eta / 0.12, 0, 2);
    }
    return null;
  }

  const ebitda = stock.ebitdaTTM;
  const debt = (isNum(b.longTermDebt) ? b.longTermDebt : 0) + (isNum(b.shortTermDebt) ? b.shortTermDebt : 0);
  const cash = isNum(b.cash) ? b.cash : 0;
  const netDebt = debt - cash;
  if (!isNum(ebitda) || ebitda <= 0) return null;
  const nd = netDebt / ebitda;

  const coverage = isNum(stock.interestCoverage) ? clip(stock.interestCoverage / 8, 0, 2) : null;
  const currentRatio =
    isNum(b.currentAssets) && isNum(b.currentLiabilities) && b.currentLiabilities > 0
      ? clip(b.currentAssets / b.currentLiabilities / 2, 0, 1.5)
      : null;

  const ndScore = clip((2.0 - nd) / 2.0, -1, 1.5);
  const parts = [[0.5, ndScore]];
  if (coverage !== null) parts.push([0.3, coverage]);
  if (currentRatio !== null) parts.push([0.2, currentRatio]);
  const w = parts.reduce((a, [x]) => a + x, 0);
  return parts.reduce((a, [x, v]) => a + (x / w) * v, 0);
}
