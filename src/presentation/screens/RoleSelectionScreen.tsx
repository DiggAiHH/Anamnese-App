import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RootStackParamList } from '../navigation/RootNavigator';
import { usePatientContext } from '../../application/PatientContext';

// type NavigationProp = StackNavigationProp<RootStackParamList, 'RoleSelection'>;

import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';

export const RoleSelectionScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { fontScale, setFontScale, isHighContrast, toggleHighContrast } = useTheme();
    const { setUserRole } = usePatientContext();

    return (
        <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>

            {/* Header / Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.langButton}
                    onPress={() => navigation.navigate('SelectLanguage')}
                >
                    <AppText style={styles.icon}>🌐</AppText>
                    <AppText style={styles.headerText}>{(i18n.language || 'de').toUpperCase()}</AppText>
                </TouchableOpacity>

                <View style={styles.accessControls}>
                    <TouchableOpacity onPress={() => setFontScale(Math.max(0.8, fontScale - 0.1))} style={styles.iconBtn}>
                        <AppText style={styles.icon}>A-</AppText>
                    </TouchableOpacity>

                    <AppText style={styles.headerText}>{Math.round(fontScale * 100)}%</AppText>

                    <TouchableOpacity onPress={() => setFontScale(Math.min(2.0, fontScale + 0.1))} style={styles.iconBtn}>
                        <AppText style={styles.icon}>A+</AppText>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={toggleHighContrast} style={[styles.iconBtn, { marginLeft: 10 }]}>
                        <AppText style={styles.icon}>{isHighContrast ? '⚫' : '⚪'}</AppText>
                    </TouchableOpacity>
                </View>
            </View>

            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>
                {t('roleSelection.title', { defaultValue: 'Wo findet die Anamnese statt?' })}
            </AppText>

            <TouchableOpacity
                style={[styles.button, isHighContrast && styles.buttonHighContrast]}
                onPress={() => { setUserRole('doctor'); navigation.navigate('Privacy'); }}
            >
                <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                    {t('roleSelection.practice', { defaultValue: 'In der Praxis' })}
                </AppText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.patientButton, isHighContrast && styles.buttonHighContrast]}
                onPress={() => { setUserRole('patient'); navigation.navigate('Privacy'); }}
            >
                <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                    {t('roleSelection.private', { defaultValue: 'Privat (Zu Hause)' })}
                </AppText>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.adminLink}
                onPress={() => navigation.navigate('MasterPassword', { mode: 'unlock' })}
            >
                <AppText style={styles.adminText}>{t('roleSelection.admin', { defaultValue: 'Admin / Dashboard' })}</AppText>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 20,
        alignItems: 'center', // Center content horizontally
        justifyContent: 'center', // Center content vertically
    },
    containerHighContrast: {
        backgroundColor: '#000000',
    },
    header: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    langButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 8,
        borderRadius: 20,
    },
    accessControls: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        padding: 5,
        borderRadius: 20,
        gap: 10,
    },
    iconBtn: {
        padding: 5,
    },
    icon: {
        fontSize: 18,
        color: '#333',
    },
    headerText: {
        marginHorizontal: 5,
        fontWeight: 'bold',
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
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 8,
        marginBottom: 20,
        width: '100%',
        maxWidth: 300,
        alignItems: 'center',
    },
    buttonHighContrast: {
        backgroundColor: '#FFFF00', // Yellow
        borderColor: '#FFFFFF',
        borderWidth: 1,
    },
    patientButton: {
        backgroundColor: '#10b981',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    adminLink: {
        marginTop: 30,
    },
    adminText: {
        color: '#9ca3af',
        textDecorationLine: 'underline',
    },
});
