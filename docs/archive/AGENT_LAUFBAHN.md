# AGENT_LAUFBAHN

## 1. Klares Ziel (Clear Goal)
**Aktuelles Ziel:** UX/ISO-Standardisierung (modern, konsistent, barrierearm).
**Kontext:**
1. UX-Standardisierung wird in `TODO.md` geplant (Phasen, DoD, Evidence).
2. Fokus: einheitliche Design-Tokens + Screen-Refactor + Accessibility.

## 2. Geräte & Methodik (Device & Methodology)
**Geräte:** Windows Environment, VS Code.
**Methodik:** 
- "Plan-First": Erst Research/Planung, dann Code (TODO.md).
- "Assumption-First": Prüfung existierender Lösungen vor Neuimplementierung.

## 3. Sprachen (Languages)
**Ziel-Sprachen (19):** DE, EN, FR, ES, IT, PT, NL, PL, TR, RU, AR, FA, ZH, JA, KO, VI, UK, RO, EL.

## 4. Struktur (Structure)
**Presentation Layer:**
- `src/presentation/theme/`: Design Tokens.
- `src/presentation/components/`: Primitives (Button, Input, Card, EmptyState).
- `src/presentation/screens/`: Standardisierung aller Screens.

## 5. Qualität & Muster (Quality & Patterns)
- **Accessibility:** WCAG 2.2 AA (Kontrast, Labels, Targets, Focus).
- **Consistency:** Tokens + UI‑Primitives, keine Screen‑Sonderfarben.
- **Graceful Degradation:** Klare Error/Empty/Loading States.

---

## STATUS PROTOKOLL

### [2026-01-17 10:30] UX/ISO Plan erstellt
- **Aktion:** Detailplan für UX/ISO‑Standardisierung angelegt.
- **Dateien:** `TODO.md`, `src/presentation/theme/tokens.ts`, `src/presentation/screens/HomeScreen.tsx`, `src/presentation/components/*`, `src/presentation/screens/PatientInfoScreen.tsx`, `__tests__/presentation/components/*`
- **Zusatz:** `src/presentation/screens/GDPRConsentScreen.tsx`
- **Status:** ✅ PLAN READY

### [2026-01-17 12:00] UX/ISO Phase 1-3 COMPLETE
- **Aktion:** Complete design system and accessibility implementation
- **Phase 1:** Created tokens.ts (colors 25+, spacing 7, radius 4), UI primitives (AppText, AppButton, AppInput, Card, Section, EmptyState), unit tests for all 6 primitives
- **Phase 2:** Refactored ALL 12 screens to use tokens: HomeScreen, PatientInfoScreen, GDPRConsentScreen, QuestionnaireScreen, SummaryScreen, ExportScreen, SavedAnamnesesScreen, CalculatorScreen, VoiceScreen, DataManagementScreen, FeedbackScreen, SelectLanguageScreen
- **Phase 3:** Added accessibility (accessibilityRole, accessibilityLabel, accessibilityState) to all screens:
  - CalculatorScreen: tablist/tab roles with selected state, radiogroups, button roles, nativeID labels for inputs
  - DataManagementScreen: header roles, button roles with disabled states, hint for destructive actions
  - VoiceScreen: header roles, alert for unavailable STT, liveRegion for results
  - SelectLanguageScreen: radiogroup with checked state
- **Phase 4:** Created QUICK_START.md fool-proof guide with screenshot placeholders
- **Tests:** 30 suites pass (158 tests), TypeScript clean
- **Status:** ✅ **PHASES 0-4 COMPLETE**

### [2026-01-09 22:00] APP ERFOLGREICH GESTARTET
- **Aktion:** Build war erfolgreich, aber Deployment via CLI scheiterte (NuGet.VisualStudio.Contracts Mismatch)
- **Workaround:** Manuelle Registrierung via `Add-AppxPackage -Register` + Start via `shell:AppsFolder`
- **Ergebnis:** App läuft (Process ID 6432: anamnese-mobile, Window Host: ApplicationFrameHost)
- **Metro Bundler:** Gestartet in separatem Fenster
- **Status:** ✅ **APP LÄUFT - BEREIT FÜR TESTS**

### [2026-01-09 19:48] Build Fix: react-native-tts TargetPlatformMinVersion
- **Problem:** Build failed mit Error: `Microsoft.UI.Xaml nuget package requires TargetPlatformMinVersion >= 10.0.17763.0 (current project is 16299)`
- **Ursache:** `react-native-tts/windows/RNTTS/RNTTS.vcxproj` hatte `WindowsTargetPlatformMinVersion>10.0.16299.0`
- **Aktion:** 
  1. Geändert auf `10.0.17763.0` in `node_modules/react-native-tts/windows/RNTTS/RNTTS.vcxproj`
  2. Patch erstellt via `npx patch-package react-native-tts`
- **Ergebnis:** Patch gespeichert unter `patches/react-native-tts+4.1.1.patch`
- **Status:** ✅ FIXED, Build läuft erneut.

