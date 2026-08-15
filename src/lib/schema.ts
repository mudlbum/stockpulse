/**
 * schema.org nodes that could plausibly earn something.
 *
 * `Dataset` is the interesting one. The rankings genuinely are a dataset —
 * versioned, documented, downloadable as JSON at a stable URL, already
 * advertised in robots.txt and llms.txt — and Google Dataset Search is a far
 * less contested surface than finance SERPs. Claiming it costs nothing and is
 * accurate, which is the only kind of structured data worth adding.
 */

import { HORIZONS, MARKETS, SITE, type Locale } from '../config';
import { absolute, pageAbsolute } from '../lib/paths';
import { rankings, sectors, performance, dataGeneratedAt } from './data';

const bcp47 = (lang: Locale) => (lang === 'ko' ? 'ko-KR' : 'en-US');

const SPATIAL = [
  { '@type': 'Place', name: 'United States', identifier: 'US' },
  { '@type': 'Place', name: 'South Korea', identifier: 'KR' },
];

function download(file: string) {
  return {
    '@type': 'DataDownload',
    encodingFormat: 'application/json',
    contentUrl: absolute(`data/${file}`),
  };
}

interface DatasetOpts {
  lang: Locale;
  /** Canonical page URL this dataset is described on. */
  pageUrl: string;
  name: string;
  description: string;
  files: string[];
  variableMeasured: string[];
  temporalCoverage: string;
  keywords: string[];
}

function dataset(o: DatasetOpts) {
  return {
    '@type': 'Dataset',
    '@id': `${o.pageUrl}#dataset`,
    name: o.name,
    description: o.description,
    url: o.pageUrl,
    inLanguage: bcp47(o.lang),
    license: pageAbsolute(o.lang, 'disclaimer'),
    isAccessibleForFree: true,
    creator: { '@id': `${absolute('')}#publisher` },
    publisher: { '@id': `${absolute('')}#publisher` },
    dateModified: dataGeneratedAt,
    temporalCoverage: o.temporalCoverage,
    spatialCoverage: SPATIAL,
    variableMeasured: o.variableMeasured.map((v) => ({ '@type': 'PropertyValue', name: v })),
    distribution: o.files.map(download),
    keywords: o.keywords,
    creativeWorkStatus: 'Published',
    version: rankings.methodologyVersion,
  };
}

const asOfRange = () => {
  const dates = Object.values(rankings.asOf).filter(Boolean).sort();
  return dates.length ? `${dates[0]}/${dates[dates.length - 1]}` : dataGeneratedAt.slice(0, 10);
};

export function rankingsDataset(lang: Locale) {
  return dataset({
    lang,
    pageUrl: pageAbsolute(lang, ''),
    name:
      lang === 'ko'
        ? 'StockPulse 일간 종목 순위 (미국·한국, 4개 투자 기간)'
        : 'StockPulse daily equity rankings (US and Korea, four horizons)',
    description:
      lang === 'ko'
        ? '미국·한국 증시를 대상으로 4개 투자 기간별로 매 거래일 산출하는 규칙 기반 종목 순위입니다. 종목별 점수, 팩터 z 점수, 진입 구간, 손절가, 목표 구간, 시장 국면 지표를 포함합니다.'
        : 'Rule-based equity rankings computed every session across four investment horizons for the US and Korean markets, including per-row scores, factor z-scores, entry zones, stop levels, target bands and market-regime state.',
    files: ['rankings.json', 'news.json'],
    variableMeasured: [
      'rank',
      'score',
      'factor z-score',
      'entry zone',
      'stop level',
      'target band',
      'risk gauge',
      'data completeness',
      'market regime state',
      '30-day board turnover',
    ],
    temporalCoverage: asOfRange(),
    keywords: [
      'stock rankings',
      'equity screening',
      'quantitative factors',
      'US equities',
      'Korean equities',
      'KOSPI',
      ...HORIZONS.map((h) => h.label.en.toLowerCase()),
      ...MARKETS.map((m) => m.benchmark),
    ],
  });
}

