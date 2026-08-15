---
title: "Why the Long-Horizon Boards Publish No Price Stop"
description: "A 20% drawdown is an ordinary event inside a two-year holding period. Publishing a price stop on a fundamental thesis converts a judgement about a business into a coin flip on volatility. What StockPulse publishes instead, and what that costs."
lang: en
translationKey: "thesis-invalidation"
publishedAt: 2026-07-14
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §5.4 and §6.4 — long-horizon trade parameters"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "StockPulse performance audit — exit rules"
    url: "https://mudlbum.github.io/stockpulse/performance/"
category: methodology
tags: ["risk", "long-term", "exit-rules", "thesis"]
tickers: []
draft: false
featured: false
---

The 1–5 day and 1–2 month boards on this site publish a stop price on every row. The 1–2 year and 5–10 year boards publish none. That asymmetry gets asked about, usually in the form of "isn't a stop always good risk management?" — and the honest answer is no, not at every horizon, and publishing one here would make the lists worse rather than safer.

## The arithmetic problem

Every stop the site prints on a short-horizon row is a multiple of 14-session Average True Range. [That works](/blog/atr-stops/) because 14 sessions of realised movement is a reasonable description of what a stock does over the next five.

Now extend the same logic to 504 trading sessions, which is the maximum holding period on the long-term board. A stock with an ATR of 1.5% of price has a rough annualised volatility in the region of 24%. Over two years, movements of 20–30% peak-to-trough are not tail events; they are what the middle of the distribution looks like. Placing a stop at 2.5 ATRs — about 3.75% — would close essentially every position within weeks. Widening it to something horizon-appropriate, say 35%, produces a level so far away that it never binds before the fundamental review triggers do.

There is no multiple that works. Small numbers exit on noise; large numbers are decorative. The parameter has no useful setting because the input — short-window realised volatility — is not the right measurement for the question.

## The deeper problem: what a stop is actually for

A stop on a five-day idea is coherent because the *idea itself* is about price. The ultra-short model ranks on relative volume, gap quality, volatility expansion, trend position and headline sentiment. If price moves against the entry, the thing being measured has been contradicted. The stop is the thesis.

A stop on a two-year idea is incoherent, because the idea is not about price. The [long-term model](/methodology/) ranks on growth quality, return on invested capital, cash generation, valuation and the Piotroski F-score. None of those is invalidated by the share price going down. In fact several of them improve: falling price with unchanged free cash flow raises the free-cash-flow yield, which raises the valuation factor, which — if the business is unchanged — makes the stock rank *higher*. A price stop on that model does not enforce discipline; it enforces the opposite, systematically selling exactly the positions its own logic says are getting more attractive.

That is the real argument. A price stop at a long horizon does not merely fail to help. It fights the model.

## What is published instead

Each long-horizon row carries a set of **thesis-invalidation triggers** — the fundamental conditions that would end the position. These are generated with the pick and stored in the ledger alongside it, so they cannot be revised after the fact.

For the 1–2 year board:

- Return on invested capital declines for two consecutive quarters
- Free cash flow turns negative on a trailing-twelve-month basis
- Revenue growth falls below zero year-over-year for two quarters

For the 5–10 year board:

- Return on invested capital declines for three consecutive fiscal years
- Gross margin falls below its 10-year 20th percentile
- Net debt to EBITDA rises above 3.5×
- Share count grows more than 2% per year for three consecutive years

The tolerances scale with the horizon, which is the point. Two quarters of ROIC decline is a meaningful warning inside a two-year window. Over ten years it is a cyclical dip, so the ultra-long version asks for three consecutive *years* before treating the compounding case as broken.

The share-count trigger is the one that most often surprises people. A business can meet every operational test — growing revenue, stable margin, positive cash flow — and still deliver nothing per share if the count grows 3% a year for a decade. Over ten years that is a 34% increase in the denominator. The ultra-long model already penalises this in scoring, through a shareholder-yield term that computes net buyback yield from the actual share count on the balance sheet rather than from announced programmes; buybacks that only offset stock-based compensation net to approximately zero, which is the correct answer. The invalidation trigger makes the same test an exit condition.

## Targets without stops

Removing the stop does not mean removing the discipline of writing the exit down in advance. Both long boards publish a target structure; neither derives it from ATR.

The 1–2 year board publishes a **fair-value band**. It takes the company's realised growth rate — clipped to a range of −10% to +35% so that a single explosive or collapsing year cannot drive the whole projection — compounds it over two years, and applies three multiples to today's EV/EBIT: 0.75× (multiple compression), 1.00× (flat), and 1.35× (modest expansion). Every one of those assumptions is displayed on the card. It is not a forecast. It is a stated scenario, and the reason to show the assumptions is so a reader can disagree with a specific one.

The 5–10 year board publishes a **compounding scenario band** instead of a price target, because a ten-year price target is a fiction. It compounds a base annual rate over seven years, with the base derived from reinvestment rate times ROIC, clipped into a 2%–20% range, and conservative and optimistic scenarios at roughly 0.55× and 1.5× that base (capped at 28%). Again the point is not the number; it is that the assumptions are visible and fixed at publication.

## What this costs, stated plainly

Publishing no stop has real consequences and pretending otherwise would undermine the whole exercise.

**Individual positions can lose a great deal.** With no price-based exit, a long-horizon pick that deteriorates slowly can run to a very large loss before a fundamental trigger fires, because quarterly statements arrive quarterly. A company can lose half its market value in the four months between filings while every trigger remains technically unmet.

**The audit will show this.** The [performance page](/performance/) publishes the full distribution of returns, not just the mean and win rate, precisely so that a 90% win rate accompanied by one −60% outcome is visible as the losing arrangement it is. It also publishes maximum drawdown of the equal-weight portfolio of open picks. On the long boards, those numbers will be uglier than the average.

**The evidence base will take years.** Sample-size warnings stay on any horizon with fewer than 30 closed positions. A board whose maximum holding period is 504 sessions cannot accumulate 30 closed positions quickly, and the 2,520-session board will carry that warning for a very long time. This is the honest state of affairs rather than a defect, and the page says so instead of filling the gap with a backtest.

**Some readers need a stop anyway.** Position size, tax situation and the ability to sit through a 40% drawdown without selling are personal and unknowable from here. A reader who cannot hold through that should not treat a no-stop row as licence to try. The site publishes research about a rule set; it is not personalised financial advice, and the [disclaimer](/disclaimer/) is not boilerplate on this point.

## The general principle

The exit rule has to be made of the same material as the entry rule. If the reason for a position is a five-day volatility and volume condition, the exit belongs on a price level. If the reason is a decade of returns on capital, the exit belongs on returns on capital. Mixing them — entering on fundamentals and exiting on a price move — is not conservative. It is a category error that reliably converts good fundamental work into poor results, and it is common enough that it deserved to be written down as a rule rather than left to judgement.

---

*Related: [how ATR stops work on the short boards](/blog/atr-stops/), [ROIC and the invalidation triggers built on it](/blog/roic-vs-roe/), and [what the performance audit records](/blog/honest-performance-audit/).*
