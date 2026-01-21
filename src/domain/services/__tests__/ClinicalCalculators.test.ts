/**
 * ClinicalCalculators Unit Tests
 *
 * Tests for BMI, Cardiovascular Risk, eGFR, IBW, and BMR calculations.
 * Validates edge cases, boundary conditions, and clinical accuracy.
 */

import {
  ClinicalCalculators,
  BMICategory,
  CardioRiskCategory,
} from '../ClinicalCalculators';

describe('ClinicalCalculators', () => {
  describe('calculateBMI', () => {
    it('should calculate normal BMI correctly', () => {
      // 70kg, 175cm → BMI ~22.9
      const result = ClinicalCalculators.calculateBMI(70, 175);
      expect(result).not.toBeNull();
      expect(result!.value).toBeCloseTo(22.9, 1);
      expect(result!.category).toBe(BMICategory.NORMAL);
      expect(result!.isHealthy).toBe(true);
    });

    it('should classify underweight correctly', () => {
      // 45kg, 170cm → BMI ~15.6
      const result = ClinicalCalculators.calculateBMI(45, 170);
      expect(result!.category).toBe(BMICategory.UNDERWEIGHT);
      expect(result!.isHealthy).toBe(false);
    });

    it('should classify overweight correctly', () => {
      // 85kg, 175cm → BMI ~27.8
      const result = ClinicalCalculators.calculateBMI(85, 175);
      expect(result!.category).toBe(BMICategory.OVERWEIGHT);
      expect(result!.isHealthy).toBe(false);
    });

    it('should classify obesity class I correctly', () => {
      // 95kg, 170cm → BMI ~32.9
      const result = ClinicalCalculators.calculateBMI(95, 170);
      expect(result!.category).toBe(BMICategory.OBESE_CLASS_I);
    });

    it('should classify obesity class II correctly', () => {
      // 110kg, 170cm → BMI ~38.1
      const result = ClinicalCalculators.calculateBMI(110, 170);
      expect(result!.category).toBe(BMICategory.OBESE_CLASS_II);
    });

    it('should classify obesity class III correctly', () => {
      // 130kg, 170cm → BMI ~45.0
      const result = ClinicalCalculators.calculateBMI(130, 170);
      expect(result!.category).toBe(BMICategory.OBESE_CLASS_III);
    });

    it('should return null for invalid weight', () => {
      expect(ClinicalCalculators.calculateBMI(0, 175)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(-10, 175)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(800, 175)).toBeNull();
    });

    it('should return null for invalid height', () => {
      expect(ClinicalCalculators.calculateBMI(70, 0)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(70, -10)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(70, 350)).toBeNull();
    });

    it('should return correct i18n category key', () => {
      const result = ClinicalCalculators.calculateBMI(70, 175);
      expect(result!.categoryKey).toBe('calculator.bmi.normal');
    });
  });

  describe('calculateCardiovascularRisk', () => {
    it('should calculate low risk for young healthy person', () => {
      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age: 30,
        gender: 'female',
        systolicBP: 115,
        isSmoker: false,
        hasDiabetes: false,
      });
      expect(result).not.toBeNull();
      expect(result!.category).toBe(CardioRiskCategory.LOW);
      expect(result!.riskPercentage).toBeLessThan(5);
    });

    it('should calculate high risk for elderly with multiple risk factors', () => {
      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age: 65,
        gender: 'male',
        systolicBP: 160,
        isSmoker: true,
        hasDiabetes: true,
      });
      expect(result!.category).toBe(CardioRiskCategory.VERY_HIGH);
      expect(result!.riskPercentage).toBeGreaterThanOrEqual(20);
    });

    it('should add smoking recommendation when smoker', () => {
      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age: 45,
        gender: 'male',
        systolicBP: 120,
        isSmoker: true,
        hasDiabetes: false,
      });
      expect(result!.recommendations).toContain('calculator.cardio.rec.stopSmoking');
    });

    it('should add BP control recommendation when hypertensive', () => {
      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age: 50,
        gender: 'female',
        systolicBP: 145,
        isSmoker: false,
        hasDiabetes: false,
      });
      expect(result!.recommendations).toContain('calculator.cardio.rec.controlBP');
    });

    it('should include cholesterol in risk when provided', () => {
      const resultWithCholesterol = ClinicalCalculators.calculateCardiovascularRisk({
        age: 55,
        gender: 'male',
        systolicBP: 140,
        isSmoker: false,
        hasDiabetes: false,
        totalCholesterol: 280,
        hdlCholesterol: 40,
      });
      const resultWithoutCholesterol = ClinicalCalculators.calculateCardiovascularRisk({
        age: 55,
        gender: 'male',
        systolicBP: 140,
        isSmoker: false,
        hasDiabetes: false,
      });
      expect(resultWithCholesterol!.riskPercentage).toBeGreaterThan(
        resultWithoutCholesterol!.riskPercentage,
      );
    });

    it('should return null for invalid age', () => {
      expect(
        ClinicalCalculators.calculateCardiovascularRisk({
          age: 15,
          gender: 'male',
          systolicBP: 120,
          isSmoker: false,
          hasDiabetes: false,
        }),
      ).toBeNull();
    });

    it('should return null for invalid blood pressure', () => {
      expect(
        ClinicalCalculators.calculateCardiovascularRisk({
          age: 50,
          gender: 'male',
          systolicBP: 50,
          isSmoker: false,
          hasDiabetes: false,
        }),
      ).toBeNull();
    });
  });

  describe('calculateEGFR', () => {
    it('should calculate normal eGFR for healthy adult', () => {
      // Normal creatinine ~1.0 mg/dL
      const result = ClinicalCalculators.calculateEGFR(1.0, 40, 'male');
      expect(result).not.toBeNull();
      expect(result!.value).toBeGreaterThan(90);
      expect(result!.stage).toBe(1);
    });

    it('should calculate reduced eGFR for elevated creatinine', () => {
      // Elevated creatinine 2.0 mg/dL
      const result = ClinicalCalculators.calculateEGFR(2.0, 60, 'male');
      expect(result!.value).toBeLessThan(60);
      expect(result!.stage).toBeGreaterThanOrEqual(3);
    });

    it('should show kidney failure for very high creatinine', () => {
      const result = ClinicalCalculators.calculateEGFR(8.0, 70, 'female');
      expect(result!.stage).toBe(5);
      expect(result!.interpretation).toBe('calculator.egfr.kidneyFailure');
    });

    it('should apply gender-specific formula correctly', () => {
      const maleResult = ClinicalCalculators.calculateEGFR(1.0, 50, 'male');
      const femaleResult = ClinicalCalculators.calculateEGFR(1.0, 50, 'female');
      // eGFR calculation differs by gender
      expect(maleResult!.value).not.toBe(femaleResult!.value);
    });

    it('should return null for invalid creatinine', () => {
      expect(ClinicalCalculators.calculateEGFR(0, 50, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateEGFR(-1, 50, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateEGFR(35, 50, 'male')).toBeNull();
    });

    it('should return null for invalid age', () => {
      expect(ClinicalCalculators.calculateEGFR(1.0, 10, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateEGFR(1.0, 130, 'male')).toBeNull();
    });

    it('should classify stage 2 correctly', () => {
      // eGFR 60-89 - use moderate creatinine and older age for stage 2 range
      // CKD-EPI 2021: higher creatinine + older age = lower eGFR
      const result = ClinicalCalculators.calculateEGFR(1.1, 70, 'male');
      expect(result!.value).toBeGreaterThanOrEqual(60);
      expect(result!.value).toBeLessThan(90);
      expect(result!.stage).toBe(2);
    });
  });

  describe('calculateIdealBodyWeight', () => {
    it('should calculate IBW for male', () => {
      // 180cm male
      const result = ClinicalCalculators.calculateIdealBodyWeight(180, 'male');
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(70);
      expect(result).toBeLessThan(85);
    });

    it('should calculate IBW for female', () => {
      // 165cm female
      const result = ClinicalCalculators.calculateIdealBodyWeight(165, 'female');
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(50);
      expect(result).toBeLessThan(65);
    });

    it('should return null for height below 5 feet', () => {
      expect(ClinicalCalculators.calculateIdealBodyWeight(140, 'male')).toBeNull();
    });

    it('should return null for invalid height', () => {
      expect(ClinicalCalculators.calculateIdealBodyWeight(0, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateIdealBodyWeight(-10, 'female')).toBeNull();
    });
  });

  describe('calculateBMR', () => {
    it('should calculate BMR for male', () => {
      // 75kg, 175cm, 30 years, male
      const result = ClinicalCalculators.calculateBMR(75, 175, 30, 'male');
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(1600);
      expect(result).toBeLessThan(2000);
    });

    it('should calculate BMR for female', () => {
      // 60kg, 165cm, 30 years, female
      const result = ClinicalCalculators.calculateBMR(60, 165, 30, 'female');
      expect(result).not.toBeNull();
      expect(result).toBeGreaterThan(1200);
      expect(result).toBeLessThan(1600);
    });

    it('should decrease BMR with age', () => {
      const young = ClinicalCalculators.calculateBMR(70, 175, 25, 'male');
      const old = ClinicalCalculators.calculateBMR(70, 175, 65, 'male');
      expect(young).toBeGreaterThan(old!);
    });

    it('should return null for invalid inputs', () => {
      expect(ClinicalCalculators.calculateBMR(0, 175, 30, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateBMR(70, 0, 30, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateBMR(70, 175, 0, 'male')).toBeNull();
    });
  });

  describe('NaN and Edge Case Handling', () => {
    it('should return null for NaN inputs in BMI', () => {
      expect(ClinicalCalculators.calculateBMI(NaN, 175)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(70, NaN)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(NaN, NaN)).toBeNull();
    });

    it('should return null for NaN inputs in Cardiovascular Risk', () => {
      expect(
        ClinicalCalculators.calculateCardiovascularRisk({
          age: NaN,
          gender: 'male',
          systolicBP: 120,
          isSmoker: false,
          hasDiabetes: false,
        }),
      ).toBeNull();
      expect(
        ClinicalCalculators.calculateCardiovascularRisk({
          age: 50,
          gender: 'male',
          systolicBP: NaN,
          isSmoker: false,
          hasDiabetes: false,
        }),
      ).toBeNull();
    });

    it('should handle undefined cholesterol values in Cardiovascular Risk', () => {
      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age: 50,
        gender: 'male',
        systolicBP: 120,
        isSmoker: false,
        hasDiabetes: false,
        totalCholesterol: undefined,
        hdlCholesterol: undefined,
      });
      expect(result).not.toBeNull();
      expect(result!.riskPercentage).toBeGreaterThan(0);
    });

    it('should return null for NaN inputs in eGFR', () => {
      expect(ClinicalCalculators.calculateEGFR(NaN, 50, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateEGFR(1.0, NaN, 'male')).toBeNull();
    });

    it('should return null for NaN inputs in IBW', () => {
      expect(ClinicalCalculators.calculateIdealBodyWeight(NaN, 'male')).toBeNull();
    });

    it('should return null for NaN inputs in BMR', () => {
      expect(ClinicalCalculators.calculateBMR(NaN, 175, 30, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateBMR(70, NaN, 30, 'male')).toBeNull();
      expect(ClinicalCalculators.calculateBMR(70, 175, NaN, 'male')).toBeNull();
    });

    it('should handle Infinity values gracefully', () => {
      expect(ClinicalCalculators.calculateBMI(Infinity, 175)).toBeNull();
      expect(ClinicalCalculators.calculateBMI(70, Infinity)).toBeNull();
      expect(ClinicalCalculators.calculateEGFR(Infinity, 50, 'male')).toBeNull();
    });
  });
});
