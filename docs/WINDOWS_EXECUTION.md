# Windows execution log (plan + worklog)

This file is the single source of truth for the **Windows MSIX “installs but won’t launch”** investigation.

## Goal
Produce a **Release** Windows package (MSIX) that:
- includes a real JS bundle (`index.windows.bundle`) inside the installed package
- does **not** depend on Debug framework packages
- launches and stays running without Metro

## Plan (checklist)
- [ ] 1) Generate Release JS bundle (staged under `tmp/` then copied into `windows/anamnese-mobile/Bundle/`)
- [ ] 2) Build a **Release** app package output directory (contains `Add-AppDevPackage.ps1` and a `.msix`)
- [ ] 3) Install + launch via deterministic PowerShell flow
- [ ] 4) Diagnose installed package:
  - [ ] bundle present under InstallLocation
  - [ ] no Debug dependencies in AppxManifest.xml
  - [ ] process persists / window appears

## Working agreements
- Every run writes logs into `buildLogs/` (no interactive-only output).
- If Release packaging output is missing, we **fail fast** (do not silently install Debug).

## Worklog

### 2026-01-05
- Context: Release builds were succeeding but `windows/AppPackages` contained only `*_x64_Debug_Test` output. This caused the install script to silently reinstall Debug even when invoked with `-Configuration Release`.
- Next action: enforce explicit Release packaging output generation and fail fast if missing.
