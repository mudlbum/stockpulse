import type { Locale } from '../config';

const LOCALE: Record<Locale, string> = { en: 'en-US', ko: 'ko-KR' };

const priceFormatters = new Map<string, Intl.NumberFormat>();

/**
 * Prices: USD to 2dp, KRW to 0dp (there are no sub-won ticks).
 *
 * Korean pages print won as a suffix — 349,174원 — not with the ₩ sign that
 * `Intl` produces for ko-KR. Korean brokerages and financial press use the
 * suffix; the symbol is what an English-language system emits for the currency,
 * and it reads that way. The English pages keep ₩349,174, which is correct
 * there for the same reason.
 */
export function fmtPrice(value: number | null | undefined, currency: string, lang: Locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  if (lang === 'ko' && currency === 'KRW') return `${fmtNum(value, 0, lang)}원`;
  const key = `${lang}:${currency}`;
  let f = priceFormatters.get(key);
  if (!f) {
    const digits = currency === 'KRW' ? 0 : 2;
    f = new Intl.NumberFormat(LOCALE[lang], {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
    priceFormatters.set(key, f);
  }
  return f.format(value);
}

/** Bare number, no currency symbol — for entry/stop/target columns. */
export function fmtLevel(value: number | null | undefined, currency: string, lang: Locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const digits = currency === 'KRW' ? 0 : 2;
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function fmtNum(value: number | null | undefined, digits = 2, lang: Locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** Percentage with an explicit sign. Never rely on colour alone. */
export function fmtPct(value: number | null | undefined, digits = 2, lang: Locale = 'en', signed = true): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const s = new Intl.NumberFormat(LOCALE[lang], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value));
  if (!signed) return `${s}%`;
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${s}%`;
}

/** Fraction (0–1) rendered as a percentage. */
export function fmtRatioPct(value: number | null | undefined, digits = 1, lang: Locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return fmtPct(value * 100, digits, lang, false);
}

/**
 * Compact market cap: $12.4T / 1,240조원 style.
 *
 * Korean counts large sums in 억 (10^8) and 조 (10^12), not in thousands, and
 * it switches units rather than printing a fraction: a ₩947bn cap is 9,473억원
 * to a Korean reader, never "0.9조원", and a ₩40bn one is 400억원, never
 * "0.0조원" — which is what a straight 조 division printed for every KOSPI
 * sector below a trillion won.
 */
export function fmtCap(value: number, currency: string, lang: Locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  if (currency === 'KRW') {
    const jo = value / 1e12;
    if (lang !== 'ko') return `KRW ${fmtNum(jo, 1, lang)}T`;
    return Math.abs(value) >= 1e12 ? `${fmtNum(jo, 1, lang)}조원` : `${fmtNum(value / 1e8, 0, lang)}억원`;
  }
  const t = value / 1e12;
  if (t >= 1) return `$${fmtNum(t, 2, lang)}T`;
  return `$${fmtNum(value / 1e9, 0, lang)}B`;
}

/**
 * Number joined to its counter word.
 *
 * English needs the space ("3 outlets"); Korean closes it up ("3개 매체").
 * Korean orthography permits the space after an Arabic numeral, but no Korean
 * publication uses it, so a templated `{n} {unit}` reads as machine output.
 */
export function withUnit(value: string | number, unit: string, lang: Locale = 'en'): string {
  return lang === 'ko' ? `${value}${unit}` : `${value} ${unit}`;
}

export function fmtDate(iso: string | null | undefined, lang: Locale = 'en'): string {
  if (!iso) return '—';
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(d);
}

export function fmtDateTime(iso: string | null | undefined, lang: Locale = 'en'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(LOCALE[lang], {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
    timeZoneName: 'short',
  }).format(d);
}

/** Server-rendered relative time; the client refreshes it on load. */
export function relativeTime(iso: string, lang: Locale = 'en', now = Date.now()): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '—';
  const mins = Math.round((now - t) / 60000);
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' });
  if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

/**
 * Deterministic monogram colour. No external logo service, no network call,
 * no tracking pixel — just a hue derived from the ticker string.
 * Saturation/lightness are fixed at values verified to clear 4.5:1 for every
 * hue in both themes (see tools/contrast.mjs).
 */
export function tickerHue(ticker: string): number {
  let h = 2166136261;
  for (let i = 0; i < ticker.length; i++) {
    h ^= ticker.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h) % 360;
}

/**
 * 1–2 character monogram.
 *
 * Korean listing codes are six digits and most of them start with zeros —
 * 005930, 000660, 006400 — so taking the first two characters renders "00" on
 * nearly every Korean tile. Leading zeros are stripped first, which restores
 * the differentiating digits.
 */
export function monogram(ticker: string): string {
  const clean = ticker.replace(/[^A-Za-z0-9가-힣]/g, '');
  if (/^\d+$/.test(clean)) {
    const significant = clean.replace(/^0+/, '') || clean;
    return significant.length >= 2 ? significant.slice(0, 2) : clean.slice(-2);
  }
  return clean.slice(0, 2).toUpperCase();
}

/** Direction helpers — always paired with an arrow or sign in the markup. */
export function dirClass(value: number | null | undefined): 'up' | 'down' | 'flat' {
  if (value === null || value === undefined || !Number.isFinite(value) || value === 0) return 'flat';
  return value > 0 ? 'up' : 'down';
}

export function dirArrow(value: number | null | undefined): string {
  const d = dirClass(value);
  return d === 'up' ? '▲' : d === 'down' ? '▼' : '–';
}
