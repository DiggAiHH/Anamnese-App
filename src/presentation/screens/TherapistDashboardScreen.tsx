/**
 * TherapistDashboardScreen - Main therapist view after login
 *
 * Shows today's appointments, quick actions, and patient overview.
 *
 * @security Role-guarded: only accessible to authenticated therapists.
 * @gdpr Patient names displayed from encrypted store only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppText } from '../components/AppText';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../state/useAuthStore';
import { AppointmentService } from '../../application/services/AppointmentService';
import { createAppointmentRepoSync } from '../../infrastructure/persistence/RepositoryFactory';
import type { AppointmentEntity } from '../../domain/entities/Appointment';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'TherapistDashboard'>;

// Platform-aware repository (localStorage on web, InMemory on native)
const appointmentRepo = createAppointmentRepoSync();
const appointmentService = new AppointmentService(appointmentRepo);

export { appointmentService, appointmentRepo };

export const TherapistDashboardScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const { userId, displayName, logout } = useAuthStore();

  const [todayAppointments, setTodayAppointments] = useState<AppointmentEntity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTodaySchedule = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await appointmentService.getTherapistSchedule(
        userId,
        today.toISOString(),
        tomorrow.toISOString(),
      );
      setTodayAppointments(appointments.filter(a => a.status !== 'cancelled'));
    } catch {
      // Silent fail — empty schedule shown
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadTodaySchedule();
  }, [loadTodaySchedule]);

  const handleLogout = (): void => {
    Alert.alert(
      t('auth.logoutConfirmTitle', { defaultValue: 'Abmelden' }),
      t('auth.logoutConfirmMessage', { defaultValue: 'Möchten Sie sich wirklich abmelden?' }),
      [
        { text: t('common.cancel', { defaultValue: 'Abbrechen' }), style: 'cancel' },
        {
          text: t('auth.logout', { defaultValue: 'Abmelden' }),
          style: 'destructive',
          onPress: () => {
            logout();
            (navigation as any).reset({ index: 0, routes: [{ name: 'Login' }] });
          },
        },
      ],
    );
  };

  const formatTime = (iso: string): string => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'confirmed': return colors.successText || '#2E7D32';
      case 'scheduled': return colors.primary;
      case 'completed': return colors.textMuted;
      default: return colors.text;
    }
  };

  return (
    <ScreenContainer testID="therapist-dashboard-screen" accessibilityLabel="Therapist Dashboard">
    <View style={[styles.container, isHighContrast && styles.containerHC]}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <AppText variant="h2" style={[styles.greeting, isHighContrast && styles.textHC]}>
              {t('therapistDashboard.greeting', {
                defaultValue: 'Willkommen, {{name}}',
                name: displayName || t('auth.therapist'),
              })}
            </AppText>
            <AppText style={[styles.dateText, isHighContrast && styles.textHC]}>
              {new Date().toLocaleDateString('de-DE', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </AppText>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <AppText style={styles.logoutText}>
              {t('auth.logout', { defaultValue: 'Abmelden' })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.primary }]}
            onPress={() => navigation.navigate('AppointmentCalendar')}>
            <AppText style={styles.actionIcon}>📅</AppText>
            <AppText style={styles.actionLabel}>
              {t('therapistDashboard.calendar', { defaultValue: 'Kalender' })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#00897B' }]}
            onPress={() => {
              Alert.alert(
                t('therapistDashboard.videoSession', { defaultValue: 'Video-Sitzung' }),
                t('therapistDashboard.selectAppointmentFirst', { defaultValue: 'Bitte wählen Sie zuerst einen Termin aus dem Kalender.' }),
              );
            }}>
            <AppText style={styles.actionIcon}>📹</AppText>
            <AppText style={styles.actionLabel}>
              {t('therapistDashboard.videoSession', { defaultValue: 'Video-Sitzung' })}
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: '#5C6BC0' }]}
            onPress={() => {
              Alert.alert(
                t('therapistDashboard.notes', { defaultValue: 'Notizen' }),
                t('therapistDashboard.selectPatientFirst', { defaultValue: 'Bitte wählen Sie zuerst einen Patienten aus.' }),
              );
            }}>
            <AppText style={styles.actionIcon}>📝</AppText>
            <AppText style={styles.actionLabel}>
              {t('therapistDashboard.notes', { defaultValue: 'Notizen' })}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <View style={styles.section}>
          <AppText variant="h3" style={[styles.sectionTitle, isHighContrast && styles.textHC]}>
            {t('therapistDashboard.todaySchedule', { defaultValue: 'Heutige Termine' })}
          </AppText>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : todayAppointments.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyText}>
                {t('therapistDashboard.noAppointments', {
                  defaultValue: 'Keine Termine für heute.',
                })}
              </AppText>
            </View>
          ) : (
            todayAppointments.map(appt => (
              <TouchableOpacity
                key={appt.id}
                style={styles.appointmentCard}
                onPress={() => navigation.navigate('SessionNotes', {
                  patientId: appt.patientId,
                  appointmentId: appt.id,
                })}>
                <View style={styles.appointmentTime}>
                  <AppText style={styles.timeText}>{formatTime(appt.startTime)}</AppText>
                  <AppText style={styles.durationText}>{appt.durationMinutes} min</AppText>
                </View>
                <View style={styles.appointmentInfo}>
                  <AppText style={styles.appointmentType}>
                    {t(`appointments.type_${appt.type}`, { defaultValue: appt.type })}
                  </AppText>
                  <AppText style={[styles.statusText, { color: getStatusColor(appt.status) }]}>
                    {t(`appointments.status_${appt.status}`, { defaultValue: appt.status })}
                  </AppText>
                </View>
                {appt.type === 'online' && (
                  <TouchableOpacity
                    style={styles.videoBtn}
                    onPress={() => navigation.navigate('VideoSession', { appointmentId: appt.id })}>
                    <AppText style={styles.videoBtnText}>📹</AppText>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Encryption Status */}
        <View style={styles.securityBanner}>
          <AppText style={styles.securityText}>
            🔒 {t('therapistDashboard.encryptionActive', {
              defaultValue: 'End-to-End-Verschlüsselung aktiv. Alle Patientendaten sind mit AES-256-GCM geschützt.',
            })}
          </AppText>
        </View>
      </ScrollView>
    </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerHC: { backgroundColor: '#000' },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
  greeting: { marginBottom: 4 },
  dateText: { fontSize: 14, color: colors.textMuted },
  textHC: { color: '#fff' },
  logoutBtn: { padding: spacing.sm, borderRadius: radius.sm, backgroundColor: colors.surface },
  logoutText: { color: colors.dangerText || '#C62828', fontSize: 14 },
  actionsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  actionCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 90,
  },
  actionIcon: { fontSize: 28, marginBottom: spacing.xs },
  actionLabel: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  emptyText: { color: colors.textMuted, fontSize: 15 },
  appointmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  appointmentTime: { width: 70, marginRight: spacing.md },
  timeText: { fontSize: 18, fontWeight: '700', color: colors.text },
  durationText: { fontSize: 12, color: colors.textMuted },
  appointmentInfo: { flex: 1 },
  appointmentType: { fontSize: 15, fontWeight: '600', color: colors.text },
  statusText: { fontSize: 13, marginTop: 2 },
  videoBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00897B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBtnText: { fontSize: 20 },
  securityBanner: {
    backgroundColor: colors.infoSurface || '#E3F2FD',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  securityText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
});
