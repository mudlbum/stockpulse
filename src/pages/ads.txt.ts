import type { APIRoute } from 'astro';
import { ADSENSE_CLIENT, ADSENSE_PUB_ID, BASE_PATH, SITE_URL } from '../config';

/**
 * /ads.txt — IAB Authorized Digital Sellers.
 *
 * Generated rather than checked in as `public/ads.txt`, because the publisher
 * ID has to come from the one place that holds it (config.ts ADSENSE_CLIENT).
 * A hand-maintained copy in public/ would be a second source of truth for the
 * same number, and a mismatch between the ads.txt line and the ad tag is a
 * silent revenue failure.
 *
 * ── THE CONSTRAINT THAT WILL BITE ON A PROJECT-SITE DEPLOY ─────────────────
 *
 * ads.txt is ONLY read from the DOMAIN ROOT. The spec has crawlers fetch
 * `https://<root-domain>/ads.txt` and nothing else — not a subdirectory, and
 * not a redirect target.
 *
 * On a GitHub Pages PROJECT site (https://mudlbum.github.io/stockpulse/) this
 * file is published at https://mudlbum.github.io/stockpulse/ads.txt. That URL
 * will never be fetched. The root for that deploy is `mudlbum.github.io`, and
 * whatever sits at https://mudlbum.github.io/ads.txt is what counts — a file
 * this repository does not control.
 *
 * Two ways out, in order of preference:
 *
 *   1. Point a custom apex domain at the site (`./setup-github.sh --domain
 *      stockpulse.example`). BASE_PATH becomes '/', this file lands at the
 *      real root, and the problem disappears. Recommended — it also fixes
 *      canonical URLs, cookie scope and the general appearance of the site.
 *
 *   2. Deploy as a USER site instead: a repo named `mudlbum.github.io`, which
 *      is served from the root. Or, keeping the project site, add an ads.txt
 *      containing the same line to a separate `mudlbum.github.io` repository.
 *      Note that this makes the authorization apply to EVERY project site on
 *      that github.io subdomain, which is a real consideration if others live
 *      there.
 *
 * Doing nothing is also survivable — a missing ads.txt is not a policy
 * violation and ads still serve — but AdSense will warn about it indefinitely
 * and unauthorized inventory sells at a discount.
 *
 * See docs/LAUNCH_CHECKLIST.md step 8.
 */
export const GET: APIRoute = () => {
  const rootOk = BASE_PATH === '/';
  const servedAt = `${SITE_URL}${BASE_PATH}ads.txt`;
  const requiredAt = `${new URL(SITE_URL).origin}/ads.txt`;

  const header = [
    '# ads.txt — IAB Authorized Digital Sellers',
    `# Generated from ADSENSE_CLIENT in src/config.ts at build time.`,
    `# Served at: ${servedAt}`,
    `# Crawlers read ONLY: ${requiredAt}`,
    rootOk
      ? '# These match, so this file is in the right place.'
      : '# THESE DO NOT MATCH. This is a project-site deploy, so no crawler will\n' +
        '# ever read this file. Use a custom apex domain, or publish the same line\n' +
        '# from a user-site repo. See the comment in src/pages/ads.txt.ts.',
    '#',
  ];

  const record = ADSENSE_PUB_ID
    ? // The one canonical form. Four comma-separated fields, one line:
      //   <ad system domain>, <publisher id>, <DIRECT|RESELLER>, <certification id>
      // f08c47fec0942fa0 is Google's TAG certification authority ID and is the
      // same for every AdSense publisher.
      `google.com, ${ADSENSE_PUB_ID}, DIRECT, f08c47fec0942fa0`
    : [
        '# INERT — no publisher ID configured, so no authorization is asserted.',
        '# Set ADSENSE_CLIENT in src/config.ts (e.g. ca-pub-1234567890123456) and',
        '# this file will emit exactly one uncommented line, in this form:',
        '#',
        '# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0',
      ].join('\n');

  const body = `${header.join('\n')}\n${record}\n`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};

/**
 * A note on the placeholder, since it is easy to copy the wrong thing:
 * ADSENSE_CLIENT is the `ca-pub-…` form used in the ad tag; ads.txt wants the
 * `pub-…` form. ADSENSE_PUB_ID derives one from the other so the two can never
 * disagree. `ADSENSE_CLIENT` is referenced here purely to keep that dependency
 * visible to anyone reading this file in isolation.
 */
void ADSENSE_CLIENT;
