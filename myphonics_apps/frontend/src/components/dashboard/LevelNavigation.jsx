import React from 'react';

export default function LevelNavigation({ currentLevel, onSelectLevel }) {
    const levels = [
        { id: 'all', label: 'Overview' },
        { id: 1, label: 'Level 1', color: 'bg-level-1', text: 'text-level-1' },
        { id: 2, label: 'Level 2', color: 'bg-level-2', text: 'text-level-2' },
        { id: 3, label: 'Level 3', color: 'bg-level-3', text: 'text-level-3' },
        { id: 4, label: 'Level 4', color: 'bg-level-4', text: 'text-level-4' },
        { id: 5, label: 'Level 5', color: 'bg-level-5', text: 'text-level-5' },
        { id: 6, label: 'Level 6', color: 'bg-level-6', text: 'text-level-6' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-slate-200/50 pb-4">
            {levels.map((level) => {
                const isActive = currentLevel === level.id;
                return (
                    <button
                        key={level.id}
                        onClick={() => onSelectLevel(level.id)}
                        className={`px-5 py-2.5 rounded-full font-sans text-sm font-semibold transition-all duration-300 relative border overflow-hidden
              ${isActive
                                ? 'bg-white border-slate-200 shadow-sm text-slate-900'
                                : 'bg-transparent border-transparent text-slate-500 hover:text-slate-800 hover:bg-white/50'
                            }`}
                    >
                        {isActive && level.color && (
                            <span className={`absolute top-0 left-0 w-full h-1 ${level.color}`} />
                        )}
                        {level.label}
                    </button>
                );
            })}
        </div>
    );
}
