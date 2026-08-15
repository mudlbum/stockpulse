---
title: "SEC XBRL Is Free and Excellent. It Also Has Four Traps"
description: "Audited, tagged, machine-readable financial statements for every US filer, with no API key. Then you discover that no single revenue tag covers the market and requesting the wrong period form returns 404 rather than nothing. A field guide."
seoTitle: "SEC XBRL: Four Traps in Free Filing Data"
lang: en
translationKey: "xbrl-traps"
publishedAt: 2026-08-04
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "SEC EDGAR XBRL APIs"
    url: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
  - label: "SEC — Accessing EDGAR Data (fair access policy)"
    url: "https://www.sec.gov/os/accessing-edgar-data"
  - label: "StockPulse methodology, P2 and §5–§6"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "DART OpenAPI (Korean filings)"
    url: "https://opendart.fss.or.kr"
category: data
tags: ["xbrl", "sec-edgar", "data-sources", "fundamentals", "api"]
tickers: []
draft: false
featured: false
---

The SEC publishes every US filer's tagged financial statements as JSON, free, with no key and no account. It is the best free financial dataset in existence and the gap to second place is large. Every fundamental factor on this site — [ROIC](/blog/roic-vs-roe/), [free cash flow conversion](/blog/free-cash-flow-conversion/), the [F-score](/blog/piotroski-f-score/), the whole [moat model](/blog/economic-moat-in-data/) — is built on it. It also has a handful of characteristics that will silently produce wrong numbers if you do not know about them in advance, and this is the field guide.

## The three endpoints

```
https://www.sec.gov/files/company_tickers.json
https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json
https://data.sec.gov/api/xbrl/frames/{taxonomy}/{tag}/{unit}/{period}.json
```

The first maps tickers to Central Index Keys. The second returns the full fact history for one company — every tagged value the company has ever reported, with the period it covers and the date it was filed. The third inverts the axis: one fact, for one period, across every filer that reported it.

Before the traps, two rules of access. Send a descriptive `User-Agent` containing a contact address; the SEC's fair-access policy asks for it and requests without one are refused. And stay well under the stated cap of 10 requests per second — the pipeline here throttles considerably below it, since a rate limit tripped in an automated run is an outage rather than an inconvenience.

There is also a small trap in the very first file: `company_tickers.json` is an **object keyed by stringified index**, not an array, and the `cik_str` field is a **JSON number** despite the name. Zero-pad it to ten characters yourself before building the companyfacts URL, or every request 404s.

## Trap 1 — instantaneous versus duration periods

Financial concepts come in two shapes, and the API distinguishes them in a way that is easy to miss.

**Duration concepts** cover a span of time: revenue, operating income, cash flow. Their period identifier looks like `CY2026Q1`, and their entries carry both a `start` and an `end` field.

**Instantaneous concepts** describe a moment: total assets, equity, cash, debt, shares outstanding. Their period identifier carries a trailing `I` — `CY2026Q1I` — and their entries have **no `start` field at all**.

Request a balance-sheet concept with the duration form, or an income concept with the instantaneous form, and you get **HTTP 404, not an empty result set**.

That is genuinely good design, because it fails loudly. The trap is in what happens next: a fetch wrapper that treats 404 as "this company did not report that" will quietly return nothing, the fundamental factor will be null for every company, the completeness gate will drop the whole universe from the long-horizon boards, and the only visible symptom is an empty board. The pipeline here keeps an explicit set of which concept keys are instantaneous, rather than inferring it.

A related quirk in the same area: **period end dates vary by filer**. The SEC bins non-calendar fiscal quarters into the nearest calendar frame, so a single frame legitimately contains entries ending `2026-02-28` and `2026-03-31`. Code that assumes every entry in a frame shares an end date will mis-align comparisons.

## Trap 2 — no single revenue tag covers the market

This is the one that surprises people most, because revenue seems like it should be the easiest number in finance.

Measured on one quarter, `RevenueFromContractWithCustomerExcludingAssessedTax` was reported by 2,654 filers. `Revenues` was reported by 2,094. The two sets overlap heavily and neither is sufficient on its own. Pick either one and you have silently deleted a large slice of the market — and worse, you have deleted it *non-randomly*, because which tag a company uses correlates with its industry and its accounting.

The pipeline resolves a priority list per company and takes the first tag that returns data:

