import { facts } from '../data/facts';
import { questions, questionById } from '../data/questions';
import type { Question } from '../data/types';
import { multipleChoice } from './choices';
export const SAVE_KEY = 'franklin-path-to-print-v1';
export interface History {
  attempts: number;
  correct: number;
  incorrect: number;
  streak: number;
  confidence: number;
  lastSeen: number;
  dueAt: number;
}
export interface AnswerRecord {
  questionId: string;
  response: string;
  correct: boolean;
  confidence: number;
  selfAssessed?: boolean;
  prompt?: string;
  answer?: string;
}
export interface ExamRecord {
  id: string;
  title: string;
  date: number;
  score: number;
  total: number;
  answers: AnswerRecord[];
}
export interface Save {
  version: 1;
  xp: number;
  currentChapter: number;
  completedEvents: string[];
  completedChapters: number[];
  unlockedCards: string[];
  achievements: string[];
  history: Record<string, History>;
  mistakes: string[];
  streak: number;
  bestStreak: number;
  decisions: Record<string, number>;
  exams: ExamRecord[];
  platformer: {
    combatVersion: number;
    level: number;
    unlocked: number;
    collected: string[];
    checkpoints: Record<string, number>;
    completed: number[];
    bestTimes: Record<string, number>;
  };
  settings: {
    sound: boolean;
    music: boolean;
    narration: boolean;
    autoDialogue: boolean;
    reducedMotion: boolean;
    timed: boolean;
    largeText: boolean;
  };
}
export const freshSave = (): Save => ({
  version: 1,
  xp: 0,
  currentChapter: 1,
  completedEvents: [],
  completedChapters: [],
  unlockedCards: [],
  achievements: [],
  history: {},
  mistakes: [],
  streak: 0,
  bestStreak: 0,
  decisions: {},
  exams: [],
  platformer: {
    combatVersion: 1,
    level: 0,
    unlocked: 0,
    collected: [],
    checkpoints: {},
    completed: [],
    bestTimes: {},
  },
  settings: {
    sound: false,
    music: true,
    narration: true,
    autoDialogue: true,
    reducedMotion: false,
    timed: false,
    largeText: false,
  },
});
const unique = <T>(xs: T[]) => [...new Set(xs)];
const numeric = (x: unknown): x is number => typeof x === 'number' && Number.isFinite(x) && x >= 0;
export function parseSave(raw: string | null): Save {
  if (!raw) return freshSave();
  try {
    const parsed = JSON.parse(raw);
    if (parsed.version !== 1 || !numeric(parsed.xp)) return freshSave();
    const base = freshSave();
    const history: Record<string, History> = {};
    for (const [id, h] of Object.entries(parsed.history ?? {}) as [string, History][]) {
      if (
        questionById[id] &&
        h &&
        ['attempts', 'correct', 'incorrect', 'streak', 'confidence', 'lastSeen', 'dueAt'].every(
          (k) => numeric(h[k as keyof History]),
        )
      )
        history[id] = h;
    }
    const strings = (x: unknown): string[] =>
      Array.isArray(x) ? x.filter((v) => typeof v === 'string') : [];
    return {
      ...base,
      xp: parsed.xp,
      currentChapter: Math.max(1, Math.min(12, Math.floor(parsed.currentChapter) || 1)),
      completedEvents: strings(parsed.completedEvents),
      completedChapters: Array.isArray(parsed.completedChapters)
        ? unique(parsed.completedChapters.filter((n: unknown) => numeric(n) && n >= 1 && n <= 12))
        : [],
      unlockedCards: strings(parsed.unlockedCards).filter((id) => facts.some((f) => f.id === id)),
      achievements: strings(parsed.achievements),
      history,
      mistakes: strings(parsed.mistakes).filter((id) => questionById[id]),
      streak: numeric(parsed.streak) ? parsed.streak : 0,
      bestStreak: numeric(parsed.bestStreak) ? parsed.bestStreak : 0,
      decisions: typeof parsed.decisions === 'object' && parsed.decisions ? parsed.decisions : {},
      platformer: {
        combatVersion: 1,
        level: numeric(parsed.platformer?.level)
          ? Math.min(11, Math.floor(parsed.platformer.level))
          : 0,
        unlocked: numeric(parsed.platformer?.unlocked)
          ? Math.min(11, Math.floor(parsed.platformer.unlocked))
          : 0,
        collected: strings(parsed.platformer?.collected).filter((id) =>
          facts.some((f) => f.id === id),
        ),
        checkpoints: Object.fromEntries(
          Object.entries(
            parsed.platformer?.combatVersion === 1 ? (parsed.platformer?.checkpoints ?? {}) : {},
          )
            .filter(
              ([k, v]) => /^([0-9]|1[01])$/.test(k) && numeric(v) && Number.isInteger(v) && v <= 3,
            )
            .map(([k, v]) => [k, Number(v)]),
        ),
        completed: Array.isArray(parsed.platformer?.completed)
          ? unique(parsed.platformer.completed.filter((n: unknown) => numeric(n) && n <= 11))
          : [],
        bestTimes: Object.fromEntries(
          Object.entries(
            parsed.platformer?.combatVersion === 1 ? (parsed.platformer?.bestTimes ?? {}) : {},
          )
            .filter(([k, v]) => /^([0-9]|1[01])$/.test(k) && numeric(v))
            .map(([k, v]) => [k, Number(v)]),
        ),
      },
      exams: Array.isArray(parsed.exams)
        ? parsed.exams
            .filter(
              (e: ExamRecord) =>
                e &&
                typeof e.id === 'string' &&
                numeric(e.score) &&
                numeric(e.total) &&
                e.total > 0 &&
                Array.isArray(e.answers) &&
                e.answers.every(
                  (a) =>
                    questionById[a.questionId] &&
                    typeof a.correct === 'boolean' &&
                    typeof a.response === 'string',
                ),
            )
            .slice(-30)
        : [],
      settings: Object.fromEntries(
        Object.entries(base.settings).map(([k, v]) => [
          k,
          typeof parsed.settings?.[k] === 'boolean' ? parsed.settings[k] : v,
        ]),
      ) as Save['settings'],
    };
  } catch {
    return freshSave();
  }
}
export const level = (xp: number) => Math.floor(Math.sqrt(xp / 90)) + 1;
export const levelProgress = (xp: number) => {
  const l = level(xp);
  const floor = (l - 1) ** 2 * 90;
  return ((xp - floor) / (l * l * 90 - floor)) * 100;
};
export const mastered = (h: History | undefined) => !!h && h.streak >= 3 && h.correct >= 3;
export const rank = (xp: number) =>
  ['Apprentice', 'Compositor', 'Journeyman', 'Printer', 'Publisher', 'Master of the Press'][
    Math.min(5, Math.floor((level(xp) - 1) / 2))
  ];
