---
title: "What Relative Volume Measures, and Why It Uses the Median"
description: "Relative volume compares today's turnover to a normal day. The definition of normal decides the answer. Using the mean lets one earnings spike three weeks ago hide today's activity — here is the arithmetic, and what RVOL cannot tell you."
lang: en
translationKey: "relative-volume"
publishedAt: 2026-06-18
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §3.3 — RelativeVolume"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Karpoff (1987), The Relation Between Price Changes and Trading Volume: A Survey, JFQA 22(1)"
    url: "https://www.jstor.org/stable/2330874"
category: education
tags: ["relative-volume", "rvol", "ultra-short", "liquidity"]
tickers: []
draft: false
featured: false
---

Relative volume is the largest single input to the [ultra-short board](/methodology/), at a weight of 0.30. It is also the factor most often quoted with the least attention to how it was computed. The whole content of the number sits in one decision — what counts as a normal day — and the two obvious ways of answering that give materially different answers.

## The definition StockPulse uses

```
RVOL = today_volume / median(volume over the 30 sessions before today)
```

Three details in that line matter more than they look.

**The denominator excludes today.** The implementation takes the 30 bars immediately preceding the current one. If today were included in its own baseline, a genuinely enormous day would partially raise the bar it is being measured against, damping exactly the reading the factor exists to detect.

**It is the median, not the mean.** This is the substantive choice and the next section is about it.

**Below 1.2, the factor scores `null` rather than a low number.** An RVOL of 0.8 is not "slightly bad activity" — it means there is no unusual activity to measure, so the factor has nothing to say about that stock today. Scoring it `null` sends it to the completeness gate rather than into the weighted sum. A stock missing more than one of its five ultra-short inputs is not ranked at all.

## Median versus mean, with numbers

Take a stock that trades about 1.0 million shares on an ordinary day. Three weeks ago it reported earnings and traded 12 million. Today it trades 2.4 million on no obvious news.

Baseline by mean over 30 sessions: 29 ordinary days at 1.0M plus one at 12M gives `(29 + 12) / 30 = 1.37M`. Today's RVOL is `2.4 / 1.37 = 1.75`.

Baseline by median: the 30 sorted values have 1.0M in the middle regardless of the spike, so the baseline is 1.0M and today's RVOL is `2.4 / 1.0 = 2.40`.

The gap is not cosmetic. Under the mean baseline this stock reads as moderately active. Under the median baseline it reads as trading at more than twice its normal rate. The second is what a person watching the tape would say, and the first is an artefact of a single unrelated day that has not been normal since it happened.

The effect compounds in the wrong direction, too. The stocks most likely to have a volume spike inside the trailing window are precisely the stocks that have recently had news — and those are the ones whose *next* burst of activity you most want to detect. A mean baseline systematically desensitises the factor for the population it matters most for.

## What happens to the number afterwards

Raw RVOL never reaches the score. It goes through the [standard four-step normalization](/blog/why-weighted-sums-fail/): winsorized at the 2nd and 98th percentile of the day's universe, log-transformed because ratios bounded below by zero are right-skewed, then z-scored against the whole market universe using the median and MAD, then clipped to ±3.

Relative volume is one of the technical factors, which means its peer group is the entire universe rather than the sector. That is a deliberate asymmetry: unusual volume is unusual volume regardless of industry, whereas a 42% gross margin only means something [once you know the sector](/blog/sector-neutral-scoring/).

The log step is doing more here than statistical tidiness. Without it, the difference between RVOL 1.5 and 3.0 and the difference between RVOL 20 and 21.5 are treated as the same distance. On a log scale, the first is a doubling and the second is a rounding error — which is how a person reads them.

## The reason volume gets 0.30 and not more

Volume is the most reliable *evidence of attention* available in end-of-day data. It is not evidence of direction. A stock trading at 4× normal volume while closing on its lows is having exactly as unusual a day as one closing on its highs, and RVOL cannot distinguish them.

That is why the ultra-short model pairs it with four other measurements rather than leaning on it. Gap quality multiplies by where the close sat inside the day's range, so a gap that was sold into all day scores differently from one that held. Trend position asks whether the underlying trend agrees. The crowding penalty subtracts from names that have already extended more than 2.5 ATRs above their 20-day EMA, because heavy volume in an already-stretched name is frequently the last buyer rather than the first.

A high RVOL on its own is a statement that something happened. What happened is a separate question and volume does not answer it.

## Where the number lies to you

An honest list of the ways this factor misfires, all of which are live in the published data:

**Index and rebalance mechanics.** Quarterly index rebalances, additions and deletions produce enormous closing volume that has nothing to do with any view about the business. The pipeline does not currently detect or flag index events, so those days pass through as genuine relative-volume readings.

**Corporate actions.** The universe filters exclude stocks with a split or spin effective in the last five sessions and ADR ratio changes in the last twenty, precisely because these corrupt volume and every price ratio simultaneously. Filters catch the documented cases; they do not catch everything.

**Low float and small denominators.** The liquidity floor — median 20-day dollar volume of at least \$5,000,000 in the US, ₩2,000M in Korea — exists because small denominators mechanically produce large ratios. Without it, the top of every volume-based list is illiquid microcap noise. With it, the list is [large-cap biased by construction](/methodology/), which is a real cost of the filter and is listed in the methodology's known limitations.

**Half sessions and holidays.** A shortened trading session produces a low volume figure that lands in the baseline as though it were a normal day, and any *following* day then reads slightly hot. Thirty sessions of median makes this small, but it is not zero.

**Korean limit moves.** A KRX stock that closes at the ±30% daily limit has a censored price and frequently a distorted volume profile. Those names are [excluded from that day's ultra-short ranking](/methodology/) rather than ranked on a price the market did not finish discovering.

**End-of-day only.** The site has no intraday data. RVOL here is a completed-session figure, published after the close, and actionable at the next open at the earliest. That constraint runs through the whole design and is reflected in how the [performance audit fills positions](/blog/honest-performance-audit/).

## Reading an RVOL number sensibly

A practical way to hold it: relative volume tells you where to *look*, not what to conclude. An RVOL of 3 means roughly three times the usual number of shares changed hands, which means the day contained something — a disclosure, a broker action, a sector move, an index event, or a rumour. The factor cannot tell you which, and it deliberately does not try. That is the job of the other four inputs and, more importantly, of reading about the company.

The site publishes the raw factor value alongside its z-score on every row for this reason. A z of +2.2 sourced from an RVOL of 2.6 in a quiet market and a z of +2.2 sourced from an RVOL of 9 in a violent one are different situations wearing the same badge, and only the raw number distinguishes them.

---

*Related: [why raw indicators cannot be added together](/blog/why-weighted-sums-fail/), [how ATR sets the stop that goes with a volume-driven entry](/blog/atr-stops/), and [what happens to short-horizon momentum when the whole tape is below its 200-day average](/blog/market-regime/).*
