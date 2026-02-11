# SYSTEM GROUND TRUTH — Anamnese-App

> This file is the canonical "Ground of Truth" for ALL agents (OpenClaw, Copilot, etc.).
> Indexed into QMD vector memory. Human-readable AND machine-indexed.

## Identität
- **Nutzer**: Senior Architect / Lead DevSecOps
- **Projekt**: DSGVO-konforme medizinische Anamnese-App (Patientendaten-Erfassung)
- **Regulatorik**: DSGVO Art. 25/17/9, CRA Secure-by-Default, ISO 27001, AI Act
- **Sprache**: Deutsch (Projektsprache), English (Code/Docs), 19 App-Locales

## Tech Stack
| Layer        | Technologie                                           |
|--------------|-------------------------------------------------------|
| Runtime      | React Native 0.73.11, React 18.2.0, TypeScript 5.3.3 |
| Navigation   | @react-navigation/native 6 + stack 6                 |
| State        | Zustand 4.4.7 + Immer 10                             |
| Validation   | Zod 3.22.4                                            |
| i18n         | i18next 23 + react-i18next 14 — 19 Locales           |
| Persistence  | react-native-sqlite-storage 6, AsyncStorage 1.21     |
| Encryption   | AES-256-GCM (WebCrypto + @noble/ciphers), Keychain   |
| Testing      | Jest 29.7, @testing-library/react-native 13, Detox 20|
| Build (Web)  | Webpack 5.90                                          |
| Build (Win)  | MSBuild (react-native-windows 0.73.22)                |
| CI/CD        | GitHub Actions (8 jobs: lint, test, web, android, win, ios, macos, summary) |

## Plattformen (6)
1. **Android** — Gradle + React Native
2. **iOS** — Xcode + React Native (scaffolded)
3. **macOS** — react-native-macos 0.73.36
4. **Windows** — react-native-windows 0.73.22 (UWP/XAML/MSBuild)
5. **Web** — react-native-web 0.19.10 + Webpack 5 (Netlify)
6. **Cross-Platform Core** — Shared TypeScript codebase

## Architektur (Clean Architecture / DDD)
```
src/
├── domain/         # Entities, Repository-Interfaces, Value Objects, Validators
├── application/    # Use Cases, Services, PatientContext
├── infrastructure/ # SQLite Repos, Encryption, Analytics, OCR, Speech
├── presentation/   # 32 Screens, Components, Hooks, i18n, Navigation, State, Theme
└── shared/         # Logging, Config, Error Handling, Platform Capabilities
```

## Kritische Pfade
| Pfad                          | Bedeutung                                    |
|-------------------------------|----------------------------------------------|
| `LAUFBAHN.md`                 | Agent Runbook — Session Start MUSS hier lesen |
| `CURRENT_TASKS.md`            | Aktive Task-Checklisten mit Run-IDs          |
| `TODO.md`                     | UX/ISO Upgrade-Plan                          |
| `.github/copilot-instructions.md` | 16-Sektionen Agent Constitution         |
| `buildLogs/`                  | Evidence-Ordner — NIEMALS löschen            |
| `scripts/`                    | 43 Automatisierungs-Scripts (PS1/JS/CJS/TS)  |
| `shared/encryption.js`        | WebCrypto AES-256-GCM Provider               |
| `__tests__/`                  | 946+ Tests, 109 Suites                       |

## DSGVO Non-Negotiables
- **Kein PII-Logging**: Keine E-Mail, IP, Namen, Credentials in console.log oder Files
- **Crypto-Shredding**: PII getrennt von Transaktionsdaten, verknüpft nur via UUIDs
- **DTOs only**: Niemals rohe ORM-Entities in API-Responses
- **Datenminimierung**: Nur IDs sammeln wenn möglich, keine ganzen Objekte

## Agent-Koexistenz
- **GitHub Copilot**: Code-Editing, Intellisense, In-Editor Refactoring
- **OpenClaw**: Shell-Autonomie, Build/Test Pipeline, Git Ops, Research, Pentest
- **Shared Ground of Truth**: Beide lesen MEMORY.md + LAUFBAHN.md
- **Conflict Rule**: Keine doppelten Writes auf gleiche Dateien gleichzeitig

## Model Routing (via Copilot Bridge)
- **Bridge**: `scripts/copilot-bridge.cjs` auf `127.0.0.1:18790`
- **Auth**: GitHub Token (gh auth) → Copilot Token Exchange → Model Calls
- **Keine separaten API Keys nötig** — GitHub Copilot Subscription reicht

| Task | Primary Model | Fallback |
|------|--------------|----------|
| Code Generation | gpt-4o | claude-sonnet |
| Code Review | claude-sonnet | o3-mini |
| Architecture | claude-sonnet | o1 |
| Security Audit | claude-sonnet | o1 |
| i18n Translation | claude-haiku | gpt-4o |
| Test Generation | o3-mini | gpt-4o |
| Deep Reasoning | o1 | claude-sonnet |
| Quick Tasks | claude-haiku | gpt-4o |

## Auto-Heal Pipeline
- **Enabled**: Bei Build/Test/Lint Fehler → automatische Analyse + Fix + Re-Run
- **Max Retries**: 3 pro Fehler pro Session
- **Prevention Registry**: `.openclaw/autoheal_registry.json` — verhindert Wiederholung
- **Modell-Auswahl**: Einfache Fixes → Haiku, komplexe → GPT-4o/Sonnet, Architektur → o1

## Testing Konventionen
- Jede neue Funktion → Unit-Test (Jest)
- Evidence in `buildLogs/`
- Test-Run = eigener TODO-Punkt
- Branch Coverage inkl. Fehlerfälle/Edge Cases

## No-Gos (ABSOLUT VERBOTEN)
- Dateien in `buildLogs/` löschen
- `*.sqlite` Datenbanken in Logs speichern
- Hardcoded Credentials im Code
- `rm -rf /` oder equivalente destructive Ops auf Systempfaden
- PII in jeglichen Logs
- `0.0.0.0` Binding für Agent Gateway (nur `127.0.0.1`)
- Patientendaten an LLM-APIs senden
- Auto-Heal auf Encryption/Security-Dateien ohne User-Approval
