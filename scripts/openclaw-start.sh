#!/usr/bin/env bash
# ============================================================================
# OpenClaw Full Startup — Launches Bridge + Agent in God Mode
# Usage: bash scripts/openclaw-start.sh [--bridge-only|--agent-only]
# ============================================================================
set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/buildLogs/openclaw"

mkdir -p "$LOG_DIR"

log()  { echo -e "${GREEN}[START]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
fail() { echo -e "${RED}[FAIL]${NC} $*"; exit 1; }

MODE="${1:-full}"

# ── Pre-flight checks ──────────────────────────────────────────────────
log "Pre-flight checks..."

# Node version
NODE_VER=$(node --version 2>/dev/null || echo "none")
if [[ "$NODE_VER" != v22* ]]; then
  warn "Node.js $NODE_VER detected (v22+ recommended). Continuing..."
fi

# GitHub auth
if command -v gh &>/dev/null; then
  if gh auth status &>/dev/null 2>&1; then
    log "GitHub CLI: authenticated"
  else
    warn "GitHub CLI: NOT authenticated (Copilot Bridge will fail)"
    warn "Run: gh auth login"
  fi
fi

# ── PID Management ─────────────────────────────────────────────────────
BRIDGE_PID_FILE="$LOG_DIR/bridge.pid"
AGENT_PID_FILE="$LOG_DIR/agent.pid"

cleanup() {
  log "Shutting down..."
  if [ -f "$BRIDGE_PID_FILE" ]; then
    kill "$(cat "$BRIDGE_PID_FILE")" 2>/dev/null || true
    rm -f "$BRIDGE_PID_FILE"
  fi
  if [ -f "$AGENT_PID_FILE" ]; then
    kill "$(cat "$AGENT_PID_FILE")" 2>/dev/null || true
    rm -f "$AGENT_PID_FILE"
  fi
  log "Cleanup complete."
}

trap cleanup EXIT INT TERM

# ── Start Copilot Bridge ───────────────────────────────────────────────
start_bridge() {
  if [ -f "$BRIDGE_PID_FILE" ] && kill -0 "$(cat "$BRIDGE_PID_FILE")" 2>/dev/null; then
    log "Copilot Bridge already running (PID $(cat "$BRIDGE_PID_FILE"))"
    return 0
  fi

  log "Starting Copilot Bridge on 127.0.0.1:18790..."
  node "$SCRIPT_DIR/copilot-bridge.cjs" \
    >> "$LOG_DIR/copilot_bridge.log" 2>&1 &
  BRIDGE_PID=$!
  echo "$BRIDGE_PID" > "$BRIDGE_PID_FILE"
  
  # Wait for bridge to be ready
  for i in $(seq 1 10); do
    if curl -s http://127.0.0.1:18790/health > /dev/null 2>&1; then
      log "Copilot Bridge: UP (PID $BRIDGE_PID)"
      
      # Show available models
      MODELS=$(curl -s http://127.0.0.1:18790/v1/models 2>/dev/null | \
        node -e "process.stdin.on('data',d=>{try{const m=JSON.parse(d).data.map(x=>x.id);console.log(m.join(', '))}catch{console.log('parse error')}})" 2>/dev/null || echo "unknown")
      log "Available models: $MODELS"
      return 0
    fi
    sleep 1
  done
  
  warn "Copilot Bridge may not be ready (check $LOG_DIR/copilot_bridge.log)"
}

# ── Start OpenClaw Agent ───────────────────────────────────────────────
start_agent() {
  if [ -f "$AGENT_PID_FILE" ] && kill -0 "$(cat "$AGENT_PID_FILE")" 2>/dev/null; then
    log "OpenClaw Agent already running (PID $(cat "$AGENT_PID_FILE"))"
    return 0
  fi

  if ! command -v openclaw &>/dev/null; then
    fail "openclaw not found. Run: npm install -g openclaw@latest"
  fi

  log "Starting OpenClaw Agent (God Mode)..."
  cd "$PROJECT_ROOT"
  
  # Index memory before start
  log "Indexing memory (MEMORY.md, instructions, docs)..."
  openclaw memory index --agent main 2>/dev/null || warn "Memory index skipped"
  
  log "Launching agent..."
  openclaw start \
    --config "$PROJECT_ROOT/.openclaw/openclaw.json" \
    >> "$LOG_DIR/openclaw_agent.log" 2>&1 &
  AGENT_PID=$!
  echo "$AGENT_PID" > "$AGENT_PID_FILE"
  
  sleep 2
  if kill -0 "$AGENT_PID" 2>/dev/null; then
    log "OpenClaw Agent: UP (PID $AGENT_PID)"
  else
    warn "OpenClaw Agent may have exited. Check $LOG_DIR/openclaw_agent.log"
  fi
}

# ── Main ───────────────────────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  OpenClaw God Mode — Anamnese-App DevSecOps Agent       ║"
echo "║  Copilot Model Bridge + Autonomous Shell Agent          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

case "$MODE" in
  --bridge-only)
    start_bridge
    log "Bridge-only mode. Press Ctrl+C to stop."
    wait
    ;;
  --agent-only)
    start_agent
    log "Agent-only mode. Press Ctrl+C to stop."
    wait
    ;;
  full|*)
    start_bridge
    start_agent
    echo ""
    log "All services running:"
    log "  Copilot Bridge:  http://127.0.0.1:18790/health"
    log "  OpenClaw Agent:  http://127.0.0.1:18789"
    log ""
    log "Commands:"
    log "  curl localhost:18790/health       # Bridge health"
    log "  curl localhost:18790/metrics      # Usage stats"
    log "  curl localhost:18790/v1/models    # Available models"
    log ""
    log "Press Ctrl+C to stop all services."
    wait
    ;;
esac
