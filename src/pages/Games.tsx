/**
 * Games — the public phonics arcade at /games.
 *
 * No sign-in: anyone picks a journey level (1–8) and plays. Every game is
 * fully client-side and level-parameterised. The arcade doubles as a
 * taster for the books, with a soft "not sure which level?" pointer into
 * the free assessment funnel.
 *
 * ONE GO PER GAME PER DAY — SIGNED-IN USERS ONLY (localStorage, resets at
 * local midnight): short bursts of practice beat long dopamine sessions,
 * and tomorrow's arcade is fresh. A play is spent at launch, so quitting
 * early doesn't refund it. Anonymous visitors are never limited: a
 * classroom device with children taking turns must not lock after the
 * first child's go.
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
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
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
const GAMES: { id: GameId; emoji: string; name: string; vibe: string }[] = [
  { id: 'soundlings', emoji: '🥚', name: 'Soundlings', vibe: 'collect' },
  { id: 'pop', emoji: '🫧', name: 'Word Pop', vibe: 'arcade' },
  { id: 'cannon', emoji: '🎯', name: "Milo's Cannon", vibe: 'arcade' },
  { id: 'run', emoji: '🚪', name: 'Door Dash', vibe: 'runner' },
  { id: 'pairs', emoji: '🃏', name: 'Sound Pairs', vibe: 'memory' },
  { id: 'finish', emoji: '🧩', name: 'Finish the Word', vibe: 'puzzle' },
  { id: 'spot', emoji: '🔍', name: 'Sound Spotter', vibe: 'seekFind' },
  { id: 'tricky', emoji: '👂', name: 'Hear It, Find It', vibe: 'listening' },
];
// Game NAMES stay English (brand); blurbs + vibe tags are translated
// from games:arcade.blurbs.<id> / games:arcade.vibes.<vibe>.

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
  const { t, i18n } = useTranslation('games');
  const reduceMotion = useReducedMotion();
  const [levelNum, setLevelNum] = useState<number>(savedLevel);
  const [activeGame, setActiveGame] = useState<GameId | null>(null);
  const [played, setPlayed] = useState<Set<GameId>>(loadPlayed);
  const { user } = useAuth();
  // The daily limit only binds signed-in (home) users. Anonymous devices
  // — e.g. a classroom where children take turns — play freely.
  const limited = Boolean(user);

  /** Launch marks the game as today's play immediately — quitting early
   *  doesn't earn a replay, which is the whole point of the daily limit. */
  const launchGame = (id: GameId) => {
    if (!limited) { setActiveGame(id); return; }
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
            {t('arcade.badge')}
          </span>
          <h1 className="font-display text-3xl lg:text-[2.6rem] font-extrabold text-foreground tracking-tight mt-3 leading-tight">
            {t('arcade.title')} <span aria-hidden>🎮</span>
          </h1>
          <p className="font-child text-lg lg:text-xl text-foreground/60 mt-2 max-w-md mx-auto">
            {t('arcade.intro')}
          </p>
        </motion.div>

        {/* ── Level picker — fridge magnets ── */}
        <motion.section {...fade(0.08)} className="mt-8" aria-label={t('arcade.chooseLevel')}>
          <div className="grid grid-cols-4 gap-2.5 lg:gap-3">
            {JOURNEY_LEVELS.map((l, i) => {
              const selected = l.level === levelNum;
              return (
                <button
                  key={l.level}
                  onClick={() => chooseLevel(l.level)}
                  aria-pressed={selected}
                  aria-label={t('arcade.levelAria', { level: l.level, name: l.name })}
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
                    lang="en"
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
          {/* LTR island: the sound chips read left-to-right even in Arabic/Urdu/Persian. */}
          <div dir="ltr" lang="en" className="mt-4 flex flex-wrap justify-center gap-1.5" role="group" aria-label={t('arcade.levelSounds', { level: level.level })}>
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
              <span dir="auto" lang={i18n.language} className="text-xs font-bold text-muted-foreground self-center">{t('arcade.more', { n: level.gpcs.length - 10 })}</span>
            )}
          </div>
        </motion.section>

        {/* ── The arcade ── */}
        <motion.section {...fade(0.14)} className="mt-9 lg:mt-12" aria-label={t('arcade.gamesAria')}>
          {limited && (
            <p className="font-child text-sm text-foreground/50 text-center mb-4">
              {t('arcade.dailyNote')}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 lg:gap-4">
            {GAMES.map(({ id, emoji, name, vibe }, i) => {
              const done = limited && played.has(id);
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
                  className="absolute top-3 end-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold"
                  style={done ? { background: 'rgba(40,30,40,0.08)', color: 'rgba(40,30,40,0.55)' } : { background: `${hex}18`, color: ink }}
                >
                  {done ? t('arcade.played') : t(`arcade.vibes.${vibe}`)}
                </span>
                <span className="text-5xl" aria-hidden style={done ? { filter: 'grayscale(0.6)' } : undefined}>{emoji}</span>
                <span lang="en" dir="ltr" className="font-display text-xl font-extrabold mt-2.5 leading-tight" style={{ color: done ? 'rgba(40,30,40,0.5)' : ink }}>
                  {name}
                </span>
                <span className="font-child text-sm lg:text-base text-foreground/60 mt-1 leading-snug min-h-[2.5rem]">
                  {done ? t('arcade.doneBlurb') : t(`arcade.blurbs.${id}`)}
                </span>
                <span
                  className="mt-3 inline-flex items-center justify-center rounded-full px-6 py-1.5 font-display text-sm font-extrabold"
                  style={done
                    ? { background: 'rgba(40,30,40,0.08)', color: 'rgba(40,30,40,0.5)' }
                    : { background: hex, boxShadow: `0 3px 0 ${ink}`, color: '#fff' }}
                >
                  {done ? t('arcade.backTomorrow') : t('arcade.play')}
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
            <p className="font-display text-lg font-extrabold text-foreground mt-2">{t('arcade.notSure')}</p>
            <p className="font-child text-sm text-foreground/60 mt-1">
              {t('arcade.notSureBody')}
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
