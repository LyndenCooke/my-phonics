/**
 * ChildHomeScreen — Duolingo-style focused flow.
 *
 * Layout:
 *  1. Top strip — Level identity + per-level progress (X/N books mastered)
 *  2. Hero current book card — cover + fluency dots + state-driven CTA
 *  3. Journey path — horizontal stepped books for the current level
 *  4. End-of-level gate — hidden until N-1, "Almost there" → "Level Check"
 *
 * "Current book" = lowest-sortOrder unmastered unlocked book in the child's
 *                  active level. One clear next action; no browsing.
 * "Mastered" = isReadyToMoveUp(stamps) — 5 stamps + all 3 check-ins passed.
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, Lock, CheckCircle2, Star } from 'lucide-react';
import type { Book } from '@/lib/types';
import { LEVELS } from '@/lib/types';
import { getAllStamps, isReadyToMoveUp, MAX_STAMPS, type BookStamps } from '@/lib/stamps';
import { getCoverImageUrl } from '@/lib/imageResolver';
import { useChildren } from '@/hooks/useBooks';

interface Props {
  books: Book[];
  onBookSelect: (book: Book) => void;
}

type BookState = 'mastered' | 'current' | 'locked';

interface BookWithProgress {
  book: Book;
  stamps: BookStamps;
  mastered: boolean;
  state: BookState;
}

export default function ChildHomeScreen({ books, onBookSelect }: Props) {
  const navigate = useNavigate();
  const stamps = useMemo(() => getAllStamps(), []);
  const { data: children } = useChildren();
  const childName = children?.[0]?.name ?? '';

  // Pick the child's active level: lowest level with any unlocked unmastered
  // book. If they've mastered everything they own, stay on the highest unlocked
  // level (so we can show "Level X complete" gate).
  const { activeLevel, levelBooks, currentBookIdx } = useMemo(() => {
    const unlockedSorted = books
      .filter(b => b.unlocked)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (unlockedSorted.length === 0) {
      return { activeLevel: 1, levelBooks: [] as BookWithProgress[], currentBookIdx: -1 };
    }

    const enriched: BookWithProgress[] = unlockedSorted.map(b => {
      const s = stamps[b.subLevel] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
      const mastered = isReadyToMoveUp(s);
      return { book: b, stamps: s, mastered, state: 'locked' as BookState };
    });

    // First unmastered book = the "current" target. If none, pick the last
    // unlocked level (level fully mastered).
    const firstUnmastered = enriched.find(e => !e.mastered);
    const target = firstUnmastered ?? enriched[enriched.length - 1];
    const lvl = target.book.level;

    // Books in this level (regardless of unlock status) so the journey path
    // shows future locked books too.
    const allLevelBooks = books
      .filter(b => b.level === lvl)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map<BookWithProgress>(b => {
        const s = stamps[b.subLevel] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
        const mastered = isReadyToMoveUp(s);
        let state: BookState;
        if (mastered) state = 'mastered';
        else if (b.unlocked && b.id === target.book.id) state = 'current';
        else if (b.unlocked) state = 'locked'; // unlocked but not yet reached — gated by previous book
        else state = 'locked';
        return { book: b, stamps: s, mastered, state };
      });

    // Refine: only the *first non-mastered* book is "current"; all later
    // unmastered books are "locked" even if technically unlocked, so the
    // stepped progression reads cleanly.
    let foundCurrent = false;
    for (const e of allLevelBooks) {
      if (e.mastered) continue;
      if (!foundCurrent) {
        e.state = 'current';
        foundCurrent = true;
      } else {
        e.state = 'locked';
      }
    }

    const idx = allLevelBooks.findIndex(e => e.state === 'current');
    return { activeLevel: lvl, levelBooks: allLevelBooks, currentBookIdx: idx };
  }, [books, stamps]);

  const masteredCount = levelBooks.filter(e => e.mastered).length;
  const totalInLevel = levelBooks.length;
  const allMastered = totalInLevel > 0 && masteredCount === totalInLevel;
  const oneAway = totalInLevel > 0 && masteredCount === totalInLevel - 1;

  const currentEntry = currentBookIdx >= 0 ? levelBooks[currentBookIdx] : null;
  const levelInfo = LEVELS.find(l => l.level === activeLevel);
  const focusSoundsForLevel = useMemo(() => {
    const set = new Set<string>();
    for (const e of levelBooks) for (const s of e.book.focusSounds ?? []) set.add(s);
    return Array.from(set).slice(0, 6);
  }, [levelBooks]);

  if (levelBooks.length === 0) {
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

  const heroBook = currentEntry?.book ?? levelBooks[levelBooks.length - 1].book;
  const heroStamps = currentEntry?.stamps.count ?? MAX_STAMPS;
  const heroMastered = currentEntry?.mastered ?? true;
  const coverUrl = getCoverImageUrl(heroBook.subLevel, heroBook.coverImageUrl);

  // CTA state machine — see spec §2
  let ctaLabel: string;
  let ctaSub: string;
  if (allMastered) {
    ctaLabel = 'Level Complete';
    ctaSub = 'Take your Level Check below';
  } else if (heroMastered) {
    ctaLabel = 'Continue';
    ctaSub = 'Next book unlocked';
  } else if (heroStamps >= MAX_STAMPS) {
    ctaLabel = 'Start Sound Check';
    ctaSub = 'Fluency complete — ready for your check';
  } else if (heroStamps === 0) {
    ctaLabel = "Let's Read!";
    ctaSub = 'Read this book 5 times to master it';
  } else {
    ctaLabel = 'Read Again';
    ctaSub = `${MAX_STAMPS - heroStamps} more read${MAX_STAMPS - heroStamps === 1 ? '' : 's'} to your sound check`;
  }

  return (
    <div className="px-4 pt-5 pb-24 max-w-3xl mx-auto" style={{ fontFamily: "'Andika', sans-serif" }}>
      {/* ── 1. Top strip: Level identity ────────────────────────────────── */}
      <div className="mb-4 px-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] md:text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {childName ? `Hi ${childName}!` : 'Hi there!'}
            </p>
            <h1 className={`font-display text-xl md:text-2xl font-extrabold leading-tight ${levelInfo?.colorClass ?? 'text-foreground'}`}>
              Level {activeLevel} · {levelInfo?.name ?? ''}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-100 border-2 border-amber-300 rounded-full px-3 py-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span className="text-sm font-extrabold text-amber-700 tabular-nums">{masteredCount}/{totalInLevel}</span>
          </div>
        </div>

        {focusSoundsForLevel.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-xs text-muted-foreground">Sounds you're learning:</span>
            {focusSoundsForLevel.map(s => (
              <span
                key={s}
                className={`px-2 py-0.5 rounded-full text-xs font-bold border bg-white ${levelInfo?.borderClass ?? ''} ${levelInfo?.colorClass ?? ''}`}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Per-level progress bar */}
        <div className="mt-3">
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full ${levelInfo?.bgClass ?? 'bg-primary'} transition-all duration-500`}
              style={{ width: `${totalInLevel > 0 ? (masteredCount / totalInLevel) * 100 : 0}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {masteredCount} of {totalInLevel} books mastered
          </p>
        </div>
      </div>

      {/* ── 2. Hero current book card ───────────────────────────────────── */}
      <button
        onClick={() => onBookSelect(heroBook)}
        className="w-full text-left rounded-3xl border-4 border-primary bg-gradient-to-br from-tint-pink to-white p-5 md:p-6 shadow-2xl active:scale-[0.99] hover:shadow-xl transition-all duration-200 mb-6 press-scale"
      >
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
          {coverUrl && (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden ring-4 ring-white shadow-lg shrink-0 relative">
              <img src={coverUrl} alt={heroBook.title} className="w-full h-full object-cover" />
              {heroMastered && (
                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 fill-white" strokeWidth={3} />
                </div>
              )}
            </div>
          )}
          <div className="flex-1 text-center md:text-left">
            <p className="text-xs md:text-sm font-bold text-primary-ink uppercase tracking-wider mb-1">
              {ctaLabel}
            </p>
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-1.5">
              {heroBook.title}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-3">{ctaSub}</p>

            {/* Fluency dots — 5 stamps */}
            <div className="flex items-center justify-center md:justify-start gap-1.5 mb-2">
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-colors ${
                    i < heroStamps ? `bg-level-${heroBook.level}` : 'bg-slate-200'
                  }`}
                />
              ))}
              <span className="text-xs md:text-sm text-muted-foreground ml-2">
                {heroStamps}/{MAX_STAMPS} reads
              </span>
            </div>
          </div>
          <ChevronRight className="hidden md:block w-8 h-8 text-primary shrink-0" />
        </div>
      </button>

      {/* ── 3. Journey path ─────────────────────────────────────────────── */}
      {totalInLevel > 1 && (
        <div className="mb-6">
          <h3 className="text-sm md:text-base font-bold text-foreground mb-3 px-1">Your journey</h3>
          <div className="flex gap-2 md:gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x">
            {levelBooks.map((entry, i) => {
              const { book, state, stamps: s } = entry;
              const cover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
              const isLast = i === levelBooks.length - 1;
              return (
                <div key={book.id} className="flex items-center gap-2 md:gap-3 shrink-0">
                  <button
                    onClick={() => state !== 'locked' && onBookSelect(book)}
                    disabled={state === 'locked'}
                    aria-label={
                      state === 'mastered' ? `${book.title} — mastered`
                      : state === 'current' ? `${book.title} — current book`
                      : `${book.title} — locked, master previous book to unlock`
                    }
                    title={state === 'locked' ? `Pass ${levelBooks[i - 1]?.book.title ?? 'previous'} check to unlock` : book.title}
                    className={`w-20 md:w-24 snap-start text-left rounded-xl border-2 overflow-hidden transition-all duration-200 ${
                      state === 'mastered'
                        ? 'bg-emerald-50 border-emerald-400 shadow-card'
                        : state === 'current'
                        ? 'bg-card border-primary shadow-lg ring-2 ring-primary/30 scale-105'
                        : 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="aspect-square w-full bg-muted relative">
                      {cover && (
                        <img
                          src={cover}
                          alt=""
                          className={`w-full h-full object-cover ${state === 'locked' ? 'grayscale opacity-60' : ''}`}
                        />
                      )}
                      {state === 'mastered' && (
                        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-md">
                          <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                      )}
                      {state === 'locked' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-7 h-7 rounded-full bg-white/90 shadow-md flex items-center justify-center">
                            <Lock className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[10px] font-bold leading-tight line-clamp-2 min-h-[2.4em] text-foreground">
                        {book.title}
                      </p>
                      {state === 'current' && (
                        <div className="flex items-center gap-0.5 mt-1">
                          {Array.from({ length: MAX_STAMPS }).map((_, di) => (
                            <span
                              key={di}
                              className={`w-1 h-1 rounded-full ${di < s.count ? `bg-level-${book.level}` : 'bg-slate-300'}`}
                            />
                          ))}
                        </div>
                      )}
                      {state === 'mastered' && (
                        <p className="text-[10px] text-emerald-700 font-bold mt-0.5">Mastered</p>
                      )}
                    </div>
                  </button>
                  {!isLast && (
                    <ChevronRight className={`w-4 h-4 shrink-0 ${entry.mastered ? 'text-emerald-500' : 'text-slate-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. End-of-level gate ────────────────────────────────────────── */}
      {oneAway && !allMastered && (
        <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 text-center">
          <p className="text-sm font-bold text-amber-800">Almost there…</p>
          <p className="text-xs text-amber-700 mt-1">
            Master one more book to unlock your Level Check
          </p>
        </div>
      )}

      {allMastered && (
        <div className={`rounded-3xl border-4 ${levelInfo?.borderClass ?? 'border-primary'} bg-gradient-to-br from-amber-50 to-white p-6 text-center shadow-2xl`}>
          <div className="flex justify-center mb-3">
            <div className={`w-14 h-14 rounded-full ${levelInfo?.bgClass ?? 'bg-primary'} flex items-center justify-center shadow-lg`}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="font-display text-xl md:text-2xl font-extrabold text-foreground">
            Level {activeLevel} Complete
          </h3>
          <p className="text-sm text-muted-foreground mt-2 mb-4">
            You've mastered all your books. Now take your Level Check to move on.
          </p>
          <button
            onClick={() => navigate(`/assess?level=${activeLevel}`)}
            className={`px-6 py-3 rounded-2xl font-extrabold text-sm md:text-base text-white shadow-button active:scale-[0.97] transition-all ${levelInfo?.bgClass ?? 'bg-primary'}`}
          >
            Start Level Check
          </button>
        </div>
      )}
    </div>
  );
}
