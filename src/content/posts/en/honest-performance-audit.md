---
title: "Why an Honest Performance Audit Looks Worse"
description: "Survivorship bias, no-fill rates and intrabar ambiguity all push reported results in the same direction: up. StockPulse resolves each of them the unflattering way. Here is every convention, why it was chosen, and what it does to the numbers."
seoTitle: "Why an Honest Performance Audit Looks Worse"
lang: en
translationKey: "performance-audit"
publishedAt: 2026-08-13
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §9 — performance audit"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "StockPulse performance page"
    url: "https://mudlbum.github.io/stockpulse/performance/"
  - label: "Shumway, T. (1997), The Delisting Bias in CRSP Data, Journal of Finance 52(1)"
    url: "https://www.jstor.org/stable/2329566"
category: methodology
tags: ["performance", "survivorship-bias", "backtesting", "audit", "costs"]
tickers: []
draft: false
featured: true
---

Every convention in a performance calculation has a version that flatters and a version that does not, and the flattering choices are individually defensible. Stacked together they produce the results that make screening sites look impressive. This article lists every convention in the [StockPulse audit](/performance/), which way each one was resolved, and roughly what it costs the printed number.

## The general problem

Measurement error in performance reporting is not symmetric. Nearly every ambiguity in a backtest has an optimistic resolution and a pessimistic one, and the optimistic resolutions are the natural defaults: assume the fill happened, assume the target was reached before the stop, use today's list of companies, ignore the picks that never became positions.

None of those is fraud. Each is a small convenience. Together they can move a reported win rate by twenty points, which is the difference between a strategy worth studying and one worth ignoring.

The design rule here is simple: where end-of-day data cannot resolve an ambiguity, resolve it against the strategy.

## Convention 1 — the fill

**The flattering version:** a pick published from Tuesday's close is bought at Tuesday's close.

That is circular. The ranking was computed *from* that close. Buying at it means buying at a price that already contains the information used to select the stock — the purest form of [look-ahead bias](/blog/look-ahead-bias-point-in-time/).

**What the audit does:** a position is marked filled at the **next session's average of open and close**, `(O + C) / 2`, and only if that price falls inside the published entry zone. Otherwise the pick is recorded as **NO FILL** and excluded from returns entirely.

The entry zone for a 1–5 day pick is `close − 0.25×ATR` to `close + 0.40×ATR`. A stock that gaps up two ATRs overnight produces no fill — and those are disproportionately the picks that went on to work. The no-fill rule systematically removes some of the best outcomes from the reported set, which is exactly why it exists: those were returns the published entry rule could not have captured.

**Published alongside the results:** the count of picks that were never filled. A reader can see how much of the theoretical performance was unreachable, which is a number most sites do not compute at all.

## Convention 2 — intrabar ambiguity

**The flattering version:** if a session's range contains both the stop and the target, assume the target came first.

Daily bars cannot order intraday events. A session with a low below the stop and a high above the target is genuinely ambiguous from end-of-day data.

**What the audit does:** the stop wins. Every time.

This is not a claim about which is more likely. It is a rule chosen because assuming the favourable ordering is precisely the optimism that makes backtests untrue, and because a systematically conservative rule produces a floor rather than an estimate.

## Convention 3 — costs

**The flattering version:** report gross returns, or subtract a nominal commission.

**What the audit charges on every round trip:**

| Cost | Amount |
| --- | --- |
| Commission and spread | 10 basis points per side, 20 bps round trip |
| Slippage | 5% of the session's ATR, added to the entry price and subtracted from the exit price |
| Korean securities transaction tax | 0.18% on the sale |

The slippage term is the one that matters most and it is the one most often omitted. It is ATR-scaled rather than a fixed percentage for the same reason [stops are ATR-scaled](/blog/atr-stops/): a fixed 5 basis points of slippage is generous for a liquid large-cap and fantasy for a volatile mid-cap. On a stock with an ATR of 3% of price, this charges roughly 15 basis points each way — 30 bps round trip, on top of the commission.

For a five-day holding period, total costs of roughly 50 basis points against a base target of 1.8 ATRs is not a rounding error. It is a meaningful share of the outcome, and reporting gross returns on a five-day strategy is close to reporting nothing.

