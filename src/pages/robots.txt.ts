import type { APIRoute } from 'astro';
import { absolute } from '../lib/paths';

export const GET: APIRoute = () => {
  const body = `# ${absolute('')}
User-agent: *
Allow: /

# Machine-readable mirrors of everything on the site.
# rankings.json / news.json / performance.json / sectors.json / health.json
# are stable URLs and may be polled directly instead of scraped.

Sitemap: ${absolute('sitemap.xml')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
