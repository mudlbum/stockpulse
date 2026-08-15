import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  correlation, mad, median, normalizeBySector, normalizeFactor, percentileRank,
  quantile, ramp, robustZ, toDisplayScore, weightedScore, winsorize,
} from '../scripts/lib/stats.mjs';

test('null survives every transform as null, never as 0', () => {
  const v = [1, 2, null, 4, 5, undefined, NaN, 7];
  const z = normalizeFactor(v);
  assert.equal(z[2], null);
  assert.equal(z[5], null);
  assert.equal(z[6], null);
  assert.notEqual(z[0], null);
});

test('robustZ is not distorted by an extreme outlier', () => {
  // This is the whole reason for MAD over SD. With mean/SD, the 10000 inflates
  // the scale and squashes everyone else toward zero.
  const normal = [10, 11, 12, 13, 14, 15, 16];
  const withOutlier = [...normal, 10000];
  const zA = robustZ(normal);
  const zB = robustZ(withOutlier);
  for (let i = 0; i < normal.length; i++) {
    assert.ok(Math.abs(zA[i] - zB[i]) < 0.35, `index ${i}: ${zA[i]} vs ${zB[i]}`);
  }
});

test('robustZ clips to +/-3', () => {
  const z = robustZ([1, 2, 3, 4, 5, 1000]);
  assert.ok(Math.max(...z) <= 3);
  assert.ok(Math.min(...z) >= -3);
});

test('robustZ falls back to SD when MAD is zero, and to 0 when both are', () => {
  // More than half the population shares a value -> MAD is 0.
  const z = robustZ([5, 5, 5, 5, 9]);
  assert.ok(Number.isFinite(z[4]));
  assert.ok(z[4] > z[0]);

  const flat = robustZ([7, 7, 7, 7]);
  assert.deepEqual(flat, [0, 0, 0, 0]);
});

test('winsorize clamps tails but preserves order', () => {
  const v = Array.from({ length: 100 }, (_, i) => i);
  const w = winsorize(v, 0.02);
  assert.ok(Math.min(...w) >= 1.9);
  assert.ok(Math.max(...w) <= 98.1);
  for (let i = 1; i < w.length; i++) assert.ok(w[i] >= w[i - 1]);
});

test('percentileRank splits ties rather than dumping them at the bottom', () => {
  // Half the universe shares one value: without tie handling the whole clump
  // maps to 0, which would misrepresent a common factor value as worst-in-class.
  const v = [0, 0, 0, 0, 1, 2, 3, 4];
  const p = percentileRank(v, 0);
  assert.ok(p > 0.2 && p < 0.3, `expected mid-clump, got ${p}`);
});

test('quantile interpolates', () => {
  assert.equal(quantile([1, 2, 3, 4], 0.5), 2.5);
  assert.equal(quantile([10], 0.9), 10);
  assert.equal(quantile([], 0.5), null);
});

test('median and mad basics', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
  assert.equal(mad([1, 2, 3, 4, 5]), 1);
});

test('weightedScore renormalizes over present factors', () => {
  const weights = { a: 0.5, b: 0.3, c: 0.2 };
  const full = weightedScore({ a: 1, b: 1, c: 1 }, weights, 2);
  assert.ok(Math.abs(full.score - 1) < 1e-9);

  // Missing c: weight redistributed 0.5/0.3 -> 0.625/0.375, not treated as 0.
  const partial = weightedScore({ a: 2, b: 0, c: null }, weights, 2);
  assert.ok(Math.abs(partial.score - 1.25) < 1e-9, `got ${partial.score}`);
  assert.ok(Math.abs(partial.completeness - 2 / 3) < 1e-9);
});

test('weightedScore returns null below the completeness gate', () => {
  const weights = { a: 0.5, b: 0.3, c: 0.2 };
  const r = weightedScore({ a: 1, b: null, c: null }, weights, 2);
  assert.equal(r.score, null);
});

test('sector-neutral normalization scores within sector, not across', () => {
  // Software margins are structurally higher than grocery margins. Sector-neutral
  // z must rank the best grocer highly even though its raw margin is the lowest
  // number in the universe.
  const values = [0.80, 0.78, 0.76, 0.74, 0.72, 0.70, 0.68, 0.66,   // software
                  0.30, 0.14, 0.13, 0.12, 0.11, 0.10, 0.09, 0.08];  // grocery
  const sectors = [...Array(8).fill('Software'), ...Array(8).fill('Grocery')];
  const z = normalizeBySector(values, sectors);
  assert.ok(z[8] > z[0], 'best grocer should out-z a mid software name');
  assert.ok(z[8] > 1.5, `best grocer z should be strongly positive, got ${z[8]}`);
});

test('sector-neutral pools sectors below the minimum group size', () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const sectors = [...Array(8).fill('Big'), 'Tiny', 'Tiny'];
  const z = normalizeBySector(values, sectors, { minGroup: 8 });
  // The 2-member sector must still get a finite score via the pooled bucket.
  assert.ok(Number.isFinite(z[8]));
  assert.ok(Number.isFinite(z[9]));
});

test('ramp converts a hard threshold into a slope', () => {
  // 11.5% growth must score just below 12.1%, not be deleted.
  const a = ramp(0.115, 0.12);
  const b = ramp(0.121, 0.12);
  assert.ok(a < b);
  assert.ok(a > 0.9);
  assert.equal(ramp(0.5, 0.12), 2); // capped
  assert.equal(ramp(-0.1, 0.12), 0); // floored
});

test('toDisplayScore maps z onto 0-100 with 0 at the midpoint', () => {
  assert.equal(toDisplayScore(0), 50);
  assert.ok(toDisplayScore(3) > 99);
  assert.ok(toDisplayScore(-3) < 1);
  assert.equal(toDisplayScore(null), null);
});

test('correlation returns null on insufficient overlap', () => {
  assert.equal(correlation([1, 2, 3], [1, 2, 3]), null);
  const a = Array.from({ length: 30 }, (_, i) => i);
  assert.ok(Math.abs(correlation(a, a) - 1) < 1e-9);
  assert.ok(Math.abs(correlation(a, a.map((x) => -x)) + 1) < 1e-9);
});
