import {
  decodeCompositeBase,
  decodeMultiChoiceBitset,
  encodeBinaryAnswer,
  encodeCompositeBase,
  encodeCompositeConcat,
  encodeMultiChoiceBitset,
  encodeSingleChoiceAnswer,
} from '../CompartmentAnswerEncoding';

describe('CompartmentAnswerEncoding', () => {
  it('encodes binary answers as 0/1', () => {
    expect(encodeBinaryAnswer(false)).toBe(0);
    expect(encodeBinaryAnswer(true)).toBe(1);
  });

  it('passes through single-choice integer values', () => {
    expect(encodeSingleChoiceAnswer(7)).toBe(7);
  });

  it('encodes multi-choice as bitset', () => {
    const bitset = encodeMultiChoiceBitset([0, 2, 5]);
    expect(bitset).toBe((1 << 0) | (1 << 2) | (1 << 5));
    expect(decodeMultiChoiceBitset(bitset)).toEqual([0, 2, 5]);
  });

  it('encodes composite by concatenation (example: container 2 + yes(1) => 21)', () => {
    expect(encodeCompositeConcat(2, 1)).toBe(21);
  });

  it('encodes/decodes composite via base', () => {
    const composite = encodeCompositeBase(2, 1, 100);
    expect(composite).toBe(201);
    expect(decodeCompositeBase(composite, 100)).toEqual({ containerOrder: 2, answerValue: 1 });
  });
});
