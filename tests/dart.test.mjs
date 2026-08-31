import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  conceptForRow, parseAmount, readReport, quartersFromReports, annualFromReport,
  balanceFromReports, periodEnd, filedFromRcept, DART_ACCOUNTS, CORE_CONCEPTS,
} from '../scripts/lib/dart.mjs';
import { parseDartCorpCodes } from '../scripts/lib/sources.mjs';
import { makeDartReport, makeDartReportCashFlowFirst, makeCumulativeYear } from './fixtures/dart.mjs';

// ── account identification ─────────────────────────────────────────────────

test('an account is found by its XBRL id regardless of namespace', () => {
  assert.equal(conceptForRow({ account_id: 'ifrs-full_Revenue', account_nm: 'x' }).concept, 'revenue');
  assert.equal(conceptForRow({ account_id: 'ifrs_Revenue', account_nm: 'x' }).concept, 'revenue');
  assert.equal(conceptForRow({ account_id: 'dart_OperatingIncomeLoss', account_nm: 'x' }).concept, 'operatingIncome');
});

test('an account is found by its Korean name when the filer used a custom code', () => {
  // DART returns the literal "-표준계정코드 미사용-" here, and it is common.
  // Matching on account_id alone silently loses every such line.
  const r = { account_id: '-표준계정코드 미사용-', account_nm: '자산총계' };
  assert.deepEqual(conceptForRow(r), { concept: 'totalAssets', via: 'account_nm' });
});

test('bracketed qualifiers and spacing do not defeat the name match', () => {
  // "당기순이익(손실)" and "당기순이익" are the same line; so is "매 출 액".
  for (const nm of ['당기순이익', '당기순이익(손실)', '당기순손익']) {
    assert.equal(conceptForRow({ account_id: '-표준계정코드 미사용-', account_nm: nm }).concept, 'netIncome', nm);
  }
  assert.equal(conceptForRow({ account_id: '', account_nm: '매 출 액' }).concept, 'revenue');
});

test('a line that means nothing to the models matches nothing', () => {
  assert.equal(conceptForRow({ account_id: '-표준계정코드 미사용-', account_nm: '기타포괄손익' }).concept, null);
  assert.equal(conceptForRow({}).concept, null);
});

test('every concept the mapping names is one the factor models consume', async () => {
  // A typo here would map real data onto a key nothing reads — the data would
  // arrive, the board would stay empty, and nothing would report a problem.
  const { CONCEPTS } = await import('../scripts/lib/sources.mjs');
  for (const key of Object.keys(DART_ACCOUNTS)) {
    assert.ok(key in CONCEPTS, `DART maps "${key}", which is not a CONCEPTS key`);
  }
  for (const c of CORE_CONCEPTS) {
    assert.ok(c in DART_ACCOUNTS, `core concept "${c}" has no DART mapping`);
  }
});

// ── amounts ────────────────────────────────────────────────────────────────

test('amounts parse, and a blank is null rather than zero', () => {
  assert.equal(parseAmount('1,234,567'), 1234567);
  assert.equal(parseAmount('-1,234'), -1234);
  assert.equal(parseAmount('(9,000)'), -9000);   // accounting negative
  assert.equal(parseAmount('0'), 0);             // a real zero survives
  assert.equal(parseAmount(''), null);           // not reported
  assert.equal(parseAmount('-'), null);
  assert.equal(parseAmount('N/A'), null);
  assert.equal(parseAmount(undefined), null);
});

// ── statement reading ──────────────────────────────────────────────────────

test('a cash-flow line never overwrites the balance sheet line of the same name', () => {
  // Korean cash flow statements close with 현금및현금성자산 — the same name the
  // balance sheet uses. Without the sj_div guard the balance-sheet cash figure
  // becomes the year-end cash total, which is wrong and looks plausible.
  //
  // The CASH-FLOW-FIRST ordering is the point. With the balance sheet first,
  // "first match wins" makes this pass whether the guard exists or not — the
  // test would prove nothing. DART does not guarantee statement order.
  const { values } = readReport(makeDartReportCashFlowFirst({ scale: 1, ytd: 1 }));
  assert.equal(values.cash, 600_000, 'must be the balance-sheet figure');
  assert.notEqual(values.cash, 999_999_999, 'must not be the cash flow closing balance');

  // And the ordinary ordering must agree, or the guard has broken something.
  assert.equal(readReport(makeDartReport({ scale: 1, ytd: 1 })).values.cash, 600_000);
});

test('a filer using custom account codes is still fully read', () => {
  const std = readReport(makeDartReport({ ytd: 1, standardCodes: true }));
  const custom = readReport(makeDartReport({ ytd: 1, standardCodes: false }));
  assert.equal(custom.stats.viaId, 0, 'fixture should force the name path');
  assert.ok(custom.stats.viaName > 0);
  for (const c of CORE_CONCEPTS) {
    assert.equal(custom.values[c], std.values[c], `${c} must read the same either way`);
  }
});

