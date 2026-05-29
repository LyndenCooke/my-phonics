/**
 * Pathway model — the teacher-facing layer over teachingSequence.ts.
 *
 * teachingSequence.ts is the source of truth for step order + dependencies.
 * This module groups those steps into teaching BLOCKS, resolves each step to
 * a displayable resource with its companion resources, and derives all the
 * resource counts (so the "313+ resources / 118-step pathway" framing is
 * computed, never hard-coded twice).
 *
 * Resource model the school sees:
 *   - Sound Book            → companion: 1 Sound Book worksheet
 *   - Blending Book (L1–L5) → companion: none (the blending practice IS the resource)
 *   - Storybook             → companions: built-in practice, 5-page worksheet pack,
 *                             interactive digital version
 *   - Per level             → 1 Sound Mat + 1 Tricky Word Card set
 *   - 40+ phoneme audio files power the interactive books
 */

import { SCHOOL_LEVELS } from './levels';
import {
  getTeachingSequence,
  allSteps,
  type TeachingStep,
  type ResourceKind,
} from './teachingSequence';
import { getSoundBookById, getSoundBooksByLevel, SOUND_BOOK_TOTAL } from './soundBooks';
import { getBlendingBookById, getBlendingBooksByLevel, BLENDING_BOOK_TOTAL } from './blendingBooks';
import { getSchoolBookById, getSchoolBooksByLevel, SCHOOL_BOOKS } from './bookCatalog';

/* ─── Resource types ──────────────────────────────────────────────────────── */

export type ResourceType =
  | 'sound_book'
  | 'sound_book_worksheet'
  | 'blending_book'
  | 'storybook'
  | 'storybook_builtin'
  | 'storybook_worksheet_pack'
  | 'interactive_storybook'
  | 'sound_mat'
  | 'tricky_word_cards'
  | 'phoneme_audio';

export const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  sound_book: 'Sound Book',
  sound_book_worksheet: 'Sound Book worksheet',
  blending_book: 'Blending Book',
  storybook: 'Storybook',
  storybook_builtin: 'Built-in practice',
  storybook_worksheet_pack: 'Worksheet pack',
  interactive_storybook: 'Interactive book',
  sound_mat: 'Sound Mat',
  tricky_word_cards: 'Tricky Word Cards',
  phoneme_audio: 'Phoneme audio',
};

/* ─── Step resolution ─────────────────────────────────────────────────────── */

export interface CompanionResource {
  type: ResourceType;
  label: string;
}

export interface ResolvedStep {
  step: TeachingStep;
  kind: ResourceKind;
  resourceId: string;
  title: string;
  subtitle?: string;
  focus: string[];
  companions: CompanionResource[];
  isReview: boolean;
}

// The three review/level-gate storybooks. They consolidate a whole level and
// require every other storybook in the level first.
export const REVIEW_STORYBOOK_IDS = new Set(['SB-L4.6', 'SB-L7.4', 'SB-L8.4']);

export function resolveStep(step: TeachingStep): ResolvedStep {
  const base = {
    step,
    kind: step.kind,
    resourceId: step.resourceId,
    isReview: step.kind === 'storybook' && REVIEW_STORYBOOK_IDS.has(step.resourceId),
  };

  if (step.kind === 'sound_book') {
    const sb = getSoundBookById(step.resourceId);
    const grapheme = sb?.graphemes.join(' / ') ?? step.resourceId;
    return {
      ...base,
      title: sb?.title ?? step.resourceId,
      subtitle: sb?.sampleWords.slice(0, 4).join(' · '),
      focus: sb ? (sb.comparisonSounds.length ? [...sb.graphemes, ...sb.comparisonSounds.map((c) => `alt: ${c}`)] : sb.graphemes) : [],
      companions: [{ type: 'sound_book_worksheet', label: `Sound Book worksheet: ${grapheme}` }],
    };
  }

  if (step.kind === 'blending_book') {
    const bb = getBlendingBookById(step.resourceId);
    return {
      ...base,
      title: bb?.title ?? step.resourceId,
      subtitle: bb?.focus,
      focus: bb?.graphemes ?? [],
      companions: [], // blending practice is the resource — no separate worksheet
    };
  }

  const sb = getSchoolBookById(step.resourceId);
  return {
    ...base,
    title: sb?.title ?? step.resourceId,
    subtitle: sb ? `Storybook · ${sb.focusSounds.join(', ')}` : undefined,
    focus: sb?.focusSounds ?? [],
    companions: [
      { type: 'storybook_builtin', label: 'Built-in practice pages' },
      { type: 'storybook_worksheet_pack', label: '5-page worksheet pack' },
      { type: 'interactive_storybook', label: 'Interactive digital version' },
    ],
  };
}

