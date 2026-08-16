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

    /**
     * How this page reached publication. This field exists so the site can
     * never imply a human read something a human did not read.
     *
     *   human-reviewed  a named person read it before publication
     *   auto-published  generated and published by the pipeline on a schedule,
     *                   with no individual review before it went live
     *
     * `auto-published` is only permitted for the deterministic market brief:
     * text assembled from figures the pipeline computed, where every sentence
     * is checkable against the committed data. It is NOT permitted for prose.
     * See docs/EDITORIAL_POLICY notes and scripts/write-brief.mjs.
     */
    reviewStatus: z.enum(['human-reviewed', 'auto-published']).default('human-reviewed'),

    /**
     * Named human who checked it before publication.
     *
     * Required for human-reviewed posts and REFUSED for auto-published ones —
     * putting a name on something nobody read is the "misrepresents ...
     * information about the content creator" case in Google's publisher
     * policy, and it is also just a lie. The refinement below enforces both
     * directions so neither can drift.
     */
    reviewedBy: z.string().min(2).optional(),

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
  }).refine(
    (d) => d.reviewStatus === 'auto-published' || (d.reviewedBy ?? '').length >= 2,
    { message: 'human-reviewed posts must name their reviewer in `reviewedBy`', path: ['reviewedBy'] },
  ).refine(
    (d) => d.reviewStatus !== 'auto-published' || !d.reviewedBy,
    {
      message: 'auto-published posts must NOT name a reviewer — nobody reviewed it',
      path: ['reviewedBy'],
    },
  ).refine(
    (d) => d.reviewStatus !== 'auto-published' || d.category === 'market-brief',
    {
      message:
        'only the deterministic market brief may be auto-published; prose requires human review',
      path: ['reviewStatus'],
    },
  ),
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
    role: { en: 'Automated, published without individual review', ko: '자동 생성 · 개별 검토 없이 발행' },
    bio: {
      en:
        'Market briefs are assembled automatically from the same computed figures the ' +
        'leaderboards use — no language model writes them, and every number is ' +
        'reproducible from the published data files. They go live on a schedule ' +
        'without a person reading each one first. Nothing is asserted that the ' +
        'pipeline did not compute, a brief is skipped entirely on days with too ' +
        'little to report, and errors are corrected in public under the editorial policy.',
      ko:
        '마켓 브리핑은 순위표와 동일한 계산 결과로 자동 작성됩니다. 생성형 언어 모델은 ' +
        '사용하지 않으며, 모든 수치는 공개된 데이터 파일로 재현할 수 있습니다. 사람이 ' +
        '개별 원고를 읽지 않은 상태로 정해진 시각에 발행되며, 파이프라인이 계산하지 않은 ' +
        '내용은 서술하지 않습니다. 보고할 내용이 부족한 날에는 아예 발행하지 않고, ' +
        '오류는 편집 방침에 따라 공개적으로 정정합니다.',
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
