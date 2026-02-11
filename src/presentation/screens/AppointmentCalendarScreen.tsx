/**
 * AppointmentCalendarScreen - Terminmanagement Kalender
 *
 * Weekly view with appointment booking, rescheduling, and cancellation.
 *
 * @security Only therapists can manage appointments.
 * @gdpr Patient references via UUID only.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../state/useAuthStore';
import { appointmentService } from './TherapistDashboardScreen';
import type { AppointmentEntity, AppointmentType } from '../../domain/entities/Appointment';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'AppointmentCalendar'>;

const APPOINTMENT_TYPES: { value: AppointmentType; labelKey: string }[] = [
  { value: 'initial_session', labelKey: 'appointments.type_initial_session' },
  { value: 'follow_up', labelKey: 'appointments.type_follow_up' },
  { value: 'online', labelKey: 'appointments.type_online' },
  { value: 'crisis', labelKey: 'appointments.type_crisis' },
];

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 08:00 - 18:00

export const AppointmentCalendarScreen = (_props: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const userId = useAuthStore(s => s.userId);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<AppointmentEntity[]>([]);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingHour, setBookingHour] = useState(9);
  const [bookingPatientId, setBookingPatientId] = useState('');
  const [bookingType, setBookingType] = useState<AppointmentType>('follow_up');
  const [bookingDuration, setBookingDuration] = useState('50');

  const loadWeek = useCallback(async () => {
    if (!userId) return;
    const from = new Date(selectedDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);

    const appts = await appointmentService.getTherapistSchedule(
      userId,
      from.toISOString(),
      to.toISOString(),
    );
    setAppointments(appts);
  }, [userId, selectedDate]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const navigateWeek = (direction: number): void => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + direction * 7);
    setSelectedDate(next);
  };

  const getDayAppointments = (dayOffset: number): AppointmentEntity[] => {
    const day = new Date(selectedDate);
    day.setDate(day.getDate() + dayOffset);
    const dayStr = day.toISOString().split('T')[0];
    return appointments.filter(a => a.startTime.startsWith(dayStr) && a.status !== 'cancelled');
  };

  const formatDayHeader = (dayOffset: number): string => {
    const day = new Date(selectedDate);
    day.setDate(day.getDate() + dayOffset);
    return day.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' });
  };

  const handleBook = async (): Promise<void> => {
    if (!userId || !bookingPatientId.trim()) {
      Alert.alert(t('common.error'), t('appointments.patientRequired', { defaultValue: 'Bitte Patienten-ID eingeben.' }));
      return;
    }

    const startTime = new Date(selectedDate);
    startTime.setHours(bookingHour, 0, 0, 0);

    const result = await appointmentService.book(
      userId,
      bookingPatientId.trim(),
      startTime.toISOString(),
      bookingType,
      parseInt(bookingDuration, 10) || 50,
    );

    if (result.success) {
      Alert.alert(
        t('common.success', { defaultValue: 'Erfolg' }),
        t('appointments.booked', { defaultValue: 'Termin wurde gebucht.' }),
      );
      setShowBooking(false);
      setBookingPatientId('');
      loadWeek();
    } else {
      Alert.alert(t('common.error'), t(result.error || 'appointments.bookingFailed'));
    }
  };

  const handleCancel = async (appointmentId: string): Promise<void> => {
    Alert.alert(
      t('appointments.cancelTitle', { defaultValue: 'Termin absagen?' }),
      t('appointments.cancelConfirm', { defaultValue: 'Soll dieser Termin wirklich abgesagt werden?' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm', { defaultValue: 'Bestätigen' }),
          style: 'destructive',
          onPress: async () => {
            await appointmentService.cancel(appointmentId);
            loadWeek();
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer testID="appointment-calendar-screen" accessibilityLabel="Appointment Calendar">
    <View style={[styles.container, isHighContrast && styles.containerHC]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Week Navigation */}
        <View style={styles.weekNav}>
          <TouchableOpacity onPress={() => navigateWeek(-1)} style={styles.navBtn}>
            <AppText style={styles.navText}>◀</AppText>
          </TouchableOpacity>
          <AppText variant="h3" style={[styles.weekTitle, isHighContrast && styles.textHC]}>
            {t('appointments.weekOf', { defaultValue: 'Woche ab' })}{' '}
            {selectedDate.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          </AppText>
          <TouchableOpacity onPress={() => navigateWeek(1)} style={styles.navBtn}>
            <AppText style={styles.navText}>▶</AppText>
          </TouchableOpacity>
        </View>

        {/* Week Grid */}
        {[0, 1, 2, 3, 4].map(dayOffset => {
          const dayAppts = getDayAppointments(dayOffset);
          return (
            <View key={dayOffset} style={styles.dayColumn}>
              <AppText style={[styles.dayHeader, isHighContrast && styles.textHC]}>
                {formatDayHeader(dayOffset)}
              </AppText>
              {dayAppts.length === 0 ? (
                <AppText style={styles.noAppts}>—</AppText>
              ) : (
                dayAppts.map(appt => (
                  <TouchableOpacity
                    key={appt.id}
                    style={[styles.apptSlot, appt.type === 'online' && styles.onlineSlot]}
                    onLongPress={() => handleCancel(appt.id)}>
                    <AppText style={styles.apptTime}>
                      {new Date(appt.startTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </AppText>
                    <AppText style={styles.apptType}>
                      {appt.type === 'online' ? '📹 ' : ''}{t(`appointments.type_${appt.type}`, appt.type)}
                    </AppText>
                    <AppText style={styles.apptDuration}>{appt.durationMinutes}m</AppText>
                  </TouchableOpacity>
                ))
              )}
            </View>
          );
        })}

        {/* Book Button */}
        <AppButton
          title={showBooking
            ? t('common.cancel')
            : t('appointments.newAppointment', { defaultValue: 'Neuer Termin' })
          }
          variant={showBooking ? 'secondary' : 'primary'}
          onPress={() => setShowBooking(!showBooking)}
          testID="btn-toggle-booking"
        />

        {/* Booking Form */}
        {showBooking && (
          <View style={styles.bookingForm}>
            <AppInput
              label={t('appointments.patientId', { defaultValue: 'Patienten-ID' })}
              required
              value={bookingPatientId}
              onChangeText={setBookingPatientId}
              placeholder="UUID"
              testID="input-patient-id"
            />

            <View style={styles.typeRow}>
              {APPOINTMENT_TYPES.map(at => (
                <TouchableOpacity
                  key={at.value}
                  style={[styles.typeChip, bookingType === at.value && styles.typeChipActive]}
                  onPress={() => setBookingType(at.value)}>
                  <AppText style={[styles.typeChipText, bookingType === at.value && styles.typeChipTextActive]}>
                    {t(at.labelKey, at.value)}
                  </AppText>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.timeRow}>
              <AppText style={styles.timeLabel}>
                {t('appointments.time', { defaultValue: 'Uhrzeit' })}:
              </AppText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {HOURS.map(h => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, bookingHour === h && styles.hourActive]}
                    onPress={() => setBookingHour(h)}>
                    <AppText style={[styles.hourText, bookingHour === h && styles.hourTextActive]}>
                      {h}:00
                    </AppText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <AppInput
              label={t('appointments.duration', { defaultValue: 'Dauer (Minuten)' })}
              value={bookingDuration}
              onChangeText={setBookingDuration}
              keyboardType="number-pad"
              testID="input-duration"
            />

            <AppButton
              title={t('appointments.book', { defaultValue: 'Termin buchen' })}
              onPress={handleBook}
              testID="btn-book"
            />
          </View>
        )}
      </ScrollView>
    </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerHC: { backgroundColor: '#000' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  weekNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  navBtn: { padding: spacing.md },
  navText: { fontSize: 20 },
  weekTitle: {},
  textHC: { color: '#fff' },
  dayColumn: { marginBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.md },
  dayHeader: { fontSize: 16, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  noAppts: { color: colors.textMuted, paddingLeft: spacing.md },
  apptSlot: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  onlineSlot: { borderLeftColor: '#00897B' },
  apptTime: { fontWeight: '600', fontSize: 14, color: colors.text, width: 50 },
  apptType: { flex: 1, fontSize: 13, color: colors.text },
  apptDuration: { fontSize: 12, color: colors.textMuted },
  bookingForm: { gap: spacing.md, marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  typeChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  typeChipActive: { borderColor: colors.primary, backgroundColor: colors.infoSurface || '#E3F2FD' },
  typeChipText: { fontSize: 13, color: colors.text },
  typeChipTextActive: { color: colors.primary, fontWeight: '600' },
  timeRow: { gap: spacing.sm },
  timeLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  hourChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.xs,
  },
  hourActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  hourText: { fontSize: 14, color: colors.text },
  hourTextActive: { color: '#fff', fontWeight: '600' },
});
