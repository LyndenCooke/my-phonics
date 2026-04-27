/**
 * ChildProgress — parent-facing dashboard surfaced on /profile.
 *
 * Two panels:
 *  1. ActivityHeatMap — GitHub-style 7×53 calendar grid, coloured by the
 *     number of stamps (i.e. unique daily reads) the child earned that day
 *     across every book. Quick visual signal of whether the kid is reading
 *     daily or once a week.
 *
 *  2. SoundBreakdown — per-level grid of every grapheme in the curriculum
 *     (L1–L6), with a small badge on each indicating how many books in that
 *     level have been opened. Toggle filters between "all sounds" (full
 *     curriculum, untested ones greyed out) and "practised" (only the
 *     sounds that appear in books the child has read at least once).
 *
 * All data is read from the local stamps store — Supabase persistence is
 * future work flagged in stamps.ts. That means the dashboard is per-device:
 * a child reading on the iPad won't show on the parent's laptop until
 * we wire the cloud sync. Acceptable for v1.
 */
import { useMemo, useState } from 'react';
import { getAllStamps, type BookStamps } from '@/lib/stamps';
import { INTERACTIVE_BOOKS, type InteractivePage } from '@/lib/interactiveBookData';
import { Calendar, Volume2, BookOpen, Star, ToggleLeft, ToggleRight } from 'lucide-react';

// ─── Curriculum sound mapping (used by SoundBreakdown) ──────────────────
// Source of truth lives in InteractiveBookReader.tsx (GRAPHEME_LEVEL); this
// is a parallel list grouped by canonical level, optimised for display.
const LEVEL_SOUNDS: Record<number, string[]> = {
  1: ['s','a','t','p','i','n','m','d','g','o','c','k','ck','e','u','r','h','b','f','l','j','v','w','x','y','z','qu','ch','sh','th','ng','nk'],
  2: ['ay','ee','igh','ow','oo','ar','or','air','ir','ou','oy'],
  3: ['a-e','i-e','o-e','u-e','ea','ie','oi','aw','ai','oa'],
  4: ['ur','er','are','ew','ue'],
  5: ['ore','ire','oor','ear','ure','tion'],
  6: ['ous','able','ible','cious','tious'],
};

const LEVEL_NAMES: Record<number, string> = {
  1: 'Starting Stories',
  2: 'Longer Sounds',
  3: 'New Spellings',
  4: 'Building Fluency',
  5: 'Reading Together',
  6: 'Reading Champion',
};

const LEVEL_ACCENT: Record<number, string> = {
  1: 'border-pink-300 bg-pink-50 text-pink-700',
  2: 'border-amber-300 bg-amber-50 text-amber-700',
  3: 'border-green-300 bg-green-50 text-green-700',
  4: 'border-blue-300 bg-blue-50 text-blue-700',
  5: 'border-purple-300 bg-purple-50 text-purple-700',
  6: 'border-teal-300 bg-teal-50 text-teal-700',
};

// ─── Activity heat map ──────────────────────────────────────────────────

interface DayCell { date: string; count: number; }

/** Build a 53-week × 7-day grid ending today. Each cell carries the date
 *  and the number of stamps earned that day. */
function buildHeatMap(allStamps: Record<string, BookStamps>): DayCell[][] {
  const dateCounts = new Map<string, number>();
  for (const stamps of Object.values(allStamps)) {
    for (const d of stamps.readDates) {
      dateCounts.set(d, (dateCounts.get(d) ?? 0) + 1);
    }
  }

  // Anchor on today; walk back 53 weeks (371 days). Grid columns = weeks
  // (Mon-start), rows = days of week.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const weeks: DayCell[][] = [];
  const dayMs = 24 * 60 * 60 * 1000;

  // Find the most-recent Sunday so the rightmost column ends on Sunday
  // (last day of week). Then walk back 53 weeks worth of days.
  const dow = today.getDay(); // 0 = Sunday
  const daysSinceSunday = dow === 0 ? 0 : 7 - dow; // days forward to Sunday
  const endOfThisWeek = new Date(today.getTime() + daysSinceSunday * dayMs);

  for (let w = 52; w >= 0; w--) {
    const col: DayCell[] = [];
    for (let d = 0; d < 7; d++) {
      // d=0 -> Monday at top, d=6 -> Sunday at bottom of column
      const offsetFromSunday = 6 - d;
      const date = new Date(endOfThisWeek.getTime() - (w * 7 + offsetFromSunday) * dayMs);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const iso = `${y}-${m}-${dd}`;
      col.push({ date: iso, count: date > today ? 0 : (dateCounts.get(iso) ?? 0) });
    }
    weeks.push(col);
  }
  return weeks;
}

