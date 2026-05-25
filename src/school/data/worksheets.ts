/**
 * Worksheet plan — types, lifecycle, and per-level packs.
 *
 * Two sources of truth combined:
 *   1. The Curriculum Ledger's "Worksheet component lifecycle" table
 *      (Core / Intro / Light / Recap / —) across L1-L8.
 *   2. The Curriculum Resource Plan's worksheet sub-types (per-storybook
 *      packs, per-Sound-Book worksheets, sound mats, tricky word cards).
 */

// ─── Worksheet component lifecycle ────────────────────────────────────

export type Lifecycle = 'core' | 'intro' | 'light' | 'recap' | 'none';

export interface WorksheetComponent {
  id: string;
  label: string;
  description: string;
  lifecycle: Record<number, Lifecycle>; // keyed by level 1..8
}

const x = (id: string, label: string, description: string, row: Lifecycle[]): WorksheetComponent => ({
  id,
  label,
  description,
  lifecycle: Object.fromEntries(row.map((v, i) => [i + 1, v])) as Record<number, Lifecycle>,
});

export const WORKSHEET_COMPONENTS: WorksheetComponent[] = [
  x('letter-tracing',  'Letter tracing',            'Single graphemes with directional arrows, terminal dot.',
     ['core', 'core', 'core', 'recap', 'none', 'none', 'none', 'none']),
  x('handwriting',     'Handwriting (joining)',     'Pre-cursive joins, ascender/descender height, line awareness.',
     ['none', 'none', 'intro', 'intro', 'core', 'core', 'core', 'recap']),
  x('alien-words',     'Alien / nonsense words',    'PSC-style pseudoword blending. Retired after L6.',
     ['core', 'core', 'core', 'core', 'core', 'light', 'none', 'none']),
  x('tricky-words',    'Tricky word practise',      'Look, cover, write, check + rainbow tracing.',
     ['core', 'core', 'core', 'core', 'core', 'core', 'core', 'light']),
  x('sentence-grammar','Sentence & grammar tasks',  'Sentence building, capital letters, punctuation, conjunctions.',
     ['light', 'light', 'intro', 'intro', 'core', 'core', 'core', 'core']),
  x('comprehension',   'Comprehension questions',   'Literal, inferential, vocabulary-in-context.',
     ['none', 'light', 'light', 'intro', 'core', 'core', 'core', 'core']),
  x('vocab-spelling',  'Vocabulary & spelling',     'Word families, synonyms, suffix transformations.',
     ['none', 'none', 'none', 'light', 'intro', 'core', 'core', 'core']),
];

export const LIFECYCLE_META: Record<Lifecycle, { label: string; tone: string }> = {
  core:  { label: 'Core',  tone: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  intro: { label: 'Intro', tone: 'bg-sky-100 text-sky-800 border-sky-200' },
  light: { label: 'Light', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  recap: { label: 'Recap', tone: 'bg-slate-100 text-slate-700 border-slate-200' },
  none:  { label: '—',     tone: 'bg-slate-50 text-slate-400 border-slate-100' },
};

// ─── Worksheet pack types per level ───────────────────────────────────

export interface WorksheetPackKind {
  id: string;
  label: string;
  description: string;
  perWhat: string;     // e.g. "1 per storybook (5 pages)"
  countPerLevel: (level: number) => number;
}

import { getSoundBooksByLevel } from './soundBooks';
import { getSchoolBooksByLevel } from './bookCatalog';

export const WORKSHEET_PACKS: WorksheetPackKind[] = [
  {
    id: 'storybook-pack',
    label: 'Storybook worksheet pack',
    description: 'Five A4 sheets per storybook: sound hunt, trace/write, read and do, alien words, sound sort or story-and-draw.',
    perWhat: '1 per storybook (5 pages)',
    countPerLevel: (level) => getSchoolBooksByLevel(level).length,
  },
  {
    id: 'sound-book-worksheet',
    label: 'Sound Book worksheet',
    description: 'Lightweight 1–2 page sheet per Sound Book: sound formation, word build, sound sort.',
    perWhat: '1 per Sound Book (1–2 pages)',
    countPerLevel: (level) => getSoundBooksByLevel(level).length,
  },
  {
    id: 'sound-mat',
    label: 'Sound mat',
    description: 'Cumulative GPC chart for this level (and all earlier levels) — pinned to the table during reading.',
    perWhat: '1 per level',
    countPerLevel: () => 1,
  },
  {
    id: 'tricky-cards',
    label: 'Tricky word cards',
    description: 'Cut-and-stick flashcards for the new tricky words introduced at this level.',
    perWhat: '1 set per level',
    countPerLevel: () => 1,
  },
];
