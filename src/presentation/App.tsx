/**
 * Main App Entry Point für React Native
 * 
 * Setup:
 * - Navigation
 * - i18n
 * - Providers
 */

import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

// Navigation
import { RootNavigator } from './navigation/RootNavigator';

import { ToastProvider } from './components/ToastProvider';

// i18n
import './i18n/config';

// Database initialization
import { database } from '@infrastructure/persistence/DatabaseConnection';
import { logDebug, logError } from '@shared/logger';
import { useQuestionnaireStore } from './state/useQuestionnaireStore';
import { loadActiveSession } from '@shared/sessionPersistence';
import { loadPersistedEncryptionKeyIfOptedIn } from '@shared/keyManager';

const App = (): React.JSX.Element => {
  useEffect(() => {
    // Initialize database on app start
    const initializeApp = async (): Promise<void> => {
      try {
        await database.connect();
        logDebug('Database initialized successfully');

        const session = await loadActiveSession();
        if (session?.patientId || session?.questionnaireId) {
          useQuestionnaireStore
            .getState()
            .setActiveSessionIds(session.patientId ?? null, session.questionnaireId ?? null);
        }

        const storedKey = await loadPersistedEncryptionKeyIfOptedIn();
        if (storedKey) {
          useQuestionnaireStore.getState().setEncryptionKey(storedKey);
        }
      } catch (error) {
        logError('Failed to initialize database', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      database.close().catch(error => {
        logError('Failed to close database', error);
      });
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ToastProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
