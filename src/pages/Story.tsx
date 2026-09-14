import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  Feather,
  Lock,
  MessageCircle,
  Swords,
} from 'lucide-react';
import { chapters, events } from '../data/chapters';
import { factById } from '../data/facts';
import { questionById } from '../data/questions';
import { useGame } from '../components/GameContext';
import { PageTitle, Progress, Source, roman } from '../components/Common';
import QuestionCard from '../components/QuestionCard';
import type { Event } from '../data/types';
export default function Story({
  startBoss,
  initialChapter,
}: {
  startBoss: (chapter: number) => void;
  initialChapter: number;
}) {
  const { save, setSave } = useGame();
  const [chapterId, setChapterId] = useState(initialChapter);
  const [mapOpen, setMapOpen] = useState(false);
  const chapter = chapters[chapterId - 1];
  const scenes = events.filter((e) => e.chapter === chapterId);
  const [index, setIndex] = useState(() => {
    const ix = events
      .filter((e) => e.chapter === initialChapter)
      .findIndex((e) => !save.completedEvents.includes(e.id));
    return ix < 0 ? 0 : ix;
  });
  const [recalling, setRecalling] = useState(false);
  const [recallIndex, setRecallIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [choiceMode, setChoiceMode] = useState<'actual' | 'personal'>('actual');
  const [dialogue, setDialogue] = useState<number | null>(null);
  const scene = scenes[Math.min(index, scenes.length - 1)];
  useEffect(() => {
    setSave((s) => ({ ...s, unlockedCards: [...new Set([...s.unlockedCards, ...scene.factIds])] }));
  }, [scene.id, setSave, scene.factIds]);
  function selectChapter(id: number) {
    setChapterId(id);
    const ix = events
      .filter((e) => e.chapter === id)
      .findIndex((e) => !save.completedEvents.includes(e.id));
    setIndex(ix < 0 ? 0 : ix);
    resetScene();
    setMapOpen(false);
  }
  function resetScene() {
    setRecalling(false);
    setRecallIndex(0);
    setChoice(null);
    setDialogue(null);
  }
  function changeScene(i: number) {
    setIndex(i);
    resetScene();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  const picked =
    scene.factIds.length > 3
      ? [scene.factIds[0], scene.factIds[Math.floor(scene.factIds.length / 2)]]
      : [scene.factIds[0]];
  const question = { ...questionById['q' + picked[recallIndex].slice(1)] };
  if (question.type === 'choice') {
    question.type = 'recall';
    question.options = undefined;
  }
  function finishRecall() {
    if (recallIndex < picked.length - 1) {
      setRecallIndex(recallIndex + 1);
      return;
    }
    setSave((s) => ({
      ...s,
      xp: s.xp + (s.completedEvents.includes(scene.id) ? 0 : 35),
      completedEvents: [...new Set([...s.completedEvents, scene.id])],
    }));
    setRecalling(false);
    setRecallIndex(0);
    if (index < scenes.length - 1) changeScene(index + 1);
    else startBoss(chapterId);
  }
  return (
    <div className="page story-page">
      <PageTitle
        eyebrow={`CHAPTER ${roman(chapterId)} · ${chapter.place}`}
        title={chapter.title}
        action={
          <button className="button" onClick={() => setMapOpen(!mapOpen)}>
            <Compass size={17} />
            {mapOpen ? 'Close chapter map' : 'Chapter map'}
          </button>
        }
      />
      {mapOpen && (
        <div className="chapter-grid">
          {chapters.map((c) => {
            const done = save.completedChapters.includes(c.id);
            const locked = c.id > save.currentChapter;
            return (
              <button
                key={c.id}
                disabled={locked}
                onClick={() => selectChapter(c.id)}
                className={c.id === chapterId ? 'chapter-tile selected' : 'chapter-tile'}
              >
                <span className="chapter-number">{roman(c.id)}</span>
                <span>
                  <small>{c.era}</small>
                  <strong>{c.title}</strong>
                  <small>
                    {done
                      ? 'Chapter complete'
                      : locked
                        ? 'Complete the preceding trial to unlock'
                        : 'Enter chapter'}
                  </small>
                </span>
                {done ? (
                  <Check size={18} />
                ) : locked ? (
                  <Lock size={15} />
                ) : (
                  <ArrowRight size={17} />
                )}
              </button>
            );
          })}
        </div>
      )}
      <div className="story-layout">
        <aside className="scene-list">
          <div className="eyebrow">THE CHAPTER’S IMPRESSIONS</div>
          {scenes.map((e, i) => (
            <button
              key={e.id}
              disabled={i > 0 && !save.completedEvents.includes(scenes[i - 1].id) && i !== index}
              onClick={() => changeScene(i)}
              className={i === index ? 'selected' : ''}
            >
              <span>
                {save.completedEvents.includes(e.id) ? (
                  <Check size={13} />
                ) : (
                  String(i + 1).padStart(2, '0')
                )}
              </span>
              {e.title}
            </button>
          ))}
          <div className="chapter-progress">
            <span>
              {scenes.filter((e) => save.completedEvents.includes(e.id)).length} / {scenes.length}{' '}
              scenes remembered
            </span>
            <Progress
              value={
                (scenes.filter((e) => save.completedEvents.includes(e.id)).length / scenes.length) *
                100
              }
            />
          </div>
          <button
            className="button compact"
            disabled={!scenes.every((e) => save.completedEvents.includes(e.id))}
            onClick={() => startBoss(chapterId)}
          >
            <Swords size={15} />
            {chapter.boss}
          </button>
        </aside>
        <div className="scene-content" key={scene.id}>
          {recalling ? (
            <div className="recall-scene">
              <div className="recall-banner">
                <Feather size={21} />
                <div>
                  <strong>Recall</strong>
                  <span>
                    {recallIndex + 1} / {picked.length}
                  </span>
                </div>
              </div>
              <QuestionCard
                key={question.id}
                question={question}
                onContinue={finishRecall}
                continueLabel={
                  recallIndex < picked.length - 1
                    ? 'Next question'
                    : index < scenes.length - 1
                      ? 'Continue the story'
                      : 'Enter the chapter trial'
                }
              />
              <button className="text-link" onClick={() => setRecalling(false)}>
                Return to the scene to study
              </button>
            </div>
          ) : (
            <>
              <div className="scene-illustration">
                <img
                  src={`${import.meta.env.BASE_URL}press-room.svg`}
                  alt="An imagined printing room; decorative atmosphere"
                />
                <div>
                  <span className="eyebrow">
                    SCENE {String(index + 1).padStart(2, '0')} /{' '}
                    {String(scenes.length).padStart(2, '0')}
                  </span>
                  <h2>{scene.title}</h2>
                  <span>
                    {scene.era} · {scene.location}
                  </span>
                </div>
              </div>
              <div className="narration">
                <p>{scene.narration}</p>
                <Source pages={scene.sourcePages} />
              </div>
              <div className="scene-facts">
                <div className="eyebrow">EXAMINE THE DETAILS</div>
                {scene.factIds.map((id) => {
                  const f = factById[id];
                  return (
                    <details key={id}>
                      <summary>
                        <span>{f.label}</span>
                        <span className="detail-category">{f.category}</span>
                      </summary>
                      <h3>{f.answer}</h3>
                      <p>{f.details}</p>
                      <Source pages={f.sourcePages} />
                    </details>
                  );
                })}
              </div>
              {scene.decision && (
                <div className="decision-box">
                  <div className="eyebrow">THE CROSSROADS</div>
                  <div className="segmented">
                    <button
                      className={choiceMode === 'actual' ? 'selected' : ''}
                      onClick={() => {
                        setChoiceMode('actual');
                        setChoice(null);
                      }}
                    >
                      What Franklin actually did
                    </button>
                    <button
                      className={choiceMode === 'personal' ? 'selected' : ''}
                      onClick={() => {
                        setChoiceMode('personal');
                        setChoice(null);
                      }}
                    >
                      What I would have done
                    </button>
                  </div>
                  <h3>
                    {choiceMode === 'actual'
                      ? scene.decision.prompt
                      : 'Choose your course at this moment.'}
                  </h3>
                  <p className="small muted">
                    {choiceMode === 'actual'
                      ? 'Predict the action in the source.'
                      : 'Your preference is recorded separately. The historical outcome remains fixed.'}
                  </p>
                  <div className="story-options">
                    {scene.decision.options.map((option, i) => (
                      <button
                        key={option}
                        className={choice === i ? 'selected' : ''}
                        onClick={() => {
                          setChoice(i);
                          if (choiceMode === 'personal')
                            setSave((s) => ({
                              ...s,
                              decisions: { ...s.decisions, [scene.id]: i },
                            }));
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                        <span>{option}</span>
                      </button>
                    ))}
                  </div>
                  {choice !== null && (
                    <div className="story-outcome" aria-live="polite">
                      <strong>
                        {choiceMode === 'personal'
                          ? 'Your choice recorded. Franklin’s actual course:'
                          : choice === scene.decision.actual
                            ? 'You recalled his action.'
                            : 'The source takes a different turn.'}
                      </strong>
                      <p>{scene.decision.outcome}</p>
                      <Source pages={scene.sourcePages} />
                    </div>
                  )}
                </div>
              )}
              {scene.dialogue && (
                <Dialogue scene={scene} selected={dialogue} onSelect={setDialogue} />
              )}
              <div className="scene-footer">
                <button
                  className="button"
                  disabled={index === 0}
                  onClick={() => changeScene(index - 1)}
                >
                  <ArrowLeft size={15} />
                  Previous scene
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    setRecalling(true);
                    setRecallIndex(0);
                    window.scrollTo({ top: 0, behavior: 'instant' });
                  }}
                >
                  Close the page · Recall
                  <ArrowRight size={17} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
function Dialogue({
  scene,
  selected,
  onSelect,
}: {
  scene: Event;
  selected: number | null;
  onSelect: (n: number) => void;
}) {
  const d = scene.dialogue!;
  return (
    <div className="dialogue-box">
      <div className="eyebrow">
        <MessageCircle size={15} />
        DIALOGUE RECONSTRUCTION
      </div>
      <p className="speaker">{d.speaker}</p>
      <blockquote>{d.line}</blockquote>
      <h3>{d.reply}</h3>
      <div className="story-options">
        {d.options.map((x, i) => (
          <button key={x} onClick={() => onSelect(i)} className={selected === i ? 'selected' : ''}>
            {String.fromCharCode(65 + i)}
            <span>{x}</span>
          </button>
        ))}
      </div>
      {selected !== null && (
        <div className="story-outcome" aria-live="polite">
          <strong>
            {selected === d.actual ? 'The meaning is intact.' : 'Revisit the exchange.'}
          </strong>
          <p>{d.significance}</p>
          <p className="small muted">
            All dialogue here is paraphrased from the cited source; it is not a verbatim quotation.
          </p>
          <Source pages={scene.sourcePages} />
        </div>
      )}
    </div>
  );
}
