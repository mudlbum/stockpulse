/**
 * RSS/Atom ingestion, ticker mapping, and catalyst clustering.
 *
 * Two lessons carried over from a previous build of this pipeline and worth
 * restating because both are easy to get subtly wrong:
 *
 *  1. Feeds are gated on the AGE OF THEIR NEWEST ITEM, not on status code.
 *     Several finance feeds return a perfectly healthy 200 with a valid
 *     document whose newest entry is years old. A status check alone keeps them
 *     in the rotation forever.
 *
 *  2. Clustering scores a candidate against each cluster MEMBER, not against
 *     the union of the cluster's tokens. Union scoring dilutes as a cluster
 *     grows, so the fifth outlet covering a big story matches more weakly than
 *     the second — exactly backwards from what you want.
 */

import { fetchText, UA_BROWSER } from './http.mjs';
import { FEED_STALE_HOURS, NEWS_FEEDS } from './sources.mjs';
import { scoreHeadline } from './sentiment.mjs';

// ────────────────────────────────────────────────────────────────── parse ──

function decodeEntities(s) {
  if (!s) return '';
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tagContent(block, tag) {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return m ? decodeEntities(m[1]) : null;
}

/**
 * Extract a link from an item.
 *
 * RSS 2.0 puts the URL in the element body (`<link>https://…</link>`) while
 * Atom puts it in an href attribute on a self-closing tag. Handling only one
 * form silently drops every article from half the feeds.
 */
function extractLink(block) {
  const atom = block.match(/<link[^>]*\srel=["']alternate["'][^>]*\shref=["']([^"']+)["']/i)
    || block.match(/<link[^>]*\shref=["']([^"']+)["'][^>]*\/?>/i);
  if (atom) return decodeEntities(atom[1]);
  const rss = block.match(/<link(?:\s[^>]*)?>([\s\S]*?)<\/link>/i);
  if (rss) {
    const v = decodeEntities(rss[1]);
    if (v.startsWith('http')) return v;
  }
  const guid = tagContent(block, 'guid');
  return guid && guid.startsWith('http') ? guid : null;
}

/**
 * Parse a date across the formats these feeds actually emit.
 * Investing.com sends `2026-08-15 11:49:49` and 이데일리 sends RFC-822 with a
 * +0900 offset; `new Date()` handles the latter but returns Invalid Date for
 * the former in some runtimes, so the space form is normalised first.
 */
function parseDate(s) {
  if (!s) return null;
  let v = s.trim();
  const spaceForm = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(v);
  if (spaceForm) v = `${spaceForm[1]}T${spaceForm[2]}Z`;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function parseFeed(xml, feed) {
  const items = [];
  const blocks = [
    ...xml.matchAll(/<item(?:\s[^>]*)?>([\s\S]*?)<\/item>/gi),
    ...xml.matchAll(/<entry(?:\s[^>]*)?>([\s\S]*?)<\/entry>/gi),
  ];

  for (const m of blocks) {
    const b = m[1];
    const title = tagContent(b, 'title');
    if (!title) continue;
    const dateStr =
      tagContent(b, 'pubDate') ?? tagContent(b, 'published') ?? tagContent(b, 'updated') ?? tagContent(b, 'dc:date');
    const d = parseDate(dateStr);
    items.push({
      title,
      summary: (tagContent(b, 'description') ?? tagContent(b, 'summary') ?? '').slice(0, 400),
      url: extractLink(b),
      publishedAt: d ? d.toISOString() : null,
      source: feed.name,
      sourceId: feed.id,
      lang: feed.lang,
      kind: feed.kind,
    });
  }
  return items.filter((i) => i.publishedAt);
}

/** Fetch all feeds, dropping any whose newest item is stale. */
export async function fetchAllNews({ feeds = NEWS_FEEDS, now = new Date() } = {}) {
  const all = [];
  const health = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const xml = await fetchText(feed.url, { ua: UA_BROWSER, accept: 'application/rss+xml, application/xml, text/xml, */*' });
        const items = parseFeed(xml, feed);
        if (items.length === 0) {
          health.push({ id: feed.id, name: feed.name, status: 'empty', items: 0 });
          return;
        }
        const newest = items.reduce((a, b) => (a.publishedAt > b.publishedAt ? a : b));
        const ageHours = (now - new Date(newest.publishedAt)) / 3_600_000;
        if (ageHours > FEED_STALE_HOURS) {
          health.push({
            id: feed.id, name: feed.name, status: 'stale', items: items.length,
            newestAgeHours: Math.round(ageHours),
          });
          return;
        }
        health.push({
          id: feed.id, name: feed.name, status: 'ok', items: items.length,
          newestAgeHours: Math.round(ageHours * 10) / 10,
        });
        all.push(...items);
      } catch (err) {
        health.push({ id: feed.id, name: feed.name, status: 'error', error: String(err.message ?? err).slice(0, 120) });
      }
    }),
  );

  return { items: all, health };
}

// ───────────────────────────────────────────────────────── ticker mapping ──

const STOPWORD_TICKERS = new Set([
  'A', 'I', 'IT', 'BE', 'ON', 'AT', 'ALL', 'ARE', 'BY', 'CEO', 'FOR', 'GO', 'HAS',
  'NOW', 'ONE', 'OR', 'OUT', 'SO', 'UP', 'US', 'AN', 'AM', 'PM', 'NEW', 'CAN',
  'EPS', 'ETF', 'GDP', 'CPI', 'FED', 'SEC', 'IPO', 'AI', 'EV', 'TV', 'PC', 'DD',
  'KEY', 'REAL', 'FUND', 'LOVE', 'OPEN', 'PLAY', 'WELL', 'BIG', 'RUN', 'HOPE',
]);

/**
 * Map headlines to tickers.
 *
 * Two matching modes, deliberately different:
 *  - US: uppercase symbol as a whole word, but ONLY when it is a plausible
 *    ticker mention. Common English words that are also tickers (ALL, KEY, ON)
 *    are excluded outright, and short symbols additionally require a
 *    ticker-shaped context marker like "(NVDA)" or "$NVDA". Without this the
 *    feed maps half the market to every headline containing the word "on".
 *  - KR: company name substring, plus the 6-digit code. Korean company names
 *    are distinctive enough to match directly, which is fortunate because
 *    Korean headlines rarely carry the numeric code.
 */
export function mapItemsToTickers(items, universe) {
  const usByTicker = new Map();
  const usNames = [];
  const krByName = [];

  for (const u of universe) {
    if (u.market === 'US') {
      usByTicker.set(u.ticker, u);
      const short = cleanCompanyName(u.name);
      if (short.length >= 5) usNames.push({ key: short.toLowerCase(), u });
    } else {
      if (u.name && u.name.length >= 2) krByName.push({ key: u.name, u });
      usByTicker.set(u.ticker, u); // 6-digit code, matched numerically below
    }
  }
  // Longest names first so "삼성전자우" cannot be swallowed by "삼성전자".
  krByName.sort((a, b) => b.key.length - a.key.length);
  usNames.sort((a, b) => b.key.length - a.key.length);

  const byTicker = new Map();
  const enriched = [];

  for (const item of items) {
    const text = `${item.title} ${item.summary ?? ''}`;
    const hits = new Set();

    // Explicit ticker-shaped mentions: $NVDA, (NVDA), NASDAQ: NVDA
    for (const m of text.matchAll(/(?:\$|\(|:\s*)([A-Z]{1,5})(?=[)\s,.:]|$)/g)) {
      if (usByTicker.has(m[1])) hits.add(m[1]);
    }
    // Bare uppercase symbols, 3+ chars, excluding common words.
    for (const m of text.matchAll(/\b([A-Z]{3,5})\b/g)) {
      const t = m[1];
      if (STOPWORD_TICKERS.has(t)) continue;
      if (usByTicker.has(t)) hits.add(t);
    }
    // Korean 6-digit codes.
    for (const m of text.matchAll(/\b(\d{6})\b/g)) {
      if (usByTicker.has(m[1])) hits.add(m[1]);
    }
    // Company-name matches.
    for (const { key, u } of krByName) {
      if (text.includes(key)) hits.add(u.ticker);
    }
    const lower = text.toLowerCase();
    for (const { key, u } of usNames) {
      if (lower.includes(key)) hits.add(u.ticker);
    }

    const tickers = [...hits];
    const sentiment = scoreHeadline(text);
    const out = { ...item, tickers, sentiment };
    enriched.push(out);

    for (const t of tickers) {
      if (!byTicker.has(t)) byTicker.set(t, []);
      byTicker.get(t).push(out);
    }
  }

  return { items: enriched, byTicker };
}

/** Strip corporate suffixes so "Apple Inc." matches a headline saying "Apple". */
function cleanCompanyName(name) {
  return String(name ?? '')
    .replace(/\b(inc|corp|corporation|co|company|ltd|limited|plc|holdings|holding|group|the|sa|nv|ag|se)\b\.?/gi, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────── clusters ──

const CLUSTER_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'as', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'has', 'have', 'had',
  'it', 'its', 'this', 'that', 'these', 'those', 'after', 'over', 'says', 'said',
  'will', 'more', 'than', 'amid', 'into', 'up', 'down', 'new', 'report', 'stock',
  'stocks', 'shares', 'market', 'markets', 'today',
]);

function tokensFor(title) {
  const t = new Set();
  for (const raw of title.toLowerCase().split(/[^\p{L}\p{N}$]+/u)) {
    if (!raw) continue;
    // Numeric tokens are KEPT — "Switch 2", "GTA 6", "$50" carry the signal,
    // and a single digit is often the ENTIRE distinguishing term. The minimum
    // length therefore applies to letters only; applying it to everything
    // silently deletes the "6" from "GTA 6" and stops the story clustering.
    // Bare four-digit years are dropped separately as low-signal.
    if (/^\d{4}$/.test(raw)) continue;
    if (raw.length < 2 && !/^\d$/.test(raw)) continue;
    if (CLUSTER_STOPWORDS.has(raw)) continue;
    t.add(raw);
  }
  return t;
}

/**
 * Headline similarity: a blend of Jaccard and the overlap coefficient.
 *
 * Pure Jaccard punishes length asymmetry, which is exactly the situation here —
 * one outlet writes "GTA 6 delayed again" and another writes "Rockstar confirms
 * GTA 6 slips to next fiscal year, shares fall". Every word the longer headline
 * adds shrinks the score even though the shared terms are the whole story. The
 * overlap coefficient (intersection over the SMALLER set) is blind to that, and
 * alone it over-matches short headlines. Blending keeps both properties.
 */
function similarity(a, b) {
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  if (inter === 0) return 0;
  const union = a.size + b.size - inter;
  const jaccard = union === 0 ? 0 : inter / union;
  const overlap = inter / Math.min(a.size, b.size);
  return 0.6 * jaccard + 0.4 * overlap;
}

/**
 * Cluster headlines covering the same story.
 *
 * Runs on the PRE-DEDUPE list: global title-dedupe first would delete the very
 * evidence that N outlets covered a story, which is the whole signal a cluster
 * is measuring.
 *
 * A candidate is scored against each existing member and joins on the BEST
 * member match, not on a match against the union of the cluster's tokens.
 */
export function clusterNews(items, { threshold = 0.34, maxClusters = 200 } = {}) {
  const sorted = [...items].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
  const clusters = [];

  for (const item of sorted) {
    const toks = tokensFor(item.title);
    if (toks.size < 2) continue;

    let best = null;
    let bestScore = 0;
    for (const c of clusters) {
      let memberBest = 0;
      for (const m of c.members) {
        const s = similarity(toks, m._tokens);
        if (s > memberBest) memberBest = s;
      }
      if (memberBest > bestScore) {
        bestScore = memberBest;
        best = c;
      }
    }

    const withTokens = { ...item, _tokens: toks };
    if (best && bestScore >= threshold) {
      best.members.push(withTokens);
      for (const t of item.tickers ?? []) best.tickers.add(t);
    } else if (clusters.length < maxClusters) {
      clusters.push({
        id: `c${clusters.length}`,
        members: [withTokens],
        tickers: new Set(item.tickers ?? []),
      });
    }
  }

  return clusters
    .map((c) => {
      const sentiments = c.members.map((m) => m.sentiment).filter((s) => typeof s === 'number');
      return {
        id: c.id,
        size: c.members.length,
        outlets: new Set(c.members.map((m) => m.sourceId)).size,
        headline: c.members[0].title,
        url: c.members[0].url,
        publishedAt: c.members[0].publishedAt,
        tickers: [...c.tickers],
        sentiment: sentiments.length ? sentiments.reduce((a, b) => a + b, 0) / sentiments.length : null,
        members: c.members.map(({ _tokens, ...rest }) => rest),
      };
    })
    .sort((a, b) => b.outlets - a.outlets || b.size - a.size);
}

/** Map each ticker to the id of the largest cluster mentioning it — the
 *  catalyst-cluster cap in METHODOLOGY §8 uses this. */
export function catalystClusterByTicker(clusters) {
  const map = new Map();
  for (const c of clusters) {
    if (c.outlets < 2) continue; // one outlet is not a market-wide catalyst
    for (const t of c.tickers) {
      const cur = map.get(t);
      if (!cur || c.outlets > cur.outlets) map.set(t, { id: c.id, outlets: c.outlets, headline: c.headline });
    }
  }
  return map;
}

/** Two-line catalyst summary for a leaderboard card. METHODOLOGY UI spec. */
export function catalystSummary(items, lang = 'en') {
  if (!items || items.length === 0) {
    return lang === 'ko'
      ? '최근 48시간 내 매핑된 뉴스 없음. 순위는 가격·거래량·재무 요인만 반영.'
      : 'No mapped news in the last 48 hours. Rank reflects price, volume and fundamental factors only.';
  }
  const top = items.slice().sort((a, b) => Math.abs(b.sentiment ?? 0) - Math.abs(a.sentiment ?? 0))[0];
  const others = items.length - 1;
  const more =
    others > 0
      ? lang === 'ko' ? ` 외 ${others}건의 관련 기사.` : ` Plus ${others} related ${others === 1 ? 'story' : 'stories'}.`
      : '';
  return `${top.title}${more}`;
}
