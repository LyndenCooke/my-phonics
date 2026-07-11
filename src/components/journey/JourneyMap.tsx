/**
 * Curriculum Journey Map: an interactive two-scale "you are here" view of
 * the whole 462-lesson phonics journey. The zoomed-out view shows the 8
 * levels as medallion checkpoints along a winding trail that fills with
 * each level's colour as the child travels it; tapping a level zooms into
 * its teaching blocks (one mini checkpoint per sound or skill cycle) with
 * day pips on the current block, matching the printed lesson pages.
 *
 * Renders purely from /journey/lesson_map.json (npm run journey:build)
 * plus the currentLesson prop. Reads shared data, never writes it.
 */

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, BookOpen, Check, Clock, Loader2, X } from 'lucide-react';
import {
  blockState,
  lessonOutline,
  levelProgress,
  levelState,
  locateLesson,
  useJourneyModel,
  type JourneyBlock,
  type JourneyLevelModel,
  type JourneyModel,
  type JourneyPosition,
  type ProgressState,
} from './journeyData';

interface JourneyMapProps {
  /** The lesson the child is on now, 1 to 462. */
  currentLesson: number;
  /** Set false to swap views instantly with no zoom animation. */
  animated?: boolean;
  className?: string;
}

interface Point {
  x: number;
  y: number;
}

/* ------------------------------------------------------------------ */
/* Path geometry                                                       */
/* ------------------------------------------------------------------ */

/**
 * Board-game serpentine: checkpoints flow left to right along a row,
 * bend down and come back right to left, like a winding trail. On wide
 * screens the rows are long (landscape); on phones they shrink to two
 * columns, which reads as the familiar vertical zigzag.
 */
function serpentinePoints(
  count: number,
  cols: number,
  opts: { xMargin: number; yStart: number; yEnd: number; wave: number },
): { points: Point[]; rows: number } {
  const rows = Math.ceil(count / cols);
  const { xMargin, yStart, yEnd, wave } = opts;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cc = r % 2 === 0 ? c : cols - 1 - c;
    const x = cols === 1 ? 50 : xMargin + (cc * (100 - 2 * xMargin)) / (cols - 1);
    const yRow = rows === 1 ? (yStart + yEnd) / 2 : yStart + (r * (yEnd - yStart)) / (rows - 1);
    // A gentle bend within each row so the trail never reads as a rail.
    const y = yRow + (cc % 2 === 0 ? -wave : wave);
    points.push({ x, y });
  }
  return { points, rows };
}

interface Cubic {
  a: Point;
  c1: Point;
  c2: Point;
  b: Point;
}

/**
 * One Catmull-Rom cubic per consecutive checkpoint pair. Keeping the
 * segments separate (rather than one path) lets the trail colour each
 * travelled stretch with a gradient between its two levels.
 */
function segmentCubics(p: Point[]): Cubic[] {
  const segs: Cubic[] = [];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    segs.push({
      a: p1,
      c1: { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 },
      c2: { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 },
      b: p2,
    });
  }
  return segs;
}

const cubicD = (s: Cubic) =>
  `M ${s.a.x} ${s.a.y} C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`;

/** The whole trail as one path, for the untravelled base road. */
function smoothPath(p: Point[]): string {
  if (p.length < 2) return '';
  return segmentCubics(p)
    .map((s, i) =>
      i === 0 ? cubicD(s) : ` C ${s.c1.x} ${s.c1.y}, ${s.c2.x} ${s.c2.y}, ${s.b.x} ${s.b.y}`,
    )
    .join('');
}

const cubicAt = (s: Cubic, t: number): Point => {
  const u = 1 - t;
  return {
    x: u * u * u * s.a.x + 3 * u * u * t * s.c1.x + 3 * u * t * t * s.c2.x + t * t * t * s.b.x,
    y: u * u * u * s.a.y + 3 * u * u * t * s.c1.y + 3 * u * t * t * s.c2.y + t * t * t * s.b.y,
  };
};

/**
 * The first `frac` (by arc length) of a cubic, as a sampled polyline path.
 * Used to part-fill the segment the child is currently travelling.
 */
