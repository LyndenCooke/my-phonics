import { useState, useCallback, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Volume2, Sparkles, Star, Trash2, Check, RotateCcw, Eye, EyeOff } from 'lucide-react';
import { Book } from '@/lib/types';
import { useUpdateReadingProgress } from '@/hooks/useBooks';
import {
  INTERACTIVE_BOOKS,
  type InteractivePage, type StoryWord, type SpotlightItem,
  type OrderingItem, type QuizQuestion, type SpellingWord,
  type GrammarWordOrderItem,
} from '@/lib/interactiveBookData';
import TappableWord from '@/components/interactive/TappableWord';
import { awardStamp, getStamps, isReadyToMoveUp, MAX_STAMPS, needsCheckIn, type BookStamps } from '@/lib/stamps';

// ─── Audio helpers ──────────────────────────────────────────────────────────

function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Not found: ${url}`));
    audio.oncanplaythrough = () => { audio.play().catch(reject); };
    audio.load();
  });
}

async function playPhoneme(g: string): Promise<void> {
  try { await playAudioFile(`/sounds/${g.toLowerCase().replace(/-/g, '_')}.mp3`); }
  catch { /* no fallback */ }
}

async function playWordFile(word: string): Promise<void> {
  // Plays the pre-recorded ElevenLabs (George) MP3 for the whole word.
  // Silent-on-miss; never falls back to browser TTS.
  const key = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!key) return;
  try { await playAudioFile(`/sounds/words/${key}.mp3`); }
  catch { /* no fallback */ }
}

/** Play a phoneme sequence supplied directly (e.g. from StoryWord.phonemes).
 *  Use this in preference to splitDigraphs when the data already specifies the
 *  correct breakdown — it's the source of truth and never disagrees with the
 *  visual annotations. */
async function playPhonemeSequence(phonemes: string[]): Promise<void> {
  for (const g of phonemes) {
    await playPhoneme(g);
    await new Promise(r => setTimeout(r, 150));
  }
}

async function playWordAsPhonemes(word: string): Promise<void> {
  // Fallback path for callers that only have a word string (e.g. sound_spotlight
  // SpotlightItem doesn't carry phonemes). Prefer playPhonemeSequence whenever
  // the data already has phonemes available.
  const graphemes = splitDigraphs(word);
  for (const g of graphemes) {
    await playPhoneme(g);
    await new Promise(r => setTimeout(r, 150));
  }
}

const ANDIKA: React.CSSProperties = { fontFamily: "'Andika', sans-serif" };

/** Split a word into graphemes using longest-match-first (covers all L1–L6 graphemes) */
function splitDigraphs(word: string): string[] {
  const graphemes = [
    'cious', 'tious',                                          // 5-letter (L6)
    'tion', 'ture', 'able', 'ible', 'ous',                    // 4-letter (L5–L6)
    'igh', 'air', 'ear', 'oor', 'ore', 'ure', 'ire', 'are', 'our',  // 3-letter (L2–L5)
    'ay', 'ee', 'oo', 'ar', 'or', 'ir', 'ou', 'oy',          // 2-letter vowels (L2–L4)
    'oa', 'oi', 'aw', 'ai', 'ea', 'ie', 'ue', 'ew',
    'ow', 'ey', 'oe', 'au',
    'sh', 'ch', 'th', 'ng', 'nk', 'ck', 'ff', 'll', 'ss', 'zz', 'qu', 'tch',  // L1 consonants
    'ph', 'kn', 'wr', 'wh',                                   // L5+ consonants
    'dd', 'gg', 'mm', 'nn', 'pp', 'rr', 'tt', 'bb',           // doubled consonants — one phoneme
    'ed', 'sion',                                             // past-tense suffix + tion variant
  ];
  const result: string[] = [];
  let i = 0;
  const lower = word.toLowerCase();
  while (i < lower.length) {
    let matched = false;
    for (const g of graphemes) {
      if (lower.startsWith(g, i)) {
        result.push(word.slice(i, i + g.length));
        i += g.length;
        matched = true;
        break;
      }
    }
    if (!matched) { result.push(word[i]); i += 1; }
  }
  return result;
}

/**
 * Work out which grapheme chunks in a word should be pink for a given
 * focus sound. Computes from the sound itself instead of a stored
 * focusIndex — that index was letter-based but we render by grapheme
 * chunks, so it was off whenever the word contained any digraph before
 * the focus letter. Caused 42 wrong-letter highlights across L2–L6.
 */
function computeSpotlightFocus(word: string, sound: string): Set<number> {
  const chunks = splitDigraphs(word);
  const result = new Set<number>();

  // Split digraph (a-e, i-e, o-e, u-e, e-e): the vowel anywhere in the
  // word, plus a trailing 'e'.
  if (sound.includes('-')) {
    const vowel = sound[0].toLowerCase();
    for (let i = 0; i < chunks.length; i++) {
      if (chunks[i].toLowerCase() === vowel) {
        result.add(i);
        break;
      }
    }
    const last = chunks.length - 1;
    if (chunks[last].toLowerCase() === 'e') result.add(last);
    return result;
  }

  // Regular sound: find its first occurrence in the word, then mark
  // every chunk whose character range overlaps with it.
  const soundLower = sound.toLowerCase();
  const wordLower = word.toLowerCase();
  const soundStart = wordLower.indexOf(soundLower);
  if (soundStart < 0) return result;
  const soundEnd = soundStart + soundLower.length;

  let chunkStart = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunkEnd = chunkStart + chunks[i].length;
    if (chunkStart < soundEnd && chunkEnd > soundStart) {
      result.add(i);
    }
    chunkStart = chunkEnd;
  }
  return result;
}

// ─── Level theming — shared by every activity page ─────────────────────────
// Each level gets a palette bundle: hero button gradient, card accents,
// solid CTA bg, text colours. Keeping class names literal so Tailwind's
// JIT picks them up during build.

interface LevelTheme {
  heroBgIdle: string;           // gradient bg for hero button at rest
  heroBgActive: string;         // gradient bg when playing
  heroText: string;             // hero text at rest
  cardBorderActive: string;     // card border when selected/playing
  cardBgActive: string;         // card bg gradient when selected/playing
  cardHoverBorder: string;      // card hover border
  textAccent: string;           // focus-letter / title accent
  textAccentMuted: string;      // caption accent
  solidBg: string;              // solid CTA background
  solidBgHover: string;         // solid CTA hover
  softGradient: string;         // decorative background panels
  focusRing: string;            // focus-visible ring colour
}

const LEVEL_THEME: Record<number, LevelTheme> = {
  1: { heroBgIdle: 'from-pink-100 to-pink-200', heroBgActive: 'from-pink-500 to-pink-600', heroText: 'text-pink-700', cardBorderActive: 'border-pink-400', cardBgActive: 'from-pink-50 to-pink-100', cardHoverBorder: 'hover:border-pink-300', textAccent: 'text-pink-600', textAccentMuted: 'text-pink-500', solidBg: 'bg-pink-500', solidBgHover: 'hover:bg-pink-600', softGradient: 'from-pink-50 to-pink-100', focusRing: 'focus-visible:ring-pink-400' },
  2: { heroBgIdle: 'from-amber-100 to-amber-200', heroBgActive: 'from-amber-500 to-amber-600', heroText: 'text-amber-700', cardBorderActive: 'border-amber-400', cardBgActive: 'from-amber-50 to-amber-100', cardHoverBorder: 'hover:border-amber-300', textAccent: 'text-amber-600', textAccentMuted: 'text-amber-500', solidBg: 'bg-amber-500', solidBgHover: 'hover:bg-amber-600', softGradient: 'from-amber-50 to-amber-100', focusRing: 'focus-visible:ring-amber-400' },
  3: { heroBgIdle: 'from-green-100 to-green-200', heroBgActive: 'from-green-500 to-green-600', heroText: 'text-green-700', cardBorderActive: 'border-green-400', cardBgActive: 'from-green-50 to-green-100', cardHoverBorder: 'hover:border-green-300', textAccent: 'text-green-600', textAccentMuted: 'text-green-500', solidBg: 'bg-green-500', solidBgHover: 'hover:bg-green-600', softGradient: 'from-green-50 to-green-100', focusRing: 'focus-visible:ring-green-400' },
  4: { heroBgIdle: 'from-blue-100 to-blue-200', heroBgActive: 'from-blue-500 to-blue-600', heroText: 'text-blue-700', cardBorderActive: 'border-blue-400', cardBgActive: 'from-blue-50 to-blue-100', cardHoverBorder: 'hover:border-blue-300', textAccent: 'text-blue-600', textAccentMuted: 'text-blue-500', solidBg: 'bg-blue-500', solidBgHover: 'hover:bg-blue-600', softGradient: 'from-blue-50 to-blue-100', focusRing: 'focus-visible:ring-blue-400' },
  5: { heroBgIdle: 'from-purple-100 to-purple-200', heroBgActive: 'from-purple-500 to-purple-600', heroText: 'text-purple-700', cardBorderActive: 'border-purple-400', cardBgActive: 'from-purple-50 to-purple-100', cardHoverBorder: 'hover:border-purple-300', textAccent: 'text-purple-600', textAccentMuted: 'text-purple-500', solidBg: 'bg-purple-500', solidBgHover: 'hover:bg-purple-600', softGradient: 'from-purple-50 to-purple-100', focusRing: 'focus-visible:ring-purple-400' },
  6: { heroBgIdle: 'from-teal-100 to-teal-200', heroBgActive: 'from-teal-500 to-teal-600', heroText: 'text-teal-700', cardBorderActive: 'border-teal-400', cardBgActive: 'from-teal-50 to-teal-100', cardHoverBorder: 'hover:border-teal-300', textAccent: 'text-teal-600', textAccentMuted: 'text-teal-500', solidBg: 'bg-teal-500', solidBgHover: 'hover:bg-teal-600', softGradient: 'from-teal-50 to-teal-100', focusRing: 'focus-visible:ring-teal-400' },
};

const getTheme = (level: number): LevelTheme => LEVEL_THEME[level] ?? LEVEL_THEME[1];

// ─── Cover — Pattern C: dramatic hero illustration ──────────────────────────
// Illustration takes ~45% of vertical real estate; title typography scales
// big on whiteboard viewports. Swipe hint nudges upward to avoid competing
// with the title.

function CoverPage({ page, level }: { page: Extract<InteractivePage, { type: 'cover' }>; level: number }) {
  const theme = getTheme(level);
  // Cover fits the entire viewport — header (~48px) + cover content + bottom-nav
  // (~52px). Image consumes most of the available height but is constrained by
  // h-0 + flex-1 + min-h-0 so the title and swipe-hint always remain visible at
  // 720p and below. aspect-square keeps the cover artwork from distorting on
  // wide screens.
  return (
    <div className="flex flex-col items-center justify-between h-full px-6 md:px-10 lg:px-16 text-center py-4 md:py-6">
      <div className="flex-1 min-h-0 flex items-center justify-center w-full">
        <div className="aspect-square h-full max-h-full max-w-full rounded-3xl overflow-hidden shadow-2xl ring-4 ring-white/70">
          <img src={page.imageUrl} alt={page.title} className="w-full h-full object-cover" draggable={false} />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1 md:gap-2 mt-3 md:mt-4 shrink-0">
        <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-slate-800 leading-tight max-w-4xl">{page.title}</h1>
        <p className={`text-sm md:text-base lg:text-lg font-semibold ${theme.textAccentMuted} uppercase tracking-wider`}>{page.subtitle}</p>
        <p className={`text-sm md:text-base font-bold ${theme.textAccent} animate-bounce mt-1`}>Swipe to start &rarr;</p>
      </div>
    </div>
  );
}

// ─── Sound Grid ─────────────────────────────────────────────────────────────

// Each grapheme group ('s/ss', 'a-e', 'tion') is canonically introduced at one
// level. This map drives the accordion grouping on SoundGridPage so reviewing
// children can collapse / expand whole sets at a time. Single-letter L1
// graphemes are listed under their own row so e.g. 's' and 'ss' aren't separated.
const GRAPHEME_LEVEL: Record<string, number> = {
  // L1 — Set 1 single letters + L1 digraphs
  's/ss': 1, 's': 1, 'ss': 1, 'a': 1, 't': 1, 'p': 1, 'i': 1, 'n': 1,
  'm': 1, 'd': 1, 'g': 1, 'o': 1, 'c/k/ck': 1, 'c': 1, 'k': 1, 'ck': 1,
  'e': 1, 'u': 1, 'r': 1, 'h': 1, 'b': 1, 'f/ff': 1, 'f': 1, 'ff': 1,
  'l/ll': 1, 'l': 1, 'll': 1, 'j': 1, 'v': 1, 'w': 1, 'x': 1, 'y': 1,
  'z/zz': 1, 'z': 1, 'zz': 1, 'qu': 1, 'ch': 1, 'sh': 1, 'th': 1, 'ng': 1, 'nk': 1,
  // L2 — Longer Sounds
  'ay': 2, 'ee': 2, 'igh': 2, 'ow': 2, 'oo': 2, 'ar': 2, 'or': 2,
  'air': 2, 'ir': 2, 'ou': 2, 'oy': 2,
  // L3 — New Spellings
  'a-e': 3, 'i-e': 3, 'o-e': 3, 'u-e': 3, 'ea': 3, 'ie': 3,
  'oi': 3, 'aw': 3, 'ai': 3, 'oa': 3,
  // L4 — Building Fluency
  'ur': 4, 'er': 4, 'are': 4, 'ew': 4, 'ue': 4,
  // L5 — Reading Together
  'ore': 5, 'ire': 5, 'oor': 5, 'ear': 5, 'ure': 5, 'tion': 5,
  // L6 — Reading Champion
  'ous': 6, 'able': 6, 'ible': 6, 'cious': 6, 'tious': 6,
};

const LEVEL_LABEL: Record<number, string> = {
  1: 'Level 1 — Starting Stories',
  2: 'Level 2 — Longer Sounds',
  3: 'Level 3 — New Spellings',
  4: 'Level 4 — Building Fluency',
  5: 'Level 5 — Reading Together',
  6: 'Level 6 — Reading Champion',
};

// Sound → clipart card map. The clipart pack lives in /public/clipart/level_N/cards/
// with filenames `<sound>_<cueword>.png`. Cards visually match the printed
// MyPhonicsBooks sound mats (letter on the left, hand-drawn cue picture on
// the right). Sounds not in this map fall back to a plain text button.
//
// Doubled-consonant graphemes (ss, ll, ff, zz) and 'ck' don't have their
// own card — they share the parent letter's card via the slash-grouping
// (e.g. 's/ss' uses s_sun.png, 'c/k/ck' uses c_cat.png).
const SOUND_CARD: Record<string, string> = {
  // L1 single letters
  'a': '/clipart/level_1/cards/a_apple.png',
  'b': '/clipart/level_1/cards/b_ball.png',
  'c': '/clipart/level_1/cards/c_cat.png',
  'd': '/clipart/level_1/cards/d_dog.png',
  'e': '/clipart/level_1/cards/e_egg.png',
  'f': '/clipart/level_1/cards/f_fish.png',
  'g': '/clipart/level_1/cards/g_goat.png',
  'h': '/clipart/level_1/cards/h_hat.png',
  'i': '/clipart/level_1/cards/i_ink.png',
  'j': '/clipart/level_1/cards/j_jam.png',
  'k': '/clipart/level_1/cards/k_kite.png',
  'l': '/clipart/level_1/cards/l_leaf.png',
  'm': '/clipart/level_1/cards/m_mud.png',
  'n': '/clipart/level_1/cards/n_nest.png',
  'o': '/clipart/level_1/cards/o_orange.png',
  'p': '/clipart/level_1/cards/p_pan.png',
  'qu': '/clipart/level_1/cards/qu_queen.png',
  'r': '/clipart/level_1/cards/r_rabbit.png',
  's': '/clipart/level_1/cards/s_sun.png',
  't': '/clipart/level_1/cards/t_tap.png',
  'u': '/clipart/level_1/cards/u_umbrella.png',
  'v': '/clipart/level_1/cards/v_van.png',
  'w': '/clipart/level_1/cards/w_web.png',
  'x': '/clipart/level_1/cards/x_box.png',
  'y': '/clipart/level_1/cards/y_yak.png',
  'z': '/clipart/level_1/cards/z_zip.png',
  // L1 digraphs
  'ch': '/clipart/level_1/cards/ch_chip.png',
  'sh': '/clipart/level_1/cards/sh_ship.png',
  'th': '/clipart/level_1/cards/th_thumb.png',
  'ng': '/clipart/level_1/cards/ng_ring.png',
  'nk': '/clipart/level_1/cards/nk_tank.png',
  // L2
  'air': '/clipart/level_2/cards/air_fair.png',
  'ar': '/clipart/level_2/cards/ar_car.png',
  'ay': '/clipart/level_2/cards/ay_day.png',
  'ee': '/clipart/level_2/cards/ee_bee.png',
  'igh': '/clipart/level_2/cards/igh_night.png',
  'ir': '/clipart/level_2/cards/ir_bird.png',
  'oo': '/clipart/level_2/cards/oo_zoo.png',
  'or': '/clipart/level_2/cards/or_fork.png',
  'ou': '/clipart/level_2/cards/ou_loud.png',
  'ow': '/clipart/level_2/cards/ow_bow.png',
  'oy': '/clipart/level_2/cards/oy_toy.png',
  // L3 — split digraphs use underscore filenames
  'a-e': '/clipart/level_3/cards/a_e_gate.png',
  'i-e': '/clipart/level_3/cards/i_e_bike.png',
  'o-e': '/clipart/level_3/cards/o_e_stone.png',
  'u-e': '/clipart/level_3/cards/u_e_flute.png',
  'ai': '/clipart/level_3/cards/ai_sail.png',
  'aw': '/clipart/level_3/cards/aw_claw.png',
  'ea': '/clipart/level_3/cards/ea_leaf.png',
  'ie': '/clipart/level_3/cards/ie_tie.png',
  'oa': '/clipart/level_3/cards/oa_boat.png',
  'oi': '/clipart/level_3/cards/oi_coin.png',
  // L4
  'are': '/clipart/level_4/cards/are_hare.png',
  'er': '/clipart/level_4/cards/er_fern.png',
  'ew': '/clipart/level_4/cards/ew_new.png',
  'ue': '/clipart/level_4/cards/ue_glue.png',
  'ur': '/clipart/level_4/cards/ur_purse.png',
  // L5
  'ear': '/clipart/level_5/cards/ear_ear.png',
  'ire': '/clipart/level_5/cards/ire_fire.png',
  'oor': '/clipart/level_5/cards/oor_door.png',
  'ore': '/clipart/level_5/cards/ore_shore.png',
  'tion': '/clipart/level_5/cards/tion_station.png',
  'ure': '/clipart/level_5/cards/ure_picture.png',
  'kn': '/clipart/level_5/cards/kn_knee.png',
  'ph': '/clipart/level_5/cards/ph_phone.png',
  'wr': '/clipart/level_5/cards/wr_wrist.png',
  // L6 suffixes
  'able': '/clipart/level_6/cards/able_table.png',
  'cious': '/clipart/level_6/cards/cious_delicious.png',
  'ible': '/clipart/level_6/cards/ible_incredible.png',
  'ous': '/clipart/level_6/cards/ous_enormous.png',
  'tious': '/clipart/level_6/cards/tious_nutritious.png',
};

/** Resolve a grapheme group like 's/ss' or 'c/k/ck' to its clipart card path.
 *  Tries each alternative in the slash group, falling back to undefined if
 *  none match (caller should render plain text). */
function getSoundCard(group: string): string | undefined {
  for (const s of group.split('/')) {
    const card = SOUND_CARD[s.toLowerCase()];
    if (card) return card;
  }
  return undefined;
}

/** Hero focus-row card — large, letter-only. Cue images are deferred until a
 *  cleanly-cropped batch is available; for now showing just the letter keeps
 *  the layout consistent with the printed sound mat. */
function FocusSoundCard({ group, isPlaying, theme, onTap }: {
  group: string; isPlaying: boolean; theme: LevelTheme; onTap: () => void;
}) {
  const sounds = group.split('/');
  return (
    <button
      onClick={onTap}
      aria-label={`Play sound ${sounds.join(' or ')}`}
      className={`relative flex items-center justify-center rounded-2xl py-5 md:py-6 lg:py-8 px-3 transition-all duration-200 shadow-md active:scale-95
        ${isPlaying
          ? `bg-gradient-to-br ${theme.heroBgActive} text-white scale-[1.06]`
          : `bg-gradient-to-br ${theme.heroBgIdle} ${theme.heroText} hover:shadow-xl hover:scale-[1.02]`}`}
    >
      <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-none">
        {sounds.join(' ')}
      </span>
      {isPlaying && (
        <Volume2 className="absolute top-2 right-2 w-4 h-4 md:w-5 md:h-5 text-white/90" />
      )}
    </button>
  );
}

/** Smaller accordion card — compact letter-only pill. Clipart removed to
 *  match the focus row; will return when a cleanly-cropped batch is ready. */
function ReviewSoundCard({ group, isPlaying, theme, onTap }: {
  group: string; isPlaying: boolean; theme: LevelTheme; onTap: () => void;
}) {
  const sounds = group.split('/');
  return (
    <button
      onClick={onTap}
      aria-label={`Play sound ${sounds.join(' or ')}`}
      className={`flex items-center justify-center rounded-lg border px-2 py-2 transition-all duration-200 active:scale-95
        ${isPlaying
          ? `${theme.solidBg} text-white scale-110 shadow border-transparent`
          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300'}`}
    >
      <span className="text-sm md:text-base font-bold leading-none">{sounds.join('/')}</span>
    </button>
  );
}

