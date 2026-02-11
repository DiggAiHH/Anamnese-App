/**
 * Root Navigator - Stack Navigation
 */

import React, { useRef } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  InteractionManager,
  Easing,
  View,
} from 'react-native';
import { AppText } from '../components/AppText';
import {
  createStackNavigator,
  StackScreenProps,
  TransitionPresets,
} from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { logError, logDebug } from '../../shared/logger';
import { useAccessibilityZoom } from '../hooks/useAccessibilityZoom';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { SelectLanguageScreen } from '../screens/SelectLanguageScreen';
import { MasterPasswordScreen } from '../screens/MasterPasswordScreen';
import { PatientInfoScreen } from '../screens/PatientInfoScreen';
import { GDPRConsentScreen } from '../screens/GDPRConsentScreen';
import { QuestionnaireScreen } from '../screens/QuestionnaireScreen';
import { SummaryScreen } from '../screens/SummaryScreen';
import { ExportScreen } from '../screens/ExportScreen';
import { SavedAnamnesesScreen } from '../screens/SavedAnamnesesScreen';
import { FeedbackScreen } from '../screens/FeedbackScreen';
import { VoiceScreen } from '../screens/VoiceScreen';
import { CalculatorScreen } from '../screens/CalculatorScreen';
import { LabUploadScreen } from '../screens/LabUploadScreen';
import { DataManagementScreen } from '../screens/DataManagementScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { FastTrackScreen } from '../screens/FastTrackScreen';
import { colors } from '../theme/tokens';

// New Flow Screens
import { RoleSelectionScreen } from '../screens/RoleSelectionScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { VisitReasonScreen } from '../screens/VisitReasonScreen';
import { PatientStatusScreen } from '../screens/PatientStatusScreen';

// Document Request Flow Screens (Sanad Port)
import { PatientTypeScreen } from '../screens/PatientTypeScreen';
import { DocumentRequestScreen } from '../screens/DocumentRequestScreen';
import { PrescriptionRequestScreen } from '../screens/PrescriptionRequestScreen';
import { ReferralRequestScreen } from '../screens/ReferralRequestScreen';
import { SickNoteRequestScreen } from '../screens/SickNoteRequestScreen';
import { RequestSummaryScreen } from '../screens/RequestSummaryScreen';

// Auth & Therapist Screens
import { LoginScreen } from '../screens/LoginScreen';
import { TwoFactorScreen } from '../screens/TwoFactorScreen';
import { TherapistDashboardScreen } from '../screens/TherapistDashboardScreen';
import { AppointmentCalendarScreen } from '../screens/AppointmentCalendarScreen';
import { VideoSessionScreen } from '../screens/VideoSessionScreen';
import { SessionNotesScreen } from '../screens/SessionNotesScreen';

// Document request type for navigation
import type { IDocumentRequest } from '../../domain/entities/DocumentRequest';

