import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  krHazardFlag, isPriceLimited, parseKrxListingCsv, parseNaverSiseJson,
  parseOhlcvCsv, splitCsvLine, extractConcept, INSTANTANEOUS, CONCEPTS,
} from '../scripts/lib/sources.mjs';
import { parseFeed, clusterNews, mapItemsToTickers } from '../scripts/lib/news.mjs';
import { previousBoardFor } from '../scripts/lib/store.mjs';
import { aggregateSentiment, scoreHeadline, sentimentLabel } from '../scripts/lib/sentiment.mjs';
import {
  ATOM_FEED, KRX_DESC_CSV, KRX_LISTING_CSV, NAVER_SISE_JSON_BODY,
  RSS_2_0, RSS_SPACE_DATE, SEC_FRAME_INSTANT, SEC_FRAME_DURATION,
  SEC_TICKERS_JSON, makeCompanyFacts, makeQuarters,
} from './fixtures/generate.mjs';

// ── Naver ──────────────────────────────────────────────────────────────────

test('naver siseJson parses despite the single-quoted header row', () => {
  // JSON.parse throws on the raw body — the header uses single quotes while
  // data rows use double. This is the #1 way this integration breaks.
  assert.throws(() => JSON.parse(NAVER_SISE_JSON_BODY));
  const bars = parseNaverSiseJson(NAVER_SISE_JSON_BODY);
  assert.equal(bars.length, 5);
  assert.equal(bars[0].date, '2026-08-10');
  assert.equal(bars[0].close, 72000);
  assert.equal(bars[4].close, 73500);
  assert.equal(bars[0].foreignRatio, 53.21);
});

test('naver parser skips the header and any malformed rows', () => {
  const body = `[['날짜','시가','고가','저가','종가','거래량'],
["20260814", 100, 110, 90, 105, 1000],
["bad", 1, 2, 3, 4, 5],
["20260815", "x", 110, 90, 105, 1000]]`;
  const bars = parseNaverSiseJson(body);
  assert.equal(bars.length, 1);
  assert.equal(bars[0].date, '2026-08-14');
});

// ── KRX mirror ─────────────────────────────────────────────────────────────

test('KRX listing CSV parses through the BOM and the misspelled column', () => {
  const rows = parseKrxListingCsv(KRX_LISTING_CSV);
  assert.equal(rows.length, 4);
  assert.equal(rows[0].code, '005930');
  assert.equal(rows[0].name, '삼성전자');
  assert.equal(rows[0].close, 274500);
  // `ChagesRatio` is misspelled in the source data — reading `ChangesRatio`
  // would silently yield NaN and break the price-limit check.
  assert.equal(rows[0].changesRatio, 2.43);
  assert.equal(rows[0].marketCap, 1604803477896000);
});

test('KRX codes keep their leading zeros', () => {
  const csv = KRX_LISTING_CSV.replace('005930', '000020');
  const rows = parseKrxListingCsv(csv);
  assert.equal(rows[0].code, '000020');
  assert.equal(rows[0].code.length, 6);
});

test('quoted CSV fields containing commas survive', () => {
  // Korean industry names routinely contain commas inside quotes.
  const parts = splitCsvLine('0,005930,삼성전자,KOSPI,"통신 및 방송 장비 제조업, 반도체 제외",휴대폰');
  assert.equal(parts.length, 6);
  assert.equal(parts[4], '통신 및 방송 장비 제조업, 반도체 제외');
});

test('KRX description CSV keeps quoted industry text intact', () => {
  const lines = KRX_DESC_CSV.replace(/^﻿/, '').trim().split('\n');
  const parts = splitCsvLine(lines[1]);
  assert.ok(parts[5].includes('반도체 제외'));
});

test('administrative flags and price limits are detected', () => {
  const rows = parseKrxListingCsv(KRX_LISTING_CSV);
  const flagged = rows.find((r) => r.code === '999999');
  assert.equal(krHazardFlag(flagged.dept), '관리종목');
  assert.equal(krHazardFlag(''), null);
  // ±30% limit: a close at the limit is a censored price, not a discovered one.
  assert.equal(isPriceLimited(29.87), true);
  assert.equal(isPriceLimited(-30), true);
  assert.equal(isPriceLimited(12.5), false);
});

// ── SEC ────────────────────────────────────────────────────────────────────

