/**
 * Teaching sequence — per-level, ordered dependency chain for the three
 * primary book types.
 *
 * Each level is a list of steps. A step is one primary resource
 * (Sound Book / Blending Book / Storybook). Worksheets, sound mats and
 * tricky-card sets are companion resources keyed off the parent and
 * not modelled as standalone steps — they're emitted in the assignment
 * UI alongside their parent.
 *
 * Source: `myphonics_books/output/worksheet_plan/school_alignment.md` §5.
 * Canonical IDs are defined in soundBooks.ts / blendingBooks.ts / bookCatalog.ts.
 *
 * Invariant: every `dependsOn[]` entry must appear earlier in the same
 * level's sequence. Cross-level dependencies are NOT modelled here —
 * level progression is the level-up gate, handled separately.
 */

export type ResourceKind = 'sound_book' | 'blending_book' | 'storybook';

export interface TeachingStep {
  order: number;           // 1-based position within the level
  resourceId: string;      // canonical ID — SD-L{n}.{nn}, BB-L{n}.{nn}, SB-L{n}.{m}
  kind: ResourceKind;
  /**
   * Resource IDs in this level that should be marked complete before this
   * step is unlocked. Empty for the first step of each level and for
   * resources that introduce sounds in isolation.
   */
  dependsOn: string[];
  /**
   * Optional note explaining a non-obvious sequencing decision.
   */
  note?: string;
}

const S = (
  order: number,
  resourceId: string,
  kind: ResourceKind,
  dependsOn: string[] = [],
  note?: string,
): TeachingStep => ({ order, resourceId, kind, dependsOn, note });

/* ────────────────────────────── L1 — Ditties ────────────────────────────── */
// 10 Sound Books + 2 Blending Books + 2 Storybooks, paired by half-level
// (SATPIN block → BB1 → SB1; MDGO block → BB2 → SB2).
const L1: TeachingStep[] = [
  S(1,  'SD-L1.01', 'sound_book'),                              // s
  S(2,  'SD-L1.02', 'sound_book'),                              // a
  S(3,  'SD-L1.03', 'sound_book'),                              // t
  S(4,  'SD-L1.04', 'sound_book'),                              // p
  S(5,  'SD-L1.05', 'sound_book'),                              // i
  S(6,  'SD-L1.06', 'sound_book'),                              // n
  S(7,  'BB-L1.01', 'blending_book', ['SD-L1.01','SD-L1.02','SD-L1.03','SD-L1.04','SD-L1.05','SD-L1.06']),
  S(8,  'SB-L1.1',  'storybook',     ['BB-L1.01']),             // Tap! Tap! Tap!
  S(9,  'SD-L1.07', 'sound_book'),                              // m
  S(10, 'SD-L1.08', 'sound_book'),                              // d
  S(11, 'SD-L1.09', 'sound_book'),                              // g
  S(12, 'SD-L1.10', 'sound_book'),                              // o
  S(13, 'BB-L1.02', 'blending_book', ['SD-L1.07','SD-L1.08','SD-L1.09','SD-L1.10']),
  S(14, 'SB-L1.2',  'storybook',     ['BB-L1.02']),             // Mud on the Dog
];

