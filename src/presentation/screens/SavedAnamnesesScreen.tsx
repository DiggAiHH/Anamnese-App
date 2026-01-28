/**
 * SavedAnamnesesScreen - lists locally stored patients and lets the user resume
 * the latest questionnaire for a selected patient.
 * ISO/WCAG: Token-based design system
 *
 * Features:
 * - Fuzzy search by name
 * - Filter by date range
 * - Filter by questionnaire status
 * - Sort by name/date
 */

import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  ListRenderItem,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { StackScreenProps } from '@react-navigation/stack';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { colors, spacing, radius } from '../theme/tokens';
import { Card } from '../components/Card';

import { SQLitePatientRepository } from '@infrastructure/persistence/SQLitePatientRepository';
import { SQLiteQuestionnaireRepository } from '@infrastructure/persistence/SQLiteQuestionnaireRepository';
import { PatientEntity } from '@domain/entities/Patient';
import { QuestionnaireEntity } from '@domain/entities/Questionnaire';
import { useQuestionnaireStore } from '../state/useQuestionnaireStore';

type Props = StackScreenProps<RootStackParamList, 'SavedAnamneses'>;

type Row = {
  patient: PatientEntity;
  latestQuestionnaire?: QuestionnaireEntity;
};

type FilterType = 'all' | 'completed' | 'inProgress' | 'recent';
type SortType = 'name' | 'date';

/** Row height constant for getItemLayout optimization */
const ROW_HEIGHT = 62; // paddingVertical: 14*2 + content ~34

/**
 * Simple fuzzy search - checks if search terms appear in text (case-insensitive)
 */
const fuzzyMatch = (text: string, search: string): boolean => {
  const searchLower = search.toLowerCase().trim();
  const textLower = text.toLowerCase();

  // Split search into words for multi-term matching
  const searchTerms = searchLower.split(/\s+/).filter(t => t.length > 0);

  // All terms must match
  return searchTerms.every(term => textLower.includes(term));
};

/**
 * Memoized patient row component for FlatList performance
 */
interface PatientRowProps {
  patient: PatientEntity;
  latestQuestionnaire?: QuestionnaireEntity;
  onPress: (row: Row) => void;
  metaText: string;
  nextLabel: string;
}

const PatientRow = memo(
  ({ patient, latestQuestionnaire, onPress, metaText, nextLabel }: PatientRowProps) => {
    const name = `${patient.encryptedData.lastName}, ${patient.encryptedData.firstName}`;

    const handlePress = useCallback(() => {
      onPress({ patient, latestQuestionnaire });
    }, [patient, latestQuestionnaire, onPress]);

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={handlePress}
        testID={`saved-row-${patient.id}`}
        accessibilityRole="button"
        accessibilityLabel={name}>
        <View style={styles.rowText}>
          <Text style={styles.rowTitle}>{name}</Text>
          <Text style={styles.rowSubtitle}>{metaText}</Text>
        </View>
        <Text style={styles.rowAction}>{nextLabel}</Text>
      </TouchableOpacity>
    );
  },
);

