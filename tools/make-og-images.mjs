/**
 * Rasterises the social card to PNG, one per language.
 *
 * og:image cannot be an SVG. Facebook, LinkedIn, X, Slack, Discord, WhatsApp
 * and iMessage all reject image/svg+xml, and `twitter:card=summary_large_image`
 * reserves a large slot that then renders blank — so every share of this site
 * was imageless. PNG at 1200×630 is the format every one of them accepts.
 *
 * Two variants because the single card previously stacked an English and a
 * Korean tagline on top of each other, which reads as clutter in both
 * languages and as noise in neither.
 *
 *   node tools/make-og-images.mjs
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Horizon accent bar — the four colours from config.ts HORIZONS. */
const ACCENTS = ['#2563ff', '#0d9488', '#059669', '#334155'];

function card({ title, tagline, sub, foot, fontFamily }) {
  const bars = ACCENTS.map((c, i) => `<rect x="${i * 300}" y="0" width="300" height="8" fill="${c}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0d1117"/>
  ${bars}
  <g font-family="${fontFamily}">
    <text x="80" y="196" font-size="82" font-weight="700" fill="#e7edf4">${esc(title)}</text>
    <text x="80" y="264" font-size="35" fill="#a3b1c2">${esc(tagline)}</text>
    <text x="80" y="318" font-size="27" fill="#7c8da0">${esc(sub)}</text>
    <path d="M80 440 L210 440 L268 372 L338 500 L404 412 L462 440 L1120 440"
          fill="none" stroke="#43d18a" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="80" y="566" font-size="24" fill="#7c8da0">${esc(foot)}</text>
  </g>
</svg>`;
}

const LATIN = 'DejaVu Sans, Helvetica, Arial, sans-serif';
/* The container has DejaVu but no CJK face; Noto CJK is present on most build
   images. Fall back through both so the Korean card degrades to boxes rather
   than to nothing if neither is installed. */
const CJK = 'Noto Sans CJK KR, Noto Sans KR, NanumGothic, DejaVu Sans, sans-serif';

const CARDS = {
  'og-en.png': card({
    title: 'StockPulse',
    tagline: 'Daily US & Korea stock rankings across four horizons',
    sub: 'Published rule set · every entry audited to its exit',
    foot: 'Market research and education. Not investment advice.',
    fontFamily: LATIN,
  }),
  'og-ko.png': card({
    title: 'StockPulse',
    tagline: '미국·한국 증시 일간 종목 순위 · 4개 투자 기간',
    sub: '공개된 규칙 · 발행한 모든 종목의 성과 검증',
    foot: '시장 조사 및 교육 자료입니다. 투자자문이 아닙니다.',
    fontFamily: CJK,
  }),
};

mkdirSync(OUT, { recursive: true });
const rendered = {};
for (const [name, svg] of Object.entries(CARDS)) {
  const png = await sharp(Buffer.from(svg), { density: 144 }).resize(1200, 630).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(join(OUT, name), png);
  rendered[name] = png;
  console.log(`wrote public/${name} (${(png.length / 1024).toFixed(0)} KB)`);
}

/* A PNG at the generic path too, so any og:image URL already scraped from an
   earlier build resolves to a real raster instead of 404ing. */
writeFileSync(join(OUT, 'og.png'), rendered['og-en.png']);
console.log('wrote public/og.png (alias of og-en.png)');
