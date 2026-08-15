# StockPulse Ranking Methodology

**Version 1.0 — 2026-08-15**

This document is the complete specification for how StockPulse produces its four
daily leaderboards. It is published verbatim on the site at `/methodology/` so
that every number on the site can be traced back to a rule written down in
advance.

---

## 0. Design principles

Five rules govern everything below. They exist because the failure modes of a
public stock-ranking site are well known and all of them are self-inflicted.

**P1 — Every factor is scored cross-sectionally, never absolutely.**
"RVOL above 2.5" is not a score, it is a filter. A raw RVOL of 2.5 and a
sentiment of +0.4 cannot be added together — they have different units,
different scales, and different distributions. Every factor is converted to a
*cross-sectional z-score within the universe on that day* before any weighting
happens. This is the single most important correction to a naive weighted-sum
scoring scheme.

**P2 — Point-in-time only. No look-ahead.**
A score for date *D* may only use data whose publication timestamp is `<= D`.
Fundamental data is keyed on the SEC `filed` date, not the `end` date of the
fiscal period. A company whose Q2 ended 30 June but filed 5 August contributes
nothing to scores dated before 5 August. Violating this is the most common way
backtests produce fantasy returns.

**P3 — The exit rule is written before the entry.**
Every recommendation is published with a mechanical exit: a stop level, a target
band, and a maximum holding period. The performance audit closes positions on
those rules only. There is no discretion, no "we were early", no quiet removal.

**P4 — Data completeness gates inclusion.**
A stock missing more than one of its horizon's factor inputs is not ranked, at
any score. Filling gaps with the mean silently manufactures rank.

**P5 — Screen output, not prediction.**
The lists say "these ranked highest on this rule set today." They do not say
"these will go up." That distinction is enforced in the copy on every page, and
it is also just accurate.

---

## 1. Universe construction

Ranking the whole market guarantees that the top of every momentum list is
illiquid microcap noise, because small denominators mechanically produce large
ratios. The universe is filtered first, every day, before any scoring.

### 1.1 United States

Source of record: SEC `company_tickers.json` for the ticker↔CIK map; price
history from the local committed store.

| Filter | Threshold | Why |
| --- | --- | --- |
| Listing | NYSE, Nasdaq, NYSE American common stock | Excludes OTC, warrants, units, rights |
| Price | Close ≥ $5.00 | Below $5 the tick size dominates; also the SHO threshold band |
| Market cap | ≥ $300M | Removes shells and post-reverse-split husks |
| Median 20-day dollar volume | ≥ $5,000,000 | A $50k position must not be more than ~1% of a day's volume |
| Price history | ≥ 250 trading days | Needed for 200DMA, ATR percentile, annual ranges |
| Exclusions | SPACs pre-merger, ADR ratio changes in the last 20d, stocks with a split/spin effective in the last 5d | Corporate actions corrupt every ratio simultaneously |

Result: roughly 1,400–1,800 names. From this, a **liquid core** of the top 600
by median dollar volume is what the ultra-short model ranks, because a 1–5 day
idea you cannot exit is not an idea.

### 1.2 South Korea

Source of record: the daily KRX listing snapshot (see `docs/DATA_SOURCES.md`).

| Filter | Threshold | Why |
| --- | --- | --- |
| Market | KOSPI + KOSDAQ (KONEX excluded) | KONEX is too illiquid to be tradeable |
| Price | Close ≥ ₩1,000 | Korea's 관리종목 / 정리매매 zone |
| Market cap | ≥ ₩300,000M (₩3,000억) | ≈ USD 220M, comparable to the US floor |
| Median 20-day traded value | ≥ ₩2,000M | Same 1%-of-volume logic |
| Administrative flags | Exclude 관리종목, 투자경고, 투자위험, 거래정지 | KRX has already flagged these as hazardous |
| Price history | ≥ 250 trading days | Same as US |

**A note on Korean price limits.** KRX enforces a ±30% daily price limit. A stock
that closes limit-up (상한가) has an unknown "true" price — the close is censored,
not discovered. Any stock closing at or within 0.5% of the limit is **excluded
from that day's ultra-short ranking** and flagged in the data. Ranking a
limit-up stock as a buy is recommending an entry that cannot be filled.

---

## 2. Factor normalization — the shared machinery

Every raw factor `x` goes through the same four steps before it is used.

**Step 1 — Winsorize at the 2nd and 98th percentile of the day's universe.**
One stock with an RVOL of 400 (a biotech with binary trial data) would otherwise
own the entire momentum weight. Winsorizing keeps its rank without letting its
magnitude dominate.

