/**
 * Blog queries. Everything here runs at build time.
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { AUTHORS, CATEGORY_LABELS, type AuthorId } from '../content.config';
import type { Locale } from '../config';

export type Post = CollectionEntry<'posts'>;
export type Category = keyof typeof CATEGORY_LABELS;

export const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

/** Posts per page on the index. */
export const PAGE_SIZE = 8;

/** `en/atr-stops` -> `atr-stops`. The locale lives in the directory. */
export function slugOf(post: Post): string {
  return post.id.replace(/^(en|ko)\//, '').replace(/\.(md|mdx)$/, '');
}

/** Published, non-draft posts for one language, newest first. */
export async function postsFor(lang: Locale): Promise<Post[]> {
  const all = await getCollection('posts', (p) => !p.data.draft && p.data.lang === lang);
  return all.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

export async function allPosts(): Promise<Post[]> {
  const all = await getCollection('posts', (p) => !p.data.draft);
  return all.sort((a, b) => b.data.publishedAt.getTime() - a.data.publishedAt.getTime());
}

/**
 * The counterpart post in the other language, matched on `translationKey`.
 * Returns null when there is no counterpart — a post with no translation must
 * emit self-only hreflang rather than pointing at a URL that does not exist.
 */
export async function counterpart(post: Post): Promise<Post | null> {
  const key = post.data.translationKey;
  if (!key) return null;
  const other: Locale = post.data.lang === 'en' ? 'ko' : 'en';
  const candidates = await postsFor(other);
  return candidates.find((p) => p.data.translationKey === key) ?? null;
}

/**
 * Reading time in minutes.
 *
 * Latin text is counted in words, Korean in characters: CJK has no spaces, so
 * word-splitting a Korean article reports a fraction of its real length and
 * would claim a 2,000-character piece is a one-minute read. 500 CJK chars/min
 * and 220 words/min are the conventional figures.
 */
export function readingTime(body: string): number {
  const withoutCode = body.replace(/```[\s\S]*?```/g, ' ').replace(/`[^`]*`/g, ' ');
  const cjk = (withoutCode.match(/[ㄱ-힝一-鿿぀-ヿ]/g) || []).length;
  const latin = withoutCode
    .replace(/[ㄱ-힝一-鿿぀-ヿ]/g, ' ')
    .split(/\s+/)
    .filter((w) => /[a-z0-9]/i.test(w)).length;
  return Math.max(1, Math.round(cjk / 500 + latin / 220));
}

export function authorOf(post: Post) {
  return AUTHORS[post.data.author as AuthorId];
}

export function categoryLabel(cat: string, lang: Locale): string {
  return (CATEGORY_LABELS as Record<string, Record<Locale, string>>)[cat]?.[lang] ?? cat;
}

/** Categories that actually have posts in this language, with counts. */
export async function categoriesWithCounts(lang: Locale) {
  const posts = await postsFor(lang);
  return CATEGORIES.map((c) => ({
    id: c,
    label: categoryLabel(c, lang),
    count: posts.filter((p) => p.data.category === c).length,
  })).filter((c) => c.count > 0);
}

/**
 * Related posts: same category first, then shared tags, newest first.
 * Never returns the post itself.
 */
export function relatedTo(post: Post, pool: Post[], limit = 3): Post[] {
  const self = post.id;
  const tags = new Set(post.data.tags);
  const scored = pool
    .filter((p) => p.id !== self)
    .map((p) => {
      const sharedTags = p.data.tags.filter((t) => tags.has(t)).length;
      const sameCategory = p.data.category === post.data.category ? 1 : 0;
      return { post: p, score: sameCategory * 3 + sharedTags };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.post.data.publishedAt.getTime() - a.post.data.publishedAt.getTime());
  return scored.slice(0, limit).map((x) => x.post);
}

/** Newer / older neighbours in the same language. */
export function neighbours(post: Post, ordered: Post[]) {
  const i = ordered.findIndex((p) => p.id === post.id);
  return {
    newer: i > 0 ? ordered[i - 1] : null,
    older: i >= 0 && i < ordered.length - 1 ? ordered[i + 1] : null,
  };
}

/** The most recent modification date, for sitemap lastmod and dateModified. */
export function lastModified(post: Post): Date {
  return post.data.updatedAt ?? post.data.publishedAt;
}
