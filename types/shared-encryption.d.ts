type PasswordValidationResult = {
  valid: boolean;
  errors: string[];
};

type SharedEncryptionModule = {
  PBKDF2_ITERATIONS: number;
  setCryptoProvider(provider: unknown): void;
  validatePasswordStrength(password: string): PasswordValidationResult;
  deriveKey(password: string, salt: Uint8Array, options?: { cryptoImpl?: unknown }): Promise<unknown>;
  encryptData(
    plaintext: string,
    password: string,
    options?: { skipValidation?: boolean; cryptoImpl?: unknown }
  ): Promise<string>;
  decryptData(encryptedBase64: string, password: string, options?: { cryptoImpl?: unknown }): Promise<string>;
};

declare module 'shared/encryption.js' {
  const SharedEncryption: SharedEncryptionModule;
  export = SharedEncryption;
}
