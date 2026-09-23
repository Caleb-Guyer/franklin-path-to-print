import { describe, expect, it } from 'vitest';
import { missions, passage, questions, source } from './data';
import { canWalk, castRay, estateMap, finalSite, testimonySites, wallAt } from './engine';
import { examQuestions, freshDouglassSave, parseDouglassSave } from './save';
import { freshSave } from '../lib/game';

describe('Douglass primary-source campaign', () => {
  it('uses only the three requested chapters, with valid references and exact reported quotations', () => {
    expect(source.map((c) => c.chapter)).toEqual([1, 2, 3]);
    expect(source.map((c) => c.paragraphs.length)).toEqual([10, 12, 6]);
    expect(missions).toHaveLength(3);
    for (const mission of missions) {
      expect(mission.memories).toHaveLength(4);
      for (const memory of mission.memories) {
        expect(memory.lines.length).toBeGreaterThanOrEqual(2);
        for (const line of memory.lines) {
          expect(line.text.length).toBeLessThan(215);
          expect(line.refs.length).toBeGreaterThan(0);
          for (const ref of line.refs) expect(passage(ref), ref).toBeTruthy();
          if (line.exact) expect(line.refs.map(passage).join(' ')).toContain(line.text);
        }
      }
    }
    expect(source.flatMap((c) => c.paragraphs).join('')).not.toContain('\ufffd');
  });
  it('offers 36 distinct questions, four unique choices, and a real source for every answer', () => {
    expect(questions).toHaveLength(36);
    expect(new Set(questions.map((q) => q.prompt)).size).toBe(36);
    for (const question of questions) {
      expect(new Set(question.choices).size).toBe(4);
      expect(question.choices[question.answer]).toBeTruthy();
      for (const ref of question.refs) expect(passage(ref), ref).toBeTruthy();
    }
  });
  it('builds balanced twenty-question exams without repeating a question and can retry only misses', () => {
    const exam = examQuestions(undefined, () => 0.43);
    expect(exam).toHaveLength(20);
    expect(new Set(exam.map((q) => q.id)).size).toBe(20);
    expect([1, 2, 3].map((c) => exam.filter((q) => q.chapter === c).length)).toEqual([7, 7, 6]);
    expect(
      examQuestions(['d-2', 'd-19'])
        .map((q) => q.id)
        .sort(),
    ).toEqual(['d-19', 'd-2']);
    expect(examQuestions(['unknown'])).toHaveLength(0);
  });
});
describe('campaign navigation and saves', () => {
  it('has a traversable route to every first-person objective and the exit', () => {
    const reached = new Set(['2,2']),
      queue = [[2, 2]];
    while (queue.length) {
      const [x, y] = queue.shift()!;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ]) {
        const nx = x + dx,
          ny = y + dy,
          key = `${nx},${ny}`;
        if (!reached.has(key) && !wallAt(nx, ny)) {
          reached.add(key);
          queue.push([nx, ny]);
        }
      }
    }
    for (const point of [...testimonySites, finalSite]) {
      expect(canWalk(point.x, point.y)).toBe(true);
      expect(reached.has(`${Math.floor(point.x)},${Math.floor(point.y)}`)).toBe(true);
    }
    expect(estateMap.every((r) => r.length === 16)).toBe(true);
  });
  it('stops rays and the player at solid walls', () => {
    expect(canWalk(0.9, 2.5)).toBe(false);
    expect(canWalk(2.5, 2.5)).toBe(true);
    expect(castRay(2.5, 2.5, Math.PI).distance).toBeCloseTo(1.5);
    expect(castRay(2.5, 2.5, 0).tile).toBe(2);
  });
  it('recovers damaged saves and keeps campaign data independent of Franklin', () => {
    expect(parseDouglassSave('{')).toEqual(freshDouglassSave());
    expect(parseDouglassSave(JSON.stringify(freshSave()))).toEqual(freshDouglassSave());
    const save = parseDouglassSave(
      JSON.stringify({
        ...freshDouglassSave(),
        completed: [1, 1, 2, 44],
        current: 99,
        checkpoint: { chapter: 3, found: 2 },
        best: { 1: 200, 2: -10 },
        missed: ['d-1', 'bad'],
      }),
    );
    expect(save.completed).toEqual([1, 2]);
    expect(save.current).toBe(3);
    expect(save.checkpoint).toEqual({ chapter: 3, found: 2 });
    expect(save.best).toEqual({ 1: 200 });
    expect(save.missed).toEqual(['d-1']);
    expect(
      parseDouglassSave(
        JSON.stringify({ ...freshDouglassSave(), checkpoint: { chapter: 3, found: 2 } }),
      ).checkpoint,
    ).toBeNull();
  });
});
