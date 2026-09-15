import { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Volume2,
  Eye,
  Clock,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Check,
  Lock,
} from 'lucide-react';
import { useGame } from '../components/GameContext';
import { PageTitle, Source } from '../components/Common';
import { achievementDefinitions, parseSave, sound } from '../lib/game';
import { questions } from '../data/questions';
import { facts } from '../data/facts';
import { events } from '../data/chapters';
export default function Settings() {
  const { save, setSave, reset, source } = useGame();
  const [fileError, setFileError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function exportSave() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = 'franklin-save.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <div className="page">
      <PageTitle title="Settings & the source" />
      <div className="settings-grid">
        <section className="panel">
          <div className="eyebrow">YOUR EXPERIENCE</div>
          {(
            [
              [
                'music',
                'Game audio',
                'Original music and movement effects while you play.',
                Volume2,
              ],
              [
                'narration',
                'Spoken dialogue',
                'Read conversations, page memories and questions aloud.',
                Volume2,
              ],
              [
                'autoDialogue',
                'Auto-advance dialogue',
                'Move to the next short line when the voice finishes.',
                BookOpen,
              ],
              ['sound', 'Subtle sound effects', 'Play a tone after each answer.', Volume2],
              [
                'reducedMotion',
                'Reduce motion',
                'Remove decorative movement and transitions.',
                Eye,
              ],
              [
                'timed',
                'Timed quiz rounds',
                '45 seconds per question. Pause during a round.',
                Clock,
              ],
              [
                'largeText',
                'Larger reading text',
                'Increase story and answer text for comfortable reading.',
                BookOpen,
              ],
            ] as const
          ).map(([key, title, desc, Icon]) => (
            <label className="setting-row" key={key}>
              <Icon size={20} />
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <input
                type="checkbox"
                role="switch"
                checked={save.settings[key]}
                onChange={(e) => {
                  setSave({ ...save, settings: { ...save.settings, [key]: e.target.checked } });
                  if (key === 'sound') sound(e.target.checked);
                }}
              />
            </label>
          ))}
        </section>
        <section className="panel">
          <div className="eyebrow">YOUR SAVE</div>
          <h2>Kept on this device.</h2>
          <p>
            Progress saves automatically in this browser. Export a copy before clearing browser data
            or changing devices. Only one save is active at a time.
          </p>
          <div className="button-row">
            <button className="button" onClick={exportSave}>
              <Download size={16} />
              Export save
            </button>
            <button className="button" onClick={() => input.current?.click()}>
              <Upload size={16} />
              Import save
            </button>
          </div>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const text = await f.text();
                const raw = JSON.parse(text);
                if (
                  raw.version !== 1 ||
                  typeof raw.xp !== 'number' ||
                  !Array.isArray(raw.unlockedCards) ||
                  typeof raw.history !== 'object'
                )
                  throw new Error('invalid');
                const parsed = parseSave(text);
                setSave(parsed);
                setFileError('Save imported. Your progress is restored.');
              } catch {
                setFileError(
                  'This file is not a valid Franklin save. Your current progress is unchanged.',
                );
              }
              e.target.value = '';
            }}
          />
          {fileError && (
            <p className="status-message" role="status">
              {fileError}
            </p>
          )}
          <div className="reset-area">
            <h3>Start with a clean page</h3>
            <p className="small muted">
              Reset removes the current journey, XP, cards, achievements, question history and
              scores. You will confirm before it happens.
            </p>
            <button className="button danger" onClick={reset}>
              <RotateCcw size={16} />
              Reset save
            </button>
          </div>
        </section>
        <section className="panel source-audit">
          <div className="eyebrow">
            <ShieldCheck size={15} />
            THE CANONICAL SOURCE
          </div>
          <h2>27 scans. One source.</h2>
          <p>
            All factual content comes from the supplied <em>Franklin Part 1.pdf</em>: 27 image-based
            spreads containing printed pages 1–53. Every spread was visually inspected before
            content was written. Scanned highlights and marginal marks are not game instructions.
          </p>
          <p>
            References use PDF spread numbers. Dialogue is labeled paraphrase; atmosphere and
            artwork are imaginative. Platforming routes, ink creatures and movement abilities are
            playful inventions; collected pages and conversations use the source. Uncertain dates
            and reports remain qualified. The thirteen-virtue program from outside this excerpt is
            not included.
          </p>
          <div className="source-stat-line">
            <span>{questions.length} questions</span>
            <span>{facts.length} cards</span>
            <span>{events.length} scenes</span>
            <span>12 chapters</span>
          </div>
          <div className="page-scan-grid">
            {Array.from({ length: 27 }, (_, i) => (
              <button key={i} onClick={() => source([i + 1])}>
                {String(i + 1).padStart(2, '0')}
                <Check size={11} />
              </button>
            ))}
          </div>
          <Source pages={Array.from({ length: 27 }, (_, i) => i + 1)} />
          <a
            className="text-link"
            href={`${import.meta.env.BASE_URL}source/Franklin-Part-One.pdf`}
            target="_blank"
            rel="noreferrer"
          >
            <BookOpen size={15} />
            Open the complete PDF
          </a>
        </section>
        <section className="panel achievements">
          <div className="eyebrow">THE HONORS OF YOUR TRADE</div>
          <h2>Achievements</h2>
          {achievementDefinitions.map(([id, title, description]) => (
            <div
              key={id}
              className={save.achievements.includes(id) ? 'achievement earned' : 'achievement'}
            >
              <span>
                {save.achievements.includes(id) ? <Check size={18} /> : <Lock size={16} />}
              </span>
              <div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
