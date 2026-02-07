# STRATEGIC ROADMAP — Anamnese Mobile App
> **Version**: 2.0 | **Date**: 2025-02-07 | **Framework**: MoSCoW Prioritization

---

## MUST HAVE (P0 — Before Production Release)

### M1: Professional i18n Translations
- **Status**: 🔴 Missing
- **Impact**: All 17 non-EN locales use English fallback values for 47 keys (5 buttons + 42 placeholders)
- **Action**: Send `en.json` canonical to professional translation service for all 18 target languages
- **Files**: `src/presentation/i18n/locales/*.json`
- **Effort**: 1-2 weeks (external)

### M2: Code Signing & MSIX Packaging
- **Status**: 🔴 Not configured
- **Impact**: Windows app cannot be distributed without signed package
- **Action**: Obtain EV code signing certificate, configure `Package.appxmanifest` with publisher identity, automate MSIX creation in CI
- **Files**: `windows/anamnese-mobile/Package.appxmanifest`, `.github/workflows/ci.yml`
- **Effort**: 2-3 days

### M3: Native Encryption on Windows
- **Status**: 🟡 Partial — falls back to WebCrypto (JS-only)
- **Impact**: No hardware-backed key storage on Windows; `SharedEncryptionBridge` returns `null`
- **Action**: Implement Windows Credential Manager bridge via C++/WinRT native module, or use Windows Hello for key protection
- **Files**: `windows/anamnese-mobile/`, `src/shared/SharedEncryptionBridge.ts`
- **Effort**: 1-2 weeks

### M4: E2E Test Suite Activation
- **Status**: 🟡 Detox configured but no active tests
- **Impact**: No automated UI verification on real devices
- **Action**: Write Detox test scenarios for critical paths: login → questionnaire → export
- **Files**: `e2e/`
- **Effort**: 1 week

### M5: CI/CD Pipeline Completion
- **Status**: 🟡 Partial CI exists
- **Impact**: No automated build/test/deploy pipeline for Windows/iOS/Android
- **Action**: Add Windows build step (MSBuild + MSIX), iOS build (Fastlane), Android build (Gradle), deploy to App Center or TestFlight
- **Files**: `.github/workflows/ci.yml`
- **Effort**: 1 week

### M6: ESM Jest Configuration
- **Status**: 🟡 2 todo tests blocked
- **Impact**: Zustand/Immer store integration untested
- **Action**: Configure `--experimental-vm-modules` or migrate to Vitest
- **Files**: `jest.config.js`, `package.json`
- **Effort**: 2-3 days

---

## SHOULD HAVE (P1 — Post-Launch Iteration 1)

### S1: Windows App SDK Migration (WinUI 3)
- **Status**: Currently UWP (WinUI 2)
- **Impact**: UWP is in maintenance mode; WinUI 3 is the future
- **Action**: Migrate from `react-native-windows` UWP to WinUI 3 target when RNW supports it
- **Effort**: 2-4 weeks (depends on RNW release cycle)

### S2: Windows Hello Integration
- **Status**: Not implemented
- **Impact**: Biometric authentication not available on Windows
- **Action**: Add Windows Hello support for master password bypass (with user consent)
- **Effort**: 1 week

### S3: Offline-First Sync Architecture
- **Status**: App is offline-first (SQLite) but no sync
- **Impact**: Data lives only on device
- **Action**: Design sync protocol (CRDT or event-sourced) with encrypted cloud backup
- **Effort**: 3-4 weeks

### S4: PDF Export Quality
- **Status**: Basic PDF generation
- **Impact**: Professional medical documents need proper formatting
- **Action**: Implement branded PDF templates with medical document standards
- **Effort**: 1 week

### S5: Voice Input Improvements
- **Status**: Basic `@react-native-voice/voice` integration
- **Impact**: Voice recognition accuracy varies by language
- **Action**: Evaluate whisper.cpp local models for privacy-preserving STT across 19 languages
- **Effort**: 2-3 weeks (research + implementation)

---

## COULD HAVE (P2 — Future Enhancements)

### C1: ARM64 Native Build
- **Status**: x64 only
- **Impact**: Growing ARM64 Windows device market (Surface Pro X, etc.)
- **Action**: Add ARM64 build target to MSBuild, test on ARM64 devices
- **Effort**: 2-3 days

### C2: Microsoft Store Packaging
- **Status**: Sideload only
- **Impact**: Limited distribution channel
- **Action**: Create Store listing, configure StoreAssociation.xml, submit MSIX
- **Effort**: 1 week (incl. review process)

### C3: Analytics Dashboard (Web)
- **Status**: Local analytics only (`LocalAnalyticsService`)
- **Impact**: No aggregated usage insights
- **Action**: Build web dashboard consuming anonymized analytics (privacy-preserving)
- **Effort**: 2-3 weeks

### C4: OCR Integration
- **Status**: `TesseractOCRService` exists but not active
- **Impact**: Manual data entry for existing documents
- **Action**: Complete Tesseract integration for document scanning
- **Effort**: 1 week

### C5: Multi-Device Session Transfer
- **Status**: Not implemented
- **Impact**: Patients can't continue questionnaire on different device
- **Action**: QR-code based encrypted session transfer
- **Effort**: 2 weeks

---

## WON'T HAVE (This Release)

| Item | Reason |
|------|--------|
| Cloud-based AI analysis | Privacy concerns with DSGVO Art. 9 (health data) |
| Third-party analytics (Firebase, Mixpanel) | DSGVO non-compliant for medical data |
| Social login (Google, Apple) | Not applicable for medical context |
| In-app purchases | Medical app, no monetization |

---

## Technical Debt Register

| Item | Priority | Effort | Location |
|------|----------|--------|----------|
| Duplicate `NativeEncryptionService.test.ts` | Low | 30 min | `__tests__/` |
| `fr.json` placeholder values in German | Medium | 2 hrs | `src/presentation/i18n/locales/fr.json` |
| `devNakedTextGuard` only in DEV | OK | — | By design |
| `react-native-document-picker` disabled on Windows | Medium | 1 day | `react-native.config.js` |
| `react-native-fs` disabled on Windows | Medium | 1 day | `react-native.config.js` |
| Hardcoded demo patients in shared module | Low | 1 hr | `src/shared/demoData.ts` |

---

*Generated by DevOps-Architect v1.0 — Phase 5*
