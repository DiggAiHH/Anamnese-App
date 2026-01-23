# UX/ISO Upgrade Plan (v2026-01-17)

This file is the authoritative execution plan to make the app **more user-friendly** and aligned with **modern standards** (ISO 9241-210 + WCAG 2.2 AA + CRA + GDPR).

## Active Run Tasks (2026-01-23)
- [x] UI polish: unify AppText variants (line-height/weights) and standardize EmptyState typography.
- [x] UI polish: add consistent pressed/disabled/accessible state for AppButton.
- [x] Hardening: add shared user-facing error helper (log + safe Alert) and adopt in key screens.
- [x] Hardening: add safe-mode banners for unavailable native features (voice/storage).
- [x] Tests: update unit tests for AppText/AppButton/EmptyState and new helpers.
- [x] Verification: `npm run type-check` + targeted Jest tests with logs in `buildLogs/`.

## Active Run Tasks (2026-01-23, UI Buttons + i18n + Spot-Checks)
- [x] Replace remaining primary screen buttons with AppButton (skip chips/options).
- [x] Translate `common.featureUnavailable*` across all locales (start ar/fa).
- [x] Windows spot-check with logs in `buildLogs/`.
- [x] Web spot-check with logs in `buildLogs/`.
- [x] Targeted Jest + type-check if required by changes.

## Active Run Tasks (2026-01-23, Remaining Button Unification)
- [x] Inventory remaining TouchableOpacity-based primary actions across screens/components.
- [x] Replace primary actions with AppButton (skip chips/options/toggles/icon buttons).
- [x] Update styles and tests as needed.
- [x] Run targeted Jest + type-check with logs in `buildLogs/`.

## Active Run Tasks (2026-01-23, Web Spot-Check)
- [x] Start web dev server and capture logs in `buildLogs/`.
- [ ] Manually spot-check core flows on web (Home -> Consent -> Questionnaire -> Calculator -> Summary/Export).
- [ ] Document results in Laufbahn files.

## Active Run Tasks (2026-01-23, Required Confirmation Checkbox)
- [x] Identify required confirmation question type and missing UI.
- [x] Implement single-checkbox rendering for required confirmation.
- [x] Update required-answer validation to handle boolean checkbox.
- [x] Add unit test for required checkbox validation.
- [x] Run targeted Jest + type-check with logs in `buildLogs/`.

## Active Run Tasks (2026-01-22, Remaining Questionnaire Issues)
- [x] Fix encryption/decryption failures on web/windows by validating quick-crypto availability and falling back to WebCrypto.
- [x] Add autosave status box (saving/last saved/error) and keep section jump access visible.
- [x] Harden Summary screen for layout errors (guard computed values) and add a safe fallback view on error.
- [x] Add runtime guard to capture/report websocket executor errors (global error handlers + safe alert); repro/capture still pending.
- [x] Fix TTS module export shape to prevent "uncaught runtime error" (CJS/ESM default mismatch hardening).
- [x] Add/adjust tests and run targeted Jest + type-check with logs in `buildLogs/`.

## Active Run Tasks (2026-01-22, Manual Verification)
- [ ] Run questionnaire flow to Summary (web or Windows).
- [ ] Confirm autosave status box shows saving/last saved/error.
- [ ] Confirm Summary fallback renders when questionnaire is missing.
- [ ] Capture any websocket executor error details.

## Active Run Tasks (2026-01-21)
- [x] Update Copilot instructions with cross-platform and workflow enforcement.
- [x] Create detailed agent plan file with 5-point schema + self-prompt.
- [x] Update LAUFBAHN logs for this run (goal/files/evidence).
- [x] Run tests and capture evidence in buildLogs/.
- [ ] Run Android build and capture evidence in buildLogs. (blocked: adb/emulator missing; Gradle TLS/PSK to Maven)
- [x] Scaffold android/ios/macos/web projects and rerun Android build.
- [x] Run web build and capture evidence in buildLogs.
- [x] Update cross-platform capability matrix documentation.
- [x] Run web dev server smoke check and capture evidence in buildLogs.
- [x] Run Windows smoke check and capture evidence in buildLogs.
- [x] Add platform testing guide with prerequisites and commands.

## 1) Ziel (klar, messbar)
- **Primary Goal:** Create a consistent, accessible, and modern UI/UX standard across all screens without breaking existing flows.
- **Definition of Done (DoD):**
  - All screens follow a unified design system (spacing, typography, colors, components).
  - WCAG 2.2 AA checks: contrast, focus order, labels, target sizes.
  - Error/empty/loading states are explicit and user-friendly.
  - Documentation: fool‑proof user guides with screenshot placeholders.
  - Tests updated/added for new UX behavior.

