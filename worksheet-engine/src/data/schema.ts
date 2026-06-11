// ---------------------------------------------------------------------------
// BOOK DATA SCHEMA — the structured input the whole engine reads from.
// One book = one of these. Templates only ever read this; they never invent
// content. To add a book, copy an existing data file and fill this in.
// ---------------------------------------------------------------------------

export type ActivityType =
  | 'trace-sounds'
  | 'sound-spotting'
  | 'match-picture-word'
  | 'sort-by-sound'
  | 'missing-sound'
  | 'sentence-builder'
  | 'draw-and-write'
  | 'read-and-tick'
  | 'cut-and-stick'
  | 'challenge';

/** A word + the clipart key used to find its picture (see public/clipart). */
export interface DecodableWord {
  word: string;
  /** Filename stem in /public/clipart, e.g. "tap" -> /clipart/tap.svg. */
  imageKey: string;
}

/** A bin for the "sort by sound" activity. */
export interface SortBin {
  /** The sound/grapheme the bin collects, e.g. "s". */
  sound: string;
  /** Words (drawn from decodableWords) that belong in this bin. */
  words: string[];
}

export interface BookData {
  bookId: string;            // kebab-case, unique, == data filename stem
  bookTitle: string;         // "Tap! Tap! Tap!"
  level: number;             // 1–8, selects the level theme (NO default)
  levelLabel: string;        // "L1.1"
  levelSubtitle: string;     // "Level 1 · Starting Stories"
  focusSounds: string[];     // ["s","a","t","p","i","n"]
  decodableWords: DecodableWord[];
  trickyWords: string[];
  sentences: string[];
  comprehensionPrompts: string[];
  grammarGoals: string[];
  writingGoals: string[];
  /** Which activity sheets this book ships. Order = pack order. */
  activityTypes: ActivityType[];
  /** Optional per-activity configuration. */
  config?: {
    sortBins?: SortBin[];
    /** Subset of decodableWords (by word) to use on the match sheet. */
    matchWords?: string[];
    /** Words (with clipart) for the "label the picture" write-the-word task. */
    labelWords?: string[];
    /** Words (with clipart) for the read-and-tick "choose the word" task. */
    tickWords?: string[];
    /** Nonsense / "alien" words for the challenge sheet — built ONLY from
     *  sounds taught so far, and never a real English word. Optional: the
     *  challenge template derives a deterministic set if this is omitted. */
    alienWords?: string[];
  };
}
