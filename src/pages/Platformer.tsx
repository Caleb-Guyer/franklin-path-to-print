import { useEffect, useRef, useState, type PointerEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
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
  Swords,
} from 'lucide-react';
import { chapters } from '../data/chapters';
import { facts } from '../data/facts';
import { useGame } from '../components/GameContext';
import { Dialog, roman } from '../components/Common';
import Conversation from '../components/Conversation';
import { award } from '../lib/game';
import { PlatformGame, type GameStats } from '../game/platformer';
import { weapons, levelLessons } from '../game/loadouts';
import { WeaponIcon } from '../components/WeaponIcon';
import type { Controls } from '../game/world';

type Phase = 'title' | 'playing' | 'paused' | 'levels' | 'talk' | 'complete';
const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
export default function Platformer() {
  const { save, setSave, storageError } = useGame();
  const [level, setLevel] = useState(save.platformer.level),
    [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>('title'),
    [help, setHelp] = useState(false);
  const [cleared, setCleared] = useState<GameStats | null>(null);
  const [stats, setStats] = useState<GameStats>({
    kills: 0,
    score: 0,
    combo: 0,
    bestCombo: 0,
    hearts: 5,
    deaths: 0,
    seconds: 0,
    near: false,
    weaponReady: 1,
    fury: false,
    guardianHp: 0,
    guardianMax: 12,
  });
  const canvas = useRef<HTMLCanvasElement>(null),
    engine = useRef<PlatformGame | null>(null),
    saveRef = useRef(save),
    autoStart = useRef(false);
  saveRef.current = save;
  const weapon = weapons[level],
    lesson = levelLessons[level];
  useEffect(() => {
    if (!canvas.current) return;
    const game = new PlatformGame(
      canvas.current,
      level,
      saveRef.current.platformer.checkpoints[level] ?? 0,
      {
        checkpoint: (zone) =>
          setSave((s) => ({
            ...s,
            platformer: {
              ...s.platformer,
              level,
              checkpoints: { ...s.platformer.checkpoints, [level]: zone },
            },
          })),
        talk: () => setPhase('talk'),
        finish: (result) => {
          setCleared(result);
          setSave((s) =>
            award({
              ...s,
              xp:
                s.xp +
                (!s.platformer.completed.includes(level) ? 150 : 0) +
                Math.min(100, Math.floor(result.score / 50)),
              completedChapters: [...new Set([...s.completedChapters, level + 1])],
              currentChapter: Math.max(s.currentChapter, Math.min(12, level + 2)),
              unlockedCards: [
                ...new Set([
                  ...s.unlockedCards,
                  ...facts.filter((f) => f.chapter === level + 1).map((f) => f.id),
                ]),
              ],
              platformer: {
                ...s.platformer,
                level: Math.min(11, level + 1),
                unlocked: Math.max(s.platformer.unlocked, Math.min(11, level + 1)),
                completed: [...new Set([...s.platformer.completed, level])],
                checkpoints: { ...s.platformer.checkpoints, [level]: 0 },
                bestTimes: game.startedFromBeginning
                  ? {
                      ...s.platformer.bestTimes,
                      [level]: Math.min(s.platformer.bestTimes[level] ?? Infinity, result.seconds),
                    }
                  : s.platformer.bestTimes,
              },
            }),
          );
          setPhase('complete');
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
      setHelp(true);
      autoStart.current = false;
    }
    return () => {
      game.dispose();
      engine.current = null;
    };
  }, [level, attempt, setSave]);
  useEffect(() => {
    if (!help) return;
    const timer = setTimeout(() => setHelp(false), 6500);
    return () => clearTimeout(timer);
  }, [help]);
  function start() {
    if (engine.current?.finished) {
      playLevel(save.platformer.level, true);
      return;
    }
    engine.current?.start(save.settings.music, save.settings.music);
    setPhase('playing');
    setHelp(true);
    setSave((s) => ({
      ...s,
      platformer: {
        ...s.platformer,
        checkpoints: { ...s.platformer.checkpoints, [level]: s.platformer.checkpoints[level] ?? 0 },
      },
    }));
    canvas.current?.focus();
  }
  function resume() {
    if (engine.current?.finished) {
      setPhase('complete');
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
  function finishTalk() {
    setSave((s) => ({
      ...s,
      unlockedCards: [...new Set([...s.unlockedCards, ...lesson.factIds])],
    }));
    resume();
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
  const playing = phase === 'playing';
  const hasProgress =
    save.platformer.collected.length > 0 ||
    Object.keys(save.platformer.checkpoints).length > 0 ||
    save.platformer.completed.length > 0;
  const rank = cleared
    ? cleared.deaths === 0 && cleared.hearts >= 4
      ? 'S'
      : cleared.deaths === 0
        ? 'A'
        : 'B'
    : '';
  return (
    <main className={'platform-shell ' + (playing ? 'is-playing' : '')}>
      <canvas
        ref={canvas}
        className="platform-canvas"
        tabIndex={0}
        aria-label="Play as Franklin. A and D to move. Space to double jump. J or click to attack. Shift to dash. E to talk. Escape to pause."
      />
      <div className="platform-top">
        {phase !== 'title' && (
          <div className="platform-hud">
            <span className="platform-hearts" aria-label={`${stats.hearts} hearts`}>
              {Array.from({ length: 5 }, (_, i) => (
                <Heart
                  key={i}
                  size={16}
                  fill={i < stats.hearts ? 'currentColor' : 'none'}
                  className={i < stats.hearts ? '' : 'lost'}
                />
              ))}
            </span>
            <span className={'weapon-badge ' + (stats.fury ? 'powered' : '')} title={weapon.action}>
              <WeaponIcon kind={weapon.kind} color={weapon.color} />
              <span>
                {weapon.name}
                <i
                  style={{
                    transform: `scaleX(${Math.max(0, Math.min(1, stats.weaponReady))})`,
                    background: weapon.color,
                  }}
                />
              </span>
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
          <a className="course-back" href="#course">
            ← ELA III collection
          </a>
          <span className="platform-overline">PART ONE</span>
          <h1>
            FRANKLIN<span>THE PATH TO PRINT</span>
          </h1>
          <div className="platform-title-actions">
            <button className="platform-play" onClick={start}>
              <Play size={20} fill="currentColor" />
              {hasProgress ? 'Continue' : 'Play'}
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
      {playing && stats.guardianHp > 0 && (
        <div
          className="guardian-hud"
          aria-label={`Ink guardian: ${stats.guardianHp} of ${stats.guardianMax} health`}
        >
          <span>INK GUARDIAN</span>
          <div>
            <i style={{ transform: `scaleX(${stats.guardianHp / stats.guardianMax})` }} />
          </div>
        </div>
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
            <kbd>J</kbd> / click · Attack
          </span>
          <span>
            <kbd>Shift</kbd> Dash
          </span>
          <span>
            <kbd>E</kbd> Talk
          </span>
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
            {(['dash', 'attack', 'jump'] as const).map((key) => (
              <button
                key={key}
                className={'touch-' + key}
                aria-label={key === 'dash' ? 'Dash' : key === 'attack' ? 'Attack' : 'Jump'}
                onPointerDown={(e) => pointer(e, key, true)}
                onPointerUp={(e) => pointer(e, key, false)}
                onPointerCancel={(e) => pointer(e, key, false)}
              >
                {key === 'dash' ? <Zap /> : key === 'attack' ? <Swords /> : <ArrowUp />}
              </button>
            ))}
          </div>
        </div>
      )}
      {phase === 'paused' && (
        <Dialog title="Paused" onClose={resume}>
          <div className="platform-pause-menu">
            <div className="loadout-preview">
              <WeaponIcon kind={weapon.kind} color={weapon.color} />
              <div>
                <strong>{weapon.name}</strong>
                <p>{weapon.action}</p>
              </div>
            </div>
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
              Move: A / D · Jump: Space · Attack: J or click · Dash: Shift · Talk: E
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
            {chapters.map((chapter, i) => (
              <button
                key={chapter.id}
                disabled={i > save.platformer.unlocked}
                onClick={() => playLevel(i)}
              >
                <WeaponIcon kind={weapons[i].kind} color={weapons[i].color} />
                <div>
                  <strong>{chapter.title}</strong>
                  <small>
                    {i > save.platformer.unlocked ? 'Locked · ' : ''}
                    {weapons[i].name}
                    {save.platformer.bestTimes[i] !== undefined
                      ? ' · ' + formatTime(save.platformer.bestTimes[i])
                      : ''}
                  </small>
                </div>
                {save.platformer.completed.includes(i) && <Check size={17} />}
              </button>
            ))}
          </div>
        </Dialog>
      )}
      {phase === 'talk' && (
        <Dialog className="platform-dialogue" title={lesson.title} onClose={resume}>
          <small className="dialogue-paraphrase">The main idea · Source paraphrase</small>
          <Conversation
            key={level}
            lines={lesson.lines.map((text) => ({
              speaker: 'Story guide',
              text,
              sourcePages: lesson.sourcePages,
            }))}
            onFinish={finishTalk}
            finishLabel="Let’s go"
          />
        </Dialog>
      )}
      {phase === 'complete' && cleared && (
        <section className="platform-complete">
          <span className="clear-rank">{rank}</span>
          <span className="platform-overline">CHAPTER {roman(level + 1)} CLEAR</span>
          <h1>{level === 11 ? 'A life in print.' : 'On to the next adventure.'}</h1>
          <div className="level-results">
            <div>
              <strong>{cleared.score.toLocaleString()}</strong>
              <span>Score</span>
            </div>
            <div>
              <strong>{formatTime(cleared.seconds)}</strong>
              <span>Time</span>
            </div>
            <div>
              <strong>×{cleared.bestCombo}</strong>
              <span>Best combo</span>
            </div>
          </div>
          {level < 11 && (
            <div className="next-weapon">
              <WeaponIcon kind={weapons[level + 1].kind} color={weapons[level + 1].color} />
              <span>
                Next up<strong>{weapons[level + 1].name}</strong>
              </span>
            </div>
          )}
          <div className="platform-title-actions">
            {level < 11 ? (
              <button className="platform-play" onClick={() => playLevel(level + 1, true)}>
                Next chapter
                <ArrowRight size={20} />
              </button>
            ) : (
              <a className="platform-play" href="#quiz">
                Quiz
                <ArrowRight size={20} />
              </a>
            )}
            <button className="platform-secondary" onClick={() => playLevel(level, true)}>
              <RotateCcw size={17} />
              Replay
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
