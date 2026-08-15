/**
 * SERP width arithmetic, shared by the layout and mirrored by the build audit.
 *
 * Google truncates titles and descriptions on rendered pixel width, and a CJK
 * glyph is about twice as wide as a latin one. Counting `.length` therefore
 * says a Korean description is comfortably short while it overflows in the
 * result — the failure mode that put seven of nine Korean descriptions over
 * budget while looking fine. One unit here means "one latin character wide".
 */

export const TITLE_MAX = 60;
export const DESC_MAX = 155;

export function displayWidth(s: string): number {
  let w = 0;
  for (const ch of String(s)) {
    const c = ch.codePointAt(0)!;
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

/**
 * Title with the brand appended only when it fits.
 *
 * A truncated brand ("… | StockPul") is worse than no brand, and an article
 * headline is more valuable in the visible width than the site name is.
 */
export function composeTitle(title: string, brand: string, max = TITLE_MAX): string {
  const t = title.trim();
  if (t.toLowerCase().includes(brand.toLowerCase())) return t;
  const withBrand = `${t} | ${brand}`;
  return displayWidth(withBrand) <= max ? withBrand : t;
}

/**
 * A meta description that fits, cut at a sentence boundary.
 *
 * The blog's `description` frontmatter is written as an on-page lede — two or
 * three sentences, 230-260 units. Rather than rewrite twenty articles or ship a
 * mid-word truncation, take whole sentences up to the budget. The result reads
 * as finished prose, which a snippet ending in "…" does not.
 */
export function serpDescription(text: string, max = DESC_MAX): string {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (displayWidth(clean) <= max) return clean;

  const sentences = clean.split(/(?<=[.!?。！？])\s+/);
  let out = '';
  for (const s of sentences) {
    const next = out ? `${out} ${s}` : s;
    if (displayWidth(next) > max) break;
    out = next;
  }
  if (out) return out;

  /* A single sentence longer than the budget: cut on a word boundary for latin,
     and mid-string for CJK, which has no spaces to cut on. */
  let acc = '';
  for (const ch of clean) {
    if (displayWidth(acc + ch) > max - 1) break;
    acc += ch;
  }
  const lastSpace = acc.lastIndexOf(' ');
  const hasSpaces = lastSpace > max * 0.5;
  return (hasSpaces ? acc.slice(0, lastSpace) : acc).trimEnd() + '…';
}
