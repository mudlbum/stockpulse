#!/usr/bin/env bash
#
# One-command deploy for StockPulse.
#
# Creates the GitHub repo, pushes, enables Pages with the Actions build source,
# sets the variables the workflows read, and triggers the first deploy.
#
# Idempotent: safe to re-run. If the repo already exists it pushes to it rather
# than failing.
#
# Requires the GitHub CLI, authenticated:
#     gh auth login
#
# Usage:
#     ./setup-github.sh                 # repo name defaults to "stockpulse"
#     ./setup-github.sh my-repo-name
#     ./setup-github.sh --dry-run
#     ./setup-github.sh --email you@example.com
#     ./setup-github.sh --domain stockpulse.example    # custom apex domain
#
# --domain writes public/CNAME, serves the site from the domain root
# (BASE_PATH=/), and registers the domain with Pages. Strongly recommended if
# you intend to run ads: ads.txt is only ever read from the DOMAIN ROOT, and on
# a project-site deploy it lands at /<repo>/ads.txt where no crawler will look.
# See docs/LAUNCH_CHECKLIST.md.
#
set -euo pipefail

REPO="stockpulse"
DRY=0
CONTACT=""
DOMAIN=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --email)   CONTACT="$2"; shift 2 ;;
    --domain)  DOMAIN="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,26p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) REPO="$1"; shift ;;
  esac
done

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m!! \033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mxx \033[0m %s\n' "$*" >&2; exit 1; }
run()  { if [ "$DRY" = 1 ]; then printf '   [dry-run] %s\n' "$*"; else eval "$@"; fi; }

command -v gh  >/dev/null || die "GitHub CLI not found. Install from https://cli.github.com then run: gh auth login"
command -v git >/dev/null || die "git not found."
gh auth status >/dev/null 2>&1 || die "GitHub CLI is not authenticated. Run: gh auth login"

USER="$(gh api user --jq .login)"
say "Authenticated as ${USER}"

# ── the two values that decide whether every URL on the site is correct ──────
# A repo literally named "<user>.github.io" is a USER site served from the
# domain root; anything else is a PROJECT site served from /<repo>/. Getting
# this wrong is what breaks every stylesheet and link on a project-site build,
# so it is derived rather than assumed.
#
# A custom domain overrides both: Pages serves a CNAME'd site from the domain
# root regardless of the repo name, so BASE_PATH goes back to "/".
if [ -n "$DOMAIN" ]; then
  # Accept "https://example.com/" and reduce it to a bare host, because that is
  # the only thing a CNAME file may contain.
  DOMAIN="$(printf '%s' "$DOMAIN" | sed -e 's#^https\?://##' -e 's#/.*$##' -e 's/[[:space:]]//g')"
  case "$DOMAIN" in
    *.*) : ;;
    *) die "--domain expects a hostname like stockpulse.example, got '${DOMAIN}'" ;;
  esac
  SITE_URL="https://${DOMAIN}"
  BASE_PATH="/"
elif [ "$REPO" = "${USER}.github.io" ]; then
  SITE_URL="https://${USER}.github.io"
  BASE_PATH="/"
else
  SITE_URL="https://${USER}.github.io"
  BASE_PATH="/${REPO}/"
fi
say "SITE_URL=${SITE_URL}  BASE_PATH=${BASE_PATH}"

# ── CNAME ───────────────────────────────────────────────────────────────────
# Pages reads the custom domain from a CNAME file at the site root, so it lives
# in public/ and is copied verbatim into dist/ by the build. It must contain the
# bare hostname and nothing else — no scheme, no path, no trailing slash, one
# line. Writing it here rather than by hand keeps it in step with SITE_URL.
#
# DNS is still on you: an apex domain needs A/AAAA records pointing at GitHub's
# Pages IPs, a subdomain needs a CNAME record pointing at <user>.github.io.
# Pages will not issue a certificate until those resolve.
if [ -n "$DOMAIN" ]; then
  say "Writing public/CNAME (${DOMAIN})"
  if [ "$DRY" = 1 ]; then
    printf '   [dry-run] write public/CNAME <- %s\n' "$DOMAIN"
  else
    mkdir -p public
    printf '%s\n' "$DOMAIN" > public/CNAME
  fi
elif [ -f public/CNAME ]; then
  # A stale CNAME silently wins over everything computed above: Pages would keep
  # serving the old domain while every URL in the build points somewhere else.
  warn "public/CNAME exists ($(tr -d '\n' < public/CNAME)) but --domain was not given."
  warn "Pass --domain <that host> to keep it, or delete public/CNAME to serve from github.io."
fi

# ── repo ────────────────────────────────────────────────────────────────────
if gh repo view "${USER}/${REPO}" >/dev/null 2>&1; then
  say "Repo ${USER}/${REPO} already exists — will push to it"
else
  say "Creating ${USER}/${REPO}"
  run "gh repo create '${USER}/${REPO}' --public --description 'Multi-horizon equity screens for US and Korean markets, with a public performance audit' --disable-wiki"
fi

# ── git ─────────────────────────────────────────────────────────────────────
[ -d .git ] || run "git init -q"
run "git symbolic-ref HEAD refs/heads/main 2>/dev/null || git checkout -q -b main"

if ! git remote get-url origin >/dev/null 2>&1; then
  run "git remote add origin 'https://github.com/${USER}/${REPO}.git'"
