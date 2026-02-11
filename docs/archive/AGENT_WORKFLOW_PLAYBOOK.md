# AGENT_WORKFLOW_PLAYBOOK (Fool-Proof, Evidence-Based)

Absolute Root: `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App`
Canonical Runbook: `LAUFBAHN.md`

This document is a *hard guardrail* to prevent drift/hallucinations and to enforce repeatable, test-driven progress.

---

## 0) Non-Negotiables (Always-On)

- **Laufbahn-first:** Start every session by reading `LAUFBAHN.md`.
- **TODO-first:** Never implement without an explicit task list.
- **Stop-and-fix:** Any failure stops the pipeline until fixed.
- **Test-after-each-change:** Every functional change must ship with a unit/regression test and must be executed immediately.
- **Evidence required:** Every verification produces log files under `buildLogs/` and is referenced in `LAUFBAHN.md`.
- **Privacy-by-design:** No PII in logs (DSGVO Art. 9). No secrets hardcoded.

---

## 1) The Mandatory 5-Point Schema (Must be answered)

These 5 points must be answered in the Laufbahn context before work continues.

### 1.1 Clear Goal (Klares Ziel)
- What is the measurable outcome?
- What is Definition of Done (DoD)?
- What is explicitly out-of-scope?

### 1.2 Devices & Methodology (Geräte + Methodik)
- OS / target platforms: **iOS, Android, Windows (RN Windows), Web/WIP if applicable**.
- Methodology: Plan → implement → test → log evidence → repeat.
- Risk controls: stop-and-fix, privacy constraints, secure defaults.

### 1.3 Languages (Sprachen)
- 19 locales supported: `de, en, fr, es, it, pt, nl, pl, tr, ru, ar, fa, zh, ja, ko, vi, uk, ro, el`.
- Any new i18n keys must preserve parity across all locales.

### 1.4 Structure (Struktur)
- UI screens: `src/presentation/screens/*`
- UI tokens/components: `src/presentation/theme/*`, `src/presentation/components/*`
- State: `src/presentation/state/*`
- Domain/app/infra: `src/domain/*`, `src/application/*`, `src/infrastructure/*`
- Tests: `__tests__/*`
- Logs/evidence: `buildLogs/*`

### 1.5 Quality & Patterns (Qualität + Muster)
- Minimal invasive changes; no unrelated refactors.
- WCAG 2.2 AA: labels, roles, contrast, target sizes.
- Security: secure-by-default, no secrets.
- DSGVO: minimize data, isolate PII, no PII in logs.
- Tests: unit/regression tests for behavior changes.

---

## 2) Session Start Checklist (Must run in this order)

1) Read `LAUFBAHN.md`.
2) Extract:
   - last known green test state (what command was last green?)
   - unfinished tasks / open risks
   - any “agent stopped because …” notes
3) Create/refresh a TODO list with:
   - task title
   - affected files
   - verification method + evidence file target
4) Decide **mode**:
   - **Planning mode:** planning only (no file edits/commands)
   - **Execution mode:** implement tasks one-by-one

---

## 3) Execution Workflow (One task at a time)

For each task:

1) **Scope:** Identify minimal set of files to change.
2) **Implement:** Apply the smallest safe fix.
3) **Test (required):**
   - Add/adjust a unit/regression test.
   - Run the most specific test first.
   - If green, run broader tests if warranted.
4) **Evidence:** Ensure logs exist in `buildLogs/` (or are produced by triage scripts).
5) **Log:** Append an entry to `LAUFBAHN.md` with timestamp, files, verification command, evidence paths.

---

## 4) Failure Protocol (Stop-and-Fix + “Error only once”)

If any test/build/script fails:

1) STOP immediately.
2) Root cause analysis:
   - What changed?
   - Why did it fail?
   - What is the minimal fix?
3) Implement the fix.
4) Add prevention so the *same class of failure* cannot recur:
   - regression test OR
   - guard/validation OR
   - more deterministic script invocation OR
   - clearer error reporting (without PII)
5) Re-run the test until green.
6) Log the failure + prevention in `LAUFBAHN.md`.

