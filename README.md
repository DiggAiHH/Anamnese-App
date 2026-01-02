# Anamnese Mobile App

DSGVO-konforme medizinische Anamnese App für Android, iOS und Windows.

## 🎯 Features

- ✅ **19 Sprachen** (DE, EN, FR, ES, IT, TR, PL, RU, AR, ZH, PT, NL, UK, FA, UR, SQ, RO, HI, JA)
- ✅ **AES-256 Verschlüsselung** (native Crypto APIs)
- ✅ **Offline-First** (keine externen Requests, DSGVO-konform)
- ✅ **Lokales OCR** (Tesseract.js für Dokumenten-Scan)
- ✅ **Spracherkennung** (Vosk für offline Speech-to-Text)
- ✅ **GDT Export/Import** (Integration mit Praxissystemen)
- ✅ **Conditional Logic** (dynamische Fragen basierend auf Antworten)
- ✅ **WCAG 2.1 AA** (Barrierefreiheit)
- ✅ **Clean Architecture** (Domain-Driven Design)

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

# iOS Pods installieren
cd ios && pod install && cd ..

# Android Build
npm run android

# iOS Build
npm run ios

# Windows Build
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
- [API Reference](docs/04_API.md) - Use Cases & Repositories
- [Testing](docs/05_TESTING.md) - Test Strategy
- [Elements List](docs/01_ELEMENTS_LIST.md) - Alle UI Elemente
- [Questions List](docs/02_QUESTIONS_LIST.md) - Kompletter Fragebogen

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
