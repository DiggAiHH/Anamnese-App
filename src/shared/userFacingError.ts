import { Alert } from 'react-native';
import { logError } from './logger';

type UserFacingErrorOptions = {
  title: string;
  message: string;
  error?: unknown;
};

export const reportUserError = ({ title, message, error }: UserFacingErrorOptions): void => {
  logError(`[UserFacingError] ${title}`, error);
  Alert.alert(title, message);
};
