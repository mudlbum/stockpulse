# StockPulse launch checklist

Everything that must be true before this site is public, and before it is
submitted to Google AdSense. Ordered: earlier steps unblock later ones, and the
compliance steps are deliberately in front of the monetization steps.

Two things this document is not. It is not legal advice — it is a list of the
places this codebase knowingly ships a placeholder or a partial answer. And it
is not a claim that finishing it makes the site compliant everywhere; §11 and
§12 exist precisely because it does not.

Symbols: **[BLOCKER]** must be done before the site is public at all.
**[ADSENSE]** must be done before applying to AdSense. **[ADS-ON]** must be done
before the first ad impression is served.

---

## 1. Replace the contact address — [BLOCKER]

`src/config.ts` → `SITE.contactEmail` ships as `hello@example.com`.

That address is printed on `/contact`, `/privacy`, `/terms`, `/disclaimer` and
in the footer of every page, and it is the address AdSense uses to reach a
publisher. It must be a mailbox a person actually reads: GDPR access requests,
PIPA 열람·삭제 요구 and correction reports all arrive there, and the response
commitment on `/contact` (3 business days) is a public statement.

`/contact` renders a visible warning banner while the address still ends in
`example.com`, so a forgotten placeholder announces itself rather than looking
like a working mailbox. Do not remove the banner; replace the address.

- [ ] `SITE.contactEmail` set to a real, monitored mailbox
- [ ] A test email sent to it and confirmed received
- [ ] `SITE.responseDays` still accurate for whoever monitors it

## 1a. Put a real, named human on the site — BLOCKER

This is the single largest non-technical gap, and it is the one most likely to
sink an AdSense application on a finance site.

Right now `AUTHORS.editorial` in `src/content.config.ts` resolves to
"StockPulse Editorial" with `isPlaceholder: true`, and every article's byline
reads *"Reviewed by StockPulse Editorial — a named person read this before it
was published and is accountable for it."* **That sentence is currently not
true**, because "StockPulse Editorial" is not a person. An unverifiable claim of
human review is worse than no claim: it is exactly the "misrepresents ...
information about the publisher, the content creator, or the content itself"
case in Google's Misleading Representation publisher policy, and it is the
opposite of the trust signal it is trying to send.

Google's Quality Rater Guidelines direct raters to start at the About page and
then go looking for independent corroboration of whoever is named there. On a
YMYL Financial Security topic — which this unambiguously is — finding nobody is
a hard ceiling on how well the site can rank, regardless of how good the
methodology is.

Do all of these:

- [ ] Set `SITE.founderName` (and the matching bio) in `src/config.ts`. This
      unlocks the `Person` node as `Organization.founder` in the JSON-LD, which
      is currently suppressed rather than filled with a placeholder.
- [ ] Replace `AUTHORS.editorial` with a real name and a real bio, and set
      `isPlaceholder: false`.
- [ ] Add something externally corroborable — a GitHub profile, LinkedIn, or a
      personal site. The open-source pipeline is a genuine, verifiable
      credential here and most finance sites cannot offer anything like it;
      link it prominently.
- [ ] Update `reviewedBy` on all 20 existing articles from "StockPulse
      Editorial" to the actual reviewer's name, and **read them first** — the
      field asserts you did.
- [ ] Set `BRIEF_REVIEWER` as a repository variable so drafted market briefs
      carry the right name instead of "PENDING REVIEW".

Relevant background: no financial credential is required to publish market
research, and claiming one you do not hold would be far worse than claiming
none. "Software engineer who built and published the full methodology and audits
every result in public" is a completely respectable, accurate positioning — and
more verifiable than most bylines in this niche.


## 2. Set the repository URL — [BLOCKER]

`src/config.ts` → `SITE.repoUrl` defaults to `github.com/mudlbum/stockpulse`.
`/contact` presents it as a verifiable transparency channel, so it has to
resolve to the real, public repository.

