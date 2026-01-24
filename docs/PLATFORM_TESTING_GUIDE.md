# Platform Testing Guide

This guide lists prerequisites and exact commands to run the app on each platform.
Use it to make each target "ready to test" with evidence logs.

---

## Verification Status (Last Run: RUN-20260124-full-verification)

| Platform | Status | Notes |
|----------|--------|-------|
| Web | ✅ VERIFIED | Webpack compiled (see `buildLogs/web_spotcheck.out.log`) |
| Windows | ✅ VERIFIED | MSBuild 17.14, .msix signed & installed (see `buildLogs/windows_cleanrun_20260124_220250.log`) |
| Android | ⏸️ DEFERRED | adb/emulator not installed on host |
| iOS | ⏸️ DEFERRED | Requires macOS host |
| macOS | ⏸️ DEFERRED | Requires macOS host |

---

## Web

Prereqs:
- Node.js + npm installed

Commands:
```powershell
npm run web
```

Evidence:
- `buildLogs/web_latest.out.log`
- `buildLogs/web_latest.err.log`

## Windows

Prereqs:
- Visual Studio Build Tools 2022 with C++ workload
- Windows 10/11 SDK installed

Commands:
```powershell
npm run windows:run:log
npm run windows:launch:log
```

Alternative (clean build with auto-install):
```powershell
.\scripts\windows-cleanrun.ps1
```

Evidence:
- `buildLogs/windows_cleanrun_20260124_220250.log`

Known Issues:
- VS Deployer may fail with `NuGet.VisualStudio.Contracts` mismatch
- Workaround: windows-cleanrun.ps1 falls back to manual Add-AppxPackage

## Android

Prereqs:
- Android Studio + SDK installed
- `adb` and `emulator` on PATH
- At least one AVD configured
- Network access to Maven Central

Commands:
```powershell
npm run android
```

Evidence:
- `buildLogs/android_run_latest.out.log`
- `buildLogs/android_run_latest.err.log`

Notes:
- If `adb` or `emulator` are missing, configure Android SDK and add:
  - `<ANDROID_SDK>\platform-tools` to PATH (adb)
  - `<ANDROID_SDK>\emulator` to PATH (emulator)

## iOS (macOS host required)

Prereqs:
- macOS host
- Xcode + Command Line Tools
- CocoaPods

Commands:
```bash
npm run ios
```

Evidence:
- Capture terminal logs into `buildLogs/ios_run_latest.out.log` and `buildLogs/ios_run_latest.err.log`

## macOS (macOS host required)

Prereqs:
- macOS host
- Xcode + Command Line Tools

Commands:
```bash
npm run macos
```

Evidence:
- Capture terminal logs into `buildLogs/macos_run_latest.out.log` and `buildLogs/macos_run_latest.err.log`
