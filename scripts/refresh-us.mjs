#!/usr/bin/env node
/**
 * US market refresh: universe, prices, fundamentals.
 *
 * Runs post-close. Writes into `data-store/`; produces no published output on
 * its own — build-rankings.mjs consumes the store.
 *
 * Bootstrapping is INCREMENTAL AND RESUMABLE by design. A cold start needs a
 * year of bars for ~600 tickers, which at a safe request rate is longer than
 * one comfortable Actions run. So each run tops up at most BOOTSTRAP_BUDGET
 * tickers that lack history, and the store fills over a few days while the
 * already-covered names keep updating daily. A run that dies mid-way loses
 * nothing — the store is committed and the next run resumes from it.
 */

import {
  fetchUsTickerMap, fetchYahooChart, fetchStooqDaily, fetchCompanyFacts, fetchSecProfile,
  extractConcept, CONCEPTS, INSTANTANEOUS,
} from './lib/sources.mjs';
import { healthReport, mapLimit } from './lib/http.mjs';
import {
  loadPrices, savePrices, mergeBars, loadFundamentals, saveFundamentals,
  loadProfiles, saveProfiles, publish,
} from './lib/store.mjs';
import { medianDollarVolume } from './lib/indicators.mjs';
import { sectorForSic } from './lib/sic.mjs';
import { isNum } from './lib/stats.mjs';

const MARKET = 'US';
const TARGET_UNIVERSE = Number(process.env.US_UNIVERSE ?? 600);
const BOOTSTRAP_BUDGET = Number(process.env.US_BOOTSTRAP ?? 120);
const FUNDAMENTAL_BUDGET = Number(process.env.US_FUNDAMENTALS ?? 60);
/**
 * Per-run cap on SEC submissions fetches.
 *
 * Deliberately modest. The first version set this to 250 on the reasoning that
 * a profile is fetched once and cached forever, so a big cold start is a
 * one-off cost. That reasoning ignored the shared budget: 250 submissions
 * documents (160KB each) landed SEC in a 429 storm and the 60 companyfacts
 * fetches queued behind them ALL failed, so the run updated fundamentals for
 * zero companies. Metadata starved the load-bearing data.
 *
 * This file's own stated design is incremental and resumable — the price
 * bootstrap has worked that way from the start. Profiles now follow the same
 * rule: fill a bit each run, resume from the committed store, never spend the
 * whole budget on the least important thing.
 */
const PROFILE_BUDGET = Number(process.env.US_PROFILES ?? 80);
const BENCHMARKS = ['SPY', 'QQQ', 'IWM'];

/** Sector composites. The eleven SPDR sector ETFs give a free, ready-made
 *  return series per sector; per-stock membership comes from the filer's SIC
 *  code via scripts/lib/sic.mjs, and the two use identical sector names on
 *  purpose so a stock and its composite always refer to the same bucket. */
const SECTOR_ETFS = {
  XLK: 'Information Technology', XLV: 'Health Care', XLF: 'Financials',
  XLY: 'Consumer Discretionary', XLP: 'Consumer Staples', XLE: 'Energy',
  XLI: 'Industrials', XLB: 'Materials', XLU: 'Utilities',
  XLRE: 'Real Estate', XLC: 'Communication Services',
};

async function fetchBars(symbol, range) {
  try {
    return await fetchYahooChart(symbol, { range });
  } catch (err) {
    // Stooq is a deliberate second choice: pandas-datareader dropped it from
    // master, and it answers rate-limit refusals with HTTP 200 and a plain-text
    // body. sources.mjs sniffs for that, so a limit hit throws here rather than
    // silently writing a phantom bar.
    try {
      return await fetchStooqDaily(`${symbol.toLowerCase()}.us`);
    } catch {
      throw err;
    }
  }
}

