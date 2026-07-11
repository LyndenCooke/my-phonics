/**
 * Demo route for the Curriculum Journey Map.
 * Shows the acceptance lessons (1, 83, 250, 462) plus a free slider so
 * every state of the map can be checked by eye at any width.
 */

import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import JourneyMap from '@/components/journey/JourneyMap';

const DEMO_LESSONS = [1, 83, 250, 462];

export default function JourneyMapDemo() {
  const [lesson, setLesson] = useState(83);
  const [params] = useSearchParams();
  const instant = params.get('instant') === '1';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="font-display font-extrabold text-2xl text-slate-800 text-center">
          Journey Map demo
        </h1>
        <p className="text-sm text-slate-500 text-center mt-1 mb-5">
          Pick a lesson to see the map from that point in the journey.
        </p>

        <div className="flex items-center justify-center gap-2 mb-3" role="group" aria-label="Demo lessons">
          {DEMO_LESSONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setLesson(n)}
              aria-pressed={lesson === n}
              className={`min-h-10 px-4 py-2 rounded-full text-sm font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                lesson === n
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-transparent'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Lesson {n}
            </button>
          ))}
        </div>

        <label className="block max-w-md mx-auto mb-8 text-center">
          <span className="text-xs font-medium text-slate-500">Or any lesson: {lesson}</span>
          <input
            type="range"
            min={1}
            max={462}
            value={lesson}
            onChange={(e) => setLesson(Number(e.target.value))}
            className="w-full mt-1"
            aria-label="Current lesson"
          />
        </label>

        <JourneyMap currentLesson={lesson} animated={!instant} />
      </div>
    </div>
  );
}
