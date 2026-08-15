import type { APIRoute } from 'astro';
import { SITE } from '../config';
import { PAGES, absolute, pageAbsolute } from '../lib/paths';
import { dataGeneratedAt } from '../lib/data';

/**
 * Absolute URLs only — a sitemap is consumed off-site, so every entry goes
 * through pageAbsolute() rather than href(). Each URL declares its alternate
 * language sibling via xhtml:link, which is what Google actually reads.
 */
export const GET: APIRoute = () => {
  const lastmod = new Date(dataGeneratedAt).toISOString();

  const entries = PAGES.flatMap((p) =>
    SITE.locales.map((lang) => {
      const alternates = SITE.locales
        .map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${pageAbsolute(l, p.slug)}"/>`)
        .join('\n');
      return `  <url>
    <loc>${pageAbsolute(lang, p.slug)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${pageAbsolute('en', p.slug)}"/>
  </url>`;
    }),
  );

  const extra = [absolute('rss.xml'), absolute('llms.txt')].map(
    (loc) => `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.3</priority>
  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${[...entries, ...extra].join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
