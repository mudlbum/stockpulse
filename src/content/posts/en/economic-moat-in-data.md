---
title: "What an Economic Moat Looks Like in Reported Data"
description: "A warehouse retailer with a 12% gross margin can have a wider moat than a software company at 80%. Margin level is a sector fact. Margin stability and a decade of persistent returns on capital are closer to evidence — here is how both are scored."
seoTitle: "Finding an Economic Moat in Reported Data"
lang: en
translationKey: "moat"
publishedAt: 2026-07-23
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §6.3 — MoatStrength"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Novy-Marx, R. (2013), The Other Side of Value: The Gross Profitability Premium, Journal of Financial Economics 108(1)"
    url: "https://doi.org/10.1016/j.jfineco.2013.01.003"
category: methodology
tags: ["moat", "ultra-long", "gross-margin", "roic", "durability"]
tickers: []
draft: false
featured: false
---

"Economic moat" is a metaphor about durable competitive advantage, and metaphors do not appear in XBRL. The [5–10 year board](/methodology/) has to score something, so the question becomes: what does a moat leave behind in reported financial statements that a company without one does not? This article covers the answer StockPulse settled on, why the obvious version fails, and the substantial gap between what is measured and what the word means.

## Why a margin threshold does not work

The original design for this board specified "gross margin above 40% for five years." It is an intuitive rule and it selects for an industry rather than a quality.

Software and pharmaceuticals clear 40% by the structure of their cost of goods. Distributors, grocers, airlines and most industrials never will, no matter how dominant they become. A large warehouse-club retailer running a gross margin around 12% — funding its operations substantially through membership fees, holding pricing power over suppliers that most of its competitors would like to have — fails a 40% threshold every year of its existence. So does a railroad. So does an insurance broker with 90% customer retention.

An absolute margin threshold does not measure competitive advantage. It measures where a company sits in its value chain, which was already known.

## What is scored instead

```
MoatStrength = 0.30 × gross_margin_level
             + 0.25 × gross_margin_stability
             + 0.15 × gross_margin_trend
             + 0.30 × roic_persistence
```

