/**
 * Data layer for the Curriculum Journey Map.
 *
 * Reads the trimmed public copy of the curriculum spine at
 * /journey/lesson_map.json (regenerate with `npm run journey:build`)
 * and shapes it into the two-scale model the map renders from:
 * 8 levels -> teaching blocks (one per sound or skill cycle) -> day pips.
 *
 * Level names and colours come from src/lib/levels8.ts, the source of
 * truth for the 8-level journey. This module reads data, never writes it.
 */

import { useEffect, useState } from 'react';
import { JOURNEY_LEVELS, type JourneyLevel } from '@/lib/levels8';

export type LessonType =
  | 'gpc'
  | 'review'
  | 'assessment'
  | 'keepup'
  | 'focus'
  | 'psc_prep'
  | 'psc_mock';

export interface LessonRow {
  n: number;
  level: number;
  level_name: string;
  colour: string;
  half_term: string;
  code: string;
  week: number | null;
  day: number;
  day_total: number;
  gpc: string | null;
  focus: string | null;
  title: string;
  type: LessonType;
  book: string | null;
  book_title: string | null;
  sound_index: number | null;
}

export interface LessonMapFile {
  total_lessons: number;
  map: LessonRow[];
}

/**
 * One teaching block: a contiguous day cycle (day 1..day_total) inside a
 * level. Sound weeks are 5-day blocks; assessments, keep-up days and PSC
 * prep days are 1-day blocks. This is the mini checkpoint unit of the
 * zoomed-in view and matches the day pips on the printed lesson pages.
 */
export interface JourneyBlock {
  /** Short child-facing label, e.g. "sh", "f + ff", "Quick Check". */
  label: string;
  /** Grapheme labels get the Andika teaching font; others do not. */
  isGrapheme: boolean;
  type: LessonType;
  /** Assessments and PSC mocks render as flags, not circles. */
  isFlag: boolean;
  firstN: number;
  lastN: number;
  rows: LessonRow[];
}

export interface JourneyLevelModel {
  meta: JourneyLevel;
  firstN: number;
  lastN: number;
  lessonCount: number;
  blocks: JourneyBlock[];
}

export interface JourneyModel {
  totalLessons: number;
  levels: JourneyLevelModel[];
}

/** Where a given lesson number sits inside the model. */
export interface JourneyPosition {
  levelIndex: number;
  blockIndex: number;
  row: LessonRow;
}

const GRAPHEME_LABEL = /^[a-z]+([ /+-][a-z]+)*$/;

function blockLabel(rows: LessonRow[]): { label: string; isGrapheme: boolean } {
  const first = rows[0];
  if (first.type === 'assessment') return { label: 'Quick Check', isGrapheme: false };
  if (first.type === 'keepup') return { label: 'Keep-up', isGrapheme: false };
  if (first.type === 'psc_mock') return { label: first.focus ?? 'PSC Mock', isGrapheme: false };

  // Sound blocks: join the distinct graphemes taught across the cycle,
  // so a week covering f then ff reads "f + ff".
  const gpcs = [...new Set(rows.map((r) => r.gpc).filter(Boolean))] as string[];
  if (gpcs.length > 0) {
    const label = gpcs.join(' + ');
    return { label, isGrapheme: true };
  }

  // Skill and review blocks: use the day-1 focus, trimmed to its theme
  // ("Tricky words: do, when..." -> "Tricky words").
  const focus = first.focus ?? first.title;
  const short = focus.split(':')[0].trim();
  return {
    label: short,
    isGrapheme: GRAPHEME_LABEL.test(short) && short.length <= 12,
  };
}

/**
 * Group the flat lesson list into levels and contiguous teaching blocks.
 * A new block starts whenever a row's day counter resets to 1.
 */
export function buildJourneyModel(file: LessonMapFile): JourneyModel {
  const levels: JourneyLevelModel[] = JOURNEY_LEVELS.map((meta) => ({
    meta,
    firstN: 0,
    lastN: 0,
    lessonCount: 0,
    blocks: [],
  }));

  let current: LessonRow[] | null = null;
  const flush = () => {
    if (!current || current.length === 0) return;
    const level = levels[current[0].level - 1];
    const { label, isGrapheme } = blockLabel(current);
    const type = current[0].type;
    level.blocks.push({
      label,
      isGrapheme,
      type,
      isFlag: type === 'assessment' || type === 'psc_mock',
      firstN: current[0].n,
      lastN: current[current.length - 1].n,
      rows: current,
    });
    current = null;
  };

  for (const row of file.map) {
    if (row.day === 1 || !current || current[0].level !== row.level) flush();
    if (!current) current = [];
    current.push(row);
  }
  flush();

  for (const level of levels) {
    if (level.blocks.length === 0) continue;
    level.firstN = level.blocks[0].firstN;
    level.lastN = level.blocks[level.blocks.length - 1].lastN;
    level.lessonCount = level.lastN - level.firstN + 1;
  }

  return { totalLessons: file.total_lessons, levels };
}

