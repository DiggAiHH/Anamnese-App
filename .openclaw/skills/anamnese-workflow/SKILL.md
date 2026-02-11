# Anamnese-App Workflow Skill

> Custom OpenClaw skill for the Anamnese-App DevSecOps workflow.
> Provides project-specific command templates and automation routines.

## Commands

### `smoke-full`
Run full smoke test (type-check + jest + web-build + optional Windows build).
```bash
cd {{workspace}} && npm run smoke-test:full
```

### `type-check`
TypeScript compilation check (no emit).
```bash
cd {{workspace}} && npm run type-check 2>&1 | tee buildLogs/typecheck_$(date +%Y%m%d_%H%M%S).log
```

### `test-all`
Full Jest suite with CI mode and evidence capture.
```bash
cd {{workspace}} && npm test -- --ci 2>&1 | tee buildLogs/jest_$(date +%Y%m%d_%H%M%S).log
```

### `test-targeted`
Run specific test file or pattern.
```bash
cd {{workspace}} && npm test -- --ci --testPathPattern="{{pattern}}" 2>&1 | tee buildLogs/jest_targeted_$(date +%Y%m%d_%H%M%S).log
```

### `i18n-audit`
Audit all 19 locales for missing/extra keys.
```bash
cd {{workspace}} && node scripts/audit-i18n-keys.js 2>&1 | tee buildLogs/i18n_audit_$(date +%Y%m%d_%H%M%S).log
```

### `i18n-fix`
Auto-fix missing i18n keys across all locales.
```bash
cd {{workspace}} && npm run i18n:audit:fix 2>&1 | tee buildLogs/i18n_fix_$(date +%Y%m%d_%H%M%S).log
```

### `web-build`
Production web build via Webpack.
```bash
cd {{workspace}} && npm run web:build 2>&1 | tee buildLogs/web_build_$(date +%Y%m%d_%H%M%S).log
```

### `windows-build`
Windows MSBuild release (PowerShell, native Windows only).
```powershell
cd {{workspace}}; powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\smoke-test.ps1 -IncludeWindowsBuild 2>&1 | Tee-Object buildLogs\windows_build_$(Get-Date -Format 'yyyyMMdd_HHmmss').log
```

### `lint-fix`
ESLint auto-fix across entire codebase.
```bash
cd {{workspace}} && npm run lint:fix 2>&1 | tee buildLogs/lint_fix_$(date +%Y%m%d_%H%M%S).log
```

### `dep-audit`
npm security audit with JSON output.
```bash
cd {{workspace}} && npm audit --json > buildLogs/npm_audit_$(date +%Y%m%d_%H%M%S).json 2>&1
```

### `laufbahn-entry`
Template for LAUFBAHN.md session entry. Agent fills in details.
```markdown
## Session — {{title}}

**Date**: {{date}}
**Status**: ⏳ IN PROGRESS
**Agent**: openclaw

### Scope
- {{description}}

### Files Changed
- {{files}}

### Verification Evidence
- {{evidence_command}}: {{evidence_path}}

### Notes
- {{notes}}
```

## Behavior Rules

1. **LAUFBAHN-First**: Before any action, read `LAUFBAHN.md` and `CURRENT_TASKS.md`.
2. **Evidence Always**: Every build/test command MUST output to `buildLogs/`.
3. **No PII**: Never log patient data, emails, IPs, or credentials.
4. **Stop-and-Fix**: If a command fails, analyze root cause before retrying.
5. **DSGVO Compliance**: All file operations respect Art. 25 (Privacy by Design).

## Workspace Variables

| Variable      | Value                                                                 |
|---------------|-----------------------------------------------------------------------|
| `{{workspace}}`| `/mnt/c/Users/tubbeTEC/Desktop/Projects/Anamnese-App/Anamnese-App`   |
| `{{date}}`    | Auto-filled with current ISO date                                     |
| `{{title}}`   | Agent-determined based on task context                                |
