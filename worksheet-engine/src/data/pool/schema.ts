// ---------------------------------------------------------------------------
// WORKBOOK POOL SCHEMA — one object per activity page, exactly as the master
// plan defines it (WORKBOOK_MASTER_PLAN.md §1):
//
//   pool: { id, strand, book, slot, editions }
//     id       L{level}.B{book}.{STRAND}{i}   e.g. L6.B1.GR2
//     strand   GR · HW · SP · DI · ST · SW · BW · RV · SWYK · ANS
//     book     home book number (or 'LEVEL' for closing pages)
//     slot     day type + position, e.g. W1-D2 RD, HW-SLOT W1, BLOCK-W6 WO
//     editions A:book — carried by the book's shipped back matter in Edition A
//              A:wb   — binds into the Edition A workbook
//              B:wb   — binds into the Edition B workbook (every pool object)
//
// Each pool object also binds its template (T1-T10), its content source
// pointers and its art slot assignments. Page numbers, contents lines and
// answer-key pagination are ASSEMBLY OUTPUTS (src/lib/workbook.ts) and are
// deliberately not representable here.
//
// Content rules (absolute): approved grammar unit content is referenced by
// unit id and reused verbatim; selected content (LCWC sets, dictation and
// hold-the-sentence sentences, joined-words sets) carries a `source` pointer
// recorded in docs/workbook_plans/L6_SELECTIONS.md; authoring dependencies
// (SW2 questions, big-write pairs, spelling-test lists) render as flagged
// placeholders and are listed in docs/workbook_plans/L6_DEPENDENCIES.md.
// Nothing in this schema can hold invented decodable text without a pointer.
// ---------------------------------------------------------------------------

export type Strand = 'GR' | 'HW' | 'SP' | 'DI' | 'ST' | 'SW' | 'BW' | 'RV' | 'SWYK' | 'ANS';

export type TemplateId = 'T1' | 'T2' | 'T3' | 'T4' | 'T5' | 'T6' | 'T7' | 'T8' | 'T9' | 'T10';

/** Where, in Edition A, this content lives. Every object binds B:wb. */
export interface EditionBinding {
  /** 'book' = carried by the shipped book back matter (provisional, per plan);
   *  'wb' = binds into the Edition A workbook. */
  A: 'book' | 'wb';
  B: 'wb';
}

/** The approved art placements (workbook plan wording). The renderer maps each
 *  onto a RESERVED ZONE of the flowy layout — art cannot leave its zone and
 *  content cannot enter it, so art-over-content stays structurally impossible:
 *    perch         → the apply right rail (self-contained, load-bearing perch)
 *    grounded-foot → the apply rail / foot position with a ground shadow
 *    grounded-box  → the Watch-first box's reserved right rail
 *    bleed-*       → reserved edge band (none planned at L6; kept for the
 *                    placement vocabulary so other levels can state it) */
export type ArtPlacement =
  | 'perch'
  | 'grounded-foot'
  | 'grounded-box'
  | 'bleed-left'
  | 'bleed-right'
  | 'bleed-top'
  | 'bleed-bottom';

export interface ArtSlot {
  /** A key from the approved manifest (grammarAssets.ts). A slot whose art is
   *  not approved stays EMPTY and is flagged — never substituted. */
  key: string;
  placement: ArtPlacement;
  /** Nominal size from the plan, in mm. */
  sizeMm?: number;
}

/** A source pointer for selected content — every selected word, sentence or
 *  list states where it came from. Mirrored in L6_SELECTIONS.md. */
export type SourcePointer = string;

// --- per-template content payloads ------------------------------------------

/** T1 handwriting: tramline sets only, no instruction. A set is one grey model
 *  row to trace plus one blank write row. 4 sets per page maximum. At L6 the
 *  models print joined (precursive font dependency — `pendingFont` renders the
 *  set's tramlines complete with the model row flagged). */
