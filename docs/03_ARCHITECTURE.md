# 🏗️ Architektur & Technische Struktur - Anamnese Mobile App

**Version:** 1.0  
**Datum:** 2025-12-28  
**Architekturstil:** Clean Architecture + Domain-Driven Design (DDD)

---

## 📐 **ARCHITEKTUR-ÜBERSICHT**

### **Prinzipien:**
1. **Separation of Concerns** - Jede Schicht hat eine klare Verantwortung
2. **Dependency Inversion** - Abhängigkeiten zeigen immer nach innen (zu Domain)
3. **SOLID-Prinzipien** - Insbesondere Single Responsibility & Open/Closed
4. **Testability** - Jede Schicht ist unabhängig testbar
5. **Offline-First** - Alle Features funktionieren ohne Internet

### **Schichten (von innen nach außen):**
```
┌──────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                        │
│              (React Native Components, Screens, UI)               │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    APPLICATION LAYER                        │  │
│  │            (Use Cases, Business Logic Services)             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │                   DOMAIN LAYER                        │  │  │
│  │  │         (Entities, Value Objects, Interfaces)         │  │  │
│  │  │                                                        │  │  │
│  │  │  ┌──────────────────────────────────────────────┐    │  │  │
│  │  │  │  Core Business Rules (Framework-unabhängig)  │    │  │  │
│  │  │  └──────────────────────────────────────────────┘    │  │  │
│  │  └──────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────┐
│                     INFRASTRUCTURE LAYER                          │
│    (SQLite, Encryption, OCR, Speech, i18n, External APIs)        │
└──────────────────────────────────────────────────────────────────┘
```

---

## 📁 **PROJEKTSTRUKTUR**

