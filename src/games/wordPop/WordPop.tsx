/**
 * WordPop — "Word Pop" arcade bubble-popper.
 *
 * A target word is spoken (and shown). Bubbles drift up the screen, each
 * carrying a word from the level's decodable bank — pop the one that
 * matches before it floats away. Streaks build a combo multiplier
 * (x2 at 3 in a row, x3 at 6); a wrong pop or an escaped target resets
 * the streak. 60 seconds, waves speed up as the score climbs.
 *
 * Pedagogy: rapid whole-word recognition of decodable words — the child
 * hears the word, then scans and discriminates between visually similar
 * words under gentle time pressure. Reading speed dressed up as an arcade.
 *
 * Fully client-side, level-parameterised, no auth — safe on the public
 * /games arcade.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, Timer, RotateCcw, Zap } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { speakWord } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
import { sfx } from '@/games/audio';
import Scene from '@/games/Scene';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

type Phase = 'intro' | 'play' | 'done';

const GAME_SECONDS = 60;
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
const BUBBLES_PER_WAVE = 4;

interface Bubble {
  id: number;
  word: string;
  isTarget: boolean;
  /** Horizontal position, % of play area width. */
  left: number;
  /** Stagger delay in seconds so a wave doesn't rise as a flat row. */
  delay: number;
  size: number;
  popped: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Decodable words for this level. The bank (lib/greenWords.useGameBank)
 *  already contains only taught sounds at or below the level, so the
 *  whole pool is safe — favour the level's own sounds, pad from the rest
 *  of the bank (earlier levels) when they're thin. */
function wordPoolFor(level: JourneyLevel, bank: Record<string, string[]>): string[] {
  const pool = new Set(level.gpcs.flatMap(g => bank[g] ?? []));
  if (pool.size < 12) {
    for (const words of Object.values(bank)) {
      for (const w of words) pool.add(w);
      if (pool.size >= 24) break;
    }
  }
  return [...pool];
}

