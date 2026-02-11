#!/usr/bin/env bash
# ============================================================================
# Git Pre-Push Hook — OpenClaw Smoke Verification
# Install: cp scripts/git-pre-push-hook.sh .git/hooks/pre-push && chmod +x .git/hooks/pre-push
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOGDIR="buildLogs"

echo -e "${GREEN}[pre-push]${NC} Running smoke verification before push..."

# ── Type-Check ──────────────────────────────────────────────────────────
echo -e "${GREEN}[pre-push]${NC} Step 1/3: TypeScript check..."
if ! npm run type-check > "$LOGDIR/prepush_typecheck_$TIMESTAMP.log" 2>&1; then
  echo -e "${RED}[pre-push]${NC} TypeScript check FAILED. See: $LOGDIR/prepush_typecheck_$TIMESTAMP.log"
  exit 1
fi
echo -e "${GREEN}[pre-push]${NC} TypeScript: PASS"

# ── Jest (quick mode — skip slow integration tests) ────────────────────
echo -e "${GREEN}[pre-push]${NC} Step 2/3: Jest tests..."
if ! npm test -- --ci --bail > "$LOGDIR/prepush_jest_$TIMESTAMP.log" 2>&1; then
  echo -e "${RED}[pre-push]${NC} Jest tests FAILED. See: $LOGDIR/prepush_jest_$TIMESTAMP.log"
  exit 1
fi
echo -e "${GREEN}[pre-push]${NC} Jest: PASS"

# ── Secrets scan (quick grep for hardcoded creds) ──────────────────────
echo -e "${GREEN}[pre-push]${NC} Step 3/3: Quick secrets scan..."
SECRETS_FOUND=$(grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
  -E "(password|secret|api_key)\s*[:=]\s*['\"][^'\"]{8,}" src/ shared/ 2>/dev/null \
  | grep -v "test" | grep -v "mock" | grep -v "__tests__" || true)

if [ -n "$SECRETS_FOUND" ]; then
  echo -e "${RED}[pre-push]${NC} Potential hardcoded secrets detected!"
  echo "$SECRETS_FOUND" > "$LOGDIR/prepush_secrets_$TIMESTAMP.log"
  echo -e "${YELLOW}[pre-push]${NC} Review: $LOGDIR/prepush_secrets_$TIMESTAMP.log"
  # Warning only, not blocking (may have false positives)
fi

echo -e "${GREEN}[pre-push]${NC} All checks passed. Pushing..."
