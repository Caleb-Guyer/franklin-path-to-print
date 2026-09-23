import { questions, type ChapterId } from './data';
export const SAVE_KEY = 'ela-iii-douglass-v1';
export interface CampaignSave {
  version: 1;
  current: ChapterId;
  completed: ChapterId[];
  memories: string[];
  best: Record<string, number>;
  exams: { date: number; correct: number; total: number }[];
  missed: string[];
  music: boolean;
  voice: boolean;
  relaxed: boolean;
  reducedMotion: boolean;
  checkpoint: { chapter: ChapterId; found: number } | null;
}
export function freshDouglassSave(): CampaignSave {
  return {
    version: 1,
    current: 1,
    completed: [],
    memories: [],
    best: {},
    exams: [],
    missed: [],
    music: true,
    voice: true,
    relaxed: false,
    reducedMotion: false,
    checkpoint: null,
  };
}
export function parseDouglassSave(raw: string | null): CampaignSave {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1) return freshDouglassSave();
    const fresh = freshDouglassSave();
    const completed = [
      ...new Set<ChapterId>(
        (Array.isArray(value.completed) ? value.completed : []).filter(
          (id: unknown) => id === 1 || id === 2 || id === 3,
        ),
      ),
    ];
    const current = Math.min(
      3,
      completed.includes(1) ? (completed.includes(2) ? 3 : 2) : 1,
    ) as ChapterId;
    const strings = (v: unknown) =>
      Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
    return {
      ...fresh,
      current,
      completed,
      memories: strings(value.memories),
      best: Object.fromEntries(
        Object.entries(value.best ?? {})
          .filter(
            ([k, v]) =>
              ['1', '2', '3'].includes(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0,
          )
          .map(([key, score]) => [key, Number(score)]),
      ),
      exams: (Array.isArray(value.exams) ? value.exams : [])
        .filter(
          (e: { date: number; correct: number; total: number }) =>
            e &&
            Number.isFinite(e.date) &&
            Number.isInteger(e.correct) &&
            Number.isInteger(e.total) &&
            e.total > 0 &&
            e.correct >= 0 &&
            e.correct <= e.total,
        )
        .slice(-20),
      missed: strings(value.missed).filter((id) => questions.some((q) => q.id === id)),
      music: typeof value.music === 'boolean' ? value.music : true,
      voice: typeof value.voice === 'boolean' ? value.voice : true,
      relaxed: value.relaxed === true,
      reducedMotion: value.reducedMotion === true,
      checkpoint:
        value.checkpoint &&
        [1, 2, 3].includes(value.checkpoint.chapter) &&
        value.checkpoint.chapter <= current &&
        Number.isInteger(value.checkpoint.found) &&
        value.checkpoint.found >= 0 &&
        value.checkpoint.found <= 4
          ? { chapter: value.checkpoint.chapter, found: value.checkpoint.found }
          : null,
    };
  } catch {
    return freshDouglassSave();
  }
}
export function readDouglassSave() {
  try {
    return parseDouglassSave(localStorage.getItem(SAVE_KEY));
  } catch {
    return freshDouglassSave();
  }
}
export function examQuestions(missed?: string[], random = Math.random) {
  const shuffle = <T>(items: T[]) => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  if (missed?.length) return shuffle(questions.filter((q) => missed.includes(q.id)));
  return shuffle(
    [1, 2, 3].flatMap((c) =>
      shuffle(questions.filter((q) => q.chapter === c)).slice(0, c === 3 ? 6 : 7),
    ),
  );
}
