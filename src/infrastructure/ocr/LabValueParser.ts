/**
 * Lab Value Parser
 * Extracts known laboratory values from OCR text using regex patterns.
 *
 * Supports German and English lab report formats.
 * Common German lab report patterns:
 *   "Kreatinin    1.2 mg/dL    (0.7-1.3)"
 *   "HDL-Cholesterin: 55 mg/dl"
 *   "Glucose (nüchtern)  98 mg/dL"
 *
 * @security No PII processing. Lab values only.
 * DSGVO Art. 9: Health data — requires OCR consent.
 */

import {
  LabValue,
  LabValueType,
  type LabValueTypeKey,
} from '../../domain/value-objects/LabValue';

/**
 * A pattern definition for a lab value.
 */
interface LabPattern {
  type: LabValueTypeKey;
  /** Regex aliases for the lab value name (case-insensitive) */
  namePatterns: RegExp[];
  /** Expected unit patterns (case-insensitive) */
  unitPatterns: RegExp[];
  /** Canonical unit string */
  canonicalUnit: string;
  /** Value range guard (min/max) to filter implausible OCR artifacts */
  plausibleRange: { min: number; max: number };
}

/**
 * Known lab value patterns (German + English).
 */
const LAB_PATTERNS: LabPattern[] = [
  {
    type: LabValueType.CREATININE,
    namePatterns: [
      /kreatinin/i,
      /creatinin[e]?/i,
      /krea\b/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 0.1, max: 20 },
  },
  // HDL/LDL MUST come before TOTAL_CHOLESTEROL (first-match-wins).
  {
    type: LabValueType.HDL_CHOLESTEROL,
    namePatterns: [
      /hdl[-\s]?cholesterin/i,
      /hdl[-\s]?cholesterol/i,
      /hdl[-\s]?chol/i,
      /\bhdl\b/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 10, max: 150 },
  },
  {
    type: LabValueType.LDL_CHOLESTEROL,
    namePatterns: [
      /ldl[-\s]?cholesterin/i,
      /ldl[-\s]?cholesterol/i,
      /ldl[-\s]?chol/i,
      /\bldl\b/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 10, max: 400 },
  },
  {
    type: LabValueType.TOTAL_CHOLESTEROL,
    namePatterns: [
      /gesamt[-\s]?cholesterin/i,
      /total\s*cholesterol/i,
      /cholesterin\s*gesamt/i,
      /(?<!hdl[-\s]?)(?<!ldl[-\s]?)chol(?:esterin)?\s*(?:ges(?:amt)?)?/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 50, max: 500 },
  },
  {
    type: LabValueType.TRIGLYCERIDES,
    namePatterns: [
      /triglycerid[e]?/i,
      /triglyzerid[e]?/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 20, max: 2000 },
  },
  {
    type: LabValueType.GLUCOSE,
    namePatterns: [
      /glukose|glucose/i,
      /blutzucker/i,
      /nüchtern[-\s]?glukose/i,
      /fasting\s*glucose/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 20, max: 600 },
  },
  {
    type: LabValueType.HBA1C,
    namePatterns: [
      /hba1c/i,
      /hb\s*a1c/i,
      /glykoh[äa]moglobin/i,
      /glycated\s*hemoglobin/i,
    ],
    unitPatterns: [/%/],
    canonicalUnit: '%',
    plausibleRange: { min: 3, max: 20 },
  },
  {
    type: LabValueType.HEMOGLOBIN,
    namePatterns: [
      /h[äa]moglobin/i,
      /hemoglobin/i,
      /\bhb\b(?!\s*a1c)/i,
    ],
    unitPatterns: [/g\s*[/]\s*d[lL]/i],
    canonicalUnit: 'g/dL',
    plausibleRange: { min: 3, max: 25 },
  },
  {
    type: LabValueType.LEUKOCYTES,
    namePatterns: [
      /leukozyt[e]?n/i,
      /leukocytes/i,
      /leukozyten/i,
      /\bwbc\b/i,
    ],
    unitPatterns: [/[/]\s*[µu]?[lL]/i, /x?\s*10[³3]\s*[/]\s*[µu]?[lL]/i, /tsd\s*[/]\s*[µu]?l/i],
    canonicalUnit: '/µL',
    plausibleRange: { min: 0.5, max: 100 },
  },
  {
    type: LabValueType.THROMBOCYTES,
    namePatterns: [
      /thrombozyt[e]?n/i,
      /thrombocytes/i,
      /pl[äa]ttchen/i,
      /platelets/i,
    ],
    unitPatterns: [/[/]\s*[µu]?[lL]/i, /x?\s*10[³3]\s*[/]\s*[µu]?[lL]/i, /tsd\s*[/]\s*[µu]?l/i],
    canonicalUnit: '/µL',
    plausibleRange: { min: 10, max: 1500 },
  },
  {
    type: LabValueType.GOT,
    namePatterns: [
      /\bgot\b/i,
      /\bast\b/i,
      /aspartat[-\s]?aminotransferase/i,
    ],
    unitPatterns: [/u\s*[/]\s*[lL]/i],
    canonicalUnit: 'U/L',
    plausibleRange: { min: 1, max: 5000 },
  },
  {
    type: LabValueType.GPT,
    namePatterns: [
      /\bgpt\b/i,
      /\balt\b/i,
      /alanin[-\s]?aminotransferase/i,
    ],
    unitPatterns: [/u\s*[/]\s*[lL]/i],
    canonicalUnit: 'U/L',
    plausibleRange: { min: 1, max: 5000 },
  },
  {
    type: LabValueType.GGT,
    namePatterns: [
      /\bggt\b/i,
      /gamma[-\s]?gt/i,
      /gamma[-\s]?glutamyl/i,
    ],
    unitPatterns: [/u\s*[/]\s*[lL]/i],
    canonicalUnit: 'U/L',
    plausibleRange: { min: 1, max: 5000 },
  },
  {
    type: LabValueType.TSH,
    namePatterns: [
      /\btsh\b/i,
      /thyreotropin/i,
    ],
    unitPatterns: [/m[uU]\s*[/]\s*[lL]/i, /[µu]?iu\s*[/]\s*m[lL]/i],
    canonicalUnit: 'mU/L',
    plausibleRange: { min: 0.01, max: 100 },
  },
  {
    type: LabValueType.URIC_ACID,
    namePatterns: [
      /harns[äa]ure/i,
      /uric\s*acid/i,
    ],
    unitPatterns: [/mg\s*[/]\s*d[lL]/i],
    canonicalUnit: 'mg/dL',
    plausibleRange: { min: 0.5, max: 20 },
  },
  {
    type: LabValueType.POTASSIUM,
    namePatterns: [
      /kalium/i,
      /potassium/i,
      /\bk\+?\b/i,
    ],
    unitPatterns: [/mmol\s*[/]\s*[lL]/i],
    canonicalUnit: 'mmol/L',
    plausibleRange: { min: 1, max: 10 },
  },
  {
    type: LabValueType.SODIUM,
    namePatterns: [
      /natrium/i,
      /sodium/i,
      /\bna\+?\b/i,
    ],
    unitPatterns: [/mmol\s*[/]\s*[lL]/i],
    canonicalUnit: 'mmol/L',
    plausibleRange: { min: 100, max: 200 },
  },
  {
    type: LabValueType.CRP,
    namePatterns: [
      /\bcrp\b/i,
      /c[-\s]?reaktives?\s*protein/i,
      /c[-\s]?reactive\s*protein/i,
    ],
    unitPatterns: [/mg\s*[/]\s*[lL]/i],
    canonicalUnit: 'mg/L',
    plausibleRange: { min: 0, max: 500 },
  },
  {
    type: LabValueType.SYSTOLIC_BP,
    namePatterns: [
      /systolisch/i,
      /systolic/i,
      /rr\s*syst/i,
      /blutdruck\s*syst/i,
    ],
    unitPatterns: [/mmhg/i],
    canonicalUnit: 'mmHg',
    plausibleRange: { min: 50, max: 300 },
  },
];

