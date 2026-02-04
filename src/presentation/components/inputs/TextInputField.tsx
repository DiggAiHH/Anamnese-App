/**
 * TextInputField - Reusable text input component with voice support
 *
 * FEATURES:
 * - Single-line and multi-line (textarea) support
 * - Integrated voice input button
 * - Error state display
 * - Placeholder support
 */

import React, { useCallback } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
} from 'react-native';
import { VoiceInputButton } from './VoiceInputButton';

export interface TextInputFieldProps {
    /** Current value */
    value: string;
    /** Called when value changes */
    onValueChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether to render as multiline textarea */
    multiline?: boolean;
    /** Number of lines for textarea */
    numberOfLines?: number;
    /** Whether to show voice input button */
    showVoiceInput?: boolean;
    /** Whether there's an error */
    hasError?: boolean;
    /** Test ID for the input */
    testID?: string;
    /** Question ID for voice button test ID */
    questionId?: string;
}

/**
 * TextInputField - Text input with optional voice support
 */
export const TextInputField: React.FC<TextInputFieldProps> = ({
    value,
    onValueChange,
    placeholder,
    multiline = false,
    numberOfLines = 1,
    showVoiceInput = false,
    hasError = false,
    testID,
    questionId,
}) => {
    const handleVoiceTranscription = useCallback(
        (text: string) => {
            const newValue = value ? `${value} ${text}` : text;
            onValueChange(newValue);
        },
        [value, onValueChange],
    );

    return (
        <View style={styles.container}>
            <TextInput
                style={[
                    styles.input,
                    multiline && styles.multilineInput,
                    showVoiceInput && styles.inputWithMic,
                    hasError && styles.inputError,
                ]}
                value={value}
                onChangeText={onValueChange}
                placeholder={placeholder}
                multiline={multiline}
                numberOfLines={multiline ? numberOfLines : 1}
                testID={testID}
            />
            {showVoiceInput && (
                <View style={styles.voiceButtonContainer}>
                    <VoiceInputButton
                        onTranscription={handleVoiceTranscription}
                        testID={questionId ? `mic-button-${questionId}` : undefined}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    multilineInput: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    inputWithMic: {
        paddingRight: 50,
    },
    inputError: {
        borderColor: '#ef4444',
    },
    voiceButtonContainer: {
        position: 'absolute',
        right: 8,
        top: 8,
    },
});

export default TextInputField;
