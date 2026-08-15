#!/usr/bin/env node
/**
 * Daily market brief — automated draft, human review before publication.
 *
 * ── Why this is built the way it is ─────────────────────────────────────────
 *
 * Google's publisher policies bar "automatically generated content without
 * manual review or curation", and the Search spam policy defines scaled content
 * abuse as generating many pages "without adding value". Two design decisions
 * follow directly, and neither is negotiable:
 *
 *  1. **VOLUME IS CAPPED AT ONE BRIEF PER MARKET PER DAY.** Generating a brief
 *     per ticker or per horizon would be 40 pages a day, which is a textbook
 *     scaled-content pattern regardless of quality. Breadth belongs in the
 *     tables, not in the page count. The cap is enforced here, in code, so it
 *     cannot drift via a config change.
 *
 *  2. **DRAFTS ARE WRITTEN WITH `draft: true` AND NEVER AUTO-PUBLISHED.** The
 *     workflow opens a pull request; a human flips the flag. The `reviewedBy`
 *     field is required by the content schema, so an unreviewed brief cannot
 *     render even if the flag were flipped by accident.
 *
 * The brief is also **not** a language-model summary of the news. It is
 * assembled deterministically from figures the pipeline already computed — the
 * board, the regime, the sector aggregates, the clustered headlines — so every
 * sentence is checkable against `data-store/`. That is what makes the
 * automation defensible: it states things that are true and verifiable rather
 * than plausible-sounding prose about the market.
 *
 * A brief with too little to say is NOT written at all. A page that exists only
 * because the cron fired is exactly the "page generated for the primary purpose
 * of..." case the policy describes.
 */

