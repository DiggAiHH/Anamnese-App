# 🎯 VOLLSTÄNDIGE SYSTEM-DOKUMENTATION

## 📊 SYSTEM-ÜBERSICHT

Die **Anamnese Mobile App** ist eine **DSGVO-konforme**, **offline-first** medizinische Anamnese-Applikation für **Android, iOS und Windows**, basierend auf **Clean Architecture** und **Domain-Driven Design**.

---

## 🏗️ ARCHITEKTUR-LAYERS

### **Layer 1: Domain Layer** (Business Logic - Framework-unabhängig)
```
src/domain/
├── entities/
│   ├── Patient.ts              ✅ Patientendaten mit GDPR Consents
│   ├── Questionnaire.ts        ✅ Fragebogen mit Conditional Logic
│   ├── Answer.ts               ✅ Verschlüsselte Antworten
│   ├── Document.ts             ✅ Dokumente mit OCR
│   └── GDPRConsent.ts          ✅ DSGVO Einwilligungen
├── value-objects/
│   ├── EncryptedData.ts        ✅ AES-256-GCM verschlüsselte Daten
│   └── GDTExport.ts            ✅ GDT 2.1/3.0 Format
└── repositories/ (Interfaces)
    ├── IPatientRepository.ts
    ├── IQuestionnaireRepository.ts
    ├── IAnswerRepository.ts
    ├── IDocumentRepository.ts
    ├── IGDPRConsentRepository.ts
    └── IEncryptionService.ts
```

### **Layer 2: Application Layer** (Use Cases - Business Rules)
```
src/application/use-cases/
├── SaveAnswerUseCase.ts        ✅ Antwort speichern (validate, encrypt, persist)
├── LoadQuestionnaireUseCase.ts ✅ Fragebogen laden (template, decrypt answers)
├── CreatePatientUseCase.ts     ✅ Patient erstellen (GDPR consents)
└── ExportGDTUseCase.ts         ✅ GDT Export (decrypt, build, save file)
```

### **Layer 3: Infrastructure Layer** (External Dependencies)
```
src/infrastructure/
├── persistence/
│   ├── DatabaseConnection.ts       ✅ SQLite Setup (5 Tabellen)
│   ├── SQLitePatientRepository.ts  ✅ Patient CRUD
│   ├── SQLiteQuestionnaireRepository.ts ✅ Questionnaire CRUD
│   └── SQLiteAnswerRepository.ts   ✅ Answer CRUD + Batch Operations
├── encryption/
│   └── NativeEncryptionService.ts  ✅ AES-256-GCM + PBKDF2
└── data/
    └── questionnaire-template.json ✅ 8 Sektionen, 60+ Fragen
```

### **Layer 4: Presentation Layer** (React Native UI)
```
src/presentation/
├── App.tsx                     ✅ Entry Point
├── navigation/
│   └── RootNavigator.tsx       ✅ Stack Navigation
├── screens/
│   ├── HomeScreen.tsx          ✅ Home
│   └── QuestionnaireScreen.tsx ✅ Fragebogen (vollständiger Flow)
├── components/
│   └── QuestionCard.tsx        ✅ Universal Question Component
├── state/
│   └── useQuestionnaireStore.ts ✅ Zustand Store
└── i18n/
    ├── config.ts               ✅ i18next Setup
    └── locales/
        ├── de.json             ✅ Deutsch
        └── en.json             ✅ Englisch (weitere 17 folgen)
```

---

## 🔄 VOLLSTÄNDIGER DATENFLUSS

### **Beispiel: User beantwortet eine Frage**

```
1. USER INPUT
   QuestionCard Component
   └─ TextInput: User tippt "Diabetes seit 2015"

2. EVENT HANDLER
   onValueChange(value) callback
   └─ QuestionnaireScreen.handleAnswerChange()

3. STATE UPDATE (Optimistic)
   useQuestionnaireStore.setAnswer(questionId, value)
   └─ answers Map updated
   └─ UI re-rendert automatisch

4. USE CASE EXECUTION
   SaveAnswerUseCase.execute()
   ├─ Step 1: Validate Answer
   │   └─ AnswerValidator.validate(value, question)
   │       ├─ Check required
   │       ├─ Check min/max length
   │       └─ Check pattern
   │
   ├─ Step 2: Encrypt Answer
   │   └─ EncryptionService.encrypt(value, key)
   │       ├─ Generate IV (16 bytes)
   │       ├─ AES-256-GCM encryption
   │       └─ Return EncryptedDataVO
   │
   ├─ Step 3: Create/Update Entity
   │   └─ AnswerEntity.create() or .update()
   │       ├─ Generate UUID
   │       ├─ Add audit log entry
   │       └─ Validate with Zod
   │
   └─ Step 4: Persist to DB
       └─ AnswerRepository.save(answer)
           └─ SQLite: INSERT OR REPLACE

5. CONDITIONAL LOGIC EVALUATION
   QuestionnaireEntity.evaluateConditions(answers)
   ├─ Check all questions' conditions
   ├─ Filter visible questions
   └─ Return visible questions array

6. UI UPDATE
   React re-render (Zustand triggers)
   ├─ Hidden questions disappear
   ├─ New questions appear
   └─ Progress bar updates
```

