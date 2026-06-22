// Interactive Sound Book decks — render through the SAME InteractiveBookReader
// as the storybooks (so identical quality), composed from the existing page
// types. One deck per single-grapheme Sound Book. Keyed by the SoundBook id
// (used as the synthetic Book.subLevel) so the reader's INTERACTIVE_BOOKS lookup
// finds it. See src/school/components/SoundBookSlides.tsx for how it launches.

import type { InteractivePage, StoryWord, SpotlightItem, QuizQuestion } from './interactiveBookData';

export interface SoundBookSpec {
  id: string;          // SoundBook id, e.g. "SD-L1.01" (becomes Book.subLevel)
  grapheme: string;    // focus sound, e.g. "s"
  level: number;
  title: string;       // e.g. "Sound Book: s"
  coverImage: string;  // /clipart or /images path
  words: string[];     // 4 featured words that have /images/words/<word>.png
}

const img = (w: string) => `/images/words/${w}.png`;
const phonemes = (w: string) => w.split('');                 // L1 = single-letter graphemes
const focusIndex = (w: string, g: string) => Math.max(0, w.indexOf(g));

function spotlightItems(words: string[], g: string): SpotlightItem[] {
  return words.map((w) => ({ word: w, imageUrl: img(w), focusIndex: focusIndex(w, g) }));
}

function storyWords(words: string[]): StoryWord[] {
  return words.map((w) => ({ display: w, word: w, phonemes: phonemes(w) }));
}

// "Which one says 'X'?" — picture multiple-choice, distractors from the same book.
function listenAndChoose(words: string[]): QuizQuestion[] {
  const pick = words.slice(0, 3);
  return pick.map((correct, i) => {
    const distractors = words.filter((w) => w !== correct).slice(0, 2);
    const options = [correct, ...distractors]
      .map((w, j) => ({ label: w, imageUrl: img(w), isCorrect: w === correct, _r: (i * 7 + j * 3) % 5 }))
      .sort((a, b) => a._r - b._r)
      .map(({ label, imageUrl, isCorrect }) => ({ label, imageUrl, isCorrect }));
    return { question: `Which one says “${correct}”?`, options };
  });
}

export function buildSoundBookDeck(spec: SoundBookSpec): InteractivePage[] {
  const { grapheme: g, level, title, coverImage, words } = spec;
  const allSounds = ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'];
  return [
    { type: 'cover', title, subtitle: `Level ${level} · Sound Book`, imageUrl: coverImage },
    { type: 'sound_grid', focusSounds: [g], allSounds },
    { type: 'sound_spotlight', sound: g, items: spotlightItems(words, g) },
    { type: 'vocab_preview', words: storyWords(words) },
    { type: 'word_reading', words: storyWords(words) },
    { type: 'spelling', words: words.slice(0, 4).map((w) => ({ word: w, imageUrl: img(w), letters: phonemes(w) })) },
    { type: 'quiz', questions: listenAndChoose(words) },
    { type: 'writing_practice', letters: [g] },
    { type: 'certificate', bookTitle: title },
  ];
}

// L1 SATPIN→MDGO. Each word here has a /images/words/<word>.png (verified).
const L1_SPECS: SoundBookSpec[] = [
  { id: 'SD-L1.01', grapheme: 's', level: 1, title: 'Sound Book: s', coverImage: '/clipart/level_1/s_sit.png', words: ['sun', 'sock', 'six', 'sad'] },
  { id: 'SD-L1.02', grapheme: 'a', level: 1, title: 'Sound Book: a', coverImage: '/clipart/level_1/a_mat.png', words: ['cat', 'hat', 'map', 'van'] },
  { id: 'SD-L1.03', grapheme: 't', level: 1, title: 'Sound Book: t', coverImage: '/clipart/level_1/t_tap.png', words: ['tap', 'tin', 'ten', 'tub'] },
  { id: 'SD-L1.04', grapheme: 'p', level: 1, title: 'Sound Book: p', coverImage: '/clipart/level_1/p_pat.png', words: ['pig', 'pan', 'pin', 'peg'] },
  { id: 'SD-L1.05', grapheme: 'i', level: 1, title: 'Sound Book: i', coverImage: '/clipart/level_1/i_fin.png', words: ['fin', 'bin', 'dig', 'zip'] },
  { id: 'SD-L1.06', grapheme: 'n', level: 1, title: 'Sound Book: n', coverImage: '/clipart/level_1/n_nap.png', words: ['net', 'nap', 'nut', 'nod'] },
  { id: 'SD-L1.07', grapheme: 'm', level: 1, title: 'Sound Book: m', coverImage: '/clipart/level_1/m_mud.png', words: ['mat', 'mop', 'mug', 'mud'] },
  { id: 'SD-L1.08', grapheme: 'd', level: 1, title: 'Sound Book: d', coverImage: '/clipart/level_1/d_dog.png', words: ['dog', 'dip', 'den', 'dam'] },
  { id: 'SD-L1.09', grapheme: 'g', level: 1, title: 'Sound Book: g', coverImage: '/clipart/level_1/g_bag.png', words: ['gas', 'gap', 'gum', 'gig'] },
  { id: 'SD-L1.10', grapheme: 'o', level: 1, title: 'Sound Book: o', coverImage: '/clipart/level_1/o_fox.png', words: ['hot', 'log', 'cot', 'mop'] },
];

export const SOUND_BOOK_SPECS: SoundBookSpec[] = [...L1_SPECS];

export const SOUND_BOOK_DECKS: Record<string, InteractivePage[]> = Object.fromEntries(
  SOUND_BOOK_SPECS.map((s) => [s.id, buildSoundBookDeck(s)]),
);

export const SOUND_BOOK_INTERACTIVE_IDS: ReadonlySet<string> = new Set(SOUND_BOOK_SPECS.map((s) => s.id));
