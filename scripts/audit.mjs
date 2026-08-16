#!/usr/bin/env node
/**
 * Post-build audit of `dist/`.
 *
 * Catches the class of bug that only appears in the built output: base-path
 * drops on project-site builds, missing SEO tags, broken internal links, and —
 * the one that matters most here — a ranking table published without its
 * compliance notice.
 */

import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/store.mjs';

const DIST = path.join(ROOT, 'dist');

/**
 * BASE always ends in exactly one '/', matching `BASE_PATH` in src/config.ts.
 *
 * This normalization is load-bearing, not tidiness. `actions/configure-pages`
 * emits `base_path` WITHOUT a trailing slash ('/stockpulse'), while every local
 * invocation in the README passes '/stockpulse/'. The link checker below strips
 * the prefix with `slice(BASE.length - 1)`, which is only correct when BASE ends
 * in a slash — given '/stockpulse' it removes one character too few and turns
 * '/stockpulse/about/' into 'e/about/'. The result is that EVERY internal link
 * on EVERY page reports broken, in CI only, where nobody had ever run it with
 * the un-slashed form. Normalizing at the single point of entry is the fix;
 * the alternative is remembering the slash at three call sites forever.
 */
const BASE = `/${(process.env.BASE_PATH || '/').replace(/^\/+/, '').replace(/\/+$/, '')}/`
  .replace(/^\/{2,}/, '/');
const isProjectSite = BASE !== '/';

const problems = [];
const stats = { pages: 0, links: 0, checked: 0 };

function problem(file, kind, detail) {
  problems.push({ file: path.relative(DIST, file), kind, detail });
}

async function walk(dir, out = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else out.push(p);
  }
  return out;
}

/**
 * SERP width, in display units rather than characters.
 *
 * Google truncates on rendered pixel width, and a CJK glyph occupies roughly
 * twice the width of a latin one. Counting `.length` therefore reports a
 * Korean description as comfortably short while it overflows in the SERP —
 * which is exactly how seven of nine Korean descriptions shipped over budget
 * while appearing fine. Every unit here is "one latin character wide".
 */
function displayWidth(s) {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0);
    const wide =
      (c >= 0x1100 && c <= 0x115f) ||
      (c >= 0x2e80 && c <= 0x303e) ||
      (c >= 0x3041 && c <= 0x33ff) ||
      (c >= 0x3400 && c <= 0x4dbf) ||
      (c >= 0x4e00 && c <= 0x9fff) ||
      (c >= 0xa000 && c <= 0xa4cf) ||
      (c >= 0xac00 && c <= 0xd7a3) ||
      (c >= 0xf900 && c <= 0xfaff) ||
      (c >= 0xfe30 && c <= 0xfe6f) ||
      (c >= 0xff00 && c <= 0xff60) ||
      (c >= 0xffe0 && c <= 0xffe6);
    w += wide ? 2 : 1;
  }
  return w;
}

const TITLE_MAX = 60;
const DESC_MAX = 155;
/* Soft floor. Not a Google rule — a snippet materially shorter than this is
   usually a page that forgot to write one, which is the thing worth catching. */
const DESC_MIN = 60;

function decodeEntities(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}

/** Compliance notice text fragments that must appear alongside any ranking table. */
const COMPLIANCE_EN = 'not personalized financial advice';
const COMPLIANCE_KO = '개인별 투자자문이 아닙니다';

