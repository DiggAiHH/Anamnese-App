import { Platform } from 'react-native';

import 'react-native-get-random-values';

import { NativeEncryptionService } from './NativeEncryptionService';
import { WebCryptoEncryptionService } from './WebCryptoEncryptionService';

/**
 * Single app-wide encryption service instance.
 *
 * Windows: WebCrypto-based implementation (no native quick-crypto dependency).
 * Others: Native quick-crypto implementation.
 */
export const encryptionService =
  Platform.OS === 'windows'
    ? new WebCryptoEncryptionService()
    : new NativeEncryptionService();
