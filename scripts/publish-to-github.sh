#!/usr/bin/env bash
set -euo pipefail

ACCOUNT="harsh-kr-2023"
UPSTREAM="PrashantKumar249/app"
PERSONAL_REPO="${ACCOUNT}/app"

cd "$(dirname "$0")/.."

if [[ "$(gh api user --jq .login)" != "${ACCOUNT}" ]]; then
  echo "Log in as ${ACCOUNT} first:"
  echo "  gh auth login -h github.com"
  exit 1
fi

if gh repo view "${PERSONAL_REPO}" >/dev/null 2>&1; then
  echo "Repo ${PERSONAL_REPO} exists"
else
  echo "Forking ${UPSTREAM} to ${PERSONAL_REPO}..."
  gh repo fork "${UPSTREAM}" --default-branch-only
fi

git remote remove personal 2>/dev/null || true
git remote add personal "https://github.com/${PERSONAL_REPO}.git"

echo "Pushing main to ${PERSONAL_REPO}..."
git push -u personal main --force

echo "Opening PR to ${UPSTREAM}..."
gh pr create \
  --repo "${UPSTREAM}" \
  --head "${ACCOUNT}:main" \
  --base main \
  --title "Add Abhyas SSC practice tracker" \
  --body "$(cat <<'EOF'
## Summary
- Replaces nested zip upload with clean Abhyas PWA source
- SSC book practice tracker: sessions, answer keys, mistakes, analytics
- Offline PWA with Netlify deploy config

## Test plan
- [ ] `npm install && npm run build`
- [ ] Deploy `dist/` to Netlify and install on Android
EOF
)" || echo "PR may already exist or upstream needs to allow forks — push succeeded."

echo "Done: https://github.com/${PERSONAL_REPO}"
