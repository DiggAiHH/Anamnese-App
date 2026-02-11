import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { usePatientContext } from '../../application/PatientContext';
import { UserRole } from '../../domain/entities/UserRole';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';

export const RoleSelectionScreen = () => {
    const navigation = useNavigation<any>();
    const { t, i18n } = useTranslation();
    const { fontScale, setFontScale, isHighContrast, toggleHighContrast } = useTheme();
    const { setUserRole, userRole, resetPatientData } = usePatientContext();

    /**
     * Handles role selection with switch confirmation.
     * If a different role is already active, warn and reset patient data.
     */
    const handleSelectRole = useCallback((role: UserRole) => {
        const applyRole = () => {
            setUserRole(role);
            navigation.navigate('Privacy');
        };

        // If switching from an already-set different role, confirm first
        if (userRole !== null && userRole !== role) {
            Alert.alert(
                t('roleSelection.switchConfirmTitle', { defaultValue: 'Rolle wechseln?' }),
                t('roleSelection.switchConfirmMessage', {
                    defaultValue: 'Wenn Sie die Rolle wechseln, werden laufende Eingaben zurückgesetzt.',
                }),
                [
                    { text: t('common.cancel', { defaultValue: 'Abbrechen' }), style: 'cancel' },
                    {
                        text: t('roleSelection.switchConfirm', { defaultValue: 'Wechseln' }),
                        style: 'destructive',
                        onPress: () => {
                            resetPatientData();
                            applyRole();
                        },
                    },
                ],
            );
        } else {
            applyRole();
        }
    }, [userRole, setUserRole, resetPatientData, navigation, t]);

    return (
        <ScreenContainer testID="role-selection-screen" accessibilityLabel="Role Selection">
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
                onPress={() => handleSelectRole(UserRole.DOCTOR)}
                testID="btn-role-doctor"
            >
                <AppText style={[styles.buttonText, isHighContrast && styles.textHighContrastInverse]}>
                    {t('roleSelection.practice', { defaultValue: 'In der Praxis' })}
                </AppText>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.button, styles.patientButton, isHighContrast && styles.buttonHighContrast]}
                onPress={() => handleSelectRole(UserRole.PATIENT)}
                testID="btn-role-patient"
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

            <TouchableOpacity
                style={[styles.button, styles.therapistButton]}
                onPress={() => navigation.navigate('Login')}
            >
                <AppText style={[styles.buttonText]}>
                    {t('roleSelection.therapistLogin', { defaultValue: 'Therapeuten-Login' })}
                </AppText>
            </TouchableOpacity>
        </View>
        </ScreenContainer>
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
    therapistButton: {
        backgroundColor: '#7c3aed',
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
