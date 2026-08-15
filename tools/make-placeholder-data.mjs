/**
 * Generates realistic PLACEHOLDER data files so the site builds and can be
 * reviewed before the real pipeline in scripts/ has ever run.
 *
 * Every file it writes carries "placeholder": true, which the UI reads and
 * surfaces as a visible notice. The real pipeline overwrites these files and
 * omits the flag.
 *
 *   node tools/make-placeholder-data.mjs
 *
 * Writes to both src/data/ (build-time import) and public/data/ (runtime poll).
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ------------------------------------------------------------------ */
/* deterministic PRNG so regenerating does not churn the diff          */
/* ------------------------------------------------------------------ */
let seed = 0x5f3759df;
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return ((seed >>> 0) % 1e6) / 1e6;
}
const between = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length) % arr.length];
const round = (v, d = 2) => Number(v.toFixed(d));

const GENERATED_AT = '2026-08-15T21:40:00.000Z';
const AS_OF = { US: '2026-08-14', KR: '2026-08-14' };

const FACTORS = {
  ultra_short: ['relativeVolume', 'gapQuality', 'newsSentiment', 'volatilityExpansion', 'trendPosition'],
  mid_term: ['trendAlignment', 'fundamentalMomentum', 'earningsDrift', 'moneyFlow', 'sectorStrength'],
  long_term: ['growthQuality', 'capitalEfficiency', 'cashGeneration', 'valuation', 'fScore'],
  ultra_long: ['moatStrength', 'cashFlowDurability', 'reinvestmentRunway', 'balanceSheetStrength', 'shareholderYield'],
};

const US_STOCKS = [
  ['NVDA', 'NVIDIA Corporation', 'Information Technology', 168.4],
  ['AVGO', 'Broadcom Inc.', 'Information Technology', 291.7],
  ['MSFT', 'Microsoft Corporation', 'Information Technology', 512.3],
  ['LLY', 'Eli Lilly and Company', 'Health Care', 843.1],
  ['XOM', 'Exxon Mobil Corporation', 'Energy', 118.6],
  ['COST', 'Costco Wholesale Corporation', 'Consumer Staples', 962.4],
  ['JPM', 'JPMorgan Chase & Co.', 'Financials', 241.9],
  ['CEG', 'Constellation Energy Corporation', 'Utilities', 286.2],
  ['VST', 'Vistra Corp.', 'Utilities', 174.8],
  ['ANET', 'Arista Networks Inc.', 'Information Technology', 131.5],
  ['UNH', 'UnitedHealth Group Incorporated', 'Health Care', 302.7],
  ['CAT', 'Caterpillar Inc.', 'Industrials', 398.2],
  ['V', 'Visa Inc.', 'Financials', 356.8],
  ['PG', 'Procter & Gamble Company', 'Consumer Staples', 159.3],
  ['GEV', 'GE Vernova Inc.', 'Industrials', 512.9],
  ['NEE', 'NextEra Energy Inc.', 'Utilities', 79.4],
  ['ISRG', 'Intuitive Surgical Inc.', 'Health Care', 498.6],
  ['LIN', 'Linde plc', 'Materials', 471.2],
  ['MPC', 'Marathon Petroleum Corporation', 'Energy', 182.5],
  ['ADBE', 'Adobe Inc.', 'Information Technology', 372.1],
  ['TT', 'Trane Technologies plc', 'Industrials', 428.3],
  ['MCK', 'McKesson Corporation', 'Health Care', 691.8],
];

const KR_STOCKS = [
  ['005930', '삼성전자', 'Information Technology', 84600],
  ['000660', 'SK하이닉스', 'Information Technology', 241500],
  ['373220', 'LG에너지솔루션', 'Industrials', 342000],
  ['207940', '삼성바이오로직스', 'Health Care', 1043000],
  ['005380', '현대차', 'Consumer Discretionary', 268500],
  ['051910', 'LG화학', 'Materials', 318000],
  ['006400', '삼성SDI', 'Industrials', 289500],
  ['035420', 'NAVER', 'Communication Services', 196400],
  ['035720', '카카오', 'Communication Services', 41250],
  ['105560', 'KB금융', 'Financials', 92700],
  ['055550', '신한지주', 'Financials', 61800],
  ['012330', '현대모비스', 'Consumer Discretionary', 254000],
  ['068270', '셀트리온', 'Health Care', 187300],
  ['028260', '삼성물산', 'Industrials', 172500],
  ['009150', '삼성전기', 'Information Technology', 148600],
  ['015760', '한국전력', 'Utilities', 24150],
  ['066570', 'LG전자', 'Consumer Discretionary', 89300],
  ['003670', '포스코퓨처엠', 'Materials', 214500],
  ['017670', 'SK텔레콤', 'Communication Services', 58700],
  ['086790', '하나금융지주', 'Financials', 68400],
  ['259960', '크래프톤', 'Communication Services', 331000],
  ['011200', 'HMM', 'Industrials', 19870],
];

