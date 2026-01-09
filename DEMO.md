# Anamnese-App — Demo & Runbook (VS Code / Windows / Android Emulator)

Stand: 2026-01-02

> Wichtige Windows-Note: In PowerShell ist `npm.ps1` durch Execution Policy blockiert. Verwende deshalb in dieser Repo **immer** `npm.cmd` / `npx.cmd` (oder setze ExecutionPolicy, siehe Troubleshooting).

## 1) Setup-Status (A–D)

### A) Umgebung & Emulator
- **A1 Repo/Node/npm:** 🟡
  - Repo-Root ok (`name: anamnese-mobile`, Scripts vorhanden)
  - **Node:** `v24.12.0` (für RN 0.73.x typischerweise nicht die „safe default“ LTS — Empfehlung: Node 20 LTS)
  - **npm:** `11.7.0`
  - PowerShell-Policy blockiert `npm` → Workaround: `npm.cmd`/`npx.cmd`
- **A2 Android Toolchain:** 🔴
  - `adb`, `emulator`, `java` nicht gefunden (PATH/Installation fehlt)
  - `npx.cmd react-native doctor` meldet u.a. fehlend: **JDK**, **Android Studio**, **ANDROID_HOME**, **Android SDK**
- **Zusatz-Blocker (kritisch):** 🔴
  - Im Workspace fehlt ein `android/` Verzeichnis → `react-native run-android` kann aktuell **nicht** bauen.

### B) Install & Quality Gates
- **Install:** 🟢 (via `npm.cmd ci --legacy-peer-deps`)
- **Type-Check:** 🟢 (`npm.cmd run type-check`)
- **Lint:** 🟡 (läuft durch; Warnung: TypeScript-Version nicht offiziell supported von `@typescript-eslint/*`)
- **Tests:** 🟢 (`npm.cmd test -- --runInBand`)

### C) Start-Flow Android (robust)
- **C Metro:** 🟢 (kann gestartet werden)
- **C Android Run:** 🔴 (blockiert durch fehlende Android Toolchain + fehlendes `android/` Verzeichnis)

### D) VS Code „One-Click“
- **Tasks:** 🟡
  - Ich lege keine Dateien außer dieser `DEMO.md` an.
  - Du bekommst unten ein copy/paste Snippet für `.vscode/tasks.json`.

---

## 2) Copy-Paste Commands (in Reihenfolge)

> Alle Commands im VS Code Terminal ausführen. Unter Windows/PowerShell bitte `npm.cmd`/`npx.cmd` nutzen.

### Repo-Check
```powershell
cd "c:\Users\tubbeTEC\Desktop\Projects\Anamnese-App\Anamnese-App"

git status -sb
node -v
npm.cmd -v
npm.cmd pkg get name version scripts
```

### Android-Toolchain Check (sollte nach Installation grün werden)
```powershell
adb version
emulator -version
java -version
npx.cmd react-native doctor
adb devices
```

### Install
```powershell
npm.cmd ci --legacy-peer-deps
```

### Quality Gates
```powershell
npm.cmd run type-check
npm.cmd run lint
npm.cmd test -- --runInBand
```

### Metro (Demo-Flow)
```powershell
npm.cmd start -- --reset-cache
```

### Android Emulator (wenn Toolchain + android/ vorhanden)
```powershell
adb devices
adb reverse tcp:8081 tcp:8081
npm.cmd run android
```

### Gradle Clean (Windows) (wenn `android/` vorhanden)
```powershell
cd android
.\gradlew.bat clean
cd ..

npm.cmd run android
```

---

## 3) 3‑Minuten Demo Runbook (Klickfolge + Sprechtext)

> Hinweis: Im aktuellen Workspace ist die Navigation nur auf den Home-Screen verdrahtet (RootNavigator hat nur `Home`). Außerdem fehlt `android/`, daher ist die Emulator-Demo **erst möglich**, wenn die Android Toolchain + Native-Projektstruktur vorhanden sind.

Wenn die App läuft (minimaler UI-Stand):
- **Aktion (UI):** App öffnen → Home Screen „Willkommen zur Anamnese-App“
  - **Was sage ich:** „Offline-first Anamnese-App, Fokus DSGVO: lokal, verschlüsselt, keine Server.“
- **Aktion (UI):** Kurz die „Datenschutz“-Karte zeigen
  - **Was sage ich:** „Daten bleiben lokal, AES-256 Verschlüsselung, keine externen Backends.“