// ── period assembly ────────────────────────────────────────────────────────

test('period ends derive from the fiscal year and report code', () => {
  assert.equal(periodEnd(2024, '11013'), '2024-03-31');
  assert.equal(periodEnd(2024, '11012'), '2024-06-30');
  assert.equal(periodEnd(2024, '11014'), '2024-09-30');
  assert.equal(periodEnd(2024, '11011'), '2024-12-31');
  assert.equal(periodEnd('bad', '11011'), null);
  assert.equal(periodEnd(2024, '99999'), null);
});

test('the filing date comes from the receipt number, not the fiscal year', () => {
  // Point-in-time (METHODOLOGY P2). A 2024 annual statement is not knowable in
  // January 2024; it is knowable when it was accepted, in March 2025.
  assert.equal(filedFromRcept('20250320000101'), '2025-03-20');
  assert.equal(filedFromRcept('nope'), null);
  assert.equal(filedFromRcept(undefined), null);
});

test('year-to-date and three-month filers produce identical quarters', () => {
  // The single hardest thing in this adapter. DART documents thstrm_amount as
  // the three-month figure and thstrm_add_amount as year-to-date, but which a
  // filer populates varies. Both must land on the same quarterly series or one
  // group of Korean companies silently reports triple the revenue of the other.
  const ytd = {
    11013: { end: '2024-03-31', filed: '2024-05-15', values: {}, cumulative: { revenue: 100 } },
    11012: { end: '2024-06-30', filed: '2024-08-14', values: {}, cumulative: { revenue: 250 } },
    11014: { end: '2024-09-30', filed: '2024-11-14', values: {}, cumulative: { revenue: 420 } },
  };
  const period = {
    11013: { end: '2024-03-31', filed: '2024-05-15', values: { revenue: 100 }, cumulative: {} },
    11012: { end: '2024-06-30', filed: '2024-08-14', values: { revenue: 150 }, cumulative: {} },
    11014: { end: '2024-09-30', filed: '2024-11-14', values: { revenue: 170 }, cumulative: {} },
  };
  const a = quartersFromReports(ytd).map((r) => r.revenue);
  const b = quartersFromReports(period).map((r) => r.revenue);
  assert.deepEqual(a, [100, 150, 170]);
  assert.deepEqual(b, [100, 150, 170]);
});

test('the annual report is never stored as a fourth quarter', () => {
  // A twelve-month figure filed as Q4 makes Q4 look four times the size of
  // every other quarter — the same trap the US path documents for 10-Ks.
  const reports = {
    11013: { end: '2024-03-31', filed: '2024-05-15', values: {}, cumulative: { revenue: 100 } },
    11012: { end: '2024-06-30', filed: '2024-08-14', values: {}, cumulative: { revenue: 250 } },
    11014: { end: '2024-09-30', filed: '2024-11-14', values: {}, cumulative: { revenue: 420 } },
    11011: { end: '2024-12-31', filed: '2025-03-20', values: {}, cumulative: { revenue: 600 } },
  };
  const qs = quartersFromReports(reports);
  const q4 = qs.find((r) => r.end === '2024-12-31');
  assert.equal(q4.revenue, 180, 'Q4 must be the annual minus the first three quarters');
  assert.equal(q4.basis.revenue, 'derived_q4');
  assert.ok(q4.revenue < 250, 'Q4 must not be the full-year figure');
});

test('Q4 is left out rather than guessed when a quarter is missing', () => {
  const reports = {
    11013: { end: '2024-03-31', filed: '2024-05-15', values: {}, cumulative: { revenue: 100 } },
    11011: { end: '2024-12-31', filed: '2025-03-20', values: {}, cumulative: { revenue: 600 } },
  };
  const q4 = quartersFromReports(reports).find((r) => r.end === '2024-12-31');
  assert.equal(q4, undefined, 'an underivable Q4 must be absent, not annual-minus-Q1');
});

test('balance-sheet lines are never differenced', () => {
  const reports = {
    11013: { end: '2024-03-31', filed: '2024-05-15', values: { totalAssets: 5000 }, cumulative: {} },
    11012: { end: '2024-06-30', filed: '2024-08-14', values: { totalAssets: 5200 }, cumulative: {} },
  };
  const qs = quartersFromReports(reports);
  assert.equal(qs[1].totalAssets, 5200, 'assets are a balance, not a flow');
});

test('annual records carry the fiscal year and a filing date', () => {
  const rep = { end: '2024-12-31', filed: '2025-03-20', values: {}, cumulative: { revenue: 600, netIncome: 75 } };
  const a = annualFromReport(rep, '2024');
  assert.equal(a.fy, 2024);
  assert.equal(a.revenue, 600);
  assert.equal(a.filed, '2025-03-20');
  assert.equal(annualFromReport(null, 2024), null);
});

