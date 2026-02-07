/*
  i18n audit/sync utility
  - Audits locale JSON files against union of en + de keys
  - Optionally fills missing keys using en->de fallback values

  Usage:
    node scripts/i18n-audit-and-sync.cjs --report buildLogs/i18n_missing_report.json
    node scripts/i18n-audit-and-sync.cjs --write --report buildLogs/i18n_missing_report.json
*/

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'presentation', 'i18n', 'locales');

function parseArgs(argv) {
  const args = { write: false, report: null };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--write') args.write = true;
    else if (arg === '--report') args.report = argv[i + 1] ?? null, (i += 1);
  }
  return args;
}

function readJson(filePath) {
  let raw = fs.readFileSync(filePath, 'utf8');
  // Defensive normalization: some Windows tooling can introduce BOM/NULs.
  raw = raw.replace(/^\uFEFF/, '').replace(/\u0000/g, '');
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error && typeof error.message === 'string' ? error.message : String(error);
    const wrapped = new SyntaxError(`Failed to parse JSON (${filePath}): ${message}`);
    wrapped.cause = error;
    throw wrapped;
  }
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function deepClone(value) {
  if (Array.isArray(value)) return value.map(deepClone);
  if (isPlainObject(value)) {
    const out = {};
    for (const key of Object.keys(value)) out[key] = deepClone(value[key]);
    return out;
  }
  return value;
}

function deepMergeAddMissing(target, source) {
  // Preserves key order of target; only appends missing keys from source.
  let changed = false;
  const out = target;
  for (const key of Object.keys(source)) {
    const srcVal = source[key];
    if (!(key in out)) {
      out[key] = deepClone(srcVal);
      changed = true;
      continue;
    }
    const tgtVal = out[key];
    if (isPlainObject(tgtVal) && isPlainObject(srcVal)) {
      const nestedChanged = deepMergeAddMissing(tgtVal, srcVal);
      if (nestedChanged) changed = true;
    }
  }
  return changed;
}

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    const next = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(value)) keys.push(...flattenKeys(value, next));
    else keys.push(next);
  }
  return keys;
}

function buildUnionTemplate(primary, secondary) {
  // Union keys; values prefer primary then secondary.
  const out = deepClone(primary);

  function addFrom(dst, src) {
    for (const key of Object.keys(src)) {
      const srcVal = src[key];
      if (!(key in dst)) {
        dst[key] = deepClone(srcVal);
        continue;
      }
      const dstVal = dst[key];
      if (isPlainObject(dstVal) && isPlainObject(srcVal)) addFrom(dstVal, srcVal);
    }
  }

  addFrom(out, secondary);
  return out;
}

function formatJson(obj) {
  return JSON.stringify(obj, null, 2) + '\n';
}

function main() {
  const args = parseArgs(process.argv);

  const enPath = path.join(LOCALES_DIR, 'en.json');
  const dePath = path.join(LOCALES_DIR, 'de.json');

  if (!fs.existsSync(enPath) || !fs.existsSync(dePath)) {
    throw new Error(`Missing base locale file(s): ${enPath} / ${dePath}`);
  }

  const en = readJson(enPath);
  const de = readJson(dePath);

  // Source of truth for required keys: union(en, de)
  const unionTemplate = buildUnionTemplate(en, de);
  const requiredKeySet = new Set(flattenKeys(unionTemplate));

  const localeFiles = fs
    .readdirSync(LOCALES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const report = {
    generatedAt: new Date().toISOString(),
    localesDir: path.relative(path.join(__dirname, '..'), LOCALES_DIR).replace(/\\/g, '/'),
    baseLocales: ['en.json', 'de.json'],
    requiredKeysCount: requiredKeySet.size,
    mode: args.write ? 'write' : 'report',
    locales: {},
    summary: {
      localesTotal: localeFiles.length,
      localesWithMissingKeys: 0,
      totalMissingKeys: 0,
      filesChanged: 0,
    },
  };

  for (const fileName of localeFiles) {
    const localePath = path.join(LOCALES_DIR, fileName);
    const localeCode = path.basename(fileName, '.json');
    const localeJson = readJson(localePath);

    const localeKeys = new Set(flattenKeys(localeJson));
    const missing = [];

    for (const k of requiredKeySet) {
      if (!localeKeys.has(k)) missing.push(k);
    }

    missing.sort();

    const localeEntry = {
      missingCount: missing.length,
      missingKeys: missing,
      changed: false,
    };

    if (missing.length > 0) {
      report.summary.localesWithMissingKeys += 1;
      report.summary.totalMissingKeys += missing.length;

      if (args.write && localeCode !== 'en' && localeCode !== 'de') {
        const before = JSON.stringify(localeJson);

        // Fill from union template (en preferred; de fallback)
        const changed = deepMergeAddMissing(localeJson, unionTemplate);
        const after = JSON.stringify(localeJson);

        if (changed && before !== after) {
          fs.writeFileSync(localePath, formatJson(localeJson), 'utf8');
          localeEntry.changed = true;
          report.summary.filesChanged += 1;
        }
      }
    }

    report.locales[fileName] = localeEntry;
  }

  if (args.report) {
    const reportPath = path.isAbsolute(args.report)
      ? args.report
      : path.join(__dirname, '..', args.report);
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, formatJson(report), 'utf8');
  }

  const brief = {
    requiredKeysCount: report.requiredKeysCount,
    localesWithMissingKeys: report.summary.localesWithMissingKeys,
    totalMissingKeys: report.summary.totalMissingKeys,
    filesChanged: report.summary.filesChanged,
    reportPath: args.report || null,
  };

  process.stdout.write(formatJson(brief));
}

main();
