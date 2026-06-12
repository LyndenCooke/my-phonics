/**
 * ParentDashboard — adult-facing progress and controls.
 *
 * Lives at /profile/parent-dashboard. Built on the 8-level journey
 * (`lib/levels8.ts`, Curriculum Ledger v2.0). The book catalogue is still
 * tagged with legacy parent-6 sub_levels; every book is placed on the
 * 8-level journey via JOURNEY_SUBLEVEL_BY_LEGACY, so no data changes.
 *
 * Design: a full-bleed dark editorial canvas — deliberately unlike the
 * white-card child-facing app. Numbered chapters with hairline rules:
 *   Masthead — data-driven headline + current book + meta strip
 *   01 The journey — serpentine SVG map of all 8 levels (vertical on mobile)
 *   02 The rhythm — oversized stat numerals + 14-day waveform
 *   03 The sounds — grapheme tiles + tricky-word marquee
 *   04 This week — coach pull-quote
 *   05 Parent controls + Level Check banner
 *
 * Quick Actions remain best-effort stubs — local state via the stamps
 * store. The cloud unlock-next-book mutation is future work (will need a
 * Supabase RPC or direct user_books insert).
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, useInView, useReducedMotion, animate } from 'framer-motion';
import Layout from '@/components/Layout';
import { useBooks, useUserBooks, useChildren } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { getAllStamps, isReadyToMoveUp, resetStamps, MAX_STAMPS, todayIso } from '@/lib/stamps';
import { JOURNEY_LEVELS, JOURNEY_LEVEL_COUNT, getJourneyLevel, journeyPlacement, parseSubLevel, type JourneyLevel } from '@/lib/levels8';
import { getCoverImageUrl } from '@/lib/imageResolver';
import {
  ArrowLeft, BookOpen, Check, ChevronRight, Flame, Lock,
  RotateCcw, Unlock as UnlockIcon, AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

/** Canvas + accent palette for the dark editorial surface. */
const INK = '#0E0B1F';
const HAIRLINE = 'rgba(255,255,255,0.10)';

// ─── Types ──────────────────────────────────────────────────────

interface JourneyBook {
  id: string;
  legacySubLevel: string;
  title: string;
  journeyLevel: number;
  journeyIndex: number;
  coverImageUrl?: string;
  stamps: number;
  mastered: boolean;
  unlocked: boolean;
}

interface LevelRollup extends JourneyLevel {
  total: number;
  mastered: number;
  complete: boolean;
}

type NodeState = 'done' | 'current' | 'future';

/**
 * Demo mode (?demo=1) — renders the dashboard signed-out with a seeded
 * child so the design can be reviewed/demoed without an account. Journey
 * levels 1–3 mastered, partway through level 4. Fake data only; no real
 * account information is involved.
 */
const DEMO_NAME = 'Maya';

function demoStamps(): Record<string, { count: number; lastReadDate: string; readDates: string[]; checkInResults: Record<number, boolean> }> {
  const day = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const done = (...offsets: number[]) => ({
    count: 5, lastReadDate: day(offsets[offsets.length - 1]),
    readDates: offsets.map(day), checkInResults: { 3: true, 4: true, 5: true },
  });
  return {
    'L1.1': done(40, 38, 36, 34, 32), 'L1.2': done(31, 30, 29, 28, 27),
    'L1.4': done(26, 25, 24, 23, 22), 'L1.5': done(22, 21, 20, 19, 18),
    'L1.6': done(18, 17, 16, 15, 14), 'L1.7': done(14, 13, 12, 11, 10),
    'L1.8': done(13, 12, 11, 10, 9), 'L1.3': done(9, 8, 7, 6, 5),
    'L1.9': done(8, 7, 6, 5, 4), 'L1.10': done(7, 6, 5, 4, 3),
    'L2.1': done(6, 5, 4, 3, 2), 'L2.2': done(5, 4, 3, 2, 1),
    'L2.3': { count: 3, lastReadDate: day(0), readDates: [day(2), day(1), day(0)], checkInResults: { 3: true } },
  };
}

function nodeState(l: LevelRollup, activeLevel: number): NodeState {
  if (l.level === activeLevel) return 'current';
  if (l.level < activeLevel || l.complete) return 'done';
  return 'future';
}

// ─── Serpentine map geometry (desktop) ──────────────────────────
// viewBox 1200×560. Levels 1–4 run left→right on the top row, the path
// U-turns on the right, levels 5–8 run right→left on the bottom row.

