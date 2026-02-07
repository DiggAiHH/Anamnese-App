# MANUAL QA GUIDE — Anamnese Mobile App (Windows)
> **Date**: 2025-02-07 | **Build**: Release | **Platform**: Windows (UWP)

---

## 🔴 CRITICAL — Test These First

### 1. Master Password & Brute-Force Protection
- [ ] Launch app → Home screen appears
- [ ] Navigate to Master Password screen
- [ ] Enter wrong password 3 times → verify no lockout yet (3 free attempts)
- [ ] Enter wrong password 4th time → verify delay appears (exponential backoff)
- [ ] After 10 wrong attempts → verify hard lockout with timer
- [ ] Enter correct password → verify access granted
- [ ] Verify NO password/PII appears in console logs

### 2. Session Timeout
- [ ] Log in successfully → start questionnaire
- [ ] Leave app idle for 15 minutes (default timeout)
- [ ] Verify session expires and user is redirected to login
- [ ] Verify encryption key is cleared from memory on timeout

### 3. Encryption Integrity
- [ ] Create a new patient with PII (name, DOB, insurance number)
- [ ] Complete a questionnaire
- [ ] Close and reopen app
- [ ] Enter master password → verify data is decrypted and accessible
- [ ] Enter wrong password → verify data is NOT accessible (no plaintext leak)

### 4. i18n — Language Switching (19 Languages)
- [ ] On language selection screen, switch to each language:
  - [ ] German (de) — primary, check all buttons visible
  - [ ] English (en) — canonical
  - [ ] French (fr)
  - [ ] Spanish (es)
  - [ ] Arabic (ar) — check RTL layout
  - [ ] Japanese (ja), Chinese (zh), Korean (ko) — check CJK rendering
  - [ ] Persian (fa) — check RTL
- [ ] Verify all 6 buttons appear: Next, Back, Save, Cancel, Submit, Export
- [ ] Verify form placeholder text appears in text fields
- [ ] Verify no "missing translation" keys or raw key strings shown

---

## 🟡 IMPORTANT — Test These Second

### 5. Questionnaire Flow (Happy Path)
- [ ] Select language → Enter password → Select role → Privacy consent
- [ ] Patient type selection → Visit reason → Patient info form
- [ ] Fill in patient demographics (all fields)
- [ ] GDPR consent → Accept
- [ ] Complete questionnaire (answer all questions)
- [ ] Review summary screen → verify all answers displayed
- [ ] Export → verify GDT/PDF generation

### 6. Data Management (GDPR Art. 17)
- [ ] Navigate to Data Management screen
- [ ] Delete all data → confirm dialog
- [ ] Verify all patient data is removed
- [ ] Verify app returns to initial state
- [ ] Verify no orphaned data in saved anamneses

### 7. Windows-Specific Behaviors
- [ ] Verify navigation animations are smooth (140ms/120ms)
- [ ] Verify DatePicker works (fallback mode on Windows)
- [ ] Verify keyboard navigation works (Tab, Enter, Escape)
- [ ] Verify window resize behaves correctly
- [ ] Verify app works at different DPI settings (100%, 125%, 150%, 200%)

### 8. Accessibility (BITV 2.0)
- [ ] Enable Windows High Contrast mode → verify high-contrast theme activates
- [ ] Verify all text meets WCAG AAA contrast ratios
- [ ] Test with Windows Narrator → verify screen elements are announced
- [ ] Verify zoom (Ctrl+/Ctrl-) works without layout breaking
- [ ] Verify all interactive elements have accessible labels

---

## 🟢 NICE TO HAVE — Test If Time Permits

### 9. Saved Anamneses
- [ ] Complete 2-3 questionnaires
- [ ] Navigate to Saved Anamneses
- [ ] Verify all appear in list
- [ ] Open a saved one → verify data integrity
- [ ] Delete one → verify removal

### 10. Feedback Screen
- [ ] Navigate to Feedback
- [ ] Submit feedback text
- [ ] Verify feedback is captured

### 11. Clinical Calculators
- [ ] Navigate to Calculator screen
- [ ] Test BMI calculator with known values
- [ ] Verify correct calculation results

### 12. Voice Input (if available)
- [ ] Navigate to Voice screen
- [ ] Test speech recognition
- [ ] Verify text appears correctly

---

## ⚠️ Known Limitations (Windows)

| Limitation | Reason | Workaround |
|-----------|--------|------------|
| No native keychain | `react-native-keychain` not supported on Windows | Key stored in memory only; user must re-enter password on restart |
| No file picker | `react-native-document-picker` disabled (CLRHost.dll issue) | Export via clipboard/share |
| No RNFS | `react-native-fs` disabled on Windows (security) | Use alternative file APIs |
| i18n fallback values | 17 locales use EN fallback for 47 keys | Professional translations pending |
| WebCrypto only | No hardware-backed crypto on Windows | AES-256-GCM still secure, just software-based |

---

## 📊 Test Evidence Checklist

After testing, document:
- [ ] Build version / commit hash
- [ ] Windows version tested on
- [ ] Screen resolution and DPI
- [ ] All critical tests (§1-4) passed? Y/N
- [ ] Any bugs found? Description + screenshot
- [ ] Overall assessment: SHIP / FIX FIRST / BLOCK

---

## 🔧 Build Commands

```powershell
# Dev mode (with Metro server)
npx react-native run-windows

# Release mode
npx react-native run-windows --release

# Release mode (no auto-launch, just build)
npx react-native run-windows --release --no-launch

# Type check
npx tsc --noEmit

# Run tests
npx jest --no-coverage --forceExit
```

---

*Generated by DevOps-Architect v1.0*
