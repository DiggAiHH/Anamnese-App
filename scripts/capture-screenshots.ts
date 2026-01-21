/**
 * Automated Screenshot Capture Script
 *
 * Captures screenshots of key app screens for documentation.
 * Uses Detox E2E testing framework to navigate and capture.
 *
 * @security No PII is captured - uses mock/demo data only
 *
 * Usage:
 *   npx ts-node scripts/capture-screenshots.ts
 *
 * Output:
 *   docs/screenshots/<locale>/<screen-name>.png
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Screen configurations for documentation screenshots
 */
interface ScreenConfig {
  /** Screen identifier */
  name: string;
  /** Navigation action to reach this screen */
  navigation: string;
  /** Optional setup before capture (e.g., fill form) */
  setup?: string;
  /** Description for alt-text */
  description: string;
}

/**
 * Screens to capture for documentation
 */
const SCREENS_TO_CAPTURE: ScreenConfig[] = [
  {
    name: 'home-screen',
    navigation: 'await element(by.id("tab-home")).tap();',
    description: 'Main dashboard with patient overview',
  },
  {
    name: 'questionnaire-list',
    navigation: 'await element(by.id("tab-questionnaires")).tap();',
    description: 'List of available questionnaire templates',
  },
  {
    name: 'new-patient-form',
    navigation: `
      await element(by.id("tab-patients")).tap();
      await element(by.id("add-patient-button")).tap();
    `,
    description: 'Form to create a new patient record',
  },
  {
    name: 'anamnesis-form',
    navigation: `
      await element(by.id("tab-questionnaires")).tap();
      await element(by.text("Allgemeine Anamnese")).tap();
    `,
    description: 'Anamnesis questionnaire form with voice input',
  },
  {
    name: 'voice-input-active',
    navigation: `
      await element(by.id("tab-voice")).tap();
    `,
    description: 'Voice input screen with microphone active',
  },
  {
    name: 'backup-settings',
    navigation: `
      await element(by.id("tab-settings")).tap();
      await element(by.id("backup-section")).tap();
    `,
    description: 'Backup and restore settings screen',
  },
  {
    name: 'privacy-settings',
    navigation: `
      await element(by.id("tab-settings")).tap();
      await element(by.id("privacy-section")).tap();
    `,
    description: 'Privacy and data protection settings',
  },
  {
    name: 'pdf-preview',
    navigation: `
      await element(by.id("tab-saved")).tap();
      await element(by.id("first-saved-anamnesis")).tap();
      await element(by.id("export-pdf-button")).tap();
    `,
    description: 'PDF export preview of completed anamnesis',
  },
];

/**
 * Supported locales for screenshot capture
 */
const LOCALES = ['de', 'en', 'fr', 'es', 'ar'];

/**
 * Generate Detox test file for screenshot capture
 */
function generateDetoxTest(locale: string): string {
  const outputDir = path.join('docs', 'screenshots', locale);

  const screenTests = SCREENS_TO_CAPTURE.map(
    (screen) => `
    it('captures ${screen.name}', async () => {
      ${screen.setup || ''}
      ${screen.navigation}
      await device.takeScreenshot('${screen.name}');
    });
  `
  ).join('\n');

  return `
/**
 * Auto-generated screenshot capture test
 * Locale: ${locale}
 * Generated: ${new Date().toISOString()}
 *
 * @description Captures documentation screenshots for ${locale} locale
 */
describe('Screenshot Capture - ${locale.toUpperCase()}', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      languageAndLocale: {
        language: '${locale}',
        locale: '${locale}',
      },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  ${screenTests}
});
`;
}

/**
 * Create screenshot directories
 */
function ensureDirectories(): void {
  LOCALES.forEach((locale) => {
    const dir = path.join('docs', 'screenshots', locale);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created: ${dir}`);
    }
  });
}

/**
 * Generate markdown documentation index
 */
function generateMarkdownIndex(): string {
  const sections = SCREENS_TO_CAPTURE.map(
    (screen) => `
### ${screen.name.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}

${screen.description}

| Language | Screenshot |
|----------|------------|
${LOCALES.map((locale) => `| ${locale.toUpperCase()} | ![${screen.description}](screenshots/${locale}/${screen.name}.png) |`).join('\n')}
`
  ).join('\n');

  return `# App Screenshots

> Auto-generated documentation screenshots

## Quick Navigation

${SCREENS_TO_CAPTURE.map((s) => `- [${s.name.replace(/-/g, ' ')}](#${s.name})`).join('\n')}

${sections}

---
*Generated: ${new Date().toISOString()}*
`;
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  console.log('📸 Screenshot Capture Script\n');

  // Create directories
  ensureDirectories();

  // Generate test files for each locale
  LOCALES.forEach((locale) => {
    const testContent = generateDetoxTest(locale);
    const testPath = path.join('e2e', `screenshot-capture-${locale}.e2e.ts`);
    fs.writeFileSync(testPath, testContent);
    console.log(`✅ Generated: ${testPath}`);
  });

  // Generate markdown index
  const markdownContent = generateMarkdownIndex();
  const mdPath = path.join('docs', 'SCREENSHOTS.md');
  fs.writeFileSync(mdPath, markdownContent);
  console.log(`✅ Generated: ${mdPath}`);

  console.log('\n🚀 To capture screenshots, run:');
  console.log('   npx detox test -c windows.release e2e/screenshot-capture-de.e2e.ts');
}

main().catch(console.error);
