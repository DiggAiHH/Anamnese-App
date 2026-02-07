/**
 * ChoiceInput - Reusable component for radio, checkbox, and select inputs
 *
 * FEATURES:
 * - Radio (single choice)
 * - Checkbox (single or multiple)
 * - Select (dropdown style)
 * - Bitset encoding for multi-choice
 */

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import {
    decodeMultiChoiceBitset,
    encodeMultiChoiceBitset,
} from '@domain/value-objects/CompartmentAnswerEncoding';

export interface ChoiceOption {
    value: string | number;
    label: string;
}

export type ChoiceInputType = 'radio' | 'checkbox' | 'multiCheckbox' | 'select';

export interface ChoiceInputProps {
    /** Type of choice input */
    type: ChoiceInputType;
    /** Available options */
    options: ChoiceOption[];
    /** Current value */
    value: string | number | boolean | number[] | string[] | null | undefined;
    /** Called when value changes */
    onValueChange: (value: string | number | boolean | number[] | string[]) => void;
    /** Whether there's an error */
    hasError?: boolean;
}

/**
 * ChoiceInput - Renders different choice input types
 */
export const ChoiceInput: React.FC<ChoiceInputProps> = ({
    type,
    options,
    value,
    onValueChange,
    hasError = false,
}) => {
    const isSelected = (optionValue: string | number): boolean => {
        if (value === null || value === undefined) return false;
        return String(value) === String(optionValue);
    };

    const getBitPos = (v: string | number): number | null => {
        if (typeof v === 'number' && Number.isInteger(v)) return v;
        const parsed = Number.parseInt(String(v), 10);
        return Number.isFinite(parsed) ? parsed : null;
    };

    // ================== Radio Input ==================
    const renderRadio = () => (
        <View style={styles.optionsContainer}>
            {options.map(option => (
                <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    onPress={() => onValueChange(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected(option.value) }}>
                    <View
                        style={[
                            styles.radioCircle,
                            isSelected(option.value) && styles.radioCircleSelected,
                        ]}>
                        {isSelected(option.value) && <View style={styles.radioCircleInner} />}
                    </View>
                    <Text style={styles.optionLabel}>{option.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    // ================== Single Checkbox ==================
    const renderSingleCheckbox = () => {
        const checked = value === true;
        const option = options[0];

        return (
            <TouchableOpacity
                style={styles.checkboxOption}
                onPress={() => onValueChange(!checked)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}>
                <View style={[styles.checkbox, checked && styles.checkboxSelected]}>
                    {checked && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.optionLabel}>{option?.label ?? ''}</Text>
            </TouchableOpacity>
        );
    };

    // ================== Multi Checkbox ==================
    const renderMultiCheckbox = () => {
        const currentBitset = typeof value === 'number' && Number.isInteger(value) ? value : 0;
        const legacySelectedValues = Array.isArray(value) ? (value as string[]) : [];

        const isOptionChecked = (optionValue: string | number): boolean => {
            const bitPos = getBitPos(optionValue);
            if (bitPos !== null) {
                const selected = decodeMultiChoiceBitset(currentBitset);
                return selected.includes(bitPos);
            }
            return legacySelectedValues.includes(String(optionValue));
        };

        const toggleOption = (optionValue: string | number): void => {
            const bitPos = getBitPos(optionValue);
            if (bitPos !== null) {
                const selected = decodeMultiChoiceBitset(currentBitset);
                const nextSelected = selected.includes(bitPos)
                    ? selected.filter(p => p !== bitPos)
                    : [...selected, bitPos].sort((a, b) => a - b);
                onValueChange(encodeMultiChoiceBitset(nextSelected));
                return;
            }

            const key = String(optionValue);
            const newValues = legacySelectedValues.includes(key)
                ? legacySelectedValues.filter(v => v !== key)
                : [...legacySelectedValues, key];
            onValueChange(newValues);
        };

        return (
            <View style={styles.optionsContainer}>
                {options.map(option => (
                    <TouchableOpacity
                        key={option.value}
                        style={styles.checkboxOption}
                        onPress={() => toggleOption(option.value)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: isOptionChecked(option.value) }}>
                        <View
                            style={[
                                styles.checkbox,
                                isOptionChecked(option.value) && styles.checkboxSelected,
                            ]}>
                            {isOptionChecked(option.value) && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.optionLabel}>{option.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    // ================== Select Input ==================
    const renderSelect = () => (
        <ScrollView style={[styles.selectContainer, hasError && styles.inputError]}>
            {options.map(option => (
                <TouchableOpacity
                    key={option.value}
                    style={[
                        styles.selectOption,
                        isSelected(option.value) && styles.selectOptionSelected,
                    ]}
                    onPress={() => onValueChange(option.value)}>
                    <Text
                        style={[
                            styles.selectOptionText,
                            isSelected(option.value) && styles.selectOptionTextSelected,
                        ]}>
                        {option.label}
                    </Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
    );

    // ================== Render by Type ==================
    switch (type) {
        case 'radio':
            return renderRadio();
        case 'checkbox':
            return renderSingleCheckbox();
        case 'multiCheckbox':
            return renderMultiCheckbox();
        case 'select':
            return renderSelect();
        default:
            return null;
    }
};

const styles = StyleSheet.create({
    optionsContainer: {
        marginTop: 8,
    },
    radioOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    radioCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    radioCircleSelected: {
        backgroundColor: '#2563eb',
    },
    radioCircleInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#fff',
    },
    checkboxOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 4,
        borderWidth: 2,
        borderColor: '#2563eb',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: '#2563eb',
    },
    checkmark: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    optionLabel: {
        fontSize: 16,
        color: '#1f2937',
    },
    selectContainer: {
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    selectOption: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    selectOptionSelected: {
        backgroundColor: '#eff6ff',
    },
    selectOptionText: {
        fontSize: 16,
        color: '#1f2937',
    },
    selectOptionTextSelected: {
        color: '#2563eb',
        fontWeight: '600',
    },
    inputError: {
        borderColor: '#ef4444',
    },
});

export default ChoiceInput;
