/**
 * Synthetic fixtures for offline testing.
 *
 * The sandbox this project was built in blocks every finance host, so the
 * pipeline has only ever been exercised against fixtures. These are shaped from
 * the response formats verified during source research — including, where it
 * matters, the awkward parts: Naver's single-quoted header row, the KRX
 * mirror's BOM and misspelled `ChagesRatio` column, SEC's instantaneous frames
 * having no `start` field.
 *
 * Deterministic: a fixed-seed PRNG, so a test failure is always reproducible.
 */

export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Geometric random walk with configurable drift and volatility. */
export function makeBars({
  n = 400, start = 100, drift = 0.0004, vol = 0.018, seed = 42,
  startDate = '2024-08-15', volume = 2_000_000, volTrend = 0,
} = {}) {
  const rng = mulberry32(seed);
  const bars = [];
  let price = start;
  const d0 = new Date(startDate);

  for (let i = 0; i < n; i++) {
    // Box–Muller for a normal shock.
    const u1 = Math.max(1e-9, rng());
    const u2 = rng();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const ret = drift + vol * z;
    const open = price;
    const close = Math.max(0.5, price * (1 + ret));
    const hi = Math.max(open, close) * (1 + Math.abs(z) * vol * 0.4);
    const lo = Math.min(open, close) * (1 - Math.abs(z) * vol * 0.4);
    const date = new Date(d0.getTime() + i * 86_400_000 * (7 / 5));

    bars.push({
      date: date.toISOString().slice(0, 10),
      open: r(open),
      high: r(hi),
      low: r(lo),
      close: r(close),
      volume: Math.round(volume * (1 + volTrend * (i / n)) * (0.6 + rng() * 0.8)),
    });
    price = close;
  }
  return bars;
}

const r = (x) => Math.round(x * 100) / 100;

/** Quarterly statements with controllable growth and margin. */
export function makeQuarters({
  n = 16, revenue0 = 1_000_000_000, growth = 0.03, margin = 0.20,
  marginTrend = 0, endDate = '2026-06-30', filedLagDays = 36,
} = {}) {
  const out = [];
  const end = new Date(endDate);
  for (let i = n - 1; i >= 0; i--) {
    const qEnd = new Date(end.getTime() - i * 91 * 86_400_000);
    const qStart = new Date(qEnd.getTime() - 90 * 86_400_000);
    const filed = new Date(qEnd.getTime() + filedLagDays * 86_400_000);
    const k = n - 1 - i;
    const revenue = revenue0 * (1 + growth) ** k;
    const m = margin + marginTrend * k;
    const operatingIncome = revenue * m;
    const netIncome = operatingIncome * 0.78;
    out.push({
      end: qEnd.toISOString().slice(0, 10),
      start: qStart.toISOString().slice(0, 10),
      filed: filed.toISOString().slice(0, 10),
      revenue,
      grossProfit: revenue * (m + 0.25),
      operatingIncome,
      netIncome,
      pretaxIncome: operatingIncome * 0.95,
      incomeTaxExpense: operatingIncome * 0.95 * 0.21,
      interestExpense: revenue * 0.005,
      operatingCashFlow: netIncome * 1.25,
      capex: revenue * 0.06,
      totalAssets: revenue * 4,
      totalEquity: revenue * 2.2,
      currentAssets: revenue * 1.4,
      currentLiabilities: revenue * 0.7,
      longTermDebt: revenue * 0.9,
      sharesOutstanding: 1_000_000_000 * (1 - 0.004 * k),
    });
  }
  return out;
}

