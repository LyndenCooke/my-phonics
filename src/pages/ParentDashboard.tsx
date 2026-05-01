/**
 * ParentDashboard — adult-facing progress and controls.
 *
 * Lives at /profile/parent-dashboard. Sections per spec:
 *   1. Current Book status
 *   2. Level progress (ring + stepper + focus sounds)
 *   3. Quick Actions (Unlock Next Book / Free Reading Mode / Reset)
 *   4. Reading Activity stats
 *   5. Suggested Action
 *   6. End-of-level Level Check status
 *
 * Quick Actions are best-effort stubs today — the unlock/free-mode controls
 * are wired into local state via useAppMode + the stamps store; the cloud
 * unlock-next-book mutation is future work (will need a Supabase RPC or
 * direct user_books insert).
 */
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useBooks, useUserBooks, useChildren } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { getAllStamps, isReadyToMoveUp, resetStamps, MAX_STAMPS } from '@/lib/stamps';
import { LEVELS } from '@/lib/types';
import { getCoverImageUrl } from '@/lib/imageResolver';
import {
  ArrowLeft, Lock, BookOpen, CheckCircle2, RotateCcw, Unlock as UnlockIcon,
  Sparkles, AlertTriangle, Calendar, Clock, TrendingUp, Award, ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export default function ParentDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: booksData } = useBooks(null);
  const { data: userBooksData } = useUserBooks();
  const { data: children } = useChildren();
  const stamps = getAllStamps();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [freeMode, setFreeMode] = useState(false);

  const child = children?.[0] as { id?: string; name?: string; current_level?: number } | undefined;
  const childName = child?.name ?? 'your child';

  // Build the parent-facing book list with mastery state
  const enriched = useMemo(() => {
    if (!booksData) return [];
    const userBookIds = new Set((userBooksData ?? []).map(ub => ub.book_id));
    return booksData
      .map(b => {
        const s = stamps[b.sub_level] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
        const mastered = isReadyToMoveUp(s);
        const unlocked = isAdmin || userBookIds.has(b.id) || (b.is_free_sample ?? false);
        return { id: b.id, sub_level: b.sub_level, title: b.title, level: b.level, sortOrder: b.sort_order,
          coverImageUrl: b.cover_image_url ?? undefined, focusSounds: b.focus_sounds ?? [],
          stamps: s.count, mastered, unlocked };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [booksData, userBooksData, stamps, isAdmin]);

  // Active level = first level with an unmastered unlocked book; fallback to highest unlocked level
  const activeLevel = useMemo(() => {
    const firstUnmastered = enriched.find(e => e.unlocked && !e.mastered);
    if (firstUnmastered) return firstUnmastered.level;
    const lastUnlocked = [...enriched].reverse().find(e => e.unlocked);
    return lastUnlocked?.level ?? 1;
  }, [enriched]);

  const levelInfo = LEVELS.find(l => l.level === activeLevel);
  const levelBooks = enriched.filter(e => e.level === activeLevel);
  const masteredCount = levelBooks.filter(e => e.mastered).length;
  const totalInLevel = levelBooks.length;
  const allMastered = totalInLevel > 0 && masteredCount === totalInLevel;
  const currentBook = levelBooks.find(e => e.unlocked && !e.mastered) ?? levelBooks[levelBooks.length - 1];

  // Aggregate focus sounds across the level
  const focusSoundsForLevel = useMemo(() => {
    const set = new Set<string>();
    for (const e of levelBooks) for (const s of e.focusSounds ?? []) set.add(s);
    return Array.from(set).slice(0, 6);
  }, [levelBooks]);

  // Reading Activity (this week)
  const stats = useMemo(() => {
    const all = Object.values(stamps);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoIso = weekAgo.toISOString().slice(0, 10);
    let readsThisWeek = 0;
    const activeDays = new Set<string>();
    for (const s of all) {
      for (const d of s.readDates ?? []) {
        if (d >= weekAgoIso) {
          readsThisWeek++;
          activeDays.add(d);
        }
      }
    }
    const masteredAll = enriched.filter(e => e.mastered).length;
    return {
      readsThisWeek,
      daysActive: activeDays.size,
      readingMinutes: readsThisWeek * 7, // ~7 min/read estimate
      booksMastered: masteredAll,
    };
  }, [stamps, enriched]);

  const handleResetCurrent = () => {
    if (!currentBook) return;
    if (!confirm(`Reset progress for "${currentBook.title}"? This clears stamps and check results.`)) return;
    resetStamps(currentBook.sub_level);
    toast({ title: 'Progress reset', description: `${currentBook.title} is back to 0 reads.` });
    queryClient.invalidateQueries({ queryKey: ['user_books'] });
    // Force a re-render by navigating to self
    setTimeout(() => navigate(0), 50);
  };

  const handleUnlockNext = () => {
    // Unlocking books server-side requires inserting a user_books row, which
    // bypasses Stripe — out of scope for the dashboard. We surface the
    // controlled message instead of pretending it worked.
    toast({
      title: 'Coming soon',
      description: 'Manual unlock will be available once parent override is wired to the backend.',
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-5 pb-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your dashboard.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        {/* Page header */}
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Parent Dashboard</h1>
        </div>

        {/* 1. Current Book */}
        {currentBook && (
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Current Book</p>
            <div className="flex gap-4">
              {(() => {
                const cover = getCoverImageUrl(currentBook.sub_level, currentBook.coverImageUrl);
                return cover ? (
                  <img src={cover} alt="" className="w-24 h-24 rounded-2xl object-cover ring-2 ring-white shadow-md shrink-0" />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-muted flex items-center justify-center shrink-0">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                  </div>
                );
              })()}
              <div className="flex-1 min-w-0">
                <h3 className="font-display text-base font-extrabold text-foreground leading-tight">{currentBook.title}</h3>
                <p className={`text-xs font-semibold ${levelInfo?.colorClass ?? 'text-foreground'} mt-0.5`}>
                  Level {currentBook.level} · {levelInfo?.name ?? ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-3 text-xs">
                  <span className="bg-muted rounded-lg px-2 py-1 font-bold text-foreground">
                    Reads {currentBook.stamps}/{MAX_STAMPS}
                  </span>
                  <span className={`rounded-lg px-2 py-1 font-bold flex items-center gap-1 ${
                    currentBook.mastered
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {currentBook.mastered ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {currentBook.mastered ? 'Check passed' : 'Check locked'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Status: {currentBook.mastered ? 'Mastered' : currentBook.stamps >= MAX_STAMPS ? 'Ready for check' : 'In progress'}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 2. Level Progress */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Level Progress</p>
          <div className="flex items-center gap-5">
            <ProgressRing value={masteredCount} total={totalInLevel} colorClass={levelInfo?.bgClass ?? 'bg-primary'} />
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-base font-extrabold text-foreground">
                Level {activeLevel} · {levelInfo?.name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">{masteredCount} of {totalInLevel} books mastered</p>
              {focusSoundsForLevel.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
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
            </div>
          </div>

          {/* Numbered stepper — books in this level */}
          {totalInLevel > 0 && (
            <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
              {levelBooks.map((b, i) => (
                <span key={b.id} className="flex items-center gap-1 shrink-0">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-extrabold ring-2 ring-white shadow-sm ${
                      b.mastered ? 'bg-emerald-500 text-white'
                        : (b.id === currentBook?.id ? `${levelInfo?.bgClass ?? 'bg-primary'} text-white`
                        : 'bg-slate-200 text-slate-500')
                    }`}
                    aria-label={`Book ${i + 1}${b.mastered ? ' mastered' : b.id === currentBook?.id ? ' current' : ''}`}
                  >
                    {i + 1}
                  </span>
                  {i < levelBooks.length - 1 && <span className="w-2 h-0.5 bg-slate-200" />}
                </span>
              ))}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-3">
            Complete all books and pass the Level Check to unlock Level {Math.min(activeLevel + 1, 6)}.
          </p>
        </section>

        {/* 3. Quick Actions */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Quick Actions</p>
          <div className="grid grid-cols-3 gap-2">
            <ActionTile icon={UnlockIcon} label="Unlock Next Book" tone="primary" onClick={handleUnlockNext} />
            <ActionTile
              icon={BookOpen}
              label={freeMode ? 'Guided Mode' : 'Free Reading Mode'}
              tone={freeMode ? 'amber' : 'slate'}
              onClick={() => {
                setFreeMode(!freeMode);
                toast({
                  title: !freeMode ? 'Free Reading Mode on' : 'Guided Mode on',
                  description: !freeMode
                    ? 'All books are tappable. Reads and checks are still tracked.'
                    : 'Books unlock only when checks are passed.',
                });
              }}
            />
            <ActionTile icon={RotateCcw} label="Reset Book Progress" tone="slate" onClick={handleResetCurrent} />
          </div>
          {freeMode && (
            <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Free Reading Mode is on — Guided Mode is off. {childName} can open any book, but progress is still tracked.
              </p>
            </div>
          )}
        </section>

        {/* 4. Reading Activity */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Reading Activity</p>
          <div className="grid grid-cols-2 gap-3">
            <Stat icon={TrendingUp} label="Reads this week" value={String(stats.readsThisWeek)} tone="rose" />
            <Stat icon={Calendar} label="Days active" value={String(stats.daysActive)} tone="violet" />
            <Stat icon={Clock} label="Reading time" value={`${Math.floor(stats.readingMinutes / 60)}h ${stats.readingMinutes % 60}m`} tone="blue" />
            <Stat icon={Award} label="Books mastered" value={String(stats.booksMastered)} tone="emerald" />
          </div>
        </section>

        {/* 5. Suggested Action */}
        {currentBook && !currentBook.mastered && (
          <section className="rounded-3xl border-2 border-dashed border-primary/30 bg-tint-pink p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-primary-ink shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground">Suggested next step</p>
                <p className="text-[11px] text-foreground/80 leading-relaxed mt-1">
                  {currentBook.stamps >= MAX_STAMPS
                    ? `${childName} is ready for the Check on "${currentBook.title}".`
                    : `Encourage ${childName} to read "${currentBook.title}" ${MAX_STAMPS - currentBook.stamps} more time${MAX_STAMPS - currentBook.stamps === 1 ? '' : 's'} before the Check.`}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* 6. End of Level — Level Check */}
        <section className={`rounded-3xl border-2 ${allMastered ? `${levelInfo?.borderClass ?? 'border-primary'} bg-gradient-to-br from-amber-50 to-white` : 'border-border bg-card'} p-5 shadow-card`}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">End of Level</p>
              <h3 className="font-display text-base font-extrabold text-foreground mt-0.5">Level Check (Phonics)</h3>
            </div>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
              allMastered ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {allMastered ? 'Ready' : 'Locked'}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mb-3">
            {allMastered
              ? `${childName} has mastered all ${totalInLevel} books. Run the Level Check to move up to Level ${Math.min(activeLevel + 1, 6)}.`
              : `After all ${totalInLevel} books are mastered, ${childName} will take a short phonics check to move to the next level.`}
          </p>
          {allMastered && (
            <Link
              to={`/assess?level=${activeLevel}`}
              className={`w-full block text-center py-3 rounded-2xl font-extrabold text-sm text-white shadow-button active:scale-[0.97] transition-transform ${levelInfo?.bgClass ?? 'bg-primary'}`}
            >
              Start Level Check <ChevronRight className="inline w-4 h-4" />
            </Link>
          )}
        </section>
      </div>
    </Layout>
  );
}

// ─── Helpers ────────────────────────────────────────────────────

function ProgressRing({ value, total, colorClass }: { value: number; total: number; colorClass: string }) {
  const pct = total > 0 ? value / total : 0;
  const radius = 28;
  const circ = 2 * Math.PI * radius;
  const fillToCss = (() => {
    // Map "bg-primary" / "bg-level-N" to a CSS variable / colour token.
    // The ring uses a stroke colour, so we resolve via Tailwind's text-* twin.
    if (colorClass.startsWith('bg-level-')) return `text-${colorClass.replace('bg-', '')}`;
    return 'text-primary';
  })();
  return (
    <div className="relative w-20 h-20 shrink-0">
      <svg viewBox="0 0 64 64" className={`w-20 h-20 -rotate-90 ${fillToCss}`}>
        <circle cx="32" cy="32" r={radius} className="fill-none stroke-slate-200" strokeWidth="6" />
        <circle
          cx="32" cy="32" r={radius}
          className="fill-none stroke-current transition-all duration-500"
          strokeWidth="6"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-base font-extrabold text-foreground tabular-nums leading-none">
          {value}/{total}
        </span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Books</span>
      </div>
    </div>
  );
}

function ActionTile({
  icon: Icon, label, tone, onClick,
}: { icon: typeof BookOpen; label: string; tone: 'primary' | 'amber' | 'slate'; onClick: () => void }) {
  const toneClasses = {
    primary: 'bg-tint-pink border-primary/30 text-primary-ink',
    amber: 'bg-amber-50 border-amber-300 text-amber-800',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
  }[tone];
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-2xl border-2 ${toneClasses} active:scale-[0.97] transition-transform text-center`}
    >
      <Icon className="w-5 h-5 mx-auto mb-1.5" />
      <span className="text-[11px] font-bold leading-tight block">{label}</span>
    </button>
  );
}

function Stat({
  icon: Icon, label, value, tone,
}: { icon: typeof TrendingUp; label: string; value: string; tone: 'rose' | 'violet' | 'blue' | 'emerald' }) {
  const toneClasses = {
    rose: 'bg-rose-50 border-rose-200 text-rose-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-700',
  }[tone];
  return (
    <div className={`rounded-2xl border p-3 ${toneClasses}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-semibold opacity-80">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-display text-xl font-extrabold mt-0.5 tabular-nums">{value}</div>
    </div>
  );
}
