# Copilot ↔ OpenClaw Model Integration

> Configuration for routing OpenClaw tasks through GitHub Copilot's model API.
> This file documents the model strategy and bridge architecture.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────────┐
│   OpenClaw      │────▶│ Copilot      │────▶│ GitHub Copilot API  │
│   Agent         │     │ Bridge       │     │ (api.githubcopilot  │
│                 │◀────│ :18790       │◀────│  .com)              │
└─────────────────┘     └──────────────┘     └─────────────────────┘
        │                       │
        ▼                       ▼
┌─────────────────┐     ┌──────────────┐
│ Task Router     │     │ Token Cache  │
│ (task_routing)  │     │ (gh auth)    │
└─────────────────┘     └──────────────┘
```

## Available Models (via GitHub Copilot)

| Alias | Copilot Model ID | Context | Vision | Tools | Cost | Best For |
|-------|-----------------|---------|--------|-------|------|----------|
| `copilot-gpt4o` | gpt-4o | 128K | ✅ | ✅ | Medium | Code gen, refactoring, debugging |
| `copilot-claude-sonnet` | claude-3.5-sonnet | 200K | ✅ | ✅ | Medium | Architecture, research, security |
| `copilot-claude-haiku` | claude-3.5-haiku | 200K | ❌ | ✅ | Low | Quick tasks, i18n, formatting |
| `copilot-o1` | o1 | 200K | ❌ | ❌ | High | Deep reasoning, security analysis |
| `copilot-o3-mini` | o3-mini | 200K | ❌ | ❌ | Medium | Code review, test gen, deps |

## Task Routing Matrix

| Task Category | Primary Model | Fallback | Rationale |
|---------------|--------------|----------|-----------|
| Code Generation | gpt-4o | claude-sonnet | Fast, accurate code output |
| Code Review | claude-sonnet | o3-mini | Deep reasoning for review |
| Refactoring | gpt-4o | claude-sonnet | Accurate transformations |
| Debugging | gpt-4o | o1 | Quick diagnosis, escalate if complex |
| Complex Debug | o1 | claude-sonnet | Deep chain-of-thought |
| Architecture | claude-sonnet | o1 | System-level reasoning |
| Research | claude-sonnet | gpt-4o | Large context, analytical |
| Security Audit | claude-sonnet | o1 | DSGVO/OWASP expertise |
| Test Generation | o3-mini | gpt-4o | Cost-efficient, good quality |
| i18n Translation | claude-haiku | gpt-4o | Fast, cheap, 19 languages |
| Quick Tasks | claude-haiku | gpt-4o | Low latency, low cost |
| Log Analysis | claude-haiku | claude-sonnet | Pattern matching |
| Dependency Audit | o3-mini | claude-sonnet | Analytical, cost-effective |

## Bridge Setup

### Start the Bridge
```bash
node scripts/copilot-bridge.cjs
# Runs on 127.0.0.1:18790
```

### Verify
```bash
curl http://localhost:18790/health
curl http://localhost:18790/v1/models
curl http://localhost:18790/v1/route/security-audit
```

### Use from OpenClaw
```bash
# Auto-routed by task type:
curl -X POST http://localhost:18790/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "task": "code-review",
    "messages": [
      {"role": "system", "content": "Review this code for DSGVO compliance."},
      {"role": "user", "content": "<code here>"}
    ]
  }'

# Or explicitly choose a model:
curl -X POST http://localhost:18790/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "copilot-o1",
    "messages": [...]
  }'
```

## Auth Requirements

The bridge uses GitHub's existing authentication chain:

1. **`GITHUB_TOKEN`** env var (if set)
2. **`GITHUB_COPILOT_TOKEN`** env var (if set)  
3. **`gh auth token`** CLI fallback

→ No separate API keys needed. GitHub Copilot subscription provides access.

Token refresh is automatic (cached until expiry -60s).

## Cost Optimization

- **Haiku** for routine tasks (i18n, formatting, quick fixes) → lowest cost
- **GPT-4o** for standard development (code gen, refactoring) → balanced
- **Claude Sonnet** for complex analysis (architecture, security) → medium  
- **o1/o3-mini** only for deep reasoning tasks → reserved for high-impact

Estimated daily usage (active development):
- ~50 haiku calls (i18n, formatting): negligible
- ~30 gpt-4o calls (code gen): moderate
- ~10 sonnet calls (reviews, security): moderate
- ~3 o1 calls (architecture decisions): managed

## DSGVO Compliance

- No patient data sent to any model
- Code snippets only — no runtime data, no logs with PII
- All model calls logged locally in `buildLogs/openclaw/copilot_bridge.log`
- PII masking applied before any API call (see `logging.mask_patterns`)