export const SavedAnamnesesScreen = ({ navigation }: Props): React.JSX.Element => {
  const { t } = useTranslation();
  const { encryptionKey, setPatient } = useQuestionnaireStore();

  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date');

  const subtitle = useMemo(() => {
    return encryptionKey ? t('privacy_info') : t('masterPassword.titleUnlock');
  }, [encryptionKey, t]);

  const load = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const patientRepo = new SQLitePatientRepository();
      const questionnaireRepo = new SQLiteQuestionnaireRepository();

      const patients = await patientRepo.findAll();
      const nextRows: Row[] = [];

      for (const patient of patients) {
        const questionnaires = await questionnaireRepo.findByPatientId(patient.id);
        nextRows.push({
          patient,
          latestQuestionnaire: questionnaires[0],
        });
      }

      setRows(nextRows);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : t('common.unknownError'),
      );
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
    const unsubscribe = navigation.addListener('focus', () => {
      load();
    });
    return unsubscribe;
  }, [load, navigation]);

  /**
   * Filtered and sorted rows based on search query and filters
   */
  const filteredRows = useMemo(() => {
    let result = [...rows];

    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(({ patient }) => {
        const fullName = `${patient.encryptedData.firstName} ${patient.encryptedData.lastName}`;
        return fuzzyMatch(fullName, searchQuery);
      });
    }

    // Apply status filter
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    switch (activeFilter) {
      case 'completed':
        result = result.filter(
          ({ latestQuestionnaire }) => latestQuestionnaire?.status === 'completed',
        );
        break;
      case 'inProgress':
        result = result.filter(
          ({ latestQuestionnaire }) => latestQuestionnaire?.status === 'in_progress',
        );
        break;
      case 'recent':
        result = result.filter(({ patient }) => patient.updatedAt >= sevenDaysAgo);
        break;
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const nameA = `${a.patient.encryptedData.lastName}, ${a.patient.encryptedData.firstName}`;
        const nameB = `${b.patient.encryptedData.lastName}, ${b.patient.encryptedData.firstName}`;
        return nameA.localeCompare(nameB);
      } else {
        // Sort by date (newest first)
        return b.patient.updatedAt.getTime() - a.patient.updatedAt.getTime();
      }
    });

    return result;
  }, [rows, searchQuery, activeFilter, sortBy]);

  const handleOpen = useCallback(
    (row: Row): void => {
      if (!encryptionKey) {
        Alert.alert(t('common.error'), t('questionnaire.patientMissing'));
        navigation.navigate('MasterPassword', { mode: 'unlock' });
        return;
      }

      if (!row.latestQuestionnaire) {
        Alert.alert(t('common.error'), t('questionnaire.noneLoaded'));
        return;
      }

      setPatient(row.patient);
      navigation.navigate('Questionnaire', { questionnaireId: row.latestQuestionnaire.id });
    },
    [encryptionKey, t, navigation, setPatient],
  );

  /** FlatList performance: fixed item height for fast scrolling */
  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ROW_HEIGHT,
      offset: ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  /** FlatList key extractor */
  const keyExtractor = useCallback((item: Row) => item.patient.id, []);

  /** FlatList render item */
  const renderItem: ListRenderItem<Row> = useCallback(
    ({ item }) => {
      const meta = item.latestQuestionnaire
        ? t('summary.subtitle', { id: item.latestQuestionnaire.id })
        : t('questionnaire.noneLoaded');

      return (
        <PatientRow
          patient={item.patient}
          latestQuestionnaire={item.latestQuestionnaire}
          onPress={handleOpen}
          metaText={meta}
          nextLabel={
            item.latestQuestionnaire ? t('home.resumeQuestionnaire') : t('home.openPatient')
          }
        />
      );
    },
    [handleOpen, t],
  );

  /** FlatList header component */
  const ListHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <Text style={styles.title} accessibilityRole="header">
          {t('home.saved')}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textMuted}
            testID="search-input"
            accessibilityLabel={t('search.placeholder')}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
              testID="clear-search"
              accessibilityLabel={t('common.clear')}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
          data={
            [
              { key: 'all', label: t('search.filterAll') },
              { key: 'recent', label: t('search.filterRecent') },
              { key: 'inProgress', label: t('search.filterInProgress') },
              { key: 'completed', label: t('search.filterCompleted') },
            ] as const
          }
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, activeFilter === item.key && styles.filterChipActive]}
              onPress={() => setActiveFilter(item.key as FilterType)}
              testID={`filter-${item.key}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: activeFilter === item.key }}>
              <Text
                style={[
                  styles.filterChipText,
                  activeFilter === item.key && styles.filterChipTextActive,
                ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Sort Toggle */}
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>{t('search.sortBy')}:</Text>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'date' && styles.sortButtonActive]}
            onPress={() => setSortBy('date')}
            accessibilityRole="radio"
            accessibilityState={{ selected: sortBy === 'date' }}>
            <Text style={[styles.sortButtonText, sortBy === 'date' && styles.sortButtonTextActive]}>
              {t('search.sortDate')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortButton, sortBy === 'name' && styles.sortButtonActive]}
            onPress={() => setSortBy('name')}
            accessibilityRole="radio"
            accessibilityState={{ selected: sortBy === 'name' }}>
            <Text style={[styles.sortButtonText, sortBy === 'name' && styles.sortButtonTextActive]}>
              {t('search.sortName')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Count */}
        {searchQuery.length > 0 && (
          <Text style={styles.resultsCount}>
            {t('search.results', { count: filteredRows.length })}
          </Text>
        )}
      </View>
    ),
    [t, subtitle, searchQuery, activeFilter, sortBy, filteredRows.length],
  );

  /** Empty state component */
  const ListEmpty = useMemo(
    () => (
      <Card>
        <Text style={styles.cardText}>
          {searchQuery.length > 0 ? t('search.noResults') : t('questionnaire.noneLoaded')}
        </Text>
        <Text style={styles.cardSubtext}>
          {searchQuery.length > 0 ? t('search.tryDifferent') : t('home.startNew')}
        </Text>
      </Card>
    ),
    [searchQuery, t],
  );

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={styles.content}
      data={filteredRows}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      getItemLayout={getItemLayout}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={ListEmpty}
      removeClippedSubviews={true}
      maxToRenderPerBatch={15}
      windowSize={10}
      initialNumToRender={10}
      testID="saved-screen"
      accessibilityRole="list"
      accessibilityLabel={t('home.saved')}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  listHeader: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  // Search styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  clearButton: {
    padding: spacing.sm,
  },
  clearButtonText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  // Filter styles
  filterContainer: {
    marginBottom: spacing.sm,
    maxHeight: 44,
  },
  filterContent: {
    paddingRight: spacing.lg,
    gap: spacing.sm,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.textInverse,
  },
  // Sort styles
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sortLabel: {
    fontSize: 14,
    color: colors.textMuted,
  },
  sortButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButtonActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  sortButtonText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  sortButtonTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  // Results count
  resultsCount: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  center: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  listCard: {
    padding: 0,
    overflow: 'hidden',
  },
  cardText: {
    padding: spacing.md,
    color: colors.textSecondary,
  },
  cardSubtext: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    color: colors.textMuted,
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  rowAction: {
    color: colors.primary,
    fontWeight: '700',
  },
});