else
  run "git remote set-url origin 'https://github.com/${USER}/${REPO}.git'"
fi

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  say "Committing working tree"
  run "git add -A"
  run "git commit -q -m 'StockPulse: initial deploy' || true"
fi

say "Pushing to main"
if [ "$DRY" = 0 ]; then
  # HTTPS password auth is dead. If the CLI's credential helper is not wired in,
  # push via the token gh already holds rather than failing with a confusing
  # "Password authentication is not supported" error.
  if ! git push -u origin main 2>/dev/null; then
    warn "Plain push failed — retrying with the gh token"
    TOKEN="$(gh auth token)"
    git push -u "https://${USER}:${TOKEN}@github.com/${USER}/${REPO}.git" main
    git remote set-url origin "https://github.com/${USER}/${REPO}.git"
  fi
fi

# ── variables the workflows read ────────────────────────────────────────────
say "Setting Actions variables"
run "gh variable set SITE_URL  --repo '${USER}/${REPO}' --body '${SITE_URL}'"
run "gh variable set BASE_PATH --repo '${USER}/${REPO}' --body '${BASE_PATH}'"
if [ -n "$CONTACT" ]; then
  run "gh variable set CONTACT_EMAIL --repo '${USER}/${REPO}' --body '${CONTACT}'"
else
  warn "No --email given. SEC asks for a contact address in the User-Agent."
  warn "Set one later with: gh variable set CONTACT_EMAIL --repo ${USER}/${REPO} --body you@example.com"
fi

# ── Pages ───────────────────────────────────────────────────────────────────
# build_type=workflow is what makes Pages serve the Actions artifact rather than
# a branch. The deploy workflow also passes enablement:true to
# actions/configure-pages, because that action only READS the Pages config by
# default and the first run otherwise fails with "Get Pages site failed".
say "Enabling GitHub Pages (source: GitHub Actions)"
if [ "$DRY" = 0 ]; then
  gh api -X POST "repos/${USER}/${REPO}/pages" -f "build_type=workflow" >/dev/null 2>&1 \
    || gh api -X PUT "repos/${USER}/${REPO}/pages" -f "build_type=workflow" >/dev/null 2>&1 \
    || warn "Could not set Pages via API. Set it manually: Settings → Pages → Source: GitHub Actions"
fi

# Register the custom domain with Pages as well as in CNAME. The file alone is
# usually enough — Pages picks it up from the published artifact — but setting
# it through the API means the repo's Pages settings agree with the file, and
# it is what unlocks "Enforce HTTPS" once the certificate is issued.
if [ -n "$DOMAIN" ]; then
  say "Registering custom domain with Pages (${DOMAIN})"
  if [ "$DRY" = 0 ]; then
    gh api -X PUT "repos/${USER}/${REPO}/pages" -f "cname=${DOMAIN}" >/dev/null 2>&1 \
      || warn "Could not set the custom domain via API. Set it manually: Settings → Pages → Custom domain"
    # Certificate provisioning takes a few minutes after DNS resolves, and this
    # call fails until it completes. That is expected on a first run.
    gh api -X PUT "repos/${USER}/${REPO}/pages" -F "https_enforced=true" >/dev/null 2>&1 \
      || warn "Enforce HTTPS not enabled yet — normal until the certificate is issued. Re-run this script, or tick it in Settings → Pages."
  fi
fi

say "Triggering the first deploy"
run "gh workflow run deploy.yml --repo '${USER}/${REPO}' --ref main || true"

# Built here rather than inline in the closing heredoc: a nested heredoc inside
# a command substitution inside a heredoc is exactly the kind of quoting that
# silently prints literal ${BASE_PATH} to the user.
ADS_NOTE=""
if [ "$BASE_PATH" != "/" ]; then
  ADS_NOTE="
  !! This is a PROJECT-SITE deploy (${BASE_PATH}). ads.txt is published at
     ${SITE_URL}${BASE_PATH}ads.txt, which no crawler reads — the only ads.txt
     that counts is ${SITE_URL}/ads.txt. If you intend to run ads, re-run with
     --domain <your-domain>. See docs/LAUNCH_CHECKLIST.md step 8."
fi

cat <<EOF

──────────────────────────────────────────────────────────────────────────
Done.

  Repo   https://github.com/${USER}/${REPO}
  Site   ${SITE_URL}${BASE_PATH}
  Runs   https://github.com/${USER}/${REPO}/actions

The first deploy takes 10-20 minutes: it bootstraps real market data before
publishing, because the repo ships with placeholder rankings and the build
audit refuses to publish those.

Watch it:   gh run watch --repo ${USER}/${REPO}

Still on your plate:
  1. Replace hello@example.com in src/config.ts
  2. Fill in SITE.governingLaw in src/config.ts — /terms shows a warning
     banner until you do
  3. Optional: add a free OpenDART key as the secret DART_KEY to switch on
     Korean fundamentals (https://opendart.fss.or.kr) — the single biggest
     upgrade available to this site
  4. Read docs/METHODOLOGY.md §10 before trusting any board
  5. Before applying to AdSense, work through docs/LAUNCH_CHECKLIST.md in
     order. It covers the placeholders above plus consent, ads.txt and the
     Korean privacy obligations.
${ADS_NOTE}
──────────────────────────────────────────────────────────────────────────
EOF
