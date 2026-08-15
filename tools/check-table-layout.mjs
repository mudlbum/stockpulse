/**
 * Regression guard for every wide table on the site.
 *
 * Three bugs shipped from one root cause: a cell whose content is wider than
 * its column overflows, and then either gets clipped by the container (the
 * "Show fa…" toggle, the "AVG HOL…" header) or lands on top of the next
 * column's number (a completeness badge over a STOP price). None of it is
 * visible to a viewport media query, because these containers are narrower
 * than the viewport — so measure the DOM instead of guessing from breakpoints.
 *
 * Asserts, for every .scroll-area on every page at every breakpoint:
 *   - the scroll affordance (hint + edge mask + tabindex) is shown exactly
 *     when the region really does overflow, and never when it does not;
 *   - no table is clipped without that affordance;
 *   - no element inside a leaderboard data row extends past its own cell.
 *
 * Requires a built dist/ at BASE=/stockpulse/. Run: npm run check:layout
 */

import { chromium } from 'playwright';
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST = new URL('../dist', import.meta.url).pathname;
const BASE = '/stockpulse';
const types = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
};

const PAGES = [
  ['home', '/stockpulse/'],
  ['performance', '/stockpulse/performance'],
  ['sectors', '/stockpulse/sectors'],
  ['news', '/stockpulse/news'],
  ['simulator', '/stockpulse/simulator'],
  ['about', '/stockpulse/about'],
  ['ko-home', '/stockpulse/ko/'],
  ['ko-performance', '/stockpulse/ko/performance'],
  ['ko-methodology', '/stockpulse/ko/methodology'],
];

const WIDTHS = [1600, 1440, 1280, 1180, 1000, 900, 760, 390];

const server = http.createServer(async (req, res) => {
  let p = decodeURI(req.url.split('?')[0]);
  if (p.startsWith(BASE)) p = p.slice(BASE.length) || '/';
  let f = path.join(DIST, p);
  try {
    if ((await stat(f)).isDirectory()) f = path.join(f, 'index.html');
  } catch {
    f = f + '.html';
  }
  try {
    const b = await readFile(f);
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' });
    res.end(b);
  } catch {
    res.writeHead(404);
    res.end('nf');
  }
});
await new Promise((r) => server.listen(4400, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let failures = 0;
let checked = 0;

for (const [name, url] of PAGES) {
  for (const w of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 1000 } });
    const pg = await ctx.newPage();
    const errs = [];
    pg.on('pageerror', (e) => errs.push(String(e)));
    await pg.goto('http://localhost:4400' + url, { waitUntil: 'networkidle' });
    await pg.waitForTimeout(250); // let the affordance script settle

    const r = await pg.evaluate(() => {
      const visible = (el) => el.getBoundingClientRect().width > 0;

      /* every scrollable region: does the affordance match reality? */
      const areas = [...document.querySelectorAll('.scroll-area')]
        .filter((a) => visible(a))
        .map((area, i) => {
          const wrap = area.querySelector('.scroll-wrap');
          const hint = area.querySelector('.scroll-hint');
          const table = wrap && wrap.querySelector('table');
          const overflows = wrap ? wrap.scrollWidth - wrap.clientWidth > 1 : false;
          return {
            i,
            id: (table && (table.id || table.className)) || 'n/a',
            cols: table && table.rows[0] ? table.rows[0].cells.length : 0,
            overflows,
            hint: hint ? !hint.hidden : null,
            mask: wrap ? wrap.classList.contains('is-scrollable') : null,
            tabbable: wrap ? wrap.getAttribute('tabindex') === '0' : null,
          };
        });

      /* leaderboard rows: does anything paint outside its own cell? */
      const bleed = [];
      const panel = [...document.querySelectorAll('.board-panel')].find((p) => !p.hidden);
      if (panel) {
        panel.querySelectorAll('tbody tr.row > td').forEach((td) => {
          const cell = td.getBoundingClientRect();
          td.querySelectorAll('*').forEach((el) => {
            const b = el.getBoundingClientRect();
            if (b.width > 0 && b.right > cell.right + 0.5) {
              bleed.push(`${td.className} << ${el.className || el.tagName} +${Math.round(b.right - cell.right)}px`);
            }
          });
        });
      }
      return { areas, bleed: [...new Set(bleed)].slice(0, 4) };
    });

    const badAreas = r.areas.filter((a) => a.overflows !== a.hint || a.overflows !== a.mask || a.overflows !== a.tabbable);
    const ok = badAreas.length === 0 && r.bleed.length === 0 && errs.length === 0;
    checked += r.areas.length;
    if (!ok) failures++;

    const scrolling = r.areas.filter((a) => a.overflows).length;
    console.log(
      ok ? 'PASS' : 'FAIL',
      name.padEnd(15),
      String(w).padStart(5),
      '| regions:',
      String(r.areas.length).padStart(2),
      'scrolling:',
      String(scrolling).padStart(2),
      '| cell bleed:',
      r.bleed.length ? r.bleed.join(' ; ') : 'none',
      badAreas.length ? '| MISMATCHED AFFORDANCE: ' + JSON.stringify(badAreas) : '',
      errs.length ? '| ERR ' + errs[0] : '',
    );
    await ctx.close();
  }
}

await browser.close();
server.close();
console.log(
  failures === 0
    ? `\nALL PASS — ${checked} scrollable regions measured; affordance always matches actual overflow, no cell overflows its column`
    : `\n${failures} FAILURES`,
);
process.exit(failures === 0 ? 0 : 1);
