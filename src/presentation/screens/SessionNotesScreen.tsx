/**
 * SessionNotesScreen - Encrypted therapy session notes
 *
 * Only visible to therapists. Notes encrypted with AES-256-GCM.
 *
 * @security Content encrypted before storage. Decryption requires therapist's key.
 * @gdpr Art. 9 health data. Crypto-shredding via key deletion. No PII in logs.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import { AppText } from '../components/AppText';
import { AppInput } from '../components/AppInput';
import { AppButton } from '../components/AppButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../state/useAuthStore';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';
import { SessionNoteService } from '../../application/services/SessionNoteService';
import { createSessionNoteRepoSync } from '../../infrastructure/persistence/RepositoryFactory';
import type { SessionNoteEntity } from '../../domain/entities/SessionNote';
import { colors, spacing, radius } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Props = StackScreenProps<RootStackParamList, 'SessionNotes'>;

const noteRepo = createSessionNoteRepoSync();
const noteService = new SessionNoteService(noteRepo);

const AVAILABLE_TAGS = ['progress', 'anxiety', 'depression', 'medication', 'crisis', 'homework', 'goals'];

export const SessionNotesScreen = ({ route }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { isHighContrast } = useTheme();
  const userId = useAuthStore(s => s.userId);
  const authEncryptionKey = useAuthStore(s => s.encryptionKey);
  const questionnaireEncryptionKey = useQuestionnaireStore(s => s.encryptionKey);
  // Use auth store key (therapist login) or questionnaire store key (patient flow)
  const encryptionKey = authEncryptionKey || questionnaireEncryptionKey;

  const patientId = route.params?.patientId || '';
  const appointmentId = route.params?.appointmentId || '';

  const [notes, setNotes] = useState<SessionNoteEntity[]>([]);
  const [decryptedNotes, setDecryptedNotes] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const loadNotes = useCallback(async () => {
    if (!userId || !patientId) return;
    setIsLoading(true);
    try {
      const patientNotes = await noteService.getPatientNotes(userId, patientId);
      setNotes(patientNotes);

      // Decrypt notes if encryption key available
      if (encryptionKey) {
        const decrypted = new Map<string, string>();
        for (const note of patientNotes) {
          try {
            const result = await noteService.readNote(note.id, encryptionKey);
            if (result.success && result.decryptedContent) {
              decrypted.set(note.id, result.decryptedContent);
            }
          } catch {
            decrypted.set(note.id, '[Entschlüsselung fehlgeschlagen]');
          }
        }
        setDecryptedNotes(decrypted);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, [userId, patientId, encryptionKey]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleSaveNote = async (): Promise<void> => {
    if (!userId || !encryptionKey) {
      Alert.alert(
        t('common.error'),
        t('notes.encryptionRequired', {
          defaultValue: 'Verschlüsselungsschlüssel erforderlich. Bitte zuerst Passwort eingeben.',
        }),
      );
      return;
    }

    if (!noteContent.trim()) {
      Alert.alert(t('common.error'), t('notes.emptyContent', { defaultValue: 'Bitte Notiz eingeben.' }));
      return;
    }

    setIsSaving(true);
    try {
      const result = await noteService.createNote(
        appointmentId || `standalone-${Date.now()}`,
        userId,
        patientId || 'unassigned',
        noteContent.trim(),
        encryptionKey,
        new Date().toISOString(),
        selectedTags,
      );

      if (result.success) {
        setNoteContent('');
        setSelectedTags([]);
        setShowEditor(false);
        loadNotes();
        Alert.alert(
          t('common.success'),
          t('notes.saved', { defaultValue: 'Notiz verschlüsselt gespeichert.' }),
        );
      } else {
        Alert.alert(t('common.error'), t(result.error || 'notes.createFailed'));
      }
    } catch {
      Alert.alert(t('common.error'), t('notes.createFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = (noteId: string): void => {
    Alert.alert(
      t('notes.deleteTitle', { defaultValue: 'Notiz löschen?' }),
      t('notes.deleteConfirm', { defaultValue: 'Diese Aktion kann nicht rückgängig gemacht werden.' }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete', { defaultValue: 'Löschen' }),
          style: 'destructive',
          onPress: async () => {
            await noteService.deleteNote(noteId);
            loadNotes();
          },
        },
      ],
    );
  };

  const toggleTag = (tag: string): void => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag],
    );
  };

  return (
    <ScreenContainer testID="session-notes-screen" accessibilityLabel="Session Notes">
    <View style={[styles.container, isHighContrast && styles.containerHC]}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <AppText variant="h2" style={[styles.title, isHighContrast && styles.textHC]}>
            {t('notes.title', { defaultValue: 'Sitzungsnotizen' })}
          </AppText>
          <AppText style={[styles.subtitle, isHighContrast && styles.textHC]}>
            {t('notes.subtitle', {
              defaultValue: 'Verschlüsselte Notizen — nur für Sie sichtbar.',
            })}
          </AppText>
        </View>

        {/* New Note Button */}
        <AppButton
          title={showEditor
            ? t('common.cancel')
            : t('notes.newNote', { defaultValue: '✏️ Neue Notiz' })
          }
          variant={showEditor ? 'secondary' : 'primary'}
          onPress={() => setShowEditor(!showEditor)}
          testID="btn-toggle-editor"
        />

        {/* Note Editor */}
        {showEditor && (
          <View style={styles.editor}>
            <AppInput
              label={t('notes.content', { defaultValue: 'Notiz' })}
              required
              value={noteContent}
              onChangeText={setNoteContent}
              placeholder={t('notes.contentPlaceholder', {
                defaultValue: 'Sitzungsnotiz eingeben...',
              })}
              multiline
              numberOfLines={6}
              testID="input-note-content"
            />

            {/* Tags */}
            <View style={styles.tagsSection}>
              <AppText style={styles.tagsLabel}>
                {t('notes.tags', { defaultValue: 'Tags' })}:
              </AppText>
              <View style={styles.tagsList}>
                {AVAILABLE_TAGS.map(tag => (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, selectedTags.includes(tag) && styles.tagActive]}
                    onPress={() => toggleTag(tag)}>
                    <AppText style={[styles.tagText, selectedTags.includes(tag) && styles.tagTextActive]}>
                      {t(`notes.tag_${tag}`, tag)}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <AppButton
              title={t('notes.save', { defaultValue: '🔒 Verschlüsselt speichern' })}
              onPress={handleSaveNote}
              disabled={isSaving || !noteContent.trim()}
              loading={isSaving}
              testID="btn-save-note"
            />
          </View>
        )}

        {/* Notes List */}
        <View style={styles.notesList}>
          <AppText variant="h3" style={[styles.sectionTitle, isHighContrast && styles.textHC]}>
            {t('notes.history', { defaultValue: 'Verlauf' })} ({notes.length})
          </AppText>

          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : notes.length === 0 ? (
            <View style={styles.emptyState}>
              <AppText style={styles.emptyText}>
                {t('notes.noNotes', { defaultValue: 'Noch keine Notizen vorhanden.' })}
              </AppText>
            </View>
          ) : (
            notes.map(note => (
              <View key={note.id} style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <AppText style={styles.noteDate}>
                    {new Date(note.sessionDate).toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </AppText>
                  <TouchableOpacity onPress={() => handleDeleteNote(note.id)}>
                    <AppText style={styles.deleteBtn}>🗑️</AppText>
                  </TouchableOpacity>
                </View>

                <AppText style={styles.noteContent}>
                  {decryptedNotes.get(note.id) || '🔒 [Verschlüsselt]'}
                </AppText>

                {note.tags.length > 0 && (
                  <View style={styles.noteTags}>
                    {note.tags.map(tag => (
                      <View key={tag} style={styles.noteTag}>
                        <AppText style={styles.noteTagText}>{tag}</AppText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        {/* GDPR Info */}
        <View style={styles.gdprBox}>
          <AppText style={styles.gdprText}>
            🔒 {t('notes.gdprInfo', {
              defaultValue:
                'Alle Notizen sind mit AES-256-GCM verschlüsselt. Nur Sie als Therapeut können diese entschlüsseln. ' +
                'DSGVO Art. 9: Gesundheitsdaten werden ausschließlich lokal und verschlüsselt gespeichert.',
            })}
          </AppText>
        </View>
      </ScrollView>
    </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerHC: { backgroundColor: '#000' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xl },
  header: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.xs },
  subtitle: { fontSize: 14, color: colors.textMuted },
  textHC: { color: '#fff' },
  editor: {
    gap: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  tagsSection: { gap: spacing.xs },
  tagsLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
  tagsList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  tagChip: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  tagActive: { borderColor: colors.primary, backgroundColor: colors.infoSurface || '#E3F2FD' },
  tagText: { fontSize: 12, color: colors.text },
  tagTextActive: { color: colors.primary, fontWeight: '600' },
  notesList: { marginTop: spacing.xl },
  sectionTitle: { marginBottom: spacing.md },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  emptyText: { color: colors.textMuted },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  noteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  noteDate: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  deleteBtn: { fontSize: 18, padding: 4 },
  noteContent: { fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: spacing.sm },
  noteTags: { flexDirection: 'row', gap: spacing.xs },
  noteTag: {
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.infoSurface || '#E3F2FD',
  },
  noteTagText: { fontSize: 11, color: colors.primary },
  gdprBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  gdprText: { fontSize: 12, color: '#1B5E20', lineHeight: 18 },
});
