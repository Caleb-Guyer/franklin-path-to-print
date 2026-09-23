import { useEffect, useRef, useState } from 'react';
import { ArrowRight, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { speak } from '../lib/speech';
import type { Line, SourceRef } from './data';

export function DouglassPortrait({
  speaker,
  talking = false,
}: {
  speaker: string;
  talking?: boolean;
}) {
  const colonel = speaker.includes('Lloyd');
  return (
    <svg
      viewBox="0 0 80 96"
      className={`d-portrait ${talking ? 'talking' : ''}`}
      aria-hidden="true"
    >
      <path d="M6 96V77q5-20 34-20t34 20v19" fill={colonel ? '#5b6570' : '#395c60'} />
      <path d="M31 59h18l-4 37H36z" fill="#d8d3b9" />
      <path
        d="M24 25q0-21 17-21t20 21v23q-4 21-19 22-18-3-19-22z"
        fill={colonel ? '#c39c7e' : '#a87955'}
      />
      <path
        d={
          colonel
            ? 'M20 24Q15 4 40 5q23-2 24 24l-10-12-19 5-7 20h-8z'
            : 'M18 42Q7 17 29 7q17-8 30 7 12 7 6 32l-9-14-4-17-14 10-13-2-1 20z'
        }
        fill={colonel ? '#bfbdaf' : '#182c35'}
      />
      <path d="M27 38h8v3h-8m18-3h8v3h-8" fill="#1a2c32" />
      <path d="M38 42v8h6" stroke="#74523d" strokeWidth="2" fill="none" />
      <path className="d-mouth" d="M34 56h14v2H34z" fill="#563e35" />
      <path d="M31 65l10 10-11 8-12-15m32-3-9 10 11 8 11-15" fill="#213c43" />
    </svg>
  );
}
export default function Dialogue({
  line,
  index,
  total,
  voice,
  reduced,
  onVoice,
  onNext,
  onSource,
}: {
  line: Line;
  index: number;
  total: number;
  voice: boolean;
  reduced: boolean;
  onVoice: () => void;
  onNext: () => void;
  onSource: (refs: SourceRef[]) => void;
}) {
  const [shown, setShown] = useState(0),
    [talking, setTalking] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const stop = useRef<() => void>(() => {});
  const complete = reduced || shown >= line.text.length;
  const play = () => {
    stop.current();
    setUnavailable(false);
    stop.current = speak(line.text, {
      speaker: line.speaker,
      onStart: () => setTalking(true),
      onEnd: () => {
        setTalking(false);
        setShown(line.text.length);
      },
      onError: () => {
        setTalking(false);
        setUnavailable(true);
      },
    });
  };
  useEffect(() => {
    setShown(0);
  }, [line]);
  useEffect(() => {
    setTalking(false);
    if (voice) play();
    return () => stop.current();
  }, [line, voice]);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        stop.current();
        setTalking(false);
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => document.removeEventListener('visibilitychange', hidden);
  }, []);
  useEffect(() => {
    if (complete) return;
    const timer = window.setInterval(() => setShown((n) => Math.min(line.text.length, n + 2)), 28);
    return () => clearInterval(timer);
  }, [line, complete]);
  const next = () => {
    if (!complete) setShown(line.text.length);
    else {
      stop.current();
      onNext();
    }
  };
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Enter' && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        nextRef.current();
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  return (
    <section className="d-dialogue" aria-label="Story dialogue">
      <DouglassPortrait speaker={line.speaker} talking={talking || !complete} />
      <div className="d-dialogue-body">
        <div className="d-speaker">
          <strong>{line.speaker}</strong>
          <span>
            {index + 1} / {total}
          </span>
        </div>
        <p className="d-spoken-line" aria-label={line.text}>
          {[...line.text].map((char, i) => (
            <span
              aria-hidden="true"
              key={i}
              className={`d-letter ${reduced || i < shown ? 'shown' : ''}`}
              style={{ animationDelay: `${(i % 7) * 35}ms` }}
            >
              {char}
            </span>
          ))}
        </p>
        <div className="d-dialogue-actions">
          <button className="d-source-link" onClick={() => onSource(line.refs)}>
            {line.exact ? 'Original wording' : 'Source paraphrase'} · Ch.{' '}
            {line.refs[0].split('.')[0]}
          </button>
          <button aria-label="Replay dialogue" onClick={play}>
            <RotateCcw size={15} />
          </button>
          <button aria-label={voice ? 'Mute dialogue' : 'Enable dialogue'} onClick={onVoice}>
            {voice ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {unavailable && <span className="d-fallback">Voice unavailable</span>}
          <button
            className="d-next-line"
            onClick={next}
            aria-label={
              complete
                ? index + 1 === total
                  ? 'Back to mission'
                  : 'Next line'
                : 'Reveal full line'
            }
          >
            {complete ? (index + 1 === total ? 'Continue' : 'Next') : 'Reveal'}
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </section>
  );
}
