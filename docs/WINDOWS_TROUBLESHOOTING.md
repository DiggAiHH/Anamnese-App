# Windows (React Native Windows) – Troubleshooting & Lessons Learned

Stand: 2026-01-03

Dieses Dokument sammelt **konkrete Fehlerbilder** (inkl. Codes), **wahrscheinliche Ursachen** und den **bewährten Fix** für dieses Repo.

## TL;DR (schnellster Weg, um die App zu starten)

1) Metro starten:

```powershell
npm.cmd start -- --reset-cache
```

2) Windows Build + Sign + Install + Launch (ohne VS-Deployer):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-run.ps1
```

> Hinweis: `react-native run-windows` kann beim **Deploy** scheitern (Exit Code 100), obwohl der Build + MSIX-Erzeugung ok ist. Das Script installiert dann trotzdem.

---

## Fehlerkatalog

### 0) Red Screen: "A connection with the server could not be established" (localhost:8081)

**Symptom**
- App ist rot und meldet, dass `http://localhost:8081/index.bundle?...` nicht erreichbar ist.

**Häufige Ursachen**
- Metro (Packager) läuft nicht.
- Die App ist **packaged** (MSIX) und darf ohne Loopback-Exemption nicht auf `localhost` zugreifen.

**Fix**
1) Metro starten (separates Terminal offen lassen):

```powershell
npm.cmd start -- --reset-cache
```

2) Loopback-Exemption setzen (für das installierte Paket):

```powershell
CheckNetIsolation LoopbackExempt -a -n=<PackageFamilyName>
```

Am einfachsten: `scripts/windows-dev-run.ps1` nutzen – das Script setzt die Loopback-Exemption automatisch (UAC/Admin kann nötig sein).

### 1) DeployRecipeFailure / exit error code 100

**Symptom**
- Build ist grün, aber am Ende: `× Deploying` → `exit error code 100`.

**Beobachteter Stacktrace (gekürzt)**
- `ReflectionTypeLoadException`
- LoaderException: `FileLoadException: NuGet.VisualStudio.Contracts, Version=17.14.2.0 ... HRESULT: 0x80131040`

**Wahrscheinliche Ursache**
- Der RNW-Deploy-Schritt nutzt Visual Studio Deployment Components (MEF), die von VS/NuGet-Assemblies abhängen.
- Wenn VS Build Tools / NuGet Komponenten **nicht exakt kompatibel** sind, knallt der Deploy-Schritt – unabhängig davon, dass das MSIX bereits gebaut wurde.

**Fix / Workaround (robust)**
- Deploy über RNW/VS-Deployer umgehen.
- MSIX manuell signieren + installieren (siehe Script [scripts/windows-dev-run.ps1](../scripts/windows-dev-run.ps1)).

---

### 2) Add-AppxPackage: 0x800B0100 – „keine Signatur vorhanden“

**Symptom**
- `Add-AppxPackage ...` → `0x800B0100` / „muss digital signiert sein“.

**Ursache**
- Das erzeugte MSIX ist (noch) nicht mit einem Code-Signing Zertifikat signiert.

**Fix**
- MSIX mit `signtool.exe` signieren.
- Danach Signatur prüfen: `Get-AuthenticodeSignature <msix>`.

Das Script macht das automatisch.

---

### 3) Add-AppxPackage: 0x800B0109 – „Stammzertifikat nicht vertrauenswürdig“

**Symptom**
- `Add-AppxPackage ...` → `0x800B0109` / „endete mit einem Stammzertifikat, das nicht als vertrauenswürdig gilt“.

**Ursache**
- Self-signed Dev-Zertifikat ist seine **eigene Root-CA**.
- Windows vertraut dem Zertifikat erst, wenn es im passenden Store liegt.
- In der Praxis prüft die AppX/MSIX Installation häufig gegen **LocalMachine** Trust Stores (AppX Deployment Service) – CurrentUser-Trust allein ist daher oft nicht ausreichend.

**Fix (robust / empfohlen)**
- Installiere über das von Visual Studio/RNW erzeugte Sideload-Skript `Add-AppDevPackage.ps1` (inkl. UAC/Elevation) und deaktiviere Telemetrie:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File windows\AppPackages\...\Add-AppDevPackage.ps1 -Force -SkipLoggingTelemetry
```

Warum: Das Skript kann (mit UAC) das Zertifikat in den **Machine Store** (typisch `LocalMachine\TrustedPeople`) importieren, was zuverlässig von der MSIX-Installation akzeptiert wird.

Wenn du Meldungen wie „Sie müssen Administratoranmeldeinformationen eingeben …“ siehst (oft Exit Code `9` / `ForceElevate`), ist das **erwartet**: Zertifikats-Installation in `LocalMachine` braucht Admin/UAC.

**Fix (manuell, wenn du es gezielt machen willst)**
1) In einer **als Administrator** gestarteten PowerShell:

```powershell
Import-Certificate -FilePath "<pfad-zur-cer>" -CertStoreLocation Cert:\LocalMachine\TrustedPeople
```

2) Danach erneut installieren:

```powershell
Add-AppxPackage -Path "<pfad-zur-msix>" -ForceUpdateFromAnyVersion
```

Hinweis: Nur wenn wirklich nötig (selten), zusätzlich `LocalMachine\Root` verwenden. Standard ist `TrustedPeople`.

---

### 4) Add-AppxPackage -Register: „AppxManifest.xml erforderlich“

**Symptom**
- `Add-AppxPackage -Register <msix>` → Fehler: Manifest muss `AppxManifest.xml` heißen.

**Ursache**
- `-Register` ist für *unpackaged apps* / ein direktes `AppxManifest.xml`, nicht für `.msix`.

**Fix**
- Für `.msix`: `Add-AppxPackage -Path <file.msix>`.

---

## Warum dieses Repo bei Windows empfindlich ist

- `react-native run-windows` baut zwar sauber, aber der **Deploy**-Teil hängt von VS/MEF/NuGet-Assemblies ab.
- Deshalb trennen wir „Build/Package“ und „Install/Launch“ sauber (Script), um das Setup deterministisch zu machen.

## Debugging (wenn es trotzdem klemmt)

- Letzte Appx Deployment Logs:

```powershell
Get-AppxLog -ActivityID <GUID>
```

- Installierte Pakete checken:

```powershell
Get-AppxPackage | Where-Object { $_.Name -eq 'cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0' }
```

- MSIX Pfad finden:

```powershell
Get-ChildItem windows\AppPackages -Recurse -Filter *.msix | Sort-Object LastWriteTime | Select-Object -Last 1
```
