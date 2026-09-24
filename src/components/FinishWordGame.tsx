/**
 * FinishWordGame — "Finish the word" full-screen mini-game.
 *
 * A word from the child's level appears with one grapheme missing
 * ("du_k"); the speaker says the whole word. Three sound magnets sit
 * below; the child taps the missing sound. Correct → the grapheme drops
 * into the gap in the level colour, a star is earned, next word.
 * Wrong → gentle shake, try again, no penalty.
 *
 * Pedagogy: blending in reverse — the child must HEAR the word, segment
 * it, and supply the missing grapheme. One step harder than spotting a
 * sound (SoundGame), one step easier than free spelling.
 *
 * Two modes, same as the other games:
 *  - Relax  — 5 words, collect a star per first-try answer
 *  - Speedy — 30 seconds, how many can you finish?
 */
import { Trans, useTranslation } from 'react-i18next';
import { gameTx } from '@/games/gameI18n';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, Star, Timer, Coffee, RotateCcw } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { buildFinishRounds, displayGrapheme, speakWord, type FinishRound } from '@/lib/soundGameWords';
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

export default function FinishWordGame({ level, onClose }: Props) {
  const { t, i18n } = useTranslation('games');
  const tx = gameTx(i18n);
  const enTag = { en: <bdi dir="ltr" lang="en" /> };
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;
  const bank = useGameBank(level);

  const [phase, setPhase] = useState<Phase>('intro');
  const [mode, setMode] = useState<Mode>('relax');
  const [rounds, setRounds] = useState<FinishRound[]>([]);
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
    setRounds(buildFinishRounds(level, m === 'relax' ? RELAX_ROUNDS : 60, bank));
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

  // Say the word as each round appears — the child needs to HEAR what
  // they're completing.
  useEffect(() => {
    if (phase === 'play' && round) speakWord(round.word);
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

  // End-of-game fanfare
  useEffect(() => {
    if (phase === 'done') sfx.fanfare();
  }, [phase]);

  const starsEarned = stars.filter(Boolean).length;
  const wordSizeClass = round && round.word.length > 8 ? 'text-4xl lg:text-6xl' : 'text-6xl lg:text-7xl';

  return (
    <div dir="ltr" lang="en" className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/finish_workshop.webp" />
      {/* soft level wash */}
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: hex }} />

      <div className="relative max-w-md lg:max-w-2xl mx-auto px-5 pt-5 pb-10 min-h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            Finish the word
          </span>
          <button
            onClick={onClose}
            aria-label={t('play.closeGame')}
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
            <span className="text-6xl lg:text-7xl" aria-hidden>🧩</span>
            <h1 {...tx} className="font-display text-4xl lg:text-5xl font-extrabold text-foreground mt-4 text-balance">
              Finish the word
            </h1>
            <p {...tx} className="font-child text-xl lg:text-2xl text-foreground/70 mt-3 max-w-sm leading-relaxed">
              {t('finish.intro')}
            </p>

            <div className="mt-9 w-full max-w-sm space-y-3.5">
              <button
                onClick={() => start('relax')}
                className="w-full min-h-16 py-2 px-4 leading-tight rounded-2xl font-display text-xl font-extrabold text-white flex items-center justify-center gap-3 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
              >
                <Coffee className="w-6 h-6 shrink-0" /> <span {...tx}>{t('ui.relaxMode')}</span>
              </button>
              <button
                onClick={() => start('speedy')}
                className="w-full min-h-16 py-2 px-4 leading-tight rounded-2xl font-display text-xl font-extrabold flex items-center justify-center gap-3 bg-white transition-all active:translate-y-[3px]"
                style={{ color: ink, boxShadow: `0 4px 0 ${hex}40, ${STICKER}`, border: `2px solid ${hex}50` }}
              >
                <Timer className="w-6 h-6 shrink-0" /> <span {...tx}>{t('ui.speedyMode', { seconds: SPEEDY_SECONDS })}</span>
              </button>
            </div>
            <p {...tx} className="text-xs font-bold text-muted-foreground mt-6">
              <Trans t={t} i18nKey="ui.soundsFromLevel" values={{ level: level.level, name: level.name }} components={enTag} />
            </p>
          </motion.div>
        )}

        {/* ── Play ── */}
        {phase === 'play' && round && (
          <div className="flex-1 flex flex-col justify-center pt-6">
            {/* Progress: stars (relax) or score + timer bar (speedy) */}
            {mode === 'relax' ? (
              <div className="flex items-center justify-center gap-2" aria-label={t('ui.wordProgress', { n: roundIdx + 1, total: RELAX_ROUNDS })}>
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
                  <span className="tabular-nums flex items-center gap-1"><Timer className="w-4 h-4" />{t('ui.seconds', { n: timeLeft })}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                    style={{ width: `${(timeLeft / SPEEDY_SECONDS) * 100}%`, background: hex }}
                  />
                </div>
              </div>
            )}

            {/* The word with a gap */}
            <div className="flex flex-col items-center text-center py-10 lg:py-12">
              <p {...tx} className="font-child text-lg lg:text-xl text-foreground/55">{t('finish.whichSound')}</p>
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
                    className={`font-child font-bold px-7 py-4 rounded-3xl bg-white inline-flex items-baseline ${wordSizeClass}`}
                    style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)', color: 'hsl(var(--foreground))' }}
                  >
                    {round.before}
                    {solved ? (
                      <motion.span
                        {...(reduceMotion ? {} : { initial: { scale: 0.4, opacity: 0 }, animate: { scale: 1, opacity: 1 } })}
                        style={{ color: hex }}
                      >
                        {displayGrapheme(round.target)}
                      </motion.span>
                    ) : (
                      <span
                        aria-label={t('finish.missingSound')}
                        className="inline-block align-baseline mx-0.5 rounded-xl"
                        style={{
                          width: `${Math.max(1, displayGrapheme(round.target).length) * 0.7}em`,
                          height: '0.9em',
                          border: `3px dashed ${hex}70`,
                          background: `${hex}0D`,
                        }}
                      />
                    )}
                    {round.after}
                  </span>
                  <button
                    onClick={() => speakWord(round.word)}
                    aria-label={t('play.hearWord')}
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
                  {firstTry ? `${round.word}! ⭐` : `${round.word}! 👏`}
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
                    aria-label={t('ui.soundAria', { sound: displayGrapheme(g) })}
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
                <h2 {...tx} className="font-display text-3xl font-extrabold text-foreground mt-6">
                  {starsEarned === RELAX_ROUNDS ? t('ui.allFiveStars') : starsEarned >= 3 ? t('ui.greatWork') : t('ui.goodTry')}
                </h2>
                <p {...tx} className="font-child text-lg text-foreground/70 mt-2">
                  {t('finish.firstTry', { count: starsEarned })}
                </p>
              </>
            ) : (
              <>
                <span className="font-display text-7xl font-extrabold" style={{ color: ink }}>{score}</span>
                <h2 {...tx} className="font-display text-2xl font-extrabold text-foreground mt-3">
                  {t('ui.wordsInSeconds', { count: score, seconds: SPEEDY_SECONDS })}
                </h2>
              </>
            )}

            <div className="mt-9 w-full max-w-xs space-y-3">
              <button
                onClick={() => start(mode)}
                className="w-full min-h-14 py-2 px-4 leading-tight rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2.5 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}
              >
                <RotateCcw className="w-5 h-5 shrink-0" /> <span {...tx}>{t('ui.playAgain')}</span>
              </button>
              <button
                onClick={onClose}
                className="w-full min-h-12 py-2 px-4 leading-tight rounded-2xl font-display text-base font-extrabold bg-white text-foreground/70 press-scale"
                style={{ boxShadow: STICKER }}
              >
                <span {...tx}>{t('ui.allDone')}</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