---

## 5) Test Commands (Preferred)

- Fast typecheck: `npm run type-check`
- Jest: `npm test`
- Full pipeline (build+test evidence): `npm run triage:build-and-test`
- Windows readiness (optional evidence): `npm run windows:ready`

---

## 6) Templates

### 6.1 TODO item template
- Title:
- Goal/DoD:
- Files:
- Test:
- Evidence path(s):

### 6.2 LAUFBAHN.md entry template
- Date/time:
- Goal:
- Changes (files):
- Verification (commands):
- Evidence (`buildLogs/*`):
- Notes (privacy/security):

---

## 7) Quick Reference Commands

### 7.1 Verification (run after every change)
```powershell
# Fast typecheck only
npm run type-check

# Jest tests (all)
npm test

# Full pipeline with evidence logs
npm run triage:build-and-test

# Windows ready-to-test (type-check + Jest + deploy + launch)
npm run windows:ready
```

### 7.2 Targeted test runs
```powershell
# Single test file
npm test -- --testPathPattern="seedData.test"

# Single test suite
npm test -- --testNamePattern="sanitizeError"

# Skip e2e
npm test -- --testPathIgnorePatterns="e2e"
```

### 7.3 i18n verification
```powershell
# Verify all 19 locales have identical keys
npm test -- --testPathPattern="locales.test"
```

### 7.4 Process cleanup (if stuck)
```powershell
# Kill stray Node/Metro processes
Get-Process node,powershell -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -lt (Get-Date).AddHours(-1) } | Stop-Process -Force

# Check what's running
Get-Process node,powershell -ErrorAction SilentlyContinue | Select-Object Name,Id,StartTime | Format-Table
```

---

## 8) Common Pitfalls & Prevention

| Pitfall | Symptom | Prevention |
|---------|---------|------------|
| PII in logs | DSGVO violation; sensitive data exposed | Use `sanitizeError()` from `src/shared/sanitizeError.ts`; never log raw user input |
| Import-time crash | App won't start; red screen | Guard optional native modules with try-catch or `?.` |
| i18n key mismatch | Missing translation; fallback shown | Run `locales.test` after every i18n change |
| Stale Metro cache | Old code running despite changes | `npm start -- --reset-cache` |
| PowerShell quoting | Commands fail silently or with strange errors | Use `Start-Process` with `-RedirectStandardOutput/-Error` for reliable log capture |
| Test pollution | Tests pass alone but fail together | Use `--runInBand` or isolate state in `beforeEach` |

---

## 9) Decision Log Template

When a strategic decision is needed (not purely technical):

```markdown
### Decision: [Short Title]
- **Context:** Why is this decision needed?
- **Options:**
  1. Option A: [description] — Pros/Cons
  2. Option B: [description] — Pros/Cons
- **Chosen:** [A or B]
- **Rationale:** [1-2 sentences]
- **Reversibility:** [Easy / Medium / Hard]
```

---

## 10) Agent Failure Analysis Template

When a prior agent stopped unexpectedly:

```markdown
### Failure Analysis: [Run-ID or Date]
- **Observed:** What happened? (last output, error message)
- **Root Cause:** Why did it fail?
- **Fix Applied:** What was done to resolve?
- **Prevention:** What guard/test/script change prevents recurrence?
- **Evidence:** Path to logs or test proving the fix works.
```

---

## 11) Pre-Flight Checklist (Copy before starting work)

- [ ] Read `LAUFBAHN.md`
- [ ] Identified unfinished tasks from prior session
- [ ] Created/updated TODO list with all tasks
- [ ] Confirmed mode: Planning / Execution
- [ ] Compliance scan: No PII in logs, no hardcoded secrets
- [ ] Evidence paths planned (`buildLogs/*`)

## 12) Post-Flight Checklist (Copy before ending session)

- [ ] All TODO items marked complete or documented as blocked
- [ ] Tests run and green (evidence in `buildLogs/`)
- [ ] `LAUFBAHN.md` updated with today's entry
- [ ] No uncommitted sensitive data
- [ ] If blocked: clear note on what's needed next
