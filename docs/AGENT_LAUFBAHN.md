# AGENT LAUFBAHN - Anamnese-App

> **Aktiver Tracker für alle Agent-Aktionen | Absoluter Pfad dieser Datei:**
> `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\docs\AGENT_LAUFBAHN.md`

---

## AKTUELLER STATUS (LIVE)

- **Letzter Stand (Fakten, ohne PII):** 2026-01-24 22:03 UTC - Full verification run COMPLETED (28/30 tasks done, 2 deferred).
- **Aktiver Run-ID:** RUN-20260124-full-verification
- **Status:** ✅ COMPLETED
- **Results:**
  - Type-check: PASS
  - Tests: PASS (46 suites, 263 tests)
  - Stop-and-Fix: TTSService.test.ts rewritten
  - Windows: Build + Install SUCCESS
  - Web: Webpack compiles SUCCESS
- **Blocker (DEFERRED):** Android (adb/emulator missing), macOS/iOS (no host).
- **Evidence:** `buildLogs/windows_cleanrun_20260124_220250.log`

- **Platform Blockers (DEFERRED):**
  - **Android:** adb/emulator missing on this host; Gradle TLS/PSK to Maven error.
  - **macOS/iOS:** No macOS host available for builds.

- **Update 2026-01-24 22:52:** PII transcript logs removed from version control; TTS tests expanded (Evidence: `buildLogs/tests_tts_service_update_20260124.out.log`).

---

## AKTUELLER LAUF: 5 Pflichtpunkte (LIVE)

> Run-ID: RUN-20260124-full-verification | Status: **✅ COMPLETED**

1) **Ziel**

- Outcome: Full verification run (type-check, tests, Windows cleanrun + install + launch attempt, web spot-check, manual flow verification) with evidence.
- DoD:
  1. `npm run type-check` success with log `buildLogs/typecheck_20260124_203057.log`.
  2. `npm test` success with log `buildLogs/tests_20260124_203123.log`.
  3. Windows cleanrun + install with log `buildLogs/windows_cleanrun_20260124_220250.log`.
  4. Web spot-check success with log `buildLogs/web_spotcheck.out.log`.
  5. Manual flow verification (Questionnaire autosave, Summary fallback) documented.
  6. Platform blockers (Android/iOS/macOS) documented.
- Nicht-Ziele: No feature changes; no dependency upgrades; no Android/iOS/macOS builds (deferred).

2) **Methodik**

- Repro: Type-check -> Tests -> Windows cleanrun -> Web spot-check -> Manual flow verification.
- Root Cause Hypothesen: Any remaining runtime errors, websocket executor issues, autosave timing.
- Fix-Strategie: Stop-and-Fix bei Fehlern; minimaler Fix; dann weiter.
- Verifikation: buildLogs for each command.

3) **Sprachen/Stack**

- Sprachen: PowerShell, MSBuild, RNW, Node.js.
- Tools: npm scripts, `scripts/windows-cleanrun.ps1`, `scripts/windows-launch.ps1`.
- Constraints: Keine PII in Logs; keine Secrets.

4) **Struktur**

- Dateien/Module (geplant):
  - `CURRENT_TASKS.md`
  - `LAUFBAHN.md`
  - `docs/AGENT_LAUFBAHN.md`
  - `buildLogs/*`
- Logs/Artefakte:
  - `buildLogs/typecheck_20260124_203057.log`
  - `buildLogs/tests_20260124_203123.log`
  - `buildLogs/windows_cleanrun_20260124_220250.log`
  - `buildLogs/web_spotcheck.out.log`

5) **Qualitaet/Muster**

- Tests: Type-check + Jest for baseline evidence.
- Security/Compliance: DSGVO Logging Policy, no PII.
- Maintainability: Evidence-based, all logs captured.

---

## PREVIOUS RUN: Rebuild after reboot (COMPLETED)

3) **Sprachen/Stack**

- Sprachen: PowerShell, MSBuild, RNW.
- Tools: npm scripts, `scripts/windows-cleanrun.ps1`.
- Constraints: Keine PII in Logs; keine Secrets.

4) **Struktur**

- Dateien/Module (geplant):
  - `scripts/windows-cleanrun.ps1`
  - `windows/*`
  - `buildLogs/*`
  - `LAUFBAHN.md`
  - `docs/AGENT_LAUFBAHN.md`
- Logs/Artefakte:
  - `buildLogs/npm_install_rebuild_*`
  - `buildLogs/typecheck_rebuild_*`
  - `buildLogs/tests_rebuild_*`
  - `buildLogs/windows-cleanrun_*`
  - `buildLogs/windows-launch_*`

5) **Qualitaet/Muster**

- Tests: Type-check + Jest for rebuild evidence.
- Security/Compliance: DSGVO Logging Policy, no PII.
- Maintainability: Minimal change-set, path references only.

---

## PREVIOUS RUN: Triage Harness (COMPLETED)

> Run-ID: RUN-20260108-1200-triage-harness | Status: **✅ COMPLETED**

1) **Ziel**

- Outcome: Deterministic build/test runner that captures full logs + compact error summary under `buildLogs/`
- DoD:
  1. Add a generic triage runner (`scripts/triage-run.js`) that writes:
     - full log: `buildLogs/triage_<name>_<timestamp>.log`
     - summary: `buildLogs/triage_<name>_<timestamp>.summary.txt`
  2. Add npm scripts `triage:build`, `triage:test`, `triage:build-and-test`
  3. “Build” step uses `npm run type-check` (fast compiler gate)
  4. “Test” step uses `npm test`
    5. Evidence logs exist and are referenced in Action Ledger:
      - `buildLogs/triage_build_20260108_112504.log`
      - `buildLogs/triage_build_20260108_112504.summary.txt`
      - `buildLogs/triage_test_20260108_112532.log`
      - `buildLogs/triage_test_20260108_112532.summary.txt`
- Nicht-Ziele: Changing app behavior, adding UI features

2) **Methodik**

- Approach: Wrap commands, stream output to terminal + file, post-process summary (no external deps)
- Validation: Run triage build → triage test; fail-fast; patch; re-run
- Evidence: `buildLogs/triage_*` logs and summaries

3) **Sprachen/Stack**

- Sprachen: Node.js (scripts), TypeScript/React Native (app)
- Tools: Jest, TypeScript compiler
- Constraints: DSGVO (keine PII in Logs); 100% FREE; Windows-first

4) **Struktur**

- Dateien/Module:
  - `scripts/triage-run.js` (NEU)
  - `scripts/triage-pipeline.js` (NEU)
  - `package.json` (EDIT: triage npm scripts)
- Logs/Artefakte: `buildLogs/triage_*`

5) **Qualität/Muster**

- Tests: Existing Jest suites remain unchanged
- Security/Compliance: No secrets; avoid printing PII; store logs locally
- Maintainability: Zero deps; small scripts; predictable filenames

---

## PREVIOUS RUN: Voice Integration (COMPLETED)

## VERBINDLICHE AGENT-SOP (v2026-01-08)

**Zweck:** Diese Datei verhindert Verlaufen/Halluzination. Jeder Schritt wird geplant → ausgeführt → verifiziert → dokumentiert.

**Hard Rules (non-negotiable):**

