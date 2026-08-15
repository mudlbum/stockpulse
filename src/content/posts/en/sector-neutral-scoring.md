---
title: "A 42% Gross Margin Means Nothing Until You Know the Sector"
description: "The same margin is unremarkable for software and exceptional for a grocer. StockPulse z-scores every fundamental factor inside its sector and every technical factor across the market — here is the rule, the fallback logic, and what it costs."
seoTitle: "Sector-Neutral Scoring: Why 42% Means Nothing"
lang: en
translationKey: "sector-neutral"
publishedAt: 2026-06-16
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §2 step 3 — peer groups"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "StockPulse sector view"
    url: "https://mudlbum.github.io/stockpulse/sectors/"
category: methodology
tags: ["sector-neutral", "z-score", "normalization", "gics"]
tickers: []
draft: false
featured: false
---

Every factor on this site is [z-scored against a peer group](/blog/why-weighted-sums-fail/). The choice of peer group is a modelling decision as consequential as the weights, and it is made differently for two classes of factor: technical measurements are compared across the entire universe, fundamental measurements are compared only within sector. This article explains the split, shows the arithmetic that motivates it, and covers the fallback behaviour that keeps thin sectors from disappearing off the boards.

## The example that forces the rule

A company reports a 42% gross margin. Is that good?

The question has no answer without a sector. In enterprise software, where the cost of an additional licence is close to zero, 42% is poor — it suggests a large services component, heavy hosting costs, or pricing under pressure. In grocery retail, where 25% is a typical structure, 42% would be extraordinary enough to warrant checking whether the company is classified correctly.

Score that 42% against the whole market and you learn where the company's *industry* sits, which was already known. The margin has been converted into a sector label wearing a score.

Concretely: suppose the software sector's gross margins that day have a median of 70% and a robust scale of 12 points, while packaged food has a median of 31% and a scale of 6 points. The same 42% produces:

```
software:      z = (42 − 70) / 12 = −2.33
packaged food: z = (42 − 31) /  6 = +1.83
```

Two answers over four sigma apart, from one number. Whichever is right depends entirely on which peer group the company belongs to — which is precisely why the peer group has to be chosen deliberately rather than defaulting to "everything."

## The split

**Fundamental factors are scored within sector.** Growth quality, capital efficiency, cash generation, valuation, F-score, moat strength, cash flow durability, reinvestment runway, balance-sheet strength and shareholder yield — every factor on the [1–2 year](/blog/roic-vs-roe/) and [5–10 year](/blog/economic-moat-in-data/) boards, without exception.

**Technical factors are scored across the whole universe.** Relative volume, gap quality, volatility expansion, trend position, trend alignment, money flow, earnings drift, news sentiment.

The reasoning behind the second half is that a stock trading at four times its normal volume is having an unusual day regardless of what it does for a living. There is no sector-specific definition of "unusual volume" the way there is a sector-specific definition of "good margin." Momentum, likewise, is comparable across industries in a way profitability is not.

The split is not perfectly clean. Volatility genuinely does differ by sector — biotechnology is structurally more volatile than utilities — so a market-wide z-score on volatility expansion systematically favours the volatile end of the market. The [risk gauge](/blog/atr-stops/) on each row (the quintile of ATR/price within the universe) exists so that this is visible on the page rather than hidden inside a composite score, but the factor itself is not sector-adjusted, and that is a deliberate simplification rather than an oversight.

## What happens to small sectors

Sector-neutral scoring runs into an obvious problem: a z-score computed over three stocks is decoration. The implementation handles it in two stages.

**Stage one — pooling.** Any sector with fewer than 8 members in that day's universe is pooled with the other small sectors into a single combined group, and z-scored there. This is not a great peer group — a pooled bucket might contain a shipping company, a specialty insurer and a rare-earths miner — but it is a real comparison over a workable sample rather than a fabricated one over three observations.

**Stage two — market-wide fallback.** If a bucket still cannot produce at least three usable values after pooling, the stocks in it fall back to a market-wide z-score. This is a weaker comparison and it is used because the alternative is worse: returning null would push those stocks below the [completeness gate](/blog/why-weighted-sums-fail/) and silently delete an entire thinly-represented sector from the board. A weaker real comparison beats a missing one, and the stock still carries its completeness badge either way.

Both behaviours are worth knowing when reading a score. A company in a sector with 40 peers is being measured against a meaningful distribution. One in a pooled bucket is being measured against something more approximate, and the site's [sector view](/sectors/) shows how many names each sector contributes on a given day.

## Where the sector labels come from

This is the least satisfying part of the design and it deserves stating.

The SEC publishes SIC codes, not GICS. SIC is a classification system from an industrial era that maps poorly onto how modern companies are organised, and building a reliable SIC-to-GICS bridge is a substantial project in its own right, not a lookup table.

What the pipeline uses for sector *composites* — the return series that the sector-strength factor and the [sector treemap](/sectors/) are built on — is the eleven SPDR sector ETFs. They are free, liquid, have clean price history, and are constructed from GICS, so they are a reasonable proxy for sector performance without any classification work.

For the Korean side, sector and industry descriptions come from the same public GitHub mirror that supplies the daily KRX listing snapshot, in a separate path from the price data.

The consequence is that a company's assigned sector may not match the one you would assign it. Conglomerates are the obvious hard case — a company with a financing arm, a manufacturing business and a property portfolio gets one label. Companies straddling a boundary (a payments company: technology or financials?) get whichever side the classification put them on, and their fundamental z-scores are computed against that peer group. This is a real source of error and there is no version of this problem that goes away with a better data source, because the categories themselves are a simplification of reality.

## What sector-neutral scoring deliberately removes

The most important thing to understand about this design is what it is designed *not* to tell you.

Because every fundamental factor is measured relative to sector peers, the long-horizon boards contain no information about whether one sector is more attractive than another. A software company ranking in the top decile of software and an industrial ranking in the top decile of industrials arrive at similar scores. If software is broadly overpriced relative to industrials, this model will not say so — by construction.

That is intentional. Making a sector call is a different exercise with different inputs (macro, rates, cycle position) and mixing it into a stock-selection score would produce a number that is neither cleanly. The site handles the sector question separately: the [sector view](/sectors/) shows relative performance directly, and the mid-term board carries a continuous sector-strength factor at a 120-day lookback with a weight of 0.15, which is the one place a sector view enters a score.

The second half of the same design is the diversification constraint applied after scoring: a maximum of three names per sector in any published top ten, relaxed to four when the universe contains fewer than six represented sectors. Sector-neutral scoring means every sector can produce top-ranked names; the cap stops one of them from producing all of them. Displaced names appear on the "just missed" list with the constraint that displaced them named explicitly, so the reader can see the constraint working rather than wondering where a name went.

Alongside it sits a correlation cap — no more than two names whose pairwise 60-day return correlation exceeds 0.85. A top ten of ten correlated semiconductor names is one position presented as ten, and the sector cap alone does not catch a cluster that spans sector boundaries.

---

*Related: [the full four-step normalization](/blog/why-weighted-sums-fail/), [why moat scoring depends on this step](/blog/economic-moat-in-data/), and [what the sector composites are built from](/sectors/).*
