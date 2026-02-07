# Git Workflow — Code Audit Session

## Current State

- **Branch:** `copilot/vscode-mkpsvs4r-walf`
- **Base:** `main`
- **Status:** 53 modified files, 18 untracked (new) files

## Recommended Commit Strategy

Split changes into semantic Conventional Commits for clean git history.

### Step 1: Stage & Commit — i18n Sync (from prior session)

```powershell
git add src/presentation/i18n/locales/*.json
git add scripts/fix-i18n-voiceRecognition-nesting.cjs
git commit -m "fix(i18n): sync 47 missing keys across 17 locale files

- Remove duplicate 'accessibleOption' key from en.json/de.json
- Add missing keys: voice.*, questionnaire.progress.*, feedback.*, etc.
- All 19 locales now structurally consistent"
```

### Step 2: Stage & Commit — Security Hardening (Phase 1 Critical + High)

```powershell
git add src/infrastructure/persistence/DatabaseConnection.ts
git add src/presentation/App.tsx
git add src/presentation/components/SessionGuard.tsx
git add src/shared/logger.ts
git add types/modules.d.ts
git commit -m "fix(security): harden SQL, ErrorBoundary, PII logging, typed navigation

- C-1: Parameterize DB_VERSION SQL interpolation (SQLi prevention)
- C-4: Wrap NavigationContainer in ErrorBoundary (crash resilience)
- H-6: Replace (navigation as any).dispatch() with typed navigation
- L-1: Redact PII from production WARN/ERROR/CRITICAL logs
- Add dispatch() to custom StackScreenProps type declaration"
```

### Step 3: Stage & Commit — Robustness Hardening (Phase 1 Medium + Phase 2)

```powershell
git add src/presentation/screens/MasterPasswordScreen.tsx
git add src/presentation/screens/QuestionnaireScreen.tsx
git add src/presentation/screens/FastTrackScreen.tsx
git add src/presentation/screens/PrescriptionRequestScreen.tsx
git add src/presentation/screens/ReferralRequestScreen.tsx
git add src/presentation/screens/SickNoteRequestScreen.tsx
git add src/infrastructure/persistence/SQLiteAnswerRepository.ts
git add src/domain/entities/Document.ts
git add src/domain/value-objects/EncryptedData.ts
git add src/infrastructure/speech/SystemSpeechService.ts
git add src/infrastructure/speech/TTSService.ts
git commit -m "fix(stability): JSON.parse guards, timer leaks, platform fixes

- Guard 5 JSON.parse calls with try/catch (SQLiteAnswerRepo, Document, EncryptedData)
- Fix clipboard auto-clear timer leak on unmount (MasterPasswordScreen)
- Fix brute-force countdown interval leak (MasterPasswordScreen)
- Fix TTS event listener stacking on re-init (TTSService)
- Replace Voice! non-null assertion with guard (SystemSpeechService)
- Add useMemo for use case instantiation (QuestionnaireScreen)
- Add Windows keyboard behavior to 3 request screens
- Document FastTrack PII handling placeholder"
```

### Step 4: Stage & Commit — New Features & Tests (prior session)

```powershell
git add src/presentation/hooks/useSessionTimeout.ts
git add src/shared/bruteForceProtection.ts
git add src/shared/sessionTimeout.ts
git add src/shared/sessionPersistence.ts
git add src/shared/LogEvents.ts
git add src/application/services/DocumentRequestMailService.ts
git add src/application/use-cases/DeleteAllDataUseCase.ts
git add __tests__/
git commit -m "feat(security): session timeout, brute-force protection, audit tests

- Implement BSI-compliant session timeout guard
- Add brute-force protection for master password
- Add session persistence across app restarts
- Add 7 new test suites (DocumentRequestMail, ExportGDT, etc.)
- Total: 521 tests, 490 pass, 0 fail"
```

### Step 5: Stage & Commit — Docs & Tooling

```powershell
git add docs/
git add scripts/git-commit-strategy.cjs scripts/jest-run-i3.cjs scripts/parse-jest.cjs scripts/run-jest-json.cjs
git add LAUFBAHN.md
git commit -m "docs: add architecture handoff, API surface, QA guide, strategic roadmap

- ARCHITECTURE_HANDOFF.md: layer-by-layer technical docs
- API_SURFACE.md: all public interfaces documented
- TEST_COVERAGE_REPORT.md: 521 tests × 5 categories
- STRATEGIC_ROADMAP.md: M1-M4 milestone plan
- MANUAL_QA_GUIDE.md: 12 manual test scenarios"
```

### Step 6: Stage & Commit — Remaining Modified Files

```powershell
git add src/presentation/screens/HomeScreen.tsx
git add src/presentation/screens/PatientTypeScreen.tsx
git add src/presentation/screens/DocumentRequestScreen.tsx
git add src/presentation/navigation/RootNavigator.tsx
git add src/presentation/theme/tokens.ts
git add src/domain/services/DocumentRequestMailService.ts
git add src/domain/usecases/DeleteAllDataUseCase.ts
git add src/application/use-cases/ExportGDTUseCase.ts
git add android/app/src/main/java/com/helloworld/MainActivity.kt
git add .github/workflows/ci.yml
git commit -m "chore: CI matrix, theme tokens, screen improvements, Android config"
```

### Step 7: Push & PR Update

```powershell
git push origin copilot/vscode-mkpsvs4r-walf
```

## Conflict Resolution (if merging to main)

```powershell
git checkout main
git pull origin main
git checkout copilot/vscode-mkpsvs4r-walf
git rebase main

# If conflicts in locale files:
# Accept "ours" (the branch) since we just synced all 19 locales:
git checkout --ours src/presentation/i18n/locales/
git add src/presentation/i18n/locales/
git rebase --continue
```

## Quick Verification Before Push

```powershell
npx tsc --noEmit                    # Zero errors
npx jest --forceExit --no-coverage  # 490 pass, 0 fail
```
