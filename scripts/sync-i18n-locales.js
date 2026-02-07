'use strict';

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'presentation', 'i18n', 'locales');
const BASE_LOCALE = 'de.json';

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function syncToBase(baseValue, localeValue) {
  if (isPlainObject(baseValue)) {
    const localeObj = isPlainObject(localeValue) ? localeValue : undefined;
    const out = {};
    for (const key of Object.keys(baseValue)) {
      out[key] = syncToBase(baseValue[key], localeObj ? localeObj[key] : undefined);
    }
    return out;
  }

  if (Array.isArray(baseValue)) {
    return Array.isArray(localeValue) ? localeValue : baseValue;
  }

  return localeValue !== undefined ? localeValue : baseValue;
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse JSON: ${filePath}. ${message}`);
  }
}

function writeJsonPretty(filePath, data) {
  const content = `${JSON.stringify(data, null, 2)}\n`;
  fs.writeFileSync(filePath, content, 'utf8');
}

function main() {
  if (!fs.existsSync(LOCALES_DIR)) {
    throw new Error(`Locales directory not found: ${LOCALES_DIR}`);
  }

  const basePath = path.join(LOCALES_DIR, BASE_LOCALE);
  if (!fs.existsSync(basePath)) {
    throw new Error(`Base locale not found: ${basePath}`);
  }

  const base = readJson(basePath);
  if (!isPlainObject(base)) {
    throw new Error(`Base locale must be a JSON object: ${basePath}`);
  }

  const files = fs
    .readdirSync(LOCALES_DIR)
    .filter(name => name.toLowerCase().endsWith('.json'))
    .filter(name => name !== BASE_LOCALE);

  let updatedCount = 0;
  for (const fileName of files) {
    const filePath = path.join(LOCALES_DIR, fileName);
    const locale = readJson(filePath);
    const synced = syncToBase(base, locale);
    writeJsonPretty(filePath, synced);
    updatedCount += 1;
  }

  process.stdout.write(
    `Synced ${updatedCount} locale(s) to base ${BASE_LOCALE} in ${path.relative(process.cwd(), LOCALES_DIR)}\n`,
  );
}

main();
