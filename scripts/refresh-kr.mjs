#!/usr/bin/env node
/**
 * Korean market refresh.
 *
 * Source strategy, and why it is not the obvious one:
 *
 * KRX made login mandatory on 2025-12-27 (membership "Data Marketplace",
 * pykrx#244) and rate-limits by IP. Calling data.krx.co.kr from shared GitHub
 * Actions egress is therefore both unreliable and inconsiderate. Instead the
 * pipeline reads FinanceData's GitHub-hosted KRX mirror: one request returns
 * price, volume, market cap and share count for EVERY listed Korean stock, it
 * is GitHub serving GitHub (no geo-block, no auth, no rate risk), and it was
 * verified fresh during design.
 *
 * Naver's siseJson is used only for split-adjusted per-ticker history, which
 * the mirror does not provide. Its behaviour from US datacenter IPs is
 * UNVERIFIED — so a Naver failure degrades to mirror-derived bars rather than
 * failing the run, and the health report says which path was taken.
 */

import {
  fetchLatestKrxListing, fetchKrxDescriptions, fetchKrIndexYear,
  fetchNaverDaily, fetchNaverXmlChart, krHazardFlag, isPriceLimited,
  fetchDartCorpCodes, fetchDartStatements,
} from './lib/sources.mjs';
import {
  readReport, quartersFromReports, annualFromReport, balanceFromReports,
  periodEnd, filedFromRcept, REPORT_ORDER, CORE_CONCEPTS,
} from './lib/dart.mjs';
import { healthReport, mapLimit } from './lib/http.mjs';
import {
  loadPrices, savePrices, mergeBars, loadFundamentals, saveFundamentals,
  loadProfiles, saveProfiles, publish,
} from './lib/store.mjs';
import { medianDollarVolume } from './lib/indicators.mjs';
import { isNum } from './lib/stats.mjs';
import { pathToFileURL } from 'node:url';

const MARKET = 'KR';
const TARGET_UNIVERSE = Number(process.env.KR_UNIVERSE ?? 350);
const BOOTSTRAP_BUDGET = Number(process.env.KR_BOOTSTRAP ?? 90);
/**
 * DART publishes full statements from 2015 onward — the API rejects an earlier
 * bsns_year outright. Eleven years is just enough for the ultra-long model's
 * ten-year requirement, and that boundary is the reason it is exactly ten.
 */
const DART_FIRST_YEAR = 2015;
/**
 * Reports per run. DART allows 20,000 requests a day, but a full decade for 350
 * companies is ~15,000 of them and far more wall-clock than one Actions run
 * should hold. The backfill is therefore incremental and resumable, exactly
 * like the US price bootstrap: spend a bounded budget on whatever is furthest
 * behind, commit, resume next run.
 */
const DART_BUDGET = Number(process.env.KR_DART_BUDGET ?? 1200);

/** METHODOLOGY §1.2 */
const MIN_PRICE = 1000;              // ₩
const MIN_MARKET_CAP = 300_000_000_000;  // ₩3,000억 ≈ USD 220M
const MIN_TRADED_VALUE = 2_000_000_000;  // ₩20억/day median

async function fetchKrBars(code, { bootstrap }) {
  const end = new Date();
  const start = new Date(end.getTime() - (bootstrap ? 760 : 45) * 86_400_000);
  const fmt = (d) => d.toISOString().slice(0, 10).replace(/-/g, '');
  try {
    const bars = await fetchNaverDaily(code, { start: fmt(start), end: fmt(end) });
    if (bars.length) return { bars, via: 'naver_json' };
  } catch { /* fall through */ }
  try {
    const bars = await fetchNaverXmlChart(code, bootstrap ? 700 : 60);
    if (bars.length) return { bars, via: 'naver_xml' };
  } catch { /* fall through */ }
  return { bars: [], via: 'none' };
}