test('SEC instantaneous frames have no start field; duration frames do', () => {
  assert.ok(SEC_FRAME_DURATION.data.every((d) => d.start && d.end));
  assert.ok(SEC_FRAME_INSTANT.data.every((d) => !d.start && d.end));
  // Period end dates vary per filer — SEC bins non-calendar fiscal quarters.
  const ends = new Set(SEC_FRAME_INSTANT.data.map((d) => d.end));
  assert.ok(ends.size > 1, 'end dates must not be assumed uniform');
});

test('company_tickers.json is an object with numeric cik_str', () => {
  assert.ok(!Array.isArray(SEC_TICKERS_JSON));
  assert.equal(typeof SEC_TICKERS_JSON['0'].cik_str, 'number');
  const padded = String(SEC_TICKERS_JSON['1'].cik_str).padStart(10, '0');
  assert.equal(padded, '0000320193');
});

test('extractConcept enforces point-in-time filtering on filed date', () => {
  // METHODOLOGY P2. A quarter that ended in June but was filed in August must
  // be invisible to a July score, or every backtest becomes fiction.
  const quarters = makeQuarters({ n: 8, endDate: '2026-06-30', filedLagDays: 36 });
  const facts = makeCompanyFacts({ quarters });

  const late = extractConcept(facts, 'revenue', { asOf: '2026-12-31' });
  const early = extractConcept(facts, 'revenue', { asOf: '2026-07-15' });
  assert.ok(late.length > early.length, 'later as-of must see more filings');
  for (const e of early) {
    assert.ok(new Date(e.filed) <= new Date('2026-07-15'), `leaked ${e.filed}`);
  }
});

test('extractConcept falls through the tag priority list', () => {
  // No single revenue tag covers the market; the union is required.
  assert.ok(CONCEPTS.revenue.length > 3);
  assert.equal(CONCEPTS.revenue[0], 'RevenueFromContractWithCustomerExcludingAssessedTax');
  assert.ok(CONCEPTS.revenue.includes('Revenues'));
  assert.ok(INSTANTANEOUS.has('totalAssets'));
  assert.ok(!INSTANTANEOUS.has('revenue'));
});

test('extractConcept deduplicates restatements on period end', () => {
  const facts = {
    facts: { 'us-gaap': { Revenues: { units: { USD: [
      { end: '2026-03-31', start: '2026-01-01', val: 100, filed: '2026-05-01', form: '10-Q', accn: 'a' },
      { end: '2026-03-31', start: '2026-01-01', val: 105, filed: '2026-08-01', form: '10-Q', accn: 'b' },
    ] } } } },
  };
  const rows = extractConcept(facts, 'revenue', { asOf: '2026-12-31' });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].val, 105, 'the later filing wins');
});

// ── generic CSV ────────────────────────────────────────────────────────────

test('OHLCV CSV parser tolerates a missing volume column', () => {
  const bars = parseOhlcvCsv('Date,Open,High,Low,Close\n2026-08-14,1,2,0.5,1.5\n');
  assert.equal(bars.length, 1);
  assert.equal(bars[0].volume, 0);
});

test('OHLCV CSV parser drops rows with non-numeric prices', () => {
  const bars = parseOhlcvCsv('Date,Open,High,Low,Close,Volume\n2026-08-14,x,2,1,1.5,10\n2026-08-15,1,2,1,1.5,10\n');
  assert.equal(bars.length, 1);
});

// ── feeds ──────────────────────────────────────────────────────────────────

const feed = { id: 'test', name: 'Test', lang: 'en', kind: 'wire' };

test('RSS 2.0 link is read from the element body', () => {
  const items = parseFeed(RSS_2_0, feed);
  assert.equal(items.length, 2);
  assert.equal(items[0].url, 'https://example.com/a');
});

test('Atom link is read from the href attribute', () => {
  // Handling only the RSS form silently drops every article from Atom feeds.
  const items = parseFeed(ATOM_FEED, { ...feed, lang: 'ko' });
  assert.equal(items.length, 1);
  assert.equal(items[0].url, 'https://example.com/ko1');
  assert.ok(items[0].title.includes('삼성전자'));
});

test('non-RFC-822 space-separated pubDate parses', () => {
  const items = parseFeed(RSS_SPACE_DATE, feed);
  assert.equal(items.length, 1);
  assert.ok(!Number.isNaN(new Date(items[0].publishedAt).getTime()));
});

test('CDATA and entities are decoded', () => {
  const xml = `<rss><channel><item><title><![CDATA[AT&amp;T &lt;beats&gt; estimates]]></title>
  <link>https://e.com/x</link><pubDate>Fri, 14 Aug 2026 10:00:00 GMT</pubDate></item></channel></rss>`;
  const items = parseFeed(xml, feed);
  assert.ok(items[0].title.includes('AT&T'));
  assert.ok(!items[0].title.includes('&amp;'));
});