const CATALYSTS_EN = [
  'Q2 revenue beat with raised full-year guidance; data-centre segment up 42% year on year.',
  'Announced a $12bn capacity expansion; three brokerages lifted price targets within 24 hours.',
  'Volume expansion on a base breakout, closing above the 50-day average for the fourth session.',
  'Regulatory approval cleared the final gate for its lead product; launch expected next quarter.',
  'Sector-wide policy announcement lifted the whole sub-industry; this name has the highest operating leverage to it.',
  'Cost programme ahead of schedule; management guided margins to the top of the stated range.',
  'Large supply agreement disclosed in an 8-K, extending contracted revenue visibility to 2029.',
  'Institutional accumulation visible in on-balance volume while price consolidated sideways for six weeks.',
  'Free cash flow inflected positive for the first time in nine quarters; buyback authorisation doubled.',
  'Twelve-month order backlog reached a record; management flagged pricing power holding into next year.',
];

const CATALYSTS_KO = [
  '2분기 매출이 시장 기대치를 상회했고 연간 가이던스를 상향했습니다. 데이터센터 부문이 전년 대비 42% 성장했습니다.',
  '12억 달러 규모 증설 계획을 발표한 뒤 24시간 내 3개 증권사가 목표주가를 상향했습니다.',
  '거래량 확대와 함께 박스권을 상향 돌파했고 4거래일 연속 50일 이동평균선 위에서 마감했습니다.',
  '주력 제품의 최종 규제 승인이 완료되어 다음 분기 출시가 예상됩니다.',
  '업종 전반에 영향을 주는 정책 발표가 있었으며, 해당 종목의 영업 레버리지가 가장 높습니다.',
  '원가 절감 프로그램이 계획보다 앞서 진행 중이며 경영진은 마진을 제시 범위 상단으로 안내했습니다.',
  '대규모 공급 계약이 공시되면서 계약 기준 매출 가시성이 2029년까지 확보되었습니다.',
  '주가가 6주간 횡보하는 동안 기관 순매수와 OBV 상승이 동시에 관찰되었습니다.',
  '9개 분기 만에 잉여현금흐름이 흑자 전환했고 자사주 매입 한도를 두 배로 늘렸습니다.',
  '12개월 수주 잔고가 사상 최대치를 기록했고 경영진은 가격 결정력이 내년까지 유지된다고 밝혔습니다.',
];

const CLUSTERS = [null, 'ai-datacentre-capex', null, 'gpu-export-policy', null, 'grid-buildout', null];

const INVALIDATION_EN = [
  'Return on invested capital declines for three consecutive fiscal years',
  'Gross margin falls below its 10-year 20th percentile',
  'Net debt to EBITDA rises above 3.5x',
  'Free cash flow conversion drops below 60% of net income for four quarters',
  'The reinvestment runway narrows: incremental ROIC falls below the cost of capital',
];

/* The pipeline emits exactly these three row flags. */
const FLAG_STOPPED_OUT = 'stopped_out';
const FLAG_PRICE_LIMIT = 'price_limit';
const FLAG_PARTIAL = 'partial_data';

/** How the three target tiers were derived, per horizon. */
const TARGET_BASIS = {
  ultra_short: 'atr',
  mid_term: 'atr',
  long_term: 'fair_value_band',
  ultra_long: 'compounding_scenarios',
};

