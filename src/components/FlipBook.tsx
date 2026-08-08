import {
  useCallback, useEffect, useMemo, useRef, useState, type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * FlipBook — a real book you can turn the pages of.
 *
 * Pages are stacked as 3D "leaves" (front face = odd page, back face = the
 * page behind it) and rotate around the spine, so a turn looks and shades
 * like paper rather than a slide transition.
 *
 * Desktop shows a two-page spread (exactly how the printed A5 book reads);
 * narrow screens fall back to one page at a time with the same turn motion.
 * Click the left/right half, swipe, use the arrows or the arrow keys.
 */

export type FlipBookProps = {
  /** Page content in reading order. Page 1 is the cover. */
  pages: ReactNode[];
  /** Page aspect ratio, width / height. A5 = 0.707. */
  ratio?: number;
  /** Max width of ONE page, px. Spread mode is twice this. */
  pageWidth?: number;
  mode?: "auto" | "spread" | "single";
  /** Auto-turn every N ms (0 = off). Pauses while the pointer is over it. */
  autoPlayMs?: number;
  /** Restart from the cover after the last page (auto-play demos). */
  loop?: boolean;
  showControls?: boolean;
  showCounter?: boolean;
  /** Also shrink to fit the container's height (full-screen readers). */
  fitHeight?: boolean;
  className?: string;
  onPageChange?: (firstVisiblePage: number) => void;
};

const TURN_MS = 720;

export default function FlipBook({
  pages,
  ratio = 841 / 1192,
  pageWidth = 300,
  mode = "auto",
  autoPlayMs = 0,
  loop = false,
  showControls = true,
  showCounter = false,
  fitHeight = false,
  className = "",
  onPageChange,
}: FlipBookProps) {
  const [wide, setWide] = useState(
    () => typeof window === "undefined" || window.matchMedia("(min-width: 640px)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => setWide(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const spread = mode === "spread" || (mode === "auto" && wide);

  // In a spread each leaf carries two pages (front + back), like real paper.
  // Single-page mode gives every page its own leaf with a blank paper back.
  const leaves = useMemo(() => {
    if (!spread) return pages.map((p) => ({ front: p, back: null as ReactNode }));
    const out: Array<{ front: ReactNode; back: ReactNode }> = [];
    for (let i = 0; i < pages.length; i += 2) {
      out.push({ front: pages[i], back: pages[i + 1] ?? null });
    }
    return out;
  }, [pages, spread]);

  const [turned, setTurned] = useState(0); // how many leaves are lying on the left
  const [top, setTop] = useState(-1); // leaf currently in flight — drawn above the rest
  const [flying, setFlying] = useState(false);
  const [snap, setSnap] = useState(false); // shut the book instantly, no flutter
  const [hover, setHover] = useState(false);
  // Once someone turns a page themselves, the demo never takes the book back.
  const [tookOver, setTookOver] = useState(false);
  const settleRef = useRef<number | null>(null);
  const snapRef = useRef<number | null>(null);
  // Mirrors `turned` synchronously so several quick taps don't race each other.
  const turnedRef = useRef(0);

  // Clamp when the leaf count changes (e.g. rotating from spread to single).
  useEffect(() => {
    setTurned((t) => {
      const clamped = Math.min(t, leaves.length);
      turnedRef.current = clamped;
      return clamped;
    });
  }, [leaves.length]);

  const startTurn = useCallback((from: number, to: number) => {
    turnedRef.current = to;
    setTurned(to);
    setTop(to > from ? from : to);
    setFlying(true);
    if (settleRef.current) window.clearTimeout(settleRef.current);
    settleRef.current = window.setTimeout(() => setFlying(false), TURN_MS);
  }, []);

  const move = useCallback(
    (dir: 1 | -1) => {
      setTookOver(true); // hands off — the reader is driving now
      const from = turnedRef.current;
      const to = from + dir;
      if (to < 0 || to > leaves.length) return;
      startTurn(from, to);
    },
    [leaves.length, startTurn],
  );

  const next = useCallback(() => move(1), [move]);
  const prev = useCallback(() => move(-1), [move]);
  const canNext = turned < leaves.length;
  const canPrev = turned > 0;

  useEffect(() => {
    onPageChange?.(spread ? Math.max(0, turned * 2 - 1) : turned);
  }, [turned, spread, onPageChange]);

  useEffect(() => () => {
    if (settleRef.current) window.clearTimeout(settleRef.current);
    if (snapRef.current) window.clearTimeout(snapRef.current);
  }, []);

  // Auto-play demo mode.
  useEffect(() => {
    if (!autoPlayMs || hover || tookOver) return;
    const id = window.setInterval(() => {
      const t = turnedRef.current;
      if (t < leaves.length) {
        startTurn(t, t + 1);
        return;
      }
      if (!loop) return;
      // Back to the cover: shut the book in one frame rather than flapping
      // every leaf back across the spine.
      setSnap(true);
      setTop(-1);
      setFlying(false);
      turnedRef.current = 0;
      setTurned(0);
      if (snapRef.current) window.clearTimeout(snapRef.current);
      snapRef.current = window.setTimeout(() => setSnap(false), 80);
    }, autoPlayMs);
    return () => window.clearInterval(id);
  }, [autoPlayMs, hover, tookOver, loop, leaves.length, startTurn]);

  // Keyboard + swipe.
  const rootRef = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  };
  const dragX = useRef<number | null>(null);
  const onPointerDown = (e: React.PointerEvent) => { dragX.current = e.clientX; };
  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragX.current;
    dragX.current = null;
    if (start === null) return;
    const dx = e.clientX - start;
    if (Math.abs(dx) > 45) {
      if (dx < 0) next(); else prev();
      return;
    }
    // A tap: right half turns forward, left half turns back.
    const box = rootRef.current?.getBoundingClientRect();
    if (!box) return;
    if (e.clientX - box.left > box.width / 2) next(); else prev();
  };

  // Fit the book into whatever box we're given: never wider than the space,
  // never taller than it either (a full-screen reader is height-limited).
  const fitRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    // Height is clamped to what's actually on screen as well as to the box:
    // a route-transition wrapper can make an overlay's box taller than the
    // viewport, and a book taller than the window is no use to anyone.
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFit({
        w: r.width,
        h: Math.max(160, Math.min(r.height, window.innerHeight - r.top - 16)),
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => { ro.disconnect(); window.removeEventListener("resize", measure); };
  }, []);

  const maxBook = spread ? pageWidth * 2 : pageWidth;
  const bookRatio = spread ? ratio * 2 : ratio;
  const chrome = showControls || showCounter ? 56 : 0; // the controls row
  const bookWidth = Math.max(
    120,
    Math.min(
      maxBook,
      fit.w || maxBook,
      fitHeight && fit.h ? (fit.h - chrome) * bookRatio : Infinity,
    ),
  );

  return (
    <div
      ref={fitRef}
      className={`flex w-full flex-col justify-center select-none ${fitHeight ? "h-full" : ""} ${className}`}
      style={fitHeight && fit.h ? { maxHeight: fit.h } : undefined}
    >
      <div
        ref={rootRef}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        role="group"
        aria-label="Book preview — use the arrow keys to turn the pages"
        className="relative mx-auto cursor-pointer outline-none"
        style={{
          width: bookWidth,
          aspectRatio: `${bookRatio}`,
          perspective: 2400,
          // A shut book is one page wide — slide it so the closed cover (and
          // the closed back) still sit in the middle of the frame.
          transform: `translateX(${spread ? (turned === 0 ? -25 : turned === leaves.length ? 25 : 0) : 0}%)`,
          transition: snap ? "none" : `transform ${TURN_MS}ms ease-in-out`,
        }}
      >
        {/* The paper block under the leaves. Each half only exists once there
            are pages resting on it, so a closed book doesn't sit on a slab. */}
        <div
          className="absolute inset-y-0 left-0 rounded-l-[6px] bg-[#FBFAF7] transition-opacity duration-300"
          style={{
            width: spread ? "50%" : "100%",
            opacity: spread ? (turned > 0 ? 1 : 0) : 1,
            boxShadow: "0 18px 40px -12px rgba(15,23,42,0.45)",
          }}
        />
        {spread && (
          <div
            className="absolute inset-y-0 right-0 w-1/2 rounded-r-[6px] bg-[#FBFAF7] transition-opacity duration-300"
            style={{
              opacity: turned < leaves.length ? 1 : 0,
              boxShadow: "0 18px 40px -12px rgba(15,23,42,0.45)",
            }}
          />
        )}
        {spread && turned > 0 && turned < leaves.length && (
          <div
            className="pointer-events-none absolute inset-y-0 left-1/2 z-[900] w-8 -translate-x-1/2"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.16) 42%, rgba(0,0,0,0.22) 50%, rgba(0,0,0,0.16) 58%, rgba(0,0,0,0) 100%)",
            }}
          />
        )}

        {leaves.map((leaf, i) => {
          const isTurned = i < turned;
          const isTop = i === top && flying;
          // Hidden once a single-mode page has finished flying off to the left.
          const parked = !spread && isTurned && !isTop;
          const z = isTop ? 999 : isTurned ? i : leaves.length - i;
          return (
            <div
              key={i}
              className="absolute top-0 h-full"
              style={{
                left: spread ? "50%" : 0,
                width: spread ? "50%" : "100%",
                zIndex: z,
                transformOrigin: "left center",
                transformStyle: "preserve-3d",
                transition: snap ? "none" : `transform ${TURN_MS}ms cubic-bezier(0.42, 0, 0.28, 1)`,
                transform: `rotateY(${isTurned ? -180 : 0}deg)`,
                visibility: parked ? "hidden" : "visible",
              }}
            >
              {/* NB: never put `filter` on this leaf — it flattens preserve-3d
                  and the mirrored front face shows through mid-turn. */}
              <Face side="front" spine="left" lifted={isTop}>{leaf.front}</Face>
              <Face side="back" spine={spread ? "right" : "left"} lifted={isTop}>{leaf.back}</Face>
            </div>
          );
        })}
      </div>

      {(showControls || showCounter) && (
        <div className="mt-3 flex items-center justify-center gap-4">
          {showControls && (
            <button
              type="button"
              onClick={prev}
              disabled={!canPrev}
              aria-label="Previous page"
              className="rounded-full bg-white p-2 shadow-md transition disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5 text-slate-700" />
            </button>
          )}
          {showCounter && (
            <span className="min-w-[4.5rem] text-center text-sm font-semibold text-slate-500">
              {spread
                ? `${Math.min(turned * 2 + 1, pages.length)} / ${pages.length}`
                : `${Math.min(turned + 1, pages.length)} / ${pages.length}`}
            </span>
          )}
          {showControls && (
            <button
              type="button"
              onClick={next}
              disabled={!canNext}
              aria-label="Next page"
              className="rounded-full bg-white p-2 shadow-md transition disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5 text-slate-700" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One side of a leaf. `spine` says which edge is bound, so the paper shading
 * falls towards the middle of the book on both halves of the spread.
 */
function Face({
  side, spine, lifted, children,
}: {
  side: "front" | "back";
  spine: "left" | "right";
  /** true while this leaf is mid-turn — the page casts a shadow as it lifts */
  lifted?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 overflow-hidden bg-white"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: side === "back" ? "rotateY(180deg)" : undefined,
        borderRadius: spine === "left" ? "2px 6px 6px 2px" : "6px 2px 2px 6px",
        boxShadow: lifted ? "0 10px 26px rgba(15,23,42,0.35)" : undefined,
      }}
    >
      {children ? (
        <div className="h-full w-full">{children}</div>
      ) : (
        <div className="h-full w-full bg-[#FBFAF7]" />
      )}
      {/* paper shading towards the spine */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            spine === "left"
              ? "linear-gradient(90deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.04) 6%, rgba(0,0,0,0) 14%)"
              : "linear-gradient(270deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.04) 6%, rgba(0,0,0,0) 14%)",
        }}
      />
    </div>
  );
}
