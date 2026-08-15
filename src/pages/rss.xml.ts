import type { APIRoute } from 'astro';
import { HORIZONS, MARKETS, SITE } from '../config';
import { absolute, pageAbsolute } from '../lib/paths';
import { rankings } from '../lib/data';
import { allPosts, lastModified, readingTime, slugOf } from '../lib/blog';
import { boardSlug } from '../i18n/horizon-pages';

const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Articles and board updates.
 *
 * Every item points at a real, distinct URL. The previous version emitted eight
 * items that were all `https://…/#us/ultra_short`-style fragments of the home
 * page, which every reader collapses to one entry — a feed that cannot be
 * subscribed to usefully.
 */
export const GET: APIRoute = async () => {
  const now = new Date().toUTCString();
  const posts = await allPosts();

  const postItems = posts.map((p) => {
    const url = pageAbsolute(p.data.lang, `blog/${slugOf(p)}`);
    const mins = readingTime(p.body ?? '');
    const provenance = [
      `Written by ${p.data.author === 'pipeline' ? 'StockPulse Pipeline' : 'StockPulse Editorial'}.`,
      `Reviewed by ${p.data.reviewedBy}.`,
      p.data.aiAssisted ? 'AI-assisted draft, reviewed by a person before publication.' : 'Written and reviewed by a person.',
      `${mins} min read.`,
    ].join(' ');
    return `    <item>
      <title>${esc(p.data.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${lastModified(p).toUTCString()}</pubDate>
      <category>${esc(p.data.category)}</category>
      <description>${esc(`${p.data.description} — ${provenance}`)}</description>
    </item>`;
  });

  /* One item per board, pointing at that board's own landing page rather than
     a fragment of the home page. */
  const boardItems = MARKETS.flatMap((m) =>
    HORIZONS.map((h) => {
      const board = rankings.boards[m.id]?.[h.id];
      if (!board) return '';
      const url = pageAbsolute('en', boardSlug(m.id, h.id));
      const regime = rankings.regime[m.id];
      const names = board.rows.length
        ? board.rows.map((r) => `${r.rank}. ${r.ticker} ${r.name} (score ${r.score})`).join('\n')
        : board.emptyReason?.en || 'No board published for this market and horizon.';
      const body = [
        `Close of ${board.asOf}. Market regime: ${regime?.state ?? 'unknown'} (score multiplier ×${regime?.multiplier ?? 1}). 30-day turnover ${Math.round(board.turnover30d * 100)}%.`,
        '',
        names,
        '',
        'Mechanical output of a published rule set, not a prediction and not investment advice. End-of-day data; the earliest actionable point is the next session open.',
      ].join('\n');
      return `    <item>
      <title>${esc(`${m.label.en} · ${h.label.en} (${h.window.en}) — ${board.asOf}`)}</title>
      <link>${url}</link>
      <guid isPermaLink="false">${esc(`${url}#${rankings.generatedAt}`)}</guid>
      <pubDate>${new Date(rankings.generatedAt).toUTCString()}</pubDate>
      <category>rankings</category>
      <description>${esc(body)}</description>
    </item>`;
    }),
  ).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.name} — research and ranking updates`)}</title>
    <link>${absolute('')}</link>
    <atom:link href="${absolute('rss.xml')}" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE.description.en)}</description>
    <language>en</language>
    <lastBuildDate>${now}</lastBuildDate>
    <generator>StockPulse</generator>
    <copyright>${esc(`Market research and education. Not investment advice. ${pageAbsolute('en', 'disclaimer')}`)}</copyright>
${[...postItems, ...boardItems].join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
