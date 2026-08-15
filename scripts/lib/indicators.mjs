/**
 * Technical indicators.
 *
 * Convention used throughout: a `bars` array is ordered OLDEST FIRST, and each
 * bar is `{ date, open, high, low, close, volume }`. Every function returns the
 * value for the LAST bar, or `null` when there is not enough history.
 *
 * Returning `null` rather than a partially-warmed value is deliberate. An EMA
 * seeded on 5 bars and one seeded on 200 are different statistics, and quietly
 * mixing them across a universe corrupts the cross-sectional z-score that every
 * factor depends on.
 */

import { isNum, median, quantile } from './stats.mjs';

const closes = (bars) => bars.map((b) => b.close);

export function sma(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/**
 * Exponential moving average, seeded with an SMA of the first `period` bars.
 *
 * Requires 3× the period of history before returning a value. An EMA is an
 * infinite-response filter: with only `period` bars, the seed SMA still carries
 * ~37% of the weight and the result is closer to an SMA than an EMA. Three
 * periods drops the seed's influence below 5%.
 */
export function ema(values, period) {
  if (values.length < period * 3) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
  }
  return e;
}

/** Full EMA series (same length as input, `null` until warmed). */
export function emaSeries(values, period) {
  const out = new Array(values.length).fill(null);
  if (values.length < period) return out;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = e;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

export function stdevOf(values, period) {
  if (values.length < period) return null;
  const slice = values.slice(-period);
  const m = slice.reduce((a, b) => a + b, 0) / period;
  return Math.sqrt(slice.reduce((acc, x) => acc + (x - m) ** 2, 0) / period);
}

/** Bollinger bands on the close. Population SD, matching the standard definition. */
export function bollinger(bars, period = 20, mult = 2) {
  const c = closes(bars);
  const mid = sma(c, period);
  const sd = stdevOf(c, period);
  if (mid === null || sd === null) return null;
  return { mid, upper: mid + mult * sd, lower: mid - mult * sd, sd };
}

/** True range for bar `i`. Falls back to the bar's own range at i = 0. */
function trueRange(bars, i) {
  const b = bars[i];
  if (i === 0) return b.high - b.low;
  const pc = bars[i - 1].close;
  return Math.max(b.high - b.low, Math.abs(b.high - pc), Math.abs(b.low - pc));
}

/**
 * Wilder's ATR — a smoothed (not simple) average of true range.
 *
 * Wilder's smoothing uses 1/period rather than 2/(period+1); using the EMA
 * constant here would produce an ATR roughly 2× more responsive than every
 * published reference and would silently tighten every stop the site prints.
 */
export function atr(bars, period = 14) {
  if (bars.length < period + 1) return null;
  let a = 0;
  for (let i = 1; i <= period; i++) a += trueRange(bars, i);
  a /= period;
  for (let i = period + 1; i < bars.length; i++) {
    a = (a * (period - 1) + trueRange(bars, i)) / period;
  }
  return a;
}

/** ATR series, for the ATR-percentile term in the volatility-expansion factor. */
export function atrSeries(bars, period = 14) {
  const out = new Array(bars.length).fill(null);
  if (bars.length < period + 1) return out;
  let a = 0;
  for (let i = 1; i <= period; i++) a += trueRange(bars, i);
  a /= period;
  out[period] = a;
  for (let i = period + 1; i < bars.length; i++) {
    a = (a * (period - 1) + trueRange(bars, i)) / period;
    out[i] = a;
  }
  return out;
}

/** Wilder's RSI. */
export function rsi(bars, period = 14) {
  const c = closes(bars);
  if (c.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = c[i] - c[i - 1];
    if (d > 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  for (let i = period + 1; i < c.length; i++) {
    const d = c[i] - c[i - 1];
    gain = (gain * (period - 1) + Math.max(0, d)) / period;
    loss = (loss * (period - 1) + Math.max(0, -d)) / period;
  }
  if (loss === 0) return gain === 0 ? 50 : 100;
  const rs = gain / loss;
  return 100 - 100 / (1 + rs);
}

/**
 * Relative volume: today's volume over the median of the prior `period`
 * sessions. METHODOLOGY §3.3.
 *
 * The median deliberately excludes today and uses the median rather than the
 * mean, so that one earnings-day spike three weeks ago cannot inflate the
 * denominator and mask a genuine spike today.
 */
export function relativeVolume(bars, period = 30) {
  if (bars.length < period + 1) return null;
  const hist = bars.slice(-(period + 1), -1).map((b) => b.volume);
  const m = median(hist);
  if (!isNum(m) || m <= 0) return null;
  return bars[bars.length - 1].volume / m;
}

/**
 * Chaikin Money Flow over `period` sessions. METHODOLOGY §4.3.
 *
 * Replaces OBV, which assigns a whole session's volume to the direction of the
 * close and is correspondingly noisy. CMF weights each session's volume by
 * where the close sat inside the range, which is what "accumulation" means.
 *
 * Zero-range sessions (limit moves, halts) contribute volume to the denominator
 * with a multiplier of 0 rather than being skipped — a session that could not
 * trade through its range is genuinely uninformative about direction, and
 * dropping it from the denominator would overweight the sessions around it.
 */
export function chaikinMoneyFlow(bars, period = 21) {
  if (bars.length < period) return null;
  const slice = bars.slice(-period);
  let mfv = 0;
  let vol = 0;
  for (const b of slice) {
    const range = b.high - b.low;
    const mult = range > 0 ? ((b.close - b.low) - (b.high - b.close)) / range : 0;
    mfv += mult * b.volume;
    vol += b.volume;
  }
  if (vol <= 0) return null;
  return mfv / vol;
}

/** Simple return over `n` sessions. */
export function returnOver(bars, n) {
  if (bars.length < n + 1) return null;
  const a = bars[bars.length - 1 - n].close;
  const b = bars[bars.length - 1].close;
  if (!isNum(a) || a <= 0) return null;
  return b / a - 1;
}

/** Daily simple-return series, used for correlation caps and beta. */
export function returnSeries(bars, n) {
  const out = [];
  const start = Math.max(1, bars.length - n);
  for (let i = start; i < bars.length; i++) {
    const p = bars[i - 1].close;
    if (isNum(p) && p > 0) out.push(bars[i].close / p - 1);
  }
  return out;
}

/** Median dollar (or won) volume — the liquidity filter in METHODOLOGY §1. */
export function medianDollarVolume(bars, period = 20) {
  if (bars.length < period) return null;
  return median(bars.slice(-period).map((b) => b.close * b.volume));
}

/** Where the last close sits in its `period`-session range, as a 0–1 fraction. */
export function rangePosition(bars, period = 252) {
  if (bars.length < Math.min(period, 60)) return null;
  const slice = bars.slice(-period);
  const hi = Math.max(...slice.map((b) => b.high));
  const lo = Math.min(...slice.map((b) => b.low));
  if (hi <= lo) return null;
  return (bars[bars.length - 1].close - lo) / (hi - lo);
}

/** Fractional distance below the `period`-session high. 0 = at the high. */
export function distanceFromHigh(bars, period = 252) {
  if (bars.length < Math.min(period, 60)) return null;
  const slice = bars.slice(-period);
  const hi = Math.max(...slice.map((b) => b.high));
  if (hi <= 0) return null;
  return (hi - bars[bars.length - 1].close) / hi;
}

/** Percentile of the latest ATR within its own trailing history. */
export function atrPercentile(bars, period = 14, lookback = 100) {
  const series = atrSeries(bars, period).filter(isNum);
  if (series.length < 30) return null;
  const recent = series.slice(-lookback);
  const cur = series[series.length - 1];
  const q = quantile(recent, 0.5);
  if (!isNum(q) || q <= 0) return null;
  return cur / q;
}

/** Overnight gap: previous close → today's open. */
export function overnightGap(bars) {
  if (bars.length < 2) return null;
  const prev = bars[bars.length - 2].close;
  const open = bars[bars.length - 1].open;
  if (!isNum(prev) || prev <= 0 || !isNum(open)) return null;
  return open / prev - 1;
}

/** Where the close sat inside the session range. 0 = on the low, 1 = on the high. */
export function closePosition(bar) {
  const range = bar.high - bar.low;
  if (!isNum(range) || range <= 0) return 0.5;
  return (bar.close - bar.low) / range;
}

/** Ordinary least-squares slope of a series against its index. */
export function slope(values) {
  const v = values.filter(isNum);
  const n = v.length;
  if (n < 3) return null;
  const mx = (n - 1) / 2;
  const my = v.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - mx) * (v[i] - my);
    den += (i - mx) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}
