/**
 * Site-wide configuration.
 *
 * SITE_URL / BASE_PATH are supplied by the deploy workflow so the same source
 * builds correctly at a user-site root (https://user.github.io/) and at a
 * project-site subpath (https://user.github.io/stockpulse/).
 */

const rawSite = import.meta.env.SITE_URL || process.env.SITE_URL || 'https://example.github.io';
const rawBase = import.meta.env.BASE_PATH || process.env.BASE_PATH || '/';

export const SITE_URL = rawSite.replace(/\/+$/, '');
export const BASE_PATH = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export const SITE = {
  name: 'StockPulse',
  tagline: {
    en: 'Multi-horizon equity screens for US and Korean markets',
    ko: '미국·한국 증시 멀티 호라이즌 종목 스크리너',
  },
  description: {
    en:
      'Daily rule-based equity leaderboards across four investment horizons, ' +
      'with a fully public performance audit. Market research and education, not investment advice.',
    ko:
      '4개 투자 기간별 규칙 기반 종목 순위를 매일 갱신하고, ' +
      '과거에 발행한 모든 종목의 성과를 공개 검증합니다. 투자 자문이 아닌 시장 조사·교육 자료입니다.',
  },
  /**
   * PLACEHOLDER — `hello@example.com` must be replaced with a real, monitored
   * mailbox before launch. It is the address printed on /contact, /privacy,
   * /terms and in the footer, it is the address AdSense support will use, and
   * PIPA requires a working channel for access/deletion requests. An unread
   * inbox here is a compliance failure, not a cosmetic one.
   * See docs/LAUNCH_CHECKLIST.md step 1.
   */
  contactEmail: 'hello@example.com',
  /**
   * Public source repository. Doubles as a verifiable transparency channel on
   * /contact: anyone can read the code that produced any number on this site.
   * Replace the owner/repo once the real repo exists.
   */
  repoUrl: 'https://github.com/mudlbum/stockpulse',
  /** Typical first-response time quoted on /contact, in business days. */
  responseDays: 3,
  /**
   * Named human accountable for the site. Emitted as Organization.founder
   * (schema.org Person) only when set — an empty string emits nothing rather
   * than a Person node with a placeholder name, which would be worse than
   * silence. An anonymous byline is the largest non-technical trust problem a
   * YMYL finance site can have; see docs/LAUNCH_CHECKLIST.md.
   */
  founderName: '',
  /** Optional corroborating profile for the founder (LinkedIn, GitHub, ORCID). */
  founderUrl: '',
  locales: ['en', 'ko'] as const,
  defaultLocale: 'en' as const,
  /** Bumped whenever any scoring rule changes. Stamped onto every ranking file. */
  methodologyVersion: '1.0.0',
  /**
   * Governing-law placeholder for /terms. MUST be filled in by the operator
   * before launch — an unfilled choice of law is worse than none, because it
   * signals the terms were never read. See docs/LAUNCH_CHECKLIST.md step 3.
   */
  governingLaw: {
    en: '[JURISDICTION — e.g. "the Republic of Korea" or "England and Wales"]',
    ko: '[관할 — 예: "대한민국" 또는 "영국(잉글랜드·웨일스)"]',
  },
  /** Date the current legal pages took effect. Bump when their substance changes. */
  legalEffectiveDate: '2026-08-15',
};

/**
 * ── Advertising: one switch, off by default ──────────────────────────────────
 *
 * Google AdSense publisher ID, e.g. 'ca-pub-1234567890123456'.
 * SHIPPED EMPTY ON PURPOSE. While it is empty:
 *
 *   - no AdSense script tag is emitted into any page,
 *   - Google's CMP is therefore never loaded,
 *   - NO third-party network request is made from this site at all,
 *   - the "Cookie settings" footer control is not rendered,
 *   - /ads.txt is emitted inert (comment lines only).
 *
 * Setting it here (or via the ADSENSE_CLIENT build env var) switches all five
 * on together. There is deliberately no second place to change.
 *
 * CONSENT. The AdSense tag is also the delivery mechanism for Google's own
 * consent management platform — AdSense → Privacy & messaging. That CMP is
 * registered with the IAB TCF, which since January 2024 (EEA/UK) and July 2024
 * (Switzerland) is a hard requirement for serving ANY ad to users in those
 * regions. Do NOT replace it with a hand-written cookie banner: a DIY dialog is
 * not a certified CMP, emits no TC string, and leaves this site permanently on
 * non-personalized/limited ads for that traffic.
 *
 * The Google CMP covers TCF/GDPR. It does NOT make this site compliant with
 * Korea's PIPA, whose Online Customized Advertising guidelines require a
 * separate disclosure and opt-out path. See /privacy (개인정보처리방침) and
 * docs/LAUNCH_CHECKLIST.md, which flags Korean counsel as an open item.
 */