/* Lexicon terms that produced the sentiment score — the "evidence" path. */
const EVIDENCE_EN = [
  ['beat', 'raised guidance', 'record backlog'],
  ['upgrade', 'price target raised', 'expansion'],
  ['breakout', 'accumulation', 'above average volume'],
  ['approval', 'launch', 'cleared'],
  ['downgrade', 'cut', 'margin pressure'],
  ['probe', 'delay', 'recall'],
];
const EVIDENCE_KO = [
  ['상향', '사상 최대', '흑자 전환'],
  ['목표주가 상향', '증설', '수주'],
  ['돌파', '순매수', '거래량 급증'],
  ['승인', '출시', '허가'],
  ['하향', '감익', '마진 압박'],
  ['조사', '지연', '리콜'],
];

function makeSparkline(price) {
  const out = [];
  let v = price * between(0.86, 0.98);
  for (let i = 0; i < 29; i++) {
    v *= 1 + between(-0.028, 0.032);
    out.push(round(v, 2));
  }
  out.push(round(price, 2));
  return out;
}

function makeRow(rank, horizon, market, stock, score) {
  const [ticker, name, sector, basePrice] = stock;
  const currency = market === 'US' ? 'USD' : 'KRW';
  const dp = market === 'US' ? 2 : 0;
  const price = round(basePrice * between(0.97, 1.03), dp);
  const atr = price * between(0.018, 0.045);
  const hasStop = horizon === 'ultra_short' || horizon === 'mid_term';

  const factors = {};
  for (const f of FACTORS[horizon]) {
    const z = round(between(-1.6, 2.4), 2);
    factors[f] = { raw: round(between(0.2, 4.5), 3), z };
  }

  const movementRoll = rnd();
  let movement;
  if (movementRoll < 0.18) movement = 'NEW';
  else if (movementRoll < 0.34) movement = 0;
  else movement = Math.round(between(-6, 7));
  if (movement === 0 && movementRoll >= 0.34) movement = 2;

  const catalystIdx = Math.floor(rnd() * CATALYSTS_EN.length) % CATALYSTS_EN.length;

  const completeness = rnd() < 0.25 ? round(between(0.6, 0.95), 2) : 1;
  const sentiment = rnd() < 0.15 ? null : round(between(-0.55, 0.72), 2);
  const evidenceIdx = Math.floor(rnd() * EVIDENCE_EN.length) % EVIDENCE_EN.length;

  /* Flags are derived, not random: partial_data tracks completeness, the KRX
     ±30% daily limit only exists in Korea, and stopped_out only means anything
     on a horizon that publishes a price stop. */
  const flags = [];
  if (completeness < 1) flags.push(FLAG_PARTIAL);
  if (market === 'KR' && rnd() < 0.12) flags.push(FLAG_PRICE_LIMIT);
  if (hasStop && rnd() < 0.1) flags.push(FLAG_STOPPED_OUT);

  return {
    rank,
    movement,
    ticker,
    name,
    market,
    sector,
    currency,
    price,
    changePct: round(between(-3.4, 5.2), 2),
    score,
    rawZ: round(between(-0.4, 2.2), 3),
    completeness,
    riskGauge: 1 + (Math.floor(rnd() * 5) % 5),
    entry: hasStop
      ? { low: round(price - 0.25 * atr, dp), high: round(price + 0.4 * atr, dp) }
      : { low: round(price - 1.5 * atr, dp), high: round(price + 0.5 * atr, dp) },
    stop: hasStop ? round(price - 1.5 * atr, dp) : null,
    /* Three tiers everywhere, but three different kinds of number — see
       targetBasis. ATR multiples on the short horizons, a discounted
       fair-value band at 1–2 years, a compounding scenario band at 5–10. */
    targets: hasStop
      ? {
          conservative: round(price + 1.0 * atr, dp),
          base: round(price + 1.8 * atr, dp),
          bull: round(price + 3.0 * atr, dp),
        }
      : horizon === 'long_term'
        ? {
            conservative: round(price * 1.18, dp),
            base: round(price * 1.42, dp),
            bull: round(price * 1.85, dp),
          }
        : {
            conservative: round(price * between(1.9, 2.3), dp),
            base: round(price * between(3.1, 3.8), dp),
            bull: round(price * between(5.0, 6.2), dp),
          },
    targetBasis: TARGET_BASIS[horizon],
    thesisInvalidation: hasStop ? null : INVALIDATION_EN.slice(0, 2 + (Math.floor(rnd() * 3) % 3)),
    maxHoldSessions: { ultra_short: 5, mid_term: 45, long_term: 504, ultra_long: 2520 }[horizon],
    catalyst: market === 'KR' ? CATALYSTS_KO[catalystIdx] : CATALYSTS_EN[catalystIdx],
    catalystCluster: pick(CLUSTERS),
    factors,
    sparkline: makeSparkline(price),
    newsCount: Math.floor(between(0, 14)),
    sentiment,
    evidence: sentiment === null ? [] : market === 'KR' ? EVIDENCE_KO[evidenceIdx] : EVIDENCE_EN[evidenceIdx],
    flags,
  };
}

