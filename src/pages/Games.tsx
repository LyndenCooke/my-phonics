/**
 * Games — the public phonics arcade at /games.
 *
 * No sign-in: anyone picks a journey level (1–8) and plays. Every game is
 * fully client-side and level-parameterised. The arcade doubles as a
 * taster for the books, with a soft "not sure which level?" pointer into
 * the free assessment funnel.
 *
 * ONE GO PER GAME PER DAY (localStorage, resets at local midnight): short
 * bursts of practice beat long dopamine sessions, and tomorrow's arcade
 * is fresh. A play is spent at launch, so quitting early doesn't refund it.
 *
 * Same "paper & stickers" design language as the child home screen:
 * level chips are fridge magnets in the ledger colours, game cards are
 * tilted stickers with one big Play button each.
 *
 * The chosen level persists in localStorage so a returning child lands
 * straight back on their level.
 */
import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ClipboardList } from 'lucide-react';
import Layout from '@/components/Layout';
import { JOURNEY_LEVELS, getJourneyLevel } from '@/lib/levels8';
import { loadLedger } from '@/lib/greenWords';
import BarnGame from '@/games/soundlings/BarnGame';
import SafariGame from '@/games/soundSafari/SafariGame';
import FinishWordGame from '@/components/FinishWordGame';
import TrickyWordGame from '@/components/TrickyWordGame';
import WordCannonGame from '@/components/WordCannonGame';
import WordPopGame from '@/games/wordPop/WordPopGame';
import SoundPairs from '@/games/soundPairs/SoundPairs';
import PunctuationRun from '@/games/punctuationRun/PunctuationRun';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
const EASE: [number, number, number, number] = [0.21, 0.65, 0.36, 1];
const LEVEL_KEY = 'mpb_games_level';
const PLAYED_KEY = 'mpb_games_played_v1';

type GameId = 'soundlings' | 'pop' | 'cannon' | 'run' | 'pairs' | 'finish' | 'spot' | 'tricky';

/** Arcade order: flagship first, then arcade energy, then the calmer
 *  skill games. `vibe` is the little caption under the name. */
const GAMES: { id: GameId; emoji: string; name: string; blurb: string; vibe: string }[] = [
  { id: 'soundlings', emoji: '🥚', name: 'Soundlings', blurb: 'Hatch and feed your own sound creatures', vibe: 'Collect' },
  { id: 'pop', emoji: '🫧', name: 'Word Pop', blurb: 'Fly Buzz the bee to pop the word you hear', vibe: 'Arcade' },
  { id: 'cannon', emoji: '🎯', name: "Milo's Cannon", blurb: 'Aim and fire the right sound into the word', vibe: 'Arcade' },
  { id: 'run', emoji: '🚪', name: 'Door Dash', blurb: 'Read the doors and run through the right one', vibe: 'Runner' },
  { id: 'pairs', emoji: '🃏', name: 'Sound Pairs', blurb: 'Flip the cards and match sounds to words', vibe: 'Memory' },
  { id: 'finish', emoji: '🧩', name: 'Finish the Word', blurb: 'A sound is missing — tap the right one', vibe: 'Puzzle' },
  { id: 'spot', emoji: '🔍', name: 'Sound Spotter', blurb: 'Hunt the scene for things hiding the sound', vibe: 'Seek & find' },
  { id: 'tricky', emoji: '👂', name: 'Hear It, Find It', blurb: 'Listen and catch the tricky word', vibe: 'Listening' },
];

/** The games draw themselves `fixed inset-0`, but the page-transition
 *  wrapper's transform creates a containing block, so "fixed" resolves
 *  against the page instead of the viewport (same trap as the bottom
 *  nav — see Layout.tsx). Portal them onto document.body, which is also
 *  why WordCannonGame portals itself. */
