import type { SoundSheetData } from '@/data/soundSchema';

// ---------------------------------------------------------------------------
// The Sound a  —  Level 1  —  recreation of Sound_Pack/sound_a.pdf
// Content matches the reference sheet exactly. Clipart we don't own yet renders
// a clean placeholder word inside the card (layout-first; art comes next).
// ---------------------------------------------------------------------------

const a: SoundSheetData = {
  id: 'a',
  grapheme: 'a',
  phoneme: 'a',
  level: 1,
  levelLabel: 'Level 1',
  characterImageKey: 'tap-mascot', // Tap! Tap! Tap! boy + cat
  strand: 'Handwriting',

  // §2 — words that contain the /a/ sound, traced over a picture cue.
  // 'cat-word' is the sound-strand's full-colour cat (coloured by design); the
  // bare 'cat' key belongs to the grammar manifest and is gated on its status.
  traceWords: [
    { word: 'cat', imageKey: 'cat-word' },
    { word: 'mat', imageKey: 'mat' },
    { word: 'hat', imageKey: 'hat' },
    { word: 'bag', imageKey: 'bag' },
    { word: 'pan', imageKey: 'pan' },
  ],

  // §3 — write the missing a. The grapheme is blanked at its real position
  // (ant -> _nt, axe -> _xe, rat -> r_t, jam -> j_m).
  missingWords: [
    { word: 'ant', imageKey: 'ant' },
    { word: 'axe', imageKey: 'axe' },
    { word: 'rat', imageKey: 'rat' },
    { word: 'jam', imageKey: 'jam' },
  ],
};

export default a;
