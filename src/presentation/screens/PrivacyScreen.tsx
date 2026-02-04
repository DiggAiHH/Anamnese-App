import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
// @ts-ignore
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RootStackParamList } from '../navigation/RootNavigator';

import Clipboard from '@react-native-clipboard/clipboard';
import CryptoJS from 'crypto-js';

import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { useTheme } from '../theme/ThemeContext';
import { AppText } from '../components/AppText';

// type NavigationProp = StackNavigationProp<RootStackParamList, 'Privacy'>;

export const PrivacyScreen = () => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const { setEncryptionKey: setStoreKey } = useQuestionnaireStore(); // Get action from store
    const { isHighContrast } = useTheme();
    const [accepted, setAccepted] = useState(false);
    const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const generateAndCopyKey = () => {
        // Generate AES-256 Key (32 bytes = 256 bits)
        const key = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Base64);
        setEncryptionKey(key);
        setStoreKey(key); // Save to global store
        Clipboard.setString(key);
        setCopied(true);
    };

    const handleNext = () => {
        if (accepted && encryptionKey) {
            navigation.navigate('VisitReason');
        }
    };

    return (
        <View style={[styles.container, isHighContrast && styles.containerHighContrast]}>
            <AppText variant="h1" style={[styles.title, isHighContrast && styles.textHighContrast]}>{t('privacy.title', { defaultValue: 'Datenschutzerklärung' })}</AppText>

            <ScrollView style={styles.content}>
                <AppText style={styles.text}>
                    {t('privacy.intro', { defaultValue: 'Transparente Datenschutzerklärung:' })}
                    {'\n\n'}
                    {t('privacy.content_1', { defaultValue: 'Ihre Daten gehören Ihnen. Die Anamnese-App speichert alle persönlichen und medizinischen Daten ausschließlich lokal auf diesem Gerät.' })}
                    {'\n\n'}
                    {t('privacy.content_2', { defaultValue: 'Für Backup-Zwecke und die Übermittlung an die Praxis werden Ihre Daten vollständig anonymisiert. Persönliche Informationen (Name, Adresse) werden vom medizinischen Fragebogen getrennt und separat verschlüsselt.' })}
                    {'\n\n'}
                    {t('privacy.content_3', { defaultValue: 'Niemals werden unverschlüsselte Klardaten an externe Server gesendet. Die DiggAiHH Datenbank dient lediglich als verschlüsselter Zwischenspeicher (Relay) ohne Einsicht in Ihre Daten.' })}
                </AppText>

                <View style={styles.encryptionSection}>
                    <AppText style={styles.sectionTitle}>{t('privacy.encryption_title', { defaultValue: 'Verschlüsselung (AES-256)' })}</AppText>
                    <AppText style={styles.sectionDesc}>
                        {t('privacy.encryption_desc', { defaultValue: 'Um Ihre Privatsphäre zu schützen, wird nun ein einzigartiger Schlüssel generiert. Dieser Schlüssel ist notwendig, um Ihre Daten später wiederherzustellen.' })}
                    </AppText>

                    {!encryptionKey ? (
                        <TouchableOpacity style={[styles.button, styles.genButton, !accepted && styles.buttonDisabled]} onPress={generateAndCopyKey} disabled={!accepted}>
                            <AppText style={styles.buttonText}>{t('privacy.generate_key', { defaultValue: 'Schlüssel generieren & kopieren' })}</AppText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.keyContainer}>
                            <AppText style={styles.keyLabel}>{t('privacy.your_key', { defaultValue: 'Ihr Sicherheitsschlüssel:' })}</AppText>
                            <AppText style={styles.keyText}>{encryptionKey}</AppText>
                            <TouchableOpacity style={styles.copyButton} onPress={() => { Clipboard.setString(encryptionKey); setCopied(true); }}>
                                <AppText style={styles.copyButtonText}>{copied ? 'Kopiert!' : 'Erneut kopieren'}</AppText>
                            </TouchableOpacity>
                            <AppText style={styles.hintText}>{t('privacy.key_hint', { defaultValue: 'Der Schlüssel wurde in die Zwischenablage kopiert.' })}</AppText>
                        </View>
                    )}
                </View>
            </ScrollView>

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
                style={[styles.button, (!accepted || !encryptionKey) && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={!accepted || !encryptionKey}
            >
                <AppText style={styles.buttonText}>{t('common.next', { defaultValue: 'Weiter' })}</AppText>
            </TouchableOpacity>
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
    textHighContrastInverse: {
        color: '#000000',
    },
    buttonHighContrast: {
        backgroundColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: 2,
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
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#4b5563',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
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
    encryptionSection: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#1e3a8a',
    },
    sectionDesc: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 15,
    },
    genButton: {
        backgroundColor: '#059669',
    },
    keyContainer: {
        backgroundColor: '#f3f4f6',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#d1d5db',
    },
    keyLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    keyText: {
        fontFamily: 'monospace',
        fontSize: 14,
        color: '#111827',
        marginBottom: 10,
        fontWeight: 'bold',
    },
    copyButton: {
        alignSelf: 'flex-start',
        backgroundColor: '#dbeafe',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 4,
    },
    copyButtonText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: '600',
    },
    hintText: {
        marginTop: 10,
        fontSize: 12,
        color: '#059669',
        fontStyle: 'italic',
    },
});
