/**
 * DART (전자공시 OpenDART) account mapping.
 *
 * ── What this file is for ───────────────────────────────────────────────────
 *
 * SEC XBRL and DART describe the same accounting concepts with different
 * vocabularies. `scripts/lib/sources.mjs` defines 20 CONCEPTS keys in US-GAAP
 * terms, and every factor model in the project consumes those keys. This module
 * translates DART's IFRS-taxonomy line items into exactly the same keys, so
 * Korean fundamentals flow through the identical scoring path rather than a
 * parallel one.
 *
 * ── Why the mapping is doubled ──────────────────────────────────────────────
 *
 * DART returns two identifiers per line item:
 *
 *   account_id  — the XBRL standard ID (`ifrs-full_Revenue`), which is precise
 *                 but is literally the string "-표준계정코드 미사용-"
 *                 ("standard account code not used") whenever a filer used a
 *                 custom account. That is common, and it is not an error.
 *   account_nm  — the Korean line name (매출액, 영업이익, 자산총계). Always
 *                 present, and Korean statement naming is far more standardised
 *                 than the US equivalent because the FSS prescribes the forms.
 *
 * Matching on either alone loses real data. `account_id` first because it is
 * unambiguous; `account_nm` second because it is the one that survives a custom
 * account code.
 *
 * ── The verification problem this file is designed around ───────────────────
 *
 * A DART key is a credential, so this mapping could not be checked against a
 * live response while it was written. The failure mode that creates is precise
 * and quiet: if the identifiers are wrong, every lookup misses, every statement
 * parses to an empty object, and the Korean boards stay empty for exactly the
 * reason they were empty before — with nothing anywhere saying the mapping was
 * the problem.
 *
 * So `matchStats()` counts what actually matched, `refresh-kr.mjs` prints it,
 * and a run whose core concepts miss everywhere fails instead of committing
 * silence. Aliases below are therefore deliberately generous: a spurious extra
 * alias costs nothing, a missing one costs the entire board.
 */

/** DART statement divisions. SCE (equity changes) is deliberately unused. */
export const SJ = { BS: 'BS', IS: 'IS', CIS: 'CIS', CF: 'CF', SCE: 'SCE' };

/** The literal DART emits when a filer used a non-standard account code. */
export const NO_STANDARD_CODE = '-표준계정코드 미사용-';

/**
 * CONCEPTS key → { ids, names }.
 *
 * `ids`   XBRL account_id values, matched case-insensitively after stripping
 *         any namespace prefix, so `ifrs-full_Revenue`, `ifrs_Revenue` and
 *         `dart_Revenue` all resolve to `Revenue`.
 * `names` Korean account_nm values, matched after whitespace removal, so
 *         "매출액", "매 출 액" and "매출액 " are one thing.
 *
 * Order within each list is preference order: the first match wins, exactly as
 * CONCEPTS does for US tags.
 */