export default function WordPop({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;

  const [phase, setPhase] = useState<Phase>('intro');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);
  const [wave, setWave] = useState(0);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [target, setTarget] = useState('');
  const [burst, setBurst] = useState<{ x: number; y: number; key: number } | null>(null);
  const [escaped, setEscaped] = useState(0);
  const idRef = useRef(0);
  const waveHandledRef = useRef(false);

  const bank = useGameBank(level);
  const pool = useMemo(() => wordPoolFor(level, bank), [level, bank]);
  const multiplier = streak >= 6 ? 3 : streak >= 3 ? 2 : 1;
  // Waves rise faster as the score climbs; slower with reduced motion off? No —
  // reduced motion keeps bubbles static in place (they fade in, no drift).
  const riseSeconds = Math.max(4.5, 8 - score * 0.15);

  const newWave = () => {
    if (pool.length < BUBBLES_PER_WAVE) return;
    const words = shuffle(pool).slice(0, BUBBLES_PER_WAVE);
    const targetWord = words[Math.floor(Math.random() * words.length)];
    const lanes = shuffle([8, 33, 58, 83]);
    setBubbles(words.map((w, i) => ({
      id: ++idRef.current,
      word: w,
      isTarget: w === targetWord,
      left: lanes[i] + (Math.random() * 6 - 3),
      delay: Math.random() * 0.9,
      size: w.length > 6 ? 108 : 92,
      popped: false,
    })));
    setTarget(targetWord);
    waveHandledRef.current = false;
    setWave(n => n + 1);
    speakWord(targetWord);
  };

  const start = () => {
    setScore(0);
    setStreak(0);
    setBest(0);
    setTimeLeft(GAME_SECONDS);
    setPhase('play');
    newWave();
  };

  // Countdown
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => {
      setTimeLeft(s => {
        if (s <= 1) { clearInterval(t); setPhase('done'); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase]);

  // Wall-clock wave fallback. Normally the target bubble's rise animation
  // ending is what rotates the wave, but that's rAF-driven — with reduced
  // motion there's no rise at all, and in a throttled/occluded tab rAF can
  // stall entirely while the 1s countdown keeps going. Either way, rotate
  // the wave by timer if the animation hasn't. missWave/pop are guarded by
  // waveHandledRef, so a double-fire is harmless.
  useEffect(() => {
    if (phase !== 'play') return;
    const t = setTimeout(() => { if (!waveHandledRef.current) missWave(); }, (riseSeconds + 1.3) * 1000);
    return () => clearTimeout(t);
  }, [phase, wave]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  }, []);

  // Time's-up fanfare
  useEffect(() => {
    if (phase === 'done') sfx.fanfare();
  }, [phase]);

  const missWave = () => {
    if (waveHandledRef.current) return;
    waveHandledRef.current = true;
    setStreak(0);
    // "It got away!" flash under the target word, keyed so repeats re-animate.
    setEscaped(n => n + 1);
    setTimeout(() => setEscaped(0), 1200);
    newWave();
  };

  const pop = (b: Bubble, e: React.MouseEvent) => {
    if (phase !== 'play' || b.popped || waveHandledRef.current) return;
    if (b.isTarget) {
      waveHandledRef.current = true;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setBurst({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, key: b.id });
      setBubbles(bs => bs.map(x => x.id === b.id ? { ...x, popped: true } : x));
      const nextStreak = streak + 1;
      // Score with the multiplier the streak has just EARNED — hitting the
      // third-in-a-row is what should feel like the payoff.
      const m = nextStreak >= 6 ? 3 : nextStreak >= 3 ? 2 : 1;
      if (nextStreak === 3 || nextStreak === 6) sfx.sparkle(); else sfx.pop();
      setStreak(nextStreak);
      setBest(x => Math.max(x, nextStreak));
      setScore(s => s + m);
      setTimeout(newWave, 420);
    } else {
      sfx.bonk();
      setStreak(0);
      setBubbles(bs => bs.map(x => x.id === b.id ? { ...x, popped: true } : x));
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden flex flex-col" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/wordpop_sky.webp" wash="light" />
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: hex }} />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-5 pt-5 max-w-md lg:max-w-2xl mx-auto w-full">
        <span
          className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
          style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
        >
          Word Pop
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
          <span className="text-6xl lg:text-7xl" aria-hidden>🫧</span>
          <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-foreground mt-4">Word Pop</h1>
          <p className="font-child text-xl lg:text-2xl text-foreground/70 mt-3 max-w-sm leading-relaxed">
            Listen for the word, then pop its bubble before it floats away. Pop lots in a row for a combo!
          </p>
          <button
            onClick={start}
            className="mt-9 w-full max-w-sm h-16 rounded-2xl font-display text-xl font-extrabold text-white flex items-center justify-center gap-3 transition-all active:translate-y-[4px]"
            style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
          >
            <Timer className="w-6 h-6" /> Play — 60 seconds!
          </button>
          <p className="text-xs font-bold text-muted-foreground mt-6">
            Words from Level {level.level} · {level.name}
          </p>
        </motion.div>
      )}

      {/* ── Play ── */}
      {phase === 'play' && (
        <div className="relative flex-1 flex flex-col max-w-md lg:max-w-2xl mx-auto w-full px-5 pb-4 min-h-0">
          {/* Score row */}
          <div className="flex items-center justify-between mt-3 text-sm font-extrabold" style={{ color: ink }}>
            <span className="font-display text-xl tabular-nums">{score} ⭐</span>
            <AnimatePresence>
              {multiplier > 1 && (
                <motion.span
                  key={multiplier}
                  {...(reduceMotion ? {} : { initial: { scale: 0.5, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.5, opacity: 0 } })}
                  className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs"
                  style={{ boxShadow: STICKER, color: ink }}
                >
                  <Zap className="w-3.5 h-3.5" style={{ color: hex, fill: hex }} /> Combo x{multiplier}
                </motion.span>
              )}
            </AnimatePresence>
            <span className="tabular-nums flex items-center gap-1"><Timer className="w-4 h-4" />{timeLeft}s</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
            <div
              className="h-full rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${(timeLeft / GAME_SECONDS) * 100}%`, background: hex }}
            />
          </div>

          {/* Target word — z-raised so exiting bubbles drift behind it */}
          <div className="relative z-10 flex items-center justify-center gap-3 mt-4">
            <span
              className="font-child font-bold text-3xl lg:text-4xl px-6 py-2.5 rounded-3xl bg-white"
              style={{ boxShadow: STICKER, border: `2px solid ${hex}40`, color: 'hsl(var(--foreground))' }}
            >
              Pop: <span style={{ color: ink }}>{target}</span>
            </span>
            <button
              onClick={() => speakWord(target)}
              aria-label="Hear the word again"
              className="w-12 h-12 rounded-full bg-white flex items-center justify-center press-scale shrink-0"
              style={{ boxShadow: STICKER, color: ink }}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* "It got away!" flash when the target escapes */}
          <div className="relative z-10 h-6 mt-1.5 text-center" aria-live="polite">
            <AnimatePresence>
              {escaped > 0 && (
                <motion.span
                  key={escaped}
                  {...(reduceMotion ? {} : {
                    initial: { opacity: 0, y: -6 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0 },
                  })}
                  className="font-child text-sm font-bold text-foreground/50"
                >
                  It got away! <span aria-hidden>💨</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Bubble field */}
          <div className="relative flex-1 mt-1 min-h-0" aria-label="Floating word bubbles">
            {/* Drifting clouds behind the bubbles */}
            {!reduceMotion && [0, 1].map(i => (
              <motion.span
                key={`cloud-${i}`}
                aria-hidden
                className="absolute rounded-full bg-white/60 blur-xl pointer-events-none"
                style={{
                  width: i ? '9rem' : '12rem',
                  height: i ? '2.6rem' : '3.4rem',
                  top: i ? '52%' : '22%',
                }}
                initial={{ left: i ? '70%' : '-30%' }}
                animate={{ left: ['-30%', '110%'] }}
                transition={{ duration: i ? 46 : 34, repeat: Infinity, ease: 'linear', delay: i * -20 }}
              />
            ))}
            {bubbles.map(b => (
              <motion.button
                key={b.id}
                onClick={e => pop(b, e)}
                aria-label={`Bubble ${b.word}`}
                className="absolute font-child font-bold rounded-full flex items-center justify-center select-none"
                style={{
                  left: `${b.left}%`,
                  width: b.size,
                  height: b.size,
                  fontSize: b.word.length > 6 ? '1.15rem' : '1.4rem',
                  color: ink,
                  background: 'radial-gradient(circle at 32% 28%, #ffffff 0%, #ffffffd8 45%, ' + hex + '2E 100%)',
                  border: `2.5px solid ${hex}55`,
                  boxShadow: `inset 0 -6px 12px ${hex}20, ${STICKER}`,
                }}
                initial={reduceMotion
                  ? { top: `${18 + (b.id % 3) * 24}%`, opacity: 0 }
                  : { top: '100%', opacity: 1 }}
                animate={b.popped
                  ? { scale: b.isTarget ? [1, 1.35, 0] : [1, 0.85, 0], opacity: [1, 1, 0] }
                  : reduceMotion
                    ? { opacity: 1 }
                    : { top: '-18%' }}
                transition={b.popped
                  ? { duration: 0.35 }
                  : reduceMotion
                    ? { duration: 0.3 }
                    : { duration: riseSeconds, delay: b.delay, ease: 'linear' }}
                onAnimationComplete={() => {
                  // Only the rise animation of the TARGET bubble ends the wave.
                  if (!b.popped && b.isTarget && !reduceMotion && phase === 'play') missWave();
                }}
              >
                {/* gentle horizontal sway while rising */}
                <motion.span
                  className="pointer-events-none"
                  {...(reduceMotion ? {} : {
                    animate: { x: [0, 7, -7, 0] },
                    transition: { duration: 2.6 + (b.id % 3) * 0.5, repeat: Infinity, ease: 'easeInOut' },
                  })}
                >
                  {b.word}
                </motion.span>
              </motion.button>
            ))}

            {/* Pop burst */}
            <AnimatePresence>
              {burst && !reduceMotion && (
                <motion.div
                  key={burst.key}
                  className="fixed pointer-events-none z-10"
                  style={{ left: burst.x, top: burst.y }}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  onAnimationComplete={() => setBurst(null)}
                >
                  {Array.from({ length: 6 }).map((_, i) => {
                    const a = (i / 6) * Math.PI * 2;
                    return (
                      <motion.span
                        key={i}
                        className="absolute w-2.5 h-2.5 rounded-full"
                        style={{ background: hex }}
                        initial={{ x: 0, y: 0, scale: 1 }}
                        animate={{ x: Math.cos(a) * 42, y: Math.sin(a) * 42, scale: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                      />
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ── Done ── */}
      {phase === 'done' && (
        <motion.div
          {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
          className="relative flex-1 flex flex-col items-center justify-center text-center px-5 py-10 max-w-md mx-auto"
        >
          <span className="font-display text-7xl font-extrabold" style={{ color: ink }}>{score}</span>
          <h2 className="font-display text-2xl font-extrabold text-foreground mt-3">
            star{score === 1 ? '' : 's'} in 60 seconds!
          </h2>
          {best >= 3 && (
            <p className="font-child text-lg text-foreground/70 mt-2">
              Best combo: {best} pops in a row <span aria-hidden>⚡</span>
            </p>
          )}
          <div className="mt-9 w-full max-w-xs space-y-3">
            <button
              onClick={start}
              className="w-full h-14 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2.5 transition-all active:translate-y-[4px]"
              style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
            >
              <RotateCcw className="w-5 h-5" /> Play again
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
