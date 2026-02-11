# Prompt: Cross-Platform Build Orchestration

> Trigger: Pre-release or on-demand
> Scope: Build verification across all 6 target platforms

## Instruction

Agiere als Cross-Platform Build Engineer für die Anamnese-App.

### Pre-Flight
1. `git status` — Working Tree sauber?
2. `npm run type-check` — TypeScript clean?
3. `npm test -- --ci` — Tests grün?

→ Wenn Pre-Flight fehlschlägt: STOP. Fix zuerst.

### Build Matrix

| # | Platform | Command | Runtime | Evidence Path |
|---|----------|---------|---------|---------------|
| 1 | **Web**     | `npm run web:build` | WSL2 oder Windows | `buildLogs/web_build_*.log` |
| 2 | **Android** | `cd android && ./gradlew assembleDebug` | WSL2 | `buildLogs/android_build_*.log` |
| 3 | **Windows** | `scripts\smoke-test.ps1 -IncludeWindowsBuild` | Native PS | `buildLogs/windows_build_*.log` |
| 4 | **iOS**     | `xcodebuild -workspace ios/*.xcworkspace -scheme Anamnese -sdk iphonesimulator` | macOS only | `buildLogs/ios_build_*.log` |
| 5 | **macOS**   | `xcodebuild -workspace macos/*.xcworkspace -scheme Anamnese-macOS` | macOS only | `buildLogs/macos_build_*.log` |

### Execution Order (auf Windows/WSL2)

**Parallel-fähig**: Web + Android (unabhängig)
**Sequentiell**: Windows Build (MSBuild, native PS only)
**Deferred**: iOS/macOS (nur auf macOS-Host oder CI)

```bash
# Phase 1: Parallel (Web + Android)
npm run web:build 2>&1 | tee buildLogs/web_build_$(date +%Y%m%d_%H%M%S).log &
WEB_PID=$!

cd android && ./gradlew assembleDebug 2>&1 | tee ../buildLogs/android_build_$(date +%Y%m%d_%H%M%S).log &
ANDROID_PID=$!

wait $WEB_PID $ANDROID_PID

# Phase 2: Sequential (Windows — native PowerShell)
# Must be run in PowerShell, not WSL2:
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/msbuild-release-package.ps1
```

### Artifact Inventory
Nach allen Builds:
```bash
echo "=== Build Artifacts ===" > buildLogs/artifact_inventory_$(date +%Y%m%d).md
echo "Web:     $(ls -la web/dist/ 2>/dev/null || echo 'N/A')" >> buildLogs/artifact_inventory_$(date +%Y%m%d).md
echo "Android: $(ls -la android/app/build/outputs/apk/debug/*.apk 2>/dev/null || echo 'N/A')" >> buildLogs/artifact_inventory_$(date +%Y%m%d).md
echo "Windows: $(ls -la windows/*/AppPackages/ 2>/dev/null || echo 'N/A')" >> buildLogs/artifact_inventory_$(date +%Y%m%d).md
```

### Fehler-Handling per Platform
| Platform | Häufige Fehler | Lösung |
|----------|---------------|--------|
| Web      | Webpack module resolution | `tsconfig.paths` prüfen |
| Android  | Gradle TLS/PSK, SDK missing | JDK 17 sicherstellen, SDK Manager |
| Windows  | Boost headers, NuGet restore | `nuget restore` + MSBuild /t:Restore |
| iOS/macOS| Code Signing | `CODE_SIGN_IDENTITY=""` für CI |

### LAUFBAHN Entry
Nach Abschluss: LAUFBAHN.md Entry mit Build-Matrix-Ergebnis:
```
| Platform | Status | Evidence |
|----------|--------|----------|
| Web      | ✅/❌   | buildLogs/... |
```
