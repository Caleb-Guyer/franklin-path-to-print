import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Volume2, VolumeX, FastForward } from 'lucide-react';
import { useGame } from './GameContext';
import { Source } from './Common';
import { ReplayVoice, useNarration } from './Voice';
import { dialogueBeats } from '../lib/speech';

export interface DialogueLine {
  speaker: string;
  text: string;
  sourcePages?: number[];
  emphasis?: string;
}
export function portraitColor(name: string) {
  return `hsl(${([...name].reduce((n, c) => n + c.charCodeAt(0), 0) % 70) + 160} 35% 61%)`;
}
function Portrait({ name, talking }: { name: string; talking: boolean }) {
  return (
    <svg
      className={'talk-portrait ' + (talking ? 'talking' : '')}
      viewBox="0 0 40 48"
      aria-hidden="true"
      shapeRendering="crispEdges"
    >
      <path fill={portraitColor(name)} d="M7 32h26v16H7z" />
      <path fill="#eadcb2" d="M17 32h7v16h-7z" />
      <path fill="#dfb38c" d="M12 9h19v21H12zM9 18h4v8H9zM30 19h4v7h-4z" />
      <path
        fill={/Franklin|journal/i.test(name) ? '#dad8c8' : '#887968'}
        d="M9 7h24v5H14v10H8V10h1zM7 20h7v10H7z"
      />
      <g className="portrait-eyes" fill="#192c36">
        <path d="M16 17h5v4h-5zM27 17h5v4h-5zM21 18h6v1h-6z" />
      </g>
      <path fill="#394855" d="M10 30h7v5h-7zM24 30h9v5h-9z" />
      <path className="portrait-mouth" fill="#79504d" d="M22 25h5v2h-5z" />
    </svg>
  );
}
export default function Conversation({
  lines,
  onFinish,
  finishLabel = 'Continue',
  compact = false,
  autoSpeak = true,
}: {
  lines: DialogueLine[];
  onFinish?: () => void;
  finishLabel?: string;
  compact?: boolean;
  autoSpeak?: boolean;
}) {
  const { save, setSave } = useGame();
  const finish = useRef(onFinish);
  finish.current = onFinish;
  const beats = useMemo(
    () => lines.flatMap((line) => dialogueBeats(line.text).map((text) => ({ ...line, text }))),
    [lines],
  );
  const [index, setIndex] = useState(0),
    [shown, setShown] = useState(0);
  const line = beats[Math.min(index, beats.length - 1)];
  const reduced =
    save.settings.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const complete = reduced || shown >= line.text.length;
  function next() {
    if (!complete) {
      setShown(line.text.length);
      return;
    }
    if (index < beats.length - 1) setIndex((i) => i + 1);
    else onFinish?.();
  }
  const voice = useNarration(line.text, line.speaker, autoSpeak, () => {
    setShown(line.text.length);
    if (save.settings.autoDialogue) {
      if (index < beats.length - 1) setIndex((i) => i + 1);
      else if (compact) onFinish?.();
    }
  });
  useEffect(() => {
    if (
      !compact ||
      !complete ||
      (!voice.unavailable && save.settings.narration) ||
      !save.settings.autoDialogue
    )
      return;
    const timer = window.setTimeout(
      () => {
        if (index < beats.length - 1) setIndex((i) => i + 1);
        else finish.current?.();
      },
      Math.max(3500, line.text.length * 35),
    );
    return () => clearTimeout(timer);
  }, [
    compact,
    complete,
    voice.unavailable,
    save.settings.narration,
    save.settings.autoDialogue,
    index,
    beats.length,
    line.text,
  ]);
  useEffect(() => {
    setShown(reduced ? line.text.length : 0);
  }, [line.text, index, reduced]);
  useEffect(() => {
    if (complete) return;
    const delay = /[.!?,;:]/.test(line.text[Math.max(0, shown - 1)]) ? 140 : 24;
    const timer = window.setTimeout(
      () => setShown((n) => Math.min(line.text.length, n + 1)),
      delay,
    );
    return () => clearTimeout(timer);
  }, [shown, line.text, complete]);
  useEffect(() => {
    if (compact) return;
    function key(event: KeyboardEvent) {
      if (
        event.code !== 'Space' ||
        event.target instanceof HTMLButtonElement ||
        event.target instanceof HTMLInputElement
      )
        return;
      event.preventDefault();
      next();
    }
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  let offset = 0;
  return (
    <section
      className={'conversation ' + (compact ? 'compact-conversation' : '')}
      aria-label={`${line.speaker} speaking`}
    >
      <Portrait name={line.speaker} talking={voice.speaking || !complete} />
      <div className="conversation-main">
        <div className="conversation-heading">
          <strong>{line.speaker.replace(/\s*\(paraphrase\)/i, '')}</strong>
          <span>{beats.length > 1 ? `${index + 1} / ${beats.length}` : ''}</span>
        </div>
        <p className="dialogue-text">
          <span className="sr-only">{line.text}</span>
          <span className="typewriter-visual" aria-hidden="true">
            {line.text.split(/(\s+)/).map((word, wi) => {
              const start = offset;
              offset += word.length;
              if (/^\s+$/.test(word)) return word;
              const emphasis =
                line.emphasis
                  ?.toLowerCase()
                  .includes(word.toLowerCase().replace(/[.,;:!?]/g, '')) && word.length > 2;
              return (
                <span className={'talk-word ' + (emphasis ? 'emphasis' : '')} key={wi}>
                  {[...word].map((letter, i) => (
                    <span
                      className={'talk-letter ' + (start + i < shown || reduced ? 'revealed' : '')}
                      style={{ animationDelay: `${(start + i) * -0.065}s` }}
                      key={i}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              );
            })}
          </span>
        </p>
        <div className="conversation-controls">
          <button
            className="voice-button"
            type="button"
            aria-label={save.settings.narration ? 'Mute narration' : 'Enable narration'}
            onClick={() =>
              setSave((s) => ({
                ...s,
                settings: { ...s.settings, narration: !s.settings.narration },
              }))
            }
          >
            {save.settings.narration ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <ReplayVoice play={voice.play} />
          {!compact && beats.length > 1 && (
            <button
              type="button"
              className="dialogue-auto"
              aria-pressed={save.settings.autoDialogue}
              onClick={() =>
                setSave((s) => ({
                  ...s,
                  settings: { ...s.settings, autoDialogue: !s.settings.autoDialogue },
                }))
              }
            >
              {save.settings.autoDialogue ? 'Auto' : 'Hold'}
            </button>
          )}
          {!compact && line.sourcePages && <Source pages={line.sourcePages} />}
          {voice.unavailable && <span className="voice-fallback">Voice unavailable</span>}
          {(!complete || index < beats.length - 1 || onFinish) && (
            <button
              type="button"
              className="dialogue-next"
              onClick={next}
              aria-label={
                !complete
                  ? 'Reveal full line'
                  : index < beats.length - 1
                    ? 'Next line'
                    : finishLabel
              }
            >
              {!complete ? (
                <FastForward size={17} />
              ) : (
                <>
                  {index < beats.length - 1 ? 'Next' : finishLabel}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