/* ─── Blocks ──────────────────────────────────────────────────────────────── */

export interface PathwayBlock {
  level: number;
  blockNumber: number;     // 1-based; review gates carry their own number too
  totalTeachingBlocks: number; // count of non-review blocks at this level
  focusLabel: string;      // e.g. "f, l, ff, ll, ss, zz"
  isReview: boolean;
  steps: ResolvedStep[];
}

// Block boundaries are editorial groupings (by focus-sound set), expressed as
// inclusive step-order ranges. teachingSequence order numbers are stable.
interface BlockDef {
  focusLabel: string;
  from: number;
  to: number;
  isReview?: boolean;
}

const BLOCK_DEFS: Record<number, BlockDef[]> = {
  1: [
    { focusLabel: 's, a, t, p, i, n', from: 1, to: 8 },
    { focusLabel: 'm, d, g, o', from: 9, to: 14 },
  ],
  2: [
    { focusLabel: 'c, k, ck, e, u, r, h, b', from: 1, to: 11 },
    { focusLabel: 'f, l, ff, ll, ss, zz', from: 12, to: 17 },
    { focusLabel: 'j, v, w, x, y, z', from: 18, to: 23 },
  ],
  3: [
    { focusLabel: 'sh, nk, ch, th', from: 1, to: 7 },
    { focusLabel: 'ng, qu', from: 8, to: 11 },
  ],
  4: [
    { focusLabel: 'ay, ee, igh', from: 1, to: 5 },
    { focusLabel: 'ow, oo, ar, or', from: 6, to: 13 },
    { focusLabel: 'air, ir, ou, oy', from: 14, to: 20 },
    { focusLabel: 'Level review', from: 21, to: 21, isReview: true },
  ],
  5: [
    { focusLabel: 'a-e, i-e, o-e, u-e', from: 1, to: 7 },
    { focusLabel: 'ea, ie', from: 8, to: 10 },
    { focusLabel: 'oi, aw, ai, oa', from: 11, to: 17 },
  ],
  6: [
    { focusLabel: 'ur, er', from: 1, to: 3 },
    { focusLabel: 'are, ow', from: 4, to: 6 },
    { focusLabel: 'ew, ue', from: 7, to: 8 },
    { focusLabel: 'wr, kn, ge, dge, mb, gn, ph, wh', from: 9, to: 13 },
  ],
  7: [
    { focusLabel: 'ire, ore', from: 1, to: 3 },
    { focusLabel: 'ear, oor', from: 4, to: 6 },
    { focusLabel: 'ure, tion', from: 7, to: 9 },
    { focusLabel: 'Level review', from: 10, to: 10, isReview: true },
  ],
  8: [
    { focusLabel: '-ous', from: 1, to: 2 },
    { focusLabel: '-cious, -tious', from: 3, to: 5 },
    { focusLabel: '-able, -ible', from: 6, to: 8 },
    { focusLabel: 'Level review', from: 9, to: 9, isReview: true },
  ],
};

export function getBlocks(level: number): PathwayBlock[] {
  const steps = getTeachingSequence(level);
  const defs = BLOCK_DEFS[level] ?? [];
  const teachingBlocks = defs.filter((d) => !d.isReview).length;
  return defs.map((def, i) => ({
    level,
    blockNumber: i + 1,
    totalTeachingBlocks: teachingBlocks,
    focusLabel: def.focusLabel,
    isReview: !!def.isReview,
    steps: steps.filter((s) => s.order >= def.from && s.order <= def.to).map(resolveStep),
  }));
}

/** Block info for a given resource id (Sound/Blending/Storybook), or null. */
export function blockForResource(
  resourceId: string,
): { level: number; blockNumber: number; totalTeachingBlocks: number; focusLabel: string; isReview: boolean } | null {
  for (const level of Object.keys(BLOCK_DEFS).map(Number)) {
    for (const b of getBlocks(level)) {
      if (b.steps.some((s) => s.resourceId === resourceId)) {
        return { level: b.level, blockNumber: b.blockNumber, totalTeachingBlocks: b.totalTeachingBlocks, focusLabel: b.focusLabel, isReview: b.isReview };
      }
    }
  }
  return null;
}

