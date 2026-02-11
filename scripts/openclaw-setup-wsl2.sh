#!/usr/bin/env bash
# ============================================================================
# OpenClaw WSL2 Setup — Anamnese-App DevSecOps Agent
# Run inside WSL2 Ubuntu: bash scripts/openclaw-setup-wsl2.sh
# ============================================================================
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[SETUP]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

NODE_REQUIRED="22.12.0"
WORKSPACE_LINK="$HOME/anamnese-app"
WIN_PROJECT="/mnt/c/Users/tubbeTEC/Desktop/Projects/Anamnese-App/Anamnese-App"

# ── Step 1: System dependencies ──────────────────────────────────────────
log "Installing system dependencies..."
sudo apt-get update -qq
sudo apt-get install -y -qq unzip curl git build-essential

# ── Step 2: fnm (Fast Node Manager) ─────────────────────────────────────
if ! command -v fnm &>/dev/null; then
  log "Installing fnm..."
  curl -fsSL https://fnm.vercel.app/install | bash
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env)"
else
  log "fnm already installed."
  eval "$(fnm env)"
fi

# ── Step 3: Node.js 22.12.0 ─────────────────────────────────────────────
CURRENT_NODE=$(node --version 2>/dev/null || echo "none")
if [[ "$CURRENT_NODE" != "v${NODE_REQUIRED}"* ]]; then
  log "Installing Node.js $NODE_REQUIRED (current: $CURRENT_NODE)..."
  fnm install "$NODE_REQUIRED"
  fnm use "$NODE_REQUIRED"
  fnm default "$NODE_REQUIRED"
else
  log "Node.js $CURRENT_NODE already meets requirement."
fi

node --version
npm --version

# ── Step 4: OpenClaw ────────────────────────────────────────────────────
log "Installing OpenClaw globally..."
npm install -g openclaw@latest

OPENCLAW_VERSION=$(openclaw --version 2>/dev/null || echo "unknown")
log "OpenClaw version: $OPENCLAW_VERSION"

# ── Step 5: GitHub CLI (gh) ─────────────────────────────────────────────
if ! command -v gh &>/dev/null; then
  log "Installing GitHub CLI..."
  (type -p wget >/dev/null || sudo apt-get install wget -y -qq)
  sudo mkdir -p -m 755 /etc/apt/keyrings
  wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null
  sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install gh -y -qq
else
  log "GitHub CLI already installed: $(gh --version | head -1)"
fi

# ── Step 6: Workspace symlink ───────────────────────────────────────────
if [ -d "$WIN_PROJECT" ]; then
  if [ ! -L "$WORKSPACE_LINK" ]; then
    log "Creating workspace symlink: $WORKSPACE_LINK -> $WIN_PROJECT"
    ln -sf "$WIN_PROJECT" "$WORKSPACE_LINK"
  else
    log "Workspace symlink already exists."
  fi
else
  warn "Windows project path not found: $WIN_PROJECT"
  warn "Create symlink manually: ln -s /mnt/c/Users/tubbeTEC/.../Anamnese-App ~/anamnese-app"
fi

# ── Step 7: OpenClaw config ─────────────────────────────────────────────
OPENCLAW_DIR="$HOME/.openclaw"
mkdir -p "$OPENCLAW_DIR"

if [ -f "$WIN_PROJECT/.openclaw/openclaw.json" ]; then
  log "Linking OpenClaw config from workspace..."
  ln -sf "$WIN_PROJECT/.openclaw/openclaw.json" "$OPENCLAW_DIR/openclaw.json"
else
  warn "No openclaw.json found in workspace. Create it first."
fi

# ── Step 8: Skills installation ─────────────────────────────────────────
log "Installing OpenClaw skills..."
npx clawhub@latest install gitclaw      || warn "gitclaw install failed"
npx clawhub@latest install github-pr    || warn "github-pr install failed"
npx clawhub@latest install buildlog     || warn "buildlog install failed"
npx clawhub@latest install security-audit || warn "security-audit install failed"

# ── Step 9: Memory indexing ─────────────────────────────────────────────
if [ -d "$WORKSPACE_LINK" ]; then
  log "Indexing workspace memory..."
  cd "$WORKSPACE_LINK"
  openclaw memory index --agent main || warn "Memory indexing failed (first-run OK)"
  openclaw memory add --path ./docs --recursive 2>/dev/null || warn "Docs indexing skipped"
fi

