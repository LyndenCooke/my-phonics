/**
 * ChildHomeScreen — child-facing home matching the mobile-app mockup.
 *
 * Layout (top → bottom):
 *  1. Pink "level card" — avatar + greeting + Level + focus sounds row +
 *     "N of M books mastered" with a progress bar
 *  2. "YOUR BOOK" current-book card — cover on left, title + Reads pill +
 *     5 dots + sub-message + dark "Read Book" CTA + footer hint
 *  3. "Your Reading Path" — horizontal scrollable cards. Numbered badges
 *     (current = pink, others = grey ring). Locked cards show "Locked" +
 *     "Finish this book first" *below* the cover so the lock icon never
 *     overlaps the cover artwork (was clipping in the previous design).
 *  4. Collapsible "Parent View" accordion — Guided Mode, this-week reads,
 *     books mastered, next Level Check status.
 *
 * Child-facing copy avoids adult terms (fluency, assessment, decoding,
 * mastery). The only word for the readiness gate is "Check".
 */
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Lock, BookOpen, Star, CheckCircle2 } from 'lucide-react';
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

  // Active level + journey: same logic as before — first unmastered unlocked
  // book defines the active level, all books at that level get state-tagged
  // (mastered / current / locked) for the path renderer.
  const { activeLevel, levelBooks, currentEntry } = useMemo(() => {
    const unlockedSorted = books
      .filter(b => b.unlocked)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (unlockedSorted.length === 0) {
      return { activeLevel: 1, levelBooks: [] as BookWithProgress[], currentEntry: null as BookWithProgress | null };
    }

    const enriched: BookWithProgress[] = unlockedSorted.map(b => {
      const s = stamps[b.subLevel] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
      const mastered = isReadyToMoveUp(s);
      return { book: b, stamps: s, mastered, state: 'locked' as BookState };
    });

    const firstUnmastered = enriched.find(e => !e.mastered);
    const target = firstUnmastered ?? enriched[enriched.length - 1];
    const lvl = target.book.level;

    const allLevelBooks = books
      .filter(b => b.level === lvl)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map<BookWithProgress>(b => {
        const s = stamps[b.subLevel] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
        const mastered = isReadyToMoveUp(s);
        return { book: b, stamps: s, mastered, state: 'locked' as BookState };
      });

    let foundCurrent = false;
    for (const e of allLevelBooks) {
      if (e.mastered) { e.state = 'mastered'; continue; }
      if (!foundCurrent) { e.state = 'current'; foundCurrent = true; }
      else { e.state = 'locked'; }
    }

    const current = allLevelBooks.find(e => e.state === 'current') ?? null;
    return { activeLevel: lvl, levelBooks: allLevelBooks, currentEntry: current };
  }, [books, stamps]);

  const masteredCount = levelBooks.filter(e => e.mastered).length;
  const totalInLevel = levelBooks.length;
  const allMastered = totalInLevel > 0 && masteredCount === totalInLevel;
  const levelInfo = LEVELS.find(l => l.level === activeLevel);

  const focusSoundsForLevel = useMemo(() => {
    const set = new Set<string>();
    for (const e of levelBooks) for (const s of e.book.focusSounds ?? []) set.add(s);
    return Array.from(set).slice(0, 6);
  }, [levelBooks]);

  // ─── Empty state ────────────────────────────────────────────
  if (levelBooks.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-xl lg:max-w-3xl mx-auto text-center">
        <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
          <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
          <h2 className="font-display text-xl font-extrabold text-foreground">No books yet!</h2>
          <p className="text-sm text-muted-foreground mt-2">Ask a grown-up to unlock your first book.</p>
        </div>
      </div>
    );
  }

  const heroBook = currentEntry?.book ?? levelBooks[levelBooks.length - 1].book;
  const heroStamps = currentEntry?.stamps.count ?? MAX_STAMPS;
  const heroMastered = currentEntry?.mastered ?? true;
  const coverUrl = getCoverImageUrl(heroBook.subLevel, heroBook.coverImageUrl);

  // CTA + sub-message state machine — exact spec copy
  let ctaLabel: string;
  let ctaSub: string;
  let primaryAction: () => void = () => onBookSelect(heroBook);
  if (allMastered) {
    ctaLabel = 'Start Level Check';
    ctaSub = "You've finished all your books!";
    primaryAction = () => navigate(`/assess?level=${activeLevel}`);
  } else if (heroMastered) {
    ctaLabel = 'Next Book';
    ctaSub = 'Next book unlocked!';
  } else if (heroStamps >= MAX_STAMPS) {
    ctaLabel = 'Start Check';
    ctaSub = 'Ready for your Check!';
  } else if (heroStamps === 0) {
    ctaLabel = 'Read Book';
    ctaSub = 'Read this book 5 times.';
  } else if (heroStamps === 1) {
    ctaLabel = 'Read Again';
    ctaSub = 'Great start. 4 reads to go.';
  } else if (heroStamps === 2) {
    ctaLabel = 'Read Again';
    ctaSub = "You're doing great. 3 more reads to go.";
  } else if (heroStamps === 3) {
    ctaLabel = 'Read Again';
    ctaSub = "You're getting faster. 2 reads to go.";
  } else {
    ctaLabel = 'Last Read!';
    ctaSub = 'Almost there. Last read!';
  }

  // Tightened to fit a single iPhone viewport (≈ 650px usable between
  // the sticky header and bottom nav). No Parent View accordion at the
  // bottom — adults reach Parent Dashboard via the Profile tab.
  return (
    <div
      className="px-3 lg:px-6 pt-2 pb-3 max-w-xl lg:max-w-5xl mx-auto h-full flex flex-col gap-2.5 lg:h-auto lg:grid lg:grid-cols-2 lg:gap-5 lg:items-start"
      style={{ fontFamily: "'Andika', sans-serif", background: '#fff8fb' }}
    >
      {/* Left column on laptop: level card + current book stacked. On mobile
          this is just the normal vertical flow. */}
      <div className="flex flex-col gap-2.5 lg:gap-5 shrink-0">
      {/* ── 1. Level card — compact ─────────────────────────────── */}
      <section className="rounded-2xl bg-gradient-to-b from-white to-pink-50 border border-pink-200/60 px-3 py-2.5 shadow-[0_8px_20px_rgba(23,23,23,0.04)] shrink-0">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-b from-pink-100 to-pink-200 border-2 border-white shadow-sm flex items-center justify-center shrink-0">
            <span className="font-display text-base font-extrabold text-primary-ink">
              {(childName?.[0] ?? '👋').toUpperCase()}
            </span>
          </div>

          {/* Greeting + level (single line, compact) */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-foreground/70 leading-tight">
              Hi {childName || 'there'}! <span aria-hidden>👋</span>
            </p>
            <p className="leading-tight">
              <span className="font-display text-lg font-extrabold text-primary-ink">Level {activeLevel}</span>
              <span className="text-xs font-bold text-primary-ink/70 ml-1.5">· {levelInfo?.name ?? ''}</span>
            </p>
          </div>

          {/* Focus sounds inline */}
          {focusSoundsForLevel.length > 0 && (
            <div className="flex gap-1 shrink-0">
              {focusSoundsForLevel.slice(0, 5).map(s => (
                <span
                  key={s}
                  className="w-7 h-7 rounded-full border-[1.5px] border-primary bg-white text-primary-ink text-xs font-extrabold italic flex items-center justify-center shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-2 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-foreground/80 tabular-nums shrink-0">
            {masteredCount}/{totalInLevel}
          </span>
          <div className="flex-1 h-2 rounded-full bg-pink-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full transition-all duration-500"
              style={{ width: `${totalInLevel > 0 ? (masteredCount / totalInLevel) * 100 : 0}%` }}
            />
          </div>
        </div>
      </section>

      {/* ── 2. Current book card — compact, side-by-side ─────────── */}
      <section
        className="rounded-2xl bg-gradient-to-b from-white to-pink-50/80 border-2 border-primary/35 p-3 shadow-[0_14px_30px_rgba(232,61,131,0.14)] shrink-0"
      >
        <div className="flex gap-3 items-stretch">
          {/* Real PDF cover, big */}
          {coverUrl && (
            <div className="w-[40%] aspect-[3/4] rounded-xl overflow-hidden ring-2 ring-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] shrink-0">
              <img src={coverUrl} alt={heroBook.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col justify-between">
            {/* Top: YOUR BOOK + title + reads */}
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary-ink flex items-center gap-1">
                <span aria-hidden>✿</span> Your Book <span aria-hidden>✿</span>
              </p>
              <h2 className="font-display text-lg font-extrabold text-foreground leading-tight mt-0.5 line-clamp-2">
                {heroBook.title}
              </h2>

              {/* Reads pill — inline */}
              <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white shadow-sm w-fit">
                <span className="text-[11px] font-extrabold text-primary-ink">Reads</span>
                <span className="font-display text-sm font-extrabold text-primary-ink tabular-nums">
                  {heroStamps} / {MAX_STAMPS}
                </span>
              </div>

              {/* Dots */}
              <div className="flex items-center gap-1.5 mt-2">
                {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all ${
                      i < heroStamps
                        ? 'bg-primary shadow-[0_0_0_3px_rgba(232,61,131,0.15)]'
                        : 'bg-slate-100 ring-2 ring-slate-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-foreground/80 mt-2 leading-tight">{ctaSub}</p>
          </div>
        </div>

        {/* Primary CTA — full-width, dark navy */}
        <button
          onClick={primaryAction}
          className="w-full h-12 mt-3 rounded-xl bg-[#111827] text-white font-display text-lg font-extrabold shadow-[0_10px_22px_rgba(23,21,26,0.2)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
        >
          <BookOpen className="w-4 h-4" />
          {ctaLabel}
        </button>

        {/* Footer hint */}
        <p className="mt-2 text-[11px] font-bold text-primary-ink flex items-center justify-center gap-1.5">
          <Star className="w-3 h-3 fill-primary text-primary" />
          {allMastered
            ? 'Pass your Level Check to move up!'
            : heroMastered
              ? 'Tap Next Book to start the next one!'
              : heroStamps >= MAX_STAMPS
                ? 'Tap Start Check to keep going!'
                : 'Finish this book to unlock the next one!'}
        </p>
      </section>
      </div>

      {/* ── 3. Reading Path — compact ───────────────────────────── */}
      {totalInLevel > 0 && (
        <section className="flex-1 min-h-0 flex flex-col">
          <div className="flex items-center gap-2 px-1 mb-1.5 shrink-0">
            <span aria-hidden>🗺️</span>
            <h3 className="font-display text-sm font-extrabold text-foreground">Your Reading Path</h3>
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-3 px-3 pb-1 snap-x scroll-smooth no-scrollbar lg:flex-wrap lg:overflow-x-visible lg:mx-0 lg:px-0">
            {levelBooks.map((entry, i) => {
              const { book, state, stamps: s } = entry;
              const cover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
              const isCurrent = state === 'current';
              const isMastered = state === 'mastered';
              return (
                <button
                  key={book.id}
                  onClick={() => state !== 'locked' && onBookSelect(book)}
                  disabled={state === 'locked'}
                  aria-label={
                    isMastered ? `${book.title} — done`
                      : isCurrent ? `${book.title} — current book`
                      : `${book.title} — locked, finish your current book first`
                  }
                  className={`relative w-24 snap-start text-left rounded-xl bg-white p-1.5 transition-all duration-200 shrink-0 ${
                    isCurrent
                      ? 'border-2 border-primary shadow-[0_8px_18px_rgba(232,61,131,0.18)]'
                      : isMastered
                        ? 'border border-emerald-300'
                        : 'border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  {/* Numbered badge */}
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ring-2 ring-white shadow-sm z-10 ${
                      isCurrent ? 'bg-primary text-white'
                        : isMastered ? 'bg-emerald-500 text-white'
                        : 'bg-slate-300 text-white'
                    }`}
                  >
                    {isMastered ? <CheckCircle2 className="w-3 h-3" /> : i + 1}
                  </span>

                  {/* Real PDF cover */}
                  <div className="aspect-[3/4] w-full rounded-lg overflow-hidden bg-muted">
                    {cover && (
                      <img
                        src={cover}
                        alt=""
                        className={`w-full h-full object-cover ${state === 'locked' ? 'grayscale opacity-60' : ''}`}
                      />
                    )}
                  </div>

                  {/* Status — minimal, below cover */}
                  {isCurrent ? (
                    <p className="text-[9px] font-extrabold text-primary-ink text-center mt-1">
                      {s.count}/{MAX_STAMPS} reads
                    </p>
                  ) : isMastered ? (
                    <p className="text-[9px] font-extrabold text-emerald-700 text-center mt-1 flex items-center justify-center gap-0.5">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Done
                    </p>
                  ) : (
                    <p className="text-[9px] font-bold text-slate-500 text-center mt-1 flex items-center justify-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
