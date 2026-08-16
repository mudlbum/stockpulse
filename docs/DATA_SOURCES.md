# Data Sources

Every source the pipeline uses, why it was chosen, and — just as importantly —
which obvious-looking sources were rejected and what would have gone wrong.

All sources are **keyless**. No API keys, no accounts, no monthly bill. That
constraint shapes the whole design and is the reason several factors in
`METHODOLOGY.md` differ from their textbook forms.

Verification status recorded when this was written (2026-08-15):

- **[V]** response observed directly during source research
- **[S]** documented in current library source read from GitHub
- **[U]** unverified — the first live Actions run is the test

---

## United States

### SEC EDGAR — fundamentals ✅ [V]

The best free financial data on earth, and it is not close. Audited, tagged,
machine-readable, no key, no rate ceiling worth worrying about.

| Endpoint | Use |
| --- | --- |
| `https://www.sec.gov/files/company_tickers.json` | ticker ↔ CIK map |
| `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` | full fact history per company |
| `https://data.sec.gov/api/xbrl/frames/{taxonomy}/{tag}/{unit}/{period}.json` | one fact per filer, market-wide |
| `https://data.sec.gov/submissions/CIK##########.json` | SIC code, industry description, exchanges |

**Rules that bite:**

- **`companyfacts` does not contain the SIC code, the industry, or the
  exchange.** It contains facts and nothing else. The only keyless source of a
  filer's industry is the `submissions` endpoint — a different host path, a
  different document. Missing this is how every US row on this site shipped with
  no sector until it was caught in production; see METHODOLOGY §1.3.
- **`submissions` is ~160KB per filer** because it embeds the recent filing
  history, of which the pipeline wants four scalar fields. Fetch once, cache in
  `data-store/profiles/us.json`, never refetch: a SIC code does not move.

- **Send a descriptive `User-Agent` with a contact address.** SEC's stated cap is
  **10 requests/second**; the pipeline throttles well below it.
- `company_tickers.json` is an **object keyed by stringified index, not an
  array**, and `cik_str` is a **JSON number** despite the name — zero-pad it to
  10 characters yourself.
- **Instantaneous vs duration periods.** Balance-sheet concepts use `CY2026Q1I`
  (trailing `I`) and their items have **no `start` field**. Income and cash-flow
  concepts use `CY2026Q1` and do have one. Requesting the wrong form returns
  **404, not an empty set**.
- **Period end dates vary per filer.** SEC bins non-calendar fiscal quarters into
  the nearest calendar frame, so one frame legitimately contains ends of both
  `2026-02-28` and `2026-03-31`. Do not assume uniformity.
- **No single revenue tag covers the market.** Measured on one quarter,
  `RevenueFromContractWithCustomerExcludingAssessedTax` had 2,654 filers and
  `Revenues` had 2,094 — overlapping, neither sufficient. The pipeline resolves a
  priority list per CIK, first hit wins. See `REVENUE_TAGS` in
  `scripts/lib/sources.mjs`.
- **`frame` marks SEC's canonical pick** for a period. Preferring entries that
  carry it is the cleanest way to drop restatements.
- **Point-in-time filtering keys on `filed`, never on `end`.** A quarter ending
  30 June and filed 5 August must be invisible to a July score. This is
  METHODOLOGY P2 and it is the difference between a backtest and a fantasy.

### Prices — Yahoo v8 primary, Stooq fallback ⚠️ [S/A]

```
https://query1.finance.yahoo.com/v8/finance/chart/{symbol}?range=1y&interval=1d
```

Keyless as of 2026, but **requires a browser User-Agent** — the endpoint rejects
default library UAs. Chosen as primary because one request returns a year of
bars, which is far fewer requests than any per-day alternative.

Rate limiting is the real risk, not authentication. Reported safe rate is ~2
req/s and shared Actions egress makes limits more likely than from a home IP.
The pipeline throttles to well under that and backs off on 429.

Adjusted close is applied as a **ratio across the whole bar**. Mixing an adjusted
close with raw highs and lows silently corrupts every ATR, range and gap factor
across every split in history.