function makeBoard(market, horizon) {
  const pool = market === 'US' ? US_STOCKS : KR_STOCKS;

  /* METHODOLOGY §10.4 — the ultra-long board is US-only until a DART key is
     configured. An empty board is an expected state with a stated reason, not
     a failure, and the UI renders emptyReason[lang] to say so. */
  if (market === 'KR' && horizon === 'ultra_long') {
    return {
      market,
      horizon,
      asOf: AS_OF[market],
      turnover30d: 0,
      sampleWarning: true,
      rows: [],
      justMissed: [],
      emptyReason: {
        code: 'kr_no_decade_fundamentals',
        en:
          'The ultra-long model scores a business on ten years of tagged annual statements — return on invested capital, gross margin and free cash flow conversion, each measured across a full cycle. For US filers the SEC XBRL company-facts API supplies that history. No keyless Korean source does: the free mirrors give a cross-sectional snapshot and two or three years of history, which is not enough to tell a durable compounder from a good recent run. Publishing a 5–10 year list from that would be guessing with a confident face on it, so nothing is published here. A free OpenDART API key would supply the missing filings and turn this board on; until one is configured it stays empty on purpose.',
        ko:
          '초장기 모델은 10년치 태깅된 연간 재무제표로 기업을 평가합니다. 투하자본이익률, 매출총이익률, 잉여현금흐름 전환율을 한 사이클 전체에 걸쳐 측정합니다. 미국 상장사는 SEC XBRL company-facts API가 이 이력을 제공하지만, 키 없이 접근 가능한 한국 소스에는 이에 해당하는 것이 없습니다. 무료 미러는 단면 스냅샷과 2~3년치 이력만 제공하며, 이것으로는 지속 가능한 복리 성장 기업과 최근 실적이 좋았을 뿐인 기업을 구분할 수 없습니다. 그 데이터로 5~10년 목록을 발행하는 것은 확신에 찬 표정의 추측일 뿐이므로 아무것도 발행하지 않습니다. 무료 OpenDART API 키를 설정하면 누락된 공시를 확보해 이 순위표를 활성화할 수 있으며, 그 전까지는 의도적으로 비워 둡니다.',
      },
    };
  }

  /* stride 3 is coprime with the 22-name pools, so 13 draws are always distinct */
  const offset = Math.floor(rnd() * 7) % 7;
  const chosen = [];
  for (let i = 0; i < 13; i++) chosen.push(pool[(i * 3 + offset) % pool.length]);
  const uniq = [...new Map(chosen.map((s) => [s[0], s])).values()];

  /* scores descend with rank, as a real board's do */
  let s = between(84, 95);
  const scores = [];
  for (let i = 0; i < 13; i++) {
    scores.push(round(s, 1));
    s -= between(0.6, 3.4);
  }

  const rows = uniq.slice(0, 10).map((st, i) => makeRow(i + 1, horizon, market, st, scores[i]));
  const displacedBy = ['sector_cap', 'correlation_cap', 'catalyst_cluster_cap'];
  const justMissed = uniq.slice(10, 13).map((st, i) => ({
    ticker: st[0],
    name: st[1],
    score: scores[10 + i],
    displacedBy: displacedBy[i % 3],
  }));

  const turnover = { ultra_short: [0.72, 0.94], mid_term: [0.24, 0.44], long_term: [0.04, 0.16], ultra_long: [0.0, 0.08] }[
    horizon
  ];

  return {
    market,
    horizon,
    asOf: AS_OF[market],
    turnover30d: round(between(turnover[0], turnover[1]), 3),
    sampleWarning: horizon === 'long_term' || horizon === 'ultra_long',
    rows,
    justMissed,
    emptyReason: null,
  };
}