/**
 * Generic line pattern:
 * Captures: [name part] ... [numeric value] [unit part] ... [optional ref range]
 *
 * Example lines:
 *   "Kreatinin             1.2  mg/dL     0.7 - 1.3"
 *   "HDL-Cholesterin:      55   mg/dl"
 *   "GOT (AST)  25 U/L  (< 50)"
 */
const VALUE_LINE_REGEX = /^(.+?)\s+([\d]+[.,]?\d*)\s+([a-zA-Zµ%/³]+(?:\s*[/]\s*[a-zA-Zµ³]+)?)\s*(.*)?$/;

/**
 * Parse OCR text and extract lab values.
 *
 * @param ocrText - Raw OCR text from TesseractOCRService
 * @param ocrConfidence - Overall OCR confidence (0–1)
 * @returns Array of parsed LabValue objects
 */
export function parseLabValues(ocrText: string, ocrConfidence: number): LabValue[] {
  const results: LabValue[] = [];
  const foundTypes = new Set<string>();

  const lines = ocrText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    // Try structured line match first
    const match = VALUE_LINE_REGEX.exec(line);
    if (match) {
      const [, namePart, valuePart, unitPart, refPart] = match;
      const numericValue = parseFloat(valuePart.replace(',', '.'));

      if (isNaN(numericValue)) continue;

      for (const pattern of LAB_PATTERNS) {
        // Skip if already found (first match wins for each type)
        if (foundTypes.has(pattern.type)) continue;

        const nameMatch = pattern.namePatterns.some(p => p.test(namePart));
        const unitMatch = pattern.unitPatterns.some(p => p.test(unitPart));

        if (nameMatch && unitMatch) {
          // Plausibility check
          if (numericValue < pattern.plausibleRange.min || numericValue > pattern.plausibleRange.max) {
            continue;
          }

          results.push({
            type: pattern.type,
            value: numericValue,
            unit: pattern.canonicalUnit,
            referenceRange: refPart?.trim() || undefined,
            confidence: ocrConfidence,
            rawText: line,
          });
          foundTypes.add(pattern.type);
          break;
        }
      }
    }

    // Fallback: try each pattern against the entire line (unstructured)
    if (!match) {
      for (const pattern of LAB_PATTERNS) {
        if (foundTypes.has(pattern.type)) continue;

        const nameMatch = pattern.namePatterns.some(p => p.test(line));
        if (!nameMatch) continue;

        // Extract first plausible number from the line
        const numberMatches = line.match(/(\d+[.,]?\d*)/g);
        if (!numberMatches) continue;

        for (const numStr of numberMatches) {
          const numericValue = parseFloat(numStr.replace(',', '.'));
          if (isNaN(numericValue)) continue;
          if (numericValue < pattern.plausibleRange.min || numericValue > pattern.plausibleRange.max) continue;

          // Check if a unit appears somewhere in the line
          const unitMatch = pattern.unitPatterns.some(p => p.test(line));
          if (!unitMatch) continue;

          results.push({
            type: pattern.type,
            value: numericValue,
            unit: pattern.canonicalUnit,
            referenceRange: undefined,
            confidence: ocrConfidence * 0.8, // lower confidence for unstructured
            rawText: line,
          });
          foundTypes.add(pattern.type);
          break;
        }
      }
    }
  }

  return results;
}