async function main() {
  const started = Date.now();

  console.log('[kr] fetching KRX listing snapshot (GitHub mirror)…');
  const { date, rows } = await fetchLatestKrxListing(new Date(), 12);
  console.log(`[kr] listing for ${date}: ${rows.length} stocks`);

  let descriptions = new Map();
  try {
    descriptions = await fetchKrxDescriptions(date);
    console.log(`[kr] descriptions: ${descriptions.size} entries`);
  } catch (err) {
    console.warn('[kr] descriptions unavailable, sectors will be Unknown:', String(err.message).slice(0, 80));
  }

  const prices = await loadPrices(MARKET);
  const fundamentals = await loadFundamentals(MARKET);

  // ── universe filters (METHODOLOGY §1.2) ────────────────────────────────
  const eligible = [];
  for (const r of rows) {
    if (r.marketId === 'KNX') continue;               // KONEX: too illiquid
    if (!isNum(r.close) || r.close < MIN_PRICE) continue;
    if (!isNum(r.marketCap) || r.marketCap < MIN_MARKET_CAP) continue;
    if (!isNum(r.amount) || r.amount < MIN_TRADED_VALUE) continue;
    const hazard = krHazardFlag(r.dept);
    if (hazard) continue;                             // KRX already flagged it
    const desc = descriptions.get(r.code);
    eligible.push({
      ticker: r.code,
      name: r.name,
      market: MARKET,
      exchange: r.market,
      sector: desc?.sector || null,
      industry: desc?.industry ?? null,
      listingDate: desc?.listingDate ?? null,
      marketCap: r.marketCap,
      shares: r.shares,
      close: r.close,
      changePct: r.changesRatio,
      tradedValue: r.amount,
      priceLimited: isPriceLimited(r.changesRatio),
    });
  }
  eligible.sort((a, b) => b.tradedValue - a.tradedValue);
  const selected = eligible.slice(0, TARGET_UNIVERSE);
  console.log(`[kr] universe after filters: ${selected.length} (from ${rows.length})`);

  // Today's bar for every selected name comes free from the mirror snapshot.
  // That alone keeps every series current even if Naver is unreachable.
  for (const s of selected) {
    const bar = {
      date,
      open: rows.find((r) => r.code === s.ticker)?.open ?? s.close,
      high: rows.find((r) => r.code === s.ticker)?.high ?? s.close,
      low: rows.find((r) => r.code === s.ticker)?.low ?? s.close,
      close: s.close,
      volume: rows.find((r) => r.code === s.ticker)?.volume ?? 0,
    };
    if ([bar.open, bar.high, bar.low, bar.close].every(isNum)) {
      prices.bars[s.ticker] = mergeBars(prices.bars[s.ticker], [bar]);
    }
  }

  const needBootstrap = selected.filter((s) => (prices.bars[s.ticker]?.length ?? 0) < 250);
  const bootstrapNow = needBootstrap.slice(0, BOOTSTRAP_BUDGET);
  console.log(`[kr] ${needBootstrap.length} need history (bootstrapping ${bootstrapNow.length})`);

  const via = { naver_json: 0, naver_xml: 0, none: 0 };
  const boot = await mapLimit(bootstrapNow, 2, async (s) => {
    const r = await fetchKrBars(s.ticker, { bootstrap: true });
    return { ticker: s.ticker, ...r };
  });
  for (const r of boot.results) {
    if (!r) continue;
    via[r.via] = (via[r.via] ?? 0) + 1;
    if (r.bars.length) prices.bars[r.ticker] = mergeBars(prices.bars[r.ticker], r.bars);
  }
  console.log(`[kr] history fetch paths: ${JSON.stringify(via)}`);
  if (bootstrapNow.length > 0 && via.none === bootstrapNow.length) {
    console.warn(
      '[kr] WARNING: every Naver history request failed. This is the unverified ' +
      'geo/rate risk documented in sources.mjs. Series will fill one bar per day ' +
      'from the KRX mirror instead, so long-history factors stay null for a while.',
    );
  }

  // Benchmarks: KOSPI + KOSDAQ, a full year per file.
  const year = new Date().getFullYear();
  for (const [idx, sym] of [['ks11', 'KS11'], ['kq11', 'KQ11']]) {
    try {
      const cur = await fetchKrIndexYear(idx, year);
      let prev = [];
      if (cur.length < 250) {
        try { prev = await fetchKrIndexYear(idx, year - 1); } catch { /* optional */ }
      }
      const bars = mergeBars(prev, cur);
      if (bars.length) prices.bars[sym] = mergeBars(prices.bars[sym], bars);
      console.log(`[kr] index ${sym}: ${bars.length} bars`);
    } catch (err) {
      console.warn(`[kr] index ${sym} unavailable:`, String(err.message).slice(0, 80));
    }
  }

  await savePrices(MARKET, prices);

  // Liquidity re-check against the stored series, now that bars exist.
  const withHistory = selected.filter((s) => {
    const bars = prices.bars[s.ticker];
    if (!bars || bars.length < 250) return false;
    const mdv = medianDollarVolume(bars, 20);
    return isNum(mdv) && mdv >= MIN_TRADED_VALUE;
  });

  // Korean fundamentals are a cross-sectional snapshot, not a time series.
  // The mirror gives cap and share count; anything deeper needs DART (free key,
  // optional). Snapshotting daily into the store is what turns the snapshot
  // into a series over time — see METHODOLOGY §10.4 for the confidence caveat.
  for (const s of selected) {
    const prevRec = fundamentals.companies[s.ticker] ?? { snapshots: [] };
    const snapshots = [...(prevRec.snapshots ?? []), {
      date, marketCap: s.marketCap, shares: s.shares, close: s.close,
    }].filter((x, i, arr) => arr.findIndex((y) => y.date === x.date) === i).slice(-400);
    fundamentals.companies[s.ticker] = {
      ...prevRec, snapshots, sector: s.sector, industry: s.industry,
      listingDate: s.listingDate, updatedAt: new Date().toISOString(),
    };
  }
  // Financial statements from DART, when a key is configured. This is the step
  // that turns Korea from a price-and-market-cap market into one the
  // fundamental models can actually score.
  const profiles = await loadProfiles(MARKET);
  const dart = await fillFromDart(withHistory, fundamentals, profiles);
  await saveProfiles(MARKET, profiles);

  await saveFundamentals(MARKET, fundamentals);
  reportCoverage(dart.coverage);

  await publish('universe-kr', {
    market: MARKET,
    asOf: date,
    count: withHistory.length,
    eligible: selected.length,
    tickers: selected.map((s) => ({
      ticker: s.ticker, name: s.name, sector: s.sector, exchange: s.exchange,
      marketCap: s.marketCap, priceLimited: s.priceLimited,
    })),
    historyPaths: via,
  });

  console.log(`[kr] ${withHistory.length} names have ≥250 bars and pass liquidity`);
  console.log(`[kr] done in ${Math.round((Date.now() - started) / 1000)}s`);
  console.table(healthReport());

  if (selected.length < 30) {
    console.error('[kr] FATAL: universe collapsed below 30 names — refusing to proceed');
    process.exitCode = 1;
  }
}


