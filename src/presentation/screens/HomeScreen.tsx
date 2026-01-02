/**
 * Home Screen - App Entry Point
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export const HomeScreen = (_: Props): React.JSX.Element => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Willkommen zur Anamnese-App</Text>
        <Text style={styles.subtitle}>
          DSGVO-konforme medizinische Anamnese
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => {
              // TODO: Navigation implementieren
              console.warn('Neue Anamnese starten');
            }}>
            <Text style={styles.primaryButtonText}>Neue Anamnese starten</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              console.warn('Gespeicherte Anamnesen laden');
            }}>
            <Text style={styles.secondaryButtonText}>
              Gespeicherte Anamnesen
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Datenschutz</Text>
          <Text style={styles.infoText}>
            • Alle Daten bleiben lokal auf Ihrem Gerät{'\n'}
            • AES-256 Verschlüsselung{'\n'}
            • Keine externen Server{'\n'}
            • DSGVO-konform
          </Text>
        </View>

        <View style={styles.featuresList}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.featureItem}>✓ 19 Sprachen</Text>
          <Text style={styles.featureItem}>✓ Offline-First</Text>
          <Text style={styles.featureItem}>✓ Spracherkennung</Text>
          <Text style={styles.featureItem}>✓ OCR für Dokumente</Text>
          <Text style={styles.featureItem}>✓ GDT Export</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 32,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#2563eb',
    fontSize: 18,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  featuresList: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 8,
  },
});
