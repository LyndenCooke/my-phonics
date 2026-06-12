import type { HwLadder } from '@/components/workbook2/W2Skills';

// ---------------------------------------------------------------------------
// W2 LEVEL SPECS — how the approved L6 design flexes per level. The TYPE
// SCALE IS UNIFORM (22pt task text everywhere, the locked calibration); what
// scales is the WRITING: line pitch and handwriting x-height shrink as hands
// grow steadier, page sets thin out at the bottom of the ladder (sound focus)
// and thicken at the top (more grammar, longer writes) — mirroring how the
// reading books carry more challenges at higher levels.
// ---------------------------------------------------------------------------

export interface W2LevelSpec {
  level: number;
  /** write-line pitch in mm (L6 calibration = 11). */
  pitchMm: number;
  /** handwriting model x-height in mm. */
  hwXMm: number;
  /** spelling practise words per book page. */
  practiseWords: number;
  /** spelling test lines (master plan: 4 / 6 / 8 / 8 / 10 / 10 / 10 / 10). */
  testWords: number;
  /** big write lines. */
  bigWriteLines: number;
  /** L1-L3 carry a Sounds page per book (the sound_a pattern, restyled). */
  soundsPage: boolean;
  /** Answer it in a sentence page (from L3). */
  answerIt: boolean;
}

export const W2_LEVEL_SPECS: Record<number, W2LevelSpec> = {
  1: { level: 1, pitchMm: 16, hwXMm: 8, practiseWords: 4, testWords: 4, bigWriteLines: 4, soundsPage: true, answerIt: false },
  2: { level: 2, pitchMm: 15, hwXMm: 8, practiseWords: 5, testWords: 6, bigWriteLines: 4, soundsPage: true, answerIt: false },
  3: { level: 3, pitchMm: 14, hwXMm: 7, practiseWords: 6, testWords: 8, bigWriteLines: 5, soundsPage: true, answerIt: true },
  4: { level: 4, pitchMm: 13, hwXMm: 7, practiseWords: 6, testWords: 8, bigWriteLines: 6, soundsPage: false, answerIt: true },
  5: { level: 5, pitchMm: 12, hwXMm: 6, practiseWords: 6, testWords: 10, bigWriteLines: 7, soundsPage: false, answerIt: true },
  6: { level: 6, pitchMm: 11, hwXMm: 5.5, practiseWords: 6, testWords: 10, bigWriteLines: 9, soundsPage: false, answerIt: true },
  7: { level: 7, pitchMm: 11, hwXMm: 5.5, practiseWords: 6, testWords: 10, bigWriteLines: 10, soundsPage: false, answerIt: true },
  8: { level: 8, pitchMm: 10, hwXMm: 5, practiseWords: 6, testWords: 10, bigWriteLines: 10, soundsPage: false, answerIt: true },
};

// --- generalised book + closing data shapes ----------------------------------

/** A Sounds page (L1-L3): trace the sound(s), trace words, write the missing
 *  sound. All trace content comes from the book's approved word lists. */
export interface SoundsData {
  graphemes: string[];
  /** trace words (clipart drawn beside a word only when approved art exists). */
  words: string[];
  /** missing-sound cards: the word with its hidden grapheme. */
  missing: { word: string; hide: string }[];
}

export interface W2BookData {
  num: number;
  title: string;
  spellPractise: string[];
  /** grammar unit ids in teaching order (may be empty for a revisit book). */
  grammar: string[];
  hold: string[];
  /** dictation sentences (never printed on the page; Answers only). */
  listen: string[];
  questions?: (string | null)[];
  sounds?: SoundsData;
  useGrammar?: { chips: string[]; scene: string; pos?: string };
  bigWrite: { prompt: string; scene: string; pos?: string };
  ladders: HwLadder[];
  /** a revisit book closes with pointer-reused items instead of new grammar. */
  revisit?: SwykGroup[];
}

/** One assessment/revisit task group, items reused by pointer only. */
export interface SwykGroup {
  kind: 'tick' | 'match' | 'build' | 'cloze' | 'rewrite' | 'circle';
  label: string;
  refs: { sourceUnit: string; rowRef: number }[];
}

export interface W2LevelData {
  spec: W2LevelSpec;
  books: W2BookData[];
  swykA: SwykGroup[];
  swykB: { groups: SwykGroup[]; writeTask: string; writeLines: number };
  /** Show-what-you-know answer line for the Answers page (approved answers,
   *  in group order). */
  swykAnswers: string;
  spellings: { title: string; words: string[] }[];
  /** the For grown-ups points (adult-facing). */
  grownUps: { title: string; body: string }[];
}
