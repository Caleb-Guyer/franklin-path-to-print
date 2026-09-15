import { describe, expect, it } from 'vitest';
import { questions } from '../data/questions';
import { multipleChoice } from './choices';
import { grade } from './game';
import { dialogueBeats } from './speech';
import { facts } from '../data/facts';
import { events } from '../data/chapters';

describe('multiple-choice presentation', () => {
  it('gives every question a deterministic, uniquely correct set of choices', () => {
    for (const original of questions) {
      const q = multipleChoice(original);
      expect(q.type, q.id).toBe('choice');
      expect(q.options!.length, q.id).toBeGreaterThanOrEqual(2);
      expect(q.options!.length, q.id).toBeLessThanOrEqual(4);
      expect(new Set(q.options).size, q.id).toBe(q.options!.length);
      expect(
        q.options!.filter((option) => grade(q, option)),
        q.id,
      ).toEqual([q.answer]);
      expect(multipleChoice(original), q.id).toEqual(q);
      expect(q.id).toBe(original.id);
      expect(q.sourcePages).toEqual(original.sourcePages);
    }
  });
  it('keeps chronology and relationships meaningful with short choice questions', () => {
    for (const original of questions.filter((q) => q.type === 'order')) {
      const q = multipleChoice(original);
      const previous = original.sequence![original.sequence!.indexOf(q.answer) - 1];
      expect(q.prompt).toContain(previous);
      expect(q.options!.every((s) => original.sequence!.includes(s))).toBe(true);
    }
    for (const original of questions.filter((q) => q.type === 'match')) {
      const q = multipleChoice(original),
        pair = original.pairs!.find((p) => p[1] === q.answer)!;
      expect(q.prompt).toContain(pair[0]);
      expect(q.options!.every((s) => original.pairs!.some((p) => p[1] === s))).toBe(true);
    }
  });
  it('takes factual distractors from the source bank, not invented biography', () => {
    const sourceAnswers = new Set(facts.map((f) => f.answer));
    const sourcePairs = new Set(
      facts.flatMap((a) =>
        facts.filter((b) => b.id !== a.id).map((b) => `${a.answer} and ${b.answer}`),
      ),
    );
    for (const original of questions.filter((q) => !q.options && !q.sequence && !q.pairs)) {
      for (const option of multipleChoice(original).options!)
        expect(
          sourceAnswers.has(option) || sourcePairs.has(option),
          original.id + ': ' + option,
        ).toBe(true);
    }
  });
});
describe('spoken learning beats', () => {
  it('splits every fact and scene without dropping or rewriting source wording', () => {
    const texts = [
      ...facts.map((f) => f.details),
      ...events.map((e) => e.narration),
      ...events.filter((e) => e.dialogue).map((e) => e.dialogue!.line),
    ];
    for (const text of texts) {
      const beats = dialogueBeats(text);
      expect(beats.join(' ')).toBe(text.trim().replace(/\s+/g, ' '));
      expect(beats.every((s) => s.length <= 175)).toBe(true);
    }
  });
  it('does not split a name immediately after an abbreviated title', () => {
    const lines = dialogueBeats(
      'A printer introduces a curious visitor to a lively gathering with Dr. Mandeville at the Horns.',
    );
    expect(lines.every((line) => !line.endsWith('Dr.'))).toBe(true);
  });
});
