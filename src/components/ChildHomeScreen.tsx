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
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, Lock, BookOpen, ChevronRight, ChevronDown, Star, ShieldCheck,
  TrendingUp, Trophy, Award, CheckCircle2,
} from 'lucide-react';
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
  const [parentOpen, setParentOpen] = useState(false);

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

  // Reading-this-week + days-active stats for the parent view footer.
  const stats = useMemo(() => {
    const all = Object.values(stamps);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString().slice(0, 10);
    let reads = 0;
    for (const s of all) for (const d of s.readDates ?? []) if (d >= weekAgoIso) reads++;
    return { readsThisWeek: reads };
  }, [stamps]);

  const focusSoundsForLevel = useMemo(() => {
    const set = new Set<string>();
    for (const e of levelBooks) for (const s of e.book.focusSounds ?? []) set.add(s);
    return Array.from(set).slice(0, 6);
  }, [levelBooks]);

  // ─── Empty state ────────────────────────────────────────────
  if (levelBooks.length === 0) {
    return (
      <div className="px-4 pt-6 pb-24 max-w-xl mx-auto text-center">
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

  // Pink-themed background tones — matches the mockup's pale-pink page
  return (
    <div
      className="px-4 pt-4 pb-24 max-w-xl mx-auto"
      style={{ fontFamily: "'Andika', sans-serif", background: '#fff8fb' }}
    >
      {/* ── 1. Level card ───────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-b from-white to-pink-50 border border-pink-200/60 p-5 shadow-[0_12px_30px_rgba(23,23,23,0.05)] mb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-pink-100 to-pink-200 border-2 border-white shadow-md flex items-center justify-center shrink-0 overflow-hidden">
            <span className="font-display text-2xl font-extrabold text-primary-ink">
              {(childName?.[0] ?? '👋').toUpperCase()}
            </span>
          </div>

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground/80">
              Hi {childName || 'there'}! <span aria-hidden>👋</span>
            </p>
            <h1 className="font-display text-3xl font-extrabold text-primary-ink leading-none mt-1">
              Level {activeLevel}
            </h1>
            <p className="text-sm font-bold text-primary-ink/80 mt-1">{levelInfo?.name ?? ''}</p>
          </div>
        </div>

        {/* Focus sounds */}
        {focusSoundsForLevel.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold text-foreground/70 mb-2">Focus sounds</p>
            <div className="flex flex-wrap gap-2">
              {focusSoundsForLevel.map(s => (
                <span
                  key={s}
                  className="w-10 h-10 rounded-full border-2 border-primary bg-white text-primary-ink text-base font-extrabold italic flex items-center justify-center shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-amber-300 flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-foreground/80 mb-1">
              {masteredCount} of {totalInLevel} books mastered
            </p>
            <div className="h-2.5 w-full rounded-full bg-pink-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full transition-all duration-500"
                style={{ width: `${totalInLevel > 0 ? (masteredCount / totalInLevel) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Current book card ────────────────────────────────── */}
      <section
        className="rounded-3xl bg-gradient-to-b from-white to-pink-50/80 border-2 border-primary/35 p-5 shadow-[0_22px_45px_rgba(232,61,131,0.16)] mb-7 text-center"
      >
        {/* Decorative "YOUR BOOK" header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-primary text-lg" aria-hidden>✿</span>
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-primary-ink">Your Book</p>
          <span className="text-primary text-lg" aria-hidden>✿</span>
        </div>

        <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center">
          {coverUrl && (
            <div className="w-44 h-44 md:w-48 md:h-48 rounded-3xl overflow-hidden ring-4 ring-white shadow-[0_14px_30px_rgba(0,0,0,0.12)] shrink-0">
              <img src={coverUrl} alt={heroBook.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex-1 w-full md:text-left">
            <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
              {heroBook.title}
            </h2>

            {/* Reads pill */}
            <div className="mt-4 mx-auto md:mx-0 w-fit min-w-[180px] px-5 py-3 rounded-full bg-white shadow-[0_8px_22px_rgba(0,0,0,0.06)] flex items-center justify-center gap-4">
              <span className="text-sm font-extrabold text-primary-ink">Reads</span>
              <span className="font-display text-2xl font-extrabold text-primary-ink tabular-nums">
                {heroStamps} / {MAX_STAMPS}
              </span>
            </div>

            {/* Big dots */}
            <div className="flex justify-center md:justify-start items-center gap-3 my-4">
              {Array.from({ length: MAX_STAMPS }).map((_, i) => (
                <span
                  key={i}
                  className={`w-5 h-5 rounded-full transition-all ${
                    i < heroStamps
                      ? 'bg-primary shadow-[0_0_0_5px_rgba(232,61,131,0.15)]'
                      : 'bg-slate-100 ring-2 ring-slate-200'
                  }`}
                />
              ))}
            </div>

            <p className="text-sm md:text-base text-foreground/80 mb-4">{ctaSub}</p>

            {/* Primary CTA — dark navy, full width */}
            <button
              onClick={primaryAction}
              className="w-full h-14 rounded-2xl bg-[#111827] text-white font-display text-xl font-extrabold shadow-[0_14px_26px_rgba(23,21,26,0.2)] active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <BookOpen className="w-5 h-5" />
              {ctaLabel}
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-sm font-bold text-primary-ink flex items-center justify-center gap-1.5">
          <Star className="w-4 h-4 fill-primary text-primary" />
          {allMastered
            ? 'Pass your Level Check to move up!'
            : heroMastered
              ? 'Tap Next Book to start the next one!'
              : heroStamps >= MAX_STAMPS
                ? 'Tap Start Check to keep going!'
                : 'Finish this book to unlock the next one!'}
        </p>
      </section>

      {/* ── 3. Reading Path ─────────────────────────────────────── */}
      {totalInLevel > 0 && (
        <section className="mb-7">
          <div className="flex items-center gap-2 mb-3 px-1">
            <span aria-hidden>🗺️</span>
            <h3 className="font-display text-lg font-extrabold text-foreground">Your Reading Path</h3>
          </div>
          <div className="relative">
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2 snap-x scroll-smooth no-scrollbar">
              {levelBooks.map((entry, i) => {
                const { book, state, stamps: s } = entry;
                const cover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
                const isLast = i === levelBooks.length - 1;
                const isCurrent = state === 'current';
                const isMastered = state === 'mastered';
                return (
                  <div key={book.id} className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => state !== 'locked' && onBookSelect(book)}
                      disabled={state === 'locked'}
                      aria-label={
                        isMastered ? `${book.title} — done`
                          : isCurrent ? `${book.title} — current book`
                          : `${book.title} — locked, finish your current book first`
                      }
                      className={`relative w-32 snap-start text-left rounded-2xl bg-white p-3 transition-all duration-200 shrink-0 ${
                        isCurrent
                          ? 'border-2 border-primary shadow-[0_12px_28px_rgba(232,61,131,0.18)]'
                          : isMastered
                            ? 'border border-emerald-300 shadow-card'
                            : 'border border-slate-200 cursor-not-allowed'
                      }`}
                    >
                      {/* Numbered badge */}
                      <span
                        className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ring-2 ring-white shadow-sm z-10 ${
                          isCurrent ? 'bg-primary text-white'
                            : isMastered ? 'bg-emerald-500 text-white'
                            : 'bg-slate-300 text-white'
                        }`}
                      >
                        {isMastered ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                      </span>

                      {/* Cover — keep clean, no overlay icons (those clipped before) */}
                      <div className="aspect-square w-full rounded-xl overflow-hidden bg-muted">
                        {cover && (
                          <img
                            src={cover}
                            alt=""
                            className={`w-full h-full object-cover ${state === 'locked' ? 'grayscale opacity-60' : ''}`}
                          />
                        )}
                      </div>

                      <p className="text-xs font-bold text-foreground leading-tight mt-2 line-clamp-2 min-h-[2.4em]">
                        {book.title}
                      </p>

                      {/* Status pill / label below — never overlaps cover */}
                      {isCurrent ? (
                        <>
                          <span className="mt-1.5 inline-block bg-tint-pink border border-primary/30 text-primary-ink text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full">
                            Current
                          </span>
                          <p className="text-[10px] text-primary-ink font-bold mt-1">
                            {s.count}/{MAX_STAMPS} reads
                          </p>
                        </>
                      ) : isMastered ? (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      ) : (
                        <>
                          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-500">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Finish this book first</p>
                        </>
                      )}
                    </button>
                    {!isLast && (
                      <span className="flex items-center gap-1 px-1 text-pink-300/80" aria-hidden>
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span className="w-1 h-1 rounded-full bg-current" />
                        <span className="w-1 h-1 rounded-full bg-current" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Parent View accordion ───────────────────────────── */}
      <section className="rounded-3xl bg-amber-50 border border-amber-200/70 overflow-hidden shadow-card">
        <button
          onClick={() => setParentOpen(!parentOpen)}
          aria-expanded={parentOpen}
          className="w-full flex items-center justify-between gap-3 px-5 py-4 hover:bg-amber-100/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-200 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-amber-800" />
            </div>
            <h3 className="font-display text-base font-extrabold text-foreground">Parent View</h3>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            {parentOpen ? 'Tap to close' : 'Tap to open'}
            <ChevronDown className={`w-4 h-4 transition-transform ${parentOpen ? 'rotate-180' : ''}`} />
          </span>
        </button>

        {/* Always-visible quick-glance row (also visible when collapsed
            so parent can see at-a-glance without opening) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 pb-5">
          <ParentStat
            icon={ShieldCheck}
            label="Guided Mode"
            value="Books unlock after checks"
            tone="emerald"
          />
          <ParentStat
            icon={TrendingUp}
            label="Reads this week"
            value={String(stats.readsThisWeek)}
            tone="violet"
          />
          <ParentStat
            icon={Trophy}
            label="Books mastered"
            value={`${masteredCount} / ${totalInLevel}`}
            tone="amber"
          />
          <ParentStat
            icon={Award}
            label="Next Level Check"
            value={allMastered ? 'Ready now!' : `After all ${totalInLevel} books`}
            tone={allMastered ? 'emerald' : 'slate'}
          />
        </div>

        {parentOpen && (
          <div className="border-t border-amber-200 bg-white px-5 py-4 space-y-2">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Need more controls? Open the full Parent Dashboard for unlock controls, free-reading mode, and reset options.
            </p>
            <button
              onClick={() => navigate('/profile/parent-dashboard')}
              className="w-full py-2.5 rounded-xl bg-foreground text-white text-sm font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-1.5"
            >
              Open Parent Dashboard <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────

function ParentStat({
  icon: Icon, label, value, tone,
}: {
  icon: typeof ShieldCheck; label: string; value: string;
  tone: 'emerald' | 'violet' | 'amber' | 'slate';
}) {
  const toneClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    amber: 'bg-amber-100 border-amber-300 text-amber-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-600',
  }[tone];
  return (
    <div className={`rounded-2xl border p-2.5 ${toneClasses}`}>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider opacity-80">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-display text-sm font-extrabold mt-1 leading-tight">{value}</div>
    </div>
  );
}
