/**
 * EncryptedData Value Object - repräsentiert verschlüsselte Daten
 * 
 * Security:
 * - AES-256-GCM Verschlüsselung
 * - Immutable Value Object (keine Setter)
 * - Sichere IV (Initialization Vector) Generation
 */

import { z } from 'zod';

const PBKDF2_ITERATIONS = 600000;

export const EncryptedDataSchema = z.object({
  // Verschlüsselter Ciphertext (Base64)
  ciphertext: z.string(),
  // Initialization Vector (IV) für AES-GCM (Base64)
  iv: z.string(),
  // Authentication Tag für AES-GCM (Base64)
  authTag: z.string(),
  // Salt für Key Derivation (PBKDF2) (Base64)
  salt: z.string(),
  // Algorithm Info
  algorithm: z.literal('aes-256-gcm'),
  // Key Derivation Function Info
  kdf: z.object({
    name: z.literal('pbkdf2'),
    iterations: z.number(),
    hash: z.literal('sha256'),
  }),
  // Timestamp
  encryptedAt: z.date(),
});

export type EncryptedData = z.infer<typeof EncryptedDataSchema>;

/**
 * EncryptedData Value Object
 * 
 * Immutable - einmal erstellt, nicht mehr änderbar
 */
export class EncryptedDataVO {
  private constructor(private readonly data: EncryptedData) {
    EncryptedDataSchema.parse(data);
  }

  /**
   * Factory Method - erstellt verschlüsselte Daten
   */
  static create(params: {
    ciphertext: string;
    iv: string;
    authTag: string;
    salt: string;
  }): EncryptedDataVO {
    return new EncryptedDataVO({
      ciphertext: params.ciphertext,
      iv: params.iv,
      authTag: params.authTag,
      salt: params.salt,
      algorithm: 'aes-256-gcm',
      kdf: {
        name: 'pbkdf2',
        iterations: PBKDF2_ITERATIONS,
        hash: 'sha256',
      },
      encryptedAt: new Date(),
    });
  }

  // Getters (keine Setter - immutable!)
  get ciphertext(): string {
    return this.data.ciphertext;
  }

  get iv(): string {
    return this.data.iv;
  }

  get authTag(): string {
    return this.data.authTag;
  }

  get salt(): string {
    return this.data.salt;
  }

  get algorithm(): 'aes-256-gcm' {
    return this.data.algorithm;
  }

  get kdf(): EncryptedData['kdf'] {
    return this.data.kdf;
  }

  get encryptedAt(): Date {
    return this.data.encryptedAt;
  }

  /**
   * Equality Check (Value Objects vergleichen Werte, nicht Referenzen)
   */
  equals(other: EncryptedDataVO): boolean {
    return (
      this.data.ciphertext === other.data.ciphertext &&
      this.data.iv === other.data.iv &&
      this.data.authTag === other.data.authTag &&
      this.data.salt === other.data.salt
    );
  }

  /**
   * Zu JSON serialisieren (für Persistierung)
   */
  toJSON(): EncryptedData {
    return {
      ...this.data,
    };
  }

  /**
   * Von JSON deserialisieren
   */
  static fromJSON(json: EncryptedData): EncryptedDataVO {
    return new EncryptedDataVO({
      ...json,
      encryptedAt: new Date(json.encryptedAt),
    });
  }

  /**
   * Zu String für Speicherung (Base64 encoded JSON)
   */
  toString(): string {
    const json = JSON.stringify(this.toJSON());
    // In Node.js/React Native: Buffer verwenden
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(json).toString('base64');
    }
    // Fallback für Browser
    return btoa(json);
  }

  /**
   * Von String erstellen
   */
  static fromString(str: string): EncryptedDataVO {
    let json: string;
    
    if (typeof Buffer !== 'undefined') {
      json = Buffer.from(str, 'base64').toString('utf-8');
    } else {
      json = atob(str);
    }

    const parsed = JSON.parse(json);
    return EncryptedDataVO.fromJSON(parsed);
  }
}