import path from 'node:path';
import { existsSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import { ROOT, SRC_DATA, readJson } from './lib/store.mjs';

const POSTS = path.join(ROOT, 'src', 'content', 'posts');

/** A brief must clear all of these or it is not worth publishing. */
const MIN_FACTS = 4;
const MIN_BOARD_ROWS = 5;

const HORIZON_LABEL = {
  ultra_short: { en: 'Ultra Short (1–5 days)', ko: '초단기(1~5일)' },
  mid_term: { en: 'Mid Term (1–2 months)', ko: '중기(1~2개월)' },
  long_term: { en: 'Long Term (1–2 years)', ko: '장기(1~2년)' },
  ultra_long: { en: 'Ultra Long (5–10 years)', ko: '초장기(5~10년)' },
};

const REGIME_TEXT = {
  risk_on: {
    en: 'the benchmark is above its 200-day average and more than half the universe is participating',
    ko: '벤치마크가 200일 이동평균 위에 있고 유니버스의 절반 이상이 상승 추세에 있습니다',
  },
  narrowing: {
    en: 'the benchmark is above its 200-day average but fewer than half the universe is participating — leadership is narrowing',
    ko: '벤치마크는 200일선 위에 있으나 유니버스의 절반 미만만 상승 추세여서 주도주가 좁아지고 있습니다',
  },
  caution: {
    en: 'the benchmark has fallen below its 200-day average. Long momentum entries carry materially more risk here',
    ko: '벤치마크가 200일선을 하회했습니다. 이 국면에서 롱 모멘텀 진입의 위험은 뚜렷하게 커집니다',
  },
  risk_off: {
    en: 'the benchmark is below its 200-day average and breadth is deteriorating. The model scales every short-horizon score down by half in this state',
    ko: '벤치마크가 200일선 아래이고 시장 폭도 악화되고 있습니다. 이 국면에서 모델은 단기 점수를 절반으로 축소합니다',
  },
  unknown: {
    en: 'the regime could not be computed today, so scores are unscaled',
    ko: '오늘은 국면을 계산할 수 없어 점수 보정이 적용되지 않았습니다',
  },
};

const fmtPct = (x, d = 1) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}%` : 'n/a');

function money(v, currency) {
  if (!Number.isFinite(v)) return 'n/a';
  return currency === 'KRW'
    ? `₩${Math.round(v).toLocaleString('en-US')}`
    : `$${v.toFixed(2)}`;
}

/**
 * Assemble the brief body from computed facts.
 * Returns `null` when there is not enough substance to justify a page.
 */
function composeBrief({ market, lang, rankings, sectors, news, performance }) {
  const asOf = rankings.asOf?.[market];
  const regime = rankings.regime?.[market];
  const boards = rankings.boards?.[market] ?? {};
  if (!asOf || !regime) return null;

  const facts = [];
  const marketName = market === 'US'
    ? { en: 'US', ko: '미국' }[lang]
    : { en: 'Korean', ko: '한국' }[lang];

  const lines = [];
  const push = (s) => lines.push(s);

  // ── opening: regime ──────────────────────────────────────────────────────
  const regimeSentence = (REGIME_TEXT[regime.state] ?? REGIME_TEXT.unknown)[lang];
  const breadthPct = Number.isFinite(regime.breadth) ? Math.round(regime.breadth * 100) : null;

  if (lang === 'en') {
    push(`## Where the tape sits\n`);
    push(
      `As of the ${asOf} close, ${regimeSentence}.` +
      (breadthPct !== null ? ` Breadth — the share of the ranked universe trading above its own 200-day average — is ${breadthPct}%.` : '') +
      ` The regime multiplier applied to short-horizon scores today is ×${regime.multiplier.toFixed(2)}.\n`,
    );
  } else {
    push(`## 현재 시장 국면\n`);
    push(
      `${asOf} 종가 기준으로 ${regimeSentence}.` +
      (breadthPct !== null ? ` 시장 폭(랭킹 유니버스 중 자체 200일선 위에서 거래되는 종목 비중)은 ${breadthPct}%입니다.` : '') +
      ` 오늘 단기 점수에 적용된 국면 배수는 ×${regime.multiplier.toFixed(2)}입니다.\n`,
    );
  }
  facts.push('regime');
  if (breadthPct !== null) facts.push('breadth');

  // ── board movement ───────────────────────────────────────────────────────
  const boardBlocks = [];
  for (const [horizon, board] of Object.entries(boards)) {
    if (!board?.rows?.length || board.rows.length < MIN_BOARD_ROWS) continue;
    const entrants = board.rows.filter((r) => r.movement === 'NEW');
    const climbers = board.rows
      .filter((r) => typeof r.movement === 'number' && r.movement >= 3)
      .sort((a, b) => b.movement - a.movement);

    if (entrants.length === 0 && climbers.length === 0) continue;

    const label = HORIZON_LABEL[horizon][lang];
    const parts = [];
    if (entrants.length) {
      const names = entrants.slice(0, 4).map((r) => `**${r.ticker}** (${r.name}, rank ${r.rank})`).join(', ');
      parts.push(lang === 'en'
        ? `${entrants.length} new ${entrants.length === 1 ? 'entry' : 'entries'}: ${names}.`
        : `신규 진입 ${entrants.length}종목: ${names}.`);
      facts.push(`entrants:${horizon}`);
    }
    if (climbers.length) {
      const c = climbers[0];
      parts.push(lang === 'en'
        ? `Largest move up: **${c.ticker}**, ${c.movement} places to rank ${c.rank}.`
        : `최대 상승: **${c.ticker}**, ${c.movement}계단 상승해 ${c.rank}위.`);
      facts.push(`climber:${horizon}`);
    }
    boardBlocks.push(`**${label}** — ${parts.join(' ')} ${lang === 'en'
      ? `30-day turnover ${Math.round((board.turnover30d ?? 0) * 100)}%.`
      : `30일 회전율 ${Math.round((board.turnover30d ?? 0) * 100)}%.`}`);
  }

  if (boardBlocks.length) {
    push(lang === 'en' ? `\n## What changed on the boards\n` : `\n## 순위표 변화\n`);
    for (const b of boardBlocks) push(`- ${b}`);
    push('');
  }

  // ── sector rotation ──────────────────────────────────────────────────────
  const secs = sectors?.markets?.[market]?.sectors ?? [];
  if (secs.length >= 4) {
    const byDay = [...secs].filter((s) => Number.isFinite(s.return1d)).sort((a, b) => b.return1d - a.return1d);
    if (byDay.length >= 4) {
      const top = byDay[0];
      const bottom = byDay[byDay.length - 1];
      const name = (s) => (lang === 'ko' ? s.nameKo || s.name : s.name);
      push(lang === 'en' ? `\n## Sector flow\n` : `\n## 섹터 흐름\n`);
      push(lang === 'en'
        ? `On a market-cap-weighted basis, **${name(top)}** led at ${fmtPct(top.return1d, 2)} ` +
          `(breadth ${Math.round((top.breadth ?? 0) * 100)}% advancing) and **${name(bottom)}** lagged at ${fmtPct(bottom.return1d, 2)}. ` +
          `Over 20 sessions the leader is **${name([...secs].sort((a, b) => (b.return20d ?? -99) - (a.return20d ?? -99))[0])}**.\n`
        : `시가총액 가중 기준으로 **${name(top)}**이 ${fmtPct(top.return1d, 2)}로 가장 강했고` +
          `(상승 종목 비중 ${Math.round((top.breadth ?? 0) * 100)}%), **${name(bottom)}**이 ${fmtPct(bottom.return1d, 2)}로 가장 부진했습니다. ` +
          `20거래일 기준 선두는 **${name([...secs].sort((a, b) => (b.return20d ?? -99) - (a.return20d ?? -99))[0])}**입니다.\n`);
      facts.push('sector');
    }
  }

  // ── corroborated news clusters ───────────────────────────────────────────
  // Only clusters covered by 2+ independent outlets. A single outlet's headline
  // is not a market event, and repeating one is aggregation without curation.
  const clusters = (news?.clusters ?? []).filter((c) => c.outlets >= 2).slice(0, 3);
  if (clusters.length) {
    push(lang === 'en' ? `\n## Stories moving more than one name\n` : `\n## 복수 종목에 영향을 준 뉴스\n`);
    push(lang === 'en'
      ? `Headlines below were carried by at least two independent outlets. Sentiment is a lexicon score, not a judgement — see [how that is computed](/blog/).\n`
      : `아래 헤드라인은 최소 두 곳 이상의 독립 매체가 보도한 내용입니다. 감성 점수는 사전 기반 계산값이며 판단이 아닙니다.\n`);
    for (const c of clusters) {
      const tick = c.tickers?.length ? ` — ${c.tickers.slice(0, 5).join(', ')}` : '';
      push(`- ${c.url ? `[${c.headline}](${c.url})` : c.headline} *(${c.outlets} outlets${tick})*`);
      facts.push('cluster');
    }
    push('');
  }

  // ── the audit, always ────────────────────────────────────────────────────
  const overall = performance?.summary?.overall;
  if (overall && Number.isFinite(overall.winRate)) {
    push(lang === 'en' ? `\n## How the record actually looks\n` : `\n## 실제 성과 기록\n`);
    push(lang === 'en'
      ? `Across ${overall.closedCount} closed entries the win rate is ${(overall.winRate * 100).toFixed(1)}%, ` +
        `against ${Number.isFinite(overall.controlWinRate) ? (overall.controlWinRate * 100).toFixed(1) + '%' : 'n/a'} for a random-selection control drawn from the same universe on the same dates. ` +
        `Mean net return per closed entry is ${fmtPct(overall.meanReturn, 2)} against a benchmark of ${fmtPct(overall.benchmarkReturn, 2)}. ` +
        `${overall.noFill} entries never traded inside their published entry zone and earned nothing. ` +
        `${overall.sampleWarning ? 'Fewer than 30 closed entries — not yet statistically meaningful. ' : ''}` +
        `Full ledger: [performance audit](/performance/).\n`
      : `청산된 ${overall.closedCount}건 기준 승률은 ${(overall.winRate * 100).toFixed(1)}%이며, ` +
        `동일 기간·동일 유니버스에서 무작위로 뽑은 대조군의 승률은 ${Number.isFinite(overall.controlWinRate) ? (overall.controlWinRate * 100).toFixed(1) + '%' : 'n/a'}입니다. ` +
        `건당 평균 순수익률은 ${fmtPct(overall.meanReturn, 2)}, 벤치마크는 ${fmtPct(overall.benchmarkReturn, 2)}입니다. ` +
        `${overall.noFill}건은 제시된 진입 구간에서 체결되지 않아 수익이 0입니다. ` +
        `${overall.sampleWarning ? '청산 건수가 30건 미만이라 통계적으로 유의하지 않습니다. ' : ''}` +
        `전체 기록: [성과 검증](/ko/performance/).\n`);
    facts.push('audit');
  }

  // ── what this brief is not ───────────────────────────────────────────────
  push(lang === 'en'
    ? `\n## What this brief is not\n\nNothing above is a recommendation to buy or sell. ` +
      `The boards are the mechanical output of a [published rule set](/methodology/) applied to end-of-day data; ` +
      `they say what ranked highest today, not what will go up. Every level shown is derived from the stock's own ` +
      `volatility, and the stops are not guarantees — a gap through a stop fills below it.\n`
    : `\n## 이 브리핑이 아닌 것\n\n위 내용은 매수 또는 매도 권유가 아닙니다. ` +
      `순위표는 [공개된 규칙](/ko/methodology/)을 종가 데이터에 적용한 기계적 산출물이며, ` +
      `오늘 무엇이 상위에 올랐는지를 말할 뿐 무엇이 오를지를 말하지 않습니다. 제시된 모든 가격 수준은 ` +
      `해당 종목 자체의 변동성에서 도출된 값이고, 손절 가격은 보장이 아닙니다. 갭 하락 시 그 아래에서 체결됩니다.\n`);

  if (facts.length < MIN_FACTS) return null;

  return { body: lines.join('\n'), facts, asOf, marketName, regime };
}

