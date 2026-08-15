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
} from './lib/sources.mjs';
import { healthReport, mapLimit } from './lib/http.mjs';
import { loadPrices, savePrices, mergeBars, loadFundamentals, saveFundamentals, publish } from './lib/store.mjs';
import { medianDollarVolume } from './lib/indicators.mjs';
import { isNum } from './lib/stats.mjs';

const MARKET = 'KR';
const TARGET_UNIVERSE = Number(process.env.KR_UNIVERSE ?? 350);
const BOOTSTRAP_BUDGET = Number(process.env.KR_BOOTSTRAP ?? 90);

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
      sector: desc?.sector ?? 'Unknown',
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
  await saveFundamentals(MARKET, fundamentals);

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

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[kr] fatal:', err);
    process.exit(1);
  });
}
