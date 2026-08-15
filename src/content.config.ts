import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog content collection.
 *
 * The frontmatter schema is deliberately opinionated about provenance. For a
 * YMYL finance site, "who wrote this, who checked it, what is it based on, and
 * was a machine involved" are not metadata niceties — they are the trust
 * signals Google's quality guidelines describe raters going looking for, and
 * the difference between "automation that adds value" and the scaled-content
 * abuse the publisher policies prohibit.
 *
 * So `author`, `reviewedBy`, `sources` and `aiAssisted` are REQUIRED. A post
 * cannot be published without stating them, which is the point: the schema
 * makes the disclosure impossible to forget rather than merely encouraged.
 */

const AUTHOR_IDS = ['editorial', 'pipeline'] as const;

const posts = defineCollection({
  loader: glob({ base: './src/content/posts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    title: z.string().min(10).max(90),
    /** Shown in SERPs. CJK counts double against the ~155-unit budget, so the
     *  audit lints this rather than the schema — a hard cap here would reject
     *  legitimate Korean descriptions. */
    description: z.string().min(50).max(320),
    /** Overrides `title` in <title> when the on-page headline is too long for
     *  a SERP. Keeps the h1 readable without truncating in search results. */
    seoTitle: z.string().max(70).optional(),
    lang: z.enum(['en', 'ko']),
    /** Links an EN post to its KO counterpart for hreflang. Both sides carry
     *  the same value. */
    translationKey: z.string().optional(),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),

    /** Who is accountable for this page. */
    author: z.enum(AUTHOR_IDS),
    /** Named human who checked it before publication. Required — an unreviewed
     *  post does not get published. */
    reviewedBy: z.string().min(2),

    /**
     * Was a language model involved in drafting?
     *
     * Google does not require this disclosure for AdSense, and recommends
     * rather than requires it for Search. It is mandatory here anyway: the
     * "misleading representation" publisher policy prohibits concealing
     * information about how content was created, and presenting machine-drafted
     * market commentary as hand-written analysis is squarely that risk. It also
     * converts the automation from a liability into an E-E-A-T asset.
     */
    aiAssisted: z.boolean(),
    /** Rendered verbatim in the disclosure box when `aiAssisted` is true. */
    aiNote: z.string().optional(),

    /** Where the claims come from. Rendered as a visible source list. */
    sources: z.array(z.object({
      label: z.string(),
      url: z.string().url().optional(),
    })).min(1),

    category: z.enum([
      'methodology',    // how the scoring works
      'market-structure',
      'education',      // what a factor/metric means
      'data',           // where the numbers come from and their limits
      'market-brief',   // the automated daily/weekly brief
      'site',           // changelog, corrections, policy
    ]),
    tags: z.array(z.string()).max(8).default([]),

    /** Tickers discussed, so a post can be linked from a leaderboard row. */
    tickers: z.array(z.string()).default([]),

    draft: z.boolean().default(false),
    /** Surfaces the post on the home page and at the top of the index. */
    featured: z.boolean().default(false),
    /** Approximate reading time is computed at build time, not authored. */
  }),
});

export const collections = { posts };

/**
 * Author identities.
 *
 * `editorial` must resolve to a real, externally-corroborable human before
 * launch — an anonymous byline on a YMYL finance site is the single largest
 * non-technical trust problem a site like this can have. The placeholder is
 * flagged by the build audit so it cannot ship unnoticed.
 */
export const AUTHORS = {
  editorial: {
    id: 'editorial',
    name: 'StockPulse Editorial',
    /** REPLACE BEFORE LAUNCH — see docs/LAUNCH_CHECKLIST.md */
    isPlaceholder: true,
    role: { en: 'Editorial', ko: '편집팀' },
    bio: {
      en:
        'Writes and reviews the explanatory content on StockPulse. Every ranking ' +
        'the site publishes is produced by the open-source pipeline in this ' +
        "project's repository, and the methodology is published in full.",
      ko:
        'StockPulse의 설명 콘텐츠를 작성하고 검토합니다. 사이트가 발행하는 모든 순위는 ' +
        '이 프로젝트 저장소의 오픈소스 파이프라인이 산출하며, 방법론은 전문 공개되어 있습니다.',
    },
  },
  pipeline: {
    id: 'pipeline',
    name: 'StockPulse Pipeline',
    isPlaceholder: false,
    role: { en: 'Automated draft, human-reviewed', ko: '자동 초안 · 사람 검토' },
    bio: {
      en:
        'Market briefs are drafted automatically from the same computed data the ' +
        'leaderboards use, then read and approved by a person before publication. ' +
        'Drafts that cannot be corroborated against the underlying data are not published.',
      ko:
        '마켓 브리핑은 리더보드와 동일한 계산 데이터로부터 자동 초안이 작성된 뒤, ' +
        '사람이 읽고 승인한 경우에만 발행됩니다. 근거 데이터로 확인되지 않는 초안은 발행하지 않습니다.',
    },
  },
} as const;

export type AuthorId = keyof typeof AUTHORS;

export const CATEGORY_LABELS = {
  methodology: { en: 'Methodology', ko: '방법론' },
  'market-structure': { en: 'Market structure', ko: '시장 구조' },
  education: { en: 'Explainers', ko: '해설' },
  data: { en: 'Data', ko: '데이터' },
  'market-brief': { en: 'Market briefs', ko: '마켓 브리핑' },
  site: { en: 'Site notes', ko: '사이트 공지' },
} as const;
