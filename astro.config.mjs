import { defineConfig } from 'astro/config';
import rehypeBasePath from './src/lib/rehype-base-path.mjs';

/**
 * SITE_URL and BASE_PATH come from the deploy workflow so that one source tree
 * builds correctly both at a user-site root (BASE_PATH=/) and at a project-site
 * subpath (BASE_PATH=/stockpulse/).
 *
 * Nothing in src/ should read these directly — everything goes through
 * src/lib/paths.ts, because `new URL('/x', origin)` silently discards the base.
 */
export default defineConfig({
  site: process.env.SITE_URL,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  compressHTML: true,
  devToolbar: { enabled: false },
  markdown: {
    /* Blog articles cross-link the rest of the site with root-relative hrefs.
       Astro does not apply `base` to markdown output, so without this every
       internal link in every article breaks on a project-site deploy. */
    rehypePlugins: [rehypeBasePath],
  },
});