## Convention 4 — the universe

**The flattering version:** build the universe from today's listed companies and run history through it.

This is survivorship bias and it is the most-discussed failure in backtesting for good reason. Companies that were delisted, acquired at a discount, or went to zero are simply absent. Shumway's 1997 work on the delisting bias in the standard academic price database found that even careful research databases had material gaps in delisting returns, and the effect runs in one direction.

**What the audit does:** it does not backtest at all. Every published pick is written to an **append-only ledger at publication time** with the date, ticker, horizon, rank, score, every factor value, entry zone, stop, targets, maximum holding period, and the exact code commit that produced it. The audit then walks that ledger forward.

A ledger cannot have survivorship bias in its picks, because the picks were recorded before the outcome. If a company was delisted three weeks after being published, the entry is still there. Nothing is removed retroactively — a pick published in error is marked `void` with a stated reason and still shown.

The ledger lives in git, so every historical version is publicly diffable. The methodology version that produced each pick is recorded with it, so a change to the formula cannot silently rewrite past results.

The universe *construction* is a different matter and does still involve today's data in one respect: the eligibility filters are applied to the price store as it exists, and a company that has since delisted has no ongoing price history. This affects which names could have been picked in a historical replay, not what happened to the ones that were.

## Convention 5 — the comparison

**The flattering version:** report a win rate.

A win rate is close to meaningless without two comparisons, and in a rising market it is close to meaningless with them.

**What the audit publishes:**

- **A random-selection control.** Random picks drawn from the same universe on the same dates, with a fixed seed so the control is reproducible on every replay. If the strategy's win rate is 62% and random selection over the same days produced 60%, the strategy has demonstrated approximately nothing, and the number should be visible next to it rather than left for the reader to guess at.
- **Excess return against buy-and-hold** of SPY for US picks and KOSPI for Korean ones, over the same holding periods. In a market that rose 20%, a long-only strategy posting 18% underperformed.
- **The full distribution of returns**, not the mean and median alone. A 90% win rate accompanied by a single −60% outcome is a losing arrangement, and only the distribution shows it.
- **Maximum drawdown** of the equal-weight portfolio of all open picks.
- **Actual versus intended holding period**, which reveals whether positions are being closed by their rules or by the maximum-hold backstop.
- **Hit rate by regime state**, so a reader can see whether the results came from a single favourable stretch. The [regime multiplier article](/blog/market-regime/) covers what those states mean.

## Convention 6 — sample size

**The flattering version:** report the numbers and let the reader judge.

**What the site does:** display a sample-size warning on any horizon with fewer than 30 closed positions, and keep it displayed.

The long-horizon boards will carry that warning for years. The 1–2 year board has a maximum holding period of 504 trading sessions; the 5–10 year board's is 2,520. Neither can accumulate 30 closed positions quickly, and there is no honest way to shortcut it. That is the actual state of the evidence, not a defect in the presentation, and filling the gap with a backtest would defeat the purpose of having a ledger.

## What this adds up to

Take a hypothetical set of 100 ultra-short picks and apply the conventions in order. Thirty produce no fill because the next session opened outside the entry zone — and because gaps run in the direction of the ranking, those thirty include several of the largest theoretical gains. Of the 70 fills, some number of sessions touched both the stop and the target, and every one of those is recorded as a stop. Every remaining position pays roughly 50 basis points in costs. The resulting win rate is then printed next to a random control and a benchmark return.

The number that comes out the other end is materially lower than the same picks would produce under the flattering conventions. That is the point of the exercise. A performance page exists to be checked, and a page reporting numbers that could not be achieved by anyone following the published rules is not being checked — it is being advertised.

None of this makes the underlying rule set good. It makes the reported evidence about the rule set worth reading, which is a prerequisite rather than an achievement. And it is why the [disclaimer](/disclaimer/) says what it says: these are screen outputs from a published rule set, not personalised advice, and past results — honest ones included — do not establish future ones.

---

*Related: [look-ahead bias and the filed date](/blog/look-ahead-bias-point-in-time/), [how ATR sets the levels the audit tests against](/blog/atr-stops/), and [why the long boards publish no stop](/blog/no-price-stop-long-horizon/).*
