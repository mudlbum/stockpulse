---
title: "Post-Earnings Drift, and What It Stands In For"
description: "The mid-term board has no analyst estimates because no keyless source provides them. It uses the market's own reaction to the last filing instead. That is a real downgrade from revision momentum — here is what it measures and where it fails."
seoTitle: "Post-Earnings Drift and the Missing Estimates"
lang: en
translationKey: "earnings-drift"
publishedAt: 2026-07-21
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §4.1(b) and §4.3 — EarningsDrift"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Ball & Brown (1968), An Empirical Evaluation of Accounting Income Numbers, Journal of Accounting Research 6(2)"
    url: "https://www.jstor.org/stable/2490232"
  - label: "Bernard & Thomas (1989), Post-Earnings-Announcement Drift: Delayed Price Response or Risk Premium?, Journal of Accounting Research 27"
    url: "https://www.jstor.org/stable/2491062"
  - label: "SEC EDGAR XBRL APIs"
    url: "https://www.sec.gov/search-filings/edgar-application-programming-interfaces"
category: methodology
tags: ["pead", "earnings", "mid-term", "sec-edgar"]
tickers: []
draft: false
featured: false
---

The original design for the [1–2 month board](/methodology/) called for analyst EPS revision momentum — the rate at which sell-side estimates are being marked up or down. It is a well-supported input and it is also completely unavailable under this site's constraint that every data source must be keyless. What replaced it is the market's own reaction to the last filing, which is a weaker but honest substitute. This article explains the substitution, the calculation as implemented, and the four ways it goes wrong.

## The effect being used

Post-earnings-announcement drift is one of the oldest documented anomalies in the empirical accounting literature. Ball and Brown observed in 1968 that prices continued to move in the direction of an earnings surprise well after the announcement, rather than adjusting at once. Bernard and Thomas established through the late 1980s that the drift persisted for roughly a quarter and was not obviously explained by risk compensation.

The practical statement is narrow: a company whose earnings news moved its stock up relative to peers has, historically, tended to keep drifting slightly in that direction over the following weeks. It is a tendency measured across large samples, not a property of any individual company, and — as the section on limitations below says — there is good reason to think the effect has weakened since it was first described.

## Why not use analyst estimates

Estimate revisions and PEAD are cousins. Both are ways of asking "has the market's view of this company's earnings power been revised upward recently?" Revisions capture the professional forecast changing; drift captures the price reacting.

The problem is purely one of access. Every consensus estimate feed is a commercial product. Alpha Vantage, Finnhub, Polygon and FMP all supply them and all require a key. The keyless constraint that shapes this whole project — no accounts, no monthly bill, everything reproducible by a reader — rules them out, and the [data sources documentation](/methodology/) lists them explicitly as good options if that constraint is ever relaxed.

Faking it was the alternative and was rejected. A "revisions" factor synthesised from something that is not revisions would be worse than an honest gap, because the label would carry authority the number does not deserve. So the mid-term board substitutes drift and labels it as a downgrade on the page.

## The calculation

```
car3       = Σ (stock_return − sector_return) over [filed_date, filed_date + 2]
days_since = as_of − filed_date

EarningsDrift = car3 × exp(−days_since / 45)
```

The factor is null if the last filing is more than 90 days old, and carries a weight of 0.20 in the mid-term model.

Three implementation details are worth naming because they change what the number means.

**The window is anchored on the SEC `filed` date, not the period end.** The pipeline locates the first price bar on or after the filing date, then measures the return from the close *before* that bar to the close two sessions after it. This is a point-in-time discipline, not a convenience: a quarter ending 30 June and filed 5 August must be invisible to a score dated in July. [The look-ahead article](/blog/look-ahead-bias-point-in-time/) covers why that single rule separates a backtest from a fantasy.

**The return is abnormal, not raw.** The sector composite's return over the same window is subtracted. Without that subtraction the factor would mostly measure the market — a company that filed during a strong week would rank highly for having filed during a strong week.

**The decay is exponential with a 45-day constant.** A filing two days ago carries `exp(−2/45) ≈ 0.96` of its measured reaction. One 45 days ago carries `exp(−1) ≈ 0.37`. One 89 days ago carries `exp(−89/45) ≈ 0.14`, just before it drops out entirely at 90.

A worked example. Suppose a company filed 20 days ago. Over the three-session window around the filing its stock returned +8.4% while its sector composite returned +1.1%. The abnormal return is +7.3 percentage points. The decayed factor value is `0.073 × exp(−20/45) = 0.073 × 0.641 = 0.047`. That raw value is then winsorized, [z-scored across the universe](/blog/why-weighted-sums-fail/) and weighted at 0.20 alongside trend alignment, fundamental momentum, money flow and sector strength.

## What sits next to it

Drift is not carrying the mid-term board alone. It is 0.20 of five factors, and the one it works most closely with is **fundamental momentum** (weight 0.22), which reads the reported statements directly rather than the price reaction to them: year-over-year revenue growth, the *acceleration* in that growth, and the change in operating margin against the same quarter a year earlier.

The acceleration term is the interesting one. The level of a company's growth is largely reflected in its price already; what re-rates a business is the second derivative. A company going from 8% to 14% growth is a different object from one going from 22% to 14%, and only the acceleration term distinguishes them.

The board also carries a hard quality gate: stocks in the bottom of the Piotroski F-score distribution are excluded regardless of score, because [momentum applied to accounting-poor companies](/blog/piotroski-f-score/) produces the worst available portfolio. And no more than three names per sector reach the published top ten, so a single sector's earnings season cannot take over the board.

## Four ways this factor misleads

**The filing date is not the news date.** In the United States, companies typically release earnings by press release and 8-K, hold a call, and file the 10-Q days later. The largest price reaction usually happens on the press-release day. Because the factor anchors on the filing entries the pipeline reads from the XBRL company-facts endpoint, its three-session window can sit partly or wholly *after* the move it was meant to capture. This is the single largest weakness in the factor as built, and no amount of tuning the decay constant addresses it.

**A three-session abnormal return contains more than earnings.** Anything else that happened that week — a sector rotation, a guidance change from a competitor, an index event — lands inside the window and is attributed to the filing.

**The effect is not what it was.** PEAD was documented in an era of slower information distribution and higher trading costs. The reasonable prior is that some of it has been arbitraged away. The 0.20 weight reflects that scepticism rather than the effect sizes in the original papers.

**Drift is not revision momentum.** They answer related questions but not the same one. A stock can drift on a reaction that professional forecasters then unwind. Substituting one for the other is a real downgrade and the methodology's [known limitations](/methodology/) list it as such. If a DART or estimates key is ever configured, a true revisions factor drops into this slot and this factor moves aside.

## Why publish the weakness

It would be easy to describe this factor as "earnings momentum" and let the reader assume it is built on estimates. The reason not to is that the entire claim of this site rests on the published rules matching the code that runs, and a reader who checks should find what they were told. A factor described accurately as a second-best substitute, with its failure modes listed, is more useful than one described impressively. It also makes the [performance audit](/blog/honest-performance-audit/) interpretable: when the mid-term board underperforms, this is one of the places to look first.

---

*Related: [the Piotroski gate on this board](/blog/piotroski-f-score/), [why the filed date matters](/blog/look-ahead-bias-point-in-time/), and [what XBRL does and does not give you](/blog/sec-xbrl-four-traps/).*
