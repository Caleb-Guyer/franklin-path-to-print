import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Clock, Pause, Play, ArrowRight, X } from 'lucide-react';
import type { Question } from '../data/types';
import { shuffle, recordAnswer, sound, type AnswerRecord } from '../lib/game';
import { multipleChoice } from '../lib/choices';
import { useGame } from './GameContext';
import { Source } from './Common';
import { VoiceButton } from './Voice';

export default function QuestionCard({
  question,
  onResolved,
  onContinue,
  continueLabel = 'Next question',
  timed = false,
  initialAnswer,
}: {
  question: Question;
  onResolved?: (a: AnswerRecord) => void;
  onContinue?: () => void;
  continueLabel?: string;
  timed?: boolean;
  initialAnswer?: AnswerRecord;
}) {
  const q = useMemo(() => multipleChoice(question), [question]);
  const { save, setSave } = useGame();
  const [result, setResult] = useState<AnswerRecord | null>(initialAnswer ?? null);
  const [paused, setPaused] = useState(false),
    [seconds, setSeconds] = useState(45);
  const [options] = useState(() => shuffle(q.options ?? []));
  const resolved = useRef(!!initialAnswer);
  function commit(response: string) {
    if (resolved.current || paused) return;
    resolved.current = true;
    const correct = response === q.answer;
    const a: AnswerRecord = {
      questionId: q.id,
      response,
      correct,
      confidence: 2,
      prompt: q.prompt,
      answer: q.answer,
    };
    setResult(a);
    setSave((s) => recordAnswer(s, question, correct, 2));
    sound(save.settings.sound, correct);
    onResolved?.(a);
  }
  const commitRef = useRef(commit);
  commitRef.current = commit;
  useEffect(() => {
    if (!timed || result || paused) return;
    const timer = window.setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [timed, result, paused]);
  useEffect(() => {
    if (timed && seconds === 0) commitRef.current('[Time expired]');
  }, [seconds, timed]);
  useEffect(() => {
    if (result || paused) return;
    const key = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.repeat
      )
        return;
      const i = Number(e.key) - 1;
      if (i >= 0 && i < options.length) {
        e.preventDefault();
        commitRef.current(options[i]);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [result, paused, options]);
  const spokenQuestion = `${q.prompt} ${options.map((o, i) => `${String.fromCharCode(65 + i)}. ${o}.`).join(' ')}`;
  return (
    <article
      className={`question-card ${result ? (result.correct ? 'answered correct' : 'answered incorrect') : ''}`}
    >
      <div className="question-meta">
        <span className="tag">{q.category}</span>
        <VoiceButton text={spokenQuestion} auto={!result && !paused} />
        {timed && !result && (
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
      {!result && (
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="answer-options" role="radiogroup" aria-label="Answer">
            {options.map((option, i) => (
              <button
                type="button"
                role="radio"
                aria-checked={false}
                key={option}
                disabled={paused}
                onClick={() => commit(option)}
              >
                <span>{String.fromCharCode(65 + i)}</span>
                <span className="answer-option-text">{option}</span>
              </button>
            ))}
          </div>
          {paused && <p className="small muted">Timer paused.</p>}
        </form>
      )}
      {result && (
        <div className="answer-reveal" aria-live="polite">
          <div className="feedback-title">
            {result.correct ? <Check size={20} /> : <X size={20} />}
            <strong>{result.correct ? 'Correct' : 'Incorrect'}</strong>
            {!result.correct && <span>Added to the Trouble List</span>}
            <VoiceButton
              key="answer"
              text={`${result.correct ? 'Correct.' : 'The answer is'} ${q.answer}. ${q.explanation}`}
              auto
            />
          </div>
          <h3>{q.answer}</h3>
          <p>{q.explanation}</p>
          <Source pages={q.sourcePages} />
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
