import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePatientContext } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';

export const PatientStatusScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { isHighContrast } = useTheme();
    const { setPatientStatus } = usePatientContext();

    const handleSelect = (status: 'new' | 'returning') => {
        setPatientStatus(status);
        navigation.navigate('PatientInfo');
    };

    return (
        <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>
                {t('patientStatus.title', { defaultValue: 'Waren Sie schon einmal bei uns?' })}
            </AppText>

            <TouchableOpacity
                style={[styles.button, isHighContrast && styles.buttonHighContrast]}
                onPress={() => handleSelect('returning')}
                accessibilityRole="button"
                accessibilityLabel={t('patientStatus.returning')}
            >
                <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                    {t('patientStatus.returning', { defaultValue: 'Ja, ich bin bereits Patient' })}
                </AppText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.newButton, isHighContrast && styles.buttonHighContrast]}
                onPress={() => handleSelect('new')}
                accessibilityRole="button"
                accessibilityLabel={t('patientStatus.new')}
            >
                <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                    {t('patientStatus.new', { defaultValue: 'Nein, ich bin neu hier' })}
                </AppText>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 20,
    },
    containerHighContrast: {
        backgroundColor: '#000000',
    },
    title: {
        marginBottom: 40,
        textAlign: 'center',
    },
    textHighContrast: {
        color: '#FFFFFF',
    },
    textHighContrastInverse: {
        color: '#000000',
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        maxWidth: 350,
        alignItems: 'center',
    },
    buttonHighContrast: {
        backgroundColor: '#FFFF00', // Yellow
        borderColor: '#000000',
    },
    newButton: {
        backgroundColor: '#0891b2',
    },
    buttonText: {
        color: '#fff',
    },
});
