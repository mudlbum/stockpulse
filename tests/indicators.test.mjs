import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  atr, atrSeries, bollinger, chaikinMoneyFlow, closePosition, ema, medianDollarVolume,
  overnightGap, rangePosition, relativeVolume, returnOver, rsi, sma, slope,
} from '../scripts/lib/indicators.mjs';
import { makeBars } from './fixtures/generate.mjs';

const flat = (n, price = 100, volume = 1000) =>
  Array.from({ length: n }, (_, i) => ({
    date: `2026-01-${String((i % 28) + 1).padStart(2, '0')}`,
    open: price, high: price, low: price, close: price, volume,
  }));

test('sma and ema require enough history and return null otherwise', () => {
  assert.equal(sma([1, 2], 5), null);
  assert.equal(ema([1, 2, 3], 20), null);
  // EMA deliberately requires 3x the period so the SMA seed's weight decays
  // below ~5%; a value returned at exactly `period` bars is really an SMA.
  assert.equal(ema(Array(59).fill(10), 20), null);
  assert.ok(Number.isFinite(ema(Array(60).fill(10), 20)));
});

test('ema of a constant series equals the constant', () => {
  assert.ok(Math.abs(ema(Array(100).fill(42), 20) - 42) < 1e-9);
});

test('ATR uses Wilder smoothing, not the EMA constant', () => {
  // A constant-range series must give ATR exactly equal to that range. With the
  // EMA constant 2/(n+1) the warm-up would leave a residual.
  const bars = Array.from({ length: 60 }, (_, i) => ({
    date: `d${i}`, open: 100, high: 102, low: 98, close: 100, volume: 1,
  }));
  const a = atr(bars, 14);
  assert.ok(Math.abs(a - 4) < 1e-9, `expected 4, got ${a}`);
});

test('ATR returns null without enough bars', () => {
  assert.equal(atr(flat(10), 14), null);
  assert.equal(atrSeries(flat(10), 14).filter(Number.isFinite).length, 0);
});

test('relativeVolume uses the median of prior sessions, excluding today', () => {
  const bars = flat(40, 100, 1000);
  // One historical spike must NOT raise the denominator — that is the bug the
  // median is there to prevent.
  bars[10].volume = 50_000;
  bars[bars.length - 1].volume = 3000;
  const rv = relativeVolume(bars, 30);
  assert.ok(Math.abs(rv - 3) < 1e-9, `expected 3, got ${rv}`);
});

test('relativeVolume returns null when there is no history', () => {
  assert.equal(relativeVolume(flat(5), 30), null);
});

test('closePosition is 1 on the high, 0 on the low, 0.5 on a zero range', () => {
  assert.equal(closePosition({ high: 10, low: 8, close: 10 }), 1);
  assert.equal(closePosition({ high: 10, low: 8, close: 8 }), 0);
  assert.equal(closePosition({ high: 9, low: 9, close: 9 }), 0.5);
});

test('overnightGap measures prev close to today open', () => {
  const bars = [
    { date: 'a', open: 100, high: 101, low: 99, close: 100, volume: 1 },
    { date: 'b', open: 104, high: 105, low: 103, close: 104, volume: 1 },
  ];
  assert.ok(Math.abs(overnightGap(bars) - 0.04) < 1e-9);
});

test('chaikinMoneyFlow is +1 when every close is on the high', () => {
  const bars = Array.from({ length: 25 }, () => ({
    date: 'd', open: 9, high: 10, low: 8, close: 10, volume: 100,
  }));
  assert.ok(Math.abs(chaikinMoneyFlow(bars, 21) - 1) < 1e-9);
});

test('chaikinMoneyFlow counts a zero-range session as neutral, not as a skip', () => {
  // A halted/limit session cannot inform direction. It must dilute the reading
  // rather than be dropped from the denominator, which would overweight its
  // neighbours.
  const bars = Array.from({ length: 21 }, (_, i) =>
    i === 0
      ? { date: 'h', open: 9, high: 9, low: 9, close: 9, volume: 2100 }
      : { date: 'd', open: 9, high: 10, low: 8, close: 10, volume: 100 });
  const cmf = chaikinMoneyFlow(bars, 21);
  assert.ok(cmf < 1 && cmf > 0.4, `expected diluted positive, got ${cmf}`);
});

test('bollinger bands bracket the mean', () => {
  const bars = makeBars({ n: 60, seed: 7 });
  const bb = bollinger(bars, 20, 2);
  assert.ok(bb.upper > bb.mid && bb.mid > bb.lower);
});

test('rsi is 100 for a monotonic riser and 50 for a flat line', () => {
  const rising = Array.from({ length: 40 }, (_, i) => ({
    date: `d${i}`, open: 100 + i, high: 101 + i, low: 99 + i, close: 100 + i, volume: 1,
  }));
  assert.equal(rsi(rising, 14), 100);
  assert.equal(rsi(flat(40), 14), 50);
});

test('rangePosition is 1 at the high of the window', () => {
  const bars = Array.from({ length: 100 }, (_, i) => ({
    date: `d${i}`, open: 50 + i, high: 50 + i, low: 50 + i, close: 50 + i, volume: 1,
  }));
  assert.ok(Math.abs(rangePosition(bars, 100) - 1) < 1e-9);
});

test('medianDollarVolume multiplies price by volume', () => {
  assert.equal(medianDollarVolume(flat(30, 50, 200), 20), 10_000);
});

test('returnOver and slope', () => {
  const bars = flat(30, 100);
  bars[bars.length - 1].close = 110;
  assert.ok(Math.abs(returnOver(bars, 1) - 0.1) < 1e-9);
  assert.ok(slope([1, 2, 3, 4]) > 0);
  assert.ok(slope([4, 3, 2, 1]) < 0);
  assert.equal(slope([1, 2]), null);
});