**Step 2 — Transform for skew.** Ratio factors (RVOL, volume, market cap,
turnover) are log-transformed: `x' = ln(1 + x)`. Raw ratios are right-skewed and
z-scoring a skewed variable puts the mean somewhere no stock actually sits.

**Step 3 — Z-score within the peer group.**

```
z = (x' − median(x')) / (1.4826 × MAD(x'))
```

Median and MAD (median absolute deviation) rather than mean and standard
deviation, because a handful of extreme values distort the mean and inflate the
SD, which shrinks everyone else's z toward zero. The 1.4826 factor makes MAD a
consistent estimator of σ for normal data, so the resulting z is interpretable on
the usual scale.

The peer group depends on the factor:

- **Technical factors** (momentum, volume, volatility): the whole market's
  universe. Momentum is comparable across sectors.
- **Fundamental factors** (margins, ROIC, growth, valuation): **the sector**.
  A 42% gross margin is unremarkable for software and extraordinary for a
  grocer. Sector-neutral z-scoring is what makes the moat and value factors
  mean anything. Sectors with fewer than 8 members in the universe fall back to
  their parent sector group.

**Step 4 — Clip to [−3, +3]** and rescale to 0–100 for display:
`display = 50 + (z × 16.67)`.

**Missing data.** A missing factor yields `null`, never `0`. Zero is a real
z-score meaning "exactly typical" and is not the same as "unknown". A stock's
**completeness ratio** is the share of its horizon's factors that are non-null.
Below the threshold in §3–6, the stock is dropped. At or above it, the remaining
weights are renormalized to sum to 1 and the stock carries a visible
completeness badge.

---

## 3. Ultra Short Term — 1 to 5 days

### 3.1 What changed from the original spec and why

The original formula was RVOL 0.35 / pre-market gap 0.25 / news sentiment 0.25 /
ATR breakout 0.15. Four substantive changes:

