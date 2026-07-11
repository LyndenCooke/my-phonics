import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildJourneyModel,
  blockState,
  lessonOutline,
  levelProgress,
  levelState,
  locateLesson,
  type LessonMapFile,
} from './journeyData';

// Test against the real generated map so the model always matches the
// curriculum spine. Regenerate with: npm run journey:build
const file: LessonMapFile = JSON.parse(
  readFileSync(resolve(__dirname, '../../../public/journey/lesson_map.json'), 'utf8'),
);

const model = buildJourneyModel(file);

describe('journey model — invariants', () => {
  it('covers all 462 lessons across 8 levels with no gaps', () => {
    expect(model.totalLessons).toBe(462);
    expect(model.levels).toHaveLength(8);
    let next = 1;
    for (const level of model.levels) {
      expect(level.firstN).toBe(next);
      for (const block of level.blocks) {
        expect(block.firstN).toBe(next);
        next = block.lastN + 1;
        // Day pips inside a block run 1..day_total with no gaps.
        block.rows.forEach((row, i) => expect(row.day).toBe(i + 1));
      }
      expect(level.lastN).toBe(next - 1);
    }
    expect(next - 1).toBe(462);
  });

  it('uses the exact ledger colours in level order', () => {
    const hexes = model.levels.map((l) => l.meta.hex);
    expect(hexes).toEqual([
      '#E84B8A', '#F97066', '#F59E0B', '#22C55E',
      '#3B82F6', '#6366F1', '#8B5CF6', '#14B8A6',
    ]);
  });

  it('marks assessments and PSC mocks as flags', () => {
    const flags = model.levels.flatMap((l) => l.blocks).filter((b) => b.isFlag);
    expect(flags.length).toBeGreaterThan(0);
    for (const flag of flags) {
      expect(['assessment', 'psc_mock']).toContain(flag.type);
    }
  });

  it('labels sound weeks with their graphemes, joining split weeks', () => {
    const l2 = model.levels[1];
    const labels = l2.blocks.map((b) => b.label);
    expect(labels).toContain('f + ff');
    const l3 = model.levels[2];
    expect(l3.blocks.map((b) => b.label)).toEqual([
      'sh', 'nk', 'ch', 'th', 'ng', 'qu', 'zz', 'Quick Check', 'Keep-up',
    ]);
  });
});

describe('acceptance: currentLesson = 83', () => {
  it('places lesson 83 on day 3 of the L3 sh week', () => {
    const pos = locateLesson(model, 83);
    expect(pos.levelIndex).toBe(2);
    const block = model.levels[2].blocks[pos.blockIndex];
    expect(block.label).toBe('sh');
    expect(pos.row.day).toBe(3);
    expect(pos.row.day_total).toBe(5);
  });

  it('shows L1 and L2 complete, L3 current and L4 onwards future', () => {
    expect(levelState(model.levels[0], 83)).toBe('complete');
    expect(levelState(model.levels[1], 83)).toBe('complete');
    expect(levelState(model.levels[2], 83)).toBe('current');
    for (let i = 3; i < 8; i++) expect(levelState(model.levels[i], 83)).toBe('future');
  });

  it('counts 3 of 37 lessons inside L3', () => {
    expect(levelProgress(model.levels[2], 83)).toEqual({ done: 3, total: 37 });
    expect(levelProgress(model.levels[0], 83)).toEqual({ done: 27, total: 27 });
    expect(levelProgress(model.levels[7], 83)).toEqual({ done: 0, total: 54 });
  });

  it('pulses only the sh block', () => {
    const states = model.levels[2].blocks.map((b) => blockState(b, 83));
    expect(states[0]).toBe('current');
    expect(states.slice(1).every((s) => s === 'future')).toBe(true);
  });
});

describe('edges', () => {
  it('lesson 1 is the very start', () => {
    const pos = locateLesson(model, 1);
    expect(pos.levelIndex).toBe(0);
    expect(pos.blockIndex).toBe(0);
    expect(pos.row.n).toBe(1);
    expect(levelState(model.levels[0], 1)).toBe('current');
  });

  it('lesson 462 is the final block of L8', () => {
    const pos = locateLesson(model, 462);
    expect(pos.levelIndex).toBe(7);
    expect(pos.row.n).toBe(462);
    expect(levelState(model.levels[7], 462)).toBe('current');
  });

  it('clamps out-of-range lesson numbers', () => {
    expect(locateLesson(model, 0).row.n).toBe(1);
    expect(locateLesson(model, 9999).row.n).toBe(462);
  });

  it('lesson 250 sits in the L5 PSC prep run', () => {
    const pos = locateLesson(model, 250);
    expect(pos.levelIndex).toBe(4);
    expect(pos.row.type).toBe('psc_prep');
  });
});

describe('lessonOutline', () => {
  const rowFor = (n: number) => file.map[n - 1];

  it('every lesson produces an outline that opens with sound recognition', () => {
    for (const row of file.map) {
      const o = lessonOutline(row);
      expect(o.steps.length).toBeGreaterThanOrEqual(3);
      expect(o.steps[0].clock).toBe('0:00');
      expect(o.minutes).toBeGreaterThanOrEqual(10);
      expect(o.worksheet.title.length).toBeGreaterThan(0);
    }
  });

  it('a read day includes the level book as the main slot', () => {
    const o = lessonOutline(rowFor(83)); // Read it: The Fish in the Tank (sh)
    const main = o.steps.find((s) => s.title.includes('Fish in the Tank'));
    expect(main).toBeDefined();
    expect(o.steps[0].title).toBe('Speed review');
    expect(o.steps.some((s) => s.title.includes('sh'))).toBe(true);
    expect(o.steps.some((s) => s.title === 'Tricky words')).toBe(true);
    expect(o.worksheet.detail).toContain('10 to 15 minutes');
  });

  it('assessment days swap the worksheet for praise', () => {
    const o = lessonOutline(rowFor(116)); // Quick Check: L3
    expect(o.steps.some((s) => s.title.includes('Quick Check'))).toBe(true);
    expect(o.worksheet.title).toBe('No worksheet today');
  });

  it('PSC prep days are read-only', () => {
    const o = lessonOutline(rowFor(250)); // psc_prep er
    expect(o.steps.some((s) => s.title.includes('Read-only sound: er'))).toBe(true);
    expect(o.steps.some((s) => s.title === 'Alien words')).toBe(true);
  });
});