const numberWords: Record<string, string> = {
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  eight: '8',
  ten: '10',
  twelve: '12',
  fifteen: '15',
  seventeen: '17',
  thirty: '30',
  forty: '40',
  fifty: '50',
  seventy: '70',
  ninety: '90',
};
export function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map(
      (w) =>
        numberWords[w] ??
        (
          {
            jan: 'january',
            feb: 'february',
            sept: 'september',
            sep: 'september',
            oct: 'october',
            dec: 'december',
          } as Record<string, string>
        )[w] ??
        w,
    )
    .join(' ');
}
const tokens = (s: string) =>
  normalize(s)
    .split(' ')
    .filter((w) => !['a', 'an', 'the', 'and'].includes(w))
    .sort()
    .join(' ');
export function grade(q: Question, response: string): boolean {
  const n = normalize(response);
  if (!n) return false;
  if (q.type === 'order') return response === (q.sequence ?? []).join('||');
  if (q.type === 'match') {
    try {
      const pairs = JSON.parse(response) as Record<string, string>;
      return !!q.pairs?.every(([k, v]) => pairs[k] === v);
    } catch {
      return false;
    }
  }
  return [q.answer, ...q.aliases].some((a) => normalize(a) === n || tokens(a) === tokens(response));
}
export function recordAnswer(
  save: Save,
  q: Question,
  correct: boolean,
  confidence: number,
  now = Date.now(),
): Save {
  const h = save.history[q.id] ?? {
    attempts: 0,
    correct: 0,
    incorrect: 0,
    streak: 0,
    confidence: 0,
    lastSeen: 0,
    dueAt: 0,
  };
  const streak = correct ? h.streak + 1 : 0;
  const next: Save = {
    ...save,
    xp:
      save.xp +
      (correct ? Math.round((10 + q.difficulty * 4) * (1 + Math.min(save.streak, 8) * 0.1)) : 2),
    streak: correct ? save.streak + 1 : 0,
    bestStreak: Math.max(save.bestStreak, correct ? save.streak + 1 : 0),
    unlockedCards: unique([...save.unlockedCards, ...q.factIds]),
    history: {
      ...save.history,
      [q.id]: {
        attempts: h.attempts + 1,
        correct: h.correct + Number(correct),
        incorrect: h.incorrect + Number(!correct),
        streak,
        confidence: Math.max(1, Math.min(3, confidence)),
        lastSeen: now,
        dueAt:
          now +
          (correct
            ? [5, 30, 240, 1440, 4320][Math.min(streak - 1, 4)] *
              60000 *
              (confidence === 1 ? 0.5 : 1)
            : 60000),
      },
    },
    mistakes:
      correct && streak >= 2
        ? save.mistakes.filter((id) => id !== q.id)
        : !correct
          ? unique([...save.mistakes, q.id])
          : save.mistakes,
  };
  return award(next);
}
export const achievementDefinitions = [
  ['first', 'First Edition', 'Complete your first story chapter.'],
  [
    'printing',
    'Printer’s Apprentice',
    'Master every Business fact with three correct answers in a row.',
  ],
  ['bookworm', 'Bookworm', 'Answer every Books fact correctly at least once.'],
  ['historian', 'Historian', 'Solve a chronology challenge perfectly.'],
  [
    'expert',
    'Franklin Expert',
    'Master all 252 factual questions with three correct answers in a row.',
  ],
  ['survivor', 'Part One Survivor', 'Complete all twelve chapters and their trials.'],
  ['tomorrow', 'Exam Master', 'Score at least 90% on a 20-question final exam.'],
  ['streak', 'An Unbroken Line', 'Reach ten correct answers in a row.'],
];
export function award(save: Save): Save {
  const earned = [...save.achievements];
  const factual = questions.filter((q) => q.id.startsWith('q'));
  const books = factual.filter((q) => q.category === 'Books');
  const business = factual.filter((q) => q.category === 'Business');
  if (save.completedChapters.length) earned.push('first');
  if (save.completedChapters.length === 12) earned.push('survivor');
  if (save.bestStreak >= 10) earned.push('streak');
  if (questions.some((q) => q.type === 'order' && (save.history[q.id]?.correct ?? 0) > 0))
    earned.push('historian');
  if (books.every((q) => (save.history[q.id]?.correct ?? 0) > 0)) earned.push('bookworm');
  if (business.every((q) => mastered(save.history[q.id]))) earned.push('printing');
  if (factual.every((q) => mastered(save.history[q.id]))) earned.push('expert');
  if (
    save.exams.some((e) => e.title === 'Final Exam' && e.total === 20 && e.score / e.total >= 0.9)
  )
    earned.push('tomorrow');
  return { ...save, achievements: unique(earned) };
}
export function priority(q: Question, save: Save, now = Date.now()) {
  const h = save.history[q.id];
  if (!h) return 4;
  return (
    Math.max(
      0.15,
      1 +
        (h.incorrect * 3) / (1 + h.streak) +
        (save.mistakes.includes(q.id) ? 5 : 0) +
        (h.dueAt <= now ? 4 : 0) +
        1 -
        h.streak * 0.6,
    ) / (h.dueAt > now ? 2 : 1)
  );
}
export function shuffle<T>(items: T[], rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function selectQuestions(
  pool: Question[],
  count: number,
  save: Save,
  balanced = false,
  rng = Math.random,
): Question[] {
  const uniquePool = [...new Map(pool.map((q) => [q.id, q])).values()];
  const weighted = uniquePool
    .map((q) => ({ q, key: Math.pow(Math.max(rng(), 0.000001), 1 / priority(q, save)) }))
    .sort((a, b) => b.key - a.key)
    .map((x) => x.q);
  const selected: Question[] = [];
  if (balanced && count >= 12)
    for (let chapter = 1; chapter <= 12; chapter++) {
      const q = weighted.find((q) => q.chapter === chapter);
      if (q) selected.push(q);
    }
  if (balanced)
    for (const category of [
      'Books',
      'Publications',
      'Ideas',
      'Business',
      'People',
      'Places',
      'Events',
    ]) {
      if (selected.length >= count) break;
      if (!selected.some((q) => q.category === category)) {
        const q = weighted.find((q) => q.category === category && !selected.includes(q));
        if (q) selected.push(q);
      }
    }
  if (balanced)
    for (const type of ['order', 'match']) {
      if (!selected.some((q) => q.type === type)) {
        const q = weighted.find((q) => q.type === type && !selected.includes(q));
        if (q) {
          if (selected.length >= count) selected.pop();
          selected.push(q);
        }
      }
    }
  selected.push(
    ...weighted.filter((q) => !selected.includes(q)).slice(0, Math.max(0, count - selected.length)),
  );
  return shuffle(selected.slice(0, count), rng);
}
export const recognition = multipleChoice;
export function topicResults(answers: AnswerRecord[]) {
  return [...new Set(answers.map((a) => questionById[a.questionId]?.category).filter(Boolean))]
    .map((topic) => {
      const xs = answers.filter((a) => questionById[a.questionId]?.category === topic);
      return {
        topic,
        correct: xs.filter((a) => a.correct).length,
        total: xs.length,
        rate: xs.filter((a) => a.correct).length / xs.length,
      };
    })
    .sort((a, b) => a.rate - b.rate);
}
let audio: AudioContext | undefined;
export function sound(enabled: boolean, positive = true) {
  if (!enabled) return;
  try {
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator(),
      gain = audio.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(positive ? 520 : 190, audio.currentTime);
    osc.frequency.exponentialRampToValueAtTime(positive ? 780 : 120, audio.currentTime + 0.13);
    gain.gain.setValueAtTime(0.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start();
    osc.stop(audio.currentTime + 0.2);
  } catch {
    /* Audio is optional; gameplay continues. */
  }
}