**Stooq is a fallback only.** `pandas-datareader` **removed** its Stooq reader
from master; it survives only in the v0.10.0 tag. Worse, Stooq answers a
rate-limit refusal with **HTTP 200 and a plain-text body**, which naive CSV
parsers turn into a phantom price row. The adapter sniffs for a `Date,` prefix
and throws otherwise. Stooq has **no Korean coverage** — its suffix whitelist is
`de, hk, hu, jp, uk, us, f, b`.

### Sectors — SPDR sector ETFs

SEC publishes SIC codes, not GICS, and SIC→GICS mapping is a project in itself.
The eleven sector SPDRs are free, liquid, and have clean history, so they serve
as sector composites for the relative-strength factor and the treemap.

---

## South Korea

### ⚠️ Read this first: KRX closed the door on 2025-12-27

KRX moved `data.krx.co.kr` to a membership-based Data Marketplace and **made
login mandatory**, reportedly because of server load from unauthorized scraping.
`pykrx` grew a whole login module in response; `FinanceDataReader` commented out
its live KRX index reader.

**The pipeline therefore never calls `data.krx.co.kr`.** Beyond the login wall,
KRX rate-limits by IP and has blocked individual IPs for repeated access — a
meaningful hazard on shared GitHub Actions egress.

### KRX daily snapshot — the GitHub mirror ✅ [V]

```
https://raw.githubusercontent.com/FinanceData/fdr_krx_data_cache/master/data/listing/krx/{YYYY-MM-DD}.csv
```

FinanceData runs a public repo whose only job is to scrape KRX from GitHub
Actions and commit CSVs, refreshed every 20 minutes during KRX hours. Reading it
is **GitHub serving GitHub**: no geo-block, no auth, no rate risk. One request
returns price, volume, market cap and share count for **every listed Korean
stock**.

Sibling paths in the same repo supply sector/industry descriptions
(`listing/desc/`) and a full year of KOSPI/KOSDAQ index history per file
(`index/year_ks11/{YYYY}.csv`).

**Format traps:**

- A **leading UTF-8 BOM** on the first (unnamed index) column.
- The change-percent column is spelled **`ChagesRatio`** — misspelled in the
  source data. Reading `ChangesRatio` yields `NaN` and silently disables the
  price-limit check.
- Korean codes must keep their **leading zeros** (`000660`, not `660`).
- Industry names contain commas **inside quotes** — a naive `split(',')` shreds
  the row.
- Files exist only for **trading days**; the adapter walks backwards to find the
  latest.

*Caveat:* third-party repo, no SLA. If it ever goes stale the pipeline reports it
in `health.json` rather than publishing silently wrong numbers.

### Naver — adjusted per-ticker history ⚠️ [S], behaviour from US IPs [U]

```
https://api.finance.naver.com/siseJson.naver?symbol=005930&requestType=1&startTime=…&endTime=…&timeframe=day
```

Preferred for time series because prices are **split/dividend adjusted (수정주가)**,
which the KRX snapshot is not.

**The response is not valid JSON.** It is a JS array literal whose header row
uses **single quotes** while data rows use double quotes, so `JSON.parse` throws
on the raw body. Quotes must be repaired first. This is the single most common
way this integration breaks, and there is a test pinning it.

Columns: 날짜, 시가, 고가, 저가, 종가, 거래량, **외국인소진율** (foreign ownership %).

**Unverified risk:** no credible report was found either way about Naver
geo-blocking or rate-limiting US datacenter IPs. `refresh-kr.mjs` therefore
degrades to mirror-derived bars on failure and logs a loud warning, rather than
failing the run. The first live Actions run is the smoke test.

### Korean fundamentals — the honest gap

There is no keyless Korean equivalent of SEC XBRL. Options considered:

| Source | Verdict |
| --- | --- |
| Naver `sise_market_sum` + `field_list` cookie | Gives ROE/PER/PBR/revenue/operating income for every listed stock, keyless — but a **cross-sectional snapshot, not a time series**, and ~305 requests per full refresh |
| FnGuide `comp.fnguide.com` | Real multi-year statements, keyless, but fragile HTML scraping |
| `navercomp.wisereport.co.kr` | Requires an `encparam` token scraped per request; two-step and brittle |
| KRX `MDCSTAT03502` | Real PER/PBR/DIV time series — behind the login wall |
| **DART OpenAPI** | **The right answer.** Audited, tagged, multi-year. Needs a free key |