/* ────────────────────────────── L2 — First Sounds ───────────────────────── */
// 15 Sound Books + 3 Blending Books + 5 Storybooks.
// SDs are grouped to match the storybook focus sets: c/k/ck/e/u/r/h/b → SB2.1+2.2;
// f/l/doubles → SB2.3; j/v+w/x+y+z → SB2.4+2.5.
const L2: TeachingStep[] = [
  S(1,  'SD-L2.01', 'sound_book'),                              // c
  S(2,  'SD-L2.02', 'sound_book'),                              // k
  S(3,  'SD-L2.03', 'sound_book', ['SD-L2.01','SD-L2.02']),     // ck (depends on c+k)
  S(4,  'SD-L2.04', 'sound_book'),                              // e
  S(5,  'SD-L2.05', 'sound_book'),                              // u
  S(6,  'SD-L2.06', 'sound_book'),                              // r
  S(7,  'SD-L2.07', 'sound_book'),                              // h
  S(8,  'SD-L2.08', 'sound_book'),                              // b
  S(9,  'BB-L2.03', 'blending_book', ['SD-L2.01','SD-L2.02','SD-L2.03','SD-L2.04','SD-L2.05','SD-L2.06','SD-L2.07','SD-L2.08']),
  S(10, 'SB-L2.1',  'storybook',     ['BB-L2.03']),             // The Red Socks (c,k,ck,e)
  S(11, 'SB-L2.2',  'storybook',     ['BB-L2.03']),             // Run, Pup, Run! (u,r,h,b)
  S(12, 'SD-L2.09', 'sound_book'),                              // f
  S(13, 'SD-L2.10', 'sound_book'),                              // l
  S(14, 'SD-L2.11', 'sound_book',    ['SD-L2.09','SD-L2.10']),  // ff + ll
  S(15, 'SD-L2.12', 'sound_book'),                              // ss + zz
  S(16, 'BB-L2.05', 'blending_book', ['SD-L2.11','SD-L2.12']),
  S(17, 'SB-L2.3',  'storybook',     ['BB-L2.05']),             // Fox Fell Off! (f,l,ff,ll)
  S(18, 'SD-L2.13', 'sound_book'),                              // j
  S(19, 'SD-L2.14', 'sound_book'),                              // v + w
  S(20, 'SD-L2.15', 'sound_book'),                              // x + y + z
  S(21, 'BB-L2.04', 'blending_book', ['SD-L2.09','SD-L2.10','SD-L2.13','SD-L2.14','SD-L2.15']),
  S(22, 'SB-L2.4',  'storybook',     ['BB-L2.04']),             // The Jam Jug (j,v,w)
  S(23, 'SB-L2.5',  'storybook',     ['BB-L2.04']),             // Yak and the Box (x,y,z)
];

/* ────────────────────────────── L3 — Special Friends ────────────────────── */
// 6 Sound Books + 2 Blending Books + 3 Storybooks.
// All 4 of {sh, ch, th, qu/ng} Sound Books precede BB-L3.01 (sh/ch/th) so
// the blending book never sees an unintroduced grapheme.
const L3: TeachingStep[] = [
  S(1,  'SD-L3.01', 'sound_book'),                              // sh
  S(2,  'SD-L3.02', 'sound_book'),                              // nk
  S(3,  'SD-L3.03', 'sound_book'),                              // ch
  S(4,  'SD-L3.04', 'sound_book'),                              // th
  S(5,  'BB-L3.06', 'blending_book', ['SD-L3.01','SD-L3.03','SD-L3.04'],
        'BB-L3.06 covers sh/ch/th — reordered so all three SDs precede it.'),
  S(6,  'SB-L3.1',  'storybook',     ['BB-L3.06','SD-L3.02']),  // Fish in the Tank (sh, nk)
  S(7,  'SB-L3.2',  'storybook',     ['BB-L3.06']),             // Chop Chop Chop (ch, th)
  S(8,  'SD-L3.05', 'sound_book'),                              // ng
  S(9,  'SD-L3.06', 'sound_book'),                              // qu
  S(10, 'BB-L3.07', 'blending_book', ['SD-L3.02','SD-L3.05','SD-L3.06']),
  S(11, 'SB-L3.3',  'storybook',     ['BB-L3.07']),             // Buzz and Sing (ng, qu, zz)
];

