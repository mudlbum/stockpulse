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
- **[`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md)** — every placeholder
  that must be replaced before going live, and every compliance step, in order.
  Read it before deploying and before applying to AdSense.

---

## Quick start

```bash
npm install

# Offline: seed fixtures, run the real pipeline, validate the output (~2s)
npm run smoke

# Unit tests (135)
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
5. Optional but high value: set the repository **secret** `DART_KEY` to a free
   [OpenDART](https://opendart.fss.or.kr) key. Without it Korea has one working
   board; with it, four.

After that `refresh.yml` keeps it current on a schedule.

**Before launch, replace `hello@example.com`** in `src/config.ts`.

---

## Schedule

GitHub Actions cron is UTC and free-tier runs are routinely delayed 10–60
minutes, so nothing depends on an exact minute.

| UTC | Local | Job |
| --- | --- | --- |
| 21:35 Mon–Fri | 17:35 ET | US post-close: refresh, rank, evaluate |
| 22:20 Mon–Fri | 18:20 ET | Market brief — generated and **published** to the blog |
| 07:10 Mon–Fri | 16:10 KST | KR post-close: refresh, rank, evaluate |
| 07:55 Mon–Fri | 16:55 KST | Market brief — Korean |
| every 4h | — | news only, then re-rank |

The brief auto-publishes. It is capped at one per market per day, writes nothing
on a day with fewer than six corroborated facts, carries
`reviewStatus: auto-published` with **no** reviewer name, and is gated on the
build and the output audit before it is committed. Set the repository variable
`BRIEF_AUTOPUBLISH=false` to fall back to opening review PRs instead — no code
change. See `docs/ADSENSE_READINESS.md` for why that switch exists.

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
    sic.mjs          SEC SIC code → sector, for the eleven SPDR buckets
    dart.mjs         DART account mapping onto the same factor vocabulary
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
- **A missing sector is `null`, and `null` is not a sector.** Coercing it to
  `'Unknown'` puts the entire unclassified universe in one bucket, and every
  count-based rule downstream then treats that bucket as a real peer group. It
  cost a live deploy: with no US sector data, the diversification cap saw one
  enormous sector, allowed four of it, and published **4 names per board instead
  of 10** — no error, no warning, just a short list. Unclassified names are
  exempt from the sector cap and normalized against the whole universe.
- **A rate limiter that reserves its slot *after* awaiting does not limit
  anything.** Four `mapLimit` workers read the same last-send time, sleep the
  same duration and fire together. Reserve before you await. This one was live:
  148 HTTP 429s from SEC and zero fundamentals updated for a day.
- **The `import.meta.url === \`file://${process.argv[1]}\`` idiom is broken on
  Windows.** argv[1] uses backslashes and no leading slash; `import.meta.url`
  uses forward slashes and three. The comparison is always false, so `main()`
  never runs and the script exits 0 having printed nothing — `npm run rank`
  looked like a clean no-op. Six scripts had it. Compare against
  `pathToFileURL(process.argv[1]).href`.
- **`new URL(...).pathname` is not a filesystem path on Windows.** It yields
  `/C:/Users/...`, and `path.resolve` makes that `C:\C:\Users\...` — the drive
  letter twice. Use `fileURLToPath`. CI runs on Linux, so this only ever breaks
  the maintainer's own machine, which is where the verification scripts most
  need to run.
- **DART's `corpCode.xml` is a ZIP, and often a *streamed* one** — bit 3 set,
  local header sizes zeroed, real sizes trailing the data. Read the central
  directory; a local-header reader inflates nothing and returns no companies,
  which is indistinguishable from the API having no data for you.
- **DART's cash flow statement closes with 현금및현금성자산**, the same line
  name the balance sheet uses. Match on the statement division too, or the
  balance-sheet cash figure quietly becomes the year-end cash total.
- **`companyfacts` has no SIC code.** Only the SEC `submissions` endpoint does.
  Getting a filer's industry costs a separate 160KB request, which is why
  profiles are cached permanently in the store instead of refetched.
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
- **`git diff` does not see untracked files.** A generated post is always a NEW
  file, so `git diff --quiet -- src/content/posts` asked "did an existing post
  change?" — permanently no. Five scheduled brief runs went green printing "no
  brief written, a thin day" while two briefs with 12 and 9 verifiable facts sat
  untracked in the working tree. Stage first, then `git diff --cached`.
- **Headline similarity cannot tell "same story" from "same template".** Wire
  services publish `<COMPANY> (<TICKER>) Q2 2026 Earnings Call Transcript`
  hundreds of times a quarter; the template words dominate the token set. That
  merged 62 unrelated companies into one cluster which then ranked as the day's
  best-corroborated story. Two items that both name companies may only cluster
  if they name a company in common, and a cluster's tickers are the
  INTERSECTION of its members' — union let a Duolingo headline claim it moved
  Apple.
- **A workflow that dispatches another workflow needs `actions: write`.**
  `contents: write` is not enough; the dispatch returns 403 "Resource not
  accessible by integration". Ours ended in `|| true`, so the refresh committed
  fresh rankings, went green, and never rebuilt the site. A green pipeline and a
  frozen site is worse than a red one — never swallow the failure of the step
  whose whole job is making the update visible.
- **`new URL('/x', origin)` discards the base path** — use `absolute()` from
  `src/lib/paths.ts` for anything crawler-facing.
- **Viewport media queries cannot see a narrow container**, which is how a
  `nowrap` cell silently overflowed and clipped a whole column.

---

## Testing

| Command | Covers |
| --- | --- |
| `npm test` | 135 unit tests: statistics, indicators, factors, scoring, hysteresis, parsers, sentiment, clustering, SIC→sector |
| `npm run smoke` | 2,241 end-to-end checks against the real pipeline |
| `npm run audit` | built output: base paths, SEO, a11y, links, compliance notices |
| `npm run contrast` | WCAG AA on 88 colour pairs in both themes |
| `npm run check:layout` | 112 table regions × 8 viewport widths, no clipping |
| `npm run verify:dart` | **Korean boards, end to end from DART-shaped statements** — proves the adapter's output is a shape the factor models actually score |
| `npm run simulate` | **25 sessions of the real pipeline**, replayed day by day — hysteresis, rank movement, turnover, stop-outs, cooldowns, ledger growth and idempotency |

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
4. **Korea has no *keyless* statement source at all** — not merely a shallower
   one. Unkeyed, only the ultra-short board can be produced; mid, long and
   ultra-long stay empty and each says exactly why, in both languages. Setting
   the `DART_KEY` secret to a free OpenDART key opens all four. See
   METHODOLOGY §1.2 and §10.4.
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
