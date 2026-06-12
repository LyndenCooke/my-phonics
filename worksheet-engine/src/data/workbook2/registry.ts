import type { W2LevelData } from '@/data/workbook2/levels';
import { L6_DATA } from '@/data/workbook2/l6';
import { L1_DATA } from '@/data/workbook2/l1';
import { L2_DATA } from '@/data/workbook2/l2';
import { L3_DATA } from '@/data/workbook2/l3';
import { L4_DATA } from '@/data/workbook2/l4';
import { L5_DATA } from '@/data/workbook2/l5';
import { L7_DATA } from '@/data/workbook2/l7';
import { L8_DATA } from '@/data/workbook2/l8';

// One booklet per level. Every selected word and sentence in these files
// carries a source pointer (see L6_SELECTIONS.md and the per-level notes in
// each file); the provenance checker (scripts/check-w2-provenance.ts)
// verifies the selections against the shipped story texts and word lists.

const BY_LEVEL: Record<number, W2LevelData> = {
  1: L1_DATA,
  2: L2_DATA,
  3: L3_DATA,
  4: L4_DATA,
  5: L5_DATA,
  6: L6_DATA,
  7: L7_DATA,
  8: L8_DATA,
};

export function getW2Level(level: number): W2LevelData {
  const data = BY_LEVEL[level];
  if (!data) throw new Error(`No W2 workbook data for level ${level}.`);
  return data;
}

export function w2Levels(): number[] {
  return Object.keys(BY_LEVEL).map(Number);
}
