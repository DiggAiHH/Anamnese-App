/**
 * ClinicalCalculators - Medical calculation utilities
 *
 * Provides evidence-based clinical calculators for common medical assessments:
 * - BMI (Body Mass Index)
 * - Cardiovascular Risk (simplified Framingham-based)
 * - eGFR (estimated Glomerular Filtration Rate - CKD-EPI 2021)
 *
 * @security No PII logged; all calculations are local
 * @compliance DSGVO Art. 25 - Privacy by Design (no cloud services)
 */

/**
 * BMI Categories per WHO classification
 */
export enum BMICategory {
  UNDERWEIGHT = 'underweight',
  NORMAL = 'normal',
  OVERWEIGHT = 'overweight',
  OBESE_CLASS_I = 'obese_class_i',
  OBESE_CLASS_II = 'obese_class_ii',
  OBESE_CLASS_III = 'obese_class_iii',
}

/**
 * BMI Result with value and clinical interpretation
 */
export interface BMIResult {
  value: number;
  category: BMICategory;
  categoryKey: string; // i18n key for display
  isHealthy: boolean;
}

/**
 * Cardiovascular Risk Categories
 */
export enum CardioRiskCategory {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

/**
 * Cardiovascular Risk Input Parameters
 */
export interface CardioRiskInput {
  age: number;
  gender: 'male' | 'female';
  systolicBP: number; // mmHg
  isSmoker: boolean;
  hasDiabetes: boolean;
  totalCholesterol?: number; // mg/dL (optional)
  hdlCholesterol?: number; // mg/dL (optional)
}

/**
 * Cardiovascular Risk Result
 */
export interface CardioRiskResult {
  riskPercentage: number; // 10-year risk in %
  category: CardioRiskCategory;
  categoryKey: string; // i18n key
  recommendations: string[]; // i18n keys for lifestyle recommendations
}

/**
 * eGFR (kidney function) Result
 */
export interface EGFRResult {
  value: number; // mL/min/1.73m²
  stage: number; // CKD stage 1-5
  stageKey: string; // i18n key
  interpretation: string; // i18n key
}

/**
 * Clinical Calculators Service
 *
 * All methods are pure functions with no side effects.
 * Formulas are based on established medical guidelines.
 */
export class ClinicalCalculators {
  /**
   * Calculate Body Mass Index (BMI)
   *
   * Formula: weight (kg) / height² (m²)
   * Classification: WHO International Classification
   *
   * @param weightKg - Weight in kilograms
   * @param heightCm - Height in centimeters
   * @returns BMIResult with value and category
   */
  static calculateBMI(weightKg: number, heightCm: number): BMIResult | null {
    // Input validation - includes NaN and Infinity checks
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 700) return null;
    if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) return null;

    const heightM = heightCm / 100;
    const bmi = weightKg / (heightM * heightM);
    const value = Math.round(bmi * 10) / 10; // Round to 1 decimal

    let category: BMICategory;
    let isHealthy: boolean;

    if (value < 18.5) {
      category = BMICategory.UNDERWEIGHT;
      isHealthy = false;
    } else if (value < 25) {
      category = BMICategory.NORMAL;
      isHealthy = true;
    } else if (value < 30) {
      category = BMICategory.OVERWEIGHT;
      isHealthy = false;
    } else if (value < 35) {
      category = BMICategory.OBESE_CLASS_I;
      isHealthy = false;
    } else if (value < 40) {
      category = BMICategory.OBESE_CLASS_II;
      isHealthy = false;
    } else {
      category = BMICategory.OBESE_CLASS_III;
      isHealthy = false;
    }

