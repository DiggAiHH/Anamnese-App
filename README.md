# Anamnese Mobile App

DSGVO-konforme medizinische Anamnese App für Android, iOS und Windows.

## 🎯 Features

- ✅ **Mehrsprachigkeit**: UI-Übersetzungen für **19 Sprachen** (de als Quelle, Key-Parität via Jest-Test).
- ✅ **AES-256 Verschlüsselung** (native Crypto APIs)
- ✅ **Offline-First** (keine externen Requests, DSGVO-konform)
- 🟡 **Lokales OCR** (Service vorhanden; UI/Flow noch nicht vollständig verdrahtet)
- 🟡 **Spracherkennung** (Service vorhanden; UI/Flow noch nicht vollständig verdrahtet)
- ✅ **GDT Export** (Consent-gated, lokale Datei)
- ✅ **Conditional Logic** (dynamische Fragen basierend auf Antworten)
- ✅ **WCAG 2.1 AA** (Barrierefreiheit)
- ✅ **Clean Architecture** (Domain-Driven Design)
- ✅ **Gespeicherte Anamnesen** (Liste + Resume Flow)

## 📦 Architektur

```
src/
├── domain/              # Business Logic (Framework-unabhängig)
├── application/         # Use Cases
├── infrastructure/      # Externe Abhängigkeiten (DB, Crypto, OCR)
└── presentation/        # React Native UI
```

Details: [docs/03_ARCHITECTURE.md](docs/03_ARCHITECTURE.md)

## 🚀 Setup

### Prerequisites

- Node.js >= 18.0.0
- React Native CLI
- Xcode (für iOS)
- Android Studio (für Android)
- Visual Studio (für Windows)

### Installation

```bash
# Dependencies installieren
npm install

# TypeScript Check
npm run type-check

# Tests ausführen
npm test

# Hinweis: In diesem Workspace-Snapshot sind die nativen Projektordner (z.B. android/ios/) aktuell nicht enthalten.
# Für Builds auf Android/iOS müssen diese Ordner im Projekt vorhanden sein.

# Android Build (wenn android/ vorhanden)
npm run android

# iOS Build (wenn ios/ vorhanden)
npm run ios

# macOS Build (wenn macos/ vorhanden)
npm run macos

# Windows Build (wenn windows/ vorhanden)
npm run windows

# Web Build (Production)
npm run web:build

# Web Dev Server (Development)
npm run web
```

## 🌐 Web Deployment

The app can be deployed as a Progressive Web App (PWA) to platforms like Netlify, Vercel, or any static hosting service.

**Quick Deploy to Netlify:**

```bash
# Build production bundle
npm run web:build

# Deploy using Netlify CLI
netlify deploy --prod --dir=web/dist
```

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

**Live Demo:** _(Add your Netlify URL here after deployment)_

**Note:** Web version has limited functionality compared to native apps:
- ✅ Core questionnaire, GDPR consent, calculator, export
- ⚠️ Storage: LocalStorage (instead of SQLite)
- ⚠️ Encryption: WebCrypto (instead of quick-crypto)
- ❌ Voice features (STT/TTS), secure keychain, native file system

## 🧪 Testing

```bash
# Unit Tests
npm test

# Coverage Report
npm test -- --coverage

# E2E Tests
npm run test:e2e:build
npm run test:e2e
```

## 🤖 OpenClaw AI Agent Integration

This repository is configured for OpenClaw - a multi-agent DevSecOps framework that works alongside GitHub Copilot.

### Quick Start

**Setup (One-time):**
```bash
# WSL2/Linux
npm run openclaw:setup:wsl

# Windows (PowerShell)
npm run openclaw:setup:win
```

**Start OpenClaw Stack:**
```bash
# WSL2/Linux
npm run openclaw:start

# Windows (PowerShell)
npm run openclaw:start:win
```

**Windows Auto-Startup (Optional):**
```powershell
# Run as Administrator to enable OpenClaw on Windows boot
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1

# To uninstall
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\install-openclaw-startup.ps1 -Uninstall
```

**Verify Setup:**
```bash
node scripts/verify-openclaw-setup.cjs
```

### Available Commands

```bash
# Security & Compliance
npm run openclaw:pentest              # Quick DSGVO scan
npm run openclaw:pentest:full         # Full pentest (all phases)

# Copilot Bridge (for model routing)
npm run openclaw:bridge               # Start Copilot API bridge

# Setup Scripts
npm run openclaw:setup:wsl            # WSL2 setup
npm run openclaw:setup:win            # Windows setup
```

### Configuration

- **Config**: `.openclaw/openclaw.json` - Main configuration
- **Skills**: `.openclaw/skills/` - Custom automation skills
- **Prompts**: `.openclaw/prompts/` - Workflow templates
- **Logs**: `buildLogs/openclaw/` - Execution logs (gitignored)

### Features

- ✅ **God Mode**: Full system access for builds, tests, security scans
- ✅ **Multi-Model Routing**: 5 Copilot models (GPT-4o, Claude Sonnet/Haiku, O1, O3-mini)
- ✅ **Auto-Heal**: Self-repairing build pipeline
- ✅ **Security**: Weekly pentest, DSGVO compliance checks
- ✅ **i18n Management**: 19-language audit and sync
- ✅ **Cross-Platform**: Android, iOS, macOS, Windows, Web builds

### Agent Collaboration

OpenClaw and GitHub Copilot share the same ground truth:

- **MEMORY.md** - Long-term knowledge base
- **LAUFBAHN.md** - Execution log and runbook
- **CURRENT_TASKS.md** - Shared task queue (gitignored)

Both agents follow the same conventions defined in `.github/copilot-instructions.md`.

## 📚 Dokumentation

- [Architecture](docs/03_ARCHITECTURE.md) - Clean Architecture & DDD
- [Elements List](docs/01_COMPLETE_ELEMENTS_LIST.md) - Alle UI Elemente
- [Questions List](docs/02_COMPLETE_QUESTIONS_LIST.md) - Kompletter Fragebogen
- [Feature Audit](docs/FEATURE_AUDIT.md) - Reachability & Status

## 🔒 Sicherheit & Datenschutz

- **DSGVO-konform**: Alle Daten bleiben lokal auf dem Gerät
- **Keine Tracking**: Keine Analytics, keine externen Requests
- **AES-256**: Hardware-beschleunigte Verschlüsselung
- **Master Password**: Nutzer kontrolliert Verschlüsselungskey
- **Audit Logs**: Compliance mit Art. 30, 32 DSGVO

## 📄 Lizenz

Proprietär - Alle Rechte vorbehalten

## 👨‍💻 Entwickler

- **DiggAiHH** - Initial work