export const ADSENSE_CLIENT = (
  import.meta.env.ADSENSE_CLIENT ||
  process.env.ADSENSE_CLIENT ||
  ''
).trim();

/** True when ads (and therefore the CMP) are wired up. Read, never re-derive. */
export const ADS_ENABLED = ADSENSE_CLIENT !== '';

/**
 * The ads.txt form of the publisher ID: ads.txt wants `pub-…`, the script tag
 * wants `ca-pub-…`. Derived so the two can never disagree.
 */
export const ADSENSE_PUB_ID = ADSENSE_CLIENT.replace(/^ca-/, '');

export type Locale = (typeof SITE.locales)[number];

export const HORIZONS = [
  {
    id: 'ultra_short',
    days: '1-5D',
    accent: '#2563ff',
    accentDark: '#5b8cff',
    label: { en: 'Ultra Short', ko: '초단기' },
    window: { en: '1–5 days', ko: '1~5일' },
    blurb: {
      en: 'Momentum ignition and volatility expansion. Highest turnover, tightest stops.',
      ko: '모멘텀 점화와 변동성 확대. 회전율이 가장 높고 손절 폭이 가장 좁습니다.',
    },
    hasStop: true,
    exitRank: 12,
    minHold: 1,
    maxHold: 5,
  },
  {
    id: 'mid_term',
    days: '1-2M',
    accent: '#0d9488',
    accentDark: '#2dd4bf',
    label: { en: 'Mid Term', ko: '중기' },
    window: { en: '1–2 months', ko: '1~2개월' },
    blurb: {
      en: 'Trend alignment, earnings drift and accumulation. Quality-gated.',
      ko: '추세 정렬, 실적 드리프트, 기관 매집. 재무 건전성 게이트 적용.',
    },
    hasStop: true,
    exitRank: 16,
    minHold: 5,
    maxHold: 45,
  },
  {
    id: 'long_term',
    days: '1-2Y',
    accent: '#059669',
    accentDark: '#34d399',
    label: { en: 'Long Term', ko: '장기' },
    window: { en: '1–2 years', ko: '1~2년' },
    blurb: {
      en: 'Compounding businesses: growth quality, ROIC, free cash flow, valuation.',
      ko: '복리 성장 기업: 성장의 질, ROIC, 잉여현금흐름, 밸류에이션.',
    },
    hasStop: false,
    exitRank: 20,
    minHold: 21,
    maxHold: 504,
  },
  {
    id: 'ultra_long',
    days: '5-10Y',
    accent: '#334155',
    accentDark: '#94a3b8',
    label: { en: 'Ultra Long', ko: '초장기' },
    window: { en: '5–10 years', ko: '5~10년' },
    blurb: {
      en: 'Wide-moat compounders with durable cash flow and reinvestment runway.',
      ko: '넓은 해자와 지속적 현금흐름, 재투자 여력을 갖춘 기업.',
    },
    hasStop: false,
    exitRank: 25,
    minHold: 63,
    maxHold: 2520,
  },
] as const;

export type HorizonId = (typeof HORIZONS)[number]['id'];

export const MARKETS = [
  { id: 'US', label: { en: 'United States', ko: '미국' }, currency: 'USD', benchmark: 'SPY' },
  { id: 'KR', label: { en: 'Korea', ko: '한국' }, currency: 'KRW', benchmark: 'KS11' },
] as const;

export type MarketId = (typeof MARKETS)[number]['id'];
