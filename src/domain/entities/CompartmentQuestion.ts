export type CompartmentInputType =
  | 'binary'
  | 'single'
  | 'multi'
  | 'text'
  | 'number'
  | 'date';

export type CompartmentOption = {
  value: number;
  label: string;
};

export type CompartmentQuestionParams = {
  /**
   * Stable numeric identifier (int32)
   */
  id: number;

  /**
   * Display/order position (int16)
   */
  order: number;

  /**
   * Optional code like "Q001" for human tracing
   */
  code: string;

  /**
   * High-level group, e.g. "Basisdaten"
   */
  section: string;

  /**
   * Sub-group / concept, e.g. "Persönliche Informationen"
   */
  concept: string;

  /**
   * The actual question label, e.g. "Vorname"
   */
  label: string;

  inputType: CompartmentInputType;

  /**
   * For single/multi choice.
   * Values are integers so answers can remain integer-only.
   */
  options?: CompartmentOption[];

  required?: boolean;

  /**
   * Marks questions that are privacy/GDPR-related.
   */
  gdprRelated?: boolean;
};

function assertIntRange(value: number, min: number, max: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
  if (value < min || value > max) {
    throw new Error(`${name} must be in range [${min}, ${max}]`);
  }
}

export class CompartmentQuestion {
  readonly id: number;
  readonly order: number;
  readonly code: string;
  readonly section: string;
  readonly concept: string;
  readonly label: string;
  readonly inputType: CompartmentInputType;
  readonly options?: CompartmentOption[];
  readonly required: boolean;
  readonly gdprRelated: boolean;

  constructor(params: CompartmentQuestionParams) {
    assertIntRange(params.id, -2147483648, 2147483647, 'id');
    assertIntRange(params.order, -32768, 32767, 'order');

    if (params.code.trim().length === 0) {
      throw new Error('code must be a non-empty string');
    }
    if (params.section.trim().length === 0) {
      throw new Error('section must be a non-empty string');
    }
    if (params.concept.trim().length === 0) {
      throw new Error('concept must be a non-empty string');
    }
    if (params.label.trim().length === 0) {
      throw new Error('label must be a non-empty string');
    }

    if ((params.inputType === 'single' || params.inputType === 'multi') && (!params.options || params.options.length === 0)) {
      throw new Error('options are required for single/multi choice questions');
    }

    this.id = params.id;
    this.order = params.order;
    this.code = params.code;
    this.section = params.section;
    this.concept = params.concept;
    this.label = params.label;
    this.inputType = params.inputType;
    this.options = params.options;
    this.required = params.required ?? false;
    this.gdprRelated = params.gdprRelated ?? false;
  }
}
