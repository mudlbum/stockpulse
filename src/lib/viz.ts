/**
 * Chart geometry, computed at build time and emitted as inline SVG.
 * No charting library and no D3 — everything here is a few lines of arithmetic
 * and shipping 90 kB of JavaScript to draw a 100×28 polyline would be absurd.
 */

/* ------------------------------------------------------------------ */
/* sparkline                                                           */
/* ------------------------------------------------------------------ */

export interface Spark {
  line: string;
  area: string;
  rising: boolean;
  first: number;
  last: number;
}

export function sparkline(values: number[], w = 100, h = 28, pad = 2): Spark | null {
  const v = (values || []).filter((n) => Number.isFinite(n));
  if (v.length < 2) return null;
  const min = Math.min(...v);
  const max = Math.max(...v);
  const span = max - min || 1;
  const innerH = h - pad * 2;
  const pts = v.map((n, i) => {
    const x = (i / (v.length - 1)) * w;
    const y = pad + innerH - ((n - min) / span) * innerH;
    return [Number(x.toFixed(2)), Number(y.toFixed(2))] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  return { line, area, rising: v[v.length - 1] >= v[0], first: v[0], last: v[v.length - 1] };
}

/* ------------------------------------------------------------------ */
/* equity curve                                                        */
/* ------------------------------------------------------------------ */

export interface LineChart {
  width: number;
  height: number;
  plot: { x: number; y: number; w: number; h: number };
  strategy: string;
  benchmark: string;
  yTicks: { y: number; label: string }[];
  xTicks: { x: number; label: string }[];
  min: number;
  max: number;
}

export function equityChart(
  points: { date: string; value: number; benchmark: number }[],
  width = 860,
  height = 300,
): LineChart | null {
  if (!points || points.length < 2) return null;
  const plot = { x: 52, y: 14, w: width - 52 - 14, h: height - 14 - 30 };
  const all = points.flatMap((p) => [p.value, p.benchmark]);
  const rawMin = Math.min(...all);
  const rawMax = Math.max(...all);
  const padding = (rawMax - rawMin) * 0.12 || 1;
  const min = Math.floor(rawMin - padding);
  const max = Math.ceil(rawMax + padding);
  const span = max - min || 1;

  const px = (i: number) => plot.x + (i / (points.length - 1)) * plot.w;
  const py = (v: number) => plot.y + plot.h - ((v - min) / span) * plot.h;
  const path = (key: 'value' | 'benchmark') =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)} ${py(p[key]).toFixed(1)}`).join(' ');

  const tickCount = 5;
  const yTicks = Array.from({ length: tickCount }, (_, i) => {
    const v = min + (span * i) / (tickCount - 1);
    return { y: Number(py(v).toFixed(1)), label: v.toFixed(0) };
  });

  const xCount = Math.min(6, points.length);
  const xTicks = Array.from({ length: xCount }, (_, i) => {
    const idx = Math.round((i / (xCount - 1)) * (points.length - 1));
    return { x: Number(px(idx).toFixed(1)), label: points[idx].date.slice(5) };
  });

  return { width, height, plot, strategy: path('value'), benchmark: path('benchmark'), yTicks, xTicks, min, max };
}

/* ------------------------------------------------------------------ */
/* squarified treemap (Bruls, Huizing & van Wijk 2000)                  */
/* ------------------------------------------------------------------ */

export interface TreeRect<T> {
  item: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

function worstRatio(row: number[], length: number, scale: number): number {
  if (row.length === 0 || length === 0) return Infinity;
  const sum = row.reduce((a, b) => a + b, 0) * scale;
  const max = Math.max(...row) * scale;
  const min = Math.min(...row) * scale;
  const l2 = length * length;
  const s2 = sum * sum;
  return Math.max((l2 * max) / s2, s2 / (l2 * min));
}

/**
 * Lays out `items` (sorted descending by value internally) into `box`,
 * producing rectangles whose areas are proportional to value and whose aspect
 * ratios are as close to 1 as the algorithm can manage.
 */
export function squarify<T>(items: T[], valueOf: (t: T) => number, box: Box): TreeRect<T>[] {
  const entries = items
    .map((item) => ({ item, value: Math.max(valueOf(item), 0) }))
    .filter((e) => e.value > 0)
    .sort((a, b) => b.value - a.value);
  if (entries.length === 0) return [];

  const total = entries.reduce((a, e) => a + e.value, 0);
  const scale = (box.w * box.h) / total;
  const out: TreeRect<T>[] = [];

  let free: Box = { ...box };
  let row: typeof entries = [];
  let i = 0;

  const shortSide = () => Math.min(free.w, free.h);

  const layoutRow = () => {
    const rowSum = row.reduce((a, e) => a + e.value, 0) * scale;
    const side = shortSide();
    const thickness = rowSum / side;
    let offset = 0;
    const horizontal = free.w >= free.h;
    for (const e of row) {
      const len = (e.value * scale) / thickness;
      out.push(
        horizontal
          ? { item: e.item, x: free.x, y: free.y + offset, w: thickness, h: len }
          : { item: e.item, x: free.x + offset, y: free.y, w: len, h: thickness },
      );
      offset += len;
    }
    if (horizontal) {
      free = { x: free.x + thickness, y: free.y, w: free.w - thickness, h: free.h };
    } else {
      free = { x: free.x, y: free.y + thickness, w: free.w, h: free.h - thickness };
    }
    row = [];
  };

  while (i < entries.length) {
    const candidate = [...row, entries[i]];
    const side = shortSide();
    const currentWorst = worstRatio(row.map((e) => e.value), side, scale);
    const candidateWorst = worstRatio(candidate.map((e) => e.value), side, scale);
    if (row.length === 0 || candidateWorst <= currentWorst) {
      row = candidate;
      i++;
    } else {
      layoutRow();
    }
  }
  if (row.length) layoutRow();

  return out.map((r) => ({
    ...r,
    x: Number(r.x.toFixed(2)),
    y: Number(r.y.toFixed(2)),
    w: Number(Math.max(r.w, 0).toFixed(2)),
    h: Number(Math.max(r.h, 0).toFixed(2)),
  }));
}

/* ------------------------------------------------------------------ */
/* diverging colour scale + automatic text contrast                     */
/* ------------------------------------------------------------------ */

type RGB = [number, number, number];

const NEG: RGB = [154, 32, 22];
const MID: RGB = [128, 132, 140];
const POS: RGB = [10, 100, 58];

function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function toHex([r, g, b]: RGB): string {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function luminance([r, g, b]: RGB): number {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(fg: RGB, bg: RGB): number {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Diverging red→neutral→green fill for a signed return, plus a text colour
 * chosen by measuring contrast against that exact fill — so treemap labels are
 * guaranteed readable regardless of where the value lands on the scale.
 */
export function divergingFill(value: number, domain: number): { fill: string; text: string; ratio: number } {
  const t = Math.max(-1, Math.min(1, domain === 0 ? 0 : value / domain));
  const rgb = t >= 0 ? mix(MID, POS, t) : mix(MID, NEG, -t);
  const white: RGB = [255, 255, 255];
  const black: RGB = [15, 23, 32];
  const cw = contrast(white, rgb);
  const cb = contrast(black, rgb);
  return cw >= cb
    ? { fill: toHex(rgb), text: toHex(white), ratio: cw }
    : { fill: toHex(rgb), text: toHex(black), ratio: cb };
}

/** Legend swatches for the treemap scale. */
export function divergingLegend(domain: number, steps = 7) {
  return Array.from({ length: steps }, (_, i) => {
    const t = (i / (steps - 1)) * 2 - 1;
    const value = t * domain;
    return { value, ...divergingFill(value, domain) };
  });
}