const MAP_W = 1200;
const MAP_H = 560;
const ROW1_Y = 110;
const ROW2_Y = 450;
const XS = [90, 410, 730, 1050];
const MAP_PATH = `M ${XS[0]} ${ROW1_Y} H ${XS[3]} C 1215 ${ROW1_Y}, 1215 ${ROW2_Y}, ${XS[3]} ${ROW2_Y} H ${XS[0]}`;

/** Node coordinates for levels 1..8 in path order. */
const NODE_XY: { x: number; y: number }[] = [
  { x: XS[0], y: ROW1_Y }, { x: XS[1], y: ROW1_Y }, { x: XS[2], y: ROW1_Y }, { x: XS[3], y: ROW1_Y },
  { x: XS[3], y: ROW2_Y }, { x: XS[2], y: ROW2_Y }, { x: XS[1], y: ROW2_Y }, { x: XS[0], y: ROW2_Y },
];

/** Cumulative path-length fraction at each node (straight segs + ~U arc). */
const NODE_FRACTION = (() => {
  const seg = XS[1] - XS[0]; // 320
  const uTurn = 534;         // approx cubic length
  const cum = [0, seg, seg * 2, seg * 3, seg * 3 + uTurn];
  for (let i = 5; i < 8; i++) cum.push(cum[i - 1] + seg);
  const total = cum[7];
  return cum.map(c => c / total);
})();

