#!/usr/bin/env node
/**
 * The ranking job. Reads the committed store, scores every horizon for both
 * markets, applies diversification and hysteresis, writes the ledger, and
 * publishes rankings.json + sectors.json.
 *
 * This script performs NO network I/O. Everything it needs is in data-store/,
 * which means it is fully reproducible: check out any commit, run it, get the
 * same board. That property is what makes the public audit meaningful.
 */

import path from 'node:path';
import { HORIZONS_META, publishSectors } from './lib/sectors.mjs';
import {
  applyHysteresis, makeDiversificationChecker, regimeMultiplier, riskGauge,
  scoreUniverse, tradeParameters, WEIGHTS, MIN_PRESENT,
} from './lib/score.mjs';
import {
  longTermFactors, midTermFactors, ultraLongFactors, ultraShortFactors,
  distressGate, piotroski, roic, ttm,
} from './lib/factors.mjs';
import { aggregateSentiment } from './lib/sentiment.mjs';
import { deriveMetrics } from './lib/derive.mjs';
import { catalystSummary } from './lib/news.mjs';
import { returnOver } from './lib/indicators.mjs';
import { isNum, toDisplayScore } from './lib/stats.mjs';
import {
  loadPrices, loadFundamentals, loadBoard, previousBoardFor, saveBoard, appendLedger,
  publish, readJson, SRC_DATA, STORE,
} from './lib/store.mjs';
import { pathToFileURL } from 'node:url';

const HORIZONS = ['ultra_short', 'mid_term', 'long_term', 'ultra_long'];

export { structurallyUnavailable, STATEMENT_FACTORS };
const METHODOLOGY_VERSION = '1.0.0';
const TOP_N = 10;
/** Sessions a stopped-out entry must sit out. METHODOLOGY §7. */
const STOP_OUT_COOLDOWN = 5;

const HYSTERESIS = {
  ultra_short: { exitRank: 12, minHold: 1 },
  mid_term: { exitRank: 16, minHold: 5 },
  long_term: { exitRank: 20, minHold: 21 },
  ultra_long: { exitRank: 25, minHold: 63 },
};

const BENCHMARK = { US: 'SPY', KR: 'KS11' };

async function main() {
  const gitSha = process.env.GITHUB_SHA?.slice(0, 8) ?? 'local';
  const newsIndex = (await readJson(path.join(STORE, 'news-by-ticker.json'), null)) ?? { tickers: {}, catalysts: {} };

  const out = {
    generatedAt: new Date().toISOString(),
    methodologyVersion: METHODOLOGY_VERSION,
    asOf: {},
    regime: {},
    boards: { US: {}, KR: {} },
  };
  const ledgerEntries = [];
  const sectorInput = {};

  // Reproducibility anchor — see the note at the aggregateSentiment call.
  const sentimentNow = newsIndex.updatedAt ? new Date(newsIndex.updatedAt) : new Date();

  for (const market of ['US', 'KR']) {
    const built = await buildMarket(market, newsIndex, sentimentNow);
    if (!built) {
      console.warn(`[rank] ${market}: no data, skipping`);
      out.boards[market] = emptyBoards(market);
      continue;
    }
    out.asOf[market] = built.asOf;
    out.regime[market] = built.regime;
    sectorInput[market] = built;

    for (const horizon of HORIZONS) {
      const board = await buildBoard(market, horizon, built, gitSha);
      out.boards[market][horizon] = board.published;
      ledgerEntries.push(...board.ledger);
    }
  }

  const added = await appendLedger(ledgerEntries);
  console.log(`[rank] ledger: ${added} new entries (${ledgerEntries.length} candidates)`);

  await publish('rankings', out);
  await publishSectors(sectorInput);

  for (const m of ['US', 'KR']) {
    for (const h of HORIZONS) {
      const b = out.boards[m]?.[h];
      if (b) console.log(`[rank] ${m}/${h}: ${b.rows.length} rows, turnover30d=${(b.turnover30d * 100).toFixed(0)}%`);
    }
  }
}

