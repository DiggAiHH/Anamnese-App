/**
 * ErrorBoundary - GDPR-compliant React error boundary
 *
 * Catches React rendering errors without exposing component state/props
 * that might contain patient data or PII.
 *
 * @security Critical for DSGVO Art. 9 compliance - no health data in logs
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { withTranslation, WithTranslation } from 'react-i18next';
import { sanitizeError, SanitizedError } from '../../shared/sanitizeError';
import { logError, logDebug } from '../../shared/logger';
import { AppButton } from './AppButton';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: SanitizedError) => void;
}

interface State {
  hasError: boolean;
  errorType?: string;
}

/**
 * ErrorBoundary catches React rendering errors and displays a safe fallback UI.
 *
 * IMPORTANT: This boundary intentionally does NOT log component state or props
 * as they may contain patient data (questionnaire answers, medical info, etc.)
 *
 * @example
 * <ErrorBoundary onError={(e) => analytics.logEvent('crash', { type: e.type })}>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Only store error type, never the message (may contain PII)
    return {
      hasError: true,
      errorType: error.name || 'UnknownError',
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Sanitize error before any logging/reporting
    const safeError = sanitizeError(error);

    // Log only in development, and only sanitized data
    logError('[ErrorBoundary] Caught error', safeError);
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // Component stack is safe (no user data), log it in dev
      logDebug(`[ErrorBoundary] Component stack: ${errorInfo.componentStack}`);
    }

    // Call optional error handler with sanitized error
    if (this.props.onError) {
      this.props.onError(safeError);
    }
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, errorType: undefined });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI with translations
      const { t } = this.props;
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>⚠️</Text>
          <Text style={styles.title}>{t('error.boundaryTitle')}</Text>
          <Text style={styles.subtitle}>
            {t('error.boundaryMessage')}
          </Text>
          <Text style={styles.subtitle}>
            {t('error.dataSafe')}
          </Text>
          <AppButton
            title={t('error.tryAgain')}
            onPress={this.handleRetry}
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  button: {
    marginTop: 24,
  },
});

// Export wrapped component with translations
export const ErrorBoundary = withTranslation()(ErrorBoundaryClass);
export default ErrorBoundary;
