---
title: "The Piotroski F-Score, One Test at a Time"
description: "Nine binary accounting checks, each detecting a specific way a cheap company can be quietly deteriorating. What every test looks for, how StockPulse computes them from XBRL, and the three places this implementation deviates from the 2000 paper."
seoTitle: "The Piotroski F-Score Explained, Test by Test"
lang: en
translationKey: "piotroski"
publishedAt: 2026-06-30
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "Piotroski, J. (2000), Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers, Journal of Accounting Research 38"
    url: "https://www.jstor.org/stable/2672906"
  - label: "StockPulse methodology, §5.3 — FScore"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "SEC EDGAR XBRL APIs"
    url: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
category: education
tags: ["piotroski", "f-score", "fundamentals", "accounting-quality"]
tickers: []
draft: false
featured: true
---

Joseph Piotroski's 2000 paper asked a narrow question: within a portfolio of statistically cheap companies, can the reported financial statements separate the ones that are cheap because they are troubled from the ones that are cheap because they are ignored? His answer was nine binary tests, one point each. It is one of the most replicated results in the value literature, it is computable entirely from tagged XBRL data, and it carries a weight of 0.10 in the StockPulse [long-term model](/methodology/) plus a hard gate on the mid-term board. This article goes through all nine and is explicit about where this implementation departs from the paper.

## The idea

A cheap stock is cheap for a reason. Sometimes the reason is neglect and sometimes it is decay, and a price ratio alone cannot tell them apart. Piotroski's insight was that decay leaves fingerprints in the financial statements before it shows up in the multiple — and that you do not need a model to find them, just a checklist of directional facts.

The nine tests fall into three groups: is the company profitable and generating cash, is its balance sheet getting stronger or weaker, and is it getting more efficient at what it does. Each is scored 1 or 0. A 9 is a company improving on every measured axis; a 1 is one deteriorating on nearly all of them.

## Group 1 — profitability and cash (4 points)

**1. Return on assets is positive.** Net income divided by total assets, greater than zero. The most basic test there is: did the business make money on the capital it is using? It catches nothing subtle, and it is in the list precisely because a surprising number of cheap companies fail it.

**2. Operating cash flow is positive.** Cash from operations, greater than zero. This is a different question from the first. Reported income can be positive while the business consumes cash — through growing receivables, growing inventory, or capitalised costs. A company that reports profit and burns cash is on a clock.

**3. Return on assets is improving.** This year's ROA greater than last year's. Direction, not level. A business at 4% ROA and rising is scored the same as one at 20% and rising, because the test is about trajectory and the level is captured elsewhere in the model.

**4. Operating cash flow exceeds net income.** In the implementation this is `CFO / assets > net income / assets`, which reduces to the same comparison scaled by the same denominator.

This fourth test is the one worth understanding properly, because it is the accruals check. Net income is an accounting construct built on judgement calls — when to recognise revenue, how fast to depreciate, what to reserve. Cash flow is much harder to shape. When income is consistently *above* cash flow, the gap is accruals: profits recognised but not yet collected. Sometimes that is ordinary growth. Sometimes it is the last thing that looks fine before it does not. [The full accruals argument gets its own article.](/blog/free-cash-flow-conversion/)

## Group 2 — leverage, liquidity and dilution (3 points)

**5. Long-term debt to assets did not rise.** Leverage flat or down year-over-year. A company raising long-term debt is either investing or covering a hole, and the statements do not distinguish; Piotroski treats the increase as a negative because among already-cheap companies, it more often accompanies the second.

Note the implementation uses "less than or equal to" rather than strictly less than, so unchanged leverage scores the point. That is a deliberate reading: a company that did not add leverage passed the test.

**6. The current ratio improved.** Current assets over current liabilities, higher than a year ago. A short-term solvency direction check.

**7. No meaningful share issuance.** Shares outstanding did not grow — in this implementation, did not grow by more than 2%. A company that funded itself by issuing equity while trading cheaply diluted its existing owners at a poor price, which is informative about both its options and its judgement.