The pipeline snapshots what the mirror provides daily, which accumulates into a
series over time. **The ultra-long board is US-only** until a DART key is
configured, and the board says so on the page rather than ranking Korean names on
data that cannot support the question. Korean long-horizon scores carry a
lower-confidence badge.

**Adding DART is the single highest-value upgrade to this site.** The key is
free from <https://opendart.fss.or.kr>. Set it as an Actions secret named
`DART_KEY`.

### Korean market rules encoded in the pipeline

- **±30% daily price limit.** A stock closing at the limit has a **censored**
  price — the market did not finish discovering it. Those names are excluded from
  the ultra-short board, because ranking a limit-up stock as a buy is
  recommending an entry that cannot be filled.
- **Administrative flags** (관리종목, 투자경고, 투자위험, 거래정지, 정리매매) are
  excluded outright. KRX has already flagged them as hazardous.
- **0.18% securities transaction tax** on sales is charged in the performance
  audit.

---

## News

Ten feeds, EN and KO. Every one below returned real items with a recent
newest-item date when checked. [V]

| Feed | URL |
| --- | --- |
| Yahoo Finance | `https://finance.yahoo.com/news/rssindex` |
| MarketWatch | `https://feeds.content.dowjones.io/public/rss/mw_topstories` |
| Nasdaq Markets | `https://www.nasdaq.com/feed/rssoutbound?category=Markets` |
| Investing.com | `https://www.investing.com/rss/news_25.rss` |
| CNBC | `https://www.cnbc.com/id/100003114/device/rss/rss.html` |
| 한국경제 증권 | `https://www.hankyung.com/feed/finance` |
| 한국경제 경제 | `https://www.hankyung.com/feed/economy` |
| 이데일리 | `https://rss.edaily.co.kr/edaily_news.xml` |
| 이데일리 증권 | `https://rss.edaily.co.kr/stock_news.xml` |
| 매일경제 증권 | `https://www.mk.co.kr/rss/30100041/` |

**Feeds are gated on the age of their newest item, not on status code.** Several
finance feeds return a perfectly healthy 200 with a valid document whose newest
entry is years old. A status check alone keeps them in the rotation forever. The
threshold is 96 hours and the result is published in `health.json`.

**Parsing traps:** RSS 2.0 puts the URL in the element body while Atom puts it in
an `href` attribute — handling only one silently drops every article from half
the feeds. Investing.com and 이데일리 emit **non-RFC-822 dates**
(`2026-08-15 11:49:49`).

---

## Rejected sources, and what would have gone wrong

| Source | Why not |
| --- | --- |
| `data.krx.co.kr` direct | Login mandatory since 2025-12-27; IP rate limits on shared Actions egress |
| Yahoo v7 `quote` | Now requires cookie + crumb authentication |
| Stooq as primary | Removed from pandas-datareader master; returns rate-limit text with HTTP 200; no Korean coverage |
| Seeking Alpha RSS | `robots.txt` disallows; actively blocks bots |
| SEC `action=getcurrent` Atom | `robots.txt` **explicitly disallows** it. The per-company `action=getcompany` form is allowed |
| Reddit JSON | 403s from datacenter IPs — would fail every Actions run |
| Investing.com scraping | Requires JS execution and anti-bot evasion |
| FinBERT for sentiment | 440MB model, minutes of CPU inference per run, and its output cannot be reproduced by a reader from the published site. Replaced by a Loughran–McDonald lexicon, which is deterministic and auditable |
| Alpha Vantage / Finnhub / Polygon / FMP | All key-gated. Good options if the keyless constraint is ever relaxed |

---

## Health reporting

Every run publishes `public/data/health.json` with per-host success/failure
counts and per-feed status, and prints both to the Actions step summary. If a
board looks wrong, read that first — it distinguishes "the source broke" from
"the scorer broke", which are very different problems.

The pipeline **exits non-zero** rather than publishing when a universe collapses
below a floor (50 US names, 30 KR names, 1 healthy feed). Publishing yesterday's
numbers under today's date would be worse than publishing nothing.
