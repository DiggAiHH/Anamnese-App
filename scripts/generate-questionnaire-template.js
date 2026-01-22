/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

/**
 * Generates an importable questionnaire template JSON from `src/Inahlt/Master`.
 *
 * Output: `src/infrastructure/data/questionnaire-template.generated.json`
 *
 * This keeps the editable Master TSV as the source of truth,
 * while the app consumes JSON at runtime.
 */

const ROOT = path.resolve(__dirname, '..');
const MASTER_PATH = path.join(ROOT, 'src', 'Inahlt', 'Master');
const STRUKTUR_PATH = path.join(ROOT, 'src', 'Inahlt', 'Struktur');
const OUT_PATH = path.join(
  ROOT,
  'src',
  'infrastructure',
  'data',
  'questionnaire-template.generated.json',
);

function parseBool(v) {
  return String(v || '').trim().toLowerCase() === 'yes';
}

function splitCsv(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function baseCodeFromFieldName(fieldName) {
  const name = String(fieldName || '').trim();
  const idx = name.indexOf('_');
  return idx >= 0 ? name.slice(0, idx) : name;
}

function suffixFromFieldName(fieldName) {
  const name = String(fieldName || '').trim();
  const idx = name.indexOf('_');
  return idx >= 0 ? name.slice(idx + 1) : '';
}

function parseBaseId(code) {
  const normalized = String(code || '').trim();
  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  // base36 keeps ids numeric even for codes like 1A00, 1B00, 1C00, 1P00
  return Number.parseInt(normalized.toUpperCase(), 36);
}

function hashSuffixToSmallInt(suffix) {
  // stable small hash into [1..999]
  const s = String(suffix || '').toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return (hash % 999) + 1;
}

function parseQuestionId(fieldName) {
  const base = parseBaseId(baseCodeFromFieldName(fieldName));
  const suffix = suffixFromFieldName(fieldName);
  if (!suffix) return base;

  const suffixId = hashSuffixToSmallInt(suffix);
  return base * 1000 + suffixId;
}

function parseStrukturOrder(strukturText) {
  // Extract leading tokens like:
  // 1000
  // 0003_tag
  // 1130_freq_per_day:
  // 0003\tmonat
  // We normalize to the same numeric questionId encoding as Master.
  const text = String(strukturText || '');
  const lines = text.split(/\r?\n/);

  /** @type {Map<number, number>} */
  const orderByQuestionId = new Map();
  let idx = 0;

  const allowedSuffixes = new Set(['tag', 'monat', 'jahr']);

  for (const line of lines) {
    const trimmed = String(line).trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('?')) continue;

    // Prefer "1130_freq_per_day:" style (underscore is part of token)
    const tokenMatch = trimmed.match(/^([0-9]{1,4}(?:_[A-Za-z0-9]+)*)/);
    if (!tokenMatch) continue;

    let token = tokenMatch[1];
    token = token.replace(/:+$/, '');

    // If token is just digits, only combine suffix when it's an explicit known one
    // (e.g. "0003 tag" -> "0003_tag"). Do NOT treat descriptive text as suffix.
    if (/^[0-9]{1,4}$/.test(token)) {
      const m2 = trimmed.match(/^[0-9]{1,4}\s+([A-Za-z0-9]+)\b/);
      const maybe = m2 ? String(m2[1]).toLowerCase() : '';
      if (allowedSuffixes.has(maybe)) {
        token = `${token}_${maybe}`;
      }
    }

    const fieldName = token;

    const qid = parseQuestionId(fieldName);
    if (!orderByQuestionId.has(qid)) {
      orderByQuestionId.set(qid, idx++);
    }
  }

  return orderByQuestionId;
}

function mapQuestionType(fieldType) {
  const t = String(fieldType || '').trim().toLowerCase();
  switch (t) {
    case 'text':
      return 'text';
    case 'number':
      return 'number';
    case 'date':
      return 'date';
    case 'textarea':
      return 'textarea';
    case 'radio':
      return 'radio';
    case 'select':
      return 'select';
    case 'checkbox':
      // UI supports both; we treat checkbox as integer-coded multiselect bitset
      return 'multiselect';
    case 'multiselect':
      return 'multiselect';
    case 'hidden':
      // keep as text but hide via metadata
      return 'text';
    default:
      return 'text';
  }
}

