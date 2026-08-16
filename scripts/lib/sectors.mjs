/**
 * Sector capital-flow aggregation for the treemap.
 *
 * "Capital flow" here means what is actually observable in end-of-day data:
 * the market-cap-weighted return of each sector plus its breadth. It is NOT
 * fund-flow data — that is a licensed product, and labelling a return map as
 * "flows" would be a claim the data cannot support. The site says so.
 */

import { publish } from './store.mjs';
import { returnOver } from './indicators.mjs';
import { isNum } from './stats.mjs';

export const HORIZONS_META = { note: 'sector aggregation is horizon-independent' };

/** Korean labels for the GICS sectors used on the US board. */
const SECTOR_KO = {
  'Information Technology': '정보기술',
  'Health Care': '헬스케어',
  Financials: '금융',
  'Consumer Discretionary': '경기소비재',
  'Consumer Staples': '필수소비재',
  Energy: '에너지',
  Industrials: '산업재',
  Materials: '소재',
  Utilities: '유틸리티',
  'Real Estate': '부동산',
  'Communication Services': '커뮤니케이션서비스',
  Unknown: '기타',
};

function pct(x) {
  return isNum(x) ? Math.round(x * 10000) / 100 : null;
}

/**
 * Market-cap-weighted sector return over `n` sessions.
 *
 * Weighting by cap rather than equal-weighting matters: an equal-weight sector
 * "flow" is dominated by its smallest members, which is the opposite of where
 * capital actually sits.
 */
function weightedReturn(members, n) {
  let num = 0;
  let den = 0;
  for (const m of members) {
    const r = returnOver(m.bars, n);
    if (!isNum(r) || !isNum(m.marketCap) || m.marketCap <= 0) continue;
    num += r * m.marketCap;
    den += m.marketCap;
  }
  return den > 0 ? num / den : null;
}

export function aggregateSectors(ctx) {
  const bySector = new Map();
  for (const r of ctx.rows) {
    // An unclassified name gets no tile. A treemap cell labelled 'Unknown'
    // carries no information about capital flow and, during a cold start, would
    // be the largest cell on the chart purely because classification lags.
    const s = r.sector || null;
    if (!s) continue;
    if (!bySector.has(s)) bySector.set(s, []);
    bySector.get(s).push(r);
  }

  const totalCap = ctx.rows.reduce((a, r) => a + (isNum(r.marketCap) ? r.marketCap : 0), 0);

  const sectors = [];
  for (const [name, members] of bySector) {
    // A "sector" of one or two names is a company, not a sector, and giving it
    // a tile implies a breadth reading the sample cannot support.
    if (members.length < 3) continue;

    const cap = members.reduce((a, r) => a + (isNum(r.marketCap) ? r.marketCap : 0), 0);
    let adv = 0;
    let dec = 0;
    for (const m of members) {
      const b = m.bars;
      if (b.length < 2) continue;
      const ch = b[b.length - 1].close / b[b.length - 2].close - 1;
      if (ch > 0) adv++;
      else if (ch < 0) dec++;
    }
    const counted = adv + dec;

    sectors.push({
      name,
      nameKo: SECTOR_KO[name] ?? name,
      return1d: pct(weightedReturn(members, 1)),
      return5d: pct(weightedReturn(members, 5)),
      return20d: pct(weightedReturn(members, 20)),
      marketCap: Math.round(cap),
      weight: totalCap > 0 ? Math.round((cap / totalCap) * 10000) / 10000 : 0,
      advancers: adv,
      decliners: dec,
      breadth: counted > 0 ? Math.round((adv / counted) * 1000) / 1000 : null,
      members: members.length,
    });
  }

  sectors.sort((a, b) => b.marketCap - a.marketCap);
  return sectors;
}

export async function publishSectors(byMarket) {
  const markets = {};
  for (const [market, ctx] of Object.entries(byMarket)) {
    if (!ctx) continue;
    markets[market] = { asOf: ctx.asOf, sectors: aggregateSectors(ctx) };
  }
  return publish('sectors', {
    markets,
    note:
      'Sector tiles show market-cap-weighted price return and breadth computed from ' +
      'the ranked universe. This is not fund-flow data, which is a licensed product.',
  });
}
