import { Sparkles, ArrowRight } from 'lucide-react';
import { JOURNEY_LEVELS } from '@/lib/levels8';

// Journey-8 name + colour per level, sourced from the journey source of truth.
const LEVEL_CONFIG: Record<number, { colour: string; name: string }> =
  Object.fromEntries(JOURNEY_LEVELS.map((l) => [l.level, { colour: l.hex, name: l.name }]));

interface AssessmentResultProps {
  childName: string;
  level: number;
  onContinue: () => void;
}

export default function AssessmentResult({ childName, level, onContinue }: AssessmentResultProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        {/* Celebration icon */}
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center text-white shadow-xl animate-in zoom-in duration-500"
          style={{ backgroundColor: config.colour }}
        >
          <Sparkles size={40} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Well done{childName ? `, ${childName}` : ''}!
        </h1>

        <p className="text-muted-foreground mb-6">
          {childName || 'Your child'} is at{' '}
          <strong style={{ color: config.colour }}>
            Level {level}: {config.name}
          </strong>
        </p>

        {/* Free book unlock banner */}
        <div
          className="rounded-xl p-4 mb-6 text-white"
          style={{ backgroundColor: config.colour }}
        >
          <p className="font-bold text-lg mb-1">
            You've unlocked 1 free interactive book!
          </p>
          <p className="text-white/80 text-sm">
            A Level {level} book matched to exactly what {childName || 'they'} can read.
          </p>
        </div>

        <button
          onClick={onContinue}
          className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          Continue
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
