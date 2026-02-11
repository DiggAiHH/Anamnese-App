/**
 * ExportAnonymized Use Case
 *
 * Exports data in a neutral, anonymized JSON format.
 * - PII (Names, Address, Exact DoB) are removed.
 * - Year of Birth and Gender are kept for demographics.
 * - Choice answers are represented as Integers (Indices/Values) where possible.
 * - QuestionUniverse metadata (statisticGroup, icd10Codes, researchTags) attached per answer.
 *
 * @security No PII in export. Year-of-birth and gender are demographic aggregates.
 */

import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IQuestionUniverseRepository } from '@domain/repositories/IQuestionUniverseRepository';
import { QuestionUniverseLookupService } from '../services/QuestionUniverseLookupService';
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

/** Shape of a single enriched answer entry in the export. */
interface EnrichedAnswer {
    value: unknown;
    statisticGroup?: string;
    icd10Codes?: string[];
    researchTags?: string[];
}

export class ExportAnonymizedUseCase {
    private readonly lookupService: QuestionUniverseLookupService;

    constructor(
        private readonly patientRepository: IPatientRepository,
        private readonly questionnaireRepository: IQuestionnaireRepository,
        private readonly answerRepository: IAnswerRepository,
        questionUniverseRepository?: IQuestionUniverseRepository,
    ) {
        // LookupService is optional — export still works without QuestionUniverse metadata.
        // If no repository is provided, metadata fields will simply be omitted.
        this.lookupService = questionUniverseRepository
            ? new QuestionUniverseLookupService(questionUniverseRepository)
            : (null as unknown as QuestionUniverseLookupService);
    }

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
                input.encryptionKey,
            );

            // 1b. Initialize QuestionUniverse lookup (best-effort)
            if (this.lookupService) {
                try {
                    await this.lookupService.initialize();
                } catch {
                    // Non-fatal: export works without metadata.
                }
            }

            // 2. Anonymize Patient Data
            const demographics = {
                yearOfBirth: patient.encryptedData.birthDate
                    ? parseInt(patient.encryptedData.birthDate.substring(0, 4))
                    : undefined,
                gender: patient.encryptedData.gender,
                language: patient.language,
            };

            // 3. Process Answers (Map to Integer/Sequence where applicable)
            //    Enriched with QuestionUniverse metadata when available.
            const processedAnswers: Record<string, EnrichedAnswer> = {};

            for (const section of questionnaire.sections) {
                for (const question of section.questions) {
                    const val = answersMap.get(question.id);
                    if (val === undefined || val === null) continue;

                    // Resolve value (prefer integer representation for choice questions)
                    let resolvedValue: unknown = val;

                    if (question.options && question.options.length > 0) {
                        if (typeof val === 'number' || Array.isArray(val)) {
                            resolvedValue = val;
                        } else {
                            const opt = question.options.find(o => String(o.value) === String(val));
                            resolvedValue =
                                opt && typeof opt.value === 'number' ? opt.value : val;
                        }
                    }

                    // Build enriched entry
                    const entry: EnrichedAnswer = { value: resolvedValue };

                    // Attach QuestionUniverse metadata (if available)
                    if (this.lookupService?.isInitialized) {
                        const meta = this.lookupService.getMetadata(question.id);
                        if (meta) {
                            if (meta.statisticGroup) entry.statisticGroup = meta.statisticGroup;
                            if (meta.icd10Codes && meta.icd10Codes.length > 0) {
                                entry.icd10Codes = meta.icd10Codes;
                            }
                            if (meta.researchTags && meta.researchTags.length > 0) {
                                entry.researchTags = meta.researchTags;
                            }
                        }
                    }

                    processedAnswers[question.id] = entry;
                }
            }

            // 4. Construct Export Object
            const exportData = {
                exportType: 'ANONYMIZED_ANAMNESE',
                version: '2.0',
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
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