### [2026-01-09 10:00] Error Elimination Complete
- **Aktion:** 161 Prettier/ESLint Formatierungsfehler behoben via `npx prettier --write`.
- **Aktion:** `any` Type in `SQLitePatientRepository.test.ts` ersetzt durch `{ executeSql: jest.Mock }`.
- **Ergebnis:** 0 Fehler in `src/` und `__tests__/`. 162 node_modules Warnings (react-native-reanimated) verbleiben.
- **Next:** `skipLibCheck: true` in tsconfig.json um Library-Warnings zu suppressen.
- **Status:** **COMPLETED.**

### [2026-01-08 15:30] Feedback Loop Verification
- **Aktion:** Prüfung des Codebase.
- **Ergebnis:** `FeedbackScreen.tsx` und `FeedbackTextBuilder.ts` existieren. Tests verified (PASS).
- **Status:** **COMPLETED.**

### [2026-01-08 15:35] Voice Integration Research & Fix
- **Ziel:** Evaluierung der besten Speech-to-Text Lösung für 19 Sprachen.
- **Problem:** `VoskSpeechService.ts` war falsch benannt (nutzte bereits Native API) und unvollständig (fehlende Sprachen).
- **Aktion:** 
  1. Renamed `VoskSpeechService` -> `SystemSpeechService`.
  2. Updated `languageMap` für alle 19 Sprachen (inkl. KO, VI, RO, EL).
  3. Updated `VoiceScreen.tsx` references.
  4. Updated `QuestionCard.tsx` references and removed legacy re-export.
- **Status:** **COMPLETED.**

### [2026-01-08 15:50] Testing Coverage - SQLitePatientRepository
- **Ziel:** `SQLitePatientRepository` testen.
- **Problem:** `react-native-sqlite-storage` Mocks fehlten in `jest.setup.js`.
- **Aktion:**
  1. Updated `jest.setup.js` mit `react-native-sqlite-storage` Mock.
  2. Created `__tests__/infrastructure/persistence/SQLitePatientRepository.test.ts`.
  3. Verified `save` and `findById(null)` logic.
- **Ergebnis:** PASS.
- **Status:** **COMPLETED.**

## FEATURE 4: Next Steps

### Recommended Actions:
1. **skipLibCheck Fix**: `tsconfig.json` → `"skipLibCheck": true` (eliminiert 162 node_modules Warnings)
2. **Device Test**: `npm run windows` → App auf Windows starten
3. **Voice Test**: Alle 19 Sprachen manuell testen
4. **Feedback Test**: FeedbackScreen → mailto: Link verifizieren

### Pending User Decision:
- Soll ich `skipLibCheck` jetzt aktivieren? (Empfohlen: JA)


### Evaluation Table

| Solution | Model / Source | Cost | Privacy | Offline | Latency | Coverage (19 Langs) | Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Native OS (React Native Voice)** | Apple (Siri) / Google (Assistant) | **Free** (Device-based) | High (On-Device handling) | Hybrid (OS Dependent) | **Very Low** | **100%** (OS supported) | **🏆 PRIORITY 1** |
| **Vosk** | Kaldi (Neural Net) | Free (Open Source) | **Max** (Local) | **Yes** (Full Offline) | Low (Local) | ~90% (Missing specialized models for EL/RO small versions) | **PRIORITY 2 (Backup)** |
| **OpenAI Whisper API** | Server Model | Pricing per Minute | Medium (Server) | No | Medium/High | 100% | Too Expensive / Slow |
| **Google Cloud STT** | Cloud API | Free Tier (60min), then $$ | Medium (Server) | No | Medium | 100% | Too Expensive |

### Strategic Recommendation (The Plan)

**Phase 1: Maximize Native OS Capabilities**
- Nutzen von `@react-native-voice/voice`.
- **Vorteil:** Kein Kostenfaktor, keine App-Größen-Explosion (Vosk Models sind 50MB-1.4GB *pro Sprache*). 19 Sprachen zu bundeln ist unmöglich (~2GB+).
- **OS Support:** iOS und Android unterstützen alle 19 Sprachen nativ out-of-the-box.

**Phase 2: Hybrid Fallback (Optional)**
- Implementierung eines "Language Checks".
- Falls Native Voice fehlschlägt (z.B. Privacy Settings blocken), Hinweis an Nutzer.
- *Verzicht auf Vosk Bundling für alle 19 Sprachen* aufgrund App-Size Constraints (Mobile App Limit < 100-200MB). Vosk nur für Hauptsprachen (DE/EN) als optionaler Download? -> **Out of Scope for minimal MVP**.

### Implementation Plan (Next Steps)
1.  **Check:** Ist `@react-native-voice/voice` korrekt konfiguriert für alle 19 Locales?
2.  **Map:** Erstellung einer Map `AppLocale -> VoiceLocale` (z.B. `de` -> `de-DE`, `ar` -> `ar-SA`).
3.  **UI:** Update `VoiceScreen.tsx` um dynamisch die korrekte Sprache an den Service zu übergeben.

