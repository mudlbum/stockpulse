/**
 * URL construction. Read this before adding any link.
 *
 * `new URL('/x', 'https://user.github.io/stockpulse/')` returns
 * 'https://user.github.io/x' — the base path is DISCARDED, because a
 * root-relative path replaces the whole origin path. That single behaviour is
 * the number one cause of broken GitHub Pages project-site deploys.
 *
 * So: never hand-write a leading-slash URL anywhere in this codebase.
 *
 *   href(p)     -> base-prefixed, relative. Use for every in-page link,
 *                  <img src>, <script src>, fetch() target and form action.
 *   absolute(p) -> SITE_URL + BASE_PATH + p. Use for everything a crawler or
 *                  another machine consumes: canonical, og:image, hreflang,
 *                  JSON-LD @id, sitemap entries, RSS links.
 */

import { BASE_PATH, SITE_URL } from '../config';

/** Strip leading/duplicate slashes so callers can pass 'x', '/x' or './x'. */
function normalize(p: string): string {
  return String(p ?? '')
    .replace(/^\.?\/+/, '')
    .replace(/\/{2,}/g, '/');
}

/**
 * Base-prefixed in-site URL. `BASE_PATH` always ends in '/', so
 * href('news') -> '/news' or '/stockpulse/news', and href('') -> '/'.
 */
export function href(p = ''): string {
  return BASE_PATH + normalize(p);
}

/** Fully-qualified URL for crawler-facing metadata. */
export function absolute(p = ''): string {
  return SITE_URL + href(p);
}

/**
 * Language-aware page path. `page` is the canonical English slug without a
 * leading slash ('' for home). KO pages live under /ko/.
 *
 * Page URLs carry a trailing slash. `build.format` is 'directory', so every
 * page is served from `<slug>/index.html`; asking for `/news` makes GitHub
 * Pages issue a 301 to `/news/`. Emitting the slash here means internal links
 * and the canonical URL are the URL that is actually served, with no redirect
 * hop. Asset URLs (rss.xml, data/*.json) go through href()/absolute() directly
 * and are left alone.
 */
export function pagePath(lang: 'en' | 'ko', page = ''): string {
  const slug = normalize(page);
  const withLang = lang === 'ko' ? (slug ? `ko/${slug}` : 'ko') : slug;
  return withLang ? `${withLang}/` : '';
}

export function pageHref(lang: 'en' | 'ko', page = ''): string {
  return href(pagePath(lang, page));
}

export function pageAbsolute(lang: 'en' | 'ko', page = ''): string {
  return absolute(pagePath(lang, page));
}

/** Every page slug the site publishes, in both languages. */
export const PAGES = [
  { slug: '', changefreq: 'daily', priority: '1.0' },
  { slug: 'methodology', changefreq: 'monthly', priority: '0.8' },
  { slug: 'performance', changefreq: 'daily', priority: '0.9' },
  { slug: 'news', changefreq: 'hourly', priority: '0.7' },
  { slug: 'simulator', changefreq: 'weekly', priority: '0.6' },
  { slug: 'sectors', changefreq: 'daily', priority: '0.6' },
  { slug: 'alerts', changefreq: 'monthly', priority: '0.4' },
  { slug: 'about', changefreq: 'monthly', priority: '0.4' },
  { slug: 'disclaimer', changefreq: 'monthly', priority: '0.5' },
  /* Legal / policy surface. AdSense review reads these, and /privacy is the one
     page Google explicitly requires before an application is approved. */
  { slug: 'privacy', changefreq: 'yearly', priority: '0.5' },
  { slug: 'terms', changefreq: 'yearly', priority: '0.4' },
  { slug: 'editorial-policy', changefreq: 'yearly', priority: '0.4' },
  { slug: 'contact', changefreq: 'yearly', priority: '0.4' },
] as const;
