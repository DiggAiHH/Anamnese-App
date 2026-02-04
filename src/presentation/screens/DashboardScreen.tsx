import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { AppText } from '../components/AppText';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography, radius } from '../theme/tokens';
import { AnalyticsService, GroupStatistics } from '../../application/services/AnalyticsService';
import { AppButton } from '../components/AppButton';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';

import { RootNavigationProp } from '../navigation/RootNavigator';

export const DashboardScreen = ({ navigation }: { navigation: RootNavigationProp }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<GroupStatistics[]>([]);
    const { activeQuestionnaireId } = useQuestionnaireStore();

    useEffect(() => {
        loadData();
    }, [activeQuestionnaireId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const service = new AnalyticsService();

            // Use active ID from store, fallback to generic if null
            const targetId = activeQuestionnaireId || 'global';
            const data = await service.getCompletionByGroup(targetId);
            setStats(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <AppText style={[typography.h2, styles.title]}>{t('dashboard.title', 'Analysis Dashboard')}</AppText>

            {stats.map(group => (
                <View key={group.groupId} style={styles.card}>
                    <AppText style={styles.groupTitle}>
                        {t(`statisticGroup.${group.groupId}`, group.groupId)}
                    </AppText>

                    <View style={styles.row}>
                        <AppText style={styles.label}>{t('dashboard.completion', 'Completion')}:</AppText>
                        <AppText style={styles.value}>
                            {(group.completionRate * 100).toFixed(0)}%
                        </AppText>
                    </View>

                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${group.completionRate * 100}%` }
                            ]}
                        />
                    </View>

                    <AppText style={styles.details}>
                        {group.answeredQuestions} / {group.totalQuestions} {t('dashboard.questions', 'questions')}
                    </AppText>
                </View>
            ))}

            <AppButton
                title={t('common.close', 'Close')}
                onPress={() => navigation.goBack()}
                variant="secondary"
                style={{ marginTop: spacing.xl }}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: spacing.lg,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        marginBottom: spacing.xl,
        color: colors.textPrimary,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    groupTitle: {
        ...typography.h3,
        marginBottom: spacing.md,
        color: colors.primary,
        textTransform: 'capitalize',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.sm,
    },
    label: {
        ...typography.body,
        color: colors.textSecondary,
    },
    value: {
        ...typography.body,
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: colors.borderLight,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: spacing.sm,
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.success,
    },
    details: {
        ...typography.caption,
        color: colors.textMuted,
        textAlign: 'right',
    },
    // High Contrast
    textHighContrast: { color: '#ffffff' },
    textHighContrastInverse: { color: '#000000' },
    bgHighContrast: { backgroundColor: '#000000' },
    surfaceHighContrast: { backgroundColor: '#ffffff' },
});
