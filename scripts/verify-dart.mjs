#!/usr/bin/env node
/**
 * Prove that DART data actually opens the Korean boards.
 *
 * ── Why this script exists ──────────────────────────────────────────────────
 *
 * The DART integration cannot be tested against the live API from here: a key
 * is a credential, and this pipeline was written without holding one. Unit
 * tests cover the adapter's arithmetic, but they cannot answer the question
 * that actually matters — does a store built from DART responses make Korea's
 * mid-term, long-term and ultra-long boards computable, or does something
 * further downstream still reject it?
 *
 * That question is answerable offline, because everything from the store
 * onwards is deterministic and already runs without network. So this seeds a
 * Korean store from DART-shaped fixtures THROUGH THE REAL ADAPTER, runs the
 * real ranking job, and asserts the three boards fill.
 *
 * What it proves: the adapter's output is a shape the factor models score.
 * What it does not prove: that DART's live field names match the mapping. That
 * is what the coverage telemetry in refresh-kr.mjs measures on the first real
 * run, and why that telemetry exists.
 *
 *   node scripts/verify-dart.mjs
 */

import { execFileSync } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, STORE, SRC_DATA, PUBLIC_DATA, writeJson, readJson } from './lib/store.mjs';
import { makeBars } from '../tests/fixtures/generate.mjs';
import { makeDartReport } from '../tests/fixtures/dart.mjs';
import {
  readReport, quartersFromReports, annualFromReport, balanceFromReports,
  periodEnd, filedFromRcept, REPORT_ORDER,
} from './lib/dart.mjs';

const BACKUP = path.join(ROOT, '.dart-verify-backup');
const YEARS = 11;                 // DART covers 2015 onward
const COMPANIES = 60;

