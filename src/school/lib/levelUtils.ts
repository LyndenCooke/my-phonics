/**
 * Convenience helpers for school-side UI.
 */
import { getSchoolLevel } from '../data/levels';

export function levelHex(level: number): string {
  return getSchoolLevel(level)?.hex ?? '#888888';
}

export function levelName(level: number): string {
  return getSchoolLevel(level)?.name ?? `Level ${level}`;
}

export function levelColourName(level: number): string {
  return getSchoolLevel(level)?.colourName ?? '';
}
