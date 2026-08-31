/**
 * Data source adapters. Every keyless source the pipeline uses, with the
 * research findings that justified (or disqualified) each one recorded inline.
 *
 * Verification status as of 2026-08-15:
 *   [V] response observed directly during research
 *   [S] documented in current library source read directly from GitHub
 *   [U] unverified — must be confirmed by the first live Actions run
 *
 * DISQUALIFIED SOURCES, and why — do not re-add without re-testing:
 *
 *   data.krx.co.kr  — KRX moved to a membership model on 2025-12-27 and made
 *                     login mandatory (pykrx#244). Anonymous access to
 *                     MDCSTAT endpoints can no longer be relied on, and the
 *                     endpoints also rate-limit by IP, which is hazardous on
 *                     shared Actions egress. Replaced by the GitHub-hosted
 *                     mirror below.
 *   Stooq (primary) — pandas-datareader REMOVED its Stooq reader from master;
 *                     it survives only in the v0.10.0 tag. The service returns
 *                     "Exceeded the daily hits limit" as a plain-text body with
 *                     HTTP 200, which silently corrupts naive CSV parsers. Kept
 *                     only as a fallback, behind a body sniff.
 *   Yahoo v7 quote  — now requires cookie+crumb authentication.
 *   Seeking Alpha   — robots.txt disallows; actively blocks bots.
 *   SEC getcurrent  — robots.txt explicitly disallows action=getcurrent. The
 *                     per-company action=getcompany form IS allowed.
 *   DART OpenAPI    — best Korean fundamentals by a wide margin, but needs a
 *                     (free) key. Implemented below and wired into
 *                     refresh-kr.mjs as an OPTIONAL enhancement: without
 *                     DART_KEY the Korean pipeline runs exactly as before, and
 *                     with it three Korean boards become computable. See
 *                     scripts/lib/dart.mjs for the account mapping.
 */

import { inflateRawSync } from 'node:zlib';
import { fetchJson, fetchText, fetchWithRetry, UA_BROWSER, UA_SEC } from './http.mjs';

// ═══════════════════════════════════════════════════════════════════ US ═══

/** [V] Object keyed by stringified index — NOT an array. `cik_str` is a number. */
export async function fetchUsTickerMap() {
  const raw = await fetchJson('https://www.sec.gov/files/company_tickers.json', { ua: UA_SEC });
  const out = [];
  for (const key of Object.keys(raw)) {
    const r = raw[key];
    if (!r || !r.ticker) continue;
    out.push({
      ticker: String(r.ticker).toUpperCase(),
      cik: String(r.cik_str).padStart(10, '0'),
      name: r.title,
      // Preserve source order — the file is generated in market-cap order, which
      // is the only free large-cap proxy available before prices are loaded.
      order: out.length,
    });
  }
  return out;
}

/**
 * [V] XBRL frames: one fact per filer for one calendrical period.
 * Duration periods look like CY2025Q2; instantaneous ones carry a trailing I
 * (CY2025Q2I) and their items have NO `start` field. Wrong form → HTTP 404.
 */
export async function fetchFrame(tag, unit, period, taxonomy = 'us-gaap') {
  const url = `https://data.sec.gov/api/xbrl/frames/${taxonomy}/${tag}/${unit}/${period}.json`;
  const j = await fetchJson(url, { ua: UA_SEC });
  return j?.data ?? [];
}

/**
 * [V] Revenue tags in resolution order. No single tag covers the market:
 * measured on CY2024Q1, RevenueFromContractWithCustomerExcludingAssessedTax
 * had 2654 filers and Revenues had 2094 — overlapping but neither sufficient.
 * First hit per CIK wins.
 */
export const REVENUE_TAGS = [
  'RevenueFromContractWithCustomerExcludingAssessedTax',
  'Revenues',
  'RevenueFromContractWithCustomerIncludingAssessedTax',
  'RevenuesNetOfInterestExpense',
  'SalesRevenueNet',
  'InterestAndDividendIncomeOperating',
  'PremiumsEarnedNet',
];