function emptyBoards(market) {
  const o = {};
  for (const h of HORIZONS) {
    o[h] = { market, horizon: h, asOf: null, turnover30d: 0, sampleWarning: true, rows: [], justMissed: [] };
  }
  return o;
}

/** Assemble everything the scorers need for one market. */
async function buildMarket(market, newsIndex, sentimentNow) {
  const prices = await loadPrices(market);
  const fundamentals = await loadFundamentals(market);
  const universeFile = await readJson(path.join(SRC_DATA, `universe-${market.toLowerCase()}.json`), null);
  if (!universeFile?.tickers?.length) return null;

  const asOf = universeFile.asOf ?? latestBarDate(prices);
  const benchBars = prices.bars[BENCHMARK[market]] ?? [];

  // Sector composites from ETF proxies (US) or from the mirror's sector labels
  // aggregated into equal-weight composites (KR).
  const sectorBars = buildSectorComposites(market, prices, universeFile);
  const sectorStrength = computeSectorStrength(sectorBars, benchBars);

  const rows = [];
  for (const t of universeFile.tickers) {
    const bars = prices.bars[t.ticker];
    if (!bars || bars.length < 60) continue;

    const co = fundamentals.companies?.[t.ticker] ?? {};
    // null, not 'Unknown'. Coercing an unclassified name into a named bucket
    // makes the diversification cap count it as a real sector and truncates the
    // board; it also makes sector-neutral normalization silently non-neutral.
    // Everything downstream is written to accept null.
    const sector = t.sector || co.sector || null;
    const news = newsIndex.tickers?.[t.ticker] ?? [];
    // Anchored to the news snapshot's own timestamp, NOT wall-clock now.
    //
    // Sentiment decays with headline age, so using `new Date()` made the score
    // depend on when the script happened to run: replaying a commit an hour
    // later produced different sentiment, different z-scores and a different
    // board from identical committed inputs. The news index records when it was
    // captured, and that is the honest reference point for "how old is this
    // headline" — it is also what makes a replay reproduce.
    const sent = aggregateSentiment(news, sentimentNow);

    rows.push(deriveMetrics({
      ticker: t.ticker,
      name: t.name ?? co.entityName ?? t.ticker,
      market,
      sector,
      currency: market === 'US' ? 'USD' : 'KRW',
      bars,
      news,
      sentiment: sent?.score ?? null,
      newsCount: sent?.count ?? 0,
      quarters: co.quarters ?? [],
      annual: co.annual ?? [],
      balance: co.balance ?? null,
      lastFiled: co.lastFiled ?? null,
      marketCap: t.marketCap ?? deriveMarketCap(co, bars),
      priceLimited: Boolean(t.priceLimited),
      catalystCluster: newsIndex.catalysts?.[t.ticker]?.id ?? null,
      sectorBars: sectorBars.get(sector) ?? null,
      sectorStrength: sectorStrength.get(sector) ?? null,
    }));
  }

  const regime = regimeMultiplier({
    benchmarkBars: benchBars,
    universeBars: rows.map((r) => r.bars),
  });
  console.log(`[rank] ${market}: ${rows.length} scorable names, regime=${regime.state} (breadth ${regime.breadth !== null ? (regime.breadth * 100).toFixed(0) + '%' : 'n/a'})`);

  // Measured, not assumed: does ANY company in this market have a financial
  // statement series in the store? Drives the empty-board explanation, so that
  // "no keyless source exists" and "the store is still filling" are never
  // confused for one another. See emptyReasonFor.
  const hasStatements = Object.values(fundamentals.companies ?? {})
    .some((c) => (c.quarters?.length ?? 0) > 0 || (c.annual?.length ?? 0) > 0);

  return {
    market, asOf, rows, regime, benchBars, sectorBars, sectorStrength, prices, hasStatements,
  };
}

