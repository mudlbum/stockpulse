---
title: "ROIC, ROE, and Why the Denominator Decides Everything"
description: "Two companies can post an identical 15% return on equity while one earns 19% on the capital it employs and the other earns 10%. The difference is leverage. Here is how StockPulse builds invested capital from XBRL, and what the calculation misses."
seoTitle: "ROIC vs ROE: Why the Denominator Decides"
lang: en
translationKey: "roic"
publishedAt: 2026-07-07
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §5.3 — CapitalEfficiency"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Greenblatt, J. (2010), The Little Book That Still Beats the Market"
    url: "https://www.wiley.com/en-us/9780470624159"
  - label: "SEC EDGAR XBRL APIs"
    url: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
category: education
tags: ["roic", "roe", "capital-efficiency", "fundamentals", "xbrl"]
tickers: []
draft: false
featured: false
---

Return on equity is the most quoted profitability ratio in finance and one of the easiest to manufacture. Return on invested capital asks a harder question and is correspondingly harder to flatter. The [long-term board](/methodology/) uses ROIC at a weight of 0.24 — the second-largest in that model — and this article explains why, with the actual construction from SEC XBRL tags and an honest list of what it gets wrong.

## The two ratios

Return on equity is net income divided by shareholders' equity. It measures return to one class of capital provider, computed after the other class — lenders — has been paid.

Return on invested capital is after-tax operating profit divided by the total capital the business actually uses, regardless of who supplied it.

```
NOPAT            = operating_income_TTM × (1 − effective_tax_rate)
InvestedCapital  = long_term_debt + short_term_debt + total_equity − cash
ROIC             = NOPAT / InvestedCapital
```

The difference sits entirely in the denominator and in whether interest is deducted before the measurement. ROE rewards a company for financing itself with debt; ROIC is indifferent to the financing and asks only what the assets earn.

## Two companies, one ROE

| | Company A | Company B |
| --- | --- | --- |
| Operating income (TTM) | 190 | 120 |
| Net income (TTM) | 150 | 45 |
| Shareholders' equity | 1,000 | 300 |
| Total debt | 0 | 700 |
| Cash | 200 | 50 |

Both post a return on equity of 15% — A earns 150 on 1,000, B earns 45 on 300. On an ROE screen they are indistinguishable.

Now compute ROIC at a 21% tax rate.

Company A: NOPAT is `190 × 0.79 = 150`. Invested capital is `0 + 1,000 − 200 = 800`. ROIC is **18.8%**.

Company B: NOPAT is `120 × 0.79 = 94.8`. Invested capital is `700 + 300 − 50 = 950`. ROIC is **10.0%**.

Company A earns nearly twice as much on the capital it employs. Company B's identical ROE is an artefact of having financed more than two-thirds of its capital base with debt, which magnifies the return on a smaller equity slice while adding fixed obligations that do not go away in a bad year.

This is the whole argument in one table. ROE conflates operating quality with the financing decision. ROIC separates them, which is what you need when the question is "which of these is the better business" rather than "which produced more accounting income per unit of book equity."

The same logic explains why buyback-heavy companies post rising ROE. Repurchasing shares reduces equity, which shrinks the denominator, which raises the ratio without anything about the operations having changed. ROIC barely moves, because the cash spent leaves the numerator's capital base too.

## How invested capital is built from XBRL

The components come from the SEC's company-facts endpoint, using balance-sheet concepts requested in the "instantaneous" period form — the one with a trailing `I` on the frame identifier, whose entries carry no `start` field. [Getting that form wrong returns a 404 rather than an empty set](/blog/sec-xbrl-four-traps/), which is a good failure mode because it is loud.

The tags resolved, in priority order:

| Component | XBRL tags tried |
| --- | --- |
| Total equity | `StockholdersEquity`, then `StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest` |
| Long-term debt | `LongTermDebtNoncurrent`, then `LongTermDebt` |
| Short-term debt | `ShortTermBorrowings`, then `LongTermDebtCurrent` |
| Cash | `CashAndCashEquivalentsAtCarryingValue`, then `CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents` |
| Operating income | `OperatingIncomeLoss`, then a continuing-operations pre-tax fallback |

