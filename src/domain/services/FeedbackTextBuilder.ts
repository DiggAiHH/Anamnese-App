/**
 * FeedbackTextBuilder Service
 * Domain service for building structured feedback text for email/clipboard.
 *
 * @security No PII is included in the generated text. User-provided description
 *           is sanitized (length-limited, no personal identifiers extracted).
 */

export type FeedbackCategory = 'bug' | 'feature' | 'other';

export interface FeedbackInput {
  category: FeedbackCategory;
  description: string;
  locale: string;
}

/**
 * Optional translated labels for i18n support.
 * When provided, these override the default English labels.
 */
export interface FeedbackLabels {
  categoryBug?: string;
  categoryFeature?: string;
  categoryOther?: string;
  labelCategory?: string;
  labelLocale?: string;
  labelAppVersion?: string;
  labelTimestamp?: string;
  labelDescription?: string;
  labelEndOfFeedback?: string;
  labelFeedbackTitle?: string;
}

export interface FeedbackOutput {
  subject: string;
  body: string;
  fullText: string;
}

/**
 * Builds a preformatted feedback text block suitable for email or clipboard.
 */
export class FeedbackTextBuilder {
  private static readonly MAX_DESCRIPTION_LENGTH = 2000;
  private static readonly APP_NAME = 'Anamnese-App';
  private static readonly APP_VERSION = '1.0.0';

  /**
   * Default English labels (fallback).
   */
  private static readonly DEFAULT_LABELS: Required<FeedbackLabels> = {
    categoryBug: 'Bug Report',
    categoryFeature: 'Feature Request',
    categoryOther: 'General Feedback',
    labelCategory: 'Category',
    labelLocale: 'Locale',
    labelAppVersion: 'App Version',
    labelTimestamp: 'Timestamp',
    labelDescription: 'Description',
    labelEndOfFeedback: 'End of Feedback',
    labelFeedbackTitle: 'Feedback',
  };

  /**
   * Sanitizes user input by trimming and limiting length.
   * Does NOT log the content (GDPR compliance).
   */
  private static sanitize(text: string): string {
    const trimmed = text.trim();
    if (trimmed.length > this.MAX_DESCRIPTION_LENGTH) {
      return trimmed.substring(0, this.MAX_DESCRIPTION_LENGTH) + '...';
    }
    return trimmed;
  }

  /**
   * Maps category to human-readable label.
   */
  private static getCategoryLabel(
    category: FeedbackCategory,
    labels: Required<FeedbackLabels>,
  ): string {
    const categoryLabels: Record<FeedbackCategory, string> = {
      bug: labels.categoryBug,
      feature: labels.categoryFeature,
      other: labels.categoryOther,
    };
    return categoryLabels[category];
  }

  /**
   * Generates ISO timestamp without timezone info (privacy: no location inference).
   */
  private static getTimestamp(): string {
    return new Date().toISOString().split('.')[0].replace('T', ' ');
  }

  /**
   * Builds the feedback text.
   * @param input Feedback input data
   * @param customLabels Optional translated labels for i18n
   * @returns Structured feedback output with subject and body
   */
  static build(input: FeedbackInput, customLabels?: FeedbackLabels): FeedbackOutput {
    const { category, description, locale } = input;
    const labels = { ...this.DEFAULT_LABELS, ...customLabels };
    const sanitizedDescription = this.sanitize(description);
    const categoryLabel = this.getCategoryLabel(category, labels);
    const timestamp = this.getTimestamp();

    const subject = `[${this.APP_NAME}] ${categoryLabel}`;

    const body = [
      `=== ${this.APP_NAME} ${labels.labelFeedbackTitle} ===`,
      '',
      `${labels.labelCategory}: ${categoryLabel}`,
      `${labels.labelLocale}: ${locale}`,
      `${labels.labelAppVersion}: ${this.APP_VERSION}`,
      `${labels.labelTimestamp}: ${timestamp}`,
      '',
      `--- ${labels.labelDescription} ---`,
      sanitizedDescription,
      '',
      `--- ${labels.labelEndOfFeedback} ---`,
    ].join('\n');

    const fullText = `${subject}\n\n${body}`;

    return { subject, body, fullText };
  }

  /**
   * Generates a mailto: URI with the feedback content.
   * @param email Target email address
   * @param input Feedback input data
   * @param customLabels Optional translated labels for i18n
   * @returns Encoded mailto: URI
   */
  static buildMailtoUri(
    email: string,
    input: FeedbackInput,
    customLabels?: FeedbackLabels,
  ): string {
    const { subject, body } = this.build(input, customLabels);
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    return `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
  }
}
