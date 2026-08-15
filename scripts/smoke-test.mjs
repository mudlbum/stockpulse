#!/usr/bin/env node
/**
 * End-to-end offline smoke test.
 *
 * Seeds `data-store/` with synthetic-but-correctly-shaped data, runs the REAL
 * ranking and audit scripts against it, and validates the published output
 * against the schema the site consumes.
 *
 * This exists because the environment this project was developed in blocks
 * every finance host, so the network fetchers cannot be exercised locally. What
 * CAN be exercised is everything downstream of them — which is where the logic
 * lives. `--live` additionally probes the real sources and is meant to be run
 * once from GitHub Actions as the first-run verification.
 *
 * Usage:
 *   node scripts/smoke-test.mjs           offline, seeds and validates
 *   node scripts/smoke-test.mjs --live    also probe real endpoints
 *   node scripts/smoke-test.mjs --keep    do not restore the previous store
 */

import { execFileSync } from 'node:child_process';
import { cp, rm, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { makeAnnual, makeBalance, makeBars, makeQuarters } from '../tests/fixtures/generate.mjs';
import { ROOT, STORE, SRC_DATA, writeJson, readJson } from './lib/store.mjs';

const LIVE = process.argv.includes('--live');
const KEEP = process.argv.includes('--keep');
const BACKUP = path.join(ROOT, '.store-backup');

const US_SECTORS = ['Information Technology', 'Health Care', 'Financials', 'Consumer Discretionary',
  'Energy', 'Industrials', 'Materials', 'Utilities', 'Real Estate', 'Communication Services', 'Consumer Staples'];
const SECTOR_ETFS = { XLK: 'Information Technology', XLV: 'Health Care', XLF: 'Financials',
  XLY: 'Consumer Discretionary', XLE: 'Energy', XLI: 'Industrials', XLB: 'Materials',
  XLU: 'Utilities', XLRE: 'Real Estate', XLC: 'Communication Services', XLP: 'Consumer Staples' };

const fail = [];
const pass = [];
function check(name, cond, detail = '') {
  if (cond) pass.push(name);
  else fail.push(`${name}${detail ? ` — ${detail}` : ''}`);
}

async function seed() {
  const usPrices = { market: 'US', bars: {} };
  const usFund = { market: 'US', companies: {} };
  const usTickers = [];

  for (let i = 0; i < 90; i++) {
    const ticker = `US${String(i).padStart(2, '0')}`;
    const sector = US_SECTORS[i % US_SECTORS.length];
    usPrices.bars[ticker] = makeBars({
      n: 400, seed: 1000 + i, start: 20 + i * 3,
      drift: 0.0001 + (i % 9) * 0.00012, vol: 0.010 + (i % 6) * 0.004,
      volume: 3_000_000 + i * 90_000, volTrend: (i % 5) * 0.35,
    });
    const quarters = makeQuarters({
      n: 16, revenue0: 800_000_000 + i * 7_000_000,
      growth: 0.005 + (i % 11) * 0.008, margin: 0.06 + (i % 9) * 0.035,
      marginTrend: ((i % 5) - 2) * 0.002, endDate: '2026-06-30',
    });
    usFund.companies[ticker] = {
      quarters,
      annual: makeAnnual({ n: 12, revenue0: 2_000_000_000 + i * 30_000_000, growth: 0.03 + (i % 8) * 0.02, margin: 0.18 + (i % 10) * 0.045 }),
      balance: makeBalance({ revenue: 3_000_000_000 + i * 40_000_000 }),
      lastFiled: '2026-08-05',
      entityName: `US Test Company ${i}`,
      updatedAt: new Date().toISOString(),
      fundamentalsCurrent: quarters.at(-1),
      fundamentalsPrior: quarters.at(-5),
    };
    usTickers.push({ ticker, name: `US Test Company ${i}`, cik: String(i).padStart(10, '0'), sector, marketCap: (3e9 + i * 4e7) });
  }
  for (const [etf, sector] of Object.entries(SECTOR_ETFS)) {
    usPrices.bars[etf] = makeBars({ n: 400, seed: 7000 + sector.length, start: 100, drift: 0.0003, vol: 0.010 });
  }
  usPrices.bars.SPY = makeBars({ n: 400, seed: 999, start: 500, drift: 0.0004, vol: 0.009 });

  const krPrices = { market: 'KR', bars: {} };
  const krFund = { market: 'KR', companies: {} };
  const krTickers = [];
  const KR_SECTORS = ['반도체 제조업', '전자부품 제조업', '자동차 제조업', '의약품 제조업',
    '금융업', '화학물질 제조업', '소프트웨어 개발', '유통업', '건설업'];

  for (let i = 0; i < 60; i++) {
    const ticker = String(100000 + i * 137).padStart(6, '0');
    const sector = KR_SECTORS[i % KR_SECTORS.length];
    krPrices.bars[ticker] = makeBars({
      n: 400, seed: 5000 + i, start: 8000 + i * 900,
      drift: 0.00008 + (i % 7) * 0.00014, vol: 0.013 + (i % 5) * 0.005,
      volume: 500_000 + i * 30_000,
    });
    const quarters = makeQuarters({ n: 12, revenue0: 200_000_000_000 + i * 9e9, growth: 0.004 + (i % 9) * 0.009, margin: 0.05 + (i % 7) * 0.03 });
    krFund.companies[ticker] = {
      quarters, annual: [], balance: makeBalance({ revenue: 8e11 + i * 2e10 }),
      sector, snapshots: [{ date: '2026-08-14', marketCap: 5e11 + i * 8e10, shares: 5e7, close: 8000 + i * 900 }],
      updatedAt: new Date().toISOString(),
      fundamentalsCurrent: quarters.at(-1), fundamentalsPrior: quarters.at(-5),
    };
    krTickers.push({ ticker, name: `한국테스트${i}`, sector, exchange: i % 3 === 0 ? 'KOSDAQ' : 'KOSPI', marketCap: 5e11 + i * 8e10, priceLimited: i === 7 });
  }
  krPrices.bars.KS11 = makeBars({ n: 400, seed: 888, start: 2600, drift: 0.00025, vol: 0.010 });

  await writeJson(path.join(STORE, 'prices', 'us.json'), usPrices);
  await writeJson(path.join(STORE, 'prices', 'kr.json'), krPrices);
  await writeJson(path.join(STORE, 'fundamentals', 'us.json'), usFund);
  await writeJson(path.join(STORE, 'fundamentals', 'kr.json'), krFund);
  await writeJson(path.join(SRC_DATA, 'universe-us.json'), { market: 'US', asOf: '2026-08-14', count: usTickers.length, tickers: usTickers, sectorEtfs: SECTOR_ETFS }, { pretty: true });
  await writeJson(path.join(SRC_DATA, 'universe-kr.json'), { market: 'KR', asOf: '2026-08-14', count: krTickers.length, tickers: krTickers }, { pretty: true });

  // A small news index so the sentiment factor and catalyst text are exercised.
  const tickersNews = {};
  for (let i = 0; i < 40; i++) {
    const t = `US${String(i).padStart(2, '0')}`;
    tickersNews[t] = [{
      title: i % 3 === 0
        ? `US Test Company ${i} beats estimates and raises guidance`
        : i % 3 === 1
          ? `US Test Company ${i} misses estimates amid weak demand`
          : `US Test Company ${i} announces a new partnership`,
      url: `https://example.com/${t}`, source: 'Test Wire',
      publishedAt: new Date(Date.now() - (i % 20) * 3_600_000).toISOString(),
      sentiment: null, kind: 'wire', lang: 'en',
    }];
  }
  await writeJson(path.join(STORE, 'news-by-ticker.json'), {
    updatedAt: new Date().toISOString(), tickers: tickersNews,
    catalysts: { US00: { id: 'c0', outlets: 4, headline: 'Sector-wide policy shift' }, US11: { id: 'c0', outlets: 4, headline: 'Sector-wide policy shift' } },
  });

  // The universe as-of date must be a date that actually exists in the bars,
  // or every ledger entry is stamped after the end of history and nothing can
  // ever fill — which would leave the audit path silently unexercised.
  const usLast = usPrices.bars.US00.at(-1).date;
  const krLast = krPrices.bars[krTickers[0].ticker].at(-1).date;
  await writeJson(path.join(SRC_DATA, 'universe-us.json'),
    { market: 'US', asOf: usLast, count: usTickers.length, tickers: usTickers, sectorEtfs: SECTOR_ETFS }, { pretty: true });
  await writeJson(path.join(SRC_DATA, 'universe-kr.json'),
    { market: 'KR', asOf: krLast, count: krTickers.length, tickers: krTickers }, { pretty: true });

  // Backdated ledger so evaluate.mjs has trades that can actually open, run and
  // close. Without this the audit publishes an empty summary and none of the
  // fill / stop / cost / control logic — the part the site's credibility rests
  // on — is ever executed.
  await seedHistoricalLedger(usPrices, usTickers);

  console.log(`[smoke] seeded ${usTickers.length} US + ${krTickers.length} KR names (as-of ${usLast})`);
}

async function seedHistoricalLedger(prices, tickers) {
  const entries = [];
  const horizons = [
    ['ultra_short', 5], ['mid_term', 45], ['long_term', 504], ['ultra_long', 2520],
  ];

  for (let d = 0; d < 60; d++) {
    for (const [horizon, maxHold] of horizons) {
      // Publish on a cadence roughly matching each horizon's turnover.
      const cadence = horizon === 'ultra_short' ? 1 : horizon === 'mid_term' ? 5 : 21;
      if (d % cadence !== 0) continue;

      // Offset the ticker draw and the entry bar PER HORIZON. Without this,
      // long_term and ultra_long collapse onto the same picks on the same dates
      // (Math.min(maxHold, 40) is 40 for both, and the cadence matches), so the
      // audit reports byte-identical statistics for two horizons and the test
      // silently stops distinguishing them.
      const hOffset = horizons.findIndex(([id]) => id === horizon);

      for (let k = 0; k < 4; k++) {
        const t = tickers[(d * 7 + k * 13 + hOffset * 29) % tickers.length].ticker;
        const bars = prices.bars[t];
        // Leave room after the entry so the trade can reach its exit.
        const idx = bars.length - 1 - (60 - d) - Math.min(maxHold, 40) - hOffset * 3;
        if (idx < 60) continue;
        const bar = bars[idx];
        const a = bar.close * 0.02;

        entries.push({
          date: bar.date,
          market: 'US',
          horizon,
          ticker: t,
          name: `US Test Company ${t.slice(2)}`,
          rank: k + 1,
          score: 70 - k * 3,
          factors: {},
          referencePrice: bar.close,
          // A wide entry zone for most picks, and a deliberately unfillable one
          // every 9th pick so the NO-FILL accounting is exercised too.
          entry: (d + k) % 9 === 0
            ? { low: bar.close * 0.5, high: bar.close * 0.55 }
            : { low: bar.close - 3 * a, high: bar.close + 3 * a },
          stop: horizon === 'ultra_short' || horizon === 'mid_term' ? bar.close - 1.5 * a : null,
          targets: { conservative: bar.close + a, base: bar.close + 1.8 * a, bull: bar.close + 3 * a },
          maxHoldSessions: maxHold,
          methodologyVersion: '1.0.0',
          commit: 'seed0000',
          status: 'open',
        });
      }
    }
  }
  // One void entry — the ledger is append-only, so an erroneous pick is marked
  // and kept, never deleted. The audit must still render it.
  entries.push({
    ...entries[0], ticker: 'US01', date: entries[0].date, status: 'void',
    voidReason: 'published against a stale price after a corporate action',
  });

  await writeJson(path.join(STORE, 'ledger.json'), { version: 1, entries }, { pretty: true });
  console.log(`[smoke] seeded ${entries.length} historical ledger entries`);
}

function run(script) {
  const t0 = Date.now();
  const out = execFileSync('node', [script], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  console.log(`[smoke] ${script} completed in ${Date.now() - t0}ms`);
  return out;
}

/** Validate the published files against exactly what the site reads. */
async function validate() {
  const r = await readJson(path.join(SRC_DATA, 'rankings.json'));
  check('rankings.json exists', !!r);
  check('methodologyVersion stamped', typeof r?.methodologyVersion === 'string');

  for (const market of ['US', 'KR']) {
    const regime = r?.regime?.[market];
    check(`${market} regime present`, !!regime && typeof regime.state === 'string');
    check(`${market} regime multiplier in range`, regime?.multiplier > 0 && regime?.multiplier <= 1);

    for (const h of ['ultra_short', 'mid_term', 'long_term', 'ultra_long']) {
      const b = r?.boards?.[market]?.[h];
      check(`${market}/${h} board exists`, !!b);
      if (!b) continue;

      // KR/ultra_long is EXPECTED to be empty without a DART key — METHODOLOGY
      // §10.4. What must never happen is an empty board with no explanation, or
      // an empty board that should have had rows.
      const expectedEmpty = market === 'KR' && h === 'ultra_long';
      if (expectedEmpty && b.rows.length === 0) {
        check('KR/ultra_long explains why it is empty', !!b.emptyReason?.en && !!b.emptyReason?.ko);
        check('KR/ultra_long names the right cause', b.emptyReason?.code === 'kr_no_decade_fundamentals',
          b.emptyReason?.code);
        continue;
      }
      check(`${market}/${h} has rows`, b.rows.length > 0, `got ${b.rows.length}`);
      check(`${market}/${h} at most 10 rows`, b.rows.length <= 10, `got ${b.rows.length}`);
      check(`${market}/${h} non-empty board has no emptyReason`, b.emptyReason === null);

      const seen = new Set();
      let sectorMax = 0;
      const bySector = new Map();
      for (const row of b.rows) {
        check(`${market}/${h} ${row.ticker} unique`, !seen.has(row.ticker));
        seen.add(row.ticker);
        bySector.set(row.sector, (bySector.get(row.sector) ?? 0) + 1);

        for (const f of ['rank', 'ticker', 'name', 'price', 'score', 'riskGauge', 'entry', 'factors', 'sparkline', 'flags']) {
          check(`${market}/${h} ${row.ticker} has ${f}`, row[f] !== undefined);
        }
        check(`${market}/${h} ${row.ticker} score 0-100`, row.score >= 0 && row.score <= 100, `got ${row.score}`);
        check(`${market}/${h} ${row.ticker} risk 1-5`, row.riskGauge >= 1 && row.riskGauge <= 5);
        check(`${market}/${h} ${row.ticker} entry ordered`, row.entry.low < row.entry.high);
        check(`${market}/${h} ${row.ticker} sparkline length`, row.sparkline.length > 0 && row.sparkline.length <= 30);
        check(`${market}/${h} ${row.ticker} completeness 0-1`, row.completeness > 0 && row.completeness <= 1);

        // METHODOLOGY §3.4/§4.4: short horizons publish a stop below entry.
        if (h === 'ultra_short' || h === 'mid_term') {
          check(`${market}/${h} ${row.ticker} has a stop`, typeof row.stop === 'number');
          check(`${market}/${h} ${row.ticker} stop below entry`, row.stop < row.entry.low, `stop ${row.stop} entry ${row.entry.low}`);
          check(`${market}/${h} ${row.ticker} targets ordered`,
            row.targets.conservative < row.targets.base && row.targets.base < row.targets.bull);
        }
        // METHODOLOGY §5.4/§6.4: long horizons publish NO price stop.
        if (h === 'long_term' || h === 'ultra_long') {
          check(`${market}/${h} ${row.ticker} has no price stop`, row.stop === null);
          check(`${market}/${h} ${row.ticker} has thesis invalidation`,
            Array.isArray(row.thesisInvalidation) && row.thesisInvalidation.length > 0);
        }
        // KRW must be whole won.
        if (market === 'KR') {
          check(`KR/${h} ${row.ticker} entry is whole won`,
            Number.isInteger(row.entry.low) && Number.isInteger(row.entry.high));
        }
      }
      for (const [, n] of bySector) sectorMax = Math.max(sectorMax, n);
      // METHODOLOGY §8 — the cap relaxes to 4 when fewer than 6 sectors appear.
      check(`${market}/${h} sector cap respected`, sectorMax <= 4, `max ${sectorMax} in one sector`);

      // Ranks must be dense and ordered.
      const ranks = b.rows.map((x) => x.rank);
      check(`${market}/${h} ranks are 1..n`, ranks.every((v, i) => v === i + 1), JSON.stringify(ranks));
    }
  }

  // A price-limited Korean name must never appear on the ultra-short board.
  const krUniverse = await readJson(path.join(SRC_DATA, 'universe-kr.json'));
  const limited = new Set((krUniverse?.tickers ?? []).filter((t) => t.priceLimited).map((t) => t.ticker));
  const krShort = r?.boards?.KR?.ultra_short?.rows ?? [];
  check('price-limited KR names excluded from ultra short',
    !krShort.some((row) => limited.has(row.ticker)),
    [...limited].join(','));

  const s = await readJson(path.join(SRC_DATA, 'sectors.json'));
  check('sectors.json exists', !!s);
  check('sectors has US tiles', (s?.markets?.US?.sectors?.length ?? 0) > 0);
  const weights = (s?.markets?.US?.sectors ?? []).reduce((a, x) => a + x.weight, 0);
  check('sector weights sum to ~1', Math.abs(weights - 1) < 0.02, `got ${weights.toFixed(3)}`);

  const p = await readJson(path.join(SRC_DATA, 'performance.json'));
  check('performance.json exists', !!p);
  check('performance has overall summary', !!p?.summary?.overall);
  check('performance has all four horizons', Object.keys(p?.summary?.byHorizon ?? {}).length === 4);
  check('performance conventions published', !!p?.conventions?.fill);

  // ── the audit path itself. METHODOLOGY §9. ────────────────────────────────
  const o = p?.summary?.overall ?? {};
  const closed = (p?.closed ?? []).filter((t) => t.status === 'closed');
  check('audit produced closed trades', closed.length > 0, `got ${closed.length}`);
  check('audit produced open trades', (p?.open ?? []).length > 0);
  check('audit recorded no-fills', o.noFill > 0, `got ${o.noFill} — the unfillable seeds should have been rejected`);
  check('audit kept the void entry visible',
    (p?.closed ?? []).some((t) => t.status === 'void' && t.voidReason));

  check('win rate is a fraction', o.winRate === null || (o.winRate >= 0 && o.winRate <= 1), String(o.winRate));
  check('random-pick control is computed', typeof o.controlWinRate === 'number', String(o.controlWinRate));
  check('benchmark return is computed', typeof o.benchmarkReturn === 'number');
  check('return distribution is published, not just the mean',
    typeof o.p10 === 'number' && typeof o.p90 === 'number' && o.p10 <= o.p90);
  check('equity curve has points', (p?.equityCurve ?? []).length > 0);
  check('equity curve carries a benchmark series',
    (p?.equityCurve ?? []).every((pt) => typeof pt.benchmark === 'number'));

  for (const t of closed) {
    check(`trade ${t.ticker} net return is below gross (costs charged)`,
      t.netReturnPct < t.returnPct, `${t.netReturnPct} vs ${t.returnPct}`);
    check(`trade ${t.ticker} has an exit reason`,
      ['stop', 'target', 'max_hold', 'forced'].includes(t.exitReason), t.exitReason);
    check(`trade ${t.ticker} holds within its cap`,
      t.holdDays <= (t.horizon === 'ultra_short' ? 5 : t.horizon === 'mid_term' ? 45 : 504),
      `${t.horizon} held ${t.holdDays}`);
  }
  // Every stop-exit must have booked a loss — if a "stop" ever shows a profit,
  // the intrabar ambiguity rule has been inverted.
  const stopped = closed.filter((t) => t.exitReason === 'stop');
  check('every stop exit booked a loss', stopped.every((t) => t.netReturnPct < 0),
    stopped.filter((t) => t.netReturnPct >= 0).map((t) => `${t.ticker}:${t.netReturnPct}`).join(','));
  check('stop exits actually occurred', stopped.length > 0, 'no stops triggered in the seeded window');

  const counts = await readJson(path.join(STORE, 'audit-counts.json'), {});
  check('audit counts written for sampleWarning', Object.keys(counts).length > 0);

  // Two horizons reporting byte-identical statistics means they are sharing a
  // ledger slice somewhere. Here it was a fixture collapse rather than a
  // pipeline bug, but it is worth asserting against permanently.
  const sig = (h) => JSON.stringify(
    (p?.closed ?? []).filter((t) => t.horizon === h).map((t) => `${t.ticker}@${t.date}`),
  );
  const horizonSigs = ['ultra_short', 'mid_term', 'long_term', 'ultra_long'].map((h) => [h, sig(h)]);
  for (let i = 0; i < horizonSigs.length; i++) {
    for (let j = i + 1; j < horizonSigs.length; j++) {
      if (horizonSigs[i][1] === '[]' || horizonSigs[j][1] === '[]') continue;
      check(`${horizonSigs[i][0]} and ${horizonSigs[j][0]} are distinct trade sets`,
        horizonSigs[i][1] !== horizonSigs[j][1]);
    }
  }

  const ledger = await readJson(path.join(STORE, 'ledger.json'));
  check('ledger populated', (ledger?.entries?.length ?? 0) > 0, `${ledger?.entries?.length} entries`);
  check('ledger entries carry a methodology version',
    (ledger?.entries ?? []).every((e) => e.methodologyVersion));
  check('ledger entries carry a commit', (ledger?.entries ?? []).every((e) => e.commit));
}

/** Idempotency: a second run over unchanged inputs must not churn the ledger. */
async function checkIdempotence() {
  const before = (await readJson(path.join(STORE, 'ledger.json')))?.entries?.length ?? 0;
  run('scripts/build-rankings.mjs');
  const after = (await readJson(path.join(STORE, 'ledger.json')))?.entries?.length ?? 0;
  check('ledger is idempotent for the same as-of date', before === after, `${before} -> ${after}`);
}

async function liveProbe() {
  console.log('\n[smoke] --live: probing real endpoints…');
  const { fetchUsTickerMap, fetchLatestKrxListing, fetchYahooChart, fetchNaverDaily } = await import('./lib/sources.mjs');
  const { fetchAllNews } = await import('./lib/news.mjs');

  const probes = [
    ['SEC company_tickers', async () => (await fetchUsTickerMap()).length > 5000],
    ['KRX mirror listing', async () => (await fetchLatestKrxListing()).rows.length > 1000],
    ['Yahoo chart AAPL', async () => (await fetchYahooChart('AAPL', { range: '1mo' })).length > 10],
    ['Naver siseJson 005930', async () => (await fetchNaverDaily('005930', { start: '20260701', end: '20260814' })).length > 5],
    ['news feeds', async () => (await fetchAllNews()).health.filter((f) => f.status === 'ok').length >= 3],
  ];
  for (const [name, fn] of probes) {
    try {
      const ok = await fn();
      check(`live: ${name}`, ok);
      console.log(`[smoke]   ${ok ? 'OK  ' : 'FAIL'} ${name}`);
    } catch (err) {
      check(`live: ${name}`, false, String(err.message).slice(0, 90));
      console.log(`[smoke]   ERR  ${name}: ${String(err.message).slice(0, 90)}`);
    }
  }
}

async function main() {
  if (!KEEP && existsSync(STORE)) {
    await rm(BACKUP, { recursive: true, force: true });
    await cp(STORE, BACKUP, { recursive: true });
  }
  await mkdir(STORE, { recursive: true });

  await seed();
  run('scripts/build-rankings.mjs');
  run('scripts/evaluate.mjs');
  await validate();
  await checkIdempotence();
  if (LIVE) await liveProbe();

  if (!KEEP && existsSync(BACKUP)) {
    await rm(STORE, { recursive: true, force: true });
    await cp(BACKUP, STORE, { recursive: true });
    await rm(BACKUP, { recursive: true, force: true });
    console.log('[smoke] restored the previous data-store');
  }

  console.log(`\n[smoke] ${pass.length} checks passed, ${fail.length} failed`);
  if (fail.length) {
    for (const f of fail.slice(0, 40)) console.error('  FAIL', f);
    process.exit(1);
  }
  console.log('[smoke] OK');
}

main().catch((err) => {
  console.error('[smoke] fatal:', err);
  process.exit(1);
});
