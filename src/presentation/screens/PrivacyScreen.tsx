import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';

/**
 * PrivacyScreen - Displays privacy policy and obtains user consent
 *
 * @security This screen ONLY handles consent. Key generation/derivation is handled
 * exclusively by MasterPasswordScreen using PBKDF2 (100k iterations).
 * No key material is generated or stored here.
 *
 * Flow: PrivacyScreen (consent) → MasterPasswordScreen (setup) → VisitReason
 */
export const PrivacyScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { isHighContrast } = useTheme();
    const [accepted, setAccepted] = useState(false);

    const handleNext = () => {
        if (accepted) {
            // Navigate to MasterPasswordScreen in 'setup' mode for initial key derivation
            navigation.navigate('MasterPassword', { mode: 'setup' });
        }
    };

    return (
        <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>{t('privacy.title', { defaultValue: 'Datenschutzerklärung' })}</AppText>

            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                <AppText style={styles.text}>
                    {t('privacy.intro', { defaultValue: 'Transparente Datenschutzerklärung:' })}
                    {'\n\n'}
                    {t('privacy.content_1', { defaultValue: 'Ihre Daten gehören Ihnen. Die Anamnese-App speichert alle persönlichen und medizinischen Daten ausschließlich lokal auf diesem Gerät.' })}
                    {'\n\n'}
                    {t('privacy.content_2', { defaultValue: 'Für Backup-Zwecke und die Übermittlung an die Praxis werden Ihre Daten vollständig anonymisiert. Persönliche Informationen (Name, Adresse) werden vom medizinischen Fragebogen getrennt und separat verschlüsselt.' })}
                    {'\n\n'}
                    {t('privacy.content_3', { defaultValue: 'Niemals werden unverschlüsselte Klardaten an externe Server gesendet. Die DiggAiHH Datenbank dient lediglich als verschlüsselter Zwischenspeicher (Relay) ohne Einsicht in Ihre Daten.' })}
                    {'\n\n'}
                    {t('privacy.encryption_note', { defaultValue: 'Nach Akzeptanz werden Sie aufgefordert, ein Master-Passwort zu erstellen. Dieses Passwort wird zur sicheren Verschlüsselung (AES-256) Ihrer Daten verwendet.' })}
                </AppText>
            </ScrollView>

            <View style={styles.footerContainer}>
                <TouchableOpacity
                    style={[styles.checkboxContainer, accepted && styles.checkboxActive]}
                    onPress={() => setAccepted(!accepted)}
                >
                    <View style={[styles.checkbox, accepted && styles.checkboxChecked]} />
                    <AppText style={styles.checkboxLabel}>
                        {t('privacy.accept', { defaultValue: 'Ich habe die Datenschutzerklärung gelesen und akzeptiere sie.' })}
                    </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, !accepted && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!accepted}
                >
                    <AppText style={styles.buttonText}>{t('common.next', { defaultValue: 'Weiter' })}</AppText>
                </TouchableOpacity>
            </View>
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
    textHighContrast: {
        color: '#ffffff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    content: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 8,
        padding: 15,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
    },
    footerContainer: {
        paddingTop: 15,
        backgroundColor: '#fff',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#2563eb',
        borderRadius: 4,
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#2563eb',
    },
    checkboxActive: {
        backgroundColor: '#eff6ff',
        borderRadius: 8,
    },
    checkboxLabel: {
        fontSize: 16,
        color: '#333',
        flex: 1,
    },
    button: {
        backgroundColor: '#2563eb',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: '#9ca3af',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
});
