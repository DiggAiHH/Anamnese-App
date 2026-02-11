import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  // Platform,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { useTranslation } from 'react-i18next';
// import DatePicker from 'react-native-date-picker';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { Patient } from '@domain/entities/Patient';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { SUPPORTED_LANGUAGES } from '../i18n/config';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { FieldExplanation } from '../components/FieldExplanation';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors, spacing, radius } from '../theme/tokens';
import { usePatientContext } from '../../application/PatientContext';
import { CreatePatientUseCase, CreatePatientInput } from '../../application/use-cases/CreatePatientUseCase';
import { SQLitePatientRepository } from '../../infrastructure/persistence/SQLitePatientRepository';
import { SQLiteGDPRConsentRepository } from '../../infrastructure/persistence/SQLiteGDPRConsentRepository';
import { database } from '../../infrastructure/persistence/DatabaseConnection';
import { useUnsavedChangesGuard } from '../hooks/useUnsavedChangesGuard';

type Props = StackScreenProps<RootStackParamList, 'PatientInfo'>;

export const PatientInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { setPatient, encryptionKey } = useQuestionnaireStore();
  useTheme();
  const { patientStatus, visitReason, insuranceNumber, setInsuranceNumber, birthDate: ctxBirthDate, setBirthDate: setCtxBirthDate, insuranceType, setInsuranceType } = usePatientContext();

  const isReturning = patientStatus === 'returning';

  const normalizeLanguage = (language: string | null | undefined): Patient['language'] => {
    const normalized = (language ?? '').split('-')[0].toLowerCase();
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(normalized)
      ? (normalized as Patient['language'])
      : 'de';
  };

  // Local state for New Patient fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [localBirthDate, setLocalBirthDate] = useState<Date | null>(null); // For legacy date picker if needed, but we prefer dropdowns now
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Address State
  const [street, setStreet] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [zip, setZip] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('DE'); // Default Germany

  // Returning Patient State
  const [hasDataChanged, setHasDataChanged] = useState(false);

  // Dropdown state
  const [openDateDropdown, setOpenDateDropdown] = useState<'day' | 'month' | 'year' | null>(null);

  // Insurance Number is in Context (shared)

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Unsaved changes guard
  const isDirty = Boolean(firstName || lastName || email || phone || street || houseNumber || zip || city || insuranceNumber);
  useUnsavedChangesGuard(navigation, isDirty);
  // Sync context birthdate to local Date object (legacy compat)
  // useEffect(() => {
  //   if (ctxBirthDate.year && ctxBirthDate.month && ctxBirthDate.day) {
  //     // setLocalBirthDate(new Date(parseInt(ctxBirthDate.year), parseInt(ctxBirthDate.month) - 1, parseInt(ctxBirthDate.day)));
  //   }
  // }, [ctxBirthDate]);


  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Common Validation
    if (!ctxBirthDate.day || !ctxBirthDate.month || !ctxBirthDate.year) {
      newErrors.birthDate = t('validation.required');
    }

    if (isReturning) {
      // Returning Patient Validation
      if (!insuranceNumber.trim()) {
        newErrors.insuranceNumber = t('validation.required');
      }
    } else {
      // New Patient (or Returning + Changed) Validation
      // Unicode-aware name regex: allows Latin, accented, Cyrillic, Arabic, CJK, etc.
      // Min 2 chars (some names like "Li" are valid), no digits
      const nameRegex = /^[\p{L}\p{M}\s'-]{2,}$/u;

      if (!firstName.trim()) newErrors.firstName = t('validation.required');
      else if (!nameRegex.test(firstName.trim())) newErrors.firstName = t('validation.nameInvalid', { defaultValue: 'Min. 2 Buchstaben, keine Zahlen' });

      if (!lastName.trim()) newErrors.lastName = t('validation.required');
      else if (!nameRegex.test(lastName.trim())) newErrors.lastName = t('validation.nameInvalid');

      if (!gender) newErrors.gender = t('validation.required');
      if (!isReturning && !insuranceType) newErrors.insuranceType = t('validation.required');

      if (!insuranceNumber.trim()) newErrors.insuranceNumber = t('validation.required');

      // Email validation (optional but must be valid if provided)
      if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        newErrors.email = t('validation.emailInvalid', { defaultValue: 'Ungültige E-Mail-Adresse' });
      }

      // Age Check > 3
      if (ctxBirthDate.year) {
        const birthYear = parseInt(ctxBirthDate.year);
        const currentYear = new Date().getFullYear();
        if (currentYear - birthYear < 3) {
          newErrors.birthDate = t('validation.tooYoung', { defaultValue: 'Patient muss mindestens 3 Jahre alt sein' });
        }
      }

      // Address Validation
      if (!street.trim()) newErrors.street = t('validation.required');
      if (!houseNumber.trim()) newErrors.houseNumber = t('validation.required');
      // Accepts: "12", "12a", "12-14", "12/3", "12 A"
      else if (!/^[\d]+[\w\s\-\/]*$/.test(houseNumber.trim())) newErrors.houseNumber = t('validation.houseNumberInvalid', { defaultValue: 'z.B. 12, 12a, 12-14' });

      if (!zip.trim()) newErrors.zip = t('validation.required');
      // German PLZ: exactly 5 digits
      else if (country === 'DE' && !/^\d{5}$/.test(zip.trim())) {
        newErrors.zip = t('validation.plzInvalid', { defaultValue: 'PLZ muss 5 Ziffern haben' });
      }
      if (!city.trim()) newErrors.city = t('validation.required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validate()) {
      Alert.alert(t('common.error'), t('patientInfo.validationError'), [{ text: t('common.ok') }]);
      return;
    }

    if (!encryptionKey) {
      Alert.alert(t('common.error'), t('error.missingKey', { defaultValue: 'Verschlüsselungsschlüssel fehlt. Bitte Neustart.' }));
      return;
    }

    const languageCode = normalizeLanguage(i18n.language);
    const fName = isReturning ? 'Returning' : firstName;
    const lName = isReturning ? 'Patient' : lastName;
    const bDate = `${ctxBirthDate.year}-${ctxBirthDate.month.padStart(2, '0')}-${ctxBirthDate.day.padStart(2, '0')}`;

    try {
      // clean architecture: Use Case
      const patientRepo = new SQLitePatientRepository();
      const gdprRepo = new SQLiteGDPRConsentRepository(database);
      const useCase = new CreatePatientUseCase(patientRepo, gdprRepo);

      // Prepare proper input
      const input: CreatePatientInput = {
        firstName: fName,
        lastName: lName,
        birthDate: bDate,
        language: languageCode,
        gender: gender ?? undefined,
        email: isReturning ? undefined : (email.trim() || undefined),
        phone: isReturning && !hasDataChanged ? undefined : (phone.trim() || undefined),
        insurance: insuranceType ?? undefined,
        insuranceNumber: insuranceNumber,
        address: (isReturning && !hasDataChanged) ? undefined : {
          street,
          houseNumber,
          zip,
          city,
          country
        },
        encryptionKey,
        consents: {
          dataProcessing: true, // Implied by Privacy Screen acceptance
          dataStorage: true,
          ocrProcessing: false,
          voiceRecognition: false
        }
      };

      const result = await useCase.execute(input);

      if (!result.success || !result.patientId) {
        throw new Error(result.error ?? 'Unknown Error creating patient');
      }

      // Fetch back the full entity to put in store
      // Note: Repository.findById should handle decryption if key is set active
      const savedPatient = await patientRepo.findById(result.patientId);

      if (!savedPatient) {
        throw new Error('Verification failed: Patient not found after save.');
      }

      setPatient(savedPatient);

      // Flow Logic
      if (visitReason === 'termin') {
        navigation.navigate('Questionnaire'); // Start Anamnese
      } else {
        // Direct Submit / Summary
        navigation.navigate('Summary', { questionnaireId: 'reason-only' });
      }

    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : 'Save Failed');
    }
  };

  // Helper for Date Dropdowns (with day-clamping when month/year changes)
  const updateDatePart = (part: 'day' | 'month' | 'year', val: string) => {
    const updated = { ...ctxBirthDate, [part]: val };

    // Auto-clamp day if month or year changed and current day exceeds new month's max
    if ((part === 'month' || part === 'year') && updated.day && updated.month && updated.year) {
      const maxDay = new Date(parseInt(updated.year), parseInt(updated.month), 0).getDate();
      if (parseInt(updated.day) > maxDay) {
        updated.day = String(maxDay);
      }
    }

    setCtxBirthDate(updated);
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const years = Array.from({ length: 110 }, (_, i) => String(currentYear - i));
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const daysInSelectedMonth = ctxBirthDate.year && ctxBirthDate.month
    ? new Date(parseInt(ctxBirthDate.year), parseInt(ctxBirthDate.month), 0).getDate()
    : 31;
  const days = Array.from({ length: daysInSelectedMonth }, (_, i) => String(i + 1));


  const renderDateDropdowns = () => (
    <View style={styles.datePickerRow}>
      {/* Day */}
      <View style={[styles.dateDropdownCell, openDateDropdown === 'day' && styles.dateDropdownCellActive]}>
        <AppText style={styles.dropdownLabel}>{t('patientInfo.dayLabel', { defaultValue: 'Tag' })}</AppText>
        <TouchableOpacity style={styles.dateDropdownButton} onPress={() => setOpenDateDropdown(openDateDropdown === 'day' ? null : 'day')}>
          <AppText style={styles.dateDropdownText}>{ctxBirthDate.day || t('patientInfo.dayPlaceholder', { defaultValue: 'TT' })}</AppText>
        </TouchableOpacity>
        {openDateDropdown === 'day' && (
          <View style={styles.dateDropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {days.map(d => (
                <TouchableOpacity key={d} style={styles.dateDropdownOption} onPress={() => { updateDatePart('day', d); setOpenDateDropdown(null); }}>
                  <AppText>{d}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Month */}
      <View style={[styles.dateDropdownCell, openDateDropdown === 'month' && styles.dateDropdownCellActive]}>
        <AppText style={styles.dropdownLabel}>{t('patientInfo.monthLabel', { defaultValue: 'Monat' })}</AppText>
        <TouchableOpacity style={styles.dateDropdownButton} onPress={() => setOpenDateDropdown(openDateDropdown === 'month' ? null : 'month')}>
          <AppText style={styles.dateDropdownText}>{ctxBirthDate.month || t('patientInfo.monthPlaceholder', { defaultValue: 'MM' })}</AppText>
        </TouchableOpacity>
        {openDateDropdown === 'month' && (
          <View style={styles.dateDropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {months.map(m => (
                <TouchableOpacity key={m} style={styles.dateDropdownOption} onPress={() => { updateDatePart('month', m); setOpenDateDropdown(null); }}>
                  <AppText>{m}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Year */}
      <View style={[styles.dateDropdownCell, openDateDropdown === 'year' && styles.dateDropdownCellActive]}>
        <AppText style={styles.dropdownLabel}>{t('patientInfo.yearLabel', { defaultValue: 'Jahr' })}</AppText>
        <TouchableOpacity style={styles.dateDropdownButton} onPress={() => setOpenDateDropdown(openDateDropdown === 'year' ? null : 'year')}>
          <AppText style={styles.dateDropdownText}>{ctxBirthDate.year || t('patientInfo.yearPlaceholder', { defaultValue: 'JJJJ' })}</AppText>
        </TouchableOpacity>
        {openDateDropdown === 'year' && (
          <View style={styles.dateDropdownMenu}>
            <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
              {years.map(y => (
                <TouchableOpacity key={y} style={styles.dateDropdownOption} onPress={() => { updateDatePart('year', y); setOpenDateDropdown(null); }}>
                  <AppText>{y}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ScreenContainer testID="patient-info-screen" accessibilityLabel="Patient Information">
    <ScrollView style={styles.container} testID="patient-info-screen" nestedScrollEnabled keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <AppText style={styles.title}>{isReturning ? t('patientInfo.titleReturning', { defaultValue: 'Willkommen zurück' }) : t('patientInfo.titleNew', { defaultValue: 'Neue Patientenaufnahme' })}</AppText>
        <AppText style={styles.subtitle}>{isReturning ? t('patientInfo.subtitleReturning', { defaultValue: 'Bitte identifizieren Sie sich.' }) : t('patientInfo.subtitleNew', { defaultValue: 'Bitte geben Sie Ihre Daten ein.' })}</AppText>
      </View>

      <View style={styles.form}>

        {/* NEW PATIENT: Insurance Type */}
        {!isReturning && (
          <View style={styles.inputGroup}>
            <AppText style={styles.label}>{t('patientInfo.insuranceType', { defaultValue: 'Versicherungsart' })} <AppText style={styles.required}>*</AppText></AppText>
            <View style={styles.radioGroup}>
              <TouchableOpacity style={[styles.radioButton, insuranceType === 'public' && styles.radioButtonSelected]} onPress={() => setInsuranceType('public')}>
                <View style={styles.radio}>{insuranceType === 'public' && <View style={styles.radioSelected} />}</View>
                <AppText style={styles.radioLabel}>{t('patientInfo.insurancePublic', { defaultValue: 'Gesetzlich' })}</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.radioButton, insuranceType === 'private' && styles.radioButtonSelected]} onPress={() => setInsuranceType('private')}>
                <View style={styles.radio}>{insuranceType === 'private' && <View style={styles.radioSelected} />}</View>
                <AppText style={styles.radioLabel}>{t('patientInfo.insurancePrivate', { defaultValue: 'Privat' })}</AppText>
              </TouchableOpacity>
            </View>
            {errors.insuranceType && <AppText style={styles.errorText}>{errors.insuranceType}</AppText>}
          </View>
        )}

        {/* SHARED: Insurance Number */}
        <AppInput
          label={t('patientInfo.insuranceNumber', { defaultValue: 'Versicherungsnummer' })}
          required
          value={insuranceNumber}
          onChangeText={setInsuranceNumber}
          placeholder={t('patientInfo.insuranceNumberPlaceholder', { defaultValue: 'z.B. A123456789' })}
          error={errors.insuranceNumber}
        />

        {/* SHARED: DOB (Dropdowns) */}
        <View style={styles.inputGroup}>
          <AppText style={styles.label}>{t('patientInfo.birthDate')} <AppText style={styles.required}>*</AppText></AppText>
          {renderDateDropdowns()}
          {errors.birthDate && <AppText style={styles.errorText}>{errors.birthDate}</AppText>}
        </View>


        {/* Returning Patient: Data Changed Toggle */}
        {isReturning && (
          <View style={styles.toggleSection}>
            <TouchableOpacity style={styles.toggleContainer} onPress={() => setHasDataChanged(!hasDataChanged)}>
              <View style={[styles.checkbox, hasDataChanged && styles.checkboxChecked]} />
              <AppText style={styles.toggleLabel}>{t('patientInfo.dataChanged', { defaultValue: 'Meine persönlichen Daten haben sich geändert' })}</AppText>
            </TouchableOpacity>
            <AppText style={styles.toggleHint}>
              {t('patientInfo.dataChangedHint', {
                defaultValue: 'Aktivieren Sie diese Option, wenn sich Ihre Adresse, Telefonnummer oder andere persönliche Daten seit dem letzten Besuch geändert haben.',
              })}
            </AppText>
          </View>
        )}

        {/* DETAILS: Show if New Patient OR (Returning AND Data Changed) */}
        {(!isReturning || hasDataChanged) && (
          <>
            <AppInput
              label={t('patientInfo.firstName')}
              required
              value={firstName}
              onChangeText={setFirstName}
              error={errors.firstName}
              placeholder={t('patientInfo.namePlaceholder', { defaultValue: 'Min. 3 Buchstaben' })}
            />
            <AppInput
              label={t('patientInfo.lastName')}
              required
              value={lastName}
              onChangeText={setLastName}
              error={errors.lastName}
            />

            <View style={styles.inputGroup}>
              <AppText style={styles.label}>{t('patientInfo.gender')} <AppText style={styles.required}>*</AppText></AppText>
              <View style={styles.radioGroup}>
                <TouchableOpacity style={[styles.radioButton, gender === 'male' && styles.radioButtonSelected]} onPress={() => setGender('male')}>
                  <View style={styles.radio}>{gender === 'male' && <View style={styles.radioSelected} />}</View>
                  <AppText>{t('patientInfo.male', { defaultValue: 'Männlich' })}</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, gender === 'female' && styles.radioButtonSelected]} onPress={() => setGender('female')}>
                  <View style={styles.radio}>{gender === 'female' && <View style={styles.radioSelected} />}</View>
                  <AppText>{t('patientInfo.female', { defaultValue: 'Weiblich' })}</AppText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.radioButton, gender === 'other' && styles.radioButtonSelected]} onPress={() => setGender('other')}>
                  <View style={styles.radio}>{gender === 'other' && <View style={styles.radioSelected} />}</View>
                  <AppText>{t('patientInfo.other', { defaultValue: 'Divers' })}</AppText>
                </TouchableOpacity>
              </View>
              {errors.gender && <AppText style={styles.errorText}>{errors.gender}</AppText>}
            </View>

            {/* ADDRESS SECTION */}
            <AppText style={styles.sectionHeader}>{t('patientInfo.address', { defaultValue: 'Adresse' })}</AppText>

            <AppInput label={t('patientInfo.country')} value={country} onChangeText={setCountry} placeholder={t('patientInfo.countryPlaceholder', { defaultValue: 'Land (z.B. DE)' })} />

            <View style={styles.row}>
              <View style={{ flex: 3, marginRight: 10 }}>
                <AppInput label={t('patientInfo.street')} required value={street} onChangeText={setStreet} error={errors.street} />
              </View>
              <View style={{ flex: 1 }}>
                <AppInput label={t('patientInfo.houseNumber')} required value={houseNumber} onChangeText={setHouseNumber} error={errors.houseNumber} keyboardType="numeric" />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1.5, marginRight: 10 }}>
                <AppInput label={t('patientInfo.zip')} required value={zip} onChangeText={setZip} error={errors.zip} keyboardType="numeric" />
              </View>
              <View style={{ flex: 3 }}>
                <AppInput label={t('patientInfo.city')} required value={city} onChangeText={setCity} error={errors.city} />
              </View>
            </View>

            <AppInput label={t('patientInfo.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
            <FieldExplanation
              hint={t('patientInfo.emailWhy', { defaultValue: 'Für Terminbestätigungen und Befundmitteilungen.' })}
              consequence={t('patientInfo.emailWithout', { defaultValue: 'Ohne E-Mail erhalten Sie keine digitalen Benachrichtigungen.' })}
              variant="info"
              testID="hint-email"
            />
            <AppInput label={t('patientInfo.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <FieldExplanation
              hint={t('patientInfo.phoneWhy', { defaultValue: 'Für dringende Rückfragen zu Ihrer Behandlung.' })}
              consequence={t('patientInfo.phoneWithout', { defaultValue: 'Ohne Telefonnummer können wir Sie nicht kurzfristig erreichen.' })}
              variant="info"
              testID="hint-phone"
            />
          </>
        )}

      </View>

      <AppButton
        label={t('common.next')}
        onPress={handleNext}
        style={styles.nextButton}
      />

      <View style={{ height: 100 }} />
    </ScrollView>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, backgroundColor: colors.surface, borderBottomWidth: 1, borderColor: colors.divider },
  title: { color: colors.textPrimary },
  subtitle: { color: colors.textSecondary },
  form: { padding: spacing.xl, zIndex: 1 }, // FIX: form zIndex for dropdown layering
  inputGroup: { marginBottom: spacing.xl, zIndex: 1 }, // FIX: input group zIndex
  label: { marginBottom: spacing.sm, color: colors.textPrimary },
  dropdownLabel: { marginBottom: 4, color: colors.textPrimary },
  required: { color: colors.dangerText },
  errorText: { color: colors.dangerText, marginTop: 4 },
  nextButton: { marginHorizontal: spacing.xl, marginTop: spacing.xl },

  // High Contrast
  textHighContrast: { color: '#ffffff' },
  textHighContrastInverse: { color: '#000000' },
  bgHighContrast: { backgroundColor: '#000000' },
  surfaceHighContrast: { backgroundColor: '#ffffff' },
  borderHighContrast: { borderColor: '#000000' },

  // Radio
  radioGroup: { flexDirection: 'row', gap: spacing.md, flexWrap: 'wrap' },
  radioButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, minWidth: 100 },
  radioButtonSelected: { borderColor: colors.primary, backgroundColor: colors.infoSurface },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  radioSelected: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  radioLabel: { color: colors.textPrimary },

  // Date Picker Custom Row
  datePickerRow: { flexDirection: 'row', gap: spacing.md, zIndex: 100 },
  dateDropdownCell: { flex: 1, position: 'relative', zIndex: 1 },
  dateDropdownCellActive: { zIndex: 9999 }, // FIX: Elevate active dropdown (K1-2: dropdown z-index)
  dateDropdownButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' },
  dateDropdownText: { color: colors.textPrimary },
  dateDropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface || '#FFFFFF', // FIX: Ensure opaque background
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    zIndex: 10000,
    elevation: 20, // FIX: Higher elevation for Android
    maxHeight: 200,
    shadowColor: '#000', // FIX: Add shadow for iOS
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dateDropdownOption: { padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.background, backgroundColor: colors.surface || '#FFFFFF' },

  // New Styles
  row: { flexDirection: 'row' },
  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.md, color: colors.textPrimary },
  toggleSection: { marginBottom: spacing.lg },
  toggleContainer: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  toggleHint: { fontSize: 12, color: colors.textMuted, marginLeft: 40, marginTop: 4, lineHeight: 16 },
  checkbox: { width: 24, height: 24, borderWidth: 2, borderColor: colors.primary, borderRadius: 4, marginRight: spacing.md },
  checkboxChecked: { backgroundColor: colors.primary },
  toggleLabel: { color: colors.textPrimary },
});
