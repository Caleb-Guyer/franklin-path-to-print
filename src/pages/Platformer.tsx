import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Heart,
  Menu,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { chapters, events } from '../data/chapters';
import { factById, facts } from '../data/facts';
import { questions } from '../data/questions';
import { useGame } from '../components/GameContext';
import { Dialog, roman } from '../components/Common';
import QuestionCard from '../components/QuestionCard';
import Conversation from '../components/Conversation';
import SceneConversation from '../components/SceneConversation';
import { award, selectQuestions, type AnswerRecord } from '../lib/game';
import { PlatformGame, type GameStats } from '../game/platformer';
import type { Controls } from '../game/world';
import type { Question } from '../data/types';

type Phase = 'title' | 'playing' | 'paused' | 'levels' | 'talk' | 'quiz' | 'complete';
const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
export default function Platformer() {
  const { save, setSave, storageError } = useGame();
  const [level, setLevel] = useState(save.platformer.level);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>('title');
  const [stats, setStats] = useState<GameStats>({
    pages: 0,
    total: 0,
    hearts: 3,
    deaths: 0,
    seconds: 0,
    near: false,
  });
  const [talk, setTalk] = useState<string | null>(null);
  const [pageQueue, setPageQueue] = useState<string[]>([]);
  const [help, setHelp] = useState(false);
  const [exam, setExam] = useState<Question[]>([]),
    [examIndex, setExamIndex] = useState(0),
    [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [cleared, setCleared] = useState<GameStats | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<PlatformGame | null>(null),
    saveRef = useRef(save),
    autoStart = useRef(false);
  saveRef.current = save;
  useEffect(() => {
    if (!canvas.current) return;
    const game = new PlatformGame(
      canvas.current,
      level,
      saveRef.current.platformer.collected,
      saveRef.current.platformer.checkpoints[level] ?? 0,
      {
        page: (id) => {
          setPageQueue((queue) => [...queue, id]);
          setSave((s) => ({
            ...s,
            xp: s.xp + (s.platformer.collected.includes(id) ? 0 : 8),
            unlockedCards: [...new Set([...s.unlockedCards, id])],
            platformer: {
              ...s.platformer,
              collected: [...new Set([...s.platformer.collected, id])],
            },
          }));
        },
        checkpoint: (zone) =>
          setSave((s) => ({
            ...s,
            platformer: {
              ...s.platformer,
              level,
              checkpoints: { ...s.platformer.checkpoints, [level]: zone },
            },
          })),
        talk: (id) => {
          setTalk(id);
          setPhase('talk');
        },
        finish: (result) => {
          setCleared(result);
          setAnswers([]);
          setExamIndex(0);
          const chapterPool = questions.filter(
            (q) => q.chapter === level + 1 && !['order', 'match'].includes(q.type),
          );
          const found = chapterPool.filter((q) =>
            q.factIds.some((id) => saveRef.current.platformer.collected.includes(id)),
          );
          const picked = selectQuestions(
            found.length >= 2 ? found : chapterPool,
            2,
            saveRef.current,
          );
          setExam(picked);
          setPhase('quiz');
        },
        pause: () => setPhase('paused'),
        stats: setStats,
      },
    );
    game.reducedMotion =
      saveRef.current.settings.reducedMotion ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    engine.current = game;
    if (autoStart.current) {
      game.start(saveRef.current.settings.music, saveRef.current.settings.music);
      setPhase('playing');
      autoStart.current = false;
    }
    return () => {
      game.dispose();
      engine.current = null;
    };
  }, [level, attempt, setSave]);
  useEffect(() => {
    if (!help) return;
    const id = setTimeout(() => setHelp(false), 6500);
    return () => clearTimeout(id);
  }, [help]);
  function start() {
    if (engine.current?.finished) {
      if (exam.length) resume();
      else playLevel(save.platformer.level, true);
      return;
    }
    engine.current?.start(save.settings.music, save.settings.music);
    setPhase('playing');
    setHelp(true);
    canvas.current?.focus();
  }
  function resume() {
    if (engine.current?.finished) {
      setPhase(exam.length ? 'quiz' : 'complete');
      return;
    }
    setPhase('playing');
    engine.current?.resume();
    canvas.current?.focus();
  }
  function pause() {
    engine.current?.pause();
    setPhase('paused');
  }
  function playLevel(next: number, restart = false) {
    setExam([]);
    setAnswers([]);
    setPageQueue([]);
    setTalk(null);
    setCleared(null);
    setSave((s) => ({
      ...s,
      platformer: {
        ...s.platformer,
        level: next,
        checkpoints: { ...s.platformer.checkpoints, ...(restart ? { [next]: 0 } : {}) },
      },
    }));
    autoStart.current = true;
    setLevel(next);
    setAttempt((n) => n + 1);
  }
  function finishChapter() {
    const result = cleared!;
    const first = !save.platformer.completed.includes(level);
    const perfect = answers.length === 2 && answers.every((a) => a.correct);
    setSave((s) =>
      award({
        ...s,
        xp: s.xp + (first ? 150 : 0) + (perfect ? 30 : 0),
        completedChapters: [...new Set([...s.completedChapters, level + 1])],
        currentChapter: Math.max(s.currentChapter, Math.min(12, level + 2)),
        platformer: {
          ...s.platformer,
          level: Math.min(11, level + 1),
          unlocked: Math.max(s.platformer.unlocked, Math.min(11, level + 1)),
          completed: [...new Set([...s.platformer.completed, level])],
          checkpoints: { ...s.platformer.checkpoints, [level]: 0 },
          bestTimes: engine.current?.startedFromBeginning
            ? {
                ...s.platformer.bestTimes,
                [level]: Math.min(s.platformer.bestTimes[level] ?? Infinity, result.seconds),
              }
            : s.platformer.bestTimes,
        },
      }),
    );
    setExam([]);
    setPhase('complete');
  }
  function toggleAudio() {
    const music = !save.settings.music;
    setSave((s) => ({ ...s, settings: { ...s.settings, music } }));
    engine.current?.setMusic(music);
  }
  function pointer(e: PointerEvent<HTMLButtonElement>, key: keyof Controls, down: boolean) {
    e.preventDefault();
    if (down) {
      e.currentTarget.setPointerCapture(e.pointerId);
      engine.current?.press(key);
    } else engine.current?.release(key);
  }
  const scene = events.find((e) => e.id === talk);
  const playing = phase === 'playing';
  return (
    <main className={'platform-shell ' + (playing ? 'is-playing' : '')}>
      <canvas
        ref={canvas}
        className="platform-canvas"
        tabIndex={0}
        aria-label="Franklin platformer. Move with A and D or arrow keys. Space to double jump. Shift to dash. E to talk or enter the print shop. Escape to pause."
      />
      <div className="platform-top">
        {phase !== 'title' && (
          <div className="platform-hud">
            <span className="platform-hearts" aria-label={`${stats.hearts} hearts`}>
              {Array.from({ length: 3 }, (_, i) => (
                <Heart
                  key={i}
                  size={18}
                  fill={i < stats.hearts ? 'currentColor' : 'none'}
                  className={i < stats.hearts ? '' : 'lost'}
                />
              ))}
            </span>
            <span className="page-counter">
              <BookOpen size={16} />
              {stats.pages}
              <small>/{stats.total}</small>
            </span>
            <span className="hud-chapter">{roman(level + 1)}</span>
          </div>
        )}
        <div className="platform-menu-buttons">
          <button
            aria-label={save.settings.music ? 'Mute music and effects' : 'Enable music and effects'}
            onClick={toggleAudio}
          >
            {save.settings.music ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </button>
          {phase !== 'title' && (
            <button aria-label="Pause game" onClick={pause}>
              <Menu size={24} />
            </button>
          )}
        </div>
      </div>
      {storageError && (
        <div className="platform-storage" role="alert">
          {storageError}
        </div>
      )}
      {phase === 'title' && (
        <section className="platform-title">
          <span className="platform-overline">PART ONE</span>
          <h1>
            FRANKLIN<span>THE PATH TO PRINT</span>
          </h1>
          <div className="platform-title-actions">
            <button className="platform-play" onClick={start}>
              <Play size={20} fill="currentColor" />
              {save.platformer.collected.length ? 'Continue' : 'Play'}
            </button>
            <button className="platform-secondary" onClick={() => setPhase('levels')}>
              Chapters
            </button>
          </div>
          <div className="platform-title-links">
            <a href="#journal">Journal</a>
            <a href="#quiz">Quiz</a>
            <a href="#settings">Settings</a>
          </div>
        </section>
      )}
      {playing && help && (
        <div className="platform-help">
          <span>
            <kbd>A</kbd>
            <kbd>D</kbd> Move
          </span>
          <span>
            <kbd>Space</kbd> Double jump
          </span>
          <span>
            <kbd>Shift</kbd> Dash
          </span>
          <span>
            <kbd>E</kbd> Talk
          </span>
        </div>
      )}
      {playing && pageQueue.length > 0 && (
        <div className="pickup-companion">
          <Conversation
            key={pageQueue[0]}
            compact
            lines={[
              {
                speaker: "Franklin's journal",
                text: factById[pageQueue[0]].details,
                emphasis: factById[pageQueue[0]].answer,
              },
            ]}
            onFinish={() => setPageQueue((queue) => queue.slice(1))}
            finishLabel="Next memory"
          />
        </div>
      )}
      {playing && (
        <div className="touch-pad">
          <div className="touch-move">
            {(['left', 'right'] as const).map((key) => (
              <button
                key={key}
                aria-label={`Move ${key}`}
                onPointerDown={(e) => pointer(e, key, true)}
                onPointerUp={(e) => pointer(e, key, false)}
                onPointerCancel={(e) => pointer(e, key, false)}
              >
                {key === 'left' ? <ArrowLeft /> : <ArrowRight />}
              </button>
            ))}
          </div>
          <div className="touch-actions">
            {stats.near && (
              <button
                className="touch-talk"
                aria-label="Talk or enter"
                onPointerDown={(e) => pointer(e, 'interact', true)}
                onPointerUp={(e) => pointer(e, 'interact', false)}
                onPointerCancel={(e) => pointer(e, 'interact', false)}
              >
                E
              </button>
            )}
            <button
              aria-label="Dash"
              onPointerDown={(e) => pointer(e, 'dash', true)}
              onPointerUp={(e) => pointer(e, 'dash', false)}
              onPointerCancel={(e) => pointer(e, 'dash', false)}
            >
              <Zap />
            </button>
            <button
              className="touch-jump"
              aria-label="Jump"
              onPointerDown={(e) => pointer(e, 'jump', true)}
              onPointerUp={(e) => pointer(e, 'jump', false)}
              onPointerCancel={(e) => pointer(e, 'jump', false)}
            >
              <ArrowUp />
            </button>
          </div>
        </div>
      )}
      {phase === 'paused' && (
        <Dialog title="Paused" onClose={resume}>
          <div className="platform-pause-menu">
            <button className="platform-play" onClick={resume}>
              <Play size={18} />
              Resume
            </button>
            <button className="button" onClick={() => playLevel(level, true)}>
              <RotateCcw size={17} />
              Restart chapter
            </button>
            <button className="button" onClick={() => setPhase('levels')}>
              Chapters
              <ChevronRight size={17} />
            </button>
            <div className="platform-pause-links">
              <a href="#journal">Journal</a>
              <a href="#quiz">Quiz</a>
              <a href="#settings">Settings</a>
              <button onClick={() => setPhase('title')}>Title screen</button>
            </div>
            <p className="small muted">
              Move: A / D or arrows · Jump: Space · Dash: Shift · Talk: E
            </p>
          </div>
        </Dialog>
      )}
      {phase === 'levels' && (
        <Dialog
          wide
          title="Chapters"
          onClose={() => (engine.current?.started ? resume() : setPhase('title'))}
        >
          <div className="platform-levels">
            {chapters.map((chapter, i) => {
              const count = facts.filter((f) => f.chapter === i + 1).length,
                found = save.platformer.collected.filter(
                  (id) => factById[id].chapter === i + 1,
                ).length;
              return (
                <button
                  key={chapter.id}
                  disabled={i > save.platformer.unlocked}
                  onClick={() => playLevel(i)}
                >
                  <span>{roman(i + 1)}</span>
                  <div>
                    <strong>{chapter.title}</strong>
                    <small>
                      {i > save.platformer.unlocked ? 'Locked' : `${found}/${count} pages`}
                      {save.platformer.bestTimes[i] !== undefined
                        ? ' · ' + formatTime(save.platformer.bestTimes[i])
                        : ''}
                    </small>
                  </div>
                  {save.platformer.completed.includes(i) && <Check size={17} />}
                </button>
              );
            })}
          </div>
        </Dialog>
      )}
      {phase === 'talk' && scene && (
        <Dialog className="platform-dialogue" title={scene.title} onClose={resume}>
          <SceneConversation key={scene.id} scene={scene} onClose={resume} />
        </Dialog>
      )}
      {phase === 'quiz' && exam[examIndex] && (
        <Dialog
          title={`At the press · ${examIndex + 1} / ${exam.length}`}
          onClose={() => {
            setPhase('paused');
          }}
        >
          <div className="platform-quiz">
            <QuestionCard
              key={exam[examIndex].id}
              question={exam[examIndex]}
              initialAnswer={answers.find((a) => a.questionId === exam[examIndex].id)}
              onResolved={(a) =>
                setAnswers((xs) => [...xs.filter((x) => x.questionId !== a.questionId), a])
              }
              onContinue={() =>
                examIndex < exam.length - 1 ? setExamIndex(examIndex + 1) : finishChapter()
              }
              continueLabel={
                examIndex < exam.length - 1 ? 'Set the next line' : 'Print the chapter'
              }
            />
          </div>
        </Dialog>
      )}
      {phase === 'complete' && cleared && (
        <section className="platform-complete">
          <span className="clear-medal">
            <Trophy size={34} />
          </span>
          <span className="platform-overline">CHAPTER {roman(level + 1)} COMPLETE</span>
          <h1>{level === 11 ? 'A life in print.' : 'Fresh off the press.'}</h1>
          <div className="level-results">
            <div>
              <BookOpen size={20} />
              <strong>
                {cleared.pages}/{cleared.total}
              </strong>
              <span>Pages</span>
            </div>
            <div>
              <strong>{formatTime(cleared.seconds)}</strong>
              <span>Time</span>
            </div>
            <div>
              <strong>{answers.filter((a) => a.correct).length}/2</strong>
              <span>Recall</span>
            </div>
          </div>
          <div className="platform-title-actions">
            {level < 11 ? (
              <button className="platform-play" onClick={() => playLevel(level + 1, true)}>
                Next chapter
                <ArrowRight size={20} />
              </button>
            ) : (
              <a className="platform-play" href="#exam">
                Final exam
                <ArrowRight size={20} />
              </a>
            )}
            <button className="platform-secondary" onClick={() => playLevel(level, true)}>
              <RotateCcw size={17} />
              Replay
            </button>
          </div>
          {cleared.pages < cleared.total && (
            <p>{cleared.total - cleared.pages} pages remain to discover.</p>
          )}
        </section>
      )}
    </main>
  );
}