## Group 3 — operating efficiency (2 points)

**8. Gross margin improved.** Gross profit over revenue, higher than a year ago. Rising gross margin points at pricing power, mix improvement or input cost relief. Falling margin in a cheap company frequently means it is discounting to hold volume.

**9. Asset turnover improved.** Revenue over total assets, higher than a year ago. Is the company generating more sales per unit of assets? Together with test 8 this decomposes ROA the same way a DuPont analysis does — margin times turnover — and asks whether either half is improving.

## Where this implementation departs from the paper

Three deviations, all deliberate, all worth knowing if you compare this F-score against another source and get a different number.

**It compares quarter against the same quarter a year earlier, not fiscal year against fiscal year.** The pipeline pairs the most recent quarterly statement with the quarter four periods back. Year-over-year rather than sequential comparison means a seasonal business is not penalised for its off quarter, but this is a quarterly F-score and Piotroski's was annual. It is noisier, and it updates four times a year rather than once — which is the reason for the choice.

**The dilution test allows 2% share growth.** Piotroski's test is whether the firm issued common equity at all. A 2% tolerance treats routine share issuance from employee compensation plans differently from a capital raise. That is defensible and it is a change; a company drifting up 1.9% a year for a decade — a 21% increase in the share count — passes this test every year. The [ultra-long model](/blog/economic-moat-in-data/) catches that separately with a dilution penalty and an invalidation trigger.

**Partial scores are scaled, not discarded.** If fewer than six of the nine tests can be computed from available data, the whole F-score returns null and the stock's completeness ratio takes the hit. If six, seven or eight are computable, the score is scaled to the 0–9 range: a company passing 5 of 7 computable tests scores `(5/7) × 9 = 6.4`.

That scaling is a compromise with a real cost. It assumes the untestable items would have been passed at the same rate as the testable ones, which is not obviously true — a company missing gross profit tags may be missing them for reasons correlated with the thing being measured. The alternative, nulling every company with an incomplete tag set, would have removed a meaningful slice of the market including most financials. Both choices are wrong in different directions and this one is documented rather than hidden.

## How the score is used

**On the long-term board**, the F-score is one of five factors at a weight of 0.10 — the smallest weight in the model. It is [sector-neutral z-scored](/blog/sector-neutral-scoring/) like every other fundamental factor, which means what is scored is not the raw 0–9 but how a company's F-score compares to its sector peers that day.

**On the mid-term board**, it is not a factor at all — it is a gate. Companies in the bottom of the F-score distribution are excluded regardless of how well they score on trend, drift or money flow. Momentum applied to accounting-poor companies produces the worst available combination: things that are going up and should not be.

The small weight is intentional. The F-score is a coarse instrument. Nine binary tests throw away all magnitude — a company whose ROA improved from 1% to 1.01% earns the same point as one that went from 2% to 12%. It is a screen for *absence of deterioration*, not a measure of quality, and the model's ROIC, cash-generation and growth factors carry the quality question.

## The honest caveats

**It was documented on a specific population.** Piotroski studied high book-to-market firms — statistically cheap, often small, often neglected. Applying the same checklist to a large-cap liquid universe is a different exercise, and there is no reason to expect the same effect size.

**Binary tests discard information.** See above. This is a feature for robustness and a defect for precision.

**Accounting rules changed.** Twenty-five years of standard-setting sit between the paper and today's filings, most consequentially in revenue recognition and lease accounting. The tests still compute; whether they detect exactly what they detected in the 1976–1996 sample is not something anyone can assert from here.

**It is backward-looking by construction.** Every test compares a period to a prior period. A company whose deterioration began last month is invisible until it files.

---

*Related: [the accruals warning in test 4](/blog/free-cash-flow-conversion/), [why ROIC beats ROE for the quality question](/blog/roic-vs-roe/), and [where the underlying XBRL data comes from](/blog/sec-xbrl-four-traps/).*
