#!/usr/bin/env node
/**
 * GIT COMMIT STRATEGY — Atomic Commits
 * 
 * Run: node scripts/git-commit-strategy.cjs
 * 
 * This script stages and commits changes in logical atomic groups.
 * Review each commit before pushing.
 */
const { execSync } = require('child_process');
const root = 'c:/Users/tubbeTEC/Desktop/Projects/Anamnese-App/Anamnese-App';
const run = (cmd) => execSync(cmd, { cwd: root, encoding: 'utf-8', stdio: 'pipe' });

const commits = [
  {
    msg: 'fix(i18n): remove duplicate buttons/placeholders keys in en.json and de.json\n\nJSON duplicate top-level keys caused silent data loss (last-wins).\nButtons: next/back/save/cancel/export were lost at runtime.\nPlaceholders: 42 form field examples were lost at runtime.\n\nRoot cause: Copy-paste error creating duplicate sections at EOF.\nRef: RFC 8259 §4 — duplicate keys are implementation-defined.',
    files: [
      'src/presentation/i18n/locales/en.json',
      'src/presentation/i18n/locales/de.json',
    ],
  },
  {
    msg: 'fix(i18n): sync missing buttons/placeholders across all 17 locales\n\nAfter fixing the duplicate key bug in en.json, all other locales\n(except fr.json) were missing 5 buttons + 42 placeholders keys.\n\nAdded EN fallback values for all missing keys.\nTODO: Professional translations for non-EN locales.\n\nAffected: ar, el, es, fa, fr, it, ja, ko, nl, pl, pt, ro, ru, tr, uk, vi, zh',
    files: [
      'src/presentation/i18n/locales/ar.json',
      'src/presentation/i18n/locales/el.json',
      'src/presentation/i18n/locales/es.json',
      'src/presentation/i18n/locales/fa.json',
      'src/presentation/i18n/locales/fr.json',
      'src/presentation/i18n/locales/it.json',
      'src/presentation/i18n/locales/ja.json',
      'src/presentation/i18n/locales/ko.json',
      'src/presentation/i18n/locales/nl.json',
      'src/presentation/i18n/locales/pl.json',
      'src/presentation/i18n/locales/pt.json',
      'src/presentation/i18n/locales/ro.json',
      'src/presentation/i18n/locales/ru.json',
      'src/presentation/i18n/locales/tr.json',
      'src/presentation/i18n/locales/uk.json',
      'src/presentation/i18n/locales/vi.json',
      'src/presentation/i18n/locales/zh.json',
    ],
  },
  {
    msg: 'feat(security): add session timeout + brute-force protection\n\nBSI IT-Grundschutz / DSGVO compliance:\n- SessionTimeoutManager: configurable 15min-1hr inactivity timer\n- BruteForceGuard: 3 free attempts → exponential backoff → hard-lock@10\n- SessionGuard component: wraps navigation with timeout UI\n- useSessionTimeout hook: React integration\n\nIncludes full test suites for both modules.',
    files: [
      'src/shared/sessionTimeout.ts',
      'src/shared/bruteForceProtection.ts',
      'src/presentation/hooks/useSessionTimeout.ts',
      'src/presentation/components/SessionGuard.tsx',
      '__tests__/shared/sessionTimeout.test.ts',
      '__tests__/shared/bruteForceProtection.test.ts',
    ],
  },
  {
    msg: 'feat(a11y): add high-contrast theme tokens (BITV 2.0)\n\nAdds high-contrast color palette meeting WCAG AAA contrast ratios.\nExtends ThemeContext with \'high-contrast\' mode option.',
    files: [
      'src/presentation/theme/tokens.ts',
      '__tests__/presentation/theme/',
    ],
  },
  {
    msg: 'feat(security): integrate SessionGuard + brute-force into app\n\n- App.tsx: wrap navigation in SessionTimeoutGuard\n- MasterPasswordScreen: integrate BruteForceGuard\n- LogEvents: add session/auth event constants',
    files: [
      'src/presentation/App.tsx',
      'src/presentation/screens/MasterPasswordScreen.tsx',
      'src/shared/LogEvents.ts',
    ],
  },
  {
    msg: 'docs: add compliance documentation\n\nBSI IT-Grundschutz, DSGVO Art. 25/32, BITV 2.0 compliance docs.',
    files: [
      'docs/compliance/',
    ],
  },
  {
    msg: 'docs: add architecture handoff, API surface, test coverage report\n\nPhase 3 handoff documentation for zero-context onboarding.',
    files: [
      'docs/ARCHITECTURE_HANDOFF.md',
      'docs/API_SURFACE.md',
      'docs/TEST_COVERAGE_REPORT.md',
    ],
  },
  {
    msg: 'chore: add remaining modified files from prior sessions\n\nIncludes CI workflow updates, test fixes, navigation improvements,\nscreen updates, and shared utility enhancements.',
    files: [
      '.github/workflows/ci.yml',
      '__tests__/infrastructure/data/questionnaireTemplate.test.ts',
      '__tests__/integration/AnamneseFlow.test.tsx',
      '__tests__/integration/DeleteAllData.test.ts',
      '__tests__/shared/sessionPersistence.test.ts',
      '__tests__/ui/HomeScreen.render.test.tsx',
      '__tests__/application/services/DocumentRequestMailService.test.ts',
      '__tests__/application/use-cases/ExportGDTUseCase.test.ts',
      '__tests__/domain/entities/GDPRConsent.test.ts',
      '__tests__/domain/entities/Patient.test.ts',
      'android/app/src/main/java/com/helloworld/MainActivity.kt',
      'scripts/fix-i18n-voiceRecognition-nesting.cjs',
      'src/application/use-cases/ExportGDTUseCase.ts',
      'src/application/services/DocumentRequestMailService.ts',
      'src/application/use-cases/DeleteAllDataUseCase.ts',
      'src/domain/services/DocumentRequestMailService.ts',
      'src/domain/usecases/DeleteAllDataUseCase.ts',
      'src/presentation/navigation/RootNavigator.tsx',
      'src/presentation/screens/DocumentRequestScreen.tsx',
      'src/presentation/screens/FastTrackScreen.tsx',
      'src/presentation/screens/HomeScreen.tsx',
      'src/presentation/screens/PatientTypeScreen.tsx',
      'src/presentation/screens/PrescriptionRequestScreen.tsx',
      'src/presentation/screens/ReferralRequestScreen.tsx',
      'src/presentation/screens/SickNoteRequestScreen.tsx',
      'src/shared/sessionPersistence.ts',
    ],
  },
];

