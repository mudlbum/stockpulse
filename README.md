# StockPulse

Bilingual (EN/KO) multi-horizon equity ranking site for the US and Korean
markets. Static Astro site on GitHub Pages, data pipeline on GitHub Actions,
**no API keys and no running cost**.

Four boards, recomputed every session:

| Board | Horizon | What it screens for |
| --- | --- | --- |
| Ultra Short | 1–5 days | Momentum ignition, volatility expansion |
| Mid Term | 1–2 months | Trend alignment, earnings drift, accumulation |
| Long Term | 1–2 years | Growth quality, ROIC, free cash flow, valuation |
| Ultra Long | 5–10 years | Moat durability, cash-flow persistence, reinvestment |

Plus a **public performance audit** of every pick ever published, a
ticker-mapped news feed with sentiment, a sector capital-flow treemap, and a
browser-local portfolio simulator.

> All content is market research and educational information, **not personalized
> financial advice**. Rankings are the mechanical output of a published rule set,
> not predictions. See [`/disclaimer`](src/views/pages/DisclaimerView.astro).

---

## Read these first

- **[`docs/METHODOLOGY.md`](docs/METHODOLOGY.md)** — the complete scoring
  specification. Every number on the site traces back to a rule written down
  here in advance. It is also published on the site at `/methodology`.
