/**
 * SaveFastTrackRequestUseCase — persists a fast-track prescription/referral request.
 *
 * @security PII (firstName, lastName, birthDate) is encrypted with AES-256-GCM
 *           before storage. GDPR Art. 25 Privacy-by-Design compliant.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IEncryptionService } from '@domain/repositories/IEncryptionService';

export interface FastTrackRequestInput {
  firstName: string;
  lastName: string;
  birthDate: string;
  requestType: 'prescription' | 'referral';
  requestDetails: string;
}

export interface FastTrackRequestOutput {
  success: boolean;
  requestId?: string;
  error?: string;
}

const FAST_TRACK_STORAGE_KEY = '@anamnese_fast_track_requests';

export class SaveFastTrackRequestUseCase {
  constructor(private readonly encryptionService: IEncryptionService) {}

  async execute(
    input: FastTrackRequestInput,
    encryptionKey: string,
  ): Promise<FastTrackRequestOutput> {
    try {
      // Validate required fields
      if (!input.firstName.trim() || !input.lastName.trim() || !input.birthDate.trim()) {
        return { success: false, error: 'Required fields missing' };
      }

      // Encrypt PII before storage (GDPR Art. 25)
      const piiPayload = JSON.stringify({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        birthDate: input.birthDate.trim(),
      });
      const encryptedPII = await this.encryptionService.encrypt(piiPayload, encryptionKey);

      const requestId = `ft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const record = {
        id: requestId,
        requestType: input.requestType,
        requestDetails: input.requestDetails.trim(),
        encryptedPII,
        createdAt: new Date().toISOString(),
        status: 'pending' as const,
      };

      // Load existing requests, append, and save
      const existing = await AsyncStorage.getItem(FAST_TRACK_STORAGE_KEY);
      const requests: unknown[] = existing ? (JSON.parse(existing) as unknown[]) : [];
      requests.push(record);
      await AsyncStorage.setItem(FAST_TRACK_STORAGE_KEY, JSON.stringify(requests));

      return { success: true, requestId };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error saving fast-track request',
      };
    }
  }
}
