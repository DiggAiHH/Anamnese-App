export type EncodedAnswerInt = number;

function assertInteger(value: number, name: string): void {
  if (!Number.isInteger(value)) {
    throw new Error(`${name} must be an integer`);
  }
}

/**
 * Encodes a binary (yes/no) answer into an integer.
 * - yes -> 1
 * - no  -> 0
 */
export function encodeBinaryAnswer(value: boolean): EncodedAnswerInt {
  return value ? 1 : 0;
}

/**
 * Encodes a single-choice answer that is already represented by an integer option value.
 */
export function encodeSingleChoiceAnswer(optionValue: number): EncodedAnswerInt {
  assertInteger(optionValue, 'optionValue');
  return optionValue;
}

/**
 * Encodes a multi-choice selection into a single integer bitset.
 * Each selected value is interpreted as a bit position.
 *
 * Example: [0, 2] => 0b101 => 5
 *
 * Constraints:
 * - values must be integers in [0, 30] to stay within 32-bit signed operations.
 */
export function encodeMultiChoiceBitset(selectedBitPositions: number[]): EncodedAnswerInt {
  let bitset = 0;

  for (const bitPosition of selectedBitPositions) {
    assertInteger(bitPosition, 'bitPosition');
    if (bitPosition < 0 || bitPosition > 30) {
      throw new Error('bitPosition must be in range [0, 30]');
    }
    bitset |= 1 << bitPosition;
  }

  return bitset;
}

export function decodeMultiChoiceBitset(bitset: number): number[] {
  assertInteger(bitset, 'bitset');
  const selected: number[] = [];

  for (let bitPosition = 0; bitPosition <= 30; bitPosition++) {
    if ((bitset & (1 << bitPosition)) !== 0) {
      selected.push(bitPosition);
    }
  }

  return selected;
}

/**
 * Combines a container/question order (e.g. 2) with an encoded answer value (e.g. 1)
 * into a single integer by decimal concatenation: 2 + 1 => 21.
 *
 * Note: This is only unambiguous when `answerValue` is a single decimal digit (0-9).
 */
export function encodeCompositeConcat(containerOrder: number, answerValue: number): EncodedAnswerInt {
  assertInteger(containerOrder, 'containerOrder');
  assertInteger(answerValue, 'answerValue');

  if (containerOrder < 0) {
    throw new Error('containerOrder must be >= 0');
  }
  if (answerValue < 0) {
    throw new Error('answerValue must be >= 0');
  }

  const factor = answerValue === 0 ? 10 : 10 ** (Math.floor(Math.log10(answerValue)) + 1);
  return containerOrder * factor + answerValue;
}

/**
 * Safer composite encoding using a fixed base:
 * composite = containerOrder * base + answerValue
 *
 * If you set base >= max answer value + 1, decoding is always unambiguous.
 */
export function encodeCompositeBase(
  containerOrder: number,
  answerValue: number,
  base: number,
): EncodedAnswerInt {
  assertInteger(containerOrder, 'containerOrder');
  assertInteger(answerValue, 'answerValue');
  assertInteger(base, 'base');

  if (base <= 0) {
    throw new Error('base must be > 0');
  }
  if (containerOrder < 0) {
    throw new Error('containerOrder must be >= 0');
  }
  if (answerValue < 0 || answerValue >= base) {
    throw new Error('answerValue must be in range [0, base)');
  }

  return containerOrder * base + answerValue;
}

export function decodeCompositeBase(composite: number, base: number): {
  containerOrder: number;
  answerValue: number;
} {
  assertInteger(composite, 'composite');
  assertInteger(base, 'base');

  if (base <= 0) {
    throw new Error('base must be > 0');
  }

  const containerOrder = Math.floor(composite / base);
  const answerValue = composite % base;

  return { containerOrder, answerValue };
}