/* ------------------------------------------------------------------ */
/* rankings.json                                                       */
/* ------------------------------------------------------------------ */
const horizons = ['ultra_short', 'mid_term', 'long_term', 'ultra_long'];
const rankings = {
  placeholder: true,
  generatedAt: GENERATED_AT,
  methodologyVersion: '1.0.0',
  asOf: AS_OF,
  regime: {
    US: { multiplier: 0.85, state: 'narrowing', indexAboveMA200: true, breadth: 0.436 },
    KR: { multiplier: 0.7, state: 'caution', indexAboveMA200: false, breadth: 0.412 },
  },
  boards: {
    US: Object.fromEntries(horizons.map((h) => [h, makeBoard('US', h)])),
    KR: Object.fromEntries(horizons.map((h) => [h, makeBoard('KR', h)])),
  },
};

/* ------------------------------------------------------------------ */
/* news.json                                                           */
/* ------------------------------------------------------------------ */
const NEWS_SEED = [
  ['Chip designer lifts full-year outlook on data-centre demand', 'Reuters', 'reuters', 'en', ['NVDA', 'AVGO'], 0.62],
  ['Utilities scramble to contract power for new AI campuses', 'Bloomberg', 'bloomberg', 'en', ['CEG', 'VST', 'NEE'], 0.41],
  ['Regulator opens review of proposed health insurer merger', 'Associated Press', 'ap', 'en', ['UNH'], -0.38],
  ['Refiners post narrower crack spreads as inventories build', 'Reuters', 'reuters', 'en', ['MPC', 'XOM'], -0.22],
  ['Networking supplier guides above consensus, shares extend gains', 'CNBC', 'cnbc', 'en', ['ANET'], 0.55],
  ['Warehouse club reports strongest traffic growth in two years', 'MarketWatch', 'marketwatch', 'en', ['COST'], 0.48],
  ['Bank earnings hold up as credit costs stay contained', 'Financial Times', 'ft', 'en', ['JPM', 'V'], 0.19],
  ['Obesity drug supply constraints ease, company says', 'Reuters', 'reuters', 'en', ['LLY'], 0.33],
  ['Grid equipment backlog hits record as buildout accelerates', 'Bloomberg', 'bloomberg', 'en', ['GEV', 'TT'], 0.44],
  ['Software group restructures, takes charge on cloud transition', 'CNBC', 'cnbc', 'en', ['ADBE'], -0.29],
  ['반도체 수출 회복세… 메모리 가격 3개월 연속 상승', '연합뉴스', 'yonhap', 'ko', ['005930', '000660'], 0.58],
  ['2차전지 3社, 북미 증설 속도 조절 검토', '한국경제', 'hankyung', 'ko', ['373220', '006400', '051910'], -0.31],
  ['바이오시밀러 유럽 허가… 하반기 매출 반영', '매일경제', 'mk', 'ko', ['207940', '068270'], 0.51],
  ['완성차 8월 판매 전년比 6% 증가', '연합뉴스', 'yonhap', 'ko', ['005380', '012330'], 0.27],
  ['금융지주 배당 확대 기대감… 밸류업 공시 잇따라', '한국경제', 'hankyung', 'ko', ['105560', '055550', '086790'], 0.36],
  ['플랫폼 규제 논의 재점화, 업계 긴장', '매일경제', 'mk', 'ko', ['035420', '035720'], -0.44],
  ['해운 운임 지수 4주째 하락', '연합뉴스', 'yonhap', 'ko', ['011200'], -0.35],
  ['전력 요금 인상안 국회 제출', '한국경제', 'hankyung', 'ko', ['015760'], 0.12],
  ['Miner signals capex discipline into next cycle', 'Reuters', 'reuters', 'en', ['LIN'], 0.08],
  ['Machinery orders steady, dealer inventories normalise', 'MarketWatch', 'marketwatch', 'en', ['CAT'], 0.15],
  ['Surgical robotics installed base expands in Asia', 'CNBC', 'cnbc', 'en', ['ISRG'], 0.39],
  ['Drug distributor settles opioid claims in two states', 'Associated Press', 'ap', 'en', ['MCK'], -0.41],
  ['게임업체 신작 흥행… 일매출 추정치 상향', '매일경제', 'mk', 'ko', ['259960'], 0.47],
  ['가전 수요 부진 지속, 하반기 회복 전망 엇갈려', '한국경제', 'hankyung', 'ko', ['066570'], -0.18],
];

