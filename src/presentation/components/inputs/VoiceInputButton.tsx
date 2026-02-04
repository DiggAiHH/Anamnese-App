/**
 * VoiceInputButton - Reusable voice input trigger component
 *
 * USAGE:
 * - Text and textarea inputs
 * - Any input that accepts voice transcription
 *
 * FEATURES:
 * - Microphone button with loading state
 * - Error display
 * - Platform-aware availability check
 */

import React, { useState } from 'react';
import {
    TouchableOpacity,
    Text,
    View,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SystemSpeechService } from '@infrastructure/speech/SystemSpeechService';

export interface VoiceInputButtonProps {
    /** Called when voice transcription is received */
    onTranscription: (text: string) => void;
    /** Optional test ID */
    testID?: string;
    /** Custom styles for the button */
    style?: object;
}

/**
 * VoiceInputButton - Microphone button for voice input
 */
export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
    onTranscription,
    testID,
    style,
}) => {
    const { t } = useTranslation();
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handlePress = async (): Promise<void> => {
        if (isListening) {
            // Stop listening
            await SystemSpeechService.stopListening();
            setIsListening(false);
            return;
        }

        setError(null);
        setIsListening(true);

        try {
            const available = await SystemSpeechService.isAvailable();
            if (!available) {
                setError(t('voice.notAvailable'));
                setIsListening(false);
                return;
            }

            await SystemSpeechService.startListening({
                onResult: (text: string) => {
                    onTranscription(text);
                },
                onError: (err: string) => {
                    setError(err);
                    setIsListening(false);
                },
                onEnd: () => {
                    setIsListening(false);
                },
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : t('voice.error'));
            setIsListening(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.button, isListening && styles.buttonActive, style]}
                onPress={handlePress}
                testID={testID}
                accessibilityRole="button"
                accessibilityLabel={isListening ? t('voice.stopListening') : t('voice.startListening')}
                accessibilityState={{ busy: isListening }}>
                {isListening ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <Text style={styles.icon}>🎤</Text>
                )}
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {},
    button: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2563eb',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonActive: {
        backgroundColor: '#dc2626',
    },
    icon: {
        fontSize: 18,
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
        marginTop: 4,
    },
});

export default VoiceInputButton;
