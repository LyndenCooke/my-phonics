// ---------------------------------------------------------------------------
// GRAMMAR-UNIT SCHEMA (v3) — input for ONE grammar worksheet.
//
// The renderer draws ONLY what is written here, never inventing content. Grammar
// booklets are bound — there are no cut-out activities; every sort is a write-in
// / tick / draw-a-line.
//
// Every unit follows I do · We do · You do:
//   - s1 (the "Watch first" box) is the modelled example, shown worked.
//   - the first `weDoCount` rows are lightly scaffolded ("We do").
//   - the remaining rows are independent ("You do").
//   - `apply` is the one-line independent task at the foot.
//
// All example text is decodable at its level (sounds/tricky words taught at or
// before that level), sits in the level sentence band (6–12 words at L6), and is
// anchored to a level book. British English throughout, no em dashes, no bold.
//
// --- v2 → v3 deltas (grammar_schema_changes.md) ----------------------------
// All new fields are OPTIONAL so the v2 data files (l1–l5, l7, l8) keep
// compiling unchanged. Only l6.ts is authored to the full v3 shape.
//   - s1.exampleLayout: "inline" | "stacked"  (renderer defaults inline + a
//     width-based auto-fallback to stacked when an inline line would overflow).
//   - s1.note redefined: the optional terminology line, rendered at INSTRUCTION
//     size in ink inside the Watch-first box — never small, never grey.
//   - apply.lines: ruled lines under the apply prompt (default 3).
//   - decorations[].rotationDeg.
//   - per-format rowWriteLines (build 1, rewrite 2).
//   - tickgrid.categories: the fixed enum (Statement/Question/Command/Exclamation).
//   - new format `review` + payload (reuses approved rows by pointer only).
//   - GrammarBookletMeta drives cover / contents / how-to / answers.
// ---------------------------------------------------------------------------

export type GrammarFormat =
  | 'tickgrid' // tick one column per row (replaces the old cut-and-sort)
  | 'build' // build a longer phrase from a word bank
  | 'cloze' // write the missing joining word from a bank
  | 'circle' // mark target word classes in a sentence
  | 'match' // draw a line between two columns
  | 'rewrite' // rewrite and improve a modelled sentence
  | 'review'; // v3 — show-what-you-know, reuses approved rows by pointer only

/** The fixed sentence-kind enum for the tickgrid header (no hint subtitles). */
export const TICKGRID_CATEGORIES = ['Statement', 'Question', 'Command', 'Exclamation'] as const;
export type TickCategory = (typeof TICKGRID_CATEGORIES)[number];

export interface GrammarDecoration {
  /** Line-art asset id: owl, owlets, branch, leaf, moon, purse, glue, cup, cat,
   *  bird, card, rug, monkey and similar. Drawn only if its clipart exists.
   *  ALWAYS full opacity — ghosted/watermark art is banned at any opacity, so
   *  there is deliberately no opacity field. */
  key: string;
  xMm: number;
  yMm: number;
  /** 16 to 22 mm tall, consistent and generous, never shrunk to fit. */
  sizeMm: number;
  rotationDeg?: number;
}

// --- v3 art direction (grammar_aesthetic_direction.md) ----------------------

/** A named RESERVED ZONE. Art lives only inside a zone the layout component
 *  itself reserves — content cannot enter it and art cannot leave it. There is
 *  deliberately NO coordinate-based placement in unit data: a unit names a zone
 *  and an asset, the layout owns the geometry, so art-over-content is
 *  structurally impossible. */
export type IllustrationPattern =
  | 'footScene' // the reserved full-width foot band BELOW the apply block
  | 'rowArt' // the reserved per-row art column (see rowArt[])
  | 'applyRail'; // the reserved right-rail column BESIDE the apply lines

/** The focal illustration for a page. The renderer draws the named asset (one
 *  pre-composed scene or character image) inside its reserved zone; it carries
 *  no new decodable text (the no-invent rule holds). */
