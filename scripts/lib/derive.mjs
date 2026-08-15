/**
 * Derived company metrics.
 *
 * The long-horizon factor models (METHODOLOGY §5, §6) need multi-year series —
 * ROIC history, FCF history, share-count trend, reinvestment rate — that no
 * source hands over directly. They are all computable from the quarterly and
 * annual statements already in the store, and this module is where that happens,
 * once, before scoring.
 *
 * Everything here returns `null` rather than a guess when the inputs are not
 * there. The completeness gate (METHODOLOGY P4) then decides whether the stock
 * is rankable, which is the behaviour we want: a company with four years of
 * filings should be absent from the ultra-long board, not present with
 * fabricated durability.
 */

import { isNum } from './stats.mjs';
import { investedCapital, ttm } from './factors.mjs';

const sum4 = (arr, field) => {
  if (!arr || arr.length < 4) return null;
  let s = 0;
  for (const q of arr.slice(-4)) {
    if (!isNum(q[field])) return null;
    s += q[field];
  }
  return s;
};

/** Free cash flow for one annual statement. */
function annualFcf(a) {
  if (!isNum(a?.operatingCashFlow)) return null;
  const capex = isNum(a.capex) ? Math.abs(a.capex) : 0;
  return a.operatingCashFlow - capex;
}

/** ROIC for one annual statement, using that year's own balance figures. */
function annualRoic(a) {
  if (!isNum(a?.operatingIncome)) return null;
  const ic = investedCapital({
    longTermDebt: a.longTermDebt, shortTermDebt: a.shortTermDebt,
    totalEquity: a.totalEquity, cash: a.cash,
  });
  if (!isNum(ic) || ic <= 0) return null;
  // A flat 21% statutory rate is used for the historical series rather than the
  // per-year effective rate: across a decade, one-off tax items would otherwise
  // dominate the persistence count, which is meant to measure the business, not
  // its tax department.
  return (a.operatingIncome * 0.79) / ic;
}

function cagr(first, last, years) {
  if (!isNum(first) || !isNum(last) || first <= 0 || last <= 0 || years <= 0) return null;
  return (last / first) ** (1 / years) - 1;
}

/**
 * Attach every derived series a factor model expects.
 * Mutates and returns `stock`.
 */