# ── Step 10: Auth check ─────────────────────────────────────────────────
log "Checking GitHub authentication..."
if gh auth status &>/dev/null; then
  log "GitHub CLI authenticated."
else
  warn "GitHub CLI NOT authenticated. Run: gh auth login"
fi

if [ -f "$HOME/.ssh/id_ed25519" ] || [ -f "$HOME/.ssh/id_rsa" ]; then
  log "SSH keys found."
else
  warn "No SSH keys found. Generate with: ssh-keygen -t ed25519"
fi

# ── Step 11: Generate auth token ────────────────────────────────────────
if [ -z "${OPENCLAW_AUTH_TOKEN:-}" ]; then
  TOKEN=$(openssl rand -hex 32)
  log "Generated auth token. Add to ~/.bashrc:"
  echo "  export OPENCLAW_AUTH_TOKEN=\"$TOKEN\""
  echo ""
  echo "export OPENCLAW_AUTH_TOKEN=\"$TOKEN\"" >> "$HOME/.bashrc"
  log "Token appended to ~/.bashrc"
fi

# ── Step 12: Copilot Bridge verification ────────────────────────────────
log "Verifying Copilot Bridge script..."
if [ -f "$WIN_PROJECT/scripts/copilot-bridge.cjs" ]; then
  log "Copilot Bridge found: scripts/copilot-bridge.cjs"
  # Quick syntax check
  node --check "$WIN_PROJECT/scripts/copilot-bridge.cjs" 2>/dev/null && \
    log "Copilot Bridge syntax: OK" || \
    warn "Copilot Bridge syntax check failed"
else
  warn "Copilot Bridge not found at scripts/copilot-bridge.cjs"
fi

# ── Step 13: GitHub Copilot token test ──────────────────────────────────
log "Testing GitHub Copilot API access..."
if command -v gh &>/dev/null && gh auth status &>/dev/null; then
  GH_TOKEN=$(gh auth token 2>/dev/null || echo "")
  if [ -n "$GH_TOKEN" ]; then
    COPILOT_CHECK=$(curl -s -o /dev/null -w "%{http_code}" \
      -H "Authorization: token $GH_TOKEN" \
      -H "User-Agent: openclaw-setup/1.0" \
      "https://api.github.com/copilot_internal/v2/token" 2>/dev/null || echo "000")
    if [ "$COPILOT_CHECK" = "200" ]; then
      log "GitHub Copilot API: ACCESSIBLE (token exchange OK)"
    elif [ "$COPILOT_CHECK" = "401" ]; then
      warn "GitHub Copilot API: 401 — token may lack copilot scope"
    else
      warn "GitHub Copilot API: HTTP $COPILOT_CHECK — check subscription"
    fi
  fi
fi

# ── Step 14: Pre-push hook installation ─────────────────────────────────
if [ -d "$WIN_PROJECT/.git" ]; then
  HOOK_SRC="$WIN_PROJECT/scripts/git-pre-push-hook.sh"
  HOOK_DST="$WIN_PROJECT/.git/hooks/pre-push"
  if [ -f "$HOOK_SRC" ] && [ ! -f "$HOOK_DST" ]; then
    log "Installing pre-push git hook..."
    cp "$HOOK_SRC" "$HOOK_DST"
    chmod +x "$HOOK_DST"
    log "Pre-push hook installed."
  elif [ -f "$HOOK_DST" ]; then
    log "Pre-push hook already installed."
  fi
fi

# ── Summary ─────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo " OpenClaw WSL2 Setup Complete (God Mode + Copilot Bridge)"
echo "============================================================"
echo " Node.js:    $(node --version)"
echo " npm:        $(npm --version)"
echo " OpenClaw:   $OPENCLAW_VERSION"
echo " Workspace:  $WORKSPACE_LINK"
echo " Config:     $OPENCLAW_DIR/openclaw.json"
echo ""
echo " Available Services:"
echo "   OpenClaw Gateway:  127.0.0.1:18789"
echo "   Copilot Bridge:    127.0.0.1:18790"
echo ""
echo " Start commands:"
echo "   1. source ~/.bashrc"
echo "   2. cd ~/anamnese-app"
echo "   3. npm run openclaw:bridge &    # Start Copilot model bridge"
echo "   4. openclaw start               # Start OpenClaw agent"
echo ""
echo " Available models (via Copilot):"
echo "   gpt-4o, claude-3.5-sonnet, claude-3.5-haiku, o1, o3-mini"
echo "============================================================"
