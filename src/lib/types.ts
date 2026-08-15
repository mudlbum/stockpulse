/** Shapes of the generated JSON in src/data/ and public/data/. */

import type { HorizonId, MarketId } from '../config';

export type Movement = number | 'NEW';

export interface FactorValue {
  raw: number;
  z: number;
}

/**
 * How a row's three target tiers were derived. The tiers are three numbers on
 * every horizon but they are not three of the same kind of number, and the UI
 * must not let them read as one.
 */
export type TargetBasis = 'atr' | 'fair_value_band' | 'compounding_scenarios';

/** Row flags emitted by the pipeline. Anything else renders with a raw code. */
export type RowFlag = 'partial_data' | 'price_limit' | 'stopped_out';

export interface Row {
  rank: number;
  movement: Movement;
  ticker: string;
  name: string;
  market: MarketId;
  sector: string;
  currency: 'USD' | 'KRW';
  price: number;
  changePct: number;
  score: number;
  rawZ: number;
  completeness: number;
  riskGauge: number;
  entry: { low: number; high: number };
  stop: number | null;
  targets: { conservative: number; base: number; bull: number } | null;
  targetBasis: TargetBasis;
  thesisInvalidation: string[] | null;
  maxHoldSessions: number;
  catalyst: string;
  catalystCluster: string | null;
  factors: Record<string, FactorValue>;
  sparkline: number[];
  newsCount: number;
  sentiment: number | null;
  /** Lexicon terms that produced `sentiment`. Rendered only when it is a
      non-empty array of strings, so an unexpected shape degrades to nothing. */
  evidence?: string[] | null;
  flags: (RowFlag | string)[];
}

export type DisplacedBy = 'sector_cap' | 'correlation_cap' | 'catalyst_cluster_cap' | string;

export interface JustMissed {
  ticker: string;
  name: string;
  score: number;
  displacedBy: DisplacedBy;
}

/**
 * Why a board has no rows. An empty board is an expected, explainable state —
 * KR/ultra_long is empty by design — so the reason travels with the data and
 * is rendered in the reader's language instead of leaving a blank table.
 */
export interface EmptyReason {
  code: string;
  en: string;
  ko: string;
}

export interface Board {
  market: MarketId;
  horizon: HorizonId;
  asOf: string;
  turnover30d: number;
  sampleWarning: boolean;
  rows: Row[];
  justMissed: JustMissed[];
  emptyReason: EmptyReason | null;
}

export type RegimeState = 'risk_on' | 'narrowing' | 'caution' | 'risk_off' | 'unknown';

export interface Regime {
  multiplier: number;
  state: RegimeState;
  indexAboveMA200: boolean | null;
  breadth: number | null;
}

export interface Rankings {
  placeholder?: boolean;
  generatedAt: string;
  methodologyVersion: string;
  asOf: Record<MarketId, string>;
  regime: Record<MarketId, Regime>;
  boards: Record<MarketId, Record<HorizonId, Board>>;
}

export type SentimentLabel = 'bullish' | 'neutral' | 'bearish' | 'unknown';

export interface NewsItem {
  title: string;
  url: string;
  source: string;
  sourceId: string;
  publishedAt: string;
  lang: string;
  tickers: string[];
  sentiment: number | null;
  sentimentLabel: SentimentLabel;
}

export interface NewsCluster {
  id: string;
  size: number;
  outlets: number;
  headline: string;
  url: string;
  tickers: string[];
  sentiment: number | null;
}

export interface FeedHealth {
  id: string;
  name: string;
  status: string;
  items: number;
  newestAgeHours: number | null;
  error: string | null;
}

export interface News {
  placeholder?: boolean;
  generatedAt: string;
  items: NewsItem[];
  clusters: NewsCluster[];
  feedHealth: FeedHealth[];
}

export interface Stats {
  picks: number;
  filled: number;
  noFill: number;
  winRate: number;
  controlWinRate: number;
  meanReturn: number;
  medianReturn: number;
  benchmarkReturn: number;
  excessReturn: number;
  maxDrawdown: number;
  avgHoldDays: number;
  sampleWarning: boolean;
  closedCount: number;
}

export type ExitReason = 'stop' | 'target' | 'max_hold' | 'forced' | 'open';
export type TradeStatus = 'closed' | 'open' | 'no_fill' | 'void';

export interface Trade {
  date: string;
  market: MarketId;
  horizon: HorizonId;
  ticker: string;
  name: string;
  rank: number;
  entryPrice: number | null;
  exitPrice: number | null;
  exitDate: string | null;
  exitReason: ExitReason;
  returnPct: number | null;
  netReturnPct: number | null;
  holdDays: number;
  benchmarkReturnPct: number | null;
  status: TradeStatus;
  voidReason: string | null;
}

export interface Performance {
  placeholder?: boolean;
  generatedAt: string;
  summary: { overall: Stats; byHorizon: Record<HorizonId, Stats> };
  closed: Trade[];
  open: Trade[];
  equityCurve: { date: string; value: number; benchmark: number }[];
}

export interface Sector {
  name: string;
  nameKo: string;
  return1d: number;
  return5d: number;
  return20d: number;
  marketCap: number;
  weight: number;
  advancers: number;
  decliners: number;
  breadth: number;
}

export interface Sectors {
  placeholder?: boolean;
  generatedAt: string;
  markets: Record<MarketId, { asOf: string; sectors: Sector[] }>;
}

export interface Health {
  placeholder?: boolean;
  generatedAt: string;
  sources: { host: string; ok: number; fail: number; total: number; successRate: number | null; notes: string }[];
  feeds: FeedHealth[];
  notes: string[];
}
