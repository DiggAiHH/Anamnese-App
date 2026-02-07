# TEST COVERAGE REPORT — Anamnese Mobile App
> **Version**: 2.0 | **Date**: 2025-02-07 | **Run**: Phase 2 Iteration 3 (post-i18n fix)

---

## 1. Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Test Suites** | 68 | — |
| **Passed Suites** | 66 | ✅ |
| **Pending Suites** | 2 | ⏸️ (by design) |
| **Failed Suites** | 0 | ✅ |
| **Total Tests** | 521 | — |
| **Passed Tests** | 490 | ✅ |
| **Pending Tests** | 29 | ⏸️ (by design) |
| **Todo Tests** | 2 | 📋 (ESM blocker) |
| **Failed Tests** | 0 | ✅ |
| **Success** | `true` | ✅ |
| **Type Check** | 0 errors | ✅ |

**Evidence**: `buildLogs/jest_i3.json` (198KB), `buildLogs/typecheck_i3.log` (empty = clean)

---

## 2. Coverage by Architecture Layer

### 2.1 Domain Layer (12 suites, ~120 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| `Patient.test.ts` | Entity creation, validation, serialization | ✅ |
| `Questionnaire.test.ts` | Template parsing, section navigation | ✅ |
| `Answer.test.ts` | Answer construction, validation | ✅ |
| `Document.test.ts` | Document entity tests | ✅ |
| `GDPRConsent.test.ts` | Consent entity lifecycle | ✅ |
| `QuestionUniverse.test.ts` | Question universe operations | ✅ |
| `CompartmentQuestion.test.ts` | Compartment question logic | ✅ |
| `AnswerValidator.test.ts` | Input validation rules | ✅ |
| `PatientValidator.test.ts` | Patient data validation | ✅ |
| `ClinicalCalculators.test.ts` | BMI, BSA, clinical scores | ✅ |
| `FeedbackTextBuilder.test.ts` | Feedback text generation | ✅ |
| `PasswordGenerator.test.ts` | Secure password generation | ✅ |

### 2.2 Application Layer (10 suites, ~80 tests)

| Suite | Tests | Status |
|-------|-------|--------|
| `SaveAnswerUseCase.test.ts` | Save flow, encryption, error handling | ✅ |
| `LoadQuestionnaireUseCase.test.ts` | Load, version check, fallback | ✅ |
| `CreatePatientUseCase.test.ts` | Patient creation, validation, PII encryption | ✅ |
| `ExportGDTUseCase.test.ts` | GDT format export | ✅ |
| `BackupUseCase.test.ts` | Backup creation, encryption | ✅ |
| `RestoreUseCase.test.ts` | Backup restoration, validation | ✅ |
| `DeleteAllDataUseCase.test.ts` | Crypto-shredding, complete wipe | ✅ |
| `ExportAnonymizedUseCase.test.ts` | PII stripping, anonymization | ✅ |
| `PatientContext.test.tsx` | Context provider, state management | ✅ |
| `AnalyticsService.test.ts` | Event tracking, error tracking | ✅ |

### 2.3 Infrastructure Layer (14 suites, ~100 tests)

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `SQLitePatientRepository.test.ts` | CRUD operations | ✅ | Mocked SQLite |
| `SQLiteQuestionnaireRepository.test.ts` | Query, version lookup | ✅ | |
| `SQLiteAnswerRepository.test.ts` | Save, find, delete | ✅ | |
| `SQLiteDocumentRepository.test.ts` | Document persistence | ✅ | |
| `SQLiteGDPRConsentRepository.test.ts` | Consent storage | ✅ | |
| `SQLiteQuestionUniverseRepository.test.ts` | Universe persistence | ✅ | |
| `InMemoryRepositoryFactory.test.ts` | Factory pattern | ✅ | |
| `DatabaseConnection.test.ts` | Connection lifecycle | ✅ | |
| `NativeEncryptionService.test.ts` | AES-256-GCM, PBKDF2 | ⏸️ 16 pending | **Native crypto not available in Jest** |
| `NativeEncryptionService.test.ts` (dup) | Same suite duplicated | ⏸️ 13 pending | Same reason |
| `WebCryptoEncryptionService.test.ts` | Web fallback encryption | ✅ | |
| `encryptionService.test.ts` | Platform factory switch | ✅ | |
| `LocalAnalyticsService.test.ts` | Local analytics | ✅ | |
| `TemplateMigrationService.test.ts` | Template versioning | ✅ | |

### 2.4 Presentation Layer (20 suites, ~150 tests)

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `App.test.tsx` | App mounting, provider stack | ✅ | |
| `HomeScreen.test.tsx` | Home rendering, navigation | ✅ | |
| `MasterPasswordScreen.test.tsx` | Password entry, brute-force | ✅ | |
| `QuestionnaireScreen.test.tsx` | Question flow, navigation | ✅ | |
| `SummaryScreen.test.tsx` | Answer summary rendering | ✅ | |
| `ExportScreen.test.tsx` | Export flow | ✅ | |
| `PatientInfoScreen.test.tsx` | Patient form | ✅ | |
| `GDPRConsentScreen.test.tsx` | Consent UI | ✅ | |
| `DataManagementScreen.test.tsx` | Data deletion UI | ✅ | |
| `FeedbackScreen.test.tsx` | Feedback form | ✅ | |
| `RootNavigator.test.tsx` | Navigation structure | ✅ | |
| `ThemeContext.test.tsx` | Theme switching | ✅ | |
| `SessionGuard.test.tsx` | Session timeout UI | ✅ | BSI compliance |
| `locales.test.ts` | 19-locale key sync | ✅ | **Fixed this session** |
| `i18n-config.test.ts` | i18n initialization | ✅ | |