- [ ] `SITE.repoUrl` points at the actual repo
- [ ] The repo is public (a 404 on this link is worse than no link)

## 3. Fill in the governing law — [BLOCKER]

`src/config.ts` → `SITE.governingLaw` ships as a bracketed placeholder, and
`/terms` shows a warning banner on the live page until it is replaced.

Pick the jurisdiction you actually operate from. An unfilled choice-of-law
clause is worse than none — it advertises that the terms were pasted in and
never read. If you are unsure, this is the single cheapest question to put to a
lawyer.

- [ ] `SITE.governingLaw.en` and `.ko` both replaced
- [ ] `/terms` and `/ko/terms` no longer show the warning banner

## 4. Add a licence file, or accept that no licence is granted — [BLOCKER]

`/terms` says the pipeline is open source and the content is not, and it points
at the repository's licence file for the code. There is currently no `LICENSE`
in the repository, which — as `/terms` states — means no licence has been
granted.

Either add one (MIT or Apache-2.0 for the code is conventional) or leave it
absent deliberately. Do not leave `/terms` pointing at a file you intended to
add and forgot.

- [ ] `LICENSE` added covering the code, **or** the absence is a decision
- [ ] The content/code split in `/terms` §8 still describes reality

## 5. Set the legal effective date — [BLOCKER]

`src/config.ts` → `SITE.legalEffectiveDate` is stamped on `/privacy`, `/terms`
and `/editorial-policy`. Set it to the date you actually publish, and move it
forward whenever the substance of those pages changes. Never backdate it —
`/privacy` promises in writing that policy changes are not backdated.

- [ ] Effective date matches the real publication date

## 6. Publish real data, not placeholders — [BLOCKER]

The build audit already refuses to publish placeholder or fixture rankings
(`scripts/audit.mjs`), and the deploy workflow bootstraps a real pipeline run on
first deploy. Confirm it worked rather than assuming.

- [ ] `public/data/rankings.json` has `"placeholder": false`
- [ ] No ticker matching `US\d\d` or `KRTEST` anywhere on the site
- [ ] `data-store/ledger.json` contains no synthetic entries

## 7. Verify the build before submitting anything — [ADSENSE]

```bash
SITE_URL=https://you.example BASE_PATH=/            npm run build
SITE_URL=https://you.example BASE_PATH=/stockpulse/ npm run build
BASE_PATH=/stockpulse/ npm run audit
npm run check:layout
npm run contrast
npx astro check
npm test
```

Both base paths must pass. A project-site build that drops the base path
produces a site whose every stylesheet and link 404s, and a reviewer sees a
broken site rather than a policy problem.

- [ ] All of the above green

## 8. Decide the domain — and understand what it does to `ads.txt` — [ADSENSE]

**This is the step most likely to be got wrong, and it is invisible until
AdSense starts warning about unauthorized inventory.**

`ads.txt` is only ever read from the **domain root**. Crawlers fetch
`https://<root-domain>/ads.txt` and nothing else — not a subdirectory, not a
redirect target.

On a GitHub Pages **project site** (`https://mudlbum.github.io/stockpulse/`) the
generated file lands at `https://mudlbum.github.io/stockpulse/ads.txt`. That URL
will never be fetched. The root for that deploy is `mudlbum.github.io`, and the
only file that counts is `https://mudlbum.github.io/ads.txt` — which this
repository does not control.

The generated `/ads.txt` detects this and says so in its own comment header, so
you can confirm the situation by opening the deployed file.

Three options, in order of preference:

1. **Custom apex domain (recommended).**
   ```bash
   ./setup-github.sh --domain stockpulse.example
   ```
   Writes `public/CNAME`, sets `BASE_PATH=/`, registers the domain with Pages
   and enables HTTPS enforcement once the certificate is issued. `ads.txt` then
   lands at the real root. This also fixes canonical URLs and makes the site
   look like a publication rather than a hobby subdirectory — which matters for
   an AdSense review independently of `ads.txt`.

   DNS is still on you: an apex domain needs A/AAAA records pointing at
   GitHub's Pages IPs; a subdomain needs a CNAME record pointing at
   `<user>.github.io`. Pages will not issue a certificate until they resolve.

