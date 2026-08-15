/**
 * Rewrites root-relative links inside markdown so they survive a project-site
 * build.
 *
 * Astro rewrites `base` into `<a href>` written in .astro templates, but it
 * does NOT touch hrefs that come out of a markdown file. An article containing
 * `[the methodology](/methodology/)` therefore emits `/methodology/` verbatim,
 * which 404s on every deploy where BASE_PATH is not `/`. Twenty articles
 * cross-linking each other is twenty broken pages.
 *
 * Left alone deliberately:
 *   - absolute URLs (http:, https:, mailto:, tel:, //cdn…)
 *   - in-page anchors (#section)
 *   - anything already carrying the base prefix, so the transform is idempotent
 */

const RAW_BASE = process.env.BASE_PATH || '/';
const BASE = RAW_BASE.endsWith('/') ? RAW_BASE : `${RAW_BASE}/`;

const ATTR_BY_TAG = { a: 'href', img: 'src', source: 'src', video: 'src', audio: 'src' };

function rewrite(value) {
  if (typeof value !== 'string' || value === '') return value;
  // protocol-relative or absolute URL, anchor, or query-only — not ours
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return value;
  if (value.startsWith('//') || value.startsWith('#') || value.startsWith('?')) return value;
  if (!value.startsWith('/')) return value; // already relative, leave it
  if (BASE !== '/' && value.startsWith(BASE)) return value; // idempotent
  return BASE + value.replace(/^\/+/, '');
}

export default function rehypeBasePath() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element') {
        const attr = ATTR_BY_TAG[node.tagName];
        if (attr && node.properties && typeof node.properties[attr] === 'string') {
          node.properties[attr] = rewrite(node.properties[attr]);
        }
      }
      if (node.children) node.children.forEach(visit);
    };
    visit(tree);
  };
}
