# Auto-Heal Skill — Self-Repairing Build Pipeline

> OpenClaw skill for autonomous error detection, root cause analysis, and auto-fix.
> Implements Stop-and-Fix policy: errors may only occur ONCE.

## Behavior

When `auto_heal.enabled: true` in `openclaw.json`, this skill intercepts
build/test/lint failures and attempts automated remediation.

## Auto-Heal Strategies

### `on_build_fail: analyze-fix-retry`

**Trigger**: TypeScript compilation error or Webpack build failure.

```
1. CAPTURE error output → buildLogs/autoheal_build_{{timestamp}}.log
2. PARSE error:
   - TS errors: Extract file, line, error code (TS2304, TS2339, etc.)
   - Webpack: Extract module resolution failures
3. CLASSIFY:
   - Missing import   → Add import statement
   - Type mismatch    → Check interface, adjust types
   - Module not found → Check tsconfig paths, install dep
   - Syntax error     → Fix syntax at line
4. APPLY fix using appropriate model:
   - Simple (missing import): copilot-claude-haiku (fast, cheap)
   - Complex (type refactor): copilot-gpt4o (accurate)
   - Architectural (design): copilot-claude-sonnet (reasoning)
5. RE-RUN build
6. If still failing after {{max_attempts}}: STOP, log to LAUFBAHN, alert user
```

### `on_test_fail: isolate-fix-rerun`

**Trigger**: Jest test failure.

```
1. CAPTURE jest output (JSON format) → buildLogs/autoheal_jest_{{timestamp}}.json
2. PARSE failures:
   - Extract test name, file, assertion, expected vs received
3. CLASSIFY:
   - Snapshot outdated → `npm test -- -u --testPathPattern="{{file}}"`
   - Assertion wrong   → Read source + test, determine if code or test is wrong
   - Timeout           → Increase timeout or fix async leak
   - Import error      → Fix module resolution
4. DECIDE: Is the code wrong or the test wrong?
   - If code changed recently (git diff) → likely code needs fix
   - If test is >30 days old and code changed → likely test needs update
5. APPLY fix
6. RE-RUN only the failing test first: `npm test -- --testPathPattern="{{pattern}}"`
7. Then full suite: `npm test -- --ci`
8. If still failing: STOP, create issue draft
```

### `on_lint_fail: auto-fix-commit`

**Trigger**: ESLint errors/warnings.

```
1. RUN: npm run lint:fix
2. If auto-fixable: Stage + commit with message "fix(lint): auto-fix eslint errors"
3. If manual fix needed: Parse error, apply model-guided fix
4. RE-RUN lint
```

## Model Selection for Auto-Heal

| Error Type | Model | Reason |
|------------|-------|--------|
| Missing import | copilot-claude-haiku | Fast, simple pattern |
| Type error (simple) | copilot-claude-haiku | Pattern match |
| Type error (complex) | copilot-gpt4o | Needs context |
| Logic error | copilot-claude-sonnet | Reasoning required |
| Architecture issue | copilot-o1 | Deep analysis |
| Test regression | copilot-o3-mini | Code review strength |

## Copilot Bridge Integration

Auto-heal uses the Copilot Bridge (`localhost:18790`) for model access:

```bash
# Example: Ask model to fix a TS error
curl -s http://localhost:18790/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "auto",
    "task": "debugging",
    "messages": [
      {"role": "system", "content": "Fix this TypeScript error. Return ONLY the corrected code block."},
      {"role": "user", "content": "Error: TS2304 Cannot find name '\''PatientId'\''. File: src/domain/entities/Patient.ts:15"}
    ],
    "max_tokens": 2048,
    "temperature": 0
  }'
```

## Prevention Registry

After each auto-heal, register the fix pattern to prevent recurrence:

```json
// .openclaw/autoheal_registry.json
{
  "patterns": [
    {
      "error": "TS2304",
      "pattern": "Cannot find name 'X'",
      "fix": "Add missing import",
      "occurrences": 1,
      "last_seen": "2026-02-10",
      "prevention": "Added to tsconfig paths / created type definition"
    }
  ]
}
```

## Evidence Requirements

Every auto-heal MUST produce:
1. `buildLogs/autoheal_{{type}}_{{timestamp}}.log` — raw error output
2. `buildLogs/autoheal_fix_{{timestamp}}.diff` — applied fix (git diff)
3. LAUFBAHN entry with `Agent: openclaw` and `Type: auto-heal`

## Limits
- Max 3 auto-heal attempts per error per session
- No auto-heal on `*.sqlite`, `*.keychain-db`, or security-critical files
- No PII in auto-heal logs
- If the same error class occurs >3 times across sessions, escalate to user
