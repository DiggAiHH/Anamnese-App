/**
 * @fileoverview Unit tests for PDFTemplateService
 */

import {
  PDFTemplateService,
  PDFTemplateInput,
  PDFTemplateOptions,
} from '../../../src/application/services/PDFTemplateService';
import { PatientEntity } from '../../../src/domain/entities/Patient';
import { QuestionnaireEntity } from '../../../src/domain/entities/Questionnaire';
import { AnswerValue } from '../../../src/domain/entities/Answer';

describe('PDFTemplateService', () => {
  // Mock patient with encrypted data structure matching actual entity
  const mockPatient = {
    id: 'patient-123',
    encryptedData: {
      firstName: 'Max',
      lastName: 'Mustermann',
      birthDate: '1985-06-15',
      gender: 'male',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    language: 'de',
    gdprConsents: [],
    auditLog: [],
    addAuditLog: jest.fn().mockReturnThis(),
    sections: [],
  } as unknown as PatientEntity;

  // Mock questionnaire with sections structure matching actual entity
  const mockQuestionnaire = {
    id: 'questionnaire-001',
    version: '1.0',
    patientId: 'patient-123',
    status: 'in_progress',
    sections: [
      {
        id: 'section-1',
        titleKey: 'Persönliche Angaben',
        order: 1,
        questions: [
          { id: 'q1', labelKey: 'Haben Sie Allergien?', type: 'checkbox' },
          { id: 'q2', labelKey: 'Welche Medikamente nehmen Sie?', type: 'text' },
        ],
      },
      {
        id: 'section-2',
        titleKey: 'Vorerkrankungen',
        order: 2,
        questions: [
          { id: 'q3', labelKey: 'Haben Sie Diabetes?', type: 'checkbox' },
          { id: 'q4', labelKey: 'Blutdruck (systolisch)', type: 'number' },
        ],
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  } as unknown as QuestionnaireEntity;

  const mockAnswers = new Map<string, AnswerValue>([
    ['q1', true],
    ['q2', 'Aspirin, Ibuprofen'],
    ['q3', false],
    ['q4', 120],
  ]);

  const defaultOptions: PDFTemplateOptions = {
    template: 'detailed',
    includePatientInfo: true,
    includeTimestamp: true,
    language: 'de',
    title: 'Allgemeine Anamnese',
  };

  describe('HTML Generation', () => {
    it('should generate valid HTML document', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('<html lang="de">');
      expect(result.html).toContain('</html>');
    });

    it('should include questionnaire title', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Allgemeine Anamnese');
    });

    it('should use custom title when provided', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, title: 'Custom Report Title' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Custom Report Title');
    });

    it('should include timestamp when enabled', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, includeTimestamp: true },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('class="subtitle"');
    });

    it('should exclude timestamp when disabled', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, includeTimestamp: false },
      };

      const result = PDFTemplateService.generate(input);

      // Should not have subtitle with timestamp
      expect(result.html).not.toMatch(/class="subtitle"[^>]*>/);
    });
  });

  describe('Patient Information', () => {
    it('should include patient info when enabled', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, includePatientInfo: true },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Max M.'); // First name + last initial
      expect(result.html).toContain('1985'); // Birth year
      expect(result.html).toContain('Männlich'); // Gender in German
    });

    it('should exclude patient info when disabled', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, includePatientInfo: false },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).not.toContain('Max M.');
      // Should not have patient info section in the body
      expect(result.html).not.toContain('<div class="patient-info">');
    });

    it('should translate gender to English', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, language: 'en', includePatientInfo: true },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Male');
    });
  });

  describe('Answer Formatting', () => {
    it('should format boolean answers in German', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, language: 'de' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Ja'); // true -> Ja
      expect(result.html).toContain('Nein'); // false -> Nein
    });

    it('should format boolean answers in English', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, language: 'en' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Yes');
      expect(result.html).toContain('No');
    });

    it('should display text answers', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Aspirin, Ibuprofen');
    });

    it('should display number answers', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('120');
    });

    it('should handle missing answers with placeholder', () => {
      const emptyAnswers = new Map<string, AnswerValue>();
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: emptyAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('—'); // Em dash placeholder
      expect(result.html).toContain('answer-empty');
    });

    it('should handle array answers', () => {
      const arrayAnswers = new Map<string, AnswerValue>([
        ['q1', ['Option A', 'Option B', 'Option C']],
      ]);
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: arrayAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Option A, Option B, Option C');
    });
  });

  describe('Template Types', () => {
    it('should apply compact styles for compact template', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, template: 'compact' },
      };

      const result = PDFTemplateService.generate(input);

      // Compact has specific styles
      expect(result.html).toContain('font-size: 10px');
      expect(result.html).toContain('display: flex');
    });

    it('should apply detailed styles for detailed template', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, template: 'detailed' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('padding: 20px');
      expect(result.html).toContain('background: #fafafa');
    });

    it('should apply print-friendly styles for printFriendly template', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, template: 'printFriendly' },
      };

      const result = PDFTemplateService.generate(input);

      // Print-friendly has white backgrounds and minimal color
      expect(result.html).toContain('.patient-info { background: white;');
      expect(result.html).toContain('.section-title { background: white;');
    });
  });

  describe('Section Rendering', () => {
    it('should render all questionnaire sections', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Persönliche Angaben');
      expect(result.html).toContain('Vorerkrankungen');
    });

    it('should render all questions', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Haben Sie Allergien?');
      expect(result.html).toContain('Welche Medikamente nehmen Sie?');
      expect(result.html).toContain('Haben Sie Diabetes?');
      expect(result.html).toContain('Blutdruck (systolisch)');
    });
  });

  describe('Footer', () => {
    it('should include default footer in German', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, language: 'de' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Anamnese-App');
      expect(result.html).toContain('DSGVO-konform');
    });

    it('should include default footer in English', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, language: 'en' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('GDPR compliant');
    });

    it('should use custom footer when provided', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, footerText: 'Custom Footer Text' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('Custom Footer Text');
    });
  });

  describe('Page Estimation', () => {
    it('should estimate pages for compact template', () => {
      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: { ...defaultOptions, template: 'compact' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.estimatedPages).toBe(1); // 4 questions / 30 per page
    });

    it('should estimate more pages for detailed template', () => {
      // Create questionnaire with many questions
      const largeQuestionnaire = {
        ...mockQuestionnaire,
        sections: [
          {
            id: 'section-1',
            titleKey: 'Large Section',
            order: 1,
            questions: Array.from({ length: 50 }, (_, i) => ({
              id: `q${i}`,
              labelKey: `Question ${i}`,
              type: 'text',
            })),
          },
        ],
      } as unknown as QuestionnaireEntity;

      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: largeQuestionnaire,
        answers: new Map<string, AnswerValue>(),
        options: { ...defaultOptions, template: 'detailed' },
      };

      const result = PDFTemplateService.generate(input);

      expect(result.estimatedPages).toBe(4); // 50 questions / 15 per page
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML entities in patient name', () => {
      const xssPatient = {
        ...mockPatient,
        encryptedData: {
          firstName: '<script>alert("XSS")</script>',
          lastName: 'Test',
          birthDate: '1985-01-01',
          gender: 'male',
        },
      } as unknown as PatientEntity;

      const input: PDFTemplateInput = {
        patient: xssPatient,
        questionnaire: mockQuestionnaire,
        answers: mockAnswers,
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).not.toContain('<script>');
      expect(result.html).toContain('&lt;script&gt;');
    });

    it('should escape HTML entities in question text', () => {
      const xssQuestionnaire = {
        ...mockQuestionnaire,
        sections: [
          {
            id: 'section-1',
            titleKey: 'Test <b>Section</b>',
            order: 1,
            questions: [
              { id: 'q1', labelKey: 'Question with "quotes" & special <chars>', type: 'text' },
            ],
          },
        ],
      } as unknown as QuestionnaireEntity;

      const input: PDFTemplateInput = {
        patient: mockPatient,
        questionnaire: xssQuestionnaire,
        answers: new Map<string, AnswerValue>(),
        options: defaultOptions,
      };

      const result = PDFTemplateService.generate(input);

      expect(result.html).toContain('&lt;b&gt;');
      expect(result.html).toContain('&amp;');
      expect(result.html).toContain('&quot;');
    });
  });
});