/** Clamp a lesson number into the journey and locate it in the model. */
export function locateLesson(model: JourneyModel, lesson: number): JourneyPosition {
  const n = Math.min(Math.max(Math.round(lesson), 1), model.totalLessons);
  for (let li = 0; li < model.levels.length; li++) {
    const level = model.levels[li];
    if (n > level.lastN) continue;
    for (let bi = 0; bi < level.blocks.length; bi++) {
      const block = level.blocks[bi];
      if (n <= block.lastN) {
        return { levelIndex: li, blockIndex: bi, row: block.rows[n - block.firstN] };
      }
    }
  }
  const li = model.levels.length - 1;
  const bi = model.levels[li].blocks.length - 1;
  const block = model.levels[li].blocks[bi];
  return { levelIndex: li, blockIndex: bi, row: block.rows[block.rows.length - 1] };
}

export type ProgressState = 'complete' | 'current' | 'future';

export function levelState(level: JourneyLevelModel, currentLesson: number): ProgressState {
  if (currentLesson > level.lastN) return 'complete';
  if (currentLesson >= level.firstN) return 'current';
  return 'future';
}

export function blockState(block: JourneyBlock, currentLesson: number): ProgressState {
  if (currentLesson > block.lastN) return 'complete';
  if (currentLesson >= block.firstN) return 'current';
  return 'future';
}

/** "12 of 27 lessons" style counts for a level checkpoint. */
export function levelProgress(level: JourneyLevelModel, currentLesson: number): {
  done: number;
  total: number;
} {
  const done = Math.min(Math.max(currentLesson - level.firstN + 1, 0), level.lessonCount);
  return { done, total: level.lessonCount };
}

/* ------------------------------------------------------------------ */
/* Lesson outline                                                      */
/* ------------------------------------------------------------------ */

export interface OutlineStep {
  /** Start time on the lesson clock, e.g. "0:00". */
  clock: string;
  title: string;
  detail: string;
}

export interface LessonOutline {
  /** Taught minutes before the worksheet. */
  minutes: number;
  steps: OutlineStep[];
  /** The independent follow-up after the taught lesson. */
  worksheet: OutlineStep;
}

/** The day's main verb, read from the spine title ("Read it: ..."). */
function dayVerb(row: LessonRow): string {
  return row.title.split(':')[0].trim().toLowerCase();
}

const soundName = (row: LessonRow) => row.gpc ?? row.focus ?? 'the sound';

/**
 * Build the day's taught outline from the spine row. Every teaching day
 * follows the same shape: one minute of sound recognition, words with
 * the sound, the day's main work in the level book, tricky words, then
 * the worksheet as a 10 to 15 minute follow-up.
 */