async function main() {
  const started = Date.now();
  console.log('[us] fetching ticker map from SEC…');
  const tickers = await fetchUsTickerMap();
  console.log(`[us] ${tickers.length} tickers in SEC map`);

  const prices = await loadPrices(MARKET);
  const fundamentals = await loadFundamentals(MARKET);
  const profiles = await loadProfiles(MARKET);

  // company_tickers.json is generated in market-cap order, which is the only
  // free large-cap proxy available before any prices are loaded.
  const candidates = tickers
    .filter((t) => /^[A-Z]{1,5}$/.test(t.ticker))
    .slice(0, Math.max(TARGET_UNIVERSE * 2, 1200));

  const symbols = [...new Set([...BENCHMARKS, ...Object.keys(SECTOR_ETFS), ...candidates.map((c) => c.ticker)])];

  const known = new Set(Object.keys(prices.bars));
  const needBootstrap = symbols.filter((s) => !known.has(s) || (prices.bars[s]?.length ?? 0) < 250);
  const needUpdate = symbols.filter((s) => known.has(s) && (prices.bars[s]?.length ?? 0) >= 250);

  const bootstrapNow = needBootstrap.slice(0, BOOTSTRAP_BUDGET);
  console.log(
    `[us] prices: ${needUpdate.length} to update, ${needBootstrap.length} need history ` +
    `(bootstrapping ${bootstrapNow.length} this run)`,
  );

  // Incremental updates: 1 month is enough to close any gap from a missed run
  // while staying cheap.
  const upd = await mapLimit(needUpdate, 3, async (sym) => {
    const bars = await fetchBars(sym, '1mo');
    return { sym, bars };
  });
  for (const r of upd.results) {
    if (r?.bars?.length) prices.bars[r.sym] = mergeBars(prices.bars[r.sym], r.bars);
  }

  const boot = await mapLimit(bootstrapNow, 3, async (sym) => {
    const bars = await fetchBars(sym, '2y');
    return { sym, bars };
  });
  for (const r of boot.results) {
    if (r?.bars?.length) prices.bars[r.sym] = mergeBars(prices.bars[r.sym], r.bars);
  }

  await savePrices(MARKET, prices);
  console.log(`[us] price store now holds ${Object.keys(prices.bars).length} symbols`);

  // ── universe filters (METHODOLOGY §1.1) ────────────────────────────────
  const byTicker = new Map(candidates.map((c) => [c.ticker, c]));
  const universe = [];
  for (const [sym, bars] of Object.entries(prices.bars)) {
    const meta = byTicker.get(sym);
    if (!meta) continue;
    if (bars.length < 250) continue;
    const last = bars[bars.length - 1];
    if (!isNum(last?.close) || last.close < 5) continue;
    const mdv = medianDollarVolume(bars, 20);
    if (!isNum(mdv) || mdv < 5_000_000) continue;
    universe.push({ ...meta, market: MARKET, medianDollarVolume: mdv, close: last.close });
  }
  universe.sort((a, b) => b.medianDollarVolume - a.medianDollarVolume);
  const selected = universe.slice(0, TARGET_UNIVERSE);
  console.log(`[us] universe after liquidity/price filters: ${selected.length}`);

  // ── fundamentals (METHODOLOGY §5, §6) ─────────────────────────────────
  // companyfacts is a multi-megabyte document per filer, so it is refreshed on
  // a rotation rather than all at once: the least-recently-updated names are
  // topped up each run. Fundamentals move quarterly; prices move daily.
  const staleFirst = selected
    .map((s) => ({ ...s, updatedAt: fundamentals.companies[s.ticker]?.updatedAt ?? null }))
    .sort((a, b) => (a.updatedAt ?? '') < (b.updatedAt ?? '') ? -1 : 1)
    .slice(0, FUNDAMENTAL_BUDGET);

  console.log(`[us] refreshing fundamentals for ${staleFirst.length} companies…`);
  const asOf = new Date().toISOString().slice(0, 10);

  const fund = await mapLimit(staleFirst, 4, async (s) => {
    const facts = await fetchCompanyFacts(s.cik);
    return { ticker: s.ticker, parsed: parseFacts(facts, asOf) };
  });
  let ok = 0;
  for (const r of fund.results) {
    if (!r?.parsed) continue;
    fundamentals.companies[r.ticker] = { ...r.parsed, updatedAt: new Date().toISOString() };
    ok++;
  }
  await saveFundamentals(MARKET, fundamentals);
  console.log(`[us] fundamentals updated for ${ok} companies (${fund.errors.length} errors)`);

  // Profiles run AFTER fundamentals, on purpose. Both hit data.sec.gov and share
  // one rate budget; fundamentals feed the scoring models while a profile only
  // labels a name. When the budget runs short the metadata must be what degrades.
  // ── company profiles → sector (METHODOLOGY §1.3) ──────────────────────
  // Fetched once per company and cached permanently; a SIC code does not move.
  // Names whose SIC maps to nothing keep `sector: null` and are recorded so the
  // next run does not retry them forever — null is a real answer here, and the
  // diversification cap is built to treat it as an absence rather than as a
  // bucket. See scripts/lib/sic.mjs.
  const needProfile = selected.filter((s) => profiles.companies[s.ticker]?.fetchedAt == null);
  const profileNow = needProfile.slice(0, PROFILE_BUDGET);
  if (profileNow.length) {
    console.log(`[us] fetching SEC profiles for ${profileNow.length} companies (${needProfile.length} missing)…`);
  }
  const prof = await mapLimit(profileNow, 4, async (s) => {
    const p = await fetchSecProfile(s.cik);
    return { ticker: s.ticker, profile: p };
  });
  for (const r of prof.results) {
    if (!r?.profile) continue;
    profiles.companies[r.ticker] = {
      cik: r.profile.cik,
      sic: r.profile.sic,
      sicDescription: r.profile.sicDescription,
      sector: sectorForSic(r.profile.sic),
      exchanges: r.profile.exchanges,
      fetchedAt: new Date().toISOString(),
    };
  }
  if (profileNow.length) await saveProfiles(MARKET, profiles);

  for (const s of selected) s.sector = profiles.companies[s.ticker]?.sector ?? null;
  const withSector = selected.filter((s) => s.sector).length;
  const distinctSectors = new Set(selected.map((s) => s.sector).filter(Boolean)).size;
  console.log(
    `[us] sector coverage: ${withSector}/${selected.length} names across ${distinctSectors} sectors`,
  );
  // Coverage this low means the diversification cap has nothing to work with
  // and every board will truncate at the cap. Warn loudly; do not fail, because
  // a partially-filled cold start is a legitimate state.
  if (selected.length >= 50 && withSector / selected.length < 0.5) {
    console.warn(
      `[us] WARNING: fewer than half the universe has a sector. Boards will be ` +
      `capped short until profiles fill in. Missing: ${needProfile.length - profileNow.length} still queued.`,
    );
  }


  await publish('universe-us', {
    market: MARKET,
    asOf,
    count: selected.length,
    tickers: selected.map((s) => ({
      ticker: s.ticker, name: s.name, cik: s.cik, sector: s.sector ?? null,
    })),
    sectorEtfs: SECTOR_ETFS,
    sectorCoverage: { withSector, total: selected.length, distinctSectors },
  });

  const health = healthReport();
  console.log(`[us] done in ${Math.round((Date.now() - started) / 1000)}s`);
  console.table(health);

  const failures = [...upd.errors, ...boot.errors, ...prof.errors, ...fund.errors];
  if (failures.length) {
    console.warn(`[us] ${failures.length} item-level failures; first 5:`);
    for (const f of failures.slice(0, 5)) console.warn('   ', f.item, '→', f.error);
  }
  // A refresh that produced nothing usable is a failure, not a quiet no-op —
  // otherwise the site would keep publishing yesterday's numbers under today's
  // date. Exit non-zero so the workflow surfaces it.
  if (selected.length < 50) {
    console.error('[us] FATAL: universe collapsed below 50 names — refusing to proceed');
    process.exitCode = 1;
  }
}

