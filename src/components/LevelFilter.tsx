import { LEVELS } from '@/lib/types';

interface LevelFilterProps {
  selected: number | null;
  onSelect: (level: number | null) => void;
}

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const levelBorders: Record<number, string> = {
  1: 'border-level-1 text-level-1', 2: 'border-level-2 text-level-2', 3: 'border-level-3 text-level-3',
  4: 'border-level-4 text-level-4', 5: 'border-level-5 text-level-5', 6: 'border-level-6 text-level-6',
};

export default function LevelFilter({ selected, onSelect }: LevelFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
          selected === null
            ? 'gradient-primary text-primary-foreground border-transparent shadow-button'
            : 'border-border text-muted-foreground hover:border-primary/30 bg-transparent'
        }`}
      >
        All
      </button>
      {LEVELS.map((level) => (
        <button
          key={level.level}
          onClick={() => onSelect(level.level)}
          className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border ${
            selected === level.level
              ? `${levelBgs[level.level]} text-white border-transparent shadow-sm`
              : `${levelBorders[level.level]} border bg-transparent`
          }`}
        >
          L{level.level}
        </button>
      ))}
    </div>
  );
}