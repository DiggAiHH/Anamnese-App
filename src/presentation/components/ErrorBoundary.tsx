/**
 * ErrorBoundary - GDPR-compliant React error boundary
 *
 * Catches React rendering errors without exposing component state/props
 * that might contain patient data or PII.
 *
 * @security Critical for DSGVO Art. 9 compliance - no health data in logs
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { withTranslation, WithTranslation } from 'react-i18next';
import { sanitizeError, SanitizedError } from '../../shared/sanitizeError';
import { logError, logDebug } from '../../shared/logger';

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: SanitizedError) => void;
}

interface State {
  hasError: boolean;
  errorType?: string;
  componentStack?: string;
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
      const componentStack = String(errorInfo.componentStack || '').trim();
      if (componentStack) {
        logDebug(`[ErrorBoundary] Component stack:\n${componentStack}`);
      }

      // Allowlisted dev hint: safe to log because message is generic and contains no user data.
      // Do NOT log arbitrary error messages (may contain PII).
      if (
        typeof safeError.message === 'string' &&
        safeError.message.includes('Text strings must be rendered within a <Text> component')
      ) {
        logDebug('[ErrorBoundary] Hint: RN "naked text" render error detected. Use the component stack above to locate the offending component.');
      }

      // Also keep the stack in state for on-screen diagnostics (dev only)
      if (componentStack) {
        this.setState({ componentStack });
      }
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
          <Text style={styles.subtitle}>{t('error.boundaryMessage')}</Text>
          <Text style={styles.subtitle}>{t('error.dataSafe')}</Text>

          {typeof __DEV__ !== 'undefined' && __DEV__ && this.state.componentStack ? (
            <View style={styles.debugBox}>
              <Text style={styles.debugTitle}>DEV Component Stack</Text>
              <Text style={styles.debugStack} selectable>
                {this.state.componentStack}
              </Text>
            </View>
          ) : null}

          <Pressable onPress={this.handleRetry} style={styles.retryButton}>
            <Text style={styles.retryText}>{t('error.tryAgain')}</Text>
          </Pressable>
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
  retryButton: {
    marginTop: 24,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
  },
  debugBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e6e6e6',
    maxWidth: 520,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 8,
    textAlign: 'center',
  },
  debugStack: {
    fontSize: 10,
    color: '#333',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

// Export wrapped component with translations
export const ErrorBoundary = withTranslation()(ErrorBoundaryClass);
export default ErrorBoundary;
