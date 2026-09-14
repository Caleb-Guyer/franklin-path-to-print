import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock,
  GripVertical,
  Pause,
  Play,
  ArrowRight,
  RotateCcw,
  X,
} from 'lucide-react';
import type { Question } from '../data/types';
import { grade, shuffle, recordAnswer, sound, type AnswerRecord } from '../lib/game';
import { useGame } from './GameContext';
import { Source } from './Common';
const typeLabels = {
  recall: 'Active recall',
  blank: 'Fill the blank',
  person: 'Identify the person',
  place: 'Identify the place',
  reason: 'Explain it from memory',
  choice: 'Choose the accurate answer',
  boolean: 'True or false / Yes or no',
  order: 'Rebuild the chronology',
  match: 'Connect the details',
};
export default function QuestionCard({
  question: q,
  onResolved,
  onContinue,
  continueLabel = 'Next question',
  timed = false,
}: {
  question: Question;
  onResolved?: (a: AnswerRecord) => void;
  onContinue?: () => void;
  continueLabel?: string;
  timed?: boolean;
}) {
  const { save, setSave } = useGame();
  const [input, setInput] = useState('');
  const [confidence, setConfidence] = useState(2);
  const [result, setResult] = useState<AnswerRecord | null>(null);
  const [compare, setCompare] = useState(false);
  const [paused, setPaused] = useState(false);
  const [seconds, setSeconds] = useState(
    q.type === 'order' || q.type === 'match' || q.type === 'reason' ? 90 : 45,
  );
  const [sequence, setSequence] = useState(() => {
    const a = shuffle(q.sequence ?? []);
    return a.join() === q.sequence?.join() ? a.reverse() : a;
  });
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [options] = useState(() => shuffle(q.options ?? []));
  const [matchOptions] = useState(() => shuffle(q.pairs?.map((p) => p[1]) ?? []));
  const dragging = useRef<number | null>(null);
  const resolved = useRef(false);
  const focusRef = useRef<HTMLInputElement>(null);
  function commit(correct: boolean, selfAssessed = false, responseOverride?: string) {
    if (resolved.current) return;
    resolved.current = true;
    const response =
      responseOverride ??
      (q.type === 'order'
        ? sequence.join('||')
        : q.type === 'match'
          ? JSON.stringify(pairs)
          : input);
    const a = { questionId: q.id, response, correct, confidence, selfAssessed };
    setResult(a);
    setCompare(false);
    setSave((s) => recordAnswer(s, q, correct, confidence));
    sound(save.settings.sound, correct);
    onResolved?.(a);
  }
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(() => {
    if (!timed || result || compare || paused) return;
    const id = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [timed, result, compare, paused]);
  useEffect(() => {
    if (timed && seconds === 0 && !resolved.current)
      commitRef.current(false, false, '[Time expired]');
  }, [seconds, timed]);
  useEffect(() => {
    focusRef.current?.focus({ preventScroll: true });
  }, []);
  function submit() {
    const response =
      q.type === 'order' ? sequence.join('||') : q.type === 'match' ? JSON.stringify(pairs) : input;
    const correct = grade(q, response);
    if (!correct && ['recall', 'blank', 'person', 'place', 'reason'].includes(q.type)) {
      setCompare(true);
    } else commit(correct);
  }
  function move(from: number, to: number) {
    if (to < 0 || to >= sequence.length || from === to) return;
    setSequence((xs) => {
      const a = [...xs];
      const [item] = a.splice(from, 1);
      a.splice(to, 0, item);
      return a;
    });
  }
  const ready =
    q.type === 'order' || q.type === 'match'
      ? q.type === 'order' || q.pairs?.every(([k]) => pairs[k])
      : input.trim().length > 0;
  return (
    <article
      className={`question-card ${result ? (result.correct ? 'answered correct' : 'answered incorrect') : ''}`}
    >
      <div className="question-meta">
        <span className="eyebrow">{typeLabels[q.type]}</span>
        <span className="tag">{q.category}</span>
        {timed && !result && !compare && (
          <div className={'timer ' + (seconds < 11 ? 'urgent' : '')}>
            <Clock size={14} />
            {seconds}s
            <button
              aria-label={paused ? 'Resume timer' : 'Pause timer'}
              className="icon-button"
              onClick={() => setPaused(!paused)}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          </div>
        )}
      </div>
      <h2>{q.prompt}</h2>
      {!result && !compare && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (ready && !paused) submit();
          }}
        >
          {q.type === 'order' ? (
            <div className="order-list">
              <p className="small muted">Drag to reorder, or use the up and down buttons.</p>
              {sequence.map((title, i) => (
                <div
                  key={title}
                  className="order-item"
                  draggable={!paused}
                  onDragStart={() => (dragging.current = i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragging.current !== null) move(dragging.current, i);
                    dragging.current = null;
                  }}
                >
                  <GripVertical size={17} />
                  <span className="order-number">{i + 1}</span>
                  <span>{title}</span>
                  <div>
                    <button
                      type="button"
                      aria-label={`Move ${title} up`}
                      disabled={i === 0 || paused}
                      onClick={() => move(i, i - 1)}
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Move ${title} down`}
                      disabled={i === sequence.length - 1 || paused}
                      onClick={() => move(i, i + 1)}
                    >
                      <ArrowDown size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : q.type === 'match' ? (
            <div className="matching-list">
              {q.pairs?.map(([label]) => (
                <label key={label}>
                  <span>{label}</span>
                  <select
                    aria-label={'Match ' + label}
                    disabled={paused}
                    value={pairs[label] ?? ''}
                    onChange={(e) => setPairs({ ...pairs, [label]: e.target.value })}
                  >
                    <option value="">Choose a connection</option>
                    {matchOptions.map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          ) : q.type === 'choice' || q.type === 'boolean' ? (
            <div className="answer-options" role="radiogroup" aria-label="Answer">
              {options.map((option, i) => (
                <button
                  type="button"
                  role="radio"
                  aria-checked={input === option}
                  className={input === option ? 'selected' : ''}
                  key={option}
                  disabled={paused}
                  onClick={() => setInput(option)}
                >
                  <span>{String.fromCharCode(65 + i)}</span>
                  {option}
                  {input === option && <Check size={17} />}
                </button>
              ))}
            </div>
          ) : q.type === 'reason' ? (
            <label className="answer-label">
              Your answer, in your own words
              <textarea
                disabled={paused}
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                rows={3}
                placeholder="Bring the detail back from memory…"
              />
            </label>
          ) : (
            <label className="answer-label">
              {q.type === 'blank' ? 'Complete the missing detail' : 'Write what you remember'}
              <input
                ref={focusRef}
                disabled={paused}
                autoComplete="off"
                spellCheck={false}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={q.type === 'blank' ? '________________' : 'Your answer…'}
              />
            </label>
          )}
          <div className="answer-footer">
            <fieldset className="confidence">
              <legend>How sure are you?</legend>
              {['Guessing', 'Somewhat', 'Certain'].map((x, i) => (
                <button
                  key={x}
                  type="button"
                  className={confidence === i + 1 ? 'selected' : ''}
                  onClick={() => setConfidence(i + 1)}
                  aria-pressed={confidence === i + 1}
                >
                  {x}
                </button>
              ))}
            </fieldset>
            <button className="button primary" disabled={!ready || paused} type="submit">
              Commit answer
              <ArrowRight size={16} />
            </button>
          </div>
          {paused && <p className="small muted">Timer paused. Resume when you’re ready.</p>}
        </form>
      )}
      {compare && (
        <div className="compare-panel" aria-live="polite">
          <div className="eyebrow">COMPARE YOUR RECALL</div>
          <p className="your-response">You wrote: “{input}”</p>
          <h3>{q.answer}</h3>
          <p>{q.explanation}</p>
          <Source pages={q.sourcePages} />
          <p className="small muted">
            Names and dates use exact answers and listed alternatives. For explanations or different
            wording, compare your answer with the source-backed answer above. This is a self-check,
            not AI grading.
          </p>
          <div className="button-row">
            <button className="button" onClick={() => commit(false, true)}>
              <RotateCcw size={16} />I missed this
            </button>
            <button className="button primary" onClick={() => commit(true, true)}>
              <Check size={16} />
              My answer means the same
            </button>
          </div>
        </div>
      )}
      {result && (
        <div className="answer-reveal" aria-live="polite">
          <div className="feedback-title">
            {result.correct ? <Check size={20} /> : <X size={20} />}
            <strong>{result.correct ? 'Impression made.' : 'Back to the composing stone.'}</strong>
            <span>
              {result.correct ? 'Knowledge strengthened' : 'Added to Franklin’s Trouble List'}
            </span>
          </div>
          <h3>
            {q.type === 'order'
              ? 'The correct sequence'
              : q.type === 'match'
                ? 'The correct connections'
                : q.answer}
          </h3>
          {q.type === 'order' && (
            <ol>
              {q.sequence?.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ol>
          )}
          {q.type === 'match' && (
            <dl className="match-reveal">
              {q.pairs?.map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          )}
          <p>{q.explanation}</p>
          <Source pages={q.sourcePages} />
          {result.selfAssessed && (
            <span className="small muted"> · Self-assessed after comparison</span>
          )}
          {onContinue && (
            <button autoFocus className="button primary next-answer" onClick={onContinue}>
              {continueLabel}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      )}
    </article>
  );
}
