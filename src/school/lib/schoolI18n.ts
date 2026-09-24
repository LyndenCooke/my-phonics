/**
 * Render-time translation helpers for school data that lives in shared
 * (English) data modules. The data files stay untouched — we translate the
 * displayed copy only. Phonics focus labels ("sh, ch, th") and book titles
 * are child-reading content and are returned unchanged.
 */
import type { TFunction } from 'i18next';

/** "Autumn 1" → translated half-term window label. */
export function windowLabel(t: TFunction, label: string): string {
  const key = label.toLowerCase().replace(/\s+/g, '');
  return t(`schoolApp:windows.${key}`, { defaultValue: label });
}

/** Block focus labels are graphemes (kept English) except the review block. */
export function focusLabel(t: TFunction, label: string): string {
  return label === 'Level review' ? t('schoolApp:block.levelReview') : label;
}

/** Teacher judgement key → translated label. */
export function judgementLabel(t: TFunction, j: 'continue' | 'ready_soon' | 'needs_support'): string {
  return t(`schoolApp:judgement.${j}`);
}

/** Level colour name ("Pink") → translated colour. */
export function colourLabel(t: TFunction, colour: string): string {
  return t(`schoolApp:colours.${colour.toLowerCase()}`, { defaultValue: colour });
}
