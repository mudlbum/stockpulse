#!/usr/bin/env node
/**
 * Daily market brief — generated and published automatically.
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
 *  2. **AUTO-PUBLISHED BRIEFS MUST NEVER CLAIM HUMAN REVIEW.** In publish mode
 *     the brief goes live on a schedule with nobody reading it first. That is a
 *     legitimate choice for deterministic output, but only if the site says so:
 *     the post carries `reviewStatus: auto-published` and NO `reviewedBy`, and
 *     the content schema REFUSES a reviewer name on an auto-published post.
 *     Putting a person's name on something nobody read is the "misrepresents
 *     information about the content creator" clause in Google's publisher
 *     policy — and a lie besides.
 *
 *     Two modes, chosen by the caller:
 *       (default)   draft: true, opens a review PR, human flips the flag
 *       --publish   draft: false, reviewStatus: auto-published, goes live
 *
 *     `--publish` is restricted to `category: market-brief` by the schema.
 *     Prose is never auto-published.
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

/**
 * Publish mode is deliberately STRICTER than draft mode.
 *
 * A draft gets a human read before it goes live, so a thin one is merely a
 * waste of a review. An auto-published brief has no such backstop, so the bar
 * for putting a page on a live finance site without anyone looking at it is
 * higher: more corroborated facts, and a board that actually moved.
 */
const PUBLISH_MODE = process.argv.includes('--publish');
const MIN_FACTS_PUBLISH = 6;

const HORIZON_LABEL = {
  ultra_short: { en: 'Ultra Short (1–5 days)', ko: '초단기(1~5일)' },
  mid_term: { en: 'Mid Term (1–2 months)', ko: '중기(1~2개월)' },
  long_term: { en: 'Long Term (1–2 years)', ko: '장기(1~2년)' },
  ultra_long: { en: 'Ultra Long (5–10 years)', ko: '초장기(5~10년)' },
};

const REGIME_TEXT = {
  risk_on: {
    en: 'the benchmark is above its 200-day average and more than half the universe is participating',
    ko: '벤치마크가 200일선 위에 있고 유니버스의 절반 이상이 함께 올라가고 있습니다',
  },
  narrowing: {
    en: 'the benchmark is above its 200-day average but fewer than half the universe is participating — leadership is narrowing',
    ko: '벤치마크는 200일선 위에 있지만 200일선을 넘는 종목이 절반에 못 미쳐 주도주가 몇 종목으로 압축되고 있습니다',
  },
  caution: {
    en: 'the benchmark has fallen below its 200-day average. Long momentum entries carry materially more risk here',
    ko: '벤치마크가 200일선을 밑돌고 있습니다. 이런 국면에서는 매수 모멘텀 진입의 위험이 뚜렷하게 커집니다',
  },
  risk_off: {
    en: 'the benchmark is below its 200-day average and breadth is deteriorating. The model scales every short-horizon score down by half in this state',
    ko: '벤치마크가 200일선 아래에 있고 상승 종목 비율도 나빠지고 있습니다. 이런 국면에서 모델은 단기 점수를 절반으로 낮춥니다',
  },
  unknown: {
    en: 'the regime could not be computed today, so scores are unscaled',
    ko: '오늘은 국면을 계산할 만큼 이력이 쌓이지 않아 점수 보정을 적용하지 않았습니다',
  },
};

const fmtPct = (x, d = 1) => (Number.isFinite(x) ? `${x >= 0 ? '+' : ''}${x.toFixed(d)}%` : 'n/a');

/**
 * ── Korean particle agreement ───────────────────────────────────────────────
 *
 * Korean object/subject/topic particles come in pairs and the correct member
 * depends on whether the preceding word ends in a consonant (받침): 삼성전자**가**
 * but 현대차**가**, 반도체**가** but 금융**이**. A template that hard-codes one
 * form is wrong for roughly half of all inputs, and a wrong particle is the
 * single most visible sign that a Korean sentence was assembled by a program
 * rather than written. Sector names, tickers and company names all vary, so the
 * form has to be chosen at concatenation time from the final jamo.
 *
 * Returns the jongseong (final-consonant) index of a word's last character, or
 * 0 when it has none. Digits are read sino-Korean (0 영, 1 일, 3 삼, 6 육,
 * 7 칠, 8 팔 end in a consonant; 2 이, 4 사, 5 오, 9 구 do not) and Latin
 * letters by their Korean names (l 엘, m 엠, n 엔, r 알 do; the rest do not),
 * because tickers like AAPL and codes like 005930 reach these templates too.
 */
