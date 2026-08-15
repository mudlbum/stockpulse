#!/usr/bin/env node
/**
 * News refresh: fetch feeds, map to tickers, cluster, publish.
 *
 * Runs more often than the ranking job — news moves between sessions even
 * though prices do not.
 */

import { fetchAllNews, mapItemsToTickers, clusterNews, catalystClusterByTicker } from './lib/news.mjs';
import { sentimentLabel } from './lib/sentiment.mjs';
import { publish, readJson, writeJson, STORE, SRC_DATA } from './lib/store.mjs';
import { healthReport } from './lib/http.mjs';
import path from 'node:path';

const MAX_PUBLISHED_ITEMS = 300;
const RETAIN_HOURS = 72;

async function loadUniverse() {
  const us = await readJson(path.join(SRC_DATA, 'universe-us.json'), null);
  const kr = await readJson(path.join(SRC_DATA, 'universe-kr.json'), null);
  const out = [];
  for (const t of us?.tickers ?? []) out.push({ ticker: t.ticker, name: t.name, market: 'US' });
  for (const t of kr?.tickers ?? []) out.push({ ticker: t.ticker, name: t.name, market: 'KR' });
  return out;
}

async function main() {
  const now = new Date();
  const universe = await loadUniverse();
  if (universe.length === 0) {
    console.warn('[news] universe files not found — run refresh-us / refresh-kr first. Ticker mapping will be empty.');
  }

  const { items: fresh, health: feedHealth } = await fetchAllNews({ now });
  console.log(`[news] fetched ${fresh.length} items from ${feedHealth.filter((f) => f.status === 'ok').length}/${feedHealth.length} healthy feeds`);
  for (const f of feedHealth.filter((f) => f.status !== 'ok')) {
    console.warn(`[news]   ${f.status.padEnd(6)} ${f.name}${f.error ? ` — ${f.error}` : ''}${f.newestAgeHours ? ` (newest ${f.newestAgeHours}h old)` : ''}`);
  }

  // Carry forward recent items so a feed outage does not blank the page, and
  // so sentiment keeps a 48-hour window even when one run fetches little.
  const cacheFile = path.join(STORE, 'news-cache.json');
  const cached = (await readJson(cacheFile, null))?.items ?? [];
  const cutoff = now.getTime() - RETAIN_HOURS * 3_600_000;
  const seen = new Set();
  const pool = [];
  for (const it of [...fresh, ...cached]) {
    if (!it.publishedAt) continue;
    if (new Date(it.publishedAt).getTime() < cutoff) continue;
    // De-duplicate on URL, then on title, so syndication does not double-count
    // a story in the cluster sizes.
    const key = it.url || it.title;
    if (seen.has(key)) continue;
    seen.add(key);
    pool.push(it);
  }
  pool.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));

  const { items: mapped, byTicker } = mapItemsToTickers(pool, universe);
  const clusters = clusterNews(mapped);
  const catalystByTicker = catalystClusterByTicker(clusters);

  await writeJson(cacheFile, { updatedAt: now.toISOString(), items: pool.slice(0, 1200) });

  // Per-ticker index consumed by build-rankings.mjs for the sentiment factor
  // and the catalyst summary.
  await writeJson(path.join(STORE, 'news-by-ticker.json'), {
    updatedAt: now.toISOString(),
    tickers: Object.fromEntries(
      [...byTicker.entries()].map(([t, items]) => [
        t,
        items.slice(0, 12).map(({ title, url, source, publishedAt, sentiment, kind, lang }) => ({
          title, url, source, publishedAt, sentiment, kind, lang,
        })),
      ]),
    ),
    catalysts: Object.fromEntries(catalystByTicker),
  });

  await publish('news', {
    items: mapped.slice(0, MAX_PUBLISHED_ITEMS).map((i) => ({
      title: i.title,
      url: i.url,
      source: i.source,
      sourceId: i.sourceId,
      publishedAt: i.publishedAt,
      lang: i.lang,
      tickers: i.tickers,
      sentiment: i.sentiment,
      sentimentLabel: sentimentLabel(i.sentiment),
    })),
    clusters: clusters.slice(0, 40).map(({ members, ...c }) => ({ ...c, size: c.size })),
    feedHealth,
  });

  console.log(`[news] published ${Math.min(mapped.length, MAX_PUBLISHED_ITEMS)} items, ${clusters.length} clusters, ${byTicker.size} tickers mapped`);
  console.table(healthReport());

  const healthy = feedHealth.filter((f) => f.status === 'ok').length;
  if (healthy === 0) {
    console.error('[news] FATAL: no healthy feeds');
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[news] fatal:', err);
    process.exit(1);
  });
}