## 2) Geräte & Methodik (Evidence-based)
- **Device Context:** Windows + Android + iOS (primary), with RNW parity.
- **Methodology:**
  - **Audit → Design Tokens → Refactor → Validate → Document**
  - Evidence-based UX: ISO 9241‑210 (human‑centered design), WCAG 2.2 AA.
  - Stop‑and‑Fix: fix issues immediately once discovered.
  - Privacy/CRA: no PII in logs, secure defaults, no secrets in code.

## 3) Sprachen (Languages)
- Must keep i18n intact and never hardcode user-facing text.
- Keep all 19 languages supported (DE, EN, FR, ES, IT, PT, NL, PL, TR, RU, AR, FA, ZH, JA, KO, VI, UK, RO, EL).

## 4) Struktur (Scope & Files)
- **Design System:**
  - Create shared tokens and reusable UI primitives in `src/presentation/components/` and `src/presentation/theme/`.
- **Screens to normalize:**
  - `HomeScreen`, `PatientInfoScreen`, `GDPRConsentScreen`, `QuestionnaireScreen`, `SummaryScreen`, `ExportScreen`, `SavedAnamnesesScreen`, `CalculatorScreen`, `VoiceScreen`, `DataManagementScreen`, `FeedbackScreen`, `SelectLanguageScreen`.
- **Docs:**
  - Add/update fool‑proof guides in `docs/` with screenshot placeholders.

## 5) Qualität & Muster (Quality & Patterns)
- **Accessibility:**
  - Minimum 44x44 tap targets.
  - Explicit `accessibilityLabel`/`Role` for interactive controls.
  - Color contrast >= 4.5:1, focus styles visible.
- **Visual Consistency:**
  - Use shared typography scale, spacing grid, and tokens.
  - Avoid per-screen custom colors unless in token set.
- **State Handling:**
  - Standardize empty/loading/error layouts across screens.
- **Testing:**
  - Add/adjust Jest tests for UX behaviors and edge cases.

---

# Execution Plan (Phased)

## Phase 0 — Inventory & Baseline
- [x] Inventory current UI styles and per-screen inconsistencies.
- [x] Identify accessibility gaps (labels, contrast, focus).
- [x] Create a baseline report in `WORKLOG.md`.

## Phase 1 — Design Tokens + Primitives
- [x] Add `src/presentation/theme/tokens.ts` (colors, spacing, radius, typography).
- [x] Add primitives: `AppText`, `AppButton`, `AppInput`, `Card`, `Section`, `EmptyState`.
- [x] Update one screen as reference (HomeScreen).

## Phase 2 — Screen Standardization
- [x] Apply tokens/primitives to **PatientInfo**.
- [x] Apply tokens/primitives to **GDPRConsent**.
- [x] Apply tokens/primitives to **Questionnaire** + **Summary**.
- [x] Apply tokens/primitives to **Export** + **SavedAnamneses**.
- [x] Apply tokens/primitives to **Calculator** + **Voice**.
- [x] Apply tokens/primitives to **DataManagement** + **Feedback** + **SelectLanguage**.

## Phase 3 — Accessibility & Copy
- [x] Add aria labels + accessibility roles everywhere.
- [x] Ensure all inputs have labels + helper/error text (via nativeID linking).
- [x] Add keyboard focus styling where applicable (via accessibilityState).

## Phase 4 — Documentation (Fool‑Proof Guides)
- [x] Create/refresh guides with screenshot placeholders.
- [x] Add a short "Getting Started" UX walkthrough (QUICK_START.md).

## Phase 5 — Verification
- [x] Run `npm run type-check` and `npm test`.
- [ ] Manual check on Windows RNW and one mobile target.

---

# Evidence Targets
- WCAG 2.2 AA (contrast, labels, target size).
- ISO 9241‑210 (human‑centered workflow).
- GDPR/CRA (privacy by design, secure defaults).

---

# Feature: Session Key + Resume + Re-encrypt (2026-01-xx)

## Tasks
- [x] Add remember-key i18n strings to all locales.
- [x] Implement RAM-only key + opt-in secure storage.
- [x] Persist session snapshot for resume.
- [x] Re-encrypt legacy plaintext on read.
- [x] Add unit tests for key/session/resume/encryption.
- [x] Create markdown error list template.
- [x] Run Jest tests with evidence logs.
- [x] Update LAUFBAHN with changes + verification.

