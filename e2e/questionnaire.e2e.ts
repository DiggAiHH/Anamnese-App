import { by, device, element, expect as detoxExpect } from 'detox';

describe('Questionnaire E2E Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { microphone: 'YES', camera: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display home screen on app launch', async () => {
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();
    await detoxExpect(element(by.id('start-anamnesis-btn'))).toBeVisible();
    await detoxExpect(element(by.id('load-saved-btn'))).toBeVisible();
  });

  it('should navigate to language selection', async () => {
    await element(by.id('start-anamnesis-btn')).tap();
    await detoxExpect(element(by.id('language-selector'))).toBeVisible();
  });

  it('should select language and proceed to master password', async () => {
    // Start new anamnesis
    await element(by.id('start-anamnesis-btn')).tap();

    // Select language (German)
    await detoxExpect(element(by.id('language-selector'))).toBeVisible();
    await element(by.id('language-option-de')).tap();
    await element(by.id('language-confirm-btn')).tap();

    // Should navigate to master password screen
    await detoxExpect(element(by.id('master-password-screen'))).toBeVisible();
    await detoxExpect(element(by.id('password-input'))).toBeVisible();
  });

  it('should require valid master password', async () => {
    // Navigate to master password screen
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-de')).tap();
    await element(by.id('language-confirm-btn')).tap();

    // Try with weak password
    await element(by.id('password-input')).typeText('weak');
    await element(by.id('password-confirm-btn')).tap();

    // Should show error
    await detoxExpect(element(by.id('password-error'))).toBeVisible();

    // Try with strong password
    await element(by.id('password-input')).clearText();
    await element(by.id('password-input')).typeText('StrongPassword123!');
    await element(by.id('password-confirm-input')).typeText('StrongPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    // Should proceed to patient info
    await detoxExpect(element(by.id('patient-info-screen'))).toBeVisible();
  });

  it('should complete full questionnaire flow', async () => {
    // Setup: Navigate through initial screens
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-en')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    // Fill patient info
    await detoxExpect(element(by.id('patient-info-screen'))).toBeVisible();
    await element(by.id('input-first_name')).typeText('John');
    await element(by.id('input-last_name')).typeText('Doe');
    await element(by.id('input-birth_date')).typeText('1990-05-15');
    await element(by.id('input-gender-male')).tap();
    await element(by.id('patient-info-next-btn')).tap();

    // Accept GDPR consents
    await detoxExpect(element(by.id('gdpr-consent-screen'))).toBeVisible();
    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Questionnaire screen
    await detoxExpect(element(by.id('questionnaire-screen'))).toBeVisible();
    
    // Section 1: Personal Data (should be visible)
    await detoxExpect(element(by.id('section-title'))).toHaveText('Personal Data');

    // Answer first question
    await element(by.id('question-first_name')).typeText('John');
    
    // Wait for auto-save
    await new Promise(resolve => setTimeout(resolve, 500));

    // Progress bar should update
    await detoxExpect(element(by.id('progress-bar'))).toBeVisible();

    // Answer more questions
    await element(by.id('question-last_name')).typeText('Doe');
    await element(by.id('question-birth_date')).typeText('1990-05-15');
    await element(by.id('question-gender-male')).tap();

    // Navigate to next section
    await element(by.id('next-section-btn')).tap();

    // Section 2: General Anamnesis
    await detoxExpect(element(by.id('section-title'))).toHaveText('General Anamnesis');
    
    await element(by.id('question-chief_complaint')).typeText('Headache');
    await element(by.id('question-duration')).typeText('3 days');
    await element(by.id('question-pain_level')).tap(); // Slider

    // Navigate through all sections
    await element(by.id('next-section-btn')).tap();

    // Complete questionnaire
    await element(by.id('complete-questionnaire-btn')).tap();

    // Should navigate to summary
    await detoxExpect(element(by.id('summary-screen'))).toBeVisible();
  });

  it('should handle conditional logic', async () => {
    // Setup and navigate to questionnaire
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-en')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    await element(by.id('input-first_name')).typeText('Jane');
    await element(by.id('input-last_name')).typeText('Smith');
    await element(by.id('input-birth_date')).typeText('1985-03-20');
    await element(by.id('input-gender-female')).tap(); // Select female
    await element(by.id('patient-info-next-btn')).tap();

    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Navigate to Women's Health section
    // (Assumes we can navigate sections directly or scroll)
    await element(by.id('section-navigation')).scrollTo('bottom');
    await element(by.id('section-womens-health')).tap();

    // Pregnancy question should be visible (conditional on gender=female)
    await detoxExpect(element(by.id('question-pregnancy'))).toBeVisible();

    // Answer pregnancy question
    await element(by.id('question-pregnancy-yes')).tap();

    // Pregnancy details should now appear
    await detoxExpect(element(by.id('question-pregnancy_details'))).toBeVisible();
  });

  it('should test voice input feature', async () => {
    // Setup and navigate to questionnaire
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-de')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    await element(by.id('input-first_name')).typeText('Test');
    await element(by.id('input-last_name')).typeText('User');
    await element(by.id('input-birth_date')).typeText('1990-01-01');
    await element(by.id('input-gender-male')).tap();
    await element(by.id('patient-info-next-btn')).tap();

    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Navigate to section with textarea (e.g., Chief Complaint)
    await element(by.id('next-section-btn')).tap();

    // Find voice input button
    await detoxExpect(element(by.id('voice-input-btn-chief_complaint'))).toBeVisible();

    // Tap voice input button
    await element(by.id('voice-input-btn-chief_complaint')).tap();

    // Voice recording indicator should appear
    await detoxExpect(element(by.id('voice-recording-indicator'))).toBeVisible();

    // Stop recording
    await element(by.id('voice-stop-btn')).tap();

    // Transcription should appear (mocked or real)
    await detoxExpect(element(by.id('voice-transcription'))).toBeVisible();

    // Apply transcription
    await element(by.id('voice-apply-btn')).tap();

    // Question should be filled
    await detoxExpect(element(by.id('question-chief_complaint'))).not.toHaveText('');
  });

  it('should test document upload and OCR', async () => {
    // Setup and navigate to questionnaire
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-de')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    // Skip to document upload section or find upload button
    await detoxExpect(element(by.id('document-upload-btn'))).toBeVisible();

    // Tap upload button
    await element(by.id('document-upload-btn')).tap();

    // Should show picker (camera/gallery)
    await detoxExpect(element(by.id('document-picker'))).toBeVisible();

    // Select from gallery (mocked in test)
    await element(by.id('picker-gallery')).tap();

    // OCR processing indicator
    await detoxExpect(element(by.id('ocr-processing'))).toBeVisible();

    // Wait for OCR to complete
    await new Promise(resolve => setTimeout(resolve, 3000));

    // OCR results should appear
    await detoxExpect(element(by.id('ocr-results'))).toBeVisible();

    // Accept OCR results
    await element(by.id('ocr-accept-btn')).tap();

    // Document should be uploaded
    await detoxExpect(element(by.id('document-uploaded'))).toBeVisible();
  });

  it('should save progress and resume', async () => {
    // Complete partial questionnaire
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-en')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    await element(by.id('input-first_name')).typeText('Resume');
    await element(by.id('input-last_name')).typeText('Test');
    await element(by.id('input-birth_date')).typeText('1990-01-01');
    await element(by.id('input-gender-male')).tap();
    await element(by.id('patient-info-next-btn')).tap();

    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Answer a few questions
    await element(by.id('question-first_name')).typeText('Resume');
    await element(by.id('question-last_name')).typeText('Test');

    // Go back to home (simulates app close/reopen)
    await device.sendToHome();
    await device.launchApp({ newInstance: false });

    // Load saved questionnaire
    await element(by.id('load-saved-btn')).tap();

    // Should show saved questionnaires
    await detoxExpect(element(by.id('saved-questionnaire-list'))).toBeVisible();

    // Select first saved questionnaire
    await element(by.id('saved-questionnaire-0')).tap();

    // Enter master password
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    // Should resume at last position with saved answers
    await detoxExpect(element(by.id('questionnaire-screen'))).toBeVisible();
    await detoxExpect(element(by.id('question-first_name'))).toHaveText('Resume');
  });

  it('should export data as JSON', async () => {
    // Complete questionnaire (shortened setup)
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-en')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    // Fill minimal data
    await element(by.id('input-first_name')).typeText('Export');
    await element(by.id('input-last_name')).typeText('Test');
    await element(by.id('input-birth_date')).typeText('1990-01-01');
    await element(by.id('input-gender-male')).tap();
    await element(by.id('patient-info-next-btn')).tap();

    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Complete questionnaire
    await element(by.id('complete-questionnaire-btn')).tap();

    // Navigate to export screen
    await detoxExpect(element(by.id('summary-screen'))).toBeVisible();
    await element(by.id('export-btn')).tap();

    // Export screen
    await detoxExpect(element(by.id('export-screen'))).toBeVisible();

    // Select JSON export
    await element(by.id('export-format-json')).tap();
    await element(by.id('export-confirm-btn')).tap();

    // Export success message
    await detoxExpect(element(by.id('export-success'))).toBeVisible();
  });

  it('should handle GDPR data deletion', async () => {
    // Complete setup
    await element(by.id('start-anamnesis-btn')).tap();
    await element(by.id('language-option-en')).tap();
    await element(by.id('language-confirm-btn')).tap();
    
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-input')).typeText('TestPassword123!');
    await element(by.id('password-confirm-btn')).tap();

    await element(by.id('input-first_name')).typeText('Delete');
    await element(by.id('input-last_name')).typeText('Me');
    await element(by.id('input-birth_date')).typeText('1990-01-01');
    await element(by.id('input-gender-male')).tap();
    await element(by.id('patient-info-next-btn')).tap();

    await element(by.id('consent-data-processing')).tap();
    await element(by.id('gdpr-confirm-btn')).tap();

    // Navigate to settings/menu
    await element(by.id('menu-btn')).tap();

    // Find delete all data option
    await element(by.id('menu-delete-data')).tap();

    // Confirmation dialog
    await detoxExpect(element(by.id('delete-confirmation'))).toBeVisible();
    await element(by.id('delete-confirm-btn')).tap();

    // Should return to home screen
    await detoxExpect(element(by.id('home-screen'))).toBeVisible();

    // Verify data is deleted
    await element(by.id('load-saved-btn')).tap();
    await detoxExpect(element(by.id('no-saved-data'))).toBeVisible();
  });
});
