import { describe, it, expect } from 'vitest';
import { facts, factById } from '../data/facts';
import { questions, questionById } from '../data/questions';
import { chapters, events } from '../data/chapters';
import { characters, relationships } from '../data/characters';
import { locations } from '../data/locations';
import { cards } from '../data/catalog';
import {
  freshSave,
  grade,
  normalize,
  recordAnswer,
  parseSave,
  selectQuestions,
  priority,
  mastered,
  award,
  recognition,
  level,
  topicResults,
} from './game';
describe('Source coverage and referential integrity', () => {
  it('covers all 27 PDF pages with a substantial bank, cards, scenes and profiles', () => {
    expect(facts).toHaveLength(252);
    expect(questions).toHaveLength(272);
    expect(cards.length).toBeGreaterThanOrEqual(75);
    expect(events).toHaveLength(60);
    expect(characters.length).toBeGreaterThanOrEqual(25);
    expect(chapters).toHaveLength(12);
    expect([...new Set(facts.flatMap((f) => f.sourcePages))].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 27 }, (_, i) => i + 1),
    );
  });
  it('has unique IDs, valid citations and usable answers in every record', () => {
    for (const list of [facts, questions, events, characters, locations]) {
      expect(new Set(list.map((x) => x.id)).size).toBe(list.length);
      for (const x of list) {
        expect(x.sourcePages.length).toBeGreaterThan(0);
        for (const page of x.sourcePages)
          expect(page >= 1 && page <= 27 && Number.isInteger(page)).toBe(true);
      }
    }
    for (const q of questions) {
      expect(q.answer.trim().length).toBeGreaterThan(0);
      expect(q.explanation.trim().length).toBeGreaterThan(20);
      expect(
        q.prompt.endsWith('?') ||
          q.type === 'order' ||
          q.type === 'match' ||
          q.prompt.endsWith('.'),
      ).toBe(true);
      for (const id of q.factIds) expect(factById[id], `${q.id}: ${id}`).toBeDefined();
      if (q.type === 'choice') {
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options!.map(normalize)).size).toBe(q.options!.length);
        expect(q.options!.length).toBe(4);
      }
    }
  });
  it('puts every fact in the playable story and every chapter has a trial', () => {
    const covered = new Set(events.flatMap((e) => e.factIds));
    expect(facts.filter((f) => !covered.has(f.id)).map((f) => f.id)).toEqual([]);
    for (const chapter of chapters) {
      expect(events.filter((e) => e.chapter === chapter.id).length).toBeGreaterThan(0);
      expect(questions.filter((q) => q.chapter === chapter.id).length).toBeGreaterThanOrEqual(10);
    }
  });
  it('keeps references between characters, locations, cards, and scenes valid', () => {
    for (const item of [...characters, ...locations, ...cards])
      for (const id of 'factIds' in item ? item.factIds : [item.id])
        expect(factById[id]).toBeDefined();
    for (const [a, b] of relationships) {
      expect(characters.some((c) => c.id === a)).toBe(true);
      expect(characters.some((c) => c.id === b)).toBe(true);
    }
    for (const c of cards) {
      expect(c.relatedEvents.length).toBeGreaterThan(0);
      for (const id of c.relatedCharacters) expect(characters.some((p) => p.id === id)).toBe(true);
    }
  });
  it('orders chronology challenges by event sequence, including retrospective scenes', () => {
    for (const q of questions.filter((q) => q.type === 'order')) {
      const orders = q.sequence!.map((title) => events.find((e) => e.title === title)!.order);
      expect(orders, q.id).toEqual([...orders].sort((a, b) => a - b));
    }
  });
});
describe('Recall scoring', () => {
  it('accepts every canonical answer and declared alternative', () => {
    for (const q of questions.filter((q) => q.type !== 'order' && q.type !== 'match'))
      for (const answer of [q.answer, ...q.aliases])
        expect(grade(q, answer), q.id + ': ' + answer).toBe(true);
  });
  it('accepts reordered date tokens, punctuation, case and ordinal dates', () => {
    expect(grade(questionById.q111, '24th December, 1724')).toBe(true);
    expect(grade(questionById.q169, 'Integrity, truth and sincerity')).toBe(true);
    expect(grade(questionById.q063, 'WILLIAM BRADFORD')).toBe(true);
  });
  it('does not accept wrong names, negation, empty responses or partial chronology', () => {
    expect(grade(questionById.q063, 'Andrew Bradford')).toBe(false);
    expect(grade(questionById.q063, 'not William Bradford')).toBe(false);
    expect(grade(questionById.q063, '')).toBe(false);
    const q = questionById.order02;
    expect(grade(q, q.sequence!.join('||'))).toBe(true);
    expect(grade(q, [...q.sequence!].reverse().join('||'))).toBe(false);
  });
  it('grades complete matching maps and rejects swaps or missing pairs', () => {
    const q = questionById.match01;
    const good = Object.fromEntries(q.pairs!);
    expect(grade(q, JSON.stringify(good))).toBe(true);
    good[q.pairs![0][0]] = q.pairs![1][1];
    expect(grade(q, JSON.stringify(good))).toBe(false);
    expect(grade(q, '{}')).toBe(false);
  });
  it('creates recognition choices with one canonical answer', () => {
    const q = recognition(questionById.q009);
    expect(q.type).toBe('choice');
    expect(q.options!.filter((x) => x === q.answer)).toHaveLength(1);
    expect(q.options).toHaveLength(4);
  });
});
describe('Adaptive review and local saves', () => {
  it('saves misses, repeats them, clears after two corrects and masters after three', () => {
    const q = questionById.q220;
    let s = recordAnswer(freshSave(), q, false, 3, 1000);
    expect(s.mistakes).toContain(q.id);
    expect(s.history[q.id]).toMatchObject({
      attempts: 1,
      correct: 0,
      incorrect: 1,
      streak: 0,
      confidence: 3,
      lastSeen: 1000,
      dueAt: 61000,
    });
    const weakPriority = priority(q, s, 70000);
    s = recordAnswer(s, q, true, 2, 80000);
    expect(s.mistakes).toContain(q.id);
    s = recordAnswer(s, q, true, 3, 100000);
    expect(s.mistakes).not.toContain(q.id);
    expect(mastered(s.history[q.id])).toBe(false);
    s = recordAnswer(s, q, true, 3, 120000);
    expect(mastered(s.history[q.id])).toBe(true);
    expect(priority(q, s, 120001)).toBeLessThan(weakPriority);
    expect(s.unlockedCards).toContain('f220');
  });
  it('round-trips a complete save and safely recovers bad data', () => {
    const q = questionById.q025;
    const s = recordAnswer(freshSave(), q, true, 2);
    expect(parseSave(JSON.stringify(s))).toEqual(s);
    expect(parseSave('{broken')).toEqual(freshSave());
    expect(parseSave('{"version":100}')).toEqual(freshSave());
    expect(parseSave(null)).toEqual(freshSave());
  });
  it('builds 20 distinct questions with every chapter, matching and ordering', () => {
    for (let i = 0; i < 30; i++) {
      const round = selectQuestions(questions, 20, freshSave(), true);
      expect(round).toHaveLength(20);
      expect(new Set(round.map((q) => q.id)).size).toBe(20);
      expect(new Set(round.map((q) => q.chapter)).size).toBe(12);
      expect(round.some((q) => q.type === 'match')).toBe(true);
      expect(round.some((q) => q.type === 'order')).toBe(true);
    }
  });
  it('uses all eligible questions once in Everything, and handles a short trouble list', () => {
    expect(selectQuestions(questions, questions.length, freshSave())).toHaveLength(272);
    expect(selectQuestions([questionById.q220], 20, freshSave())).toHaveLength(1);
  });
  it('awards milestones from evidence and never duplicates achievements', () => {
    const s = freshSave();
    expect(s.achievements).toHaveLength(0);
    s.completedChapters = [1];
    expect(award(s).achievements).toContain('first');
    s.history.order01 = {
      attempts: 1,
      correct: 1,
      incorrect: 0,
      streak: 1,
      confidence: 2,
      lastSeen: 1,
      dueAt: 2,
    };
    expect(award(s).achievements).toContain('historian');
    const awarded = award(award(s));
    expect(new Set(awarded.achievements).size).toBe(awarded.achievements.length);
    expect(level(0)).toBe(1);
  });
  it('reports strong and weak topics from actual marked responses', () => {
    const result = topicResults([
      { questionId: 'q025', response: 'Brownell', correct: true, confidence: 2 },
      { questionId: 'q031', response: 'wrong', correct: false, confidence: 1 },
    ]);
    expect(result[0].topic).toBe('Books');
    expect(result[0].rate).toBe(0);
    expect(result.at(-1)?.rate).toBe(1);
  });
});