function normalizeOptionLabel(label) {
  return String(label || '').trim();
}

function isYesNoOptionSet(optionLabels) {
  const lowered = optionLabels.map((l) => l.toLowerCase());
  return lowered.includes('ja') && lowered.includes('nein') && optionLabels.length === 2;
}

function parseOptionMappings(optionLabels, questionType) {
  const labels = optionLabels.map(normalizeOptionLabel);

  if (labels.length === 0) return undefined;

  // Birthdate select lists from Master include a leading placeholder label
  // (Tag/Monat/Jahr) and then real values.
  const firstLower = labels[0]?.toLowerCase();
  if (questionType !== 'multiselect' && (firstLower === 'tag' || firstLower === 'monat' || firstLower === 'jahr')) {
    const mapped = [{ value: 0, labelKey: labels[0] }];
    for (let i = 1; i < labels.length; i++) {
      const label = labels[i];
      if (firstLower === 'tag') {
        const day = Number.parseInt(label, 10);
        mapped.push({ value: Number.isFinite(day) ? day : i, labelKey: label });
      } else if (firstLower === 'monat') {
        mapped.push({ value: i, labelKey: label });
      } else {
        const year = Number.parseInt(label, 10);
        mapped.push({ value: Number.isFinite(year) ? year : i, labelKey: label });
      }
    }
    return mapped;
  }

  if (questionType === 'multiselect') {
    // value is bit position (0..n-1), actual stored answer is a bitset integer
    return labels.map((label, idx) => ({ value: idx, labelKey: label }));
  }

  if (isYesNoOptionSet(labels)) {
    // standardize: Ja=1, Nein=0
    return labels.map((label) => {
      const lower = label.toLowerCase();
      return { value: lower === 'ja' ? 1 : 0, labelKey: label };
    });
  }

  // default: 1..n
  return labels.map((label, idx) => ({ value: idx + 1, labelKey: label }));
}