- **Aktion (UI):** „Features“-Liste zeigen
  - **Was sage ich:** „Mehrsprachigkeit, OCR/Spracherkennung optional, GDT Export als Praxis-Schnittstelle.“
- **Aktion (VS Code, 20s):** Datei öffnen: `src/presentation/screens/QuestionnaireScreen.tsx` → Kommentarblock „VOLLSTÄNDIGER DATENFLUSS“
  - **Was sage ich:** „Das ist der Datenfluss: UI → Store → Use Case → encrypt → SQLite, danach Conditional Logic → UI Update.“
- **Aktion (VS Code, 20s):** Test laufen lassen: `npm.cmd test -- __tests__/domain/entities/Questionnaire.test.ts`
  - **Was sage ich:** „Conditional Logic ist als Domain-Regel testbar — dadurch zuverlässig offline und reproduzierbar.“

---

## 4) 10‑Minuten Demo Runbook (Klickfolge + Sprechtext)

### Part 1: Was ist es (1 min)
- **Aktion (UI):** Home Screen
  - **Was sage ich:** „Medizinische Anamnese, offline-first, DSGVO: lokale Speicherung, Verschlüsselung, exportierbare Formate.“

### Part 2: Architektur (3–4 min)
- **Aktion (VS Code):** Ordnerstruktur zeigen
  - **Was sage ich:**
    - „`src/domain`: Entities/Value Objects – Regeln & Validierung“
    - „`src/application`: Use Cases – Orchestrierung der Business-Flows“
    - „`src/infrastructure`: SQLite/Encryption/OCR/Speech – Implementierungen“
    - „`src/presentation`: RN Screens/Components + Zustand Store“
- **Aktion (VS Code):** `src/presentation/screens/QuestionnaireScreen.tsx` öffnen
  - **Was sage ich:** „Hier sieht man DI (Repositories + EncryptionService) und den Flow: Load → Answer → Save → Conditional Logic.“

### Part 3: Datenfluss (2–3 min)
- **Aktion (VS Code):** `src/application/use-cases/SaveAnswerUseCase.ts` öffnen
  - **Was sage ich:** „Antwort wird validiert, verschlüsselt und via Repository in SQLite abgelegt.“
- **Aktion (VS Code):** `src/infrastructure/encryption/NativeEncryptionService.ts` öffnen
  - **Was sage ich:** „Verschlüsselung ist gekapselt; Schlüssel bleibt session-basiert.“

### Part 4: Optional Features (nur wenn realistisch im Emulator) (1–2 min)
- **Aktion:** Nur erwähnen, nicht erzwingen
  - **Was sage ich:** „OCR/Spracherkennung sind als Services integriert, aber Emulator-Support hängt von Permissions/Native Modules ab.“

### Part 5: Abschluss (30s)
- **Aktion:** Wrap-up
  - **Was sage ich:** „Ziel: sichere, lokale Datenerfassung + exportierbarer Praxis-Workflow; Architektur erleichtert Testbarkeit & Compliance.“

---

## 5) Troubleshooting (max 10)

- **PowerShell blockiert `npm`:** nutze `npm.cmd`/`npx.cmd` oder setze einmalig:
  - `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`
- **React Native Doctor rot (Android):** Android Studio installieren, SDK/Platform Tools installieren, `ANDROID_HOME` setzen, PATH ergänzen.
- **Kein Emulator CLI (`emulator` fehlt):** Android Studio → *Device Manager* → AVD erstellen/starten.
- **`adb` fehlt:** Android SDK Platform-Tools installieren und in PATH aufnehmen (oder Android Studio “SDK Manager”).
- **`java` fehlt / falsche Version:** JDK 17–20 installieren (React Native doctor erwartet >=17 <=20).
- **Metro Port belegt:** `npx.cmd react-native start --reset-cache` und ggf. Port 8081 freimachen.
- **Device nicht sichtbar:** `adb devices` → Emulator starten / USB Debugging aktivieren.
- **App findet Metro nicht:** `adb reverse tcp:8081 tcp:8081` (für Emulator/Device).
- **Gradle klemmt:** `cd android; .\gradlew.bat clean; cd ..` und erneut `npm.cmd run android`.
- **Native Struktur fehlt (`android/`):** Ohne `android/` ist `run-android` nicht möglich — Repo muss die nativen Ordner enthalten (oder als RN-Projekt neu generiert/rekonstruiert werden).

---

## Optional: VS Code Tasks (Snippet)

