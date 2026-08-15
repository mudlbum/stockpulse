---
title: "Look-Ahead Bias and the One Date That Prevents It"
description: "A quarter ending 30 June and filed 5 August must be invisible to a score dated in July. Keying fundamental data on the SEC filed date instead of the period end is the difference between a backtest and a fantasy. Here is what goes wrong otherwise."
seoTitle: "Look-Ahead Bias and the SEC Filed Date"
lang: en
translationKey: "point-in-time"
publishedAt: 2026-07-28
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, P2 — point-in-time only"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "SEC EDGAR XBRL APIs"
    url: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
  - label: "Bailey, Borwein, López de Prado & Zhu (2014), Pseudo-Mathematics and Financial Charlatanism, Notices of the AMS 61(5)"
    url: "https://www.ams.org/notices/201405/rnoti-p458.pdf"
category: data
tags: ["look-ahead-bias", "point-in-time", "backtesting", "sec-edgar"]
tickers: []
draft: false
featured: false
---

There is a single line in the StockPulse methodology that does more to keep the numbers honest than any factor definition: a score for date *D* may only use data whose publication timestamp is on or before *D*. It sounds like a truism. It is violated by an enormous share of published quantitative work, usually without anyone noticing, and the violation reliably produces results that look excellent and cannot be reproduced in real time.

## The mechanism

Every SEC filing carries at least two dates. The `end` date is when the fiscal period finished. The `filed` date is when the document reached EDGAR and became public.

For a US filer, the gap between them is typically 30 to 45 days for a quarterly report and 60 days or more for an annual one. A large accelerated filer's 10-Q is due 40 days after quarter end; smaller filers get 45.

So: a quarter ends 30 June. The 10-Q is filed 5 August. Between those dates, the numbers exist but nobody outside the company has them.

A backtest that keys fundamental data on the `end` date will happily use that quarter's revenue, margin and cash flow in a score dated 15 July. It has given the model 21 days of foresight. Do that every quarter across a ten-year test and the strategy has been quietly told what happened, every quarter, before it happened.

The StockPulse pipeline filters on `filed` at the point where facts are extracted from the SEC company-facts payload, before any factor sees them. An entry whose `filed` date is after the as-of date does not exist as far as the scorer is concerned.

## Why this bias is so hard to see

The failure is invisible in the output. A backtest with look-ahead does not throw an error or produce implausible numbers. It produces *slightly better* numbers than the honest version — a better win rate, a smoother equity curve, a higher Sharpe ratio. Everything looks like it worked.

It is also invisible in the code unless you go looking. The `end` date is the natural key: it is what a human means by "Q2 numbers," it sorts correctly, and it is what most tutorial code uses. Choosing it is not a mistake anyone makes carelessly; it is a mistake anyone makes by default.

And it compounds with the specific factors most sensitive to it. On the mid-term board, [earnings drift](/blog/post-earnings-drift/) measures the market's reaction in a three-session window anchored on the filing date. If the anchor were the period end, the window would sit weeks before the information was public, measuring a price reaction to nothing and calling it an earnings response.

## Four other doors the same bias enters through

The filed-versus-end problem is the largest one but not the only one.

**Restatements.** The SEC's company-facts endpoint returns the *current* value of a historical fact. If a company restated its 2023 results in 2025, a naive read of the 2023 period returns the restated figure — a number that did not exist and was not knowable in 2023. The pipeline's defence is to prefer entries carrying SEC's `frame` marker, which identifies the agency's canonical pick for a period, and to fall back to the most recently filed entry otherwise. That is a good heuristic and it is not a complete solution; a true point-in-time fundamental archive stores every vintage of every fact, and the free endpoint does not provide one.

**Index membership.** A backtest run over "the S&P 500" using today's constituent list is testing a portfolio of companies selected partly for having done well enough to still be in the index. StockPulse does not use index membership in universe construction for this reason; the universe is built from exchange listing, price, market capitalisation, liquidity and price-history filters, all of which are computable as of the date in question.

**Delisted names.** This is [survivorship bias](/blog/honest-performance-audit/) and it gets its own treatment, but it belongs on this list: a price store assembled from currently-listed tickers has already deleted the failures.

**Adjusted prices.** Price history is back-adjusted for splits and dividends, with the adjustment ratio applied across the whole bar so that highs, lows and closes stay internally consistent. (Applying an adjusted close alongside raw highs and lows silently corrupts every ATR, range and gap calculation across every split in history — a separate and very common bug.) But back-adjustment means a historical bar reflects today's knowledge of subsequent corporate actions. For price-ratio factors this is standard and harmless. For volume it is a mild form of hindsight, since a pre-split volume figure is rescaled by a split that had not yet been announced.

## What "as of" means on this site

The practical expression of the rule is the `asOf` parameter threaded through the pipeline. Fundamental extraction takes it and drops every fact filed later. The earnings-drift factor takes it and computes days-since-filing from it. The universe filters use price history up to and including that date and no further.

The [performance audit](/performance/) applies the same discipline at the other end of the trade. A pick published from a session's close is not assumed to be bought at that close — it is marked filled at the **next session's average of open and close**, and only if that price falls inside the published entry zone. Assuming a fill at the close the ranking was computed from would be look-ahead bias in its purest form: buying at a price that already contains the information used to select the stock.

Every published pick is written to an append-only ledger at publication time with the date, all factor values, entry zone, stop, targets, maximum holding period, and the exact code commit that produced it. The ledger lives in git, so every historical version is publicly diffable. That is not a courtesy — it is the only way a claim about a past prediction can be checked, because a prediction that can be edited after the outcome is not a prediction.

## The part this does not solve

Being scrupulous about dates removes one specific bias. It does not make a backtest true.

The larger problem is that the search space is enormous. Four horizons, dozens of factors, two markets, and any number of plausible parameter values gives a great many combinations, and evaluating enough of them will produce something that looks excellent in-sample by chance alone. The literature on backtest overfitting is direct about this: the number of configurations tried is itself a parameter, and reporting the best one without reporting how many were tried is close to meaningless.

StockPulse's answer is to avoid the optimisation rather than to correct for it. The weights are reasoned from published literature rather than tuned on this data. That is a genuine trade — it means nobody has demonstrated that 0.30 on relative volume is better than 0.25 — and the methodology's [known limitations](/methodology/) state it plainly.

The other half of the answer is forward-only evidence. The [performance page](/performance/) reports what happened to picks published *before* the outcome was known, net of 10 basis points of commission per side plus slippage of 5% of the day's ATR, against a random-selection control drawn from the same universe on the same dates, and against a buy-and-hold of the relevant benchmark. Sample-size warnings stay up until a horizon has at least 30 closed positions. That accumulates slowly and it is the only kind of evidence that a date filter cannot fake.

---

*Related: [the four traps in SEC XBRL data](/blog/sec-xbrl-four-traps/), [how the earnings-drift factor uses the filed date](/blog/post-earnings-drift/), and [why an honest audit looks worse](/blog/honest-performance-audit/).*
