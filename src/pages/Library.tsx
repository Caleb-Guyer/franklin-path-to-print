import { useState } from 'react';
import { VoiceButton } from '../components/Voice';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Feather,
  Flame,
  Lock,
  Medal,
  RotateCcw,
  Search,
  Shuffle,
  Star,
  Users,
} from 'lucide-react';
import { cards, timeline } from '../data/catalog';
import { chapters, events } from '../data/chapters';
import { characters, relationships } from '../data/characters';
import { locations } from '../data/locations';
import { factById, facts } from '../data/facts';
import { questions } from '../data/questions';
import { mastered, shuffle, priority } from '../lib/game';
import { useGame } from '../components/GameContext';
import { Dialog, PageTitle, Progress, Source, roman } from '../components/Common';
import type { SessionConfig } from './Quiz';
type Start = (s: SessionConfig) => void;
export function Collection() {
  const { save } = useGame();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [all, setAll] = useState(false);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = cards.find((c) => c.id === selected);
  const filtered = cards.filter(
    (c) =>
      (all || save.unlockedCards.includes(c.id)) &&
      (category === 'All' || c.category === category) &&
      `${c.label} ${c.answer} ${c.details}`.toLowerCase().includes(search.toLowerCase()),
  );
  const size = 18;
  const pageCount = Math.max(1, Math.ceil(filtered.length / size));
  return (
    <div className="page">
      <PageTitle
        title="Collection"
        description={`${save.unlockedCards.length} / ${cards.length} cards unlocked`}
      />
      <div className="library-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Search memory cards"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="Find a person, book, or small detail…"
          />
        </label>
        <select
          aria-label="Card category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
        >
          {['All', ...new Set(cards.map((c) => c.category))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label className="check-label">
          <input
            type="checkbox"
            checked={all}
            onChange={(e) => {
              setAll(e.target.checked);
              setPage(0);
            }}
          />
          Study all cards
        </label>
      </div>
      {!filtered.length ? (
        <div className="empty-panel">
          <BookOpen size={40} />
          <h2>{search ? 'No matching cards.' : 'No cards unlocked yet.'}</h2>
          <p>
            Playing scenes and answering questions unlocks cards. To study the entire excerpt now,
            turn on Study all cards.
          </p>
          <a className="button primary" href="#story">
            Enter the story
            <ArrowRight size={17} />
          </a>
        </div>
      ) : (
        <>
          <div className="card-grid">
            {filtered
              .slice(
                Math.min(page, pageCount - 1) * size,
                (Math.min(page, pageCount - 1) + 1) * size,
              )
              .map((c) => {
                const known = save.unlockedCards.includes(c.id);
                const m = mastered(save.history['q' + c.id.slice(1)]);
                return (
                  <button
                    className={'memory-card ' + (m ? 'mastered' : '')}
                    key={c.id}
                    onClick={() => setSelected(c.id)}
                  >
                    <div className="card-top">
                      <span>{c.category}</span>
                      {m ? <Check size={16} /> : known ? <Feather size={16} /> : <Lock size={14} />}
                    </div>
                    <div className="card-symbol">
                      {c.category === 'People' ? (
                        <Users />
                      ) : c.category === 'Books' || c.category === 'Publications' ? (
                        <BookOpen />
                      ) : c.category === 'Ideas' ? (
                        <Star />
                      ) : (
                        <Feather />
                      )}
                    </div>
                    <h3>{c.label}</h3>
                    <div className="card-bottom">
                      <span>CH. {roman(c.chapter)}</span>
                      <span aria-label={`Difficulty ${c.difficulty} of 4`}>
                        {'◆'.repeat(c.difficulty)}
                        {'◇'.repeat(4 - c.difficulty)}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
          <div className="pagination">
            <button
              className="button compact"
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              <ArrowLeft size={15} />
              Previous
            </button>
            <span>
              Page {Math.min(page, pageCount - 1) + 1} of {pageCount} · {filtered.length} cards
            </span>
            <button
              className="button compact"
              disabled={page >= pageCount - 1}
              onClick={() => setPage(page + 1)}
            >
              Next
              <ArrowRight size={15} />
            </button>
          </div>
        </>
      )}
      {chosen && (
        <Dialog title={chosen.label} onClose={() => setSelected(null)}>
          <div className="tag-row">
            <span className="tag">{chosen.category}</span>
            <span className="tag">Chapter {roman(chosen.chapter)}</span>
            <span className="tag">Difficulty {chosen.difficulty}/4</span>
          </div>
          <div className="card-back">
            <div className="eyebrow">TURN THE MEMORY OVER</div>
            <h3>{chosen.answer}</h3>
            <p>{chosen.details}</p>
            <VoiceButton text={chosen.details} auto />
            <Source pages={chosen.sourcePages} />
            <h4>Related people</h4>
            <p>
              {chosen.relatedCharacters.length
                ? chosen.relatedCharacters
                    .map((id) => characters.find((c) => c.id === id)?.name)
                    .join(' · ')
                : 'Franklin’s own experience or reflection'}
            </p>
            <h4>In the story</h4>
            <p>
              {chosen.relatedEvents.map((id) => events.find((e) => e.id === id)?.title).join(' · ')}
            </p>
            <h4>Try it without looking</h4>
            <p>{chosen.prompt}</p>
          </div>
        </Dialog>
      )}
    </div>
  );
}
export function Journal({ start }: { start: Start }) {
  const { save } = useGame();
  const [chapter, setChapter] = useState(1);
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);
  const hs = Object.values(save.history);
  const attempted = hs.reduce((n, h) => n + h.attempts, 0),
    correct = hs.reduce((n, h) => n + h.correct, 0);
  const visible = facts.filter(
    (f) =>
      f.chapter === chapter &&
      (all || save.unlockedCards.includes(f.id)) &&
      `${f.label} ${f.details} ${f.answer}`.toLowerCase().includes(search.toLowerCase()),
  );
  const weak = questions
    .filter((q) => save.mistakes.includes(q.id))
    .sort((a, b) => priority(b, save) - priority(a, save));
  return (
    <div className="page">
      <PageTitle title="Memory journal" />
      <div className="journal-stats">
        <div>
          <BookOpen />
          <strong>
            {save.unlockedCards.length}
            <small>/{facts.length}</small>
          </strong>
          <span>Discovered facts</span>
        </div>
        <div>
          <Medal />
          <strong>{hs.filter(mastered).length}</strong>
          <span>Mastered questions</span>
        </div>
        <div>
          <Check />
          <strong>{attempted ? Math.round((correct / attempted) * 100) + '%' : '—'}</strong>
          <span>Lifetime accuracy</span>
        </div>
        <div>
          <Flame />
          <strong>{save.mistakes.length}</strong>
          <span>On the Trouble List</span>
        </div>
      </div>
      <div className="journal-layout">
        <aside>
          <div className="panel trouble-mini">
            <div className="eyebrow">FRANKLIN’S TROUBLE LIST</div>
            <h3>
              {weak.length ? `${weak.length} memories to strengthen` : 'No missed questions yet'}
            </h3>
            <p>Two correct recalls clear a miss. Three establish mastery.</p>
            <button
              className="button"
              onClick={() =>
                start({
                  title: weak.length ? 'Trouble List Rematch' : 'Quick review',
                  pool: weak.length ? weak : questions,
                  count: Math.min(20, weak.length || 10),
                  difficulty: 'NORMAL',
                })
              }
            >
              <RotateCcw size={15} />
              {weak.length ? 'Review the trouble list' : 'Try ten questions'}
            </button>
          </div>
          <div className="journal-chapters">
            {chapters.map((c) => (
              <button
                className={chapter === c.id ? 'selected' : ''}
                key={c.id}
                onClick={() => setChapter(c.id)}
              >
                <span>{roman(c.id)}</span>
                {c.title}
                {save.completedChapters.includes(c.id) && <Check size={14} />}
              </button>
            ))}
          </div>
        </aside>
        <section className="journal-pages">
          <div className="library-toolbar">
            <label className="search-box">
              <Search size={16} />
              <input
                aria-label="Search journal"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search this chapter…"
              />
            </label>
            <label className="check-label">
              <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
              Study all entries
            </label>
          </div>
          <div className="eyebrow">CHAPTER {roman(chapter)}</div>
          <h2>{chapters[chapter - 1].title}</h2>
          {visible.length ? (
            visible.map((f) => (
              <details className="journal-entry" key={f.id}>
                <summary>
                  <div>
                    <span className="tag">{f.category}</span>
                    <strong>{f.label}</strong>
                  </div>
                  {mastered(save.history['q' + f.id.slice(1)]) ? (
                    <span className="mastery-label">
                      <Check size={13} />
                      Mastered
                    </span>
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </summary>
                <h3>{f.answer}</h3>
                <p>{f.details}</p>
                <VoiceButton text={f.details} />
                <p className="recall-prompt">Close this entry and recall: {f.prompt}</p>
                <Source pages={f.sourcePages} />
              </details>
            ))
          ) : (
            <div className="empty-panel">
              <Lock size={28} />
              <h3>{search ? 'No matching entries.' : 'This chapter is still sealed.'}</h3>
              <p>Encounter its scenes, or turn on Study all entries to prepare now.</p>
              <a className="button" href="#story">
                Return to the journey
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
export function Characters() {
  const { save } = useGame();
  const [selected, setSelected] = useState(characters[0].id);
  const [search, setSearch] = useState('');
  const [all, setAll] = useState(false);
  const chosen = characters.find((c) => c.id === selected)!;
  const unlocked = (ids: string[]) => all || ids.some((id) => save.unlockedCards.includes(id));
  const visible = characters.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const linked = relationships
    .filter(([a, b]) => a === selected || b === selected)
    .map(([a, b, label]) => ({ id: a === selected ? b : a, label }));
  const fs = chosen.factIds
    .filter((id) => all || save.unlockedCards.includes(id))
    .map((id) => factById[id]);
  return (
    <div className="page">
      <PageTitle
        title="Characters"
        description={`${characters.length} profiles · Details unlock as you play.`}
      />
      <div className="library-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input
            aria-label="Find a character"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a name…"
          />
        </label>
        <label className="check-label">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Study all profiles
        </label>
      </div>
      <div className="character-layout">
        <aside className="character-list">
          {visible.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={selected === c.id ? 'selected' : ''}
            >
              <span className="portrait mini">
                {unlocked(c.factIds) ? initials(c.name) : <Lock size={13} />}
              </span>
              <span>
                {c.name}
                <small>{unlocked(c.factIds) ? c.role : 'Profile not yet encountered'}</small>
              </span>
            </button>
          ))}
        </aside>
        <section className="character-profile">
          <div className="profile-header">
            <span className="portrait large">
              {unlocked(chosen.factIds) ? initials(chosen.name) : <Lock size={33} />}
            </span>
            <div>
              <div className="eyebrow">FIRST ENCOUNTER · CHAPTER {roman(chosen.chapter)}</div>
              <h2>{chosen.name}</h2>
              <p>{unlocked(chosen.factIds) ? chosen.role : 'A sealed page in your journal'}</p>
            </div>
          </div>
          {unlocked(chosen.factIds) ? (
            <>
              <p className="relationship-line">
                <Feather size={16} />
                <strong>To Franklin:</strong> {chosen.relation}
              </p>
              <div className="character-web">
                <div className="eyebrow">RELATIONSHIPS</div>
                <div className="web-root">
                  <span className="portrait mini">BF</span>
                  <span>Benjamin Franklin</span>
                  <span className="connection-line" />
                  <strong>{chosen.name}</strong>
                </div>
                <div className="web-branches">
                  {linked.length ? (
                    linked.map((l) => {
                      const c = characters.find((c) => c.id === l.id)!;
                      return (
                        <button key={l.id} onClick={() => setSelected(l.id)}>
                          <span className="web-wire" />
                          <span className="portrait mini">
                            {unlocked(c.factIds) ? initials(c.name) : <Lock size={12} />}
                          </span>
                          <strong>{c.name}</strong>
                          <small>{unlocked(c.factIds) ? l.label : 'Connection to discover'}</small>
                        </button>
                      );
                    })
                  ) : (
                    <div className="web-solo">
                      This profile connects directly to Franklin through the relationship above.
                    </div>
                  )}
                </div>
              </div>
              <div className="profile-facts">
                {fs.map((f) => (
                  <article key={f.id}>
                    <span className="eyebrow">
                      CH. {roman(f.chapter)} · {f.label}
                    </span>
                    <p>{f.details}</p>
                    <VoiceButton text={f.details} />
                    <Source pages={f.sourcePages} />
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <Lock />
              <h3>You have not met this person yet.</h3>
              <p>
                Play the story or enable Study all profiles to view the source-backed details
                immediately.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
function initials(name: string) {
  return name
    .replace(/^(Mr\.|Mrs\.|Dr\.|Sir|Captain|Governor|Major|Colonel) /, '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');
}
export function Timeline({ start }: { start: Start }) {
  const { save } = useGame();
  const [chapter, setChapter] = useState(0);
  const [all, setAll] = useState(true);
  const visible = timeline.filter(
    (e) => (!chapter || e.chapter === chapter) && (all || save.completedEvents.includes(e.id)),
  );
  return (
    <div className="page">
      <PageTitle
        title="Timeline"
        description="Dates follow the precision of the source."
        action={
          <button
            className="button primary"
            onClick={() =>
              start({
                title: 'The Chronology Duel',
                pool: questions.filter((q) => q.type === 'order'),
                count: 10,
                difficulty: 'HARD',
              })
            }
          >
            Chronology duel
            <ArrowRight size={17} />
          </button>
        }
      />
      <div className="library-toolbar">
        <select
          aria-label="Timeline chapter"
          value={chapter}
          onChange={(e) => setChapter(Number(e.target.value))}
        >
          <option value={0}>The complete timeline</option>
          {chapters.map((c) => (
            <option value={c.id} key={c.id}>
              {roman(c.id)} · {c.title}
            </option>
          ))}
        </select>
        <label className="check-label">
          <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />
          Show unplayed events
        </label>
        <span className="small muted">A sequence diagram, not a proportional date scale.</span>
      </div>
      <div className="timeline-list">
        {visible.map((e, i) => (
          <article
            className={'timeline-event ' + (save.completedEvents.includes(e.id) ? 'complete' : '')}
            key={e.id}
          >
            <div className="timeline-marker">
              {save.completedEvents.includes(e.id) ? (
                <Check size={15} />
              ) : (
                String(i + 1).padStart(2, '0')
              )}
            </div>
            <div className="timeline-era">
              <span>{e.era}</span>
              <small>{e.location}</small>
            </div>
            <div className="timeline-body">
              <span className="eyebrow">CHAPTER {roman(e.chapter)}</span>
              <h3>{e.title}</h3>
              <p>{e.narration}</p>
              <div className="timeline-people">
                {characters
                  .filter((c) => c.factIds.some((id) => e.factIds.includes(id)))
                  .slice(0, 5)
                  .map((c) => (
                    <span className="tag" key={c.id}>
                      {c.name}
                    </span>
                  ))}
              </div>
              <Source pages={e.sourcePages} />
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <div className="empty-panel">
          <h3>The timeline is ready to be discovered.</h3>
          <p>Show unplayed events or complete your first scene.</p>
        </div>
      )}
    </div>
  );
}
export function LocationMap({ start }: { start: Start }) {
  const [selected, setSelected] = useState('philadelphia');
  const l = locations.find((x) => x.id === selected)!;
  const qs = questions.filter((q) => q.factIds.some((id) => l.factIds.includes(id)));
  const people = characters.filter((c) => c.factIds.some((id) => l.factIds.includes(id)));
  return (
    <div className="page">
      <PageTitle
        title="Locations"
        description="A schematic map; distances and positions are illustrative."
      />
      <div className="map-layout">
        <div className="map-board">
          <div className="map-region america">AMERICA</div>
          <div className="map-region england">ENGLAND</div>
          <div className="ocean-label">
            THE ATLANTIC
            <br />
            <span>passages, promises, returns</span>
          </div>
          <svg
            className="map-lines"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path d="M20 15L31 25 22 39 40 37 16 50 28 62 19 78 9 92M19 78C54 57 50 22 77 54M77 54L90 70C73 87 52 89 19 78M67 14L72 28 62 43 77 54M40 78L19 78M49 91L19 78" />
          </svg>
          {locations.map((loc) => (
            <button
              key={loc.id}
              style={{ left: loc.x + '%', top: loc.y + '%' }}
              className={'map-pin ' + (selected === loc.id ? 'selected' : '')}
              onClick={() => setSelected(loc.id)}
              aria-pressed={selected === loc.id}
            >
              <span />
              <strong>{loc.name}</strong>
            </button>
          ))}
          <div className="compass-rose">
            N<span>✧</span>S
          </div>
        </div>
        <section className="place-panel" key={l.id}>
          <h2>{l.name}</h2>
          <p>{l.subtitle}</p>
          <div className="tag-row">
            {people.slice(0, 8).map((c) => (
              <span className="tag" key={c.id}>
                {c.name}
              </span>
            ))}
          </div>
          <button
            className="button primary"
            onClick={() =>
              start({
                title: `The ${l.name} Drill`,
                pool: qs,
                count: Math.min(10, qs.length),
                difficulty: 'NORMAL',
              })
            }
          >
            Recall this place
            <ArrowRight size={16} />
          </button>
          <div className="place-facts">
            {l.factIds.map((id) => {
              const f = factById[id];
              return (
                <details key={id}>
                  <summary>{f.label}</summary>
                  <p>{f.details}</p>
                  <VoiceButton text={f.details} />
                  <Source pages={f.sourcePages} />
                </details>
              );
            })}
          </div>
          <Source pages={l.sourcePages} />
        </section>
      </div>
    </div>
  );
}
export function Study({ start }: { start: Start }) {
  const { save, setSave } = useGame();
  const [category, setCategory] = useState('All');
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [deck, setDeck] = useState(() => shuffle(cards));
  const selected = deck.filter((c) => category === 'All' || c.category === category);
  const card = selected[index % selected.length];
  function change() {
    setIndex((i) => (i + 1) % selected.length);
    setFlipped(false);
  }
  function flip() {
    setFlipped(!flipped);
    setSave((s) => ({ ...s, unlockedCards: [...new Set([...s.unlockedCards, card.id])] }));
  }
  const drills = [
    ['Character drill', 'People', 'person'],
    ['Chronology drill', 'Events', 'order'],
    ['People & relationships', 'People', ''],
    ['Places drill', 'Places', ''],
    ['Books & publications', 'Books', 'books'],
    ['Virtues & ideas', 'Ideas', ''],
    ['Random detail drill', 'All', 'detail'],
  ] as const;
  return (
    <div className="page">
      <PageTitle title="Study" description="Recall the answer before turning the card." />
      <div className="study-layout">
        <section>
          <div className="library-toolbar">
            <select
              aria-label="Flashcard category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setIndex(0);
                setFlipped(false);
              }}
            >
              {['All', ...new Set(cards.map((c) => c.category))].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <span className="small muted">
              {(index % selected.length) + 1} / {selected.length}
            </span>
            <button
              className="icon-button"
              aria-label="Shuffle flashcards"
              onClick={() => {
                setDeck(shuffle(cards));
                setIndex(0);
                setFlipped(false);
              }}
            >
              <Shuffle size={18} />
            </button>
          </div>
          <button
            className={'flashcard ' + (flipped ? 'flipped' : '')}
            onClick={flip}
            aria-label={flipped ? 'Return to question' : 'Reveal flashcard answer'}
          >
            <div className="eyebrow">
              {card.category} · CHAPTER {roman(card.chapter)}
            </div>

            <h2>{flipped ? card.answer : card.prompt}</h2>
            {flipped ? <p>{card.details}</p> : null}
            <small>
              {flipped ? 'Click to return to the question' : 'Click or press Enter to turn'}
            </small>
          </button>
          {flipped && (
            <div className="flash-source">
              <Source pages={card.sourcePages} />
              <VoiceButton text={card.details} auto />
            </div>
          )}
          <div className="flash-actions">
            <button
              className="button"
              onClick={() => {
                setFlipped(false);
                setIndex((i) => (i + selected.length - 1) % selected.length);
              }}
            >
              <ArrowLeft size={16} />
              Previous
            </button>
            <button className="button" onClick={flip}>
              <RotateCcw size={16} />
              Turn card
            </button>
            <button className="button primary" onClick={change}>
              Next card
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="small muted">Drills record mastery; flashcards are unscored.</p>
        </section>
        <aside className="drill-list">
          <div className="eyebrow">ACTIVE RECALL DRILLS</div>
          {drills.map(([name, cat, type]) => {
            const pool = questions.filter((q) =>
              type === 'order'
                ? q.type === 'order'
                : type === 'books'
                  ? q.category === 'Books' || q.category === 'Publications'
                  : type === 'detail'
                    ? q.difficulty >= 3
                    : q.category === cat,
            );
            return (
              <button
                key={name}
                onClick={() =>
                  start({
                    title: name,
                    pool,
                    count: Math.min(10, pool.length),
                    difficulty: 'NORMAL',
                  })
                }
              >
                <span>
                  {type === 'order' ? (
                    <Shuffle size={21} />
                  ) : cat === 'People' ? (
                    <Users size={21} />
                  ) : (
                    <BookOpen size={21} />
                  )}
                </span>
                <div>
                  <h3>{name}</h3>
                  <small>{pool.length} available questions · 10 per round</small>
                </div>
                <ArrowRight size={16} />
              </button>
            );
          })}
          <div className="panel">
            <div className="eyebrow">DUE FOR REVIEW</div>
            <h3>
              {
                questions.filter(
                  (q) => save.history[q.id] && save.history[q.id].dueAt <= Date.now(),
                ).length
              }{' '}
              questions ready
            </h3>
          </div>
        </aside>
      </div>
    </div>
  );
}