function label(s) {
  if (s === null) return 'unknown';
  if (s > 0.15) return 'bullish';
  if (s < -0.15) return 'bearish';
  return 'neutral';
}

const news = {
  placeholder: true,
  generatedAt: GENERATED_AT,
  items: NEWS_SEED.map(([title, source, sourceId, lang, tickers, sentiment], i) => ({
    title,
    url: `https://example.com/news/${sourceId}/${2600 + i}`,
    source,
    sourceId,
    publishedAt: new Date(Date.parse(GENERATED_AT) - i * 3.1 * 3600 * 1000).toISOString(),
    lang,
    tickers,
    sentiment: i % 9 === 8 ? null : sentiment,
    sentimentLabel: i % 9 === 8 ? 'unknown' : label(sentiment),
  })),
  clusters: [
    {
      id: 'ai-datacentre-capex',
      size: 7,
      outlets: 4,
      headline: 'Hyperscaler capex guidance drives a broad move across compute and power',
      url: 'https://example.com/news/reuters/2600',
      tickers: ['NVDA', 'AVGO', 'CEG', 'VST', 'GEV'],
      sentiment: 0.52,
    },
    {
      id: 'grid-buildout',
      size: 4,
      outlets: 3,
      headline: 'Transmission buildout orders reach a record backlog',
      url: 'https://example.com/news/bloomberg/2608',
      tickers: ['GEV', 'TT', 'NEE'],
      sentiment: 0.4,
    },
    {
      id: 'kr-battery-capex',
      size: 5,
      outlets: 3,
      headline: '2차전지 업계, 북미 증설 속도 조절 검토',
      url: 'https://example.com/news/hankyung/2611',
      tickers: ['373220', '006400', '051910'],
      sentiment: -0.3,
    },
    {
      id: 'kr-valueup',
      size: 3,
      outlets: 2,
      headline: '금융지주 밸류업 공시 확산',
      url: 'https://example.com/news/hankyung/2614',
      tickers: ['105560', '055550', '086790'],
      sentiment: 0.34,
    },
    { id: 'single-outlet', size: 1, outlets: 1, headline: 'Software group restructures', url: 'https://example.com/news/cnbc/2609', tickers: ['ADBE'], sentiment: -0.29 },
  ],
  feedHealth: [
    { id: 'reuters', name: 'Reuters Business', status: 'ok', items: 48, newestAgeHours: 0.8, error: null },
    { id: 'bloomberg', name: 'Bloomberg Markets', status: 'ok', items: 36, newestAgeHours: 1.4, error: null },
    { id: 'cnbc', name: 'CNBC Top News', status: 'ok', items: 41, newestAgeHours: 0.6, error: null },
    { id: 'ap', name: 'AP Business', status: 'degraded', items: 9, newestAgeHours: 11.2, error: 'HTTP 429 on 3 of 5 attempts' },
    { id: 'yonhap', name: '연합뉴스 경제', status: 'ok', items: 52, newestAgeHours: 1.1, error: null },
    { id: 'hankyung', name: '한국경제', status: 'ok', items: 44, newestAgeHours: 2.0, error: null },
    { id: 'mk', name: '매일경제', status: 'ok', items: 39, newestAgeHours: 1.7, error: null },
    { id: 'ft', name: 'Financial Times', status: 'failing', items: 0, newestAgeHours: null, error: 'TLS handshake timeout' },
  ],
};

