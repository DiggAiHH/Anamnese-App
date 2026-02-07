# API SURFACE — Anamnese Mobile App
> **Version**: 2.0 | **Date**: 2025-02-07 | **Classification**: Internal — Engineering

---

## 1. Domain Entities

| Entity | File | Validation | Key Fields |
|--------|------|------------|------------|
| `PatientEntity` | `src/domain/entities/Patient.ts` | Zod schema | id, firstName, lastName, dateOfBirth, insuranceNumber |
| `QuestionnaireEntity` | `src/domain/entities/Questionnaire.ts` | Zod schema | id, version, sections, questions |
| `AnswerEntity` | `src/domain/entities/Answer.ts` | Zod schema | id, questionId, patientId, value (encrypted) |
| `DocumentEntity` | `src/domain/entities/Document.ts` | Zod schema | id, type, content, patientId |
| `GDPRConsentEntity` | `src/domain/entities/GDPRConsent.ts` | Zod schema | id, patientId, consentType, timestamp |
| `QuestionUniverseEntity` | `src/domain/entities/QuestionUniverse.ts` | Zod schema | id, compartments, questions |
| `CompartmentQuestion` | `src/domain/entities/CompartmentQuestion.ts` | — | compartmentId, questionText, answerType |

---

## 2. Value Objects

| VO | File | Purpose |
|----|------|---------|
| `EncryptedDataVO` | `src/domain/value-objects/EncryptedData.ts` | AES-256-GCM ciphertext + IV + authTag |
| `GDTExport` | `src/domain/value-objects/GDTExport.ts` | GDT format export structure |
| `CompartmentAnswerEncoding` | `src/domain/value-objects/CompartmentAnswerEncoding.ts` | Encoded answer representation |

---

## 3. Repository Interfaces (Domain Contracts)

All in `src/domain/repositories/`.

| Interface | Methods (typical) | Implementations |
|-----------|-------------------|-----------------|
| `IPatientRepository` | `save`, `findById`, `findAll`, `delete`, `deleteAll` | SQLite, InMemory |
| `IQuestionnaireRepository` | `save`, `findById`, `findByVersion`, `findAll` | SQLite, InMemory |
| `IAnswerRepository` | `save`, `findByPatientId`, `findByQuestionId`, `delete` | SQLite, InMemory |
| `IDocumentRepository` | `save`, `findById`, `findByPatientId`, `delete` | SQLite, InMemory |
| `IGDPRConsentRepository` | `save`, `findByPatientId`, `findAll`, `delete` | SQLite, InMemory |
| `IQuestionUniverseRepository` | `save`, `findById`, `findAll` | SQLite, InMemory |
| `IRepositoryFactory` | `createPatientRepo`, `createAnswerRepo`, ... | SQLite, InMemory |
| `IEncryptionService` | `encrypt`, `decrypt`, `deriveKey` | Native, WebCrypto |
| `ITTSService` | `speak`, `stop`, `getVoices`, `setLanguage` | SystemSpeech, TTS |
| `IAnalyticsService` | `trackEvent`, `trackError`, `flush` | LocalAnalytics |

---

## 4. Application Use Cases

| Use Case | File | Input | Output | Side Effects |
|----------|------|-------|--------|--------------|
| `SaveAnswerUseCase` | `src/application/use-cases/SaveAnswerUseCase.ts` | answer, key | `Result<void>` | Encrypts + persists answer |
| `LoadQuestionnaireUseCase` | `src/application/use-cases/LoadQuestionnaireUseCase.ts` | version? | `Result<Questionnaire>` | Loads from DB or template |
| `CreatePatientUseCase` | `src/application/use-cases/CreatePatientUseCase.ts` | patientData, key | `Result<Patient>` | Validates, encrypts PII, persists |
| `ExportGDTUseCase` | `src/application/use-cases/ExportGDTUseCase.ts` | patientId, key | `Result<GDTExport>` | Decrypts + formats to GDT |
| `BackupUseCase` | `src/application/use-cases/BackupUseCase.ts` | key | `Result<BackupData>` | Exports all encrypted data |
| `RestoreUseCase` | `src/application/use-cases/RestoreUseCase.ts` | backupData, key | `Result<void>` | Validates + imports backup |
| `DeleteAllDataUseCase` | `src/application/use-cases/DeleteAllDataUseCase.ts` | — | `Result<void>` | **Crypto-shred**: wipes all repos + key |
| `ExportAnonymizedUseCase` | `src/application/use-cases/ExportAnonymizedUseCase.ts` | patientId, key | `Result<AnonymizedData>` | Decrypts + strips PII |

---

## 5. Infrastructure Services

### 5.1 Encryption
| Service | File | Platform | Algorithm |
|---------|------|----------|-----------|
| `NativeEncryptionService` | `src/infrastructure/encryption/NativeEncryptionService.ts` | iOS, Android | AES-256-GCM via `react-native-quick-crypto` |
| `WebCryptoEncryptionService` | `src/infrastructure/encryption/WebCryptoEncryptionService.ts` | Web, Windows | AES-256-GCM via `@noble/ciphers` |
| `encryptionService` (factory) | `src/infrastructure/encryption/encryptionService.ts` | All | Platform switch |