/**
 * Reduce a companyfacts document to the fields the factor models need.
 * Point-in-time filtered on `filed` (METHODOLOGY P2).
 */
export function parseFacts(facts, asOf) {
  if (!facts?.facts) return null;
  const series = {};
  for (const key of Object.keys(CONCEPTS)) {
    series[key] = extractConcept(facts, key, { asOf });
  }

  // Quarterly income/cash-flow series. 10-Q values are quarterly, but a 10-K's
  // annual figure is NOT a fourth quarter — mixing them makes Q4 look four
  // times the size of the others. Duration entries are therefore matched on
  // their own start/end span rather than on the form type.
  const quarters = buildQuarterly(series, asOf);
  const annual = buildAnnual(facts, asOf);
  const balanceLatest = latestInstant(series, asOf);

  return {
    quarters,
    annual,
    balance: balanceLatest,
    lastFiled: latestFiledDate(series),
    entityName: facts.entityName ?? null,
  };
}

function isQuarterSpan(e) {
  if (!e.start || !e.end) return false;
  const days = (new Date(e.end) - new Date(e.start)) / 86_400_000;
  return days >= 60 && days <= 115;
}

function isAnnualSpan(e) {
  if (!e.start || !e.end) return false;
  const days = (new Date(e.end) - new Date(e.start)) / 86_400_000;
  return days >= 330 && days <= 400;
}