export const DART_ACCOUNTS = {
  // ── income statement (IS / CIS) ──────────────────────────────────────────
  revenue: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['Revenue', 'RevenueFromContractsWithCustomers', 'RevenueFromSaleOfGoods', 'GrossOperatingRevenue'],
    names: ['매출액', '수익(매출액)', '영업수익', '매출', '수익'],
  },
  grossProfit: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['GrossProfit'],
    names: ['매출총이익', '매출총이익(손실)'],
  },
  operatingIncome: {
    sj: [SJ.IS, SJ.CIS],
    // OperatingIncomeLoss is a DART extension, not core IFRS — Korea mandates
    // an operating-profit line that IFRS itself does not define.
    ids: ['OperatingIncomeLoss', 'OperatingIncome', 'ProfitLossFromOperatingActivities'],
    names: ['영업이익', '영업이익(손실)', '영업손익'],
  },
  netIncome: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['ProfitLoss', 'ProfitLossAttributableToOwnersOfParent'],
    names: ['당기순이익', '당기순이익(손실)', '당기순손익', '분기순이익', '반기순이익'],
  },
  pretaxIncome: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['ProfitLossBeforeTax', 'ProfitLossBeforeIncomeTax'],
    names: ['법인세비용차감전순이익', '법인세비용차감전순이익(손실)', '법인세차감전순이익'],
  },
  incomeTaxExpense: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['IncomeTaxExpenseContinuingOperations', 'IncomeTaxExpenseBenefit', 'IncomeTaxExpense'],
    names: ['법인세비용', '법인세비용(수익)'],
  },
  interestExpense: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['FinanceCosts', 'InterestExpense', 'FinanceCostsIncurred'],
    names: ['금융원가', '이자비용', '금융비용'],
  },

  // ── cash flow (CF) ───────────────────────────────────────────────────────
  operatingCashFlow: {
    sj: [SJ.CF],
    ids: ['CashFlowsFromUsedInOperatingActivities', 'NetCashFlowsFromUsedInOperatingActivities'],
    names: ['영업활동현금흐름', '영업활동으로인한현금흐름', '영업활동순현금흐름'],
  },
  capex: {
    sj: [SJ.CF],
    ids: [
      'PurchaseOfPropertyPlantAndEquipmentClassifiedAsInvestingActivities',
      'PurchaseOfPropertyPlantAndEquipment',
      'PurchaseOfIntangibleAssetsClassifiedAsInvestingActivities',
    ],
    names: ['유형자산의취득', '유형자산의증가', '유형자산취득'],
  },
  dividendsPaid: {
    sj: [SJ.CF],
    ids: ['DividendsPaidClassifiedAsFinancingActivities', 'DividendsPaid'],
    names: ['배당금지급', '배당금의지급', '현금배당금의지급'],
  },
  researchAndDevelopment: {
    sj: [SJ.IS, SJ.CIS],
    ids: ['ResearchAndDevelopmentExpense'],
    names: ['경상연구개발비', '연구개발비'],
  },
  acquisitions: {
    sj: [SJ.CF],
    ids: [
      'CashFlowsUsedInObtainingControlOfSubsidiariesOrOtherBusinessesClassifiedAsInvestingActivities',
      'PaymentsToAcquireBusinessesNetOfCashAcquired',
    ],
    names: ['종속기업의취득', '사업결합으로인한현금유출', '종속기업투자주식의취득'],
  },

  // ── balance sheet (BS) — instantaneous ───────────────────────────────────
  totalAssets: {
    sj: [SJ.BS],
    ids: ['Assets'],
    names: ['자산총계', '자산총액'],
  },
  totalEquity: {
    sj: [SJ.BS],
    ids: ['Equity', 'EquityAttributableToOwnersOfParent'],
    names: ['자본총계', '자본총액'],
  },
  cash: {
    sj: [SJ.BS],
    ids: ['CashAndCashEquivalents', 'CashAndCashEquivalentsAtEndOfPeriod'],
    names: ['현금및현금성자산'],
  },
  longTermDebt: {
    sj: [SJ.BS],
    ids: ['NoncurrentPortionOfNoncurrentBorrowings', 'LongtermBorrowings', 'NoncurrentBorrowings'],
    names: ['장기차입금', '비유동차입금', '사채'],
  },
  shortTermDebt: {
    sj: [SJ.BS],
    ids: ['ShorttermBorrowings', 'CurrentPortionOfLongtermBorrowings', 'CurrentBorrowings'],
    names: ['단기차입금', '유동성장기부채', '유동차입금'],
  },
  currentAssets: {
    sj: [SJ.BS],
    ids: ['CurrentAssets'],
    names: ['유동자산'],
  },
  currentLiabilities: {
    sj: [SJ.BS],
    ids: ['CurrentLiabilities'],
    names: ['유동부채'],
  },
  // sharesOutstanding is NOT here on purpose: DART's statement endpoint does
  // not carry a share count. refresh-kr already stores one per day from the
  // KRX mirror, and that stays the source for it.
};