---

# Cross-Platform Readiness (v2026-01-21)

## Phase A - Audit and capability matrix
- [x] Inventory native modules and platform support (ios/android/windows/macos/web).
- [x] Define feature capability matrix and fallbacks.

## Phase B - Runtime guards + shims
- [x] Add platform capability helper and guarded imports for native-only modules.
- [x] Add fallback UX states when features are unavailable on a platform.

## Phase C - Storage and crypto parity
- [ ] Provide persistence implementations for web/macos/windows (SQLite or IndexedDB/Filesystem).
- [x] Ensure encryption provider selection works across all platforms.

## Phase D - Platform scaffolding
- [x] Add ios/android/macos/web project scaffolds and build scripts.
- [ ] Add CI build matrix and smoke tests.

## Phase E - Verification
- [ ] Run type-check + unit tests + per-platform smoke builds.

---

# Runtime Error Fix Plan: "cannot read property 'count' of null"

## System (execute in order, one item at a time)
- [x] 1) Locate the crash source via logs/stacktrace in `buildLogs/` (search for "count" + "null").
- [x] 2) Identify the owning module and data flow (store/service/UI).
- [x] 3) Add null guards and safe defaults (no PII logging).
- [x] 4) Add/adjust unit test to cover null edge case.
- [x] 5) Run targeted test and capture evidence in `buildLogs/`.
- [x] 6) Run `npm run type-check` and capture evidence.
- [ ] 7) Run platform smoke checks (Windows, Web; Android/iOS/macOS if available) and capture evidence.

## Execution Order (element-by-element testing)
- [ ] Home Screen
- [ ] Patient Info
- [ ] GDPR Consent
- [ ] Questionnaire
- [ ] Summary
- [ ] Export
- [ ] Data Management (Backup/Restore)
- [ ] Voice
- [ ] Feedback
- [ ] Select Language

---

# Fix Plan: "Patient not found" after GDPR consent

## Task List (execute in order)
- [x] 1) Confirm call path from GDPR consent → Questionnaire load (store + use case).
- [x] 2) Identify why patient existence check fails (platform SQLite guard vs DB state).
- [x] 3) Fix capability detection to allow SQLite on Windows when available.
- [x] 4) Add/adjust unit tests for platform capabilities + SQLite runtime detection.
- [x] 5) Run targeted tests + type-check with evidence.
- [x] 6) Re-run Windows smoke checks and continue element-by-element verification.

---

# Fix Plan: SQLite not loading (Questionnaire blocked)

## Task List (execute in order)
- [x] 1) Identify failing SQLite module load path and runtime guard conditions.
- [x] 2) Fix module detection/require (default vs CJS export) and ensure openDatabase exists.
- [x] 3) Update unit tests for platform capabilities/SQLite detection.
- [x] 4) Run targeted tests + type-check with evidence.
- [ ] 5) Re-run Windows smoke and continue Questionnaire verification.

---

# Fix Plan: "Decryption failed" + Questionnaire load timeout

## Task List (execute in order)
- [x] 1) Locate exact error source via `buildLogs/` (search: "decryption failed", "timeout", "LoadQuestionnaire"). Capture evidence.
- [x] 2) Trace call path for questionnaire load + decrypt (use-case -> repository -> encryption service). Identify missing key or corrupted payload handling.
- [x] 3) Implement minimal fix (guard + clear error message + retry/skip logic) without logging PII.
- [x] 4) Add/adjust unit tests for decryption failure path + timeout behavior.
- [x] 5) Run targeted tests + type-check with evidence in `buildLogs/`.
- [ ] 6) Re-run Windows smoke + Questionnaire verification (element-by-element).

---

# Improvement Plan: Question Order + Dependencies

## Task List (execute in order)
- [x] 1) Identify missing dependencies and ordering gaps in `questionnaire-template.json`.
- [x] 2) Update template with conditions (station-only fields, "Sonstiges" free-text, consent-dependent signature).
- [x] 3) Add template-based unit tests for dependencies.
- [x] 4) Run targeted tests + type-check with evidence.

---

# Fix Plan: Secure Storage Not Reachable

## Task List (execute in order)
- [x] 1) Confirm platform gating for secure storage (supportsSecureKeychain) and keyManager availability checks.
- [x] 2) Enable macOS secure storage capability if supported by keychain module.
- [x] 3) Update unit tests for platform capabilities and keyManager behavior.
- [x] 4) Run targeted Jest tests + type-check with evidence in `buildLogs/`.
