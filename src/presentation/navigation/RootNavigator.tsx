/**
 * Root Navigator - Stack Navigation
 */

import React, { useRef } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  Platform,
  InteractionManager,
  Easing,
} from 'react-native';
import {
  createStackNavigator,
  StackScreenProps,

  // @ts-expect-error - TransitionPresets exists but moduleResolution: node16 can't find it
  TransitionPresets,
} from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { logError, logDebug } from '../../shared/logger';

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
import { DataManagementScreen } from '../screens/DataManagementScreen';

export type RootStackParamList = {
  Home: undefined;
  SelectLanguage: undefined;
  MasterPassword: { mode: 'setup' | 'unlock' };
  PatientInfo: undefined;
  GDPRConsent: undefined;
  Questionnaire: { questionnaireId?: string } | undefined;
  Summary: { questionnaireId: string };
  Export: { questionnaireId: string };
  SavedAnamneses: undefined;
  Feedback: undefined;
  Voice: undefined;
  Calculator: undefined;
  DataManagement: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = (): React.JSX.Element => {
  const { t } = useTranslation();
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

  type RootNavigationProp = StackScreenProps<RootStackParamList>['navigation'];

  /**
   * Renders the language button for the header.
   * Includes defensive guards against null navigation and t() function.
   * @security Handles platform-specific navigation issues gracefully
   */
  const renderLanguageButton = (navigation: RootNavigationProp | null | undefined) => {
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

    const handlePress = () => {
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

    // Safely get label with fallback
    const label = typeof t === 'function' ? t('nav.selectLanguage', 'Language') : 'Language';

    return (
      <TouchableOpacity
        style={styles.headerRightButton}
        onPress={handlePress}
        testID="btn-header-language"
        accessibilityRole="button"
        accessibilityLabel={label}>
        <Text style={styles.headerRightText}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        animationEnabled: true,
        animationTypeForReplace: 'push',
        gestureEnabled: true,
        transitionSpec: fastTransitionSpec,
        ...(isWindows
          ? TransitionPresets.FadeFromBottomAndroid
          : TransitionPresets.SlideFromRightIOS),
        headerStyle: {
          backgroundColor: '#2563eb',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.home'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="SelectLanguage"
        component={SelectLanguageScreen}
        options={{ title: t('nav.selectLanguage') }}
      />
      <Stack.Screen
        name="MasterPassword"
        component={MasterPasswordScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.masterPassword'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="PatientInfo"
        component={PatientInfoScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.patient'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="GDPRConsent"
        component={GDPRConsentScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.consents'),
          headerRight: () => renderLanguageButton(navigation),
        })}
      />
      <Stack.Screen
        name="Questionnaire"
        component={QuestionnaireScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('nav.questionnaire'),
          headerRight: () => renderLanguageButton(navigation),
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
        name="DataManagement"
        component={DataManagementScreen}
        options={({ navigation }: { navigation: RootNavigationProp }) => ({
          title: t('dataManagement.title', { defaultValue: 'Data Management' }),
          headerRight: () => renderLanguageButton(navigation),
        })}
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
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