/* ────────────────────────────── L4 — Longer Sounds ──────────────────────── */
// 12 Sound Books + 3 Blending Books + 6 Storybooks.
// Mirrors RWI Pink (ay/ee/igh, ow/oo) → Orange (ar/or, air/ir, ou/oy) + review.
const L4: TeachingStep[] = [
  S(1,  'SD-L4.01', 'sound_book'),                              // ay
  S(2,  'SD-L4.02', 'sound_book'),                              // ee
  S(3,  'SD-L4.03', 'sound_book'),                              // igh
  S(4,  'BB-L4.08', 'blending_book', ['SD-L4.01','SD-L4.02','SD-L4.03']),
  S(5,  'SB-L4.1',  'storybook',     ['BB-L4.08']),             // Night Light
  S(6,  'SD-L4.04', 'sound_book'),                              // ow (blow)
  S(7,  'SD-L4.05', 'sound_book'),                              // oo (zoo)
  S(8,  'SD-L4.06', 'sound_book'),                              // oo (look)
  S(9,  'SB-L4.2',  'storybook',     ['SD-L4.04','SD-L4.05','SD-L4.06']), // Hot Food, Cool Moon
  S(10, 'SD-L4.07', 'sound_book'),                              // ar
  S(11, 'SD-L4.08', 'sound_book'),                              // or
  S(12, 'BB-L4.09', 'blending_book', ['SD-L4.04','SD-L4.05','SD-L4.06','SD-L4.07','SD-L4.08']),
  S(13, 'SB-L4.3',  'storybook',     ['BB-L4.09']),             // Morning on the Farm
  S(14, 'SD-L4.09', 'sound_book'),                              // air
  S(15, 'SD-L4.10', 'sound_book'),                              // ir
  S(16, 'SB-L4.4',  'storybook',     ['SD-L4.09','SD-L4.10']),  // Fair in the Air
  S(17, 'SD-L4.11', 'sound_book'),                              // ou
  S(18, 'SD-L4.12', 'sound_book'),                              // oy
  S(19, 'BB-L4.10', 'blending_book', ['SD-L4.09','SD-L4.10','SD-L4.11','SD-L4.12']),
  S(20, 'SB-L4.5',  'storybook',     ['BB-L4.10']),             // Round and Round
  S(21, 'SB-L4.6',  'storybook',     ['SB-L4.1','SB-L4.2','SB-L4.3','SB-L4.4','SB-L4.5'],
        'Review book — all L4 storybooks should be completed first.'),
];

/* ────────────────────────────── L5 — New Spellings ──────────────────────── */
// 10 Sound Books + 2 Blending Books + 5 Storybooks.
// Split digraphs first (a-e, i-e, o-e, u-e) → SB5.1/5.2; then alt spellings.
const L5: TeachingStep[] = [
  S(1,  'SD-L5.01', 'sound_book'),                              // a-e
  S(2,  'SD-L5.02', 'sound_book'),                              // i-e
  S(3,  'SD-L5.03', 'sound_book'),                              // o-e
  S(4,  'SD-L5.04', 'sound_book'),                              // u-e
  S(5,  'BB-L5.11', 'blending_book', ['SD-L5.01','SD-L5.02','SD-L5.03','SD-L5.04']),
  S(6,  'SB-L5.1',  'storybook',     ['BB-L5.11']),             // Big Bike Race (a-e, i-e)
  S(7,  'SB-L5.2',  'storybook',     ['BB-L5.11']),             // Night Market (o-e, u-e)
  S(8,  'SD-L5.05', 'sound_book'),                              // ea
  S(9,  'SD-L5.06', 'sound_book'),                              // ie
  S(10, 'SB-L5.3',  'storybook',     ['SD-L5.05','SD-L5.06']),  // Dream Team
  S(11, 'SD-L5.07', 'sound_book'),                              // oi
  S(12, 'SD-L5.08', 'sound_book'),                              // aw
  S(13, 'SD-L5.09', 'sound_book'),                              // ai
  S(14, 'SD-L5.10', 'sound_book'),                              // oa
  S(15, 'BB-L5.12', 'blending_book', ['SD-L5.05','SD-L5.06','SD-L5.07','SD-L5.08','SD-L5.09','SD-L5.10']),
  S(16, 'SB-L5.4',  'storybook',     ['SD-L5.07','SD-L5.08']),  // What Min Saw (oi, aw)
  S(17, 'SB-L5.5',  'storybook',     ['SD-L5.09','SD-L5.10']),  // Boat with Red Sail (ai, oa)
];

