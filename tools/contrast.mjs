/**
 * WCAG contrast verifier for the StockPulse palette.
 * Not part of the site build — a development aid. Run: node tools/contrast.mjs
 */

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0), f(8), f(4)].map((v) => Math.round(v * 255));
}

function relLuminance([r, g, b]) {
  const lin = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

export function ratio(a, b) {
  const la = relLuminance(typeof a === 'string' ? hexToRgb(a) : a);
  const lb = relLuminance(typeof b === 'string' ? hexToRgb(b) : b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

const PAIRS = [];
const add = (theme, label, fg, bg, min = 4.5) => PAIRS.push({ theme, label, fg, bg, min });

/* ---------------- LIGHT ---------------- */
const L = {
  bg: '#ffffff',
  surface: '#f5f7fa',
  surface2: '#e9edf3',
  text: '#0f1720',
  muted: '#59626f',
  border: '#ccd4de',
  borderStrong: '#6f7c8c',
  focus: '#1a4fd6',
  up: '#0a6c3d',
  down: '#b3261e',
  warnBg: '#fff4d6',
  warnText: '#6b4700',
  dangerBg: '#fde7e5',
  dangerText: '#8c1d16',
  okBg: '#dff3e6',
  okText: '#0a5c34',
  chipBg: '#e9edf3',
  chipText: '#33404f',
  link: '#1a4fd6',
};
for (const bg of ['bg', 'surface', 'surface2']) {
  add('light', `text on ${bg}`, L.text, L[bg]);
  add('light', `muted on ${bg}`, L.muted, L[bg]);
  add('light', `up on ${bg}`, L.up, L[bg]);
  add('light', `down on ${bg}`, L.down, L[bg]);
  add('light', `link on ${bg}`, L.link, L[bg]);
}
add('light', 'warn text on warn bg', L.warnText, L.warnBg);
add('light', 'chip-onwarn: warn bg text on warn text fill', L.warnBg, L.warnText);
add('light', 'warn text on page bg', L.warnText, L.bg);
add('light', 'danger text on danger bg', L.dangerText, L.dangerBg);
add('light', 'ok text on ok bg', L.okText, L.okBg);
add('light', 'chip text on chip bg', L.chipText, L.chipBg);
add('light', 'strong border vs bg (UI 3:1)', L.borderStrong, L.bg, 3);
add('light', 'strong border vs surface (UI 3:1)', L.borderStrong, L.surface, 3);
add('light', 'focus ring vs bg (UI 3:1)', L.focus, L.bg, 3);
add('light', 'muted on warn bg', L.warnText, L.warnBg);
add('light', 'text on code bg', L.text, L.surface2);

/* horizon accents, light-mode ink */
const ACCENT_INK_LIGHT = {
  ultra_short: '#1d43c4',
  mid_term: '#0a6a60',
  long_term: '#046c4c',
  ultra_long: '#334155',
};
for (const [k, v] of Object.entries(ACCENT_INK_LIGHT)) {
  add('light', `accent ink ${k} on bg`, v, L.bg);
  add('light', `accent ink ${k} on surface`, v, L.surface);
  add('light', `accent ink ${k} on surface2`, v, L.surface2);
}
/* accent used as a filled tab: white text on raw accent */
const ACCENT_RAW = {
  ultra_short: '#2563ff',
  mid_term: '#0d9488',
  long_term: '#059669',
  ultra_long: '#334155',
};

/* ---------------- DARK ---------------- */
const D = {
  bg: '#0d1117',
  surface: '#161c25',
  surface2: '#1f2733',
  text: '#e7edf4',
  muted: '#a3b1c2',
  border: '#2b3644',
  borderStrong: '#7c8da0',
  focus: '#79a8ff',
  up: '#43d18a',
  down: '#ff8079',
  warnBg: '#3a2c08',
  warnText: '#f5cf6b',
  dangerBg: '#42191a',
  dangerText: '#ff9a92',
  okBg: '#0e2f20',
  okText: '#5fdca0',
  chipBg: '#232c38',
  chipText: '#c3cedb',
  link: '#79a8ff',
};
for (const bg of ['bg', 'surface', 'surface2']) {
  add('dark', `text on ${bg}`, D.text, D[bg]);
  add('dark', `muted on ${bg}`, D.muted, D[bg]);
  add('dark', `up on ${bg}`, D.up, D[bg]);
  add('dark', `down on ${bg}`, D.down, D[bg]);
  add('dark', `link on ${bg}`, D.link, D[bg]);
}
add('dark', 'warn text on warn bg', D.warnText, D.warnBg);
add('dark', 'chip-onwarn: warn bg text on warn text fill', D.warnBg, D.warnText);
add('dark', 'warn text on page bg', D.warnText, D.bg);
add('dark', 'danger text on danger bg', D.dangerText, D.dangerBg);
add('dark', 'ok text on ok bg', D.okText, D.okBg);
add('dark', 'chip text on chip bg', D.chipText, D.chipBg);
add('dark', 'strong border vs bg (UI 3:1)', D.borderStrong, D.bg, 3);
add('dark', 'strong border vs surface (UI 3:1)', D.borderStrong, D.surface, 3);
add('dark', 'focus ring vs bg (UI 3:1)', D.focus, D.bg, 3);
add('dark', 'muted on warn bg', D.warnText, D.warnBg);
add('dark', 'text on code bg', D.text, D.surface2);

const ACCENT_INK_DARK = {
  ultra_short: '#8fb0ff',
  mid_term: '#3fd9c4',
  long_term: '#41d9a1',
  ultra_long: '#a8b6c6',
};
for (const [k, v] of Object.entries(ACCENT_INK_DARK)) {
  add('dark', `accent ink ${k} on bg`, v, D.bg);
  add('dark', `accent ink ${k} on surface`, v, D.surface);
  add('dark', `accent ink ${k} on surface2`, v, D.surface2);
}

/* Filled active tab. In light mode the RAW accents (#0d9488, #059669) are too
   light to carry white text, so the filled state uses the darker "ink" variant
   as its background and the raw accent only as a 3px identity underline. */
for (const [k, v] of Object.entries(ACCENT_INK_LIGHT)) {
  add('light', `#fff on filled tab ${k}`, '#ffffff', v);
}
for (const [k, v] of Object.entries(ACCENT_RAW)) {
  add('light', `raw accent underline ${k} vs bg (UI 3:1)`, v, L.bg, 3);
}
const ACCENT_RAW_DARK = {
  ultra_short: '#5b8cff',
  mid_term: '#2dd4bf',
  long_term: '#34d399',
  ultra_long: '#94a3b8',
};
for (const [k, v] of Object.entries(ACCENT_RAW_DARK)) {
  add('dark', `#0d1117 on filled tab ${k}`, '#0d1117', v);
}

/* ---------------- monogram tiles (deterministic hue) ---------------- */
function monoSweep(sat, light, tsat, tlight, bgLabel) {
  let worst = Infinity;
  let worstH = 0;
  for (let h = 0; h < 360; h++) {
    const r = ratio(hslToRgb(h, tsat, tlight), hslToRgb(h, sat, light));
    if (r < worst) {
      worst = r;
      worstH = h;
    }
  }
  return { worst, worstH, bgLabel };
}

const results = PAIRS.map((p) => ({ ...p, r: ratio(p.fg, p.bg) }));
let fails = 0;
const width = Math.max(...results.map((r) => r.label.length));
for (const r of results) {
  const ok = r.r >= r.min;
  if (!ok) fails++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${r.theme.padEnd(5)}  ${r.label.padEnd(width)}  ${r.fg} on ${r.bg}  ${r.r.toFixed(2)}:1  (min ${r.min})`,
  );
}

const monoLight = monoSweep(62, 91, 72, 26);
const monoDark = monoSweep(30, 22, 65, 78);
console.log(
  `\nmonogram light  worst ${monoLight.worst.toFixed(2)}:1 at hue ${monoLight.worstH}  ${monoLight.worst >= 4.5 ? 'PASS' : 'FAIL'}`,
);
console.log(
  `monogram dark   worst ${monoDark.worst.toFixed(2)}:1 at hue ${monoDark.worstH}  ${monoDark.worst >= 4.5 ? 'PASS' : 'FAIL'}`,
);
if (monoLight.worst < 4.5) fails++;
if (monoDark.worst < 4.5) fails++;

console.log(`\n${fails === 0 ? 'ALL PASS' : fails + ' FAILURES'} — ${results.length} pairs + 2 hue sweeps`);
process.exit(fails === 0 ? 0 : 1);
