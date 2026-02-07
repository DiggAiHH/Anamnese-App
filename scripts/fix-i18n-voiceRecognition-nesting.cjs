/* eslint-disable @typescript-eslint/no-var-requires, @typescript-eslint/explicit-function-return-type */

/*
  Fixes an i18n regression where new top-level key groups were accidentally inserted
  under `gdpr.consents.voiceRecognition` in multiple locale JSON files.

  - Moves `patientType`, `documentRequest`, `prescription`, `referral`, `sickNote`
    from `gdpr.consents.voiceRecognition` to the locale root (if missing there).
  - Ensures those top-level groups exist (filled from `en.json` as canonical).
  - Removes the mistakenly nested keys to satisfy strict locale key parity tests.

  Usage:
    node scripts/fix-i18n-voiceRecognition-nesting.cjs

  Notes:
    - Writes files only if changes are needed.
    - Does NOT attempt to translate; it uses existing locale values when present,
      otherwise falls back to `en.json` placeholders.
*/

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'presentation', 'i18n', 'locales');

const KEYS_TO_MOVE = ['patientType', 'documentRequest', 'prescription', 'referral', 'sickNote'];

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function readJson(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  raw = raw.replace(/^\uFEFF/, '');
  raw = raw.split('\u0000').join('');
  return JSON.parse(raw);
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

function main() {
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const en = readJson(enPath);

  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json'))
    .sort();

  const summary = {
    localesTotal: localeFiles.length,
    filesChanged: 0,
    movedGroups: 0,
    filledMissingGroups: 0,
    removedNestedGroups: 0,
  };

  for (const fileName of localeFiles) {
    const localePath = path.join(LOCALES_DIR, fileName);
    const beforeRaw = fs
      .readFileSync(localePath, 'utf8')
      .replace(/^\uFEFF/, '')
      .split('\u0000')
      .join('');
    const locale = JSON.parse(beforeRaw);

    let changed = false;

    const voiceRecognition =
      locale &&
      isPlainObject(locale.gdpr) &&
      isPlainObject(locale.gdpr.consents) &&
      isPlainObject(locale.gdpr.consents.voiceRecognition)
        ? locale.gdpr.consents.voiceRecognition
        : null;

    if (voiceRecognition) {
      for (const key of KEYS_TO_MOVE) {
        if (key in voiceRecognition) {
          if (!(key in locale)) {
            locale[key] = voiceRecognition[key];
            summary.movedGroups += 1;
            changed = true;
          }
          delete voiceRecognition[key];
          summary.removedNestedGroups += 1;
          changed = true;
        }
      }
    }

    for (const key of KEYS_TO_MOVE) {
      if (!(key in locale)) {
        if (key in en) {
          locale[key] = en[key];
          summary.filledMissingGroups += 1;
          changed = true;
        } else {
          throw new Error(`Canonical en.json is missing required group: ${key}`);
        }
      }
    }

    if (changed) {
      const afterRaw = formatJson(locale);
      if (afterRaw !== beforeRaw) {
        fs.writeFileSync(localePath, afterRaw, 'utf8');
        summary.filesChanged += 1;
      }
    }
  }

  process.stdout.write(formatJson(summary));
}

main();