---

## 🔐 SICHERHEIT & DSGVO

### **Encryption**
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 (600,000 iterations, SHA-256)
- **Storage**: Encryption key in sessionStorage (cleared on close)
- **PII Data**: Alle personenbezogene Daten verschlüsselt

### **GDPR Compliance**
- **Art. 6, 7**: Einwilligung für Datenverarbeitung
- **Art. 13**: Informationspflichten (Privacy Policy)
- **Art. 15**: Auskunftsrecht (JSON Export)
- **Art. 17**: Recht auf Löschung (deleteAllData())
- **Art. 20**: Datenportabilität (GDT Export)
- **Art. 30**: Verzeichnis von Verarbeitungstätigkeiten (Audit Logs)
- **Art. 32**: Technische Maßnahmen (Encryption, Access Control)
- **Art. 35**: Datenschutz-Folgenabschätzung (DSFA)

### **Audit Trail**
Alle Entities haben `auditLog`:
```typescript
{
  action: 'created' | 'updated' | 'accessed' | 'exported' | 'deleted',
  timestamp: Date,
  details?: string
}
```

---

## 🗄️ DATENBANK-SCHEMA (SQLite)

```sql
-- Patients Table
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  encrypted_data TEXT NOT NULL,  -- JSON: firstName, lastName, birthDate, etc.
  language TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  gdpr_consents TEXT NOT NULL,   -- JSON Array
  audit_log TEXT NOT NULL         -- JSON Array
);

-- Questionnaires Table
CREATE TABLE questionnaires (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  version TEXT NOT NULL,
  sections TEXT NOT NULL,         -- JSON Array
  status TEXT NOT NULL,            -- 'draft' | 'in_progress' | 'completed'
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX idx_questionnaires_patient_id ON questionnaires(patient_id);

-- Answers Table
CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  questionnaire_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  encrypted_value TEXT NOT NULL,  -- Base64 EncryptedDataVO
  question_type TEXT NOT NULL,
  source_type TEXT NOT NULL,      -- 'manual' | 'voice' | 'ocr'
  confidence REAL,                -- 0.0 - 1.0 für AI-generated
  answered_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  audit_log TEXT NOT NULL,
  FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id) ON DELETE CASCADE
);
CREATE INDEX idx_answers_questionnaire_question ON answers(questionnaire_id, question_id);

-- Documents Table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  questionnaire_id TEXT,
  type TEXT NOT NULL,             -- 'insurance_card' | 'id_document' | ...
  mime_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  encrypted_file_path TEXT NOT NULL,
  ocr_data TEXT,                  -- JSON: {text, confidence, language}
  ocr_consent_granted INTEGER NOT NULL DEFAULT 0,
  uploaded_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  audit_log TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX idx_documents_patient_id ON documents(patient_id);

-- GDPR Consents Table
CREATE TABLE gdpr_consents (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  type TEXT NOT NULL,             -- 'data_processing' | 'gdt_export' | ...
  granted INTEGER NOT NULL,
  granted_at INTEGER,
  revoked_at INTEGER,
  privacy_policy_version TEXT NOT NULL,
  legal_basis TEXT NOT NULL,
  purpose TEXT NOT NULL,
  data_categories TEXT NOT NULL,   -- JSON Array
  recipients TEXT,                 -- JSON Array
  retention_period TEXT NOT NULL,
  audit_log TEXT NOT NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);
CREATE INDEX idx_gdpr_consents_patient_type ON gdpr_consents(patient_id, type);
```

---

## 📝 QUESTIONNAIRE STRUKTUR

### **8 Hauptsektionen:**
1. **Personal Data** (6 Fragen)
   - Name, Geburtsdatum, Geschlecht, Versicherung

2. **General Anamnesis** (5 Fragen)
   - Hauptbeschwerde, Dauer, Schmerzlevel, Vorbehandlung

