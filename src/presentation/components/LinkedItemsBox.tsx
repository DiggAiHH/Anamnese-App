/**
 * LinkedItemsBox - Displays linked/dependent questions for context navigation
 *
 * User Requirement: Persistent box showing "linked items" to the current questions.
 * Functionality:
 * - Scans visible questions for dependencies (dependsOn, conditions)
 * - Lists these source questions
 * - Clicking navigates back to the source question's section
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Question, QuestionnaireEntity } from '@domain/entities/Questionnaire';
import { colors, radius, spacing } from '@presentation/theme/tokens';

interface LinkedItemsBoxProps {
    visibleQuestions: Question[];
    questionnaire: QuestionnaireEntity;
    onNavigateToQuestion: (questionId: string) => void;
}

export const LinkedItemsBox: React.FC<LinkedItemsBoxProps> = ({
    visibleQuestions,
    questionnaire,
    onNavigateToQuestion,
}) => {
    const { t } = useTranslation();

    // Calculate unique dependencies for the current view
    const dependencies = useMemo(() => {
        const depIds = new Set<string>();

        visibleQuestions.forEach(q => {
            // Direct dependency
            if (q.dependsOn) {
                depIds.add(q.dependsOn);
            }

            // Conditional dependencies
            if (q.conditions) {
                q.conditions.forEach(c => depIds.add(c.questionId));
            }
        });

        // Resolve IDs to Question objects
        const deps: Question[] = [];
        depIds.forEach(id => {
            const q = questionnaire.findQuestion(id);
            if (q) deps.push(q);
        });

        return deps;
    }, [visibleQuestions, questionnaire]);

    if (dependencies.length === 0) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('questionnaire.linkedItems', 'Linked Questions')}:</Text>
            <View style={styles.list}>
                {dependencies.map(dep => (
                    <TouchableOpacity
                        key={dep.id}
                        style={styles.item}
                        onPress={() => onNavigateToQuestion(dep.id)}>
                        <Text style={styles.itemIcon}>↪</Text>
                        <Text style={styles.itemText} numberOfLines={1}>
                            {dep.labelKey ? t(dep.labelKey, { defaultValue: dep.text ?? '' }) : (dep.text ?? '')}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surfaceAlt,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: spacing.md,
    },
    title: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
    },
    list: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemIcon: {
        fontSize: 14,
        color: colors.primary,
        marginRight: 6,
    },
    itemText: {
        fontSize: 13,
        color: colors.text,
        maxWidth: 200,
    },
});
