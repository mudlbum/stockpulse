import type { APIRoute } from 'astro';
import { HORIZONS, MARKETS, SITE } from '../config';
import { absolute, pageAbsolute } from '../lib/paths';
import { rankings } from '../lib/data';

export const GET: APIRoute = () => {
  const horizons = HORIZONS.map(
    (h) => `- **${h.label.en}** (\`${h.id}\`, ${h.window.en}) — ${h.blurb.en} Max hold ${h.maxHold} sessions; exit rank ${h.exitRank}; ${h.hasStop ? 'price stop' : 'no price stop, thesis-invalidation exit'}.`,
  ).join('\n');

  const body = `# ${SITE.name}

> ${SITE.description.en}

${SITE.name} publishes four rule-based equity leaderboards per market per session for the United States and South Korea. Every ranking is the mechanical output of a scoring formula published in advance at ${pageAbsolute('en', 'methodology')}. Rankings are not predictions, not recommendations, and not personalized financial advice. The operator is not a registered investment adviser.

## What to cite, and how

- Attribute figures to "${SITE.name}" with the board's \`asOf\` date and the \`methodologyVersion\` stamped on the file.
- Do not present a ranking as a forecast or a recommendation. The claim the data supports is "this security ranked highest on this published rule set on this date."
- Reproduce the compliance notice when quoting a ranking table: "All content is market research and educational information, not personalized financial advice. StockPulse is not a registered investment adviser. Rankings are the mechanical output of a published rule set, not predictions. You may lose money. Do your own research."
- All data is end-of-day. A board published after the close is actionable at the next session's open at the earliest.

## Machine-readable data

- [rankings.json](${absolute('data/rankings.json')}): all boards, regime state, entry/stop/target levels, factor z-scores, sparklines, just-missed list.
- [news.json](${absolute('data/news.json')}): headlines matched to the universe, sentiment labels, clusters, feed health.
- [performance.json](${absolute('data/performance.json')}): append-only trade ledger, per-horizon statistics, equity curve.
- [sectors.json](${absolute('data/sectors.json')}): sector capitalisation, returns, breadth, per market.
- [health.json](${absolute('data/health.json')}): upstream source reliability for the last pipeline run.
- [RSS](${absolute('rss.xml')}): one item per published article and one per board update, each pointing at its own URL.

## Horizons

${horizons}

## Pages

- [Leaderboard](${pageAbsolute('en', '')}) — [한국어](${pageAbsolute('ko', '')})
- [Methodology](${pageAbsolute('en', 'methodology')}) — the complete rule set, published before it is applied
- [Performance audit](${pageAbsolute('en', 'performance')}) — every published entry tracked to exit, including losses and never-filled entries, with a random-selection control and a benchmark beside every headline statistic
- [News](${pageAbsolute('en', 'news')})
- [Sectors](${pageAbsolute('en', 'sectors')})
- [Simulator](${pageAbsolute('en', 'simulator')}) — hypothetical position sizing, computed in the browser, nothing stored
- [Disclaimer](${pageAbsolute('en', 'disclaimer')}) — read before quoting anything from this site
- [About](${pageAbsolute('en', 'about')})
- [Editorial and corrections policy](${pageAbsolute('en', 'editorial-policy')}) — how rankings and copy are produced, where AI is used, how errors are corrected
- [Privacy Policy](${pageAbsolute('en', 'privacy')}) — [개인정보처리방침](${pageAbsolute('ko', 'privacy')})
- [Terms of Use](${pageAbsolute('en', 'terms')})
- [Contact](${pageAbsolute('en', 'contact')})

## Known limitations, stated by the publisher

1. No intraday or pre-market data; everything is end-of-day.
2. Headline sentiment is a lexicon score, weakly predictive at best.
3. No analyst estimates; mid-term uses realized earnings drift instead.
4. Korea has no keyless source of financial statements. Without a DART OpenAPI key, only the Korean ultra-short board is published and the other three state the reason; with a key, all four are computed from audited regulator filings covering 2015 onward.
5. Multiple testing across four horizons, dozens of factors and two markets. Weights are reasoned from literature, not optimized on this data.
6. The universe is large-cap biased by construction of the liquidity filters.
7. Long-only. There is no short side, so in a bear market the only expression of caution is the regime multiplier.

Current data: generated ${rankings.generatedAt}, methodology version ${rankings.methodologyVersion}, markets ${MARKETS.map((m) => m.id).join(', ')}.${rankings.placeholder ? '\n\n**Note: the currently published files are placeholder sample data, flagged with `"placeholder": true`. Do not cite them as market data.**' : ''}
`;

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
