/**
 * SoundSafari — "Sound Spotter", the hidden-object detective game.
 *
 * A study full of scattered objects. A target spelling is announced
 * ("Find 3 things with 'sh' — like in 'ship'"); the child scans the
 * scene and taps every object whose word hides that spelling. Correct →
 * the object pops with a ring burst, its word flies into the detective's
 * evidence tray with the spelling lit up, and it's spoken aloud. A decoy
 * tap costs nothing but TEACHES: it wobbles, bonks and says its word —
 * "that's 'dog'... no 'sh' hiding there".
 *
 * Pedagogy: phoneme–grapheme awareness in the wild. Instead of picking
 * one of three tiles, the child does what real readers do — scan many
 * candidates and self-select the ones containing the spelling. Matching
 * is by spelling (same rule as the word-bank games).
 *
 * Five rounds; a round with at most one wrong tap earns its star.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, Star, RotateCcw, Search } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { displayGrapheme, speakWord } from '@/lib/soundGameWords';
import { sfx } from '@/games/audio';
import Scene from '@/games/Scene';
import { buildSafariRounds, type SafariRound } from './safariData';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

type Phase = 'intro' | 'play' | 'roundDone' | 'done';

const ROUNDS = 5;
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

interface Placed {
  word: string;
  emoji: string;
  isTarget: boolean;
  x: number;
  y: number;
  size: number;
  rot: number;
  found: boolean;
  shaking: boolean;
}

/** Scatter items on a jittered 4×3 grid so they never overlap but never
 *  look like a grid either. */
function place(round: SafariRound): Placed[] {
  const cells: { x: number; y: number }[] = [];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
    cells.push({ x: 12.5 + c * 25, y: 16 + r * 34 });
  }
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }
  return round.items.map((it, i) => ({
    ...it,
    x: Math.min(93, Math.max(7, cells[i].x + (Math.random() * 12 - 6))),
    y: Math.min(90, Math.max(8, cells[i].y + (Math.random() * 14 - 7))),
    size: 2.4 + Math.random() * 1.1,
    rot: Math.random() * 26 - 13,
    found: false,
    shaking: false,
  }));
}

/** The found word with the hunted spelling lit up. */
function Highlight({ word, target, hex }: { word: string; target: string; hex: string }) {
  const g = displayGrapheme(target);
  const at = word.indexOf(g);
  if (at < 0) return <>{word}</>;
  return (
    <>
      {word.slice(0, at)}
      <span style={{ color: hex, fontWeight: 800 }}>{g}</span>
      {word.slice(at + g.length)}
    </>
  );
}

