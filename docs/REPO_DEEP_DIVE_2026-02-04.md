# REPO DEEP DIVE — Anamnese-App

**Version:** 2026-02-04  
**Purpose:** Comprehensive technical reference for developers and AI agents  
**Status:** Living document, updated per run

---

## 1. Entry Points & Bootstrap

| Platform | Entry File | App Name Source | Key Dependencies |
|----------|------------|-----------------|------------------|
| **iOS/Android** | [index.js](../index.js) | `package.json` → `name` | `AppRegistry.registerComponent()` |
| **Windows** | [index.js](../index.js) | `package.json` → `name` | react-native-windows 0.73.22 |
| **Web** | [web/index.js](../web/index.js) | `app.json` → `expo.name` | webpack.config.js, react-native-web |

### Bootstrap Sequence (App.tsx)

```
index.js
  └─ WrappedApp (ErrorBoundary)
       └─ App.tsx
            ├─ installGlobalErrorHandlers()
            ├─ database.connect()
            ├─ loadActiveSession()
            ├─ loadPersistedEncryptionKeyIfOptedIn()
            └─ Provider Graph:
                 GestureHandlerRootView
                   └─ SafeAreaProvider
                        └─ ThemeProvider
                             └─ ToastProvider
                                  └─ PatientProvider
                                       └─ NavigationContainer
                                            └─ RootNavigator
```

**Key file:** [src/presentation/App.tsx](../src/presentation/App.tsx)

---

## 2. Architecture Layers (Clean Architecture)

| Layer | Path | Responsibility |
|-------|------|----------------|
| **Domain** | `src/domain/` | Entities, Validation, Business Rules |
| **Application** | `src/application/` | Use Cases, Context Providers |
| **Infrastructure** | `src/infrastructure/` | DB, Native Bridges, Analytics, Speech |
| **Presentation** | `src/presentation/` | Screens, Components, Navigation, i18n |
| **Shared** | `src/shared/` | Logging, Crypto, Platform Utils |

### Key Files per Layer

- **Domain:** [Patient.ts](../src/domain/entities/Patient.ts), [Questionnaire.ts](../src/domain/entities/Questionnaire.ts)
- **Application:** [PatientContext.tsx](../src/application/PatientContext.tsx)
- **Infrastructure:** [DatabaseConnection.ts](../src/infrastructure/persistence/DatabaseConnection.ts), [TTSService.ts](../src/infrastructure/speech/TTSService.ts)
- **Presentation:** [RootNavigator.tsx](../src/presentation/navigation/RootNavigator.tsx), [useQuestionnaireStore.ts](../src/presentation/state/useQuestionnaireStore.ts)
- **Shared:** [keyManager.ts](../src/shared/keyManager.ts), [logger.ts](../src/shared/logger.ts)

---

## 3. State Management

| Store | Technology | Location |
|-------|------------|----------|
| **Questionnaire State** | Zustand + Immer | [useQuestionnaireStore.ts](../src/presentation/state/useQuestionnaireStore.ts) |
| **Patient Context** | React Context | [PatientContext.tsx](../src/application/PatientContext.tsx) |
| **Theme** | React Context | [ThemeContext.tsx](../src/presentation/theme/ThemeContext.tsx) |
| **Persistent** | SQLite + AsyncStorage + Keychain | [DatabaseConnection.ts](../src/infrastructure/persistence/DatabaseConnection.ts) |

---

## 4. Agents & Governance Artifacts

### 4.1 Role-Based Agents (Documented)

| Agent | Role/Purpose | Source |
|-------|--------------|--------|
| **Architecture Agent** | DDD structure, Tech decisions, Security | [Agent-Laufbahn.md](../Agent-Laufbahn.md) |
| **Coding Agent / Copilot** | Implementation, TS/RN, TDD | [copilot-instructions.md](../.github/copilot-instructions.md) |
| **QA Agent** | E2E/UI Tests (Playwright/Detox) | [Agent-Laufbahn.md](../Agent-Laufbahn.md) |
| **Compliance Agent** | DSGVO checks, Audit logs, Deletion | [Agent-Laufbahn.md](../Agent-Laufbahn.md) |

### 4.2 System Prompt Artifacts (SOPs)

