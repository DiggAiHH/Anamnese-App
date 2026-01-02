# 🧪 TESTING DOCUMENTATION

## Testing Strategy

Die **Anamnese Mobile App** verwendet eine umfassende Testing-Strategie mit **3 Test-Ebenen**:

1. **Unit Tests** (Jest) - Domain & Infrastructure Layer
2. **Integration Tests** (Jest) - Application Layer & Use Cases  
3. **E2E Tests** (Detox) - UI & User Flows

---

## 📊 Test Coverage Goals

- **Minimum**: 70% Code Coverage
- **Target**: 85% Code Coverage
- **Critical Paths**: 100% (Encryption, GDPR, GDT Export)

---

## 🔧 Test Setup

### Prerequisites
```bash
cd mobile-app
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test Answer.test.ts
```

### Watch Mode (Development)
```bash
npm test -- --watch
```

---

## 📁 Test Structure

```
mobile-app/
├── __tests__/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── Answer.test.ts
│   │   │   ├── Questionnaire.test.ts
│   │   │   ├── Patient.test.ts
│   │   │   ├── Document.test.ts
│   │   │   └── GDPRConsent.test.ts
│   │   └── value-objects/
│   │       ├── EncryptedData.test.ts
│   │       └── GDTExport.test.ts
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── SQLitePatientRepository.test.ts
│   │   │   ├── SQLiteAnswerRepository.test.ts
│   │   │   └── DatabaseConnection.test.ts
│   │   ├── encryption/
│   │   │   └── NativeEncryptionService.test.ts
│   │   └── services/
│   │       ├── TesseractOCRService.test.ts
│   │       └── VoskSpeechService.test.ts
│   ├── application/
│   │   └── use-cases/
│   │       ├── SaveAnswerUseCase.test.ts
│   │       ├── LoadQuestionnaireUseCase.test.ts
│   │       ├── CreatePatientUseCase.test.ts
│   │       └── ExportGDTUseCase.test.ts
│   └── e2e/
│       ├── questionnaire-flow.test.ts
│       ├── encryption.test.ts
│       └── gdpr-compliance.test.ts
```

---

## 🧩 Unit Tests

### Domain Entities Tests

**Answer.test.ts**
```typescript
✓ should create answer entity with required fields
✓ should create answer with AI-generated metadata
✓ should throw error for invalid confidence
✓ should update answer value and add audit log
✓ should return true for voice/ocr answers (isAIGenerated)
✓ should return false for manual answers
✓ should return true for low confidence AI answers (needsReview)
```

**Questionnaire.test.ts**
```typescript
✓ should create questionnaire entity
✓ should show questions when conditions are met
✓ should hide questions when conditions are not met
✓ should handle contains operator
✓ should calculate progress based on answered required questions
✓ should mark questionnaire as completed
```

### Value Objects Tests

**GDTExport.test.ts**
```typescript
✓ should create GDT export with required fields
✓ should format GDT record correctly
✓ should calculate length correctly
✓ should build GDT header
✓ should build patient data record
✓ should format birth date correctly (DDMMYYYY)
✓ should convert gender to GDT codes (M/W)
✓ should calculate correct checksum
✓ should generate complete GDT file content
✓ should validate correct GDT data
```

---

## 🔐 Infrastructure Tests

### Encryption Tests

**NativeEncryptionService.test.ts**
```typescript
✓ should derive encryption key from master password
✓ should hash password for verification
✓ should encrypt and decrypt data successfully
✓ should fail decryption with wrong key
✓ should handle empty data
✓ should handle unicode characters (äöü ñ 中文 🎉)
✓ should handle long data (10,000 characters)
✓ should generate random bytes
✓ should verify correct password
✓ should reject incorrect password
```

### Repository Tests

**SQLitePatientRepository.test.ts** (TODO)
```typescript
✓ should save patient to database
✓ should find patient by ID
✓ should update patient
✓ should delete patient
✓ should handle GDPR bulk delete
```

---

## 📦 Application Layer Tests

### Use Case Tests

**SaveAnswerUseCase.test.ts**
```typescript
✓ should save answer successfully
✓ should fail for invalid required field
✓ should fail for too short text
✓ should save answer with AI metadata
✓ should update existing answer
```

**LoadQuestionnaireUseCase.test.ts** (TODO)
```typescript
✓ should load questionnaire with template
✓ should decrypt answers
✓ should evaluate conditional logic
✓ should return visible questions only
```

**ExportGDTUseCase.test.ts** (TODO)
```typescript
✓ should check GDPR consent before export
✓ should decrypt patient data
✓ should build GDT 2.1 format
✓ should build GDT 3.0 format
✓ should add audit log entry
✓ should fail without consent
```

---

## 🎭 E2E Tests (Detox)

### Setup Detox
```bash
# Install Detox CLI
npm install -g detox-cli

# Build app for testing
detox build --configuration ios.sim.debug

# Run E2E tests
detox test --configuration ios.sim.debug
```

### E2E Test Scenarios

**questionnaire-flow.test.ts** (TODO)
```typescript
describe('Questionnaire Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should complete full questionnaire flow', async () => {
    // 1. Start new anamnesis
    await element(by.id('start-anamnesis-btn')).tap();

    // 2. Select language (German)
    await element(by.id('language-de')).tap();
    await element(by.id('continue-btn')).tap();

    // 3. Set master password
    await element(by.id('master-password-input')).typeText('TestPassword123!');
    await element(by.id('confirm-password-input')).typeText('TestPassword123!');
    await element(by.id('set-password-btn')).tap();

    // 4. Fill patient info
    await element(by.id('question-first_name')).typeText('John');
    await element(by.id('question-last_name')).typeText('Doe');
    await element(by.id('question-birth_date')).typeText('01.01.1980');
    
    // 5. Select gender (male)
    await element(by.id('option-male')).tap();

    // 6. Next section
    await element(by.id('next-btn')).tap();

    // 7. Verify women's health section is hidden
    await expect(element(by.text('Women\'s Health'))).not.toBeVisible();

    // 8. Complete questionnaire
    // ... (fill all sections)

    // 9. Verify summary screen
    await expect(element(by.id('summary-screen'))).toBeVisible();
  });
});
```

