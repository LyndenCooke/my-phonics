/**
 * SoundPairs — "Sound Pairs" flip-card memory match.
 *
 * Twelve cards, six pairs: each pair is a SOUND card (the grapheme, in
 * the level colour) and a WORD card containing that spelling. Flip two;
 * a match locks both face-up, speaks the word and stamps a star. Finish
 * the board to see a star rating based on how few flips it took.
 *
 * Pedagogy: grapheme–word mapping with a working-memory workout — the
 * child must hold WHERE the "sh" card was while hunting for "ship".
 * The calm one on the arcade: no timer, no failure state.
 *
 * Fully client-side, level-parameterised, no auth — safe on the public
 * /games arcade.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Star, RotateCcw } from 'lucide-react';
import type { JourneyLevel } from '@/lib/levels8';
import { displayGrapheme, playPhoneme, speakWord } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
import { sfx } from '@/games/audio';
import Scene from '@/games/Scene';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

const PAIR_COUNT = 6;
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

interface Card {
  id: number;
  /** Pair key — the grapheme string from the level's gpcs. */
  pair: string;
  /** What's printed on the face: the grapheme or the word. */
  face: string;
  kind: 'sound' | 'word';
}

type CardState = 'down' | 'up' | 'matched';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a fresh 12-card board from the level's sounds. Split digraphs
 *  (a-e) are skipped — their grapheme card wouldn't visually appear in
 *  the word, which breaks the matching logic a child relies on. */
function buildBoard(level: JourneyLevel, bank: Record<string, string[]>): Card[] {
  const usable = level.gpcs.filter(g => {
    if (g.includes('-') && !g.startsWith('-')) return false;
    const shown = displayGrapheme(g);
    return (bank[g] ?? []).some(w => w.includes(shown));
  });
  const picked = shuffle(usable).slice(0, PAIR_COUNT);
  let id = 0;
  const cards = picked.flatMap<Card>(g => {
    const shown = displayGrapheme(g);
    const words = (bank[g] ?? []).filter(w => w.includes(shown));
    const word = words[Math.floor(Math.random() * words.length)];
    return [
      { id: ++id, pair: g, face: shown, kind: 'sound' },
      { id: ++id, pair: g, face: word, kind: 'word' },
    ];
  });
  return shuffle(cards);
}