export const CONCEPTS = {
  revenue: REVENUE_TAGS,
  grossProfit: ['GrossProfit'],
  operatingIncome: ['OperatingIncomeLoss', 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest'],
  netIncome: ['NetIncomeLoss', 'ProfitLoss'],
  pretaxIncome: ['IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments'],
  incomeTaxExpense: ['IncomeTaxExpenseBenefit'],
  interestExpense: ['InterestExpense', 'InterestExpenseDebt'],
  operatingCashFlow: ['NetCashProvidedByUsedInOperatingActivities', 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations'],
  capex: ['PaymentsToAcquirePropertyPlantAndEquipment', 'PaymentsToAcquireProductiveAssets'],
  dividendsPaid: ['PaymentsOfDividendsCommonStock', 'PaymentsOfDividends'],
  // Both feed the reinvestment-rate factor. Capex alone understates
  // reinvestment for R&D-led and acquisitive compounders — see derive.mjs.
  researchAndDevelopment: ['ResearchAndDevelopmentExpense'],
  acquisitions: ['PaymentsToAcquireBusinessesNetOfCashAcquired', 'PaymentsToAcquireBusinessesAndInterestInAffiliatesGross'],
  // Instantaneous (balance sheet) — must be requested with the "I" period form.
  totalAssets: ['Assets'],
  totalEquity: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'],
  cash: ['CashAndCashEquivalentsAtCarryingValue', 'CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents'],
  longTermDebt: ['LongTermDebtNoncurrent', 'LongTermDebt'],
  shortTermDebt: ['ShortTermBorrowings', 'LongTermDebtCurrent'],
  currentAssets: ['AssetsCurrent'],
  currentLiabilities: ['LiabilitiesCurrent'],
  sharesOutstanding: ['CommonStockSharesOutstanding', 'CommonStockSharesIssued'],
};

export const INSTANTANEOUS = new Set([
  'totalAssets', 'totalEquity', 'cash', 'longTermDebt', 'shortTermDebt',
  'currentAssets', 'currentLiabilities', 'sharesOutstanding',
]);

/**
 * [V] Full fact history for one company, used for the long-horizon boards where
 * a decade of annual data is required and frames would need 40+ calls.
 *
 * Point-in-time filtering (METHODOLOGY P2) happens here: an entry is only
 * visible if `filed <= asOf`. Entries carrying a `frame` key are SEC's own
 * canonical pick for that period, which is the cleanest way to drop restatements.
 */
export async function fetchCompanyFacts(cik) {
  return fetchJson(`https://data.sec.gov/api/xbrl/companyfacts/CIK${cik}.json`, { ua: UA_SEC });
}

/**
 * [V] Company profile — the ONLY keyless source of a filer's industry code.
 *
 * `companyfacts` carries financial facts and nothing else: no SIC, no industry,
 * no exchange. The submissions endpoint carries all three at the top level.
 * That distinction is why every US row shipped with `sector: null` until this
 * was added; see scripts/lib/sic.mjs for what that cost.
 *
 * The response is ~160KB because it embeds the filer's entire recent filing
 * history, of which we want four scalar fields. That is why callers cache the
 * result permanently in the store and top up under a budget rather than
 * refetching: a company's SIC changes roughly never, and re-downloading 30MB a
 * day to re-learn that NVIDIA is still SIC 3674 would be indefensible.
 */
export async function fetchSecProfile(cik) {
  const j = await fetchJson(`https://data.sec.gov/submissions/CIK${cik}.json`, { ua: UA_SEC });
  const sic = Number.parseInt(j?.sic, 10);
  return {
    cik,
    name: j?.name ?? null,
    sic: Number.isFinite(sic) && sic > 0 ? sic : null,
    sicDescription: j?.sicDescription ?? null,
    exchanges: Array.isArray(j?.exchanges) ? j.exchanges : [],
  };
}

export function extractConcept(facts, conceptKey, { asOf, annualOnly = false } = {}) {
  const tags = CONCEPTS[conceptKey] ?? [];
  const cutoff = asOf ? new Date(asOf) : null;

  for (const tag of tags) {
    const node = facts?.facts?.['us-gaap']?.[tag];
    if (!node?.units) continue;
    const unit = node.units.USD ?? node.units.shares ?? Object.values(node.units)[0];
    if (!Array.isArray(unit)) continue;

    let rows = unit.filter((e) => {
      if (cutoff && new Date(e.filed) > cutoff) return false; // P2 — no look-ahead
      if (annualOnly) return e.form === '10-K' && e.fp === 'FY';
      return e.form === '10-K' || e.form === '10-Q';
    });
    if (rows.length === 0) continue;

    // Deduplicate on period end, preferring the entry SEC tagged with a frame
    // (its canonical pick), then the most recently filed.
    const byEnd = new Map();
    for (const e of rows) {
      const key = e.end;
      const cur = byEnd.get(key);
      if (!cur) byEnd.set(key, e);
      else if (e.frame && !cur.frame) byEnd.set(key, e);
      else if (!!e.frame === !!cur.frame && new Date(e.filed) > new Date(cur.filed)) byEnd.set(key, e);
    }
    return [...byEnd.values()].sort((a, b) => new Date(a.end) - new Date(b.end));
  }
  return [];
}

/**
 * [S] Stooq daily CSV — FALLBACK ONLY. Header is `Date,Open,High,Low,Close,Volume`.
 * The rate-limit response is plain text with HTTP 200, so the body must be
 * sniffed before parsing or a limit message becomes a phantom price row.
 */
export async function fetchStooqDaily(symbol, { from, to } = {}) {
  const params = new URLSearchParams({ s: symbol, i: 'd' });
  if (from) params.set('d1', from);
  if (to) params.set('d2', to);
  const text = await fetchText(`https://stooq.com/q/d/l/?${params}`);
  if (!text.startsWith('Date,')) {
    throw new Error(`stooq returned non-CSV body: ${text.slice(0, 80)}`);
  }
  return parseOhlcvCsv(text);
}

export function parseOhlcvCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((s) => s.trim().toLowerCase());
  const idx = (n) => header.indexOf(n);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = lines[i].split(',');
    if (c.length < 5) continue;
    const bar = {
      date: c[idx('date')],
      open: Number(c[idx('open')]),
      high: Number(c[idx('high')]),
      low: Number(c[idx('low')]),
      close: Number(c[idx('close')]),
      volume: idx('volume') >= 0 ? Number(c[idx('volume')]) : 0,
    };
    if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)) continue;
    out.push(bar);
  }
  return out;
}