export function makeAnnual({ n = 12, revenue0 = 3_000_000_000, growth = 0.11, margin = 0.42 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const revenue = revenue0 * (1 + growth) ** i;
    out.push({
      fy: 2015 + i,
      end: `${2015 + i}-12-31`,
      revenue,
      grossProfit: revenue * margin,
      operatingIncome: revenue * (margin - 0.16),
      netIncome: revenue * (margin - 0.2),
      operatingCashFlow: revenue * (margin - 0.12),
      capex: revenue * 0.05,
      totalAssets: revenue * 2.5,
      totalEquity: revenue * 1.4,
      sharesOutstanding: 2_000_000_000 * (1 - 0.012 * i),
    });
  }
  return out;
}

export function makeBalance({ revenue = 4_000_000_000 } = {}) {
  return {
    totalAssets: revenue * 3,
    totalEquity: revenue * 1.6,
    cash: revenue * 0.45,
    longTermDebt: revenue * 0.7,
    shortTermDebt: revenue * 0.08,
    currentAssets: revenue * 1.2,
    currentLiabilities: revenue * 0.6,
    sharesOutstanding: 1_200_000_000,
  };
}

// ── raw response fixtures, shaped from verified formats ────────────────────

/** Naver siseJson: header row uses SINGLE quotes, data rows use double. */
export const NAVER_SISE_JSON_BODY = `[['날짜', '시가', '고가', '저가', '종가', '거래량', '외국인소진율'],
["20260810", 71500, 72300, 71200, 72000, 11223344, 53.21],
["20260811", 72000, 72800, 71800, 72600, 9876543, 53.30],
["20260812", 72600, 73100, 72100, 72400, 10111213, 53.28],
["20260813", 72400, 74000, 72300, 73900, 15222333, 53.41],
["20260814", 74000, 74500, 73200, 73500, 12345678, 53.38]]`;

/** KRX mirror CSV: leading BOM, misspelled `ChagesRatio`, quoted industry names. */
export const KRX_LISTING_CSV = `﻿,Code,ISU_CD,Name,Market,Dept,Close,ChangeCode,Changes,ChagesRatio,Open,High,Low,Volume,Amount,Marcap,Stocks,MarketId
0,005930,KR7005930003,삼성전자,KOSPI,,274500,1,6500,2.43,275000,275500,266000,21669476,5874450961500,1604803477896000,5846278608,STK
1,000660,KR7000660001,SK하이닉스,KOSPI,,1645000,1,52000,3.26,1695000,1697000,1626000,4520990,7489699281000,1201659940425000,730492365,STK
2,373220,KR7373220003,LG에너지솔루션,KOSPI,,352000,2,-4500,-1.26,356000,357500,350000,285000,100320000000,82368000000000,234000000,STK
3,999999,KR7999999999,관리종목테스트,KOSDAQ,관리종목,1200,1,276,29.87,940,1200,940,5000000,6000000000,400000000000,333333333,KSQ`;

export const KRX_DESC_CSV = `﻿,Code,Name,Market,Sector,Industry,Products,ListingDate,SettleMonth,Representative,HomePage,Region
0,005930,삼성전자,KOSPI,전자부품 제조업,"통신 및 방송 장비 제조업, 반도체 제외",휴대폰,1975-06-11,12월,한종희,http://www.samsung.com,경기도
1,000660,SK하이닉스,KOSPI,반도체 제조업,반도체 제조업,DRAM,1996-12-26,12월,곽노정,https://www.skhynix.com,경기도`;

/** SEC frames: duration items have start+end, instantaneous items have end only. */
export const SEC_FRAME_DURATION = {
  taxonomy: 'us-gaap', tag: 'Revenues', ccp: 'CY2026Q1', uom: 'USD', label: 'Revenues', pts: 2,
  data: [
    { accn: '0000000000-26-000001', cik: 320193, entityName: 'Apple Inc.', loc: 'US-CA', start: '2026-01-01', end: '2026-03-31', val: 95_000_000_000 },
    { accn: '0000000000-26-000002', cik: 789019, entityName: 'MICROSOFT CORP', loc: 'US-WA', start: '2026-01-01', end: '2026-03-31', val: 70_000_000_000 },
  ],
};

