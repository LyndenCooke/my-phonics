/**
 * Object bank + round builder for Sound Spotter — the hidden-object game.
 *
 * Every entry is a picturable thing: the child sees the PICTURE scattered
 * in the scene and must decide whether its word hides the target sound.
 * Matching is phonics-true: a word only counts for a sound when the
 * green-words ledger's grapheme breakdown says the sound is genuinely in
 * it AND its spelling is visible — "fork" has the letter o but not /o/,
 * so it is never an /o/ target.
 *
 * Emoji are the object art: instantly recognisable, consistent across the
 * bank, and each one unambiguously depicts its word (that's the curation
 * rule — if a child would name the picture differently, it's not here).
 */
import type { JourneyLevel } from '@/lib/levels8';
import { JOURNEY_LEVELS } from '@/lib/levels8';
import { displayGrapheme } from '@/lib/soundGameWords';
import { hasAudio, unitsOf } from '@/lib/greenWords';

export interface SafariObject {
  word: string;
  emoji: string;
}

export const SAFARI_OBJECTS: SafariObject[] = [
  { word: 'sun', emoji: '☀️' }, { word: 'sock', emoji: '🧦' }, { word: 'star', emoji: '⭐' },
  { word: 'snake', emoji: '🐍' }, { word: 'seal', emoji: '🦭' }, { word: 'spoon', emoji: '🥄' },
  { word: 'spider', emoji: '🕷️' }, { word: 'strawberry', emoji: '🍓' }, { word: 'snail', emoji: '🐌' },
  { word: 'soap', emoji: '🧼' }, { word: 'saw', emoji: '🪚' }, { word: 'sea', emoji: '🌊' },
  { word: 'scarf', emoji: '🧣' }, { word: 'screw', emoji: '🔩' }, { word: 'snow', emoji: '❄️' },
  { word: 'ship', emoji: '🚢' }, { word: 'shell', emoji: '🐚' }, { word: 'shirt', emoji: '👕' },
  { word: 'shoe', emoji: '👟' }, { word: 'shark', emoji: '🦈' }, { word: 'sheep', emoji: '🐑' },
  { word: 'ant', emoji: '🐜' }, { word: 'apple', emoji: '🍎' }, { word: 'arm', emoji: '💪' },
  { word: 'tap', emoji: '🚰' }, { word: 'tent', emoji: '⛺' }, { word: 'tiger', emoji: '🐯' },
  { word: 'tomato', emoji: '🍅' }, { word: 'train', emoji: '🚂' }, { word: 'tree', emoji: '🌳' },
  { word: 'tooth', emoji: '🦷' }, { word: 'turtle', emoji: '🐢' }, { word: 'toast', emoji: '🍞' },
  { word: 'tractor', emoji: '🚜' }, { word: 'toilet', emoji: '🚽' },
  { word: 'turkey', emoji: '🦃' }, { word: 'thumb', emoji: '👍' },
  { word: 'pig', emoji: '🐷' }, { word: 'pen', emoji: '🖊️' }, { word: 'pan', emoji: '🍳' },
  { word: 'pear', emoji: '🍐' }, { word: 'peach', emoji: '🍑' }, { word: 'pizza', emoji: '🍕' },
  { word: 'pumpkin', emoji: '🎃' }, { word: 'penguin', emoji: '🐧' }, { word: 'paw', emoji: '🐾' },
  { word: 'pie', emoji: '🥧' }, { word: 'paint', emoji: '🎨' }, { word: 'purse', emoji: '👛' },
  { word: 'phone', emoji: '📱' }, { word: 'pin', emoji: '📌' },
  { word: 'nut', emoji: '🥜' }, { word: 'nose', emoji: '👃' }, { word: 'nest', emoji: '🪺' },
  { word: 'night', emoji: '🌃' },
  { word: 'map', emoji: '🗺️' }, { word: 'moon', emoji: '🌙' }, { word: 'mouse', emoji: '🐭' },
  { word: 'monkey', emoji: '🐵' }, { word: 'mushroom', emoji: '🍄' }, { word: 'milk', emoji: '🥛' },
  { word: 'mouth', emoji: '👄' }, { word: 'moose', emoji: '🫎' },
  { word: 'dog', emoji: '🐶' }, { word: 'duck', emoji: '🦆' }, { word: 'drum', emoji: '🥁' },
  { word: 'door', emoji: '🚪' }, { word: 'dolphin', emoji: '🐬' }, { word: 'dragon', emoji: '🐉' },
  { word: 'dress', emoji: '👗' }, { word: 'drink', emoji: '🥤' },
  { word: 'goat', emoji: '🐐' }, { word: 'grapes', emoji: '🍇' }, { word: 'gift', emoji: '🎁' },
  { word: 'girl', emoji: '👧' }, { word: 'guitar', emoji: '🎸' }, { word: 'glasses', emoji: '👓' },
  { word: 'octopus', emoji: '🐙' }, { word: 'orange', emoji: '🍊' }, { word: 'owl', emoji: '🦉' },
  { word: 'onion', emoji: '🧅' }, { word: 'oyster', emoji: '🦪' }, { word: 'oil', emoji: '🛢️' },
  { word: 'cat', emoji: '🐱' }, { word: 'cap', emoji: '🧢' }, { word: 'car', emoji: '🚗' },
  { word: 'cow', emoji: '🐮' }, { word: 'corn', emoji: '🌽' }, { word: 'coin', emoji: '🪙' },
  { word: 'coat', emoji: '🧥' }, { word: 'crab', emoji: '🦀' }, { word: 'crown', emoji: '👑' },
  { word: 'cloud', emoji: '☁️' }, { word: 'clock', emoji: '⏰' }, { word: 'chick', emoji: '🐤' },
  { word: 'cheese', emoji: '🧀' }, { word: 'cherry', emoji: '🍒' }, { word: 'chair', emoji: '🪑' },
  { word: 'candle', emoji: '🕯️' }, { word: 'cake', emoji: '🎂' }, { word: 'camel', emoji: '🐫' },
  { word: 'carrot', emoji: '🥕' }, { word: 'crayon', emoji: '🖍️' }, { word: 'circle', emoji: '⭕' },
  { word: 'chain', emoji: '⛓️' }, { word: 'cowboy', emoji: '🤠' },
  { word: 'kite', emoji: '🪁' }, { word: 'key', emoji: '🗝️' }, { word: 'king', emoji: '🤴' },
  { word: 'koala', emoji: '🐨' }, { word: 'knife', emoji: '🔪' }, { word: 'knot', emoji: '🪢' },
  { word: 'kangaroo', emoji: '🦘' },
  { word: 'egg', emoji: '🥚' }, { word: 'elephant', emoji: '🐘' }, { word: 'ear', emoji: '👂' },
  { word: 'umbrella', emoji: '☂️' }, { word: 'unicorn', emoji: '🦄' },
  { word: 'rat', emoji: '🐀' }, { word: 'ring', emoji: '💍' }, { word: 'rain', emoji: '🌧️' },
  { word: 'rocket', emoji: '🚀' }, { word: 'rabbit', emoji: '🐇' }, { word: 'robot', emoji: '🤖' },
  { word: 'rainbow', emoji: '🌈' },
  { word: 'hat', emoji: '🎩' }, { word: 'hen', emoji: '🐔' }, { word: 'house', emoji: '🏠' },
  { word: 'heart', emoji: '❤️' }, { word: 'horse', emoji: '🐴' }, { word: 'hammer', emoji: '🔨' },
  { word: 'hand', emoji: '✋' },
  { word: 'bus', emoji: '🚌' }, { word: 'bed', emoji: '🛏️' }, { word: 'ball', emoji: '⚽' },
  { word: 'bee', emoji: '🐝' }, { word: 'bird', emoji: '🐦' }, { word: 'boat', emoji: '⛵' },
  { word: 'book', emoji: '📖' }, { word: 'boot', emoji: '🥾' }, { word: 'bell', emoji: '🔔' },
  { word: 'banana', emoji: '🍌' }, { word: 'balloon', emoji: '🎈' }, { word: 'butterfly', emoji: '🦋' },
  { word: 'bridge', emoji: '🌉' }, { word: 'bear', emoji: '🐻' }, { word: 'beach', emoji: '🏖️' },
  { word: 'badge', emoji: '📛' }, { word: 'boy', emoji: '👦' }, { word: 'burger', emoji: '🍔' },
  { word: 'broom', emoji: '🧹' }, { word: 'bath', emoji: '🛁' },
  { word: 'fox', emoji: '🦊' }, { word: 'fish', emoji: '🐟' }, { word: 'frog', emoji: '🐸' },
  { word: 'fire', emoji: '🔥' }, { word: 'fork', emoji: '🍴' }, { word: 'feet', emoji: '🦶' },
  { word: 'flower', emoji: '🌸' }, { word: 'flag', emoji: '🚩' },
  { word: 'leg', emoji: '🦵' }, { word: 'lion', emoji: '🦁' }, { word: 'leaf', emoji: '🍃' },
  { word: 'lemon', emoji: '🍋' }, { word: 'light', emoji: '💡' }, { word: 'ladder', emoji: '🪜' },
  { word: 'lock', emoji: '🔒' },
  { word: 'jellyfish', emoji: '🪼' }, { word: 'juice', emoji: '🧃' },
  { word: 'jeep', emoji: '🚙' },
  { word: 'van', emoji: '🚐' }, { word: 'volcano', emoji: '🌋' }, { word: 'violin', emoji: '🎻' },
  { word: 'web', emoji: '🕸️' }, { word: 'watch', emoji: '⌚' }, { word: 'worm', emoji: '🪱' },
  { word: 'whale', emoji: '🐳' }, { word: 'wheel', emoji: '🛞' }, { word: 'wheat', emoji: '🌾' },
  { word: 'water', emoji: '💧' },
  { word: 'box', emoji: '📦' }, { word: 'yarn', emoji: '🧶' }, { word: 'zebra', emoji: '🦓' },
  { word: 'queen', emoji: '👸' }, { word: 'question', emoji: '❓' }, { word: 'skunk', emoji: '🦨' },
];