// DRY RUN — print what would be committed
console.log('=== GIT COMMIT STRATEGY (DRY RUN) ===\n');
for (let i = 0; i < commits.length; i++) {
  const c = commits[i];
  console.log(`--- Commit ${i + 1}/${commits.length} ---`);
  console.log(`Message: ${c.msg.split('\n')[0]}`);
  console.log(`Files: ${c.files.length}`);
  c.files.forEach(f => console.log(`  + ${f}`));
  console.log('');
}

console.log('=== TO EXECUTE ===');
console.log('Run with --execute flag to perform the commits:');
console.log('  node scripts/git-commit-strategy.cjs --execute');
console.log('');

if (process.argv.includes('--execute')) {
  console.log('EXECUTING COMMITS...\n');
  for (let i = 0; i < commits.length; i++) {
    const c = commits[i];
    console.log(`[${i + 1}/${commits.length}] ${c.msg.split('\n')[0]}`);
    try {
      for (const f of c.files) {
        run(`git add "${f}"`);
      }
      // Use a temp file for multi-line commit messages
      const fs = require('fs');
      const tmpMsg = root + '/tmp_commit_msg.txt';
      fs.writeFileSync(tmpMsg, c.msg);
      run(`git commit -F "${tmpMsg}"`);
      fs.unlinkSync(tmpMsg);
      console.log('  ✅ Committed\n');
    } catch (err) {
      console.log(`  ⚠️ ${err.message.trim().split('\n')[0]}\n`);
    }
  }
  console.log('DONE. Run: git push origin copilot/vscode-mkpsvs4r-walf');
}
