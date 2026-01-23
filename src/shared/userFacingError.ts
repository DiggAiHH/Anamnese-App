import { Alert } from 'react-native';
import { logError } from './logger';

type UserFacingErrorOptions = {
  title: string;
  message: string;
  error?: unknown;
};

export const showUserErrorAlert = ({ title, message }: Pick<UserFacingErrorOptions, 'title' | 'message'>): void => {
  Alert.alert(title, message);
};

export const reportUserError = ({ title, message, error }: UserFacingErrorOptions): void => {
  logError(`[UserFacingError] ${title}`, error);
  showUserErrorAlert({ title, message });
};
