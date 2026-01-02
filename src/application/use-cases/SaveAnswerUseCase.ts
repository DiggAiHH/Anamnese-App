/**
 * SaveAnswer Use Case - Speichert eine Antwort
 * 
 * FLOW:
 * Presentation Layer (Component) 
 *   → Use Case (Business Logic)
 *   → Encryption Service (encrypt answer)
 *   → Answer Repository (persist to DB)
 */

import { AnswerEntity, AnswerValue } from '@domain/entities/Answer';
import { Question } from '@domain/entities/Questionnaire';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IEncryptionService } from '@domain/repositories/IEncryptionService';
import { AnswerValidator, ValidationResult } from '@domain/entities/Answer';

/**
 * Use Case Input (von Presentation Layer)
 */
export interface SaveAnswerInput {
  questionnaireId: string;
  question: Question;
  value: AnswerValue;
  encryptionKey: string; // Session-Key vom User
  sourceType?: 'manual' | 'voice' | 'ocr';
  confidence?: number;
}

/**
 * Use Case Output (zu Presentation Layer)
 */
export interface SaveAnswerOutput {
  success: boolean;
  answerId?: string;
  validationErrors?: string[];
  error?: string;
}

/**
 * SaveAnswer Use Case
 * 
 * Verantwortlichkeiten:
 * 1. Validiere Antwort
 * 2. Verschlüssele Antwort
 * 3. Speichere in DB
 * 4. Return Result
 */
export class SaveAnswerUseCase {
  constructor(
    private readonly answerRepository: IAnswerRepository,
    private readonly encryptionService: IEncryptionService,
  ) {}

  async execute(input: SaveAnswerInput): Promise<SaveAnswerOutput> {
    try {
      // Step 1: Validate Answer
      const validationResult = this.validate(input.question, input.value);
      
      if (!validationResult.valid) {
        return {
          success: false,
          validationErrors: validationResult.errors,
        };
      }

      // Step 2: Encrypt Answer
      const encryptedValue = await this.encryptAnswer(input.value, input.encryptionKey);

      // Step 3: Check if answer exists (update vs create)
      const existingAnswer = await this.answerRepository.findByQuestionId(
        input.questionnaireId,
        input.question.id,
      );

      let answer: AnswerEntity;

      if (existingAnswer) {
        // Update existing answer
        answer = existingAnswer.update(encryptedValue, input.sourceType);
      } else {
        // Create new answer
        answer = AnswerEntity.create({
          questionnaireId: input.questionnaireId,
          questionId: input.question.id,
          encryptedValue,
          questionType: input.question.type,
          sourceType: input.sourceType,
          confidence: input.confidence,
        });
      }

      // Step 4: Save to DB
      await this.answerRepository.save(answer);

      return {
        success: true,
        answerId: answer.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate Answer (Domain Logic)
   */
  private validate(question: Question, value: AnswerValue): ValidationResult {
    return AnswerValidator.validate(value, question);
  }

  /**
   * Encrypt Answer Value
   */
  private async encryptAnswer(value: AnswerValue, key: string): Promise<string> {
    // Convert value to JSON string
    const jsonValue = JSON.stringify(value);
    
    // Encrypt using AES-256-GCM
    const encryptedData = await this.encryptionService.encrypt(jsonValue, key);
    
    // Return as string (for storage)
    return encryptedData.toString();
  }
}