export function lessonOutline(row: LessonRow): LessonOutline {
  const s = soundName(row);
  const book = row.book_title ? `${row.book_title} (Level ${row.level})` : null;

  const worksheet: OutlineStep = {
    clock: 'After',
    title: 'Questions and worksheet',
    detail:
      '10 to 15 minutes of independent work: the matching worksheet page and its questions. Stop while it still feels easy.',
  };

  if (row.type === 'assessment') {
    return {
      minutes: 10,
      steps: [
        { clock: '0:00', title: 'Settle and warm up', detail: 'One relaxed minute of sound cards so the check starts with a win.' },
        { clock: '1:00', title: 'Quick Check: sounds', detail: 'Listen to every sound taught so far, one card at a time, cold.' },
        { clock: '4:00', title: 'Quick Check: words', detail: 'Blend real words from the level, then a few alien words.' },
        { clock: '7:00', title: 'Quick Check: tricky words', detail: 'Read the tricky word list for the level. Note anything shaky.' },
        { clock: '9:00', title: 'Decide keep-up', detail: 'Mark gaps on the check sheet. Anything missed becomes this week’s keep-up focus.' },
      ],
      worksheet: { clock: 'After', title: 'No worksheet today', detail: 'Assessment day: finish with praise, not more work.' },
    };
  }

  if (row.type === 'keepup') {
    return {
      minutes: 10,
      steps: [
        { clock: '0:00', title: 'Speed review', detail: 'One minute of sound cards, focusing on the sounds marked at the Quick Check.' },
        { clock: '1:00', title: 'Rebuild the wobbly sounds', detail: 'Hear it, see it and say it again for each sound that slipped.' },
        { clock: '4:00', title: 'Words with those sounds', detail: 'Blend a short list of words using only the keep-up sounds.' },
        { clock: '7:00', title: 'Back into a book', detail: 'Reread a favourite page from the last book so the practice lands in real reading.' },
      ],
      worksheet,
    };
  }

  if (row.type === 'psc_mock') {
    return {
      minutes: 12,
      steps: [
        { clock: '0:00', title: 'Settle', detail: 'Explain the game: 40 words, some real, some alien. Aliens are meant to be nonsense.' },
        { clock: '1:00', title: `Sit ${row.focus ?? 'the mock'}`, detail: 'Work through the 40 words one at a time, no hurry, no teaching.' },
        { clock: '10:00', title: 'Mark and note', detail: 'Score it quietly afterwards. Sounds that slipped feed the next revision day.' },
      ],
      worksheet: { clock: 'After', title: 'No worksheet today', detail: 'Mock day: end on something fun instead.' },
    };
  }

  if (row.type === 'psc_prep') {
    return {
      minutes: 10,
      steps: [
        { clock: '0:00', title: 'Speed review', detail: 'One minute of sound cards: every sound so far, said cold.' },
        { clock: '1:00', title: `Read-only sound: ${s}`, detail: `Meet ${s} for reading only. Spelling comes later in the journey, so nothing is written today.` },
        { clock: '4:00', title: `Real words with ${s}`, detail: `Blend and read a list of real words containing ${s}.` },
        { clock: '7:00', title: 'Alien words', detail: `Read alien words with ${s}. Silly is good: sound it, blend it, laugh, move on.` },
      ],
      worksheet,
    };
  }

  // Teaching days: gpc, focus and review rows share the user's recipe,
  // with the main slot taken from the day's verb (meet, blend, read,
  // write, build, prove).
  const verb = dayVerb(row);
  const isRule = row.type === 'focus';
  const thing = isRule ? row.focus ?? 'the rule' : `the sound ${s}`;

  const main: OutlineStep = verb.startsWith('meet')
    ? { clock: '5:00', title: `Meet ${thing}`, detail: isRule
        ? `Introduce ${thing} with examples on the board. Say it, see it, spot it.`
        : `Hear it, see it and form it: mouth position, the letter shape and the write-it moment on whiteboards.` }
    : verb.startsWith('blend') || verb.startsWith('build')
      ? { clock: '5:00', title: `Build words with ${isRule ? 'the rule' : s}`, detail: 'Sound-frame the words together, then read them cold. Finish with two in a spoken sentence.' }
      : verb.startsWith('read')
        ? { clock: '5:00', title: book ? `Read the book: ${book}` : 'Read it', detail: book
            ? `First read of ${row.book_title}: decode every word, no guessing from pictures. Celebrate the tricky bits.`
            : 'Read the practice passage together, then cold.' }
        : verb.startsWith('write')
          ? { clock: '5:00', title: 'Write it', detail: book
              ? `Dictation and sentence work from ${row.book_title}: sounds, words, then one full sentence.`
              : 'Dictation: sounds, words, then one full sentence.' }
          : { clock: '5:00', title: 'Prove it', detail: book
              ? `Independent show-what-you-know: reread ${row.book_title} and answer the talk-about questions.`
              : 'Independent show-what-you-know across the week’s work.' };

  return {
    minutes: 12,
    steps: [
      { clock: '0:00', title: 'Speed review', detail: 'One minute of sound recognition: sound cards for every sound so far, said cold.' },
      { clock: '1:00', title: `Words with ${isRule ? 'the pattern' : s}`, detail: `Blend and read a short list of words featuring ${isRule ? row.focus : s}. My turn, your turn, then cold.` },
      main,
      { clock: '10:00', title: 'Tricky words', detail: `Two minutes on this level’s tricky words: read them, spot them, use one in a sentence.` },
    ],
    worksheet,
  };
}

const JOURNEY_MAP_URL = '/journey/lesson_map.json';

let cached: JourneyModel | null = null;
let inflight: Promise<JourneyModel> | null = null;

export function fetchJourneyModel(): Promise<JourneyModel> {
  if (cached) return Promise.resolve(cached);
  if (!inflight) {
    inflight = fetch(JOURNEY_MAP_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`journey map fetch failed: ${res.status}`);
        return res.json() as Promise<LessonMapFile>;
      })
      .then((file) => {
        cached = buildJourneyModel(file);
        return cached;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export function useJourneyModel(): { model: JourneyModel | null; error: string | null } {
  const [model, setModel] = useState<JourneyModel | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (model) return;
    let live = true;
    fetchJourneyModel()
      .then((m) => live && setModel(m))
      .catch((e) => live && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      live = false;
    };
  }, [model]);

  return { model, error };
}