The composite is then [z-scored within the company's sector](/blog/sector-neutral-scoring/), which is the step that converts a margin *level* into a margin *percentile*. A 12% gross margin scored against other retailers can land in the top decile; the same 12% scored against the whole market lands near the bottom. The sector-neutral normalization is not a refinement here — it is the thing that makes the level term mean anything at all.

Each term in turn.

**Gross margin level (0.30).** The mean of the last five annual gross margins. A single year is noise; five years is a structural statement about where the company sits in its industry.

**Gross margin stability (0.25).** Computed as `1 − (standard deviation ÷ mean)` over those five years, clipped to [0, 1]. A company holding a 30% margin within a point or two through a cycle scores near 1. One oscillating between 22% and 38% scores much lower even though its average is the same.

This term is doing more work than the level term, conceptually. A stable margin through an input-cost cycle is close to a direct observation of pricing power: the company was able to pass costs through. A margin that swings with commodity prices says the company is a price taker. The average of the two cases can be identical.

**Gross margin trend (0.15).** The sign of the five-year slope, mapped to 0, 0.5 or 1 for falling, flat and rising. Only the direction is used, not the magnitude — the level and stability terms already carry magnitude, and a steep slope over five annual points is as often a mix change as a competitive development.

**ROIC persistence (0.30).** The share of the available annual history in which return on invested capital exceeded 12%.

This carries the joint-largest weight and it is the term the whole factor rests on. High returns on capital attract competition; that is the central prediction of basic industrial economics. A company sustaining returns well above its cost of capital for a decade has, by revealed behaviour, something preventing competitors from competing the excess away. Nobody has to name what that something is for the persistence to be evidence.

Two implementation details. The multi-year ROIC series is computed with a **flat 21% tax rate** for every year rather than each year's effective rate, so that a decade-long measurement of the business is not dominated by tax settlements. And the persistence figure requires at least five years of computable history; with fewer, it returns null and the [completeness gate](/blog/why-weighted-sums-fail/) decides whether the stock is rankable at all. The board additionally requires at least ten years of filing history before a company can appear on it — a young company has no observable durability whatever its story, and the correct treatment is absence from the board rather than presence with a fabricated score.

## The rest of the ultra-long model

Moat strength is 0.28 of five factors. The others exist because a moat alone does not produce a return.

**Cash flow durability (0.24)** scores the share of the last ten fiscal years with positive free cash flow, the growth rate of free cash flow, and the worst peak-to-trough decline in it. The original design called for positive free cash flow growth every year for seven consecutive years, which is close to unpassable — one pandemic, one heavy capex cycle, one acquisition, and a genuinely excellent business fails. Scoring nine-of-ten just below ten-of-ten keeps the ranking informative.

**Reinvestment runway (0.20)** is the term most often missing from moat frameworks. A wide moat with nowhere to deploy capital compounds at roughly the dividend yield. The factor multiplies the reinvestment rate by ROIC to get an implied growth rate, and pairs it with ten-year revenue-per-share growth. The reinvestment rate here is net capital spending — capex less an estimate of depreciation — over NOPAT, clipped into a plausible range. The methodology's fuller definition adds R&D and acquisitions to the numerator; the running implementation uses capex alone, which understates reinvestment for research-intensive and acquisitive companies. That is a known gap rather than a design choice.

**Balance-sheet strength (0.16)** is sector-dependent, and this is where the "one rule for everything" approach fails hardest. Net debt to EBITDA below 2.0 excludes every bank by construction, because deposits are liabilities and leverage is the business model. It excludes REITs and most utilities for related reasons. Financials, real estate and utilities are therefore routed to equity-to-assets rather than a leverage ratio.

**Shareholder yield (0.12)** combines net buyback yield, dividend yield and dividend growth, with a penalty when the share count grows more than 2% a year. The buyback component is computed from the actual share count on successive balance sheets rather than from announced repurchase programmes — so a buyback that merely offsets stock-based compensation nets to approximately zero, which is the correct answer and the reason gross announcements are not used.

## Where this is weakest

This is the board where the distance between what is measured and what is meant is largest, and being clear about it matters more here than anywhere else on the site.

**Gross margin is not comparable across companies, even inside a sector.** What goes into cost of goods sold is a policy choice. Two retailers can treat distribution costs, occupancy and depreciation differently and post gross margins several points apart while running identical economics. There is no adjustment for this in the pipeline and there is no clean way to build one from tagged data.

**A decade of high ROIC can be a decade-long cycle.** Persistence measured over ten years is a much better test than one year. It is not immune. An industry in a long upcycle — a commodity in a structural shortage, a category in a demographic tailwind — produces high returns on capital for every participant, and the measurement cannot distinguish structural advantage from a favourable decade.

**The things that actually constitute a moat are invisible here.** Switching costs, network effects, regulatory position, brand, scale in distribution — none of these appears in a filing as a number. What appears is their *consequence*, one step removed and confounded with everything else. This factor infers a cause from an outcome, which is a weaker form of evidence than it looks when rendered as a score out of 100.

**Persistence is inherently backward-looking.** A moat that is being eroded right now produces the same ten-year history as one that is intact. The invalidation triggers on this board — three consecutive years of ROIC decline, gross margin below its ten-year 20th percentile, net debt to EBITDA above 3.5× — are the mechanism for noticing, and they are slow by construction. On a 5–10 year horizon that is the correct speed, but it means the score will keep saying "wide moat" for some time after the situation has changed.

**Korean names are not on this board at all.** There is no keyless Korean equivalent of SEC XBRL, and a decade of tagged, audited statements is exactly what this model requires. The board is US-only and says so on the page, rather than ranking Korean companies on data that cannot support the question. [The Korean data situation has its own article.](/blog/sec-xbrl-four-traps/)

---

*Related: [ROIC and how invested capital is computed](/blog/roic-vs-roe/), [why sector-neutral scoring is what makes the margin term work](/blog/sector-neutral-scoring/), and [why this board publishes no price stop](/blog/no-price-stop-long-horizon/).*