export default function SoundPairs({ level, onClose }: Props) {
  const reduceMotion = useReducedMotion();
  const hex = level.hex;
  const ink = level.inkHex;

  const bank = useGameBank(level);
  // Board builds once from whatever bank is available at mount (curated
  // fallback at worst) — rebuilding mid-game when the ledger lands would
  // reshuffle cards under the child. Restart uses the upgraded bank.
  const [board, setBoard] = useState<Card[]>(() => buildBoard(level, bank));
  const [states, setStates] = useState<Record<number, CardState>>({});
  const [flips, setFlips] = useState(0);
  const [justMatched, setJustMatched] = useState<string | null>(null);
  const lockRef = useRef(false);

  const pairTotal = board.length / 2;
  const matchedCount = useMemo(
    () => Object.values(states).filter(s => s === 'matched').length / 2,
    [states],
  );
  const done = pairTotal > 0 && matchedCount === pairTotal;

  // Star rating: perfect play is `pairTotal` flips of two. Three stars up
  // to ~1.5x that, two up to ~2.5x, one beyond — always at least one.
  const starCount = done
    ? flips <= pairTotal * 1.5 ? 3 : flips <= pairTotal * 2.5 ? 2 : 1
    : 0;

  const restart = () => {
    setBoard(buildBoard(level, bank));
    setStates({});
    setFlips(0);
    setJustMatched(null);
    lockRef.current = false;
  };

  useEffect(() => () => {
    try { window.speechSynthesis?.cancel(); } catch { /* unsupported */ }
  }, []);

  // Board-complete fanfare
  useEffect(() => {
    if (done) sfx.fanfare();
  }, [done]);

  const flip = (card: Card) => {
    if (lockRef.current) return;
    const st = states[card.id] ?? 'down';
    if (st !== 'down') return;

    const upCards = board.filter(c => (states[c.id] ?? 'down') === 'up');
    if (upCards.length >= 2) return;

    sfx.tick();
    // Every flip SPEAKS: a sound card says its phoneme, a word card says
    // its word (George) — the ear does the matching, not just the eye.
    if (card.kind === 'sound') playPhoneme(card.pair); else speakWord(card.face);
    setStates(s => ({ ...s, [card.id]: 'up' }));

    if (upCards.length === 1) {
      const other = upCards[0];
      setFlips(n => n + 1);
      if (other.pair === card.pair) {
        // Match! Speak the word half of the pair.
        const word = card.kind === 'word' ? card.face : other.face;
        setStates(s => ({ ...s, [card.id]: 'matched', [other.id]: 'matched' }));
        setJustMatched(card.pair);
        sfx.star();
        speakWord(word);
        setTimeout(() => setJustMatched(null), 900);
      } else {
        sfx.bonk();
        lockRef.current = true;
        setTimeout(() => {
          setStates(s => ({ ...s, [card.id]: 'down', [other.id]: 'down' }));
          lockRef.current = false;
        }, 900);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" style={{ background: 'hsl(var(--background))' }}>
      <Scene img="/images/games/pairs_table.webp" />
      <div aria-hidden className="pointer-events-none fixed -top-24 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] rounded-full blur-3xl opacity-[0.12]" style={{ background: hex }} />

      <div className="relative max-w-md lg:max-w-xl mx-auto px-5 pt-5 pb-10 min-h-full flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <span
            className="rounded-full bg-white px-3.5 py-1.5 text-[11px] font-extrabold -rotate-1"
            style={{ color: ink, boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${hex}30` }}
          >
            Sound Pairs
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

        {!done ? (
          <>
            <div className="text-center mt-5">
              <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground">
                Match the sound to its word <span aria-hidden>🃏</span>
              </h1>
              <p className="font-child text-base lg:text-lg text-foreground/60 mt-1.5">
                {matchedCount} of {pairTotal} pairs found
              </p>
            </div>

            {/* The board */}
            <div className="grid grid-cols-3 gap-3 lg:gap-4 mt-6 pb-6" style={{ perspective: 900 }}>
              {board.map(card => {
                const st = states[card.id] ?? 'down';
                const faceUp = st !== 'down';
                const isMatched = st === 'matched';
                const celebrating = isMatched && justMatched === card.pair;
                return (
                  <motion.button
                    key={card.id}
                    onClick={() => flip(card)}
                    aria-label={faceUp ? `Card showing ${card.face}` : 'Face-down card'}
                    className="relative aspect-[3/4] rounded-2xl"
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={reduceMotion
                      ? {}
                      : celebrating
                        ? { rotateY: 180, scale: [1, 1.12, 1] }
                        : { rotateY: faceUp ? 180 : 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.21, 0.65, 0.36, 1] }}
                  >
                    {/* Back */}
                    <span
                      className="absolute inset-0 rounded-2xl flex items-center justify-center text-3xl"
                      style={{
                        backfaceVisibility: 'hidden',
                        background: hex,
                        boxShadow: `0 4px 0 ${ink}, ${STICKER}`,
                        // With reduced motion there's no 3D flip — hide via opacity.
                        opacity: reduceMotion && faceUp ? 0 : 1,
                      }}
                      aria-hidden
                    >
                      <span className="opacity-90">❓</span>
                    </span>
                    {/* Face */}
                    <span
                      className="absolute inset-0 rounded-2xl flex items-center justify-center px-1 font-child font-bold bg-white"
                      style={{
                        backfaceVisibility: 'hidden',
                        transform: reduceMotion ? undefined : 'rotateY(180deg)',
                        opacity: reduceMotion && !faceUp ? 0 : 1,
                        fontSize: card.face.length > 6 ? '1.05rem' : card.kind === 'sound' ? '1.9rem' : '1.35rem',
                        color: card.kind === 'sound' ? '#fff' : ink,
                        background: card.kind === 'sound' ? ink : '#fff',
                        boxShadow: isMatched
                          ? `0 0 0 3px ${hex}, ${STICKER}`
                          : `0 4px 0 rgba(40,30,40,0.08), ${STICKER}`,
                        border: card.kind === 'sound' ? 'none' : '1px solid rgba(40,30,40,0.06)',
                      }}
                    >
                      {card.face}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </>
        ) : (
          /* ── Done ── */
          <motion.div
            {...(reduceMotion ? {} : { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 } })}
            className="flex-1 flex flex-col items-center justify-center text-center py-10"
          >
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <motion.span
                  key={i}
                  {...(reduceMotion ? {} : {
                    initial: { scale: 0, rotate: -40 },
                    animate: { scale: 1, rotate: [-8, 5, -4][i] },
                    transition: { delay: 0.15 + i * 0.12, type: 'spring', stiffness: 300, damping: 14 },
                  })}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white"
                  style={{ boxShadow: STICKER }}
                >
                  <Star
                    className="w-9 h-9"
                    style={i < starCount ? { color: hex, fill: hex } : { color: 'hsl(var(--border))', fill: 'transparent' }}
                    strokeWidth={i < starCount ? 0 : 2}
                  />
                </motion.span>
              ))}
            </div>
            <h2 className="font-display text-3xl font-extrabold text-foreground mt-6">
              {starCount === 3 ? 'Amazing memory!' : starCount === 2 ? 'Great matching!' : 'All pairs found!'}
            </h2>
            <p className="font-child text-lg text-foreground/70 mt-2">
              You found all {pairTotal} pairs in {flips} goes.
            </p>
            <div className="mt-9 w-full max-w-xs space-y-3">
              <button
                onClick={restart}
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
