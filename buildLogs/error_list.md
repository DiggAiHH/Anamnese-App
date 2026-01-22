# Error List (Markdown)

This file tracks build/test/runtime errors with evidence paths.

| Timestamp (UTC) | Area | Error | Status | Evidence Path |
| --- | --- | --- | --- | --- |
| 2026-01-21 | Tests (Jest) | `keyManager.test.ts` failed due to dynamic import + full react-native load in test mock. | Resolved | buildLogs/tests_key_session_resume.err.log |
| 2026-01-21 | Tests (Jest) | Jest run hung (open handles). | Resolved (forceExit + kill stray Jest processes) | buildLogs/tests_key_session_resume.err.log |
| 2026-01-21 | Tests (Jest) | Full suite failed: react-native-keychain ESM import + de.json syntax/locale key mismatch. | Resolved (jest keychain mock + de.json fix) | buildLogs/npm_test_full_latest.err.log |

## Notes
- Add one row per error.
- Link evidence logs from buildLogs/ when available.
