/**
 * PDF Template System - Generate printable HTML from anamnesis data
 *
 * @description Converts questionnaire answers into print-ready HTML templates.
 *              Templates are optimized for different use cases:
 *              - Compact: Single-page summary for quick reference
 *              - Detailed: Full questionnaire with all answers
 *              - PrintFriendly: Ink-optimized, no background colors
 *
 * @security DSGVO Art. 25 - No PII in template generation logs
 */

import { PatientEntity } from '@domain/entities/Patient';
import { QuestionnaireEntity, Section } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PDFTemplateType = 'compact' | 'detailed' | 'printFriendly';

export interface PDFTemplateOptions {
  template: PDFTemplateType;
  includePatientInfo: boolean;
  includeTimestamp: boolean;
  language: string;
  title?: string;
  footerText?: string;
}

export interface PDFTemplateInput {
  patient: PatientEntity;
  questionnaire: QuestionnaireEntity;
  answers: Map<string, AnswerValue>;
  options: PDFTemplateOptions;
}

export interface PDFTemplateOutput {
  html: string;
  estimatedPages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Template Styles (CSS-in-JS for HTML generation)
// ─────────────────────────────────────────────────────────────────────────────

const SHARED_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.4; color: #1a1a1a; }
  .header { margin-bottom: 16px; padding-bottom: 12px; border-bottom: 2px solid #0066cc; }
  .title { font-size: 18px; font-weight: bold; color: #0066cc; }
  .subtitle { font-size: 12px; color: #666; margin-top: 4px; }
  .patient-info { background: #f0f4f8; padding: 12px; border-radius: 6px; margin-bottom: 16px; }
  .patient-info h3 { font-size: 14px; margin-bottom: 8px; }
  .patient-info p { font-size: 12px; margin: 2px 0; }
  .section { margin-bottom: 16px; page-break-inside: avoid; }
  .section-title { font-size: 14px; font-weight: bold; background: #e8f0fe; padding: 6px 10px; border-left: 3px solid #0066cc; margin-bottom: 8px; }
  .question { margin: 8px 0; padding: 6px 10px; border-left: 2px solid #ddd; }
  .question-text { font-size: 12px; color: #333; }
  .answer { font-size: 12px; font-weight: 600; color: #0066cc; margin-top: 2px; }
  .answer-empty { font-style: italic; color: #999; }
  .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #666; text-align: center; }
  @media print { body { padding: 0; } .section { page-break-inside: avoid; } }
`;

const COMPACT_STYLES = `
  ${SHARED_STYLES}
  body { font-size: 10px; padding: 12px; }
  .question { margin: 4px 0; padding: 4px 8px; display: flex; justify-content: space-between; }
  .question-text { flex: 1; }
  .answer { flex: 0 0 120px; text-align: right; }
`;

const DETAILED_STYLES = `
  ${SHARED_STYLES}
  body { padding: 20px; }
  .question { margin: 10px 0; padding: 10px; background: #fafafa; border-radius: 4px; }
  .question-text { font-size: 13px; margin-bottom: 6px; }
  .answer { font-size: 13px; padding: 4px 0; }
  .notes { font-size: 11px; color: #666; font-style: italic; margin-top: 4px; }
`;

const PRINT_FRIENDLY_STYLES = `
  ${SHARED_STYLES}
  body { padding: 15px; background: white; }
  .header { border-bottom: 1px solid #333; }
  .title { color: #000; }
  .patient-info { background: white; border: 1px solid #ccc; }
  .section-title { background: white; border-left: 2px solid #000; color: #000; }
  .question { border-left: 1px solid #999; }
  .answer { color: #000; }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Template Generation Service
// ─────────────────────────────────────────────────────────────────────────────

export class PDFTemplateService {
  /**
   * Generate HTML from anamnesis data
   */
  static generate(input: PDFTemplateInput): PDFTemplateOutput {
    const { patient, questionnaire, answers, options } = input;

    const styles = this.getStyles(options.template);
    const patientBlock = options.includePatientInfo
      ? this.renderPatientInfo(patient, options.language)
      : '';

    // Get questionnaire title from options or use default
    const questionnaireTitle = options.title ?? `Anamnese - ${patient.id.substring(0, 8)}`;

    const sectionsBlock = this.renderSections(questionnaire, answers, options);
    const footerBlock = this.renderFooter(options);

    const html = `<!DOCTYPE html>
<html lang="${options.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(questionnaireTitle)}</title>
  <style>${styles}</style>
</head>
<body>
  <div class="header">
    <div class="title">${this.escapeHtml(questionnaireTitle)}</div>
    ${options.includeTimestamp ? `<div class="subtitle">${new Date().toLocaleString(options.language)}</div>` : ''}
  </div>
  ${patientBlock}
  ${sectionsBlock}
  ${footerBlock}
</body>
</html>`;

    return {
      html,
      estimatedPages: this.estimatePages(questionnaire, options.template),
    };
  }

  /**
   * Get CSS styles for template type
   */
  private static getStyles(template: PDFTemplateType): string {
    switch (template) {
      case 'compact':
        return COMPACT_STYLES;
      case 'detailed':
        return DETAILED_STYLES;
      case 'printFriendly':
        return PRINT_FRIENDLY_STYLES;
      default:
        return DETAILED_STYLES;
    }
  }

  /**
   * Render patient information block (GDPR: only include consented fields)
   */
  private static renderPatientInfo(patient: PatientEntity, lang: string): string {
    // Only show anonymized info - never full name unless explicit consent
    const encData = patient.encryptedData;
    const displayName =
      encData?.firstName && encData?.lastName
        ? `${encData.firstName} ${encData.lastName.charAt(0)}.`
        : 'Patient';
    const birthYear = encData?.birthDate ? new Date(encData.birthDate).getFullYear() : '—';
    const gender = this.translateGender(encData?.gender, lang);

    return `
    <div class="patient-info">
      <h3>${lang === 'de' ? 'Patienteninformation' : 'Patient Information'}</h3>
      <p><strong>${lang === 'de' ? 'Name' : 'Name'}:</strong> ${this.escapeHtml(displayName)}</p>
      <p><strong>${lang === 'de' ? 'Geburtsjahr' : 'Birth Year'}:</strong> ${birthYear}</p>
      <p><strong>${lang === 'de' ? 'Geschlecht' : 'Gender'}:</strong> ${gender}</p>
    </div>`;
  }

  /**
   * Render questionnaire sections with answers
   */
  private static renderSections(
    questionnaire: QuestionnaireEntity,
    answers: Map<string, AnswerValue>,
    options: PDFTemplateOptions,
  ): string {
    return questionnaire.sections
      .map(section => this.renderSection(section, answers, options))
      .join('\n');
  }

  /**
   * Render a single section/group
   */
  private static renderSection(
    section: Section,
    answers: Map<string, AnswerValue>,
    options: PDFTemplateOptions,
  ): string {
    const questions = section.questions
      .map(q => {
        const answer = answers.get(q.id);
        const answerDisplay = this.formatAnswer(answer, q.type, options.language);
        // Use labelKey as question text (in production, translate via i18n)
        return this.renderQuestion(q.labelKey ?? q.text ?? '', answerDisplay, options.template);
      })
      .join('\n');

    return `
    <div class="section">
      <div class="section-title">${this.escapeHtml(section.titleKey ?? section.title ?? '')}</div>
      ${questions}
    </div>`;
  }

  /**
   * Render a single question with answer
   */
  private static renderQuestion(
    questionText: string,
    answerText: string,
    template: PDFTemplateType,
  ): string {
    const answerClass = answerText === '—' ? 'answer answer-empty' : 'answer';

    if (template === 'compact') {
      return `
      <div class="question">
        <span class="question-text">${this.escapeHtml(questionText)}</span>
        <span class="${answerClass}">${this.escapeHtml(answerText)}</span>
      </div>`;
    }

    return `
    <div class="question">
      <div class="question-text">${this.escapeHtml(questionText)}</div>
      <div class="${answerClass}">${this.escapeHtml(answerText)}</div>
    </div>`;
  }

  /**
   * Format answer value for display
   */
  private static formatAnswer(
    answer: AnswerValue | undefined,
    _questionType: string,
    lang: string,
  ): string {
    if (answer === undefined || answer === null) {
      return '—';
    }

    // Handle different answer types
    if (typeof answer === 'boolean') {
      return lang === 'de' ? (answer ? 'Ja' : 'Nein') : answer ? 'Yes' : 'No';
    }

    if (typeof answer === 'number') {
      return answer.toString();
    }

    if (Array.isArray(answer)) {
      return answer.length > 0 ? answer.join(', ') : '—';
    }

    if (typeof answer === 'string') {
      return answer.trim() || '—';
    }

    return '—';
  }

  /**
   * Render footer
   */
  private static renderFooter(options: PDFTemplateOptions): string {
    if (!options.footerText) {
      const defaultText =
        options.language === 'de'
          ? 'Erstellt mit Anamnese-App • Alle Daten lokal gespeichert • DSGVO-konform'
          : 'Created with Anamnese-App • All data stored locally • GDPR compliant';
      return `<div class="footer">${this.escapeHtml(defaultText)}</div>`;
    }
    return `<div class="footer">${this.escapeHtml(options.footerText)}</div>`;
  }

  /**
   * Translate gender for display
   */
  private static translateGender(gender: string | undefined, lang: string): string {
    if (!gender) return '—';

    const translations: Record<string, Record<string, string>> = {
      de: { male: 'Männlich', female: 'Weiblich', diverse: 'Divers', other: 'Andere' },
      en: { male: 'Male', female: 'Female', diverse: 'Diverse', other: 'Other' },
    };

    return translations[lang]?.[gender] ?? gender;
  }

  /**
   * Estimate page count based on content
   */
  private static estimatePages(
    questionnaire: QuestionnaireEntity,
    template: PDFTemplateType,
  ): number {
    const totalQuestions = questionnaire.sections.reduce((sum, s) => sum + s.questions.length, 0);

    // Rough estimates based on template density
    const questionsPerPage: Record<PDFTemplateType, number> = {
      compact: 30,
      detailed: 15,
      printFriendly: 20,
    };

    return Math.max(1, Math.ceil(totalQuestions / questionsPerPage[template]));
  }

  /**
   * HTML escape utility
   */
  private static escapeHtml(text: string): string {
    const htmlEntities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, char => htmlEntities[char] ?? char);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export default PDFTemplateService;