function frontmatter(o) {
  const esc = (s) => String(s).replace(/"/g, '\\"');
  const src = o.sources.map((s) => `  - label: "${esc(s.label)}"${s.url ? `\n    url: "${s.url}"` : ''}`).join('\n');
  return `---
title: "${esc(o.title)}"
description: "${esc(o.description)}"
lang: ${o.lang}
publishedAt: ${o.date}
author: pipeline
reviewedBy: "${esc(o.reviewedBy)}"
aiAssisted: false
aiNote: "Assembled automatically from the same computed figures the leaderboards use. No language model wrote this text; every number is reproducible from the data files linked below."
sources:
${src}
category: market-brief
tags: ["market-brief", "${o.market.toLowerCase()}"]
tickers: [${o.tickers.map((t) => `"${t}"`).join(', ')}]
draft: true
featured: false
---

`;
}

async function main() {
  const rankings = await readJson(path.join(SRC_DATA, 'rankings.json'));
  const sectors = await readJson(path.join(SRC_DATA, 'sectors.json'));
  const news = await readJson(path.join(SRC_DATA, 'news.json'));
  const performance = await readJson(path.join(SRC_DATA, 'performance.json'));

  if (!rankings) {
    console.error('[brief] rankings.json not found — run the pipeline first');
    process.exit(1);
  }
  if (rankings.placeholder) {
    console.log('[brief] rankings are placeholder data — refusing to write a brief');
    return;
  }

  const written = [];
  const skipped = [];

  // ONE brief per market per day. See the header comment — this cap is the
  // difference between "automation that adds value" and scaled content abuse.
  for (const market of ['US', 'KR']) {
    const lang = market === 'KR' ? 'ko' : 'en';
    const built = composeBrief({ market, lang, rankings, sectors, news, performance });

    if (!built) {
      skipped.push(`${market}: not enough verifiable substance today`);
      continue;
    }

    const date = built.asOf;
    const slug = `${date}-${market.toLowerCase()}-market-brief`;
    const file = path.join(POSTS, lang, `${slug}.md`);

    if (existsSync(file)) {
      skipped.push(`${market}: ${slug} already exists`);
      continue;
    }

    const board = rankings.boards?.[market]?.ultra_short?.rows ?? [];
    const tickers = board.slice(0, 6).map((r) => r.ticker);

    const title = lang === 'en'
      ? `${built.marketName} market brief — ${date}`
      : `${built.marketName} 마켓 브리핑 — ${date}`;
    const description = lang === 'en'
      ? `What changed across the four StockPulse boards at the ${date} close: regime state, board entries and exits, sector flow, and the corroborated stories behind them.`
      : `${date} 종가 기준 StockPulse 4개 순위표의 변화: 시장 국면, 신규 진입과 이탈, 섹터 흐름, 그리고 그 배경이 된 복수 매체 보도 뉴스.`;

    const fm = frontmatter({
      title, description, lang, date, market, tickers,
      reviewedBy: process.env.BRIEF_REVIEWER || 'PENDING REVIEW',
      sources: [
        { label: 'StockPulse rankings data', url: 'https://mudlbum.github.io/stockpulse/data/rankings.json' },
        { label: 'StockPulse performance ledger', url: 'https://mudlbum.github.io/stockpulse/data/performance.json' },
        { label: 'StockPulse methodology', url: 'https://mudlbum.github.io/stockpulse/methodology/' },
      ],
    });

    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, fm + built.body, 'utf8');
    written.push({ file: path.relative(ROOT, file), facts: built.facts.length });
  }

  for (const s of skipped) console.log(`[brief] skipped — ${s}`);
  for (const w of written) console.log(`[brief] drafted ${w.file} (${w.facts} verifiable facts)`);

  if (written.length === 0) {
    console.log('[brief] nothing worth publishing today. That is a valid outcome, not a failure.');
  } else {
    console.log(
      '[brief] Drafts are marked `draft: true` and will NOT render until a human ' +
      'reviews them and sets a real `reviewedBy`.',
    );
  }
}

export { composeBrief };

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[brief] fatal:', err);
    process.exit(1);
  });
}