If total equity cannot be resolved, invested capital is null and the stock's completeness ratio takes the hit rather than the pipeline substituting a guess. If the computed invested capital is zero or negative — which happens for companies with large accumulated deficits or enormous buyback programmes — the result is also null, because a negative denominator produces a ratio that is arithmetically defined and financially meaningless.

## The tax rate clip

The effective tax rate is computed as trailing-twelve-month income tax expense over trailing pre-tax income, and then **clipped to the range [10%, 35%]**. Where pre-tax income is not positive or the tags are missing, a flat 21% is used.

The clip exists because of a specific and reliable failure. A company that settles a tax dispute or recognises a valuation allowance release can post a *negative* effective rate for a trailing period. Without the clip, `1 − rate` exceeds 1, NOPAT comes out larger than operating income, and ROIC inflates. The result is that an unclipped screen puts a handful of tax-settlement situations at the top every quarter — companies whose apparent capital efficiency is entirely an accounting event.

A related choice appears in the multi-year ROIC series used by the [5–10 year board](/blog/economic-moat-in-data/): that series uses a flat 21% for every year rather than each year's effective rate. Across a decade, one-off tax items would otherwise dominate a measurement meant to describe the business rather than its tax department.

## How the factor is scored

The raw ROIC is not the score. The capital-efficiency factor is:

```
0.7 × ramp(ROIC / 0.15) + 0.3 × (ROIC − ROIC_3yr_ago)
```

`ramp` is a linear slope against a reference value, clipped to a maximum of 2. So 15% ROIC scores 1.0 on the level term, 7.5% scores 0.5, and **anything at or above 30% scores the same 2.0**. That ceiling is deliberate: the difference between a 32% and a 55% ROIC business is largely a question of how the balance sheet is constructed — asset-light businesses with negative working capital can print very high ROIC without being correspondingly better — and treating the top of the range as a plateau avoids ranking on an accounting artefact.

The second term is the change over three years, capped at ±30 percentage points. Improving returns on capital are where re-rating comes from; a business going from 9% to 16% is telling you something a business sitting at 16% for a decade is not.

The composite is then [z-scored within the sector](/blog/sector-neutral-scoring/), not across the market, because capital intensity is a sector property. A 12% ROIC is unremarkable for software and excellent for a utility.

## What this calculation gets wrong

**The denominator is a point-in-time balance sheet.** The published spec calls for a four-quarter average of invested capital, which smooths a business whose balance sheet swings seasonally or which closed an acquisition mid-year. The implementation reads the latest balance sheet. For a company that made a large acquisition in the final quarter, the denominator jumps before the earnings from the acquisition appear in the trailing numerator, and ROIC is understated for a year.

**Goodwill is included in equity, and that is a choice.** A company that overpaid for an acquisition carries the excess as goodwill inside equity, which enlarges invested capital and depresses ROIC. Some analysts strip goodwill to measure the return on *operating* assets. Keeping it in measures the return on the capital shareholders actually committed, including the capital destroyed at the point of the deal. Both are defensible; this site keeps it in, and the practical consequence is that serial acquirers score worse here than on a tangible-capital basis.

**Operating leases and pensions are not adjusted.** Modern lease accounting has brought most operating leases onto the balance sheet as liabilities, which helps, but the treatment is not uniform across filers and the pipeline does not normalise it. Pension obligations are not touched at all.

**Financials do not fit.** For a bank, debt *is* the raw material and "invested capital" as defined here has no economic meaning. The [5–10 year model](/blog/economic-moat-in-data/) handles this by routing financials, REITs and utilities to a sector-appropriate balance-sheet measure. The long-term board's ROIC factor does not: a bank in that universe gets an ROIC computed from a formula that was not designed for it, and the sector-neutral z-score at least ensures it is compared only against other banks scored the same wrong way. That is mitigation, not a fix, and it is the weakest point in this factor.

**Trailing twelve months is four quarters.** For a cyclical business at the top or bottom of its cycle, a TTM ROIC describes a moment, not a normal. The persistence measure on the ultra-long board — the share of the last decade with ROIC above 12% — exists partly to address exactly this.

---

*Related: [free cash flow conversion and the accruals warning](/blog/free-cash-flow-conversion/), [what a moat looks like in reported data](/blog/economic-moat-in-data/), and [why fundamental factors are scored within sector](/blog/sector-neutral-scoring/).*
