---
title: "Market Regime: Long Momentum in a Downtrend"
description: "A short-horizon momentum screen published into a tape below its 200-day average with deteriorating breadth is the fastest way to lose money. StockPulse scales those scores by a regime multiplier — here is how it is computed and what it cannot do."
seoTitle: "Market Regime and the Score Multiplier"
lang: en
translationKey: "market-regime"
publishedAt: 2026-07-30
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §3.3 — RegimeMultiplier"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Moskowitz, Ooi & Pedersen (2012), Time Series Momentum, Journal of Financial Economics 104(2)"
    url: "https://doi.org/10.1016/j.jfineco.2011.11.003"
category: market-structure
tags: ["regime", "breadth", "momentum", "risk", "200dma"]
tickers: []
draft: false
featured: false
---

The [ultra-short](/blog/relative-volume-median/) and mid-term boards on this site are long-only momentum screens. Run one every day for a decade and the returns will not be evenly distributed across that decade — they will be concentrated in the periods when the whole market was rising and destroyed in the periods when it was not. That is not a defect specific to this rule set; it is a property of long momentum. StockPulse's response is a regime multiplier, and this article covers what it measures, what it changes, and the four things it does not fix.

## Why short-horizon momentum fails together

The failure mode is not that individual entries stop working slightly more often. It is that the diversification stops existing.

In a rising market, a list of ten momentum names is ten roughly independent situations. Some work, some do not, and the aggregate is close to the average outcome. In a falling market, cross-asset correlations rise sharply and those ten positions become one position expressed ten ways. Every stop is hit within the same two sessions, by the same macro event, and the portfolio's realised loss is ten times the individual loss rather than the diversified average.

Three further mechanisms compound it. Realised volatility rises in downtrends, so ATR-based stops are further away in percentage terms but reached more often in practice. Overnight gap risk rises, and a gap goes straight through a stop. And short-horizon momentum entries in a downtrend are frequently bounces — precisely the setup that the trend-position factor exists to score down at the individual-stock level, and precisely what a screen full of "unusual volume today" tends to surface when the tape is falling.

## What is measured

Two inputs, both computable from the price store:

```
index_ok = benchmark close > its own 200-session simple moving average
breadth  = share of the universe with close > its own 200-session SMA
```

The benchmark is SPY for the US board and KOSPI for the Korean one. Breadth requires at least 20 stocks with at least 200 sessions of history to be counted; below that the state is reported as unknown.

Both are deliberately coarse. A 200-day moving average is the most widely watched long-term trend reference there is, which is part of its value — it is not a tuned parameter and its behaviour is well understood.

Breadth is the more informative of the two. An index can sit above its 200-day average while a shrinking number of very large companies carry it, and that configuration has historically been a poor environment for a broad momentum screen even though the index level looks fine. Measuring the share of the *universe* above its own long-term average catches that; measuring the index alone does not.

## The four states

| State | Condition | Multiplier |
| --- | --- | --- |
| `risk_on` | index above 200DMA and breadth ≥ 50% | 1.00 |
| `narrowing` | index above 200DMA and breadth < 50% | 0.85 |
| `caution` | index below 200DMA and breadth ≥ 40% | 0.70 |
| `risk_off` | index below 200DMA and breadth < 40% | 0.50 |
| `unknown` | insufficient history to compute either input | 1.00 |

The multiplier is applied to the **ultra-short and mid-term** scores only. The 1–2 year and 5–10 year boards are unaffected — a thesis about a decade of returns on capital should not be re-rated because the tape is soft this month, and applying a market-timing overlay to a fundamental screen would confuse two separate decisions.

In the two weakest states the site displays a banner recommending reduced position sizing or no new ultra-short entries at all. That is the part of this mechanism that is intended to actually change behaviour.

## What the multiplier does and does not change

This is the most misunderstood part of the design, so it is worth being precise.

Because every candidate on a board is multiplied by the same number, **the ordering of the board does not change**. The stock that ranked first in a risk-on tape ranks first in a risk-off tape. The relative margin between candidates scales too, so the hysteresis rule that requires a challenger to beat an incumbent by more than `0.15 × SD(scores)` behaves identically — the standard deviation is scaled by the same factor.

What changes is the **absolute score displayed**. A raw z-composite of 1.8 shows as roughly 80 on the 0–100 display scale in a risk-on tape and roughly 65 in a caution tape. Same stock, same rank, visibly weaker number, plus a banner explaining why.

That is the intended effect. The multiplier is a **size instruction, not a selection rule**. It communicates "this board is being published into a hostile market" through the only channel that reaches a reader who does not read methodology documents — the number they came for.

There is one place it does change composition: the [performance audit](/blog/honest-performance-audit/) records the regime state with every pick and reports hit rate by regime state, so it becomes visible over time whether the four states actually discriminate. If they do not, that is discoverable from the published data.

## Four things this does not fix

**It is a lagging measurement.** A 200-day moving average is, by construction, slow. The regime flips to `caution` well after the drawdown started and back to `risk_on` well after the recovery started. There is no version of a trend-following regime filter that avoids this; the alternative — a faster filter — trades lateness for whipsaw, and whipsaw around a threshold that gates the whole site's scoring is worse than lateness.

**The thresholds are chosen, not derived.** 50% and 40% breadth, 200 sessions, multipliers of 0.85, 0.70 and 0.50 — none of these is optimised on this data. They are round numbers picked to be defensible in advance. That deliberately avoids fitting the parameters to a particular history, and it also means nobody has demonstrated that 45% would not work better. The methodology's [known limitations](/methodology/) name the multiple-testing problem directly, and this is one of the places it lives.

**`unknown` resolves optimistically.** When the benchmark series is too short or fewer than 20 universe members have 200 sessions of history, the state is `unknown` and the multiplier is 1.00 — the same as a healthy market. That is the wrong direction to fail in. It is a small case in practice, since a data outage large enough to trigger it would usually also trip the [health checks](/methodology/) that stop the pipeline from publishing, but the default should be noted rather than glossed.

**There is no short side.** Every board is long-only. In a genuinely hostile market the correct answer is often "nothing," and the regime multiplier scaling scores toward zero is the only mechanism this site has for expressing that. It is a weak instrument for a strong statement. Scaling a score by 0.5 does not stop the board from publishing ten names, and a reader determined to act on the top of a `risk_off` board can do so. The banner exists for that reason and it is the most useful thing on the page in those conditions.

## Reading a board in a weak regime

A practical framing: in `risk_on`, the boards are doing what they were designed to do and the scores mean what the [normalization](/blog/why-weighted-sums-fail/) says they mean. In `narrowing`, the market's gains are concentrating and a broad momentum screen is fishing in a shrinking pond. In `caution` and `risk_off`, the boards are still computed and still published — because hiding them would be its own kind of dishonesty about what the rule set does — but they are being published into an environment where the historical base rate for this class of strategy is poor, and the site says so at the top of the page rather than in a footnote.

---

*Related: [how the scores being multiplied are constructed](/blog/why-weighted-sums-fail/), [why ATR-based stops behave differently when volatility expands](/blog/atr-stops/), and [how regime state is recorded in the audit](/blog/honest-performance-audit/).*