export function performanceDataset(lang: Locale) {
  const curve = performance.equityCurve;
  const range = curve.length ? `${curve[0].date}/${curve[curve.length - 1].date}` : asOfRange();
  return dataset({
    lang,
    pageUrl: pageAbsolute(lang, 'performance'),
    name:
      lang === 'ko'
        ? 'StockPulse 발행 종목 성과 원장'
        : 'StockPulse published-entry performance ledger',
    description:
      lang === 'ko'
        ? '발행된 모든 종목을 청산 시점까지 추적한 추가 전용 원장입니다. 체결가, 청산 사유, 비용 차감 수익률, 벤치마크 대비 수익률, 무작위 대조군 승률을 포함합니다.'
        : 'Append-only ledger of every published entry tracked to its exit, including fill convention, exit reason, net-of-cost return, benchmark comparison and a random-selection control win rate.',
    files: ['performance.json'],
    variableMeasured: [
      'win rate',
      'random-pick control win rate',
      'mean return net of costs',
      'median return',
      'benchmark return',
      'excess return',
      'maximum drawdown',
      'average holding period',
      'never-filled count',
    ],
    temporalCoverage: range,
    keywords: ['track record', 'backtest audit', 'trade ledger', 'benchmark comparison', 'equity curve'],
  });
}

export function sectorsDataset(lang: Locale) {
  const dates = Object.values(sectors.markets)
    .map((m) => m.asOf)
    .filter(Boolean)
    .sort();
  return dataset({
    lang,
    pageUrl: pageAbsolute(lang, 'sectors'),
    name:
      lang === 'ko' ? 'StockPulse 섹터 자금 흐름 (미국·한국)' : 'StockPulse sector capital flow (US and Korea)',
    description:
      lang === 'ko'
        ? '미국·한국 시장의 GICS 섹터별 시가총액, 1일·5일·20일 수익률, 상승 비율, 상승·하락 종목 수입니다.'
        : 'GICS sector market capitalisation, 1-, 5- and 20-day returns, breadth and advance/decline counts for the US and Korean markets.',
    files: ['sectors.json'],
    variableMeasured: ['market capitalisation', 'sector weight', '1-day return', '5-day return', '20-day return', 'breadth', 'advancers', 'decliners'],
    temporalCoverage: dates.length ? `${dates[0]}/${dates[dates.length - 1]}` : asOfRange(),
    keywords: ['sector rotation', 'market breadth', 'GICS sectors', 'capital flow', 'treemap'],
  });
}

/** One ItemList per board, for the home page. */
export function boardItemLists(lang: Locale) {
  const out: unknown[] = [];
  for (const m of MARKETS) {
    for (const h of HORIZONS) {
      const board = rankings.boards[m.id]?.[h.id];
      if (!board || board.rows.length === 0) continue;
      out.push({
        '@type': 'ItemList',
        '@id': `${pageAbsolute(lang, '')}#board-${m.id.toLowerCase()}-${h.id}`,
        name: `${m.label[lang]} · ${h.label[lang]} (${h.window[lang]})`,
        numberOfItems: board.rows.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: board.rows.map((r) => ({
          '@type': 'ListItem',
          position: r.rank,
          name: `${r.ticker} — ${r.name}`,
        })),
      });
    }
  }
  return out;
}

/**
 * The disclaimer is already nine question-shaped headings with answers, so it
 * is a FAQPage whether or not it is marked up as one. Marking it up is the
 * difference between that being legible to a machine and not.
 */
export function faqSchema(lang: Locale, sections: { h: string; p: string[] }[]) {
  return {
    '@type': 'FAQPage',
    '@id': `${pageAbsolute(lang, 'disclaimer')}#faq`,
    inLanguage: bcp47(lang),
    mainEntity: sections.map((s) => ({
      '@type': 'Question',
      name: s.h,
      acceptedAnswer: { '@type': 'Answer', text: s.p.join(' ') },
    })),
  };
}

export const SITE_NAME = SITE.name;
