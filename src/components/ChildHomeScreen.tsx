/**
 * ChildHomeScreen — the child's "Today" screen.
 *
 * Design language: "paper & stickers" — the app as a beautifully printed
 * children's book. The current book is a physical object (page edges,
 * ground shadow), the path is a wavy dotted treasure trail, the sounds
 * are fridge magnets, and the one big button presses like a real button.
 *
 *  1. Greeting — "Time to read, {name}!" + level sticker
 *  2. Hero — the book as an object on the paper, five star stamps, ONE
 *     giant 3D level-coloured button
 *  3. Games — three big game cards right under the book (What sound is
 *     it? · Finish the word · Hear it, find it), all level-aware
 *  4. Trail — this level's books as stops on a wavy dotted path, ending
 *     in a Level Check star. Current stop is a mini BOOK (not a cropped
 *     circle); done stops are sticker ticks; locked stops are quiet dots.
 *  5. Sound magnets — the level's letter-sounds as magnet tiles
 *
 * Levels are the 8-level journey (lib/levels8.ts); books stay tagged with
 * legacy sub_levels underneath. Child-facing copy avoids adult terms
 * (fluency, assessment, decoding, mastery). The only word for the
 * readiness gate is "Check".
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Sparkles, Lock, BookOpen, Star, Check } from 'lucide-react';
import SoundGame from '@/components/SoundGame';
import FinishWordGame from '@/components/FinishWordGame';
import TrickyWordGame from '@/components/TrickyWordGame';
import WordCannonGame from '@/components/WordCannonGame';
import type { Book } from '@/lib/types';
import { getAllStamps, isReadyToMoveUp, MAX_STAMPS, type BookStamps } from '@/lib/stamps';
import { getJourneyLevel, journeyLevelOf, journeySortKey, JOURNEY_LEVELS } from '@/lib/levels8';
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

const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];

/** Sticker shadow — white border + soft drop, like a real sticker. */
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

/** The phonics mini-games, in pedagogical order: spot the sound →
 *  supply the missing sound → whole-word (tricky) recognition → build the
 *  whole word sound by sound. Milo's Cannon is the arcade one — aim and fire
 *  rather than tap a tile — and is deliberately last so the calmer games
 *  stay first. */
type GameId = 'sound' | 'finish' | 'tricky' | 'cannon';

const GAMES: { id: GameId; emoji: string; name: string; blurb: string }[] = [
  { id: 'sound', emoji: '🔍', name: 'What sound is it?', blurb: 'Find the sound hiding in a word' },
  { id: 'finish', emoji: '🧩', name: 'Finish the word', blurb: 'Tap the missing sound' },
  { id: 'tricky', emoji: '👂', name: 'Hear it, find it', blurb: 'Listen and find the tricky word' },
  { id: 'cannon', emoji: '🎯', name: "Milo's Cannon", blurb: 'Fire the right sound into the word' },
];