> Wenn du „One-Click“ willst: lege manuell `.vscode/tasks.json` an und füge folgendes ein.

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "npm: type-check",
      "type": "shell",
      "command": "npm.cmd",
      "args": ["run", "type-check"],
      "problemMatcher": []
    },
    {
      "label": "npm: lint",
      "type": "shell",
      "command": "npm.cmd",
      "args": ["run", "lint"],
      "problemMatcher": []
    },
    {
      "label": "npm: test",
      "type": "shell",
      "command": "npm.cmd",
      "args": ["test", "--", "--runInBand"],
      "problemMatcher": []
    },
    {
      "label": "metro: start (reset-cache)",
      "type": "shell",
      "command": "npm.cmd",
      "args": ["start", "--", "--reset-cache"],
      "isBackground": true,
      "problemMatcher": []
    },
    {
      "label": "android: run",
      "type": "shell",
      "command": "npm.cmd",
      "args": ["run", "android"],
      "problemMatcher": []
    }
  ]
}
```

  ---

  ## 6) Zukunft: Engineering-Ablauf (Prozesse, die Zeit sparen)

  Ziel: weniger „Setup-Drift“, reproduzierbare Builds, schnelle Demos, klare Quality Gates.

  ### 6.1 Einmalige Basis-Entscheidungen (Team-Standards)
  - **Node-Version standardisieren:** Für RN `0.73.x` ist **Node 20 LTS** die sichere Default-Wahl. Node 24 kann funktionieren, ist aber häufiger „edge“.
  - **Windows-Terminal standardisieren:** VS Code Terminal-Profil bevorzugt **Command Prompt** oder **PowerShell mit RemoteSigned**, damit `npm` konsistent läuft.
  - **Android Toolchain als „Definition of Done“:** JDK (17–20), Android Studio + SDK, `ANDROID_HOME`, `platform-tools` im PATH.
  - **Native Ordner als Must-Have:** `android/` (und i.d.R. `ios/`) müssen im Repo vorhanden sein, sonst kann `run-android` nicht funktionieren.

  ### 6.2 Täglicher Dev-Workflow (lokal)
  1) **Fresh start (bei Problemen):**
    - `npm.cmd ci --legacy-peer-deps`
  2) **Gates vor Push:**
    - `npm.cmd run type-check`
    - `npm.cmd run lint`
    - `npm.cmd test -- --runInBand`
  3) **Run:**
    - Metro: `npm.cmd start -- --reset-cache`
    - Android (wenn Toolchain + `android/` ok): `npm.cmd run android`

  ### 6.3 „Demo-Preflight“ (10 Minuten vor Live-Demo)
  - **Emulator/Device ready:** `adb devices` zeigt genau 1 Zielgerät.
  - **Metro clean:** `npm.cmd start -- --reset-cache` läuft; keine Port-Konflikte.
  - **Bridge ok:** `adb reverse tcp:8081 tcp:8081` (bei Emulator/USB-Device).
  - **App clean state:** App einmal schließen/neu öffnen; optional App-Daten im Emulator löschen.
  - **Fast confidence:** `npm.cmd test -- --runInBand --silent` (oder mind. Smoke-Test-Suite).

  ### 6.4 PR/Review-Checkliste (kein Feature-Goldplating)
  - **Scope:** nur das Ticket-Ziel, keine Refactors ohne Grund.
  - **Gates:** type-check/lint/tests grün.
  - **Runtime Smoke:** App startet (mind. Home Screen) und Metro verbindet.
  - **No hidden breaks:** Keine Änderungen, die Android Build/Gradle/Pods betreffen ohne klare Notiz.

  ### 6.5 CI/CD (Empfehlung, ohne hier neue Files anzulegen)
  - CI-Job sollte exakt diese Sequenz fahren:
    - `npm ci --legacy-peer-deps`
    - `npm run type-check`
    - `npm run lint`
    - `npm test -- --runInBand`
  - Optionaler Android-Job (wenn `android/` vorhanden): Gradle assembleDebug.

  ### 6.6 Stabilität/Performance (Low-effort, high-impact)
  - **Lockfile-Disziplin:** `package-lock.json` ist Single Source of Truth; Änderungen daran immer mit Gates.
  - **TypeScript/ESLint Versionsdrift vermeiden:** Wenn ESLint warnt (TS zu neu), TS-Version bewusst pinnen (oder ESLint-Stack upgraden) – nicht „ignorieren“, sondern entscheiden.
  - **Daten/JSON-Assets validieren:** JSON-Dateien müssen valides JSON sein (keine Block-Kommentare), sonst crashen `require()`-Ladevorgänge zur Laufzeit.

