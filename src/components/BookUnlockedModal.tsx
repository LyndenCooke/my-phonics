import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, ChevronRight, X, BookOpen } from 'lucide-react';
import { LEVELS } from '@/lib/types';

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

interface BookUnlockedModalProps {
  open: boolean;
  onClose: () => void;
  onContinue: () => void;
  title: string;
  level: number;
  coverUrl: string | null;
  /** Optional subtitle below the book card */
  subtitle?: string;
  /** Label for the CTA button */
  ctaLabel?: string;
}

export default function BookUnlockedModal({
  open,
  onClose,
  onContinue,
  title,
  level,
  coverUrl,
  subtitle,
  ctaLabel = 'Continue to Library',
}: BookUnlockedModalProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const levelInfo = LEVELS.find(l => l.level === level);

  useEffect(() => {
    if (open) {
      // Lock body scroll while the modal is up so a tap on the backdrop
      // doesn't accidentally scroll the long results page underneath
      // before the parent has seen the book.
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => setAnimateIn(true), 50);
      return () => {
        clearTimeout(t);
        document.body.style.overflow = prevOverflow;
      };
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  if (!open) return null;

  // Render into document.body via portal so no ancestor with transform /
  // filter / contain can break `position: fixed`. Without this, on some
  // mobile layouts the modal anchored below the fold of a long results
  // page and parents saw only the grey backdrop.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[max(1rem,env(safe-area-inset-top))] sm:items-center sm:pt-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        style={{ opacity: animateIn ? 1 : 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-card rounded-3xl shadow-2xl max-w-sm w-full max-h-[calc(100dvh-2rem)] overflow-y-auto overflow-x-hidden transition-all duration-500 my-auto"
        style={{
          opacity: animateIn ? 1 : 0,
          transform: animateIn ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Confetti header */}
        <div className={`${LEVEL_COLORS[level]} px-6 pt-6 pb-4 text-center text-white`}>
          <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wide">Book Unlocked!</span>
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Your free book is ready
          </h2>
          <p className="text-sm opacity-90 mt-1">
            Level {level} — {levelInfo?.name}
          </p>
        </div>

        {/* Book cover */}
        <div className="px-6 -mt-2 mb-4">
          <div className="relative rounded-2xl overflow-hidden shadow-lg border-4 border-white bg-white mx-auto max-w-[200px]"
            style={{ transform: animateIn ? 'translateY(0)' : 'translateY(30px)', transition: 'transform 0.6s ease-out 0.2s' }}
          >
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={title}
                className="w-full aspect-[3/4] object-cover"
              />
            ) : (
              <div className={`w-full aspect-[3/4] flex items-center justify-center ${LEVEL_COLORS[level]} text-white`}>
                <BookOpen className="w-12 h-12 opacity-70" />
              </div>
            )}
          </div>
          <p className="text-center font-bold text-foreground text-lg mt-3">{title}</p>
          {subtitle && (
            <p className="text-center text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        {/* CTA */}
        <div className="px-6 pb-6">
          <button
            onClick={onContinue}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl ${LEVEL_COLORS[level]} text-white font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200`}
          >
            {ctaLabel} <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