function parseGotoMap(mapStr) {
  // Examples:
  // "Ja=>#q1001  Nein=>#q2000"
  // "A=>#q1110; B=>#q1184; ..."
  const raw = String(mapStr || '').trim();
  if (!raw) return [];

  const cleaned = raw.replace(/\s+/g, ' ');
  const parts = cleaned.split(/;|\s{2,}/g).map((p) => p.trim()).filter(Boolean);

  const edges = [];
  for (const part of parts) {
    const m = part.match(/^(.+?)=>\s*(#q[0-9A-Z]+)$/i);
    if (!m) continue;
    edges.push({ optionText: m[1].trim(), targetAnchor: m[2].trim() });
  }
  return edges;
}

function sectionIdFromAnchor(anchor) {
  // "#q1001" -> "q1001"
  return String(anchor || '').trim().replace(/^#/, '');
}

function parseMasterRows(tsv) {
  const lines = tsv.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = lines[0]
    .split('\t')
    .map((h) => String(h).replace(/^\uFEFF/, '').trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t');
    const row = {};
    for (let c = 0; c < header.length; c++) {
      row[header[c]] = cols[c] ?? '';
    }
    rows.push(row);
  }
  return rows;
}

function getCol(row, key) {
  // tolerate minor header differences (case/whitespace)
  if (row[key] !== undefined) return row[key];
  const normalizedKey = String(key).trim().toLowerCase();
  for (const k of Object.keys(row)) {
    if (String(k).trim().toLowerCase() === normalizedKey) return row[k];
  }
  return '';
}

function main() {
  const tsv = fs.readFileSync(MASTER_PATH, 'utf8');
  const rows = parseMasterRows(tsv);

  let strukturOrderByQuestionId = new Map();
  try {
    const struktur = fs.readFileSync(STRUKTUR_PATH, 'utf8');
    strukturOrderByQuestionId = parseStrukturOrder(struktur);
  } catch {
    // Optional: generator still works without Struktur ordering
    strukturOrderByQuestionId = new Map();
  }

  const sectionsById = new Map();
  const sectionOrder = [];

  // 1) Build sections/questions
  for (const row of rows) {
    const sectionId = String(getCol(row, 'section_id') || '').trim();
    const sectionTitle = String(getCol(row, 'section_title') || '').trim();
    const fieldName = String(getCol(row, 'field_name') || '').trim();

    if (!sectionId || !fieldName) continue;

    if (!sectionsById.has(sectionId)) {
      sectionsById.set(sectionId, {
        id: sectionId,
        titleKey: sectionTitle || sectionId,
        order: sectionOrder.length + 1,
        questions: [],
      });
      sectionOrder.push(sectionId);
    }

    const section = sectionsById.get(sectionId);

    const type = mapQuestionType(getCol(row, 'field_type'));
    const questionId = parseQuestionId(fieldName);

    const placeholder = String(getCol(row, 'placeholders') || '').trim();

    const optionLabels = splitCsv(getCol(row, 'options_labels'));
    const options = parseOptionMappings(optionLabels, type);

    const min = String(getCol(row, 'min') || '').trim();
    const max = String(getCol(row, 'max') || '').trim();

    const validation = {};
    if (type === 'number') {
      if (min) validation.min = Number(min);
      if (max) validation.max = Number(max);
    }

    const hidden = String(getCol(row, 'field_type') || '').trim().toLowerCase() === 'hidden';

    const orderHintRaw = String(getCol(row, 'section_order_hint') || '').trim();
    const orderHint = orderHintRaw ? Number(orderHintRaw) : undefined;

    const question = {
      id: String(questionId),
      type,
      labelKey: String(row.field_label || '').trim() || String(row.section_title || '').trim(),
      placeholderKey: placeholder || undefined,
      required: parseBool(getCol(row, 'required')),
      options: options && options.length > 0 ? options : undefined,
      validation: Object.keys(validation).length > 0 ? validation : undefined,
      conditions: undefined,
      dependsOn: undefined,
      metadata: {
        fieldName,
        fieldTag: String(getCol(row, 'field_tag') || '').trim() || undefined,
        sectionId,
        hidden: hidden || undefined,
        orderHint,
        strukturOrder: strukturOrderByQuestionId.get(questionId),

        // Compartment mapping (stable numeric IDs for export/encoding)
        compartmentId: questionId,
        compartmentCode: fieldName,
        compartmentSection: sectionTitle || sectionId,
        compartmentConcept: sectionId,
        // These are assigned after sorting
        compartmentOrder: undefined,
        compartmentOrderInSection: undefined,
      },
    };

    section.questions.push(question);
  }

  // 2) Sort questions within each section
  for (const sectionId of sectionOrder) {
    const section = sectionsById.get(sectionId);
    section.questions.sort((a, b) => {
      const as = a.metadata?.strukturOrder;
      const bs = b.metadata?.strukturOrder;
      if (typeof as === 'number' && typeof bs === 'number') return as - bs;
      if (typeof as === 'number') return -1;
      if (typeof bs === 'number') return 1;

      const ao = a.metadata?.orderHint;
      const bo = b.metadata?.orderHint;
      if (typeof ao === 'number' && typeof bo === 'number') return ao - bo;
      if (typeof ao === 'number') return -1;
      if (typeof bo === 'number') return 1;
      return 0;
    });

    // Assign stable order within section (1-based)
    for (let i = 0; i < section.questions.length; i++) {
      const q = section.questions[i];
      q.metadata = q.metadata ?? {};
      q.metadata.compartmentOrderInSection = i + 1;
    }
  }

  // 2b) Sort sections by earliest Struktur order (if present)
  sectionOrder.sort((aId, bId) => {
    const a = sectionsById.get(aId);
    const b = sectionsById.get(bId);
    const aMin = Math.min(
      ...a.questions
        .map((q) => q.metadata?.strukturOrder)
        .filter((v) => typeof v === 'number'),
      Number.POSITIVE_INFINITY,
    );
    const bMin = Math.min(
      ...b.questions
        .map((q) => q.metadata?.strukturOrder)
        .filter((v) => typeof v === 'number'),
      Number.POSITIVE_INFINITY,
    );
    if (aMin !== bMin) return aMin - bMin;
    return 0;
  });

  // Index helpers
  const firstQuestionIdBySectionId = new Map();
  const questionsById = new Map();

  for (const sectionId of sectionOrder) {
    const section = sectionsById.get(sectionId);
    if (section.questions.length > 0) {
      firstQuestionIdBySectionId.set(sectionId, section.questions[0].id);
    }
    for (const q of section.questions) {
      questionsById.set(q.id, q);
    }
  }

  // Assign stable global compartment order (1-based).
  // Prefer Struktur ordering when available; otherwise fall back to deterministic traversal order.
  let globalOrderCounter = 1;
  for (const sectionId of sectionOrder) {
    const section = sectionsById.get(sectionId);
    for (const q of section.questions) {
      q.metadata = q.metadata ?? {};
      const strukturOrder = q.metadata.strukturOrder;
      if (typeof strukturOrder === 'number' && Number.isFinite(strukturOrder)) {
        q.metadata.compartmentOrder = strukturOrder + 1;
      } else {
        q.metadata.compartmentOrder = globalOrderCounter;
      }
      globalOrderCounter++;
    }
  }

  function addConditionToSectionQuestions(targetSectionId, condition) {
    const section = sectionsById.get(targetSectionId);
    if (!section) return;
    for (const q of section.questions) {
      q.conditions = q.conditions ?? [];
      q.conditions.push(condition);
    }
  }

  function resolveEncodedOptionValue(sourceQuestion, optionText) {
    if (!sourceQuestion || !sourceQuestion.options) return undefined;

    const needle = String(optionText || '').trim().toLowerCase();

    // Match by labelKey (human label)
    const match = sourceQuestion.options.find(
      (o) => String(o.labelKey || '').trim().toLowerCase() === needle,
    );
    if (match) return match.value;

    // Fallback: try raw equality
    const match2 = sourceQuestion.options.find(
      (o) => String(o.labelKey || '').includes(optionText),
    );
    return match2 ? match2.value : undefined;
  }

  // 3) Add conditions based on toggle_map / next_map
  //    We interpret "...=>#qXXXX" as: show all questions in section qXXXX when condition is satisfied.
  for (const row of rows) {
    const sectionId = String(getCol(row, 'section_id') || '').trim();
    const fieldName = String(getCol(row, 'field_name') || '').trim();
    if (!sectionId || !fieldName) continue;

    const sourceQuestionId = parseQuestionId(fieldName);
    const sourceQuestion = questionsById.get(String(sourceQuestionId));

    const toggleEdges = parseGotoMap(getCol(row, 'toggle_map'));
    const nextEdges = parseGotoMap(getCol(row, 'next_map'));

    const edges = [...toggleEdges, ...nextEdges];
    if (edges.length === 0) continue;

    for (const edge of edges) {
      const targetSectionId = sectionIdFromAnchor(edge.targetAnchor);

      if (!targetSectionId) continue;
      if (!sectionsById.has(targetSectionId)) continue;

      // If map has no optionText (rare), we skip (unconditional next would show anyway)
      if (!edge.optionText) continue;

      if (!sourceQuestion) continue;

      if (sourceQuestion.type === 'multiselect') {
        const bitPos = resolveEncodedOptionValue(sourceQuestion, edge.optionText);
        if (typeof bitPos !== 'number') continue;

        addConditionToSectionQuestions(targetSectionId, {
          questionId: String(sourceQuestionId),
          operator: 'contains',
          value: bitPos,
        });
      } else if (sourceQuestion.type === 'radio' || sourceQuestion.type === 'select') {
        const encoded = resolveEncodedOptionValue(sourceQuestion, edge.optionText);
        if (typeof encoded !== 'number') continue;

        addConditionToSectionQuestions(targetSectionId, {
          questionId: String(sourceQuestionId),
          operator: 'equals',
          value: encoded,
        });
      }
    }
  }

  const out = {
    version: 'master-generated-1',
    sections: sectionOrder.map((id) => sectionsById.get(id)),
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), 'utf8');
  console.log(`Generated: ${path.relative(ROOT, OUT_PATH)}`);
}

main();
