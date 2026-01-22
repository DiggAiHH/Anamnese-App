# Platform Testing Guide

This guide lists prerequisites and exact commands to run the app on each platform.
Use it to make each target "ready to test" with evidence logs.

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

Evidence:
- `buildLogs/windows-dev-run_latest.out.log`
- `buildLogs/windows-dev-run_latest.err.log`
- `buildLogs/windows-launch_latest.out.log`
- `buildLogs/windows-launch_latest.err.log`

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
