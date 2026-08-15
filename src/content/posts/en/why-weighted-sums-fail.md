---
title: "Why a Weighted Sum of Raw Indicators Cannot Rank Stocks"
description: "Relative volume of 2.5 and a sentiment score of 0.4 have different units, different scales and different distributions. Adding them produces a number that means nothing. Here is what StockPulse does instead, with the arithmetic shown."
seoTitle: "Why Weighted Sums of Raw Indicators Fail"
lang: en
translationKey: "cross-sectional-z-scoring"
publishedAt: 2026-06-09
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §2 — factor normalization"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Rousseeuw & Croux (1993), Alternatives to the Median Absolute Deviation, JASA 88(424)"
    url: "https://www.jstor.org/stable/2291267"
  - label: "Harvey, Liu & Zhu (2016), …and the Cross-Section of Expected Returns, Review of Financial Studies 29(1)"
    url: "https://doi.org/10.1093/rfs/hhv059"
category: methodology
tags: ["z-score", "ranking", "normalization", "robust-statistics"]
tickers: []
draft: false
featured: true
---

Almost every public stock screener that combines more than one measurement does it the same way: pick four or five indicators, assign each a percentage weight, multiply, add. The result is a leaderboard. It is also, in a specific and demonstrable sense, arithmetic nonsense. This article explains why, and what StockPulse does in its place — the four-step normalization in [§2 of the methodology](/methodology/), reproduced here with the numbers filled in.

## The problem in one line

Suppose the scoring rule is `0.35 × RVOL + 0.25 × gap + 0.25 × sentiment + 0.15 × ATR breakout`.

Relative volume is a ratio that is 1.0 for a typical day and can reach 400 for a small biotech on trial results. The overnight gap is a fraction, usually between −0.05 and +0.05. Sentiment is bounded to [−1, +1]. The ATR breakout term is measured in ATRs, typically 0 to 2.

Multiply and add those and the weights are decorative. The 0.35 on relative volume is not "35% of the score"; it is 35% of a term whose everyday range is roughly eighty times larger than the sentiment term's. A stock with an RVOL of 40 and terrible news outranks a stock with an RVOL of 2 and excellent news by a margin no amount of tuning the 0.25 will close. The weight you *wrote* and the weight the formula *applies* are different numbers, and nothing in the output tells you so.

This is not a subtle statistical point. It is a units error, the same class of mistake as adding a temperature in Fahrenheit to a distance in kilometres.

## What "cross-sectional" means and why it comes first

A raw indicator value is not a score. It becomes a score only when compared against something. StockPulse compares every factor against **the rest of the universe on that same day** — roughly 1,400 to 1,800 US names after the liquidity filters, and the KOSPI/KOSDAQ universe on the Korean side.

That choice has consequences worth stating. A score of 85 on the ultra-short board does not mean "this stock is good." It means "on this day, against this universe, this stock ranked in the top few percent on this rule set." On a quiet day the market's highest relative-volume score might come from an RVOL of 1.8; after a Federal Reserve meeting it might take an RVOL of 6 to reach the same z. The board ranks what exists today rather than measuring against an absolute standard. [§P5 of the methodology](/methodology/) calls this "screen output, not prediction," and the cross-sectional design is what makes that phrasing accurate rather than merely modest.

## Step 1 — winsorize before you do anything else

The pipeline clips every factor to the 2nd and 98th percentile of that day's universe *before* any transformation. In a 1,500-name universe that caps the 30 most extreme values at each tail.

The reason is that the extremes are usually real and usually useless. A biotech with an RVOL of 400 on binary trial data is not lying — its volume genuinely was 400× normal. But its *magnitude* would own the entire factor. Winsorizing keeps it at the top of the ranking while stopping its distance from everyone else from compressing the rest of the distribution into a single point.

## Step 2 — transform for skew

Ratio factors — relative volume, dollar volume, market capitalisation, volatility expansion — are right-skewed by construction. They have a hard floor at zero and no ceiling. Their arithmetic mean sits somewhere no stock actually is.

Those factors are log-transformed. The implementation uses a signed variant, `sign(x) × ln(1 + |x|)`, which matches the `ln(1 + x)` in the published spec for positive inputs and keeps negative inputs meaningful for factors like margin change that legitimately go below zero.

The order matters and is easy to get backwards: winsorize first, log second. Logging first would compress the outliers so much that the 98th-percentile cap would land somewhere harmless and do nothing.

## Step 3 — z-score, with the median and MAD

This is the step that does the real work:

```
z = (x' − median(x')) / (1.4826 × MAD(x'))
```

