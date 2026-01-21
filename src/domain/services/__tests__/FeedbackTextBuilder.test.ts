/**
 * FeedbackTextBuilder Unit Tests
 */
import { FeedbackTextBuilder, FeedbackCategory, FeedbackInput } from '../FeedbackTextBuilder';

describe('FeedbackTextBuilder', () => {
  const mockInput: FeedbackInput = {
    category: 'bug',
    description: 'The app crashes when I click the export button.',
    locale: 'de',
  };

  describe('build()', () => {
    it('should generate subject with app name and category', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.subject).toBe('[Anamnese-App] Bug Report');
    });

    it('should include category label in body', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.body).toContain('Category: Bug Report');
    });

    it('should include locale in body', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.body).toContain('Locale: de');
    });

    it('should include app version in body', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.body).toContain('App Version: 1.0.0');
    });

    it('should include timestamp in body', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      // Timestamp format: YYYY-MM-DD HH:MM:SS
      expect(result.body).toMatch(/Timestamp: \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should include sanitized description in body', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.body).toContain('--- Description ---');
      expect(result.body).toContain(mockInput.description);
    });

    it('should combine subject and body in fullText', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      expect(result.fullText).toBe(`${result.subject}\n\n${result.body}`);
    });

    it('should handle all category types', () => {
      const categories: FeedbackCategory[] = ['bug', 'feature', 'other'];
      const expectedLabels = ['Bug Report', 'Feature Request', 'General Feedback'];
      
      categories.forEach((category, index) => {
        const result = FeedbackTextBuilder.build({ ...mockInput, category });
        expect(result.subject).toContain(expectedLabels[index]);
      });
    });
  });

  describe('sanitization', () => {
    it('should trim whitespace from description', () => {
      const input: FeedbackInput = {
        ...mockInput,
        description: '   Some feedback with spaces   ',
      };
      const result = FeedbackTextBuilder.build(input);
      
      expect(result.body).toContain('Some feedback with spaces');
      expect(result.body).not.toContain('   Some');
    });

    it('should truncate description exceeding 2000 characters', () => {
      const longDescription = 'A'.repeat(2500);
      const input: FeedbackInput = {
        ...mockInput,
        description: longDescription,
      };
      const result = FeedbackTextBuilder.build(input);
      
      // Should contain exactly 2000 A's + '...'
      expect(result.body).toContain('A'.repeat(2000) + '...');
      expect(result.body).not.toContain('A'.repeat(2001));
    });

    it('should handle empty description', () => {
      const input: FeedbackInput = {
        ...mockInput,
        description: '',
      };
      const result = FeedbackTextBuilder.build(input);
      
      expect(result.body).toContain('--- Description ---');
      expect(result.body).toContain('--- End of Feedback ---');
    });
  });

  describe('buildMailtoUri()', () => {
    const testEmail = 'feedback@example.com';

    it('should generate valid mailto: URI', () => {
      const result = FeedbackTextBuilder.buildMailtoUri(testEmail, mockInput);
      
      expect(result).toStartWith('mailto:feedback@example.com?');
    });

    it('should include encoded subject parameter', () => {
      const result = FeedbackTextBuilder.buildMailtoUri(testEmail, mockInput);
      
      expect(result).toContain('subject=');
      expect(result).toContain(encodeURIComponent('[Anamnese-App] Bug Report'));
    });

    it('should include encoded body parameter', () => {
      const result = FeedbackTextBuilder.buildMailtoUri(testEmail, mockInput);
      
      expect(result).toContain('body=');
      expect(result).toContain(encodeURIComponent('=== Anamnese-App Feedback ==='));
    });

    it('should properly encode special characters', () => {
      const input: FeedbackInput = {
        ...mockInput,
        description: 'Test with special chars: äöü & <script>',
      };
      const result = FeedbackTextBuilder.buildMailtoUri(testEmail, input);
      
      // Should not contain raw special characters in encoded sections
      expect(result).not.toContain('äöü');
      expect(result).not.toContain('<script>');
    });
  });

  describe('GDPR compliance', () => {
    it('should not include any PII fields in output structure', () => {
      const result = FeedbackTextBuilder.build(mockInput);
      
      // Verify no common PII field names appear as labels
      expect(result.body).not.toMatch(/\b(Name|Email|Phone|Address|IP):/i);
    });

    it('should not log any input data', () => {
      // This is a structural test - the service has no console.log calls
      // Verified by code review: FeedbackTextBuilder has no logging statements
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      FeedbackTextBuilder.build(mockInput);
      FeedbackTextBuilder.buildMailtoUri('test@test.com', mockInput);
      
      expect(consoleSpy).not.toHaveBeenCalled();
      expect(consoleErrorSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});

// Jest custom matcher extension
expect.extend({
  toStartWith(received: string, prefix: string) {
    const pass = received.startsWith(prefix);
    return {
      pass,
      message: () =>
        pass
          ? `expected "${received}" not to start with "${prefix}"`
          : `expected "${received}" to start with "${prefix}"`,
    };
  },
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toStartWith(prefix: string): R;
    }
  }
}