/** The block a given step order belongs to (1-based block number), or null. */
export function blockOfStep(level: number, order: number): { blockNumber: number; totalTeachingBlocks: number; focusLabel: string; isReview: boolean } | null {
  const defs = BLOCK_DEFS[level] ?? [];
  const teachingBlocks = defs.filter((d) => !d.isReview).length;
  const idx = defs.findIndex((d) => order >= d.from && order <= d.to);
  if (idx === -1) return null;
  return { blockNumber: idx + 1, totalTeachingBlocks: teachingBlocks, focusLabel: defs[idx].focusLabel, isReview: !!defs[idx].isReview };
}

/* ─── Level resources (used throughout a level) ───────────────────────────── */

export interface LevelResource {
  type: ResourceType;
  label: string;
}

export function getLevelResources(level: number): LevelResource[] {
  return [
    { type: 'sound_mat', label: `L${level} Sound Mat` },
    { type: 'tricky_word_cards', label: `L${level} Tricky Word Cards` },
  ];
}

/* ─── Counts (all derived) ────────────────────────────────────────────────── */

export interface LevelCounts {
  level: number;
  soundBooks: number;
  soundBookWorksheets: number;
  blendingBooks: number;
  storybooks: number;
  storybookWorksheetPacks: number;
  interactiveBooks: number;
  soundMats: number;
  trickyWordCards: number;
  total: number;
  teachingSteps: number;
}

export function levelCounts(level: number): LevelCounts {
  const soundBooks = getSoundBooksByLevel(level).length;
  const blendingBooks = getBlendingBooksByLevel(level).length;
  const storybooks = getSchoolBooksByLevel(level).length;
  const total =
    soundBooks + soundBooks /* worksheets */ +
    blendingBooks +
    storybooks + storybooks /* packs */ + storybooks /* interactive */ +
    1 /* sound mat */ + 1 /* tricky cards */;
  return {
    level,
    soundBooks,
    soundBookWorksheets: soundBooks,
    blendingBooks,
    storybooks,
    storybookWorksheetPacks: storybooks,
    interactiveBooks: storybooks,
    soundMats: 1,
    trickyWordCards: 1,
    total,
    teachingSteps: getTeachingSequence(level).length,
  };
}

export const ALL_LEVEL_COUNTS: LevelCounts[] = SCHOOL_LEVELS.map((l) => levelCounts(l.level));

export const PHONEME_AUDIO_COUNT = 40; // "40+" — see public/sounds

export interface ProgrammeTotals {
  teachingSteps: number;       // 118
  soundBooks: number;          // 73
  soundBookWorksheets: number; // 73
  blendingBooks: number;       // 12
  storybooks: number;          // 33
  storybookWorksheetPacks: number; // 33
  interactiveBooks: number;    // 33
  matchedWorksheets: number;   // 106 (73 + 33)
  soundMats: number;           // 8
  trickyWordCards: number;     // 8
  visibleResources: number;    // 273
  phonemeAudio: number;        // 40+
  totalResources: number;      // 313+
}

/* ─── Per-learner position ────────────────────────────────────────────────── */

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export type TeacherJudgement = 'continue' | 'ready_soon' | 'needs_support';

export const JUDGEMENT_LABEL: Record<TeacherJudgement, string> = {
  continue: 'Continue',
  ready_soon: 'Ready soon',
  needs_support: 'Needs support',
};

export interface LearnerPosition {
  level: number;
  block: { blockNumber: number; totalTeachingBlocks: number; focusLabel: string; isReview: boolean } | null;
  current?: ResolvedStep;
  next?: ResolvedStep;
  completed: number;
  totalSteps: number;
  judgement: TeacherJudgement;
}

/**
 * Pathway position for a learner. Prefers REAL stored progress when given
 * (`opts.completedCount` = steps completed in the current level, `opts.judgement`
 * = teacher's recorded judgement). Falls back to a stable id-seeded derivation
 * when those aren't available, so older surfaces still render sensibly.
 */
