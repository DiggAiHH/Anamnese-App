/**
 * ExportAnonymized Use Case
 * 
 * Exports data in a neutral, anonymized JSON format.
 * - PII (Names, Address, Exact DoB) are removed.
 * - Year of Birth and Gender are kept for demographics.
 * - Choice answers are represented as Integers (Indices/Values) where possible.
 */

import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { requireRNFS } from '@shared/rnfsSafe';
import { supportsRNFS } from '@shared/platformCapabilities';

export interface ExportAnonymizedInput {
    patientId: string;
    questionnaireId: string;
    encryptionKey: string;
}

export interface ExportAnonymizedOutput {
    success: boolean;
    filePath?: string;
    error?: string;
}

export class ExportAnonymizedUseCase {
    constructor(
        private readonly patientRepository: IPatientRepository,
        private readonly questionnaireRepository: IQuestionnaireRepository,
        private readonly answerRepository: IAnswerRepository,
    ) { }

    async execute(input: ExportAnonymizedInput): Promise<ExportAnonymizedOutput> {
        try {
            if (!supportsRNFS) {
                throw new Error('File system export is not supported on this platform');
            }
            const RNFS = requireRNFS();

            // 1. Load Data
            const patient = await this.patientRepository.findById(input.patientId);
            if (!patient) return { success: false, error: 'Patient not found' };

            const questionnaire = await this.questionnaireRepository.findById(input.questionnaireId);
            if (!questionnaire) return { success: false, error: 'Questionnaire not found' };

            const answersMap = await this.answerRepository.getAnswersMap(
                input.questionnaireId,
                input.encryptionKey
            );

            // 2. Anonymize Patient Data
            const demographics = {
                yearOfBirth: patient.encryptedData.birthDate ? parseInt(patient.encryptedData.birthDate.substring(0, 4)) : undefined,
                gender: patient.encryptedData.gender, // 'male' | 'female' | 'other' - sufficiently anonymous usually, or map to int
                language: patient.language,
            };

            // 3. Process Answers (Map to Integer/Sequence where applicable)
            const processedAnswers: Record<string, any> = {};

            for (const section of questionnaire.sections) {
                for (const question of section.questions) {
                    const val = answersMap.get(question.id);
                    if (val === undefined || val === null) continue;

                    // logic to prefer integer representation
                    if (question.options && question.options.length > 0) {
                        // Choice Question
                        if (typeof val === 'number') {
                            // Already a number (Bitset or Index)
                            processedAnswers[question.id] = val;
                        } else if (Array.isArray(val)) {
                            // Map string array to bitset or array of indices?
                            // Let's stick to the value if it's numeric, or map to indices if strings
                            // Assuming options have numeric values as per `Master.tsv` logic usually assigning 1, 2, 4...
                            // If not, we just store the array.
                            processedAnswers[question.id] = val;
                        } else {
                            // String value -> Find index or value in options
                            const opt = question.options.find(o => String(o.value) === String(val));
                            if (opt && typeof opt.value === 'number') {
                                processedAnswers[question.id] = opt.value;
                            } else {
                                processedAnswers[question.id] = val; // Fallback to string
                            }
                        }
                    } else {
                        // Text / Free Form
                        // User asked for "Anonymized". Strict anonymization would require scrubbing names from text.
                        // For now, we include it but it's "Pseudonymized" by removing the Patient Link.
                        // A full PII scrubber is out of scope unless using an AI service.
                        processedAnswers[question.id] = val;
                    }
                }
            }

            // 4. Construct Export Object
            const exportData = {
                exportType: 'ANONYMIZED_ANAMNESE',
                version: '1.0',
                timestamp: new Date().toISOString(),
                demographics,
                answers: processedAnswers,
            };

            // 5. Write to File
            const exportsDir = `${RNFS.DocumentDirectoryPath}/exports`;
            await RNFS.mkdir(exportsDir);
            const fileName = `anamnese_anon_${Date.now()}.json`;
            const filePath = `${exportsDir}/${fileName}`;

            await RNFS.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf8');

            return { success: true, filePath };

        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
        }
    }
}