function GamePortal({ children }: { children: ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

/** Local calendar date — the once-a-day clock resets at the child's own
 *  midnight, not UTC. */
function todayStr(): string {
  return new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
}

/** Which games have been played today. One play per game per day: screen
 *  time stays a handful of short bursts, and tomorrow is a fresh arcade. */
function loadPlayed(): Set<GameId> {
  try {
    const raw = JSON.parse(localStorage.getItem(PLAYED_KEY) || 'null') as { date?: string; played?: GameId[] } | null;
    if (raw?.date === todayStr() && Array.isArray(raw.played)) return new Set(raw.played);
  } catch { /* private mode / bad data */ }
  return new Set();
}

function savePlayed(played: Set<GameId>): void {
  try {
    localStorage.setItem(PLAYED_KEY, JSON.stringify({ date: todayStr(), played: [...played] }));
  } catch { /* private mode */ }
}

function savedLevel(): number {
  try {
    const n = Number(localStorage.getItem(LEVEL_KEY));
    return n >= 1 && n <= JOURNEY_LEVELS.length ? n : 1;
  } catch {
    return 1;
  }
}

export default function Games() {
  const reduceMotion = useReducedMotion();
  const [levelNum, setLevelNum] = useState<number>(savedLevel);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [played, setPlayed] = useState<Set<GameId>>(loadPlayed);

  /** Launch marks the game as today's play immediately — quitting early
   *  doesn't earn a replay, which is the whole point of the daily limit. */
  const launchGame = (id: GameId) => {
    const current = loadPlayed(); // re-read in case midnight passed while the page sat open
    if (current.has(id)) { setPlayed(current); return; }
    current.add(id);
    savePlayed(current);
    setPlayed(current);
    setActiveGame(id);
  };

  // Warm the green-words ledger so every game opens with the full
  // curriculum bank instead of the curated fallback.
  useEffect(() => { loadLedger(); }, []);

  const level = getJourneyLevel(levelNum) ?? JOURNEY_LEVELS[0];
  const hex = level.hex;
  const ink = level.inkHex;

  const chooseLevel = (n: number) => {
    setLevelNum(n);
    try { localStorage.setItem(LEVEL_KEY, String(n)); } catch { /* private mode */ }
  };

  const fade = (delay: number) => reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, delay, ease: EASE },
      };

  return (
    <Layout>
      <div className="px-5 pt-6 lg:pt-12 pb-14 max-w-md lg:max-w-3xl mx-auto overflow-x-clip">
        {/* ── Header ── */}
        <motion.div {...fade(0)} className="text-center">
          <span
            className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-2"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            Free to play · no sign-up
          </span>
          <h1 className="font-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground tracking-tight mt-3 leading-tight">
            Phonics games <span aria-hidden>🎮</span>
          </h1>
          <p className="font-child text-lg lg:text-xl text-foreground/60 mt-2 max-w-md mx-auto">
            Pick your level, then pick a game. Every game uses the sounds from that level.
          </p>
        </motion.div>

        {/* ── Level picker — fridge magnets ── */}
        <motion.section {...fade(0.08)} className="mt-8" aria-label="Choose your level">
          <div className="grid grid-cols-4 gap-2.5 lg:gap-3">
            {JOURNEY_LEVELS.map((l, i) => {
              const selected = l.level === levelNum;
              return (
                <button
                  key={l.level}
                  onClick={() => chooseLevel(l.level)}
                  aria-pressed={selected}
                  aria-label={`Level ${l.level} — ${l.name}`}
                  className="rounded-2xl px-1 py-3 lg:py-3.5 flex flex-col items-center transition-all active:translate-y-[3px]"
                  style={selected
                    ? { background: l.hex, boxShadow: `0 4px 0 ${l.inkHex}, ${STICKER}`, border: '2px solid #fff' }
                    : { background: '#fff', boxShadow: `0 3px 0 ${l.hex}30, ${STICKER}`, border: `2px solid ${l.hex}35`, rotate: `${[-1, 0.8, -0.6, 1][i % 4]}deg` }}
                >
                  <span
                    className="font-display text-2xl lg:text-3xl font-extrabold leading-none"
                    style={{ color: selected ? '#fff' : l.inkHex }}
                  >
                    {l.level}
                  </span>
                  <span
                    className="text-[9px] lg:text-[10px] font-extrabold mt-1 leading-tight text-center"
                    style={{ color: selected ? '#ffffffd9' : 'hsl(var(--muted-foreground))' }}
                  >
                    {l.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* This level's sounds, as a quiet strip of magnets */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5" aria-label={`Level ${level.level} sounds`}>
            {level.gpcs.slice(0, 10).map((g, i) => (
              <span
                key={g}
                className="font-child font-bold text-sm lg:text-base px-2.5 py-1 rounded-xl bg-white inline-block"
                style={{
                  color: ink,
                  boxShadow: '0 2px 0 rgba(40,30,40,0.06), 0 6px 12px rgba(40,30,40,0.06)',
                  border: '1px solid rgba(40,30,40,0.06)',
                  rotate: `${[-2, 1.5, -1, 2, -1.5, 1][i % 6]}deg`,
                }}
              >
                {g.replace(/^-/, '')}
              </span>
            ))}
            {level.gpcs.length > 10 && (
              <span className="text-xs font-bold text-muted-foreground self-center">+{level.gpcs.length - 10} more</span>
            )}
          </div>
        </motion.section>

        {/* ── The arcade ── */}
        <motion.section {...fade(0.14)} className="mt-9 lg:mt-12" aria-label="Games">
          <p className="font-child text-sm text-foreground/50 text-center mb-4">
            One go at each game per day — little and often is how reading sticks.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
            {GAMES.map(({ id, emoji, name, blurb, vibe }, i) => {
              const done = played.has(id);
              return (
              <button
                key={id}
                onClick={() => launchGame(id)}
                disabled={done}
                aria-disabled={done}
                className="relative rounded-3xl bg-white px-4 pt-6 pb-5 flex flex-col items-center text-center transition-all active:translate-y-[4px]"
                style={{
                  boxShadow: done ? STICKER : `0 5px 0 ${hex}40, ${STICKER}`,
                  border: done ? '2px solid rgba(40,30,40,0.10)' : `2px solid ${hex}40`,
                  rotate: `${[-1, 0.8, -0.8, 1, -0.6, 0.7, -1][i % 7]}deg`,
                  opacity: done ? 0.72 : 1,
                }}
              >
                <span
                  className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  style={done ? { background: 'rgba(40,30,40,0.08)', color: 'rgba(40,30,40,0.55)' } : { background: `${hex}18`, color: ink }}
                >
                  {done ? 'Played ✓' : vibe}
                </span>
                <span className="text-5xl" aria-hidden style={done ? { filter: 'grayscale(0.6)' } : undefined}>{emoji}</span>
                <span className="font-display text-xl font-extrabold mt-2.5 leading-tight" style={{ color: done ? 'rgba(40,30,40,0.5)' : ink }}>
                  {name}
                </span>
                <span className="font-child text-sm lg:text-base text-foreground/60 mt-1 leading-snug min-h-[2.5rem]">
                  {done ? 'Great playing! Come back tomorrow for another go.' : blurb}
                </span>
                <span
                  className="mt-3 inline-flex items-center justify-center rounded-full px-6 py-1.5 font-display text-sm font-extrabold"
                  style={done
                    ? { background: 'rgba(40,30,40,0.08)', color: 'rgba(40,30,40,0.5)' }
                    : { background: hex, boxShadow: `0 3px 0 ${ink}`, color: '#fff' }}
                >
                  {done ? 'Back tomorrow' : 'Play'}
                </span>
              </button>
              );
            })}
          </div>
        </motion.section>

        {/* ── Which level? — soft assessment pointer ── */}
        <motion.section {...fade(0.2)} className="mt-10">
          <Link
            to="/assessment"
            className="block rounded-3xl bg-white px-5 py-5 text-center press-scale"
            style={{ boxShadow: STICKER, border: '2px dashed hsl(var(--border))' }}
          >
            <ClipboardList className="w-6 h-6 mx-auto" style={{ color: ink }} />
            <p className="font-display text-lg font-extrabold text-foreground mt-2">Not sure which level?</p>
            <p className="font-child text-sm text-foreground/60 mt-1">
              Take the free 3-minute check and we'll place your child on the right one.
            </p>
          </Link>
        </motion.section>
      </div>

      {/* ── Fullscreen game overlays (portalled — see GamePortal) ── */}
      {activeGame && (
        <GamePortal>
          {activeGame === 'soundlings' && <BarnGame level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'pop' && <WordPopGame level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'cannon' && <WordCannonGame level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'run' && <PunctuationRun level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'pairs' && <SoundPairs level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'finish' && <FinishWordGame level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'spot' && <SafariGame level={level} onClose={() => setActiveGame(null)} />}
          {activeGame === 'tricky' && <TrickyWordGame level={level} onClose={() => setActiveGame(null)} />}
        </GamePortal>
      )}
    </Layout>
  );
}
