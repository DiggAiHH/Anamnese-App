/**
 * DatePickerInput - Platform-aware date picker component
 *
 * FEATURES:
 * - Windows: Custom dropdown-based picker (year-month-day)
 * - Other platforms: Simple text input with ISO date format
 * - Year-first selection for better UX
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';

export interface DatePickerInputProps {
    /** Current value (ISO date string: YYYY-MM-DD) */
    value: string | null | undefined;
    /** Called when date changes */
    onValueChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Whether there's an error */
    hasError?: boolean;
    /** Min year for year dropdown */
    minYear?: number;
    /** Max year for year dropdown (defaults to current year) */
    maxYear?: number;
}

/**
 * DatePickerInput - Platform-aware date picker
 */
export const DatePickerInput: React.FC<DatePickerInputProps> = ({
    value,
    onValueChange,
    placeholder,
    hasError = false,
    minYear = 1900,
    maxYear,
}) => {
    const { t } = useTranslation();
    const isWindows = Platform.OS === 'windows';

    const [showPicker, setShowPicker] = useState(false);
    const [openDropdown, setOpenDropdown] = useState<'day' | 'month' | 'year' | null>(null);
    const [draftDay, setDraftDay] = useState<number | null>(null);
    const [draftMonth, setDraftMonth] = useState<number | null>(null);
    const [draftYear, setDraftYear] = useState<number | null>(null);

    const today = new Date();
    const yearMax = maxYear ?? today.getFullYear();

    // ================== Helpers ==================
    const parseIsoDateParts = (
        iso: string,
    ): { year: number; month: number; day: number } | null => {
        const m = /^\s*(\d{4})-(\d{2})-(\d{2})/.exec(iso);
        if (!m) return null;
        const year = Number(m[1]);
        const month = Number(m[2]);
        const day = Number(m[3]);
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day))
            return null;
        if (month < 1 || month > 12) return null;
        if (day < 1 || day > 31) return null;
        return { year, month, day };
    };

    const toIsoDate = (year: number, month: number, day: number): string => {
        const y = String(year).padStart(4, '0');
        const m = String(month).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const daysInMonth = (year: number, month: number): number => {
        return new Date(year, month, 0).getDate();
    };

    const closeDropdowns = (): void => setOpenDropdown(null);

    // ================== Windows Picker ==================
    if (isWindows) {
        const currentIso = typeof value === 'string' ? value : '';
        const parsed = currentIso ? parseIsoDateParts(currentIso) : null;
        const displayDate = parsed
            ? new Date(parsed.year, parsed.month - 1, parsed.day).toLocaleDateString()
            : '';

        const years = Array.from({ length: yearMax - minYear + 1 }, (_, i) => yearMax - i);

        const openPicker = (): void => {
            if (showPicker) {
                setShowPicker(false);
                closeDropdowns();
                return;
            }

            const base = parsed ?? {
                year: today.getFullYear(),
                month: today.getMonth() + 1,
                day: today.getDate(),
            };
            setDraftYear(base.year);
            setDraftMonth(base.month);
            setDraftDay(base.day);
            setShowPicker(true);
        };

        const selectedYear = draftYear ?? parsed?.year ?? today.getFullYear();
        const selectedMonth = draftMonth ?? parsed?.month ?? today.getMonth() + 1;
        const maxDay = daysInMonth(selectedYear, selectedMonth);
        const selectedDay = Math.min(draftDay ?? parsed?.day ?? today.getDate(), maxDay);

        const setPart = (part: { year?: number; month?: number; day?: number }): void => {
            const nextYear = part.year ?? selectedYear;
            const nextMonth = part.month ?? selectedMonth;
            const nextMaxDay = daysInMonth(nextYear, nextMonth);
            const nextDayRaw = part.day ?? selectedDay;
            const nextDay = Math.min(nextDayRaw, nextMaxDay);

            setDraftYear(nextYear);
            setDraftMonth(nextMonth);
            setDraftDay(nextDay);

            onValueChange(toIsoDate(nextYear, nextMonth, nextDay));
        };

        const renderDropdown = (
            kind: 'day' | 'month' | 'year',
            selected: number,
            options: number[],
            onSelect: (v: number) => void,
        ) => (
            <View style={styles.dropdownCell}>
                <TouchableOpacity
                    style={[styles.dropdownButton, hasError && styles.inputError]}
                    onPress={() => setOpenDropdown(cur => (cur === kind ? null : kind))}>
                    <Text style={styles.dropdownText}>{String(selected)}</Text>
                </TouchableOpacity>

                {openDropdown === kind && (
                    <View style={styles.dropdownMenu}>
                        <ScrollView style={styles.dropdownScroll} keyboardShouldPersistTaps="handled">
                            {options.map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    style={styles.dropdownOption}
                                    onPress={() => {
                                        onSelect(opt);
                                        closeDropdowns();
                                    }}>
                                    <Text style={styles.dropdownOptionText}>{String(opt)}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );

        const dayOptions = Array.from({ length: maxDay }, (_, i) => i + 1);

        return (
            <View>
                <TouchableOpacity
                    style={[styles.displayInput, hasError && styles.inputError]}
                    onPress={openPicker}>
                    <Text style={displayDate ? styles.dateText : styles.placeholderText}>
                        {displayDate || placeholder || t('patientInfo.birthDatePlaceholder')}
                    </Text>
                </TouchableOpacity>

                {showPicker && (
                    <View style={styles.pickerRow}>
                        {/* Year first for better UX */}
                        {renderDropdown('year', selectedYear, years, v => setPart({ year: v }))}
                        {renderDropdown(
                            'month',
                            selectedMonth,
                            Array.from({ length: 12 }, (_, i) => i + 1),
                            v => setPart({ month: v }),
                        )}
                        {renderDropdown('day', selectedDay, dayOptions, v => setPart({ day: v }))}
                    </View>
                )}
            </View>
        );
    }

    // ================== Non-Windows Fallback ==================
    return (
        <TextInput
            style={[styles.textInput, hasError && styles.inputError]}
            value={(value as string) ?? ''}
            onChangeText={onValueChange}
            placeholder={placeholder || t('patientInfo.birthDatePlaceholder')}
        />
    );
};

const styles = StyleSheet.create({
    displayInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    dateText: {
        fontSize: 16,
        color: '#1f2937',
    },
    placeholderText: {
        fontSize: 16,
        color: '#6b7280',
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#ef4444',
    },
    pickerRow: {
        flexDirection: 'row',
        marginTop: 8,
        gap: 8,
    },
    dropdownCell: {
        flex: 1,
    },
    dropdownButton: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        backgroundColor: '#fff',
    },
    dropdownText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
    dropdownMenu: {
        marginTop: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        maxHeight: 200,
    },
    dropdownScroll: {
        maxHeight: 200,
    },
    dropdownOption: {
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    dropdownOptionText: {
        fontSize: 16,
        color: '#1f2937',
        textAlign: 'center',
    },
});

export default DatePickerInput;
