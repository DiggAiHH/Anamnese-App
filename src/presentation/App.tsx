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

// i18n
import './i18n/config';

// Database initialization
import { database } from '@infrastructure/persistence/DatabaseConnection';

const App = (): React.JSX.Element => {
  useEffect(() => {
    // Initialize database on app start
    const initializeApp = async (): Promise<void> => {
      try {
        await database.connect();
        console.warn('Database initialized successfully');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();

    // Cleanup on unmount
    return () => {
      database.close().catch(error => {
        console.error('Failed to close database:', error);
      });
    };
  }, []);

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
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