// ── sentiment ──────────────────────────────────────────────────────────────

test('sentiment reads direction correctly', () => {
  assert.ok(scoreHeadline('Company beats estimates, raises guidance') > 0.3);
  assert.ok(scoreHeadline('Company misses estimates, cuts guidance amid lawsuit') < -0.3);
});

test('sentiment handles negation', () => {
  const plain = scoreHeadline('Company beats estimates');
  const negated = scoreHeadline('Company fails to beat estimates');
  assert.ok(negated < plain, `${negated} should be below ${plain}`);
});

test('modifiers scale magnitude', () => {
  const strong = scoreHeadline('Revenue significantly exceeds forecasts');
  const weak = scoreHeadline('Revenue slightly exceeds forecasts');
  assert.ok(strong > weak);
});

test('Korean sentiment matches stems inside inflected words', () => {
  assert.ok(scoreHeadline('삼성전자, 수출 급등에 강세') > 0);
  assert.ok(scoreHeadline('실적 부진에 급락, 목표가하향') < 0);
});

test('a headline with no sentiment terms scores null, not zero', () => {
  assert.equal(scoreHeadline('The company will hold its annual meeting on Tuesday'), null);
});

test('a ticker with no news aggregates to null, not neutral', () => {
  // Silence is absence of evidence. Scoring it 0 would place every unmentioned
  // stock at the exact median of the z-scored distribution.
  assert.equal(aggregateSentiment([], new Date()), null);
  assert.equal(aggregateSentiment(null), null);
});

test('a lone stale headline is shrunk toward neutral, not scored at full strength', () => {
  // The weighted mean num/den is scale-invariant, so without the evidence
  // shrink a single 36-hour-old aggregator item would score identically to a
  // fresh primary filing. That is the bug this asserts against.
  const now = new Date('2026-08-15T12:00:00Z');
  const headline = 'Company beats estimates and raises guidance';
  const fresh = aggregateSentiment([{ title: headline, publishedAt: '2026-08-15T11:00:00Z', kind: 'filing' }], now);
  const stale = aggregateSentiment([{ title: headline, publishedAt: '2026-08-14T00:00:00Z', kind: 'aggregator' }], now);

  assert.ok(fresh.score > 0);
  assert.ok(stale.score > 0);
  assert.ok(stale.score < fresh.score * 0.35, `stale ${stale.score} vs fresh ${fresh.score}`);
});

test('corroboration across outlets raises confidence', () => {
  const now = new Date('2026-08-15T12:00:00Z');
  const at = (h, kind) => ({ title: 'Company beats estimates and raises guidance', publishedAt: `2026-08-15T${h}:00:00Z`, kind });
  const one = aggregateSentiment([at('11', 'wire')], now);
  const many = aggregateSentiment([at('11', 'wire'), at('10', 'wire'), at('09', 'wire'), at('08', 'filing')], now);
  assert.ok(many.score > one.score, 'four corroborating sources must beat one');
  assert.ok(many.evidence > one.evidence);
});

test('items outside the 48h window are excluded', () => {
  const now = new Date('2026-08-15T12:00:00Z');
  const r = aggregateSentiment(
    [{ title: 'beats estimates', publishedAt: '2026-08-01T00:00:00Z', kind: 'wire' }],
    now,
  );
  assert.equal(r, null);
});

test('sentimentLabel buckets', () => {
  assert.equal(sentimentLabel(0.4), 'bullish');
  assert.equal(sentimentLabel(-0.4), 'bearish');
  assert.equal(sentimentLabel(0.05), 'neutral');
  assert.equal(sentimentLabel(null), 'unknown');
});

// ── mapping & clustering ───────────────────────────────────────────────────

const UNIVERSE = [
  { ticker: 'NVDA', name: 'NVIDIA Corporation', market: 'US' },
  { ticker: 'AAPL', name: 'Apple Inc.', market: 'US' },
  { ticker: 'ALL', name: 'Allstate Corp', market: 'US' },
  { ticker: '005930', name: '삼성전자', market: 'KR' },
];

test('common English words that are also tickers do not match', () => {
  // Without the stopword list, "ALL" maps half the market to every headline.
  const { byTicker } = mapItemsToTickers(
    [{ title: 'Stocks rise as ALL sectors gain', summary: '', publishedAt: '2026-08-15T00:00:00Z', sourceId: 's' }],
    UNIVERSE,
  );
  assert.ok(!byTicker.has('ALL'), 'bare "ALL" must not map to Allstate');
});

