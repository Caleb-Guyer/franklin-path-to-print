import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  Flame,
  RotateCcw,
  Skull,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Shield,
  Heart,
} from 'lucide-react';
import { questions, questionById } from '../data/questions';
import { chapters } from '../data/chapters';
import type { Question } from '../data/types';
import {
  award,
  selectQuestions,
  recognition,
  topicResults,
  type AnswerRecord,
  type ExamRecord,
} from '../lib/game';
import { useGame } from '../components/GameContext';
import { PageTitle, Progress, Source } from '../components/Common';
import QuestionCard from '../components/QuestionCard';
export interface SessionConfig {
  title: string;
  pool: Question[];
  count: number;
  difficulty: string;
  bossChapter?: number;
  balanced?: boolean;
}
export default function Quiz({
  initial,
  onBack,
}: {
  initial?: SessionConfig;
  onBack?: () => void;
}) {
  const { save, setSave } = useGame();
  const [difficulty, setDifficulty] = useState('NORMAL');
  const [length, setLength] = useState('20');
  const [category, setCategory] = useState('All topics');
  const [session, setSession] = useState<SessionConfig | null>(initial ?? null);
  const [round, setRound] = useState<Question[]>(() =>
    initial
      ? selectQuestions(initial.pool, initial.count, save, initial.balanced).map((q) =>
          initial.difficulty === 'EASY' ? recognition(q) : q,
        )
      : [],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [report, setReport] = useState<ExamRecord | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const eligible = questions.filter(
    (q) =>
      (category === 'All topics' || q.category === category) &&
      (difficulty === 'EASY'
        ? q.difficulty <= 2
        : difficulty === 'NORMAL'
          ? q.difficulty <= 3
          : difficulty === 'HARD'
            ? q.difficulty >= 3
            : difficulty === 'NIGHTMARE'
              ? q.difficulty === 4
              : true),
  );
  const count = length === 'all' ? eligible.length : Math.min(Number(length), eligible.length);
  function begin(config: SessionConfig) {
    setSession(config);
    setRound(
      selectQuestions(config.pool, config.count, save, config.balanced).map((q) =>
        config.difficulty === 'EASY' ? recognition(q) : q,
      ),
    );
    setIndex(0);
    setAnswers([]);
    setReport(null);
    setCombo(0);
    setBestCombo(0);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function finish() {
    if (!session) return;
    const score = answers.filter((a) => a.correct).length;
    const record: ExamRecord = {
      id: crypto.randomUUID(),
      title: session.title,
      date: Date.now(),
      score,
      total: round.length,
      answers,
    };
    setReport(record);
    setSave((s) =>
      award({
        ...s,
        exams: [...s.exams, record].slice(-30),
        ...(session.bossChapter && score / round.length >= 0.6
          ? {
              completedChapters: [...new Set([...s.completedChapters, session.bossChapter])],
              currentChapter: Math.max(s.currentChapter, Math.min(12, session.bossChapter + 1)),
              xp: s.xp + (s.completedChapters.includes(session.bossChapter) ? 0 : 150),
            }
          : {}),
      }),
    );
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function record(a: AnswerRecord) {
    setAnswers((xs) => [...xs, a]);
    const c = a.correct ? combo + 1 : 0;
    setCombo(c);
    setBestCombo(Math.max(bestCombo, c));
  }
  function startExam() {
    begin({
      title: 'Final Exam',
      pool: questions,
      count: 20,
      difficulty: 'FINAL EXAM',
      balanced: true,
    });
  }
  const missed = save.mistakes.map((id) => questionById[id]).filter(Boolean);
  if (report && session) {
    const rate = report.score / report.total;
    const grade =
      rate >= 0.9
        ? 'A'
        : rate >= 0.8
          ? 'B'
          : rate >= 0.7
            ? 'C'
            : rate >= 0.6
              ? 'D'
              : 'Keep printing';
    const topics = topicResults(report.answers);
    const failed = report.answers.filter((a) => !a.correct);
    const won = !session.bossChapter || rate >= 0.6;
    return (
      <div className="page results-page">
        <PageTitle
          title={
            session.bossChapter
              ? won
                ? 'Trial overcome'
                : 'The trial awaits a rematch'
              : 'Results'
          }
          description={session.title}
        />
        <div className="score-layout">
          <div className="score-seal">
            <Trophy size={32} />
            <strong>
              {Math.round(rate * 100)}
              <small>%</small>
            </strong>
            <span>
              {report.score} / {report.total} correct
            </span>
            <em>{grade}</em>
          </div>
          <div className="results-summary">
            <h2>{failed.length ? 'Review missed answers' : 'All answers correct'}</h2>
            <p>
              {failed.length
                ? `${failed.length} questions added to your review.`
                : 'Try a harder round to continue.'}
            </p>
            <div className="stat-row">
              <div>
                <strong>{bestCombo}</strong>
                <span>Best combo</span>
              </div>
              <div>
                <strong>{save.xp}</strong>
                <span>Total XP</span>
              </div>
            </div>
            <div className="button-row">
              {failed.length > 0 && (
                <button
                  className="button primary"
                  onClick={() =>
                    begin({
                      title: 'Retry Missed',
                      pool: failed.map((a) => questionById[a.questionId]),
                      count: failed.length,
                      difficulty: 'NORMAL',
                    })
                  }
                >
                  <RotateCcw size={16} />
                  Retry missed
                </button>
              )}
              <button
                className="button"
                onClick={() =>
                  begin({
                    title: session.bossChapter ? session.title : 'Harder Test',
                    pool: session.bossChapter
                      ? session.pool
                      : questions.filter((q) => q.difficulty >= 3),
                    count: session.bossChapter ? session.count : 20,
                    difficulty: 'HARD',
                    bossChapter: session.bossChapter,
                    balanced: !session.bossChapter,
                  })
                }
              >
                {session.bossChapter ? 'Replay this trial' : 'Take harder test'}
              </button>
              <a className="button" href="#story" onClick={onBack}>
                Return to story
                <ArrowRight size={16} />
              </a>
            </div>
            {session.bossChapter && won && (
              <div className="victory-note">
                <Check size={17} />
                Chapter complete · +
                {save.completedChapters.includes(session.bossChapter)
                  ? 'chapter reward secured'
                  : '150 XP'}
              </div>
            )}
          </div>
        </div>
        <div className="result-topics">
          <section className="panel">
            <div className="eyebrow">STUDY THESE NEXT</div>
            <h3>
              {topics[0]?.rate === 1
                ? 'Keep the whole story fresh'
                : topics
                    .filter((t) => t.rate < 1)
                    .slice(0, 2)
                    .map((t) => t.topic)
                    .join(' & ')}
            </h3>
            <p>
              {topics[0]?.rate === 1
                ? 'Try Nightmare details or explain the events aloud without looking.'
                : 'Start with the missed answers below. Revisit their source pages, close the page, then recall again.'}
            </p>
          </section>
          <section className="panel">
            <div className="eyebrow">TOPIC ACCURACY</div>
            {topics.map((t) => (
              <div className="topic-row" key={t.topic}>
                <span>{t.topic}</span>
                <Progress value={t.rate * 100} />
                <strong>
                  {t.correct}/{t.total}
                </strong>
              </div>
            ))}
            <p className="small muted">
              Strongest:{' '}
              {topics
                .filter((t) => t.rate === Math.max(...topics.map((x) => x.rate)))
                .map((t) => t.topic)
                .join(', ')}
              . Weakest:{' '}
              {topics
                .filter((t) => t.rate === Math.min(...topics.map((x) => x.rate)))
                .map((t) => t.topic)
                .join(', ')}
              .
            </p>
          </section>
        </div>
        <section className="missed-review">
          <h2>{failed.length ? 'Missed questions' : 'Answer review'}</h2>
          {(failed.length ? failed : report.answers).map((a, i) => {
            const original = questionById[a.questionId];
            const q = a.prompt
              ? { ...original, prompt: a.prompt, answer: a.answer ?? original.answer }
              : original;
            return (
              <details key={i} open={failed.length > 0}>
                <summary>{q.prompt}</summary>
                <p className="small muted">
                  Your answer: {displayResponse(a.response)}
                  {a.selfAssessed ? ' · Self-assessed' : ''}
                </p>
                <h3>{q.answer}</h3>
                <p>{q.explanation}</p>
                <Source pages={q.sourcePages} />
              </details>
            );
          })}
        </section>
        <button
          className="button"
          onClick={() => {
            setSession(null);
            setReport(null);
            onBack?.();
          }}
        >
          Choose another round
        </button>
      </div>
    );
  }
  if (session && round.length) {
    const correct = answers.filter((a) => a.correct).length;
    const wrong = answers.length - correct;
    const boss = !!session.bossChapter;
    return (
      <div className="page battle-page">
        <div className="battle-heading">
          <span className="eyebrow">
            {boss ? 'CHAPTER TRIAL' : 'THE RECALL ARENA'} · {session.difficulty}
          </span>
          <button
            className="text-link"
            onClick={() => {
              setSession(null);
              setReport(null);
              onBack?.();
            }}
          >
            Leave round · answers already saved
          </button>
        </div>
        <div className="battle-title">
          <div className="boss-sigil">{boss ? <Skull size={35} /> : <FeatherIcon />}</div>
          <div>
            <h1>{session.title}</h1>
          </div>
          <span className="question-count">
            {index + 1}
            <small>/ {round.length}</small>
          </span>
        </div>
        <div className="battle-hud">
          <div>
            <label>
              <Heart size={14} />
              {boss ? 'Your resolve' : 'Accuracy so far'}
              <strong>
                {boss
                  ? Math.max(0, 100 - wrong * 20) + '%'
                  : answers.length
                    ? Math.round((correct / answers.length) * 100) + '%'
                    : '—'}
              </strong>
            </label>
            <Progress
              label="Player knowledge"
              value={
                boss
                  ? Math.max(0, 100 - wrong * 20)
                  : answers.length
                    ? (correct / answers.length) * 100
                    : 100
              }
            />
          </div>
          <div>
            <label>
              <Shield size={14} />
              {boss ? 'Trial resistance' : 'Round remaining'}
              <strong>
                {boss
                  ? Math.max(0, Math.round(100 - (correct / (round.length * 0.6)) * 100))
                  : Math.round(((round.length - index) / round.length) * 100)}
                %
              </strong>
            </label>
            <Progress
              label="Trial resistance"
              value={
                boss
                  ? 100 - (correct / (round.length * 0.6)) * 100
                  : ((round.length - index) / round.length) * 100
              }
            />
          </div>
          <div className="combo">
            <Flame size={20} />
            <strong>
              {combo}
              <small>COMBO · ×{(1 + Math.min(combo, 8) * 0.1).toFixed(1)}</small>
            </strong>
          </div>
        </div>
        {boss && wrong >= 5 && (
          <p className="battle-note">
            Resolve depleted. Finish the questions to learn from every miss, then rematch the trial.
          </p>
        )}
        <QuestionCard
          key={`${session.title}-${index}-${round[index].id}`}
          question={round[index]}
          onResolved={record}
          timed={save.settings.timed}
          onContinue={() => {
            if (index === round.length - 1) finish();
            else setIndex(index + 1);
          }}
          continueLabel={index === round.length - 1 ? 'See the results' : 'Next question'}
        />
        <div className="round-bottom">
          <span>
            {correct} correct · {wrong} missed
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="page quiz-page">
      <PageTitle
        title="Quiz"
        action={
          <button className="button" onClick={startExam}>
            Final exam · 20 questions
            <ArrowRight size={17} />
          </button>
        }
      />
      <div className="quiz-layout">
        <section className="panel round-builder">
          <h2>Choose a round</h2>
          <div className="difficulty-options">
            {(['EASY', 'NORMAL', 'HARD', 'NIGHTMARE'] as const).map((d, i) => (
              <button
                className={difficulty === d ? 'selected' : ''}
                key={d}
                onClick={() => setDifficulty(d)}
              >
                <span>
                  {
                    [
                      <Sparkles size={19} />,
                      <Target size={19} />,
                      <Swords size={19} />,
                      <Skull size={19} />,
                    ][i]
                  }
                </span>
                <strong>{d}</strong>
                <small>
                  {
                    [
                      'Recognition & basics',
                      'Specific details & recall',
                      'Names, order & relationships',
                      'The smallest details',
                    ][i]
                  }
                </small>
              </button>
            ))}
          </div>
          <div className="form-row">
            <label>
              Round length
              <select value={length} onChange={(e) => setLength(e.target.value)}>
                <option value="10">10 · Quick review</option>
                <option value="20">20 · Examination</option>
                <option value="40">40 · Deep review</option>
                <option value="all">Everything in this selection</option>
              </select>
            </label>
            <label>
              Focus
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {['All topics', ...new Set(questions.map((q) => q.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="builder-foot">
            <span>{count} questions</span>
            <button
              className="button primary"
              disabled={count === 0}
              onClick={() =>
                begin({
                  title:
                    length === 'all'
                      ? 'Full review'
                      : `${difficulty[0] + difficulty.slice(1).toLowerCase()} Trial`,
                  pool: eligible,
                  count,
                  difficulty,
                  balanced: category === 'All topics' && count >= 20,
                })
              }
            >
              Begin trial
              <ArrowRight size={17} />
            </button>
          </div>
          <label className="toggle-line">
            <input
              type="checkbox"
              checked={save.settings.timed}
              onChange={(e) =>
                setSave({ ...save, settings: { ...save.settings, timed: e.target.checked } })
              }
            />
            <span>
              Timed rounds <small>45 seconds per question. Pause anytime.</small>
            </span>
          </label>
          <button
            className="button everything-button"
            onClick={() =>
              begin({
                title: 'Everything',
                pool: questions,
                count: questions.length,
                difficulty: 'EVERYTHING',
                balanced: true,
              })
            }
          >
            <BookOpen size={17} />
            Everything · {questions.length} questions
            <ArrowRight size={17} />
          </button>
        </section>
        <aside className="trouble-panel">
          <div className="eyebrow">
            <Flame size={14} />
            FRANKLIN’S TROUBLE LIST
          </div>
          <strong className="big-number">{missed.length}</strong>
          <h3>{missed.length ? 'Questions to review' : 'No missed questions'}</h3>

          <button
            className="button"
            onClick={() =>
              begin({
                title: missed.length ? 'Trouble List Rematch' : 'Quick review',
                pool: missed.length ? missed : questions,
                count: missed.length ? Math.min(20, missed.length) : 10,
                difficulty: 'NORMAL',
              })
            }
          >
            <RotateCcw size={16} />
            {missed.length ? 'Review missed' : 'Quick review'}
          </button>
          <a className="text-link" href="#study">
            <BookOpen size={14} />
            Open Study Mode
            <ArrowRight size={14} />
          </a>
          {save.exams.length > 0 && (
            <div className="recent-exams">
              <div className="eyebrow">RECENT RESULTS</div>
              {save.exams
                .slice(-3)
                .reverse()
                .map((e) => (
                  <div key={e.id}>
                    <span>
                      {e.title}
                      <small>{new Date(e.date).toLocaleDateString()}</small>
                    </span>
                    <strong>{Math.round((e.score / e.total) * 100)}%</strong>
                  </div>
                ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
function FeatherIcon() {
  return <BookOpen size={35} />;
}
function displayResponse(s: string) {
  if (s.startsWith('{')) {
    try {
      return Object.entries(JSON.parse(s))
        .map(([k, v]) => `${k}: ${v}`)
        .join('; ');
    } catch {
      return s;
    }
  }
  return s.replaceAll('||', ' → ');
}
export function bossConfig(chapter: number): SessionConfig {
  return {
    title: chapters[chapter - 1].boss,
    pool: questions.filter((q) => q.chapter === chapter),
    count: 10,
    difficulty: 'HARD',
    bossChapter: chapter,
  };
}