export interface T1Content {
  kind: 'T1';
  sets: { model: string; source: SourcePointer }[];
  /** true until the joined display font is approved; model rows render as
   *  empty tramlines with a PENDING-FONT flag in the QA report. */
  pendingFont?: boolean;
}

/** T2 grammar single page: the approved unit, verbatim, by id. Art slot
 *  assignments may differ from the unit's booklet placements (the pool object
 *  owns them); the unit CONTENT is never touched. */
export interface T2Content {
  kind: 'T2';
  unitId: string;
  /** Watch-first accents (grounded-box slots), max two keys. */
  watchArt?: string[];
}

/** T4 sentence work. `printed` sentences appear on the page (hold the
 *  sentence); a placeholder page (answer it in a sentence — SW2) renders the
 *  layout complete with flagged empty content slots. */
export interface T4Content {
  kind: 'T4';
  variant: 'hold' | 'answer';
  /** hold: the three approved sentences, printed. */
  sentences?: { text: string; source: SourcePointer }[];
  /** answer: the authoring dependency — number of question slots to lay out. */
  placeholderSlots?: number;
  /** answer: what is needed and from which source (L6_DEPENDENCIES.md). */
  dependencyNote?: string;
  /** write lines per item (hold: 1 below each sentence; answer: 2). */
  linesPerItem: number;
}

/** T5 big write: plan box + writing lines. The improve-step weak/strong pair
 *  is an authoring dependency at L6 — a flagged empty slot. */
export interface T5Content {
  kind: 'T5';
  /** structural prompt copy (decodability-checked). */
  prompt: string;
  planBoxMm: number;
  lines: number;
  pairPlaceholder?: boolean;
  dependencyNote?: string;
}

/** T6 show what you know: reuses approved items by pointer only. */
export interface SwykItem {
  task: string;
  sourceUnit: string;
  rowRef: number;
  answer: string;
}
export interface T6Content {
  kind: 'T6';
  /** two task blocks per page. */
  blocks: { label: string; items: SwykItem[] }[];
  /** B-page closing write task (structural copy) + line count. */
  writeTask?: { prompt: string; lines: number };
}

/** T7 answers: assembled from the document (deriveAnswers + selected
 *  sentences + dependency placeholders). Carries no content of its own. */
export interface T7Content {
  kind: 'T7';
  /** which answer page this is (the assembler splits units across pages). */
  part: 'A' | 'B';
}

/** T8 look cover write check: one worked example word + five word rows. */
export interface T8Content {
  kind: 'T8';
  example: { word: string; source: SourcePointer };
  rows: { word: string; source: SourcePointer }[];
}

/** T9 listen and write: the sentences are NEVER printed on this page — they
 *  render only in the Answers pages (and live in the sequence doc). */
export interface T9Content {
  kind: 'T9';
  slots: number;
  sentences: { text: string; source: SourcePointer }[];
}

/** T10 spelling test: numbered write lines only. The words are an authoring
 *  dependency (selected lists pending approval) — never printed here; the
 *  Answers slot stays a flagged placeholder until they land. */
export interface T10Content {
  kind: 'T10';
  lines: number;
  /** 'book' fortnightly test or the half-term variant. */
  variant: 'book' | 'half-term';
  dependencyNote: string;
}

export type PoolContent =
  | T1Content
  | T2Content
  | T4Content
  | T5Content
  | T6Content
  | T7Content
  | T8Content
  | T9Content
  | T10Content;

// --- the pool object ----------------------------------------------------------

export interface PoolObject {
  /** L{level}.B{book}.{STRAND}{i} or L{level}.{NAME} for closing pages. */
  id: string;
  strand: Strand;
  /** home book number, or 'LEVEL' for closing pages. */
  book: 1 | 2 | 3 | 4 | 5 | 6 | 'LEVEL';
  /** day type + position, e.g. 'W1-D1 RD', 'HW-SLOT W1', 'BLOCK-W6 WO d29'. */
  slot: string;
  editions: EditionBinding;
  template: TemplateId;
  /** child-facing header-wave title. */
  title: string;
  content: PoolContent;
  art?: ArtSlot[];
}
