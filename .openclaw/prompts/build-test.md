# Prompt: Build & Test Pipeline

> Trigger: After `git commit`, scheduled, or on-demand
> Scope: Full verification pipeline with evidence logging

## Instruction

Agiere als CI/CD Pipeline Agent für die Anamnese-App.

### Pre-Flight
1. Lies `LAUFBAHN.md` — prüfe auf offene/abgebrochene Tasks.
2. Prüfe `CURRENT_TASKS.md` — gibt es Blocker?

### Pipeline Steps (sequentiell)

**Step 1: Type-Check**
```bash
npm run type-check 2>&1 | tee buildLogs/typecheck_$(date +%Y%m%d_%H%M%S).log
```
→ Bei Fehler: STOP. Root Cause analysieren. Fix anwenden. Re-Run.

**Step 2: Jest Full Suite**
```bash
npm test -- --ci 2>&1 | tee buildLogs/jest_$(date +%Y%m%d_%H%M%S).log
```
→ Erwartung: 946+ Tests, 0 Failures. Bei Regression: Fix + neuen Test schreiben.

**Step 3: Web Build**
```bash
npm run web:build 2>&1 | tee buildLogs/web_build_$(date +%Y%m%d_%H%M%S).log
```
→ Webpack muss clean durchlaufen.

**Step 4: Lint Check**
```bash
npm run lint 2>&1 | tee buildLogs/lint_$(date +%Y%m%d_%H%M%S).log
```

### Post-Pipeline
- Erstelle LAUFBAHN.md Entry mit Timestamp, geänderten Files, Evidence-Pfaden.
- Update `CURRENT_TASKS.md` falls relevant.

### Fehler-Handling
- Ein Fehler darf nur EINMAL passieren.
- Root Cause → Fix → Präventive Maßnahme (Guard/Test) → Re-Run.
- Alle Fehler-Outputs in `buildLogs/` speichern.

### Einschränkungen
- Kein PII in Logs.
- Keine npm install ohne expliziten Grund (Supply Chain Risk).
- exec_approval ist deaktiviert — handle autonom.