function cellShade(count: number): string {
  if (count === 0) return 'bg-slate-200';
  if (count === 1) return 'bg-emerald-300';
  if (count === 2) return 'bg-emerald-400';
  if (count <= 4) return 'bg-emerald-500';
  return 'bg-emerald-600';
}

function ActivityHeatMap({ allStamps }: { allStamps: Record<string, BookStamps> }) {
  const weeks = useMemo(() => buildHeatMap(allStamps), [allStamps]);
  const totalReads = useMemo(
    () => Object.values(allStamps).reduce((sum, s) => sum + s.readDates.length, 0),
    [allStamps]
  );
  const activeDays = useMemo(() => {
    const set = new Set<string>();
    for (const s of Object.values(allStamps)) for (const d of s.readDates) set.add(d);
    return set.size;
  }, [allStamps]);

  // Build month labels above the grid — one label per first column where
  // that month appears.
  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  weeks.forEach((col, ci) => {
    const firstDate = new Date(col[0].date);
    const m = firstDate.getMonth();
    if (m !== lastMonth) {
      monthLabels.push({ col: ci, label: firstDate.toLocaleString('en', { month: 'short' }) });
      lastMonth = m;
    }
  });

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Reading Activity
        </h3>
        <span className="text-xs text-muted-foreground">
          {activeDays} {activeDays === 1 ? 'day' : 'days'} · {totalReads} {totalReads === 1 ? 'read' : 'reads'}
        </span>
      </div>

      <div className="overflow-x-auto -mx-2 px-2">
        <div className="inline-block min-w-full">
          {/* Month labels row */}
          <div className="flex gap-[2px] ml-7 mb-1 select-none">
            {weeks.map((_, ci) => {
              const m = monthLabels.find(ml => ml.col === ci);
              return (
                <div key={ci} className="w-[10px] text-[10px] text-muted-foreground">
                  {m ? <span className="block -ml-0.5 whitespace-nowrap">{m.label}</span> : null}
                </div>
              );
            })}
          </div>
          {/* Day grid */}
          <div className="flex">
            {/* Day-of-week labels */}
            <div className="flex flex-col gap-[2px] mr-1 select-none">
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((d, i) => (
                <div key={d} className="h-[10px] text-[9px] text-muted-foreground leading-[10px] pr-1 text-right w-6">
                  {i % 2 === 0 ? d : ''}
                </div>
              ))}
            </div>
            {/* Cells */}
            <div className="flex gap-[2px]">
              {weeks.map((col, ci) => (
                <div key={ci} className="flex flex-col gap-[2px]">
                  {col.map((cell) => (
                    <div
                      key={cell.date}
                      className={`w-[10px] h-[10px] rounded-[2px] ${cellShade(cell.count)}`}
                      title={`${cell.date}: ${cell.count} ${cell.count === 1 ? 'read' : 'reads'}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 mt-3 text-xs text-muted-foreground">
        <span>Less</span>
        {['bg-slate-200','bg-emerald-300','bg-emerald-400','bg-emerald-500','bg-emerald-600'].map(c => (
          <div key={c} className={`w-[10px] h-[10px] rounded-[2px] ${c}`} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}

// ─── Sound breakdown ────────────────────────────────────────────────────

/** Build a map of grapheme → set of subLevels that include it as a focus
 *  sound. Used to tell whether a sound has been "practised" yet — i.e.
 *  whether any book containing that sound has been read at least once. */
function buildSoundIndex(): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>();
  for (const [subLevel, pages] of Object.entries(INTERACTIVE_BOOKS)) {
    const grid = pages.find((p): p is Extract<InteractivePage, { type: 'sound_grid' }> => p.type === 'sound_grid');
    if (!grid) continue;
    for (const sound of grid.focusSounds) {
      if (!out.has(sound)) out.set(sound, new Set());
      out.get(sound)!.add(subLevel);
    }
  }
  return out;
}

function SoundBreakdown({ allStamps }: { allStamps: Record<string, BookStamps> }) {
  const [showOnly, setShowOnly] = useState<'all' | 'practised'>('all');

  const soundIndex = useMemo(() => buildSoundIndex(), []);
  // Books with at least one stamp = books the child has opened and read.
  const readBooks = useMemo(() => {
    const set = new Set<string>();
    for (const [subLevel, s] of Object.entries(allStamps)) {
      if (s.count > 0) set.add(subLevel);
    }
    return set;
  }, [allStamps]);

  // For each sound, find which read books contain it (gives the badge count).
  const soundReadBookCount = (sound: string): number => {
    const subs = soundIndex.get(sound);
    if (!subs) return 0;
    let n = 0;
    for (const sub of subs) if (readBooks.has(sub)) n++;
    return n;
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-primary" /> Sounds Covered
        </h3>
        <button
          onClick={() => setShowOnly(showOnly === 'all' ? 'practised' : 'all')}
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
        >
          {showOnly === 'all' ? <ToggleLeft className="w-5 h-5" /> : <ToggleRight className="w-5 h-5 text-primary" />}
          <span>{showOnly === 'all' ? 'All sounds' : 'Practised only'}</span>
        </button>
      </div>

      <div className="space-y-3">
        {([1, 2, 3, 4, 5, 6] as const).map((lvl) => {
          const sounds = LEVEL_SOUNDS[lvl];
          const visibleSounds = showOnly === 'all'
            ? sounds
            : sounds.filter(s => soundReadBookCount(s) > 0);
          if (visibleSounds.length === 0) return null;
          const accent = LEVEL_ACCENT[lvl];
          return (
            <div key={lvl}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${accent}`}>
                  Level {lvl}
                </span>
                <span className="text-xs text-muted-foreground">{LEVEL_NAMES[lvl]}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {visibleSounds.map((s) => {
                  const n = soundReadBookCount(s);
                  const practised = n > 0;
                  return (
                    <span
                      key={s}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-bold border
                        ${practised ? `${accent}` : 'border-slate-200 bg-slate-50 text-slate-400'}`}
                      title={practised ? `${n} ${n === 1 ? 'book' : 'books'} read with this sound` : 'Not yet practised'}
                    >
                      {s}
                      {practised && (
                        <span className="text-[10px] opacity-70">×{n}</span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Top-line summary cards ─────────────────────────────────────────────

function ProgressSummary({ allStamps }: { allStamps: Record<string, BookStamps> }) {
  const stats = useMemo(() => {
    const booksOpened = Object.values(allStamps).filter(s => s.count > 0).length;
    const champions = Object.values(allStamps).filter(s => s.count >= 5).length;
    const totalStamps = Object.values(allStamps).reduce((sum, s) => sum + s.count, 0);
    // Highest-level book with any stamp tells us the child's current level.
    let highestLevel = 0;
    for (const sub of Object.keys(allStamps)) {
      const s = allStamps[sub];
      if (s.count === 0) continue;
      const m = sub.match(/^L(\d+)/);
      if (m) highestLevel = Math.max(highestLevel, +m[1]);
    }
    return { booksOpened, champions, totalStamps, highestLevel };
  }, [allStamps]);

  const Card = ({ icon: Icon, label, value, accent }: {
    icon: typeof BookOpen; label: string; value: string | number; accent: string;
  }) => (
    <div className="bg-card rounded-xl border border-border p-3 shadow-card text-center">
      <div className={`w-8 h-8 rounded-lg ${accent} flex items-center justify-center mx-auto mb-1.5`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-lg font-extrabold text-foreground leading-none">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      <Card icon={BookOpen} label="Books read" value={stats.booksOpened} accent="bg-tint-pink text-primary" />
      <Card icon={Star} label="Stamps" value={stats.totalStamps} accent="bg-amber-100 text-amber-600" />
      <Card icon={Volume2} label="Champions" value={stats.champions} accent="bg-emerald-100 text-emerald-600" />
      <Card icon={Calendar} label="At level" value={stats.highestLevel || '—'} accent="bg-purple-100 text-purple-600" />
    </div>
  );
}

// ─── Composite ──────────────────────────────────────────────────────────

export function ChildProgress({ childName }: { childName?: string }) {
  // Re-read on mount; the parent component is unlikely to keep this open
  // while a child is reading, and stamps.ts has no notification mechanism.
  const allStamps = useMemo(() => getAllStamps(), []);
  const hasAny = Object.keys(allStamps).length > 0;

  return (
    <div className="space-y-4 mb-6">
      <h3 className="text-sm font-bold text-foreground">
        {childName ? `${childName}'s Progress` : "Child's Progress"}
      </h3>
      {!hasAny && (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-card text-center">
          <p className="text-sm text-muted-foreground">
            No reading activity yet on this device. Once your child reads a book, stamps
            and progress will appear here.
          </p>
        </div>
      )}
      {hasAny && (
        <>
          <ProgressSummary allStamps={allStamps} />
          <ActivityHeatMap allStamps={allStamps} />
          <SoundBreakdown allStamps={allStamps} />
        </>
      )}
    </div>
  );
}

export default ChildProgress;
