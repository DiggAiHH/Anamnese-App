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
import { logWarn } from '@shared/logger';

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
        // Resume latest questionnaire if available
        const existing = await this.questionnaireRepository.findByPatientId(input.patientId);
        const latest = existing
          .slice()
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];

        if (latest) {
          questionnaire = latest;
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
      }

      // Step 2: Load answers (if questionnaire exists)
      const loadAnswersSafe = async (): Promise<Map<string, AnswerValue>> => {
        if (!input.questionnaireId) return new Map();

        const timeoutMs = 4000;
        let timeoutId: ReturnType<typeof setTimeout> | undefined;

        try {
          return await Promise.race([
            this.answerRepository.getAnswersMap(input.questionnaireId, input.encryptionKey),
            new Promise<Map<string, AnswerValue>>((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error('Answer load timeout'));
              }, timeoutMs);
            }),
          ]);
        } catch {
          logWarn(
            '[LoadQuestionnaireUseCase] Failed to load/decrypt answers; continuing with empty answers.',
          );
          return new Map();
        } finally {
          if (timeoutId) clearTimeout(timeoutId);
        }
      };

      const answers = await loadAnswersSafe();

      return {
        success: true,
        questionnaire,
        answers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