3. **Medical History** (5 Fragen)
   - Chronische Erkrankungen, Operationen, Krankenhausaufenthalte

4. **Medications** (3 Fragen)
   - Aktuelle Medikamente, Liste, Compliance

5. **Allergies** (3 Fragen)
   - Allergien (Medikamente, Lebensmittel, Pollen, etc.)

6. **Family History** (2 Fragen)
   - Familiäre Erkrankungen (Herzerkrankungen, Krebs, Diabetes, etc.)

7. **Lifestyle** (6 Fragen)
   - Rauchen, Alkohol, Sport, Beruf, Stresslevel

8. **Women's Health** (4 Fragen) - **Conditional!**
   - Schwangerschaft, Stillzeit, letzte Menstruation
   - Nur sichtbar wenn `gender === 'female'`

### **Conditional Logic Beispiele:**
```json
{
  "id": "previous_treatment_details",
  "type": "textarea",
  "conditions": [
    {
      "questionId": "previous_treatment",
      "operator": "equals",
      "value": "yes"
    }
  ]
}
```

---

## 🧪 TESTING STRATEGIE

### **Unit Tests (Jest)**
```typescript
// Domain Layer
describe('AnswerValidator', () => {
  it('should validate required field', () => {
    const result = AnswerValidator.validate(null, requiredQuestion);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('This field is required');
  });
});

// Use Cases
describe('SaveAnswerUseCase', () => {
  it('should encrypt and save answer', async () => {
    const mockRepo = new MockAnswerRepository();
    const useCase = new SaveAnswerUseCase(mockRepo, mockEncryption);
    
    const result = await useCase.execute(input);
    
    expect(result.success).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### **Integration Tests**
```typescript
describe('Questionnaire Flow', () => {
  it('should load questionnaire with answers', async () => {
    // Setup DB
    await database.connect();
    
    // Create patient & questionnaire
    // ...
    
    // Load questionnaire
    const result = await loadQuestionnaireUseCase.execute(input);
    
    expect(result.success).toBe(true);
    expect(result.questionnaire).toBeDefined();
  });
});
```

### **E2E Tests (Detox)**
```typescript
describe('Questionnaire Screen', () => {
  it('should answer questions and navigate', async () => {
    await device.launchApp();
    
    // Navigate to questionnaire
    await element(by.id('start-anamnesis-btn')).tap();
    
    // Fill first question
    await element(by.id('question-first_name')).typeText('John');
    
    // Next section
    await element(by.id('next-btn')).tap();
    
    // Verify navigation
    await expect(element(by.text('General Anamnesis'))).toBeVisible();
  });
});
```

---

## 🚀 NEXT STEPS

### **Sofort implementieren:**
1. ✅ **Testing Infrastructure** (Jest + Detox)
2. ✅ **Weitere Screens** (PatientInfo, GDPRConsent, Summary, Export)
3. ✅ **Alle 19 Sprachen** (FR, ES, IT, TR, PL, RU, AR, ZH, PT, NL, UK, FA, UR, SQ, RO, HI, JA)
4. ✅ **OCR Service** (Tesseract.js für Dokumenten-Scan)
5. ✅ **Voice Service** (Vosk für offline Speech-to-Text)
6. ✅ **Platform Builds** (Android gradle, iOS Xcode, Windows)

### **Deployment:**
- **Android**: Google Play Store
- **iOS**: Apple App Store
- **Windows**: Microsoft Store

---

## 💡 CLEAN ARCHITECTURE VORTEILE

✅ **Testability**
- Domain Layer: Pure Functions, keine Dependencies
- Use Cases: Mock Repositories
- Components: Mock Use Cases

✅ **Maintainability**
- SQLite → Realm? Nur Infrastructure Layer ändern
- Neue Frage-Typen? Domain Layer erweitern
- Neue UI? Presentation Layer tauschen

✅ **Scalability**
- Neue Features = neue Use Cases
- Horizontal Scaling (Microservices später möglich)
- Vertical Scaling (mehr Entities)

✅ **DSGVO Compliance**
- Encryption isoliert in Infrastructure
- GDPR Consents in Domain
- Audit Logging überall

---

## 📚 RESSOURCEN

- **Clean Architecture**: Robert C. Martin
- **Domain-Driven Design**: Eric Evans
- **React Native Docs**: https://reactnative.dev
- **DSGVO**: https://dsgvo-gesetz.de
- **GDT Spezifikation**: GDT 2.1/3.0 Documentation

---

**Erstellt von**: Senior Principal Software Architect  
**Datum**: 28. Dezember 2025  
**Version**: 1.0.0
