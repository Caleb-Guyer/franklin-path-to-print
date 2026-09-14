import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Feather,
  Flame,
  GraduationCap,
  Landmark,
  Map,
  Medal,
  Menu,
  ScrollText,
  Settings,
  Sparkles,
  Swords,
  Users,
  X,
} from 'lucide-react';
import { chapters } from './data/chapters';
import { questions } from './data/questions';
import { freshSave, level, levelProgress, rank } from './lib/game';
import { GameProvider, useGame } from './components/GameContext';
import { Dialog, Progress, SourceViewer, roman } from './components/Common';
import Story from './pages/Story';
import Quiz, { bossConfig, type SessionConfig } from './pages/Quiz';
import { Characters, Collection, Journal, LocationMap, Study, Timeline } from './pages/Library';
import SettingsPage from './pages/Settings';
const nav = [
  ['home', 'The study', Feather],
  ['story', 'Your journey', Compass],
  ['quiz', 'Quiz tomorrow', Swords],
  ['journal', 'Memory journal', BookOpen],
  ['timeline', 'Timeline', ScrollText],
  ['characters', 'Characters', Users],
  ['map', 'Locations', Map],
  ['collection', 'Collection', Medal],
  ['study', 'Study mode', Sparkles],
  ['exam', 'Final exam', GraduationCap],
  ['settings', 'Settings', Settings],
] as const;
const routes = new Set<string>([...nav.map((x) => x[0]), 'arena']);
export default function App() {
  const [source, setSource] = useState<number[] | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [resetOpen, setResetOpen] = useState(false);
  return (
    <GameProvider
      onSource={(pages) => {
        setSource([...new Set(pages)].sort((a, b) => a - b));
        setSourceIndex(0);
      }}
      onReset={() => setResetOpen(true)}
    >
      <AppShell />
      {source && (
        <SourceViewer
          pages={source}
          index={sourceIndex}
          setIndex={setSourceIndex}
          onClose={() => setSource(null)}
        />
      )}{' '}
      {resetOpen && <ResetDialog onClose={() => setResetOpen(false)} />}
    </GameProvider>
  );
}
function readRoute() {
  const hash = location.hash.slice(1);
  return routes.has(hash) || /^story\/(?:[1-9]|1[0-2])$/.test(hash) ? hash : 'home';
}
function AppShell() {
  const [path, setPath] = useState(readRoute);
  const [route, chapterSegment] = path.split('/');
  const [menu, setMenu] = useState(false);
  const [session, setSession] = useState<SessionConfig | null>(null);
  const [run, setRun] = useState(0);
  const { save, storageError } = useGame();
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const handle = () => {
      setPath(readRoute());
      setMenu(false);
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', handle);
    return () => window.removeEventListener('hashchange', handle);
  }, []);
  useEffect(() => {
    document.title =
      (route === 'home'
        ? 'FRANKLIN'
        : (nav.find((x) => x[0] === route)?.[1] ?? 'The Recall Arena')) + ' · The Path to Print';
  }, [route]);
  useEffect(() => {
    type ModelContext = {
      registerTool: (t: unknown, o: { signal: AbortSignal }) => Promise<void> | void;
    };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const controller = new AbortController();
    const registered = [
      {
        name: 'read_franklin_progress',
        description:
          'Read device-local game progress without changing scores or revealing answers.',
        inputSchema: { type: 'object', properties: {}, additionalProperties: false },
        annotations: { readOnlyHint: true },
        execute: () => {
          const s = saveRef.current;
          return {
            xp: s.xp,
            level: level(s.xp),
            currentChapter: s.currentChapter,
            completedChapters: s.completedChapters,
            unlockedCards: s.unlockedCards.length,
            missedQuestions: s.mistakes.length,
          };
        },
      },
      {
        name: 'open_franklin_section',
        description: 'Navigate to a game section without answering questions or changing scores.',
        inputSchema: {
          type: 'object',
          properties: { section: { type: 'string', enum: nav.map((n) => n[0]) } },
          required: ['section'],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false },
        execute: async (input: unknown) => {
          const section = (input as { section?: string })?.section;
          if (!section || !nav.some((n) => n[0] === section)) throw new Error('Unknown section');
          location.hash = section;
          await new Promise<void>((r) =>
            requestAnimationFrame(() => requestAnimationFrame(() => r())),
          );
          return { section };
        },
      },
    ];
    for (const tool of registered) {
      try {
        void Promise.resolve(context.registerTool(tool, { signal: controller.signal })).catch(
          () => {},
        );
      } catch {
        /* Optional browser capability. */
      }
    }
    return () => controller.abort();
  }, []);
  function start(config: SessionConfig) {
    setSession(config);
    setRun((n) => n + 1);
    location.hash = 'arena';
    setPath('arena');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById('main-content')?.focus();
        }}
      >
        Skip to game
      </a>
      {menu && (
        <button
          aria-label="Close navigation"
          className="menu-scrim"
          onClick={() => setMenu(false)}
        />
      )}
      <aside className={'sidebar ' + (menu ? 'open' : '')}>
        <a href="#home" className="brand-mark">
          F
          <span>
            THE PATH
            <br />
            TO PRINT
          </span>
        </a>
        <div className="nav-label">PART ONE · THE APPRENTICE</div>
        <nav aria-label="Game sections">
          {nav.map(([id, label, Icon]) => (
            <a
              className={route === id ? 'active' : ''}
              aria-current={route === id ? 'page' : undefined}
              key={id}
              href={'#' + id}
            >
              <Icon size={18} />
              <span>{label}</span>
              {id === 'quiz' && <i className="tiny-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="seal">
            <Landmark size={22} />
          </div>
          <span>
            One life. Every detail.<small>Your progress stays on this device.</small>
          </span>
        </div>
      </aside>
      <main className="main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <button
            className="mobile-toggle"
            onClick={() => setMenu(!menu)}
            aria-label={menu ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menu}
          >
            {menu ? <X size={21} /> : <Menu size={21} />}
          </button>
          <div className="breadcrumb">
            THE AUTOBIOGRAPHY <span>/</span> PART ONE
          </div>
          <div className="player-meta">
            <span>
              <Flame size={16} />
              {save.streak}
              <small>STREAK</small>
            </span>
            <span className="level-medal">{level(save.xp)}</span>
            <div>
              {rank(save.xp)}
              <small>{save.xp.toLocaleString()} XP</small>
              <Progress value={levelProgress(save.xp)} label="Progress to next level" />
            </div>
          </div>
        </header>
        {storageError && (
          <div className="storage-warning" role="alert">
            {storageError}
          </div>
        )}
        <div key={path} className="route-enter">
          {route === 'home' ? (
            <Home />
          ) : route === 'story' ? (
            <Story
              initialChapter={Math.min(
                save.currentChapter,
                Number(chapterSegment) || save.currentChapter,
              )}
              startBoss={(id) => start(bossConfig(id))}
            />
          ) : route === 'quiz' ? (
            <Quiz />
          ) : route === 'exam' ? (
            <Quiz
              initial={{
                title: 'Final Exam',
                pool: questions,
                count: 20,
                difficulty: 'FINAL EXAM',
                balanced: true,
              }}
            />
          ) : route === 'arena' ? (
            <Quiz
              key={run}
              initial={session ?? bossConfig(save.currentChapter)}
              onBack={() => setSession(null)}
            />
          ) : route === 'journal' ? (
            <Journal start={start} />
          ) : route === 'characters' ? (
            <Characters />
          ) : route === 'timeline' ? (
            <Timeline start={start} />
          ) : route === 'map' ? (
            <LocationMap start={start} />
          ) : route === 'collection' ? (
            <Collection />
          ) : route === 'study' ? (
            <Study start={start} />
          ) : (
            <SettingsPage />
          )}
        </div>
        <footer className="app-footer">
          <span>FRANKLIN · THE PATH TO PRINT</span>
          <a href="#settings">The source: 27 visually inspected PDF spreads</a>
          <span>Saved locally · No account required</span>
        </footer>
      </main>
    </div>
  );
}
function Home() {
  const { save, reset } = useGame();
  const chapter = chapters[save.currentChapter - 1];
  return (
    <>
      <section className="home-hero">
        <img
          className="hero-art"
          src={import.meta.env.BASE_URL + 'press-room.svg'}
          alt="Original imagined illustration of a lamplit printing room overlooking a harbor"
        />
        <div className="hero-shade" />
        <div className="ink-motes" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <i key={i} style={{ left: 48 + i * 6 + '%', animationDelay: -i * 2.3 + 's' }} />
          ))}
        </div>
        <div className="hero-copy">
          <div className="eyebrow">
            <span />A LIFE WRITTEN IN INK
          </div>
          <h1>
            FRANKLIN<span>THE PATH TO PRINT</span>
          </h1>
          <p className="subtitle">Part One — The Apprentice</p>
          <div className="hero-rule" />
          <div className="mission">
            <small>YOUR MISSION</small>
            <p>
              Survive Part One.
              <br />
              Remember everyone.
              <br />
              <em>Remember everything.</em>
            </p>
          </div>
          <p className="muted hero-note">
            Be ready for tomorrow.
            <br />
            Your next chapter begins with what you remember.
          </p>
          <a className="button primary journey-button" href="#story">
            <Compass size={20} />
            {save.completedEvents.length ? 'Continue journey' : 'Begin your journey'}
            <ArrowRight size={19} />
          </a>
          <a className="text-link" href="#quiz">
            The quiz is tomorrow. Take me to the trials
            <ArrowRight size={15} />
          </a>
          <button className="new-journey" onClick={reset}>
            New journey
          </button>
        </div>
        <div className="art-caption">
          THE PRINT ROOM<span>AN ORIGINAL, IMAGINED SCENE</span>
        </div>
      </section>
      <section className="home-bottom">
        <div className="next-chapter">
          <span className="roman">{roman(chapter.id)}</span>
          <div>
            <div className="eyebrow">YOUR NEXT CHAPTER</div>
            <h2>{chapter.title}</h2>
            <p>{chapter.subtitle}</p>
            <div className="home-progress">
              <Progress value={(save.completedChapters.length / 12) * 100} />
              <span>{save.completedChapters.length} / 12 chapters complete</span>
            </div>
          </div>
          <a href="#story" className="circle-button" aria-label="Open story">
            <ArrowRight />
          </a>
        </div>
        <div className="quick-panels">
          <a href="#quiz">
            <Swords />
            <div>
              <h3>Quiz tomorrow</h3>
              <p>{questions.length} questions. Make every detail count.</p>
            </div>
            <ArrowRight size={17} />
          </a>
          <a href="#journal">
            <BookOpen />
            <div>
              <h3>Your memory journal</h3>
              <p>People, pages, and the threads between them.</p>
            </div>
            <ArrowRight size={17} />
          </a>
        </div>
      </section>
      <section className="home-lower">
        <div>
          <div className="eyebrow">THE JOURNEY IN TWELVE CHAPTERS</div>
          <h2>From the first spark to the final page.</h2>
        </div>
        <div className="journey-track">
          {chapters.map((c) => (
            <a
              href={c.id <= save.currentChapter ? '#story/' + c.id : undefined}
              aria-disabled={c.id > save.currentChapter}
              title={
                c.id > save.currentChapter
                  ? 'Complete earlier chapter trials to unlock'
                  : 'Open this chapter'
              }
              key={c.id}
              aria-label={'Chapter ' + c.id + ': ' + c.title}
              className={
                save.completedChapters.includes(c.id)
                  ? 'complete'
                  : c.id === save.currentChapter
                    ? 'current'
                    : ''
              }
            >
              <span>{roman(c.id)}</span>
              <small>{c.title}</small>
            </a>
          ))}
        </div>
        <div className="home-lower-links">
          <a href="#study">
            <Sparkles size={17} />
            Rehearse with flashcards
            <ArrowRight size={15} />
          </a>
          <a href="#exam">
            <GraduationCap size={19} />
            Take the final exam
            <ArrowRight size={15} />
          </a>
          <a href="#map">
            <Map size={17} />
            Explore the places
            <ArrowRight size={15} />
          </a>
        </div>
      </section>
    </>
  );
}
function ResetDialog({ onClose }: { onClose: () => void }) {
  const { setSave } = useGame();
  return (
    <Dialog title="Begin with a clean page?" onClose={onClose}>
      <p>
        This erases your current local save: journey, XP, cards, achievements, question history and
        exam results. Export a copy from Settings first if you want to keep it.
      </p>
      <div className="button-row">
        <button className="button" onClick={onClose}>
          Keep my progress
        </button>
        <button
          className="button danger"
          onClick={() => {
            setSave(freshSave());
            location.hash = 'home';
            onClose();
          }}
        >
          Reset everything
        </button>
      </div>
    </Dialog>
  );
}
