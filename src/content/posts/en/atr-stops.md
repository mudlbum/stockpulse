---
title: "Reading an ATR Stop: Why One Percentage Fits Nothing"
description: "A 5% stop is four ATRs away for a regulated utility and inside a single ordinary session for a clinical-stage biotech. StockPulse scales every published level to the stock's own volatility. Here is the calculation and where it breaks."
lang: en
translationKey: "atr-stops"
publishedAt: 2026-06-25
author: editorial
reviewedBy: "StockPulse Editorial"
aiAssisted: true
aiNote: "Drafted with AI assistance and reviewed against the published methodology and pipeline source before publication."
sources:
  - label: "StockPulse methodology, §3.4 — trade parameters"
    url: "https://mudlbum.github.io/stockpulse/methodology/"
  - label: "Wilder, J. W. (1978), New Concepts in Technical Trading Systems"
  - label: "StockPulse performance audit — exit convention and costs"
    url: "https://mudlbum.github.io/stockpulse/performance/"
category: education
tags: ["atr", "risk", "stops", "volatility", "position-sizing"]
tickers: []
draft: false
featured: false
---

Every ultra-short and mid-term row on this site publishes a stop price, and none of them is a percentage. They are all multiples of Average True Range, which is the only way a single rule can produce a sensible level for two stocks whose ordinary daily movement differs by a factor of five. This article walks through the calculation as implemented, shows what it produces for two very different companies, and is candid about the three situations where an ATR stop does not protect you.

## What ATR is measuring

True Range for a session is the largest of three distances: the session's own high-to-low range, the distance from the high to the previous close, and the distance from the low to the previous close. Including the previous close is what makes it capture gaps — a stock that opens 6% lower and then trades in a narrow band all day has a small high-low range but a large true range, which is the correct description of what happened.

