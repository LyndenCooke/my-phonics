/**
 * Soundlings — flagship phonics game (Phase 1: playable core).
 *
 * Every grapheme is a creature. Finding its sound inside real words feeds
 * it; fed enough it hatches, grows, turns golden. The collection persists
 * (soundlingStore) so it is always waiting for the child — that ownership
 * is the return loop the old SoundGame never had.
 *
 * Design brief: docs/SOUNDLINGS_DESIGN_BRIEF.md. Pedagogy is unchanged
 * from SoundGame: grapheme-in-word recognition, no penalties, the only
 * formal gate in the app stays the Level Check.
 *
 * Views: habitat (home) → play (5-encounter visit) → book (album).
 * Feeding Frenzy (30s) unlocks after 3 hatches.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, Volume2, BookOpen, Timer, Play, RotateCcw } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { JOURNEY_LEVELS } from '@/lib/levels8';
import { WORD_BANK, displayGrapheme, soundInWord, speakWord, type GameRound } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
import { sfx } from '@/games/audio';
import Scene from '@/games/Scene';
import SoundlingSprite from './SoundlingSprite';
import { soundlingName } from './soundlingNames';
import {
  feedSoundling, getAllSoundlings, glowingEggOfDay, hatchedCount, isAsleep,
  stageOf, GOLDEN_FEEDS, GROWN_FEEDS, HATCH_FEEDS, GLOW_HATCH_FEEDS,
  type SoundlingState, type Stage,
} from './soundlingStore';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

type View = 'habitat' | 'play' | 'book' | 'frenzy' | 'frenzyDone';

const VISIT_ROUNDS = 5;
const FRENZY_SECONDS = 30;
const FRENZY_UNLOCK_HATCHES = 3;
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** One encounter aimed at a specific Soundling. Same distractor rules as
 *  lib/soundGameWords.buildRounds: same-level first, never a grapheme that
 *  also appears in the word. `bank` is the ledger-backed grapheme → words
 *  map from lib/greenWords.useGameBank (curated fallback until it loads). */
function buildTargetRound(level: JourneyLevel, target: string, bank: Record<string, string[]>): GameRound | null {
  const words = bank[target];
  if (!words?.length) return null;
  const word = words[Math.floor(Math.random() * words.length)];
  const ok = (g: string) => g !== target && !word.includes(displayGrapheme(g)) && !soundInWord(g, word);
  const pool = level.gpcs.filter(g => bank[g]?.length);
  const sameLevel = shuffle(pool.filter(ok));
  const padding = shuffle(Object.keys(bank).filter(g => ok(g) && !sameLevel.includes(g)));
  const distractors = [...sameLevel, ...padding].slice(0, 2);
  return { word, target, options: shuffle([target, ...distractors]) };
}

/** Feed progress toward the NEXT stage, 0..1, for the habitat meters. */
function meterOf(state: SoundlingState, stage: Stage, glowing: boolean): number {
  const hatchAt = glowing ? GLOW_HATCH_FEEDS : HATCH_FEEDS;
  if (stage === 'egg') return Math.min(1, state.feeds / hatchAt);
  if (stage === 'hatched') return Math.min(1, (state.feeds - hatchAt) / (GROWN_FEEDS - hatchAt));
  if (stage === 'grown') return Math.min(1, (state.feeds - GROWN_FEEDS) / (GOLDEN_FEEDS - GROWN_FEEDS));
  return 1;
}

interface Celebration { grapheme: string; stage: Stage }

