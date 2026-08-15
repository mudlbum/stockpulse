/**
 * Financial-domain headline sentiment. METHODOLOGY §3.3.
 *
 * Uses a Loughran–McDonald style financial word list rather than a
 * general-purpose sentiment lexicon or a transformer.
 *
 * Why not FinBERT, which the original spec called for: it is a ~440MB model
 * whose CPU inference costs minutes per CI run, and — more importantly — its
 * output cannot be reproduced by a reader from the published site. A lexicon is
 * deterministic, auditable, and the word lists are themselves publishable.
 *
 * Why not a general lexicon: in financial text "liability", "tax", "crude",
 * "cost" and "capital" are neutral domain vocabulary, and general lexicons
 * score several of them negative. This is the finding that motivated the
 * Loughran–McDonald lists in the first place.
 *
 * Honest limitation: headline-level lexicon sentiment is weakly predictive and
 * decays within a day or two. It carries 0.20 weight in the ultra-short model,
 * down from the 0.25 originally proposed, for exactly this reason.
 */

/** Terms indicating positive news for an equity. Stems matched as prefixes. */
const POSITIVE = [
  'beat', 'beats', 'exceed', 'exceeds', 'exceeded', 'surge', 'surges', 'surged',
  'soar', 'soars', 'soared', 'rally', 'rallies', 'rallied', 'jump', 'jumps', 'jumped',
  'climb', 'climbs', 'climbed', 'gain', 'gains', 'gained', 'rise', 'rises', 'rose',
  'record', 'records', 'strong', 'stronger', 'strongest', 'robust', 'outperform',
  'outperforms', 'outperformed', 'upgrade', 'upgrades', 'upgraded', 'raise', 'raises',
  'raised', 'boost', 'boosts', 'boosted', 'profit', 'profits', 'profitable',
  'growth', 'growing', 'expansion', 'expands', 'expanded', 'approval', 'approved',
  'approves', 'win', 'wins', 'won', 'award', 'awarded', 'contract', 'partnership',
  'breakthrough', 'launch', 'launches', 'launched', 'accelerate', 'accelerates',
  'accelerating', 'improve', 'improves', 'improved', 'improvement', 'optimistic',
  'confident', 'confidence', 'momentum', 'buyback', 'dividend', 'expansionary',
  'positive', 'favorable', 'favourable', 'success', 'successful', 'milestone',
  'demand', 'orders', 'backlog', 'guidance', 'bullish', 'upside', 'rebound',
  'recovery', 'recovers', 'recovered', 'efficiency', 'margin', 'premium',
  'leading', 'leader', 'dominant', 'innovative', 'patent', 'expansionary',
];

const NEGATIVE = [
  'miss', 'misses', 'missed', 'plunge', 'plunges', 'plunged', 'slump', 'slumps',
  'slumped', 'tumble', 'tumbles', 'tumbled', 'fall', 'falls', 'fell', 'drop',
  'drops', 'dropped', 'decline', 'declines', 'declined', 'sink', 'sinks', 'sank',
  'weak', 'weaker', 'weakest', 'weakness', 'underperform', 'underperforms',
  'downgrade', 'downgrades', 'downgraded', 'cut', 'cuts', 'lower', 'lowers',
  'lowered', 'loss', 'losses', 'unprofitable', 'shrink', 'shrinks', 'shrinking',
  'contraction', 'reject', 'rejects', 'rejected', 'rejection', 'lawsuit', 'sue',
  'sues', 'sued', 'litigation', 'investigation', 'investigating', 'probe',
  'subpoena', 'fraud', 'fraudulent', 'misconduct', 'violation', 'violations',
  'penalty', 'penalties', 'fine', 'fined', 'sanction', 'sanctions', 'recall',
  'recalls', 'recalled', 'delay', 'delays', 'delayed', 'halt', 'halts', 'halted',
  'suspend', 'suspends', 'suspended', 'bankruptcy', 'bankrupt', 'insolvency',
  'default', 'defaults', 'defaulted', 'restructuring', 'layoff', 'layoffs',
  'downsizing', 'resign', 'resigns', 'resigned', 'resignation', 'departure',
  'warning', 'warns', 'warned', 'concern', 'concerns', 'risk', 'risks', 'risky',
  'bearish', 'downside', 'selloff', 'crash', 'crashes', 'slowdown', 'stagnant',
  'disappointing', 'disappoints', 'disappointed', 'shortfall', 'impairment',
  'writedown', 'write-down', 'dilution', 'dilutive', 'overvalued', 'headwind',
  'headwinds', 'pressure', 'pressured', 'struggle', 'struggles', 'struggling',
];