where MAD is the median absolute deviation — the median of the absolute distances from the median. The 1.4826 constant rescales MAD so that it estimates the same quantity as a standard deviation under a normal distribution, which keeps the output on the familiar z scale where ±1 is ordinary and ±3 is extreme.

The question people reasonably ask is why not use the mean and standard deviation, which is what "z-score" normally implies. Here is a worked answer.

Take nine stocks with these relative-volume readings:

| Stock | RVOL |
| --- | --- |
| A | 0.9 |
| B | 1.0 |
| C | 1.1 |
| D | 1.2 |
| E | 1.3 |
| F | 1.5 |
| G | 1.8 |
| H | 2.4 |
| I | 40.0 |

Stock I is the biotech. Now compute both versions for **stock H**, whose 2.4× volume is the second-highest reading in the group and a genuinely unusual day.

Classical z-score: the mean is 5.69 and the sample standard deviation is 12.88. So H scores `(2.4 − 5.69) / 12.88 = −0.26`. **Negative.** The second-busiest stock in the universe is scored as below average on volume, because one outlier dragged the mean above almost every observation and inflated the standard deviation until nothing else could register.

Robust z-score: the median is 1.3. The absolute deviations from it are 0.4, 0.3, 0.2, 0.1, 0, 0.2, 0.5, 1.1, 38.7 — whose median is 0.3. The scale is `1.4826 × 0.3 = 0.445`. So H scores `(2.4 − 1.3) / 0.445 = +2.47`, and stock I scores 87 before being clipped to the +3 ceiling.

The robust version says what a person looking at the table would say: H is having an unusually heavy day, I is having an absurd one. The classical version says H is unremarkable. Neither is more "correct" in the abstract; the robust one is correct for this job, because financial cross-sections are full of legitimate outliers and we want the ranking to survive them.

Two implementation details worth knowing. If MAD is exactly zero — which happens when more than half the universe shares an identical value — the code falls back to the standard deviation, and if that is also zero every stock scores 0. That is the honest answer: on that day the factor carries no cross-sectional information. The function also returns nulls if fewer than three stocks have a value, because a z-score over two observations is decoration.

## Step 4 — clip and display

Scores are clipped to [−3, +3] and mapped to the 0–100 display scale with `display = 50 + z × 16.67`. A z of +3 becomes 100, a z of 0 becomes 50, a z of −3 becomes 0.

That mapping is lossy at the ends: everything at or beyond +3 shows as 100. Distinguishing the 3-sigma stock from the 87-sigma one has no decision content — both are "as extreme as this factor gets today."

## Missing data is not zero

The most consequential rule in the whole normalization is the smallest one: a missing factor yields `null`, never `0`.

Zero on a z-scale means "exactly at the median" — a real, informative position. If a stock with no mapped headlines were scored 0 for sentiment, it would be treated as having *precisely average* news, and hundreds of stocks nobody wrote about would be ranked above a stock with mildly negative coverage. Silence is absence of evidence, not neutrality.

Instead, each stock carries a **completeness ratio**: the share of its horizon's factors that are non-null. Below the horizon's threshold (4 of 5 on every board) the stock is not ranked at any score. At or above it, the remaining weights are renormalized to sum to 1 and the stock carries a visible completeness badge. A stock scored on four factors is scored on four factors, and the site says so.

## What this does not fix

Robust normalization solves a units problem. It does not solve the harder problems, and the methodology's [known limitations](/methodology/) are explicit about them.

It does not tell you the weights are right. The 0.30 on relative volume in the ultra-short model is reasoned from published literature, not optimized on this data. That avoids overfitting the sample, but it also means nobody has demonstrated 0.30 is better than 0.25.

It does not fix a bad factor. A well-normalized measurement of something with no predictive content is a well-normalized number with no predictive content — headline sentiment, discussed in the methodology's own limitations section, is the honest example.

And it does not address multiple testing. Four horizons, dozens of factors, two markets is a large search space, and the literature on how many published "factors" survive a proper multiple-comparisons correction is not encouraging. The site's answer is the [performance audit](/performance/): publish every pick in advance with its exit rules, then report what happened net of costs, including the ones that were never fillable.

Getting the arithmetic right is the floor, not the ceiling. But a screen that adds a volume ratio to a sentiment score without normalizing does not clear the floor, and most of them do exactly that.

---

*Related: [why a 42% gross margin means nothing until you know the sector](/blog/sector-neutral-scoring/), [what relative volume actually measures](/blog/relative-volume-median/), and [how the performance audit is constructed](/blog/honest-performance-audit/).*