/**
 * [S/A] Yahoo v8 chart — keyless as of 2026 but REQUIRES a browser User-Agent
 * (default library UAs are rejected) and rate-limits aggressively from cloud
 * IPs. Primary US price source because it returns a year of bars per call,
 * which is far fewer requests than any per-day alternative.
 */
export async function fetchYahooChart(symbol, { range = '1y', interval = '1d' } = {}) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
  const j = await fetchJson(url, { ua: UA_BROWSER });
  const r = j?.chart?.result?.[0];
  if (!r || !Array.isArray(r.timestamp)) {
    const msg = j?.chart?.error?.description ?? 'no chart result';
    throw new Error(`yahoo: ${msg}`);
  }
  const q = r.indicators?.quote?.[0] ?? {};
  const adj = r.indicators?.adjclose?.[0]?.adjclose;
  const out = [];
  for (let i = 0; i < r.timestamp.length; i++) {
    const close = q.close?.[i];
    if (!Number.isFinite(close)) continue;
    // Adjusted close is used for return calculations; the split ratio is applied
    // to OHLC so the whole bar stays internally consistent. Mixing an adjusted
    // close with raw highs and lows silently corrupts every ATR and range factor.
    const ratio = Number.isFinite(adj?.[i]) && close > 0 ? adj[i] / close : 1;
    out.push({
      date: new Date(r.timestamp[i] * 1000).toISOString().slice(0, 10),
      open: num(q.open?.[i]) * ratio,
      high: num(q.high?.[i]) * ratio,
      low: num(q.low?.[i]) * ratio,
      close: close * ratio,
      volume: num(q.volume?.[i]),
    });
  }
  return out.filter((b) => Number.isFinite(b.open) && Number.isFinite(b.high) && b.high >= b.low);
}

const num = (x) => (Number.isFinite(x) ? x : NaN);

// ═══════════════════════════════════════════════════════════════════ KR ═══