async function main() {
  if (!existsSync(DIST)) {
    console.error('[audit] dist/ not found — run npm run build first');
    process.exit(1);
  }

  const files = await walk(DIST);
  const htmlFiles = files.filter((f) => f.endsWith('.html'));
  const pathsInDist = new Set(
    files.map((f) => '/' + path.relative(DIST, f).split(path.sep).join('/')),
  );

  for (const file of htmlFiles) {
    stats.pages++;
    const html = await readFile(file, 'utf8');
    const isKo = file.includes(`${path.sep}ko${path.sep}`) || file.endsWith(`${path.sep}ko${path.sep}index.html`);

    // ── base path integrity — the #1 project-site failure ─────────────────
    if (isProjectSite) {
      const roots = [
        ...html.matchAll(/(?:href|src)="(\/(?!\/)[^"]*)"/g),
      ].map((m) => m[1]).filter((u) => !u.startsWith(BASE));
      for (const u of new Set(roots)) {
        problem(file, 'base-path', `root-relative URL missing base: ${u}`);
      }
      for (const m of html.matchAll(/url\((["']?)(\/(?!\/)[^"')]*)\1\)/g)) {
        if (!m[2].startsWith(BASE)) problem(file, 'base-path-css', `url() missing base: ${m[2]}`);
      }
    }

    // ── SEO / metadata ────────────────────────────────────────────────────
    if (!/<title>[^<]{5,}<\/title>/.test(html)) problem(file, 'seo', 'missing or too-short <title>');
    if (!/<meta\s+name="description"\s+content="[^"]{40,}"/.test(html)) {
      problem(file, 'seo', 'missing or short meta description');
    }
    const titleText = decodeEntities(/<title>([\s\S]*?)<\/title>/.exec(html)?.[1] ?? '');
    const tw = displayWidth(titleText);
    if (tw > TITLE_MAX) {
      problem(file, 'seo-width', `<title> is ${tw} display units (max ${TITLE_MAX}): ${titleText.slice(0, 70)}`);
    }
    const descText = decodeEntities(/<meta\s+name="description"\s+content="([^"]*)"/.exec(html)?.[1] ?? '');
    const dw = displayWidth(descText);
    if (dw > DESC_MAX) {
      problem(file, 'seo-width', `meta description is ${dw} display units (max ${DESC_MAX})`);
    }
    if (descText && dw < DESC_MIN) {
      problem(file, 'seo-width', `meta description is only ${dw} display units (aim for ${DESC_MIN}-${DESC_MAX})`);
    }

    if (!/<link\s+rel="canonical"/.test(html)) problem(file, 'seo', 'missing canonical');
    if (!/<html[^>]+lang="(en|ko)"/.test(html)) problem(file, 'a11y', 'missing or invalid <html lang>');
    if (!/hreflang="/.test(html)) problem(file, 'seo', 'missing hreflang pairing');

    const h1s = [...html.matchAll(/<h1[\s>]/g)].length;
    if (h1s === 0) problem(file, 'a11y', 'no <h1>');
    if (h1s > 1) problem(file, 'a11y', `${h1s} <h1> elements`);

    // ── images and links ──────────────────────────────────────────────────
    for (const m of html.matchAll(/<img\b[^>]*>/g)) {
      if (!/\salt=/.test(m[0])) problem(file, 'a11y', 'img without alt');
    }
    for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)) {
      const attrs = m[1];
      const text = m[2].replace(/<[^>]+>/g, '').trim();
      const hasLabel = /aria-label=/.test(attrs) || /title=/.test(attrs);
      if (!text && !hasLabel) problem(file, 'a11y', 'link with no accessible name');

      const href = /href="([^"]*)"/.exec(attrs)?.[1];
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
      stats.links++;
      const clean = href.split('#')[0].split('?')[0];
      if (!clean) continue;
      const rel = clean.startsWith('/') ? clean : `/${clean}`;
      const candidates = [rel, `${rel.replace(/\/$/, '')}/index.html`, `${rel}index.html`, `${rel}.html`];
      // BASE ends in '/', so slicing it off and re-adding the leading slash
      // yields a dist-relative path. Written this way rather than
      // `slice(BASE.length - 1)` because the off-by-one there is invisible.
      const stripped = candidates.map((c) => (isProjectSite && c.startsWith(BASE) ? `/${c.slice(BASE.length)}` : c));
      const ok = stripped.some((c) => pathsInDist.has(c) || pathsInDist.has(`${c.replace(/\/$/, '')}/index.html`));
      if (!ok) problem(file, 'link', `broken internal link: ${href}`);
    }

    // ── compliance: a ranking table must never ship without its notice ───
    // Keyed on the explicit `data-board` marker the board component emits, not
    // on a loose class-name match — "leaderboard" appears in ordinary prose on
    // /about and /alerts, and a false positive here would train the reader to
    // ignore a check that exists for legal reasons.
    const hasRankingTable = /\bdata-board\b/.test(html);
    if (hasRankingTable) {
      const needle = isKo ? COMPLIANCE_KO : COMPLIANCE_EN;
      if (!html.includes(needle)) {
        problem(file, 'compliance', `ranking table without the ${isKo ? 'Korean' : 'English'} compliance notice`);
      }
    }

    // Every page must link to the disclaimer.
    if (!/disclaimer/i.test(html)) problem(file, 'compliance', 'no link to the disclaimer');

    // No browser storage APIs anywhere in the shipped output.
    if (/\b(localStorage|sessionStorage)\b/.test(html)) {
      problem(file, 'policy', 'uses a browser storage API');
    }
    stats.checked++;
  }

  // ── required non-HTML artifacts ─────────────────────────────────────────
  for (const required of ['/robots.txt', '/sitemap.xml', '/rss.xml', '/llms.txt',
    '/data/rankings.json', '/data/news.json', '/data/performance.json', '/data/sectors.json']) {
    if (!pathsInDist.has(required)) problems.push({ file: required, kind: 'missing', detail: 'required artifact not built' });
  }

  // Sitemap URLs must be absolute and carry the base path.
  const sitemapPath = path.join(DIST, 'sitemap.xml');
  if (existsSync(sitemapPath)) {
    const xml = await readFile(sitemapPath, 'utf8');
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    if (locs.length === 0) problems.push({ file: 'sitemap.xml', kind: 'seo', detail: 'no <loc> entries' });
    for (const loc of locs) {
      if (!loc.startsWith('http')) problems.push({ file: 'sitemap.xml', kind: 'seo', detail: `relative loc: ${loc}` });
      else if (isProjectSite && !new URL(loc).pathname.startsWith(BASE)) {
        problems.push({ file: 'sitemap.xml', kind: 'base-path', detail: `loc missing base: ${loc}` });
      }
    }
  }

  // Published data must be neither the committed placeholder nor test fixtures.
  const rankingsPath = path.join(DIST, 'data', 'rankings.json');
  if (existsSync(rankingsPath)) {
    const r = JSON.parse(await readFile(rankingsPath, 'utf8'));

    if (r.placeholder && process.env.ALLOW_PLACEHOLDER !== '1') {
      problems.push({
        file: 'data/rankings.json',
        kind: 'data',
        detail: 'shipping PLACEHOLDER rankings — run the refresh pipeline before deploying, or set ALLOW_PLACEHOLDER=1 for a preview build',
      });
    }

    // Fixture detection, independent of the placeholder flag.
    //
    // `smoke-test.mjs --keep` writes REAL pipeline output derived from synthetic
    // fixtures straight into src/data. That output carries no placeholder flag,
    // so the flag check above waves it through — and the deploy's bootstrap step
    // would see "real data already present" and skip fetching. The result would
    // be a live site publishing "US Test Company 43" as a buy candidate.
    // Shape-based detection cannot be defeated by a stale flag.
    const tickers = [];
    for (const market of Object.values(r.boards ?? {})) {
      for (const board of Object.values(market ?? {})) {
        for (const row of board?.rows ?? []) tickers.push(String(row.ticker ?? ''));
      }
    }
    const fixtureLike = tickers.filter((t) => /^US\d{2}$/.test(t) || /^KRTEST/i.test(t));
    if (fixtureLike.length > 0) {
      problems.push({
        file: 'data/rankings.json',
        kind: 'data',
        detail: `shipping TEST FIXTURE data — ${fixtureLike.length} synthetic tickers (${fixtureLike.slice(0, 4).join(', ')}). Run: node tools/make-placeholder-data.mjs, or run the real pipeline`,
      });
    }
    const names = [];
    for (const market of Object.values(r.boards ?? {})) {
      for (const board of Object.values(market ?? {})) {
        for (const row of board?.rows ?? []) names.push(String(row.name ?? ''));
      }
    }
    if (names.some((n) => /Test Company|테스트/i.test(n))) {
      problems.push({ file: 'data/rankings.json', kind: 'data', detail: 'company names contain test-fixture strings' });
    }
  }

  // The ledger is the input to the public performance audit, so fixture entries
  // there are worse than fixture rankings: they are permanent, they are
  // append-only, and they would silently inflate or deflate every published
  // statistic. Checked separately from dist/ because the ledger lives in the
  // repo, not in the build output.
  const ledgerPath = path.join(ROOT, 'data-store', 'ledger.json');
  if (existsSync(ledgerPath)) {
    const l = JSON.parse(await readFile(ledgerPath, 'utf8'));
    const bad = (l.entries ?? []).filter(
      (e) => /^US\d{2}$/.test(String(e.ticker ?? '')) || /Test Company|테스트/i.test(String(e.name ?? '')),
    );
    if (bad.length) {
      problems.push({
        file: 'data-store/ledger.json',
        kind: 'data',
        detail: `ledger contains ${bad.length} TEST FIXTURE entries (e.g. ${bad[0].ticker}) — these would pollute the public performance audit permanently`,
      });
    }
  }

  const byKind = new Map();
  for (const p of problems) byKind.set(p.kind, (byKind.get(p.kind) ?? 0) + 1);

  console.log(`[audit] ${stats.pages} pages, ${stats.links} internal links checked (BASE_PATH=${BASE})`);
  if (problems.length === 0) {
    console.log('[audit] clean');
    return;
  }
  console.error(`[audit] ${problems.length} problems:`);
  for (const [kind, n] of [...byKind].sort((a, b) => b[1] - a[1])) console.error(`  ${kind}: ${n}`);
  for (const p of problems.slice(0, 40)) console.error(`  [${p.kind}] ${p.file} — ${p.detail}`);
  if (problems.length > 40) console.error(`  … and ${problems.length - 40} more`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[audit] fatal:', err);
  process.exit(1);
});
