/**
 * Patches all locale JSON files so every locale has the same key set as de.json.
 * Missing keys are filled with the en.json value (English fallback).
 */
const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.resolve(__dirname, '..', 'src', 'presentation', 'i18n', 'locales');

// Flatten nested JSON into dot-separated keys
function flatten(obj, prefix = '') {
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, fullKey));
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

// Set a nested key in an object
function setNested(obj, dotKey, value) {
  const parts = dotKey.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// Read canonical (de) and fallback (en) files
const deJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'de.json'), 'utf8'));
const enJson = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

const canonicalKeys = flatten(deJson);
const enKeys = flatten(enJson);

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && f !== 'de.json' && f !== 'en.json');

let totalPatched = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  const localeJson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const localeKeys = flatten(localeJson);

  const missing = Object.keys(canonicalKeys).filter(k => !(k in localeKeys));
  if (missing.length === 0) {
    console.log(`✓ ${file}: already complete`);
    continue;
  }

  for (const key of missing) {
    const fallbackValue = enKeys[key] || canonicalKeys[key];
    setNested(localeJson, key, fallbackValue);
  }

  fs.writeFileSync(filePath, JSON.stringify(localeJson, null, 2) + '\n', 'utf8');
  console.log(`✓ ${file}: added ${missing.length} keys`);
  totalPatched += missing.length;
}

console.log(`\nDone. Patched ${totalPatched} keys across ${files.length} files.`);