### 5.2 Persistence
| Service | File | Storage |
|---------|------|---------|
| `DatabaseConnection` | `src/infrastructure/persistence/DatabaseConnection.ts` | SQLite (react-native-sqlite-storage) |
| `SQLiteRepositoryFactory` | `src/infrastructure/persistence/SQLiteRepositoryFactory.ts` | Production repositories |
| `InMemoryRepositoryFactory` | `src/infrastructure/persistence/InMemoryRepositoryFactory.ts` | Testing repositories |
| 6× `SQLite*Repository` | `src/infrastructure/persistence/SQLite*.ts` | Per-entity SQLite repos |
| 6× `InMemory*Repository` | `src/infrastructure/persistence/InMemory*.ts` | Per-entity in-memory repos |

### 5.3 Speech & OCR
| Service | File | Purpose |
|---------|------|---------|
| `SystemSpeechService` | `src/infrastructure/speech/SystemSpeechService.ts` | Native TTS |
| `TTSService` | `src/infrastructure/speech/TTSService.ts` | TTS abstraction |
| `TesseractOCRService` | `src/infrastructure/ocr/TesseractOCRService.ts` | OCR (planned) |

---

## 6. Presentation State Management

### 6.1 Global Store
| Store | File | Library | Key State |
|-------|------|---------|-----------|
| `useQuestionnaireStore` | `src/presentation/state/useQuestionnaireStore.ts` | Zustand + Immer | currentQuestion, answers, encryptionKey, patient |

### 6.2 Context Providers
| Context | File | Purpose |
|---------|------|---------|
| `PatientContext` | `src/application/PatientContext.tsx` | Current patient + CRUD |
| `ThemeContext` | `src/presentation/theme/ThemeContext.tsx` | Theme mode (light/dark/high-contrast) |

### 6.3 Custom Hooks
| Hook | File | Purpose |
|------|------|---------|
| `useSessionTimeout` | `src/presentation/hooks/useSessionTimeout.ts` | Inactivity auto-lock |
| `useAccessibilityZoom` | `src/presentation/hooks/useAccessibilityZoom.ts` | BITV 2.0 zoom support |

---

## 7. Shared Utilities (src/shared/)

| Module | Export | Purpose | Security Tag |
|--------|--------|---------|--------------|
| `logger.ts` | `logSecure`, `logAudit` | PII-safe structured logging | @security: PII-filtered |
| `keyManager.ts` | `persistKey`, `loadKey`, `clearKey` | Encryption key lifecycle | @security: key-material |
| `bruteForceProtection.ts` | `BruteForceGuard` | 3 free → exponential → hard-lock@10 | @security: auth-guard |
| `sessionTimeout.ts` | `SessionTimeoutManager` | Configurable inactivity timer | @security: session-mgmt |
| `sessionPersistence.ts` | `saveSession`, `restoreSession` | Encrypted session snapshots | @security: encrypted-state |
| `sanitizeError.ts` | `sanitizeError` | PII redaction in errors | @security: PII-redaction |
| `result.ts` | `Result<T>`, `ok()`, `err()` | Functional error handling | — |
| `SharedEncryptionBridge.ts` | `getSharedKey` | Native keychain bridge (null on Windows) | @security: platform-guard |
| `platformCapabilities.ts` | `PlatformCapabilities` | Feature flags per platform | — |
| `rnfsSafe.ts` | `isRNFSAvailable` | Checks native FS module presence | — |
| `demoData.ts` | `DEMO_PATIENTS` | 10+ demo patients for testing | — |
| `devNakedTextGuard.ts` | `installGuard` | DEV-only naked text detection | — |
| `globalErrorHandlers.ts` | `installHandlers` | Global error + rejection handlers | @security: no-PII-logging |
| `userFacingError.ts` | `showUserError` | User-friendly error alerts | — |
| `questionnaireValidation.ts` | `findMissingAnswers` | Missing-answer detection | — |
| `LogEvents.ts` | Event constants | Structured log event registry | — |

---

## 8. i18n Configuration

| Config | Value |
|--------|-------|
| **Library** | react-i18next + i18next |
| **Config File** | `src/presentation/i18n/config.ts` |
| **Default Language** | `de` (German) |
| **Fallback** | `en` (English) |
| **Languages** | ar, de, el, en, es, fa, fr, it, ja, ko, nl, pl, pt, ro, ru, tr, uk, vi, zh |
| **Key Sections** | common, navigation, screens, forms, validation, buttons (6), placeholders (44), accessibility, errors, feedback |
| **Canonical** | `en.json` — all other locales tested against this key set |

---

## 9. Native Bridges

| Bridge | Direction | Platform | File |
|--------|-----------|----------|------|
| `SharedEncryptionBridge` | JS → Native | iOS/Android (null on Windows) | `src/shared/SharedEncryptionBridge.ts` |
| `react-native-quick-crypto` | JS → Native | iOS/Android | via npm module |
| `react-native-sqlite-storage` | JS → Native | All | via npm module |
| `react-native-keychain` | JS → Native | iOS/Android | via npm module |
| `react-native-tts` | JS → Native | iOS/Android | via npm module |
| `@react-native-voice/voice` | JS → Native | iOS/Android | via npm module |

---

*Generated by DevOps-Architect v1.0 — Phase 3*