```
anamnese-mobile-app/
├── android/                        # Android-spezifische Konfiguration
├── ios/                            # iOS-spezifische Konfiguration
├── windows/                        # Windows-spezifische Konfiguration (optional)
│
├── src/
│   ├── domain/                     # 🟢 DOMAIN LAYER (Framework-unabhängig)
│   │   ├── entities/
│   │   │   ├── Patient.ts
│   │   │   ├── Questionnaire.ts
│   │   │   ├── Section.ts
│   │   │   ├── Question.ts
│   │   │   ├── Answer.ts
│   │   │   ├── Document.ts
│   │   │   ├── GDPRConsent.ts
│   │   │   └── AuditLog.ts
│   │   │
│   │   ├── value-objects/
│   │   │   ├── EncryptedData.ts
│   │   │   ├── GDTExport.ts
│   │   │   ├── PatientId.ts
│   │   │   ├── MedicalHistory.ts
│   │   │   └── ValidationResult.ts
│   │   │
│   │   ├── enums/
│   │   │   ├── QuestionType.ts     # text, select, radio, checkbox, date
│   │   │   ├── AnswerType.ts
│   │   │   └── GDPRConsentType.ts
│   │   │
│   │   └── repositories/           # Interfaces (Implementations in Infrastructure)
│   │       ├── IQuestionnaireRepository.ts
│   │       ├── IAnswerRepository.ts
│   │       ├── IEncryptionRepository.ts
│   │       ├── IGDPRRepository.ts
│   │       ├── IOCRRepository.ts
│   │       └── ISpeechRepository.ts
│   │
│   ├── application/                # 🔵 APPLICATION LAYER (Use Cases)
│   │   ├── use-cases/
│   │   │   ├── questionnaire/
│   │   │   │   ├── LoadQuestionnaire.ts
│   │   │   │   ├── GetCurrentSection.ts
│   │   │   │   ├── NavigateToSection.ts
│   │   │   │   └── GetVisibleQuestions.ts  # Conditional Logic!
│   │   │   │
│   │   │   ├── answer/
│   │   │   │   ├── SaveAnswer.ts
│   │   │   │   ├── GetAnswer.ts
│   │   │   │   ├── ValidateAnswer.ts
│   │   │   │   └── DeleteHiddenAnswers.ts  # DSGVO-Requirement
│   │   │   │
│   │   │   ├── encryption/
│   │   │   │   ├── EncryptData.ts
│   │   │   │   ├── DecryptData.ts
│   │   │   │   ├── GenerateKey.ts
│   │   │   │   └── ValidatePassword.ts
│   │   │   │
│   │   │   ├── export/
│   │   │   │   ├── ExportJSON.ts
│   │   │   │   ├── ExportGDT.ts
│   │   │   │   ├── ExportEncrypted.ts
│   │   │   │   └── ExportWithDocuments.ts
│   │   │   │
│   │   │   ├── document/
│   │   │   │   ├── UploadDocument.ts
│   │   │   │   ├── PerformOCR.ts
│   │   │   │   ├── DeleteDocument.ts
│   │   │   │   └── ViewDocuments.ts
│   │   │   │
│   │   │   ├── speech/
│   │   │   │   ├── TranscribeSpeech.ts
│   │   │   │   ├── StartListening.ts
│   │   │   │   └── StopListening.ts
│   │   │   │
│   │   │   └── gdpr/
│   │   │       ├── GetGDPRConsent.ts
│   │   │       ├── SaveGDPRConsent.ts
│   │   │       ├── DeleteAllData.ts  # Art. 17 GDPR
│   │   │       └── GenerateAuditLog.ts  # Art. 30 GDPR
│   │   │
│   │   └── services/
│   │       ├── ValidationService.ts    # Business Validation Rules
│   │       ├── ConditionalLogicService.ts  # Conditional Question Visibility
│   │       ├── PlausibilityCheckService.ts # AI Rule-based Checks
│   │       └── RedFlagService.ts       # Medical Emergency Detection
│   │
│   ├── infrastructure/             # 🟠 INFRASTRUCTURE LAYER (External Dependencies)
│   │   ├── persistence/
│   │   │   ├── SQLiteQuestionnaireRepository.ts
│   │   │   ├── SQLiteAnswerRepository.ts
│   │   │   ├── SQLiteGDPRRepository.ts
│   │   │   ├── SQLiteDocumentRepository.ts
│   │   │   └── database/
│   │   │       ├── schema.sql
│   │   │       ├── migrations/
│   │   │       └── DatabaseManager.ts
│   │   │
│   │   ├── encryption/
│   │   │   ├── NativeAESEncryption.ts  # Platform-specific AES-256-GCM
│   │   │   ├── PBKDF2KeyDerivation.ts
│   │   │   └── SecureStorage.ts        # Keychain (iOS) / KeyStore (Android)
│   │   │
│   │   ├── ocr/
│   │   │   ├── TesseractOCRService.ts
│   │   │   ├── PDFTextExtractor.ts
│   │   │   └── models/                 # Tesseract Language Models (deu, eng)
│   │   │
│   │   ├── speech/
│   │   │   ├── VoskSpeechService.ts
│   │   │   ├── BrowserSpeechFallback.ts
│   │   │   └── models/                 # Vosk Models (de, en)
│   │   │
│   │   ├── i18n/
│   │   │   ├── i18n.config.ts
│   │   │   └── translations/
│   │   │       ├── de.json             # Deutsch (Primary)
│   │   │       ├── en.json             # English
│   │   │       ├── fr.json             # Français
│   │   │       ├── es.json             # Español
│   │   │       ├── it.json             # Italiano
│   │   │       ├── tr.json             # Türkçe
│   │   │       ├── pl.json             # Polski
│   │   │       ├── ru.json             # Русский
│   │   │       ├── ar.json             # العربية (RTL)
│   │   │       ├── zh.json             # 中文
│   │   │       ├── pt.json             # Português
│   │   │       ├── nl.json             # Nederlands
│   │   │       ├── uk.json             # Українська
│   │   │       ├── fa.json             # فارسی (RTL)
│   │   │       ├── ur.json             # اردو (RTL)
│   │   │       ├── sq.json             # Shqip
│   │   │       ├── ro.json             # Română
│   │   │       ├── hi.json             # हिन्दी
│   │   │       └── ja.json             # 日本語
│   │   │
│   │   └── gdt/
│   │       ├── GDTExporter.ts
│   │       ├── GDTImporter.ts
│   │       ├── templates/
│   │       │   ├── GDT21Template.ts
│   │       │   ├── GDT30Template.ts
│   │       │   └── GDT31Template.ts
│   │       └── validators/
│   │           └── GDTValidator.ts
│   │
│   ├── presentation/               # 🔴 PRESENTATION LAYER (UI)
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Checkbox.tsx
│   │   │   │   ├── Radio.tsx
│   │   │   │   ├── DatePicker.tsx
│   │   │   │   ├── ProgressBar.tsx
│   │   │   │   └── LoadingSpinner.tsx
│   │   │   │
│   │   │   ├── questionnaire/
│   │   │   │   ├── QuestionCard.tsx        # Renders single question
│   │   │   │   ├── ConditionalQuestion.tsx # Handles visibility
│   │   │   │   ├── SectionHeader.tsx
│   │   │   │   ├── NavigationButtons.tsx
│   │   │   │   └── QuestionList.tsx        # Virtual List for performance
│   │   │   │
│   │   │   ├── voice/
│   │   │   │   ├── VoiceInputButton.tsx
│   │   │   │   ├── VoiceTranscriptView.tsx
│   │   │   │   └── VoicePermissionModal.tsx
│   │   │   │
│   │   │   ├── document/
│   │   │   │   ├── DocumentUploadButton.tsx
│   │   │   │   ├── DocumentPreview.tsx
│   │   │   │   ├── OCRProgressView.tsx
│   │   │   │   └── DocumentList.tsx
│   │   │   │
│   │   │   └── export/
│   │   │       ├── ExportModal.tsx
│   │   │       ├── EncryptionSettings.tsx
│   │   │       └── GDTConfigModal.tsx
│   │   │
│   │   ├── screens/
│   │   │   ├── HomeScreen.tsx
│   │   │   ├── PrivacyNoticeScreen.tsx
│   │   │   ├── LanguageSelectionScreen.tsx
│   │   │   ├── QuestionnaireScreen.tsx     # Main screen
│   │   │   ├── SummaryScreen.tsx
│   │   │   ├── ExportScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   │
│   │   ├── navigation/
│   │   │   ├── RootNavigator.tsx
│   │   │   ├── QuestionnaireStackNavigator.tsx
│   │   │   └── routes.ts
│   │   │
│   │   ├── state/                  # Zustand Store
│   │   │   ├── useQuestionnaireStore.ts
│   │   │   ├── useAnswerStore.ts
│   │   │   ├── useDocumentStore.ts
│   │   │   └── useSettingsStore.ts
│   │   │
│   │   ├── hooks/
│   │   │   ├── useConditionalLogic.ts
│   │   │   ├── useValidation.ts
│   │   │   ├── useVoiceInput.ts
│   │   │   ├── useOCR.ts
│   │   │   └── useEncryption.ts
│   │   │
│   │   └── styles/
│   │       ├── theme.ts            # Colors, Fonts, Spacing
│   │       ├── typography.ts
│   │       └── rtl.ts              # RTL-specific styles
│   │
│   └── config/
│       ├── app.config.ts
│       ├── environment.ts
│       └── constants.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   ├── icons/
│   └── questionnaire/
│       └── questionnaire-schema.json   # Loaded from extraction
│
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   ├── integration/
│   └── e2e/
│       └── scenarios/
│           ├── complete-questionnaire.spec.ts
│           ├── conditional-logic.spec.ts
│           └── export-encrypted.spec.ts
│
├── docs/
│   ├── 01_COMPLETE_ELEMENTS_LIST.md
│   ├── 02_COMPLETE_QUESTIONS_LIST.md
│   ├── 03_ARCHITECTURE.md              # This file
│   ├── 04_API.md
│   ├── 05_TESTING.md
│   └── 06_DEPLOYMENT.md
│
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── .eslintrc.js
├── .prettierrc
└── README.md
```

