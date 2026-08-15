import type { Locale } from '../config';

const LOCALE: Record<Locale, string> = { en: 'en-US', ko: 'ko-KR' };

const priceFormatters = new Map<string, Intl.NumberFormat>();

/** Prices: USD to 2dp, KRW to 0dp (there are no sub-won ticks). */
export function fmtPrice(value: number | null | undefined, currency: string, lang: Locale = 'en'): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
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

/** Compact market cap: $12.4T / 1,240조원 style. */
export function fmtCap(value: number, currency: string, lang: Locale = 'en'): string {
  if (!Number.isFinite(value)) return '—';
  if (currency === 'KRW') {
    const jo = value / 1e12;
    return lang === 'ko' ? `${fmtNum(jo, 1, lang)}조원` : `KRW ${fmtNum(jo, 1, lang)}T`;
  }
  const t = value / 1e12;
  if (t >= 1) return `$${fmtNum(t, 2, lang)}T`;
  return `$${fmtNum(value / 1e9, 0, lang)}B`;
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
