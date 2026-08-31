/**
 * DART `fnlttSinglAcntAll` response fixtures.
 *
 * Shaped from the published field specification: sj_div/account_id/account_nm/
 * thstrm_amount/thstrm_add_amount/rcept_no. Deliberately includes the awkward
 * cases the live API is documented to produce and that a naive parser gets
 * wrong:
 *
 *   - `-표준계정코드 미사용-` in account_id, so only the Korean name identifies
 *     the line (common, and not an error)
 *   - amounts as strings with thousands separators, and '' for not reported
 *   - the closing-cash line in the CASH FLOW statement, which shares its name
 *     with the balance-sheet cash line and must not be mistaken for it
 *   - subtotals and segment rows that legitimately match nothing
 */

const row = (sj, id, nm, amount, add = '') => ({
  rcept_no: '20250320000101',
  sj_div: sj,
  account_id: id,
  account_nm: nm,
  thstrm_amount: amount,
  thstrm_add_amount: add,
  currency: 'KRW',
});

/** One report's rows. `scale` lets a caller vary a company's size. */
export function makeDartReport({ scale = 1, ytd = null, standardCodes = true } = {}) {
  const n = (x) => String(Math.round(x * scale)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const y = (x) => (ytd === null ? '' : n(x * ytd));
  const id = (std, fallback = '-표준계정코드 미사용-') => (standardCodes ? std : fallback);

  return [
    // ── income statement ──────────────────────────────────────────────────
    row('IS', id('ifrs-full_Revenue'), '수익(매출액)', n(1_000_000), y(1_000_000)),
    row('IS', id('ifrs-full_GrossProfit'), '매출총이익', n(400_000), y(400_000)),
    row('IS', id('dart_OperatingIncomeLoss'), '영업이익', n(180_000), y(180_000)),
    row('IS', id('ifrs-full_ProfitLossBeforeTax'), '법인세비용차감전순이익', n(160_000), y(160_000)),
    row('IS', id('ifrs-full_IncomeTaxExpenseContinuingOperations'), '법인세비용', n(35_000), y(35_000)),
    row('IS', id('ifrs-full_ProfitLoss'), '당기순이익(손실)', n(125_000), y(125_000)),
    row('IS', id('ifrs-full_FinanceCosts'), '금융원가', n(9_000), y(9_000)),
    row('IS', id('dart_ResearchAndDevelopmentExpense'), '경상연구개발비', n(50_000), y(50_000)),
    // A subtotal that must match nothing.
    row('IS', '-표준계정코드 미사용-', '기타영업외손익', n(1_200), ''),

    // ── balance sheet ─────────────────────────────────────────────────────
    row('BS', id('ifrs-full_Assets'), '자산총계', n(5_000_000)),
    row('BS', id('ifrs-full_Equity'), '자본총계', n(3_000_000)),
    row('BS', id('ifrs-full_CurrentAssets'), '유동자산', n(2_000_000)),
    row('BS', id('ifrs-full_CurrentLiabilities'), '유동부채', n(1_100_000)),
    row('BS', id('ifrs-full_CashAndCashEquivalents'), '현금및현금성자산', n(600_000)),
    row('BS', id('ifrs-full_ShorttermBorrowings'), '단기차입금', n(250_000)),
    row('BS', id('ifrs-full_LongtermBorrowings'), '장기차입금', n(400_000)),
    // Not reported this period — must become null, never 0.
    row('BS', '-표준계정코드 미사용-', '기타비유동자산', ''),

    // ── cash flow ─────────────────────────────────────────────────────────
    row('CF', id('ifrs-full_CashFlowsFromUsedInOperatingActivities'), '영업활동현금흐름', n(220_000), y(220_000)),
    row('CF', id('ifrs-full_PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities'), '유형자산의취득', n(90_000), y(90_000)),
    row('CF', id('ifrs-full_DividendsPaidClassifiedAsFinancingActivities'), '배당금지급', n(30_000), y(30_000)),
    // THE TRAP: the cash flow statement's closing-cash line carries the same
    // Korean name as the balance-sheet cash line. Taking it as the balance
    // would be right only by accident.
    row('CF', '-표준계정코드 미사용-', '현금및현금성자산', n(999_999_999)),
  ];
}

/**
 * The same rows with the CASH FLOW statement first.
 *
 * DART does not guarantee statement order, and the ordering matters: with the
 * balance sheet first, "first match wins" hides a missing sj_div guard, because
 * BS cash is already set by the time the cash flow statement's closing-cash
 * line arrives. Only this ordering actually tests the guard.
 */
export function makeDartReportCashFlowFirst(opts = {}) {
  const rows = makeDartReport(opts);
  const cf = rows.filter((r) => r.sj_div === 'CF');
  const rest = rows.filter((r) => r.sj_div !== 'CF');
  return [...cf, ...rest];
}

/** A company reporting only year-to-date figures on quarterly statements. */
export function makeCumulativeYear({ scale = 1 } = {}) {
  return {
    11013: makeDartReport({ scale: scale * 1.0, ytd: 1 }),
    11012: makeDartReport({ scale: scale * 2.1, ytd: 1 }),
    11014: makeDartReport({ scale: scale * 3.3, ytd: 1 }),
    11011: makeDartReport({ scale: scale * 4.6, ytd: 1 }),
  };
}