export interface SafariItem extends SafariObject {
  isTarget: boolean;
  /** Layout slot, filled by the component. */
  x: number;
  y: number;
  size: number;
  rot: number;
  found: boolean;
}

export interface SafariRound {
  /** The grapheme being hunted (gpcs naming). */
  target: string;
  /** One target word to say aloud — "like in 'ship'". */
  example: string;
  items: Omit<SafariItem, 'x' | 'y' | 'size' | 'rot' | 'found'>[];
  targetCount: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Phonics-true membership: does this object's word GENUINELY contain the
 * sound g? Uses the green-words ledger's grapheme breakdown when the word
 * is in it (so "fork" never counts for /o/ and "face" never for /c/).
 * A bank word missing from the ledger can still be a DECOY, but is only
 * ever a TARGET when the ledger vouches for it — plus the spelling must
 * be visible in the word (the child reads what they tapped).
 */
function hasSound(g: string, word: string): boolean {
  const shown = displayGrapheme(g);
  const u = unitsOf(word);
  if (!u) return false;
  return (u.includes(g) || u.includes(shown)) && word.includes(shown);
}

/** Safe decoy: neither the ledger nor the spelling suggests the sound. */
function lacksSound(g: string, word: string): boolean {
  const shown = displayGrapheme(g);
  const u = unitsOf(word);
  if (u && (u.includes(g) || u.includes(shown))) return false;
  return !word.includes(shown);
}

const SCENE_SIZE = 12;
const MAX_TARGETS = 4;
const MIN_TARGETS = 2;

/** Graphemes taught at or below this level that at least MIN_TARGETS
 *  bank objects contain (by spelling). Split digraphs excluded — "a-e"
 *  can't be spotted as one contiguous spelling. */
export function safariTargetsFor(level: JourneyLevel): string[] {
  const taught: string[] = [];
  for (const l of JOURNEY_LEVELS) {
    if (l.level > level.level) break;
    taught.push(...l.gpcs);
  }
  return taught.filter(g => {
    if (g.includes('-') && !g.startsWith('-')) return false;
    return SAFARI_OBJECTS.filter(o => hasSound(g, o.word) && hasAudio(o.word)).length >= MIN_TARGETS;
  });
}

/**
 * Build N seek-and-find rounds. Prefer the level's own sounds as targets,
 * padding with earlier ones; decoys are objects whose word does NOT
 * contain the target spelling (so no tap is ever secretly right).
 */
export function buildSafariRounds(level: JourneyLevel, count: number): SafariRound[] {
  const all = safariTargetsFor(level);
  if (all.length === 0) return [];
  const own = all.filter(g => level.gpcs.includes(g));
  const ordered = [...shuffle(own), ...shuffle(all.filter(g => !own.includes(g)))];

  const rounds: SafariRound[] = [];
  for (let i = 0; i < count; i++) {
    const target = ordered[i % ordered.length];
    const hits = shuffle(SAFARI_OBJECTS.filter(o => hasSound(target, o.word) && hasAudio(o.word)));
    const targets = hits.slice(0, Math.min(MAX_TARGETS, hits.length));
    // Decoys speak their word when tapped, so they must be voiced too —
    // an unrecorded decoy would be the one place TTS could sneak back in.
    const decoys = shuffle(SAFARI_OBJECTS.filter(o => lacksSound(target, o.word) && hasAudio(o.word)))
      .slice(0, SCENE_SIZE - targets.length);
    rounds.push({
      target,
      example: targets[0].word,
      targetCount: targets.length,
      items: shuffle([
        ...targets.map(o => ({ ...o, isTarget: true })),
        ...decoys.map(o => ({ ...o, isTarget: false })),
      ]),
    });
  }
  return rounds;
}