// ─────────────────────────────────────────────────── DART fundamentals ──

/**
 * Fill Korean financial statements from DART, if a key is configured.
 *
 * OPTIONAL BY DESIGN. Without `DART_KEY` this returns immediately and the
 * Korean pipeline behaves exactly as it did before — the mirror snapshot and
 * nothing deeper. With a key, three Korean boards (mid-term, long-term and
 * ultra-long) become computable for the first time; see METHODOLOGY §10.4.
 *
 * Incremental and resumable, like the US price bootstrap it is modelled on.
 * A full decade for 350 companies is ~15,000 requests — inside DART's daily
 * 20,000 cap but far outside one comfortable Actions run, so each run spends a
 * bounded budget on the companies that are furthest behind and the store
 * carries the progress.
 *
 * Measured on the first live run: 400 reports took about 150 seconds end to
 * end with no request errors, so 1,200 is roughly 8 minutes against a 50-minute
 * job timeout, and fills a ~5,800-report backlog in about five weekday runs
 * rather than fifteen. Well under DART's daily cap either way.
 */
export async function fillFromDart(selected, fundamentals, profiles) {
  const key = process.env.DART_KEY;
  if (!key) {
    console.log('[kr] DART_KEY not set — skipping Korean fundamentals (boards mid/long/ultra-long stay empty by design)');
    return { attempted: 0, coverage: null };
  }
  if (!/^[0-9a-f]{40}$/i.test(key.trim())) {
    // Fail loudly rather than spending a run discovering it request by request.
    console.error('[kr] DART_KEY is set but is not a 40-character hex key — refusing to call the API with it');
    process.exitCode = 1;
    return { attempted: 0, coverage: null };
  }

  // ── corp_code map: one request, cached, refreshed weekly ────────────────
  const cachedAt = profiles.dartCorpCodesAt ? Date.parse(profiles.dartCorpCodesAt) : 0;
  const stale = !cachedAt || (Date.now() - cachedAt) > 7 * 86_400_000;
  if (stale || !profiles.dartCorpCodes) {
    try {
      const codes = await fetchDartCorpCodes(key.trim());
      profiles.dartCorpCodes = Object.fromEntries(codes.map((c) => [c.ticker, c.corpCode]));
      profiles.dartCorpCodesAt = new Date().toISOString();
      console.log(`[kr] DART corp codes: ${codes.length} listed companies mapped`);
    } catch (err) {
      // `fetch failed` on its own is useless — it is undici's generic wrapper
      // and the actual reason (DNS, TLS, connection reset, timeout) is on the
      // cause. Print it, or a network failure is indistinguishable from a bad
      // key and the next person guesses instead of reading.
      const cause = err.cause ? ` (${err.cause.code ?? err.cause.name ?? ''} ${err.cause.message ?? ''})`.trim() : '';
      console.error(`[kr] DART corp code fetch failed: ${err.message}${cause ? ' — ' + cause : ''}`);
      console.error('[kr] the rest of the Korean refresh is unaffected; only the statement backfill is skipped');
      process.exitCode = 1;
      return { attempted: 0, coverage: null };
    }
  }
  const corpCodes = profiles.dartCorpCodes ?? {};

  // ── what to fetch, in priority order ────────────────────────────────────
  // Recent years first: they feed the mid-term board and the valuation
  // factors, and they are also what a reader checking a number will look at.
  // Older annuals fill in behind them for the ultra-long moat model.
  const thisYear = new Date().getUTCFullYear();
  const RECENT_QUARTER_YEARS = 2;
  const plan = [];
  for (const s of selected) {
    const corpCode = corpCodes[s.ticker];
    if (!corpCode) continue;
    const rec = fundamentals.companies[s.ticker] ?? {};
    const done = new Set(rec.dartFetched ?? []);
    for (let y = thisYear; y >= DART_FIRST_YEAR; y--) {
      const codes = (thisYear - y) < RECENT_QUARTER_YEARS ? REPORT_ORDER : ['11011'];
      for (const reprtCode of codes) {
        const id = `${y}:${reprtCode}`;
        if (done.has(id)) continue;
        plan.push({ ticker: s.ticker, corpCode, year: y, reprtCode, id });
      }
    }
  }
  const batch = plan.slice(0, DART_BUDGET);
  if (!batch.length) {
    console.log('[kr] DART: nothing left to backfill');
    return { attempted: 0, coverage: summariseCoverage(fundamentals, selected) };
  }
  console.log(`[kr] DART: fetching ${batch.length} reports (${plan.length} outstanding)`);

  // ── fetch ───────────────────────────────────────────────────────────────
  const agg = { rows: 0, matched: 0, viaId: 0, viaName: 0, unmatched: new Map() };
  const byTicker = new Map();

  const res = await mapLimit(batch, 2, async (job) => {
    let rows = await fetchDartStatements(key.trim(), {
      corpCode: job.corpCode, year: job.year, reprtCode: job.reprtCode, fsDiv: 'CFS',
    });
    // A company with no subsidiaries files individual statements only.
    if (rows === null || rows.length === 0) {
      rows = await fetchDartStatements(key.trim(), {
        corpCode: job.corpCode, year: job.year, reprtCode: job.reprtCode, fsDiv: 'OFS',
      });
    }
    return { job, rows };
  });

  for (const r of res.results) {
    if (!r) continue;
    const { job, rows } = r;
    if (!byTicker.has(job.ticker)) byTicker.set(job.ticker, { reports: {}, fetched: [] });
    const entry = byTicker.get(job.ticker);
    entry.fetched.push(job.id);
    if (!rows || !rows.length) continue;

    const { values, cumulative, stats } = readReport(rows);
    agg.rows += stats.rows;
    agg.matched += stats.matched;
    agg.viaId += stats.viaId;
    agg.viaName += stats.viaName;
    for (const u of stats.unmatched) agg.unmatched.set(u, (agg.unmatched.get(u) ?? 0) + 1);

    entry.reports[`${job.year}:${job.reprtCode}`] = {
      year: job.year,
      code: job.reprtCode,
      end: periodEnd(job.year, job.reprtCode),
      filed: filedFromRcept(rows[0]?.rcept_no),
      values,
      cumulative,
    };
  }

  // ── merge into the store, in the same shape the US path produces ────────
  for (const [ticker, entry] of byTicker) {
    const rec = fundamentals.companies[ticker] ?? {};
    const stored = rec.dartReports ?? {};
    Object.assign(stored, entry.reports);

    const byYear = new Map();
    for (const [k, rep] of Object.entries(stored)) {
      const [y, code] = k.split(':');
      if (!byYear.has(y)) byYear.set(y, {});
      byYear.get(y)[code] = rep;
    }

    const quarters = [];
    const annual = [];
    for (const [y, reports] of [...byYear.entries()].sort()) {
      quarters.push(...quartersFromReports(reports));
      const a = annualFromReport(reports['11011'], y);
      if (a) annual.push(a);
    }
    const allReports = Object.values(stored);

    fundamentals.companies[ticker] = {
      ...rec,
      dartReports: stored,
      dartFetched: [...new Set([...(rec.dartFetched ?? []), ...entry.fetched])],
      quarters: quarters.sort((a, b) => (a.end < b.end ? -1 : 1)).slice(-24),
      annual: annual.sort((a, b) => a.fy - b.fy).slice(-12),
      balance: balanceFromReports(allReports),
      lastFiled: allReports.map((r) => r.filed).filter(Boolean).sort().at(-1) ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  reportMatching(agg, res.errors.length);
  return { attempted: batch.length, coverage: summariseCoverage(fundamentals, selected) };
}

/**
 * Report what the account mapping actually matched, and fail if it clearly did
 * not work.
 *
 * This exists because the mapping in scripts/lib/dart.mjs could not be checked
 * against a live DART response while it was written — a key is a credential.
 * The failure mode that creates is silent and total: wrong identifiers mean
 * every lookup misses, every statement parses empty, and the Korean boards stay
 * exactly as empty as they were before, with nothing anywhere saying the
 * mapping was the reason.
 *
 * So the first live run measures itself. `unmatched` is printed because it is
 * the actionable half — those are the real Korean line names DART returned, and
 * any concept-bearing name among them is a missing alias, pasteable straight
 * into DART_ACCOUNTS.
 */
function reportMatching(agg, errorCount) {
  const pct = agg.rows ? ((agg.matched / agg.rows) * 100).toFixed(1) : '0.0';
  console.log(
    `[kr] DART accounts: ${agg.matched}/${agg.rows} rows matched (${pct}%) — `
    + `${agg.viaId} by account_id, ${agg.viaName} by Korean name, ${errorCount} request errors`,
  );
  const top = [...agg.unmatched.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15);
  if (top.length) {
    console.log('[kr] most common UNMATCHED account names (add any real concept to DART_ACCOUNTS):');
    for (const [nm, n] of top) console.log(`        ${String(n).padStart(5)}  ${nm}`);
  }
  // Most rows in a full statement are legitimately unmapped — subtotals,
  // segment detail, equity movements. A low overall rate is expected. Zero is
  // not: it means the identifiers are wrong, not that the filers are unusual.
  if (agg.rows > 200 && agg.matched === 0) {
    console.error('[kr] FATAL: DART returned rows but NOT ONE matched a known account. The mapping is wrong, not the data.');
    process.exitCode = 1;
  }
}

/** How many companies now have each core concept — the number that decides
 *  whether a Korean board can actually be scored. */
function summariseCoverage(fundamentals, selected) {
  const out = { companies: 0, withQuarters: 0, withAnnual: 0, annual5y: 0, annual10y: 0, core: {} };
  for (const c of CORE_CONCEPTS) out.core[c] = 0;

  for (const s of selected) {
    const rec = fundamentals.companies[s.ticker];
    if (!rec) continue;
    out.companies++;
    const quarters = rec.quarters ?? [];
    const annual = rec.annual ?? [];
    if (quarters.length) out.withQuarters++;
    if (annual.length) out.withAnnual++;
    if (annual.length >= 5) out.annual5y++;
    if (annual.length >= 10) out.annual10y++;
    for (const c of CORE_CONCEPTS) {
      if (annual.some((a) => typeof a[c] === 'number') || quarters.some((q) => typeof q[c] === 'number')) out.core[c]++;
    }
  }
  return out;
}

/** Print coverage and say plainly which boards it does and does not open. */
function reportCoverage(cov) {
  if (!cov) return;
  console.log(
    `[kr] DART coverage: ${cov.withQuarters}/${cov.companies} with quarters, `
    + `${cov.withAnnual} with annual, ${cov.annual5y} with 5+ years, ${cov.annual10y} with 10+ years`,
  );
  console.log('[kr] core concepts: ' + CORE_CONCEPTS.map((c) => `${c} ${cov.core[c]}`).join(', '));

  // Board-by-board, in the same terms the site uses, so a thin run explains
  // itself instead of leaving an empty board to be interpreted.
  const need = Math.max(20, Math.round(cov.companies * 0.15));
  const say = (board, have, what) => console.log(
    `[kr]   ${board.padEnd(11)} ${have >= need ? 'ready' : 'not yet'} — ${have} companies with ${what} (needs ~${need})`,
  );
  say('mid-term', cov.withQuarters, 'quarterly statements');
  say('long-term', cov.withAnnual, 'annual statements');
  say('ultra-long', cov.annual10y, '10 years of annuals');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('[kr] fatal:', err);
    process.exit(1);
  });
}
