/**
 * Committed data store.
 *
 * `data-store/` is the database. It lives in git, which gives three things a
 * hosted DB would not: every historical state is publicly diffable, the
 * performance ledger cannot be quietly rewritten, and the whole site can be
 * rebuilt from a clone.
 *
 * Price history is sharded by market and pruned to a bounded window, because a
 * single JSON blob holding 2000 tickers × 500 bars would be ~80MB and would
 * make every commit unreviewable.
 */

import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
export const STORE = path.join(ROOT, 'data-store');
export const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
export const SRC_DATA = path.join(ROOT, 'src', 'data');

/** Bars retained per ticker. 520 ≈ two years — enough for a 200DMA plus a year
 *  of range history, without unbounded repo growth. */
export const MAX_BARS = 520;

async function ensureDir(p) {
  if (!existsSync(p)) await mkdir(p, { recursive: true });
}

export async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

export async function writeJson(file, data, { pretty = false } = {}) {
  await ensureDir(path.dirname(file));
  await writeFile(file, pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data));
  return file;
}

/**
 * Publish generated data to BOTH locations, deliberately:
 *  - src/data/   is imported at build time, so the numbers are present in the
 *                served HTML and are therefore crawlable and readable without JS
 *  - public/data/ is re-polled client-side between builds for live refresh
 */
export async function publish(name, data) {
  const payload = { generatedAt: new Date().toISOString(), ...data };
  await writeJson(path.join(SRC_DATA, `${name}.json`), payload, { pretty: true });
  await writeJson(path.join(PUBLIC_DATA, `${name}.json`), payload);
  return payload;
}

// ───────────────────────────────────────────────────────────── price bars ──

const priceFile = (market) => path.join(STORE, 'prices', `${market.toLowerCase()}.json`);

export async function loadPrices(market) {
  return (await readJson(priceFile(market), null)) ?? { market, updatedAt: null, bars: {} };
}

export async function savePrices(market, store) {
  store.updatedAt = new Date().toISOString();
  for (const k of Object.keys(store.bars)) {
    if (store.bars[k].length > MAX_BARS) store.bars[k] = store.bars[k].slice(-MAX_BARS);
  }
  return writeJson(priceFile(market), store);
}

/**
 * Merge new bars into a ticker's series, de-duplicating on date.
 *
 * Incoming bars win on conflict: a same-date revision from the source is a
 * correction (or a split adjustment applied to history), and keeping the stale
 * copy would leave the series internally inconsistent across the split.
 */
export function mergeBars(existing = [], incoming = []) {
  const byDate = new Map(existing.map((b) => [b.date, b]));
  for (const b of incoming) {
    if (!b?.date) continue;
    byDate.set(b.date, b);
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)).slice(-MAX_BARS);
}

// ─────────────────────────────────────────────────────────── fundamentals ──

const fundFile = (market) => path.join(STORE, 'fundamentals', `${market.toLowerCase()}.json`);

export async function loadFundamentals(market) {
  return (await readJson(fundFile(market), null)) ?? { market, updatedAt: null, companies: {} };
}

export async function saveFundamentals(market, store) {
  store.updatedAt = new Date().toISOString();
  return writeJson(fundFile(market), store);
}

// ───────────────────────────────────────────────────────── published board ──

const boardFile = (market, horizon) =>
  path.join(STORE, 'boards', `${market.toLowerCase()}-${horizon}.json`);

export async function loadBoard(market, horizon) {
  const b = (await readJson(boardFile(market, horizon), null)) ?? {};
  return {
    current: b.current ?? [],
    currentAsOf: b.currentAsOf ?? null,
    prior: b.prior ?? [],
    priorAsOf: b.priorAsOf ?? null,
    history: b.history ?? [],
  };
}

/**
 * The board hysteresis should treat as "yesterday", given the session we are
 * ranking now.
 *
 * This distinction is what makes the ranking job idempotent, and idempotency is
 * load-bearing: the README claims any commit can be checked out and re-run to
 * reproduce that day's board, which is the whole basis of the public audit.
 * Without it, running the job twice on the same data makes the second run treat
 * the FIRST run's output as the previous session — so incumbents gain a
 * spurious held-session, every movement badge collapses to 0, and turnover
 * decays toward zero. The board silently changes without the market changing.
 *
 * So: if the stored `current` was produced for this same `asOf`, this is a
 * replay and the real previous session is `prior`.
 */
export function previousBoardFor(stored, asOf) {
  if (stored.currentAsOf && asOf && stored.currentAsOf === asOf) return stored.prior ?? [];
  return stored.current ?? [];
}

export async function saveBoard(market, horizon, board, asOf) {
  const stored = await loadBoard(market, horizon);
  const isReplay = Boolean(stored.currentAsOf && asOf && stored.currentAsOf === asOf);

  // On a replay the prior session is unchanged; on a new session today's
  // outgoing `current` becomes the prior.
  const prior = isReplay ? stored.prior ?? [] : stored.current ?? [];
  const priorAsOf = isReplay ? stored.priorAsOf ?? null : stored.currentAsOf ?? null;

  // History is keyed by date, so a replay REPLACES its entry rather than
  // appending a duplicate — otherwise 30-day turnover would count the same
  // session twice and drift a little further on every re-run.
  const entry = { date: asOf, tickers: board.map((r) => r.ticker) };
  const history = [...(stored.history ?? []).filter((h) => h.date !== asOf), entry]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-400);

  return writeJson(boardFile(market, horizon), {
    current: board,
    currentAsOf: asOf,
    prior,
    priorAsOf,
    history,
    updatedAt: new Date().toISOString(),
  });
}

// ─────────────────────────────────────────────────────── recommendations ──

/**
 * Append-only ledger. METHODOLOGY §9.
 *
 * Nothing is ever deleted. A pick published in error is marked `void` with a
 * reason and stays visible. Every entry records the methodology version and git
 * commit that produced it, so a later change to the formula cannot silently
 * rewrite history.
 */
export const LEDGER = path.join(STORE, 'ledger.json');

export async function loadLedger() {
  return (await readJson(LEDGER, null)) ?? { version: 1, entries: [] };
}

export async function appendLedger(entries) {
  const ledger = await loadLedger();
  const seen = new Set(ledger.entries.map((e) => `${e.date}|${e.market}|${e.horizon}|${e.ticker}`));
  let added = 0;
  for (const e of entries) {
    const key = `${e.date}|${e.market}|${e.horizon}|${e.ticker}`;
    if (seen.has(key)) continue;
    ledger.entries.push(e);
    seen.add(key);
    added++;
  }
  await writeJson(LEDGER, ledger, { pretty: true });
  return added;
}

export async function updateLedgerEntries(mutator) {
  const ledger = await loadLedger();
  for (const e of ledger.entries) mutator(e);
  await writeJson(LEDGER, ledger, { pretty: true });
  return ledger;
}

// ──────────────────────────────────────────────────────────────── health ──

export async function saveHealth(report) {
  return publish('health', report);
}

export async function listStoreFiles() {
  const out = [];
  async function walk(dir) {
    if (!existsSync(dir)) return;
    for (const e of await readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) await walk(p);
      else out.push(p);
    }
  }
  await walk(STORE);
  return out;
}