| Artifact | Purpose | Location |
|----------|---------|----------|
| **Copilot Constitution** | Ground-Zero process, DSGVO/CRA, No PII in logs, Laufbahn-first | [copilot-instructions.md](../.github/copilot-instructions.md) |
| **Secure Dev Protocol** | Telemetry-off, Supply-chain pinning, Secrets management | [SECURE_DEV_PROTOCOL_V1](../src/Prompts/SECURE_DEV_PROTOCOL_V1) |
| **Agent Workflow Playbook** | Step-by-step task execution | [AGENT_WORKFLOW_PLAYBOOK.md](../AGENT_WORKFLOW_PLAYBOOK.md) |

### 4.3 Historical Run Labels (AGENT_LAUFBAHN.md)

| Model Label | Example Runs |
|-------------|--------------|
| Copilot (GPT-5.2) | Multiple feature implementations |
| Codex (GPT-5) | UI transition runs |
| Claude Sonnet 4.5 | Docs, cross-platform |
| Claude Opus 4.5 | Complex refactoring |

**Note:** These are log labels, not programmatic model configurations.

---

## 5. i18n Configuration

- **Supported Languages:** 19 (de, en, ar, el, es, fa, fr, it, ja, ko, nl, pl, pt, ro, ru, tr, uk, vi, zh)
- **Config:** [config.ts](../src/presentation/i18n/config.ts)
- **Locale Files:** `src/presentation/i18n/locales/*.json`

---

## 6. Build & Run Scripts (package.json)

| Script | Purpose |
|--------|---------|
| `npm start` | Metro bundler |
| `npm test` | Jest test suite |
| `npm run type-check` | TypeScript noEmit |
| `npm run windows` | Windows dev build |
| `npm run web` | Webpack dev server |

### Windows-Specific Automation

- [windows-cleanrun.ps1](../scripts/windows-cleanrun.ps1)
- [windows-ready-to-test.ps1](../scripts/windows-ready-to-test.ps1)

---

## 7. Testing Strategy

| Type | Framework | Location |
|------|-----------|----------|
| Unit | Jest | `__tests__/**/*.test.ts` |
| Component | Jest + RTL | `__tests__/presentation/**` |
| Integration | Jest (skipped due to ESM) | `__tests__/integration/**` |
| E2E | Maestro/Detox (planned) | `e2e/` |

### Current Test Status (2026-02-04)

- **Passing:** 57 suites
- **Skipped:** 4 (ESM issues with zustand/immer)
- **Coverage Threshold:** 70% (branches, functions, lines, statements)

---

## 8. Compliance & Security

### DSGVO / GDPR

- **Privacy by Design (Art. 25):** Data minimization, DTOs, no raw entities exposed
- **Right to Deletion (Art. 17):** Crypto-shredding via surrogate keys
- **Logging Policy (Art. 9):** No PII in logs, masked outputs

### CRA / Secure-by-Default

- All configs restrictive (ports closed, auth enabled)
- Secrets via `process.env.*` only, never hardcoded
- Dependency versions pinned in package.json

---

## 9. Cross-Platform Matrix

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | ✅ Supported | React Native 0.73 |
| Android | ✅ Supported | React Native 0.73 |
| Windows | ✅ Supported | RNW 0.73.22 |
| macOS | 🔧 Scaffolded | Needs testing |
| Web | ✅ Supported | Webpack + RN-Web |

### Platform Guards

- Optional imports wrapped in try/catch ([index.js](../index.js))
- Windows autolink disabled for risky modules ([react-native.config.js](../react-native.config.js))
- Web shims in [webpack.config.js](../webpack.config.js)

---

## 10. Evidence & Logs

All build/test evidence is stored in `buildLogs/`:

- Type-check: `typecheck_*.log`
- Jest: `jest_*.log`
- Windows builds: `windows-*.log`, `msbuild_*.binlog`
- Web: `web_*.log`

---

## 11. Quick Reference Commands

```powershell
# Type check
npm run type-check

# Run tests
npm test

# Start Windows app (dev)
npm run windows

# Start Web dev server
npm run web

# Clean Windows build
.\scripts\windows-cleanrun.ps1
```

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-02-04 | Initial version. Fixed RootNavigator syntax, TTS mock, Button variants, test ESM issues. |