// ─── Page ───────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { data: booksData } = useBooks(null);
  const { data: userBooksData } = useUserBooks();
  const { data: children } = useChildren();
  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get('demo') === '1';
  const stamps = useMemo(() => (isDemo ? demoStamps() : getAllStamps()), [isDemo]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [freeMode, setFreeMode] = useState(false);
  const reduceMotion = useReducedMotion();

  const child = children?.[0] as { id?: string; name?: string; current_level?: number } | undefined;
  const childName = isDemo ? DEMO_NAME : child?.name ?? 'your child';
  const displayName = isDemo ? DEMO_NAME : child?.name ?? 'Your child';

  // Place every book on the 8-level journey with its mastery state.
  const books = useMemo<JourneyBook[]>(() => {
    if (!booksData) return [];
    const userBookIds = new Set((userBooksData ?? []).map(ub => ub.book_id));
    return booksData
      .map(b => {
        const placed = journeyPlacement(b.sub_level)
          ?? { ...(parseSubLevel(b.sub_level) ?? { level: 1, index: 99 }), subLevel: b.sub_level };
        const s = stamps[b.sub_level] ?? { count: 0, lastReadDate: '', readDates: [], checkInResults: {} };
        return {
          id: b.id,
          legacySubLevel: b.sub_level,
          title: b.title,
          journeyLevel: placed.level,
          journeyIndex: placed.index,
          coverImageUrl: b.cover_image_url ?? undefined,
          stamps: s.count,
          mastered: isReadyToMoveUp(s),
          unlocked: isDemo
            ? placed.level <= 5
            : isAdmin || userBookIds.has(b.id) || (b.is_free_sample ?? false),
        };
      })
      .sort((a, b) => a.journeyLevel - b.journeyLevel || a.journeyIndex - b.journeyIndex);
  }, [booksData, userBooksData, stamps, isAdmin, isDemo]);

  const activeLevel = useMemo(() => {
    const firstUnmastered = books.find(b => b.unlocked && !b.mastered);
    if (firstUnmastered) return firstUnmastered.journeyLevel;
    const lastUnlocked = [...books].reverse().find(b => b.unlocked);
    return lastUnlocked?.journeyLevel ?? 1;
  }, [books]);

  const levelInfo = getJourneyLevel(activeLevel) ?? JOURNEY_LEVELS[0];
  const levelBooks = books.filter(b => b.journeyLevel === activeLevel);
  const masteredInLevel = levelBooks.filter(b => b.mastered).length;
  const allMastered = levelBooks.length > 0 && masteredInLevel === levelBooks.length;
  const currentBook = levelBooks.find(b => b.unlocked && !b.mastered) ?? levelBooks[levelBooks.length - 1];
  // The assessment route still speaks legacy parent-6 levels.
  const legacyAssessLevel = currentBook ? parseSubLevel(currentBook.legacySubLevel)?.level ?? 1 : 1;

  const levelRollup = useMemo<LevelRollup[]>(() => JOURNEY_LEVELS.map(li => {
    const inLevel = books.filter(b => b.journeyLevel === li.level);
    const mastered = inLevel.filter(b => b.mastered).length;
    return { ...li, total: inLevel.length, mastered, complete: inLevel.length > 0 && mastered === inLevel.length };
  }), [books]);

  const overallMastered = books.filter(b => b.mastered).length;
  const journeyProgress = useMemo(() => {
    const done = levelRollup.filter(l => l.complete && l.level < activeLevel).length;
    const activeFrac = levelBooks.length > 0 ? masteredInLevel / levelBooks.length : 0;
    return Math.min(1, (done + activeFrac) / JOURNEY_LEVEL_COUNT);
  }, [levelRollup, activeLevel, levelBooks.length, masteredInLevel]);
  const pct = Math.round(journeyProgress * 100);

  // How far along the serpentine path the progress stroke should reach.
  const pathProgress = useMemo(() => {
    const i = activeLevel - 1;
    const here = NODE_FRACTION[i];
    const next = NODE_FRACTION[Math.min(i + 1, 7)];
    const frac = levelBooks.length > 0 ? masteredInLevel / levelBooks.length : 0;
    return Math.min(1, here + (next - here) * frac);
  }, [activeLevel, levelBooks.length, masteredInLevel]);

  // Reading activity — reads per day for the last 14 days + weekly totals.
  const activity = useMemo(() => {
    const perDay = new Map<string, number>();
    for (const s of Object.values(stamps)) {
      for (const d of s.readDates ?? []) perDay.set(d, (perDay.get(d) ?? 0) + 1);
    }
    const days: { iso: string; reads: number }[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({ iso, reads: perDay.get(iso) ?? 0 });
    }
    const week = days.slice(7);
    const readsThisWeek = week.reduce((n, d) => n + d.reads, 0);
    const daysActive = week.filter(d => d.reads > 0).length;
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i].reads > 0) streak++;
      else if (i === days.length - 1) continue; // today empty doesn't break yesterday's streak
      else break;
    }
    return { days, readsThisWeek, daysActive, readingMinutes: readsThisWeek * 7, streak };
  }, [stamps]);

  const handleResetCurrent = () => {
    if (!currentBook) return;
    if (!confirm(`Reset progress for "${currentBook.title}"? This clears stamps and check results.`)) return;
    resetStamps(currentBook.legacySubLevel);
    toast({ title: 'Progress reset', description: `${currentBook.title} is back to 0 reads.` });
    queryClient.invalidateQueries({ queryKey: ['user_books'] });
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

  const toggleFreeMode = () => {
    setFreeMode(!freeMode);
    toast({
      title: !freeMode ? 'Free Reading Mode on' : 'Guided Mode on',
      description: !freeMode
        ? 'All books are tappable. Reads and checks are still tracked.'
        : 'Books unlock only when checks are passed.',
    });
  };

  if (!user && !isDemo) {
    return (
      <Layout>
        <div className="px-4 pt-5 pb-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-muted-foreground">Sign in to see your dashboard.</p>
        </div>
      </Layout>
    );
  }

  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.6, ease: EASE },
      };

  return (
    <Layout>
      {/* Full-bleed dark canvas. Negative bottom margin swallows <main>'s
          nav-clearance padding so no light strip shows beneath the ink. */}
      <div
        className="min-h-screen text-white -mb-[calc(5rem+env(safe-area-inset-bottom))] md:-mb-4 pb-[calc(8rem+env(safe-area-inset-bottom))] md:pb-20 selection:bg-pink-500/40"
        style={{ background: `radial-gradient(1200px 600px at 80% -10%, ${levelInfo.hex}1f, transparent), radial-gradient(900px 500px at -10% 40%, #E84B8A14, transparent), ${INK}` }}
      >
        <style>{`
          @keyframes mpb-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @keyframes mpb-halo { from { transform: scale(1); opacity: .5; } to { transform: scale(2.1); opacity: 0; } }
          @media (prefers-reduced-motion: reduce) {
            .mpb-marquee-track { animation: none !important; }
            .mpb-halo { animation: none !important; opacity: .25; }
          }
        `}</style>

        <div className="max-w-6xl mx-auto px-5 lg:px-10 pt-6 lg:pt-10">
          {/* Breadcrumb */}
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/40 hover:text-white/80 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Profile
          </Link>

          {/* ═══ Masthead ═══ */}
          <motion.header
            {...(reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, ease: EASE } })}
            className="mt-8 lg:mt-12"
          >
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">
                  Parent dashboard
                </p>
                <h1 className="font-display font-extrabold tracking-tight mt-4 text-[clamp(2.2rem,5.5vw,4.25rem)] leading-[1.02] max-w-3xl">
                  {displayName} is {pct}% of the way to{' '}
                  <span
                    className="text-transparent bg-clip-text"
                    style={{ backgroundImage: `linear-gradient(90deg, ${levelInfo.hex}, #E84B8A)` }}
                  >
                    Reading Champion.
                  </span>
                </h1>
              </div>

              {/* Current book — desktop only; mobile gets it in the meta strip */}
              {currentBook && (
                <div className="hidden lg:block relative shrink-0 mr-4">
                  <motion.div
                    {...(reduceMotion ? {} : {
                      initial: { opacity: 0, rotate: 10, y: 20 },
                      animate: { opacity: 1, rotate: 4, y: 0 },
                      transition: { duration: 0.8, delay: 0.15, ease: EASE },
                    })}
                    className="w-36 h-36 rounded-2xl overflow-hidden rotate-[4deg]"
                    style={{ boxShadow: `0 30px 70px -18px ${levelInfo.hex}80, 0 0 0 1px rgba(255,255,255,0.12)` }}
                  >
                    <BookCover book={currentBook} />
                  </motion.div>
                  <span className="absolute -bottom-2 -left-4 rounded-full bg-white text-[10px] font-extrabold uppercase tracking-wider text-slate-900 px-2.5 py-1 shadow-xl -rotate-3">
                    Now reading
                  </span>
                </div>
              )}
            </div>

            {/* Meta strip — hairline table */}
            <div className="mt-10 lg:mt-12 border-y grid grid-cols-2 lg:grid-cols-4" style={{ borderColor: HAIRLINE }}>
              <Meta label="Now on" first>
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: levelInfo.hex }} />
                  Level {activeLevel} · {levelInfo.name}
                </span>
              </Meta>
              <Meta label="Age band">{levelInfo.ageRange.replace('Ages ', '')}</Meta>
              <Meta label="Now reading">
                <span className="truncate block max-w-[14rem]">{currentBook ? currentBook.title : '—'}</span>
              </Meta>
              <Meta label="Streak">
                {activity.streak > 0 ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> {activity.streak} day{activity.streak === 1 ? '' : 's'}
                  </span>
                ) : '—'}
              </Meta>
            </div>
          </motion.header>

          {/* ═══ 01 · The journey ═══ */}
          <motion.section {...fadeUp} className="mt-16 lg:mt-24">
            <Chapter n="01" title="The journey" note={`${pct}% complete`} />

            {/* Desktop — serpentine map */}
            <div className="hidden lg:block mt-12">
              <div className="relative w-full" style={{ aspectRatio: `${MAP_W} / ${MAP_H}` }}>
                <svg viewBox={`0 0 ${MAP_W} ${MAP_H}`} fill="none" className="absolute inset-0 w-full h-full" aria-hidden>
                  <path d={MAP_PATH} stroke="rgba(255,255,255,0.10)" strokeWidth="3" strokeDasharray="1 10" strokeLinecap="round" />
                  <motion.path
                    d={MAP_PATH}
                    stroke={`url(#mpb-journey-grad)`}
                    strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: pathProgress }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: reduceMotion ? 0 : 1.8, ease: EASE }}
                  />
                  <defs>
                    <linearGradient id="mpb-journey-grad" x1="0" y1="0" x2={MAP_W} y2={MAP_H} gradientUnits="userSpaceOnUse">
                      <stop offset="0" stopColor={JOURNEY_LEVELS[0].hex} />
                      <stop offset="1" stopColor={levelInfo.hex} />
                    </linearGradient>
                  </defs>
                </svg>
                {levelRollup.map((l, i) => (
                  <MapNode key={l.level} level={l} state={nodeState(l, activeLevel)} x={NODE_XY[i].x} y={NODE_XY[i].y} index={i} reduceMotion={!!reduceMotion} />
                ))}
              </div>
            </div>

            {/* Mobile — vertical route */}
            <div className="lg:hidden mt-10 relative">
              <div className="absolute left-[1.4rem] top-4 bottom-4 w-px border-l-2 border-dashed border-white/15" aria-hidden />
              <div className="space-y-7">
                {levelRollup.map(l => {
                  const state = nodeState(l, activeLevel);
                  return (
                    <div key={l.level} className="relative flex gap-5">
                      <NodeDot level={l} state={state} />
                      <div className="flex-1 min-w-0 pt-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={`font-display font-extrabold ${state === 'future' ? 'text-white/35' : 'text-white'}`}>{l.name}</p>
                          <p className="text-[11px] font-bold text-white/35 tabular-nums shrink-0">
                            {l.total > 0 ? `${l.mastered}/${l.total}` : '—'}
                          </p>
                        </div>
                        {state === 'current' && <p className="text-xs text-white/50 mt-1 leading-relaxed">{l.focus}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current-level ledger row */}
            <div className="mt-12 lg:mt-6 border-t pt-7" style={{ borderColor: HAIRLINE }}>
              <div className="flex flex-col lg:flex-row lg:items-start gap-6 lg:gap-12">
                <div className="shrink-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: levelInfo.hex }}>
                    Now on · {levelInfo.colourName}
                  </p>
                  <h3 className="font-display text-3xl font-extrabold mt-2">{levelInfo.name}</h3>
                  <p className="text-sm text-white/50 mt-1 max-w-xs leading-relaxed">{levelInfo.focus}</p>
                </div>
                <div className="flex-1 flex flex-wrap gap-2.5 content-start">
                  {levelBooks.map(b => (
                    <span
                      key={b.id}
                      title={b.mastered ? 'Mastered' : b.unlocked ? `${b.stamps}/${MAX_STAMPS} reads` : 'Locked'}
                      className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-bold"
                      style={b.mastered
                        ? { background: levelInfo.hex, borderColor: levelInfo.hex, color: '#fff' }
                        : { borderColor: 'rgba(255,255,255,0.18)', color: b.unlocked ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.35)' }}
                    >
                      {b.mastered ? <Check className="w-3 h-3" strokeWidth={3.5} /> : !b.unlocked ? <Lock className="w-3 h-3" /> : (
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ background: `conic-gradient(${levelInfo.hex} ${(b.stamps / MAX_STAMPS) * 360}deg, rgba(255,255,255,0.15) 0deg)` }}
                        />
                      )}
                      {b.title}
                    </span>
                  ))}
                </div>
                <div className="shrink-0 lg:text-right">
                  <p className="font-display text-6xl font-extrabold leading-none tabular-nums" style={{ color: levelInfo.hex }}>
                    {masteredInLevel}<span className="text-white/30 text-3xl">/{levelBooks.length}</span>
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/40 mt-2">Books mastered</p>
                </div>
              </div>
            </div>
          </motion.section>

          {/* ═══ 02 · The rhythm ═══ */}
          <motion.section {...fadeUp} className="mt-16 lg:mt-24">
            <Chapter n="02" title="The rhythm" note="Last 7 days" />
            <div className="mt-10 grid grid-cols-2 lg:grid-cols-4">
              <Figure value={activity.readsThisWeek} label="Reads this week" first />
              <Figure value={activity.daysActive} label="Days active" suffix="/7" />
              <Figure value={activity.readingMinutes} label="Minutes reading" />
              <Figure value={overallMastered} label="Books mastered" />
            </div>

            {/* 14-day waveform */}
            <div className="mt-12">
              <div className="flex items-end gap-[5px] lg:gap-2 h-24 lg:h-32">
                {(() => {
                  const max = Math.max(1, ...activity.days.map(d => d.reads));
                  return activity.days.map(d => {
                    const isToday = d.iso === todayIso();
                    const h = d.reads === 0 ? 6 : 12 + (d.reads / max) * 88;
                    return (
                      <div
                        key={d.iso}
                        title={`${new Date(`${d.iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} — ${d.reads} read${d.reads === 1 ? '' : 's'}`}
                        className="flex-1 rounded-t-md transition-colors"
                        style={{
                          height: `${h}%`,
                          background: d.reads === 0 ? 'rgba(255,255,255,0.08)' : isToday ? levelInfo.hex : `${levelInfo.hex}99`,
                        }}
                      />
                    );
                  });
                })()}
              </div>
              <div className="flex gap-[5px] lg:gap-2 mt-2 border-t pt-2" style={{ borderColor: HAIRLINE }}>
                {activity.days.map(d => (
                  <span key={d.iso} className="flex-1 text-center text-[9px] lg:text-[10px] font-bold uppercase text-white/30">
                    {new Date(`${d.iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}
                  </span>
                ))}
              </div>
              <p className="text-xs text-white/40 mt-4 max-w-md leading-relaxed">
                {activity.daysActive > 0
                  ? `${childName} read on ${activity.daysActive} of the last 7 days. Little and often beats long sessions.`
                  : 'No reads this week yet — even 5 minutes today keeps the rhythm going.'}
              </p>
            </div>
          </motion.section>

          {/* ═══ 03 · The sounds ═══ */}
          <motion.section {...fadeUp} className="mt-16 lg:mt-24">
            <Chapter n="03" title="The sounds" note={`Level ${activeLevel} · ${levelInfo.colourName}`} />
            <p className="mt-6 text-sm text-white/50 max-w-md leading-relaxed">
              Every book at {levelInfo.name} is built from these letter-sounds. Point at them anywhere — signs, cereal boxes, this screen.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 lg:gap-4">
              {levelInfo.gpcs.map((g, i) => (
                <span
                  key={g}
                  className={`font-child font-bold text-2xl lg:text-4xl px-5 py-3 lg:px-7 lg:py-4 rounded-2xl border transition-transform hover:scale-105 hover:rotate-0 ${i % 3 === 0 ? 'rotate-2' : i % 3 === 1 ? '-rotate-1' : 'rotate-1'}`}
                  style={{ borderColor: `${levelInfo.hex}55`, background: `${levelInfo.hex}14`, color: '#fff' }}
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Tricky-word marquee */}
            {levelInfo.trickyWords.length > 0 && (
              <div className="mt-12 border-y py-4 overflow-hidden" style={{ borderColor: HAIRLINE }}>
                <div className="mpb-marquee-track flex w-max items-center gap-10 whitespace-nowrap" style={{ animation: 'mpb-marquee 28s linear infinite' }}>
                  {[0, 1].map(copy => (
                    <div key={copy} className="flex items-center gap-10" aria-hidden={copy === 1}>
                      <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/35">New tricky words</span>
                      {levelInfo.trickyWords.map(w => (
                        <span key={w} className="font-child text-xl lg:text-2xl font-bold text-white/80">{w}</span>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.section>

          {/* ═══ 04 · This week ═══ */}
          <motion.section {...fadeUp} className="mt-16 lg:mt-24">
            <Chapter n="04" title="This week's step" />
            <blockquote
              className="mt-8 font-display font-extrabold tracking-tight text-[clamp(1.6rem,3.6vw,2.75rem)] leading-[1.15] max-w-3xl border-l-4 pl-6 lg:pl-8"
              style={{ borderColor: levelInfo.hex }}
            >
              {!currentBook
                ? 'Pick a first book in the library to begin the journey.'
                : currentBook.mastered
                  ? allMastered
                    ? `Level ${activeLevel} is complete — time for the Level Check.`
                    : `“${currentBook.title}” is mastered. On to the next book.`
                  : currentBook.stamps >= MAX_STAMPS
                    ? `${displayName} is ready for the final check on “${currentBook.title}”.`
                    : `Read “${currentBook.title}” ${MAX_STAMPS - currentBook.stamps} more time${MAX_STAMPS - currentBook.stamps === 1 ? '' : 's'} this week.`}
            </blockquote>
            <p className="mt-5 text-sm text-white/45 max-w-md leading-relaxed pl-6 lg:pl-8">
              Five spaced reads of the same book builds real fluency — that's the heart of the method.
            </p>
            <div className="mt-7 pl-6 lg:pl-8">
              <Link
                to="/library"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-900 shadow-2xl press-scale"
              >
                Open the library <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.section>

          {/* ═══ 05 · Parent controls ═══ */}
          <motion.section {...fadeUp} className="mt-16 lg:mt-24">
            <Chapter n="05" title="Parent controls" />
            <div className="mt-6 border-t" style={{ borderColor: HAIRLINE }}>
              <ControlRow
                icon={UnlockIcon}
                hex={levelInfo.hex}
                title="Unlock next book"
                description="Skip ahead when you know they're ready."
                onClick={handleUnlockNext}
              />
              <ControlRow
                icon={BookOpen}
                hex="#F59E0B"
                title={freeMode ? 'Free Reading Mode — on' : 'Free Reading Mode'}
                description="Let them browse every unlocked book, no gates."
                onClick={toggleFreeMode}
                toggle={freeMode}
              />
              <ControlRow
                icon={RotateCcw}
                hex="#94A3B8"
                title="Reset current book"
                description={currentBook ? `Clear reads and checks for “${currentBook.title}”.` : 'No active book to reset.'}
                onClick={handleResetCurrent}
              />
            </div>
            {freeMode && (
              <div className="mt-5 flex items-start gap-2.5 border-l-2 border-amber-400/60 pl-4 py-1">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/80 leading-relaxed">
                  Free Reading Mode is on — Guided Mode is off. {childName} can open any book, but progress is still tracked.
                </p>
              </div>
            )}
          </motion.section>

          {/* ═══ Level Check banner ═══ */}
          <motion.section
            {...fadeUp}
            className="mt-16 lg:mt-24 rounded-3xl border p-7 lg:p-10 relative overflow-hidden"
            style={allMastered
              ? { borderColor: `${levelInfo.hex}88`, background: `linear-gradient(120deg, ${levelInfo.hex}26, transparent 60%)` }
              : { borderColor: HAIRLINE }}
          >
            {allMastered && (
              <div aria-hidden className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-30" style={{ background: levelInfo.hex }} />
            )}
            <div className="relative flex flex-col lg:flex-row lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">End of level</p>
                <h3 className="font-display text-2xl lg:text-3xl font-extrabold mt-2">
                  Level {activeLevel} Check —{' '}
                  <span style={{ color: allMastered ? levelInfo.hex : 'rgba(255,255,255,0.35)' }}>
                    {allMastered ? 'ready' : 'locked'}
                  </span>
                </h3>
                <p className="text-sm text-white/50 mt-3 max-w-xl leading-relaxed">
                  {allMastered
                    ? `${childName} has mastered all ${levelBooks.length} books at this level. A short phonics check moves them up to ${activeLevel < JOURNEY_LEVEL_COUNT ? `Level ${activeLevel + 1} — ${getJourneyLevel(activeLevel + 1)?.name}` : 'the Reading Champion certificate'}.`
                    : `Master all ${levelBooks.length || ''} books at this level and a short phonics check unlocks ${activeLevel < JOURNEY_LEVEL_COUNT ? `Level ${activeLevel + 1} — ${getJourneyLevel(activeLevel + 1)?.name}` : 'the Reading Champion certificate'}.`}
                </p>
              </div>
              {allMastered ? (
                <Link
                  to={`/assess?level=${legacyAssessLevel}`}
                  className="shrink-0 inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold text-white press-scale"
                  style={{ background: levelInfo.hex, boxShadow: `0 12px 36px -8px ${levelInfo.hex}AA` }}
                >
                  Start Level Check <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <div className="shrink-0 inline-flex items-center gap-2 text-sm font-bold text-white/40">
                  <Lock className="w-4 h-4" /> {masteredInLevel} of {levelBooks.length} mastered
                </div>
              )}
            </div>
          </motion.section>

          {/* Colophon */}
          <p className="mt-16 lg:mt-20 text-[11px] font-bold uppercase tracking-[0.25em] text-white/25 text-center">
            Eight levels · {books.length} books · Curriculum Ledger v2.0
          </p>
        </div>
      </div>
    </Layout>
  );
}

// ─── Map pieces ─────────────────────────────────────────────────

function NodeDot({ level, state }: { level: LevelRollup; state: NodeState }) {
  if (state === 'future') {
    return (
      <div className="relative z-10 w-11 h-11 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center font-display font-extrabold text-white/35 shrink-0" style={{ background: INK }}>
        {level.level}
      </div>
    );
  }
  return (
    <div className="relative shrink-0">
      {state === 'current' && (
        <span className="mpb-halo absolute inset-0 rounded-full" style={{ background: level.hex, animation: 'mpb-halo 2.4s ease-out infinite' }} aria-hidden />
      )}
      <div
        className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-display font-extrabold text-white"
        style={{ background: level.hex, boxShadow: `0 10px 30px -8px ${level.hex}` }}
      >
        {state === 'done' && level.complete ? <Check className="w-5 h-5" strokeWidth={3} /> : level.level}
      </div>
    </div>
  );
}

function MapNode({ level, state, x, y, index, reduceMotion }: {
  level: LevelRollup; state: NodeState; x: number; y: number; index: number; reduceMotion: boolean;
}) {
  return (
    <motion.div
      className="absolute flex flex-col items-center text-center w-40 -translate-x-1/2"
      style={{ left: `${(x / MAP_W) * 100}%`, top: `${(y / MAP_H) * 100}%`, marginTop: -27 }}
      {...(reduceMotion ? {} : {
        initial: { opacity: 0, scale: 0.6 },
        whileInView: { opacity: 1, scale: 1 },
        viewport: { once: true, margin: '-60px' },
        transition: { duration: 0.45, delay: 0.15 + index * 0.1, ease: EASE },
      })}
    >
      <NodeDot level={level} state={state} />
      <p className={`font-display font-extrabold text-sm mt-3 ${state === 'future' ? 'text-white/35' : 'text-white'}`}>
        {level.name}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/30 mt-1 tabular-nums">
        {level.total > 0 ? `${level.mastered}/${level.total} books` : 'Coming soon'}
      </p>
    </motion.div>
  );
}

// ─── Editorial pieces ───────────────────────────────────────────

function Chapter({ n, title, note }: { n: string; title: string; note?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b pb-4" style={{ borderColor: HAIRLINE }}>
      <h2 className="font-display text-xl lg:text-2xl font-extrabold tracking-tight">
        <span className="text-white/30 mr-3 font-bold">{n}</span>
        {title}
      </h2>
      {note && <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/35 tabular-nums shrink-0">{note}</span>}
    </div>
  );
}

function Meta({ label, children, first = false }: { label: string; children: ReactNode; first?: boolean }) {
  return (
    <div className={`py-5 pr-6 ${first ? '' : 'lg:border-l lg:pl-6'}`} style={{ borderColor: HAIRLINE }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/35">{label}</p>
      <div className="font-display font-extrabold text-base lg:text-lg mt-1.5 text-white/90">{children}</div>
    </div>
  );
}

/** Oversized editorial numeral with count-up. */
function Figure({ value, label, suffix = '', first = false }: { value: number; label: string; suffix?: string; first?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduceMotion) { el.textContent = String(value); return; }
    const controls = animate(0, value, {
      duration: 1.2,
      ease: EASE,
      onUpdate: v => { el.textContent = String(Math.round(v)); },
    });
    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <div className={`py-2 ${first ? '' : 'lg:border-l lg:pl-8'}`} style={{ borderColor: HAIRLINE }}>
      <p className="font-display text-5xl lg:text-7xl font-extrabold tabular-nums leading-none">
        <span ref={ref}>0</span>
        <span className="text-white/25 text-2xl lg:text-4xl">{suffix}</span>
      </p>
      <p className="text-[10px] lg:text-[11px] font-bold uppercase tracking-[0.22em] text-white/40 mt-3">{label}</p>
    </div>
  );
}

function BookCover({ book }: { book: JourneyBook }) {
  const cover = getCoverImageUrl(book.legacySubLevel, book.coverImageUrl);
  return cover ? (
    <img src={cover} alt="" className="w-full h-full object-cover" />
  ) : (
    <div className="w-full h-full bg-white/10 flex items-center justify-center">
      <BookOpen className="w-10 h-10 text-white/40" />
    </div>
  );
}

function ControlRow({ icon: Icon, hex, title, description, onClick, toggle }: {
  icon: typeof BookOpen; hex: string; title: string; description: string;
  onClick: () => void; toggle?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 lg:gap-5 py-4 lg:py-5 text-left group border-b hover:bg-white/[0.03] transition-colors px-1"
      style={{ borderColor: HAIRLINE }}
    >
      <span
        className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
        style={{ borderColor: `${hex}55`, color: hex, background: `${hex}14` }}
      >
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm lg:text-base font-extrabold text-white">{title}</span>
        <span className="block text-xs text-white/45 mt-0.5 leading-snug">{description}</span>
      </span>
      {toggle !== undefined ? (
        <span
          className="w-11 h-6 rounded-full p-0.5 transition-colors shrink-0"
          style={{ background: toggle ? hex : 'rgba(255,255,255,0.15)' }}
          aria-hidden
        >
          <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${toggle ? 'translate-x-5' : ''}`} />
        </span>
      ) : (
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors shrink-0" />
      )}
    </button>
  );
}