/**
 * [V] KRX daily listing snapshot, mirrored on GitHub by FinanceData and
 * refreshed from Actions every 20 minutes during KRX hours.
 *
 * This is deliberately preferred over calling KRX directly: KRX made login
 * mandatory on 2025-12-27 and rate-limits by IP, while this mirror is GitHub
 * serving GitHub — no geo-blocking, no auth, no rate risk. One request returns
 * price + volume + market cap + share count for EVERY listed Korean stock.
 *
 * Caveats: third-party, no SLA, and files exist only for trading days, so the
 * caller walks backwards to find the most recent one.
 */
const KRX_MIRROR = 'https://raw.githubusercontent.com/FinanceData/fdr_krx_data_cache/master/data';

export async function fetchKrxListing(dateStr) {
  const text = await fetchText(`${KRX_MIRROR}/listing/krx/${dateStr}.csv`);
  return parseKrxListingCsv(text);
}

/** Walks back up to `maxBack` calendar days to find the latest trading day. */
export async function fetchLatestKrxListing(asOf = new Date(), maxBack = 10) {
  const errors = [];
  for (let i = 0; i < maxBack; i++) {
    const d = new Date(asOf.getTime() - i * 86_400_000);
    const s = d.toISOString().slice(0, 10);
    try {
      const rows = await fetchKrxListing(s);
      if (rows.length > 100) return { date: s, rows };
    } catch (err) {
      errors.push(`${s}: ${String(err.message ?? err).slice(0, 40)}`);
    }
  }
  throw new Error(`no KRX listing found in the last ${maxBack} days: ${errors.slice(0, 3).join('; ')}`);
}

/**
 * [V] Header (note the leading UTF-8 BOM on the first, unnamed index column):
 * ,Code,ISU_CD,Name,Market,Dept,Close,ChangeCode,Changes,ChagesRatio,Open,High,
 * Low,Volume,Amount,Marcap,Stocks,MarketId
 *
 * `ChagesRatio` is misspelled in the source data. Do not "fix" it.
 * Numerics arrive already unformatted (no thousands separators).
 */
export function parseKrxListingCsv(text) {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  const col = (n) => header.indexOf(n);
  const iCode = col('Code');
  const iName = col('Name');
  const iMarket = col('Market');
  const iDept = col('Dept');

  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    if (c.length < header.length - 1) continue;
    const code = c[iCode];
    if (!code) continue;
    out.push({
      code: String(code).padStart(6, '0'),
      isin: c[col('ISU_CD')] ?? null,
      name: c[iName],
      market: c[iMarket],
      dept: c[iDept] ?? '',
      close: Number(c[col('Close')]),
      changesRatio: Number(c[col('ChagesRatio')]),
      open: Number(c[col('Open')]),
      high: Number(c[col('High')]),
      low: Number(c[col('Low')]),
      volume: Number(c[col('Volume')]),
      amount: Number(c[col('Amount')]),
      marketCap: Number(c[col('Marcap')]),
      shares: Number(c[col('Stocks')]),
      marketId: c[col('MarketId')],
    });
  }
  return out;
}

/** [V] Sector / industry / listing date per Korean ticker. */
export async function fetchKrxDescriptions(dateStr) {
  const text = await fetchText(`${KRX_MIRROR}/listing/desc/${dateStr}.csv`);
  const clean = text.replace(/^﻿/, '');
  const lines = clean.trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  const col = (n) => header.indexOf(n);
  const map = new Map();
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    const code = c[col('Code')];
    if (!code) continue;
    map.set(String(code).padStart(6, '0'), {
      sector: c[col('Sector')] ?? null,
      industry: c[col('Industry')] ?? null,
      listingDate: c[col('ListingDate')] ?? null,
    });
  }
  return map;
}

/** [V] Korean index history (ks11 = KOSPI, kq11 = KOSDAQ) — a full year per file. */
export async function fetchKrIndexYear(index, year) {
  const text = await fetchText(`${KRX_MIRROR}/index/year_${index}/${year}.csv`);
  const lines = text.replace(/^﻿/, '').trim().split(/\r?\n/);
  const header = splitCsvLine(lines[0]);
  const col = (n) => header.indexOf(n);
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitCsvLine(lines[i]);
    const close = Number(c[col('Close')]);
    if (!Number.isFinite(close)) continue;
    out.push({
      date: c[col('Date')],
      open: Number(c[col('Open')]) || close,
      high: Number(c[col('High')]) || close,
      low: Number(c[col('Low')]) || close,
      close,
      volume: Number(c[col('Volume')]) || 0,
    });
  }
  return out;
}

