import {
  DocumentRequestPriority,
  DocumentRequestStatus,
  DocumentType,
  type IPrescriptionRequest,
} from '../../../src/domain/entities/DocumentRequest';
import { EncryptedDataVO } from '../../../src/domain/value-objects/EncryptedData';
import { encryptionService } from '../../../src/infrastructure/encryption/encryptionService';
import { buildDocumentRequestMailtoUri } from '../../../src/application/services/DocumentRequestMailService';

jest.mock('../../../src/infrastructure/encryption/encryptionService', () => ({
  encryptionService: {
    encrypt: jest.fn(),
  },
}));

describe('DocumentRequestMailService', () => {
  const practiceEmail = 'practice@example.com';
  const request: IPrescriptionRequest = {
    id: 'req-1',
    documentType: DocumentType.REZEPT,
    title: 'Rezept',
    priority: DocumentRequestPriority.NORMAL,
    status: DocumentRequestStatus.DRAFT,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    medicationName: 'Ibuprofen 400mg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createEncryptedPayload = (): EncryptedDataVO =>
    EncryptedDataVO.create({
      ciphertext: 'ciphertext',
      iv: 'iv',
      authTag: 'authTag',
      salt: 'salt',
    });

  const parseMailto = (mailto: string): { subject: string; body: string } => {
    const query = mailto.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    return {
      subject: decodeURIComponent(params.get('subject') ?? ''), // decode for readable assertions
      body: decodeURIComponent(params.get('body') ?? ''),
    };
  };

  it('builds encrypted mailto without patient name or PHI in subject/body', async () => {
    const encrypted = createEncryptedPayload();
    (encryptionService.encrypt as jest.Mock).mockResolvedValue(encrypted);

    const mailto = await buildDocumentRequestMailtoUri(
      request,
      practiceEmail,
      'Max Mustermann',
      'key',
    );
    const { subject, body } = parseMailto(mailto);

    expect(subject).toContain('[Anamnese-App]');
    expect(subject).not.toContain('Max Mustermann'); // no PHI in subject
    expect(body).toContain('Verschlüsselte Daten');
    expect(body).not.toContain('Ibuprofen 400mg'); // no PHI in readable body
    expect(body).toContain(encrypted.toString());
  });

  it('throws when encryption fails', async () => {
    (encryptionService.encrypt as jest.Mock).mockRejectedValue(new Error('boom'));

    await expect(
      buildDocumentRequestMailtoUri(request, practiceEmail, undefined, 'key'),
    ).rejects.toThrow('Encryption failed');
  });
});