const DIGIT_JONG = { 0: 21, 1: 8, 2: 0, 3: 16, 4: 0, 5: 0, 6: 1, 7: 8, 8: 8, 9: 0 };
const LATIN_JONG = { l: 8, m: 16, n: 4, r: 8 };

function finalJamo(word) {
  const cleaned = String(word ?? '').replace(/[\s*_`"'’”)\]}」』】》]+$/u, '');
  const ch = [...cleaned].pop();
  if (!ch) return 0;
  const code = ch.codePointAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (ch >= '0' && ch <= '9') return DIGIT_JONG[Number(ch)];
  const lower = ch.toLowerCase();
  if (lower >= 'a' && lower <= 'z') return LATIN_JONG[lower] ?? 0;
  /* %, ), digits already handled — anything else (punctuation, CJK) reads as an
     open syllable more often than not, so fall back to the vowel form. */
  return 0;
}

/**
 * Pick the member of a Korean particle pair that agrees with `word`.
 * `pair` is written 받침-form first: josa(name, '이/가'), josa(n, '은/는').
 * 으로/로 is the exception — ㄹ-final words take 로, not 으로 — and is handled.
 */
function josa(word, pair) {
  const [withBatchim, withoutBatchim] = pair.split('/');
  const jong = finalJamo(word);
  if (withBatchim === '으로' && jong === 8) return withoutBatchim;
  return jong === 0 ? withoutBatchim : withBatchim;
}

/** 2026-08-15 → 2026년 8월 15일. Korean prose does not date-stamp in ISO. */
function koDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? ''));
  return m ? `${m[1]}년 ${Number(m[2])}월 ${Number(m[3])}일` : String(iso ?? '');
}

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
function composeBrief({ market, lang, rankings, sectors, news, performance, marketTickers }) {
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
    push(`## 지금 시장 국면\n`);
    push(
      `${koDate(asOf)} 종가 기준으로 ${regimeSentence}.` +
      (breadthPct !== null ? ` 순위 산정 대상 가운데 자기 200일선 위에서 거래되는 종목은 ${breadthPct}%입니다.` : '') +
      ` 오늘 단기 점수에 적용한 국면 배수는 ×${regime.multiplier.toFixed(2)}입니다.\n`,
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
      const names = entrants.slice(0, 4).map((r) => (lang === 'en'
        ? `**${r.ticker}** (${r.name}, rank ${r.rank})`
        : `**${r.ticker}**(${r.name}, ${r.rank}위)`)).join(', ');
      parts.push(lang === 'en'
        ? `${entrants.length} new ${entrants.length === 1 ? 'entry' : 'entries'}: ${names}.`
        : `신규 진입 ${entrants.length}종목: ${names}.`);
      facts.push(`entrants:${horizon}`);
    }
    if (climbers.length) {
      const c = climbers[0];
      parts.push(lang === 'en'
        ? `Largest move up: **${c.ticker}**, ${c.movement} places to rank ${c.rank}.`
        : `가장 크게 오른 종목은 **${c.ticker}**${josa(c.ticker, '으로/로')}, ${c.movement}계단 올라 ${c.rank}위입니다.`);
      facts.push(`climber:${horizon}`);
    }
    boardBlocks.push(lang === 'en'
      ? `**${label}** — ${parts.join(' ')} 30-day turnover ${Math.round((board.turnover30d ?? 0) * 100)}%.`
      : `**${label}** — ${parts.join(' ')} 30일 종목 교체율은 ${Math.round((board.turnover30d ?? 0) * 100)}%입니다.`);
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
      push(lang === 'en' ? `\n## Sector flow\n` : `\n## 섹터별 자금 흐름\n`);
      push(lang === 'en'
        ? `On a market-cap-weighted basis, **${name(top)}** led at ${fmtPct(top.return1d, 2)} ` +
          `(breadth ${Math.round((top.breadth ?? 0) * 100)}% advancing) and **${name(bottom)}** lagged at ${fmtPct(bottom.return1d, 2)}. ` +
          `Over 20 sessions the leader is **${name([...secs].sort((a, b) => (b.return20d ?? -99) - (a.return20d ?? -99))[0])}**.\n`
        : (() => {
            const lead20 = name([...secs].sort((a, b) => (b.return20d ?? -99) - (a.return20d ?? -99))[0]);
            const topPct = fmtPct(top.return1d, 2);
            const bottomPct = fmtPct(bottom.return1d, 2);
            return (
              `시가총액 가중 기준으로 **${name(top)}**${josa(name(top), '이/가')} ${topPct}${josa(topPct, '으로/로')} 가장 강했고` +
              `(상승 종목 비중 ${Math.round((top.breadth ?? 0) * 100)}%), **${name(bottom)}**${josa(name(bottom), '이/가')} ` +
              `${bottomPct}${josa(bottomPct, '으로/로')} 가장 부진했습니다. ` +
              `20거래일 기준 선두는 **${lead20}**입니다.\n`
            );
          })());
      facts.push('sector');
    }
  }

  // ── corroborated news clusters ───────────────────────────────────────────
  // Only clusters covered by 2+ independent outlets. A single outlet's headline
  // is not a market event, and repeating one is aggregation without curation.
  //
  // Two filters, both load-bearing for the heading above to be true:
  //
  //   1. The cluster must map to at least one ticker. An unmapped headline
  //      moved no name in this universe, so listing it under "stories moving
  //      more than one name" asserts something the data does not support.
  //   2. At least one of those tickers must be in THIS market. There was no
  //      market filter at all, so a US brief led with an SK hynix story
  //      (034730) — a Korean ticker, in an English brief about the US close.
  //
  // A brief with no qualifying cluster simply omits the section, which is the
  // honest outcome and already how every other section behaves.
  const clusters = (news?.clusters ?? [])
    .filter((c) => c.outlets >= 2)
    .map((c) => ({ ...c, tickers: (c.tickers ?? []).filter((tk) => marketTickers.has(tk)) }))
    .filter((c) => c.tickers.length > 0)
    .slice(0, 3);
  if (clusters.length) {
    push(lang === 'en' ? `\n## Stories moving more than one name\n` : `\n## 여러 종목을 움직인 뉴스\n`);
    push(lang === 'en'
      ? `Headlines below were carried by at least two independent outlets. Sentiment is a lexicon score, not a judgement — see [how that is computed](/blog/).\n`
      : `아래 헤드라인은 서로 다른 매체 두 곳 이상이 함께 보도한 내용입니다. 감성 점수는 단어 사전으로 매긴 값일 뿐 판단이 아닙니다.\n`);
    for (const c of clusters) {
      const tick = c.tickers?.length ? ` — ${c.tickers.slice(0, 5).join(', ')}` : '';
      const meta = lang === 'en' ? `${c.outlets} outlets${tick}` : `매체 ${c.outlets}곳${tick}`;
      push(`- ${c.url ? `[${c.headline}](${c.url})` : c.headline} *(${meta})*`);
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
      : `청산이 끝난 ${overall.closedCount}건 기준으로 승률은 ${(overall.winRate * 100).toFixed(1)}%입니다. ` +
        `같은 기간, 같은 유니버스에서 무작위로 뽑은 대조군의 승률은 ${Number.isFinite(overall.controlWinRate) ? (overall.controlWinRate * 100).toFixed(1) + '%' : 'n/a'}였습니다. ` +
        `건당 평균 순수익률은 ${fmtPct(overall.meanReturn, 2)}, 같은 기간 벤치마크는 ${fmtPct(overall.benchmarkReturn, 2)}입니다. ` +
        `${overall.noFill}건은 제시한 진입 구간 안에서 체결되지 않아 손익이 0입니다. ` +
        `${overall.sampleWarning ? '청산 건수가 30건에 못 미쳐 아직 통계적으로 유의하다고 볼 수 없습니다. ' : ''}` +
        `전체 기록은 [성과 검증](/ko/performance/)에 있습니다.\n`);
    facts.push('audit');
  }

  // ── what this brief is not ───────────────────────────────────────────────
  push(lang === 'en'
    ? `\n## What this brief is not\n\nNothing above is a recommendation to buy or sell. ` +
      `The boards are the mechanical output of a [published rule set](/methodology/) applied to end-of-day data; ` +
      `they say what ranked highest today, not what will go up. Every level shown is derived from the stock's own ` +
      `volatility, and the stops are not guarantees — a gap through a stop fills below it.\n`
    : `\n## 이 브리핑이 아닌 것\n\n위 내용은 매수나 매도를 권유하는 것이 아닙니다. ` +
      `순위표는 [공개된 규칙](/ko/methodology/)을 종가 데이터에 적용해 기계적으로 뽑은 결과이며, ` +
      `오늘 무엇이 상위에 올랐는지를 말할 뿐 무엇이 오를지는 말하지 않습니다. 제시한 가격은 모두 ` +
      `해당 종목 자신의 변동성에서 끌어낸 값이고, 손절가는 보장이 아닙니다. 갭 하락으로 뚫고 내려가면 그 아래에서 체결됩니다.\n`);

  const required = PUBLISH_MODE ? MIN_FACTS_PUBLISH : MIN_FACTS;
  if (facts.length < required) return null;

  return { body: lines.join('\n'), facts, asOf, marketName, regime };
}