/**
 * [S] Naver adjusted daily OHLCV. The response is a JS array literal, NOT
 * valid JSON — the header row uses single quotes while data rows use double
 * quotes, so JSON.parse throws on the raw body. Repairing quotes before parsing
 * is required, and is the single most common way this integration breaks.
 *
 * Columns: 날짜, 시가, 고가, 저가, 종가, 거래량, 외국인소진율.
 * Prices ARE split/dividend adjusted (수정주가) — this is why Naver is preferred
 * over the KRX snapshot for time series.
 *
 * [U] Behaviour from US datacenter IPs is UNVERIFIED. The first live Actions run
 * is the smoke test; refresh-kr.mjs degrades to mirror-derived bars on failure.
 */
export async function fetchNaverDaily(code, { start, end } = {}) {
  const params = new URLSearchParams({
    symbol: code,
    requestType: '1',
    startTime: start,
    endTime: end,
    timeframe: 'day',
  });
  const body = await fetchText(`https://api.finance.naver.com/siseJson.naver?${params}`, {
    ua: UA_BROWSER,
    headers: { Referer: 'https://finance.naver.com/' },
  });
  return parseNaverSiseJson(body);
}

export function parseNaverSiseJson(body) {
  const repaired = body.replace(/'/g, '"');
  let rows;
  try {
    rows = JSON.parse(repaired);
  } catch {
    throw new Error('naver siseJson: unparseable body after quote repair');
  }
  if (!Array.isArray(rows) || rows.length < 2) return [];
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!Array.isArray(r) || r.length < 6) continue;
    const d = String(r[0]);
    if (!/^\d{8}$/.test(d)) continue;
    const bar = {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      open: Number(r[1]),
      high: Number(r[2]),
      low: Number(r[3]),
      close: Number(r[4]),
      volume: Number(r[5]),
      foreignRatio: Number.isFinite(Number(r[6])) ? Number(r[6]) : null,
    };
    if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)) continue;
    out.push(bar);
  }
  return out;
}

/** [S] Older Naver XML chart endpoint. Not adjusted; fallback only. */
export async function fetchNaverXmlChart(code, count = 600) {
  const body = await fetchText(
    `https://fchart.stock.naver.com/sise.nhn?symbol=${code}&timeframe=day&count=${count}&requestType=0`,
    { ua: UA_BROWSER },
  );
  const out = [];
  for (const m of body.matchAll(/<item data="([^"]+)"\s*\/>/g)) {
    const p = m[1].split('|');
    if (p.length < 6) continue;
    const d = p[0];
    const bar = {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      open: Number(p[1]),
      high: Number(p[2]),
      low: Number(p[3]),
      close: Number(p[4]),
      volume: Number(p[5]),
    };
    if (![bar.open, bar.high, bar.low, bar.close].every(Number.isFinite)) continue;
    out.push(bar);
  }
  return out;
}

/**
 * Korean administrative flags, derived from the mirror's `Dept` column.
 * METHODOLOGY §1.2 excludes these outright — KRX has already flagged them as
 * hazardous and ranking one as a buy would be indefensible.
 */
const KR_HAZARD_FLAGS = ['관리종목', '투자주의', '투자경고', '투자위험', '거래정지', '정리매매', '환기종목'];

export function krHazardFlag(dept) {
  if (!dept) return null;
  for (const f of KR_HAZARD_FLAGS) if (dept.includes(f)) return f;
  return null;
}

/**
 * KRX enforces a ±30% daily price limit. A stock closing at the limit has a
 * censored price — the market did not finish discovering it — so it is dropped
 * from the ultra-short board. METHODOLOGY §1.2.
 */
export function isPriceLimited(changesRatio) {
  return Number.isFinite(changesRatio) && Math.abs(changesRatio) >= 29.5;
}

// ═════════════════════════════════════════════════════════════════ NEWS ═══

/**
 * [V] Every feed below returned real items with a recent newest-item date when
 * checked on 2026-08-15. `kind` feeds the source-credibility weight in the
 * sentiment model.
 *
 * Feeds are gated on newest-item AGE, not on status code — several finance
 * feeds return a perfectly healthy 200 with content that stopped updating
 * years ago, and a status check alone would keep them in the rotation.
 */