export default function Soundlings({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;

  const bank = useGameBank(level);
  const pool = useMemo(() => level.gpcs.filter(g => bank[g]?.length), [level, bank]);
  const [collection, setCollection] = useState(() => getAllSoundlings());
  const glowing = useMemo(() => glowingEggOfDay(pool), [pool]);

  const [view, setView] = useState<View>('habitat');
  const [targets, setTargets] = useState<string[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [round, setRound] = useState<GameRound | null>(null);
  const [solved, setSolved] = useState(false);
  const [firstTry, setFirstTry] = useState(true);
  const [wrongTile, setWrongTile] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [fedThisVisit, setFedThisVisit] = useState(0);

  // Frenzy
  const [frenzyRounds, setFrenzyRounds] = useState<GameRound[]>([]);
  const [frenzyIdx, setFrenzyIdx] = useState(0);
  const [frenzyScore, setFrenzyScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(FRENZY_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = () => setCollection(getAllSoundlings());
  const stateOf = (g: string): SoundlingState =>
    collection[g] ?? { feeds: 0, lastFedDate: '', hatchedDate: '' };

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  // ── Visit session ──────────────────────────────────────────────
  const startVisit = (startWith?: string) => {
    const byHunger = [...pool].sort((a, b) => stateOf(a).feeds - stateOf(b).feeds);
    const rest = byHunger.filter(g => g !== startWith);
    const list = (startWith ? [startWith, ...rest] : rest).slice(0, VISIT_ROUNDS);
    setTargets(list);
    setRoundIdx(0);
    setRound(buildTargetRound(level, list[0], bank));
    setSolved(false);
    setFirstTry(true);
    setWrongTile(null);
    setFedThisVisit(0);
    setView('play');
  };

  const advanceVisit = () => {
    if (celebration) return; // wait for the celebration to be dismissed
    const next = roundIdx + 1;
    if (next >= targets.length) {
      refresh();
      setView('habitat');
      return;
    }
    setRoundIdx(next);
    setRound(buildTargetRound(level, targets[next], bank));
    setSolved(false);
    setFirstTry(true);
    setWrongTile(null);
  };

  const pick = (g: string) => {
    if (solved || !round) return;
    if (g === round.target) {
      setSolved(true);
      setWrongTile(null);
      const res = feedSoundling(round.target, firstTry, round.target === glowing);
      setFedThisVisit(n => n + 1);
      refresh();
      if (res.after !== res.before) {
        // Stage-up! The chord belongs to the celebration card, not the tap.
        sfx.pop();
        setTimeout(() => { setCelebration({ grapheme: round.target, stage: res.after }); sfx.fanfare(); }, 750);
      } else {
        if (firstTry) sfx.star(); else sfx.pop();
        setTimeout(advanceVisitRef.current, 1100);
      }
    } else {
      sfx.bonk();
      setFirstTry(false);
      setWrongTile(g);
      setTimeout(() => setWrongTile(null), 500);
    }
  };
  // pick() closes over stale advanceVisit (targets/roundIdx) — keep a ref fresh.
  const advanceVisitRef = useRef(advanceVisit);
  advanceVisitRef.current = advanceVisit;

  const dismissCelebration = () => {
    setCelebration(null);
    if (view === 'play') setTimeout(advanceVisitRef.current, 150);
  };

  // ── Feeding Frenzy ─────────────────────────────────────────────
  const startFrenzy = () => {
    const rs: GameRound[] = [];
    for (const g of shuffle([...pool, ...pool, ...pool, ...pool, ...pool, ...pool])) {
      const r = buildTargetRound(level, g, bank);
      if (r) rs.push(r);
    }
    setFrenzyRounds(rs);
    setFrenzyIdx(0);
    setFrenzyScore(0);
    setSolved(false);
    setFirstTry(true);
    setWrongTile(null);
    setTimeLeft(FRENZY_SECONDS);
    setView('frenzy');
  };

  useEffect(() => {
    if (view !== 'frenzy') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          refresh();
          setView('frenzyDone');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const frenzyPick = (g: string) => {
    const r = frenzyRounds[frenzyIdx];
    if (!r || solved) return;
    if (g === r.target) {
      setSolved(true);
      sfx.pop();
      if (firstTry) {
        setFrenzyScore(s => s + 1);
        feedSoundling(r.target, true, r.target === glowing);
      }
      setTimeout(() => {
        setFrenzyIdx(i => i + 1);
        setSolved(false);
        setFirstTry(true);
        setWrongTile(null);
      }, 350);
    } else {
      sfx.bonk();
      setFirstTry(false);
      setWrongTile(g);
      setTimeout(() => setWrongTile(null), 400);
    }
  };

  // Frenzy-over fanfare
  useEffect(() => {
    if (view === 'frenzyDone') sfx.fanfare();
  }, [view]);

  // Speak each new word (visit + frenzy)
  const playRound = view === 'play' ? round : view === 'frenzy' ? frenzyRounds[frenzyIdx] : null;
  const spokenFor = useRef<string | null>(null);
  useEffect(() => {
    if (!playRound) return;
    const key = `${view}-${view === 'play' ? roundIdx : frenzyIdx}-${playRound.word}`;
    if (spokenFor.current === key) return;
    spokenFor.current = key;
    const t = setTimeout(() => speakWord(playRound.word), 350);
    return () => clearTimeout(t);
  }, [playRound, view, roundIdx, frenzyIdx]);

  const hatched = hatchedCount();
  const frenzyLocked = hatched < FRENZY_UNLOCK_HATCHES;

  const stone = (g: string, onPick: (g: string) => void, isTarget: boolean) => (
    <motion.button
      key={g}
      onClick={() => onPick(g)}
      aria-label={`Sound ${displayGrapheme(g)}`}
      animate={wrongTile === g && !reduceMotion ? { x: [0, -8, 8, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className="h-24 lg:h-32 rounded-2xl font-child font-bold text-4xl lg:text-6xl bg-white transition-colors press-scale"
      style={solved && isTarget
        ? { background: hex, color: '#fff', boxShadow: `0 4px 0 ${ink}, ${STICKER}` }
        : wrongTile === g
          ? { color: 'hsl(var(--muted-foreground))', boxShadow: STICKER, border: '2px solid hsl(var(--border))' }
          : { color: ink, boxShadow: `0 4px 0 rgba(40,30,40,0.08), ${STICKER}`, border: '1px solid rgba(40,30,40,0.05)' }}
    >
      {displayGrapheme(g)}
    </motion.button>
  );

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      {/* Light wash in the habitat: the Soundlings LIVE in this scene, so
          the barn stays vivid; play views get the readable default. */}
      <Scene img="/images/games/soundlings_barn.webp" wash={view === 'habitat' ? 'light' : 'default'} />
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full blur-3xl opacity-[0.14]" style={{ background: hex }} />

      <div className="relative max-w-md lg:max-w-5xl mx-auto px-5 pt-5 pb-10 min-h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white px-3.5 py-1.5 text-[11px] lg:text-sm font-extrabold -rotate-1"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}>
            {view === 'book' ? 'The Sound Book' : `${level.name} Grove`}
          </span>
          <div className="flex items-center gap-2">
            {view === 'habitat' && (
              <button onClick={() => setView('book')} aria-label="Open the Sound Book"
                className="h-10 px-4 rounded-full bg-white flex items-center gap-2 press-scale font-extrabold text-sm"
                style={{ boxShadow: STICKER, color: ink }}>
                <BookOpen className="w-4 h-4" /> Sound Book
              </button>
            )}
            <button
              onClick={() => (view === 'habitat' ? onClose() : (refresh(), setView('habitat')))}
              aria-label={view === 'habitat' ? 'Close game' : 'Back to the grove'}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
              style={{ boxShadow: STICKER }}>
              <X className="w-[18px] h-[18px] text-foreground/60" />
            </button>
          </div>
        </div>

        {/* ── Habitat — the barn floor. No cards: every Soundling sits IN
             the scene, in its own straw nest on the straw band of the
             backdrop. Eggs are barn-cream with hay speckles; feeding
             progress shows as cracks spreading across the shell (the crack
             IS the meter), and a nearly-hatched egg wobbles. ── */}
        {view === 'habitat' && (
          <motion.div {...(reduceMotion ? {} : { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } })}
            className="flex-1 flex flex-col pt-4">
            <p className="font-child text-lg lg:text-2xl text-foreground/80 text-center"
              style={{ textShadow: '0 1px 8px rgba(255,250,235,0.9)' }}>
              Your Soundlings are waiting in the barn! Tap one to feed it.
            </p>

            <div className="mt-auto flex flex-wrap justify-center items-end gap-x-1.5 gap-y-4 lg:gap-x-3 pt-8 pb-3">
              {pool.map((g, i) => {
                const st = stateOf(g);
                const stage = stageOf(st, g === glowing);
                const asleep = isAsleep(st);
                const isGlow = g === glowing && stage === 'egg';
                const meter = meterOf(st, stage, g === glowing);
                const nearHatch = stage === 'egg' && meter >= 0.85;
                return (
                  <motion.button key={g} onClick={() => startVisit(g)}
                    aria-label={stage === 'egg' ? `Egg — the ${displayGrapheme(g)} sound` : `${soundlingName(g)} — the ${displayGrapheme(g)} sound`}
                    className="relative w-[4.4rem] lg:w-24 flex flex-col items-center press-scale"
                    style={{ marginTop: i % 2 === 0 ? 0 : 10 }}
                    animate={!reduceMotion
                      ? nearHatch
                        ? { rotate: [0, -3, 3, -3, 0] }
                        : isGlow ? { scale: [1, 1.05, 1] } : {}
                      : {}}
                    transition={nearHatch
                      ? { repeat: Infinity, duration: 0.7, repeatDelay: 2.2 }
                      : isGlow ? { repeat: Infinity, duration: 1.6 } : {}}>
                    {isGlow && <span className="absolute -top-2 right-0 text-lg z-10" aria-hidden>✨</span>}
                    {/* straw nest — the Soundling sits in it, not on a card */}
                    <svg viewBox="0 0 100 34" aria-hidden
                      className="absolute bottom-3 lg:bottom-4 left-1/2 -translate-x-1/2 w-[115%]">
                      <ellipse cx="50" cy="22" rx="46" ry="11" fill="#D9A852" />
                      <ellipse cx="50" cy="19" rx="39" ry="9" fill="#EFCB7B" />
                      <ellipse cx="50" cy="20" rx="27" ry="6.5" fill="#B9853C" />
                      <path d="M8 20 q10 -8 20 -5 M88 22 q-8 -9 -19 -6 M18 28 q12 4 24 2 M60 29 q12 2 22 -3"
                        stroke="#A97B33" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity="0.8" />
                    </svg>
                    <SoundlingSprite grapheme={g} level={level.level} stage={stage} hex={hex} inkHex={ink}
                      asleep={asleep} inScene crack={stage === 'egg' ? meter : 0}
                      className="relative w-full aspect-square drop-shadow-[0_4px_6px_rgba(80,50,15,0.25)]" />
                    {/* name on a little wooden tag */}
                    <span className="relative -mt-1 rounded-md px-1.5 py-0.5 font-display text-[10px] lg:text-xs font-extrabold text-[#FFF6E3]"
                      style={{ background: '#8A5A2B', boxShadow: '0 2px 0 #6B4523' }}>
                      {stage === 'egg' ? (isGlow ? 'Hatch me!' : nearHatch ? 'Nearly!' : '?') : soundlingName(g)}
                    </span>
                    {/* hatched creatures keep a tiny feed meter, straw-styled */}
                    {stage !== 'egg' && (
                      <div className="relative mt-1 h-1.5 w-3/4 rounded-full bg-[#6B4523]/30 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${meter * 100}%`, background: stage === 'golden' ? '#F6C453' : '#EFCB7B' }} />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            <div className="mt-7 mx-auto w-full max-w-sm space-y-3.5 pb-4">
              <button onClick={() => startVisit()}
                className="w-full h-16 rounded-2xl font-display text-xl font-extrabold text-white flex items-center justify-center gap-3 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}>
                <Play className="w-6 h-6" /> PLAY
              </button>
              <button onClick={() => !frenzyLocked && startFrenzy()} aria-disabled={frenzyLocked}
                className="w-full h-14 rounded-2xl font-display text-lg font-extrabold flex items-center justify-center gap-2.5 bg-white transition-all active:translate-y-[3px]"
                style={frenzyLocked
                  ? { color: 'hsl(var(--muted-foreground))', boxShadow: STICKER, border: '2px dashed hsl(var(--border))' }
                  : { color: ink, boxShadow: `0 4px 0 ${hex}40, ${STICKER}`, border: `2px solid ${hex}50` }}>
                <Timer className="w-5 h-5" />
                {frenzyLocked ? `Feeding Frenzy — hatch ${FRENZY_UNLOCK_HATCHES - hatched} more to unlock` : 'Feeding Frenzy — 30 seconds!'}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Visit encounter ── */}
        {view === 'play' && round && (
          <div className="flex-1 flex flex-col justify-center pt-4">
            {/* visit progress + the hungry Soundling */}
            <div className="flex items-center justify-center gap-1.5" aria-label={`Word ${roundIdx + 1} of ${targets.length}`}>
              {targets.map((_, i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full"
                  style={{ background: i < roundIdx ? hex : i === roundIdx ? ink : 'hsl(var(--border))' }} />
              ))}
            </div>

            <div className="flex flex-col items-center text-center py-6 lg:py-8">
              <div className="w-28 h-28 lg:w-40 lg:h-40">
                <motion.div key={`${roundIdx}-sprite`}
                  {...(reduceMotion ? {} : { animate: solved ? { y: [0, -10, 0], scale: [1, 1.06, 1] } : { y: [0, -3, 0] }, transition: solved ? { duration: 0.5 } : { repeat: Infinity, duration: 2 } })}
                  className="w-full h-full">
                  <SoundlingSprite grapheme={round.target} level={level.level}
                    stage={stageOf(stateOf(round.target), round.target === glowing)} hex={hex} inkHex={ink} className="w-full h-full" />
                </motion.div>
              </div>
              <p className="font-child text-lg lg:text-2xl text-foreground/55 mt-2">
                {solved ? (firstTry ? `${stageOf(stateOf(round.target)) === 'egg' ? 'The egg' : soundlingName(round.target)} loved that! ⭐` : 'You found it! 👏')
                  : 'Tap the sound hiding in…'}
              </p>
              <AnimatePresence mode="wait">
                <motion.div key={`${roundIdx}-${round.word}`}
                  {...(reduceMotion ? {} : { initial: { opacity: 0, y: 14, scale: 0.96 }, animate: { opacity: 1, y: 0, scale: 1 }, exit: { opacity: 0, y: -10, scale: 0.97 }, transition: { duration: 0.25 } })}
                  className="mt-3 flex items-center gap-3">
                  <span className={`font-child font-bold px-7 py-4 rounded-3xl bg-white inline-block ${round.word.length > 8 ? 'text-4xl lg:text-6xl' : 'text-6xl lg:text-8xl'}`}
                    style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)', color: 'hsl(var(--foreground))' }}>
                    {solved
                      ? (() => {
                          const g = displayGrapheme(round.target);
                          const at = round.word.indexOf(g);
                          return at < 0 ? round.word : (
                            <>
                              {round.word.slice(0, at)}
                              <span style={{ color: hex }}>{g}</span>
                              {round.word.slice(at + g.length)}
                            </>
                          );
                        })()
                      : round.word}
                  </span>
                  <button onClick={() => speakWord(round.word)} aria-label="Hear the word"
                    className="w-14 h-14 lg:w-16 lg:h-16 rounded-full bg-white flex items-center justify-center press-scale shrink-0"
                    style={{ boxShadow: STICKER, color: ink }}>
                    <Volume2 className="w-6 h-6" />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:gap-5 pb-4 lg:max-w-3xl lg:mx-auto lg:w-full">
              {round.options.map(g => stone(g, pick, g === round.target))}
            </div>
          </div>
        )}

        {/* ── Feeding Frenzy ── */}
        {view === 'frenzy' && frenzyRounds[frenzyIdx] && (
          <div className="flex-1 flex flex-col justify-center pt-6">
            <div>
              <div className="flex items-center justify-between text-sm font-extrabold" style={{ color: ink }}>
                <span className="font-display text-xl tabular-nums">{frenzyScore} 🫐</span>
                <span className="tabular-nums flex items-center gap-1"><Timer className="w-4 h-4" />{timeLeft}s</span>
              </div>
              <div className="mt-2 h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-[width] duration-1000 ease-linear"
                  style={{ width: `${(timeLeft / FRENZY_SECONDS) * 100}%`, background: hex }} />
              </div>
            </div>

            <div className="flex flex-col items-center text-center py-8 lg:py-10">
              <p className="font-child text-lg lg:text-xl text-foreground/55">Feed them fast! Tap the sound in…</p>
              <div className="mt-3 flex items-center gap-3">
                <span className={`font-child font-bold px-7 py-4 rounded-3xl bg-white inline-block ${frenzyRounds[frenzyIdx].word.length > 8 ? 'text-4xl lg:text-6xl' : 'text-6xl lg:text-7xl'}`}
                  style={{ boxShadow: STICKER, color: 'hsl(var(--foreground))' }}>
                  {frenzyRounds[frenzyIdx].word}
                </span>
                <button onClick={() => speakWord(frenzyRounds[frenzyIdx].word)} aria-label="Hear the word"
                  className="w-14 h-14 rounded-full bg-white flex items-center justify-center press-scale shrink-0"
                  style={{ boxShadow: STICKER, color: ink }}>
                  <Volume2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:gap-5 pb-4 lg:max-w-3xl lg:mx-auto lg:w-full">
              {frenzyRounds[frenzyIdx].options.map(g => stone(g, frenzyPick, g === frenzyRounds[frenzyIdx].target))}
            </div>
          </div>
        )}

        {/* ── Frenzy done ── */}
        {view === 'frenzyDone' && (
          <motion.div {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
            className="flex-1 flex flex-col items-center justify-center text-center py-10">
            <span className="font-display text-7xl font-extrabold" style={{ color: ink }}>{frenzyScore}</span>
            <h2 className="font-display text-2xl font-extrabold text-foreground mt-3">
              Soundling{frenzyScore === 1 ? '' : 's'} fed in 30 seconds!
            </h2>
            <div className="mt-9 w-full max-w-xs space-y-3">
              <button onClick={startFrenzy}
                className="w-full h-14 rounded-2xl font-display text-lg font-extrabold text-white flex items-center justify-center gap-2.5 transition-all active:translate-y-[4px]"
                style={{ background: hex, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${hex}80` }}>
                <RotateCcw className="w-5 h-5" /> Again!
              </button>
              <button onClick={() => { refresh(); setView('habitat'); }}
                className="w-full h-12 rounded-2xl font-display text-base font-extrabold bg-white text-foreground/70 press-scale"
                style={{ boxShadow: STICKER }}>
                Back to the grove
              </button>
            </div>
          </motion.div>
        )}

        {/* ── The Sound Book ── */}
        {view === 'book' && (
          <div className="flex-1 pt-6 pb-8">
            {JOURNEY_LEVELS.map(l => {
              const gpcs = l.gpcs.filter(g => WORD_BANK[g]?.length);
              const own = l.level === level.level;
              const done = gpcs.every(g => stageOf(stateOf(g)) !== 'egg');
              return (
                <section key={l.level} className={`mt-5 first:mt-0 ${own ? '' : 'opacity-70'}`}>
                  <h3 className="font-display text-base lg:text-lg font-extrabold flex items-center gap-2" style={{ color: l.inkHex }}>
                    Level {l.level} — {l.name} {done && <span aria-label="Page complete">🌟</span>}
                  </h3>
                  <div className="mt-2.5 grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-8 gap-2 lg:gap-3">
                    {gpcs.map(g => {
                      const st = stateOf(g);
                      const stage = stageOf(st);
                      return (
                        <div key={g} className="rounded-2xl bg-white p-1.5 flex flex-col items-center"
                          style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}>
                          <SoundlingSprite grapheme={g} level={l.level} stage={stage} hex={l.hex} inkHex={l.inkHex} className="w-full aspect-square" />
                          <span className="text-[10px] lg:text-xs font-extrabold" style={{ color: l.inkHex }}>
                            {stage === 'egg' ? "Who's inside?" : soundlingName(g)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ── Celebration overlay (hatch / grow / golden) ── */}
        <AnimatePresence>
          {celebration && (
            <motion.div className="fixed inset-0 z-[80] flex items-center justify-center px-6"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ background: 'rgba(40,30,40,0.45)' }}
              onClick={dismissCelebration}>
              <motion.div
                {...(reduceMotion ? {} : { initial: { scale: 0.7, y: 24 }, animate: { scale: 1, y: 0 }, transition: { type: 'spring', stiffness: 260, damping: 18 } })}
                className="bg-white rounded-3xl px-8 py-9 max-w-sm w-full text-center"
                style={{ boxShadow: STICKER }}>
                <div className="w-40 h-40 mx-auto">
                  <SoundlingSprite grapheme={celebration.grapheme} level={level.level} stage={celebration.stage} hex={hex} inkHex={ink} className="w-full h-full" />
                </div>
                <h2 className="font-display text-2xl font-extrabold mt-4" style={{ color: ink }}>
                  {celebration.stage === 'hatched' && `Your ${displayGrapheme(celebration.grapheme)} Soundling hatched!`}
                  {celebration.stage === 'grown' && `${soundlingName(celebration.grapheme)} grew up!`}
                  {celebration.stage === 'golden' && `${soundlingName(celebration.grapheme)} turned GOLDEN!`}
                </h2>
                {celebration.stage === 'hatched' && (
                  <p className="font-child text-xl text-foreground/70 mt-2">
                    Say hello to <span className="font-bold" style={{ color: ink }}>{soundlingName(celebration.grapheme)}</span>!
                  </p>
                )}
                <button onClick={dismissCelebration}
                  className="mt-6 w-full h-14 rounded-2xl font-display text-lg font-extrabold text-white transition-all active:translate-y-[3px]"
                  style={{ background: hex, boxShadow: `0 5px 0 ${ink}` }}>
                  Hooray!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