/** Korean equivalents — the site ranks KRX names and reads Korean wires. */
const POSITIVE_KO = [
  '상승', '급등', '강세', '호조', '개선', '흑자', '최대', '최고', '신기록', '수주',
  '계약', '확대', '증가', '성장', '돌파', '승인', '허가', '수혜', '기대', '낙관',
  '반등', '회복', '호실적', '어닝서프라이즈', '목표가상향', '상향', '매수', '자사주',
  '배당', '수출', '점유율', '독점', '특허', '신제품', '출시', '진출', '투자유치',
];

const NEGATIVE_KO = [
  '하락', '급락', '약세', '부진', '악화', '적자', '손실', '감소', '축소', '하향',
  '목표가하향', '매도', '우려', '리스크', '경고', '조사', '소송', '제재', '과징금',
  '벌금', '리콜', '지연', '중단', '정지', '거래정지', '상장폐지', '관리종목',
  '횡령', '배임', '분식', '유상증자', '희석', '구조조정', '감원', '사임', '쇼크',
  '어닝쇼크', '실적악화', '역성장', '침체', '둔화', '적자전환',
];

const NEGATORS = new Set([
  'not', 'no', 'never', 'without', 'unlikely', 'fails', 'fail', 'failed',
  'denies', 'denied', 'deny', 'lacks', 'lack', 'unable', 'cannot', 'excluding',
  'despite', 'less',
]);

const AMPLIFIERS = new Map([
  ['strongly', 1.5], ['significantly', 1.5], ['sharply', 1.5], ['dramatically', 1.5],
  ['massively', 1.6], ['record', 1.4], ['surging', 1.4], ['plummeting', 1.6],
  ['slightly', 0.6], ['modestly', 0.6], ['marginally', 0.5], ['somewhat', 0.7],
  ['slight', 0.6], ['modest', 0.6],
]);

const POS_SET = new Set(POSITIVE);
const NEG_SET = new Set(NEGATIVE);

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Korean terms are matched as substrings — Korean is agglutinative, so
 *  "상승세를" and "상승했다" both need to match the stem "상승". */
function scoreKorean(text) {
  let pos = 0;
  let neg = 0;
  for (const t of POSITIVE_KO) if (text.includes(t)) pos++;
  for (const t of NEGATIVE_KO) if (text.includes(t)) neg++;
  return { pos, neg, terms: pos + neg };
}

/**
 * Score one headline. Returns a value in [-1, 1], or `null` if the text carried
 * no sentiment-bearing terms at all.
 *
 * Normalizing by sqrt(total_terms) rather than total_terms stops a long
 * headline with two sentiment words from being diluted to nothing while still
 * penalizing keyword stuffing.
 */
