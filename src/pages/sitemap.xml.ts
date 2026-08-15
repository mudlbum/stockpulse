import type { APIRoute } from 'astro';
import { HORIZONS, MARKETS, SITE } from '../config';
import { PAGES, pageAbsolute } from '../lib/paths';
import { dataGeneratedAt } from '../lib/data';
import { allPosts, lastModified, postsFor, slugOf, categoriesWithCounts } from '../lib/blog';
import { boardSlug } from '../i18n/horizon-pages';
import { sourceModified } from '../lib/mtime';

/**
 * Absolute URLs only — a sitemap is consumed off-site, so every entry goes
 * through pageAbsolute() rather than href().
 *
 * `lastmod` is per-URL and truthful. Stamping every page with the data
 * timestamp told crawlers that /disclaimer/ and /methodology/ change daily,
 * which is both false and the fastest way to have lastmod ignored entirely.
 * Data-driven pages use the data timestamp; static pages use the mtime of the
 * source that renders them; posts use their own updatedAt.
 */

type Entry = {
  loc: string;
  lastmod: string;
  changefreq: string;
  priority: string;
  alternates?: { lang: string; href: string }[];
};

/** Pages whose content genuinely changes when the pipeline runs. */
const DATA_DRIVEN = new Set(['', 'performance', 'news', 'sectors', 'simulator']);

export const GET: APIRoute = async () => {
  const dataStamp = new Date(dataGeneratedAt).toISOString();
  const entries: Entry[] = [];

  const bilingual = (slug: string, lastmod: string, changefreq: string, priority: string, langs = SITE.locales) => {
    const alternates = langs.map((l) => ({ lang: l, href: pageAbsolute(l, slug) }));
    for (const l of langs) {
      entries.push({ loc: pageAbsolute(l, slug), lastmod, changefreq, priority, alternates });
    }
  };

  /* ---- static + data-driven pages ---- */
  for (const p of PAGES) {
    /* /alerts/ announces a feature that does not exist yet and is noindex;
       advertising it in the sitemap contradicts that. */
    if (p.slug === 'alerts') continue;

    const lastmod = DATA_DRIVEN.has(p.slug) ? dataStamp : sourceModified(p.slug);

    /* The Korean methodology page renders the English document almost in full.
       It is noindex until translated, so it is not offered here either. */
    const langs = p.slug === 'methodology' ? (['en'] as const) : SITE.locales;
    bilingual(p.slug, lastmod, p.changefreq, p.priority, langs as unknown as typeof SITE.locales);
  }

  /* ---- per-horizon landing pages ---- */
  for (const m of MARKETS) {
    for (const h of HORIZONS) {
      bilingual(boardSlug(m.id, h.id), dataStamp, 'daily', '0.8');
    }
  }

  /* ---- blog ---- */
  const enPosts = await postsFor('en');
  const koPosts = await postsFor('ko');
  const newest = (list: typeof enPosts) =>
    list.length ? new Date(Math.max(...list.map((p) => lastModified(p).getTime()))).toISOString() : dataStamp;

  entries.push({ loc: pageAbsolute('en', 'blog'), lastmod: newest(enPosts), changefreq: 'weekly', priority: '0.7' });
  entries.push({ loc: pageAbsolute('ko', 'blog'), lastmod: newest(koPosts), changefreq: 'weekly', priority: '0.7' });

  for (const lang of SITE.locales) {
    for (const c of await categoriesWithCounts(lang)) {
      const list = (lang === 'en' ? enPosts : koPosts).filter((p) => p.data.category === c.id);
      entries.push({
        loc: pageAbsolute(lang, `blog/category/${c.id}`),
        lastmod: newest(list),
        changefreq: 'weekly',
        priority: '0.5',
      });
    }
  }

  /* Each post carries its own lastmod, and only advertises an alternate when a
     counterpart actually exists. */
  const posts = await allPosts();
  const byKey = new Map<string, typeof posts>();
  for (const p of posts) {
    const k = p.data.translationKey;
    if (!k) continue;
    byKey.set(k, [...(byKey.get(k) ?? []), p]);
  }
  for (const p of posts) {
    const siblings = p.data.translationKey ? (byKey.get(p.data.translationKey) ?? [p]) : [p];
    entries.push({
      loc: pageAbsolute(p.data.lang, `blog/${slugOf(p)}`),
      lastmod: lastModified(p).toISOString(),
      changefreq: 'yearly',
      priority: '0.6',
      alternates: siblings.map((s) => ({ lang: s.data.lang, href: pageAbsolute(s.data.lang, `blog/${slugOf(s)}`) })),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries
  .map((e) => {
    const alts = (e.alternates ?? [])
      .map((a) => `    <xhtml:link rel="alternate" hreflang="${a.lang}" href="${a.href}"/>`)
      .join('\n');
    const xdefault =
      e.alternates && e.alternates.length
        ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${(e.alternates.find((a) => a.lang === 'en') ?? e.alternates[0]).href}"/>`
        : '';
    return `  <url>
    <loc>${e.loc}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>${alts ? '\n' + alts : ''}${xdefault}
  </url>`;
  })
  .join('\n')}
</urlset>
`;

  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