/* ------------------------------------------------------------------ */
/* performance.json                                                    */
/* ------------------------------------------------------------------ */
function makeTrade(i, status) {
  const market = i % 3 === 2 ? 'KR' : 'US';
  const pool = market === 'US' ? US_STOCKS : KR_STOCKS;
  const stock = pool[i % pool.length];
  const horizon = horizons[i % 3];
  const dp = market === 'US' ? 2 : 0;
  const entryPrice = round(stock[3] * between(0.9, 1.05), dp);
  const day = 1 + ((i * 7) % 27);
  const month = 3 + ((i * 3) % 5);
  const date = `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (status === 'no_fill') {
    return {
      date,
      market,
      horizon,
      ticker: stock[0],
      name: stock[1],
      rank: 1 + (i % 10),
      entryPrice: null,
      exitPrice: null,
      exitDate: null,
      exitReason: 'open',
      returnPct: null,
      netReturnPct: null,
      holdDays: 0,
      benchmarkReturnPct: null,
      status: 'no_fill',
      voidReason: null,
    };
  }

  if (status === 'open') {
    const mark = round(entryPrice * between(0.93, 1.14), dp);
    const ret = ((mark - entryPrice) / entryPrice) * 100;
    return {
      date,
      market,
      horizon,
      ticker: stock[0],
      name: stock[1],
      rank: 1 + (i % 10),
      entryPrice,
      exitPrice: mark,
      exitDate: null,
      exitReason: 'open',
      returnPct: round(ret, 2),
      netReturnPct: round(ret - 0.22, 2),
      holdDays: 1 + ((i * 5) % 30),
      benchmarkReturnPct: round(between(-2.4, 3.8), 2),
      status: 'open',
      voidReason: null,
    };
  }

  const reason = pick(['stop', 'target', 'max_hold', 'max_hold', 'target', 'forced']);
  let ret;
  if (reason === 'stop') ret = between(-9.5, -3.2);
  else if (reason === 'target') ret = between(3.8, 16.5);
  else if (reason === 'forced') ret = between(-6.0, 4.0);
  else ret = between(-4.5, 7.5);
  const holdDays = { ultra_short: 1 + (i % 5), mid_term: 8 + (i % 34), long_term: 45 + (i % 120) }[horizon];
  const exitPrice = round(entryPrice * (1 + ret / 100), dp);
  const void_ = i === 17;

  return {
    date,
    market,
    horizon,
    ticker: stock[0],
    name: stock[1],
    rank: 1 + (i % 10),
    entryPrice,
    exitPrice,
    exitDate: `2026-${String(Math.min(8, month + 1)).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    exitReason: reason,
    returnPct: round(ret, 2),
    netReturnPct: round(ret - (market === 'KR' ? 0.4 : 0.22), 2),
    holdDays,
    benchmarkReturnPct: round(between(-3.2, 4.6), 2),
    status: void_ ? 'void' : 'closed',
    voidReason: void_ ? 'Published against a stale corporate action; entry zone was not valid on the fill date.' : null,
  };
}

const closed = [];
for (let i = 0; i < 62; i++) closed.push(makeTrade(i, 'closed'));
for (let i = 62; i < 73; i++) closed.push(makeTrade(i, 'no_fill'));
const open = [];
for (let i = 100; i < 116; i++) open.push(makeTrade(i, 'open'));

function stats(trades, allPicks) {
  const done = trades.filter((t) => t.status === 'closed');
  const noFill = allPicks.filter((t) => t.status === 'no_fill').length;
  const rets = done.map((t) => t.netReturnPct).sort((a, b) => a - b);
  const mean = rets.reduce((a, b) => a + b, 0) / (rets.length || 1);
  const median = rets.length ? rets[Math.floor(rets.length / 2)] : 0;
  const wins = done.filter((t) => t.netReturnPct > 0).length;
  const bench = done.reduce((a, t) => a + (t.benchmarkReturnPct || 0), 0) / (done.length || 1);
  return {
    picks: allPicks.length,
    filled: done.length,
    noFill,
    winRate: round(done.length ? wins / done.length : 0, 3),
    controlWinRate: round(between(0.47, 0.55), 3),
    meanReturn: round(mean, 2),
    medianReturn: round(median, 2),
    benchmarkReturn: round(bench, 2),
    excessReturn: round(mean - bench, 2),
    maxDrawdown: round(-between(6.5, 15.5), 2),
    avgHoldDays: round(done.reduce((a, t) => a + t.holdDays, 0) / (done.length || 1), 1),
    sampleWarning: done.length < 30,
    closedCount: done.length,
  };
}

const byHorizon = {};
for (const h of horizons) {
  const subset = closed.filter((t) => t.horizon === h);
  byHorizon[h] = stats(subset, subset);
}