export const NEWS_FEEDS = [
  { id: 'yahoo-finance', url: 'https://finance.yahoo.com/news/rssindex', lang: 'en', kind: 'aggregator', name: 'Yahoo Finance' },
  { id: 'marketwatch', url: 'https://feeds.content.dowjones.io/public/rss/mw_topstories', lang: 'en', kind: 'wire', name: 'MarketWatch' },
  { id: 'nasdaq', url: 'https://www.nasdaq.com/feed/rssoutbound?category=Markets', lang: 'en', kind: 'wire', name: 'Nasdaq' },
  { id: 'investing-stocks', url: 'https://www.investing.com/rss/news_25.rss', lang: 'en', kind: 'aggregator', name: 'Investing.com' },
  { id: 'cnbc', url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html', lang: 'en', kind: 'wire', name: 'CNBC' },
  { id: 'hankyung-finance', url: 'https://www.hankyung.com/feed/finance', lang: 'ko', kind: 'wire', name: '한국경제 증권' },
  { id: 'hankyung-economy', url: 'https://www.hankyung.com/feed/economy', lang: 'ko', kind: 'wire', name: '한국경제 경제' },
  { id: 'edaily-all', url: 'https://rss.edaily.co.kr/edaily_news.xml', lang: 'ko', kind: 'wire', name: '이데일리' },
  { id: 'edaily-stock', url: 'https://rss.edaily.co.kr/stock_news.xml', lang: 'ko', kind: 'wire', name: '이데일리 증권' },
  { id: 'mk-stock', url: 'https://www.mk.co.kr/rss/30100041/', lang: 'ko', kind: 'wire', name: '매일경제 증권' },
];

/** A feed whose newest item is older than this is reported stale and dropped. */
export const FEED_STALE_HOURS = 96;

// ══════════════════════════════════════════════════════════════ HELPERS ═══

/** CSV splitter handling quoted fields containing commas (Korean industry names do). */
export function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// ═════════════════════════════════════════════════════════════════ DART ═══
//
// The Korean regulator's OpenAPI. Needs a free key; everything else in this
// file is keyless. Guarded so the pipeline degrades to its previous behaviour
// rather than failing when no key is configured.

const DART_BASE = 'https://opendart.fss.or.kr/api';

/**
 * Minimal ZIP reader — DART returns `corpCode.xml` as a ZIP archive, and a
 * single-purpose reader is preferable to a dependency for one call a week.
 *
 * Reads the CENTRAL DIRECTORY rather than local file headers on purpose. When
 * an archive is produced by streaming, bit 3 of the general-purpose flag is set
 * and the local header's sizes are both zero, with the real sizes trailing the
 * data in a descriptor. A naive local-header reader inflates zero bytes and
 * returns an empty string — no error, just no companies, which would look
 * exactly like "DART has no data for you".
 */
export function unzipFirstFile(buf) {
  const EOCD_SIG = 0x06054b50;
  let eocd = -1;
  // The comment field can be up to 64KB, so scan back over that window.
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 66_000); i--) {
    if (buf.readUInt32LE(i) === EOCD_SIG) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a ZIP archive: no end-of-central-directory record');

  const entries = buf.readUInt16LE(eocd + 10);
  if (entries < 1) throw new Error('ZIP archive contains no entries');
  const cdOffset = buf.readUInt32LE(eocd + 16);
  if (buf.readUInt32LE(cdOffset) !== 0x02014b50) throw new Error('ZIP central directory is malformed');

  const method = buf.readUInt16LE(cdOffset + 10);
  const compressedSize = buf.readUInt32LE(cdOffset + 20);
  const nameLen = buf.readUInt16LE(cdOffset + 28);
  const extraLen = buf.readUInt16LE(cdOffset + 30);
  const commentLen = buf.readUInt16LE(cdOffset + 32);
  const localOffset = buf.readUInt32LE(cdOffset + 42);
  const name = buf.toString('utf8', cdOffset + 46, cdOffset + 46 + nameLen);
  void extraLen; void commentLen;

  if (buf.readUInt32LE(localOffset) !== 0x04034b50) throw new Error('ZIP local header is malformed');
  const lNameLen = buf.readUInt16LE(localOffset + 26);
  const lExtraLen = buf.readUInt16LE(localOffset + 28);
  const dataStart = localOffset + 30 + lNameLen + lExtraLen;
  const data = buf.subarray(dataStart, dataStart + compressedSize);

  if (method === 0) return { name, text: data.toString('utf8') };
  if (method === 8) return { name, text: inflateRawSync(data).toString('utf8') };
  throw new Error(`unsupported ZIP compression method ${method}`);
}