**encryption.test.ts** (TODO)
```typescript
describe('Encryption', () => {
  it('should encrypt all PII data', async () => {
    // Create patient with PII
    // Verify data is encrypted in DB
    // Decrypt and verify original data
  });

  it('should fail with wrong master password', async () => {
    // Set password
    // Close app
    // Reopen app
    // Try to unlock with wrong password
    // Verify error message
  });
});
```

**gdpr-compliance.test.ts** (TODO)
```typescript
describe('GDPR Compliance', () => {
  it('should track all consents', async () => {
    // Create patient
    // Verify consent checkboxes
    // Grant consents
    // Verify audit log
  });

  it('should delete all data (Right to Deletion)', async () => {
    // Create patient with data
    // Go to settings
    // Tap "Delete All Data"
    // Confirm deletion
    // Verify database is empty
  });

  it('should export data (Right to Portability)', async () => {
    // Create patient with data
    // Export JSON
    // Verify file contents
  });
});
```

---

## 🚨 Critical Test Cases

### 1. Encryption Round-Trip
```typescript
it('should encrypt and decrypt patient data', async () => {
  const originalData = {
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1980-01-01',
  };

  const key = await encryption.deriveKey('MasterPassword123!');
  const encrypted = await encryption.encrypt(JSON.stringify(originalData), key);
  const decrypted = await encryption.decrypt(encrypted, key);
  
  expect(JSON.parse(decrypted)).toEqual(originalData);
});
```

### 2. Conditional Logic
```typescript
it('should hide women\'s health for male patients', () => {
  const answers = new Map([['gender', 'male']]);
  const visibleQuestions = questionnaire.getVisibleQuestions(answers);
  
  const womensHealthQuestions = visibleQuestions.filter(q => 
    q.id.includes('pregnant') || q.id.includes('breastfeeding')
  );
  
  expect(womensHealthQuestions.length).toBe(0);
});
```

### 3. GDT Export Format
```typescript
it('should generate valid GDT 2.1 file', () => {
  const gdt = GDTExportVO.buildPatientRecord({
    firstName: 'John',
    lastName: 'Doe',
    birthDate: '1980-01-15',
    gender: 'male',
  });

  expect(gdt).toContain('3101 Doe'); // Last name
  expect(gdt).toContain('3102 John'); // First name
  expect(gdt).toContain('3103 15011980'); // Birth date DDMMYYYY
  expect(gdt).toContain('3110 M'); // Gender male
});
```

### 4. GDPR Consent Tracking
```typescript
it('should track consent changes in audit log', () => {
  const consent = GDPRConsentEntity.create({
    patientId: 'p123',
    type: 'data_processing',
    granted: true,
    // ...
  });

  expect(consent.auditLog).toHaveLength(1);
  expect(consent.auditLog[0].action).toBe('granted');

  const revokedConsent = consent.revoke('User withdrew consent');
  
  expect(revokedConsent.granted).toBe(false);
  expect(revokedConsent.auditLog).toHaveLength(2);
  expect(revokedConsent.auditLog[1].action).toBe('revoked');
});
```

---

## 🎯 Test Execution Plan

### Phase 1: Unit Tests (Week 1)
- ✅ Domain Entities (Answer, Questionnaire)
- ✅ Value Objects (EncryptedData, GDTExport)
- ✅ Encryption Service
- ⏳ All Repositories (Patient, Document, GDPRConsent)

### Phase 2: Integration Tests (Week 2)
- ✅ SaveAnswer Use Case
- ⏳ LoadQuestionnaire Use Case
- ⏳ CreatePatient Use Case
- ⏳ ExportGDT Use Case

### Phase 3: E2E Tests (Week 3)
- ⏳ Questionnaire Flow
- ⏳ Encryption Flow
- ⏳ GDPR Compliance Flow
- ⏳ OCR Document Upload
- ⏳ Voice Input

---

## 📈 Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Dependencies
        run: cd mobile-app && npm install
      
      - name: Run Tests
        run: cd mobile-app && npm test -- --coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./mobile-app/coverage/lcov.info
```

---

## 🐛 Debugging Tests

### Run Single Test
```bash
npm test -- Answer.test.ts
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/mobile-app/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache", "${file}"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### View Coverage Report
```bash
npm test -- --coverage
open mobile-app/coverage/lcov-report/index.html
```

---

## ✅ Test Checklist

- [x] Answer Entity Tests
- [x] Questionnaire Entity Tests
- [x] GDT Export Tests
- [x] Encryption Service Tests
- [x] SaveAnswer Use Case Tests
- [ ] Patient Entity Tests
- [ ] Document Entity Tests
- [ ] GDPR Consent Entity Tests
- [ ] All Repository Tests
- [ ] LoadQuestionnaire Use Case Tests
- [ ] CreatePatient Use Case Tests
- [ ] ExportGDT Use Case Tests
- [ ] OCR Service Tests
- [ ] Speech Service Tests
- [ ] E2E Questionnaire Flow
- [ ] E2E Encryption Flow
- [ ] E2E GDPR Flow

---

**Status**: 5/18 Test Suites Complete ✅  
**Coverage**: 35% → Target: 85%  
**Next**: Patient/Document/GDPRConsent Entity Tests
