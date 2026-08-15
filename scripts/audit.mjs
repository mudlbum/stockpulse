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
const BASE = (process.env.BASE_PATH || '/').replace(/\/+$/, '/') || '/';
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
      const stripped = candidates.map((c) => (isProjectSite && c.startsWith(BASE) ? c.slice(BASE.length - 1) : c));
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

  // Published data must not be the committed placeholder.
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
