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
#
set -euo pipefail

REPO="stockpulse"
DRY=0
CONTACT=""

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1; shift ;;
    --email)   CONTACT="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
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
if [ "$REPO" = "${USER}.github.io" ]; then
  SITE_URL="https://${USER}.github.io"
  BASE_PATH="/"
else
  SITE_URL="https://${USER}.github.io"
  BASE_PATH="/${REPO}/"
fi
say "SITE_URL=${SITE_URL}  BASE_PATH=${BASE_PATH}"

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

say "Triggering the first deploy"
run "gh workflow run deploy.yml --repo '${USER}/${REPO}' --ref main || true"

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
  2. Optional: add a free OpenDART key as the secret DART_KEY to switch on
     Korean fundamentals (https://opendart.fss.or.kr) — the single biggest
     upgrade available to this site
  3. Read docs/METHODOLOGY.md §10 before trusting any board
──────────────────────────────────────────────────────────────────────────
EOF
