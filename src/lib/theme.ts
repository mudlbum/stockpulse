import { HORIZONS, type HorizonId } from '../config';

/**
 * The horizon accents in config.ts identify a tab. Two of them (#0d9488,
 * #059669) are too light to carry white text on a light background — measured
 * at 3.74:1 and 3.77:1, below the 4.5:1 AA threshold. So each horizon also gets
 * an "ink" variant: the colour used whenever the accent has to be *text*, or
 * has to be a *filled* background behind text.
 *
 * Every value here is verified by tools/contrast.mjs. Change one, re-run it.
 */
export const HORIZON_INK: Record<HorizonId, { light: string; dark: string }> = {
  ultra_short: { light: '#1d43c4', dark: '#8fb0ff' },
  mid_term: { light: '#0a6a60', dark: '#3fd9c4' },
  long_term: { light: '#046c4c', dark: '#41d9a1' },
  ultra_long: { light: '#334155', dark: '#a8b6c6' },
};

/** CSS custom properties consumed by .horizon-scope in global.css. */
export function horizonVars(id: HorizonId): string {
  const h = HORIZONS.find((x) => x.id === id)!;
  const ink = HORIZON_INK[id];
  return [
    `--accent:${h.accent}`,
    `--accent-dark:${h.accentDark}`,
    `--accent-ink:${ink.light}`,
    `--accent-ink-dark:${ink.dark}`,
  ].join(';');
}
