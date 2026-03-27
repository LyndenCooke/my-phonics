import type { SoundStatus } from '@/lib/adaptiveEngine';
import { LEVEL_NAMES_SHORT } from '@/lib/adaptiveEngine';

interface SoundMapProps {
  sounds: SoundStatus[];
}

const STATUS_STYLES = {
  known: 'bg-green-100 border-green-400 text-green-800',
  unknown: 'bg-red-100 border-red-400 text-red-800',
  untested: 'bg-gray-100 border-gray-300 text-gray-400',
};

const LEVEL_BORDER_COLORS: Record<number, string> = {
  1: 'border-pink-300',
  2: 'border-amber-300',
  3: 'border-green-300',
  4: 'border-blue-300',
  5: 'border-purple-300',
  6: 'border-teal-300',
};

const LEVEL_BG_COLORS: Record<number, string> = {
  1: 'bg-pink-50',
  2: 'bg-amber-50',
  3: 'bg-green-50',
  4: 'bg-blue-50',
  5: 'bg-purple-50',
  6: 'bg-teal-50',
};

export function SoundMap({ sounds }: SoundMapProps) {
  // Group sounds by level
  const levels = [1, 2, 3, 4, 5, 6];
  const grouped = levels.map(level => ({
    level,
    sounds: sounds.filter(s => s.level === level),
  }));

  // Count stats
  const known = sounds.filter(s => s.status === 'known').length;
  const unknown = sounds.filter(s => s.status === 'unknown').length;
  const untested = sounds.filter(s => s.status === 'untested').length;

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex gap-4 justify-center text-xs">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-green-400 inline-block" />
          Known ({known})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-400 inline-block" />
          To learn ({unknown})
        </span>
        {untested > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-300 inline-block" />
            Not tested ({untested})
          </span>
        )}
      </div>

      {/* Level groups */}
      {grouped.map(({ level, sounds: levelSounds }) => {
        if (levelSounds.length === 0) return null;

        return (
          <div
            key={level}
            className={`rounded-xl border ${LEVEL_BORDER_COLORS[level]} ${LEVEL_BG_COLORS[level]} p-3`}
          >
            <p className="text-xs font-bold text-muted-foreground mb-2">
              Level {level} — {LEVEL_NAMES_SHORT[level]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {levelSounds.map((sound, idx) => (
                <span
                  key={`${sound.grapheme}-${idx}`}
                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full border text-xs font-bold min-w-[36px] ${STATUS_STYLES[sound.status]}`}
                  title={`${sound.displayName}: ${sound.status}`}
                >
                  {sound.displayName}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default SoundMap;
