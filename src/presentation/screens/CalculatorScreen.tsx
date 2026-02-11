/**
 * Calculator Screen - Clinical Calculators
 * BMI, Cardiovascular Risk, eGFR, Ideal Body Weight, BMR
 * ISO/WCAG: Token-based design system
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { ClinicalCalculators } from '../../domain/services/ClinicalCalculators';
import { colors, spacing, radius } from '../theme/tokens';
import { AppButton } from '../components/AppButton';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { ScreenContainer } from '../components/ScreenContainer';
import { supportsOCR } from '../../shared/platformCapabilities';
import type { RootStackParamList } from '../navigation/RootNavigator';

type CalculatorRouteProp = RouteProp<RootStackParamList, 'Calculator'>;
type CalculatorNavProp = StackNavigationProp<RootStackParamList, 'Calculator'>;

type CalculatorTab = 'bmi' | 'cardio' | 'egfr' | 'ibw' | 'bmr';

export const CalculatorScreen = (): React.JSX.Element => {
  const { t } = useTranslation();
  const route = useRoute<CalculatorRouteProp>();
  const navigation = useNavigation<CalculatorNavProp>();
  const [activeTab, setActiveTab] = useState<CalculatorTab>('bmi');

  // BMI State
  const [bmiWeight, setBmiWeight] = useState('');
  const [bmiHeight, setBmiHeight] = useState('');
  const [bmiResult, setBmiResult] = useState<string | null>(null);

  // Cardiovascular Risk State
  const [cardioAge, setCardioAge] = useState('');
  const [cardioGender, setCardioGender] = useState<'male' | 'female'>('male');
  const [cardioSystolic, setCardioSystolic] = useState('');
  const [cardioTotalChol, setCardioTotalChol] = useState('');
  const [cardioHdl, setCardioHdl] = useState('');
  const [cardioSmoker, setCardioSmoker] = useState(false);
  const [cardioResult, setCardioResult] = useState<string | null>(null);

  // eGFR State
  const [egfrCreatinine, setEgfrCreatinine] = useState('');
  const [egfrAge, setEgfrAge] = useState('');
  const [egfrGender, setEgfrGender] = useState<'male' | 'female'>('male');
  const [egfrResult, setEgfrResult] = useState<string | null>(null);

  // IBW State
  const [ibwHeight, setIbwHeight] = useState('');
  const [ibwGender, setIbwGender] = useState<'male' | 'female'>('male');
  const [ibwResult, setIbwResult] = useState<string | null>(null);

  // BMR State
  const [bmrWeight, setBmrWeight] = useState('');
  const [bmrHeight, setBmrHeight] = useState('');
  const [bmrAge, setBmrAge] = useState('');
  const [bmrGender, setBmrGender] = useState<'male' | 'female'>('male');
  const [bmrResult, setBmrResult] = useState<string | null>(null);

  // Apply lab values from LabUpload navigation params
  useEffect(() => {
    const labValues = route.params?.labValues;
    if (!labValues) return;

    const setters: Record<string, (v: string) => void> = {
      bmiWeight: setBmiWeight,
      bmiHeight: setBmiHeight,
      cardioAge: setCardioAge,
      cardioSystolic: setCardioSystolic,
      cardioTotalChol: setCardioTotalChol,
      cardioHdl: setCardioHdl,
      egfrCreatinine: setEgfrCreatinine,
      egfrAge: setEgfrAge,
      ibwHeight: setIbwHeight,
      bmrWeight: setBmrWeight,
      bmrHeight: setBmrHeight,
      bmrAge: setBmrAge,
    };

    let importedCount = 0;
    for (const [key, value] of Object.entries(labValues)) {
      const setter = setters[key];
      if (setter && value) {
        setter(value);
        importedCount++;
      }
    }

    if (importedCount > 0) {
      Alert.alert(
        t('common.success', { defaultValue: 'Erfolg' }),
        t('labUpload.importSuccess', {
          defaultValue: '{{count}} Laborwerte wurden übernommen.',
          count: importedCount,
        }),
      );
    }
  }, [route.params?.labValues, t]);

  const handleNavigateToLabUpload = () => {
    navigation.navigate('LabUpload');
  };

  const calculateBMI = () => {
    try {
      const weight = parseFloat(bmiWeight);
      const height = parseFloat(bmiHeight);

      // Guard against NaN from empty/invalid input
      if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
        Alert.alert(t('common.error'), t('calculator.bmi.invalidInput'));
        return;
      }

      const result = ClinicalCalculators.calculateBMI(weight, height);

      if (!result) {
        Alert.alert(t('common.error'), t('calculator.bmi.invalidInput'));
        return;
      }

      setBmiResult(
        `${t('calculator.bmi.result')}: ${result.value.toFixed(1)} kg/m²\n` +
        `${t('calculator.bmi.category')}: ${t(`calculator.bmi.categories.${result.category}`)}`,
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('calculator.bmi.invalidInput'));
    }
  };

  const calculateCardio = () => {
    try {
      const age = parseInt(cardioAge, 10);
      const systolic = parseInt(cardioSystolic, 10);

      // Guard against NaN from empty/invalid required input
      if (isNaN(age) || isNaN(systolic) || age <= 0 || systolic <= 0) {
        Alert.alert(t('common.error'), t('calculator.cardio.invalidInput'));
        return;
      }

      // Optional cholesterol fields - only include if valid numbers
      const totalChol = parseFloat(cardioTotalChol);
      const hdl = parseFloat(cardioHdl);
      const hasCholesterol = !isNaN(totalChol) && !isNaN(hdl) && totalChol > 0 && hdl > 0;

      const result = ClinicalCalculators.calculateCardiovascularRisk({
        age,
        gender: cardioGender,
        systolicBP: systolic,
        totalCholesterol: hasCholesterol ? totalChol : undefined,
        hdlCholesterol: hasCholesterol ? hdl : undefined,
        isSmoker: cardioSmoker,
        hasDiabetes: false,
      });

      if (!result) {
        Alert.alert(t('common.error'), t('calculator.cardio.invalidInput'));
        return;
      }

      setCardioResult(
        `${t('calculator.cardio.risk10Year', { value: result.riskPercentage.toFixed(1) })}\n` +
        `${t('calculator.cardio.category', { category: t(`calculator.cardio.categories.${result.category}`) })}`,
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('calculator.cardio.invalidInput'));
    }
  };

  const calculateEGFR = () => {
    try {
      const creatinine = parseFloat(egfrCreatinine);
      const age = parseInt(egfrAge, 10);

      // Guard against NaN from empty/invalid input
      if (isNaN(creatinine) || isNaN(age) || creatinine <= 0 || age <= 0) {
        Alert.alert(t('common.error'), t('calculator.egfr.invalidInput'));
        return;
      }

      const result = ClinicalCalculators.calculateEGFR(creatinine, age, egfrGender);

      if (!result) {
        Alert.alert(t('common.error'), t('calculator.egfr.invalidInput'));
        return;
      }

      setEgfrResult(
        `${t('calculator.egfr.result')}: ${result.value.toFixed(1)} mL/min/1.73m²\n` +
        `${t('calculator.egfr.stage')}: ${result.stage} (${t(`calculator.egfr.stages.stage${result.stage}`)})`,
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('calculator.egfr.invalidInput'));
    }
  };

  const calculateIBW = () => {
    try {
      const height = parseFloat(ibwHeight);

      // Guard against NaN from empty/invalid input
      if (isNaN(height) || height <= 0) {
        Alert.alert(t('common.error'), t('calculator.ibw.invalidInput'));
        return;
      }

      const result = ClinicalCalculators.calculateIdealBodyWeight(height, ibwGender);

      if (result === null) {
        Alert.alert(t('common.error'), t('calculator.ibw.invalidInput'));
        return;
      }

      setIbwResult(`${t('calculator.ibw.result')}: ${result.toFixed(1)} kg`);
    } catch (error) {
      Alert.alert(t('common.error'), t('calculator.ibw.invalidInput'));
    }
  };

  const calculateBMR = () => {
    try {
      const weight = parseFloat(bmrWeight);
      const height = parseFloat(bmrHeight);
      const age = parseInt(bmrAge, 10);

      // Guard against NaN from empty/invalid input
      if (isNaN(weight) || isNaN(height) || isNaN(age) || weight <= 0 || height <= 0 || age <= 0) {
        Alert.alert(t('common.error'), t('calculator.bmr.invalidInput'));
        return;
      }

      const result = ClinicalCalculators.calculateBMR(weight, height, age, bmrGender);

      if (result === null) {
        Alert.alert(t('common.error'), t('calculator.bmr.invalidInput'));
        return;
      }

      setBmrResult(`${t('calculator.bmr.result')}: ${result.toFixed(0)} kcal/day`);
    } catch (error) {
      Alert.alert(t('common.error'), t('calculator.bmr.invalidInput'));
    }
  };

  const renderTabButtons = () => (
    <View style={styles.tabContainer} accessibilityRole="tablist">
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'bmi' && styles.tabButtonActive]}
        onPress={() => setActiveTab('bmi')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'bmi' }}
        accessibilityLabel={t('calculator.bmi.title')}>
        <AppText style={[styles.tabText, activeTab === 'bmi' && styles.tabTextActive]}>
          {t('calculator.bmi.title')}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'cardio' && styles.tabButtonActive]}
        onPress={() => setActiveTab('cardio')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'cardio' }}
        accessibilityLabel={t('calculator.cardio.title')}>
        <AppText style={[styles.tabText, activeTab === 'cardio' && styles.tabTextActive]}>
          {t('calculator.cardio.title')}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'egfr' && styles.tabButtonActive]}
        onPress={() => setActiveTab('egfr')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'egfr' }}
        accessibilityLabel={t('calculator.egfr.title')}>
        <AppText style={[styles.tabText, activeTab === 'egfr' && styles.tabTextActive]}>
          {t('calculator.egfr.title')}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'ibw' && styles.tabButtonActive]}
        onPress={() => setActiveTab('ibw')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'ibw' }}
        accessibilityLabel={t('calculator.ibw.title')}>
        <AppText style={[styles.tabText, activeTab === 'ibw' && styles.tabTextActive]}>
          {t('calculator.ibw.title')}
        </AppText>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tabButton, activeTab === 'bmr' && styles.tabButtonActive]}
        onPress={() => setActiveTab('bmr')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'bmr' }}
        accessibilityLabel={t('calculator.bmr.title')}>
        <AppText style={[styles.tabText, activeTab === 'bmr' && styles.tabTextActive]}>
          {t('calculator.bmr.title')}
        </AppText>
      </TouchableOpacity>
    </View>
  );

  const renderBMICalculator = () => (
    <View style={styles.calculatorContent}>
      <AppInput
        label={t('calculator.bmi.weightWithUnit', { defaultValue: 'Gewicht (kg)' })}
        style={styles.input}
        keyboardType="numeric"
        value={bmiWeight}
        onChangeText={setBmiWeight}
        placeholder={t('calculator.bmi.weightPlaceholder', { defaultValue: '70' })}
        accessibilityLabel={t('calculator.bmi.weight')}
      />
      <AppInput
        label={t('calculator.bmi.heightWithUnit', { defaultValue: 'Größe (cm)' })}
        style={styles.input}
        keyboardType="numeric"
        value={bmiHeight}
        onChangeText={setBmiHeight}
        placeholder={t('calculator.bmi.heightPlaceholder', { defaultValue: '175' })}
        accessibilityLabel={t('calculator.bmi.height')}
      />
      <AppButton
        title={t('calculator.calculate')}
        onPress={calculateBMI}
        style={styles.calculateButton}
      />
      {bmiResult && (
        <AppText style={styles.result} accessibilityLiveRegion="polite">
          {bmiResult}
        </AppText>
      )}
    </View>
  );

  const renderCardioCalculator = () => (
    <View style={styles.calculatorContent}>
      <AppInput
        label={t('calculator.cardio.age')}
        style={styles.input}
        keyboardType="numeric"
        value={cardioAge}
        onChangeText={setCardioAge}
        placeholder={t('calculator.cardio.agePlaceholder', { defaultValue: '50' })}
        accessibilityLabel={t('calculator.cardio.age')}
      />
      <AppText style={styles.label}>{t('calculator.cardio.gender')}</AppText>
      <View style={styles.genderContainer} accessibilityRole="radiogroup">
        <TouchableOpacity
          style={[styles.genderButton, cardioGender === 'male' && styles.genderButtonActive]}
          onPress={() => setCardioGender('male')}
          accessibilityRole="radio"
          accessibilityState={{ checked: cardioGender === 'male' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.male')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, cardioGender === 'female' && styles.genderButtonActive]}
          onPress={() => setCardioGender('female')}
          accessibilityRole="radio"
          accessibilityState={{ checked: cardioGender === 'female' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.female')}</AppText>
        </TouchableOpacity>
      </View>
      <AppInput
        label={t('calculator.cardio.systolicBPWithUnit', { defaultValue: 'Systolischer Blutdruck (mmHg)' })}
        style={styles.input}
        keyboardType="numeric"
        value={cardioSystolic}
        onChangeText={setCardioSystolic}
        placeholder={t('calculator.cardio.systolicPlaceholder', { defaultValue: '120' })}
        accessibilityLabel={t('calculator.cardio.systolicBP')}
      />
      <AppInput
        label={t('calculator.cardio.totalCholesterolWithUnit', { defaultValue: 'Gesamtcholesterin (mg/dL)' })}
        style={styles.input}
        keyboardType="numeric"
        value={cardioTotalChol}
        onChangeText={setCardioTotalChol}
        placeholder={t('calculator.cardio.cholPlaceholder', { defaultValue: '200' })}
        accessibilityLabel={t('calculator.cardio.totalCholesterol')}
      />
      <AppInput
        label={t('calculator.cardio.hdlCholesterolWithUnit', { defaultValue: 'HDL-Cholesterin (mg/dL)' })}
        style={styles.input}
        keyboardType="numeric"
        value={cardioHdl}
        onChangeText={setCardioHdl}
        placeholder={t('calculator.cardio.hdlPlaceholder', { defaultValue: '50' })}
        accessibilityLabel={t('calculator.cardio.hdlCholesterol')}
      />
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setCardioSmoker(!cardioSmoker)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: cardioSmoker }}>
        <View style={[styles.checkbox, cardioSmoker && styles.checkboxChecked]} />
        <AppText style={styles.checkboxLabel}>{t('calculator.cardio.smoker')}</AppText>
      </TouchableOpacity>
      <AppButton
        title={t('calculator.calculate')}
        onPress={calculateCardio}
        style={styles.calculateButton}
      />
      {cardioResult && (
        <AppText style={styles.result} accessibilityLiveRegion="polite">
          {cardioResult}
        </AppText>
      )}
    </View>
  );

  const renderEGFRCalculator = () => (
    <View style={styles.calculatorContent}>
      <AppInput
        label={t('calculator.egfr.creatinineWithUnit', { defaultValue: 'Kreatinin (mg/dL)' })}
        style={styles.input}
        keyboardType="numeric"
        value={egfrCreatinine}
        onChangeText={setEgfrCreatinine}
        placeholder={t('calculator.egfr.creatininePlaceholder', { defaultValue: '1.0' })}
        accessibilityLabel={t('calculator.egfr.creatinine')}
      />
      <AppInput
        label={t('calculator.egfr.age')}
        style={styles.input}
        keyboardType="numeric"
        value={egfrAge}
        onChangeText={setEgfrAge}
        placeholder={t('calculator.egfr.agePlaceholder', { defaultValue: '50' })}
        accessibilityLabel={t('calculator.egfr.age')}
      />
      <AppText style={styles.label}>{t('calculator.egfr.gender')}</AppText>
      <View style={styles.genderContainer} accessibilityRole="radiogroup">
        <TouchableOpacity
          style={[styles.genderButton, egfrGender === 'male' && styles.genderButtonActive]}
          onPress={() => setEgfrGender('male')}
          accessibilityRole="radio"
          accessibilityState={{ checked: egfrGender === 'male' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.male')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, egfrGender === 'female' && styles.genderButtonActive]}
          onPress={() => setEgfrGender('female')}
          accessibilityRole="radio"
          accessibilityState={{ checked: egfrGender === 'female' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.female')}</AppText>
        </TouchableOpacity>
      </View>
      <AppButton
        title={t('calculator.calculate')}
        onPress={calculateEGFR}
        style={styles.calculateButton}
      />
      {egfrResult && (
        <AppText style={styles.result} accessibilityLiveRegion="polite">
          {egfrResult}
        </AppText>
      )}
    </View>
  );

  const renderIBWCalculator = () => (
    <View style={styles.calculatorContent}>
      <AppInput
        label={t('calculator.ibw.heightWithUnit', { defaultValue: 'Größe (cm)' })}
        style={styles.input}
        keyboardType="numeric"
        value={ibwHeight}
        onChangeText={setIbwHeight}
        placeholder={t('calculator.ibw.heightPlaceholder', { defaultValue: '175' })}
        accessibilityLabel={t('calculator.ibw.height')}
      />
      <AppText style={styles.label}>{t('calculator.ibw.gender')}</AppText>
      <View style={styles.genderContainer} accessibilityRole="radiogroup">
        <TouchableOpacity
          style={[styles.genderButton, ibwGender === 'male' && styles.genderButtonActive]}
          onPress={() => setIbwGender('male')}
          accessibilityRole="radio"
          accessibilityState={{ checked: ibwGender === 'male' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.male')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, ibwGender === 'female' && styles.genderButtonActive]}
          onPress={() => setIbwGender('female')}
          accessibilityRole="radio"
          accessibilityState={{ checked: ibwGender === 'female' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.female')}</AppText>
        </TouchableOpacity>
      </View>
      <AppButton
        title={t('calculator.calculate')}
        onPress={calculateIBW}
        style={styles.calculateButton}
      />
      {ibwResult && (
        <AppText style={styles.result} accessibilityLiveRegion="polite">
          {ibwResult}
        </AppText>
      )}
    </View>
  );

  const renderBMRCalculator = () => (
    <View style={styles.calculatorContent}>
      <AppInput
        label={t('calculator.bmr.weightWithUnit', { defaultValue: 'Gewicht (kg)' })}
        style={styles.input}
        keyboardType="numeric"
        value={bmrWeight}
        onChangeText={setBmrWeight}
        placeholder={t('calculator.bmr.weightPlaceholder', { defaultValue: '70' })}
        accessibilityLabel={t('calculator.bmr.weight')}
      />
      <AppInput
        label={t('calculator.bmr.heightWithUnit', { defaultValue: 'Größe (cm)' })}
        style={styles.input}
        keyboardType="numeric"
        value={bmrHeight}
        onChangeText={setBmrHeight}
        placeholder={t('calculator.bmr.heightPlaceholder', { defaultValue: '175' })}
        accessibilityLabel={t('calculator.bmr.height')}
      />
      <AppInput
        label={t('calculator.bmr.age')}
        style={styles.input}
        keyboardType="numeric"
        value={bmrAge}
        onChangeText={setBmrAge}
        placeholder={t('calculator.bmr.agePlaceholder', { defaultValue: '30' })}
        accessibilityLabel={t('calculator.bmr.age')}
      />
      <AppText style={styles.label}>{t('calculator.bmr.gender')}</AppText>
      <View style={styles.genderContainer} accessibilityRole="radiogroup">
        <TouchableOpacity
          style={[styles.genderButton, bmrGender === 'male' && styles.genderButtonActive]}
          onPress={() => setBmrGender('male')}
          accessibilityRole="radio"
          accessibilityState={{ checked: bmrGender === 'male' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.male')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.genderButton, bmrGender === 'female' && styles.genderButtonActive]}
          onPress={() => setBmrGender('female')}
          accessibilityRole="radio"
          accessibilityState={{ checked: bmrGender === 'female' }}>
          <AppText style={styles.genderButtonText}>{t('patientInfo.female')}</AppText>
        </TouchableOpacity>
      </View>
      <AppButton
        title={t('calculator.calculate')}
        onPress={calculateBMR}
        style={styles.calculateButton}
      />
      {bmrResult && (
        <AppText style={styles.result} accessibilityLiveRegion="polite">
          {bmrResult}
        </AppText>
      )}
    </View>
  );

  return (
    <ScreenContainer testID="calculator-screen" accessibilityLabel="Clinical Calculator">
    <ScrollView style={styles.container}>
      {/* Lab Upload Button (mobile only) */}
      {supportsOCR && (
        <View style={styles.labUploadBar}>
          <AppButton
            title={t('labUpload.importFromLab', { defaultValue: 'Laborwerte importieren' })}
            onPress={handleNavigateToLabUpload}
            style={styles.labUploadButton}
            testID="calculator-lab-upload-button"
          />
        </View>
      )}
      {renderTabButtons()}
      {activeTab === 'bmi' && renderBMICalculator()}
      {activeTab === 'cardio' && renderCardioCalculator()}
      {activeTab === 'egfr' && renderEGFRCalculator()}
      {activeTab === 'ibw' && renderIBWCalculator()}
      {activeTab === 'bmr' && renderBMRCalculator()}
    </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  labUploadBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  labUploadButton: {
    backgroundColor: colors.infoSurface,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  calculatorContent: {
    padding: spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    color: colors.text,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderButton: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderButtonText: {
    fontSize: 16,
    color: colors.text,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: radius.sm,
    marginRight: spacing.sm,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 16,
    color: colors.text,
  },
  calculateButton: {
    marginTop: spacing.xl,
  },
  result: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.infoSurface,
    borderRadius: radius.md,
    fontSize: 16,
    color: colors.infoText,
    lineHeight: 24,
  },
});
