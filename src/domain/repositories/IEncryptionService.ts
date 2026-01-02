/**
 * Service Interface für Encryption (AES-256-GCM)
 * 
 * Hinweis: Dies ist nur das Interface (Domain Layer)
 * Die Implementierung erfolgt im Infrastructure Layer mit react-native-quick-crypto
 */

import { EncryptedDataVO } from '../value-objects/EncryptedData';

export interface IEncryptionService {
  /**
   * Master Key aus Passwort ableiten (PBKDF2)
   * 
   * @param password Master Password (min. 16 Zeichen)
   * @param salt Salt für Key Derivation (wird generiert falls null)
   * @returns Derived Key (256 bit) + Salt
   */
  deriveKey(
    password: string,
    salt?: string,
  ): Promise<{
    key: string; // Base64
    salt: string; // Base64
  }>;

  /**
   * Daten verschlüsseln (AES-256-GCM)
   * 
   * @param data Plaintext
   * @param key Encryption Key (Base64)
   * @returns EncryptedDataVO
   */
  encrypt(data: string, key: string): Promise<EncryptedDataVO>;

  /**
   * Daten entschlüsseln (AES-256-GCM)
   * 
   * @param encryptedData EncryptedDataVO
   * @param key Decryption Key (Base64)
   * @returns Plaintext
   * @throws Error wenn Decryption fehlschlägt (falscher Key oder korrupte Daten)
   */
  decrypt(encryptedData: EncryptedDataVO, key: string): Promise<string>;

  /**
   * Passwort hashen (für Speicherung zum Verifizieren)
   * 
   * @param password Password
   * @returns Hashed Password (SHA-256)
   */
  hashPassword(password: string): Promise<string>;

  /**
   * Passwort verifizieren
   * 
   * @param password Password
   * @param hash Stored Hash
   * @returns true wenn korrekt
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;

  /**
   * Sicheren Random String generieren (für IVs, Salts, etc.)
   * 
   * @param length Länge in Bytes
   * @returns Random String (Base64)
   */
  generateRandomString(length: number): Promise<string>;
}
