import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { SoundStatus, ResultItem } from '@/lib/adaptiveEngine';
import { LEVEL_NAMES_SHORT } from '@/lib/adaptiveEngine';
import type { Category } from '@/lib/assessmentData';
import { CATEGORY_LABELS } from '@/lib/assessmentData';

interface SoundMapProps {
  sounds: SoundStatus[];
  results?: ResultItem[];
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

const CATEGORY_ORDER: Category[] = ['sound_recognition', 'word_reading', 'alien_words', 'tricky_words'];

export function SoundMap({ sounds, results }: SoundMapProps) {
  const levels = [1, 2, 3, 4, 5, 6];

  // Group sounds by level
  const groupedSounds = levels.map(level => ({
    level,
    sounds: sounds.filter(s => s.level === level),
  }));

  // Group results by level and category
  const groupedResults = results
    ? levels.map(level => ({
        level,
        categories: CATEGORY_ORDER
          .map(cat => ({
            category: cat,
            items: (results || []).filter(r => r.level === level && r.category === cat),
          }))
          .filter(c => c.items.length > 0),
      }))
    : null;

  // Count stats across all items (sounds + results)
  const allItems = results || sounds;
  const known = allItems.filter(s => s.status === 'known').length;
  const unknown = allItems.filter(s => s.status === 'unknown').length;
  const untested = allItems.filter(s => s.status === 'untested').length;

  // Determine which levels are fully untested (collapse by default)
  const fullyUntested = new Set(
    levels.filter(level => {
      const levelItems = allItems.filter(s => s.level === level);
      return levelItems.length > 0 && levelItems.every(s => s.status === 'untested');
    })
  );

  // Track expanded/collapsed state
  const [expanded, setExpanded] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    levels.forEach(level => {
      initial[level] = !fullyUntested.has(level);
    });
    return initial;
  });

  const toggleLevel = (level: number) => {
    setExpanded(prev => ({ ...prev, [level]: !prev[level] }));
  };

  return (
    <div className="space-y-3">
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
      {levels.map(level => {
        const levelSounds = groupedSounds.find(g => g.level === level)?.sounds || [];
        const levelCategories = groupedResults?.find(g => g.level === level)?.categories;
        if (levelSounds.length === 0 && (!levelCategories || levelCategories.length === 0)) return null;

        const isExpanded = expanded[level];
        const isFullyUntested = fullyUntested.has(level);
        const levelItems = allItems.filter(s => s.level === level);
        const levelKnown = levelItems.filter(s => s.status === 'known').length;
        const levelUnknown = levelItems.filter(s => s.status === 'unknown').length;

        return (
          <div
            key={level}
            className={`rounded-xl border ${LEVEL_BORDER_COLORS[level]} ${LEVEL_BG_COLORS[level]} overflow-hidden`}
          >
            {/* Level header — clickable to expand/collapse */}
            <button
              onClick={() => toggleLevel(level)}
              className="w-full flex items-center justify-between p-3 text-left"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <p className="text-xs font-bold text-muted-foreground">
                  Level {level} — {LEVEL_NAMES_SHORT[level]}
                </p>
              </div>
              {/* Summary badges */}
              <div className="flex gap-1.5 text-[10px]">
                {levelKnown > 0 && (
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold">
                    {levelKnown}
                  </span>
                )}
                {levelUnknown > 0 && (
                  <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                    {levelUnknown}
                  </span>
                )}
                {isFullyUntested && (
                  <span className="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full font-bold">
                    Not tested
                  </span>
                )}
              </div>
            </button>

            {/* Expanded content */}
            {isExpanded && (
              <div className="px-3 pb-3 space-y-2.5">
                {/* If we have full results, show by category */}
                {levelCategories && levelCategories.length > 0 ? (
                  levelCategories.map(({ category, items }) => (
                    <div key={category}>
                      <p className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                        {CATEGORY_LABELS[category]}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {items.map((item, idx) => (
                          <span
                            key={`${item.item}-${idx}`}
                            className={`inline-flex items-center justify-center px-2 py-1 rounded-full border text-xs font-bold min-w-[36px] ${STATUS_STYLES[item.status]}`}
                            title={`${item.item}: ${item.status}`}
                          >
                            {item.item}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  /* Fallback: sounds only */
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
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default SoundMap;
