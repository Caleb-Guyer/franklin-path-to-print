import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { freshSave, parseSave, SAVE_KEY, type Save } from '../lib/game';
interface Context {
  save: Save;
  setSave: Dispatch<SetStateAction<Save>>;
  source: (pages: number[]) => void;
  reset: () => void;
  storageError: string;
}
const GameContext = createContext<Context | null>(null);
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('Game context unavailable');
  return ctx;
}
export function GameProvider({
  children,
  onSource,
  onReset,
}: {
  children: ReactNode;
  onSource: (p: number[]) => void;
  onReset: () => void;
}) {
  const [storageError, setStorageError] = useState('');
  const [save, setSave] = useState<Save>(() => {
    try {
      return parseSave(localStorage.getItem(SAVE_KEY));
    } catch {
      return freshSave();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      setStorageError('');
    } catch {
      setStorageError(
        'This browser cannot save progress. Keep this tab open, or export your save from Settings.',
      );
    }
    document.documentElement.classList.toggle('reduce-motion', save.settings.reducedMotion);
    document.documentElement.classList.toggle('large-text', save.settings.largeText);
  }, [save]);
  return (
    <GameContext.Provider value={{ save, setSave, source: onSource, reset: onReset, storageError }}>
      {children}
    </GameContext.Provider>
  );
}
