/**
 * ExportGDT Use Case - Export zu Praxissystem (GDT Format)
 * 
 * FLOW:
 * Presentation Layer (ExportScreen)
 *   → Use Case
 *   → Check GDPR Consent
 *   → Load Patient + Questionnaire + Answers
 *   → Decrypt Answers
 *   → Build GDT Export
 *   → Save File
 */

import { IPatientRepository } from '@domain/repositories/IPatientRepository';
import { IQuestionnaireRepository } from '@domain/repositories/IQuestionnaireRepository';
import { IAnswerRepository } from '@domain/repositories/IAnswerRepository';
import { IGDPRConsentRepository } from '@domain/repositories/IGDPRConsentRepository';
import { PatientEntity } from '@domain/entities/Patient';
import { QuestionnaireEntity } from '@domain/entities/Questionnaire';
import { AnswerValue } from '@domain/entities/Answer';
import { GDTExportVO, GDTRecordBuilder } from '@domain/value-objects/GDTExport';
import { decodeMultiChoiceBitset } from '@domain/value-objects/CompartmentAnswerEncoding';
import { requireRNFS } from '@shared/rnfsSafe';

export interface ExportGDTInput {
  patientId: string;
  questionnaireId: string;
  encryptionKey: string;
  senderId: string; // Praxis-ID
  receiverId?: string; // PVS System
  gdtVersion: '2.1' | '3.0';
}

export interface ExportGDTOutput {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * ExportGDT Use Case
 */
export class ExportGDTUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly questionnaireRepository: IQuestionnaireRepository,
    private readonly answerRepository: IAnswerRepository,
    private readonly gdprRepository: IGDPRConsentRepository,
  ) {}

  async execute(input: ExportGDTInput): Promise<ExportGDTOutput> {
    try {
      // Step 1: Check GDPR Consent für GDT Export
      const hasConsent = await this.gdprRepository.hasActiveConsent(
        input.patientId,
        'gdt_export',
      );

      if (!hasConsent) {
        return {
          success: false,
          error: 'GDT export consent not granted',
        };
      }

      // Step 2: Load Patient
      const patient = await this.patientRepository.findById(input.patientId);
      if (!patient) {
        return {
          success: false,
          error: 'Patient not found',
        };
      }

      // Step 3: Load Questionnaire
      const questionnaire = await this.questionnaireRepository.findById(input.questionnaireId);
      if (!questionnaire) {
        return {
          success: false,
          error: 'Questionnaire not found',
        };
      }

      // Step 4: Load & Decrypt Answers
      const answersMap = await this.answerRepository.getAnswersMap(
        input.questionnaireId,
        input.encryptionKey,
      );

      // Step 5: Build GDT Export
      const gdtExport = await this.buildGDTExport(
        patient,
        questionnaire,
        answersMap,
        input,
      );

      // Step 6: Save to File
      const filePath = await this.saveGDTFile(gdtExport, input.patientId);

      // Step 7: Add Audit Log
      const updatedPatient = patient.addAuditLog('exported', `GDT export to ${input.receiverId ?? 'PVS'}`);
      await this.patientRepository.save(updatedPatient);

      return {
        success: true,
        filePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Build GDT Export
   */
  private async buildGDTExport(
    patient: PatientEntity,
    questionnaire: QuestionnaireEntity,
    answersMap: Map<string, AnswerValue>,
    input: ExportGDTInput,
  ): Promise<GDTExportVO> {
    const builder = new GDTRecordBuilder();

    // Patient Data (aus verschlüsselten Daten - muss entschlüsselt werden)
    const patientData = patient.encryptedData;

    // Format birth date: DD.MM.YYYY -> DDMMYYYY
    const birthDate = patientData.birthDate.replace(/[.-]/g, '').substring(0, 8);

    builder.addPatientData({
      patientId: patient.id.substring(0, 8), // GDT limitiert auf 8 Zeichen
      lastName: patientData.lastName,
      firstName: patientData.firstName,
      birthDate,
      gender: patientData.gender === 'male' ? 'M' : patientData.gender === 'female' ? 'F' : 'X',
    });

    // Insurance Data (optional)
    if (patientData.insurance && patientData.insuranceNumber) {
      builder.addInsuranceData({
        insuranceNumber: patientData.insuranceNumber,
        insuranceName: patientData.insurance,
        insuranceType: '1', // GKV
      });
    }

    // Anamnese Text (alle Antworten als Text)
    const anamnesisText = this.buildAnamnesisText(questionnaire, answersMap);
    builder.addAnamnesisText(anamnesisText);

    // Build GDT Export
    return builder.build({
      version: input.gdtVersion,
      senderId: input.senderId,
      receiverId: input.receiverId,
      patientId: patient.id,
    });
  }

  /**
   * Build Anamnesis Text aus allen Antworten
   */
  private buildAnamnesisText(
    questionnaire: QuestionnaireEntity,
    answersMap: Map<string, AnswerValue>,
  ): string {
    let text = 'MEDIZINISCHE ANAMNESE\n\n';

    for (const section of questionnaire.sections) {
      text += `${section.titleKey.toUpperCase()}\n`;
      text += '='.repeat(section.titleKey.length) + '\n\n';

      for (const question of section.questions) {
        const answer = answersMap.get(question.id);
        
        if (answer !== undefined && answer !== null) {
          text += `${question.labelKey}: `;
          text += this.formatAnswer(question, answer);
          
          text += '\n';
        }
      }

      text += '\n';
    }

    return text;
  }

  private formatAnswer(
    question: QuestionnaireEntity['sections'][number]['questions'][number],
    answer: AnswerValue,
  ): string {
    // Legacy array-based multiselect
    if (Array.isArray(answer)) {
      return answer.map((v) => String(v)).join(', ');
    }

    if (typeof answer === 'boolean') {
      return answer ? 'Ja' : 'Nein';
    }

    // Option-based rendering (numeric answers)
    if (typeof answer === 'number' && question.options && question.options.length > 0) {
      // Multiselect stored as bitset integer
      if (question.type === 'multiselect' || question.type === 'checkbox') {
        const selectedBitPositions = decodeMultiChoiceBitset(answer);
        const labels = selectedBitPositions
          .map((bitPos) => question.options?.find((o) => o.value === bitPos)?.labelKey)
          .filter((v): v is string => typeof v === 'string' && v.length > 0);

        return labels.length > 0 ? labels.join(', ') : answer.toString();
      }

      // Single-choice numeric option values
      const match = question.options.find((o) => o.value === answer);
      if (match) {
        return String(match.labelKey);
      }
    }

    if (answer === null) return '';
    return String(answer);
  }

  /**
   * Save GDT File
   */
  private async saveGDTFile(gdtExport: GDTExportVO, patientId: string): Promise<string> {
    const RNFS = requireRNFS();

    // Create exports directory
    const exportsDir = `${RNFS.DocumentDirectoryPath}/exports`;
    await RNFS.mkdir(exportsDir);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `anamnese_${patientId.substring(0, 8)}_${timestamp}.gdt`;
    const filePath = `${exportsDir}/${fileName}`;

    // Convert to GDT string
    const gdtString = gdtExport.toGDTString();

    // Write file (ISO-8859-1 encoding für GDT)
    await RNFS.writeFile(filePath, gdtString, 'ascii');

    return filePath;
  }
}
