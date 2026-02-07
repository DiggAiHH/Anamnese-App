/**
 * SessionGuard – wraps the app tree to enforce BSI session timeout.
 *
 * BSI IT-Grundschutz APP.3.1 A.8:
 *   - Locks session after 15 min inactivity
 *   - Wipes encryption key from memory
 *   - Navigates to MasterPassword unlock screen
 *
 * DSGVO Art. 32: Technical security measure for health data protection.
 *
 * @security This component MUST wrap the NavigationContainer to intercept
 *           navigation events as activity signals.
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSessionTimeout } from '../hooks/useSessionTimeout';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/routers';
import { type RootNavigationProp } from '../navigation/RootNavigator';

/**
 * Inner guard that has access to navigation context.
 * Must be rendered inside NavigationContainer.
 */
export const SessionTimeoutGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<RootNavigationProp>();
  const hasShownWarning = useRef(false);

  const handleLock = useCallback(() => {
    // Navigate to MasterPassword in unlock mode
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'MasterPassword' as const, params: { mode: 'unlock' } }],
      }),
    );

    Alert.alert(
      t('sessionTimeout.lockedTitle', { defaultValue: 'Sitzung gesperrt' }),
      t('sessionTimeout.lockedMessage', {
        defaultValue:
          'Ihre Sitzung wurde aus Sicherheitsgründen nach Inaktivität gesperrt. Bitte geben Sie Ihr Passwort erneut ein.',
      }),
    );
    hasShownWarning.current = false;
  }, [navigation, t]);

  const handleWarning = useCallback(() => {
    if (hasShownWarning.current) return;
    hasShownWarning.current = true;

    Alert.alert(
      t('sessionTimeout.warningTitle', { defaultValue: 'Sitzung läuft ab' }),
      t('sessionTimeout.warningMessage', {
        defaultValue:
          'Ihre Sitzung wird in 1 Minute wegen Inaktivität gesperrt. Berühren Sie den Bildschirm, um die Sitzung fortzusetzen.',
      }),
    );
  }, [t]);

  const { recordActivity } = useSessionTimeout({
    onLock: handleLock,
    onWarning: handleWarning,
  });

  return (
    <View
      style={styles.container}
      // BSI APP.3.1: Record any touch as activity
      onTouchStart={recordActivity}
      // Also record keyboard/pointer events on Windows
      onStartShouldSetResponder={() => {
        recordActivity();
        return false; // Don't steal touch events
      }}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
