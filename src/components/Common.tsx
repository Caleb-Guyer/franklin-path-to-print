import { useEffect, useRef, type ReactNode } from 'react';
import { X, ExternalLink, BookOpen, ArrowLeft, ArrowRight } from 'lucide-react';
import { useGame } from './GameContext';
export const roman = (n: number) =>
  ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n - 1] ?? String(n);
export function Source({ pages }: { pages: number[] }) {
  const { source } = useGame();
  return (
    <button className="source-link" onClick={() => source(pages)}>
      <BookOpen size={12} /> PDF {pages.length === 1 ? 'p.' : 'pp.'} {pages.join(', ')}{' '}
      <ExternalLink size={10} />
    </button>
  );
}
export function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-title">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="progress-track"
      role="progressbar"
      aria-label={label ?? 'Progress'}
      aria-valuenow={Math.round(Math.max(0, Math.min(100, value)))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
export function Dialog({
  children,
  title,
  onClose,
  wide = false,
}: {
  children: ReactNode;
  title: string;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      className={'modal ' + (wide ? 'wide' : '')}
      aria-label={title}
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Close dialog">
          <X />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function SourceViewer({
  pages,
  index,
  setIndex,
  onClose,
}: {
  pages: number[];
  index: number;
  setIndex: (n: number) => void;
  onClose: () => void;
}) {
  const page = pages[index];
  return (
    <Dialog wide title={`The original scan · PDF page ${page} of 27`} onClose={onClose}>
      <div className="source-toolbar">
        <button
          className="button compact"
          onClick={() => setIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          <ArrowLeft size={14} />
          Previous reference
        </button>
        <a
          className="button compact"
          href={`${import.meta.env.BASE_URL}source/Franklin-Part-One.pdf#page=${page}`}
          target="_blank"
          rel="noreferrer"
        >
          Open PDF
          <ExternalLink size={14} />
        </a>
        <button
          className="button compact"
          onClick={() => setIndex(Math.min(pages.length - 1, index + 1))}
          disabled={index === pages.length - 1}
        >
          Next reference
          <ArrowRight size={14} />
        </button>
      </div>
      <p className="small muted">
        References use the PDF’s 27 scanned spreads, which contain printed pages 1–53. Click the
        scan to open it at full size.
      </p>
      <a
        href={`${import.meta.env.BASE_URL}source/franklin-${String(page).padStart(2, '0')}.jpg`}
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="source-image"
          src={`${import.meta.env.BASE_URL}source/franklin-${String(page).padStart(2, '0')}.jpg`}
          alt={`Original scanned PDF spread ${page}`}
        />
      </a>
    </Dialog>
  );
}
