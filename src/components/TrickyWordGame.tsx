/**
 * TrickyWordGame — "Hear it, find it" full-screen mini-game.
 *
 * A tricky word is spoken aloud (tricky words can't be sounded out, so
 * the EAR leads); three big word cards sit below and the child taps the
 * one they heard. Correct → the card lights up in the level colour, a
 * star is earned, next word. Wrong → gentle shake, hear it again.
 *
 * Pedagogy: tricky words are sight words — instant whole-word recognition
 * is the goal, which is exactly what listen-and-find practises. Targets
 * come from the child's level; the pool is cumulative (words from earlier
 * levels stay in rotation as distractors — they're assumed known).
 *
 * Two modes, same as the other games:
 *  - Relax  — 5 words, collect a star per first-try answer
 *  - Speedy — 30 seconds, how many can you find?
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, Star, Timer, Coffee, RotateCcw } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { JOURNEY_LEVELS } from '@/lib/levels8';
import { buildTrickyRounds, speakWord, type TrickyRound } from '@/lib/soundGameWords';
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

export default function TrickyWordGame({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;

  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<Mode>('relax');
  const [rounds, setRounds] = useState<TrickyRound[]>([]);
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
    setRounds(buildTrickyRounds(JOURNEY_LEVELS, level, m === 'relax' ? RELAX_ROUNDS : 60));
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

  // Say the target as each round appears — listening IS the game.
  useEffect(() => {
    if (phase === 'play' && round) speakWord(round.target);
  }, [phase, roundIdx]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const pick = (w: string) => {
    if (solved || !round) return;
    if (w === round.target) {
      setSolved(true);
      setWrongTile(null);
      if (firstTry) sfx.star(); else sfx.pop();
      if (mode === 'relax') setStars(s => [...s, firstTry]);
      else if (firstTry) setScore(s => s + 1);
      setTimeout(advance, 950);
    } else {
      sfx.bonk();
      setFirstTry(false);
      setWrongTile(w);
      // Say it again so the child can re-listen rather than guess.
      speakWord(round.target);
      setTimeout(() => setWrongTile(null), 500);
    }
  };

  // End-of-game fanfare
  useEffect(() => {
    if (phase === 'done') sfx.fanfare();
  }, [phase]);

  const starsEarned = stars.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/tricky_night.webp" wash="strong" />
      {/* soft level wash */}
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: hex }} />

      <div className="relative max-w-md lg:max-w-2xl mx-auto px-5 pt-5 pb-10 min-h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            Hear it, find it
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
            <span className="text-6xl lg:text-7xl" aria-hidden>👂</span>
            <h1 className="font-display text-4xl lg:text-5xl font-extrabold text-foreground mt-4">
              Hear it, find it
            </h1>
            <p className="font-child text-xl lg:text-2xl text-foreground/70 mt-3 max-w-sm leading-relaxed">
              Listen to the tricky word, then tap the one you heard!
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
              Tricky words up to Level {level.level} · {level.name}
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

            {/* The big ear — replay button */}
            <div className="flex flex-col items-center text-center py-10 lg:py-12">
              <p className="font-child text-lg lg:text-xl text-foreground/55">Which word did you hear?</p>
              <motion.button
                key={`speak-${roundIdx}`}
                onClick={() => speakWord(round.target)}
                aria-label="Hear the word again"
                className="mt-5 w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-white flex items-center justify-center press-scale"
                style={{ boxShadow: `0 5px 0 ${hex}40, ${STICKER}`, border: `3px solid ${hex}50`, color: ink }}
                {...(reduceMotion ? {} : {
                  initial: { scale: 0.8, opacity: 0 },
                  animate: { scale: 1, opacity: 1 },
                  transition: { type: 'spring', stiffness: 320, damping: 18 },
                })}
              >
                <Volume2 className="w-11 h-11 lg:w-12 lg:h-12" />
              </motion.button>
              <p className="font-child text-base text-foreground/50 mt-3">Tap to hear it again</p>
              {solved && (
                <motion.p
                  {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.8 }, animate: { opacity: 1, scale: 1 } })}
                  className="font-display text-2xl font-extrabold mt-4"
                  style={{ color: ink }}
                >
                  {firstTry ? 'Brilliant! ⭐' : 'You found it! 👏'}
                </motion.p>
              )}
            </div>

            {/* The three word cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={roundIdx}
                {...(reduceMotion ? {} : {
                  initial: { opacity: 0, y: 14 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: -10 },
                  transition: { duration: 0.25 },
                })}
                className="grid grid-cols-1 gap-3 lg:gap-4 pb-4 max-w-sm w-full mx-auto"
              >
                {round.options.map(w => {
                  const isTarget = w === round.target;
                  const showCorrect = solved && isTarget;
                  return (
                    <motion.button
                      key={`${roundIdx}-${w}`}
                      onClick={() => pick(w)}
                      aria-label={`Word ${w}`}
                      animate={wrongTile === w && !reduceMotion ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
                      transition={{ duration: 0.4 }}
                      className="h-20 lg:h-24 rounded-2xl font-child font-bold text-4xl lg:text-5xl bg-white transition-colors press-scale"
                      style={showCorrect
                        ? { background: hex, color: '#fff', boxShadow: `0 4px 0 ${ink}, ${STICKER}` }
                        : wrongTile === w
                          ? { color: 'hsl(var(--muted-foreground))', boxShadow: STICKER, border: '2px solid hsl(var(--border))' }
                          : { color: 'hsl(var(--foreground))', boxShadow: `0 4px 0 rgba(40,30,40,0.08), ${STICKER}`, border: '1px solid rgba(40,30,40,0.05)' }}
                    >
                      {w}
                    </motion.button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
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
                <p className="font-child text-lg text-foreground/70 mt-2">
                  You found {starsEarned} word{starsEarned === 1 ? '' : 's'} first try.
                </p>
              </>
            ) : (
              <>
                <span className="font-display text-7xl font-extrabold" style={{ color: ink }}>{score}</span>
                <h2 className="font-display text-2xl font-extrabold text-foreground mt-3">
                  word{score === 1 ? '' : 's'} in 30 seconds!
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