/** Concepts without which a Korean statement is not worth storing. */
export const CORE_CONCEPTS = ['revenue', 'netIncome', 'totalAssets', 'totalEquity'];

// ───────────────────────────────────────────────────────────────── matching ──

/** Strip the XBRL namespace and lowercase: `ifrs-full_Revenue` → `revenue`. */
function normalizeId(id) {
  if (typeof id !== 'string') return '';
  const s = id.trim();
  if (!s || s === NO_STANDARD_CODE) return '';
  const bare = s.includes('_') ? s.slice(s.lastIndexOf('_') + 1) : s;
  return bare.toLowerCase();
}

/**
 * Remove every space and the bracketed qualifiers Korean statements append.
 * "당기순이익(손실)" → "당기순이익", "매 출 액" → "매출액".
 *
 * The bracket strip is what makes one alias cover the "(손실)" / "(수익)" pairs
 * that otherwise double the table for no information.
 */
function normalizeName(nm) {
  if (typeof nm !== 'string') return '';
  return nm.replace(/\([^)]*\)/g, '').replace(/[\s ]/g, '').trim();
}

/** Build the lookup once per process rather than per row. */
function buildIndex() {
  const byId = new Map();
  const byName = new Map();
  for (const [concept, spec] of Object.entries(DART_ACCOUNTS)) {
    for (const id of spec.ids) {
      const k = normalizeId(id);
      if (k && !byId.has(k)) byId.set(k, concept);
    }
    for (const nm of spec.names) {
      const k = normalizeName(nm);
      if (k && !byName.has(k)) byName.set(k, concept);
    }
  }
  return { byId, byName };
}
const INDEX = buildIndex();

/**
 * Which CONCEPTS key, if any, a single DART row represents.
 * Returns `{ concept, via }` so callers can report HOW it matched — the id and
 * name paths failing have different causes and different fixes.
 */
export function conceptForRow(row) {
  const byId = INDEX.byId.get(normalizeId(row?.account_id));
  if (byId) return { concept: byId, via: 'account_id' };
  const byName = INDEX.byName.get(normalizeName(row?.account_nm));
  if (byName) return { concept: byName, via: 'account_nm' };
  return { concept: null, via: null };
}

/**
 * DART amounts arrive as strings with thousands separators, and a blank string
 * for "not reported". Negatives appear both as -1,234 and as (1,234).
 *
 * `''` must become null, never 0 — the project's rule that a missing factor is
 * an absence rather than a value starts at the parser.
 */