const equityCurve = [];
{
  let v = 100;
  let b = 100;
  const start = Date.UTC(2026, 1, 2);
  for (let i = 0; i < 135; i++) {
    v *= 1 + between(-0.011, 0.0142);
    b *= 1 + between(-0.009, 0.0108);
    const d = new Date(start + i * 86400000);
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue;
    equityCurve.push({ date: d.toISOString().slice(0, 10), value: round(v, 2), benchmark: round(b, 2) });
  }
}

const performance = {
  placeholder: true,
  generatedAt: GENERATED_AT,
  summary: { overall: stats(closed, closed), byHorizon },
  closed,
  open,
  equityCurve,
};

/* ------------------------------------------------------------------ */
/* sectors.json                                                        */
/* ------------------------------------------------------------------ */
const SECTOR_NAMES = [
  ['Information Technology', '정보기술'],
  ['Health Care', '헬스케어'],
  ['Financials', '금융'],
  ['Consumer Discretionary', '경기소비재'],
  ['Communication Services', '커뮤니케이션서비스'],
  ['Industrials', '산업재'],
  ['Consumer Staples', '필수소비재'],
  ['Energy', '에너지'],
  ['Utilities', '유틸리티'],
  ['Materials', '소재'],
  ['Real Estate', '부동산'],
];

function makeSectors(market) {
  const scale = market === 'US' ? 1 : 0.06;
  const raw = SECTOR_NAMES.map(([name, nameKo], i) => {
    const cap = between(0.4, 12) * 1e12 * scale * (i < 3 ? 1.8 : 1);
    const adv = Math.floor(between(8, 90));
    const dec = Math.floor(between(8, 90));
    return {
      name,
      nameKo,
      return1d: round(between(-2.6, 2.9), 2),
      return5d: round(between(-5.4, 6.1), 2),
      return20d: round(between(-11.0, 13.5), 2),
      marketCap: Math.round(cap),
      weight: 0,
      advancers: adv,
      decliners: dec,
      breadth: round(adv / (adv + dec), 3),
    };
  });
  const total = raw.reduce((a, s) => a + s.marketCap, 0);
  for (const s of raw) s.weight = round(s.marketCap / total, 4);
  return { asOf: AS_OF[market], sectors: raw.sort((a, b) => b.marketCap - a.marketCap) };
}

const sectors = {
  placeholder: true,
  generatedAt: GENERATED_AT,
  markets: { US: makeSectors('US'), KR: makeSectors('KR') },
};

/* ------------------------------------------------------------------ */
/* health.json                                                         */
/* ------------------------------------------------------------------ */
const health = {
  placeholder: true,
  generatedAt: GENERATED_AT,
  sources: [
    { host: 'data.sec.gov', ok: 1284, fail: 6, total: 1290, successRate: 0.995, notes: 'XBRL companyfacts, 10 req/s cap respected' },
    { host: 'query1.finance.yahoo.com', ok: 2410, fail: 61, total: 2471, successRate: 0.975, notes: 'Occasional 429; exponential backoff applied' },
    { host: 'ecos.bok.or.kr', ok: 118, fail: 2, total: 120, successRate: 0.983, notes: 'KRW reference rates' },
    { host: 'opendart.fss.or.kr', ok: 0, fail: 0, total: 0, successRate: null, notes: 'No API key configured — Korean ultra-long board disabled (METHODOLOGY §10.4)' },
    { host: 'www.krx.co.kr', ok: 396, fail: 21, total: 417, successRate: 0.95, notes: 'Mirror used for administrative-issue flags' },
  ],
  feeds: news.feedHealth,
  notes: [
    'This file is placeholder data. The refresh scripts overwrite it on every pipeline run.',
    'A source below 0.9 success rate for two consecutive days suppresses the affected factor rather than imputing it (METHODOLOGY P4).',
    'The Korean ultra-long board is intentionally empty until a DART key is configured.',
  ],
};

/* ------------------------------------------------------------------ */
/* write                                                               */
/* ------------------------------------------------------------------ */
const files = {
  'rankings.json': rankings,
  'news.json': news,
  'performance.json': performance,
  'sectors.json': sectors,
  'health.json': health,
};

for (const dir of ['src/data', 'public/data']) {
  mkdirSync(join(ROOT, dir), { recursive: true });
  for (const [name, payload] of Object.entries(files)) {
    writeFileSync(join(ROOT, dir, name), JSON.stringify(payload, null, 2) + '\n');
    console.log(`wrote ${dir}/${name}`);
  }
}
