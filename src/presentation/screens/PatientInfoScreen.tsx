import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-native-date-picker';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { PatientEntity, Patient } from '@domain/entities/Patient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SUPPORTED_LANGUAGES } from '../i18n/config';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { colors, spacing, radius } from '../theme/tokens';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientInfo'>;

export const PatientInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { setPatient } = useQuestionnaireStore();

  const normalizeLanguage = (language: string | null | undefined): Patient['language'] => {
    const normalized = (language ?? '').split('-')[0].toLowerCase();
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
      ? (normalized as Patient['language'])
      : 'de';
  };

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [openDateDropdown, setOpenDateDropdown] = useState<'day' | 'month' | 'year' | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = t('validation.required');
    } else if (firstName.length < 2) {
      newErrors.firstName = t('validation.minLength', { count: 2 });
    }

    if (!lastName.trim()) {
      newErrors.lastName = t('validation.required');
    } else if (lastName.length < 2) {
      newErrors.lastName = t('validation.minLength', { count: 2 });
    }

    if (!birthDate) {
      newErrors.birthDate = t('validation.required');
    } else {
      const age = calculateAge(birthDate);
      if (age < 0 || age > 150) {
        newErrors.birthDate = t('validation.invalidDate');
      }
    }

    if (!gender) {
      newErrors.gender = t('validation.required');
    }

    if (email && !isValidEmail(email)) {
      newErrors.email = t('validation.invalidEmail');
    }

    if (phone && !isValidPhone(phone)) {
      newErrors.phone = t('validation.invalidPhone');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validate()) {
      Alert.alert(t('common.error'), t('patientInfo.validationError'), [{ text: t('common.ok') }]);
      return;
    }

    const languageCode = normalizeLanguage(i18n.language);

    // Store patient data in Zustand
    const patient = PatientEntity.create({
      firstName,
      lastName,
      birthDate: birthDate!.toISOString().split('T')[0],
      language: languageCode,
      gender: gender ?? undefined,
      email: email.trim() ? email.trim() : undefined,
      phone: phone.trim() ? phone.trim() : undefined,
    });

    setPatient(patient);

    // Navigate to GDPR consent screen
    navigation.navigate('GDPRConsent');
  };

  const calculateAge = (date: Date): number => {
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    return age;
  };

  const isValidEmail = (email: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const isValidPhone = (phone: string): boolean => {
    // Basic phone validation (international format)
    const regex = /^\+?[0-9\s\-()]{8,20}$/;
    return regex.test(phone);
  };

  const isWindows = Platform.OS === 'windows';
  const today = useMemo(() => new Date(), []);
  const minBirthDate = useMemo(() => new Date(1900, 0, 1), []);

  const years = useMemo(() => {
    const currentYear = today.getFullYear();
    const minYear = 1900;
    const out: number[] = [];
    for (let y = currentYear; y >= minYear; y--) out.push(y);
    return out;
  }, [today]);

  const clampDate = (date: Date): Date => {
    if (date.getTime() > today.getTime()) return new Date(today);
    if (date.getTime() < minBirthDate.getTime()) return new Date(minBirthDate);
    return date;
  };

  const daysInMonth = (year: number, month1to12: number): number => {
    return new Date(year, month1to12, 0).getDate();
  };

  const setBirthDatePart = (next: { year?: number; month?: number; day?: number }) => {
    const base = birthDate ?? today;
    const year = next.year ?? base.getFullYear();
    const month1 = next.month ?? base.getMonth() + 1;
    const maxDay = daysInMonth(year, month1);
    const day = Math.min(next.day ?? base.getDate(), maxDay);

    const nextDate = clampDate(new Date(year, month1 - 1, day));
    setBirthDate(nextDate);
  };

  const closeDateDropdowns = () => setOpenDateDropdown(null);

  return (
    <ScrollView style={styles.container} testID="patient-info-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t('patientInfo.title')}</Text>
        <Text style={styles.subtitle}>{t('patientInfo.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        {/* First Name */}
        <AppInput
          label={t('patientInfo.firstName')}
          required
          value={firstName}
          onChangeText={setFirstName}
          placeholder={t('patientInfo.firstNamePlaceholder')}
          testID="input-first_name"
          autoCapitalize="words"
          autoComplete="name"
          error={errors.firstName}
        />

        {/* Last Name */}
        <AppInput
          label={t('patientInfo.lastName')}
          required
          value={lastName}
          onChangeText={setLastName}
          placeholder={t('patientInfo.lastNamePlaceholder')}
          testID="input-last_name"
          autoCapitalize="words"
          autoComplete="name-family"
          error={errors.lastName}
        />

        {/* Birth Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.birthDate')} <Text style={styles.required}>*</Text>
          </Text>
          {isWindows && !birthDate && (
            <Text style={styles.hintText}>{t('patientInfo.birthDateHint')}</Text>
          )}
          <TouchableOpacity
            style={[
              styles.input,
              styles.dateButton,
              errors.birthDate ? styles.inputError : undefined,
            ]}
            onPress={() => {
              if (isWindows) {
                if (!showDatePicker && !birthDate) {
                  // Match non-Windows behavior where the picker opens with today's date.
                  setBirthDate(today);
                }
                const nextOpen = !showDatePicker;
                setShowDatePicker(nextOpen);
                if (!nextOpen) closeDateDropdowns();
                return;
              }

              setShowDatePicker(true);
            }}
            testID="input-birth_date">
            <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
              {birthDate ? birthDate.toLocaleDateString() : t('patientInfo.birthDatePlaceholder')}
            </Text>
          </TouchableOpacity>
          {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
        </View>

        {/* Date Input */}
        {isWindows ? (
          showDatePicker && (
            <View style={styles.datePickerRow}>
              {(() => {
                const valueDate = birthDate ?? today;
                const selectedDay = valueDate.getDate();
                const selectedMonth = valueDate.getMonth() + 1;
                const selectedYear = valueDate.getFullYear();
                const dayOptions = Array.from(
                  { length: daysInMonth(selectedYear, selectedMonth) },
                  (_, i) => i + 1,
                );

                const renderDropdown = (
                  kind: 'day' | 'month' | 'year',
                  selected: number,
                  options: number[],
                  onSelect: (v: number) => void,
                  testID: string,
                ) => (
                  <View
                    style={[
                      styles.dateDropdownCell,
                      openDateDropdown === kind && styles.dateDropdownCellActive,
                    ]}>
                    <TouchableOpacity
                      style={styles.dateDropdownButton}
                      onPress={() => setOpenDateDropdown(cur => (cur === kind ? null : kind))}
                      testID={testID}>
                      <Text style={styles.dateDropdownText}>{String(selected)}</Text>
                    </TouchableOpacity>

                    {openDateDropdown === kind && (
                      <View style={styles.dateDropdownMenu}>
                        <ScrollView style={styles.dateDropdownScroll}>
                          {options.map(opt => (
                            <TouchableOpacity
                              key={opt}
                              style={styles.dateDropdownOption}
                              onPress={() => {
                                onSelect(opt);
                                closeDateDropdowns();
                              }}
                              testID={`${testID}-opt-${opt}`}>
                              <Text style={styles.dateDropdownOptionText}>{String(opt)}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                );

                return (
                  <>
                    {/* Year first for better UX - helps determine valid days in month */}
                    {renderDropdown(
                      'year',
                      selectedYear,
                      years,
                      v => setBirthDatePart({ year: v }),
                      'dropdown-birth_year',
                    )}
                    {renderDropdown(
                      'month',
                      selectedMonth,
                      Array.from({ length: 12 }, (_, i) => i + 1),
                      v => setBirthDatePart({ month: v }),
                      'dropdown-birth_month',
                    )}
                    {renderDropdown(
                      'day',
                      selectedDay,
                      dayOptions,
                      v => setBirthDatePart({ day: v }),
                      'dropdown-birth_day',
                    )}
                  </>
                );
              })()}
            </View>
          )
        ) : (
          <DatePicker
            modal
            open={showDatePicker}
            date={birthDate || new Date()}
            mode="date"
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onConfirm={(date: Date) => {
              setShowDatePicker(false);
              setBirthDate(date);
            }}
            onCancel={() => setShowDatePicker(false)}
            title={t('patientInfo.selectBirthDate')}
          />
        )}

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.gender')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, gender === 'male' && styles.radioButtonSelected]}
              onPress={() => setGender('male')}
              testID="input-gender-male">
              <View style={styles.radio}>
                {gender === 'male' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.male')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioButton, gender === 'female' && styles.radioButtonSelected]}
              onPress={() => setGender('female')}
              testID="input-gender-female">
              <View style={styles.radio}>
                {gender === 'female' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.female')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.radioButton, gender === 'other' && styles.radioButtonSelected]}
              onPress={() => setGender('other')}
              testID="input-gender-other">
              <View style={styles.radio}>
                {gender === 'other' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.other')}</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
        </View>

        {/* Email (Optional) */}
        <AppInput
          label={t('patientInfo.email')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('patientInfo.emailPlaceholder')}
          testID="input-email"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
        />

        {/* Phone (Optional) */}
        <AppInput
          label={t('patientInfo.phone')}
          value={phone}
          onChangeText={setPhone}
          placeholder={t('patientInfo.phonePlaceholder')}
          testID="input-phone"
          keyboardType="phone-pad"
          autoComplete="tel"
          error={errors.phone}
        />
      </View>

      {/* Next Button */}
      <AppButton
        label={t('patientInfo.toConsents')}
        onPress={handleNext}
        testID="patient-info-next-btn"
        style={styles.nextButton}
      />

      <Text style={styles.requiredNote}>
        <Text style={styles.required}>*</Text> {t('common.requiredField')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  form: {
    padding: spacing.xl,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  required: {
    color: colors.dangerText,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.textPrimary,
  },
  inputError: {
    borderColor: colors.dangerBorder,
  },
  errorText: {
    color: colors.dangerText,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  hintText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
    fontStyle: 'italic',
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: colors.textPrimary,
  },
  datePlaceholder: {
    color: colors.textSecondary,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    marginTop: -spacing.md,
    marginBottom: spacing.xl,
  },
  dateDropdownCell: {
    flex: 1,
    position: 'relative',
  },
  dateDropdownCellActive: {
    zIndex: 50,
  },
  dateDropdownButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateDropdownText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  dateDropdownMenu: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    maxHeight: 220,
    overflow: 'hidden',
  },
  dateDropdownScroll: {
    maxHeight: 220,
  },
  dateDropdownOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  dateDropdownOptionText: {
    color: colors.textPrimary,
    fontSize: 14,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  radioButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.infoSurface,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  nextButton: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  requiredNote: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xxxl,
  },
});
