/**
 * Lab Value - Value Object
 * Represents a parsed laboratory value extracted from a lab report.
 *
 * @security No PII stored — only clinical measurement values.
 * DSGVO Art. 9: Health data, requires explicit OCR consent.
 */

import { z } from 'zod';

/**
 * Known lab value types that map to calculator inputs.
 */
export const LabValueType = {
  /** Body weight in kg */
  WEIGHT: 'weight',
  /** Body height in cm */
  HEIGHT: 'height',
  /** Serum creatinine in mg/dL */
  CREATININE: 'creatinine',
  /** Total cholesterol in mg/dL */
  TOTAL_CHOLESTEROL: 'totalCholesterol',
  /** HDL cholesterol in mg/dL */
  HDL_CHOLESTEROL: 'hdlCholesterol',
  /** Systolic blood pressure in mmHg */
  SYSTOLIC_BP: 'systolicBP',
  /** Patient age in years */
  AGE: 'age',
  /** Fasting glucose in mg/dL */
  GLUCOSE: 'glucose',
  /** HbA1c in % */
  HBA1C: 'hba1c',
  /** Hemoglobin in g/dL */
  HEMOGLOBIN: 'hemoglobin',
  /** Leukocytes in /µL (or x10³/µL) */
  LEUKOCYTES: 'leukocytes',
  /** Thrombocytes in /µL (or x10³/µL) */
  THROMBOCYTES: 'thrombocytes',
  /** GOT/AST in U/L */
  GOT: 'got',
  /** GPT/ALT in U/L */
  GPT: 'gpt',
  /** GGT in U/L */
  GGT: 'ggt',
  /** TSH in mU/L */
  TSH: 'tsh',
  /** LDL cholesterol in mg/dL */
  LDL_CHOLESTEROL: 'ldlCholesterol',
  /** Triglycerides in mg/dL */
  TRIGLYCERIDES: 'triglycerides',
  /** Uric acid in mg/dL */
  URIC_ACID: 'uricAcid',
  /** Potassium in mmol/L */
  POTASSIUM: 'potassium',
  /** Sodium in mmol/L */
  SODIUM: 'sodium',
  /** CRP in mg/L */
  CRP: 'crp',
} as const;

export type LabValueTypeKey = (typeof LabValueType)[keyof typeof LabValueType];

/**
 * A single parsed lab value.
 */
export const LabValueSchema = z.object({
  type: z.string(),
  value: z.number(),
  unit: z.string(),
  /** Reference range as displayed on the report */
  referenceRange: z.string().optional(),
  /** Confidence of the OCR extraction (0–1) */
  confidence: z.number().min(0).max(1),
  /** Raw text that was matched */
  rawText: z.string(),
});

export type LabValue = z.infer<typeof LabValueSchema>;

/**
 * Result of parsing a lab report.
 */
export interface LabParseResult {
  /** Successfully extracted values */
  values: LabValue[];
  /** Overall OCR confidence */
  ocrConfidence: number;
  /** Raw OCR text (for debugging, NOT logged in prod) */
  rawText: string;
  /** Detected language */
  language: string;
}

/**
 * Mapping from LabValueType to Calculator state field names.
 * Only values that can be imported into Calculator are listed.
 */
export const LAB_TO_CALCULATOR_MAP: Partial<Record<LabValueTypeKey, string>> = {
  [LabValueType.WEIGHT]: 'bmiWeight',
  [LabValueType.HEIGHT]: 'bmiHeight',
  [LabValueType.CREATININE]: 'egfrCreatinine',
  [LabValueType.TOTAL_CHOLESTEROL]: 'cardioTotalChol',
  [LabValueType.HDL_CHOLESTEROL]: 'cardioHdl',
  [LabValueType.SYSTOLIC_BP]: 'cardioSystolic',
  [LabValueType.AGE]: 'cardioAge',
};
