import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DatePicker from 'react-native-date-picker';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { PatientEntity, Patient } from '@domain/entities/Patient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'PatientInfo'>;

export const PatientInfoScreen: React.FC<Props> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { setPatient } = useQuestionnaireStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      Alert.alert(
        t('common.error'),
        t('patientInfo.validationError'),
        [{ text: t('common.ok') }]
      );
      return;
    }

    const languageCode = (i18n.language?.split('-')[0] ?? 'de') as Patient['language'];

    // Store patient data in Zustand
    const patient = PatientEntity.create({
      firstName,
      lastName,
      birthDate: birthDate!.toISOString().split('T')[0],
      language: languageCode,
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

  return (
    <ScrollView style={styles.container} testID="patient-info-screen">
      <View style={styles.header}>
        <Text style={styles.title}>{t('patientInfo.title')}</Text>
        <Text style={styles.subtitle}>{t('patientInfo.subtitle')}</Text>
      </View>

      <View style={styles.form}>
        {/* First Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.firstName')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.firstName ? styles.inputError : undefined]}
            value={firstName}
            onChangeText={setFirstName}
            placeholder={t('patientInfo.firstNamePlaceholder')}
            testID="input-first_name"
            autoCapitalize="words"
            autoComplete="name"
          />
          {errors.firstName && (
            <Text style={styles.errorText}>{errors.firstName}</Text>
          )}
        </View>

        {/* Last Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.lastName')} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[styles.input, errors.lastName ? styles.inputError : undefined]}
            value={lastName}
            onChangeText={setLastName}
            placeholder={t('patientInfo.lastNamePlaceholder')}
            testID="input-last_name"
            autoCapitalize="words"
            autoComplete="name-family"
          />
          {errors.lastName && (
            <Text style={styles.errorText}>{errors.lastName}</Text>
          )}
        </View>

        {/* Birth Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.birthDate')} <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
              style={[styles.input, styles.dateButton, errors.birthDate ? styles.inputError : undefined]}
            onPress={() => setShowDatePicker(true)}
            testID="input-birth_date"
          >
            <Text style={birthDate ? styles.dateText : styles.datePlaceholder}>
              {birthDate
                ? birthDate.toLocaleDateString()
                : t('patientInfo.birthDatePlaceholder')}
            </Text>
          </TouchableOpacity>
          {errors.birthDate && (
            <Text style={styles.errorText}>{errors.birthDate}</Text>
          )}
        </View>

        {/* Date Picker Modal */}
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

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            {t('patientInfo.gender')} <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioButton,
                gender === 'male' && styles.radioButtonSelected,
              ]}
              onPress={() => setGender('male')}
              testID="input-gender-male"
            >
              <View style={styles.radio}>
                {gender === 'male' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.male')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                gender === 'female' && styles.radioButtonSelected,
              ]}
              onPress={() => setGender('female')}
              testID="input-gender-female"
            >
              <View style={styles.radio}>
                {gender === 'female' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.female')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.radioButton,
                gender === 'other' && styles.radioButtonSelected,
              ]}
              onPress={() => setGender('other')}
              testID="input-gender-other"
            >
              <View style={styles.radio}>
                {gender === 'other' && <View style={styles.radioSelected} />}
              </View>
              <Text style={styles.radioLabel}>{t('patientInfo.other')}</Text>
            </TouchableOpacity>
          </View>
          {errors.gender && (
            <Text style={styles.errorText}>{errors.gender}</Text>
          )}
        </View>

        {/* Email (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('patientInfo.email')}</Text>
          <TextInput
            style={[styles.input, errors.email ? styles.inputError : undefined]}
            value={email}
            onChangeText={setEmail}
            placeholder={t('patientInfo.emailPlaceholder')}
            testID="input-email"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          {errors.email && (
            <Text style={styles.errorText}>{errors.email}</Text>
          )}
        </View>

        {/* Phone (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('patientInfo.phone')}</Text>
          <TextInput
            style={[styles.input, errors.phone ? styles.inputError : undefined]}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('patientInfo.phonePlaceholder')}
            testID="input-phone"
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {errors.phone && (
            <Text style={styles.errorText}>{errors.phone}</Text>
          )}
        </View>
      </View>

      {/* Next Button */}
      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
        testID="patient-info-next-btn"
      >
        <Text style={styles.nextButtonText}>{t('common.next')}</Text>
      </TouchableOpacity>

      <Text style={styles.requiredNote}>
        <Text style={styles.required}>*</Text> {t('common.requiredField')}
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    justifyContent: 'center',
  },
  dateText: {
    color: '#1F2937',
  },
  datePlaceholder: {
    color: '#9CA3AF',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  radioButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
  },
  radioButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3B82F6',
  },
  radioLabel: {
    fontSize: 14,
    color: '#374151',
  },
  nextButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  requiredNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 40,
  },
});