export type RootStackParamList = {
  Home: undefined;
  SelectLanguage: undefined;
  MasterPassword: { mode: 'setup' | 'unlock' };
  RoleSelection: undefined;
  Privacy: undefined;
  PatientType: undefined;
  VisitReason: undefined;
  PatientStatus: undefined;
  DocumentRequest: undefined;
  PrescriptionRequest: undefined;
  ReferralRequest: undefined;
  SickNoteRequest: undefined;
  RequestSummary: { request: IDocumentRequest };
  PatientInfo: undefined;
  GDPRConsent: undefined;
  Questionnaire: { questionnaireId?: string } | undefined;
  Summary: { questionnaireId: string };
  Export: { questionnaireId: string };
  SavedAnamneses: undefined;
  Feedback: undefined;
  Voice: undefined;
  Calculator: { labValues?: Record<string, string> } | undefined;
  LabUpload: undefined;
  DataManagement: undefined;
  Dashboard: undefined;
  FastTrack: { type: 'prescription' | 'referral' };
  // Auth & Therapist Screens
  Login: undefined;
  TwoFactor: { userId: string };
  TherapistDashboard: undefined;
  AppointmentCalendar: undefined;
  VideoSession: { appointmentId: string };
  SessionNotes: { patientId: string; appointmentId?: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export type RootNavigationProp = StackScreenProps<RootStackParamList>['navigation'];

const AccessibilityZoomButton: React.FC = () => {
  const { isZoomed, toggleZoom } = useAccessibilityZoom();
  const { t: tZoom } = useTranslation();

  return (
    <TouchableOpacity
      onPress={toggleZoom}
      style={styles.zoomButton}
      accessibilityRole="button"
      accessibilityLabel={tZoom('accessibility.toggleZoom', 'Zoom umschalten')}
      accessibilityState={{ checked: isZoomed }}
      accessibilityHint={tZoom('accessibility.zoomHint', 'Aktiviert größere Schrift und Buttons')}>
      <AppText style={styles.zoomIcon}>{isZoomed ? '🔍' : '🔎'}</AppText>
    </TouchableOpacity>
  );
};

export const RootNavigator = (): React.JSX.Element => {
  const { t, i18n } = useTranslation();
  const isNavigatingRef = useRef(false);
  const isWindows = Platform.OS === 'windows';

  const fastTransitionSpec = {
    open: {
      animation: 'timing' as const,
      config: {
        duration: isWindows ? 140 : 180,
        easing: Easing.out(Easing.quad),
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: isWindows ? 120 : 160,
        easing: Easing.in(Easing.quad),
      },
    },
  };

  const renderLanguageButton = (
    navigation: RootNavigationProp | null | undefined,
  ): React.JSX.Element => {
    // DEV: Log navigation state for debugging (Windows-specific)
    logDebug(
      `[LanguageButton] Render called, Platform.OS=${Platform.OS}, navigation exists: ${!!navigation}`,
    );

    const getCurrentRouteName = (): string | undefined => {
      try {
        const state = (
          navigation as unknown as {
            getState?: () => { routes?: Array<{ name?: string }>; index?: number };
          }
        )?.getState?.();
        if (!state || !Array.isArray(state.routes) || state.routes.length === 0) {
          return undefined;
        }
        const index = typeof state.index === 'number' ? state.index : state.routes.length - 1;
        const route = state.routes[index];
        return route?.name as string | undefined;
      } catch (err) {
        logError('[LanguageButton] Failed to read navigation state', err);
        return undefined;
      }
    };

    const handlePress = (): void => {
      logDebug(`[LanguageButton] Button pressed on ${Platform.OS}`);

      // Guard: Check navigation exists before any operation
      if (!navigation) {
        logError('[LanguageButton] Navigation object is null/undefined');
        Alert.alert('Error', 'Navigation unavailable. Please restart the app.');
        return;
      }

      if (isNavigatingRef.current) {
        logDebug('[LanguageButton] Navigation already in progress, ignoring press');
        return;
      }

      try {
        if (typeof navigation.navigate === 'function') {
          const currentRoute = getCurrentRouteName();
          if (currentRoute === 'SelectLanguage') {
            logDebug('[LanguageButton] Already on SelectLanguage, skip navigation');
            return;
          }

          logDebug('[LanguageButton] Navigating to SelectLanguage');
          if (Platform.OS === 'windows') {
            isNavigatingRef.current = true;
            InteractionManager.runAfterInteractions(() => {
              setTimeout(() => {
                try {
                  navigation.navigate('SelectLanguage');
                } catch (navErr) {
                  logError('[LanguageButton] Windows deferred navigation failed', navErr);
                  Alert.alert('Error', 'Could not open language selection.');
                } finally {
                  isNavigatingRef.current = false;
                }
              }, 0);
            });
          } else {
            navigation.navigate('SelectLanguage');
          }
        } else {
          logError('[LanguageButton] navigation.navigate is not a function');
          Alert.alert('Error', 'Navigation unavailable. Please restart the app.');
        }
      } catch (err) {
        isNavigatingRef.current = false;
        logError('[LanguageButton] Navigation failed', err);
        Alert.alert('Error', 'Could not open language selection.');
      }
    };

    const label = 'DIAGNOSTIC LANG';

    return (
      <TouchableOpacity
        style={styles.headerRightButton}
        onPress={handlePress}
        testID="btn-header-language"
        accessibilityRole="button"
        accessibilityLabel={label}>
        <AppText style={styles.headerRightText}>{(i18n.language || 'de').toUpperCase()}</AppText>
      </TouchableOpacity>
    );
  };

  const renderHeaderRight = (
    navigation: RootNavigationProp | null | undefined,
  ): React.JSX.Element => (
    <View style={styles.headerRight}>
      <AccessibilityZoomButton />
      {renderLanguageButton(navigation)}
    </View>
  );

  return (
    <Stack.Navigator
      initialRouteName="RoleSelection" // Start with Role selection per user prompt
      screenOptions={{
        animationEnabled: true,
        animationTypeForReplace: 'push',
        gestureEnabled: true,
        ...(isWindows
          ? TransitionPresets?.FadeFromBottomAndroid || {}
          : TransitionPresets?.SlideFromRightIOS || {}),
        transitionSpec: fastTransitionSpec,
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textInverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      {/* --- NEW FLOW START --- */}
      <Stack.Screen
        name="RoleSelection"
        component={RoleSelectionScreen}
        options={{ title: 'Willkommen', headerLeft: () => null }}
      />
      <Stack.Screen
        name="Privacy"
        component={PrivacyScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.consents'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="VisitReason"
        component={VisitReasonScreen}
        options={{ title: 'Besuchsgrund' }}
      />
      <Stack.Screen
        name="PatientStatus"
        component={PatientStatusScreen}
        options={{ title: 'Patientenstatus' }}
      />
      <Stack.Screen
        name="PatientType"
        component={PatientTypeScreen}
        options={{ title: 'Patiententyp' }}
      />
      <Stack.Screen
        name="DocumentRequest"
        component={DocumentRequestScreen}
        options={{ title: 'Anfrage' }}
      />
      <Stack.Screen
        name="PrescriptionRequest"
        component={PrescriptionRequestScreen}
        options={{ title: 'Rezept' }}
      />
      <Stack.Screen
        name="ReferralRequest"
        component={ReferralRequestScreen}
        options={{ title: 'Überweisung' }}
      />
      <Stack.Screen
        name="SickNoteRequest"
        component={SickNoteRequestScreen}
        options={{ title: 'Krankschreibung' }}
      />
      <Stack.Screen
        name="RequestSummary"
        component={RequestSummaryScreen}
        options={{ title: t('requestSummary.title', { defaultValue: 'Zusammenfassung' }) }}
      />
      {/* ---------------------- */}

      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={() => ({
          title: t('nav.home'),
          headerRight: () => null,
        })}
      />
      <Stack.Screen
        name="SelectLanguage"
        component={SelectLanguageScreen}
        options={{ title: t('nav.selectLanguage') }}
      />
      <Stack.Screen
        name="GDPRConsent"
        component={GDPRConsentScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.consents'),
          headerRight: () => renderHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="MasterPassword"
        component={MasterPasswordScreen}
        options={({ route }: StackScreenProps<RootStackParamList, 'MasterPassword'>) => ({
          title:
            route.params?.mode === 'setup'
              ? t('masterPassword.setupTitle', { defaultValue: 'Set Master Password' })
              : t('masterPassword.unlockTitle', { defaultValue: 'Unlock' }),
        })}
      />
      <Stack.Screen
        name="FastTrack"
        component={FastTrackScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('fastTrack.title', { defaultValue: 'Schnellzugang' }),
          headerRight: () => renderHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="PatientInfo"
        component={PatientInfoScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.patient'),
          headerRight: () => renderHeaderRight(navigation),
        })}
      />
      <Stack.Screen
        name="Questionnaire"
        component={QuestionnaireScreen}
        options={() => ({
          title: t('nav.questionnaire'),
          headerRight: () => null,
          gestureEnabled: false,
        })}
      />
      <Stack.Screen
        name="Summary"
        component={SummaryScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.summary'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Export"
        component={ExportScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.export'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="SavedAnamneses"
        component={SavedAnamnesesScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('home.saved'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Feedback"
        component={FeedbackScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('feedback.title', { defaultValue: 'Send Feedback' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Voice"
        component={VoiceScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('voice.title', { defaultValue: 'Voice Assistant' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('calculator.title', { defaultValue: 'Clinical Calculators' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="LabUpload"
        component={LabUploadScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('labUpload.title', { defaultValue: 'Laborbericht hochladen' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="DataManagement"
        component={DataManagementScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('dataManagement.title', { defaultValue: 'Data Management' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('dashboard.title', { defaultValue: 'Analysis' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      {/* Auth & Therapist Screens */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: t('auth.loginTitle', { defaultValue: 'Anmelden' }), headerShown: false }}
      />
      <Stack.Screen
        name="TwoFactor"
        component={TwoFactorScreen}
        options={{ title: t('auth.twoFactorTitle', { defaultValue: '2FA Verifizierung' }) }}
      />
      <Stack.Screen
        name="TherapistDashboard"
        component={TherapistDashboardScreen}
        options={{ title: t('therapistDashboard.title', { defaultValue: 'Dashboard' }), headerShown: false }}
      />
      <Stack.Screen
        name="AppointmentCalendar"
        component={AppointmentCalendarScreen}
        options={{ title: t('appointments.calendarTitle', { defaultValue: 'Terminkalender' }) }}
      />
      <Stack.Screen
        name="VideoSession"
        component={VideoSessionScreen}
        options={{ title: t('video.title', { defaultValue: 'Video-Sitzung' }) }}
      />
      <Stack.Screen
        name="SessionNotes"
        component={SessionNotesScreen}
        options={{ title: t('notes.title', { defaultValue: 'Sitzungsnotizen' }) }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerRightButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  headerRightText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600',
  },
  zoomButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginRight: 8,
  },
  zoomIcon: {
    fontSize: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
});