test('the balance snapshot takes the newest period', () => {
  const reports = [
    { end: '2023-12-31', values: { totalAssets: 100 }, cumulative: {} },
    { end: '2024-12-31', values: { totalAssets: 130 }, cumulative: {} },
  ];
  assert.equal(balanceFromReports(reports).totalAssets, 130);
  assert.equal(balanceFromReports([{ end: '2024-12-31', values: {}, cumulative: {} }]), null);
});

// ── corp code file ─────────────────────────────────────────────────────────

test('only listed companies come out of the corp code file', () => {
  const xml = `<result>
    <list><corp_code>00126380</corp_code><corp_name>삼성전자</corp_name><corp_eng_name>SAMSUNG</corp_eng_name><stock_code>005930</stock_code><modify_date>20260101</modify_date></list>
    <list><corp_code>00999999</corp_code><corp_name>비상장</corp_name><corp_eng_name>Unlisted</corp_eng_name><stock_code> </stock_code><modify_date>20260101</modify_date></list>
    <list><corp_code>00888888</corp_code><corp_name>이상</corp_name><corp_eng_name>Odd</corp_eng_name><stock_code>12345</stock_code><modify_date>20260101</modify_date></list>
  </result>`;
  const rows = parseDartCorpCodes(xml);
  assert.equal(rows.length, 1, 'blank and malformed stock codes must be dropped');
  assert.deepEqual(rows[0], {
    corpCode: '00126380', ticker: '005930', name: '삼성전자',
    nameEn: 'SAMSUNG', modifiedAt: '20260101',
  });
});

// ── the optional-key contract ──────────────────────────────────────────────

test('no key means no DART calls and no failure', async () => {
  // The whole integration is optional. An unset secret expands to an empty
  // string in Actions, so "" must read as "not configured" rather than as a
  // key that happens to be bad — otherwise every run without DART would fail.
  const { fillFromDart } = await import('../scripts/refresh-kr.mjs');
  const prev = process.env.DART_KEY;
  const prevExit = process.exitCode;
  try {
    for (const value of [undefined, '']) {
      if (value === undefined) delete process.env.DART_KEY;
      else process.env.DART_KEY = value;
      process.exitCode = 0;
      const fundamentals = { companies: {} };
      const out = await fillFromDart([{ ticker: '005930' }], fundamentals, {});
      assert.equal(out.attempted, 0);
      assert.equal(out.coverage, null);
      assert.notEqual(process.exitCode, 1, 'an absent key must not fail the run');
      assert.deepEqual(fundamentals.companies, {}, 'nothing may be written without a key');
    }
  } finally {
    if (prev === undefined) delete process.env.DART_KEY; else process.env.DART_KEY = prev;
    process.exitCode = prevExit;
  }
});

test('a malformed key fails immediately rather than one request at a time', async () => {
  // A typo'd key would otherwise be discovered 400 failed requests later, with
  // the real cause buried in per-item errors.
  const { fillFromDart } = await import('../scripts/refresh-kr.mjs');
  const prev = process.env.DART_KEY;
  const prevExit = process.exitCode;
  try {
    process.env.DART_KEY = 'obviously-not-a-40-char-hex-key';
    process.exitCode = 0;
    const out = await fillFromDart([{ ticker: '005930' }], { companies: {} }, {});
    assert.equal(out.attempted, 0);
    assert.equal(process.exitCode, 1, 'a malformed key must fail the run loudly');
  } finally {
    if (prev === undefined) delete process.env.DART_KEY; else process.env.DART_KEY = prev;
    process.exitCode = prevExit;
  }
});

// ── cross-platform entry points ────────────────────────────────────────────

test('every runnable script detects being run directly, on any platform', async () => {
  // `file://${process.argv[1]}` yields `file://C:\Users\...` on Windows while
  // import.meta.url is `file:///C:/Users/...`. The comparison is therefore
  // always false there, so main() never runs, nothing prints, and the process
  // exits 0 — a script that reports success while doing nothing at all.
  //
  // Found when a verification script spawned build-rankings.mjs on Windows and
  // got back silence and a zero exit code.
  const { readFile } = await import('node:fs/promises');
  const scripts = [
    'build-rankings.mjs', 'evaluate.mjs', 'refresh-us.mjs',
    'refresh-kr.mjs', 'refresh-news.mjs', 'write-brief.mjs',
  ];
  for (const name of scripts) {
    const src = await readFile(new URL(`../scripts/${name}`, import.meta.url), 'utf8');
    assert.ok(
      src.includes('pathToFileURL(process.argv[1]).href'),
      `${name} must compare against pathToFileURL(process.argv[1]).href`,
    );
    assert.ok(
      !src.includes('`file://${process.argv[1]}`'),
      `${name} still uses the POSIX-only entry-point check`,
    );
  }
});

test('pathToFileURL round-trips the path Node reports for a script', async () => {
  const { pathToFileURL, fileURLToPath } = await import('node:url');
  const here = fileURLToPath(import.meta.url);
  assert.equal(pathToFileURL(here).href, import.meta.url);
});
