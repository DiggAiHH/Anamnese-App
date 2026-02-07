/**
 * @format
 */

// Polyfill crypto for UUID/Password generation


// Safe import for react-native-gesture-handler (may crash on Windows if not linked)
try {
  require('react-native-gesture-handler');
} catch (e) {
  // Gesture handler not available on this platform, continue without it
  if (__DEV__) {
    console.warn('[GestureHandler] Not available:', e?.message || e);
  }
}

// Dev-only guard to pinpoint the source of "Text strings must be rendered within a <Text> component"
import './src/shared/devNakedTextGuard';

import React from 'react';
import { AppRegistry } from 'react-native';
import App from './src/presentation/App';
import ErrorBoundary from './src/presentation/components/ErrorBoundary';
import { name as appName } from './package.json';

/**
 * Wrapped App with ErrorBoundary for graceful error handling
 * Catches React rendering errors and displays fallback UI
 */
const WrappedApp = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => WrappedApp);
