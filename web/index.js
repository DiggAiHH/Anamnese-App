import React from 'react';
import { AppRegistry } from 'react-native';
import App from '../src/presentation/App';
import ErrorBoundary from '../src/presentation/components/ErrorBoundary';
import { name as appName } from '../app.json';

const WrappedApp = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

AppRegistry.registerComponent(appName, () => WrappedApp);

AppRegistry.runApplication(appName, {
  rootTag: document.getElementById('root'),
});
