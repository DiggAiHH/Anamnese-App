/**
 * InMemoryDocumentRepository Tests
 *
 * Tests document CRUD and storage stats.
 *
 * @security No PII in tests. Document paths are synthetic.
 */

import { InMemoryDocumentRepository } from '@infrastructure/persistence/InMemoryDocumentRepository';
import { DocumentEntity } from '@domain/entities/Document';

beforeAll(() => {
  Object.defineProperty(globalThis, 'crypto', {
    value: {
      ...globalThis.crypto,
      randomUUID: () => '00000000-0000-0000-0000-000000000001',
    },
    writable: true,
  });
});

describe('InMemoryDocumentRepository', () => {
  let repo: InMemoryDocumentRepository;
  const patientId = '00000000-0000-0000-0000-bbbbbbbbbbbb';

  let uuidCounter = 0;
  const nextUUID = (): void => {
    uuidCounter++;
    const hex = uuidCounter.toString(16).padStart(12, '0');
    globalThis.crypto.randomUUID = () => `00000000-0000-0000-0000-${hex}`;
  };

  const createDoc = (overrides?: Partial<Parameters<typeof DocumentEntity.create>[0]>) => {
    nextUUID();
    return DocumentEntity.create({
      patientId,
      type: 'medical_report',
      mimeType: 'application/pdf',
      fileName: 'report.pdf',
      fileSize: 1024,
      encryptedFilePath: '/encrypted/report.enc',
      ...overrides,
    });
  };

  beforeEach(() => {
    repo = new InMemoryDocumentRepository();
    uuidCounter = 0;
  });

  afterEach(() => {
    repo.clear();
  });

  describe('save()', () => {
    it('saves a document', async () => {
      await repo.save(createDoc());
      expect(repo.size()).toBe(1);
    });
  });

  describe('findById()', () => {
    it('returns document by id', async () => {
      const doc = createDoc();
      await repo.save(doc);
      const found = await repo.findById(doc.id);
      expect(found).not.toBeNull();
      expect(found!.fileName).toBe('report.pdf');
    });

    it('returns null for non-existent id', async () => {
      expect(await repo.findById('nope')).toBeNull();
    });
  });

  describe('findByPatientId()', () => {
    it('returns all documents for a patient', async () => {
      await repo.save(createDoc({ fileName: 'a.pdf' }));
      await repo.save(createDoc({ fileName: 'b.pdf' }));
      const results = await repo.findByPatientId(patientId);
      expect(results).toHaveLength(2);
    });

    it('returns empty for unknown patient', async () => {
      expect(await repo.findByPatientId('unknown')).toEqual([]);
    });
  });

  describe('findByQuestionnaireId()', () => {
    it('returns documents linked to a questionnaire', async () => {
      await repo.save(createDoc({ questionnaireId: '00000000-0000-0000-0000-ffffffffffff' }));
      await repo.save(createDoc({ questionnaireId: '00000000-0000-0000-0000-eeeeeeeeeeee' }));
      const results = await repo.findByQuestionnaireId('00000000-0000-0000-0000-ffffffffffff');
      expect(results).toHaveLength(1);
    });
  });

  describe('delete()', () => {
    it('removes document by id', async () => {
      const doc = createDoc();
      await repo.save(doc);
      await repo.delete(doc.id);
      expect(repo.size()).toBe(0);
    });
  });

  describe('deleteByPatientId() (DSGVO Art. 17)', () => {
    it('removes all documents for a patient', async () => {
      await repo.save(createDoc());
      await repo.save(createDoc());
      await repo.deleteByPatientId(patientId);
      expect(repo.size()).toBe(0);
    });

    it('does not delete other patient documents', async () => {
      await repo.save(createDoc({ patientId: '00000000-0000-0000-0000-dddddddddddd' }));
      await repo.save(createDoc());
      await repo.deleteByPatientId(patientId);
      expect(repo.size()).toBe(1);
    });
  });

  describe('getFilePath()', () => {
    it('returns encrypted file path', async () => {
      const doc = createDoc({ encryptedFilePath: '/enc/test.enc' });
      await repo.save(doc);
      const path = await repo.getFilePath(doc.id);
      expect(path).toBe('/enc/test.enc');
    });

    it('returns null for non-existent document', async () => {
      expect(await repo.getFilePath('missing')).toBeNull();
    });
  });

  describe('getStorageStats()', () => {
    it('calculates total files, size, and file type breakdown', async () => {
      await repo.save(createDoc({ fileSize: 1000, mimeType: 'application/pdf' }));
      await repo.save(createDoc({ fileSize: 2000, mimeType: 'image/jpeg' }));
      await repo.save(createDoc({ fileSize: 500, mimeType: 'application/pdf' }));

      const stats = await repo.getStorageStats(patientId);
      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(3500);
      expect(stats.fileTypes['application/pdf']).toBe(2);
      expect(stats.fileTypes['image/jpeg']).toBe(1);
    });

    it('returns zeroes for patient with no documents', async () => {
      const stats = await repo.getStorageStats('00000000-0000-0000-0000-999999999999');
      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
    });
  });

  describe('utility methods', () => {
    it('clear() removes all documents', async () => {
      await repo.save(createDoc());
      repo.clear();
      expect(repo.size()).toBe(0);
    });
  });
});