1. **Vor jeder Implementierung:** Plan schreiben (granular, datei-/funktionsbasiert) + Risiken/Compliance kurz scannen.
2. **Nach jeder Aktion (Tool-Call / Code-Change / Run):** Action Ledger + Log Entry hier ergänzen.
3. **Keine Halluzination:** Wenn eine Datei/Definition nicht gelesen wurde → erst lesen (grep/read) oder Tool nutzen.
4. **Keine Fake-Evidence:** Status/Claims nur, wenn Evidence-Dateien existieren (Pfad muss real sein); sonst als **UNVERIFIED** markieren.
5. **DSGVO/CRA Secure Defaults:** Keine PII in Logs; keine Secrets im Code; restriktive Defaults.
6. **Qualität:** Änderungen müssen einen Verifikationsnachweis haben (Test/Build/Probe-Log).

## RUN-ID & AUDIT-LEDGER (NEU, VERBINDLICH)

**Warum:** Damit *jede* Session exakt nachvollziehbar ist (Chat → Tool → Artefakt → Ergebnis → Next).

**Run-ID Format:** `RUN-YYYYMMDD-HHMM-<short-topic>` (lokale Zeit UTC+1)

**Jeder Run MUSS enthalten (in dieser Reihenfolge):**
1. **AKTUELLER LAUF: 5 Pflichtpunkte (LIVE)** (Ziel/Methodik/Stack/Struktur/Qualität)
2. **Action Ledger**: Jede Aktion als Zeile (Tool, Command, Files, Result, Evidence)
3. **AKTUELLER STATUS** Update (nur Fakten + Link zu Evidence)

### ACTION LEDGER (Copy/Paste pro Run)