### 2.5 Shared Layer (8 suites, ~60 tests)

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `sessionTimeout.test.ts` | Timer lifecycle, callbacks | ✅ | BSI compliance |
| `bruteForceProtection.test.ts` | Lockout, exponential backoff | ✅ | BSI compliance |
| `sanitizeError.test.ts` | PII redaction | ✅ | |
| `result.test.ts` | Result type operations | ✅ | |
| `keyManager.test.ts` | Key persistence lifecycle | ✅ | |
| `platformCapabilities.test.ts` | Platform feature flags | ✅ | |
| `logger.test.ts` | Secure logging, PII filtering | ✅ | |
| `devNakedTextGuard.test.ts` | Naked text detection | ✅ | |

### 2.6 Integration Tests (4 suites, ~30 tests)

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `encryption-flow.test.ts` | End-to-end encrypt/decrypt | ✅ | |
| `questionnaire-flow.test.ts` | Full questionnaire lifecycle | ✅ | |
| `backup-restore.test.ts` | Backup → Restore round-trip | ✅ | |
| `gdpr-compliance.test.ts` | Art. 17 deletion verification | ✅ | |

### 2.7 Build Tests (2 suites)

| Suite | Tests | Status | Notes |
|-------|-------|--------|-------|
| `useQuestionnaireStore.test.ts` | Zustand store | 📋 1 todo | ESM blocker |
| `useQuestionnaireStore.integration.test.ts` | Store integration | 📋 1 todo | ESM blocker |

---

## 3. Pending Tests — Justification

### 3.1 Native Encryption (29 tests — SKIPPED)
**Reason**: `NativeEncryptionService` uses `react-native-quick-crypto` which provides native C++ PBKDF2 and AES-256-GCM. This is not available in Jest's Node.js runtime.

**Mitigation**: `WebCryptoEncryptionService` is fully tested. Both services implement the same `IEncryptionService` interface. Integration tests verify encryption round-trips via the web path.

**Future**: Could be covered by Detox E2E tests running on actual device/emulator.

### 3.2 Zustand ESM Integration (2 tests — TODO)
**Reason**: `zustand/middleware/immer` is ESM-only. Jest uses CJS module resolution. The import fails with `ERR_REQUIRE_ESM`.

**Mitigation**: The store's pure logic is tested. Only the Immer middleware integration lacks direct coverage.

**Future**: Migrate Jest config to ESM support or use `--experimental-vm-modules`.

---

## 4. Bugs Fixed This Session

### 4.1 i18n Duplicate Key Bug (CRITICAL — Runtime Data Loss)

**Root Cause**: `en.json` and `de.json` had **duplicate top-level `"buttons"` and `"placeholders"` keys**. Per JSON spec (RFC 8259 §4), duplicate keys cause implementation-defined behavior — in V8/Node.js, last wins. The second (minimal) occurrence silently overwrote the first (complete) occurrence.

**Impact**: 5 button translations (`next`, `back`, `save`, `cancel`, `export`) and 42 placeholder translations were **silently lost at runtime** in all languages.

**Fix**:
1. Removed trailing duplicate sections from `en.json` and `de.json`
2. Added missing 5 buttons + 42 placeholders to all 17 other locale files (EN fallback values)

**Prevention**: `locales.test.ts` now catches this — it compares all locale key sets against `en.json` canonical.

**Files Modified**: All 19 locale files in `src/presentation/i18n/locales/`

---

## 5. Coverage Thresholds (jest.config.js)

| Metric | Threshold | Status |
|--------|-----------|--------|
| Branches | 70% | Configured |
| Functions | 70% | Configured |
| Lines | 70% | Configured |
| Statements | 70% | Configured |

> Note: Coverage was run without `--coverage` flag in this iteration to maximize speed. A full coverage run with Istanbul instrumentation is recommended before release.

---

## 6. Test Infrastructure

### 6.1 Mock Registry (jest.setup.js)

| Mock Target | Strategy |
|-------------|----------|
| `react-native-gesture-handler` | No-op module |
| `react-native-reanimated` | Jest mock preset |
| `NativeAnimatedHelper` | No-op |
| `react-native-quick-crypto` | No-op (causes 29 skips) |
| `react-native-sqlite-storage` | In-memory mock with query/execute |
| `@react-native-async-storage/async-storage` | In-memory KV store mock |
| `react-native-keychain` | Mock with get/set/reset |
| `react-native-tts` | No-op |

### 6.2 Path Aliases (moduleNameMapper)

| Alias | Maps To |
|-------|---------|
| `@domain/(.*)` | `src/domain/$1` |
| `@application/(.*)` | `src/application/$1` |
| `@infrastructure/(.*)` | `src/infrastructure/$1` |
| `@presentation/(.*)` | `src/presentation/$1` |
| `@shared/(.*)` | `src/shared/$1` |

---

*Generated by DevOps-Architect v1.0 — Phase 3*
*Evidence: buildLogs/jest_i3.json, buildLogs/typecheck_i3.log*