/**
 * [U] Ticker → DART corp_code. One request returns every filer the regulator
 * knows, so it is fetched rarely and cached in the store.
 *
 * `stock_code` is blank for unlisted companies — the large majority of the
 * file. Only six-digit listed codes are kept, which is what maps onto the KRX
 * universe.
 */
export async function fetchDartCorpCodes(key) {
  // A generous timeout: this is the only multi-megabyte download in the
  // pipeline, and opendart.fss.or.kr is served from Korea, so a runner in a US
  // datacenter is a long way from it. The default 25s is comfortable for a JSON
  // response and marginal for this one.
  const res = await fetchWithRetry(`${DART_BASE}/corpCode.xml?crtfc_key=${encodeURIComponent(key)}`, {
    ua: UA_BROWSER, accept: 'application/zip,application/xml,*/*', timeoutMs: 90_000, retries: 4,
  });
  const buf = Buffer.from(await res.arrayBuffer());

  // An auth failure comes back as XML with an HTTP 200, not as an error status.
  if (buf.length > 5 && buf.subarray(0, 5).toString('utf8').startsWith('<?xml')) {
    const status = /<status>([^<]+)<\/status>/.exec(buf.toString('utf8'))?.[1];
    const message = /<message>([^<]+)<\/message>/.exec(buf.toString('utf8'))?.[1];
    throw new Error(`DART corpCode returned XML instead of a ZIP (status ${status ?? '?'}: ${message ?? 'unknown'})`);
  }

  const { text } = unzipFirstFile(buf);
  return parseDartCorpCodes(text);
}

/** Split out from the fetch so it can be tested without a key. */
export function parseDartCorpCodes(xml) {
  const out = [];
  for (const m of String(xml).matchAll(/<list>([\s\S]*?)<\/list>/g)) {
    const block = m[1];
    const field = (tag) => {
      const v = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`).exec(block)?.[1];
      return v === undefined ? null : v.trim();
    };
    const stockCode = field('stock_code');
    if (!stockCode || !/^\d{6}$/.test(stockCode)) continue;   // unlisted
    const corpCode = field('corp_code');
    if (!corpCode || !/^\d{8}$/.test(corpCode)) continue;
    out.push({
      corpCode,
      ticker: stockCode,
      name: field('corp_name'),
      nameEn: field('corp_eng_name'),
      modifiedAt: field('modify_date'),
    });
  }
  return out;
}

/**
 * [U] Full financial statements for one company, one fiscal year, one report.
 *
 * `fs_div` is CFS (consolidated) or OFS (individual). Consolidated is the right
 * basis for equity analysis — it is the economic entity a shareholder owns —
 * but a company with no subsidiaries files only OFS, so callers fall back.
 *
 * DART signals "no data" with status 013 and HTTP 200. That is a legitimate
 * answer for a year a company had not yet listed, so it returns null rather
 * than throwing: treating it as an error would abort a backfill on its first
 * young company.
 */
export async function fetchDartStatements(key, { corpCode, year, reprtCode, fsDiv = 'CFS' }) {
  const url = `${DART_BASE}/fnlttSinglAcntAll.json`
    + `?crtfc_key=${encodeURIComponent(key)}`
    + `&corp_code=${encodeURIComponent(corpCode)}`
    + `&bsns_year=${encodeURIComponent(year)}`
    + `&reprt_code=${encodeURIComponent(reprtCode)}`
    + `&fs_div=${encodeURIComponent(fsDiv)}`;
  const j = await fetchJson(url, { ua: UA_BROWSER });

  if (j?.status === '013') return null;                 // no statement filed
  if (j?.status && j.status !== '000') {
    const err = new Error(`DART status ${j.status}: ${j.message ?? 'unknown'}`);
    err.dartStatus = j.status;
    throw err;
  }
  return Array.isArray(j?.list) ? j.list : [];
}