export default function ChildHomeScreen({ books, onBookSelect }: Props) {
  const navigate = useNavigate();
  const stamps = useMemo(() => getAllStamps(), []);
  const { data: children } = useChildren();
  const childName = children?.[0]?.name ?? '';
  const reduceMotion = useReducedMotion();
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  // Active journey level: first unmastered unlocked book defines it; all
  // books at that level get state-tagged (mastered / current / locked).
  const { activeLevel, levelBooks, currentEntry } = useMemo(() => {
    const unlockedSorted = books
      .filter(b => b.unlocked)
      .sort((a, b) => journeySortKey(a.subLevel) - journeySortKey(b.subLevel));

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
    const lvl = journeyLevelOf(target.book.subLevel);

    const allLevelBooks = books
      .filter(b => journeyLevelOf(b.subLevel) === lvl)
      .sort((a, b) => journeySortKey(a.subLevel) - journeySortKey(b.subLevel))
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
  const levelInfo = getJourneyLevel(activeLevel) ?? JOURNEY_LEVELS[0];
  const hex = levelInfo.hex;
  const ink = levelInfo.inkHex;

  // ─── Trail geometry — wavy dotted path through N book stops + check ──
  // Stops sit on a gentle wave; segments between them are smooth cubics.
  // Must run before any early return (hooks order). viewBox is 100 × 100;
  // stroke uses vector-effect=non-scaling-stroke so dots stay round.
  const stopCount = totalInLevel + 1; // books + Level Check
  const trail = useMemo(() => {
    const xPad = stopCount > 5 ? 7 : 10;
    const xs = Array.from({ length: stopCount }, (_, i) =>
      stopCount === 1 ? 50 : xPad + (i * (100 - 2 * xPad)) / (stopCount - 1));
    const ys = xs.map((_, i) => (i % 2 === 0 ? 38 : 62));
    const pts = xs.map((x, i) => ({ x, y: ys[i] }));
    const seg = (a: { x: number; y: number }, b: { x: number; y: number }) => {
      const mx = (a.x + b.x) / 2;
      return `M ${a.x} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x} ${b.y}`;
    };
    const segs = pts.slice(0, -1).map((p, i) => seg(p, pts[i + 1]));
    return { pts, segs };
  }, [stopCount]);

  // ─── Empty state ────────────────────────────────────────────
  if (levelBooks.length === 0) {
    return (
      <div className="px-4 pt-10 pb-24 max-w-md mx-auto text-center">
        <Sparkles className="w-10 h-10 text-primary mx-auto mb-4" />
        <h2 className="font-display text-2xl font-extrabold text-foreground">No books yet!</h2>
        <p className="text-sm text-muted-foreground mt-2">Ask a grown-up to unlock your first book.</p>
      </div>
    );
  }

  const heroBook = currentEntry?.book ?? levelBooks[levelBooks.length - 1].book;
  const heroStamps = currentEntry?.stamps.count ?? MAX_STAMPS;
  const heroMastered = currentEntry?.mastered ?? true;
  const coverUrl = getCoverImageUrl(heroBook.subLevel, heroBook.coverImageUrl);
  // The assessment route speaks journey-8 levels; place the hero book.
  const assessLevel = journeyLevelOf(heroBook.subLevel);

  // CTA + sub-message state machine — child-tested copy.
  let ctaLabel: string;
  let ctaSub: string;
  let primaryAction: () => void = () => onBookSelect(heroBook);
  if (allMastered) {
    ctaLabel = 'Start Level Check';
    ctaSub = "You've finished all your books!";
    primaryAction = () => navigate(`/assess?level=${assessLevel}`);
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

  const fade = (delay: number) => reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, delay, ease: EASE },
      };

  return (
    <div className="px-5 pt-5 lg:pt-12 pb-10 max-w-md lg:max-w-3xl mx-auto overflow-x-clip">
      {/* ── 1. Greeting ─────────────────────────────────────────── */}
      <motion.div {...fade(0)} className="text-center">
        <span
          className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-2"
          style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
        >
          Level {activeLevel} · {levelInfo.name}
        </span>
        <h1 className="font-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground tracking-tight mt-3 leading-tight">
          Time to read{childName ? `, ${childName}` : ''}! <span aria-hidden>📖</span>
        </h1>
      </motion.div>

      {/* ── 2. Hero — the book as an object ─────────────────────── */}
      <motion.section {...fade(0.08)} className="relative mt-8 lg:mt-10 text-center">
        {/* Soft level-colour wash behind the book */}
        <div
          aria-hidden
          className="absolute left-1/2 top-6 -translate-x-1/2 w-[22rem] h-[22rem] rounded-full blur-3xl opacity-[0.16] pointer-events-none"
          style={{ background: hex }}
        />

        {coverUrl && (
          <motion.button
            onClick={primaryAction}
            aria-label={`Open ${heroBook.title}`}
            className="relative block mx-auto w-[55%] max-w-[14rem] press-scale"
            {...(reduceMotion ? {} : {
              initial: { opacity: 0, y: 24, rotate: -3 },
              animate: { opacity: 1, y: 0, rotate: -2 },
              transition: { duration: 0.7, delay: 0.12, ease: EASE },
            })}
            style={{ rotate: '-2deg' }}
          >
            {/* page edges — the book is a real object */}
            <span aria-hidden className="absolute top-[3px] -right-[5px] bottom-[1px] w-[10px] rounded-r-md bg-[#f3ead9] ring-1 ring-black/10" />
            <span aria-hidden className="absolute top-[6px] -right-[9px] bottom-[3px] w-[10px] rounded-r-md bg-[#e9dfc8] ring-1 ring-black/10" />
            <span className="relative block aspect-[3/4] rounded-lg rounded-r-md overflow-hidden ring-1 ring-black/15 shadow-[0_24px_45px_-18px_rgba(40,30,40,0.45)]">
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              {/* spine shading */}
              <span aria-hidden className="absolute inset-y-0 left-0 w-[7%] bg-gradient-to-r from-black/25 to-transparent" />
            </span>
            {/* ground shadow */}
            <span aria-hidden className="absolute -bottom-4 left-[8%] right-[8%] h-4 rounded-[100%] bg-black/15 blur-md" />
          </motion.button>
        )}

        <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground leading-tight mt-8">
          {heroBook.title}
        </h2>

        {/* Five star stamps — sticker stars */}
        <div className="flex items-center justify-center gap-2 mt-4" aria-label={`${heroStamps} of ${MAX_STAMPS} reads done`}>
          {Array.from({ length: MAX_STAMPS }).map((_, i) => {
            const earned = i < heroStamps;
            const tilt = [-8, 5, -4, 7, -6][i];
            return (
              <motion.span
                key={i}
                className="inline-flex items-center justify-center w-11 h-11 lg:w-12 lg:h-12 rounded-full bg-white"
                style={{ boxShadow: STICKER, rotate: `${tilt}deg` }}
                {...(reduceMotion ? {} : {
                  initial: { scale: 0, rotate: tilt - 40 },
                  animate: { scale: 1, rotate: tilt },
                  transition: { delay: 0.3 + i * 0.08, type: 'spring', stiffness: 320, damping: 16 },
                })}
              >
                <Star
                  className="w-6 h-6 lg:w-7 lg:h-7"
                  style={earned
                    ? { color: hex, fill: hex }
                    : { color: 'hsl(var(--border))', fill: 'transparent' }}
                  strokeWidth={earned ? 0 : 2}
                />
              </motion.span>
            );
          })}
        </div>

        {/* One big pressable button */}
        <div className="mt-7 max-w-xs mx-auto">
          <button
            onClick={primaryAction}
            className="w-full h-14 lg:h-16 rounded-2xl font-display text-lg lg:text-xl font-extrabold text-white flex items-center justify-center gap-2.5 transition-all active:translate-y-[4px]"
            style={{
              background: hex,
              boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80`,
            }}
            onMouseDown={e => { (e.currentTarget.style.boxShadow = `0 0 0 ${ink}, 0 6px 16px -8px ${hex}60`); }}
            onMouseUp={e => { (e.currentTarget.style.boxShadow = `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80`); }}
            onMouseLeave={e => { (e.currentTarget.style.boxShadow = `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80`); }}
          >
            <BookOpen className="w-5 h-5" />
            {ctaLabel}
          </button>
          <p className="font-child text-sm text-foreground/60 mt-3">{ctaSub}</p>
        </div>
      </motion.section>

      {/* ── 3. Games — big cards right next to the book ──────────── */}
      <motion.section {...fade(0.12)} className="mt-11 lg:mt-14 text-center">
        <h3 className="font-display text-lg lg:text-xl font-extrabold text-foreground">
          Play a game <span aria-hidden>🎮</span>
        </h3>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
          {GAMES.map(({ id, emoji, name, blurb }, i) => (
            <button
              key={id}
              onClick={() => setActiveGame(id)}
              className="rounded-3xl bg-white px-4 py-5 lg:py-6 flex flex-col items-center text-center transition-all active:translate-y-[4px]"
              style={{
                boxShadow: `0 5px 0 ${hex}40, ${STICKER}`,
                border: `2px solid ${hex}40`,
                rotate: `${[-1, 0.8, -0.8][i]}deg`,
              }}
            >
              <span className="text-4xl lg:text-5xl" aria-hidden>{emoji}</span>
              <span className="font-display text-lg lg:text-xl font-extrabold mt-2.5 leading-tight" style={{ color: ink }}>
                {name}
              </span>
              <span className="font-child text-sm lg:text-base text-foreground/60 mt-1 leading-snug">
                {blurb}
              </span>
              <span
                className="mt-3.5 inline-flex items-center justify-center rounded-full px-5 py-1.5 font-display text-sm font-extrabold text-white"
                style={{ background: hex, boxShadow: `0 3px 0 ${ink}` }}
              >
                Play
              </span>
            </button>
          ))}
        </div>
      </motion.section>

      {/* ── 4. The trail ────────────────────────────────────────── */}
      <motion.section {...fade(0.16)} className="mt-12 lg:mt-16">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-lg lg:text-xl font-extrabold text-foreground">Your path</h3>
          <p className="text-xs font-bold text-muted-foreground tabular-nums">
            {masteredCount} of {totalInLevel} done
          </p>
        </div>

        <div className="relative mt-2 h-44 lg:h-48">
          {/* Wavy dotted path — one segment per gap, coloured once travelled */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden>
            {trail.segs.map((dSeg, i) => (
              <path
                key={i}
                d={dSeg}
                fill="none"
                stroke={levelBooks[i]?.mastered ? hex : 'hsl(var(--border))'}
                strokeWidth={4}
                strokeLinecap="round"
                strokeDasharray="0.1 11"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          {/* Stops */}
          {levelBooks.map((entry, i) => {
            const { book, state, stamps: s } = entry;
            const pt = trail.pts[i];
            const isCurrent = state === 'current';
            const isMastered = state === 'mastered';
            const cover = getCoverImageUrl(book.subLevel, book.coverImageUrl);
            return (
              <div
                key={book.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              >
                {isCurrent ? (
                  // Current stop = a mini BOOK (rectangle — covers never crop)
                  <motion.button
                    onClick={() => onBookSelect(book)}
                    aria-label={`${book.title} — your book, ${s.count} of ${MAX_STAMPS} reads done`}
                    className="relative w-14 lg:w-16 aspect-[3/4] rounded-md overflow-hidden press-scale bg-white"
                    style={{ boxShadow: STICKER, border: '3px solid #fff', outline: `3px solid ${hex}` }}
                    {...(reduceMotion ? {} : {
                      animate: { y: [0, -5, 0] },
                      transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                    })}
                  >
                    {cover
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <span className="w-full h-full flex items-center justify-center" style={{ background: hex }}><BookOpen className="w-5 h-5 text-white" /></span>}
                  </motion.button>
                ) : isMastered ? (
                  <button
                    onClick={() => onBookSelect(book)}
                    aria-label={`${book.title} — done`}
                    className="w-10 h-10 lg:w-11 lg:h-11 rounded-full flex items-center justify-center text-white press-scale"
                    style={{ background: hex, boxShadow: STICKER, border: '3px solid #fff' }}
                  >
                    <Check className="w-5 h-5" strokeWidth={3.5} />
                  </button>
                ) : (
                  <span
                    aria-label={`${book.title} — locked, finish your current book first`}
                    className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white flex items-center justify-center"
                    style={{ boxShadow: STICKER, border: '3px solid #fff', outline: '2px solid hsl(var(--border))' }}
                  >
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </span>
                )}
                <p className={`mt-1.5 text-[10px] font-extrabold leading-none whitespace-nowrap ${isCurrent ? '' : 'text-muted-foreground'}`}
                   style={isCurrent ? { color: ink } : undefined}>
                  {isCurrent ? `${s.count}/${MAX_STAMPS} reads` : isMastered ? 'Done!' : `Book ${i + 1}`}
                </p>
              </div>
            );
          })}

          {/* Level Check star at the end of the trail */}
          {(() => {
            const pt = trail.pts[trail.pts.length - 1];
            return (
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              >
                <motion.button
                  onClick={() => allMastered && navigate(`/assess?level=${assessLevel}`)}
                  disabled={!allMastered}
                  aria-label={allMastered ? 'Start your Level Check' : 'Level Check — finish your books first'}
                  className="w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center press-scale"
                  style={allMastered
                    ? { background: hex, boxShadow: STICKER, border: '3px solid #fff' }
                    : { background: '#fff', boxShadow: STICKER, border: '3px solid #fff', outline: '2px dashed hsl(var(--border))' }}
                  {...(allMastered && !reduceMotion ? {
                    animate: { scale: [1, 1.08, 1] },
                    transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' },
                  } : {})}
                >
                  <Star
                    className="w-6 h-6"
                    style={allMastered
                      ? { color: '#fff', fill: '#fff' }
                      : { color: 'hsl(var(--muted-foreground))', fill: 'transparent' }}
                    strokeWidth={allMastered ? 0 : 2}
                  />
                </motion.button>
                <p className="mt-1.5 text-[10px] font-extrabold leading-tight text-center whitespace-nowrap text-muted-foreground">
                  Level Check
                </p>
              </div>
            );
          })()}
        </div>
      </motion.section>

      {/* ── 5. Sound magnets ────────────────────────────────────── */}
      {levelInfo.gpcs.length > 0 && (
        <motion.section {...fade(0.24)} className="mt-10 lg:mt-14 text-center">
          <h3 className="font-display text-lg lg:text-xl font-extrabold text-foreground">
            Sounds you're learning
          </h3>
          <div className="mt-4 flex flex-wrap justify-center gap-2.5">
            {levelInfo.gpcs.slice(0, 12).map((g, i) => (
              <span
                key={g}
                className="font-child font-bold text-xl lg:text-2xl px-4 py-2 rounded-2xl bg-white inline-block"
                style={{
                  color: ink,
                  boxShadow: '0 2px 0 rgba(40,30,40,0.07), 0 8px 16px rgba(40,30,40,0.07)',
                  border: '1px solid rgba(40,30,40,0.06)',
                  rotate: `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg`,
                }}
              >
                {g}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {activeGame === 'sound' && (
        <SoundGame level={levelInfo} onClose={() => setActiveGame(null)} />
      )}
      {activeGame === 'finish' && (
        <FinishWordGame level={levelInfo} onClose={() => setActiveGame(null)} />
      )}
      {activeGame === 'tricky' && (
        <TrickyWordGame level={levelInfo} onClose={() => setActiveGame(null)} />
      )}
      {activeGame === 'cannon' && (
        <WordCannonGame level={levelInfo} onClose={() => setActiveGame(null)} />
      )}
    </div>
  );
}