**(a) Pre-market gap is not obtainable from any free, license-clean source.**
Every free pre-market feed is either a paid vendor's redistribution or a
scraped retail broker page. Rather than fake it, the gap factor is redefined on
data we actually have: the **overnight gap already realized** (previous close →
today's open) combined with **where the close sat inside the day's range**. This
is the same information one session later, which is the honest version of the
signal for an end-of-day publication cycle.

**(b) Gap magnitude is scored as a curve, not a ladder.** The original "gap
between +2% and +8%" is correct in spirit — small gaps carry no information and
huge gaps mean-revert — but a hard band throws away a stock at +8.1%. The gap
factor is a **tent function** peaking at +4% and decaying to zero at 0% and
+12%, with gaps above +15% scored *negative*. Large unexplained gaps are a
documented reversal signal, not a continuation one.

**(c) A crowding penalty is added.** Gap-up-on-volume-with-good-news is the most
crowded setup in retail trading, and stocks that have already run hard into the
signal are where the reversals concentrate. Any stock more than 2.5 ATRs above
its 20-day EMA receives a penalty proportional to the excess. This is the single
highest-value addition to this horizon.

**(d) FinBERT is replaced by a Loughran–McDonald lexicon score.** FinBERT is a
440MB transformer whose inference in CI costs minutes per run and whose outputs
cannot be reproduced from the published site. The **Loughran–McDonald financial
sentiment dictionary** is the standard reference in the accounting and finance
literature precisely because general-purpose sentiment lexicons misclassify
financial language ("liability", "tax", "crude" are not negative words in this
domain). It is deterministic, auditable, and runs in milliseconds. Trade-off:
it misses sarcasm and complex negation. Mitigated with an explicit negation
window and modifier handling (§3.3).

### 3.2 The formula

```
UltraShort = 0.30·z(RelativeVolume)
           + 0.20·z(GapQuality)
           + 0.20·z(NewsSentiment)
           + 0.15·z(VolatilityExpansion)
           + 0.15·z(TrendPosition)
           − CrowdingPenalty
           × RegimeMultiplier
```

Minimum completeness: **4 of 5** factors present.

### 3.3 Factor definitions

**RelativeVolume (weight 0.30)**

```
RVOL = today_volume / median(volume, prior 30 sessions, EXCLUDING today)
```

Median, not mean — a single earnings-day volume spike three weeks ago would
otherwise raise the denominator and hide today's genuine spike. Today's own bar
is excluded from the denominator; including it would let a large spike partly
inflate the very baseline it is being measured against. Log-transformed
before z-scoring. Filter: RVOL < 1.2 scores `null` (no unusual activity to
detect).

**GapQuality (weight 0.20)**

```
gap    = (open − prev_close) / prev_close
close_position = (close − low) / (high − low)     # 0 = closed on the low, 1 = on the high

tent(g) = 0                     if g <= 0 or g >= 0.12
        = g / 0.04              if 0 < g <= 0.04
        = (0.12 − g) / 0.08     if 0.04 < g < 0.12
        = −(g − 0.15) × 8       if g >= 0.15        # penalty for exhaustion gaps

GapQuality = tent(gap) × (0.4 + 0.6 × close_position)
```

The `close_position` multiplier is what separates a gap that held from a gap
that was sold into all day. A stock that gaps +4% and closes on its low is not
the same setup as one that gaps +4% and closes on its high, and the original
formula could not tell them apart.

**NewsSentiment (weight 0.20)**

For each headline mapped to the ticker in the last 48 hours:

```
raw   = (positive_terms − negative_terms) / sqrt(total_terms)
```

with the Loughran–McDonald word lists, and:

- a **negation window** of 3 tokens: `not`, `no`, `fails to`, `without`,
  `unlikely`, `denies` flip the polarity of the next sentiment term;
- **modifiers**: `strongly`, `significantly`, `sharply` scale by 1.5;
  `slightly`, `modestly` scale by 0.6;
- **source weighting**: a primary filing (8-K) counts 1.5×, a wire story 1.0×,
  an aggregator/opinion piece 0.5×;
- **recency decay**: `exp(−hours_ago / 18)`.

The ticker's score is the decay-weighted mean, clipped to [−1, +1]. A ticker
with zero mapped headlines scores `null`, not `0` — silence is not neutrality,
it is absence of evidence, and the completeness rule handles it.

*Known limitation, stated plainly:* headline-level sentiment is weakly
predictive at best and the effect decays within a day or two. It carries 0.20
here rather than the originally proposed 0.25 for that reason.

**VolatilityExpansion (weight 0.15)**

```
bb_upper  = SMA(close,20) + 2 × SD(close,20)
atr14     = Wilder ATR over 14 sessions
atr_ratio = atr14 / median(atr14, last 100 sessions)

VolExpansion = max(0, (close − bb_upper) / atr14) × min(atr_ratio, 2.5)
```

The `atr_ratio` term is what distinguishes a genuine volatility expansion from a
stock drifting above a band that has been quietly narrowing. A breakout on
*contracting* ATR is usually a false one.

**TrendPosition (weight 0.15)** — *new factor, not in the original spec.*

```
TrendPosition = 0.5 × sign(close > EMA20) × min(1, (close − EMA20) / (1.5 × atr14))
              + 0.3 × sign(EMA20 > EMA50)
              + 0.2 × percentile_rank(close, 252-session range)
```

Short-term momentum signals fire far more reliably when the underlying trend
agrees with them. Without this, the model buys bounces in downtrends, which is
where short-horizon momentum strategies do most of their damage.

**CrowdingPenalty (subtracted, uncapped downside)**

```
extension = (close − EMA20) / atr14
penalty   = 0                                if extension <= 2.5
          = 0.35 × (extension − 2.5)         if extension >  2.5

rsi_pen   = 0.25 if RSI(14) > 80 else 0
CrowdingPenalty = penalty + rsi_pen
```

**RegimeMultiplier (multiplies the whole score)**

```
breadth = share of universe with close > SMA200
index_ok = SPY (or KOSPI) close > its SMA200

RegimeMultiplier = 1.00   if index_ok and breadth >= 0.50
                 = 0.85   if index_ok and breadth <  0.50
                 = 0.70   if not index_ok and breadth >= 0.40
                 = 0.50   if not index_ok and breadth <  0.40
```

Long momentum in a tape below its 200DMA with deteriorating breadth is the
single most reliable way to lose money quickly. The multiplier does not change
the *ordering* of the list — it scales the scores, and the site displays the
regime state prominently so the reader sees when the whole board is being
published into a hostile tape. **In the two weakest regimes the site shows a
banner recommending reduced position sizing or no new ultra-short entries.**

### 3.4 Trade parameters

| Parameter | Rule |
| --- | --- |
| Entry zone | `[close − 0.25×ATR, close + 0.40×ATR]` |
| Stop loss | `min(close − 1.5×ATR, today's low − 0.1×ATR)` |
| Target — conservative | `close + 1.0×ATR` |
| Target — base | `close + 1.8×ATR` |
| Target — bull | `close + 3.0×ATR` |
| Max holding | 5 trading sessions, closed at the 5th close regardless |
| Risk gauge | Quintile of `ATR/close` within the universe, 1 = lowest |

ATR-based rather than percentage-based, because a fixed 5% stop is loose for a
utility and suicidally tight for a biotech. Every level scales with the stock's
own volatility.

---

## 4. Mid Term — 1 to 2 months

### 4.1 What changed and why

**(a) The "top 3 sectors by 20-day performance" rule is removed.** Sector
momentum at a 20-day lookback sits inside the documented short-term reversal
window; at 6–12 months it is a real effect. Confining the list to three sectors
also concentrates the entire leaderboard into one macro bet. Replaced with a
**continuous sector-strength factor at a 120-day lookback** at a reduced weight,
plus a hard **maximum of 3 names per sector** in the published top 10.

**(b) Analyst EPS revisions have no keyless source.** Substituted with two
things that are computable from SEC filings and are arguably closer to the
underlying cause anyway:

- **Earnings surprise drift** — the market's own reaction to the last earnings
  filing (3-day abnormal return around the `filed` date), which is a
  well-documented continuation signal (post-earnings-announcement drift);
- **Fundamental momentum** — the trend in reported YoY revenue and operating
  margin across the last four quarters.

This is an honest downgrade and is labelled as such on the site. If a DART or
estimates key is ever added, a true revisions factor drops into this slot.

**(c) OBV is replaced.** On-Balance Volume assigns the entire day's volume to
the direction of the close, which makes it extremely noisy. **Chaikin Money Flow**
weights volume by where the close sat within the day's range, which is what
"accumulation" is actually trying to measure.

**(d) A quality gate is added.** Momentum applied to junk produces the worst
possible portfolio. Stocks in the bottom quintile of the Piotroski F-score (§5)
are excluded from this horizon regardless of score.

### 4.2 The formula

```
MidTerm = 0.25·z(TrendAlignment)
        + 0.22·z(FundamentalMomentum)
        + 0.20·z(EarningsDrift)
        + 0.18·z(MoneyFlow)
        + 0.15·z(SectorStrength)
        × RegimeMultiplier
```

Minimum completeness: **4 of 5**. Hard gate: F-score ≥ 4.
Maximum 3 names per GICS sector in the published list.

### 4.3 Factor definitions

**TrendAlignment (0.25)**

```
0.40 × sign(EMA20 > EMA50)
+ 0.25 × sign(EMA50 > EMA200)
+ 0.20 × min(1, (close − EMA20) / (2 × atr14))
+ 0.15 × (1 − distance_from_52w_high / 0.25)   clipped to [0,1]
```

**FundamentalMomentum (0.22)**

```
rev_yoy_t  = revenue(latest Q)  / revenue(same Q, prior year) − 1
rev_yoy_p  = revenue(prior Q)   / revenue(same Q, 2 yrs back) − 1
accel      = rev_yoy_t − rev_yoy_p                       # is growth speeding up?

margin_t   = operating_income(latest Q) / revenue(latest Q)
margin_delta = margin_t − margin(same Q, prior year)

FundamentalMomentum = 0.45·z(rev_yoy_t) + 0.30·z(accel) + 0.25·z(margin_delta)
```

Only filings with `filed <= as_of` are used (P2). Growth *acceleration* carries
real weight because the level of growth is already largely in the price;
the change in it is what re-rates a stock.

**EarningsDrift (0.20)**

```
car3 = Σ (stock_return − sector_return) over [filed_date, filed_date+2]
days_since = as_of − filed_date

EarningsDrift = car3 × exp(−days_since / 45)
```

Null if the last filing is more than 90 days old.

**MoneyFlow (0.18)**

```
mfm  = ((close − low) − (high − close)) / (high − low)      # per session
cmf  = Σ(mfm × volume, 21 sessions) / Σ(volume, 21 sessions)

MoneyFlow = 0.7 × cmf + 0.3 × z(21-day dollar-volume trend slope)
```

**SectorStrength (0.15)**

120-day return of the stock's sector composite, divided by the 120-day return of
the market composite. Continuous, not a top-3 cut.

### 4.4 Trade parameters

| Parameter | Rule |
| --- | --- |
| Entry zone | `[close − 0.6×ATR, close + 0.3×ATR]` — mid-term entries favour patience |
| Stop loss | `min(close − 2.5×ATR, EMA50 − 0.5×ATR)` |
| Targets | `+2.5×ATR / +4.5×ATR / +7.0×ATR` |
| Max holding | 45 trading sessions |
| Forced exit | Close below EMA50 for 3 consecutive sessions |

---

## 5. Long Term — 1 to 2 years

### 5.1 What changed and why

**(a) The hard thresholds are converted to scored ramps.** "Revenue growth above
12% for three consecutive quarters AND ROIC above 15% AND PEG below 1.5" is a
conjunction of three demanding conditions. In most quarters it returns a handful
of names, all from the same two sectors, and in a drawdown it returns none — the
page would go blank exactly when it is most interesting. Each condition is now a
continuous ramp, so a company at 11.5% growth is scored just below one at 12.1%
instead of being deleted.

**(b) PEG is replaced.** PEG needs *forward* earnings growth, which is an analyst
estimate and not keyless. Trailing PEG is a well-known trap: it divides by
whatever growth happened to occur, so a company with a one-off collapse in the
base year prints a spectacular PEG. Replaced with **EV/EBIT paired with ROIC** —
the Greenblatt pairing — which asks the same question (what am I paying per unit
of quality?) using only reported figures.

**(c) The Piotroski F-score is added as an explicit factor.** Nine binary
accounting-quality tests, all computable from XBRL. It is one of the most
replicated results in the value literature and it directly addresses the failure
mode of cheap-and-getting-cheaper stocks.

**(d) A distress screen is added.** Any company with negative operating cash flow
in 3 of the last 4 quarters, or interest coverage below 1.5×, is excluded from
this horizon at any score.

### 5.2 The formula

```
LongTerm = 0.26·z(GrowthQuality)
         + 0.24·z(CapitalEfficiency)
         + 0.22·z(CashGeneration)
         + 0.18·z(Valuation)
         + 0.10·z(FScore)
```

All fundamental z-scores are **sector-neutral** (§2, step 3).
Minimum completeness: **4 of 5**. No regime multiplier — a 1–2 year thesis
should not be re-rated because the tape is soft this month.

### 5.3 Factor definitions

**GrowthQuality (0.26)**

```
cagr3      = (revenue_TTM / revenue_TTM_3yr_ago)^(1/3) − 1
consistency = share of last 8 quarters with positive YoY revenue growth
ramp(g)    = clip(g / 0.12, 0, 2)             # 12% is the reference, not a cliff

GrowthQuality = 0.55 × ramp(cagr3) + 0.45 × consistency
```

**CapitalEfficiency (0.24)**

```
NOPAT          = operating_income_TTM × (1 − effective_tax_rate)
InvestedCapital = total_debt + total_equity − cash_and_equivalents
ROIC           = NOPAT / mean(InvestedCapital over the trailing 4 quarters)

CapitalEfficiency = 0.7 × ramp(ROIC / 0.15) + 0.3 × z(ROIC − ROIC_3yr_ago)
```

The second term rewards *improving* returns on capital, which is where the
re-rating comes from. Effective tax rate is clipped to [10%, 35%] to stop
one-off tax benefits from producing absurd NOPAT.

**CashGeneration (0.22)**

```
FCF        = operating_cash_flow_TTM − capex_TTM
EV         = market_cap + total_debt − cash
FCF_yield  = FCF / EV
conversion = FCF / net_income_TTM        # clipped to [0, 2]

CashGeneration = 0.6 × z(FCF_yield) + 0.4 × z(conversion)
```

Conversion catches the company reporting healthy earnings that never become
cash — the classic accruals warning.

**Valuation (0.18)**

```
ev_ebit = EV / EBIT_TTM                   # null if EBIT <= 0
Valuation = 0.6 × z(−ln(ev_ebit)) + 0.4 × z(FCF_yield)
```

Negated and logged so that cheap scores high and the distribution is symmetric.

**FScore (0.10)** — Piotroski, nine tests, one point each:

profitability (ROA > 0; CFO > 0; ΔROA > 0; CFO > net income),
leverage/liquidity (Δlong-term debt ratio < 0; Δcurrent ratio > 0; no new share
issuance), efficiency (Δgross margin > 0; Δasset turnover > 0).

### 5.4 Trade parameters

| Parameter | Rule |
| --- | --- |
| Entry zone | `[close − 1.0×ATR, close + 0.5×ATR]` |
| Stop loss | **Not published.** See below. |
| Targets | Derived from a reverse-DCF fair-value band, not from ATR |
| Max holding | 504 trading sessions (~2 years) |
| Review trigger | Two consecutive quarters of ROIC decline, or FCF turning negative |

**Why no stop-loss on long-horizon picks.** The original spec correctly made
stops mandatory for the 1–5 day and 1–2 month lists and optional beyond. Going
further: publishing a price stop on a 1–2 year fundamental thesis is actively
harmful. A 20% drawdown is an ordinary event inside a two-year holding period
and a price-based stop converts a thesis into a coin flip on volatility. What is
published instead is a **thesis-invalidation trigger** — the specific
*fundamental* condition that would end the position. That is the honest analogue
of a stop at this horizon.

---

## 6. Ultra Long Term — 5 to 10 years

### 6.1 What changed and why

**(a) "Gross margin above 40% for five years" is made sector-relative.** As an
absolute threshold it selects for software and pharma and excludes every
retailer, distributor, and industrial regardless of competitive position.
Costco's moat is real and its gross margin is 12%. The moat factor is scored on
**margin percentile within sector** plus **margin stability**, which is the
better proxy: a company that holds its margin through a cycle has pricing power;
one whose margin swings with input costs does not.

**(b) "Positive FCF growth every year for the past seven years" is loosened to a
scored ratio.** As written it is near-unpassable — one COVID year, one heavy
capex cycle, one acquisition, and a genuinely excellent business fails. Scored as
*years positive out of ten* plus the CAGR, so a 9-of-10 company ranks just below
a 10-of-10 one.

**(c) Financials, REITs and utilities get their own rule set.** Net Debt/EBITDA
below 2.0 excludes every bank (deposits are liabilities), every REIT, and most
utilities by construction. For these sectors the balance-sheet factor uses
sector-appropriate measures (Tier 1 / equity-to-assets for financials;
debt-to-total-capital and FFO coverage for REITs and utilities) or the factor is
nulled and the weights renormalized.

**(d) Reinvestment runway is added.** A wide moat with nowhere to deploy capital
compounds at the dividend yield. Reinvestment rate × ROIC is the actual engine of
long-run compounding and it was missing from the original spec.

### 6.2 The formula

```
UltraLong = 0.28·z(MoatStrength)
          + 0.24·z(CashFlowDurability)
          + 0.20·z(ReinvestmentRunway)
          + 0.16·z(BalanceSheetStrength)
          + 0.12·z(ShareholderYield)
```

All sector-neutral. Minimum completeness: **4 of 5**.
Additional gate: at least 10 years of filing history (younger companies have no
observable durability, whatever their story).

### 6.3 Factor definitions

**MoatStrength (0.28)**

```
gm_pct    = percentile of 5-yr median gross margin within sector
gm_stab   = 1 − (SD(gross_margin, 5yr) / mean(gross_margin, 5yr))     # 1 = perfectly stable
gm_trend  = sign of the 5-yr gross-margin slope
roic_pers = share of AVAILABLE annual history with ROIC > 12%   (min 5 years)

MoatStrength = 0.30·gm_pct + 0.25·gm_stab + 0.15·gm_trend + 0.30·roic_pers
```

`roic_pers` carries the joint-largest weight here, tied with `gm_pct` at 0.30.
Persistent high returns on capital across a long history is the closest observable proxy for
a moat that exists in reported data — it is the *outcome* a moat produces, and
unlike margin it is not sector-idiosyncratic.

**CashFlowDurability (0.24)**

```
years_positive = count(FCF > 0, last 10 fiscal years) / 10
fcf_cagr       = (FCF_TTM / FCF_10yr_ago)^(1/10) − 1
drawdown       = max peak-to-trough decline in TTM FCF over 10 years

CashFlowDurability = 0.45·years_positive + 0.35·ramp(fcf_cagr / 0.08) + 0.20·(1 − min(1, drawdown))
```

**ReinvestmentRunway (0.20)** — *new factor.*

```
reinvestment_rate = (capex + R&D + acquisitions − D&A) / NOPAT

D&A is not reliably tagged quarterly across filers, so it is approximated from
the operating-cash-flow-to-net-income wedge. When that wedge cannot be computed
the whole EBITDA-dependent term is nulled rather than defaulted — an earlier
version substituted a flat 15% of EBIT, which invents the same depreciation rate
for a software firm and a steel mill and then feeds it into a leverage ratio.
implied_growth    = reinvestment_rate × ROIC

ReinvestmentRunway = 0.6·z(implied_growth) + 0.4·z(revenue_per_share_10yr_CAGR)
```

**BalanceSheetStrength (0.16)** — sector-dependent:

| Sector group | Measure |
| --- | --- |
| Standard | `ramp(2.0 − net_debt/EBITDA)` + interest coverage + current ratio |
| Financials | equity/assets, loan-loss reserve coverage, deposit funding share |
| REITs / Utilities | debt/total capital, FFO or EBITDA interest coverage, weighted debt maturity |

**ShareholderYield (0.12)**

```
buyback_yield  = (shares_out_5yr_ago − shares_out_now) / shares_out_5yr_ago / 5
dividend_yield = dividends_paid_TTM / market_cap
div_growth     = 5-yr dividend-per-share CAGR
dilution_flag  = −1.0 if share count grew > 2%/yr

ShareholderYield = 0.4·buyback_yield + 0.3·dividend_yield + 0.3·ramp(div_growth/0.05) + dilution_flag
```

Share count is taken from the balance-sheet date, not the cover page, and is
adjusted for splits. Buybacks that merely offset stock-based compensation
produce a near-zero net yield here — which is the correct answer and the reason
gross buyback announcements are not used.

### 6.4 Trade parameters

Entry zone `[close − 1.5×ATR, close + 0.5×ATR]`; no stop; no price targets
(a 5–10 year price target is a fiction); a **compounding scenario band** instead,
showing implied annualized return under conservative / base / optimistic
assumptions for revenue growth, margin, and exit multiple, with every assumption
displayed. Review triggers: three consecutive years of ROIC decline, gross margin
below its 10-year 20th percentile, or net debt/EBITDA above 3.5.

---

## 7. Rank stability (hysteresis)

The original rule — an incumbent must fall below rank 15 before leaving the top
10 — is right in principle and wrong to apply uniformly. On a 1–5 day list you
*want* fast turnover; the whole point is that the setup expires. On a 5–10 year
list, a name rotating out because of a 0.1-point score wobble is noise
masquerading as research.

Hysteresis is therefore scaled to the horizon:

| Horizon | Exit rank threshold | Min. holding before eligible to drop | Expected monthly turnover |
| --- | --- | --- | --- |
| Ultra short | 12 | 1 session | ~85% |
| Mid term | 16 | 5 sessions | ~35% |
| Long term | 20 | 21 sessions | ~10% |
| Ultra long | 25 | 63 sessions | ~4% |

Additional rules:

- **Score-margin requirement.** A challenger must beat the incumbent by more
  than `0.15 × SD(scores)` to displace it. Ties go to the incumbent. This kills
  the shuffle-churn that makes a list look busy without being informative.
- **Stop-out overrides hysteresis.** A stopped-out ultra-short or mid-term pick
  leaves immediately, records a loss, and cannot re-enter for 5 sessions.
- **Gate failure overrides hysteresis.** A stock that breaks a hard gate
  (distress screen, delisting, F-score collapse, administrative flag) leaves the
  same day at any rank.
- **Turnover is displayed.** Each board shows its 30-day realized turnover, so a
  reader can see whether "stable" is actually being delivered.

---

## 8. Diversification constraints on the published top 10

Applied after scoring, before publication:

1. **Max 3 names per GICS sector** (relaxed to 4 if the universe has fewer than
   6 represented sectors).
2. **Max 2 names with pairwise 60-day return correlation > 0.85.** A top 10 of
   ten correlated semiconductor names is one position, not ten, and presenting it
   as a diversified list is misleading.
3. **Max 4 names sharing a single dominant news catalyst cluster** (e.g. one
   policy announcement moving an entire sub-industry).

Displaced names appear on the "just missed" list with the constraint that
displaced them stated explicitly.

---

## 9. Performance audit — the part that makes it credible

Every published pick is written to an append-only ledger at publication time
with: date, ticker, horizon, rank, score, all factor values, entry zone, stop,
targets, max holding, and the exact code commit that produced it.

**Entry convention.** A position is marked filled at the **next session's
volume-weighted average of open and close** — `(O+C)/2` — if that price falls
within the published entry zone, otherwise the pick is recorded as **NO FILL**
and excluded from returns. This is deliberately conservative: assuming a fill at
the published close would flatter every result, because the ranking is computed
from that close.

**Costs.** Every round trip is charged **10 bps commission + spread, plus
slippage of 5% of the day's ATR**. Korean picks additionally carry the 0.18%
securities transaction tax on sales. Reported returns are net.

**Exit.** Whichever comes first: stop hit (using the session's low), base target
hit (using the session's high), forced-exit trigger, or max holding period
expiry at that session's close. Intrabar ambiguity — a session whose range
contains both the stop and the target — is **always resolved as the stop**.

**Published statistics.** For each horizon and for all horizons combined:

- number of picks, filled and no-fill
- win rate, and win rate of a random-selection control drawn from the same
  universe on the same dates
- mean and median return, net of costs
- **excess return vs. a same-period buy-and-hold of SPY (US) / KOSPI (KR)** —
  because in a rising market a monkey posts a good win rate
- distribution of returns, not just the average (a 90% win rate with one −60%
  tail is a losing strategy)
- maximum drawdown of the equal-weight portfolio of all open picks
- average holding period, actual vs. intended
- hit rate by regime state
- **the count of picks that were never filled**, so the reader can see how much
  of the theoretical performance was unreachable

**Anti-gaming commitments, stated on the page:**

- The ledger is append-only and lives in git. Every historical version is
  publicly diffable.
- Nothing is removed retroactively. A pick published in error is marked
  `void` with a reason, and still shown.
- The methodology version that produced each pick is recorded with it, so a
  change to the formula cannot silently rewrite past results.
- Sample-size warnings are displayed until a horizon has at least 30 closed
  positions, and the long-horizon boards will carry that warning for years —
  which is the honest state of affairs, not a defect.

---

## 10. Known limitations

Published on the site, not buried here.

1. **No intraday or pre-market data.** Everything is end-of-day. A 1–5 day
   ranking published after the close is actionable at the next open at the
   earliest, and the audit's fill convention reflects that.
2. **Headline sentiment is weak.** It is a lexicon, not a language model, and
   even a language model would be weakly predictive at this horizon.
3. **No analyst estimates.** Mid-term therefore substitutes realized earnings
   drift for revision momentum. This is a real downgrade from the ideal spec.
4. **Korean fundamentals are shallower than US.** SEC XBRL gives 10+ years of
   tagged, audited statements. The keyless Korean equivalents give a
   cross-sectional snapshot and a few years of history. Korean long-horizon
   scores carry a lower-confidence badge for this reason, and the ultra-long
   board is US-only until a DART key is configured.
5. **Multiple testing.** Four horizons × dozens of factors × two markets is a
   large search space. These weights are reasoned from published literature
   rather than optimized on this data — which avoids overfitting but means they
   are not tuned. That is the deliberate trade.
6. **The universe is large-cap biased** by construction of the liquidity
   filters. Small-cap opportunities are systematically outside the scope.
7. **No short side.** Every list is long-only. In a bear market the correct
   answer is often "nothing", and the regime multiplier is the only mechanism
   expressing that.

---

## 10a. Where the implementation departs from the text above

Written down rather than quietly tolerated, because a methodology page that does
not match the code is worse than no methodology page.

**Composite factors are blended before normalization, not after.** §4.3, §5.3 and
§6.3 write terms like `0.6·z(FCF_yield) + 0.4·z(conversion)`. The code blends the
raw sub-terms first and z-scores the composite once. The two are not identical:
blending first means the sub-terms' natural scales set their effective weights,
so the rescaling constants in the code (dividing `conversion` by 2, multiplying
`FCF_yield` by 10) are load-bearing rather than cosmetic. The ordering was chosen
because z-scoring each sub-term separately over a universe where many are null
produces composites built from different factor subsets per stock, which is not
comparable across the board. The constants are documented at each call site.

**Piotroski is computed quarter-over-year-ago-quarter, not fiscal-year over
fiscal-year.** Piotroski (2000) is an annual test. Comparing Q2 to the prior Q2
keeps the score responsive within a year and avoids penalising seasonal
businesses for their off quarter, but it means this F-score will not match one
computed from annual statements elsewhere. Two further deviations: the leverage
test uses `<=` rather than a strict decrease, and the dilution test allows up to
2% annual share growth rather than requiring zero issuance. All three are
deliberate; none is the textbook definition.

**Gross-margin percentile emerges downstream.** §6.3 writes `gm_pct = percentile
of 5-yr median gross margin within sector`. The factor actually emits the raw
5-year mean margin, and the within-sector comparison happens in the shared
sector-neutral normalization step (§2). The ranking effect is the same; the
intermediate value is not a percentile.

**A single missing XBRL tag nulls every TTM-derived factor for that company.**
`ttm()` requires all four quarters of a field. Combined with revenue-tag
fragmentation across filers, real-world completeness on the long-horizon boards
will be lower than the factor list suggests. This is strict by choice — summing
three quarters and calling it a year would be worse — but it means the long
boards rank a smaller universe than the liquidity filters alone imply.

**The regime multiplier fails optimistically.** When the benchmark or breadth
cannot be computed, `state` is `unknown` and the multiplier is 1.0 rather than a
defensive value. On a cold start this means the first boards are published
without regime scaling. Visible on the site as an `unknown` regime state.

---

## 11. Change control

The methodology version is stamped on every ranking file. Any weight or rule
change increments the version, is committed with a rationale, and appears in the
public changelog at `/methodology/changelog/`. Past picks keep the version they
were generated under. Backtests spanning a version change are labelled as such.