```
RevenueFromContractWithCustomerExcludingAssessedTax
Revenues
RevenueFromContractWithCustomerIncludingAssessedTax
RevenuesNetOfInterestExpense
SalesRevenueNet
InterestAndDividendIncomeOperating
PremiumsEarnedNet
```

The last three exist to reach banks and insurers, whose "revenue" is a genuinely different concept — net interest income, premiums earned — and who would otherwise be absent from every fundamental board.

The same fragmentation applies across the statement. Operating income falls back to a continuing-operations pre-tax measure; net income tries `NetIncomeLoss` then `ProfitLoss`; cash concepts have restricted-cash variants; short-term debt might be tagged `ShortTermBorrowings` or `LongTermDebtCurrent`. Every one of these fallbacks is a small compromise on comparability, made because the alternative is a smaller and more biased universe.

The honest consequence: two companies' revenue figures on this site may come from different tags with slightly different scope. For a growth *rate*, where both periods use the same tag, this mostly cancels. For a *level* comparison across companies it does not fully cancel, and the [sector-neutral z-scoring](/blog/sector-neutral-scoring/) mitigates it only to the extent that tag choice correlates with sector.

## Trap 3 — restatements

The companyfacts endpoint returns the *current* value of a historical fact. If a company restated its 2023 accounts in 2025, asking for 2023 returns the restated figure — a number that did not exist in 2023 and could not have informed any decision made then.

The defence is the `frame` field. When SEC has selected an entry as its canonical value for a period, that entry carries a `frame` key. Preferring entries that have one is the cleanest available way to drop restatement duplicates. Where two entries for the same period end are both framed or both unframed, the pipeline takes the more recently filed one.

This is a heuristic, not a solution. A genuine point-in-time fundamental archive stores every vintage of every fact — what the world believed about Q2 2023 as of every subsequent date — and the free endpoints do not provide one. Anyone building a long backtest on this data should understand that some fraction of historical fundamentals are the corrected versions, and that the correction direction is not random. [The look-ahead article](/blog/look-ahead-bias-point-in-time/) covers the broader family of this problem.

## Trap 4 — filed versus period end

Every entry carries an `end` date, when the fiscal period finished, and a `filed` date, when the document reached EDGAR.

They are typically 30 to 45 days apart for a quarterly report. Point-in-time filtering must key on `filed`. A quarter ending 30 June and filed 5 August must be invisible to a score dated 15 July, and using `end` hands the model three weeks of foresight every quarter.

The pipeline applies the filter at extraction, before any factor sees a number: an entry whose `filed` date is after the as-of date does not exist. It is the second design principle in the [published methodology](/methodology/) and it is the single highest-leverage line in the whole codebase.

## What XBRL does not give you

**Anything outside the United States.** This is the largest gap in the project. There is no keyless Korean equivalent — KRX moved its data portal behind a mandatory login in December 2025, and the options that remain are either cross-sectional snapshots without history or fragile HTML scraping.

The consequence is stated on the site rather than hidden: the [5–10 year board is US-only](/blog/economic-moat-in-data/), because a decade of tagged annual statements is exactly what that model requires and Korean coverage cannot supply it. Korean long-horizon scores carry a lower-confidence badge. The fix exists and is free — DART, the Korean regulator's OpenAPI, provides audited multi-year filings and requires only a key — and adding it is the single highest-value upgrade available to this project.

**Analyst estimates.** Not a filing, not in XBRL, no keyless source. This is why the mid-term board substitutes [realized post-earnings drift](/blog/post-earnings-drift/) for revision momentum.

**Anything before roughly 2009.** XBRL tagging phased in over several years. Coverage before that is thin, which matters directly for the ultra-long board's requirement of ten years of filing history.

**Segment detail worth relying on.** Segment tagging exists but is inconsistently applied and inconsistently structured across filers, which makes it poor material for a cross-sectional factor.

**Uniform judgement.** Two companies can tag the same economic event differently and both be correct. XBRL removes the parsing problem; it does not remove the comparability problem, and no amount of engineering will.

---

*Related: [look-ahead bias and the filed date](/blog/look-ahead-bias-point-in-time/), [how ROIC is built from these tags](/blog/roic-vs-roe/), and [the F-score's nine tests](/blog/piotroski-f-score/).*