export interface PageIllustration {
  pattern: IllustrationPattern;
  /** ONE asset key from the approved manifest (footScene/applyRail). The rowArt
   *  pattern lists its per-row keys in `rowArt` instead. */
  assets: string[];
  /** short note tying the art to the page content. */
  relatesTo: string;
}

export type CheckItem = 'capitalLetter' | 'fingerSpaces' | 'fullStop';

// NOTE: there is deliberately NO background/watermark art model. Per
// worksheet-design SKILL.md §1.2, no illustration may sit behind text, lines,
// tick boxes, chips, word banks or the grid at any opacity. Art lives only in
// reserved zones: the foot band, the right rail, a per-row art column, or a
// drawn writing container.

interface GrammarUnitBase {
  /** URL-safe id used in the print route + PDF filename, e.g. "g-l6-3". */
  id: string;
  /** Display code from the scheme, e.g. "G-L6.3". */
  code: string;
  /** 1–8, selects the level theme (NO default — getLevelTheme throws). */
  level: number;
  /** First header pill on the boxed strand, e.g. "L6". (Unused by flowy chrome.) */
  levelLabel: string;
  /** Strand, always "Grammar" here. */
  strand: string;
  /** Caption suffix, e.g. "Level 6 · Building Fluency". */
  levelSubtitle: string;
  /** Header-bar title — the sheet topic. */
  name: string;
  /** The doing instruction (one line, warm, child-facing). */
  doInstruction: string;
  /** Child-facing goal. */
  objective: string;
  /** National Curriculum link, e.g. "Year 2 · sentence". */
  ncLink: string;
  /** Statutory terminology this unit names with the child. */
  terminology: string[];
  /** The level book this sheet is anchored to (provenance). */
  anchorBook: string;
  /** v3: the level GPCs these sentences revisit (provenance; not a text tier). */
  soundsRevisited?: string;
  /** v3 (legacy): decorative line-art objects in white space. Superseded by
   *  `illustration` (the composition pattern). Kept for the levels still on the
   *  decoration model; if `illustration` is set it takes precedence. */
  decorations?: GrammarDecoration[];
  /** v3 art direction: the page's focal composition (foot scene, row art,
   *  writing frame or an anchored character). */
  illustration?: PageIllustration;
  /** rowArt pattern only: one asset key per activity row (overrides per-row
   *  icons). */
  rowArt?: string[];
  /** small line-art accents in the Watch-first box's reserved right rail (e.g.
   *  the owl beside "the big brown owl"). Max two keys; drawn only when the
   *  approved art exists, never behind the example text. */
  watchArt?: string[];
  /** the self-check strip above the apply lines (UK terms, instruction size).
   *  Omitted where the page is too tight (the rewrite page for L6). */
  check?: { items: CheckItem[] };
  /** The modelled "I do" example (shown worked in the Watch-first box). */
  s1: {
    prompt: string;
    answer: string;
    /** v3: optional terminology line, rendered at INSTRUCTION size in ink inside
     *  the Watch-first box. Never small, never grey. Only when a statutory term
     *  must be named (e.g. the exclamation rule). */
    note?: string;
    /** v3: inline (short, centred arrow) or stacked (full-sentence rewrite).
     *  Optional; the renderer defaults inline and auto-falls-back to stacked when
     *  the inline width would overflow the usable Watch-first width (182 mm). */
    exampleLayout?: 'inline' | 'stacked';
    /** v2 (retained, unused by the flowy chrome): tiny scaffold chips. */
    tags?: { prompt?: string; answer?: string };
    /** v2 (retained): optional on-task picture key after the worked answer. */
    image?: string;
  };
  /** How many leading rows are tagged "We do". */
  weDoCount: number;
  /** The independent apply task — one full instruction sentence, e.g.
   *  "Now you write a command about the owl." */
  apply?: {
    prompt: string;
    /** ruled lines under the apply prompt, default 3. */
    lines?: number;
  };
  format: GrammarFormat;
}

// --- Format payloads -------------------------------------------------------

