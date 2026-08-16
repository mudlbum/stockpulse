/**
 * HTTP layer: throttling, retry, and per-host health accounting.
 *
 * Every external call in this project goes through here so that (a) we never
 * exceed a source's published rate limit, and (b) the site can publish an
 * honest per-source health table rather than silently rendering stale numbers.
 */

import { setTimeout as sleep } from 'node:timers/promises';

export const CONTACT = process.env.CONTACT_EMAIL || 'hello@example.com';

/** SEC requires a descriptive UA with contact info; 10 req/s is its stated cap. */
export const UA_SEC = `StockPulse/1.0 (${CONTACT})`;
/** Yahoo rejects default library user-agents outright. */
export const UA_BROWSER =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/**
 * Per-host minimum interval between requests, in ms.
 * Deliberately more conservative than each source's documented limit, because
 * GitHub Actions egress IPs are shared and we are one of many callers on them.
 */
const HOST_INTERVAL = {
  'data.sec.gov': 120,
  'www.sec.gov': 120,
  'stooq.com': 900,
  'query1.finance.yahoo.com': 600,
  'query2.finance.yahoo.com': 600,
  'api.finance.naver.com': 1100,
  'fchart.stock.naver.com': 1100,
  'finance.naver.com': 1100,
  'raw.githubusercontent.com': 60,
  default: 400,
};

const lastCall = new Map();
/** Host → epoch ms before which no request may be sent, set by a 429. */
const cooldownUntil = new Map();
const health = new Map();

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'invalid';
  }
}

/**
 * Reserve the next send slot for `host` and return the epoch ms to send at.
 *
 * Reserving BEFORE awaiting is the whole point, and it is not a micro-detail:
 * the previous version read `lastCall`, awaited, and only then wrote it back.
 * Under `mapLimit(items, 4, …)` all four workers read the same `last`,
 * computed the same wait, slept the same duration and fired simultaneously —
 * so a 120ms interval intended as ~8 req/s delivered bursts of four, and SEC
 * (documented cap: 10 req/s) answered a cold start with 148 HTTP 429s and zero
 * fundamentals for the day. The rate limiter had never actually limited
 * anything; low volume had simply hidden it.
 *
 * Exported for the test, because a timing bug that only appears under
 * concurrency is exactly the kind that comes back.
 */
export function reserveSlot(host, now = Date.now()) {
  const interval = HOST_INTERVAL[host] ?? HOST_INTERVAL.default;
  const floor = Math.max(now, cooldownUntil.get(host) ?? 0);
  const scheduled = Math.max(floor, (lastCall.get(host) ?? 0) + interval);
  lastCall.set(host, scheduled);
  return scheduled;
}

/** Test seam: forget all reservations and cooldowns. */
export function resetThrottle() {
  lastCall.clear();
  cooldownUntil.clear();
}

/**
 * Back every in-flight worker off this host, not just the one that got the 429.
 * Without this the other three workers keep hammering a source that has already
 * said no, which is how a brief refusal becomes a sustained block.
 */
function penalize(host, ms) {
  const until = Date.now() + ms;
  if (until > (cooldownUntil.get(host) ?? 0)) cooldownUntil.set(host, until);
}

async function throttle(host) {
  const wait = reserveSlot(host) - Date.now();
  if (wait > 0) await sleep(wait);
}

function record(host, ok, note) {
  const h = health.get(host) ?? { host, ok: 0, fail: 0, notes: [] };
  if (ok) h.ok++;
  else h.fail++;
  if (note && h.notes.length < 5 && !h.notes.includes(note)) h.notes.push(note);
  health.set(host, h);
}

export function healthReport() {
  return [...health.values()].map((h) => ({
    ...h,
    total: h.ok + h.fail,
    successRate: h.ok + h.fail > 0 ? h.ok / (h.ok + h.fail) : null,
  }));
}

export function resetHealth() {
  health.clear();
}

/**
 * Fetch with throttle, timeout, and exponential backoff.
 *
 * 429 and 5xx are retried; 4xx other than 429 are not, because retrying a 403
 * or 404 only burns the rate limit we are trying to protect.
 */
export async function fetchWithRetry(url, opts = {}) {
  const {
    retries = 3,
    timeoutMs = 25_000,
    headers = {},
    ua = UA_BROWSER,
    accept = '*/*',
    ...rest
  } = opts;
  const host = hostOf(url);

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await throttle(host);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...rest,
        signal: ctrl.signal,
        headers: { 'User-Agent': ua, Accept: accept, 'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8', ...headers },
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} from ${host}`);
        // A 429 is the host telling every worker to stop, not just this one.
        if (res.status === 429) penalize(host, 2000 * 2 ** attempt);
        if (attempt < retries) {
          await sleep(1500 * 2 ** attempt + Math.floor(Math.random() * 400));
          continue;
        }
        record(host, false, `HTTP ${res.status}`);
        throw lastErr;
      }
      if (!res.ok) {
        record(host, false, `HTTP ${res.status}`);
        throw new Error(`HTTP ${res.status} from ${host}`);
      }
      record(host, true);
      return res;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      if (attempt < retries && (err.name === 'AbortError' || err.name === 'TypeError')) {
        await sleep(1200 * 2 ** attempt);
        continue;
      }
      record(host, false, err.name === 'AbortError' ? 'timeout' : String(err.message).slice(0, 60));
      throw err;
    }
  }
  throw lastErr ?? new Error('fetch failed');
}

export async function fetchJson(url, opts = {}) {
  const res = await fetchWithRetry(url, { accept: 'application/json', ...opts });
  return res.json();
}

export async function fetchText(url, opts = {}) {
  const res = await fetchWithRetry(url, opts);
  return res.text();
}

/**
 * Run `fn` over `items` with bounded concurrency, collecting failures rather
 * than aborting the batch. One dead ticker must not take down a whole refresh.
 */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  const errors = [];
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const i = cursor++;
      try {
        results[i] = await fn(items[i], i);
      } catch (err) {
        results[i] = null;
        errors.push({ item: items[i], error: String(err.message ?? err) });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return { results, errors };
}