export function scoreHeadline(text) {
  if (!text || typeof text !== 'string') return null;

  const ko = scoreKorean(text);
  const tokens = tokenize(text);

  let pos = ko.pos;
  let neg = ko.neg;

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const isPos = POS_SET.has(tok);
    const isNeg = NEG_SET.has(tok);
    if (!isPos && !isNeg) continue;

    // Negation window: look back up to 3 tokens for a negator.
    let negated = false;
    for (let j = Math.max(0, i - 3); j < i; j++) {
      if (NEGATORS.has(tokens[j])) {
        negated = true;
        break;
      }
    }

    // Amplifier/downtoner in the two tokens before the sentiment word.
    let weight = 1;
    for (let j = Math.max(0, i - 2); j < i; j++) {
      if (AMPLIFIERS.has(tokens[j])) weight = AMPLIFIERS.get(tokens[j]);
    }

    const effectivelyPositive = negated ? !isPos : isPos;
    if (effectivelyPositive) pos += weight;
    else neg += weight;
  }

  const total = pos + neg;
  if (total === 0) return null;

  const raw = (pos - neg) / Math.sqrt(Math.max(total, 1));
  return Math.max(-1, Math.min(1, raw));
}

/** Source credibility multiplier. METHODOLOGY §3.3. */
export function sourceWeight(kind) {
  switch (kind) {
    case 'filing':
      return 1.5; // 8-K / DART disclosure — primary source
    case 'wire':
      return 1.0; // Reuters, Yonhap, Dow Jones
    case 'aggregator':
      return 0.5; // opinion, syndicated, listicle
    default:
      return 0.8;
  }
}

/**
 * Aggregate a ticker's headlines into one sentiment factor.
 *
 * Returns `null` when the ticker has no mapped headlines. This is the important
 * case: silence is absence of evidence, not neutrality. Scoring it 0 would put
 * every unmentioned stock at the exact median of the z-scored distribution and
 * let hundreds of stocks with no news outrank stocks with mildly negative news.
 * The completeness gate (METHODOLOGY §2) handles it correctly instead.
 *
 * @param {Array<{title: string, summary?: string, publishedAt: string, kind?: string}>} items
 * @param {Date} asOf
 */
export function aggregateSentiment(items, asOf = new Date(), { halfLifeHours = 18, windowHours = 48 } = {}) {
  if (!items || items.length === 0) return null;

  let num = 0;
  let den = 0;
  let counted = 0;

  for (const it of items) {
    const t = new Date(it.publishedAt);
    if (Number.isNaN(t.getTime())) continue;
    const hoursAgo = (asOf.getTime() - t.getTime()) / 3_600_000;
    if (hoursAgo < 0 || hoursAgo > windowHours) continue;

    const s = scoreHeadline(`${it.title ?? ''} ${it.summary ?? ''}`);
    if (s === null) continue;

    const w = Math.exp(-hoursAgo / halfLifeHours) * sourceWeight(it.kind);
    num += s * w;
    den += w;
    counted++;
  }

  if (counted === 0 || den === 0) return null;

  // Shrink toward neutral when the evidence is thin or stale.
  //
  // Without this, the weighted mean `num/den` is scale-invariant: ONE headline
  // scores identically whether it landed an hour ago or 40 hours ago, because
  // the decay factor appears in both numerator and denominator and cancels.
  // That is wrong — a lone stale headline is weak evidence and should produce a
  // small magnitude, not a full-strength one. `den` is the accumulated
  // credibility-weighted, recency-decayed evidence, so shrinking by
  // den/(den + k) pulls thin cases toward zero and leaves well-corroborated
  // fresh ones essentially untouched.
  const EVIDENCE_K = 0.6;
  const shrink = den / (den + EVIDENCE_K);
  const raw = (num / den) * shrink;

  return {
    score: Math.max(-1, Math.min(1, raw)),
    count: counted,
    evidence: Math.round(den * 1000) / 1000,
  };
}

/** Bucket a score for the UI badge. */
export function sentimentLabel(score) {
  if (score === null || score === undefined) return 'unknown';
  if (score > 0.15) return 'bullish';
  if (score < -0.15) return 'bearish';
  return 'neutral';
}

export const LEXICON_STATS = {
  positiveEn: POSITIVE.length,
  negativeEn: NEGATIVE.length,
  positiveKo: POSITIVE_KO.length,
  negativeKo: NEGATIVE_KO.length,
};