function latestBarDate(prices) {
  let latest = null;
  for (const bars of Object.values(prices.bars ?? {})) {
    const d = bars[bars.length - 1]?.date;
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

function deriveMarketCap(co, bars) {
  const shares = co.balance?.sharesOutstanding ?? co.snapshots?.at(-1)?.shares;
  const close = bars[bars.length - 1]?.close;
  return isNum(shares) && isNum(close) ? shares * close : null;
}

/**
 * Sector composites.
 *
 * US uses the sector SPDR ETFs as ready-made composites. KR has no free sector
 * ETF set with clean history, so composites are built as equal-weight indices
 * of the sector's own members — which is also why the KR sector-strength factor
 * is only as deep as the stored price history.
 */
function buildSectorComposites(market, prices, universeFile) {
  const map = new Map();
  if (market === 'US') {
    for (const [etf, sector] of Object.entries(universeFile.sectorEtfs ?? {})) {
      const bars = prices.bars[etf];
      if (bars?.length >= 130) map.set(sector, bars);
    }
    return map;
  }

  const bySector = new Map();
  for (const t of universeFile.tickers ?? []) {
    const bars = prices.bars[t.ticker];
    if (!bars || bars.length < 130) continue;
    const s = t.sector || null;
    if (!s) continue;   // no sector, no composite membership
    if (!bySector.has(s)) bySector.set(s, []);
    bySector.get(s).push(bars);
  }
  for (const [sector, members] of bySector) {
    if (members.length < 3) continue;
    map.set(sector, equalWeightComposite(members));
  }
  return map;
}

/** Equal-weight composite from member series, aligned on dates present in all. */
function equalWeightComposite(members) {
  const counts = new Map();
  for (const bars of members) for (const b of bars) counts.set(b.date, (counts.get(b.date) ?? 0) + 1);
  const dates = [...counts.entries()].filter(([, n]) => n >= members.length * 0.8).map(([d]) => d).sort();
  if (dates.length < 130) return null;

  const idx = members.map((bars) => new Map(bars.map((b) => [b.date, b])));
  const out = [];
  let level = 100;
  for (let i = 1; i < dates.length; i++) {
    const rets = [];
    for (const m of idx) {
      const a = m.get(dates[i - 1]);
      const b = m.get(dates[i]);
      if (a?.close > 0 && b?.close > 0) rets.push(b.close / a.close - 1);
    }
    if (rets.length === 0) continue;
    level *= 1 + rets.reduce((x, y) => x + y, 0) / rets.length;
    out.push({ date: dates[i], open: level, high: level, low: level, close: level, volume: 0 });
  }
  return out;
}

/** 120-day sector return relative to the benchmark. METHODOLOGY §4.3. */
function computeSectorStrength(sectorBars, benchBars) {
  const out = new Map();
  const benchRet = returnOver(benchBars, 120);
  for (const [sector, bars] of sectorBars) {
    if (!bars) continue;
    const r = returnOver(bars, 120);
    if (!isNum(r)) continue;
    out.set(sector, isNum(benchRet) ? r - benchRet : r);
  }
  return out;
}

/** Score, constrain, stabilize and publish one board. */
async function buildBoard(market, horizon, ctx, gitSha) {
  const asOf = ctx.asOf;

  // Gates are evaluated on every row, then rows whose factor model could not be
  // built at all are dropped. `graded` keeps the pre-filter view so an empty
  // board can be explained from the gate distribution — the dropped rows ARE
  // the explanation, so diagnosing from the filtered list would always report
  // "insufficient data" no matter the real cause.
  const graded = ctx.rows.map((r) => {
    const gate = hardGate(r, horizon);
    const factors = computeFactors(r, horizon, ctx);
    return { ...r, factors, gate };
  });
  const candidates = graded.filter((r) => r.factors !== null);

  const ranked = scoreUniverse(candidates, horizon, ctx.regime);
  const gauges = riskGauge(ranked);
  ranked.forEach((r, i) => { r.riskGauge = gauges[i]; });

  const stored = await loadBoard(market, horizon);
  // Not `stored.current` — on a same-day re-run that IS this run's own output.
  // See previousBoardFor() for why treating it as yesterday breaks the board.
  const prev = previousBoardFor(stored, asOf);
  const stopped = await detectStopOuts(prev, ctx);

  // Publish the names that left on their stops.
  //
  // Hysteresis correctly ejects a stopped-out entry, but that meant it simply
  // vanished from the board with no explanation — a site that publishes stop
  // levels and then quietly drops the names that hit them is hiding exactly
  // the outcome it promises to show. These are surfaced on the board and are
  // already carried through to the performance ledger.
  const byTickerNow = new Map(ctx.rows.map((r) => [r.ticker, r]));
  const stoppedOut = [...stopped].map((ticker) => {
    const p = prev.find((x) => x.ticker === ticker);
    const row = byTickerNow.get(ticker);
    const bars = ctx.prices.bars[ticker] ?? [];
    const last = bars.at(-1);
    return {
      ticker,
      name: row?.name ?? ticker,
      stop: p?.stop ?? null,
      entryDate: p?.entryDate ?? null,
      lastPrice: isNum(last?.close) ? round2(last.close) : null,
      previousRank: p?.rank ?? null,
      cooldownSessions: STOP_OUT_COOLDOWN,
    };
  }).sort((a, b) => (a.previousRank ?? 99) - (b.previousRank ?? 99));

  // Hysteresis sees the WHOLE ranked list, so an incumbent sitting at rank 11
  // is visible for the "has it fallen past the exit rank?" test. The
  // diversification checker is handed in rather than applied beforehand — see
  // makeDiversificationChecker for why applying it first silently does nothing.
  const withStops = ranked.map((r) => (stopped.has(r.ticker) ? { ...r, stoppedOut: true } : r));
  const checker = makeDiversificationChecker(ranked, { maxPerSector: 3 });

  const { board, turnover, rejections } = applyHysteresis(
    withStops,
    prev,
    { ...HYSTERESIS[horizon], topN: TOP_N, checker },
  );
  const displaced = rejections;

  const rows = board.map((r) => renderRow(r, horizon, market));
  const turnover30d = computeTurnover30d(stored.history ?? [], board, asOf, prev);

  // Carry a decrementing cooldown for names that stopped out. METHODOLOGY §7
  // says a stopped-out entry "cannot re-enter for 5 sessions"; applyHysteresis
  // reads `cooldownUntilSession`, but until now nothing ever WROTE it, so the
  // rule was a no-op and a stopped-out name could return the next session.
  const priorCooldown = new Map((prev ?? []).map((p) => [p.ticker, p.cooldownUntilSession ?? 0]));
  const cooldowns = new Map();
  for (const [ticker, n] of priorCooldown) if (n > 1) cooldowns.set(ticker, n - 1);
  for (const ticker of stopped) cooldowns.set(ticker, STOP_OUT_COOLDOWN);

  const persisted = board.map((r) => ({
    ticker: r.ticker, rank: r.rank, score: r.score, heldSessions: r.heldSessions,
    entry: r.trade?.entry ?? null, stop: r.trade?.stop ?? null,
    targets: r.trade?.targets ?? null, entryDate: r.entryDate ?? asOf,
    cooldownUntilSession: 0,
  }));
  // Names serving a cooldown are not on the board, so they are carried
  // alongside it — otherwise the counter is lost the moment they drop off,
  // which is exactly when it needs to survive.
  for (const [ticker, n] of cooldowns) {
    if (persisted.some((p) => p.ticker === ticker)) continue;
    persisted.push({ ticker, rank: null, score: null, heldSessions: 0, cooldownUntilSession: n });
  }
  await saveBoard(market, horizon, persisted, asOf);

  const ledger = rows.map((r) => ({
    date: asOf,
    market,
    horizon,
    ticker: r.ticker,
    name: r.name,
    rank: r.rank,
    score: r.score,
    factors: Object.fromEntries(Object.entries(r.factors).map(([k, v]) => [k, v.raw])),
    referencePrice: r.price,
    entry: r.entry,
    stop: r.stop,
    targets: r.targets,
    maxHoldSessions: r.maxHoldSessions,
    methodologyVersion: METHODOLOGY_VERSION,
    commit: gitSha,
    status: 'open',
  }));

  const closedCount = (await readJson(path.join(STORE, 'audit-counts.json'), {}))?.[`${market}-${horizon}`] ?? 0;

  return {
    published: {
      market,
      horizon,
      asOf,
      turnover30d,
      sampleWarning: closedCount < 30,
      stoppedOut,
      // An empty board must explain itself. The most common case is not a bug:
      // METHODOLOGY §10.4 — the ultra-long model needs a decade of tagged annual
      // statements, which SEC XBRL provides for US filers and no keyless Korean
      // source provides at all. Publishing an unexplained empty table would read
      // as breakage; publishing a fabricated one would be worse.
      emptyReason: rows.length === 0
        ? emptyReasonFor(market, horizon, graded, ctx.hasStatements)
        : null,
      rows,
      justMissed: displaced.slice(0, 6).map((d) => ({
        ticker: d.ticker,
        name: d.name,
        score: toDisplayScore(d.score),
        displacedBy: d.displacedBy ?? 'rank',
      })),
    },
    ledger,
  };
}

/**
 * Factors that can only be computed from a company's financial statements.
 *
 * Korea has none. refresh-kr.mjs stores a daily snapshot of market cap, share
 * count and close — a cross-sectional snapshot, not a statement time series —
 * and nothing in the keyless KR path ever writes `quarters` or `annual`. So for
 * a Korean board, a horizon whose weight set cannot reach MIN_PRESENT without
 * these is not waiting on data accumulation. It is waiting on a DART key that
 * may never be configured.
 */
const STATEMENT_FACTORS = new Set([
  'fundamentalMomentum', 'earningsDrift',
  'growthQuality', 'capitalEfficiency', 'cashGeneration', 'valuation', 'fScore',
  'moatStrength', 'cashFlowDurability', 'reinvestmentRunway',
  'balanceSheetStrength', 'shareholderYield',
]);

/**
 * True when this market/horizon pair can never fill, no matter how long the
 * pipeline runs — because too many of its factors need financial statements the
 * market has no keyless source for.
 */
function structurallyUnavailable(market, horizon, hasStatements = false) {
  // `hasStatements` is measured from the store, not assumed from the market.
  // The day a DART key is configured, KR gains statements and this check must
  // stop claiming the board can never fill — otherwise the site would keep
  // explaining an absence that had already been fixed. A hard-coded
  // `market !== 'KR'` would have been the easy version and the wrong one.
  if (hasStatements) return false;
  const keys = Object.keys(WEIGHTS[horizon] ?? {});
  if (!keys.length) return false;
  const reachable = keys.filter((k) => !STATEMENT_FACTORS.has(k)).length;
  return reachable < (MIN_PRESENT[horizon] ?? 4);
}

const KR_DART_NOTICE = {
  ultra_short: null,
  mid_term: {
    en:
      'This board scores earnings revision drift and fundamental momentum, which ' +
      'need quarterly financial statements. SEC XBRL provides those for US filers; ' +
      'no keyless Korean source does, so only three of the five factors can ever be ' +
      'computed for Korea — below the completeness floor the methodology requires. ' +
      'Configuring a free DART OpenAPI key opens this board. Until then it stays ' +
      'empty rather than ranked on price action alone and presented as a ' +
      'fundamentals-aware screen.',
    ko:
      '이 순위표는 실적 전망 변화와 기초체력 개선 속도를 평가하는데, 둘 다 분기 재무제표가 ' +
      '있어야 계산됩니다. 미국은 SEC XBRL이 이를 제공하지만 한국에는 인증 없이 받아 쓸 수 ' +
      '있는 공개 소스가 없어, 다섯 개 지표 중 셋까지만 계산됩니다. 방법론이 요구하는 최소 ' +
      '지표 수에 못 미칩니다. DART 오픈API 키(무료)를 설정하면 이 순위표가 열립니다. 그 ' +
      '전까지는 주가 흐름만 보고 매긴 순위를 재무 기반 스크리너인 것처럼 내놓지 않고 ' +
      '비워 둡니다.',
  },
  long_term: {
    en:
      'Every factor on this board — growth quality, return on invested capital, ' +
      'cash generation, valuation, the Piotroski F-score — is computed from audited ' +
      'financial statements. SEC XBRL provides them for US filers; no keyless Korean ' +
      'source does. Configuring a free DART OpenAPI key opens this board. Until then ' +
      'it is deliberately empty: there is no honest way to rank long-term quality ' +
      'without the statements that define it.',
    ko:
      '이 순위표의 모든 지표 — 성장의 질, 투하자본이익률, 현금창출력, 밸류에이션, ' +
      '피오트로스키 F-스코어 — 는 감사받은 재무제표에서 나옵니다. 미국은 SEC XBRL이 ' +
      '제공하지만 한국에는 인증 없이 받아 쓸 수 있는 공개 소스가 없습니다. DART 오픈API ' +
      '키(무료)를 설정하면 이 순위표가 열립니다. 그 전까지는 일부러 비워 둡니다. ' +
      '재무제표 없이 장기 우량주를 가려낸다고 말할 방법은 없기 때문입니다.',
  },
  ultra_long: {
    en:
      'The ultra-long model requires ten years of tagged annual statements. SEC XBRL ' +
      'provides these for US filers; no keyless Korean source does. This board ' +
      'activates for Korea once a DART OpenAPI key is configured (free, optional). ' +
      'Until then it is deliberately empty rather than ranked on thinner data.',
    ko:
      '초장기 모델은 10년치 표준화된 연간 재무제표가 있어야 돌아갑니다. 미국은 SEC XBRL이 ' +
      '이를 제공하지만, 한국에는 인증 없이 받아 쓸 수 있는 공개 소스가 없습니다. DART ' +
      '오픈API 키(무료)를 설정하면 이 순위표가 열립니다. 그 전까지는 얕은 데이터로 억지로 ' +
      '순위를 매기지 않고 일부러 비워 둡니다.',
  },
};

/**
 * Explain an empty board from the gate distribution, so the page can say what
 * happened instead of showing a blank table.
 */
function emptyReasonFor(market, horizon, graded, hasStatements = false) {
  // Checked FIRST, and deliberately so.
  //
  // The generic fallback below tells the reader "this resolves as the data store
  // fills." For KR mid-term and long-term that sentence is not merely vague —
  // it is false, and it can never become true: those boards need financial
  // statements that no keyless Korean source publishes, so no amount of waiting
  // fills them. The site was making a promise the pipeline cannot keep, in two
  // languages, on a finance page. A structural limit has to read as a structural
  // limit.
  if (market === 'KR' && structurallyUnavailable(market, horizon, hasStatements)) {
    const notice = KR_DART_NOTICE[horizon];
    if (notice) return { code: 'kr_no_statements', ...notice };
  }

  const gates = new Map();
  for (const c of graded) {
    if (c.gate) gates.set(c.gate, (gates.get(c.gate) ?? 0) + 1);
  }
  const dominant = [...gates.entries()].sort((a, b) => b[1] - a[1])[0];

  if (dominant?.[0] === 'insufficient_filing_history') {
    // Reached when statements EXIST but are too short — a genuine cold start,
    // which does resolve with time. The no-statements-at-all case was handled
    // above and says something different, because it is something different.
    return {
      code: 'insufficient_filing_history',
      en: 'No company in the universe has the ten years of filing history this horizon requires.',
      ko: '이 투자 기간이 요구하는 10년치 재무 이력을 갖춘 종목이 유니버스에 없습니다.',
    };
  }
  if (dominant) {
    return {
      code: dominant[0],
      en: `Every candidate was excluded by a hard gate (most commonly: ${dominant[0].replace(/_/g, ' ')}).`,
      ko: `후보 종목이 모두 필수 조건을 통과하지 못했습니다(가장 많았던 사유: ${dominant[0].replace(/_/g, ' ')}).`,
    };
  }
  return {
    code: 'insufficient_data',
    en: 'Not enough complete factor data to rank this board today. This resolves as the data store fills.',
    ko: '오늘은 순위를 산출할 만큼 데이터가 갖춰지지 않았습니다. 데이터가 쌓이면 자연히 해소됩니다.',
  };
}

/** Hard gates that override score entirely. METHODOLOGY §1, §4.1(d), §5.1(d). */
function hardGate(row, horizon) {
  if (horizon === 'ultra_short' && row.priceLimited) return 'price_limit_censored';
  if (horizon === 'long_term' || horizon === 'ultra_long') {
    const d = distressGate(row);
    if (d) return d;
  }
  if (horizon === 'mid_term') {
    const f = piotroski(row.quarters?.at(-1), row.quarters?.at(-5));
    if (f && f.score < 4) return 'f_score_below_4';
  }
  if (horizon === 'ultra_long' && (row.annual?.length ?? 0) < 10) return 'insufficient_filing_history';
  return null;
}

function computeFactors(row, horizon, ctx) {
  switch (horizon) {
    case 'ultra_short':
      return ultraShortFactors(row, row.sentiment);
    case 'mid_term':
      return midTermFactors(row, {
        sectorBars: row.sectorBars,
        sectorStrength: row.sectorStrength,
        asOf: ctx.asOf,
      });
    case 'long_term': {
      const f = longTermFactors(row);
      // Carry the derived rate through so the fair-value band can use it.
      const q = row.quarters ?? [];
      const rev = ttm(q, 'revenue');
      f._growthRate = isNum(rev) && isNum(row.revenueTTM3yrAgo) && row.revenueTTM3yrAgo > 0
        ? (rev / row.revenueTTM3yrAgo) ** (1 / 3) - 1
        : estimateGrowth(q);
      return f;
    }
    case 'ultra_long': {
      const f = ultraLongFactors(row);
      if (!f) return null;
      f._impliedGrowth = f.reinvestmentRunway;
      f._growthRate = estimateAnnualGrowth(row.annual);
      return f;
    }
    default:
      return null;
  }
}

function estimateGrowth(quarters) {
  if (!quarters || quarters.length < 8) return null;
  const now = quarters.slice(-4).reduce((a, q) => a + (q.revenue ?? 0), 0);
  const prior = quarters.slice(-8, -4).reduce((a, q) => a + (q.revenue ?? 0), 0);
  if (!(prior > 0) || !(now > 0)) return null;
  return now / prior - 1;
}

function estimateAnnualGrowth(annual) {
  if (!annual || annual.length < 5) return null;
  const first = annual[0]?.revenue;
  const last = annual[annual.length - 1]?.revenue;
  const n = annual.length - 1;
  if (!(first > 0) || !(last > 0)) return null;
  return (last / first) ** (1 / n) - 1;
}

/**
 * A previously published pick whose stop was breached leaves the board
 * immediately, overriding hysteresis. METHODOLOGY §7.
 */
async function detectStopOuts(previous, ctx) {
  const out = new Set();
  for (const p of previous) {
    if (!isNum(p.stop)) continue;
    const bars = ctx.prices.bars[p.ticker];
    if (!bars?.length) continue;
    const since = bars.filter((b) => b.date > (p.entryDate ?? ''));
    if (since.some((b) => b.low <= p.stop)) out.add(p.ticker);
  }
  return out;
}

function computeTurnover30d(history, board, asOf, prev) {
  // Exclude any entry for today: on a replay it is this run's own output, and
  // comparing the board against itself reports 0% turnover on every re-run.
  const recent = history.filter((h) => h.date !== asOf).slice(-30);
  if (recent.length < 1) return board.length ? 1 : 0;
  if (recent.length === 1) {
    const prevSet = new Set((prev ?? []).filter((p) => p.rank != null).map((p) => p.ticker));
    if (prevSet.size === 0) return board.length ? 1 : 0;
    return board.filter((r) => !prevSet.has(r.ticker)).length / Math.max(1, board.length);
  }
  let changes = 0;
  for (let i = 1; i < recent.length; i++) {
    const prev = new Set(recent[i - 1].tickers);
    changes += recent[i].tickers.filter((t) => !prev.has(t)).length / Math.max(1, recent[i].tickers.length);
  }
  return changes / (recent.length - 1);
}

function renderRow(r, horizon, market) {
  const trade = tradeParameters(r, horizon) ?? {};
  r.trade = trade;
  const bars = r.bars;
  const last = bars[bars.length - 1];
  const prev = bars[bars.length - 2];
  const changePct = prev?.close > 0 ? ((last.close / prev.close - 1) * 100) : 0;

  const factors = {};
  for (const [k, z] of Object.entries(r.factorZ ?? {})) {
    factors[k] = {
      raw: isNum(r.factors?.[k]) ? round3(r.factors[k]) : null,
      z: isNum(z) ? round3(z) : null,
    };
  }

  const flags = [];
  if (r.priceLimited) flags.push('price_limit');
  if (r.completeness < 1) flags.push('partial_data');
  if (r.stoppedOut) flags.push('stopped_out');

  return {
    rank: r.rank,
    movement: r.movement,
    // Computed by hysteresis and persisted, but previously dropped on the way
    // to the published JSON — so "held for N sessions" could never be shown.
    heldSessions: r.heldSessions ?? 1,
    ticker: r.ticker,
    name: r.name,
    market,
    sector: r.sector,
    currency: r.currency,
    price: round2(last.close),
    changePct: round2(changePct),
    score: toDisplayScore(r.score),
    rawZ: round3(r.score),
    completeness: round2(r.completeness),
    riskGauge: r.riskGauge ?? 3,
    entry: trade.entry ?? null,
    stop: trade.stop ?? null,
    targets: trade.targets ?? null,
    targetBasis: trade.targetBasis ?? 'atr',
    thesisInvalidation: trade.thesisInvalidation ?? null,
    maxHoldSessions: trade.maxHoldSessions ?? null,
    catalyst: catalystSummary(r.news, market === 'KR' ? 'ko' : 'en'),
    catalystCluster: r.catalystCluster,
    factors,
    sparkline: bars.slice(-30).map((b) => round2(b.close)),
    newsCount: r.newsCount ?? 0,
    sentiment: isNum(r.sentiment) ? round3(r.sentiment) : null,
    flags,
  };
}

const round2 = (x) => (isNum(x) ? Math.round(x * 100) / 100 : null);
const round3 = (x) => (isNum(x) ? Math.round(x * 1000) / 1000 : null);

export { HORIZONS_META };

/**
 * `pathToFileURL`, not string interpolation.
 *
 * Interpolating argv[1] into a "file://" string produces file://C:\Users\...
 * on Windows, while `import.meta.url` is file:///C:/Users/... — different slash
 * count, opposite separators. The comparison is therefore ALWAYS false on
 * Windows, so `main()` never runs, the process exits 0, and the script prints
 * nothing. Running `npm run rank` on Windows looked exactly like a successful
 * no-op.
 *
 * Found because a verification script spawned this one as a subprocess and got
 * back silence and a zero exit code — the most convincing way for a program to
 * report success while doing nothing at all.
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('[rank] fatal:', err);
    process.exit(1);
  });
}