test('ticker-shaped mentions and company names both map', () => {
  const { byTicker } = mapItemsToTickers(
    [
      { title: 'NVDA surges on demand', summary: '', publishedAt: '2026-08-15T00:00:00Z', sourceId: 's' },
      { title: 'Apple launches new product', summary: '', publishedAt: '2026-08-15T00:00:00Z', sourceId: 's' },
      { title: '삼성전자 실적 발표', summary: '', publishedAt: '2026-08-15T00:00:00Z', sourceId: 's' },
    ],
    UNIVERSE,
  );
  assert.ok(byTicker.has('NVDA'));
  assert.ok(byTicker.has('AAPL'));
  assert.ok(byTicker.has('005930'));
});

test('clustering groups the same story across outlets', () => {
  const items = [
    { title: 'Fed signals rate cut in September meeting', publishedAt: '2026-08-15T10:00:00Z', sourceId: 'a', tickers: [] },
    { title: 'Fed signals September rate cut, markets rally', publishedAt: '2026-08-15T09:30:00Z', sourceId: 'b', tickers: [] },
    { title: 'Federal Reserve points to rate cut in September', publishedAt: '2026-08-15T09:00:00Z', sourceId: 'c', tickers: [] },
    { title: 'Boeing wins new widebody order from carrier', publishedAt: '2026-08-15T08:00:00Z', sourceId: 'a', tickers: [] },
  ];
  const clusters = clusterNews(items);
  assert.ok(clusters[0].size >= 2, `expected the Fed story to cluster, got size ${clusters[0].size}`);
  assert.ok(clusters[0].outlets >= 2);
  assert.ok(clusters.some((c) => c.headline.includes('Boeing')));
});

test('cluster matching does not weaken as the cluster grows', () => {
  // Scoring against the token UNION dilutes with size, making the fifth outlet
  // harder to match than the second. Member-wise scoring must not do that.
  const base = 'Nvidia announces new datacenter GPU architecture';
  const items = Array.from({ length: 6 }, (_, i) => ({
    title: `${base} variant ${i}`,
    publishedAt: `2026-08-15T0${i}:00:00Z`,
    sourceId: `src${i}`,
    tickers: [],
  }));
  const clusters = clusterNews(items);
  assert.equal(clusters[0].size, 6, 'all six must land in one cluster');
});

test('four-digit years are dropped but other numbers are kept', () => {
  const items = [
    { title: 'GTA 6 delayed again', publishedAt: '2026-08-15T01:00:00Z', sourceId: 'a', tickers: [] },
    { title: 'GTA 6 slips further', publishedAt: '2026-08-15T02:00:00Z', sourceId: 'b', tickers: [] },
    { title: 'Outlook for 2026 revised', publishedAt: '2026-08-15T03:00:00Z', sourceId: 'c', tickers: [] },
    { title: 'Forecast for 2026 lowered', publishedAt: '2026-08-15T04:00:00Z', sourceId: 'd', tickers: [] },
  ];
  const clusters = clusterNews(items);
  const gta = clusters.find((c) => c.headline.includes('GTA'));
  assert.equal(gta.size, 2, '"6" must be a matching token');
  const year = clusters.find((c) => c.headline.includes('2026'));
  assert.equal(year.size, 1, 'a bare year must not be enough to cluster on');
});

// ── board persistence and replay ───────────────────────────────────────────

test('previousBoardFor returns the prior session when replaying the same date', () => {
  // Idempotency. Running the ranking twice for the same session must not let
  // the second run treat the FIRST run's output as yesterday — that silently
  // resets every movement badge to 0 and decays turnover toward zero without
  // the market having moved. The README's "check out any commit and re-run it"
  // claim depends on this.
  const stored = {
    current: [{ ticker: 'A', rank: 1 }],
    currentAsOf: '2026-08-14',
    prior: [{ ticker: 'B', rank: 1 }],
    priorAsOf: '2026-08-13',
  };
  assert.deepEqual(previousBoardFor(stored, '2026-08-14'), stored.prior, 'replay -> prior');
  assert.deepEqual(previousBoardFor(stored, '2026-08-15'), stored.current, 'new session -> current');
});

test('previousBoardFor is safe on a cold store', () => {
  assert.deepEqual(previousBoardFor({}, '2026-08-15'), []);
  assert.deepEqual(previousBoardFor({ current: [] }, null), []);
});
