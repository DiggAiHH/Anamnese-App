/**
 * LoadQuestionnaire Use Case - Lädt Fragebogen mit Antworten
 * 
 * FLOW:
 * Presentation Layer
 *   → Use Case
 *   → Questionnaire Repository (load template)
 *   → Answer Repository (load answers)
 *   → Decryption Service (decrypt answers)
 *   → Return questionnaire + answers map
 */

import { QuestionnaireEntity } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IPatientRepository } from '@domain/repositories/IPatientRepository';

export interface LoadQuestionnaireInput {
  patientId: string;
  questionnaireId?: string; // Optional: load specific questionnaire
  encryptionKey: string; // Für Decryption der Antworten
}

export interface LoadQuestionnaireOutput {
  success: boolean;
  questionnaire?: QuestionnaireEntity;
  answers?: Map<string, AnswerValue>; // questionId -> decrypted value
  error?: string;
}

/**
 * LoadQuestionnaire Use Case
 */
export class LoadQuestionnaireUseCase {
  constructor(
    private readonly questionnaireRepository: IQuestionnaireRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly patientRepository: IPatientRepository,
  ) {}

  async execute(input: LoadQuestionnaireInput): Promise<LoadQuestionnaireOutput> {
    try {
      // Step 1: Verify patient exists
      const patientExists = await this.patientRepository.exists(input.patientId);
      if (!patientExists) {
        return {
          success: false,
          error: 'Patient not found',
        };
      }

      let questionnaire: QuestionnaireEntity;

      if (input.questionnaireId) {
        // Load existing questionnaire
        const existingQuestionnaire = await this.questionnaireRepository.findById(
          input.questionnaireId,
        );

        if (!existingQuestionnaire) {
          return {
            success: false,
            error: 'Questionnaire not found',
          };
        }

        questionnaire = existingQuestionnaire;
      } else {
        // Create new questionnaire from template
        const template = await this.questionnaireRepository.loadTemplate();
        const version = await this.questionnaireRepository.getLatestTemplateVersion();

        questionnaire = QuestionnaireEntity.create({
          patientId: input.patientId,
          sections: template,
          version,
        });

        // Save new questionnaire
        await this.questionnaireRepository.save(questionnaire);
      }

      // Step 2: Load answers (if questionnaire exists)
      let answers: Map<string, AnswerValue> | undefined;

      if (input.questionnaireId) {
        answers = await this.answerRepository.getAnswersMap(
          input.questionnaireId,
          input.encryptionKey,
        );
      }

      return {
        success: true,
        questionnaire,
        answers: answers ?? new Map(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
