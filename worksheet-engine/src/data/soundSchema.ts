// ---------------------------------------------------------------------------
// SOUND-SHEET SCHEMA — input for a SINGLE-GRAPHEME worksheet.
//
// These sheets are indexed by SOUND, not by book: one rich full page per
// grapheme. The layout is a LOCKED recreation of the reference Sound-Pack
// design (public/worksheets/Sound_Pack/sound_a.pdf): a pink poster with three
// bordered panels — trace the letter, trace the words, write the missing sound.
// Templates reproduce that layout exactly; only the data below changes.
// ---------------------------------------------------------------------------

import type { DecodableWord } from '@/data/schema';

export interface SoundSheetData {
  /** Stable id used in the print URL, e.g. "a" or "sh". */
  id: string;
  /** The grapheme the child writes/traces, e.g. "a". */
  grapheme: string;
  /** The phoneme label shown to adults, e.g. "a" -> rendered as "Sound · a". */
  phoneme: string;
  /** 1–8, selects the level theme (NO default). */
  level: number;
  levelLabel: string; // "Level 1"
  /** Optional header-tile mascot (clipart key) — e.g. the book's characters.
   *  Shown in the white tile instead of the bare grapheme. */
  characterImageKey?: string;
  /** Right-hand header pill label — the booklet STRAND this sheet belongs to,
   *  e.g. "Handwriting" / "Phonics" / "Grammar". Defaults to "Sound · <x>". */
  strand?: string;
  /** §2 "Trace the Words": picture + dotted word to trace + blank to write.
   *  Each word should CONTAIN the grapheme. Reference uses 5. */
  traceWords: DecodableWord[];
  /** §3 "Write the Missing <x>": picture + word with the grapheme blanked out.
   *  Reference uses 4. */
  missingWords: DecodableWord[];
}
