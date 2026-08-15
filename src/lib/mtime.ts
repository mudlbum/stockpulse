/**
 * Content modification times for static pages, read at build time.
 *
 * A sitemap that stamps every URL with the same timestamp is telling crawlers
 * that /disclaimer/ changes every time the price data does. That is false, and
 * a lastmod that is demonstrably false is a lastmod Google stops reading. Each
 * static page instead reports the newest mtime of the sources that render it.
 */

import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const SRC = fileURLToPath(new URL('../', import.meta.url));

/** Files that, if touched, change what a given page says. */
const SOURCES: Record<string, string[]> = {
  '': ['views/pages/HomeView.astro', 'i18n/ui.ts'],
  methodology: ['views/pages/MethodologyView.astro', '../docs/METHODOLOGY.md', 'i18n/methodology-ko.ts'],
  performance: ['views/pages/PerformanceView.astro', 'i18n/ui.ts'],
  news: ['views/pages/NewsView.astro', 'i18n/ui.ts'],
  simulator: ['views/pages/SimulatorView.astro', 'i18n/ui.ts'],
  sectors: ['views/pages/SectorsView.astro', 'i18n/ui.ts'],
  alerts: ['views/pages/AlertsView.astro', 'i18n/ui.ts'],
  about: ['views/pages/AboutView.astro', 'i18n/ui.ts'],
  disclaimer: ['views/pages/DisclaimerView.astro', 'i18n/ui.ts'],
  privacy: ['views/pages/PrivacyView.astro', 'components/LegalSections.astro', 'i18n/ui.ts'],
  terms: ['views/pages/TermsView.astro', 'components/LegalSections.astro', 'i18n/ui.ts'],
  'editorial-policy': ['views/pages/EditorialPolicyView.astro', 'i18n/ui.ts'],
  contact: ['views/pages/ContactView.astro', 'i18n/ui.ts'],
};

const cache = new Map<string, string>();

export function sourceModified(slug: string): string {
  const hit = cache.get(slug);
  if (hit) return hit;
  const files = SOURCES[slug] ?? ['i18n/ui.ts'];
  let newest = 0;
  for (const f of files) {
    try {
      const t = statSync(new URL(f, SRC)).mtimeMs;
      if (t > newest) newest = t;
    } catch {
      /* a source listed here may not exist in every checkout — skip it */
    }
  }
  const iso = new Date(newest || Date.now()).toISOString();
  cache.set(slug, iso);
  return iso;
}
