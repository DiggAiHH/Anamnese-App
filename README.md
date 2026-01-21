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

# Hinweis: In diesem Workspace-Snapshot sind die nativen Projektordner (z.B. android/ios/) aktuell nicht enthalten.
# Für Builds auf Android/iOS müssen diese Ordner im Projekt vorhanden sein.

# Android Build (wenn android/ vorhanden)
npm run android

# iOS Build (wenn ios/ vorhanden)
npm run ios

# Windows Build (wenn windows/ vorhanden)
npm run windows
```

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