- **[`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md)** — every source, why it was
  chosen, and the ones that were rejected with the reasons.

---

## Quick start

```bash
npm install

# Offline: seed fixtures, run the real pipeline, validate the output (~2s)
npm run smoke

# Unit tests (88)
npm test

# Build (both base paths must pass)
SITE_URL=https://you.github.io BASE_PATH=/           npm run build
SITE_URL=https://you.github.io BASE_PATH=/stockpulse/ npm run build

# Post-build audit: base paths, SEO, a11y, broken links, compliance notices
BASE_PATH=/stockpulse/ npm run audit
```

Live data needs network access the pipeline gets in Actions:

```bash
npm run refresh:us      # SEC fundamentals + US prices
npm run refresh:kr      # KRX mirror + Naver history
npm run refresh:news    # RSS ingestion, ticker mapping, clustering
npm run rank            # score all four horizons, both markets
npm run evaluate        # replay the ledger, publish the audit
```

`node scripts/smoke-test.mjs --live` additionally probes the real endpoints —
run it once from Actions to verify sources before trusting a board.

---

## Deploy

1. Create a repo and push this directory.
2. **Settings → Pages → Source: GitHub Actions.**
3. Push to `main`. The deploy workflow bootstraps itself: it detects the shipped
   placeholder data, runs the real pipeline, commits the result, and publishes.
4. Optional: set repository variable `CONTACT_EMAIL` (used in the SEC
   `User-Agent`, which SEC asks for).

After that `refresh.yml` keeps it current on a schedule.

**Before launch, replace `hello@example.com`** in `src/config.ts`.

---

## Schedule

GitHub Actions cron is UTC and free-tier runs are routinely delayed 10–60
minutes, so nothing depends on an exact minute.

| UTC | Local | Job |
| --- | --- | --- |
| 21:35 Mon–Fri | 17:35 ET | US post-close: refresh, rank, evaluate |
| 07:10 Mon–Fri | 16:10 KST | KR post-close: refresh, rank, evaluate |
| every 4h | — | news only, then re-rank |

**Why post-close and not the pre-market schedule you might expect:** there is no
keyless, license-clean source for pre-market or intraday data. The pipeline is
end-of-day, so the honest cadence is to score the session that just finished and
publish for the next one. Every board states its as-of date and says the earliest
actionable point is the next session's open.

---

## Architecture

```
scripts/
  lib/
    stats.mjs        cross-sectional normalization (winsorize → log → robust z)
    indicators.mjs   EMA, Wilder ATR, RSI, Bollinger, CMF, RVOL
    factors.mjs      per-stock raw factors for all four horizons
    derive.mjs       multi-year series: ROIC/FCF history, buyback yield, …
    score.mjs        weighting, gates, regime, diversification, hysteresis
    sentiment.mjs    Loughran–McDonald financial lexicon, EN + KO
    news.mjs         RSS parsing, ticker mapping, catalyst clustering
    sources.mjs      every source adapter, with its traps documented inline
    sectors.mjs      sector aggregation for the treemap
    http.mjs         per-host throttling, retry, health accounting
    store.mjs        the committed data store
  refresh-us.mjs  refresh-kr.mjs  refresh-news.mjs
  build-rankings.mjs   scores and publishes — NO network I/O
  evaluate.mjs         replays the ledger into the public audit
  smoke-test.mjs       end-to-end offline verification
  audit.mjs            post-build checks on dist/

data-store/          the database, committed to git
src/                 Astro site (EN/KO share one set of view components)
```

**`data-store/` is committed on purpose.** Every historical state is publicly
diffable, the performance ledger cannot be quietly rewritten, and the whole site
can be rebuilt from a clone. `build-rankings.mjs` does no network I/O, so
checking out any commit and re-running it reproduces that day's board exactly —
which is what makes the public audit mean anything.

---

## The parts most likely to be got wrong

Recorded here because each cost real debugging time and none is obvious:

- **A missing factor is `null`, never `0`.** Zero is a real z-score meaning
  "exactly typical". Coercing unknowns to zero manufactures rank out of missing
  data.
- **Z-scores use median/MAD, not mean/SD.** One biotech with an RVOL of 400
  would otherwise inflate the scale and squash the entire universe toward zero.
- **Fundamental factors are sector-neutral.** A 42% gross margin is unremarkable
  for software and extraordinary for a grocer.
- **Point-in-time filtering keys on the SEC `filed` date**, not the period end.
- **Diversification must run *during* board assembly, not before it.** Applying
  it first and then running hysteresis over the full ranked list lets hysteresis
  refill the seats it just rejected, and the sector cap silently does nothing.
- **Wilder's ATR uses 1/period smoothing**, not the EMA's `2/(period+1)`. Using
  the EMA constant makes ATR ~2× more responsive than every published reference
  and silently tightens every stop the site prints.
- **Naver's `siseJson` is not valid JSON** — single-quoted header row.
- **The KRX mirror column is spelled `ChagesRatio`.** Misspelled at the source.
- **A single stale headline must shrink toward neutral.** The weighted mean is
  scale-invariant, so without an evidence shrink one 36-hour-old story scores
  identically to a fresh primary filing.
- **`new URL('/x', origin)` discards the base path** — use `absolute()` from
  `src/lib/paths.ts` for anything crawler-facing.
- **Viewport media queries cannot see a narrow container**, which is how a
  `nowrap` cell silently overflowed and clipped a whole column.

---

## Testing

| Command | Covers |
| --- | --- |
| `npm test` | 88 unit tests: statistics, indicators, factors, scoring, hysteresis, parsers, sentiment, clustering |
| `npm run smoke` | 2,240 end-to-end checks against the real pipeline |
| `npm run audit` | built output: base paths, SEO, a11y, links, compliance notices |
| `npm run contrast` | WCAG AA on 88 colour pairs in both themes |
| `npm run check:layout` | 96 table regions × 8 viewport widths, no clipping |

The smoke test is the important one. Because the development sandbox blocks
every finance host, the network fetchers cannot be exercised locally — but
everything downstream of them can, and that is where the logic lives.

---

## Known limitations

Published on the site too, not just here:

1. **End-of-day only.** No pre-market, no intraday, no live prices.
2. **Headline sentiment is a lexicon**, and weakly predictive at best.
3. **No analyst estimates**, so mid-term substitutes realized earnings drift for
   revision momentum.
4. **Korean fundamentals are shallower than US.** The ultra-long board is US-only
   until a DART key is configured.
5. **Weights are reasoned from published literature, not optimized** on this
   data. That avoids overfitting but means they are untuned.
6. **Large-cap biased** by construction of the liquidity filters.
7. **Long-only.** In a bear market the correct answer is often "nothing", and the
   regime multiplier is the only mechanism that expresses it.

---

## Licence and compliance

Code is yours to license. The **content** carries real obligations: publishing
stock recommendations can implicate the US Investment Advisers Act (the
publisher's exclusion under *Lowe v. SEC* is the relevant safe harbour) and, in
Korea, 유사투자자문업 reporting requirements. The site is built to sit on the safe
side of both — impersonal, general circulation, no individualized advice,
prominent disclaimers — but **that is a design posture, not legal advice. Talk to
a lawyer before monetizing.**
