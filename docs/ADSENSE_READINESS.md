# AdSense & SEO Readiness Report

**Assessed 2026-08-15.** Policy research was done against Google's own
documentation; every "Google says" claim below has a source URL. Anything from
practitioners is labelled as such, because a great deal of AdSense advice online
is folklore repeated confidently.

---

## The headline

**Do not apply yet.** Two blockers remain, and neither is code:

1. **No named human on the site.** `docs/LAUNCH_CHECKLIST.md` §1a.
2. **`ads.txt` cannot be served from a `github.io/stockpulse/` deploy.** §8.

Everything else that was in scope is done. The site went from 18 pages of tables
to 72 pages including ~25,300 words of original explanatory prose, which was the
single largest rejection risk.

---

## What Google actually requires

The eligibility page ([support.google.com/adsense/answer/9724](https://support.google.com/adsense/answer/9724))
says only this:

> "Your content must be high-quality, original, and attract an audience."

There is **no** stated minimum word count, page count, site age, or traffic
threshold. The "you need 6 months and 30 posts" advice everywhere online is not
Google's. What *is* Google's, from the rejection-reasons page
([answer/81904](https://support.google.com/adsense/answer/81904)): "too little
text", "not enough original, rich content", "difficult to navigate", and content
"primarily in an unsupported language" — **Korean is supported**, so bilingual
EN/KO is fine.

### The policy that actually governs a site like this

[Google-served ads on screens with replicated content](https://support.google.com/publisherpolicies/answer/11190248):

> "embedded or copied content from others without additional commentary,
> curation, or otherwise adding value to that content"
> "Automatically generated content without manual review or curation"

This is the load-bearing one. The site ingests SEC EDGAR filings and end-of-day
prices — third-party data — transforms them programmatically, and publishes. The
defence is the phrase **"without adding value"**: a published, deterministic,
original scoring formula plus a public audit of its own results *is*
transformation. The risk was a reviewer seeing a table of numbers and stopping
there. That is what the editorial layer now addresses.

### Financial content is not restricted

Worth stating because it is the most over-worried item: the
[Publisher Restrictions](https://support.google.com/publisherpolicies/answer/10437795)
list is sexual content, shocking content, weapons, tobacco, drugs, alcohol,
gambling, pharmaceuticals, and removed apps. **Finance, investing and stock
analysis appear nowhere.** Stock market analysis is ordinary monetizable content.

Where finance content *does* break AdSense is
[Deceptive practices](https://support.google.com/publisherpolicies/answer/11185755),
which explicitly names **"Get Rich Quick" schemes**. "Top 10 stocks for the next
1–5 days" is one bad headline away from reading like one. That is why the
vocabulary audit happened.

### AI content

The [Search spam policy](https://developers.google.com/search/docs/essentials/spam-policies)
(last updated 2026-05-15) defines scaled content abuse by **purpose and value,
not authorship**:

> "Scaled content abuse is when many pages are generated for the primary purpose
> of manipulating search rankings and not helping users."

There is no "AI = spam" clause, and **no 2025 or 2026 AdSense policy change
about AI at all** — I read both official change logs. AI disclosure is *not
required* for AdSense and only *recommended* for Search. It is done here anyway,
because the [Misleading representation](https://support.google.com/publisherpolicies/answer/11185754)
policy prohibits concealing "information about ... the purpose of the content,
or the content itself", and presenting machine-drafted market commentary as
hand-written analysis is squarely that.

---

## What changed

### Content — the decisive item

| | Before | After |
| --- | --- | --- |
| Pages | 18 | **72** |
| Original prose | ~4,900 words, 6 of 9 page types unrankable | **~25,300 words** across 20 articles, plus editorial layers |
| `/simulator/` prose | 152 words (5.7% text ratio) | **719 words** |
| Internal links | 258, ~100% navigational | **2,225**, with real contextual linking |
| Blog | did not exist | 20 articles + index, category and pagination routes |

The 20 explainers are written **against the pipeline source**, not paraphrased
from Investopedia — they explain this site's actual implementation, with the
real constants and the real limitations. That is what makes them unlike anything
else on the web, and it is also what makes them defensible under the
"adding value" test.

Fact-checking them against the code surfaced **14 doc↔code mismatches**, four of
which were real bugs (see the commit log). That is the strongest argument that
the review was real.

### Automation is capped and disclosed — and it now publishes without review

The daily brief **auto-publishes on a schedule** (`.github/workflows/brief.yml`).
That is deliberately the pattern Google's inventory-value policy describes as
"automatically generated content without manual review or curation", so it is
worth being precise about why this specific case is defensible and where the
line is.

What makes it defensible:

- **One brief per market per day, maximum**, enforced in `write-brief.mjs`
  rather than in the workflow so it cannot drift via a config edit. Per-ticker
  or per-horizon briefs would be ~40 pages/day and would be indefensible at any
  quality.
- **No language model writes it.** The text is assembled from figures the
  pipeline already computed, so every sentence is checkable against the
  published JSON. This is the crux: the policy targets pages that manufacture
  the appearance of content, and a deterministic report on your own original
  dataset is the opposite of that.
- **A thin day publishes nothing.** Publish mode requires 6 corroborated facts
  where drafting requires 4. A run that produces zero posts is a success.
- **It never claims a human read it.** Posts carry `reviewStatus:
  auto-published` and **no reviewer name**; the content schema *rejects* a
  reviewer name on an auto-published post, and rejects auto-publishing anything
  that is not `category: market-brief`. Attaching a person's name to unreviewed
  output would be the "misrepresents information about the content creator"
  clause — and a lie.
- **It is gated on the build and the audit.** The workflow builds the site and
  runs `npm run audit` *before* committing, so a brief that breaks the schema or
  the published output never reaches the site.

**The honest risk assessment:** this is more exposed than the review-PR flow it
replaced. A reviewer who sees a daily cron-published post on a finance site may
apply the "without manual review" clause regardless of how deterministic the
generator is. The mitigation is a one-click revert — set the repository variable
**`BRIEF_AUTOPUBLISH=false`** and the same workflow goes back to opening review
PRs, no code change. If AdSense rejects on scaled content, flip that first.

### Compliance infrastructure

| Item | Status |
| --- | --- |
| Privacy policy with Google's mandated ad-cookie disclosures | ✅ EN + a genuine Korean 개인정보처리방침 |
| Terms of use | ✅ |
| Contact | ✅ (placeholder email — blocker) |
| Editorial & corrections policy | ✅ |
| Financial disclaimer sitewide + on every ranking table | ✅ enforced by the build audit |
| Certified CMP for EEA/UK/CH | ✅ wired to Google's TCF-certified CMP, off until `ADSENSE_CLIENT` is set |
| `ads.txt` | ⚠️ generated, but see §8 |
| Get-rich-quick vocabulary | ✅ audited; "picks"/"signals" reframed |

The ads switch ships **empty**, and with it empty the site makes **zero
third-party network requests** — verified with Playwright.

### Technical SEO

Fixed: dead live-refresh script (had never executed on any page), scripts
emitted after `</html>` on 8 pages, `index,follow` on placeholder builds
publishing fabricated prices against real tickers, all 18 titles and
descriptions, a JSON-LD `@id` collision defining one node nine times per
language, `og:image` as an SVG (rejected by every social platform), and a home
page of 10,600 DOM nodes reduced to 1,823 with the default board still fully
server-rendered.

Added: `Dataset`, `ItemList`, `FAQPage`, `BlogPosting` and `BreadcrumbList`
structured data; 16 per-horizon landing pages; a CJK-weighted SERP-width lint
(counting `.length` had hidden 7 of 9 Korean descriptions being over budget).

---

## Blockers

### 1. No named human — the largest remaining risk

Every article currently says *"Reviewed by StockPulse Editorial — a named person
read this before it was published and is accountable for it."* **That is not
true**, and an unverifiable claim of human review is worse than no claim.

Google's Quality Rater Guidelines direct raters to start at the About page and
look for independent corroboration. On a YMYL Financial Security topic, finding
nobody is a hard ceiling.

No financial credential is needed, and claiming one you don't hold would be far
worse. "Engineer who built and published the full methodology and audits every
result in public" is accurate, respectable, and more verifiable than most
bylines in this niche. Checklist §1a lists the five fields to fill.

### 2. `ads.txt` on a project-site deploy

`ads.txt` is only ever read from the **domain root**. On
`mudlbum.github.io/stockpulse/` it lands at `/stockpulse/ads.txt`, where no
crawler looks. AdSense will report *Not found* permanently.

Not fatal — [Google says](https://support.google.com/adsense/answer/7532444)
"Use of ads.txt is not mandatory, but it's highly recommended" — but many buyers
filter unverified inventory, so it costs demand and CPM.

Two fixes, in order of preference:

1. **A custom apex domain.** `./setup-github.sh --domain yourdomain.com` handles
   CNAME, base path and Pages registration. A `github.io` subdomain also reads
   as a hobby project to a human reviewer on a finance application.
2. Put `ads.txt` in a `mudlbum.github.io` user-site repo, which serves the
   subdomain root.

---

## Honest assessment of approval odds

The community guide hosted on Google's own domain (written by a volunteer
Product Expert, not Google staff) states plainly: *"AdSense is generally not
suitable for web applications or 'tools' sites."* That is one expert's framing,
but it is directionally consistent with the written policies.

**What works against this site:** it is a data/tool site at heart, in a YMYL
category held to a stricter bar, on a `github.io` subdomain, with no named
operator, and no traffic history.

**What works for it, and is genuinely unusual:** the methodology is published in
full and the code is open source, so every number is independently reproducible.
The performance audit publishes losses, no-fills and a random-selection control
next to every win rate — almost no finance site does this, and it is precisely
the effort/expertise evidence raters are told to look for. And 25,300 words of
explainers that describe a real implementation rather than rehashing definitions.

Fix the two blockers and it is a reasonable application. Expect **2–4 weeks**
review ([Google](https://support.google.com/adsense/answer/12176698)), and
possibly a rejection cycle — that is normal, there is no cooldown, and the
resubmission that works is usually the one where real content appeared.

---

## Worth knowing before you invest in this

Publishers reported AdSense eCPM/RPM falling **50–70%** overnight on 14–15
January 2026 ([Search Engine Land](https://searchengineland.com/adsense-publishers-report-sudden-revenue-plunge-again-467566),
corroborated by ppc.land and SE Roundtable). Google acknowledged Ad Manager
issues but has not confirmed a causal link. Separately, AI Overviews are
compressing publisher clicks.

For a site this size, **AdSense in 2026 is a supplement, not a business model.**
Two alternatives likely to outearn it here:

- **Finance affiliate** — brokerage and data-vendor referrals pay far more than
  display, and this audience is unusually high-intent. But an affiliate link to
  a broker turns an "objective ranking" into a page with a conflict of interest.
  Disclose it plainly or it becomes a Deceptive Practices problem.
- **A paid data tier** — historical scores, backtest exports, API access. The
  data is genuinely differentiated; ads monetize attention, subscriptions
  monetize the actual value.

Note that the premium networks are *stricter*, not easier: Mediavine requires
AdSense good standing, Raptive requires 25,000 monthly pageviews and "meaningful
human involvement". Ezoic (10,000 monthly visits) is the realistic fallback.

---

## Pre-application checklist

- [ ] **§1a** — real named operator, bio, external corroboration, `reviewedBy` on all 20 articles
- [ ] **§1** — replace `hello@example.com` with a monitored mailbox
- [ ] **§8** — custom domain, so `ads.txt` can be served
- [ ] **§3** — governing law in `/terms`
- [ ] **§6** — deploy with real data (the audit refuses to publish placeholders)
- [ ] Verify `https://mudlbum.github.io/robots.txt` is not blocking — crawlers read robots.txt only at the origin root, and that file belongs to whatever repo owns the user site
- [ ] Submit the sitemap in Search Console and Bing Webmaster Tools
- [ ] Let the site be crawled and accumulate a little history before applying
- [ ] Then set `ADSENSE_CLIENT`, confirm the CMP fires for EEA traffic, and apply

**Korean traffic is a separate problem.** Google's CMP covers TCF/GDPR only. PIPA
applies extraterritorially to a Korean-language site, its Online Customized
Advertising guidelines require naming Google as a behavioural-data recipient plus
a working opt-out, and cross-border transfer needs separate consent. The PIPC
fined Google and Meta ~₩100bn over exactly this area in 2022. This is the one
item where Korean counsel is genuinely worth the money.