/* ────────────────────────────── L6 — Building Fluency ───────────────────── */
// 9 Sound Books + 0 Blending Books + 4 Storybooks.
// No blending books at L6+ — children blend in context inside the storybooks.
const L6: TeachingStep[] = [
  S(1,  'SD-L6.01', 'sound_book'),                              // ur
  S(2,  'SD-L6.02', 'sound_book'),                              // er
  S(3,  'SB-L6.1',  'storybook',     ['SD-L6.01','SD-L6.02']),  // Purple Purse
  S(4,  'SD-L6.03', 'sound_book'),                              // are
  S(5,  'SD-L6.04', 'sound_book'),                              // ow (brown)
  S(6,  'SB-L6.2',  'storybook',     ['SD-L6.03','SD-L6.04']),  // Brown Owl
  S(7,  'SD-L6.05', 'sound_book'),                              // ew + ue
  S(8,  'SB-L6.3',  'storybook',     ['SD-L6.05']),             // The New Glue
  S(9,  'SD-L6.06', 'sound_book'),                              // wr + kn
  S(10, 'SD-L6.07', 'sound_book'),                              // ge + dge
  S(11, 'SD-L6.08', 'sound_book'),                              // mb + gn
  S(12, 'SD-L6.09', 'sound_book'),                              // ph + wh
  S(13, 'SB-L6.4',  'storybook',     ['SD-L6.01','SD-L6.02','SD-L6.03','SD-L6.04','SD-L6.05'],
        'Cheeky Monkey reviews ur/er/are/ow/ew/ue — silent-letter SDs (wr/kn/ge/dge/mb/gn/ph/wh) are extension material at this level.'),
];

/* ────────────────────────────── L7 — Reading Together ───────────────────── */
// 6 Sound Books + 0 Blending Books + 4 Storybooks. Trigraphs + tion.
const L7: TeachingStep[] = [
  S(1,  'SD-L7.01', 'sound_book'),                              // ire
  S(2,  'SD-L7.02', 'sound_book'),                              // ore
  S(3,  'SB-L7.1',  'storybook',     ['SD-L7.01','SD-L7.02']),  // Before the Shore
  S(4,  'SD-L7.03', 'sound_book'),                              // ear
  S(5,  'SD-L7.04', 'sound_book'),                              // oor
  S(6,  'SB-L7.2',  'storybook',     ['SD-L7.03','SD-L7.04']),  // Near the Door
  S(7,  'SD-L7.05', 'sound_book'),                              // ure
  S(8,  'SD-L7.06', 'sound_book'),                              // tion
  S(9,  'SB-L7.3',  'storybook',     ['SD-L7.05','SD-L7.06']),  // Sure She Can!
  S(10, 'SB-L7.4',  'storybook',     ['SB-L7.1','SB-L7.2','SB-L7.3'],
        'Review book — A Place for Me covers all L7 trigraphs.'),
];

/* ────────────────────────────── L8 — Reading Champion ───────────────────── */
// 5 Sound Books + 0 Blending Books + 4 Storybooks. Suffix morphology.
// SDs ordered to match storybook teaching order, not alphabetically.
const L8: TeachingStep[] = [
  S(1,  'SD-L8.01', 'sound_book'),                              // -ous
  S(2,  'SB-L8.1',  'storybook',     ['SD-L8.01']),             // Marvellous Neighbourhood
  S(3,  'SD-L8.02', 'sound_book'),                              // -cious
  S(4,  'SD-L8.03', 'sound_book'),                              // -tious
  S(5,  'SB-L8.3',  'storybook',     ['SD-L8.02','SD-L8.03']),  // It Looks Suspicious!
  S(6,  'SD-L8.04', 'sound_book'),                              // -able
  S(7,  'SD-L8.05', 'sound_book'),                              // -ible
  S(8,  'SB-L8.2',  'storybook',     ['SD-L8.04','SD-L8.05']),  // You Are Remarkable
  S(9,  'SB-L8.4',  'storybook',     ['SB-L8.1','SB-L8.2','SB-L8.3'],
        'Review book — Incredible Bush Walk covers all L8 suffixes.'),
];

export const TEACHING_SEQUENCE: Record<number, TeachingStep[]> = {
  1: L1, 2: L2, 3: L3, 4: L4, 5: L5, 6: L6, 7: L7, 8: L8,
};

export function getTeachingSequence(level: number): TeachingStep[] {
  return TEACHING_SEQUENCE[level] ?? [];
}

/**
 * Returns the next step a learner should attempt given the set of resource
 * IDs they have already completed. Returns undefined if the level is finished.
 */
export function nextStep(level: number, completedIds: Set<string>): TeachingStep | undefined {
  return getTeachingSequence(level).find(
    (step) => !completedIds.has(step.resourceId) && step.dependsOn.every((d) => completedIds.has(d)),
  );
}

/**
 * All steps across all levels, flattened — handy for resource catalogues.
 */
export function allSteps(): TeachingStep[] {
  return Object.values(TEACHING_SEQUENCE).flat();
}
