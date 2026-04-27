/**
 * ChildHomeScreen — the simplified library shown when AppMode = 'child'.
 *
 * Replaces the standard book grid for kids with a focus-led layout:
 *  - Hero "Continue Reading" card pointing at the most-recently-read book
 *    (or the first unlocked book if none has been opened yet).
 *  - Stamp progress for that book — visible "X of 5" so the child sees
 *    the goal.
 *  - Their current sounds (focus sounds of that book).
 *  - Below: a horizontal carousel of every other book the child can open,
 *    so they can flip through.
 *
 * Routes around the upsell + admin + checkout flows that live in the
 * parent-mode library: locked books are filtered out entirely so kids
 * never hit a paywall mid-reading.
 */
import { useMemo } from 'react';
import { Sparkles, ChevronRight, Lock } from 'lucide-react';
import type { Book } from '@/lib/types';
import { LEVELS } from '@/lib/types';
import { getAllStamps, MAX_STAMPS } from '@/lib/stamps';
import { getCoverImageUrl } from '@/lib/imageResolver';

interface Props {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

export default function ChildHomeScreen({ books, onBookSelect }: Props) {
  const unlocked = useMemo(() => books.filter(b => b.unlocked), [books]);
  const stamps = useMemo(() => getAllStamps(), []);

  // Most-recently-read book = the one with the latest lastReadDate. Fall back
  // to the first unlocked book if no stamps yet.
  const continueBook = useMemo<Book | null>(() => {
    let best: { book: Book; date: string } | null = null;
    for (const b of unlocked) {
      const s = stamps[b.subLevel];
      if (s && s.lastReadDate) {
        if (!best || s.lastReadDate > best.date) best = { book: b, date: s.lastReadDate };
      }
    }
    if (best) return best.book;
    // No reads yet: pick the lowest-level unlocked book to start.
    const sorted = [...unlocked].sort((a, b) => a.sortOrder - b.sortOrder);
    return sorted[0] ?? null;
  }, [unlocked, stamps]);

  const continueStamps = continueBook ? (stamps[continueBook.subLevel]?.count ?? 0) : 0;

  // Carousel = every book EXCEPT the continue card. Locked books are kept
  // (rendered greyed with a lock icon) so the child sees the curriculum they
  // are working toward — taps on locked books bounce harmlessly without
  // opening the parent upsell modal.
  const otherBooks = useMemo(
    () => books.filter(b => b.id !== continueBook?.id).sort((a, b) => a.sortOrder - b.sortOrder),
    [books, continueBook]
  );

  if (!continueBook) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-xl mx-auto text-center">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-display text-xl font-extrabold text-foreground">No books yet!</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Ask a grown-up to unlock your first book.
          </p>
        </div>
      </div>
    );
  }

  const levelInfo = LEVELS.find(l => l.level === continueBook.level);
  const coverUrl = getCoverImageUrl(continueBook.subLevel, continueBook.coverImageUrl);

  return (
    <div className="px-4 pt-5 pb-24 max-w-3xl mx-auto" style={{ fontFamily: "'Andika', sans-serif" }}>
      {/* ── Hero: Continue Reading ── */}
      <button
        onClick={() => onBookSelect(continueBook)}
        className="w-full text-left rounded-3xl border-4 border-primary bg-gradient-to-br from-tint-pink to-white p-5 md:p-6 shadow-2xl active:scale-[0.99] hover:shadow-xl transition-all duration-200 mb-6"
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
          {coverUrl && (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg shrink-0">
              <img src={coverUrl} alt={continueBook.title} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs md:text-sm font-bold text-primary-ink uppercase tracking-wider mb-1">
              {continueStamps > 0 ? "Let's keep reading!" : "Let's read!"}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-1.5">
              {continueBook.title}
            </h2>
            <p className={`text-sm md:text-base font-semibold ${levelInfo?.colorClass ?? 'text-primary-ink'} mb-3`}>
              Level {continueBook.level} · {levelInfo?.name ?? ''}
            </p>

            {/* Stamps row — 5 dots, filled = earned */}
            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-3">
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-colors ${
                    i < continueStamps ? `bg-level-${continueBook.level}` : 'bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs md:text-sm text-muted-foreground ml-2">
                {continueStamps}/{MAX_STAMPS} reads
              </span>
            </div>

            {/* Focus sounds badges */}
            {continueBook.focusSounds && continueBook.focusSounds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center md:justify-start">
                <span className="text-xs text-muted-foreground self-center">Sounds:</span>
                {continueBook.focusSounds.slice(0, 4).map(s => (
                  <span
                    key={s}
                    className={`px-2 py-0.5 rounded-full text-xs font-bold border bg-white ${levelInfo?.borderClass ?? ''} ${levelInfo?.colorClass ?? ''}`}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}
          </div>
          <ChevronRight className="hidden md:block w-8 h-8 text-primary shrink-0" />
        </div>
      </button>

      {/* ── Other books: horizontal scroll carousel ── */}
      {otherBooks.length > 0 && (
        <>
          <h3 className="text-sm md:text-base font-bold text-foreground mb-3 px-1">More books to read</h3>
          <div className="flex gap-3 md:gap-4 overflow-x-auto -mx-4 px-4 pb-3 snap-x snap-mandatory scroll-smooth">
            {otherBooks.map((b) => {
              const li = LEVELS.find(l => l.level === b.level);
              const cover = getCoverImageUrl(b.subLevel, b.coverImageUrl);
              const sCount = stamps[b.subLevel]?.count ?? 0;
              const locked = !b.unlocked;
              return (
                <button
                  key={b.id}
                  onClick={() => { if (!locked) onBookSelect(b); }}
                  disabled={locked}
                  className={`shrink-0 w-32 md:w-36 snap-start text-left rounded-2xl border-2 overflow-hidden transition-all duration-200
                    ${locked
                      ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-70'
                      : 'bg-card border-border shadow-card hover:shadow-lg active:scale-[0.97]'}`}
                  aria-label={locked ? `${b.title} (locked — ask a grown-up)` : `Open ${b.title}`}
                  title={locked ? 'Locked — ask a grown-up' : undefined}
                >
                  <div className="aspect-square w-full bg-muted relative">
                    {cover && (
                      <img
                        src={cover}
                        alt={b.title}
                        className={`w-full h-full object-cover ${locked ? 'grayscale opacity-60' : ''}`}
                      />
                    )}
                    {locked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                          <Lock className="w-4 h-4 md:w-5 md:h-5 text-slate-500" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${locked ? 'text-slate-400' : (li?.colorClass ?? 'text-primary-ink')}`}>
                      Level {b.level}
                    </p>
                    <p className={`text-xs md:text-sm font-bold leading-tight line-clamp-2 min-h-[2.4em] ${locked ? 'text-slate-400' : 'text-foreground'}`}>
                      {b.title}
                    </p>
                    {/* Mini stamp counter — only on unlocked books */}
                    {!locked && (
                      <div className="flex items-center gap-1 mt-1.5">
                        {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${i < sCount ? `bg-level-${b.level}` : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