function SoundGridPage({ page, level }: { page: Extract<InteractivePage, { type: 'sound_grid' }>; level: number }) {
  const [playingGroup, setPlayingGroup] = useState<string | null>(null);
  // Current level open by default; tapping another level closes the current one
  // and opens the new one (only one accordion row open at a time).
  const [openLevel, setOpenLevel] = useState<number | null>(level);
  const theme = getTheme(level);

  const handleSoundTap = async (group: string) => {
    setPlayingGroup(group);
    await playPhoneme(group.split('/')[0]);
    setPlayingGroup(null);
  };

  const focusGroups = page.allSounds.filter(g =>
    g.split('/').some(s => page.focusSounds.includes(s))
  );
  const reviewGroups = page.allSounds.filter(g =>
    !g.split('/').some(s => page.focusSounds.includes(s))
  );

  // Bucket review sounds by canonical level using the GRAPHEME_LEVEL map.
  const reviewByLevel: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  for (const g of reviewGroups) {
    const primary = g.split('/')[0];
    const lvl = GRAPHEME_LEVEL[g] ?? GRAPHEME_LEVEL[primary] ?? 1;
    reviewByLevel[lvl].push(g);
  }
  const populatedLevels = (Object.keys(reviewByLevel) as unknown as number[])
    .map(Number)
    .filter(l => reviewByLevel[l].length > 0)
    .sort((a, b) => a - b);

  const focusCols = focusGroups.length <= 2 ? 'grid-cols-1 md:grid-cols-2'
                  : focusGroups.length <= 3 ? 'grid-cols-2 md:grid-cols-3'
                  : focusGroups.length <= 4 ? 'grid-cols-2 md:grid-cols-4'
                  : 'grid-cols-3 md:grid-cols-6';

  const handleAccordionToggle = (lvl: number) => {
    setOpenLevel(curr => (curr === lvl ? null : lvl));
  };

  return (
    <div className="flex flex-col h-full px-5 md:px-10 lg:px-16 py-3 md:py-4 overflow-hidden" style={{ fontFamily: "'Andika', sans-serif" }}>
      {/* ── New sounds (focus row — clipart cards) ── */}
      <div className="flex items-center gap-2 mb-0.5 shrink-0">
        <Sparkles className={`w-5 h-5 md:w-6 md:h-6 ${theme.textAccentMuted}`} />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800">New sounds in this book</h2>
      </div>
      <p className="text-xs md:text-sm lg:text-base text-slate-500 mb-3 md:mb-4 shrink-0">
        Tap each one to hear it. These are the sounds your child will practise.
      </p>
      {/* Optional teaching note — used when one grapheme has multiple sounds
       *  (e.g. L5.3 'ure' has both /jʊər/ and /ər/). */}
      {page.note && (
        <div className={`shrink-0 mb-3 md:mb-4 px-3 md:px-4 py-2 md:py-2.5 rounded-xl bg-gradient-to-br ${theme.softGradient} border-2 ${theme.cardBorderActive} text-sm md:text-base text-slate-700 leading-snug`}>
          <span className="font-bold">Heads up: </span>{page.note}
        </div>
      )}

      <div className={`grid ${focusCols} gap-2.5 md:gap-3 lg:gap-4 mb-3 md:mb-4 shrink-0`}>
        {focusGroups.map((group) => (
          <FocusSoundCard
            key={group}
            group={group}
            isPlaying={playingGroup === group}
            theme={theme}
            onTap={() => handleSoundTap(group)}
          />
        ))}
      </div>

      {/* ── Review sounds — accordion grouped by level ── */}
      {populatedLevels.length > 0 && (
        <div className="flex flex-col gap-1.5 flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs md:text-sm text-slate-400 text-center mb-1 shrink-0">
            Tap a level to see those sounds
          </p>
          {populatedLevels.map((lvl) => {
            const isOpen = openLevel === lvl;
            const groups = reviewByLevel[lvl];
            return (
              <div key={lvl} className="rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0">
                <button
                  onClick={() => handleAccordionToggle(lvl)}
                  aria-expanded={isOpen}
                  className={`w-full flex items-center justify-between px-3 md:px-4 py-2 md:py-2.5 text-left transition-colors
                    ${isOpen ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                >
                  <span className="text-sm md:text-base font-semibold text-slate-700">
                    {LEVEL_LABEL[lvl] ?? `Level ${lvl}`}
                    <span className="ml-2 text-xs text-slate-400 font-normal">({groups.length})</span>
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 md:w-5 md:h-5 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-3 md:px-4 pb-3 pt-1">
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5 md:gap-2">
                      {groups.map((group) => (
                        <ReviewSoundCard
                          key={group}
                          group={group}
                          isPlaying={playingGroup === group}
                          theme={theme}
                          onTap={() => handleSoundTap(group)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Vocab Preview ──────────────────────────────────────────────────────────

function VocabPreviewPage({ page, level }: { page: Extract<InteractivePage, { type: 'vocab_preview' }>; level: number }) {
  const [activeWord, setActiveWord] = useState<string | null>(null);
  const theme = getTheme(level);

  // Audio rules:
  //  - L5+: every word plays the whole-word MP3 (per pedagogy — children at L5
  //    are reading, not decoding sound by sound).
  //  - Tricky words: always play the whole-word MP3 (they aren't decodable).
  //  - L1–L4 regular words: sound out using the data's phoneme array (source
  //    of truth — never re-split via splitDigraphs, which used to drop tt/dd/etc
  //    digraphs and pronounce e.g. "attention" as a-t-t-e-n-tion).
  const handleCardTap = async (w: StoryWord) => {
    setActiveWord(w.word);
    if (level >= 5 || w.isTricky || w.phonemes.length === 0) {
      await playWordFile(w.word);
    } else {
      await playPhonemeSequence(w.phonemes);
      // Brief pause, then blend the whole word
      await new Promise(r => setTimeout(r, 200));
      await playWordFile(w.word);
    }
    setActiveWord(null);
  };

  // Cards size to fit available height — count-based grid columns and rows so
  // every card stays visible without inner scroll. cardCount = page.words.length.
  const n = page.words.length;
  const cols = n <= 4 ? 'grid-cols-2 md:grid-cols-4'
              : n <= 6 ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-6'
              : n <= 8 ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-4'
              : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6';

  return (
    <div className="flex flex-col h-full px-5 md:px-10 lg:px-16 py-3 md:py-5" style={{ fontFamily: "'Andika', sans-serif" }}>
      <div className="flex items-center gap-2 mb-0.5 shrink-0">
        <BookOpenIcon className={theme.textAccentMuted} />
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-slate-800">Story Words</h2>
      </div>
      <p className="text-xs md:text-sm lg:text-base text-slate-500 mb-3 md:mb-4 shrink-0">
        Tap a card to hear the word. You'll meet all of these in the story.
      </p>
      <div className={`grid ${cols} gap-3 md:gap-4 flex-1 min-h-0 content-start`}>
        {page.words.map((w, i) => {
          const isActive = activeWord === w.word;
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${w.word}. Tap to hear.`}
              onClick={() => handleCardTap(w)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardTap(w);
                }
              }}
              className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl border-2 cursor-pointer select-none transition-all duration-200 min-h-0
                ${isActive
                  ? `${theme.cardBorderActive} bg-gradient-to-br ${theme.cardBgActive} scale-[1.04] shadow-lg`
                  : `border-slate-200 bg-white ${theme.cardHoverBorder} hover:shadow-md shadow-sm`}`}
            >
              <img
                src={`/images/words/${w.word}.png`}
                alt=""
                className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 object-contain mb-2 pointer-events-none"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="pointer-events-none">
                <TappableWord
                  wordData={w}
                  size="medium"
                  showAnnotations={true}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookOpenIcon({ className = 'text-pink-500' }: { className?: string }) {
  return (
    <svg className={`w-5 h-5 md:w-6 md:h-6 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2zm20 0h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

// ─── Story Page ─────────────────────────────────────────────────────────────

interface WordNarrationState {
  wordIdx: number;
  wholeWord: boolean;  // true = this word is currently being spoken
}

function StoryPage({ page, focusSounds, level = 1 }: { page: Extract<InteractivePage, { type: 'story' }>; focusSounds: string[]; level?: number }) {
  const [isNarrating, setIsNarrating] = useState(false);
  const [narrationState, setNarrationState] = useState<WordNarrationState | null>(null);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(false);
  const timersRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wordTimeFractionsRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  // ─── Build word timing fractions (pre-computed, reused on every timeupdate) ──
  const buildWordTimeFractions = useCallback(() => {
    const words = page.words;
    const wc = words.length;
    const weights: number[] = [];
    let totalWeight = 0;

    for (let i = 0; i < wc; i++) {
      // Base weight: syllable-aware — longer words take longer to say
      let w = Math.max(1, words[i].word.length) * 1.0;
      // Sentence-ending punctuation — exaggerated pause for teacher-paced reading
      if (/[.!?]$/.test(words[i].display)) w += 10;
      // Comma/semicolon — noticeable pause
      else if (/[,;:]$/.test(words[i].display)) w += 5;
      weights.push(w);
      totalWeight += w;
    }

    // Convert to cumulative start fractions [0..1)
    const fractions: number[] = [];
    let cumulative = 0;
    for (let i = 0; i < wc; i++) {
      fractions.push(cumulative / totalWeight);
      cumulative += weights[i];
    }
    return fractions;
  }, [page.words]);

  const handleNarrate = useCallback(() => {
    if (isNarrating) return;
    setIsNarrating(true);
    timersRef.current.forEach(t => clearTimeout(t));
    timersRef.current = [];

    // Pre-compute timing fractions
    wordTimeFractionsRef.current = buildWordTimeFractions();

    if (page.audioUrl) {
      const audio = new Audio(page.audioUrl);
      audio.playbackRate = 1.0; // Natural reading speed — slow-down was
      // making the per-word highlight drift visibly out of sync, and made
      // the audio sound robotic. Children get the feel of a real read-aloud.
      audioRef.current = audio;

      // Track highlight with requestAnimationFrame (~60fps) instead of
      // timeupdate (~4fps) so every word reliably gets its highlight
      let lastWordIdx = -1;
      const tick = () => {
        if (audio.paused || audio.ended) return;
        if (audio.duration) {
          const fraction = audio.currentTime / audio.duration;
          const fractions = wordTimeFractionsRef.current;
          let wordIdx = 0;
          for (let i = fractions.length - 1; i >= 0; i--) {
            if (fractions[i] <= fraction) { wordIdx = i; break; }
          }
          if (wordIdx !== lastWordIdx) {
            lastWordIdx = wordIdx;
            setNarrationState({ wordIdx, wholeWord: true });
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };

      audio.addEventListener('playing', () => {
        rafRef.current = requestAnimationFrame(tick);
      }, { once: true });

      audio.addEventListener('ended', () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        setNarrationState(null);
        setIsNarrating(false);
      }, { once: true });

      audio.play().catch(() => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        fallbackTTS();
      });
    } else {
      fallbackTTS();
    }

    function fallbackTTS() {
      const sentence = page.sentences.join(' ');
      const estimatedMs = sentence.length * 80;
      const fractions = wordTimeFractionsRef.current;
      const wc = page.words.length;

      // Schedule highlights using setTimeout for TTS fallback
      for (let wi = 0; wi < wc; wi++) {
        const delay = fractions[wi] * estimatedMs;
        timersRef.current.push(window.setTimeout(() => {
          setNarrationState({ wordIdx: wi, wholeWord: true });
        }, delay));
      }
      timersRef.current.push(window.setTimeout(() => {
        setNarrationState(null);
        setIsNarrating(false);
      }, estimatedMs + 200));

      // No browser-TTS fallback: the reader is single-voice (ElevenLabs / George)
      // across every book, and SpeechSynthesisUtterance produces a different OS
      // voice that breaks brand consistency. If the sentence MP3 is missing,
      // the word-highlight timeline still runs visually — children see the words
      // animate even without audio. Missing MP3s should be caught and generated
      // upstream, not papered over with a wrong-voice fallback.
      void sentence;
    }
  }, [isNarrating, page.sentences, page.words, page.audioUrl, buildWordTimeFractions]);

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t));
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // Level-based sizing: font gets smaller and spacing tighter as levels increase
  // L1-2: large & spacious (beginner readers), L3-4: medium, L5-6: compact (approaching normal reading)
  const wordSize: 'large' | 'medium' | 'normal' = level <= 2 ? 'large' : level <= 4 ? 'medium' : 'normal';
  const gapClass = level <= 2 ? 'gap-x-1 md:gap-x-2 gap-y-1' : level <= 4 ? 'gap-x-0.5 md:gap-x-1 gap-y-0.5' : 'gap-x-0 md:gap-x-0.5 gap-y-0';
  const textPad = level <= 2 ? 'px-4 md:px-8 lg:px-10' : level <= 4 ? 'px-3 md:px-6 lg:px-8' : 'px-2 md:px-4 lg:px-6';
  // Higher levels get a slightly bigger image since text is more compact
  const imgSize = level <= 2
    ? 'w-[240px] h-[240px] md:w-[340px] md:h-[340px] lg:w-[420px] lg:h-[420px]'
    : level <= 4
      ? 'w-[180px] h-[180px] md:w-[280px] md:h-[280px] lg:w-[340px] lg:h-[340px]'
      : 'w-[160px] h-[160px] md:w-[240px] md:h-[240px] lg:w-[300px] lg:h-[300px]';

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* Expanded image overlay */}
      {imageExpanded && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setImageExpanded(false)}>
          <div className="relative max-w-[90vw] max-h-[85vh]">
            <img src={page.imageUrl} alt="Story illustration" className="max-w-full max-h-[85vh] rounded-3xl shadow-2xl object-contain" />
            <button onClick={(e) => { e.stopPropagation(); setImageExpanded(false); }}
              aria-label="Close image"
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white/80 hover:bg-white/30 hover:text-white transition-all shadow-lg">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP: image left, text+button right ── */}
      {/* Image */}
      <div className="hidden md:flex md:items-center md:justify-center md:flex-none md:p-4 md:h-full">
        <button
          onClick={() => setImageExpanded(true)}
          aria-label="Expand illustration"
          className={`${imgSize} rounded-3xl overflow-hidden shadow-xl flex-shrink-0 cursor-pointer hover:shadow-2xl hover:scale-[1.02] transition-all duration-200`}
        >
          <img src={page.imageUrl} alt="Story illustration" className="w-full h-full object-cover" draggable={false} />
        </button>
      </div>

      {/* ── MOBILE: text centred between header & button, button+image at bottom ── */}
      {/* ── DESKTOP: text+button right column centred ── */}
      <div className="flex flex-col flex-1 h-full items-center justify-center md:justify-center relative">
        {/* Annotations toggle — top-right corner */}
        <button
          onClick={() => setShowAnnotations(v => !v)}
          className={`absolute top-2 right-2 z-10 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
            ${showAnnotations
              ? 'bg-pink-500 text-white hover:bg-pink-600'
              : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}`}
          aria-label={showAnnotations ? 'Hide phonics hints' : 'Show phonics hints'}
          title={showAnnotations ? 'Hide phonics hints' : 'Show phonics hints'}
        >
          {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>

        {/* Mobile top spacer — pushes text to vertical centre between header and button */}
        <div className="flex-1 md:hidden" />

        {/* Text — capped at a comfortable reading measure so long sentences
             wrap inside the column instead of clipping the right edge.
             max-w-* progressively wider at higher breakpoints. */}
        <div className={`flex items-center justify-center ${textPad} py-2 md:py-4 flex-shrink-0 w-full`}>
          <div className={`flex flex-wrap items-end justify-center ${gapClass} max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl`}>
            {page.words.map((w, i) => {
              const nh = narrationState && narrationState.wordIdx === i
                ? { wholeWord: narrationState.wholeWord }
                : null;
              return (
                <div key={i} className="transition-transform duration-150">
                  <TappableWord wordData={w} focusSounds={focusSounds} size={wordSize} narrationHighlight={isNarrating ? nh : null} showAnnotations={showAnnotations} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile bottom spacer — equal to top spacer so text is centred above button */}
        <div className="flex-1 md:hidden" />

        {/* Read to me button */}
        <div className={`${textPad} py-1 md:py-2 flex-shrink-0 w-full`}>
          <button onClick={handleNarrate} disabled={isNarrating}
            className={`w-full py-2 md:py-3.5 rounded-2xl font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all duration-200
              ${isNarrating ? 'bg-pink-500 text-white opacity-80 cursor-not-allowed' : 'bg-pink-100 text-pink-700 hover:bg-pink-200 active:scale-[0.98]'}`}>
            <Volume2 className="w-4 h-4 md:w-5 md:h-5" /> {isNarrating ? 'Reading...' : 'Read to me'}
          </button>
        </div>

        {/* Mobile image (below button, pinned at bottom) */}
        <div className="md:hidden flex items-center justify-center p-2 flex-shrink-0">
          <button
            onClick={() => setImageExpanded(true)}
            aria-label="Expand illustration"
            className={`${imgSize} rounded-2xl overflow-hidden shadow-lg flex-shrink-0 cursor-pointer hover:shadow-2xl active:scale-[0.98] transition-all duration-200`}
          >
            <img src={page.imageUrl} alt="Story illustration" className="w-full h-full object-cover" draggable={false} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sound Spotlight — Pattern A "Hero + Interactive" ───────────────────────
// Left half: huge focus-sound circle (readable from the back row of a
// classroom). Right half: 2x2 grid of big word cards with generous images.
// Mobile/portrait: stacks vertically.

/** Render a word with an optional morphological split — e.g. 'pure' with
 *  morphSplit=1 renders as "p-ure" with the focus suffix highlighted. */
function SpotlightWord({ word, focusIndex, morphSplit, focusColor }: {
  word: string; focusIndex: number; morphSplit?: number; focusColor: string;
}) {
  void focusIndex; // legacy field; visual highlight now keyed off morphSplit
  const stem = morphSplit !== undefined ? word.slice(0, morphSplit) : '';
  const suffix = morphSplit !== undefined ? word.slice(morphSplit) : word;
  return (
    <span className="font-bold">
      {stem && <span className="text-slate-700">{stem}</span>}
      {stem && <span className="text-slate-400 mx-0.5">-</span>}
      <span className={focusColor}>{suffix}</span>
    </span>
  );
}

function SoundSpotlightPage({ page, level }: { page: Extract<InteractivePage, { type: 'sound_spotlight' }>; level: number }) {
  const [playingItem, setPlayingItem] = useState<string | null>(null);
  const [playingVariant, setPlayingVariant] = useState<string | null>(null);
  const theme = getTheme(level);

  // ── Dual-variant layout (e.g. 'ure' = /jʊər/ vs /ər/) ──────────────────
  // When the data declares variants[], render one column per variant. Each
  // column has its own small sound circle + the items whose .variant matches.
  if (page.variants && page.variants.length > 0) {
    return (
      <div className="flex flex-col h-full w-full px-4 md:px-8 lg:px-12 py-3 md:py-4 overflow-hidden" style={{ fontFamily: "'Andika', sans-serif" }}>
        {page.explanation && (
          <p className="text-sm md:text-base lg:text-lg text-center text-slate-600 mb-2 md:mb-3 shrink-0">
            {page.explanation}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 flex-1 min-h-0">
          {page.variants.map((v) => {
            const items = page.items.filter(i => i.variant === v.audioKey);
            const isPlaying = playingVariant === v.audioKey;
            return (
              <div key={v.audioKey} className="flex flex-col items-center min-h-0">
                {/* Column header — small circle + label */}
                <button
                  onClick={async () => { setPlayingVariant(v.audioKey); await playPhoneme(v.audioKey); setPlayingVariant(null); }}
                  className={`aspect-square w-20 md:w-24 lg:w-28 xl:w-32
                    rounded-full grid place-items-center font-bold leading-none mb-1
                    transition-all duration-200 select-none bg-gradient-to-br shrink-0
                    ${isPlaying
                      ? `${theme.heroBgActive} text-white scale-105 shadow-xl`
                      : `${theme.heroBgIdle} ${theme.heroText} shadow-md hover:shadow-lg hover:scale-[1.02]`}`}
                  aria-label={`Play sound ${page.sound} (${v.label})`}
                >
                  <span className="text-2xl md:text-3xl lg:text-4xl">{page.sound}</span>
                </button>
                <p className={`text-sm md:text-base font-bold ${theme.textAccent} mb-2 md:mb-3 shrink-0`}>
                  {v.label}
                </p>
                {/* Item list */}
                <div className="grid grid-cols-1 gap-2 md:gap-2.5 w-full flex-1 min-h-0 content-center">
                  {items.map((item) => {
                    const isActive = playingItem === item.word;
                    return (
                      <button
                        key={item.word}
                        onClick={async () => {
                          setPlayingItem(item.word);
                          await playWordFile(item.word);
                          setPlayingItem(null);
                        }}
                        className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 md:py-2
                          rounded-2xl border-2 transition-all duration-200 select-none
                          text-lg md:text-xl lg:text-2xl
                          ${isActive
                            ? `${theme.cardBorderActive} bg-gradient-to-br ${theme.cardBgActive} scale-[1.02] shadow-lg`
                            : `border-slate-200 bg-white ${theme.cardHoverBorder} hover:shadow-md shadow-sm hover:scale-[1.01]`}`}
                      >
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 object-contain shrink-0 pointer-events-none"
                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <SpotlightWord
                          word={item.word}
                          focusIndex={item.focusIndex}
                          morphSplit={item.morphSplit}
                          focusColor={theme.textAccent}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Single-variant layout (default) ───────────────────────────────────
  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* ── HERO LEFT — focus sound. Centred via block layout + text-center
       *  so multi-character sounds like 'o-e' or 'tion' sit in the middle of
       *  the circle (was offset before due to flex baseline alignment). */}
      <div className="flex flex-col items-center justify-center md:w-2/5 lg:w-[40%] p-3 md:p-6 lg:p-8 gap-3 min-h-0">
        <button
          onClick={async () => { setPlayingVariant('default'); await playPhoneme(page.sound); setPlayingVariant(null); }}
          className={`aspect-square w-28 md:w-44 lg:w-[14rem] xl:w-[18rem] max-w-full
            rounded-full grid place-items-center font-bold leading-none
            transition-all duration-200 select-none bg-gradient-to-br
            ${playingVariant === 'default'
              ? `${theme.heroBgActive} text-white scale-105 shadow-2xl`
              : `${theme.heroBgIdle} ${theme.heroText} shadow-xl hover:shadow-2xl hover:scale-[1.02]`}`}
          aria-label={`Play sound ${page.sound}`}
        >
          <span className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-center">{page.sound}</span>
        </button>
        <p className="text-sm md:text-base lg:text-lg text-slate-500 font-medium">Tap the sound!</p>
      </div>

      {/* ── WORD CARDS RIGHT — 2x2 grid. Audio is George's voice (whole word)
       *  for every level: too many phoneme-derivation edge cases (e.g. 'stone'
       *  splitting as 5 sounds instead of 4) for the splitDigraphs path to be
       *  pedagogically reliable. */}
      <div className="flex items-center justify-center md:w-3/5 lg:w-[60%] p-3 md:p-5 lg:p-6 min-h-0">
        <div className="grid grid-cols-2 gap-2.5 md:gap-3 lg:gap-4 w-full max-w-2xl h-full max-h-full">
          {page.items.map((item) => {
            const isActive = playingItem === item.word;
            return (
              <button
                key={item.word}
                onClick={async () => {
                  setPlayingItem(item.word);
                  await playWordFile(item.word);
                  setPlayingItem(null);
                }}
                className={`flex flex-col items-center justify-center p-2 md:p-3 lg:p-4 min-h-0
                  rounded-2xl border-2 transition-all duration-200 select-none
                  ${isActive
                    ? `${theme.cardBorderActive} bg-gradient-to-br ${theme.cardBgActive} scale-[1.03] shadow-xl`
                    : `border-slate-200 bg-white ${theme.cardHoverBorder} hover:shadow-lg shadow-sm hover:scale-[1.02]`}`}
              >
                <img
                  src={item.imageUrl}
                  alt={item.word}
                  className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 object-contain mb-1 md:mb-2 pointer-events-none"
                />
                <span className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold">
                  {(() => {
                    const chars = splitDigraphs(item.word);
                    const focusSet = computeSpotlightFocus(item.word, page.sound);
                    return chars.map((ch, ci) => (
                      <span key={ci} className={focusSet.has(ci) ? theme.textAccent : 'text-slate-700'}>{ch}</span>
                    ));
                  })()}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Word Reading — Pattern A: level-themed hero + big word tiles ───────────

function WordReadingPage({ page, focusSounds, level }: { page: Extract<InteractivePage, { type: 'word_reading' }>; focusSounds: string[]; level: number }) {
  const theme = getTheme(level);

  // Visual differentiation from Tricky Words: top banner + full-width card
  // grid (instead of split hero / grid). Card grid uses a "challenge mat"
  // feel — each card is a flashcard with a glow on tap.
  const n = page.words.length;
  const cols = n <= 3 ? 'grid-cols-1 md:grid-cols-3'
             : n <= 4 ? 'grid-cols-2 md:grid-cols-4'
             : n <= 6 ? 'grid-cols-2 md:grid-cols-3'
             : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4';

  return (
    <div className="flex flex-col h-full w-full px-5 md:px-10 lg:px-16 py-3 md:py-5 overflow-hidden">
      {/* ── Top banner ── */}
      <div className={`flex items-center justify-center gap-2 md:gap-3 mb-1 shrink-0`}>
        <Sparkles className={`w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 ${theme.textAccentMuted}`} />
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-slate-800">Can You Read These?</h2>
        <Sparkles className={`w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 ${theme.textAccentMuted}`} />
      </div>
      <p className="text-xs md:text-sm lg:text-base text-slate-500 text-center mb-3 md:mb-4 shrink-0">
        Tap each word to blend it together. Use the dots to sound it out.
      </p>

      {/* ── Flashcard grid — scaled-down padding/size from old word_reading
       *  so 6 words fit on a single screen at 1366x768 without scrolling.
       *  Sound-out behaviour kept here per pedagogy (this is decoding
       *  practice). Sound spotlight is the whole-word page. */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className={`grid ${cols} gap-3 md:gap-4 lg:gap-5 w-full max-w-5xl content-center`}>
          {page.words.map((w, i) => (
            <div
              key={i}
              className={`flex items-center justify-center rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 ${theme.cardHoverBorder} hover:shadow-lg hover:scale-[1.02] transition-all duration-200 py-5 md:py-7 lg:py-9 px-3 shadow-sm min-h-0`}
            >
              <TappableWord wordData={w} focusSounds={focusSounds} size="large" showAnnotations={true} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tricky Words — Pattern A: purple "mascot" hero, big card grid right ────
// Tricky-words keep purple accents (semantic convention across the app),
// regardless of book level. Amber stars carry the "special" vibe.

function TrickyWordsPage({ page }: { page: Extract<InteractivePage, { type: 'tricky_words' }> }) {
  const [playing, setPlaying] = useState<string | null>(null);

  const handleTap = async (word: string) => {
    setPlaying(word);
    await playWordFile(word);
    setPlaying(null);
  };

  // Cards-per-row scales by word count. Capped at 3 cols even on lg+ so cards
  // stay wide enough to fit longer words like "through" without text-clipping.
  const n = page.words.length;
  const cols = n <= 4 ? 'grid-cols-2'
             : 'grid-cols-2 md:grid-cols-3';

  return (
    <div className="flex flex-col md:flex-row h-full w-full overflow-hidden">
      {/* ── HERO LEFT — purple decorative anchor (compacted) ── */}
      <div className="flex flex-col items-center justify-center md:w-2/5 lg:w-[38%] p-4 md:p-6 lg:p-8 gap-3 md:gap-4 bg-gradient-to-br from-purple-50 to-purple-100 min-h-0">
        <div className="relative">
          <div className="w-28 h-28 md:w-40 md:h-40 lg:w-52 lg:h-52 rounded-full bg-gradient-to-br from-purple-200 to-purple-300 shadow-xl flex items-center justify-center">
            <Star className="w-14 h-14 md:w-20 md:h-20 lg:w-28 lg:h-28 text-amber-400 fill-amber-400 drop-shadow-lg" />
          </div>
          <Star className="absolute -top-2 -right-2 md:-top-3 md:-right-3 w-6 h-6 md:w-8 md:h-8 text-amber-300 fill-amber-300 animate-pulse" />
          <Star className="absolute -bottom-1 -left-3 md:-bottom-2 md:-left-5 w-5 h-5 md:w-7 md:h-7 text-amber-200 fill-amber-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
        </div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-purple-800">Tricky Words</h2>
        <p className="text-sm md:text-base lg:text-lg text-purple-600 text-center max-w-xs">
          These don't sound how they look &mdash; just know them by sight!
        </p>
      </div>

      {/* ── CARDS RIGHT — big tricky cards. Text caps at lg:text-5xl so a
       *  7-letter word like "through" never clips the card edge. */}
      <div className="flex items-center justify-center flex-1 p-4 md:p-6 lg:p-8 min-h-0">
        <div className={`grid ${cols} gap-3 md:gap-4 lg:gap-5 w-full max-w-3xl`}>
          {page.words.map((w, i) => {
            const isActive = playing === w.word;
            return (
              <button
                key={i}
                onClick={() => handleTap(w.word)}
                className={`py-5 md:py-7 lg:py-9 px-3 md:px-4 rounded-3xl border-2 font-bold transition-all duration-200 select-none
                  text-3xl md:text-4xl lg:text-5xl truncate
                  ${isActive
                    ? 'border-purple-400 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-800 scale-[1.03] shadow-xl'
                    : 'border-purple-200 bg-white text-slate-700 hover:border-purple-400 hover:bg-purple-50 hover:scale-[1.02] shadow-sm hover:shadow-lg'}`}
              >
                {w.display}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Nonsense / Alien Words (redesigned — boxed words) ──────────────────────

// Nonsense/alien words stay green across all levels — green is the semantic
// "not a real word, just sound it out" signal, mirroring how tricky words
// keep purple. Alien character images per word are a follow-up (backlog #2).
function NonsenseWordsPage({ page, focusSounds }: { page: Extract<InteractivePage, { type: 'nonsense_words' }>; focusSounds: string[] }) {
  // Scale grid cols with word count so 6-word books breathe and 12-word
  // books still fit without horizontal overflow.
  const cols = page.words.length <= 6 ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-3'
             : page.words.length <= 9 ? 'grid-cols-3 md:grid-cols-3 lg:grid-cols-3'
             : 'grid-cols-3 md:grid-cols-4 lg:grid-cols-4';

  return (
    <div className="flex flex-col h-full w-full px-5 md:px-10 lg:px-16 py-3 md:py-5 overflow-hidden">
      <div className="flex items-center justify-center gap-2 md:gap-3 mb-0.5 shrink-0">
        <Sparkles className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500" />
        <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-800">Alien Words</h2>
        <Sparkles className="w-5 h-5 md:w-7 md:h-7 lg:w-8 lg:h-8 text-green-500" />
      </div>
      <p className="text-xs md:text-sm lg:text-base text-slate-500 mb-3 md:mb-4 text-center shrink-0">
        Not real words &mdash; just sound them out!
      </p>
      {/* content-start instead of items-center stops the grid from growing
       * upward and overlapping the subtitle when it has many cards. */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className={`grid ${cols} gap-3 md:gap-4 lg:gap-5 w-full max-w-5xl content-center`}>
          {page.words.map((w, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-3xl px-3 py-4 md:py-6 lg:py-8 flex justify-center shadow-sm hover:border-green-400 hover:shadow-lg transition-all duration-200 min-h-0"
            >
              <TappableWord wordData={w} focusSounds={focusSounds} size="large" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Comprehension Quiz — Kahoot-style full-width ───────────────────────────
// Top: themed question banner with optional image + big question text.
// Body: large answer cards (2 cols, or 3 cols when there are 3 options).
// Level-themed highlights; wrong/right feedback in red/green regardless of level.

function QuizPage({ page, level }: { page: Extract<InteractivePage, { type: 'quiz' }>; level: number }) {
  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(false);
  const theme = getTheme(level);

  const q = page.questions[qIdx];
  const isLast = qIdx === page.questions.length - 1;

  const handleSelect = (oi: number) => {
    if (selected !== null) return;
    setSelected(oi);
    setCorrect(q.options[oi].isCorrect);
  };

  const handleNext = () => {
    if (isLast) return;
    setQIdx(i => i + 1);
    setSelected(null);
    setCorrect(false);
  };

  const optionGridCols = q.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';

  return (
    <div className="flex flex-col h-full w-full px-6 md:px-12 lg:px-16 py-6 md:py-8 lg:py-10 overflow-y-auto">
      {/* ── Question banner ── */}
      <div className={`rounded-3xl bg-gradient-to-br ${theme.softGradient} p-6 md:p-8 lg:p-10 mb-5 md:mb-6 lg:mb-8 flex flex-col md:flex-row items-center gap-5 md:gap-8 shadow-sm flex-shrink-0`}>
        {q.imageUrl && (
          <img src={q.imageUrl} alt="" className="w-32 h-32 md:w-40 md:h-40 lg:w-52 lg:h-52 object-contain flex-shrink-0 rounded-2xl" />
        )}
        <div className="flex-1 text-center md:text-left">
          <p className={`text-sm md:text-base lg:text-lg font-bold ${theme.textAccentMuted} mb-1 md:mb-2 uppercase tracking-wider`}>
            Question {qIdx + 1} of {page.questions.length}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-800 leading-tight">
            {q.question}
          </h2>
        </div>
      </div>

      {/* ── Answer cards ── */}
      <div className={`grid gap-4 md:gap-6 lg:gap-8 w-full ${optionGridCols} flex-1 items-stretch min-h-0`}>
        {q.options.map((opt, oi) => {
          const isThis = selected === oi;
          const showCorrect = selected !== null && opt.isCorrect;
          const showWrong = isThis && !opt.isCorrect;
          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              className={`flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 px-6 md:px-8 py-6 md:py-8
                rounded-3xl border-2 transition-all duration-200 font-bold select-none
                text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                ${showCorrect
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-700 scale-[1.02] shadow-xl'
                  : showWrong
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100 text-red-600'
                    : selected !== null
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : `border-slate-200 bg-white text-slate-700 ${theme.cardHoverBorder} hover:shadow-lg hover:scale-[1.02] shadow-sm`}`}
            >
              {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 object-contain flex-shrink-0" />}
              <span>{opt.label}</span>
              {showCorrect && <Check className="w-8 h-8 md:w-10 md:h-10 text-green-500 md:ml-auto" />}
            </button>
          );
        })}
      </div>

      {/* ── Feedback + Next ── */}
      {selected !== null && (
        <div className="mt-5 md:mt-6 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 flex-shrink-0">
          {correct ? (
            <p className="text-green-600 font-bold text-xl md:text-2xl lg:text-3xl">Well done! &#11088;</p>
          ) : (
            <p className="text-amber-600 font-bold text-xl md:text-2xl lg:text-3xl">Not quite — the green one is right!</p>
          )}
          {!isLast && (
            <button
              onClick={handleNext}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl ${theme.solidBg} ${theme.solidBgHover} text-white font-bold text-lg md:text-xl transition-colors shadow-lg`}
            >
              Next Question &rarr;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Spelling — Pattern A: image hero left, slots + tile bank right ─────────

function SpellingPage({ page, level }: { page: Extract<InteractivePage, { type: 'spelling' }>; level: number }) {
  const [wordIdx, setWordIdx] = useState(0);
  const w = page.words[wordIdx];
  const isLast = wordIdx === page.words.length - 1;
  const theme = getTheme(level);

  // Shuffle available letters (include some distractors)
  const [available, setAvailable] = useState<string[]>([]);
  const [placed, setPlaced] = useState<(string | null)[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const resetWord = useCallback((wi: number) => {
    const word = page.words[wi];
    const distractors = ['b', 'g', 'o', 'e', 'r', 'd'].filter(l => !word.letters.includes(l)).slice(0, 2);
    const all = [...word.letters, ...distractors];
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    setAvailable(all);
    setPlaced(word.letters.map(() => null));
    setIsCorrect(false);
  }, [page.words]);

  useEffect(() => { resetWord(wordIdx); }, [wordIdx, resetWord]);

  const handleLetterTap = (letter: string, fromIdx: number) => {
    if (isCorrect) return;
    const slotIdx = placed.indexOf(null);
    if (slotIdx === -1) return;
    const newPlaced = [...placed];
    newPlaced[slotIdx] = letter;
    setPlaced(newPlaced);
    const newAvail = [...available];
    newAvail.splice(fromIdx, 1);
    setAvailable(newAvail);
    if (!newPlaced.includes(null)) {
      setIsCorrect(newPlaced.join('') === w.word);
      if (newPlaced.join('') !== w.word) {
        setTimeout(() => resetWord(wordIdx), 1200);
      }
    }
  };

  const handleSlotTap = (slotIdx: number) => {
    if (isCorrect) return;
    const letter = placed[slotIdx];
    if (!letter) return;
    const newPlaced = [...placed];
    newPlaced[slotIdx] = null;
    setPlaced(newPlaced);
    setAvailable([...available, letter]);
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* ── HERO LEFT — word image + title ── */}
      <div className={`flex flex-col items-center justify-center md:w-2/5 lg:w-1/2 p-6 md:p-10 lg:p-12 gap-4 md:gap-6 bg-gradient-to-br ${theme.softGradient}`}>
        <img
          src={w.imageUrl}
          alt={w.word}
          className="w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 xl:w-80 xl:h-80 object-contain drop-shadow-xl"
        />
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800">Spell the Word!</h2>
        {isCorrect && (
          <p className="text-green-600 font-bold text-2xl md:text-3xl lg:text-4xl animate-bounce">&#11088; Correct!</p>
        )}
      </div>

      {/* ── RIGHT — slots + tile bank ── */}
      <div className="flex flex-col items-center justify-center md:w-3/5 lg:w-1/2 p-6 md:p-10 lg:p-12 gap-6 md:gap-8 lg:gap-10">
        {/* Letter slots */}
        <div className="flex gap-3 md:gap-4 lg:gap-5 flex-wrap justify-center">
          {placed.map((letter, si) => (
            <button
              key={si}
              onClick={() => handleSlotTap(si)}
              className={`w-20 h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 xl:w-32 xl:h-32 rounded-2xl border-[3px] flex items-center justify-center text-4xl md:text-5xl lg:text-6xl font-bold transition-all duration-200 shadow-sm
                ${letter
                  ? (isCorrect
                      ? 'border-green-400 bg-green-50 text-green-700 scale-[1.02]'
                      : `${theme.cardBorderActive} bg-gradient-to-br ${theme.cardBgActive} ${theme.heroText}`)
                  : 'border-dashed border-slate-300 bg-white text-slate-300'}`}
            >
              {letter || '?'}
            </button>
          ))}
        </div>

        <div className="h-px w-full max-w-md bg-slate-200" />

        {/* Available tiles */}
        <div className="flex gap-3 md:gap-4 flex-wrap justify-center max-w-lg">
          {available.map((letter, li) => (
            <button
              key={li}
              onClick={() => handleLetterTap(letter, li)}
              className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-2xl bg-amber-100 border-2 border-amber-300 text-3xl md:text-4xl lg:text-5xl font-bold text-amber-800 hover:bg-amber-200 hover:scale-105 transition-all duration-200 shadow-md"
            >
              {letter}
            </button>
          ))}
        </div>

        {isCorrect && !isLast && (
          <button
            onClick={() => setWordIdx(i => i + 1)}
            className={`px-8 md:px-10 py-3 md:py-4 rounded-2xl ${theme.solidBg} ${theme.solidBgHover} text-white font-bold text-lg md:text-xl transition-colors shadow-lg`}
          >
            Next Word &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Grammar — Pattern A: Word Order (L2) ───────────────────────────────────
// Children drag (tap) word tiles into sentence slots. First variant in a
// progressive grammar track: L2 = word order, L3 = sentence type (./?/!),
// L4 = find the describing word, L5 = past-or-now, L6 = joining sentences.

function GrammarWordOrderPage({ page, level }: { page: Extract<InteractivePage, { type: 'grammar'; variant: 'word_order' }>; level: number }) {
  const theme = getTheme(level);
  const [itemIdx, setItemIdx] = useState(0);
  const item: GrammarWordOrderItem = page.items[itemIdx];
  const isLast = itemIdx === page.items.length - 1;

  const [available, setAvailable] = useState<string[]>([]);
  const [placed, setPlaced] = useState<(string | null)[]>([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const resetItem = useCallback((ii: number) => {
    const correct = page.items[ii].correctWords;
    // Shuffle copy of correct words
    const shuffled = [...correct];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setAvailable(shuffled);
    setPlaced(correct.map(() => null));
    setIsCorrect(false);
  }, [page.items]);

  useEffect(() => { resetItem(itemIdx); }, [itemIdx, resetItem]);

  const handleTileTap = (word: string, fromIdx: number) => {
    if (isCorrect) return;
    const slotIdx = placed.indexOf(null);
    if (slotIdx === -1) return;
    const nextPlaced = [...placed];
    nextPlaced[slotIdx] = word;
    setPlaced(nextPlaced);
    const nextAvail = [...available];
    nextAvail.splice(fromIdx, 1);
    setAvailable(nextAvail);
    if (!nextPlaced.includes(null)) {
      const correct = nextPlaced.join(' ') === item.correctWords.join(' ');
      setIsCorrect(correct);
      if (!correct) {
        // Gentle auto-reset after a moment
        setTimeout(() => resetItem(itemIdx), 1400);
      }
    }
  };

  const handleSlotTap = (slotIdx: number) => {
    if (isCorrect) return;
    const word = placed[slotIdx];
    if (!word) return;
    const nextPlaced = [...placed];
    nextPlaced[slotIdx] = null;
    setPlaced(nextPlaced);
    setAvailable([...available, word]);
  };

  const title = page.title ?? 'Build the sentence!';

  return (
    <div className="flex flex-col md:flex-row h-full w-full">
      {/* ── HERO LEFT — illustration + prompt ── */}
      <div className={`flex flex-col items-center justify-center md:w-2/5 lg:w-1/2 p-6 md:p-10 lg:p-12 gap-4 md:gap-6 bg-gradient-to-br ${theme.softGradient}`}>
        {item.imageUrl ? (
          <div className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-[22rem] xl:h-[22rem] rounded-3xl overflow-hidden shadow-xl ring-4 ring-white/70">
            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" draggable={false} />
          </div>
        ) : (
          <div className={`w-40 h-40 md:w-56 md:h-56 lg:w-72 lg:h-72 rounded-3xl bg-gradient-to-br ${theme.heroBgIdle} shadow-xl flex items-center justify-center`}>
            <span className="text-7xl md:text-8xl lg:text-9xl">&#x1F4DD;</span>
          </div>
        )}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 text-center">{title}</h2>
        <p className={`text-base md:text-lg lg:text-xl font-medium ${theme.textAccentMuted} uppercase tracking-wider`}>
          Sentence {itemIdx + 1} of {page.items.length}
        </p>
        {isCorrect && (
          <p className="text-green-600 font-bold text-2xl md:text-3xl lg:text-4xl animate-bounce">&#11088; Correct!</p>
        )}
      </div>

      {/* ── RIGHT — slots + tile bank + next ── */}
      <div className="flex flex-col items-center justify-center md:w-3/5 lg:w-1/2 p-6 md:p-10 lg:p-12 gap-6 md:gap-8 lg:gap-10">
        {/* Sentence slots */}
        <div className="flex gap-2 md:gap-3 lg:gap-4 flex-wrap justify-center w-full">
          {placed.map((word, si) => (
            <button
              key={si}
              onClick={() => handleSlotTap(si)}
              className={`min-w-[4rem] md:min-w-[5rem] lg:min-w-[6rem] h-14 md:h-16 lg:h-20 xl:h-24 px-3 md:px-4 lg:px-5 rounded-2xl border-[3px] flex items-center justify-center text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold transition-all duration-200 shadow-sm
                ${word
                  ? (isCorrect
                      ? 'border-green-400 bg-green-50 text-green-700 scale-[1.02]'
                      : `${theme.cardBorderActive} bg-gradient-to-br ${theme.cardBgActive} ${theme.heroText}`)
                  : 'border-dashed border-slate-300 bg-white text-slate-300'}`}
            >
              {word || '___'}
            </button>
          ))}
        </div>

        <div className="h-px w-full max-w-md bg-slate-200" />

        {/* Word tile bank */}
        <div className="flex gap-2 md:gap-3 lg:gap-4 flex-wrap justify-center max-w-2xl">
          {available.map((word, li) => (
            <button
              key={li}
              onClick={() => handleTileTap(word, li)}
              className="min-w-[4rem] md:min-w-[5rem] lg:min-w-[6rem] px-4 md:px-5 lg:px-6 py-3 md:py-4 lg:py-5 rounded-2xl bg-amber-100 border-2 border-amber-300 text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-amber-800 hover:bg-amber-200 hover:scale-105 transition-all duration-200 shadow-md"
            >
              {word}
            </button>
          ))}
        </div>

        {isCorrect && !isLast && (
          <button
            onClick={() => setItemIdx(i => i + 1)}
            className={`px-8 md:px-10 py-3 md:py-4 rounded-2xl ${theme.solidBg} ${theme.solidBgHover} text-white font-bold text-lg md:text-xl transition-colors shadow-lg`}
          >
            Next Sentence &rarr;
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Story Ordering (numbers outside images, tighter layout) ────────────────

function StoryOrderingPage({ page }: { page: Extract<InteractivePage, { type: 'story_ordering' }> }) {
  const [items, setItems] = useState<OrderingItem[]>(() => {
    const s = [...page.items];
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    return s;
  });
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  const checkCorrect = (arr: OrderingItem[]) => setIsCorrect(arr.every((it, i) => it.correctIndex === i));

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    const n = [...items]; const [d] = n.splice(dragIdx, 1); n.splice(i, 0, d);
    setItems(n); setDragIdx(i);
  };
  const handleDragEnd = () => { setDragIdx(null); checkCorrect(items); };

  const handleTap = (i: number) => {
    if (selectedIdx === null) { setSelectedIdx(i); }
    else { if (selectedIdx !== i) { const n = [...items]; [n[selectedIdx], n[i]] = [n[i], n[selectedIdx]]; setItems(n); checkCorrect(n); } setSelectedIdx(null); }
  };

  const handleReset = () => {
    const s = [...page.items];
    for (let i = s.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [s[i], s[j]] = [s[j], s[i]]; }
    setItems(s); setIsCorrect(false); setSelectedIdx(null);
  };

  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Put the Story in Order!</h2>
      <p className="text-sm text-slate-500 mb-3">Tap two to swap them.</p>

      {isCorrect && (
        <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-green-100 rounded-2xl">
          <Check className="w-5 h-5 text-green-600" />
          <span className="text-green-700 font-bold text-sm">That's the right order!</span>
        </div>
      )}

      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 flex-1">
        {items.map((item, i) => (
          <div key={item.correctIndex} draggable onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)} onDragEnd={handleDragEnd} onClick={() => handleTap(i)}
            className={`flex flex-col items-center cursor-grab select-none transition-all duration-200
              ${dragIdx === i ? 'opacity-50 scale-95' : ''} ${selectedIdx === i ? 'scale-105' : ''}`}>
            {/* Number ABOVE the image */}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mb-1
              ${isCorrect && item.correctIndex === i ? 'bg-green-500 text-white' : selectedIdx === i ? 'bg-pink-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
              {i + 1}
            </div>
            <div className={`w-full rounded-2xl border-2 overflow-hidden transition-colors
              ${selectedIdx === i ? 'border-pink-400 ring-2 ring-pink-300' : isCorrect && item.correctIndex === i ? 'border-green-400' : 'border-slate-200'}`}>
              <img src={item.imageUrl} alt={item.label} className="w-full aspect-square object-cover" draggable={false} />
            </div>
            <p className="text-xs text-slate-500 mt-1 text-center leading-tight">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-2">
        <button onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100 text-slate-600 text-sm font-medium hover:bg-slate-200 transition-colors">
          <RotateCcw className="w-4 h-4" /> Shuffle
        </button>
      </div>
    </div>
  );
}

// ─── Drawing Canvas ─────────────────────────────────────────────────────────

function DrawingCanvas({ prompt }: { prompt: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [color, setColor] = useState('#e91e63');
  const colors = ['#e91e63', '#2196f3', '#4caf50', '#ff9800', '#9c27b0', '#333333'];

  const getCtx = () => canvasRef.current?.getContext('2d');
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); isDrawing.current = true;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  };
  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  };
  const endDraw = () => { isDrawing.current = false; };
  const clearCanvas = () => { const c = canvasRef.current, ctx = getCtx(); if (c && ctx) ctx.clearRect(0, 0, c.width, c.height); };
  useEffect(() => { const c = canvasRef.current; if (c) { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; } }, []);

  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-3">{prompt}</h2>
      <div className="flex items-center gap-2.5 mb-3">
        {colors.map(c => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-9 h-9 rounded-full transition-all ${color === c ? 'ring-3 ring-offset-2 ring-slate-400 scale-110' : ''}`}
            style={{ backgroundColor: c }} />
        ))}
        <button onClick={clearCanvas} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-base font-medium hover:bg-slate-200">
          <Trash2 className="w-4 h-4" /> Clear
        </button>
      </div>
      <canvas ref={canvasRef} className="flex-1 rounded-2xl border-2 border-dashed border-slate-300 bg-white touch-none cursor-crosshair"
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} />
    </div>
  );
}

// ─── Writing Practice ───────────────────────────────────────────────────────

function WritingPracticePage({ page }: { page: Extract<InteractivePage, { type: 'writing_practice' }> }) {
  const [activeIdx, setActiveIdx] = useState(0);
  return (
    <div className="flex flex-col h-full px-5 py-4">
      <h2 className="text-2xl font-bold text-slate-800 mb-1">Writing Practice</h2>
      <p className="text-base text-slate-500 mb-4">Tap a letter, then trace it!</p>
      <div className="flex gap-3 mb-4">
        {page.letters.map((letter, i) => (
          <button key={i} onClick={async () => { setActiveIdx(i); await playPhoneme(letter); }}
            className={`flex-1 py-4 rounded-2xl text-3xl font-bold transition-all duration-200
              ${i === activeIdx ? 'bg-pink-500 text-white shadow-lg scale-105' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {letter}
          </button>
        ))}
      </div>
      <div className="flex-1 relative rounded-2xl border-2 border-dashed border-slate-300 bg-white overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[14rem] font-bold text-slate-200/60 select-none">{page.letters[activeIdx]}</span>
        </div>
        <WritingCanvas key={`${page.letters[activeIdx]}-${activeIdx}`} />
      </div>
    </div>
  );
}

function WritingCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const getCtx = () => canvasRef.current?.getContext('2d');
  const getPos = (e: React.TouchEvent | React.MouseEvent) => {
    const c = canvasRef.current; if (!c) return null;
    const r = c.getBoundingClientRect(), sx = c.width / r.width, sy = c.height / r.height;
    if ('touches' in e) return { x: (e.touches[0].clientX - r.left) * sx, y: (e.touches[0].clientY - r.top) * sy };
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  };
  const start = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); isDrawing.current = true;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); ctx.strokeStyle = '#e91e63'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }
  };
  const move = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); if (!isDrawing.current) return;
    const ctx = getCtx(), pos = getPos(e);
    if (ctx && pos) { ctx.lineTo(pos.x, pos.y); ctx.stroke(); }
  };
  const end = () => { isDrawing.current = false; };
  useEffect(() => { const c = canvasRef.current; if (c) { c.width = c.offsetWidth * 2; c.height = c.offsetHeight * 2; } }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
      onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end} />
  );
}

// ─── Certificate — stamp progress + gated Reading-Champion award ────────────
// Each calendar day's first completion earns one stamp, up to MAX_STAMPS (5).
// Same-day re-reads don't award another stamp — the child has to come back
// tomorrow. This mirrors school practice where a decodable is read 5+ times
// to build genuine fluency, and gives parents a visible "N of 5" signal so
// they don't mistake "read once" for "mastered".

// ─── Check-In Phase (readiness gate for stamps 3, 4, 5) ─────────────────────
// Shows 2 random questions from the book's existing quiz pool before
// awarding the stamp. Not a hard gate — stamp still awards either way —
// but pass/fail is tracked and fed into the "Ready to Move Up!" signal
// that unlocks on stamp 5 only if all three check-ins were passed.

function CheckInPhase({
  questions,
  theme,
  stampNumber,
  onComplete,
}: {
  questions: QuizQuestion[];
  theme: LevelTheme;
  stampNumber: number;
  onComplete: (passed: boolean) => void;
}) {
  // Shuffle and take up to 2 — randomness means rereads see variation
  // even without new content (backlog item to author larger pools).
  const picked = useRef<QuizQuestion[]>();
  if (!picked.current) {
    const shuffled = [...questions].sort(() => Math.random() - 0.5);
    picked.current = shuffled.slice(0, Math.min(2, shuffled.length));
  }
  const qs = picked.current;

  const [qIdx, setQIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const q = qs[qIdx];
  const isLast = qIdx === qs.length - 1;

  const handleSelect = (oi: number) => {
    if (selected !== null) return;
    setSelected(oi);
    if (q.options[oi].isCorrect) setCorrectCount(c => c + 1);
    // Auto-advance after 1.4s so the child sees feedback
    setTimeout(() => {
      if (isLast) {
        const finalCorrect = correctCount + (q.options[oi].isCorrect ? 1 : 0);
        onComplete(finalCorrect === qs.length);
      } else {
        setQIdx(i => i + 1);
        setSelected(null);
      }
    }, 1400);
  };

  return (
    <div className="flex flex-col h-full w-full px-6 md:px-12 lg:px-16 py-6 md:py-8 lg:py-10 overflow-y-auto">
      <div className={`rounded-3xl bg-gradient-to-br ${theme.softGradient} p-5 md:p-7 lg:p-9 mb-5 md:mb-6 flex flex-col md:flex-row items-center gap-5 md:gap-8 shadow-sm flex-shrink-0`}>
        <div className="text-5xl md:text-6xl lg:text-7xl flex-shrink-0">&#x1F9E0;</div>
        <div className="flex-1 text-center md:text-left">
          <p className={`text-sm md:text-base lg:text-lg font-bold ${theme.textAccentMuted} mb-1 md:mb-2 uppercase tracking-wider`}>
            Check-in {qIdx + 1} of {qs.length} &middot; Day {stampNumber}
          </p>
          <h2 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-slate-800 leading-tight">
            {q.question}
          </h2>
        </div>
      </div>

      <div className={`grid gap-4 md:gap-6 lg:gap-8 w-full ${q.options.length === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'} flex-1 items-stretch min-h-0`}>
        {q.options.map((opt, oi) => {
          const isThis = selected === oi;
          const showCorrect = selected !== null && opt.isCorrect;
          const showWrong = isThis && !opt.isCorrect;
          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              className={`flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 px-6 md:px-8 py-6 md:py-8
                rounded-3xl border-2 transition-all duration-200 font-bold select-none
                text-2xl md:text-3xl lg:text-4xl xl:text-5xl
                ${showCorrect
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 text-green-700 scale-[1.02] shadow-xl'
                  : showWrong
                    ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100 text-red-600'
                    : selected !== null
                      ? 'border-slate-200 bg-slate-50 text-slate-400'
                      : `border-slate-200 bg-white text-slate-700 ${theme.cardHoverBorder} hover:shadow-lg hover:scale-[1.02] shadow-sm`}`}
            >
              {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-16 h-16 md:w-20 md:h-20 lg:w-28 lg:h-28 object-contain flex-shrink-0" />}
              <span>{opt.label}</span>
              {showCorrect && <Check className="w-8 h-8 md:w-10 md:h-10 text-green-500 md:ml-auto" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Certificate — stamp progress + gated Reading-Champion award ────────────
// Each calendar day's first completion earns one stamp, up to MAX_STAMPS (5).
// Stamps 1-2 are free warm-ups; stamps 3-5 gate on a 2-question check-in
// from the book's existing quiz pool. Passing all three check-ins unlocks
// a "Ready to Move Up!" confirmation on the champion certificate — the
// signal parents and teachers need to know the child is actually fluent
// at this level, not just rushing through.

function CertificatePage({ page, level, bookId, quizQuestions }: { page: Extract<InteractivePage, { type: 'certificate' }>; level: number; bookId: string; quizQuestions: QuizQuestion[] }) {
  const theme = getTheme(level);
  const [stampState, setStampState] = useState<BookStamps>(() => getStamps(bookId));
  const [awardedNow, setAwardedNow] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const hasInitialised = useRef(false);

  // Phase: 'checking' shows the CheckInPhase first; 'done' shows the
  // certificate. For stamps 1-2 (or when check-in isn't applicable),
  // we go straight to 'done'.
  const initialGate = useRef(needsCheckIn(bookId) && quizQuestions.length >= 1);
  const [phase, setPhase] = useState<'checking' | 'done'>(initialGate.current ? 'checking' : 'done');

  const awardAndCelebrate = useCallback((checkInPassed?: boolean) => {
    const result = awardStamp(bookId, checkInPassed !== undefined ? { checkInPassed } : undefined);
    setStampState(result.state);
    setAwardedNow(result.awardedNow);
    setPhase('done');
    if (result.awardedNow) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [bookId]);

  useEffect(() => {
    // Guard against double-award in StrictMode / page revisit within same mount
    if (hasInitialised.current) return;
    hasInitialised.current = true;
    // If there's no check-in gate, award immediately
    if (!initialGate.current) awardAndCelebrate();
  }, [awardAndCelebrate]);

  // ── Phase 1: readiness check-in ───────────────────────────────────────
  if (phase === 'checking') {
    const nextStamp = Math.min(MAX_STAMPS, stampState.count + 1);
    return (
      <CheckInPhase
        questions={quizQuestions}
        theme={theme}
        stampNumber={nextStamp}
        onComplete={(passed) => awardAndCelebrate(passed)}
      />
    );
  }

  // ── Phase 2: stamp progress / champion certificate ────────────────────
  const isChampion = stampState.count >= MAX_STAMPS;
  const readyToMoveUp = isReadyToMoveUp(stampState);
  const confettiCount = isChampion ? 30 : 14;
  const title = isChampion ? 'Reading Champion!'
    : awardedNow ? 'Great Reading!'
    : 'Already Read Today';
  const emoji = isChampion ? '\u{1F3C6}' : awardedNow ? '\u{1F389}' : '\u{1F4DA}';

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 md:px-8 lg:px-12 py-3 md:py-4 text-center relative overflow-hidden">
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <div key={i} className="absolute w-3 h-3 md:w-4 md:h-4 rounded-sm animate-bounce"
              style={{ left: `${Math.random()*100}%`, top: `${Math.random()*80}%`,
                backgroundColor: ['#e91e63','#2196f3','#4caf50','#ff9800','#9c27b0','#ffeb3b'][i%6],
                animationDelay: `${Math.random()*1.5}s`, animationDuration: `${1+Math.random()*2}s`, opacity: 0.8 }} />
          ))}
        </div>
      )}

      <div className={`relative bg-white rounded-3xl border-4 ${isChampion ? 'border-amber-400' : theme.cardBorderActive}
        p-5 md:p-7 lg:p-9 shadow-2xl max-w-3xl w-full flex flex-col items-center gap-3 md:gap-4`}>

        <div className="text-4xl md:text-5xl lg:text-6xl">{emoji}</div>
        <h1 className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold ${isChampion ? 'text-amber-600' : theme.textAccent}`}>
          {title}
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl font-bold italic text-slate-700 px-4">{page.bookTitle}</p>

        {/* ── Stamp row ── */}
        <div className="flex items-end gap-2 md:gap-3 lg:gap-4 mt-1">
          {Array.from({ length: MAX_STAMPS }).map((_, i) => {
            const earned = i < stampState.count;
            const justEarned = awardedNow && i === stampState.count - 1;
            const stampNum = i + 1;
            const checkInPassed = stampState.checkInResults[stampNum];
            return (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`relative w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 rounded-full flex items-center justify-center transition-all duration-300
                  ${earned
                    ? `bg-gradient-to-br ${theme.heroBgActive} shadow-xl ${justEarned ? 'ring-4 ring-amber-300 scale-110' : ''}`
                    : 'border-2 border-dashed border-slate-300 bg-slate-50'}`}>
                  {earned ? (
                    <Star className={`w-6 h-6 md:w-8 md:h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 text-white fill-white drop-shadow ${justEarned ? 'animate-pulse' : ''}`} />
                  ) : (
                    <span className="text-base md:text-xl lg:text-2xl font-bold text-slate-300">{stampNum}</span>
                  )}
                  {/* Check-in indicator — small green tick or red X in the corner for stamps 3+ */}
                  {earned && stampNum >= 3 && checkInPassed !== undefined && (
                    <span
                      className={`absolute -top-1 -right-1 md:-top-1.5 md:-right-1.5 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center text-xs font-bold shadow
                        ${checkInPassed ? 'bg-green-500 text-white' : 'bg-amber-400 text-white'}`}
                      title={checkInPassed ? 'Check-in passed' : 'Check-in — keep practising'}
                    >
                      {checkInPassed ? '\u2713' : '\u2715'}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] md:text-xs font-medium ${earned ? 'text-slate-600' : 'text-slate-300'}`}>
                  Day {stampNum}
                </span>
              </div>
            );
          })}
        </div>

        {isChampion && readyToMoveUp && (
          <div className="flex items-center gap-2 px-3 md:px-5 py-1.5 md:py-2 rounded-full bg-gradient-to-r from-amber-200 to-amber-300 border-2 border-amber-400 shadow-lg">
            <span className="text-xl md:text-2xl">&#x1F680;</span>
            <span className="text-sm md:text-base lg:text-lg font-bold text-amber-800">Ready to Move Up!</span>
          </div>
        )}

        <div className="max-w-xl">
          {isChampion && readyToMoveUp ? (
            <p className="text-base md:text-lg lg:text-xl font-bold text-amber-700">
              5 reads, 3 check-ins passed. You've really mastered this book!
            </p>
          ) : isChampion ? (
            <p className="text-base md:text-lg lg:text-xl font-bold text-amber-700">
              5 reads complete! A few more reads at this level will build real fluency.
            </p>
          ) : awardedNow ? (
            <p className="text-sm md:text-base lg:text-lg text-slate-600">
              Stamp <span className={`font-bold ${theme.textAccent}`}>{stampState.count} of {MAX_STAMPS}</span> unlocked!
              Come back tomorrow for stamp {stampState.count + 1}.
            </p>
          ) : (
            <p className="text-sm md:text-base lg:text-lg text-slate-600">
              You've already earned today's stamp &mdash; great work!
              Come back tomorrow for stamp {stampState.count + 1}.
            </p>
          )}
        </div>

        <div className="border-t-2 border-dashed border-slate-200 pt-2 w-full max-w-sm">
          <p className="text-xs text-slate-400">MyPhonicsBooks</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Reader ────────────────────────────────────────────────────────────

interface InteractiveBookReaderProps { book: Book; onClose: () => void; onFinish: () => void; }
const levelColors: Record<number, string> = { 1:'bg-level-1', 2:'bg-level-2', 3:'bg-level-3', 4:'bg-level-4', 5:'bg-level-5', 6:'bg-level-6' };
const SWIPE_THRESHOLD = 50;

export default function InteractiveBookReader({ book, onClose, onFinish }: InteractiveBookReaderProps) {
  const pages = INTERACTIVE_BOOKS[book.subLevel] ?? [];
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const totalPages = pages.length;
  const levelBg = levelColors[book.level] || 'bg-primary';
  const updateProgress = useUpdateReadingProgress();

  // Persist reading progress whenever the page changes.
  useEffect(() => {
    updateProgress.mutate({
      bookId: book.id,
      lastPageRead: currentPage + 1,
      completed: currentPage === totalPages - 1,
    });
    // updateProgress is stable (react-query mutation); exclude to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book.id, currentPage, totalPages]);

  const goNext = useCallback(() => { if (currentPage < totalPages - 1) setCurrentPage(p => p + 1); else onFinish(); }, [currentPage, totalPages, onFinish]);
  const goPrev = useCallback(() => { if (currentPage > 0) setCurrentPage(p => p - 1); }, [currentPage]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); goNext(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [goNext, goPrev, onClose]);

  useEffect(() => { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = ''; }; }, []);

  const pageData = pages[currentPage];
  const isCanvasPage = pageData?.type === 'drawing' || pageData?.type === 'writing_practice';

  const handleTouchStart = (e: React.TouchEvent) => { if (isCanvasPage) return; touchStartX.current = e.touches[0].clientX; touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isCanvasPage || touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current, dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_THRESHOLD) { if (dx < 0) goNext(); else goPrev(); }
    touchStartX.current = null; touchStartY.current = null;
  };

  const isFirst = currentPage === 0, isLast = currentPage === totalPages - 1;

  // Quiz questions are pulled once per book so the CertificatePage check-in
  // can sample from the same pool the child already saw during the main read.
  const quizQuestions = (() => {
    const quizPage = pages.find((q): q is Extract<InteractivePage, { type: 'quiz' }> => q.type === 'quiz');
    return quizPage?.questions ?? [];
  })();

  const renderPage = () => {
    const p = pages[currentPage]; if (!p) return null;
    const fs = book.focusSounds;
    switch (p.type) {
      case 'cover': return <CoverPage page={p} level={book.level} />;
      case 'sound_grid': return <SoundGridPage page={p} level={book.level} />;
      case 'vocab_preview': return <VocabPreviewPage page={p} level={book.level} />;
      case 'story': return <StoryPage page={p} focusSounds={fs} level={book.level} />;
      case 'sound_spotlight': return <SoundSpotlightPage page={p} level={book.level} />;
      case 'word_reading': return <WordReadingPage page={p} focusSounds={fs} level={book.level} />;
      case 'tricky_words': return <TrickyWordsPage page={p} />;
      case 'writing_practice': return <WritingPracticePage page={p} />;
      case 'drawing': return <DrawingCanvas prompt={p.prompt} />;
      case 'nonsense_words': return <NonsenseWordsPage page={p} focusSounds={fs} />;
      case 'story_ordering': return <StoryOrderingPage page={p} />;
      case 'quiz': return <QuizPage page={p} level={book.level} />;
      case 'spelling': return <SpellingPage page={p} level={book.level} />;
      case 'grammar':
        if (p.variant === 'word_order') return <GrammarWordOrderPage page={p} level={book.level} />;
        return null;
      case 'certificate': return <CertificatePage page={p} level={book.level} bookId={book.subLevel} quizQuestions={quizQuestions} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-amber-50 flex flex-col" style={{ ...ANDIKA, isolation: 'isolate' }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <div className={`flex items-center justify-between px-4 py-2 ${levelBg} z-10 shrink-0`}>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30" aria-label="Close book">
          <X className="w-5 h-5 text-white" />
        </button>
        <h2 className="text-white font-semibold text-base truncate max-w-[240px]">{book.title}</h2>
        <span className="text-white/80 text-sm font-medium min-w-[50px] text-right">{currentPage + 1} / {totalPages}</span>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {renderPage()}
        {!isFirst && <button onClick={goPrev} className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg items-center justify-center hover:bg-white z-20 hidden md:flex" aria-label="Previous page"><ChevronLeft className="w-6 h-6 text-slate-700" /></button>}
        {!isLast && <button onClick={goNext} className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/70 shadow-lg items-center justify-center hover:bg-white z-20 hidden md:flex" aria-label="Next page"><ChevronRight className="w-6 h-6 text-slate-700" /></button>}
      </div>

      <div className="flex items-center justify-center gap-1 py-2.5 bg-white/90 backdrop-blur-sm shrink-0">
        <button
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Previous page"
          className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-20 mr-2"
        >
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="w-40 md:w-56 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div className={`h-full ${levelBg} rounded-full transition-all duration-300`}
            style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }} />
        </div>
        <span className="text-xs text-slate-400 font-medium ml-2 min-w-[40px]">{currentPage + 1}/{totalPages}</span>
        <button
          onClick={goNext}
          aria-label={isLast ? 'Finish book' : 'Next page'}
          className={`p-2 rounded-lg transition-colors ml-2 ${isLast ? `${levelBg} text-white rounded-xl px-4` : 'hover:bg-slate-100 text-slate-600'}`}
        >
          {isLast ? <span className="text-base font-bold">Finish</span> : <ChevronRight className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
