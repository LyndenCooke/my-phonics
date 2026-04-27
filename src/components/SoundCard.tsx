import { Volume2 } from 'lucide-react';
import clipartCues from '@/lib/clipartCues.json';

// Build a fast lookup: sound -> { level, cue, filename }
type Cue = { sound: string; cue: string; subject: string; story_source?: string };
type LevelCues = { name: string; colour: string; cues: Cue[] };

const SOUND_LOOKUP: Record<string, { level: number; cue: string; filename: string; colour: string }> = {};
for (const [key, val] of Object.entries(clipartCues)) {
  if (!key.startsWith('level_')) continue;
  const data = val as LevelCues;
  const level = parseInt(key.replace('level_', ''), 10);
  for (const c of data.cues) {
    const slug = (s: string) => s.replace(/-/g, '_').replace(/ /g, '_').toLowerCase();
    SOUND_LOOKUP[c.sound] = {
      level,
      cue: c.cue,
      filename: `${slug(c.sound)}_${slug(c.cue)}.png`,
      colour: data.colour,
    };
  }
}

/**
 * A printable-poster-style sound card. Uses the same image that appears on
 * the printed sound mat so the on-screen and printed materials are identical.
 *
 * Falls back to a plain letter button when no card image exists for a
 * grapheme (e.g. doubled-letter spellings ck/ff/ll/ss/zz which we
 * intentionally exclude from the chart but which still appear in some books).
 */
export function SoundCard({
  group,
  isPlaying,
  onTap,
  fallbackBg,
  fallbackText,
}: {
  group: string;                  // e.g. "nk" or "ay/ai"
  isPlaying: boolean;
  onTap: () => void;
  fallbackBg: string;             // tailwind classes for fallback gradient
  fallbackText: string;           // tailwind classes for fallback text colour
}) {
  const sounds = group.split('/');
  const primary = sounds.find((s) => SOUND_LOOKUP[s]) ?? sounds[0];
  const meta = SOUND_LOOKUP[primary];

  if (!meta) {
    return (
      <button
        onClick={onTap}
        aria-label={`Play sound ${sounds.join(' or ')}`}
        className={`relative py-6 md:py-8 lg:py-10 px-2 rounded-2xl font-extrabold leading-none transition-all duration-200 shadow-md active:scale-95
          ${isPlaying
            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white scale-[1.06]'
            : `bg-gradient-to-br ${fallbackBg} ${fallbackText} hover:shadow-xl hover:scale-[1.02]`}`}
        style={{ fontFamily: "'Andika', sans-serif" }}
      >
        <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl">{sounds.join(' ')}</span>
        {isPlaying && <Volume2 className="absolute top-3 right-3 w-4 h-4 md:w-5 md:h-5 text-white/90" />}
      </button>
    );
  }

  const src = `/phonics/cards/level_${meta.level}/${meta.filename}`;
  return (
    <button
      onClick={onTap}
      aria-label={`Play sound ${primary} as in ${meta.cue}`}
      className={`relative rounded-2xl overflow-hidden bg-white transition-all duration-200 shadow-md active:scale-95
        ${isPlaying ? 'ring-4 ring-offset-2 ring-amber-400 scale-[1.04]' : 'hover:shadow-xl hover:scale-[1.02]'}`}
    >
      <img
        src={src}
        alt={`${primary} as in ${meta.cue}`}
        className="block w-full h-full object-contain"
        draggable={false}
      />
      {isPlaying && (
        <Volume2 className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 text-slate-700 bg-white/80 rounded-full p-0.5" />
      )}
    </button>
  );
}
