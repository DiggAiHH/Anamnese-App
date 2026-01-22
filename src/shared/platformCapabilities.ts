import { Platform } from 'react-native';

export const platformOS = Platform.OS;
export const isWindows = platformOS === 'windows';
export const isMacOS = platformOS === 'macos';
export const isWeb = platformOS === 'web';
export const isIOS = platformOS === 'ios';
export const isAndroid = platformOS === 'android';

export const supportsTTS = isIOS || isAndroid;
export const supportsSpeechToText = isIOS || isAndroid;
export const supportsOCR = isIOS || isAndroid;
export const supportsDocumentPicker = isIOS || isAndroid;
export const supportsShare = isIOS || isAndroid;
export const supportsRNFS = isIOS || isAndroid;
export const supportsSQLite = isIOS || isAndroid || isWindows;
export const supportsSecureKeychain = isIOS || isAndroid || isMacOS;

export const supportsWebCrypto = (): boolean => {
  const cryptoCandidate = (globalThis as { crypto?: unknown } | undefined)?.crypto as
    | { subtle?: unknown; getRandomValues?: unknown }
    | undefined;
  return !!cryptoCandidate?.getRandomValues;
};

export const canUseQuickCrypto = (): boolean => {
  if (isWeb || isWindows) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const qc = require('react-native-quick-crypto') as {
      randomBytes?: unknown;
      pbkdf2?: unknown;
      createCipheriv?: unknown;
      createDecipheriv?: unknown;
    };
    return (
      typeof qc?.randomBytes === 'function' &&
      typeof qc?.pbkdf2 === 'function' &&
      typeof qc?.createCipheriv === 'function' &&
      typeof qc?.createDecipheriv === 'function'
    );
  } catch {
    return false;
  }
};

export const canUseSQLite = (): boolean => {
  if (!supportsSQLite) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('react-native-sqlite-storage');
    const sqlite = (mod?.default ?? mod) as { openDatabase?: unknown } | undefined;
    return typeof sqlite?.openDatabase === 'function';
  } catch {
    return false;
  }
};