---

## 🔗 **DEPENDENCY FLOW**

```
Presentation Layer
    ↓ depends on
Application Layer (Use Cases)
    ↓ depends on
Domain Layer (Entities, Interfaces)
    ↑ implemented by
Infrastructure Layer (Repositories, Services)
```

**Regel:** Keine Abhängigkeit darf von innen nach außen zeigen!  
✅ Presentation → Application → Domain  
❌ Domain → Infrastructure (NIEMALS!)

---

## 🗄️ **DATENBANK-SCHEMA (SQLite)**

```sql
-- patients
CREATE TABLE patients (
    id TEXT PRIMARY KEY,
    encrypted_data TEXT NOT NULL,  -- JSON with AES-256
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- answers
CREATE TABLE answers (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    answer_value TEXT,          -- Can be JSON for multi-select
    encrypted BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- documents
CREATE TABLE documents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT,
    encrypted_blob BLOB,        -- Encrypted file content
    ocr_text TEXT,              -- Extracted text (encrypted)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- gdpr_consents
CREATE TABLE gdpr_consents (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    consent_type TEXT NOT NULL, -- 'data_processing', 'ocr_processing', etc.
    granted BOOLEAN NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- audit_log (Art. 30, 32 DSGVO)
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    patient_id TEXT,
    action TEXT NOT NULL,       -- 'answer_saved', 'data_encrypted', 'ocr_performed'
    details TEXT,               -- JSON
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

**Indizes für Performance:**
```sql
CREATE INDEX idx_answers_patient ON answers(patient_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_documents_patient ON documents(patient_id);
CREATE INDEX idx_audit_log_patient ON audit_log(patient_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
```

---

## 🔐 **VERSCHLÜSSELUNGS-ARCHITEKTUR**

### **AES-256-GCM Verschlüsselung**
```typescript
interface EncryptionConfig {
  algorithm: 'AES-256-GCM';
  keyDerivation: 'PBKDF2';
  iterations: 600000;        // OWASP 2023+ Empfehlung
  saltLength: 16;            // 128 bits
  ivLength: 12;              // 96 bits (GCM standard)
  tagLength: 16;             // 128 bits (Authentication Tag)
}

// Flow:
// 1. User Master Password → PBKDF2 (600k iterations) → 256-bit Key
// 2. Store Key in Secure Storage (Keychain/KeyStore)
// 3. For each encryption: Generate random IV
// 4. Encrypt: Plaintext + Key + IV → Ciphertext + Auth Tag
// 5. Store: {ciphertext, iv, tag, salt}
```

### **Key Management:**
- **Master Password:** User-generated, min. 16 Zeichen
- **Derived Key:** Via PBKDF2 mit 600.000 Iterationen
- **Storage:** 
  - iOS: Keychain
  - Android: KeyStore
  - Windows: CredentialLocker
- **Session:** Key bleibt in Memory, solange App aktiv

---

## 🌐 **MULTI-LANGUAGE SUPPORT**

### **i18n-Struktur:**
```json
{
  "common": {
    "yes": "Ja",
    "no": "Nein",
    "next": "Weiter",
    "back": "Zurück",
    "save": "Speichern"
  },
  "questions": {
    "0000": "Nachname",
    "0001": "Vorname",
    "1000": "Haben Sie aktuell Beschwerden?"
  },
  "validation": {
    "required": "Dieses Feld ist erforderlich",
    "invalid_email": "Bitte gültige E-Mail eingeben"
  }
}
```

### **RTL-Sprachen (ar, fa, ur):**
```typescript
// Auto-detect RTL
const RTL_LANGUAGES = ['ar', 'fa', 'ur'];
const isRTL = RTL_LANGUAGES.includes(currentLanguage);

// React Native RTL Support
import { I18nManager } from 'react-native';
I18nManager.forceRTL(isRTL);
```

---

## 🎯 **USE CASE BEISPIEL: SaveAnswer**

```typescript
// application/use-cases/answer/SaveAnswer.ts
export class SaveAnswer {
  constructor(
    private answerRepository: IAnswerRepository,
    private encryptionService: IEncryptionRepository,
    private validationService: ValidationService,
    private auditLogger: IAuditLogRepository
  ) {}

  async execute(params: SaveAnswerParams): Promise<SaveAnswerResult> {
    // 1. Validate Answer
    const validationResult = await this.validationService.validate(
      params.questionId,
      params.answerValue
    );
    if (!validationResult.isValid) {
      return { success: false, error: validationResult.error };
    }

    // 2. Encrypt if contains sensitive data
    let finalValue = params.answerValue;
    if (this.isSensitiveQuestion(params.questionId)) {
      finalValue = await this.encryptionService.encrypt(params.answerValue);
    }

    // 3. Save Answer
    const answer = new Answer({
      id: generateUUID(),
      patientId: params.patientId,
      questionId: params.questionId,
      value: finalValue,
      encrypted: this.isSensitiveQuestion(params.questionId)
    });

    await this.answerRepository.save(answer);

    // 4. Audit Log (DSGVO Art. 30)
    await this.auditLogger.log({
      patientId: params.patientId,
      action: 'answer_saved',
      details: { questionId: params.questionId }
    });

    return { success: true, answer };
  }

  private isSensitiveQuestion(questionId: string): boolean {
    // Define which questions require encryption
    const sensitiveQuestions = [
      '0000', '0001',  // Name
      '4000', '4001',  // Medications
      '4010', '4011'   // Allergies
    ];
    return sensitiveQuestions.includes(questionId);
  }
}
```

---

## 🧪 **TESTING-STRATEGIE**

### **Unit Tests (Jest)**
- Domain Entities
- Use Cases
- Business Logic Services
- Pure Functions

### **Integration Tests**
- Repository Implementations
- Encryption/Decryption Flow
- Conditional Logic Service

### **E2E Tests (Detox)**
- Complete Questionnaire Flow
- Conditional Question Visibility
- Export Encrypted Data
- Voice Input
- OCR Processing

### **Performance Tests**
- App Startup Time
- Question Navigation Speed
- OCR Processing Time
- Encryption Performance

---

## 🚀 **DEPLOYMENT-ARCHITEKTUR**

### **Build Targets:**
```
React Native Projekt
├── Android (APK/AAB)
│   ├── Min SDK: 21 (Android 5.0)
│   ├── Target SDK: 34 (Android 14)
│   └── Build: Gradle
│
├── iOS (IPA)
│   ├── Min Version: iOS 13.0
│   ├── Target: iOS 17
│   └── Build: Xcode
│
└── Windows (MSIX) [Optional]
    ├── Min Version: Windows 10
    └── Build: Visual Studio
```

### **Distribution:**
- **Android:** Google Play Store + APK Direct Download
- **iOS:** Apple App Store
- **Windows:** Microsoft Store (optional)

---

## 📊 **PERFORMANCE-ZIELE**

| Metrik | Ziel | Kritisch |
|--------|------|----------|
| App Start | < 3 Sek | < 5 Sek |
| Question Navigation | < 100ms | < 200ms |
| OCR Processing | < 5 Sek/Seite | < 10 Sek |
| Encryption | < 500ms | < 1 Sek |
| Memory Usage | < 150 MB | < 200 MB |
| App Size (APK) | < 50 MB | < 80 MB |

---

## ⚠️ **SICHERHEITS-MASSNAHMEN**

1. **AES-256-GCM** für alle sensiblen Daten
2. **PBKDF2** Key Derivation (100k Iterationen)
3. **Secure Storage** (Keychain/KeyStore)
4. **No external APIs** für OCR/Speech
5. **Code Obfuscation** (ProGuard/R8)
6. **SSL Pinning** (falls Online-Features)
7. **Root Detection** (optional)
8. **Jailbreak Detection** (optional)

---

## 📈 **SKALIERBARKEIT**

- **Lokale Datenbank:** SQLite (kein Limit, praktisch ~50.000 Antworten)
- **Dokumente:** Komprimierung + Chunking für große PDFs
- **Übersetzungen:** Lazy Loading (nur aktive Sprache laden)
- **Models:** On-Demand Download (Vosk, Tesseract)

---

**Dokument-Ende**
