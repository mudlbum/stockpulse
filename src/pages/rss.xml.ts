import type { APIRoute } from 'astro';
import { HORIZONS, MARKETS, SITE } from '../config';
import { absolute, pageAbsolute } from '../lib/paths';
import { rankings } from '../lib/data';

const esc = (s: string) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * One item per published board. The GUID includes the generation timestamp so a
 * re-publish produces a new item rather than silently mutating an old one.
 */
export const GET: APIRoute = () => {
  const pubDate = new Date(rankings.generatedAt).toUTCString();

  const items = MARKETS.flatMap((m) =>
    HORIZONS.map((h) => {
      const board = rankings.boards[m.id]?.[h.id];
      if (!board) return '';
      const regime = rankings.regime[m.id];
      const link = `${pageAbsolute('en', '')}#${m.id.toLowerCase()}/${h.id}`;
      const title = `${m.label.en} · ${h.label.en} (${h.window.en}) — ${board.asOf}`;

      const names = board.rows.length
        ? board.rows.map((r) => `${r.rank}. ${r.ticker} ${r.name} (score ${r.score})`).join('\n')
        : 'No board published for this market and horizon.';

      const displaced = board.justMissed.length
        ? `\n\nJust missed:\n${board.justMissed.map((j) => `${j.ticker} — displaced by ${j.displacedBy}`).join('\n')}`
        : '';

      const body = [
        `Market regime: ${regime?.state ?? 'unknown'} (score multiplier ×${regime?.multiplier ?? 1}).`,
        `30-day turnover: ${Math.round(board.turnover30d * 100)}%.`,
        '',
        names,
        displaced,
        '',
        'Mechanical output of a published rule set, not a prediction and not investment advice. End-of-day data; the earliest actionable point is the next session open.',
      ].join('\n');

      return `    <item>
      <title>${esc(title)}</title>
      <link>${esc(link)}</link>
      <guid isPermaLink="false">${esc(`${absolute('')}#${m.id}/${h.id}/${rankings.generatedAt}`)}</guid>
      <pubDate>${pubDate}</pubDate>
      <category>${esc(m.label.en)}</category>
      <category>${esc(h.label.en)}</category>
      <description>${esc(body)}</description>
    </item>`;
    }),
  ).filter(Boolean);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(`${SITE.name} — ranking updates`)}</title>
    <link>${absolute('')}</link>
    <atom:link href="${absolute('rss.xml')}" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE.description.en)}</description>
    <language>en</language>
    <lastBuildDate>${pubDate}</lastBuildDate>
    <generator>StockPulse</generator>
    <copyright>${esc(`Market research and education. Not investment advice. ${absolute('disclaimer')}`)}</copyright>
${items.join('\n')}
  </channel>
</rss>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
