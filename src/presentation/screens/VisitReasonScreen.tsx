import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePatientContext, VisitReason } from '../../application/PatientContext';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';

export const VisitReasonScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { setVisitReason, userRole } = usePatientContext();
    const { isHighContrast } = useTheme();

    const handleReason = (reason: VisitReason) => {
        setVisitReason(reason);
        if (userRole === 'doctor') {
            navigation.navigate('MasterPassword', { mode: 'unlock' });
        } else {
            navigation.navigate('PatientStatus');
        }
    };

    const reasons: { id: VisitReason; label: string }[] = [
        { id: 'termin', label: t('visitReason.optTermin', { defaultValue: 'Termin vereinbaren / Beschwerden' }) },
        { id: 'recipe', label: t('visitReason.optRecipe', { defaultValue: 'Rezept / Folgerezept' }) },
        { id: 'referral', label: t('visitReason.optReferral', { defaultValue: 'Überweisung' }) },
        { id: 'au', label: t('visitReason.optAu', { defaultValue: 'AU (Arbeitsunfähigkeitsbescheinigung)' }) },
        { id: 'documents', label: t('visitReason.optDocuments', { defaultValue: 'Dokumente anfordern' }) },
    ];

    return (
        <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>
                {t('visitReason.title', { defaultValue: 'Was ist der Grund Ihres Besuchs?' })}
            </AppText>

            <ScrollView contentContainerStyle={styles.list}>
                {reasons.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.button, isHighContrast && styles.buttonHighContrast]}
                        onPress={() => handleReason(item.id)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                    >
                        <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                            {item.label}
                        </AppText>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <AppText style={[styles.note, isHighContrast && styles.textHighContrast]}>
                {t('visitReason.note', { defaultValue: 'Hinweis: AU, Rezepte und Überweisungen können erst nach ärztlichem Gespräch erstellt werden.' })}
            </AppText>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
    },
    containerHighContrast: {
        backgroundColor: '#000000',
    },
    title: {
        marginBottom: 30,
        textAlign: 'center',
    },
    textHighContrast: {
        color: '#FFFFFF',
    },
    textHighContrastInverse: {
        color: '#000000',
    },
    list: {
        paddingBottom: 20,
    },
    button: {
        backgroundColor: '#fff',
        paddingVertical: 20,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 2,
    },
    buttonHighContrast: {
        backgroundColor: '#FFFF00', // Yellow
        borderColor: '#000000',
    },
    buttonText: {
        color: '#1f2937',
        textAlign: 'center',
    },
    note: {
        marginTop: 20,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
