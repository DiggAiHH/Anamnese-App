/**
 * useUnsavedChangesGuard — prevents accidental navigation away from forms with dirty state.
 *
 * Uses @react-navigation's `beforeRemove` event to intercept back navigation
 * and show a confirmation dialog when the form has unsaved changes.
 *
 * @example
 * ```tsx
 * useUnsavedChangesGuard(navigation, isDirty);
 * ```
 */

import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

type NavigationLike = {
  addListener: (event: 'beforeRemove', callback: (e: any) => void) => () => void;
  dispatch: (action: any) => void;
};

/**
 * @param navigation - The navigation object from the screen
 * @param isDirty - Whether the form has unsaved changes
 * @param options - Optional overrides for dialog text
 */
export function useUnsavedChangesGuard(
  navigation: NavigationLike,
  isDirty: boolean,
  options?: {
    title?: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  },
): void {
  const { t } = useTranslation();

  useEffect(() => {
    if (!isDirty) return;

    const unsubscribe = navigation.addListener('beforeRemove', (e: any) => {
      // Prevent default behavior (going back)
      e.preventDefault();

      Alert.alert(
        options?.title ??
          t('unsavedChanges.title', { defaultValue: 'Ungespeicherte Änderungen' }),
        options?.message ??
          t('unsavedChanges.message', {
            defaultValue:
              'Sie haben ungespeicherte Änderungen. Möchten Sie die Seite wirklich verlassen?',
          }),
        [
          {
            text:
              options?.cancelLabel ??
              t('unsavedChanges.stay', { defaultValue: 'Bleiben' }),
            style: 'cancel',
          },
          {
            text:
              options?.confirmLabel ??
              t('unsavedChanges.leave', { defaultValue: 'Verlassen' }),
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ],
      );
    });

    return unsubscribe;
  }, [navigation, isDirty, t, options]);
}
