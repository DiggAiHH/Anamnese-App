# Copy Toolkit — wiederverwendbare Bausteine aus der Anamnese‑App

Ziel dieses Dokuments: Du kannst die **fertigen, stabilen Bausteine** aus diesem Repo in andere Projekte übernehmen – ohne Rätselraten.

Dieses Dokument ist bewusst **einfach** geschrieben: auch ohne IT‑Background soll klar sein, *was* ein Baustein macht, *wo* er liegt und *wie* man ihn nutzt.

---

## 0) Kurz erklärt: Was ist „kopierbar“?

- **Sehr gut kopierbar** sind Dinge, die nur TypeScript‑Logik sind (keine Android/iOS Spezialteile):
  - Domain‑Modelle (Patient, Fragebogen, Antwort)
  - Use Cases (Arbeitsabläufe wie „Antwort speichern“)
  - Validierungs- und Conditional‑Logic
  - Repository‑Interfaces (Verträge)
- **Eingeschränkt kopierbar** sind Dinge, die an React Native oder native Module gebunden sind:
  - SQLite über `react-native-sqlite-storage`
  - Verschlüsselung über `react-native-quick-crypto`
  - Datei‑Zugriff über `react-native-fs`

---

## 1) Inhaltsverzeichnis (Copy‑fähige Module)

### A) Domain (Fachlogik, unabhängig von UI)
**Ordner:** `src/domain/`

1) Entities (Daten + Regeln)
- `src/domain/entities/Patient.ts`
- `src/domain/entities/Questionnaire.ts`
  - Conditional Logic: Fragen ein-/ausblenden basierend auf Antworten
  - Progress‑Berechnung
- `src/domain/entities/Answer.ts`
  - Validierung passend zum Fragetyp
  - Audit‑Log für Compliance
- `src/domain/entities/GDPRConsent.ts`
- `src/domain/entities/Document.ts`

2) Value Objects (kleine, stabile Datentypen)
- `src/domain/value-objects/EncryptedData.ts`
- `src/domain/value-objects/GDTExport.ts`

3) Repository Interfaces ("So muss Speicher/Verschlüsselung aussehen")
- `src/domain/repositories/*.ts`

**Warum kopieren?**
- Domain ist der Kern: Wenn du UI/DB später austauschst, bleibt die Logik gleich.

---

### B) Application (Use Cases = Arbeitsabläufe)
**Ordner:** `src/application/use-cases/`

- `SaveAnswerUseCase.ts`
  - Validiert → verschlüsselt → speichert
- `LoadQuestionnaireUseCase.ts`
  - Prüft Patient → lädt Template → (optional) lädt Antworten
- `CreatePatientUseCase.ts`
- `ExportGDTUseCase.ts`
  - Prüft DSGVO‑Einwilligung → baut GDT → schreibt Datei

**Warum kopieren?**
- Use Cases sind „fertige Prozesse“. Du kannst sie in einem neuen Projekt wiederverwenden und nur Repositories austauschen.

---

### C) Infrastructure (wenn du *genau* RN + SQLite + Crypto willst)
**Ordner:** `src/infrastructure/`

- DB:
  - `src/infrastructure/persistence/DatabaseConnection.ts`
  - `src/infrastructure/persistence/SQLite*Repository.ts`
- Encryption:
  - `src/infrastructure/encryption/NativeEncryptionService.ts`
- Questionnaire‑Template (Fragenkatalog):
  - `src/infrastructure/data/questionnaire-template.json`

**Achtung (wichtig):**
- Diese Teile funktionieren nur, wenn dein Zielprojekt auch React Native + passende native Module nutzt.

---

## 2) Copy‑Anleitung (Schritt für Schritt)

### Option 1 (empfohlen): Nur Domain + Use Cases (maximal portabel)
1) Kopiere Ordner:
- `src/domain/`
- `src/application/use-cases/`

2) Im Zielprojekt implementierst du nur die „Adapter“ neu:
- `IAnswerRepository`, `IPatientRepository`, `IQuestionnaireRepository`, `IEncryptionService`, ...

3) Vorteil:
- Du kannst später z.B. statt SQLite auch Realm, WatermelonDB oder ein Server‑Backend nutzen.

---

### Option 2: Domain + Use Cases + RN‑SQLite + RN‑Crypto (schnellster Start)
1) Kopiere zusätzlich:
- `src/infrastructure/persistence/`
- `src/infrastructure/encryption/`
- `src/infrastructure/data/`

2) Installiere im Zielprojekt die Dependencies (Beispiele):
- `react-native-sqlite-storage`
- `react-native-quick-crypto`
- `react-native-fs`

3) Vorteil:
- Du bekommst sehr schnell ein offline‑first, verschlüsseltes Setup.

---

## 3) „Wie benutze ich das?“ (Mini‑Beispiel)

### Beispiel: Antwort speichern (Use Case)
1) UI sammelt eine Antwort.
2) UI ruft `SaveAnswerUseCase.execute(...)`.
3) Use Case übernimmt den Rest: prüfen, verschlüsseln, speichern.

**Wichtig:**
- Der Use Case braucht zwei Dinge:
  - ein Repository ("Wo speichern wir?")
  - einen Encryption‑Service ("Wie verschlüsseln wir?")

---

## 4) Reifegrad / was ist wirklich „fertig“?

### Stabil/fertig (copy‑ready)
- Domain Entities + Validierung + Conditional Logic
- Save/Load Use Cases (als Logik)
- SQLite Schema/Repositories (wenn RN native Module vorhanden)
- Encryption Service (wenn RN native Module vorhanden)

### Teilweise vorhanden, aber im UI nicht komplett verdrahtet
- Mehrsprachigkeit: derzeit nur `de`/`en` im Repo sichtbar
- Screens existieren, aber Navigation ist aktuell nur für `Home` eingebunden
- OCR/Speech Services existieren, aber kein kompletter UI‑Flow im Workspace

---

## 5) „Perfektes Level“ — Roadmap (realistisch & messbar)

> Wichtig: Diese Punkte sind **Arbeit** (Features/Integration). Ich liste sie hier als klare To‑Dos, damit nichts verloren geht.

### P0 (damit es als echte Android App läuft)
- Native RN Struktur im Repo: `android/` muss existieren.
- Android Toolchain: JDK 17–20, Android Studio, SDK, `ANDROID_HOME`.

### P1 (damit der User‑Flow in der App wirklich klickbar ist)
- Navigation verdrahten: Home → PatientInfo → Questionnaire → Summary/Export.
- Master‑Password / Key‑Flow anschließen: `encryptionKey` muss gesetzt werden, sonst kann Questionnaire nicht laden.
- GDPR Consent Screen implementieren/verdrahten (ohne Consent keine Exporte).

### P2 (damit die „Features“ aus README wirklich sichtbar werden)
- Mehrsprachigkeit: die restlichen Sprachdateien hinzufügen oder Feature‑Liste ehrlich einschränken.
- Export Screen/Share Flow in UI, der `ExportGDTUseCase` nutzt.
- OCR/Speech UI‑Flow (optional, emulator‑abhängig).

---

## 6) Checkliste: Was muss das Zielprojekt mitbringen?

- TypeScript + zod
- Wenn du Infrastructure kopierst:
  - React Native
  - SQLite native module
  - Crypto native module
  - FileSystem access

---

## 7) Quick Links (wo was liegt)

- Domain: `src/domain/`
- Use Cases: `src/application/use-cases/`
- SQLite: `src/infrastructure/persistence/`
- Encryption: `src/infrastructure/encryption/`
- Questionnaire Template: `src/infrastructure/data/questionnaire-template.json`
