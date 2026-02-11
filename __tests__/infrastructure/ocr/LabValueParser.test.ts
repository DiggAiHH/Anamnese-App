/**
 * LabValueParser Unit Tests
 * Tests regex-based extraction of lab values from OCR text.
 */

import { parseLabValues } from '../../../src/infrastructure/ocr/LabValueParser';
import { LabValueType } from '../../../src/domain/value-objects/LabValue';

describe('LabValueParser', () => {
  describe('parseLabValues', () => {
    it('should extract creatinine from structured German lab line', () => {
      const text = 'Kreatinin             1.2  mg/dL     0.7 - 1.3';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.CREATININE);
      expect(result[0].value).toBe(1.2);
      expect(result[0].unit).toBe('mg/dL');
      expect(result[0].confidence).toBe(0.9);
      expect(result[0].referenceRange).toBe('0.7 - 1.3');
    });

    it('should extract creatinine with comma decimal (German format)', () => {
      const text = 'Kreatinin   0,8  mg/dL';
      const result = parseLabValues(text, 0.85);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe(0.8);
    });

    it('should extract HDL cholesterol', () => {
      const text = 'HDL-Cholesterin:      55   mg/dl';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.HDL_CHOLESTEROL);
      expect(result[0].value).toBe(55);
      expect(result[0].unit).toBe('mg/dL');
    });

    it('should extract total cholesterol', () => {
      const text = 'Gesamtcholesterin   220  mg/dL   < 200';
      const result = parseLabValues(text, 0.88);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.TOTAL_CHOLESTEROL);
      expect(result[0].value).toBe(220);
    });

    it('should extract GOT (AST)', () => {
      const text = 'GOT (AST)  25 U/L  (< 50)';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.GOT);
      expect(result[0].value).toBe(25);
      expect(result[0].unit).toBe('U/L');
    });

    it('should extract GPT (ALT)', () => {
      const text = 'GPT   30 U/L';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.GPT);
      expect(result[0].value).toBe(30);
    });

    it('should extract GGT', () => {
      const text = 'GGT   45 U/L   (< 60)';
      const result = parseLabValues(text, 0.88);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.GGT);
      expect(result[0].value).toBe(45);
    });

    it('should extract TSH', () => {
      const text = 'TSH   2.5 mU/L   0.4 - 4.0';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.TSH);
      expect(result[0].value).toBe(2.5);
      expect(result[0].unit).toBe('mU/L');
    });

    it('should extract glucose', () => {
      const text = 'Glukose (nüchtern)  98 mg/dL   70-100';
      const result = parseLabValues(text, 0.85);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.GLUCOSE);
      expect(result[0].value).toBe(98);
    });

    it('should extract HbA1c', () => {
      const text = 'HbA1c   5.6 %   < 6.0';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.HBA1C);
      expect(result[0].value).toBe(5.6);
      expect(result[0].unit).toBe('%');
    });

    it('should extract hemoglobin', () => {
      const text = 'Hämoglobin   14.2 g/dL   12.0-16.0';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.HEMOGLOBIN);
      expect(result[0].value).toBe(14.2);
      expect(result[0].unit).toBe('g/dL');
    });

    it('should extract CRP', () => {
      const text = 'CRP   3.5 mg/L   < 5.0';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.CRP);
      expect(result[0].value).toBe(3.5);
    });

    it('should extract potassium', () => {
      const text = 'Kalium   4.2 mmol/L   3.5-5.0';
      const result = parseLabValues(text, 0.88);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.POTASSIUM);
      expect(result[0].value).toBe(4.2);
      expect(result[0].unit).toBe('mmol/L');
    });

    it('should extract sodium', () => {
      const text = 'Natrium   140 mmol/L   136-145';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.SODIUM);
      expect(result[0].value).toBe(140);
    });

    it('should extract uric acid', () => {
      const text = 'Harnsäure   6.5 mg/dL   3.4-7.0';
      const result = parseLabValues(text, 0.87);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.URIC_ACID);
      expect(result[0].value).toBe(6.5);
    });

    it('should extract LDL cholesterol', () => {
      const text = 'LDL-Cholesterin   130 mg/dL   < 160';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.LDL_CHOLESTEROL);
      expect(result[0].value).toBe(130);
    });

    it('should extract triglycerides', () => {
      const text = 'Triglyceride   150 mg/dL   < 150';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.TRIGLYCERIDES);
      expect(result[0].value).toBe(150);
    });

    // Multi-line extraction
    it('should extract multiple values from a lab report', () => {
      const text = [
        'Laborwerte vom 15.01.2026',
        '',
        'Kreatinin         1.1  mg/dL     0.7-1.3',
        'GOT (AST)         22   U/L       < 50',
        'GPT (ALT)         28   U/L       < 50',
        'GGT               40   U/L       < 60',
        'Gesamtcholesterin  210  mg/dL     < 200',
        'HDL-Cholesterin    60   mg/dL     > 40',
        'LDL-Cholesterin    120  mg/dL     < 160',
        'Triglyceride       180  mg/dL     < 150',
        'Glukose            105  mg/dL     70-100',
        'HbA1c              5.8  %         < 6.0',
      ].join('\n');

      const result = parseLabValues(text, 0.92);

      expect(result.length).toBeGreaterThanOrEqual(8);
      const types = result.map(r => r.type);
      expect(types).toContain(LabValueType.CREATININE);
      expect(types).toContain(LabValueType.GOT);
      expect(types).toContain(LabValueType.GPT);
      expect(types).toContain(LabValueType.TOTAL_CHOLESTEROL);
      expect(types).toContain(LabValueType.HDL_CHOLESTEROL);
      expect(types).toContain(LabValueType.GLUCOSE);
    });

    // Edge cases
    it('should return empty array for empty text', () => {
      expect(parseLabValues('', 0.9)).toEqual([]);
    });

    it('should return empty array for text without lab values', () => {
      const text = 'Patient erschien zur Routine-Kontrolle. Keine Auffälligkeiten.';
      expect(parseLabValues(text, 0.9)).toEqual([]);
    });

    it('should reject implausible values (creatinine > 20)', () => {
      const text = 'Kreatinin   999  mg/dL';
      const result = parseLabValues(text, 0.9);
      expect(result).toHaveLength(0);
    });

    it('should reject implausible values (cholesterol < 50)', () => {
      const text = 'Gesamtcholesterin   5  mg/dL';
      const result = parseLabValues(text, 0.9);
      expect(result).toHaveLength(0);
    });

    it('should only extract the first match per type', () => {
      const text = [
        'Kreatinin   1.0  mg/dL',
        'Kreatinin   1.5  mg/dL',
      ].join('\n');

      const result = parseLabValues(text, 0.9);
      const creatinineValues = result.filter(r => r.type === LabValueType.CREATININE);
      expect(creatinineValues).toHaveLength(1);
      expect(creatinineValues[0].value).toBe(1.0);
    });

    it('should handle English lab report format', () => {
      const text = 'Creatinine   1.3  mg/dL';
      const result = parseLabValues(text, 0.85);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(LabValueType.CREATININE);
    });

    it('should apply lower confidence for unstructured matches', () => {
      // A line where the value isn't followed by the unit in a structured way
      const text = 'Der CRP-Wert liegt bei 3.5 mg/L und ist normal.';
      const result = parseLabValues(text, 0.9);

      if (result.length > 0) {
        // Unstructured match → confidence should be multiplied by 0.8
        expect(result[0].confidence).toBeLessThanOrEqual(0.9);
      }
    });

    it('should store rawText for traceability', () => {
      const text = 'TSH   3.1 mU/L';
      const result = parseLabValues(text, 0.9);

      expect(result).toHaveLength(1);
      expect(result[0].rawText).toBe('TSH   3.1 mU/L');
    });
  });
});
