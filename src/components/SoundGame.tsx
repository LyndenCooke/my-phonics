/**
 * SoundGame — "What sound is it?" full-screen mini-game.
 *
 * A word from the child's level appears big on screen (with a speaker
 * button that says it aloud). Three sound magnets sit below; the child
 * taps the grapheme hiding in the word. Correct → the sound lights up
 * inside the word (the teach moment), a star is earned, next word.
 * Wrong → gentle shake, try again, no penalty.
 *
 * Two modes:
 *  - Relax  — 5 words, collect a star per first-try answer
 *  - Speedy — 30 seconds, how many can you find?
 *
 * Same "paper & stickers" language as the home screen. No data writes —
 * pure practice. Pedagogy: grapheme-in-word recognition reinforces the
 * level's GPCs without testing pressure (the only formal gate stays the
 * Level Check).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, Star, Timer, Coffee, RotateCcw } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { buildRounds, displayGrapheme, speakWord, type GameRound } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
import { sfx } from '@/games/audio';
import Scene from '@/games/Scene';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

type Phase = 'intro' | 'play' | 'done';
type Mode = 'relax' | 'speedy';

const RELAX_ROUNDS = 5;
const SPEEDY_SECONDS = 30;
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

/** Render the word with the found grapheme lit up in the level colour.
 *  Handles split digraphs ("a-e" in "cake" lights the a and the final e). */
function WordWithHighlight({ word, target, hex, solved }: {
  word: string; target: string; hex: string; solved: boolean;
}) {
  if (!solved) return <>{word}</>;
  const g = displayGrapheme(target);
  if (target.includes('-') && g.length === 2) {
    // split digraph: first letter + trailing e
    const idx = word.indexOf(g[0]);
    const last = word.lastIndexOf(g[1]);
    if (idx >= 0 && last > idx) {
      return (
        <>
          {word.slice(0, idx)}
          <span style={{ color: hex }}>{word[idx]}</span>
          {word.slice(idx + 1, last)}
          <span style={{ color: hex }}>{word[last]}</span>
          {word.slice(last + 1)}
        </>
      );
    }
  }
  const at = word.indexOf(g);
  if (at < 0) return <>{word}</>;
  return (
    <>
      {word.slice(0, at)}
      <span style={{ color: hex }}>{g}</span>
      {word.slice(at + g.length)}
    </>
  );
}