export default function SoundSafari({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;

  const [phase, setPhase] = useState<Phase>('intro');
  const [rounds, setRounds] = useState<SafariRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [items, setItems] = useState<Placed[]>([]);
  const [wrongTaps, setWrongTaps] = useState(0);
  const [stars, setStars] = useState<boolean[]>([]);
  const advanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const round = rounds[roundIdx];
  const foundCount = items.filter(i => i.isTarget && i.found).length;

  const start = () => {
    const rs = buildSafariRounds(level, ROUNDS);
    if (!rs.length) return;
    setRounds(rs);
    setRoundIdx(0);
    setItems(place(rs[0]));
    setWrongTaps(0);
    setStars([]);
    setPhase('play');
    setTimeout(() => speakWord(rs[0].example), 400);
  };

  const nextRound = () => {
    const next = roundIdx + 1;
    if (next >= rounds.length) { setPhase('done'); return; }
    setRoundIdx(next);
    setItems(place(rounds[next]));
    setWrongTaps(0);
    setPhase('play');
    setTimeout(() => speakWord(rounds[next].example), 400);
  };

  useEffect(() => () => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  }, []);

  useEffect(() => {
    if (phase === 'done') sfx.fanfare();
  }, [phase]);

  const tap = (idx: number) => {
    if (phase !== 'play') return;
    const it = items[idx];
    if (!it || it.found) return;
    if (it.isTarget) {
      sfx.pop();
      speakWord(it.word);
      const after = items.map((x, i) => i === idx ? { ...x, found: true } : x);
      setItems(after);
      const remaining = after.filter(x => x.isTarget && !x.found).length;
      if (remaining === 0) {
        setStars(s => [...s, wrongTaps <= 1]);
        setPhase('roundDone');
        setTimeout(() => sfx.chord(), 250);
        advanceRef.current = setTimeout(nextRound, 1900);
      }
    } else {
      sfx.bonk();
      speakWord(it.word);
      setWrongTaps(n => n + 1);
      setItems(xs => xs.map((x, i) => i === idx ? { ...x, shaking: true } : x));
      setTimeout(() => setItems(xs => xs.map((x, i) => i === idx ? { ...x, shaking: false } : x)), 500);
    }
  };

  const starsEarned = stars.filter(Boolean).length;
  const shown = round ? displayGrapheme(round.target) : '';

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/spotter_study.webp" wash="light" />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-5 pt-5 max-w-md lg:max-w-3xl mx-auto w-full">
        <span
          className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
          style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
        >
          Sound Spotter
        </span>
        <button
          onClick={onClose}
          aria-label="Close game"
          className="w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
          style={{ boxShadow: STICKER }}
        >
          <X className="w-[18px] h-[18px] text-foreground/60" />
        </button>
      </div>

      {/* ── Intro ── */}
      {phase === 'intro' && (
        <motion.div
          {...(reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 } })}
          className="relative flex-1 flex flex-col items-center justify-center text-center px-5 py-10 max-w-md mx-auto"
        >
          <span className="text-6xl lg:text-7xl" aria-hidden>🔍</span>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-foreground mt-4">Sound Spotter</h1>
          <p className="font-child text-xl lg:text-2xl text-foreground/70 mt-3 max-w-sm leading-relaxed">
            Be a sound detective! Find every hidden thing with the sound you're hunting.
          </p>
          <button
            onClick={start}
            className="mt-9 w-full max-w-sm h-16 rounded-2xl font-display text-xl font-extrabold text-white flex items-center justify-center gap-3 transition-all active:translate-y-[4px]"
            style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
          >
            <Search className="w-6 h-6" /> Start the hunt!
          </button>
          <p className="text-xs font-bold text-muted-foreground mt-6">
            Sounds up to Level {level.level} · {level.name}
          </p>
        </motion.div>
      )}

      {/* ── Play / round-complete ── */}
      {(phase === 'play' || phase === 'roundDone') && round && (
        <div className="relative flex-1 flex flex-col max-w-md lg:max-w-3xl mx-auto w-full px-4 pb-3 min-h-0">
          {/* The brief */}
          <div className="relative z-10 flex items-center justify-center gap-2.5 mt-2">
            <span
              className="font-child font-bold text-3xl lg:text-4xl px-4 py-1 rounded-2xl text-white -rotate-2"
              style={{ background: hex, boxShadow: `0 3px 0 ${ink}, ${STICKER}` }}
            >
              {shown}
            </span>
            <span className="font-child text-lg lg:text-xl text-foreground/80 bg-white/85 rounded-2xl px-3.5 py-1.5" style={{ boxShadow: STICKER }}>
              Find {round.targetCount} with <b style={{ color: ink }}>{shown}</b>
            </span>
            <button
              onClick={() => speakWord(round.example)}
              aria-label={`Hear an example: ${round.example}`}
              className="w-11 h-11 rounded-full bg-white flex items-center justify-center press-scale shrink-0"
              style={{ boxShadow: STICKER, color: ink }}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* The scene — objects hidden in the study */}
          <div className="relative flex-1 mt-1 min-h-0" aria-label="Hidden objects">
            {items.map((it, i) => (
              <motion.button
                key={`${roundIdx}-${it.word}`}
                onClick={() => tap(i)}
                aria-label={it.found ? `${it.word} — found` : it.word}
                disabled={it.found}
                className="absolute -translate-x-1/2 -translate-y-1/2 select-none leading-none"
                style={{ left: `${it.x}%`, top: `${it.y}%`, fontSize: `${it.size}rem`, filter: 'drop-shadow(0 3px 3px rgba(40,30,40,0.3))' }}
                initial={reduceMotion ? {} : { scale: 0, rotate: it.rot - 30 }}
                animate={it.found
                  ? { scale: [1.35, 0], rotate: it.rot + 20, opacity: [1, 0] }
                  : it.shaking && !reduceMotion
                    ? { x: [0, -7, 7, -5, 5, 0], rotate: it.rot }
                    : { scale: 1, rotate: it.rot }}
                transition={it.found ? { duration: 0.45 } : { duration: 0.4, delay: reduceMotion ? 0 : i * 0.035 }}
              >
                <span aria-hidden>{it.emoji}</span>
              </motion.button>
            ))}

            {/* Round-complete stamp */}
            <AnimatePresence>
              {phase === 'roundDone' && (
                <motion.div
                  {...(reduceMotion ? {} : {
                    initial: { scale: 0.4, opacity: 0, rotate: -8 },
                    animate: { scale: 1, opacity: 1, rotate: -4 },
                    exit: { opacity: 0 },
                  })}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-3xl bg-white px-8 py-5 text-center"
                  style={{ boxShadow: `0 6px 0 ${hex}50, ${STICKER}` }}
                >
                  <span className="text-4xl" aria-hidden>{stars[stars.length - 1] ? '🌟' : '👏'}</span>
                  <p className="font-display text-2xl font-extrabold mt-1" style={{ color: ink }}>
                    {stars[stars.length - 1] ? 'Sharp eyes!' : 'All found!'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Evidence tray */}
          <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap pb-1" aria-label={`Found ${foundCount} of ${round.targetCount}`}>
            {round.items.filter(x => x.isTarget).map(t => {
              const found = items.find(x => x.word === t.word)?.found;
              return (
                <span
                  key={t.word}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-child text-base lg:text-lg"
                  style={found
                    ? { boxShadow: `0 0 0 2px ${hex}, ${STICKER}`, color: 'hsl(var(--foreground))' }
                    : { boxShadow: STICKER, color: 'transparent', background: '#ffffffb0', outline: '2px dashed hsl(var(--border))' }}
                >
                  {found ? (
                    <>
                      <span aria-hidden>{t.emoji}</span>
                      <Highlight word={t.word} target={round.target} hex={hex} />
                    </>
                  ) : (
                    <span className="text-foreground/30 font-bold">?</span>
                  )}
                </span>
              );
            })}
            <span className="ml-2 text-xs font-extrabold text-muted-foreground tabular-nums">
              Round {roundIdx + 1}/{rounds.length}
            </span>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <motion.div
          {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
          className="relative flex-1 flex flex-col items-center justify-center text-center px-5 py-10 max-w-md mx-auto"
        >
          <div className="flex gap-2">
            {Array.from({ length: ROUNDS }).map((_, i) => (
              <motion.span
                key={i}
                {...(reduceMotion ? {} : {
                  initial: { scale: 0, rotate: -40 },
                  animate: { scale: 1, rotate: [-8, 5, -4, 7, -6][i] },
                  transition: { delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 14 },
                })}
                className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white"
                style={{ boxShadow: STICKER }}
              >
                <Star
                  className="w-8 h-8"
                  style={i < starsEarned ? { color: hex, fill: hex } : { color: 'hsl(var(--border))', fill: 'transparent' }}
                  strokeWidth={i < starsEarned ? 0 : 2}
                />
              </motion.span>
            ))}
          </div>
          <h2 className="font-display text-3xl font-extrabold text-foreground mt-6">
            {starsEarned === ROUNDS ? 'Master detective!' : starsEarned >= 3 ? 'Great spotting!' : 'Case closed!'}
          </h2>
          <p className="font-child text-lg text-foreground/70 mt-2">
            {starsEarned} sharp-eyed round{starsEarned === 1 ? '' : 's'} out of {ROUNDS}.
          </p>
          <div className="mt-9 w-full max-w-xs space-y-3">
            <button
              onClick={start}
              className="w-full h-14 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2.5 transition-all active:translate-y-[4px]"
              style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
            >
              <RotateCcw className="w-5 h-5" /> New case
            </button>
            <button
              onClick={onClose}
              className="w-full h-12 rounded-2xl font-display text-base font-extrabold bg-white text-foreground/70 press-scale"
              style={{ boxShadow: STICKER }}
            >
              All done
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