function buildQuarterly(series, asOf) {
  const durationKeys = Object.keys(CONCEPTS).filter((k) => !INSTANTANEOUS.has(k));
  const byEnd = new Map();
  for (const key of durationKeys) {
    for (const e of series[key] ?? []) {
      if (!isQuarterSpan(e)) continue;
      if (new Date(e.filed) > new Date(asOf)) continue;
      if (!byEnd.has(e.end)) byEnd.set(e.end, { end: e.end, filed: e.filed });
      const row = byEnd.get(e.end);
      row[key] = e.val;
      if (new Date(e.filed) > new Date(row.filed)) row.filed = e.filed;
    }
  }
  // Balance-sheet items are attached at their own instant so Piotroski can
  // compare like periods.
  // Plain iteration. This was `durationKeys.length ? [...INSTANTANEOUS] : []`,
  // a guard that can never be false: durationKeys is CONCEPTS minus the
  // instantaneous ones and CONCEPTS always contains duration concepts. A
  // condition that cannot fail reads as a safety check and hides that there
  // isn't one — the real guard is `if (row)` two lines down, which skips an
  // instant with no matching quarter.
  for (const key of INSTANTANEOUS) {
    for (const e of series[key] ?? []) {
      if (e.start) continue;
      const row = byEnd.get(e.end);
      if (row) row[key] = e.val;
    }
  }
  return [...byEnd.values()].sort((a, b) => (a.end < b.end ? -1 : 1)).slice(-24);
}

function buildAnnual(facts, asOf) {
  const out = new Map();
  for (const key of Object.keys(CONCEPTS)) {
    const entries = extractConcept(facts, key, { asOf, annualOnly: true });
    for (const e of entries) {
      const span = e.start ? isAnnualSpan(e) : true;
      if (!span) continue;
      const fy = e.fy;
      if (!fy) continue;
      if (!out.has(fy)) out.set(fy, { fy, end: e.end });
      out.get(fy)[key] = e.val;
    }
  }
  return [...out.values()].sort((a, b) => a.fy - b.fy).slice(-12);
}

function latestInstant(series, asOf) {
  const b = {};
  for (const key of INSTANTANEOUS) {
    const entries = (series[key] ?? []).filter((e) => !e.start && new Date(e.filed) <= new Date(asOf));
    if (entries.length) b[key] = entries[entries.length - 1].val;
  }
  return Object.keys(b).length ? b : null;
}

function latestFiledDate(series) {
  let latest = null;
  for (const key of Object.keys(series)) {
    for (const e of series[key] ?? []) {
      if (!latest || new Date(e.filed) > new Date(latest)) latest = e.filed;
    }
  }
  return latest;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[us] fatal:', err);
    process.exit(1);
  });
}
