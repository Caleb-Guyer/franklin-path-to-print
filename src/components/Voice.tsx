import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { useGame } from './GameContext';
import { speak, speechAvailable } from '../lib/speech';

export function useNarration(text: string, speaker = 'Narrator', auto = false, onEnd?: () => void) {
  const { save } = useGame();
  const [speaking, setSpeaking] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  const stop = useRef<() => void>(() => {}),
    ended = useRef(onEnd);
  ended.current = onEnd;
  useEffect(() => {
    const stopped = (event: Event) => {
      if (!(event as CustomEvent<boolean>).detail) setSpeaking(false);
    };
    const hidden = () => {
      if (document.hidden) {
        stop.current();
        setSpeaking(false);
      }
    };
    window.addEventListener('franklin-speech', stopped);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('franklin-speech', stopped);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  const play = useCallback(() => {
    stop.current();
    setUnavailable(false);
    stop.current = speak(text, {
      speaker,
      onStart: () => setSpeaking(true),
      onEnd: () => {
        setSpeaking(false);
        ended.current?.();
      },
      onError: () => {
        setSpeaking(false);
        setUnavailable(true);
      },
    });
  }, [text, speaker]);
  useEffect(() => {
    setSpeaking(false);
    setUnavailable(!speechAvailable());
    if (
      auto &&
      save.settings.narration &&
      (!navigator.userActivation || navigator.userActivation.hasBeenActive)
    )
      play();
    return () => {
      stop.current();
    };
  }, [text, speaker, auto, save.settings.narration, play]);
  function halt() {
    stop.current();
    setSpeaking(false);
  }
  return { play, halt, speaking, unavailable };
}
export function VoiceButton({
  text,
  speaker = 'Narrator',
  auto = false,
}: {
  text: string;
  speaker?: string;
  auto?: boolean;
}) {
  const voice = useNarration(text, speaker, auto);
  return (
    <span className="voice-control">
      <button
        type="button"
        className="voice-button"
        aria-label={voice.speaking ? 'Stop reading' : 'Read aloud'}
        onClick={voice.speaking ? voice.halt : voice.play}
      >
        {voice.speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      {voice.unavailable && <small>Voice unavailable in this browser.</small>}
    </span>
  );
}
export function ReplayVoice({ play }: { play: () => void }) {
  return (
    <button type="button" className="voice-button" aria-label="Replay this line" onClick={play}>
      <RotateCcw size={16} />
    </button>
  );
}