const pass = [];
const fail = [];
const check = (name, cond, detail = '') => {
  if (cond) pass.push(name);
  else fail.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

/** Build one company's statement history the way refresh-kr.mjs does. */
function buildCompany(seed) {
  const endYear = new Date().getUTCFullYear() - 1;
  const stored = {};
  for (let i = 0; i < YEARS; i++) {
    const year = endYear - i;
    // Grow backwards so the series has a real trend for the growth factors.
    const base = (1 + (seed % 7) * 0.03) ** (YEARS - i);
    for (const code of REPORT_ORDER) {
      const months = { 11013: 1, 11012: 2.05, 11014: 3.15, 11011: 4.3 }[code];
      const rows = makeDartReport({
        scale: base * months * (1 + (seed % 5) * 0.11),
        ytd: 1,
        standardCodes: seed % 3 !== 0,      // a third use custom account codes
      });
      const { values, cumulative } = readReport(rows);
      stored[`${year}:${code}`] = {
        year, code,
        end: periodEnd(year, code),
        filed: filedFromRcept(`${year + (code === '11011' ? 1 : 0)}0320000101`),
        values, cumulative,
      };
    }
  }

  const byYear = new Map();
  for (const [k, rep] of Object.entries(stored)) {
    const [y, code] = k.split(':');
    if (!byYear.has(y)) byYear.set(y, {});
    byYear.get(y)[code] = rep;
  }
  const quarters = [];
  const annual = [];
  for (const [y, reports] of [...byYear.entries()].sort()) {
    quarters.push(...quartersFromReports(reports));
    const a = annualFromReport(reports['11011'], y);
    if (a) annual.push(a);
  }
  const all = Object.values(stored);
  return {
    quarters: quarters.sort((a, b) => (a.end < b.end ? -1 : 1)).slice(-24),
    annual: annual.sort((a, b) => a.fy - b.fy).slice(-12),
    balance: balanceFromReports(all),
    lastFiled: all.map((r) => r.filed).filter(Boolean).sort().at(-1) ?? null,
  };
}

async function main() {
  for (const [dir, dest] of [[STORE, BACKUP], [SRC_DATA, `${BACKUP}-src`], [PUBLIC_DATA, `${BACKUP}-pub`]]) {
    await rm(dest, { recursive: true, force: true });
    if (existsSync(dir)) await cp(dir, dest, { recursive: true });
  }

  try {
    const prices = { market: 'KR', bars: {} };
    const fund = { market: 'KR', companies: {} };
    const tickers = [];
    const SECTORS = ['반도체', '전자부품', '자동차', '의약품', '금융', '화학', '소프트웨어', '유통', '건설'];

    for (let i = 0; i < COMPANIES; i++) {
      const ticker = String(100000 + i * 137).padStart(6, '0');
      prices.bars[ticker] = makeBars({
        n: 400, seed: 5000 + i, start: 8000 + i * 900,
        drift: 0.00008 + (i % 7) * 0.00014, vol: 0.013 + (i % 5) * 0.005,
        volume: 500_000 + i * 30_000,
      });
      const built = buildCompany(i);
      fund.companies[ticker] = {
        ...built,
        sector: SECTORS[i % SECTORS.length],
        snapshots: [{ date: '2026-08-14', marketCap: 5e11 + i * 8e10, shares: 5e7, close: 8000 + i * 900 }],
        updatedAt: new Date().toISOString(),
      };
      tickers.push({
        ticker, name: `한국테스트${i}`, sector: SECTORS[i % SECTORS.length],
        exchange: i % 3 === 0 ? 'KOSDAQ' : 'KOSPI',
        marketCap: 5e11 + i * 8e10,
      });
    }
    prices.bars.KS11 = makeBars({ n: 400, seed: 888, start: 2600, drift: 0.00025, vol: 0.010 });

    const asOf = prices.bars[tickers[0].ticker].at(-1).date;
    await writeJson(path.join(STORE, 'prices', 'kr.json'), prices);
    await writeJson(path.join(STORE, 'fundamentals', 'kr.json'), fund);
    await writeJson(path.join(SRC_DATA, 'universe-kr.json'),
      { market: 'KR', asOf, count: tickers.length, tickers }, { pretty: true });
    // US is out of scope here; an empty universe makes the ranking job skip it.
    await writeJson(path.join(SRC_DATA, 'universe-us.json'),
      { market: 'US', asOf, count: 0, tickers: [], sectorEtfs: {} }, { pretty: true });
    await writeJson(path.join(STORE, 'prices', 'us.json'), { market: 'US', bars: {} });
    await writeJson(path.join(STORE, 'fundamentals', 'us.json'), { market: 'US', companies: {} });

    const sample = fund.companies[tickers[0].ticker];
    check('quarters were assembled', sample.quarters.length >= 12, `${sample.quarters.length}`);
    check('a decade of annuals was assembled', sample.annual.length >= 10, `${sample.annual.length}`);
    check('a balance sheet was assembled', !!sample.balance);
    check('revenue is present on the annuals', sample.annual.every((a) => typeof a.revenue === 'number'));
    check('quarterly revenue is a quarter, not a year',
      sample.quarters.at(-1).revenue < sample.annual.at(-1).revenue,
      `q=${sample.quarters.at(-1).revenue} vs fy=${sample.annual.at(-1).revenue}`);

    execFileSync('node', [path.join(ROOT, 'scripts', 'build-rankings.mjs')],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

    const rankings = await readJson(path.join(SRC_DATA, 'rankings.json'));
    for (const horizon of ['ultra_short', 'mid_term', 'long_term', 'ultra_long']) {
      const board = rankings?.boards?.KR?.[horizon];
      check(`KR/${horizon} fills with DART data`, (board?.rows?.length ?? 0) > 0,
        `${board?.rows?.length ?? 0} rows, emptyReason=${board?.emptyReason?.code ?? 'none'}`);
      check(`KR/${horizon} carries no empty-board notice`, board?.emptyReason == null,
        board?.emptyReason?.code ?? '');
    }
    // Not just "the board has rows" — the rows have to be scored and named, or
    // the board is a list of tickers with nothing behind them.
    const long = rankings?.boards?.KR?.long_term?.rows ?? [];
    check('long-term rows carry a score', long.every((r) => typeof r.score === 'number'),
      JSON.stringify(Object.keys(long[0] ?? {})));
    check('long-term rows are ranked 1..n', long.every((r, i) => r.rank === i + 1));
    check('long-term rows name a company', long.every((r) => typeof r.name === 'string' && r.name.length > 0));

    // The point of DART: the long-horizon factors are computed, not skipped.
    const scored = long.filter((r) =>
      r.factors && Object.values(r.factors).some((f) => typeof f?.z === 'number'));
    check('long-term rows carry computed factor z-scores', scored.length === long.length,
      `${scored.length}/${long.length}`);

    // The specific thing DART unlocks: fundamentals the keyless path cannot see.
    const fundamentalFactors = ['growthQuality', 'capitalEfficiency', 'cashGeneration', 'valuation', 'fScore'];
    const present = fundamentalFactors.filter((k) =>
      long.some((r) => typeof r.factors?.[k]?.raw === 'number'));
    check('the statement-derived factors are computed, not skipped',
      present.length === fundamentalFactors.length,
      `computed: ${present.join(', ') || 'none'}`);
  } finally {
    for (const [dir, dest] of [[STORE, BACKUP], [SRC_DATA, `${BACKUP}-src`], [PUBLIC_DATA, `${BACKUP}-pub`]]) {
      if (!existsSync(dest)) continue;
      await rm(dir, { recursive: true, force: true });
      await cp(dest, dir, { recursive: true });
      await rm(dest, { recursive: true, force: true });
    }
    console.log('[dart] restored the previous store and published data');
  }

  console.log(`\n[dart] ${pass.length} checks passed, ${fail.length} failed`);
  for (const f of fail) console.error(`  FAIL ${f}`);
  if (fail.length) process.exit(1);
  console.log('[dart] OK — DART-derived fundamentals open all four Korean boards');
}

main().catch((err) => { console.error('[dart] fatal:', err); process.exit(1); });
