import { useMemo, useState } from 'react';
import { BookOpen, Camera, FileText, Lock, CheckCircle2, ChevronDown, RotateCcw } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import {
  getTeachingSequence,
  nextStep,
  type TeachingStep,
} from '../data/teachingSequence';
import { getSoundBookById } from '../data/soundBooks';
import { getBlendingBookById } from '../data/blendingBooks';
import { getSchoolBookById } from '../data/bookCatalog';

/**
 * SchoolPathway — per-level visual timeline of the teaching sequence.
 *
 * Reviewers can toggle steps as "completed" to see how dependencies unlock
 * and which step `nextStep()` returns. State is local — nothing persists.
 */
export default function SchoolPathway() {
  const [level, setLevel] = useState<number>(1);
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const steps = useMemo(() => getTeachingSequence(level), [level]);
  const lvl = SCHOOL_LEVELS.find((l) => l.level === level)!;
  const next = useMemo(() => nextStep(level, completed), [level, completed]);

  function toggle(id: string) {
    setCompleted((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function resetLevel() {
    setCompleted(new Set());
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Pathway</h1>
        <p className="text-slate-600 max-w-2xl">
          Ordered teaching sequence for each level. Sound Books introduce graphemes, Blending Books
          practise reading them in words, and Storybooks put them into a narrative.
          Tick steps as a learner finishes them to see which one unlocks next.
        </p>
      </header>

      {/* Level switcher — same chip strip as the dashboard. */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Choose level</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SCHOOL_LEVELS.map((l) => {
            const active = l.level === level;
            return (
              <button
                key={l.level}
                type="button"
                data-school-level={l.level}
                onClick={() => setLevel(l.level)}
                className={[
                  'rounded-xl p-3 text-center text-white transition-transform',
                  active ? 's-bg-level scale-[1.03] s-ring' : 's-bg-level/70 opacity-80 hover:opacity-100',
                ].join(' ')}
              >
                <div className="text-xs font-semibold opacity-90">L{l.level}</div>
                <div className="text-xs font-bold mt-0.5 leading-tight">{l.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Level header card */}
      <section data-school-level={level} className="rounded-2xl border-2 border-slate-200 overflow-hidden bg-white">
        <header className="s-bg-level text-white px-5 py-3 flex items-baseline justify-between">
          <div>
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">
              Level {lvl.level} · {lvl.colourName}
            </span>
            <h2 className="font-display text-2xl font-extrabold">{lvl.name}</h2>
          </div>
          <div className="text-right text-xs opacity-90">
            <div>{lvl.ageRange}</div>
            <div className="mt-0.5">{lvl.phaseLabel}</div>
          </div>
        </header>

        <div className="px-5 py-3 grid sm:grid-cols-4 gap-3 items-center border-b border-slate-100">
          <Stat label="Total steps" value={steps.length} />
          <Stat label="Completed"   value={steps.filter((s) => completed.has(s.resourceId)).length} />
          <Stat label="Unlocked next" value={next ? 1 : 0} hint={next ? next.resourceId : '— level finished'} />
          <button
            type="button"
            onClick={resetLevel}
            disabled={completed.size === 0}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset progress
          </button>
        </div>

        {/* Timeline */}
        <ol className="px-5 py-5 space-y-2">
          {steps.map((step, idx) => (
            <StepCard
              key={step.resourceId}
              step={step}
              isCompleted={completed.has(step.resourceId)}
              isUnlocked={step.dependsOn.every((d) => completed.has(d))}
              isNext={next?.resourceId === step.resourceId}
              onToggle={() => toggle(step.resourceId)}
              isLast={idx === steps.length - 1}
            />
          ))}
        </ol>
      </section>

      <p className="text-xs text-slate-500">
        Steps appear in teaching order. A step is unlocked once every prerequisite in <code className="font-mono">dependsOn</code> is
        ticked. Dependencies are intra-level only — moving up a level is gated separately by the level-passing criteria in
        <code className="font-mono">levels.ts</code>.
      </p>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────── */

function StepCard({
  step,
  isCompleted,
  isUnlocked,
  isNext,
  onToggle,
  isLast,
}: {
  step: TeachingStep;
  isCompleted: boolean;
  isUnlocked: boolean;
  isNext: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const meta = describeStep(step);
  const [open, setOpen] = useState(false);

  const kindStyle =
    step.kind === 'sound_book'    ? 'bg-rose-50 text-rose-700 border-rose-200' :
    step.kind === 'blending_book' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                     'bg-emerald-50 text-emerald-700 border-emerald-200';
  const KindIcon =
    step.kind === 'sound_book'    ? Camera :
    step.kind === 'blending_book' ? FileText :
                                     BookOpen;

  const stateStyle = isCompleted
    ? 'opacity-70'
    : isNext
      ? 's-ring'
      : !isUnlocked
        ? 'opacity-60'
        : '';

  return (
    <li className="relative">
      {/* Connector line down to the next step */}
      {!isLast && (
        <span
          aria-hidden
          className={[
            'absolute left-[1.125rem] top-10 bottom-[-0.5rem] w-px',
            isCompleted ? 'bg-emerald-300' : 'bg-slate-200',
          ].join(' ')}
        />
      )}

      <div
        className={[
          'relative bg-white rounded-xl border-2 border-slate-200 transition-all',
          stateStyle,
        ].join(' ')}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Order + completion checkbox */}
          <button
            type="button"
            onClick={onToggle}
            disabled={!isUnlocked && !isCompleted}
            aria-pressed={isCompleted}
            className={[
              'flex-none w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-colors',
              isCompleted
                ? 'bg-emerald-500 text-white'
                : isUnlocked
                  ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            ].join(' ')}
            title={isCompleted ? 'Mark as not completed' : isUnlocked ? 'Mark as completed' : 'Locked — complete prerequisites first'}
          >
            {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : !isUnlocked ? <Lock className="w-3.5 h-3.5" /> : step.order}
          </button>

          {/* Body */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${kindStyle}`}>
                <KindIcon className="w-3 h-3" />
                {kindLabel(step.kind)}
              </span>
              <code className="font-mono text-[11px] text-slate-500">{step.resourceId}</code>
              {isNext && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200 text-[10px] font-bold uppercase tracking-wider">
                  Next up
                </span>
              )}
              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                  Done
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 leading-tight">{meta.title}</h3>
            {meta.subtitle && <div className="text-xs text-slate-500 mt-0.5">{meta.subtitle}</div>}

            {(meta.graphemes.length > 0 || step.dependsOn.length > 0 || step.note) && (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
                {open ? 'Hide details' : 'Show details'}
              </button>
            )}

            {open && (
              <div className="mt-2 space-y-2 text-xs text-slate-600">
                {meta.graphemes.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Focus</div>
                    <div className="flex flex-wrap gap-1">
                      {meta.graphemes.map((g) => (
                        <span key={g} className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-xs">{g}</span>
                      ))}
                    </div>
                  </div>
                )}
                {step.dependsOn.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Prerequisites</div>
                    <div className="flex flex-wrap gap-1">
                      {step.dependsOn.map((d) => (
                        <code key={d} className="px-1.5 py-0.5 bg-slate-100 rounded font-mono text-[11px]">{d}</code>
                      ))}
                    </div>
                  </div>
                )}
                {step.note && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Note</div>
                    <p className="text-slate-600">{step.note}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{label}</div>
      {hint && <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">{hint}</div>}
    </div>
  );
}

function kindLabel(k: TeachingStep['kind']): string {
  switch (k) {
    case 'sound_book':    return 'Sound Book';
    case 'blending_book': return 'Blending Book';
    case 'storybook':     return 'Storybook';
  }
}

interface StepMeta {
  title: string;
  subtitle?: string;
  graphemes: string[];
}

function describeStep(step: TeachingStep): StepMeta {
  if (step.kind === 'sound_book') {
    const sb = getSoundBookById(step.resourceId);
    if (!sb) return { title: step.resourceId, graphemes: [] };
    return {
      title: sb.title,
      subtitle: sb.sampleWords.slice(0, 4).join(' · '),
      graphemes: sb.comparisonSounds.length
        ? [...sb.graphemes, ...sb.comparisonSounds.map((c) => `alt: ${c}`)]
        : sb.graphemes,
    };
  }
  if (step.kind === 'blending_book') {
    const bb = getBlendingBookById(step.resourceId);
    if (!bb) return { title: step.resourceId, graphemes: [] };
    return { title: bb.title, subtitle: bb.focus, graphemes: bb.graphemes };
  }
  const sb = getSchoolBookById(step.resourceId);
  if (!sb) return { title: step.resourceId, graphemes: [] };
  return {
    title: sb.title,
    subtitle: `Storybook · ${sb.focusSounds.join(', ')}`,
    graphemes: sb.focusSounds,
  };
}