export const SEC_FRAME_INSTANT = {
  taxonomy: 'us-gaap', tag: 'Assets', ccp: 'CY2026Q1I', uom: 'USD', label: 'Assets', pts: 2,
  data: [
    { accn: '0000000000-26-000001', cik: 320193, entityName: 'Apple Inc.', loc: 'US-CA', end: '2026-03-31', val: 360_000_000_000 },
    { accn: '0000000000-26-000003', cik: 1750, entityName: 'AAR CORP', loc: 'US-IL', end: '2026-02-28', val: 2_021_800_000 },
  ],
};

/** company_tickers.json is an OBJECT keyed by index, and cik_str is a NUMBER. */
export const SEC_TICKERS_JSON = {
  0: { cik_str: 1045810, ticker: 'NVDA', title: 'NVIDIA CORP' },
  1: { cik_str: 320193, ticker: 'AAPL', title: 'Apple Inc.' },
  2: { cik_str: 1652044, ticker: 'GOOGL', title: 'Alphabet Inc.' },
};

export function makeCompanyFacts({ cik = 320193, entityName = 'Apple Inc.', quarters = makeQuarters() } = {}) {
  const units = (field) =>
    quarters
      .filter((q) => Number.isFinite(q[field]))
      .map((q) => ({
        start: q.start, end: q.end, val: q[field], accn: `x-${q.end}`,
        fy: Number(q.end.slice(0, 4)), fp: 'Q2', form: '10-Q', filed: q.filed,
      }));

  return {
    cik, entityName,
    facts: {
      'us-gaap': {
        Revenues: { label: 'Revenues', units: { USD: units('revenue') } },
        OperatingIncomeLoss: { label: 'Operating Income', units: { USD: units('operatingIncome') } },
        NetIncomeLoss: { label: 'Net Income', units: { USD: units('netIncome') } },
        NetCashProvidedByUsedInOperatingActivities: { label: 'CFO', units: { USD: units('operatingCashFlow') } },
        PaymentsToAcquirePropertyPlantAndEquipment: { label: 'Capex', units: { USD: units('capex') } },
        Assets: {
          label: 'Assets',
          units: { USD: quarters.map((q) => ({ end: q.end, val: q.totalAssets, accn: `a-${q.end}`, fy: 2026, fp: 'Q2', form: '10-Q', filed: q.filed })) },
        },
        StockholdersEquity: {
          label: 'Equity',
          units: { USD: quarters.map((q) => ({ end: q.end, val: q.totalEquity, accn: `e-${q.end}`, fy: 2026, fp: 'Q2', form: '10-Q', filed: q.filed })) },
        },
      },
    },
  };
}

export const RSS_2_0 = `<?xml version="1.0"?><rss version="2.0"><channel>
<title>Test Wire</title>
<item><title>NVDA beats estimates as data centre revenue surges</title>
<link>https://example.com/a</link>
<description>Strong quarter</description>
<pubDate>Fri, 14 Aug 2026 13:48:00 GMT</pubDate></item>
<item><title>Apple (AAPL) slightly lowers guidance amid weak demand</title>
<link>https://example.com/b</link><pubDate>Fri, 14 Aug 2026 10:00:00 GMT</pubDate></item>
</channel></rss>`;

/** Atom puts the URL in an href attribute, not the element body. */
export const ATOM_FEED = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom">
<title>Atom Wire</title>
<entry><title>삼성전자, 반도체 수출 급등에 강세</title>
<link rel="alternate" href="https://example.com/ko1"/>
<updated>2026-08-14T22:00:01+09:00</updated></entry>
</feed>`;

/** Investing.com-style non-RFC-822 pubDate. */
export const RSS_SPACE_DATE = `<?xml version="1.0"?><rss version="2.0"><channel>
<item><title>Market rallies on rate cut hopes</title><link>https://example.com/c</link>
<pubDate>2026-08-15 11:49:49</pubDate></item>
</channel></rss>`;