export function parseAmount(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  let s = v.trim();
  if (!s || s === '-') return null;
  let negative = false;
  if (s.startsWith('(') && s.endsWith(')')) { negative = true; s = s.slice(1, -1); }
  s = s.replace(/,/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

// ──────────────────────────────────────────────────────── period assembly ──

/** reprt_code → months of the fiscal year the report cumulatively covers. */
export const REPORT_MONTHS = { 11013: 3, 11012: 6, 11014: 9, 11011: 12 };
/** The four report codes, in fiscal order. */
export const REPORT_ORDER = ['11013', '11012', '11014', '11011'];

/**
 * Period end for a report, derived from the fiscal year and the report code.
 *
 * DART's full-statement response carries no period-end DATE — only `bsns_year`
 * and a Korean period label ("제 55 기"). The end therefore has to be derived,
 * and deriving it assumes a December fiscal year end.
 *
 * That assumption is safe for the overwhelming majority of KOSPI/KOSDAQ issuers
 * but it is NOT universal, and a non-December filer will have its periods
 * stamped up to eleven months wrong. Recorded in METHODOLOGY §1.2 as a known
 * limitation rather than hidden, because a wrong period end silently corrupts
 * every year-over-year comparison built on top of it.
 */
export function periodEnd(bsnsYear, reprtCode) {
  const y = Number(bsnsYear);
  if (!Number.isInteger(y)) return null;
  const months = REPORT_MONTHS[Number(reprtCode)];
  if (!months) return null;
  const endMonth = months;                       // 3 → March, 12 → December
  const lastDay = new Date(Date.UTC(y, endMonth, 0)).getUTCDate();
  return `${y}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

/**
 * Filing date from the receipt number. `rcept_no` is 14 digits whose first 8
 * are the acceptance date: 20240315000123 → 2024-03-15.
 *
 * This is the point-in-time anchor (METHODOLOGY P2). Without it the only date
 * available is the fiscal year, and scoring a 2024 annual statement as if it
 * had been knowable in January 2024 is look-ahead of up to three months —
 * exactly the error the US path avoids by keying on SEC's `filed`.
 */
export function filedFromRcept(rceptNo) {
  const s = String(rceptNo ?? '');
  if (!/^\d{8}/.test(s)) return null;
  const d = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
  return Number.isNaN(Date.parse(d)) ? null : d;
}

/**
 * Reduce one report's rows to `{ concept: value }`, keeping both the
 * cumulative-to-date reading and the period-only reading where they differ.
 *
 * Returns `{ values, cumulative, stats }`:
 *   values      period-only amounts where DART gave one (`thstrm_amount`)
 *   cumulative  year-to-date amounts (`thstrm_add_amount`), when present
 *   stats       per-concept match counts, for the coverage report
 *
 * Both readings are kept because the API documents `thstrm_amount` as the
 * three-month figure on a quarterly report while `thstrm_add_amount` carries
 * the year-to-date one — but which fields a given filer populates varies, and
 * that could not be verified against a live response while this was written.
 * Keeping both lets `quartersFromReports` prefer whichever is actually there
 * and lets the run report which path it used.
 */
export function readReport(rows) {
  const values = {};
  const cumulative = {};
  const stats = { rows: 0, matched: 0, viaId: 0, viaName: 0, unmatched: [] };

  for (const row of rows ?? []) {
    stats.rows++;
    const { concept, via } = conceptForRow(row);
    if (!concept) {
      if (stats.unmatched.length < 12) stats.unmatched.push(row?.account_nm ?? row?.account_id ?? '?');
      continue;
    }
    const spec = DART_ACCOUNTS[concept];
    // A concept only counts from the statement it belongs to. "현금및현금성자산"
    // appears in the cash flow statement too, as the closing cash line, and
    // taking that as the balance-sheet figure would be right by luck at best.
    if (spec.sj && row.sj_div && !spec.sj.includes(row.sj_div)) continue;

    stats.matched++;
    if (via === 'account_id') stats.viaId++; else stats.viaName++;

    const period = parseAmount(row.thstrm_amount);
    const ytd = parseAmount(row.thstrm_add_amount);
    // First match wins, matching the CONCEPTS preference-order convention.
    if (period !== null && values[concept] === undefined) values[concept] = period;
    if (ytd !== null && cumulative[concept] === undefined) cumulative[concept] = ytd;
  }
  return { values, cumulative, stats };
}

/** Concepts that are stocks, not flows — never differenced. */
const INSTANT_CONCEPTS = new Set([
  'totalAssets', 'totalEquity', 'cash', 'longTermDebt', 'shortTermDebt',
  'currentAssets', 'currentLiabilities',
]);

/**
 * Turn a fiscal year's reports into quarterly records.
 *
 * ── The one genuinely hard part of this file ────────────────────────────────
 *
 * A Korean quarterly report states income and cash-flow figures for a period,
 * but WHICH period depends on the field:
 *
 *   thstrm_amount      documented as the three-month figure on a quarterly
 *                      report — already what we want.
 *   thstrm_add_amount  the year-to-date figure. Q3's is nine months, and
 *                      storing that as one quarter overstates it threefold.
 *
 * Which of the two a filer populates is not consistent, and it could not be
 * checked against a live response while this was written. So both are handled:
 * a year-to-date reading is differenced against the previous quarter's, a
 * period reading is taken as-is, and `basis` records which happened so the
 * first live run reports it instead of leaving it to be discovered from a
 * misshapen chart.
 *
 * The annual report is never treated as a fourth quarter. It covers twelve
 * months; Q4 is derived by subtracting the first three quarters, and only when
 * all three are present. This is the same trap the US path documents.
 */
export function quartersFromReports(reportsByCode) {
  const out = [];
  let priorYtd = {};
  let priorEnd = null;

  for (const code of REPORT_ORDER) {
    const rep = reportsByCode[code];
    if (!rep) { priorYtd = {}; continue; }

    const { values, cumulative, filed, end } = rep;
    const row = { end, filed, basis: {} };

    for (const concept of Object.keys(DART_ACCOUNTS)) {
      if (INSTANT_CONCEPTS.has(concept)) {
        // Balance-sheet lines are the balance ON that date. No differencing.
        if (values[concept] !== undefined) row[concept] = values[concept];
        else if (cumulative[concept] !== undefined) row[concept] = cumulative[concept];
        continue;
      }

      const ytd = cumulative[concept];
      const period = values[concept];

      if (code === '11013') {
        // Q1: three months and year-to-date are the same span.
        const v = period ?? ytd;
        if (v !== undefined) { row[concept] = v; row.basis[concept] = 'q1'; }
      } else if (code === '11011') {
        // The annual report is twelve months. Q4 only, and only if derivable.
        const annual = ytd ?? period;
        if (annual === undefined) continue;
        const q1 = out.find((r) => r._code === '11013')?.[concept];
        const q2 = out.find((r) => r._code === '11012')?.[concept];
        const q3 = out.find((r) => r._code === '11014')?.[concept];
        if ([q1, q2, q3].every((x) => typeof x === 'number')) {
          row[concept] = annual - q1 - q2 - q3;
          row.basis[concept] = 'derived_q4';
        }
      } else if (ytd !== undefined && priorYtd[concept] !== undefined) {
        row[concept] = ytd - priorYtd[concept];
        row.basis[concept] = 'differenced';
      } else if (period !== undefined) {
        row[concept] = period;
        row.basis[concept] = 'period';
      }
    }

    row._code = code;
    priorYtd = { ...priorYtd, ...cumulative };
    priorEnd = end;
    // A record with no flow figure at all is noise; drop it rather than store
    // an empty period that later looks like a reporting gap.
    const hasAny = Object.keys(DART_ACCOUNTS).some((k) => typeof row[k] === 'number');
    if (hasAny) out.push(row);
  }

  return out.map(({ _code, ...rest }) => rest);
}

/** The annual (12-month) record for one fiscal year, from its annual report. */
export function annualFromReport(rep, fy) {
  if (!rep) return null;
  const row = { fy: Number(fy), end: rep.end, filed: rep.filed };
  let any = false;
  for (const concept of Object.keys(DART_ACCOUNTS)) {
    const v = INSTANT_CONCEPTS.has(concept)
      ? (rep.values[concept] ?? rep.cumulative[concept])
      : (rep.cumulative[concept] ?? rep.values[concept]);
    if (v !== undefined) { row[concept] = v; any = true; }
  }
  return any ? row : null;
}

/** Latest balance-sheet snapshot across reports, newest first wins. */
export function balanceFromReports(reports) {
  const b = {};
  const newestFirst = [...reports].sort((a, b2) => (a.end < b2.end ? 1 : -1));
  for (const rep of newestFirst) {
    for (const concept of INSTANT_CONCEPTS) {
      if (b[concept] === undefined) {
        const v = rep.values[concept] ?? rep.cumulative[concept];
        if (v !== undefined) b[concept] = v;
      }
    }
  }
  return Object.keys(b).length ? b : null;
}