2. **Deploy as a user site.** Name the repo `<user>.github.io`. It is served
   from the root, so `BASE_PATH=/` and `ads.txt` is in the right place.

3. **Keep the project site and publish `ads.txt` separately.** Put the same
   single line in a `<user>.github.io` repository. Note that this authorizes
   the seller for *every* project site on that `github.io` subdomain, which
   matters if anything else lives there.

Doing nothing is survivable — a missing `ads.txt` is not a policy violation and
ads still serve — but AdSense will warn indefinitely and unauthorized inventory
sells at a discount.

- [ ] Domain decided
- [ ] If custom: DNS resolves, certificate issued, Enforce HTTPS on
- [ ] `https://<root>/ads.txt` returns the file (check the URL, not the repo)

## 9. Content readiness for the AdSense review — [ADSENSE]

AdSense rejects thin sites, sites under construction, and sites whose policy
pages are missing or unreachable. The pages exist; confirm they are reachable
and that the site does not look half-built.

- [ ] `/privacy`, `/terms`, `/editorial-policy`, `/contact` all load in both
      languages and are linked from the footer of every page
- [ ] `/privacy` is reachable in ≤1 click from anywhere (it is, via the footer)
- [ ] Real rankings are published on every board that is supposed to publish
- [ ] `/alerts` still honestly describes its form as not connected — an inert
      form is fine; a form that pretends to work is not
- [ ] No page reads as "coming soon"

## 10. Consent management before the first impression — [ADS-ON]

Serving **any** ad impression to a user in the EEA, the UK or Switzerland
requires a Google-certified CMP integrated with the IAB TCF. Mandatory since
January 2024 (EEA/UK) and July 2024 (Switzerland). Without one, that traffic
falls back to non-personalized or limited ads.

This repository integrates **Google's own CMP** (AdSense → Privacy & messaging),
which is TCF-registered, script-tag only, and works on static hosting. There is
deliberately **no hand-rolled consent banner** anywhere in this codebase, and
none should be added: a DIY dialog is not a certified CMP, emits no TC string,
and does not restore personalized-ads eligibility. Building one would be work
that actively makes the situation worse.

Wiring it up:

1. Get approved for AdSense.
2. In AdSense → Privacy & messaging, create a **GDPR message**. Choose the
   regions, publish it. It is delivered automatically through the AdSense tag —
   there is no second script to add.
3. Set `ADSENSE_CLIENT` in `src/config.ts` (or as the `ADSENSE_CLIENT` build
   env var) to your `ca-pub-…` ID. That one value switches on: the AdSense
   script, the CMP, the "Cookie settings" footer control, and the live line in
   `/ads.txt`. Nothing else needs editing.
4. Redeploy and verify from an EEA IP that the dialog appears, and that the
   "Cookie settings" footer link reopens it.

The footer control calls `googlefc.showRevocationMessage()` and falls back to
`__tcfapi('displayConsentUi', …)`. It stays hidden unless one of those APIs is
genuinely present, so it can never be a button that does nothing.

- [ ] GDPR message created and published in AdSense
- [ ] `ADSENSE_CLIENT` set
- [ ] Consent dialog verified from an EEA IP
- [ ] "Cookie settings" link verified to reopen it
- [ ] Verified that with `ADSENSE_CLIENT` unset the site makes **zero**
      third-party requests (network panel, fresh load)

## 11. Korean traffic is a separate problem — [ADS-ON]

**Google's CMP handles TCF and the EEA/UK/Swiss requirement. It does not make
this site PIPA-compliant, and it does not present a Korean consent flow.**