    return {
      value,
      category,
      categoryKey: `calculator.bmi.${category}`,
      isHealthy,
    };
  }

  /**
   * Calculate Cardiovascular Risk (Simplified Framingham-based)
   *
   * Simplified 10-year cardiovascular disease risk estimation.
   * Based on major risk factors from Framingham Heart Study.
   *
   * NOTE: This is a simplified educational tool, not a replacement
   * for validated clinical risk calculators (SCORE2, ASCVD, etc.)
   *
   * @param input - Risk factor inputs
   * @returns CardioRiskResult with percentage and recommendations
   */
  static calculateCardiovascularRisk(input: CardioRiskInput): CardioRiskResult | null {
    // Input validation - includes NaN checks
    if (!Number.isFinite(input.age) || input.age < 20 || input.age > 100) return null;
    if (!Number.isFinite(input.systolicBP) || input.systolicBP < 60 || input.systolicBP > 250)
      return null;

    // Base risk score calculation (simplified)
    let riskScore = 0;

    // Age contribution (major factor)
    if (input.age >= 65) {
      riskScore += 4;
    } else if (input.age >= 55) {
      riskScore += 3;
    } else if (input.age >= 45) {
      riskScore += 2;
    } else if (input.age >= 35) {
      riskScore += 1;
    }

    // Gender (males have higher baseline risk)
    if (input.gender === 'male') {
      riskScore += 1;
    }

    // Blood pressure contribution
    if (input.systolicBP >= 180) {
      riskScore += 4;
    } else if (input.systolicBP >= 160) {
      riskScore += 3;
    } else if (input.systolicBP >= 140) {
      riskScore += 2;
    } else if (input.systolicBP >= 130) {
      riskScore += 1;
    }

    // Smoking (major modifiable risk factor)
    if (input.isSmoker) {
      riskScore += 3;
    }

    // Diabetes (significant risk multiplier)
    if (input.hasDiabetes) {
      riskScore += 3;
    }

    // Cholesterol (if provided)
    if (input.totalCholesterol !== undefined && input.hdlCholesterol !== undefined) {
      const ratio = input.totalCholesterol / input.hdlCholesterol;
      if (ratio > 6) {
        riskScore += 2;
      } else if (ratio > 5) {
        riskScore += 1;
      }
    }

    // Convert score to 10-year risk percentage (simplified mapping)
    let riskPercentage: number;
    if (riskScore <= 2) {
      riskPercentage = 2;
    } else if (riskScore <= 4) {
      riskPercentage = 5;
    } else if (riskScore <= 6) {
      riskPercentage = 10;
    } else if (riskScore <= 8) {
      riskPercentage = 15;
    } else if (riskScore <= 10) {
      riskPercentage = 20;
    } else if (riskScore <= 12) {
      riskPercentage = 30;
    } else {
      riskPercentage = Math.min(50, 30 + (riskScore - 12) * 5);
    }

    // Determine category
    let category: CardioRiskCategory;
    if (riskPercentage < 5) {
      category = CardioRiskCategory.LOW;
    } else if (riskPercentage < 10) {
      category = CardioRiskCategory.MODERATE;
    } else if (riskPercentage < 20) {
      category = CardioRiskCategory.HIGH;
    } else {
      category = CardioRiskCategory.VERY_HIGH;
    }

    // Generate recommendations based on risk factors
    const recommendations: string[] = [];
    if (input.isSmoker) {
      recommendations.push('calculator.cardio.rec.stopSmoking');
    }
    if (input.systolicBP >= 130) {
      recommendations.push('calculator.cardio.rec.controlBP');
    }
    if (input.hasDiabetes) {
      recommendations.push('calculator.cardio.rec.manageDiabetes');
    }
    if (recommendations.length === 0) {
      recommendations.push('calculator.cardio.rec.maintainLifestyle');
    }
    recommendations.push('calculator.cardio.rec.regularCheckup');

    return {
      riskPercentage,
      category,
      categoryKey: `calculator.cardio.${category}`,
      recommendations,
    };
  }

  /**
   * Calculate eGFR (estimated Glomerular Filtration Rate)
   *
   * Using CKD-EPI 2021 equation (race-free)
   * Formula source: NEJM 2021; 385:1737-1749
   *
   * @param creatinine - Serum creatinine in mg/dL
   * @param age - Age in years
   * @param gender - 'male' or 'female'
   * @returns EGFRResult with value and CKD stage
   */
  static calculateEGFR(
    creatinine: number,
    age: number,
    gender: 'male' | 'female',
  ): EGFRResult | null {
    // Input validation - includes NaN and Infinity checks
    if (!Number.isFinite(creatinine) || creatinine <= 0 || creatinine > 30) return null;
    if (!Number.isFinite(age) || age < 18 || age > 120) return null;

    // CKD-EPI 2021 equation constants (race-free)
    const kappa = gender === 'female' ? 0.7 : 0.9;
    const alpha = gender === 'female' ? -0.241 : -0.302;
    const sexMultiplier = gender === 'female' ? 1.012 : 1.0;

    // Calculate eGFR
    const scrKappa = creatinine / kappa;
    const minTerm = Math.min(scrKappa, 1);
    const maxTerm = Math.max(scrKappa, 1);

    const egfr =
      142 *
      Math.pow(minTerm, alpha) *
      Math.pow(maxTerm, -1.2) *
      Math.pow(0.9938, age) *
      sexMultiplier;

    const value = Math.round(egfr);

    // Determine CKD stage based on eGFR
    let stage: number;
    let stageKey: string;
    let interpretation: string;

    if (value >= 90) {
      stage = 1;
      stageKey = 'calculator.egfr.stage1';
      interpretation = 'calculator.egfr.normal';
    } else if (value >= 60) {
      stage = 2;
      stageKey = 'calculator.egfr.stage2';
      interpretation = 'calculator.egfr.mildlyDecreased';
    } else if (value >= 45) {
      stage = 3;
      stageKey = 'calculator.egfr.stage3a';
      interpretation = 'calculator.egfr.mildModeratelyDecreased';
    } else if (value >= 30) {
      stage = 3;
      stageKey = 'calculator.egfr.stage3b';
      interpretation = 'calculator.egfr.moderatelySeverelyDecreased';
    } else if (value >= 15) {
      stage = 4;
      stageKey = 'calculator.egfr.stage4';
      interpretation = 'calculator.egfr.severelyDecreased';
    } else {
      stage = 5;
      stageKey = 'calculator.egfr.stage5';
      interpretation = 'calculator.egfr.kidneyFailure';
    }

    return {
      value,
      stage,
      stageKey,
      interpretation,
    };
  }

  /**
   * Calculate Ideal Body Weight (Devine formula)
   *
   * @param heightCm - Height in centimeters
   * @param gender - 'male' or 'female'
   * @returns Ideal weight in kg, or null if invalid input
   */
  static calculateIdealBodyWeight(heightCm: number, gender: 'male' | 'female'): number | null {
    // Input validation - includes NaN check
    if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) return null;

    const heightInches = heightCm / 2.54;
    const inchesOver5Feet = heightInches - 60;

    if (inchesOver5Feet < 0) return null; // Height must be at least 5 feet

    let idealWeight: number;
    if (gender === 'male') {
      idealWeight = 50 + 2.3 * inchesOver5Feet;
    } else {
      idealWeight = 45.5 + 2.3 * inchesOver5Feet;
    }

    return Math.round(idealWeight * 10) / 10;
  }

  /**
   * Calculate Basal Metabolic Rate (Mifflin-St Jeor equation)
   *
   * @param weightKg - Weight in kilograms
   * @param heightCm - Height in centimeters
   * @param age - Age in years
   * @param gender - 'male' or 'female'
   * @returns BMR in kcal/day, or null if invalid input
   */
  static calculateBMR(
    weightKg: number,
    heightCm: number,
    age: number,
    gender: 'male' | 'female',
  ): number | null {
    // Input validation - includes NaN and Infinity checks
    if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 700) return null;
    if (!Number.isFinite(heightCm) || heightCm <= 0 || heightCm > 300) return null;
    if (!Number.isFinite(age) || age <= 0 || age > 120) return null;

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    }

    return Math.round(bmr);
  }
}
