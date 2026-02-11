/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function flattenKeys(obj, prefix = '') {
  const keys = new Set();

  if (!isPlainObject(obj)) return keys;

  for (const [key, value] of Object.entries(obj)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      for (const childKey of flattenKeys(value, nextPrefix)) keys.add(childKey);
      continue;
    }

    keys.add(nextPrefix);
  }

  return keys;
}

function getValueAtKey(obj, dottedKey) {
  const parts = dottedKey.split('.');
  let cur = obj;
  for (const p of parts) {
    if (!isPlainObject(cur) && !Array.isArray(cur)) return undefined;
    if (cur == null || !(p in cur)) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setValueAtKey(obj, dottedKey, value) {
  const parts = dottedKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === parts.length - 1) {
      cur[p] = value;
      return;
    }
    if (!isPlainObject(cur[p])) cur[p] = {};
    cur = cur[p];
  }
}

function loadJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`Invalid JSON in ${filePath}: ${msg}`);
  }
}

function writeJsonPretty(filePath, obj) {
  fs.writeFileSync(filePath, `${JSON.stringify(obj, null, 2)}\n`, 'utf8');
}

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    fix: args.has('--fix'),
    base: (() => {
      const baseArg = argv.find((a) => a.startsWith('--base='));
      return baseArg ? baseArg.split('=')[1] : 'de';
    })(),
  };
}

function main() {
  const { fix, base } = parseArgs(process.argv);

  const localesDir = path.join(process.cwd(), 'src', 'presentation', 'i18n', 'locales');
  if (!fs.existsSync(localesDir)) {
    console.error(`Missing locales dir: ${localesDir}`);
    process.exit(2);
  }

  const localeFiles = fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const baseFile = `${base}.json`;
  if (!localeFiles.includes(baseFile)) {
    console.error(`Base locale not found: ${path.join(localesDir, baseFile)}`);
    process.exit(2);
  }

  const basePath = path.join(localesDir, baseFile);
  const baseJson = loadJson(basePath);
  const baseKeys = flattenKeys(baseJson);

  const report = {
    base,
    baseKeyCount: baseKeys.size,
    locales: {},
    totals: {
      localesChecked: 0,
      missingKeyLocales: 0,
      totalMissingKeys: 0,
      identicalToBaseCount: 0,
    },
  };

  for (const file of localeFiles) {
    const locale = path.basename(file, '.json');
    const fullPath = path.join(localesDir, file);

    const json = loadJson(fullPath);
    const keys = flattenKeys(json);

    const missing = [];
    const extra = [];

    for (const k of baseKeys) {
      if (!keys.has(k)) missing.push(k);
    }

    for (const k of keys) {
      if (!baseKeys.has(k)) extra.push(k);
    }

    let identicalToBase = 0;
    if (locale !== base) {
      for (const k of baseKeys) {
        const baseVal = getValueAtKey(baseJson, k);
        const val = getValueAtKey(json, k);
        if (typeof baseVal === 'string' && typeof val === 'string' && baseVal === val) {
          identicalToBase++;
        }
      }
    }

    if (fix && missing.length > 0) {
      for (const k of missing) {
        const baseVal = getValueAtKey(baseJson, k);
        if (typeof baseVal === 'string') {
          setValueAtKey(json, k, baseVal);
        } else {
          setValueAtKey(json, k, '');
        }
      }
      writeJsonPretty(fullPath, json);
    }

    report.locales[locale] = {
      keyCount: keys.size,
      missingCount: missing.length,
      extraCount: extra.length,
      identicalToBaseCount: identicalToBase,
      missing,
      extra,
    };

    report.totals.localesChecked++;
    if (missing.length > 0) report.totals.missingKeyLocales++;
    report.totals.totalMissingKeys += missing.length;
    report.totals.identicalToBaseCount += identicalToBase;
  }

  const buildLogsDir = path.join(process.cwd(), 'buildLogs');
  if (!fs.existsSync(buildLogsDir)) fs.mkdirSync(buildLogsDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outPath = path.join(buildLogsDir, `i18n_audit_${stamp}.json`);
  writeJsonPretty(outPath, report);

  const missingLocales = Object.entries(report.locales)
    .filter(([, v]) => v.missingCount > 0)
    .map(([k]) => k);

  if (missingLocales.length > 0) {
    console.error(
      `i18n audit: missing keys in ${missingLocales.length} locale(s). Report: ${outPath}`
    );
    process.exit(1);
  }

  console.log(`i18n audit: OK. Report: ${outPath}`);
}

main();
