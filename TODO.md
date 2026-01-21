# UX/ISO Upgrade Plan (v2026-01-17)

This file is the authoritative execution plan to make the app **more user-friendly** and aligned with **modern standards** (ISO 9241-210 + WCAG 2.2 AA + CRA + GDPR).

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
