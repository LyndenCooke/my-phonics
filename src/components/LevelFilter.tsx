/**
 * LevelFilter — horizontal chip rail over the 8-level journey.
 *
 * `selected` is a JOURNEY level (1–8, levels8.ts), not a legacy catalogue
 * level. Chips show the level's ledger colour + name so children and
 * parents navigate by colour/name, never by internal codes.
 */
import { JOURNEY_LEVELS } from '@/lib/levels8';

interface LevelFilterProps {
  selected: number | null;
  onSelect: (level: number | null) => void;
}

export default function LevelFilter({ selected, onSelect }: LevelFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
          selected === null
            ? 'bg-foreground text-background border-transparent'
            : 'border-border bg-card text-muted-foreground hover:text-foreground'
        }`}
      >
        All books
      </button>
      {JOURNEY_LEVELS.map((level) => {
        const active = selected === level.level;
        return (
          <button
            key={level.level}
            onClick={() => onSelect(level.level)}
            aria-pressed={active}
            className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all duration-200 border"
            style={active
              ? { background: level.hex, borderColor: level.hex, color: '#fff' }
              : { background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: level.inkHex }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: active ? '#fff' : level.hex }}
            />
            {level.name}
          </button>
        );
      })}
    </div>
  );
}