export function deriveMetrics(stock) {
  const q = stock.quarters ?? [];
  const annual = stock.annual ?? [];
  const b = stock.balance;

  // ── trailing-twelve-month aggregates ────────────────────────────────────
  const ebit = ttm(q, 'operatingIncome');
  const ocf = ttm(q, 'operatingCashFlow');
  const capexTtm = ttm(q, 'capex');
  const interest = ttm(q, 'interestExpense');
  const revenueTtm = ttm(q, 'revenue');

  stock.ebitdaTTM = (() => {
    if (!isNum(ebit)) return null;
    // D&A is not reliably tagged quarterly across filers, so it is approximated
    // from the operating-cash-flow-to-net-income wedge. That is crude but it is
    // derived from this company's own reported figures.
    //
    // What it deliberately does NOT do is fall back to a flat multiple of EBIT.
    // An earlier version returned `ebit * 1.15` when the wedge was uncomputable,
    // which invents a 15% D&A rate identical for a software firm and a steel
    // mill and then feeds it into net-debt/EBITDA — a leverage number that
    // decides whether a company passes the balance-sheet screen. A fabricated
    // denominator producing a confident-looking leverage ratio is worse than a
    // null, because null is handled honestly by the completeness gate.
    const ni = ttm(q, 'netIncome');
    if (!isNum(ocf) || !isNum(ni)) return null;
    const da = Math.max(0, ocf - ni);
    return ebit + da;
  })();

  stock.interestCoverage = isNum(ebit) && isNum(interest) && interest > 0 ? ebit / interest : null;

  // ── 3-year-ago comparables for the long-term factors ───────────────────
  // 12 quarters back is three years. Comparing TTM to TTM (not quarter to
  // quarter) removes seasonality from the growth rate.
  stock.revenueTTM3yrAgo = q.length >= 16 ? sum4(q.slice(0, q.length - 12), 'revenue') : null;

  stock.roic3yrAgo = (() => {
    if (q.length < 16) return null;
    const past = q.slice(0, q.length - 12);
    const pastEbit = sum4(past, 'operatingIncome');
    const pastBal = past.at(-1);
    if (!isNum(pastEbit) || !pastBal) return null;
    const ic = investedCapital(pastBal);
    if (!isNum(ic) || ic <= 0) return null;
    return (pastEbit * 0.79) / ic;
  })();

  // ── decade-scale series for the ultra-long factors ─────────────────────
  stock.fcfHistory = annual.map(annualFcf).filter(isNum);
  stock.roicHistory = annual.map(annualRoic).filter(isNum);

  stock.roicCurrent = (() => {
    if (!isNum(ebit) || !b) return null;
    const ic = investedCapital(b);
    return isNum(ic) && ic > 0 ? (ebit * 0.79) / ic : null;
  })();

  stock.reinvestmentRate = (() => {
    if (!isNum(ebit) || ebit <= 0) return null;
    const capex = isNum(capexTtm) ? Math.abs(capexTtm) : null;
    if (!isNum(capex)) return null;
    const nopat = ebit * 0.79;
    if (nopat <= 0) return null;

    // Reinvestment is capex + R&D + acquisitions, less depreciation.
    //
    // Capex alone systematically understates reinvestment for exactly the
    // businesses this factor is meant to identify: a software company that
    // compounds by spending on R&D, or a serial acquirer that compounds by
    // buying capacity, both look capital-light and score as though they have no
    // reinvestment runway at all. R&D and acquisitions are genuine deployments
    // of capital into future growth even though accounting treats one as an
    // expense and the other as an investing cash flow.
    const rnd = Math.abs(ttm(q, 'researchAndDevelopment') ?? 0);
    const acq = Math.abs(ttm(q, 'acquisitions') ?? 0);
    const ni = ttm(q, 'netIncome');
    const da = isNum(ocf) && isNum(ni) ? Math.max(0, ocf - ni) : 0;

    const net = capex + rnd + acq - da;
    return Math.max(-0.5, Math.min(1.5, net / nopat));
  })();

  const shareSeries = annual.map((a) => a.sharesOutstanding).filter(isNum);
  stock.shareCountCagr5 = (() => {
    if (shareSeries.length < 5) return null;
    const window = shareSeries.slice(-6);
    return cagr(window[0], window.at(-1), window.length - 1);
  })();

  stock.buybackYield = (() => {
    if (shareSeries.length < 6) return null;
    const window = shareSeries.slice(-6);
    const first = window[0];
    const last = window.at(-1);
    if (!(first > 0)) return null;
    // Net reduction per year. A buyback that only offsets stock comp nets to
    // ~zero here, which is the correct answer and why gross announcements are
    // not used.
    return ((first - last) / first) / (window.length - 1);
  })();

  stock.dividendYield = (() => {
    const div = ttm(q, 'dividendsPaid');
    if (!isNum(div) || !isNum(stock.marketCap) || stock.marketCap <= 0) return null;
    return Math.abs(div) / stock.marketCap;
  })();

  stock.dividendGrowth5y = (() => {
    const divs = annual.map((a) => a.dividendsPaid).filter(isNum).map(Math.abs);
    if (divs.length < 5) return null;
    const window = divs.slice(-6);
    const shares = shareSeries.slice(-window.length);
    if (shares.length !== window.length) return cagr(window[0], window.at(-1), window.length - 1);
    // Per-share, so a company that grew dividends only by shrinking the payout
    // base is not credited with growth.
    const dps0 = shares[0] > 0 ? window[0] / shares[0] : null;
    const dpsN = shares.at(-1) > 0 ? window.at(-1) / shares.at(-1) : null;
    return cagr(dps0, dpsN, window.length - 1);
  })();

  stock.revenuePerShareCagr10 = (() => {
    const revs = annual.map((a) => a.revenue);
    if (revs.length < 5 || shareSeries.length < 5) return null;
    const n = Math.min(revs.length, shareSeries.length);
    const r0 = revs[revs.length - n];
    const s0 = shareSeries[shareSeries.length - n];
    const rN = revs.at(-1);
    const sN = shareSeries.at(-1);
    if (![r0, s0, rN, sN].every((x) => isNum(x) && x > 0)) return null;
    return cagr(r0 / s0, rN / sN, n - 1);
  })();

  // Piotroski compares this quarter against the same quarter a year earlier —
  // year-over-year, not sequentially, so seasonal businesses are not penalized
  // for their off quarter.
  stock.fundamentalsCurrent = q.at(-1) ?? null;
  stock.fundamentalsPrior = q.length >= 5 ? q.at(-5) : null;

  // Balance-sheet fields live on the quarterly rows for US filers; fold them in
  // so Piotroski's leverage and liquidity tests have what they need.
  if (stock.fundamentalsCurrent && b) {
    stock.fundamentalsCurrent = { ...b, ...stock.fundamentalsCurrent };
  }

  stock.revenueTTM = revenueTtm;
  return stock;
}
