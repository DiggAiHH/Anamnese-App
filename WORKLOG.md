# WORKLOG

This file is the persistent, single-source-of-truth log for what was changed/tried in this repo (especially Windows build/launch).

## Constitution (rules we follow)
- Every plan/change is written here before/when executed.
- Every checklist item is marked ✅ only after it was actually verified.
- Every run produces logs under `buildLogs/` and we link to the newest log file name.

## Current Goal
Produce a **Release** MSIX that is **self-contained** (ships JS bundle) and **launches** reliably (visible window / stable process).

## Checklist (Windows Release MSIX)
- [ ] Release bundling works (creates bundle for packaging)
- [ ] Release MSIX is generated (AppPackages)
- [ ] MSIX installs successfully
- [ ] App launches and stays running
- [ ] Diagnostics confirm: no Debug deps; JS bundle present

## Next Planned Run (record results below)
- Command: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-run.ps1 -Configuration Release -Platform x64`
- Then: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\probe-appx-check.ps1`
- Then: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\diagnose-app-launch.ps1 -Aumid <PFN>!App -Minutes 20`
- Attach logs: newest `buildLogs/launch_diagnose_*.log`, `buildLogs/*release*`, `buildLogs/runwindows*.out.txt`

## Log Entries

### 2026-01-24 (RUN-20260124-full-verification)
- **Goal:** 30-point full verification run with evidence capture.
- **Results:**
  - Type-check: PASS
  - Tests: PASS (46 suites, 263 tests, 29 skipped)
  - Stop-and-Fix: `src/infrastructure/speech/__tests__/TTSService.test.ts` rewritten for mock mode testing
  - Windows: MSBuild 17.14.36811.4, Debug|x64, `anamnese-mobile_1.0.0.0_x64_Debug.msix` signed & installed
  - Web: Webpack 5.104.1 compiled successfully, localhost:3000 serving
- **Files Changed:**
  - `CURRENT_TASKS.md`: Full 30-point tasklist with completion status
  - `docs/PLATFORM_TESTING_GUIDE.md`: Verification status table added
  - `TODO.md`: 2026-01-24 run section added
  - `src/infrastructure/speech/__tests__/TTSService.test.ts`: Rewritten for mock mode
- **Evidence:**
  - `buildLogs/windows_cleanrun_20260124_*.log`
  - Package: cc3a5ac8-ac09-4f03-b6c9-0cfd812841a0, Version 1.0.0.0, Status Ok
- **Known Issues:**
  - VS Deployer fails with NuGet.VisualStudio.Contracts mismatch (workaround: manual Add-AppxPackage)
- **Deferred:** Android (adb/emulator missing), macOS/iOS (no host)

### 2026-01-17
	- UX/ISO plan created in `TODO.md` (phases, DoD, evidence).
	- Added design tokens in `src/presentation/theme/tokens.ts`.
	- Refactored `src/presentation/screens/HomeScreen.tsx` to use tokens for colors/spacing.
	- Added UI primitives: `AppText`, `AppButton`, `AppInput`, `Card`, `Section`, `EmptyState`.
	- Refactored `src/presentation/screens/PatientInfoScreen.tsx` to use tokens and AppInput/AppButton.
	- Refactored `src/presentation/screens/GDPRConsentScreen.tsx` to use tokens and Card/AppButton.
	- Added unit tests for UI helpers in `__tests__/presentation/components/`.

### 2026-01-09
	- Fixed “endless questionnaire loading” after GDPR consent by ensuring loading is cleared on missing prerequisites in `src/presentation/screens/QuestionnaireScreen.tsx`.
	- Fixed Windows birthdate dropdown overlap by removing absolute positioning from the dropdown menu in `src/presentation/screens/PatientInfoScreen.tsx`.
	- Fixed Windows crash on year dropdown by removing `keyboardShouldPersistTaps` from the nested dropdown `ScrollView` in `src/presentation/screens/PatientInfoScreen.tsx`.
	- Made password generator/copy icons visible on Windows by replacing vector-icons with emoji text in `src/presentation/screens/MasterPasswordScreen.tsx`.
	- Fixed Windows dev-run script crash: `scripts/windows-dev-run.ps1` now wraps `Get-Process` in `@(...)` so `.Count` is always valid.
	- Improved reliability: `scripts/windows-dev-run.ps1` now auto-starts Metro in the background when port 8081 is not reachable (writes `buildLogs/metro_latest.log`).
	- Fixed Windows launch script crash: `scripts/windows-launch.ps1` now wraps `Get-Process` in `@(...)` so `.Count` is always valid.
	- Verified Windows install+launch via `npm run windows:run:skipbuild:log` (process running).
	- Verified:
	  - TypeScript: `buildLogs/tsc_noEmit_ui_fixes_20260109.log`
	  - Jest: `buildLogs/npm_test_ui_fixes_20260109.log`

### 2026-01-05
	- Verified by log: `buildLogs/rewrite_rn_share_patch.out.log` shows the patch is now 878 bytes.
	- Added task `rewrite:react-native-share patch (script)` to run it deterministically with stdout/stderr capture.
 Replaced `patches/react-native-share+10.2.1.patch` with a minimal patch (~2KB) that only adds `/FS` and disables multiprocess compilation to prevent PDB contention and to make `patch-package` fast again.

	- Found Release packaging failure when building `.vcxproj` directly: RNW dependency projects require `SolutionPath/SolutionDir/SolutionFileName` (see `RequireSolution.targets`) and `react-native-share` also relied on `$(SolutionDir)`.
	- Fixed Release packaging invocation in `scripts/windows-dev-run.ps1` by passing `SolutionDir`, `SolutionPath`, `SolutionFileName` to MSBuild.
	- Observed a new RNW compiler warning (`C4874` assignment used as condition) promoted to error via `/WX` under a newer toolchain; mitigated by setting `TreatWarningAsError=false`/`TreatWarningsAsErrors=false` for the packaging build.
	- Adjusted MSBuild discovery to prefer VS2022 (17.x) paths first, to reduce toolchain regressions.
	- Added patch-package fix `patches/react-native-windows+0.73.22.patch` to silence warning `C4874` in RNW (`OriginPolicyHttpFilter.cpp`) which was being treated as an error due to `/WX`.

	- EOD checkpoint (Feierabend): Release MSIX pipeline still in-progress / not yet verified end-to-end.
	  - Current Release run log: `buildLogs/windows-dev-run_release_latest.out.log` (shows bundling OK, MSBuild 17.14 starts; log is very long).
	  - Script state: `scripts/windows-dev-run.ps1` now pins MSBuild to VS2022 17.x (no PATH fallback), and Release packaging is configured to build via `windows/anamnese-mobile.sln` with `/t:Rebuild;AppxPackage`, plus `/bl` binlog + file logger.
	  - Output validation: script now hard-fails if the expected `AppPackages` folder does not contain both `Add-AppDevPackage.ps1` and a `.msix`.
	  - Where the Release MSIX is expected to land: `windows/anamnese-mobile/AppPackages/anamnese-mobile_x64_Release_<timestamp>_Test/`.
	  - NOTE: The log currently shown still references building `anamnese-mobile.vcxproj` and using `windows/AppPackages/...` — likely from an older run before the `.sln` packaging change, or the run started before the latest script was picked up.

	Next session (do these in order):
	- Run: `powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\windows-dev-run.ps1 -Configuration Release -Platform x64`
	- Then inspect newest packaging artifacts:
	  - `buildLogs/msbuild_release_packaging_*.binlog`
	  - `buildLogs/msbuild_release_packaging_*.log`
	  - `windows/anamnese-mobile/AppPackages/anamnese-mobile_x64_Release_*_Test/` for `.msix` + `Add-AppDevPackage.ps1`
	- If MSIX exists: proceed with sign/install/launch via the script and, if “no window”, run `scripts/diagnose-app-launch.ps1`.