ATR is a smoothed average of true range over 14 sessions. StockPulse uses Wilder's smoothing, which advances the running value as `(previous × 13 + today's TR) / 14`.

That constant is worth pausing on. Wilder's smoothing uses `1/period`; a conventional exponential moving average uses `2/(period + 1)`. Substituting the EMA constant produces an ATR roughly twice as responsive as every published reference — and because every stop, entry band and target on the site is an ATR multiple, it would silently tighten every level the site prints without anything in the output looking wrong. The pipeline source carries a comment saying exactly this, which is the kind of thing worth checking in any tool that quotes you an ATR.

## The utility and the biotech

Two hypothetical companies, both trading at \$70.00.

| | Regulated utility | Clinical-stage biotech |
| --- | --- | --- |
| Close | \$70.00 | \$70.00 |
| ATR(14) | \$0.85 | \$4.20 |
| ATR as % of price | 1.2% | 6.0% |

Now apply a fixed 5% stop, at \$66.50 for both.

For the utility, \$66.50 is `3.5 / 0.85 = 4.1 ATRs` below the close. That stop will essentially never be reached by ordinary movement — which sounds safe until you notice what it implies. If it does trigger, something structural has happened, and by the time price has travelled four ATRs the position has lost 5% on a stock whose entire annual range might be 25%. The stop is not protecting the position; it is a very expensive alarm.

For the biotech, \$66.50 is `3.5 / 4.20 = 0.83 ATRs` below the close. That is *inside a single typical session's movement*. The position will be closed by noise, on average, more often than by anything informative. Repeat that a hundred times and the strategy is a machine for paying costs.

Now the ATR rule the site actually publishes for the 1–5 day board:

```
stop = min(close − 1.5×ATR, today's low − 0.1×ATR)
```

Utility: `70 − 1.5 × 0.85 = $68.73`, or −1.8%.
Biotech: `70 − 1.5 × 4.20 = $63.70`, or −9.0%.

Same rule, same 1.5 ATRs of room, wildly different percentages — because the percentages were never the thing being held constant. What is held constant is how much ordinary movement the position is allowed to absorb before the idea is treated as wrong.

Note the `min`. Two candidate stops are computed and the *lower* one is used. When the current session was unusually wide, `today's low − 0.1×ATR` sits below the 1.5-ATR level, and that lower level wins. This stops the rule from placing a stop inside the range of the very session that generated the ranking, which would force an immediate exit on any pullback.

## The rest of the ladder

Every published level on the short-horizon boards is derived the same way:

| Level | Ultra short (1–5D) | Mid term (1–2M) |
| --- | --- | --- |
| Entry zone | `close − 0.25×ATR` to `close + 0.40×ATR` | `close − 0.6×ATR` to `close + 0.3×ATR` |
| Stop | `min(close − 1.5×ATR, low − 0.1×ATR)` | `close − 2.5×ATR` |
| Target — conservative | `close + 1.0×ATR` | `close + 2.5×ATR` |
| Target — base | `close + 1.8×ATR` | `close + 4.5×ATR` |
| Target — bull | `close + 3.0×ATR` | `close + 7.0×ATR` |
| Max holding | 5 sessions | 45 sessions |

The asymmetric entry bands encode a small piece of intent. The ultra-short band extends further above the close than below it, because a short-horizon idea that opens strong is still the idea; one that has to be chased down 0.6 ATRs probably is not. The mid-term band is the reverse — more room below, less above — because a 1–2 month entry can afford to wait for a better price and is not trying to catch a move that is already running.

Alongside the levels, each row carries a **risk gauge** of 1 to 5: the quintile of `ATR / close` within that day's universe, 1 being the calmest. It exists so the two stocks above are visibly different objects on the page even before you read the stop.

## What this means for position size

The point of ATR levels is not that they are better prices. It is that they make risk comparable across names, which is the thing that lets you size sensibly.

If you are willing to risk a fixed amount per idea — say 0.5% of a portfolio — then the number of shares follows from the distance to the stop, not from the price of the stock:

```
shares = (portfolio × risk_fraction) / (entry − stop)
```

On a \$100,000 portfolio at 0.5%, that is \$500 of risk. The utility, with \$1.27 of stop distance, supports 393 shares — about \$27,500 of exposure. The biotech, with \$6.30 of stop distance, supports 79 shares — about \$5,500. Equal risk, very unequal position sizes, which is the correct outcome and the opposite of what equal dollar allocation produces.

This site does not tell anyone what to hold or how much, and none of the above is a recommendation. But the levels are only interpretable if you know what they are for, and this is what they are for.

## Three places an ATR stop does not save you

**It is backward-looking.** ATR is 14 sessions of realised movement. A stock whose ATR has been compressing into an event — an earnings date, a regulatory decision, an index review — has a low ATR *precisely because* the market is waiting, and a 1.5-ATR stop calibrated to that quiet is far too tight for the day the wait ends. The volatility-expansion factor in the ultra-short model partly addresses this by multiplying a breakout by the ratio of current ATR to its 100-session median, so a breakout on *contracting* ATR is scored down. That helps the ranking. It does not widen the stop.

**Gaps go through stops.** A stop is a price level, not an executed trade. If a stock closes at \$70 and opens at \$58 on an overnight disclosure, the stop at \$63.70 was never a tradeable price. This is not a defect in the ATR method; it is a property of markets. It is also why the [performance audit](/blog/honest-performance-audit/) charges slippage of 5% of the day's ATR on both entry and exit, on top of 10 basis points of commission and spread per side, and adds Korea's 0.18% securities transaction tax on the sale.

**End-of-day data cannot order intraday events.** When a session's range contains both the stop and the base target, the audit records the stop. Every time. There is no way to know from daily bars which came first, and assuming the target is exactly the optimism that makes backtests untrue.

## And why the long-horizon boards have no stop at all

The 1–2 year and 5–10 year boards publish entry zones and no stop price. That is deliberate rather than an omission, and it follows from the same logic as everything above: a level derived from 14 sessions of volatility has no meaning over a 504-session holding period. A 20% drawdown is an ordinary event inside a two-year thesis, and a price-based stop converts a judgement about a business into a coin flip on volatility.

What those boards publish instead is a set of thesis-invalidation triggers — the specific *fundamental* conditions that would end the position. [That argument gets its own article.](/blog/no-price-stop-long-horizon/)

---

*Related: [what relative volume measures](/blog/relative-volume-median/), [why the long boards publish no stop](/blog/no-price-stop-long-horizon/), and [how fills, costs and exits are recorded](/blog/honest-performance-audit/).*