/** G-L6.1 — tick the kind each sentence is. */
export interface TickGridUnit extends GrammarUnitBase {
  format: 'tickgrid';
  tickgrid: {
    /** v2: the column labels. v3 sheets set these to TICKGRID_CATEGORIES. */
    columns: string[];
    /** v3: the fixed enum, if set the renderer prefers it over `columns`. */
    categories?: readonly TickCategory[];
    rows: { text: string; answer: string }[]; // answer === a column label
  };
}

/** G-L6.2 — expand a base phrase using describing words from a bank. */
export interface BuildUnit extends GrammarUnitBase {
  format: 'build';
  build: {
    wordBank: string[];
    /** v3: one long ruled line per row, after the arrow. Default 1. */
    rowWriteLines?: number;
    // base "the owl" → answer "the big brown owl"; `icon` = optional on-task
    // clipart key, rendered beside the row only when the art exists.
    rows: { base: string; answer: string; icon?: string }[];
  };
}

/** G-L6.3 / G-L6.4 — write the joining word that fills the gap. */
export interface ClozeUnit extends GrammarUnitBase {
  format: 'cloze';
  cloze: {
    wordBank: string[];
    /** v2 (retained, no longer rendered): the small bank note. The v3 spec drops
     *  the bank subtitle, so the renderer ignores this. */
    bankNote?: string;
    /** before <26mm gap> after — the gap position only, no inline hint. */
    rows: { before: string; after: string; answer: string; icon?: string }[];
  };
}

/** G-L6.5 — mark the target word classes inside each sentence. */
export interface CircleUnit extends GrammarUnitBase {
  format: 'circle';
  circle: {
    /** Two marks max for B/W print: circle / underline. */
    targets: { label: string; mark: 'circle' | 'underline' }[];
    rows: { text: string; finds: { word: string; target: string }[]; icon?: string }[];
  };
}

/** G-L6.6 — draw a line from each item on the left to its short form. */
export interface MatchUnit extends GrammarUnitBase {
  format: 'match';
  match: {
    /** left → right is the correct mapping. */
    pairs: { left: string; right: string }[];
    /** v3: the exact print order of the right (short-form) column, shuffled so
     *  the join is a real task. If omitted the renderer rotates the rights. */
    rightShuffled?: string[];
  };
}

/** G-L6.7 — rewrite a modelled sentence correctly. */
export interface RewriteUnit extends GrammarUnitBase {
  format: 'rewrite';
  rewrite: {
    /** v3: two ruled lines per row, below the source strip. Default 2. */
    rowWriteLines?: number;
    rows: { text: string; answer: string; icon?: string }[];
  };
}

/** v3 — Show what you know. Reuses approved rows from the seven units by
 *  pointer (sourceUnit + rowRef); it carries NO new decodable text. The display
 *  sentence is resolved from the source unit at render time. */
export interface ReviewUnit extends GrammarUnitBase {
  format: 'review';
  review: {
    items: {
      /** the unit code the item is reused from, e.g. "G-L6.1". */
      sourceUnit: string;
      /** short task label, e.g. "Tick the kind". */
      task: string;
      /** which approved row to reuse (0-based index into that unit's rows/pairs). */
      rowRef: number;
      /** the answer (already approved in the source unit). */
      answer: string;
    }[];
  };
}

export type GrammarUnit =
  | TickGridUnit
  | BuildUnit
  | ClozeUnit
  | CircleUnit
  | MatchUnit
  | RewriteUnit
  | ReviewUnit;

// --- Booklet-level meta -----------------------------------------------------

/** Drives the front and back matter so the print route holds no copy. One per
 *  level, exposed alongside the units in `grammarRegistry`. The booklet ends on
 *  Answers — there is no certificate page. */
export interface GrammarBookletMeta {
  level: number;
  /** the scheme label, e.g. "Building Fluency". */
  levelLabel: string;
  /** the four-item skill subtitle on the cover. */
  coverSkills: string[];
  /** the how-this-pack-works steps (I do, We do, You do). */
  howTo: { title: string; body: string }[];
  /** the accent closing line, e.g. "Say it. Tap it. Write it. Check it." */
  howToClosing: string;
  /** the body line under the closing line on the how-to page. */
  howToNote?: string;
  /** the review unit id (page 11). */
  reviewUnitId: string;
}
