import type { SoundSheetData } from '@/data/soundSchema';

import a from '@/data/sounds/a';

// ---------------------------------------------------------------------------
// SOUND REGISTRY — maps grapheme id -> single-sound sheet data.
// Add a sound: create src/data/sounds/<id>.ts and add it here.
// ---------------------------------------------------------------------------

export const SOUND_SHEETS: Record<string, SoundSheetData> = {
  [a.id]: a,
};

export function getSoundSheet(id: string): SoundSheetData | undefined {
  return SOUND_SHEETS[id];
}

/** Every sound sheet, expressed in the {book, sheet} shape the PDF script uses
 *  (book = "sound", sheet = grapheme id => URL /print/sound/<id>). */
export function allSoundSheets(): { book: string; sheet: string }[] {
  return Object.keys(SOUND_SHEETS).map((id) => ({ book: 'sound', sheet: id }));
}
