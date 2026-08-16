/**
 * Cross-sectional statistics.
 *
 * Everything here operates on an array of (id, value) pairs representing one
 * factor across the whole universe on one day. See docs/METHODOLOGY.md §2.
 *
 * The core design rule: `null` means "unknown" and must survive every transform
 * as `null`. Coercing an unknown to 0 would place the stock at exactly the
 * median of a z-scored distribution, which silently manufactures rank out of
 * missing data.
 */

/** Numeric and finite. `null`, `undefined`, `NaN`, `±Infinity` are all "unknown". */
export function isNum(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function median(values) {
  const v = values.filter(isNum).sort((a, b) => a - b);
  if (v.length === 0) return null;
  const mid = v.length >> 1;
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export function mean(values) {
  const v = values.filter(isNum);
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function stdev(values) {
  const v = values.filter(isNum);
  if (v.length < 2) return null;
  const m = mean(v);
  const variance = v.reduce((acc, x) => acc + (x - m) ** 2, 0) / (v.length - 1);
  return Math.sqrt(variance);
}

/** Median absolute deviation. Robust scale estimator; unaffected by outliers. */
export function mad(values) {
  const v = values.filter(isNum);
  if (v.length < 2) return null;
  const m = median(v);
  return median(v.map((x) => Math.abs(x - m)));
}

/**
 * Linear-interpolated quantile. `q` in [0,1].
 * Used for winsorization bounds and for percentile-rank factors.
 */
export function quantile(values, q) {
  const v = values.filter(isNum).sort((a, b) => a - b);
  if (v.length === 0) return null;
  if (v.length === 1) return v[0];
  const pos = (v.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return v[lo];
  return v[lo] + (v[hi] - v[lo]) * (pos - lo);
}

/**
 * Fraction of the (non-null) population strictly below `x`, plus half the ties.
 * The tie handling matters: without it, a factor where half the universe shares
 * one value (e.g. a count that is 0 for most stocks) would map everyone in that
 * clump to the bottom of the range rather than to its middle.
 */
export function percentileRank(values, x) {
  if (!isNum(x)) return null;
  const v = values.filter(isNum);
  if (v.length === 0) return null;
  let below = 0;
  let equal = 0;
  for (const y of v) {
    if (y < x) below++;
    else if (y === x) equal++;
  }
  return (below + equal / 2) / v.length;
}

/** Clamp `x` into [lo, hi]. Passes `null` through. */
export function clip(x, lo, hi) {
  if (!isNum(x)) return null;
  return Math.min(hi, Math.max(lo, x));
}

/**
 * Clamp values into [p, 1-p] quantiles of the population.
 * METHODOLOGY §2 step 1. Default p = 0.02.
 */
export function winsorize(values, p = 0.02) {
  const lo = quantile(values, p);
  const hi = quantile(values, 1 - p);
  if (lo === null || hi === null) return values.map(() => null);
  return values.map((x) => (isNum(x) ? Math.min(hi, Math.max(lo, x)) : null));
}

/**
 * Signed log transform for right-skewed ratio factors. METHODOLOGY §2 step 2.
 * `signedLog1p(-0.5) === -ln(1.5)` keeps negative inputs meaningful, which
 * matters for factors like margin delta that legitimately go below zero.
 */
export function signedLog1p(x) {
  if (!isNum(x)) return null;
  return Math.sign(x) * Math.log1p(Math.abs(x));
}

/**
 * Robust z-score: (x − median) / (1.4826 × MAD). METHODOLOGY §2 step 3.
 *
 * The 1.4826 constant makes MAD a consistent estimator of σ under normality,
 * so the output is on the familiar z scale.
 *
 * Degenerate case: if MAD is 0 (more than half the universe shares one value)
 * we fall back to the standard deviation. If that is also 0 the factor carries
 * no cross-sectional information at all and every stock scores 0 — correct,
 * because on that day the factor genuinely does not discriminate.
 */
export function robustZ(values, { clipTo = 3 } = {}) {
  const present = values.filter(isNum);
  if (present.length < 3) return values.map(() => null);

  const med = median(present);
  let scale = 1.4826 * mad(present);

  if (!isNum(scale) || scale === 0) {
    const sd = stdev(present);
    scale = isNum(sd) && sd > 0 ? sd : 0;
  }
  if (scale === 0) return values.map((x) => (isNum(x) ? 0 : null));

  return values.map((x) => (isNum(x) ? clip((x - med) / scale, -clipTo, clipTo) : null));
}

/**
 * The full METHODOLOGY §2 pipeline for one factor across one universe.
 *
 *   winsorize → optional log → robust z → clip
 *
 * @param {Array<number|null>} values
 * @param {{ log?: boolean, winsorP?: number, clipTo?: number }} opts
 */
export function normalizeFactor(values, { log = false, winsorP = 0.02, clipTo = 3 } = {}) {
  let v = winsorize(values, winsorP);
  if (log) v = v.map(signedLog1p);
  return robustZ(v, { clipTo });
}

/**
 * Sector-neutral normalization. METHODOLOGY §2 step 3.
 *
 * Fundamental factors are only meaningful relative to sector peers — a 42%
 * gross margin is ordinary for software and exceptional for a grocer. Sectors
 * with fewer than `minGroup` members are pooled into an "other" bucket and
 * normalized together, because a z-score over 3 stocks is noise.
 *
 * @param {Array<number|null>} values
 * @param {string[]} sectors  parallel array of sector keys
 */
export function normalizeBySector(values, sectors, opts = {}) {
  const { minGroup = 8 } = opts;
  const counts = new Map();
  for (const s of sectors) { if (s) counts.set(s, (counts.get(s) ?? 0) + 1); }

  const groupOf = (s) => (counts.get(s) >= minGroup ? s : '__pooled__');

  // Names with no sector are scored against the whole universe, never against
  // each other. They are not a peer group — they are a group of names whose
  // peer group is unknown, and z-scoring them together would invent a
  // comparison ("cheap for an unclassified company") that means nothing. This
  // matters most during a cold start, when the unclassified set is large enough
  // to look like a legitimate sector to every count-based rule downstream.
  const unsectored = [];

  const buckets = new Map();
  sectors.forEach((s, i) => {
    if (!s) { unsectored.push(i); return; }
    const g = groupOf(s);
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g).push(i);
  });

  // Market-wide fallback. A bucket can still be too small to z-score even after
  // pooling (robustZ needs 3+ observations). Returning null there would silently
  // delete every stock in a thinly-represented sector from the board, so those
  // are scored against the whole universe instead — a weaker comparison, but a
  // real one, and better than dropping the name.
  const marketWide = normalizeFactor(values, opts);

  const out = new Array(values.length).fill(null);
  for (const idx of buckets.values()) {
    const sub = idx.map((i) => values[i]);
    const z = normalizeFactor(sub, opts);
    const usable = z.filter(isNum).length;
    idx.forEach((i, k) => {
      out[i] = usable >= 3 ? z[k] : marketWide[i];
    });
  }
  for (const i of unsectored) out[i] = marketWide[i];
  return out;
}

/**
 * Weighted sum with renormalization over present factors. METHODOLOGY §2.
 *
 * If a stock is missing a factor, that factor's weight is redistributed
 * proportionally across the factors it does have, rather than being treated as
 * a zero contribution. Returns `null` when fewer than `minPresent` factors are
 * available — the completeness gate (P4).
 *
 * @param {Record<string, number|null>} factorZ
 * @param {Record<string, number>} weights
 * @param {number} minPresent  minimum count of non-null factors
 */
export function weightedScore(factorZ, weights, minPresent) {
  const keys = Object.keys(weights);
  const present = keys.filter((k) => isNum(factorZ[k]));
  if (present.length < minPresent) {
    return { score: null, completeness: present.length / keys.length, used: present };
  }
  const wSum = present.reduce((a, k) => a + weights[k], 0);
  if (wSum === 0) return { score: null, completeness: 0, used: [] };

  const score = present.reduce((acc, k) => acc + (weights[k] / wSum) * factorZ[k], 0);
  return { score, completeness: present.length / keys.length, used: present };
}

/** Map a z-score onto the 0–100 display scale. METHODOLOGY §2 step 4. */
export function toDisplayScore(z) {
  if (!isNum(z)) return null;
  return Math.round(clip(50 + z * 16.67, 0, 100) * 10) / 10;
}

/**
 * Linear ramp against a reference value, clipped to [0, cap].
 * `ramp(0.14, 0.12) === 1.17` — used wherever the original spec had a hard
 * threshold ("revenue growth above 12%") that we convert to a scored slope so a
 * company at 11.5% is not deleted outright. METHODOLOGY §5.1(a).
 */
export function ramp(x, reference, cap = 2) {
  if (!isNum(x) || !isNum(reference) || reference === 0) return null;
  return clip(x / reference, 0, cap);
}

/** Pearson correlation over paired series. Used for the top-10 correlation cap. */
export function correlation(a, b) {
  const n = Math.min(a.length, b.length);
  const xs = [];
  const ys = [];
  for (let i = 0; i < n; i++) {
    if (isNum(a[i]) && isNum(b[i])) {
      xs.push(a[i]);
      ys.push(b[i]);
    }
  }
  if (xs.length < 10) return null;
  const mx = mean(xs);
  const my = mean(ys);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < xs.length; i++) {
    const a1 = xs[i] - mx;
    const b1 = ys[i] - my;
    num += a1 * b1;
    dx += a1 * a1;
    dy += b1 * b1;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}
