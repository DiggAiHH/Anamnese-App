# Windows: Deploy & Test (Fool-Proof)

> **Goal:** One command that leaves you with:
> 1) Type-check ✅
> 2) Jest ✅ (evidence logs in `buildLogs/`)
> 3) Windows app installed + launched ✅
> 4) Metro running ✅

---

## 0) Prerequisites (one-time)

- Node.js >= 18
- Visual Studio with RNW build tools (C++ + UWP/Windows SDK)

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Visual Studio Installer with required workloads selected]**

---

## 1) Start Metro (Terminal #1)

Run this in the repo root:

`npm.cmd start`

### Metro testing links

- Metro status: http://127.0.0.1:8081/status
- Metro debugger UI: http://127.0.0.1:8081/debugger-ui

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Terminal running Metro and the “Metro waiting on…” message]**

---

## 2) Deploy + Launch + Verify (Terminal #2)

### Recommended (tests + build + deploy + launch)

`npm.cmd run windows:ready`

### Fast rerun (skip rebuild)

`npm.cmd run windows:ready:skipbuild`

> Note: SkipBuild needs existing `windows/**/AppPackages` output. If it’s missing, the script auto-falls back to a full build once.

### Troubleshooting (skip rebuild + skip tests)

`npm.cmd run windows:ready:skipbuild:skiptests`

### If you only want deploy/launch (skip tests)

`npm.cmd run windows:ready:skiptests`

### If Metro is already handled elsewhere (skip Metro check)

`npm.cmd run windows:ready:skipmetro`

Evidence logs (created/updated automatically):
- `buildLogs/typecheck_ready_latest.out.log`
- `buildLogs/typecheck_ready_latest.err.log`
- `buildLogs/npm_test_ready_latest.out.log`
- `buildLogs/npm_test_ready_latest.err.log`
- `buildLogs/metro_ready_latest.log`
- `buildLogs/windows-dev-run_latest.out.log`
- `buildLogs/windows-dev-run_latest.err.log`
- `buildLogs/windows-dev-run_skipbuild_latest.out.log`
- `buildLogs/windows-dev-run_skipbuild_latest.err.log`
- `buildLogs/windows-launch_latest.out.log`
- `buildLogs/windows-launch_latest.err.log`

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: File Explorer open at buildLogs/ with the latest log files]**

---

## 3) What to open for “testing”

- **App UI:** should open automatically after `windows:ready`.
  - If it doesn’t: open Windows Start Menu → search for the app.
  - Alternate: run `npm.cmd run windows:launch:log`.

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: Windows Start Menu search for the app name]**

- **Metro status:** http://127.0.0.1:8081/status
- **Debugger UI:** http://127.0.0.1:8081/debugger-ui

---

## 4) Common Windows blockers

### “Red screen / cannot load bundle”

- Metro not running → start Metro (Step 1)
- Loopback exempt missing → run:

`powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\set-loopback-exempt.ps1`

> **[TODO: INSERT SCREENSHOT HERE - SHOWING: PowerShell output of loopback exemption command]**

---

## Backend?

This app is offline-first and does not ship with a backend service in this repo.
If you have a separate backend repo/URL, share it and I’ll wire/run it end-to-end.