export default function SoundGame({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;
  const bank = useGameBank(level);

  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<Mode>('relax');
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(true);
  const [stars, setStars] = useState<boolean[]>([]);
  const [score, setScore] = useState(0);
  const [wrongTile, setWrongTile] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(SPEEDY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const round = rounds[roundIdx];

  const start = (m: Mode) => {
    setMode(m);
    setRounds(buildRounds(level, m === 'relax' ? RELAX_ROUNDS : 60, bank));
    setRoundIdx(0);
    setSolved(false);
    setFirstTry(true);
    setStars([]);
    setScore(0);
    setTimeLeft(SPEEDY_SECONDS);
    setPhase('play');
  };

  // Speedy countdown
  useEffect(() => {
    if (phase !== 'play' || mode !== 'speedy') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setPhase('done');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, mode]);

  // Stop any speech when the game closes
  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  }, []);

  const advance = () => {
    if (mode === 'relax' && roundIdx + 1 >= RELAX_ROUNDS) {
      setPhase('done');
      return;
    }
    setRoundIdx(i => i + 1);
    setSolved(false);
    setFirstTry(true);
    setWrongTile(null);
  };

  const pick = (g: string) => {
    if (solved || !round) return;
    if (g === round.target) {
      setSolved(true);
      setWrongTile(null);
      if (firstTry) sfx.star(); else sfx.pop();
      if (mode === 'relax') setStars(s => [...s, firstTry]);
      else if (firstTry) setScore(s => s + 1);
      setTimeout(advance, 950);
    } else {
      sfx.bonk();
      setFirstTry(false);
      setWrongTile(g);
      setTimeout(() => setWrongTile(null), 500);
    }
  };

  // End-of-game fanfare (both modes reach 'done' from a played round)
  useEffect(() => {
    if (phase === 'done') sfx.fanfare();
  }, [phase]);

  const starsEarned = stars.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/spotter_study.webp" />
      {/* soft level wash */}
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: hex }} />

      <div className="relative max-w-md lg:max-w-2xl mx-auto px-5 pt-5 pb-10 min-h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            What sound is it?
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
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <span className="text-6xl lg:text-7xl" aria-hidden>🔍</span>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-foreground mt-4">
              What sound is it?
            </h1>
            <p className="font-child text-xl lg:text-2xl text-foreground/70 mt-3 max-w-sm leading-relaxed">
              A word will appear. Tap the sound hiding inside it!
            </p>

            <div className="mt-9 w-full max-w-sm space-y-3.5">
              <button
                onClick={() => start('relax')}
                className="w-full h-16 rounded-2xl font-display text-xl font-extrabold text-white flex items-center justify-center gap-3 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
              >
                <Coffee className="w-6 h-6" /> 5 words · take your time
              </button>
              <button
                onClick={() => start('speedy')}
                className="w-full h-16 rounded-2xl font-display text-xl font-extrabold flex items-center justify-center gap-3 bg-white transition-all active:translate-y-[3px]"
                style={{ color: ink, boxShadow: `0 4px 0 ${hex}40, ${STICKER}`, border: `2px solid ${hex}50` }}
              >
                <Timer className="w-6 h-6" /> Speedy — 30 seconds!
              </button>
            </div>
            <p className="text-xs font-bold text-muted-foreground mt-6">
              Sounds from Level {level.level} · {level.name}
            </p>
          </motion.div>
        )}

        {/* ── Play ── */}
        {phase === 'play' && round && (
          <div className="flex-1 flex flex-col justify-center pt-6">
            {/* Progress: stars (relax) or score + timer bar (speedy) */}
            {mode === 'relax' ? (
              <div className="flex items-center justify-center gap-2" aria-label={`Word ${roundIdx + 1} of ${RELAX_ROUNDS}`}>
                {Array.from({ length: RELAX_ROUNDS }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-6 h-6"
                    style={i < stars.length
                      ? stars[i] ? { color: hex, fill: hex } : { color: `${hex}70`, fill: `${hex}40` }
                      : { color: 'hsl(var(--border))', fill: 'transparent' }}
                    strokeWidth={i < stars.length ? 0 : 2}
                  />
                ))}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between text-sm font-extrabold" style={{ color: ink }}>
                  <span className="font-display text-xl tabular-nums">{score} ⭐</span>
                  <span className="tabular-nums flex items-center gap-1"><Timer className="w-4 h-4" />{timeLeft}s</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / SPEEDY_SECONDS) * 100}%`, background: hex }}
                  />
                </div>
              </div>
            )}

            {/* The word */}
            <div className="flex flex-col items-center text-center py-10 lg:py-12">
              <p className="font-child text-lg lg:text-xl text-foreground/55">Tap the sound hiding in…</p>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${roundIdx}-${round.word}`}
                  {...(reduceMotion ? {} : {
                    initial: { opacity: 0, y: 14, scale: 0.96 },
                    animate: { opacity: 1, y: 0, scale: 1 },
                    exit: { opacity: 0, y: -10, scale: 0.97 },
                    transition: { duration: 0.25 },
                  })}
                  className="mt-3 flex items-center gap-3"
                >
                  <span
                    className={`font-child font-bold px-7 py-4 rounded-3xl bg-white inline-block ${
                      round.word.length > 8 ? 'text-4xl lg:text-6xl' : 'text-6xl lg:text-7xl'
                    }`}
                    style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)', color: 'hsl(var(--foreground))' }}
                  >
                    <WordWithHighlight word={round.word} target={round.target} hex={hex} solved={solved} />
                  </span>
                  <button
                    onClick={() => speakWord(round.word)}
                    aria-label={`Hear the word`}
                    className="w-14 h-14 rounded-full bg-white flex items-center justify-center press-scale shrink-0"
                    style={{ boxShadow: STICKER, color: ink }}
                  >
                    <Volume2 className="w-6 h-6" />
                  </button>
                </motion.div>
              </AnimatePresence>
              {solved && (
                <motion.p
                  {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } })}
                  className="font-display text-2xl font-extrabold mt-5"
                  style={{ color: ink }}
                >
                  {firstTry ? 'Brilliant! ⭐' : 'You found it! 👏'}
                </motion.p>
              )}
            </div>

            {/* The three sound magnets */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4 pb-4">
              {round.options.map(g => {
                const isTarget = g === round.target;
                const showCorrect = solved && isTarget;
                return (
                  <motion.button
                    key={`${roundIdx}-${g}`}
                    onClick={() => pick(g)}
                    aria-label={`Sound ${displayGrapheme(g)}`}
                    animate={wrongTile === g && !reduceMotion ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="h-24 lg:h-28 rounded-2xl font-child font-bold text-4xl lg:text-5xl bg-white transition-colors press-scale"
                    style={showCorrect
                      ? { background: hex, color: '#fff', boxShadow: `0 4px 0 ${ink}, ${STICKER}` }
                      : wrongTile === g
                        ? { color: 'hsl(var(--muted-foreground))', boxShadow: STICKER, border: '2px solid hsl(var(--border))' }
                        : { color: ink, boxShadow: `0 4px 0 rgba(40,30,40,0.08), ${STICKER}`, border: '1px solid rgba(40,30,40,0.05)' }}
                  >
                    {displayGrapheme(g)}
                  </motion.button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Done ── */}
        {phase === 'done' && (
          <motion.div
            {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            {mode === 'relax' ? (
              <>
                <div className="flex gap-2">
                  {Array.from({ length: RELAX_ROUNDS }).map((_, i) => (
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
                  {starsEarned === RELAX_ROUNDS ? 'All five stars!' : starsEarned >= 3 ? 'Great work!' : 'Good try!'}
                </h2>
                <p className="font-child text-base text-foreground/70 mt-2">
                  You found {starsEarned} sound{starsEarned === 1 ? '' : 's'} first try.
                </p>
              </>
            ) : (
              <>
                <span className="font-display text-7xl font-extrabold" style={{ color: ink }}>{score}</span>
                <h2 className="font-display text-2xl font-extrabold text-foreground mt-3">
                  sound{score === 1 ? '' : 's'} in 30 seconds!
                </h2>
              </>
            )}

            <div className="mt-9 w-full max-w-xs space-y-3">
              <button
                onClick={() => start(mode)}
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
    </div>
  );
}