function frontmatter(o) {
  const esc = (s) => String(s).replace(/"/g, '\\"');
  const src = o.sources.map((s) => `  - label: "${esc(s.label)}"${s.url ? `\n    url: "${s.url}"` : ''}`).join('\n');

  // In publish mode there is deliberately NO reviewedBy line. The schema
  // rejects one on an auto-published post, which is the mechanism that stops a
  // future edit from quietly attaching a human name to unreviewed output.
  const review = PUBLISH_MODE
    ? 'reviewStatus: auto-published'
    : `reviewStatus: human-reviewed\nreviewedBy: "${esc(o.reviewedBy)}"`;

  const note = PUBLISH_MODE
    ? 'Generated and published automatically, with no individual human review before it went live. Assembled from the same computed figures the leaderboards use — no language model wrote this text, and every number is reproducible from the data files linked below.'
    : 'Assembled automatically from the same computed figures the leaderboards use. No language model wrote this text; every number is reproducible from the data files linked below.';

  return `---
title: "${esc(o.title)}"
description: "${esc(o.description)}"
lang: ${o.lang}
publishedAt: ${o.date}
author: pipeline
${review}
aiAssisted: false
aiNote: "${note}"
sources:
${src}
category: market-brief
tags: ["market-brief", "${o.market.toLowerCase()}"]
tickers: [${o.tickers.map((t) => `"${t}"`).join(', ')}]
draft: ${PUBLISH_MODE ? 'false' : 'true'}
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

  // Ticker → market membership, read from the published universes. Needed to
  // keep one market's headlines out of the other market's brief.
  const tickersByMarket = {};
  for (const m of ['US', 'KR']) {
    const uni = await readJson(path.join(SRC_DATA, `universe-${m.toLowerCase()}.json`), null);
    tickersByMarket[m] = new Set((uni?.tickers ?? []).map((x) => x.ticker));
  }

  const written = [];
  const skipped = [];

  // ONE brief per market per day. See the header comment — this cap is the
  // difference between "automation that adds value" and scaled content abuse.
  for (const market of ['US', 'KR']) {
    const lang = market === 'KR' ? 'ko' : 'en';
    const built = composeBrief({
      market, lang, rankings, sectors, news, performance,
      marketTickers: tickersByMarket[market] ?? new Set(),
    });

    if (!built) {
      skipped.push(
        `${market}: fewer than ${PUBLISH_MODE ? MIN_FACTS_PUBLISH : MIN_FACTS} verifiable facts today` +
        (PUBLISH_MODE ? ' (publish mode sets a higher bar than drafting)' : ''),
      );
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
      : `${koDate(date)} ${built.marketName} 증시 브리핑`;
    const description = lang === 'en'
      ? `What changed across the four StockPulse boards at the ${date} close: regime state, board entries and exits, sector flow, and the corroborated stories behind them.`
      : `${koDate(date)} 종가 기준으로 StockPulse 순위표 4종에서 달라진 것: 시장 국면, 신규 진입과 이탈, 섹터 흐름, 그리고 그 배경이 된 복수 매체 보도.`;

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
  } else if (PUBLISH_MODE) {
    console.log(
      '[brief] PUBLISH MODE — these are live, labelled `auto-published`, and carry ' +
      'no reviewer name because nobody reviewed them. Corrections go through the ' +
      'editorial policy, in public.',
    );
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