| Run-ID | Timestamp (UTC+1) | Agent | Intent | Tool/Command | Files touched | Result | Evidence (Pfad) | Next |
|---|---|---|---|---|---|---|---|---|
| RUN-20260123-1237-question-order-audit | 2026-01-23 12:37 | Codex (GPT-5) | Locate question order sources and document them | read + edit | `docs/QUESTION_ORDER_SOURCES.md`, `CURRENT_TASKS.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS | `docs/QUESTION_ORDER_SOURCES.md` | Link CSV/XLSX source if provided |
| RUN-20260121-2038-cross-platform-plan | 2026-01-21 20:38 | Copilot (GPT-5.2) | Cross-platform workflow enforcement + plan doc | edit files | `.github/copilot-instructions.md`, `docs/AGENT_OPTIMAL_PLAN.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md`, `TODO.md` | PARTIAL (tests PASS, android FAIL) | `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log`, `buildLogs/android_run_latest.out.log`, `buildLogs/android_run_latest.err.log` | Scaffold android/ios/macos/web, rerun android |
| RUN-20260108-1500-eliminate-all-errors | 2026-01-08 15:00-16:00 | Copilot (Claude Opus 4.5) | Eliminate ALL TypeScript errors: Add findAll/update to repos, fix backup/restore types, add VoskSpeechService static methods | `npm test`, `replace_string_in_file`, `get_errors` | SQLiteQuestionnaireRepository.ts, SQLitePatientRepository.ts, BackupUseCase.ts, RestoreUseCase.ts, VoskSpeechService.ts, CalculatorScreen.tsx, DataManagementScreen.tsx, .markdownlint.json (renamed) | ✅ PASS (23 suites, 150 tests) | Terminal: 150 tests, 0 src/ errors | Await user input |
| RUN-20260108-1400-compliance-fixes | 2026-01-08 14:00-15:30 | Copilot (Claude Opus 4.5) | GDPR Compliance: PII sanitization, dev-only logging, ErrorBoundary, markdownlint | `npm test`, `create_file`, `replace_string_in_file`, `get_errors` | sanitizeError.ts, logger.ts, ErrorBoundary.tsx, DataManagementScreen.tsx, TTSService.ts, VoskSpeechService.ts, .markdownlintrc.json, sanitizeError.test.ts | ✅ PASS (23 suites, 150 tests) | Terminal output: 150 tests passed | Await user input |
| RUN-20260108-1200-triage-harness | 2026-01-08 12:00-12:30 | Copilot (GPT-5.2) | Add triage log harness for build/test issue capture | `npm run triage:build`, `npm run triage:test` | scripts/triage-run.js, scripts/triage-pipeline.js, package.json, docs/AGENT_LAUFBAHN.md | ✅ PASS (type-check + tests) | `buildLogs/triage_build_20260108_112504.*`, `buildLogs/triage_test_20260108_112532.*` | Use summaries to debug future failures |
| RUN-20260108-0900-usability-features | 2026-01-08 09:00-10:30 | Copilot (Claude Opus 4.5) | 5 Usability Features: Search, Section Nav, Calculators, Backup/Restore, Voice Input | `npm test`, `create_file`, `replace_string_in_file`, Node.js i18n script | ClinicalCalculators.ts, ClinicalCalculators.test.ts, BackupUseCase.ts, RestoreUseCase.ts, SavedAnamnesesScreen.tsx, QuestionnaireScreen.tsx, QuestionCard.tsx, 19 locale files | ✅ PASS (22 suites, 127 tests) | `buildLogs/npm_test_usability_final.log` | Device testing by user |
| RUN-20260108-0530-voice-impl | 2026-01-08 05:30-07:15 | Copilot (Claude Opus 4.5) | Voice Integration (100% FREE): STT+TTS, i18n 19 locales, VoiceScreen UI | `npm test`, `create_file`, `replace_string_in_file` | FeedbackScreen.tsx, TTSService.ts, TTSService.test.ts, VoiceScreen.tsx, RootNavigator.tsx, HomeScreen.tsx, 19 locale files | ✅ PASS (21 suites, 96 tests) | `buildLogs/npm_test_voice_final.log` | Device testing by user |
| RUN-20260109-2300-fix-rnfs-startup-crash | 2026-01-09 23:00 | Copilot (GPT-5.2) | Fix startup crash: "Cannot read properties of undefined (reading rnfsFileType)" by preventing unsafe react-native-fs import when RNFSManager missing | `apply_patch`, `create_file`, `npm.cmd test` | src/shared/rnfsSafe.ts, src/presentation/screens/DataManagementScreen.tsx, src/application/use-cases/ExportGDTUseCase.ts, src/infrastructure/persistence/DatabaseConnection.ts, __tests__/shared/rnfsSafe.test.ts | ✅ FIX APPLIED (runtime guard + tests) | (next) buildLogs/npm_test_rnfs_safe_*.log | Relaunch Windows app |
| RUN-YYYYMMDD-HHMM-topic | YYYY-MM-DD HH:MM | Copilot (GPT-5.2) | 1 Satz | `npm.cmd test` / `apply_patch` / Script | (Liste) | PASS/FAIL | `buildLogs/...` | 1 Satz |

---

## DOKU-STANDARD: FOOL-PROOF GUIDES (SCREENSHOTS)

**Regel:** Bei jeder Anleitung/Guide-Doku: Screenshot-Platzhalter verpflichtend (keine echten Bilder im Repo notwendig).

**Format (exakt):**

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: <Specific Element/Menu>]**

**Beispiele:**

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Home Screen "Neuer Patient" Button]**

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Settings \u2192 "Daten löschen (GDPR)" Confirm Dialog]**

### PRE-FLIGHT (MUSS VOR TOOL/EDITS WAHR SEIN)

- [ ] **5 Pflichtpunkte** sind ausgefüllt (DoD + Evidence definiert)
- [ ] **Kontext gelesen** (mind. betroffene Dateien per read/grep)
- [ ] **Compliance-Scan** ok (keine PII/Secrets/unsafe defaults)
- [ ] **Log-Capture geplant** (`buildLogs/` Pfade festgelegt)

### POST-FLIGHT (MUSS NACH TOOL/EDITS WAHR SEIN)

- [ ] **Action Ledger** ist aktualisiert
- [ ] **Evidence** liegt unter `buildLogs/` (oder `windows/AppPackages/...`)
- [ ] **AKTUELLER STATUS** ist aktualisiert
- [ ] **Wenn FAIL:** Hypothese + minimaler Fix + Re-Run dokumentiert

## AGENT RUNBOOK (DETERMINISTISCH, 100% NACHVOLLZIEHBAR)

**Ziel:** Jeder Agent-Lauf ist reproduzierbar, auditierbar und endet mit Evidence.

### Phase 0 — Intake (Request aufnehmen)
- Request in **eine** klare Arbeitsdefinition überführen (1 Satz).
- Ambiguität: default = **einfachste** Interpretation, die Spec erfüllt.
- Wenn strategische Entscheidung nötig: **Decision Log** schreiben (siehe unten).

### Phase 1 — Kontext (Anti-Halluzination)
- Betroffene Pfade/Interfaces **lesen** (`read/grep/semantic_search`) bevor Annahmen.
- Wenn eine Datei nicht existiert/auffindbar ist: explizit als Blocker protokollieren.

### Phase 2 — Compliance Scan (EU)
- **DSGVO Art. 25/9:** keine PII in Logs/Exceptions.
- **CRA Secure Defaults:** keine offenen Ports/unsichere Defaults; keine Secrets.
- Ergebnis als 2–4 Stichpunkte im Log (ohne PII).

### Phase 3 — Plan (funktionsbasiert)
- Plan muss pro Schritt enthalten: **Datei → Funktion/Modul → Änderung → Verifikation**.
- Scope Guardrails: explizite Nicht-Ziele.

### Phase 4 — Implementierung (minimaler Change-Set)
- Root Cause fixen, nicht Symptome.
- Keine unnötigen Refactors.
- Bei mehreren Files: Reihenfolge dokumentieren (damit man diff/reviewen kann).

### Phase 5 — Verifikation (Evidence)
- Mindestens **eine** der folgenden Evidenzen:
  - `npm.cmd test` (Jest)
  - `npm.cmd run type-check`
  - Windows Build/Package/Launch-Probes (PowerShell scripts)
- Logs müssen in `buildLogs/` landen (stdout/stderr getrennt oder kombiniert).

### Phase 6 — Dokumentation & Handoff
- „AKTUELLER STATUS“ aktualisieren.
- Session Log Entry schreiben: **Was/Warum/Wie/Evidence/Next**.
- Wenn FAIL: Hypothese + minimaler Fix + Re-Run.

## ENFORCEMENT CHECKLIST (MUSS JEDEN LAUF STEUERN)

**A) Vor JEDEM Tool-Call / Code-Change**
1. **AKTUELLER LAUF: 5 Pflichtpunkte** ist ausgefüllt (mindestens DoD + Files + Verifikation).
  - Wenn nicht ausgefüllt: **STOP** (keine Tools, keine Code-Edits).
2. **Kontext ist gelesen** (betroffene Dateien/Interfaces per read/grep; keine Annahmen).
3. **Compliance Scan**: PII/Secrets/Logs geprüft (keine Patientendaten in Debug/Logs).

**B) Nach JEDEM Tool-Call / Code-Change**
1. **Log Entry** in dieser Datei hinzufügen (Timestamp, Aktion, Ergebnis, Artefakte).
2. **Evidence** speichern:
  - Tests: `buildLogs/npm_test_latest.out.log` + `buildLogs/npm_test_latest.err.log` (oder ein kombiniertes `buildLogs/npm_test_latest.log`).
  - Build/Packaging: `buildLogs/*.binlog`, `buildLogs/*_latest.*.log`, `windows/AppPackages/*`.
3. **Wenn FAIL:** Root Cause Hypothese + minimaler Fix + Re-Run dokumentieren.

## LOGGING POLICY (DSGVO ART. 25/9)

**Strikt verboten in Logs/Console:** Namen, E-Mail, Telefonnummer, Adressen, Freitext-Anamnese, Diagnosen, IDs von Patienten, Tokens/Keys, Device IDs, IPs.

**Erlaubt:** technische Pfade, Stacktraces ohne PII, Status/ExitCodes, Hashes/UUIDs ohne Patientenbezug, Build-/Test-Metadaten.

## „MEMORY“ GARANTIE

Diese Datei ist die verbindliche Erinnerung: **jede Session endet** mit einem Update von:
- „AKTUELLER STATUS“ (Letzter Stand + aktiver Task + Blocker)
- „SESSION LOG“ (mindestens 1 Log Entry pro Run)

## 5 PFLICHTPUNKTE (MÜSSEN IMMER BEANTWORTET WERDEN)

Diese 5 Punkte müssen in JEDEM neuen Vorhaben in dieser Datei stehen (Section „AKTUELLER LAUF: 5 Pflichtpunkte“).

### 1) Klares Ziel (Outcome)
- **Business Outcome:** Was ist nachher messbar besser?
- **Definition of Done (DoD):** 3–7 überprüfbare Kriterien.
- **Nicht-Ziele:** Was wird explizit NICHT gemacht (Scope Guardrails).

### 2) Methodik (Evidence-Based)
- **Diagnose-First:** Repro → Root Cause → minimaler Fix → Verifikation.
- **Barbell Context:** Regeln/Compliance am Anfang; aktiver Code/Fehlerlogs am Ende.
- **Tool-Disziplin:** grep/read bevor Änderungen; Tests/Builds mit Log-Capture.
- **Fallback-Strategie:** Wenn Fix scheitert: isolieren, minimal repro, alternative Route.

### 3) Sprachen/Tech-Stack (Constraints)
- **Primär:** TypeScript/React Native (Windows), Node.js Tooling, PowerShell Scripts.
- **Test:** Jest.
- **Build/Packaging:** MSBuild / RNW.
- **Verbote:** Keine Secrets hardcoden; keine PII in Console/Logs.

### 4) Struktur (Repo-Navigation & Artefakte)
- **Wo liegt die Wahrheit?** (Root, src/, windows/, scripts/, buildLogs/)
- **Welche Dateien werden verändert?** Liste der Pfade.
- **Welche Artefakte beweisen Erfolg?** (z.B. buildLogs/*.log, AppPackages/*.msix)

### 5) Qualität & Muster (Clean, Test, Security)
- **Patterns:** Clean Architecture/UseCases/DTOs (keine ORM Entities nach außen).
- **Tests:** Unit/Integration passend zum Change; Edge-Cases abdecken.
- **Security:** Privacy-by-Design, Data-Minimization, kein PII Logging.
- **Performance/Maintenance:** Minimal change-set, keine unnötigen Refactors.

---

## TEMPLATE: AKTUELLER LAUF: 5 Pflichtpunkte (Copy/Paste)

### AKTUELLER LAUF: 5 Pflichtpunkte

1) **Ziel**
- Outcome:
- DoD:
- Nicht-Ziele:

2) **Methodik**
- Repro:
- Root Cause Hypothesen:
- Fix-Strategie:
- Verifikation:

3) **Sprachen/Stack**
- Sprachen:
- Tools:
- Constraints:

4) **Struktur**
- Dateien/Module:
- Logs/Artefakte:

5) **Qualität/Muster**
- Tests:
- Security/Compliance:
- Maintainability:

---

## TEMPLATE: TOOL-/AKTIONS-LOG (Copy/Paste)

### Log Entry
- **Timestamp (UTC+1):** YYYY-MM-DD HH:MM
- **Agent:** Copilot (GPT-5.2)
- **Kontext:** (kurz) Was ist das Problem / Ziel?
- **Aktion:** (konkret) Welche Datei/Command/Tool?
- **Ergebnis:** Pass/Fail + wichtigste Beobachtung (ohne PII)
- **Artefakte:** buildLogs/<file> oder Pfade
- **Nächster Schritt:** 1 Satz

### Decision Log (nur wenn nötig)
- **Timestamp (UTC+1):** YYYY-MM-DD HH:MM
- **Decision:** 1 Satz
- **Optionen:** A/B(/C) mit 1 Satz Tradeoff
- **Gewählt:** A (warum in 1 Satz)
- **Risiko:** 1 Satz
- **Evidence Plan:** Welche Logs/Tests beweisen die Entscheidung?

---

## TEMPLATE: AGENT SELF-PROMPT (für optimale Arbeit)

```xml
<thinking>
  <analysis>Zerlege den Request in atomare Einheiten. Identifiziere Repo-Abhängigkeiten.</analysis>
  <context_check>Welche Dateien/Interfaces fehlen? Welche Tools/Logs brauche ich?</context_check>
  <compliance_scan>DSGVO (Art. 25/17), CRA Secure Defaults, ISO 27001 Logging/Secrets.</compliance_scan>
  <architecture>Wähle Pattern (z.B. UseCase/Service/Script). Begründe kurz.</architecture>
  <strategy>Konkreter Angriffsplan + Verifikation.</strategy>
</thinking>
<plan>
  1. [Datei/Pfad]: Änderung (funktions-/modulgranular)
  2. [Datei/Pfad]: Nächster Schritt
  3. Verification: Test/Build/Probe, der Erfolg beweist
</plan>
```

---

## RUNS (HISTORIE)

> Hier stehen nur **faktische** Runs mit Evidence-Pfaden.

### RUN-20260108-0454-governance

| Run-ID | Timestamp (UTC+1) | Agent | Intent | Tool/Command | Files touched | Result | Evidence (Pfad) | Next |
|---|---|---|---|---|---|---|---|---|
| RUN-20260121-2038-cross-platform-plan | 2026-01-21 20:38 | Copilot (GPT-5.2) | Cross-platform workflow enforcement + plan doc | edit files | `.github/copilot-instructions.md`, `docs/AGENT_OPTIMAL_PLAN.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md`, `TODO.md` | PARTIAL (tests PASS, android FAIL) | `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log`, `buildLogs/android_run_latest.out.log`, `buildLogs/android_run_latest.err.log` | Scaffold android/ios/macos/web, rerun android |
| RUN-20260108-0454-governance | 2026-01-08 04:54 | Copilot (GPT-5.2) | SOP/Laufbahn/Copilot Instructions härten + Evidence erzeugen | `apply_patch` + `npm.cmd test` | `docs/AGENT_LAUFBAHN.md`, `.github/copilot-instructions.md` | PASS | `buildLogs/npm_test_latest.log` | Feedback-Form UseCase/Service + UI planen |

## AKTUELLER STATUS

| Feld | Wert |
|------|------|
| **Letzter Stand** | 2026-01-22 10:01 - Web build PASS after shims + asset loader; capability matrix documented |
| **Aktiver Task** | Cross-Platform Readiness (Android/iOS/macOS/Web verification) |
| **Nächster Schritt** | Android emulator/device setup, then `npm run android` with log-capture |
| **Blockierend?** | Android SDK/emulator missing on this host |

---

## AKTUELLER LAUF: 5 Pflichtpunkte (LIVE)

1) **Ziel**
- Outcome: Test-Run neu starten und Ergebnis als Evidence erfassen (inkl. Fix falls ein Test bricht).
- DoD: (1) `npm test` ist PASS, (2) Logs liegen in `buildLogs/`, (3) Status-Tabelle + Session Log sind aktualisiert.
- Nicht-Ziele: Kein Refactoring, keine Feature-Arbeit, kein Dependency-Update.

2) **Methodik**
- Repro: `npm.cmd test` (Jest) mit Log-Capture.
- Root Cause Hypothesen: Falls FAIL → Ursache im failing Test/Service isolieren.
- Fix-Strategie: Minimaler Fix (Test deterministisch machen, Produktions-Parameter nicht schwächen).
- Verifikation: ExitCode + Jest Summary im Evidence-Log.

3) **Sprachen/Stack**
- Sprachen: Node.js/Jest, PowerShell.
- Tools: npm.
- Constraints: Keine PII in Logs; keine Secrets.

4) **Struktur**
- Dateien/Module: keine Code-Änderungen geplant.
- Logs/Artefakte: `buildLogs/npm_test_20260108_041608.*`.

5) **Qualität/Muster**
- Tests: Jest (Full suite).
- Security/Compliance: Logging Policy oben.
- Maintainability: keine Änderungen.

---

## ACTION LEDGER (LIVE)

| Run-ID | Timestamp (UTC+1) | Agent | Intent | Tool/Command | Files touched | Result | Evidence (Pfad) | Next |
|---|---|---|---|---|---|---|---|---|
| RUN-20260123-1916-rebuild-after-reboot | 2026-01-23 19:16 | Codex (GPT-5) | Full rebuild after reboot with logs | `npm install`, `npm run type-check`, `npm test`, `windows-cleanrun.ps1 -SkipNpmCi`, `windows-launch.ps1` | `buildLogs/*`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PARTIAL (deploy error 100; manual install + launch OK) | `buildLogs/npm_install_rebuild_20260123_1916.*`, `buildLogs/typecheck_rebuild_20260123_1916.*`, `buildLogs/tests_rebuild_20260123_1916.*`, `buildLogs/windows-cleanrun_20260123_2015.*`, `buildLogs/windows-launch_20260123_2112.*`, `buildLogs/windows-dev-run_20260123_1916.*` | User confirms app window |
| RUN-20260122-1920-questionnaire-manual-verify | 2026-01-22 19:20 | Copilot (GPT-5.2) | Plan manual verification run | edit files | `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PENDING (manual UI) | (n/a) | User runs flow, report observations |
| RUN-20260122-1913-questionnaire-remaining | 2026-01-22 19:13 | Copilot (GPT-5.2) | Fix remaining questionnaire issues | `apply_patch`, `npm.cmd test`, `npm.cmd run type-check` | `src/shared/platformCapabilities.ts`, `__tests__/shared/platformCapabilities.test.ts`, `src/presentation/screens/QuestionnaireScreen.tsx`, `src/presentation/screens/SummaryScreen.tsx`, `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PARTIAL (websocket issue pending) | `buildLogs/tests_questionnaire_remaining.out.log`, `buildLogs/typecheck_questionnaire_remaining.out.log` | Capture websocket error repro/logs |
| RUN-20260122-1748-questionnaire-errors | 2026-01-22 17:58 | Copilot (GPT-5.2) | Fix questionnaire runtime errors | `apply_patch`, `npm.cmd test`, `npm.cmd run type-check` | `src/domain/entities/Answer.ts`, `src/domain/entities/__tests__/AnswerCheckboxValidation.test.ts`, `src/presentation/screens/QuestionnaireScreen.tsx`, `src/presentation/screens/SummaryScreen.tsx`, `src/presentation/screens/DataManagementScreen.tsx`, `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS (tests PASS; NativeCommandError on PowerShell) | `buildLogs/tests_questionnaire_errors.out.log`, `buildLogs/typecheck_questionnaire_errors.out.log` | Manual flow check + websocket repro |
| RUN-20260122-1054-multi-platform-ready | 2026-01-22 10:54 | Copilot (GPT-5.2) | Multi-platform readiness runs | `npm run web`, `npm run windows:run:log`, `npm run windows:launch:log`, `npm run android` | none | PARTIAL (web/Windows ok; Android blocked) | `buildLogs/web_latest.out.log`, `buildLogs/web_latest.err.log`, `buildLogs/windows-dev-run_latest.out.log`, `buildLogs/windows-dev-run_latest.err.log`, `buildLogs/windows-launch_latest.out.log`, `buildLogs/windows-launch_latest.err.log`, `buildLogs/android_run_latest.out.log`, `buildLogs/android_run_latest.err.log` | Install Android SDK/emulator; run iOS/macOS on macOS host |
| RUN-20260122-1114-platform-guide | 2026-01-22 11:14 | Copilot (GPT-5.2) | Add platform testing guide | edit files | `docs/PLATFORM_TESTING_GUIDE.md`, `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS (docs only) | (n/a) | Use guide to run platform tests |
| RUN-20260122-1118-count-null-plan | 2026-01-22 11:18 | Copilot (GPT-5.2) | Add fix plan + test order for null count error | edit files | `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS (docs only) | (n/a) | Locate error in logs, then implement fix |
| RUN-20260122-1135-count-null-fix | 2026-01-22 11:35 | Copilot (GPT-5.2) | Fix null count crash + tests | `npm test`, `npm run type-check` | `src/infrastructure/persistence/SQLitePatientRepository.ts`, `src/infrastructure/persistence/DatabaseConnection.ts`, `__tests__/infrastructure/persistence/SQLitePatientRepository.test.ts`, `__tests__/infrastructure/persistence/DatabaseConnection.test.ts`, `__tests__/shared/keyManager.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_count_null.out.log`, `buildLogs/tests_count_null.err.log`, `buildLogs/typecheck_count_null.out.log`, `buildLogs/typecheck_count_null.err.log` | Run platform smoke checks, then element-by-element verification |
| RUN-20260122-1145-cleanrun | 2026-01-22 11:45 | Copilot (GPT-5.2) | Clean rebuild attempt | `npm run windows:cleanrun` | none | UNVERIFIED (detached, no new transcript found) | (n/a) | Proceed with smoke checks |
| RUN-20260122-1152-smoke-rerun | 2026-01-22 11:52 | Copilot (GPT-5.2) | Web/Windows smoke re-run | `npm run web`, `npm run windows:run:log`, `npm run windows:launch:log` | none | PARTIAL (web/Windows ok; Android blocked) | `buildLogs/web_latest.out.log`, `buildLogs/web_latest.err.log`, `buildLogs/windows-dev-run_latest.out.log`, `buildLogs/windows-dev-run_latest.err.log`, `buildLogs/windows-launch_latest.out.log`, `buildLogs/windows-launch_latest.err.log` | Start element-by-element verification |
| RUN-20260122-1220-patient-not-found-fix | 2026-01-22 12:20 | Copilot (GPT-5.2) | Fix patient not found after GDPR consent | `npm test`, `npm run type-check` | `src/shared/platformCapabilities.ts`, `src/infrastructure/persistence/DatabaseConnection.ts`, `__tests__/shared/platformCapabilities.test.ts`, `__tests__/infrastructure/persistence/DatabaseConnection.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_patient_not_found.out.log`, `buildLogs/tests_patient_not_found.err.log`, `buildLogs/typecheck_patient_not_found.out.log`, `buildLogs/typecheck_patient_not_found.err.log` | Re-run Windows smoke + verify GDPR → Questionnaire |
| RUN-20260122-1224-windows-smoke | 2026-01-22 12:24 | Copilot (GPT-5.2) | Windows smoke re-run after fix | `npm run windows:run:log`, `npm run windows:launch:log` | none | PARTIAL (launch PASS, run timed out) | `buildLogs/windows-dev-run_latest.out.log`, `buildLogs/windows-dev-run_latest.err.log`, `buildLogs/windows-launch_latest.out.log`, `buildLogs/windows-launch_latest.err.log` | Verify GDPR → Questionnaire flow |
| RUN-20260122-1230-questionnaire-verify | 2026-01-22 12:30 | Copilot (GPT-5.2) | Questionnaire verification (Windows) | `npm run windows:launch:log` | none | PASS (launch) | `buildLogs/windows-launch_latest.out.log`, `buildLogs/windows-launch_latest.err.log` | Manual Questionnaire checks |
| RUN-20260122-1236-sqlite-plan | 2026-01-22 12:36 | Copilot (GPT-5.2) | Add SQLite loading fix plan | edit files | `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS (docs only) | (n/a) | Implement SQLite module loading fix |
| RUN-20260122-1244-sqlite-fix | 2026-01-22 12:44 | Copilot (GPT-5.2) | Fix SQLite module loading on Windows | `npm test`, `npm run type-check` | `src/shared/platformCapabilities.ts`, `src/infrastructure/persistence/DatabaseConnection.ts`, `__tests__/shared/platformCapabilities.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_sqlite_loading.out.log`, `buildLogs/tests_sqlite_loading.err.log`, `buildLogs/typecheck_sqlite_loading.out.log`, `buildLogs/typecheck_sqlite_loading.err.log` | Re-run Windows smoke + verify Questionnaire |
| RUN-20260122-1305-question-deps | 2026-01-22 13:05 | Copilot (GPT-5.2) | Improve question ordering/dependencies | `npm test`, `npm run type-check` | `src/infrastructure/data/questionnaire-template.json`, `__tests__/infrastructure/data/questionnaireTemplate.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_question_dependencies.out.log`, `buildLogs/tests_question_dependencies.err.log`, `buildLogs/typecheck_question_dependencies.out.log`, `buildLogs/typecheck_question_dependencies.err.log` | Continue element-by-element verification |
| RUN-20260122-1019-android-diagnostics | 2026-01-22 10:19 | Copilot (GPT-5.2) | Diagnose Android tooling availability | `where adb`, `emulator -list-avds`, `java -version`, `gradlew.bat --version` | none | FAIL (adb/emulator missing; Java/Gradle present) | `buildLogs/android_diag_where_adb.out.log`, `buildLogs/android_diag_where_adb.err.log`, `buildLogs/android_diag_emulator_list.out.log`, `buildLogs/android_diag_emulator_list.err.log`, `buildLogs/android_diag_java_version.out.log`, `buildLogs/android_diag_java_version.err.log`, `buildLogs/android_diag_gradle_version.out.log`, `buildLogs/android_diag_gradle_version.err.log` | Install Android SDK/emulator + fix TLS, then rerun |
| RUN-20260122-1016-android-run | 2026-01-22 10:16 | Copilot (GPT-5.2) | Android run with evidence capture | `npm run android` | none | FAIL (adb missing, no emulator, Gradle TLS/PSK error) | `buildLogs/android_run_latest.out.log`, `buildLogs/android_run_latest.err.log` | Prepare Android SDK/emulator + fix TLS, then rerun |
| RUN-20260122-1001-web-build-fix | 2026-01-22 10:01 | Copilot (GPT-5.2) | Fix web build and document platform capabilities | `npm run web:build` + edit files | `webpack.config.js`, `web/shims/*`, `docs/PLATFORM_CAPABILITIES.md`, `TODO.md` | PASS (after fixing initial web bundling errors) | `buildLogs/web_build_latest.out.log`, `buildLogs/web_build_latest.err.log` | Rerun Android when adb/emulator is available |
| RUN-20260121-2038-cross-platform-plan | 2026-01-21 20:38 | Copilot (GPT-5.2) | Cross-platform workflow enforcement + plan doc | edit files | `.github/copilot-instructions.md`, `docs/AGENT_OPTIMAL_PLAN.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md`, `TODO.md` | PARTIAL (tests PASS, android FAIL) | `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log`, `buildLogs/android_run_latest.out.log`, `buildLogs/android_run_latest.err.log` | Scaffold android/ios/macos/web, rerun android |
| RUN-20260108-0518-feedback | 2026-01-08 05:18 | Copilot (Claude Opus 4.5) | Customer Feedback Loop + Voice Research + User Guide | `create_file`, `replace_string_in_file`, `npm test` | `FeedbackTextBuilder.ts`, `FeedbackTextBuilder.test.ts`, `FeedbackScreen.tsx`, `RootNavigator.tsx`, `HomeScreen.tsx`, 19× locales/*.json, `VOICE_INTEGRATION_RESEARCH.md`, `USER_GUIDE.md` | PASS (20 suites, 74 tests) | `buildLogs/npm_test_feedback_20260108_051758.log` | Voice implementation pending user approval |
| RUN-20260108-0416-test-rerun | 2026-01-08 04:16 | Copilot (GPT-5.2) | Jest Suite neu starten + Evidence erfassen | `npm.cmd test` | `buildLogs/npm_test_20260108_041608.*`, `docs/AGENT_LAUFBAHN.md` | PASS (ExitCode=0) | `buildLogs/npm_test_20260108_041608.out.log`, `buildLogs/npm_test_20260108_041608.err.log`, `buildLogs/npm_test_20260108_041608.exitcode.txt` | Await next requirements |
| RUN-20260108-1200-triage-harness | 2026-01-08 12:00 | Copilot (Claude Sonnet 4.5) | Build/Test error capture system | `create_file`, `replace_string_in_file`, `npm run triage:build`, `npm run triage:test` | `scripts/triage-run.js`, `scripts/triage-pipeline.js`, `package.json`, `docs/AGENT_LAUFBAHN.md` | PASS (Type-check + 22 suites, 127 tests) | `buildLogs/triage_build_20260108_112504.*`, `buildLogs/triage_test_20260108_112532.*` | UI Integration ready to start |
| RUN-20260108-1300-ui-integration | 2026-01-08 13:00 | Copilot (Claude Sonnet 4.5) | Wire Clinical Calculators + Backup/Restore to UI | `create_file`, `replace_string_in_file`, `npm run type-check` | `CalculatorScreen.tsx`, `DataManagementScreen.tsx`, `RootNavigator.tsx`, `HomeScreen.tsx`, `de.json`, `en.json`, `docs/AGENT_LAUFBAHN.md` | PASS (Type-check clean) | Type-check output confirming 0 errors | Await next feature request |
| RUN-20260122-1410-decryption-timeout | 2026-01-22 14:10 | Copilot (GPT-5.2) | Add fix plan for decryption failure + questionnaire timeout | edit files | `TODO.md`, `LAUFBAHN.md`, `docs/AGENT_LAUFBAHN.md` | PASS (docs only) | (n/a) | Inspect buildLogs for error traces |
| RUN-20260122-1450-decryption-timeout-fix | 2026-01-22 14:50 | Copilot (GPT-5.2) | Guard decrypt + timebox answer load | `npm test`, `npm run type-check` | `src/application/use-cases/LoadQuestionnaireUseCase.ts`, `src/infrastructure/persistence/SQLiteAnswerRepository.ts`, `__tests__/application/use-cases/LoadQuestionnaireUseCase.test.ts`, `__tests__/infrastructure/persistence/SQLiteAnswerRepository.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_decryption_timeout.out.log`, `buildLogs/tests_decryption_timeout.err.log`, `buildLogs/typecheck_decryption_timeout.out.log`, `buildLogs/typecheck_decryption_timeout.err.log` | Re-run Windows smoke + Questionnaire verify |
| RUN-20260122-1510-questionnaire-verify | 2026-01-22 15:10 | Copilot (GPT-5.2) | Windows smoke + launch for questionnaire verification | `npm run windows:run:log`, `npm run windows:launch:log` | none | PARTIAL (run timeout, launch PASS) | `buildLogs/windows-dev-run_latest.out.log`, `buildLogs/windows-dev-run_latest.err.log`, `buildLogs/windows-launch_latest.out.log`, `buildLogs/windows-launch_latest.err.log` | Verify questionnaire elements in-app |
| RUN-20260122-1540-secure-storage-fix | 2026-01-22 15:40 | Copilot (GPT-5.2) | Enable macOS secure storage + tests | `npm test`, `npm run type-check` | `src/shared/platformCapabilities.ts`, `__tests__/shared/platformCapabilities.test.ts`, `__tests__/shared/keyManager.test.ts`, `TODO.md`, `LAUFBAHN.md` | PASS | `buildLogs/tests_secure_storage.out.log`, `buildLogs/tests_secure_storage.err.log`, `buildLogs/typecheck_secure_storage.out.log`, `buildLogs/typecheck_secure_storage.err.log` | Optional macOS smoke run |

## SESSION LOG

### Session 2026-01-08 (Part 9) - Customer Feedback Loop Implementation
- **Run-ID:** RUN-20260108-0518-feedback
- **Timestamp:** 2026-01-08 05:18
- **Agent:** Copilot (Claude Opus 4.5)
- **Ziel:** Customer Feedback Loop (mailto/copy), Voice Integration Research, User Guide mit Screenshot-Placeholders

**Implementierte Features:**

1. **FeedbackTextBuilder Service** (`src/domain/services/FeedbackTextBuilder.ts`)
   - Domain Service für strukturierten Feedback-Text
   - `build(input)` → {subject, body, fullText}
   - `buildMailtoUri(email, input)` → encoded mailto: URI
   - Sanitization: 2000 char limit, trim, no PII
   
2. **FeedbackTextBuilder Unit Tests** (`src/domain/services/__tests__/FeedbackTextBuilder.test.ts`)
   - 15+ test cases covering: subject format, category labels, locale, timestamp, description sanitization, mailto encoding, GDPR compliance
   - Custom `toStartWith` matcher
   
3. **FeedbackScreen UI** (`src/presentation/screens/FeedbackScreen.tsx`)
   - Category picker (bug/feature/other)
   - Multiline TextInput (2000 char limit)
   - handleSubmit() → Linking.openURL + Clipboard fallback
   - handleCopyOnly() → Clipboard.setString
   - Privacy note section
   
4. **Navigation Integration**
   - `RootNavigator.tsx`: Added Feedback import, route type, Stack.Screen
   - `HomeScreen.tsx`: Added "💬 Send Feedback" button with green styling
   
5. **i18n (19 Locales)**
   - Added `feedback.*` block (17 keys) to all 19 locale files:
   - ar, de, el, en, es, fa, fr, it, ja, ko, nl, pl, pt, ro, ru, tr, uk, vi, zh
   
6. **Voice Integration Research** (`docs/VOICE_INTEGRATION_RESEARCH.md`)
   - Comparative analysis: Google Cloud, Azure, OpenAI, Deepgram, AssemblyAI, Vosk
   - Cost matrix, language coverage (19/19), latency benchmarks
   - GDPR considerations (EU data centers, BAA)
   - Recommendation: Vosk (offline STT) + Azure (TTS/Translation)
   - 3 screenshot placeholders
   
7. **User Guide** (`docs/USER_GUIDE.md`)
   - Fool-proof guide with 25+ screenshot placeholders
   - Sections: Installation, First Launch, Patient Registration, Questionnaire, Export, Feedback, Privacy, Troubleshooting

**Test Results:**
- **PASS** — Test Suites: 20 passed, 2 skipped (22 total)
- **PASS** — Tests: 74 passed, 29 skipped (103 total)
- **Evidence:** `buildLogs/npm_test_feedback_20260108_051758.log`

**Files Created/Modified:**
- NEW: `src/domain/services/FeedbackTextBuilder.ts`
- NEW: `src/domain/services/__tests__/FeedbackTextBuilder.test.ts`
- NEW: `src/presentation/screens/FeedbackScreen.tsx`
- NEW: `docs/VOICE_INTEGRATION_RESEARCH.md`
- NEW: `docs/USER_GUIDE.md`
- MOD: `src/presentation/navigation/RootNavigator.tsx`
- MOD: `src/presentation/screens/HomeScreen.tsx`
- MOD: `src/presentation/i18n/locales/*.json` (19 files)

**Next Steps:**
- Voice Implementation: Pending user approval of Vosk + Azure hybrid recommendation
- Screenshots: Insert actual screenshots at placeholders
- Email: Replace placeholder `feedback@anamnese-app.example` with real developer email

### Session 2026-01-08 (Part 8)
- **Timestamp:** 2026-01-08 04:16
- **Aktion:** Test-Neustart (Jest) mit Log-Capture via `npm.cmd test` + ExitCode Marker.
- **Ergebnis:** PASS — ExitCode=0; `Test Suites: 2 skipped, 19 passed (21 total)`; `Tests: 29 skipped, 57 passed (86 total)`.
- **Artefakte:** `buildLogs/npm_test_20260108_041608.out.log`, `buildLogs/npm_test_20260108_041608.err.log`, `buildLogs/npm_test_20260108_041608.exitcode.txt`.
- **Hinweis:** Unter PowerShell kann Jest-Output im `*.err.log` landen; relevant ist ExitCode=0 + Jest Summary.

### Session 2026-01-08 (Part 7)
- **Timestamp:** 2026-01-08 04:13
- **Aktion:** Test-Neustart (Jest) mit Log-Capture via `npm.cmd test` + ExitCode Marker.
- **Ergebnis:** PASS — ExitCode=0; `Test Suites: 19 passed, 2 skipped (21 total)`.
- **Artefakte:** `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log`, `buildLogs/npm_test_latest.exitcode.txt`.
- **Hinweis:** Unter PowerShell kann Jest-Output im `*.err.log` landen (NativeCommandError), obwohl ExitCode=0 und Suite PASS.

### Session 2026-01-08 (Part 6)
- **Timestamp:** 2026-01-08
- **Aktion:** Jest Re-Run (Smoke) → FAIL wegen Timeout in `WebCryptoEncryptionService` Test.
- **Fix:** `WebCryptoEncryptionService` erhält optionalen `pbkdf2Iterations`-Override; Unit-Test nutzt reduzierte Iterations für schnelle deterministische Runs.
- **Ergebnis:** PASS — `Test Suites: 19 passed, 2 skipped (21 total)`.
- **Artefakte:** `buildLogs/npm_test_latest.log`.

### Session 2026-01-08 (Part 5)
- **Timestamp:** 2026-01-08
- **Aktion:** Test-Neustart (Jest) mit Log-Capture via `npm.cmd test`.
- **Ergebnis:** PASS — `Test Suites: 19 passed, 2 skipped (21 total)` / `Tests: 57 passed, 29 skipped (86 total)`.
- **Artefakte:** `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log`.

### Session 2026-01-08 (Part 4)
- **Timestamp:** 2026-01-08
- **Aktion:** `docs/AGENT_LAUFBAHN.md` um verbindliche Agent-SOP erweitert (5 Pflichtpunkte + Templates + Self-Prompt).
- **Aktion:** Test-Neustart (Jest) mit Log-Capture.
- **Ergebnis:** PASS — `Test Suites: 19 passed, 2 skipped (21 total)` / `Tests: 57 passed, 29 skipped (86 total)`.
- **Artefakte:** `buildLogs/npm_test_latest.out.log`, `buildLogs/npm_test_latest.err.log` (Hinweis: Unter PowerShell kann ein Teil des Jest-Outputs im `*.err.log` landen; das Ergebnis ist trotzdem eindeutig PASS.)

### Session 2026-01-08 (Part 3)
- **Timestamp:** 2026-01-08
- **Aktion:** Verbindliche Agent-SOP (5 Pflichtpunkte) + Laufbahn-Logging-Template in dieser Datei ergänzt.
- **Aktion:** Test-Neustart via `npm test`.
- **Fix:** Roter Test `__tests__/presentation/ToastProvider.test.ts` an aktuelle `shouldShowToast(lastShownAtMs, nowMs, throttleMs)`-Signatur angepasst.

### Session 2026-01-08 (Part 2)

#### Cleanup & GDPR Features
- **Refactoring:** Password Logic aus `MasterPasswordScreen` in Domain Service (`PasswordGenerator`) extrahiert (Clean Architecture).
- **Test:** Unit Tests für `PasswordGenerator` erstellt & bestanden.
- **Feature:** `DeleteAllDataUseCase` implementiert (GDPR Art. 17 - Recht auf Löschung/Vergessenwerden).
  - Wiped SQLite DB (`database.deleteAllData()`).
  - Cleared AsyncStorage (`AsyncStorage.clear()`).
- **UI:** Integration "Delete All Data" Button (Danger Zone) im `HomeScreen`.
- **Test:** Integration Test `__tests__/integration/DeleteAllData.test.ts` erstellt und erfolgreich ausgeführt (Verifiziert SQLite & AsyncStorage mock calls).
- **Status:** Alle geplanten Tasks (Refactoring + Delete Feature + Tests) abgeschlossen.

### Session 2026-01-08

#### 0X:XX - Session-Start
- **Timestamp:** 2026-01-08
- **Implementiert:** Password-Generator + Copy-to-Clipboard im `MasterPasswordScreen` (UX: generieren → kopieren)
- **i18n:** `masterPassword.*` Keys in allen 19 Locales ergänzt/vereinheitlicht
- **i18n:** `scripts/sync-i18n-locales.js` hinzugefügt
- **i18n:** Locales auf `de.json` Keyset synchronisiert
- **Fix:** TypeScript-Typing-Probleme in `QuestionCard` und `RootNavigator` behoben
- **Fix:** `npm install` repariert durch Entfernen der defekten `@react-native-community/cli-platform-windows` Dev-Dependency
- **Installiert:** `@react-native-clipboard/clipboard`
- **Verifiziert:** `npm run type-check` erfolgreich (passing)
- **Verifiziert:** `npm test` erfolgreich (passing)

### Session 2026-01-07

#### 09:XX - Session-Start
- **Aktion:** Kontext aus vorheriger Session geladen
- **Erkenntnisse:**
  - Fragebogen zeigt "wird geladen" dauerhaft
  - Root Cause: `SQLiteQuestionnaireRepository.ts` importierte falsches Template (`.generated.json` statt `.json`)
  - Fix wurde angewendet (Import korrigiert + try-catch-finally in `QuestionnaireScreen.tsx`)
  - Metro + App wurden gestartet

#### 10:XX - Leitplanke erstellt
- **Aktion:** `docs/AGENT_LEITPLANKE.md` erstellt
- **Inhalt:**
  1. ✅ Klares Ziel (19 Sprachen, Datenschutz-Link, Loading-Fix)
  2. ✅ Methodik (Diagnose-First, Tool-Nutzung)
  3. ✅ Sprachen (19 Stück + RTL-Matrix)
  4. ✅ Struktur (Clean Architecture Referenz)
  5. ✅ Qualität (Code-Standards, DSGVO, Tests)
- **Ergebnis:** Datei angelegt unter `c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App\docs\AGENT_LEITPLANKE.md`

#### 10:XX - Laufbahn erstellt
- **Aktion:** Diese Datei (`AGENT_LAUFBAHN.md`) erstellt
- **Zweck:** Tracking aller Agent-Schritte, kein Verlaufen möglich

#### 11:XX - Datenschutz-Link implementiert
- **Aktion:** GDPRConsentScreen erweitert
- **Änderungen:**
  - Modal-State `showPrivacyModal` hinzugefügt
  - TouchableOpacity-Link "Datenschutzerklärung lesen" eingefügt
  - Modal mit vollem GDPR-Text (8 Sektionen, Art. 13/14 konform)
  - Styles für Link + Modal hinzugefügt
- **Aktion:** Alle 19 locale-Dateien aktualisiert
- **Neue Keys:**
  - `gdpr.privacyPolicyLink` - Link-Text
  - `gdpr.privacyPolicyTitle` - Modal-Titel
  - `gdpr.privacyPolicyFullText` - Vollständiger GDPR-Text (8 Sektionen)
- **Sprachen:** ar, de, el, en, es, fa, fr, it, ja, ko, nl, pl, pt, ro, ru, tr, uk, vi, zh
- **RTL:** Arabisch (ar) und Farsi (fa) mit korrektem RTL-Text
- **Ergebnis:** Alle 19 Sprachen haben vollständige Datenschutzerklärung

---

## OFFENE TASKS (Priorisiert)

### P0: Fragebogen-Loading Fix ✅ CODE DONE → VERIFY
| Step | Status | Timestamp |
|------|--------|-----------|
| Root Cause identifiziert | ✅ Done | 2026-01-07 |
| Fix: Import korrigiert | ✅ Done | 2026-01-07 |
| Fix: try-catch-finally | ✅ Done | 2026-01-07 |
| Metro gestartet | ✅ Done | 2026-01-07 |
| App gestartet | ✅ Done | 2026-01-07 |
| Verifikation: Fragen werden angezeigt | ⏳ Pending | - |

---

### P1: i18n 19 Sprachen + Datenschutz-Link ✅ DONE
| Step | Status | Timestamp |
|------|--------|-----------|
| Inventar: 19 Locales vorhanden | ✅ Done | 2026-01-07 |
| GDPRConsentScreen: Link hinzugefügt | ✅ Done | 2026-01-07 |
| GDPRConsentScreen: Modal erstellt | ✅ Done | 2026-01-07 |
| de.json: GDPR-Keys erweitert | ✅ Done | 2026-01-07 |
| en.json: GDPR-Keys erweitert | ✅ Done | 2026-01-07 |
| ar.json: GDPR-Keys erweitert (RTL) | ✅ Done | 2026-01-07 |
| tr.json: GDPR-Keys erweitert | ✅ Done | 2026-01-07 |
| Restliche 15 Locales | ✅ Done | 2026-01-07 |
| TypeScript-Validierung | ✅ Done | 2026-01-07 |

---

### P2: Datenschutz-Link ✅ DONE
| Step | Status | Timestamp |
|------|--------|-----------|
| Consent-Screen identifiziert | ✅ Done | 2026-01-07 |
| Link-Komponente erstellt | ✅ Done | 2026-01-07 |
| Modal-Komponente erstellt | ✅ Done | 2026-01-07 |
| i18n-Keys für Link-Text | ✅ Done | 2026-01-07 |
| Datenschutz-Volltext (de) | ✅ Done | 2026-01-07 |
| Alle 19 Sprachen | ✅ Done | 2026-01-07 |
| Test: Link öffnet Text | ⏳ Verify | - |

---

## ÄNDERUNGSPROTOKOLL

| Timestamp | Datei | Änderung | Agent |
|-----------|-------|----------|-------|
| 2026-01-08 | `package.json` | Dependencies/Script-Konfiguration angepasst | Copilot |
| 2026-01-08 | `package-lock.json` | Lockfile synchronisiert | Copilot |
| 2026-01-08 | `scripts/sync-i18n-locales.js` | NEU: Locale-Key Sync Script | Copilot |
| 2026-01-08 | `src/presentation/screens/MasterPasswordScreen.tsx` | Master Password Screen implementiert/aktualisiert | Copilot |
| 2026-01-08 | `src/presentation/i18n/locales/*.json` | i18n Strings ergänzt/angepasst | Copilot |
| 2026-01-08 | `src/presentation/navigation/RootNavigator.tsx` | Navigation-Flow für Master Password angepasst | Copilot |
| 2026-01-08 | `src/presentation/components/QuestionCard.tsx` | UI/Rendering angepasst | Copilot |
| 2026-01-07 | `SQLiteQuestionnaireRepository.ts` | Import von `.generated.json` → `.json` | Copilot |
| 2026-01-07 | `QuestionnaireScreen.tsx` | try-catch-finally um loadQuestionnaire | Copilot |
| 2026-01-07 | `docs/AGENT_LEITPLANKE.md` | NEU: Vollständige Planungs-Datei | Copilot |
| 2026-01-07 | `docs/AGENT_LAUFBAHN.md` | NEU: Diese Tracking-Datei | Copilot |
| 2026-01-07 | `GDPRConsentScreen.tsx` | Modal-State + Privacy-Link + Modal-UI | Copilot |
| 2026-01-07 | `GDPRConsentScreen.tsx` | Styles für privacyLink + Modal | Copilot |
| 2026-01-07 | `GDPRConsentScreen.tsx` | PRIVACY_POLICY_TEXT Konstante (8 Sektionen) | Copilot |
| 2026-01-07 | `de.json` | gdpr.privacyPolicy* Keys (3 Stück) | Copilot |
| 2026-01-07 | `en.json` | gdpr.privacyPolicy* Keys (3 Stück) | Copilot |
| 2026-01-07 | `ar.json` | gdpr.privacyPolicy* Keys (3 Stück, RTL) | Copilot |
| 2026-01-07 | `tr.json` | gdpr.privacyPolicy* Keys (3 Stück) | Copilot |
| 2026-01-07 | 15 weitere Locales | gdpr.privacyPolicy* Keys (3 Stück je) | Copilot |

---

## FEHLER-LOG

| Timestamp | Fehler | Root Cause | Fix | Status |
|-----------|--------|------------|-----|--------|
| 2026-01-07 | "wird geladen" endlos | Falscher Template-Import | Import-Pfad korrigiert | ✅ Fixed (verify pending) |

---

## NOTIZEN

### Kritische Pfade
```
Template: src/infrastructure/data/questionnaire-template.json
Repository: src/infrastructure/persistence/SQLiteQuestionnaireRepository.ts
Screen: src/presentation/screens/QuestionnaireScreen.tsx
Store: src/presentation/state/useQuestionnaireStore.ts
Locales: src/presentation/i18n/locales/
```

### Build-Kommandos
```powershell
# Metro (separates Fenster)
Start-Process powershell -ArgumentList "-NoExit -Command `"cd '$PWD'; yarn start --reset-cache`""

# App starten
explorer.exe "shell:AppsFolder\cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0_4dnmwfyw5v01r!App"
```

### App Package Info
```
Package Family Name: cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0_4dnmwfyw5v01r
Registration: Add-AppxPackage -Register ".\windows\x64\Debug\anamnese-mobile\AppxManifest.xml"
```

---

**REGEL: Diese Datei NACH JEDEM SCHRITT aktualisieren!**






