import { describe, it, expect } from 'vitest';
import { SCHOOL_LEVELS } from './levels';
import { SOUND_BOOKS } from './soundBooks';
import { BLENDING_BOOKS } from './blendingBooks';
import { SCHOOL_BOOKS } from './bookCatalog';
import {
  TEACHING_SEQUENCE,
  getTeachingSequence,
  nextStep,
  allSteps,
  type TeachingStep,
} from './teachingSequence';

const knownIds = new Set<string>([
  ...SOUND_BOOKS.map((s) => s.id),
  ...BLENDING_BOOKS.map((b) => b.id),
  ...SCHOOL_BOOKS.map((b) => b.id),
]);

describe('teachingSequence — invariants', () => {
  it('covers all 8 levels', () => {
    for (const lvl of SCHOOL_LEVELS) {
      expect(TEACHING_SEQUENCE[lvl.level], `level ${lvl.level}`).toBeDefined();
      expect(getTeachingSequence(lvl.level).length).toBeGreaterThan(0);
    }
  });

  it('every resourceId resolves to a real resource', () => {
    for (const step of allSteps()) {
      expect(knownIds.has(step.resourceId), `unknown id: ${step.resourceId}`).toBe(true);
    }
  });

  it('every dependsOn id appears earlier in the same level', () => {
    for (const [lvlStr, steps] of Object.entries(TEACHING_SEQUENCE)) {
      const seenInLevel = new Set<string>();
      for (const step of steps) {
        for (const dep of step.dependsOn) {
          expect(
            seenInLevel.has(dep),
            `L${lvlStr} step ${step.order} (${step.resourceId}) depends on ${dep} which has not appeared earlier in the level`,
          ).toBe(true);
        }
        seenInLevel.add(step.resourceId);
      }
    }
  });

  it('order field is contiguous 1..n within each level', () => {
    for (const [lvlStr, steps] of Object.entries(TEACHING_SEQUENCE)) {
      for (let i = 0; i < steps.length; i += 1) {
        expect(steps[i].order, `L${lvlStr} idx ${i}`).toBe(i + 1);
      }
    }
  });

  it('every Sound Book / Blending Book / Storybook appears exactly once across all sequences', () => {
    const counts = new Map<string, number>();
    for (const step of allSteps()) {
      counts.set(step.resourceId, (counts.get(step.resourceId) ?? 0) + 1);
    }
    for (const id of knownIds) {
      expect(counts.get(id) ?? 0, `${id} appears ${counts.get(id) ?? 0} times`).toBe(1);
    }
  });

  it('every step belongs to the level that owns its resource', () => {
    const ownerByLevel: Record<string, number> = {};
    for (const s of SOUND_BOOKS)   ownerByLevel[s.id] = s.level;
    for (const b of BLENDING_BOOKS) ownerByLevel[b.id] = b.level;
    for (const b of SCHOOL_BOOKS)  ownerByLevel[b.id] = b.level;

    for (const [lvlStr, steps] of Object.entries(TEACHING_SEQUENCE)) {
      const lvl = Number(lvlStr);
      for (const step of steps) {
        expect(
          ownerByLevel[step.resourceId],
          `${step.resourceId} placed in L${lvl} but resource belongs to L${ownerByLevel[step.resourceId]}`,
        ).toBe(lvl);
      }
    }
  });

  it('kind matches the actual resource type', () => {
    const kindById: Record<string, TeachingStep['kind']> = {};
    for (const s of SOUND_BOOKS)   kindById[s.id] = 'sound_book';
    for (const b of BLENDING_BOOKS) kindById[b.id] = 'blending_book';
    for (const b of SCHOOL_BOOKS)  kindById[b.id] = 'storybook';
    for (const step of allSteps()) {
      expect(kindById[step.resourceId], `${step.resourceId} kind mismatch`).toBe(step.kind);
    }
  });
});

describe('teachingSequence — nextStep()', () => {
  it('returns the very first step when nothing is completed', () => {
    expect(nextStep(1, new Set())?.resourceId).toBe('SD-L1.01');
    expect(nextStep(4, new Set())?.resourceId).toBe('SD-L4.01');
  });

  it('skips completed steps', () => {
    const done = new Set(['SD-L1.01', 'SD-L1.02', 'SD-L1.03']);
    expect(nextStep(1, done)?.resourceId).toBe('SD-L1.04');
  });

  it('does not return a step whose deps are not satisfied', () => {
    // BB-L1.01 depends on SD-L1.01..06 — completing only some shouldn't unlock it
    const done = new Set([
      'SD-L1.01','SD-L1.02','SD-L1.03','SD-L1.04','SD-L1.05','SD-L1.06',
      'BB-L1.01','SB-L1.1',
      'SD-L1.07','SD-L1.08','SD-L1.09','SD-L1.10',
    ]);
    // All single SDs done + BB1 + SB1 + all MDGO SDs — next is BB-L1.02
    expect(nextStep(1, done)?.resourceId).toBe('BB-L1.02');
  });

  it('returns undefined when the level is complete', () => {
    const done = new Set(getTeachingSequence(8).map((s) => s.resourceId));
    expect(nextStep(8, done)).toBeUndefined();
  });
});

describe('teachingSequence — counts match resource files', () => {
  it.each(SCHOOL_LEVELS.map((l) => l.level))('L%d count matches resource totals', (lvl) => {
    const sd = SOUND_BOOKS.filter((s) => s.level === lvl).length;
    const bb = BLENDING_BOOKS.filter((b) => b.level === lvl).length;
    const sb = SCHOOL_BOOKS.filter((b) => b.level === lvl).length;
    const expected = sd + bb + sb;
    expect(getTeachingSequence(lvl).length).toBe(expected);
  });
});
