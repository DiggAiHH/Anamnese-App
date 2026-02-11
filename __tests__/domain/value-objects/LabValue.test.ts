/**
 * LabValue Value Object Tests
 *
 * Tests Zod schema validation, type constants, and calculator mapping.
 *
 * @security DSGVO Art. 9: Health data (lab values). No PII in tests.
 */

import {
  LabValueSchema,
  LabValueType,
  LAB_TO_CALCULATOR_MAP,
} from '@domain/value-objects/LabValue';

describe('LabValueSchema', () => {
  const validLabValue = {
    type: LabValueType.CREATININE,
    value: 1.2,
    unit: 'mg/dL',
    referenceRange: '0.7-1.3',
    confidence: 0.95,
    rawText: 'Kreatinin: 1.2 mg/dL',
  };

  it('parses a valid lab value', () => {
    const result = LabValueSchema.parse(validLabValue);
    expect(result.type).toBe('creatinine');
    expect(result.value).toBe(1.2);
    expect(result.confidence).toBe(0.95);
  });

  it('allows optional referenceRange', () => {
    const { referenceRange: _, ...withoutRange } = validLabValue;
    expect(() => LabValueSchema.parse(withoutRange)).not.toThrow();
  });

  it('rejects confidence < 0', () => {
    expect(() => LabValueSchema.parse({ ...validLabValue, confidence: -0.1 })).toThrow();
  });

  it('rejects confidence > 1', () => {
    expect(() => LabValueSchema.parse({ ...validLabValue, confidence: 1.5 })).toThrow();
  });

  it('rejects non-numeric value', () => {
    expect(() => LabValueSchema.parse({ ...validLabValue, value: 'abc' })).toThrow();
  });

  it('rejects missing required fields', () => {
    expect(() => LabValueSchema.parse({})).toThrow();
    expect(() => LabValueSchema.parse({ type: 'weight' })).toThrow();
  });
});

describe('LabValueType', () => {
  it('defines all expected clinical lab types', () => {
    expect(LabValueType.WEIGHT).toBe('weight');
    expect(LabValueType.CREATININE).toBe('creatinine');
    expect(LabValueType.TOTAL_CHOLESTEROL).toBe('totalCholesterol');
    expect(LabValueType.HDL_CHOLESTEROL).toBe('hdlCholesterol');
    expect(LabValueType.SYSTOLIC_BP).toBe('systolicBP');
    expect(LabValueType.GLUCOSE).toBe('glucose');
    expect(LabValueType.HBA1C).toBe('hba1c');
    expect(LabValueType.TSH).toBe('tsh');
  });

  it('has at least 20 defined types', () => {
    const typeCount = Object.keys(LabValueType).length;
    expect(typeCount).toBeGreaterThanOrEqual(20);
  });
});

describe('LAB_TO_CALCULATOR_MAP', () => {
  it('maps weight to bmiWeight', () => {
    expect(LAB_TO_CALCULATOR_MAP[LabValueType.WEIGHT]).toBe('bmiWeight');
  });

  it('maps height to bmiHeight', () => {
    expect(LAB_TO_CALCULATOR_MAP[LabValueType.HEIGHT]).toBe('bmiHeight');
  });

  it('maps creatinine to egfrCreatinine', () => {
    expect(LAB_TO_CALCULATOR_MAP[LabValueType.CREATININE]).toBe('egfrCreatinine');
  });

  it('maps totalCholesterol to cardioTotalChol', () => {
    expect(LAB_TO_CALCULATOR_MAP[LabValueType.TOTAL_CHOLESTEROL]).toBe('cardioTotalChol');
  });

  it('returns undefined for unmapped types', () => {
    expect(LAB_TO_CALCULATOR_MAP[LabValueType.GLUCOSE]).toBeUndefined();
  });
});