function partialCubicD(s: Cubic, frac: number): string {
  const N = 64;
  const pts: Point[] = [];
  const lens: number[] = [0];
  for (let i = 0; i <= N; i++) {
    const p = cubicAt(s, i / N);
    pts.push(p);
    if (i > 0) lens.push(lens[i - 1] + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y));
  }
  const target = lens[N] * Math.min(Math.max(frac, 0), 1);
  let d = `M ${pts[0].x} ${pts[0].y}`;
  let i = 1;
  for (; i <= N && lens[i] <= target; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
  if (i <= N && lens[i] > lens[i - 1]) {
    // Interpolate the exact end point so short fills still paint.
    const t = (target - lens[i - 1]) / (lens[i] - lens[i - 1]);
    const px = pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t;
    const py = pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t;
    d += ` L ${px} ${py}`;
  }
  return d;
}

/** True when the map has room to lay the trail out in landscape rows. */
function useIsWide(): boolean {
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches,
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => setWide(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return wide;
}

/* ------------------------------------------------------------------ */
/* The trail                                                           */
/* ------------------------------------------------------------------ */

/**
 * The road itself, drawn in three layers: a soft base road for the whole
 * journey, a stitched centre line, and on top the travelled stretch —
 * each segment filled with a gradient running from its start level's
 * colour to its end level's, with a soft glow underneath. The segment
 * the child is currently on part-fills to show momentum toward the next
 * checkpoint.
 */
function Trail({
  points,
  colors,
  filled,
  partialFrac,
  reduced,
}: {
  points: Point[];
  /** One colour per checkpoint; segment i blends colors[i] -> colors[i+1]. */
  colors: string[];
  /** Number of fully travelled segments. */
  filled: number;
  /** 0..1 fill of the segment after the filled ones. */
  partialFrac: number;
  reduced: boolean;
}) {
  const uid = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  // Draw in real pixels: dash patterns and pathLength animations are
  // unreliable under a stretched viewBox with non-scaling strokes.
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const px = useMemo(
    () =>
      size
        ? points.map((p) => ({ x: (p.x / 100) * size.w, y: (p.y / 100) * size.h }))
        : null,
    [points, size],
  );
  const segs = useMemo(() => (px ? segmentCubics(px) : []), [px]);

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 w-full h-full"
      viewBox={size ? `0 0 ${size.w} ${size.h}` : undefined}
      aria-hidden="true"
    >
      {px && (
        <>
          <defs>
            {segs.map((s, i) => (
              <linearGradient
                key={i}
                id={`${uid}-g${i}`}
                gradientUnits="userSpaceOnUse"
                x1={s.a.x}
                y1={s.a.y}
                x2={s.b.x}
                y2={s.b.y}
              >
                <stop offset="0%" stopColor={colors[i]} />
                <stop offset="100%" stopColor={colors[i + 1] ?? colors[i]} />
              </linearGradient>
            ))}
          </defs>

          {/* Base road: the journey still to come. */}
          <path
            d={smoothPath(px)}
            fill="none"
            stroke="#E8EDF4"
            strokeWidth={13}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={smoothPath(px)}
            fill="none"
            stroke="#C9D4E2"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeDasharray="1 12"
          />

          {/* Travelled road, one gradient segment at a time. */}
          {segs.map((s, i) => {
            const isFull = i < filled;
            const isPartial = i === filled && partialFrac > 0.001;
            if (!isFull && !isPartial) return null;
            const d = isFull ? cubicD(s) : partialCubicD(s, partialFrac);
            const stroke = `url(#${uid}-g${i})`;
            const transition = reduced
              ? { duration: 0 }
              : { duration: 0.6, delay: 0.15 + i * 0.11, ease: 'easeInOut' as const };
            return (
              <g key={i}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={20}
                  strokeLinecap="round"
                  opacity={0.22}
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={transition}
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={13}
                  strokeLinecap="round"
                  initial={{ pathLength: reduced ? 1 : 0 }}
                  animate={{ pathLength: 1 }}
                  transition={transition}
                />
                <motion.path
                  d={d}
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="1 12"
                  opacity={0.9}
                  initial={{ opacity: reduced ? 0.9 : 0 }}
                  animate={{ opacity: 0.9 }}
                  transition={transition}
                />
              </g>
            );
          })}
        </>
      )}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Scenery                                                             */
/* ------------------------------------------------------------------ */

/** Soft atmosphere behind the trail: colour glows and faint sparkles. */
function Scenery({ glowA, glowB, reduced }: { glowA: string; glowB: string; reduced: boolean }) {
  const sparkles = [
    { x: 6, y: 10, size: 14, delay: 0 },
    { x: 93, y: 16, size: 10, delay: 1.1 },
    { x: 4, y: 74, size: 9, delay: 2.0 },
    { x: 95, y: 66, size: 13, delay: 0.6 },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute -top-20 -left-16 w-72 h-72 rounded-full blur-3xl"
        style={{ backgroundColor: glowA, opacity: 0.15 }}
      />
      <div
        className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl"
        style={{ backgroundColor: glowB, opacity: 0.13 }}
      />
      {sparkles.map((sp, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 24 24"
          className="absolute"
          style={{ left: `${sp.x}%`, top: `${sp.y}%`, width: sp.size, height: sp.size }}
          fill={i % 2 === 0 ? glowA : glowB}
          initial={{ opacity: 0.4 }}
          animate={reduced ? undefined : { opacity: [0.25, 0.75, 0.25], scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 3.6, delay: sp.delay, ease: 'easeInOut' }}
        >
          <path d="M12 0 L14.6 9.4 L24 12 L14.6 14.6 L12 24 L9.4 14.6 L0 12 L9.4 9.4 Z" />
        </motion.svg>
      ))}
    </div>
  );
}

/** The scene card every map view sits inside. */
function Scene({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/70 bg-gradient-to-b from-sky-50/80 via-white to-orange-50/60 px-2 py-6 sm:px-6 sm:py-8">
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

/** The coin face: gradient fill, white sticker ring, coloured shadow. */
function coinStyle(hex: string, inkHex: string): React.CSSProperties {
  return {
    background: `linear-gradient(140deg, ${hex} 12%, color-mix(in srgb, ${hex} 60%, ${inkHex}) 100%)`,
    boxShadow: `0 0 0 4px #FFFFFF, 0 12px 26px -10px color-mix(in srgb, ${hex} 75%, transparent), inset 0 2px 0 rgba(255,255,255,0.35)`,
    color: '#FFFFFF',
  };
}

function ghostCoinStyle(hex: string, inkHex: string): React.CSSProperties {
  return {
    backgroundColor: '#FFFFFF',
    border: `3px solid color-mix(in srgb, ${hex} 32%, #FFFFFF)`,
    boxShadow: '0 0 0 4px #FFFFFF, 0 6px 16px -10px rgba(15, 23, 42, 0.35)',
    color: `color-mix(in srgb, ${hex} 55%, ${inkHex})`,
    opacity: 0.85,
  };
}

/** The bobbing "You are here" plaque above the current checkpoint. */
function HerePlaque({ inkHex, reduced }: { inkHex: string; reduced: boolean }) {
  return (
    <motion.span
      className="relative z-10 mb-2"
      animate={reduced ? undefined : { y: [0, -4, 0] }}
      transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
    >
      <span
        className="relative block px-3 py-1 rounded-full text-[10px] font-display font-extrabold uppercase tracking-[0.14em] text-white shadow-lg whitespace-nowrap"
        style={{ backgroundColor: inkHex }}
      >
        You are here
        <span
          className="absolute left-1/2 -bottom-[3px] w-2 h-2 -translate-x-1/2 rotate-45"
          style={{ backgroundColor: inkHex }}
          aria-hidden="true"
        />
      </span>
    </motion.span>
  );
}

function DayPips({
  day,
  dayTotal,
  colour,
}: {
  day: number;
  dayTotal: number;
  colour: string;
}) {
  return (
    <div
      className="flex items-center justify-center gap-1.5 mt-1.5"
      role="img"
      aria-label={`Day ${day} of ${dayTotal}`}
    >
      {Array.from({ length: dayTotal }, (_, i) => (
        <span
          key={i}
          className="w-2.5 h-2.5 rounded-full border"
          style={
            i < day
              ? { backgroundColor: colour, borderColor: colour }
              : { backgroundColor: '#FFFFFF', borderColor: '#CBD5E1' }
          }
        />
      ))}
    </div>
  );
}

function FlagIcon({ fill, stroke }: { fill: string; stroke: string }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
      <line x1="6" y1="3" x2="6" y2="21" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
      <path d="M6 4 L19 7.5 L6 11 Z" fill={fill} stroke={stroke} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Header: kicker, headline, status chip, segmented rainbow bar        */
/* ------------------------------------------------------------------ */

function JourneyHeader({
  model,
  currentLesson,
  position,
}: {
  model: JourneyModel;
  currentLesson: number;
  position: JourneyPosition;
}) {
  const lesson = Math.min(Math.max(currentLesson, 1), model.totalLessons);
  const level = model.levels[position.levelIndex];
  const pct = Math.round((lesson / model.totalLessons) * 100);

  return (
    <div className="text-center mb-7">
      <p className="text-[11px] font-display font-bold uppercase tracking-[0.28em] text-slate-400">
        The reading journey
      </p>
      <h2 className="mt-1 font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900">
        Your road to reading
      </h2>
      <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/90 border border-slate-200/80 shadow-sm px-4 py-1.5">
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: level.meta.hex }}
          aria-hidden="true"
        />
        <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
          Lesson {lesson} of {model.totalLessons}
        </span>
        <span className="text-slate-300" aria-hidden="true">
          ·
        </span>
        <span
          className="text-xs font-display font-bold whitespace-nowrap"
          style={{ color: level.meta.inkHex }}
        >
          Level {level.meta.level} — {level.meta.name}
        </span>
      </div>

      <div className="max-w-lg mx-auto mt-4 px-2">
        <div
          className="flex items-center gap-1.5"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={model.totalLessons}
          aria-valuenow={lesson}
          aria-label={`Lesson ${lesson} of ${model.totalLessons}, ${pct} percent of the journey`}
        >
          {model.levels.map((l) => {
            const { done, total } = levelProgress(l, lesson);
            return (
              <div
                key={l.meta.level}
                className="relative h-2 rounded-full overflow-hidden"
                style={{
                  flex: `${l.lessonCount} 1 0%`,
                  backgroundColor: `color-mix(in srgb, ${l.meta.hex} 16%, #FFFFFF)`,
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ width: `${(done / total) * 100}%`, backgroundColor: l.meta.hex }}
                />
              </div>
            );
          })}
          <span className="ml-1 text-[11px] font-bold tabular-nums text-slate-500 shrink-0">
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zoomed-out view: the 8 levels                                       */
/* ------------------------------------------------------------------ */

function LevelCheckpoint({
  level,
  point,
  state,
  currentLesson,
  onOpen,
  buttonRef,
  index,
  reduced,
}: {
  level: JourneyLevelModel;
  point: Point;
  state: ProgressState;
  currentLesson: number;
  onOpen: () => void;
  buttonRef: (el: HTMLButtonElement | null) => void;
  index: number;
  reduced: boolean;
}) {
  const { done, total } = levelProgress(level, currentLesson);
  const { hex, inkHex, name, level: num } = level.meta;

  const stateCopy =
    state === 'complete'
      ? 'complete'
      : state === 'current'
        ? `current level, ${done} of ${total} lessons`
        : 'not started yet';

  return (
    <div
      className="absolute w-40 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      {state === 'current' && <HerePlaque inkHex={inkHex} reduced={reduced} />}
      <motion.span
        className="relative inline-flex pointer-events-auto"
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 320, damping: 20, delay: 0.15 + index * 0.07 }
        }
      >
        {state === 'current' && (
          <span
            className="absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping"
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
        )}
        <button
          ref={buttonRef}
          type="button"
          onClick={onOpen}
          aria-label={`Level ${num}, ${name}, ${stateCopy}. Open level map.`}
          className={`relative rounded-full font-display font-extrabold flex items-center justify-center transition-transform hover:scale-105 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
            state === 'current' ? 'w-[4.25rem] h-[4.25rem] text-2xl' : 'w-[3.4rem] h-[3.4rem] text-lg'
          }`}
          style={state === 'future' ? ghostCoinStyle(hex, inkHex) : coinStyle(hex, inkHex)}
        >
          <span style={{ textShadow: state === 'future' ? 'none' : '0 1px 2px rgba(0,0,0,0.18)' }}>
            {num}
          </span>
          {state === 'complete' && (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-sm"
              aria-hidden="true"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={3.5} style={{ color: inkHex }} />
            </span>
          )}
        </button>
      </motion.span>
      <span
        className="mt-2 font-display font-bold text-sm leading-tight"
        style={{ color: state === 'future' ? '#94A3B8' : inkHex }}
      >
        {name}
      </span>
      {state === 'current' ? (
        <>
          <span className="mt-1.5 w-20 h-1.5 rounded-full bg-white overflow-hidden shadow-inner ring-1 ring-slate-200/70">
            <span
              className="block h-full rounded-full"
              style={{ width: `${(done / total) * 100}%`, backgroundColor: hex }}
            />
          </span>
          <span className="mt-1 text-[11px] font-semibold text-slate-500">
            {done} of {total} lessons
          </span>
        </>
      ) : state === 'complete' ? (
        <span
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold"
          style={{ color: inkHex }}
        >
          <Check className="w-3 h-3" strokeWidth={3.5} aria-hidden="true" />
          Complete
        </span>
      ) : (
        <span className="mt-1 text-[11px] font-medium text-slate-400">{total} lessons</span>
      )}
    </div>
  );
}

function OverviewView({
  model,
  currentLesson,
  position,
  onOpenLevel,
  registerLevelRef,
  reduced,
}: {
  model: JourneyModel;
  currentLesson: number;
  position: JourneyPosition;
  onOpenLevel: (index: number) => void;
  registerLevelRef: (index: number, el: HTMLButtonElement | null) => void;
  reduced: boolean;
}) {
  const wide = useIsWide();
  const lesson = Math.min(Math.max(currentLesson, 1), model.totalLessons);
  const { points } = useMemo(
    () =>
      wide
        ? serpentinePoints(8, 4, { xMargin: 13, yStart: 26, yEnd: 72, wave: 7 })
        : serpentinePoints(8, 2, { xMargin: 27, yStart: 9, yEnd: 84, wave: 3 }),
    [wide],
  );

  const li = position.levelIndex;
  const { done, total } = levelProgress(model.levels[li], lesson);
  const colors = model.levels.map((l) => l.meta.hex);
  const currentHex = model.levels[li].meta.hex;
  const nextHex = model.levels[Math.min(li + 1, model.levels.length - 1)].meta.hex;

  return (
    <div>
      <JourneyHeader model={model} currentLesson={currentLesson} position={position} />
      <Scene>
        <Scenery glowA={currentHex} glowB={nextHex} reduced={reduced} />
        <div className={`relative mx-auto ${wide ? 'max-w-4xl h-[470px]' : 'max-w-xl h-[760px]'}`}>
          <Trail
            points={points}
            colors={colors}
            filled={li}
            partialFrac={done / total}
            reduced={reduced}
          />
          {model.levels.map((level, i) => (
            <LevelCheckpoint
              key={level.meta.level}
              level={level}
              point={points[i]}
              state={levelState(level, currentLesson)}
              currentLesson={currentLesson}
              onOpen={() => onOpenLevel(i)}
              buttonRef={(el) => registerLevelRef(i, el)}
              index={i}
              reduced={reduced}
            />
          ))}
        </div>
      </Scene>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Zoomed-in view: one level                                           */
/* ------------------------------------------------------------------ */

/**
 * The lesson panel: opens when a checkpoint is tapped. Shows the big
 * letter, the day tabs and the day's taught outline, ending with the
 * 10 to 15 minute worksheet follow-up.
 */
function LessonPanel({
  block,
  level,
  currentLesson,
  onClose,
}: {
  block: JourneyBlock;
  level: JourneyLevelModel;
  currentLesson: number;
  onClose: () => void;
}) {
  const state = blockState(block, currentLesson);
  const currentIdx = state === 'current' ? currentLesson - block.firstN : 0;
  const [dayIdx, setDayIdx] = useState(currentIdx);
  const row = block.rows[dayIdx];
  const outline = useMemo(() => lessonOutline(row), [row]);
  const { hex, inkHex, name } = level.meta;
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Lesson outline: ${row.title}`}
        className="relative w-full sm:max-w-lg max-h-[88vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-slate-100 px-5 pt-5 pb-4 rounded-t-3xl">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close lesson outline"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
          <div className="flex items-center gap-4 pr-12">
            <span
              className="shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(140deg, ${hex} 12%, color-mix(in srgb, ${hex} 60%, ${inkHex}) 100%)`,
                boxShadow: `0 8px 18px -8px color-mix(in srgb, ${hex} 75%, transparent)`,
              }}
              aria-hidden="true"
            >
              {block.isFlag ? (
                <FlagIcon fill="#FFFFFF" stroke="#FFFFFF" />
              ) : (
                <span
                  className={`text-white font-bold leading-none ${
                    block.isGrapheme ? 'font-child' : 'font-display'
                  } ${block.label.length <= 3 ? 'text-3xl' : 'text-sm text-center px-1'}`}
                >
                  {block.label}
                </span>
              )}
            </span>
            <div className="min-w-0">
              <h3 className="font-display font-extrabold text-lg leading-tight text-slate-800">
                {row.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Lesson {row.n} · Level {row.level} {name} · {row.half_term}
              </p>
              {row.book_title && (
                <p className="inline-flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: inkHex }}>
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  {row.book_title}
                </p>
              )}
            </div>
          </div>

          {/* Day tabs */}
          {block.rows.length > 1 && (
            <div className="flex gap-1.5 mt-4" role="tablist" aria-label="Days this week">
              {block.rows.map((r, i) => (
                <button
                  key={r.n}
                  type="button"
                  role="tab"
                  aria-selected={i === dayIdx}
                  aria-label={`Day ${r.day}: ${r.title}`}
                  onClick={() => setDayIdx(i)}
                  className="flex-1 min-h-10 rounded-xl text-sm font-display font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  style={
                    i === dayIdx
                      ? { backgroundColor: hex, color: '#FFFFFF' }
                      : { backgroundColor: '#F1F5F9', color: '#64748B' }
                  }
                >
                  Day {r.day}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Outline */}
        <div className="px-5 py-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-3">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            About {outline.minutes} minutes taught
            {outline.worksheet.title.startsWith('No worksheet') ? '' : ', then the worksheet'}
          </p>
          <ol className="space-y-3">
            {outline.steps.map((step) => (
              <li key={step.clock + step.title} className="flex gap-3">
                <span
                  className="shrink-0 w-12 text-center rounded-lg py-1 text-xs font-bold tabular-nums h-fit"
                  style={{ backgroundColor: `${hex}1A`, color: inkHex }}
                >
                  {step.clock}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-slate-800 leading-snug">
                    {step.title}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          {/* Worksheet follow-up */}
          <div className="mt-4 rounded-2xl border-2 border-dashed p-3 flex gap-3" style={{ borderColor: `${hex}66` }}>
            <span
              className="shrink-0 w-12 text-center rounded-lg py-1 text-xs font-bold h-fit"
              style={{ backgroundColor: `${hex}1A`, color: inkHex }}
            >
              {outline.worksheet.clock}
            </span>
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-slate-800 leading-snug">
                {outline.worksheet.title}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                {outline.worksheet.detail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

function BlockCheckpoint({
  block,
  point,
  level,
  currentLesson,
  isOpen,
  onToggle,
  index,
  reduced,
}: {
  block: JourneyBlock;
  point: Point;
  level: JourneyLevelModel;
  currentLesson: number;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  reduced: boolean;
}) {
  const state = blockState(block, currentLesson);
  const { hex, inkHex } = level.meta;
  const currentRow = state === 'current' ? block.rows[currentLesson - block.firstN] : null;

  const stateCopy =
    state === 'complete' ? 'complete' : state === 'current' ? 'you are here' : 'still to come';
  const kind = block.isFlag
    ? 'Assessment'
    : block.type === 'keepup'
      ? 'Keep-up time'
      : block.rows.length === 1
        ? 'Lesson'
        : block.isGrapheme
          ? 'Sound week'
          : 'Skills week';
  // Short graphemes sit inside the circle; longer labels go below it.
  const labelInCircle = block.isGrapheme && block.label.length <= 3;

  const flagStyle: React.CSSProperties =
    state === 'future'
      ? {
          backgroundColor: '#FFFFFF',
          border: `2.5px solid color-mix(in srgb, ${hex} 30%, #FFFFFF)`,
          boxShadow: '0 0 0 3px #FFFFFF, 0 5px 14px -9px rgba(15, 23, 42, 0.35)',
          opacity: 0.85,
        }
      : {
          backgroundColor: '#FFFFFF',
          border: `2.5px solid ${hex}`,
          boxShadow: `0 0 0 3px #FFFFFF, 0 10px 22px -10px color-mix(in srgb, ${hex} 70%, transparent)`,
        };

  return (
    <div
      className="absolute w-36 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-center pointer-events-none"
      style={{ left: `${point.x}%`, top: `${point.y}%` }}
    >
      <motion.span
        className="relative inline-flex pointer-events-auto"
        initial={reduced ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={
          reduced
            ? { duration: 0 }
            : { type: 'spring', stiffness: 340, damping: 22, delay: 0.1 + index * 0.035 }
        }
      >
        {state === 'current' && (
          <span
            className="absolute inset-0 rounded-full opacity-40 motion-safe:animate-ping"
            style={{ backgroundColor: hex }}
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-expanded={isOpen}
          aria-label={`${kind}: ${block.label}, ${stateCopy}`}
          className={`relative flex items-center justify-center transition-transform hover:scale-105 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 ${
            block.isFlag ? 'rounded-xl' : 'rounded-full'
          } ${state === 'current' ? 'w-14 h-14' : 'w-11 h-11'}`}
          style={
            block.isFlag
              ? flagStyle
              : state === 'future'
                ? ghostCoinStyle(hex, inkHex)
                : coinStyle(hex, inkHex)
          }
        >
          {block.isFlag ? (
            <FlagIcon
              fill={state === 'future' ? '#FFFFFF' : hex}
              stroke={state === 'future' ? '#94A3B8' : inkHex}
            />
          ) : labelInCircle ? (
            <span
              className="font-child font-bold text-base leading-none"
              style={{
                color: state === 'future' ? `color-mix(in srgb, ${hex} 55%, ${inkHex})` : '#FFFFFF',
                textShadow: state === 'future' ? 'none' : '0 1px 2px rgba(0,0,0,0.18)',
              }}
            >
              {block.label}
            </span>
          ) : (
            <Check
              className={`w-5 h-5 ${state === 'complete' ? '' : 'opacity-0'}`}
              strokeWidth={3}
              aria-hidden="true"
            />
          )}
        </button>
      </motion.span>
      {!labelInCircle && (
        <span
          className={`mt-1.5 text-xs font-semibold leading-tight ${block.isGrapheme ? 'font-child' : 'font-sans'}`}
          style={{ color: state === 'future' ? '#94A3B8' : inkHex }}
        >
          {block.label}
        </span>
      )}
      {currentRow && (
        <>
          <DayPips day={currentRow.day} dayTotal={currentRow.day_total} colour={inkHex} />
          <span className="mt-0.5 text-[10px] font-medium text-slate-500">
            Day {currentRow.day} of {currentRow.day_total}
          </span>
        </>
      )}
    </div>
  );
}

function LevelView({
  level,
  currentLesson,
  onBack,
  backRef,
  reduced,
}: {
  level: JourneyLevelModel;
  currentLesson: number;
  onBack: () => void;
  backRef: React.RefObject<HTMLButtonElement>;
  reduced: boolean;
}) {
  const [openBlock, setOpenBlock] = useState<number | null>(null);
  const wide = useIsWide();
  const count = level.blocks.length;
  const { points, rows } = useMemo(() => {
    if (wide) {
      const cols = Math.min(5, count);
      const r = Math.ceil(count / cols);
      return serpentinePoints(count, cols, {
        xMargin: 11,
        yStart: r === 1 ? 44 : 100 / (r * 2) + 4,
        yEnd: r === 1 ? 44 : 100 - 100 / (r * 2) - 4,
        wave: r <= 2 ? 6 : 4,
      });
    }
    return serpentinePoints(count, 2, { xMargin: 28, yStart: 5, yEnd: 89, wave: 2 });
  }, [wide, count]);
  const height = wide ? Math.max(rows * 168, 320) : Math.max(rows * 145, 320);
  const { done, total } = levelProgress(level, currentLesson);
  const { hex, inkHex, name, level: num } = level.meta;

  // Trail fill inside the level: whole blocks travelled, plus the days
  // already done in the current block.
  const currentBi = level.blocks.findIndex((b) => blockState(b, currentLesson) === 'current');
  const filled = currentBi >= 0 ? currentBi : currentLesson > level.lastN ? count : 0;
  const partialFrac =
    currentBi >= 0
      ? (currentLesson - level.blocks[currentBi].firstN + 1) / level.blocks[currentBi].rows.length
      : 0;

  return (
    <div
      onKeyDown={(e) => {
        // Escape closes an open lesson panel first; a second Escape zooms out.
        if (e.key === 'Escape' && openBlock !== null) {
          e.stopPropagation();
          setOpenBlock(null);
        }
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <button
          ref={backRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onBack();
          }}
          className="inline-flex items-center gap-1.5 min-h-10 px-3.5 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:-translate-x-0.5 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          aria-label="Back to the whole journey"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Whole journey
        </button>
        <span
          className="shrink-0 w-11 h-11 rounded-full font-display font-extrabold text-lg flex items-center justify-center"
          style={coinStyle(hex, inkHex)}
          aria-hidden="true"
        >
          {num}
        </span>
        <div className="min-w-0">
          <h2 className="font-display font-extrabold text-lg leading-tight" style={{ color: inkHex }}>
            Level {num}: {name}
          </h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="w-24 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(done / total) * 100}%`, backgroundColor: hex }}
              />
            </span>
            <p className="text-xs text-slate-500 whitespace-nowrap">
              {done} of {total} lessons
            </p>
          </div>
        </div>
      </div>

      <Scene>
        <Scenery glowA={hex} glowB={hex} reduced={reduced} />
        <div
          className={`relative mx-auto ${wide ? 'max-w-4xl' : 'max-w-xl'}`}
          style={{ height: `${height}px` }}
        >
          <Trail
            points={points}
            colors={points.map(() => hex)}
            filled={filled}
            partialFrac={partialFrac}
            reduced={reduced}
          />
          {level.blocks.map((block, i) => (
            <BlockCheckpoint
              key={block.firstN}
              block={block}
              point={points[i]}
              level={level}
              currentLesson={currentLesson}
              isOpen={openBlock === i}
              onToggle={() => setOpenBlock(openBlock === i ? null : i)}
              index={i}
              reduced={reduced}
            />
          ))}
        </div>
      </Scene>
      {openBlock !== null && (
        <LessonPanel
          block={level.blocks[openBlock]}
          level={level}
          currentLesson={currentLesson}
          onClose={() => setOpenBlock(null)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Root component                                                      */
/* ------------------------------------------------------------------ */

export default function JourneyMap({ currentLesson, animated = true, className }: JourneyMapProps) {
  const { model, error } = useJourneyModel();
  const reducedMotion = useReducedMotion() || !animated;
  const [openLevel, setOpenLevel] = useState<number | null>(null);
  const levelButtonRefs = useRef(new Map<number, HTMLButtonElement>());
  const backRef = useRef<HTMLButtonElement>(null);
  const lastOpened = useRef<number | null>(null);

  const position = useMemo(
    () => (model ? locateLesson(model, currentLesson) : null),
    [model, currentLesson],
  );

  // Move focus into the new view after a zoom so keyboard users follow it.
  useEffect(() => {
    if (openLevel !== null) {
      backRef.current?.focus();
    } else if (lastOpened.current !== null) {
      levelButtonRefs.current.get(lastOpened.current)?.focus();
      lastOpened.current = null;
    }
  }, [openLevel]);

  if (error) {
    return (
      <p className={`text-sm text-slate-500 text-center py-8 ${className ?? ''}`}>
        The journey map could not load right now. Please try again shortly.
      </p>
    );
  }
  if (!model || !position) {
    return (
      <div className={`flex justify-center py-16 ${className ?? ''}`} aria-label="Loading the journey map">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const overview = (
    <OverviewView
      model={model}
      currentLesson={currentLesson}
      position={position}
      onOpenLevel={(i) => setOpenLevel(i)}
      registerLevelRef={(i, el) => {
        if (el) levelButtonRefs.current.set(i, el);
        else levelButtonRefs.current.delete(i);
      }}
      reduced={reducedMotion}
    />
  );
  const levelView =
    openLevel !== null ? (
      <LevelView
        level={model.levels[openLevel]}
        currentLesson={currentLesson}
        onBack={() => {
          lastOpened.current = openLevel;
          setOpenLevel(null);
        }}
        backRef={backRef}
        reduced={reducedMotion}
      />
    ) : null;

  return (
    <section
      className={`font-sans ${className ?? ''}`}
      aria-label="Curriculum journey map"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && openLevel !== null) {
          lastOpened.current = openLevel;
          setOpenLevel(null);
        }
      }}
    >
      {reducedMotion ? (
        // Reduced motion: swap views instantly with no animation layer.
        openLevel === null ? overview : levelView
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          {openLevel === null ? (
            <motion.div
              key="overview"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {overview}
            </motion.div>
          ) : (
            <motion.div
              key={`level-${openLevel}`}
              initial={{ opacity: 0, scale: 1.12 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {levelView}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </section>
  );
}