Korea's Personal Information Protection Act applies extraterritorially to a
Korean-language site serving Korean users. The Online Customized Advertising
guidelines require disclosing the behavioural information collected and
transferred, the purposes and methods, the opt-out procedure, retention
periods, redress channels, and the **names of the third parties receiving
behavioural data**. `/ko/privacy` does all of that, names Google LLC explicitly,
separates 제3자 제공 from 처리위탁, and discloses 국외 이전 as its own article.

What the disclosure does **not** do is obtain consent in the form Korean
practice expects, and there are open questions this codebase cannot answer:

- whether your specific setup requires prior opt-in consent for behavioural
  advertising to Korean users, and in what form;
- whether a Korean-language consent flow, separate from the TCF dialog, is
  needed;
- whether the 개인정보 보호책임자 designation in `/ko/privacy` 제10조 — which
  still contains a bracketed placeholder for the operator's name — must be a
  named natural person for a site of this size;
- whether the site's scale triggers any additional obligation.

Treat this as an open item with a real cost attached, not a checkbox.

- [ ] `[운영자 성명 — 공개 전 반드시 기재]` in `/ko/privacy` 제10조 replaced
      with a real name
- [ ] Korean counsel consulted before serving ads to Korean traffic, **or** a
      documented decision to geo-restrict ads away from KR until then
- [ ] Confirm the 국외 이전 table still matches reality if any vendor changes

## 12. Anything that changes the regulatory picture

`/disclaimer` already carries the note, and it is repeated here because it is
the thing most likely to be done casually on a Tuesday:

- Monetizing beyond display ads — subscriptions, sponsorship, affiliate links, a
  paid tier — materially changes the securities-law analysis in both the US and
  Korea, and the publisher's-exclusion reasoning on `/disclaimer` may stop
  applying. In Korea, charging for investment information provided to
  unspecified persons is what 유사투자자문업 regulates.
- Adding anything that responds to an individual reader — a chatbot, a
  questionnaire that outputs a portfolio, personalized alerts — crosses from
  impersonal publication to something else.
- Adding analytics, an embedded video, a comment system or a mailing list widens
  what is collected. `/privacy` states in writing that such a change is
  disclosed **before** it ships. Update the policy first, then deploy.

- [ ] None of the above has happened, or the policy pages were updated first

---

## Placeholder inventory

Every value that ships deliberately unset. Grep-able, in one place.

| Location | Placeholder | Required by |
| --- | --- | --- |
| `src/config.ts` `SITE.contactEmail` | `hello@example.com` | step 1 — BLOCKER |
| `src/config.ts` `SITE.repoUrl` | `github.com/mudlbum/stockpulse` | step 2 — BLOCKER |
| `src/config.ts` `SITE.governingLaw.en/.ko` | `[JURISDICTION …]` / `[관할 …]` | step 3 — BLOCKER |
| `src/config.ts` `SITE.legalEffectiveDate` | `2026-08-15` | step 5 |
| `src/i18n/ui.ts` `ko.privacy` 제10조 | `[운영자 성명 — 공개 전 반드시 기재]` | step 11 |
| `src/config.ts` `ADSENSE_CLIENT` | `''` (inert by design) | step 10 — ADS-ON |
| repository root | no `LICENSE` file | step 4 |

Self-flagging placeholders — these announce themselves on the live site rather
than failing silently:

- `/contact` shows a warning banner while the contact address is an
  `example.com` address.
- `/terms` shows a warning banner while the governing law is unfilled.
- `/ads.txt` prints, in its own comment header, whether it is being served from
  a URL any crawler will actually read.
- `/privacy` states the site's real advertising status, switching automatically
  with `ADSENSE_CLIENT`.

## What is deliberately *not* on this list

- **A cookie banner of our own.** See step 10. Not building one is the correct
  engineering decision, not an omission.
- **Analytics.** `/privacy` currently states plainly that none is installed,
  which is both true and the strongest possible version of that disclosure.
  Adding analytics costs a policy update; weigh it against what it buys.
- **A newsletter.** `/alerts` describes a form that is inert on purpose. Making
  it work requires a mail provider and a working unsubscribe path, which brings
  its own consent obligations.