export function learnerPosition(
  level: number,
  seed: string,
  opts?: { completedCount?: number | null; judgement?: TeacherJudgement | null },
): LearnerPosition {
  const steps = getTeachingSequence(level).map(resolveStep);
  if (steps.length === 0) {
    return { level, block: null, completed: 0, totalSteps: 0, judgement: opts?.judgement ?? 'continue' };
  }

  let idx: number;
  if (opts?.completedCount != null) {
    idx = Math.max(0, Math.min(opts.completedCount, steps.length - 1));
  } else {
    idx = hashString(seed) % steps.length;
  }
  const current = steps[idx];
  const next = steps[idx + 1];
  const block = current ? blockOfStep(level, current.step.order) : null;

  let judgement: TeacherJudgement;
  if (opts?.judgement) {
    judgement = opts.judgement;
  } else {
    const frac = idx / steps.length;
    judgement = hashString(seed) % 7 === 0 ? 'needs_support' : frac > 0.8 ? 'ready_soon' : 'continue';
  }
  return { level, block, current, next, completed: idx, totalSteps: steps.length, judgement };
}

/* ─── Per-pupil step status (real progress) ───────────────────────────────── */

export type StepStatus = 'complete' | 'in_progress' | 'next' | 'upcoming';
export interface PupilStep extends ResolvedStep { status: StepStatus; }

export function levelStepStatus(level: number, completedCount: number): {
  steps: PupilStep[];
  completed: number;
  total: number;
  current?: ResolvedStep;
  next?: ResolvedStep;
  isLevelComplete: boolean;
} {
  const resolved = getTeachingSequence(level).map(resolveStep);
  const total = resolved.length;
  const c = Math.max(0, Math.min(completedCount, total));
  const steps = resolved.map((s, i): PupilStep => ({
    ...s,
    status: i < c ? 'complete' : i === c ? 'in_progress' : i === c + 1 ? 'next' : 'upcoming',
  }));
  return { steps, completed: c, total, current: resolved[c], next: resolved[c + 1], isLevelComplete: c >= total && total > 0 };
}

export interface ResourceTally {
  soundBooks: number; blendingBooks: number; storybooks: number;
  interactive: number; worksheetPacks: number; certificates: number;
}

/** Resources completed = all of levels below + the first `completedCount` steps of `level`. */
export function completedResourceTally(level: number, completedCount: number): ResourceTally {
  const tally: ResourceTally = { soundBooks: 0, blendingBooks: 0, storybooks: 0, interactive: 0, worksheetPacks: 0, certificates: 0 };
  const add = (s: ResolvedStep) => {
    if (s.kind === 'sound_book') tally.soundBooks++;
    else if (s.kind === 'blending_book') tally.blendingBooks++;
    else { tally.storybooks++; tally.interactive++; tally.worksheetPacks++; tally.certificates++; }
  };
  for (let lv = 1; lv < level; lv++) getTeachingSequence(lv).map(resolveStep).forEach(add);
  getTeachingSequence(level).map(resolveStep).slice(0, Math.max(0, completedCount)).forEach(add);
  return tally;
}

/** Half-termly assessment window label for a date (UK academic calendar, approximate). */
export function assessmentWindowForDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  const m = date.getMonth() + 1;
  if (m >= 9 && m <= 10) return 'Autumn 1';
  if (m === 11 || m === 12) return 'Autumn 2';
  if (m === 1 || m === 2) return 'Spring 1';
  if (m === 3 || m === 4) return 'Spring 2';
  if (m === 5) return 'Summer 1';
  return 'Summer 2';
}

export function programmeTotals(): ProgrammeTotals {
  const teachingSteps = allSteps().length;
  const soundBooks = SOUND_BOOK_TOTAL;
  const blendingBooks = BLENDING_BOOK_TOTAL;
  const storybooks = SCHOOL_BOOKS.length;
  const soundMats = SCHOOL_LEVELS.length;
  const trickyWordCards = SCHOOL_LEVELS.length;
  const visibleResources =
    soundBooks + soundBooks + blendingBooks + storybooks + storybooks + storybooks + soundMats + trickyWordCards;
  return {
    teachingSteps,
    soundBooks,
    soundBookWorksheets: soundBooks,
    blendingBooks,
    storybooks,
    storybookWorksheetPacks: storybooks,
    interactiveBooks: storybooks,
    matchedWorksheets: soundBooks + storybooks,
    soundMats,
    trickyWordCards,
    visibleResources,
    phonemeAudio: PHONEME_AUDIO_COUNT,
    totalResources: visibleResources + PHONEME_AUDIO_COUNT,
  };
}
