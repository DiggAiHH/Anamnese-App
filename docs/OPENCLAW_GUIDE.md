# OpenClaw Quick Reference

> AI Agent framework for DevSecOps automation in the Anamnese-App project.

## Table of Contents

- [What is OpenClaw?](#what-is-openclaw)
- [Setup](#setup)
- [Quick Start](#quick-start)
- [Common Tasks](#common-tasks)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

## What is OpenClaw?

OpenClaw is an AI agent framework that works alongside GitHub Copilot to provide:

- **Autonomous DevOps**: Automated builds, tests, and deployments
- **Security Scanning**: DSGVO compliance checks, dependency audits, penetration testing
- **Multi-Model Routing**: Smart routing between 5 Copilot models based on task complexity
- **Auto-Healing**: Self-repairing build pipeline that learns from failures
- **Cross-Platform**: Orchestrates builds for Android, iOS, macOS, Windows, and Web

## Setup

### Prerequisites

- Node.js 18+ (Node 22 recommended for OpenClaw)
- Git
- `GITHUB_TOKEN` environment variable (for Copilot bridge)

### One-Time Setup

**On WSL2/Linux:**
```bash
npm run openclaw:setup:wsl
```

**On Windows (PowerShell):**
```powershell
npm run openclaw:setup:win
```

This will:
1. Verify Node.js version
2. Install dependencies
3. Configure the Copilot bridge
4. Set up Git hooks
5. Create necessary directories

### Verify Setup

```bash
node scripts/verify-openclaw-setup.cjs
```

## Quick Start

### Start the OpenClaw Stack

**On WSL2/Linux:**
```bash
npm run openclaw:start
```

**On Windows (PowerShell):**
```powershell
npm run openclaw:start:win
```

This starts:
- **Copilot Bridge** (port 18790) - Routes requests to GitHub Copilot API
- **OpenClaw Agent** (port 18789) - Main agent gateway

### Check Status

```bash
# Bridge health
curl http://127.0.0.1:18790/health

# Available models
curl http://127.0.0.1:18790/v1/models

# Metrics
curl http://127.0.0.1:18790/metrics
```

### Windows Automatic Startup

To have OpenClaw start automatically when Windows boots:

**Install (requires Administrator):**
```powershell
# Run PowerShell as Administrator
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1
```

This creates a Windows Task Scheduler task that:
- Starts OpenClaw 1 minute after Windows boots
- Waits for network availability
- Runs in the background
- Automatically restarts on failure (up to 3 times)

**Test the task:**
```powershell
Start-ScheduledTask -TaskName "OpenClaw Startup"
```

**Uninstall:**
```powershell
# Run PowerShell as Administrator
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1 -Uninstall
```

**View task in Task Scheduler:**
1. Open Task Scheduler (Win+R → `taskschd.msc`)
2. Navigate to "Task Scheduler Library"
3. Find "OpenClaw Startup"

**Logs:** Check `buildLogs/openclaw/startup_*.log` for startup execution logs.

## Common Tasks

### Security & Compliance

```bash
# Quick DSGVO compliance check
npm run openclaw:pentest

# Full penetration test (all phases)
npm run openclaw:pentest:full

# DSGVO-specific checks only
npm run openclaw:pentest:dsgvo

# Supply chain security only
npm run openclaw:pentest:supply
```

### Build & Test

```bash
# Full smoke test (type-check + jest + web build)
npm run smoke-test:full

# Quick smoke test (no tests)
npm run smoke-test:quick

# Type check only
npm run type-check

# Jest tests
npm test
```

### i18n Management

```bash
# Audit all 19 locales for missing keys
npm run i18n:audit

# Auto-fix missing keys
npm run i18n:audit:fix
```

### Git Operations

The pre-push hook automatically runs:
1. TypeScript type check
2. Jest tests
3. Secrets scan

To bypass (use sparingly):
```bash
git push --no-verify
```

## Configuration

### Main Config: `.openclaw/openclaw.json`

```json
{
  "agent": {
    "capabilities": {
      "filesystem": "read_write",
      "shell": "unrestricted",
      "network": "unrestricted"
    },
    "security": {
      "exec_approval": false,  // God Mode enabled
      "sandbox": { "enabled": false }
    }
  },
  "models": {
    "task_routing": {
      "code-generation": { "primary": "copilot-gpt4o" },
      "security-audit": { "primary": "copilot-claude-sonnet" },
      "quick-tasks": { "primary": "copilot-claude-haiku" }
    }
  }
}
```

### Custom Skills: `.openclaw/skills/`

Custom automation skills:
- **anamnese-workflow** - Project-specific commands
- **auto-heal** - Self-repairing build pipeline

### Workflow Prompts: `.openclaw/prompts/`

Pre-configured workflow templates:
- `build-test.md` - CI/CD pipeline
- `git-ops.md` - Git operations
- `i18n.md` - 19-locale management
- `pentest.md` - Security testing
- `research.md` - Dependency analysis
- `cross-platform.md` - Multi-platform builds

## Model Routing

OpenClaw intelligently routes tasks to the best model:

| Task Type | Primary Model | Use Case |
|-----------|--------------|----------|
| Code Generation | GPT-4o | Writing new code, refactoring |
| Code Review | Claude Sonnet | Reviewing PRs, architecture |
| Security Audit | Claude Sonnet | DSGVO checks, vulnerability scanning |
| Complex Debugging | O1 | Deep reasoning, architectural issues |
| Test Generation | O3-mini | Writing unit/integration tests |
| Quick Tasks | Claude Haiku | Formatting, simple fixes |
| i18n Translation | Claude Haiku | 19-language key management |

## Shared State

OpenClaw and GitHub Copilot share:

- **MEMORY.md** - Long-term knowledge base (main session only)
- **LAUFBAHN.md** - Execution log and runbook (all sessions)
- **CURRENT_TASKS.md** - Active task queue (gitignored, local only)

## Logs & Evidence

All execution logs go to `buildLogs/openclaw/`:

```
buildLogs/openclaw/
├── copilot_bridge.log          # Bridge API logs
├── openclaw_agent.log          # Agent execution logs
├── pentest_report_*.md         # Security scan reports (CONFIDENTIAL)
└── [various timestamped logs]
```

**Important:** Pentest reports are gitignored and should NEVER be committed (may contain sensitive findings).

## Troubleshooting

### "Cannot connect to bridge"

1. Check if bridge is running:
   ```bash
   curl http://127.0.0.1:18790/health
   ```

2. Restart the bridge:
   ```bash
   npm run openclaw:bridge
   ```

3. Check logs:
   ```bash
   tail -f buildLogs/openclaw/copilot_bridge.log
   ```

### "GITHUB_TOKEN not set"

Set your GitHub token:
```bash
# WSL2/Linux
export GITHUB_TOKEN="your-token-here"

# Windows (PowerShell)
$env:GITHUB_TOKEN = "your-token-here"
```

Or add to your shell profile (~/.bashrc, ~/.zshrc, or PowerShell profile).

### "Pre-push hook fails"

View the failure logs:
```bash
ls -lt buildLogs/prepush_*.log | head -5
cat buildLogs/prepush_typecheck_XXXXXX.log  # or jest, secrets
```

Fix the issues and try again, or bypass with `--no-verify` if urgent.

### "OpenClaw not responding"

1. Check if processes are running:
   ```bash
   # WSL2/Linux
   ps aux | grep -E "openclaw|copilot-bridge"
   
   # Windows (PowerShell)
   Get-Process | Where-Object {$_.ProcessName -match "node"}
   ```

2. Restart the stack:
   ```bash
   npm run openclaw:start:win  # or :start on WSL2
   ```

3. Check port conflicts:
   ```bash
   # WSL2/Linux
   sudo netstat -tulpn | grep -E "18789|18790"
   
   # Windows (PowerShell)
   Get-NetTCPConnection -LocalPort 18789,18790
   ```

## Advanced Usage

### Start Bridge Only

```bash
npm run openclaw:bridge
```

### Start Agent Only

```bash
npm run openclaw:start:agent-only
```

### Custom Pentest Phases

```bash
# Phase 1: DSGVO compliance
node scripts/openclaw-pentest.cjs --phase=1

# Phase 2: OWASP (not implemented yet)
node scripts/openclaw-pentest.cjs --phase=2

# Phase 3: Supply chain
node scripts/openclaw-pentest.cjs --phase=3
```

## Best Practices

1. **Always run verification before starting**: `node scripts/verify-openclaw-setup.cjs`
2. **Review pentest reports weekly**: They contain actionable security findings
3. **Keep LAUFBAHN.md updated**: Both agents rely on it for context
4. **Don't commit CURRENT_TASKS.md**: It's for local coordination only
5. **Monitor buildLogs/openclaw/**: Watch for patterns in failures
6. **Update auto-heal registry**: After fixing recurring errors, document in `.openclaw/autoheal_registry.json`

## Resources

- [OpenClaw Documentation](https://openclaw.ai/docs)
- [GitHub Copilot API](https://docs.github.com/en/copilot)
- [Copilot Instructions](.github/copilot-instructions.md)
- [Agent Workspace](AGENTS.md)

## Support

For issues specific to this project's OpenClaw setup:
1. Check `LAUFBAHN.md` for recent changes
2. Review `buildLogs/openclaw/` for error logs
3. Run verification: `node scripts/verify-openclaw-setup.cjs`
4. Open an issue on GitHub with logs attached
