import { useEffect, useRef, useState, type CSSProperties } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Check,
  Compass,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from 'lucide-react';
import { Dialog } from '../components/Common';
import { StoryArt } from '../pages/CourseHub';
import { stopSpeech, speak } from '../lib/speech';
import {
  missions,
  passage,
  questions,
  source,
  sourceLink,
  type ChapterId,
  type DouglassQuestion,
  type SourceRef,
} from './data';
import { CampaignEngine, type CampaignStats, type Control, type EngineCallbacks } from './engine';
import { CampaignAudio } from './audio';
import { examQuestions, freshDouglassSave, readDouglassSave, SAVE_KEY } from './save';
import Dialogue from './Dialogue';

type Phase =
  | 'menu'
  | 'briefing'
  | 'playing'
  | 'dialogue'
  | 'pause'
  | 'debrief'
  | 'quiz'
  | 'results'
  | 'archive';
type Answer = { question: DouglassQuestion; selected: number };
const roman = ['I', 'II', 'III'];
const defaultStats: CampaignStats = {
  progress: 0,
  focus: 100,
  score: 0,
  found: 0,
  near: false,
  distance: 0,
  surge: 1,
  seconds: 0,
  resets: 0,
};

function MissionCanvas({
  chapter,
  run,
  checkpoint,
  relaxed,
  reduced,
  callbacks,
  engineRef,
}: {
  chapter: ChapterId;
  run: number;
  checkpoint: number;
  relaxed: boolean;
  reduced: boolean;
  callbacks: EngineCallbacks;
  engineRef: React.MutableRefObject<CampaignEngine | null>;
}) {
  const ref = useRef<HTMLCanvasElement>(null),
    handlers = useRef(callbacks);
  handlers.current = callbacks;
  useEffect(() => {
    if (!ref.current) return;
    const engine = new CampaignEngine(
      ref.current,
      chapter,
      relaxed,
      reduced,
      {
        memory: (i) => handlers.current.memory(i),
        complete: (s) => handlers.current.complete(s),
        stats: (s) => handlers.current.stats(s),
        pause: () => handlers.current.pause(),
        effect: (k) => handlers.current.effect(k),
      },
      checkpoint,
    );
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [chapter, run]);
  return (
    <canvas
      ref={ref}
      className="d-canvas"
      aria-label={`Chapter ${chapter} mission. ${missions[chapter - 1].controls}`}
      tabIndex={0}
    />
  );
}
function TouchButton({
  control,
  label,
  children,
  engine,
}: {
  control: Control;
  label: string;
  children: React.ReactNode;
  engine: React.MutableRefObject<CampaignEngine | null>;
}) {
  return (
    <button
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        engine.current?.press(control);
      }}
      onPointerUp={() => engine.current?.release(control)}
      onPointerCancel={() => engine.current?.release(control)}
      onLostPointerCapture={() => engine.current?.release(control)}
    >
      {children}
    </button>
  );
}
export default function DouglassCampaign() {
  const [save, setSave] = useState(readDouglassSave),
    [storageError, setStorageError] = useState(false),
    [phase, setPhase] = useState<Phase>('menu');
  const [chapter, setChapter] = useState<ChapterId>(save.checkpoint?.chapter ?? save.current),
    [run, setRun] = useState(0),
    [checkpoint, setCheckpoint] = useState(0);
  const [stats, setStats] = useState(defaultStats),
    [memoryIndex, setMemoryIndex] = useState(0),
    [lineIndex, setLineIndex] = useState(0);
  const [settings, setSettings] = useState(false),
    [reset, setReset] = useState(false),
    [refs, setRefs] = useState<SourceRef[] | null>(null);
  const [pool, setPool] = useState<DouglassQuestion[]>([]),
    [answers, setAnswers] = useState<Answer[]>([]),
    [selected, setSelected] = useState<number | null>(null);
  const engine = useRef<CampaignEngine | null>(null),
    audio = useRef<CampaignAudio | null>(null);
  const mission = missions[chapter - 1],
    active = ['playing', 'dialogue', 'pause', 'debrief'].includes(phase);
  const reduced =
    save.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const memory = mission.memories[memoryIndex];
  const q = pool[answers.length];
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }, [save]);
  useEffect(() => {
    engine.current?.setPaused(phase !== 'playing' || !!refs || settings);
    audio.current?.setPaused(phase !== 'playing');
  }, [phase, refs, settings]);
  useEffect(() => {
    audio.current?.setEnabled(save.music);
  }, [save.music]);
  useEffect(
    () => () => {
      stopSpeech();
      audio.current?.dispose();
    },
    [],
  );
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pause = () => {
    if (phaseRef.current === 'playing') {
      engine.current?.setPaused(true);
      setPhase('pause');
    }
  };
  function begin(id: ChapterId, resume = false) {
    stopSpeech();
    setChapter(id);
    setCheckpoint(resume && save.checkpoint?.chapter === id ? save.checkpoint.found : 0);
    setPhase('briefing');
  }
  function launch() {
    audio.current ??= new CampaignAudio();
    audio.current.start(chapter, save.music);
    setStats(defaultStats);
    setRun((n) => n + 1);
    setSave((s) => ({ ...s, checkpoint: { chapter, found: checkpoint } }));
    setPhase('playing');
  }
  function endMemory() {
    if (lineIndex < memory.lines.length - 1) {
      setLineIndex((n) => n + 1);
      return;
    }
    setSave((s) => ({
      ...s,
      memories: [...new Set([...s.memories, memory.id])],
      checkpoint: { chapter, found: memoryIndex + 1 },
    }));
    engine.current?.acceptMemory();
    setPhase('playing');
  }
  function complete(result: CampaignStats) {
    setStats(result);
    setSave((s) => ({
      ...s,
      completed: [...new Set([...s.completed, chapter])],
      current: Math.min(3, Math.max(s.current, chapter + 1)) as ChapterId,
      best: { ...s.best, [chapter]: Math.max(s.best[chapter] ?? 0, result.score) },
      checkpoint: null,
    }));
    setPhase('debrief');
  }
  function startQuiz(ids?: string[]) {
    stopSpeech();
    setPool(examQuestions(ids));
    setAnswers([]);
    setSelected(null);
    setPhase('quiz');
    audio.current?.setPaused(true);
  }
  function choose(index: number) {
    if (selected !== null || !q) return;
    setSelected(index);
    audio.current?.effect(index === q.answer ? 'ring' : 'hit');
    if (save.voice)
      speak(
        (index === q.answer ? 'Correct. ' : 'The answer is ' + q.choices[q.answer] + '. ') +
          q.explanation,
        { speaker: 'Douglass review' },
      );
  }
  function nextQuestion() {
    if (selected === null || !q) return;
    stopSpeech();
    const next = [...answers, { question: q, selected }];
    setAnswers(next);
    setSelected(null);
    if (next.length === pool.length) {
      const missed = next.filter((a) => a.selected !== a.question.answer).map((a) => a.question.id);
      setSave((s) => ({
        ...s,
        exams: [
          ...s.exams,
          { date: Date.now(), correct: next.length - missed.length, total: next.length },
        ].slice(-20),
        missed: [
          ...new Set([
            ...s.missed.filter((id) => !pool.some((question) => question.id === id)),
            ...missed,
          ]),
        ],
      }));
      setPhase('results');
    }
  }
  const chooseRef = useRef(choose),
    nextRef = useRef(nextQuestion);
  chooseRef.current = choose;
  nextRef.current = nextQuestion;
  useEffect(() => {
    if (phase !== 'quiz' || refs) return;
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^[1-4]$/.test(e.key)) {
        e.preventDefault();
        chooseRef.current(Number(e.key) - 1);
      } else if (e.key === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [phase, refs]);
  const showSource = (ids: SourceRef[]) => {
    stopSpeech();
    setRefs(ids);
  };
  const missed = answers.filter((a) => a.selected !== a.question.answer),
    percent = answers.length
      ? Math.round(((answers.length - missed.length) / answers.length) * 100)
      : 0;
  return (
    <main
      className={`douglass-app d-phase-${phase} ${reduced ? 'd-reduced' : ''}`}
      style={{ '--d-accent': mission.color } as CSSProperties}
    >
      {storageError && (
        <div className="d-storage" role="alert">
          This browser cannot save progress. Keep this tab open to continue your campaign.
        </div>
      )}
      {active && (
        <MissionCanvas
          chapter={chapter}
          run={run}
          checkpoint={checkpoint}
          relaxed={save.relaxed}
          reduced={reduced}
          engineRef={engine}
          callbacks={{
            memory: (i) => {
              setMemoryIndex(i);
              setLineIndex(0);
              setPhase('dialogue');
            },
            complete,
            stats: setStats,
            pause,
            effect: (k) => audio.current?.effect(k),
          }}
        />
      )}
      {active && (
        <header className="d-hud">
          <div className="d-mission-id">
            <span>{roman[chapter - 1]}</span>
            <div>
              <small>{mission.genre}</small>
              <strong>{mission.title}</strong>
            </div>
          </div>
          <div className="d-story-pips" aria-label={`${stats.found} of 4 testimonies discovered`}>
            {mission.memories.map((m, i) => (
              <i key={m.id} className={i < stats.found ? 'done' : ''} />
            ))}
          </div>
          <div className="d-hud-actions">
            <button
              onClick={() => setSave((s) => ({ ...s, music: !s.music }))}
              aria-label={save.music ? 'Mute music' : 'Enable music'}
            >
              {save.music ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button onClick={pause} aria-label="Pause mission" disabled={phase !== 'playing'}>
              <Pause size={18} />
            </button>
          </div>
        </header>
      )}
      {phase === 'playing' && (
        <>
          <div className="d-objective">
            <span>
              {stats.found === 4
                ? 'REACH THE FINAL LIGHT'
                : chapter === 3
                  ? 'FIND THE NEXT TESTIMONY'
                  : chapter === 2
                    ? 'FOLLOW THE CURRENT'
                    : 'FOLLOW THE LIGHT'}
            </span>
            <strong>
              {stats.found === 4 ? 'Carry the story forward' : mission.memories[stats.found].name}
            </strong>
            {chapter === 3 && (
              <small>
                {stats.distance.toFixed(0)} m {stats.near ? '· E to inspect' : ''}
              </small>
            )}
          </div>
          {stats.focus < 100 && (
            <div className="d-focus">
              <span>FOCUS</span>
              <i>
                <b style={{ width: `${stats.focus}%` }} />
              </i>
            </div>
          )}
          {chapter !== 3 && (
            <div className="d-ability">
              <span>{chapter === 1 ? 'DASH' : 'SURGE'}</span>
              <i>
                <b style={{ width: `${stats.surge * 100}%` }} />
              </i>
            </div>
          )}
          {stats.near && (
            <button
              className="d-inspect"
              onClick={() => {
                engine.current?.press('interact');
                window.setTimeout(() => engine.current?.release('interact'), 50);
              }}
            >
              E · Inspect testimony
            </button>
          )}
          <div className="d-keyboard-hint">{mission.controls}</div>
          <div className="d-touch-controls">
            <div className="d-touch-move">
              {chapter === 3 ? (
                <>
                  <TouchButton engine={engine} control="turnLeft" label="Turn left">
                    <ArrowLeft />
                  </TouchButton>
                  <TouchButton engine={engine} control="forward" label="Move forward">
                    <ArrowUp />
                  </TouchButton>
                  <TouchButton engine={engine} control="turnRight" label="Turn right">
                    <ArrowRight />
                  </TouchButton>
                  <TouchButton engine={engine} control="back" label="Move backward">
                    <ArrowDown />
                  </TouchButton>
                </>
              ) : (
                <>
                  <TouchButton
                    engine={engine}
                    control="left"
                    label={chapter === 2 ? 'Steer left' : 'Move left'}
                  >
                    <ArrowLeft />
                  </TouchButton>
                  <TouchButton
                    engine={engine}
                    control="right"
                    label={chapter === 2 ? 'Steer right' : 'Move right'}
                  >
                    <ArrowRight />
                  </TouchButton>
                </>
              )}
            </div>
            <div className="d-touch-action">
              <TouchButton
                engine={engine}
                control="dash"
                label={chapter === 1 ? 'Dash' : chapter === 2 ? 'Surge' : 'Sprint'}
              >
                <Wind />
              </TouchButton>
              {chapter !== 3 && (
                <TouchButton
                  engine={engine}
                  control="jump"
                  label={chapter === 1 ? 'Jump' : 'Slow down'}
                >
                  {chapter === 1 ? <ArrowUp /> : <Waves />}
                </TouchButton>
              )}
            </div>
          </div>
        </>
      )}
      {phase === 'dialogue' && (
        <Dialogue
          key={`${memory.id}-${lineIndex}`}
          line={memory.lines[lineIndex]}
          index={lineIndex}
          total={memory.lines.length}
          voice={save.voice}
          reduced={reduced}
          onVoice={() => setSave((s) => ({ ...s, voice: !s.voice }))}
          onNext={endMemory}
          onSource={showSource}
        />
      )}
      {phase === 'menu' && (
        <div className="d-menu">
          <div className="d-menu-art">
            <StoryArt kind="douglass" />
          </div>
          <header className="d-menu-nav">
            <a href="#course" className="course-back">
              <ArrowLeft size={14} /> ELA III collection
            </a>
            <div>
              <button onClick={() => setPhase('archive')}>Story archive</button>
              <button aria-label="Campaign settings" onClick={() => setSettings(true)}>
                <Settings size={18} />
              </button>
            </div>
          </header>
          <section className="d-menu-copy">
            <p className="d-eyebrow">FREDERICK DOUGLASS · CHAPTERS 1–3</p>
            <h1>
              A voice
              <br />
              <em>unbroken.</em>
            </h1>
            <p>
              Some stories change how you see the world.
              <br />
              This one asks you to listen.
            </p>
            <div className="d-menu-cta">
              <button
                className="d-primary"
                onClick={() => begin(save.checkpoint?.chapter ?? save.current, true)}
              >
                <Play size={17} fill="currentColor" />
                {save.checkpoint || save.completed.length ? 'Continue campaign' : 'Begin campaign'}
              </button>
              {save.completed.length === 3 && (
                <button className="d-secondary" onClick={() => startQuiz()}>
                  Final challenge <ArrowRight size={16} />
                </button>
              )}
            </div>
          </section>
          <div className="d-mission-menu">
            {missions.map((m) => {
              const locked = m.id > save.current,
                done = save.completed.includes(m.id);
              return (
                <button
                  key={m.id}
                  disabled={locked}
                  onClick={() => begin(m.id)}
                  className={done ? 'complete' : ''}
                >
                  <span className="d-chapter-number">
                    {done ? <Check size={20} /> : roman[m.id - 1]}
                  </span>
                  <span>
                    <small>{m.genre}</small>
                    <strong>{m.title}</strong>
                  </span>
                  <ArrowRight size={18} />
                </button>
              );
            })}
          </div>
          <p className="d-adaptation-note">
            A playable interpretation of the 1845 <i>Narrative</i>. Movement challenges are
            fictional; testimony is sourced to Chapters 1–3.
          </p>
        </div>
      )}
      {phase === 'briefing' && (
        <div className={`d-briefing d-brief-${chapter}`}>
          <div className="d-brief-art" aria-hidden="true">
            <span className="d-orbit one" />
            <span className="d-orbit two" />
            <div className="d-brief-symbol">
              {chapter === 1 ? <Wind /> : chapter === 2 ? <Waves /> : <Compass />}
            </div>
          </div>
          <div className="d-brief-copy">
            <button className="d-text-button" onClick={() => setPhase('menu')}>
              <ArrowLeft size={15} /> Missions
            </button>
            <p className="d-eyebrow">
              CHAPTER {roman[chapter - 1]} · {mission.genre}
            </p>
            <h1>{mission.title}</h1>
            <p>{mission.description}</p>
            <div className="d-brief-objective">
              <span>YOUR OBJECTIVE</span>
              <strong>{mission.objective}</strong>
            </div>
            <p className="d-controls-copy">{mission.controls}</p>
            <button className="d-primary" onClick={launch}>
              {checkpoint ? 'Resume at checkpoint' : 'Enter the story'}
              <ArrowRight size={18} />
            </button>
            <small className="d-fiction-note">
              {chapter === 1
                ? 'A symbolic journey through memories, not an escape described in this chapter.'
                : chapter === 2
                  ? 'Fictional river navigation. This chapter does not describe Douglass piloting the sloop.'
                  : 'A symbolic investigation. The layout and moving veils are fictional.'}
            </small>
          </div>
        </div>
      )}
      {phase === 'pause' && (
        <Dialog title="Take a breath" className="d-modal" onClose={() => setPhase('playing')}>
          <p>{mission.controls}</p>
          <div className="d-pause-actions">
            <button className="d-primary" onClick={() => setPhase('playing')}>
              <Play size={17} />
              Resume mission
            </button>
            <button className="d-secondary" onClick={() => begin(chapter)}>
              <RotateCcw size={16} />
              Restart mission
            </button>
            <button
              className="d-text-button"
              onClick={() => {
                stopSpeech();
                setPhase('menu');
              }}
            >
              Mission select
            </button>
            <a className="d-text-button" href="#course">
              ELA III collection
            </a>
          </div>
        </Dialog>
      )}
      {phase === 'debrief' && (
        <section className="d-debrief">
          <div className="d-debrief-inner">
            <p className="d-eyebrow">CHAPTER {roman[chapter - 1]} COMPLETE</p>
            <h1>
              {chapter === 1
                ? 'A life, not a number.'
                : chapter === 2
                  ? 'A song, not consent.'
                  : 'A voice worth hearing.'}
            </h1>
            <p>
              {chapter === 1
                ? 'Family, identity, and the first witness to cruelty.'
                : chapter === 2
                  ? 'Wealth for the estate. Deprivation for its workers. Sorrow beneath the singing.'
                  : 'Wealth and appearances cannot tell you what life is like under coercion.'}
            </p>
            <div className="d-run-summary">
              <span>
                <strong>{stats.score.toLocaleString()}</strong>MISSION SCORE
              </span>
              <span>
                <strong>{stats.resets === 0 ? 'Unbroken' : stats.resets}</strong>
                {stats.resets === 0 ? 'NO RESTARTS' : 'CHECKPOINT RETURNS'}
              </span>
              <span>
                <strong>4 / 4</strong>STORY MOMENTS
              </span>
            </div>
            <button
              className="d-primary"
              onClick={() => (chapter === 3 ? startQuiz() : begin((chapter + 1) as ChapterId))}
            >
              {chapter === 3 ? 'Face the final challenge' : `Next · ${missions[chapter].genre}`}
              <ArrowRight size={18} />
            </button>
            <button className="d-text-button" onClick={() => setPhase('menu')}>
              Mission select
            </button>
          </div>
        </section>
      )}
      {phase === 'quiz' && q && (
        <section className="d-quiz">
          <header>
            <button
              className="d-text-button"
              onClick={() => {
                stopSpeech();
                setPhase('menu');
              }}
            >
              <ArrowLeft size={16} />
              Campaign
            </button>
            <span>THE FINAL CHALLENGE</span>
            <span>
              {answers.length + 1} / {pool.length}
            </span>
          </header>
          <div className="d-quiz-progress">
            <i style={{ width: `${(answers.length / pool.length) * 100}%` }} />
          </div>
          <div className="d-question">
            <p className="d-eyebrow">
              CHAPTER {roman[q.chapter - 1]} · {q.topic}
            </p>
            <h1>{q.prompt}</h1>
            <button
              className="d-read"
              aria-label="Read question aloud"
              onClick={() =>
                speak(q.prompt + '. ' + q.choices.map((a, i) => `${i + 1}. ${a}`).join('. '), {
                  speaker: 'Douglass review',
                })
              }
            >
              <Volume2 size={16} />
            </button>
            <div className="d-choices">
              {q.choices.map((a, i) => (
                <button
                  key={a}
                  disabled={selected !== null}
                  className={
                    selected === null
                      ? ''
                      : i === q.answer
                        ? 'correct'
                        : i === selected
                          ? 'incorrect'
                          : 'faded'
                  }
                  onClick={() => choose(i)}
                >
                  <span>{selected !== null && i === q.answer ? <Check size={17} /> : i + 1}</span>
                  {a}
                </button>
              ))}
            </div>
            {selected !== null && (
              <div className="d-answer-feedback" role="status">
                <strong>
                  {selected === q.answer ? 'You’ve got it.' : 'Keep this part of the story.'}
                </strong>
                <p>{q.explanation}</p>
                <div>
                  <button className="d-source-link" onClick={() => showSource(q.refs)}>
                    Read the source
                  </button>
                  <button className="d-primary" onClick={nextQuestion}>
                    {answers.length + 1 === pool.length ? 'See your result' : 'Continue'}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      )}
      {phase === 'results' && (
        <section className="d-results">
          <p className="d-eyebrow">THE STORY STAYS WITH YOU</p>
          <div className="d-result-title">
            <h1>
              {percent >= 90
                ? 'A voice understood.'
                : percent >= 70
                  ? 'The story is taking shape.'
                  : 'Return to the voices.'}
            </h1>
            <div className="d-grade">
              <strong>{percent}%</strong>
              <span>
                {percent >= 90
                  ? 'A'
                  : percent >= 80
                    ? 'B'
                    : percent >= 70
                      ? 'C'
                      : percent >= 60
                        ? 'D'
                        : 'Keep exploring'}{' '}
                · {answers.length - missed.length} / {answers.length}
              </span>
            </div>
          </div>
          <div className="d-results-actions">
            {missed.length > 0 && (
              <button
                className="d-primary"
                onClick={() => startQuiz(missed.map((a) => a.question.id))}
              >
                Retry missed <ArrowRight size={16} />
              </button>
            )}
            <button className="d-secondary" onClick={() => startQuiz()}>
              New challenge
            </button>
            <button className="d-text-button" onClick={() => setPhase('menu')}>
              Return to campaign
            </button>
          </div>
          <div className="d-topic-results">
            {[...new Set(answers.map((a) => a.question.topic))].map((topic) => {
              const rows = answers.filter((a) => a.question.topic === topic),
                right = rows.filter((a) => a.selected === a.question.answer).length;
              return (
                <div key={topic}>
                  <strong>{topic}</strong>
                  <span>
                    {right} / {rows.length}
                  </span>
                  <small>
                    {right === rows.length
                      ? 'Strongest · carry it forward'
                      : 'Study next · revisit these voices'}
                  </small>
                </div>
              );
            })}
          </div>
          <h2>
            {missed.length ? 'Bring these details back into focus' : 'Every answer connected.'}
          </h2>
          <div className="d-missed">
            {missed.map(({ question, selected: i }) => (
              <article key={question.id}>
                <p className="d-eyebrow">CHAPTER {roman[question.chapter - 1]}</p>
                <h3>{question.prompt}</h3>
                <p className="d-your-answer">Your answer: {question.choices[i]}</p>
                <strong>{question.choices[question.answer]}</strong>
                <p>{question.explanation}</p>
                <button className="d-source-link" onClick={() => showSource(question.refs)}>
                  Revisit the passage
                </button>
              </article>
            ))}
          </div>
          <a className="course-back" href="#course">
            ← ELA III collection
          </a>
        </section>
      )}
      {phase === 'archive' && (
        <section className="d-archive">
          <button className="d-text-button" onClick={() => setPhase('menu')}>
            <ArrowLeft size={16} />
            Campaign
          </button>
          <p className="d-eyebrow">THE VOICES YOU’VE FOUND</p>
          <h1>Story archive</h1>
          <p>Short takeaways from your journey. Every one leads back to the text.</p>
          {missions.map((m) => (
            <section key={m.id}>
              <div className="d-archive-heading">
                <h2>
                  {roman[m.id - 1]} · {m.title}
                </h2>
                <button
                  className="d-source-link"
                  onClick={() =>
                    showSource(
                      source[m.id - 1].paragraphs.map((_, i) => `${m.id}.${i + 1}` as SourceRef),
                    )
                  }
                >
                  Read Chapter {roman[m.id - 1]}
                </button>
              </div>
              <div className="d-memory-grid">
                {m.memories.map((memory) => (
                  <article key={memory.id}>
                    <span>{save.memories.includes(memory.id) ? 'DISCOVERED' : 'UNDISCOVERED'}</span>
                    <h3>
                      {save.memories.includes(memory.id)
                        ? memory.name
                        : 'A voice waiting to be heard'}
                    </h3>
                    {save.memories.includes(memory.id) ? (
                      <>
                        <p>{memory.takeaway}</p>
                        <button
                          className="d-source-link"
                          onClick={() =>
                            showSource([...new Set(memory.lines.flatMap((l) => l.refs))])
                          }
                        >
                          Read the evidence
                        </button>
                      </>
                    ) : (
                      <p>Discover this moment in Chapter {roman[m.id - 1]}.</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </section>
      )}
      {settings && (
        <Dialog title="Make it yours" className="d-modal" onClose={() => setSettings(false)}>
          {(['music', 'voice', 'relaxed', 'reducedMotion'] as const).map((key) => (
            <label className="d-setting" key={key}>
              <span>
                <strong>
                  {
                    {
                      music: 'Music & sound',
                      voice: 'Spoken dialogue',
                      relaxed: 'Relaxed challenge',
                      reducedMotion: 'Reduced motion',
                    }[key]
                  }
                </strong>
                <small>
                  {
                    {
                      music: 'Original instrumental score and feedback.',
                      voice: 'Browser voices; written dialogue is always available.',
                      relaxed: 'Softer hazards. The same story and final challenge.',
                      reducedMotion: 'Instant dialogue and less visual movement.',
                    }[key]
                  }
                </small>
              </span>
              <input
                type="checkbox"
                checked={save[key]}
                onChange={(e) => setSave((s) => ({ ...s, [key]: e.target.checked }))}
              />
            </label>
          ))}
          <button className="d-text-button" onClick={() => setReset(true)}>
            Reset Douglass progress
          </button>
        </Dialog>
      )}
      {reset && (
        <Dialog title="Start Douglass again?" className="d-modal" onClose={() => setReset(false)}>
          <p>This clears this campaign’s checkpoints, archive, scores, and quiz results.</p>
          <div className="d-pause-actions">
            <button className="d-secondary" onClick={() => setReset(false)}>
              Keep my progress
            </button>
            <button
              className="d-primary"
              onClick={() => {
                stopSpeech();
                setSave(freshDouglassSave());
                setReset(false);
                setSettings(false);
                setPhase('menu');
                setChapter(1);
              }}
            >
              Reset Douglass
            </button>
          </div>
        </Dialog>
      )}
      {refs && (
        <Dialog
          title="From the Narrative"
          className="d-source-modal"
          wide
          onClose={() => setRefs(null)}
        >
          <p className="d-source-intro">
            Frederick Douglass,{' '}
            <i>Narrative of the Life of Frederick Douglass, an American Slave</i> (1845). Chapter
            and paragraph references use the source transcript bundled with this game.
          </p>
          {refs.map((ref) => (
            <article key={ref}>
              <header>
                CHAPTER {roman[Number(ref.split('.')[0]) - 1]} · PARAGRAPH {ref.split('.')[1]}
              </header>
              <p>{passage(ref)}</p>
            </article>
          ))}
          <a
            className="d-source-link"
            href={sourceLink(Number(refs[0].split('.')[0]))}
            target="_blank"
            rel="noreferrer"
          >
            Open the primary text at Project Gutenberg ↗
          </a>
        </Dialog>
      )}
    </main>
  );
}
