import { useMemo, useState } from 'react';
import { ArrowRight, ClipboardCheck, Users, GraduationCap, Repeat } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import {
  getBlocks,
  levelCounts,
  ALL_LEVEL_COUNTS,
  programmeTotals,
} from '../data/pathway';
import {
  PathwayBlockCard,
  LevelResourceSummary,
  ResourceCountSummary,
} from '../components/PathwayPieces';

/**
 * SchoolPathway — the teacher-facing Learning Pathway.
 * Leads with the school assessment cycle and the in-class teaching flow, then
 * shows each level broken into teaching blocks with companion resources and
 * review gates. All counts are derived from the pathway data model.
 */
export default function SchoolPathway() {
  const [level, setLevel] = useState<number>(4);
  const blocks = useMemo(() => getBlocks(level), [level]);
  const counts = useMemo(() => levelCounts(level), [level]);
  const lvl = SCHOOL_LEVELS.find((l) => l.level === level)!;
  const totals = useMemo(() => programmeTotals(), []);
  const teachingBlockCount = blocks.filter((b) => !b.isReview).length;
  const hasReview = blocks.some((b) => b.isReview);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Learning Pathway</h1>
        <p className="text-slate-600 max-w-3xl">
          A complete {totals.teachingSteps}-step phonics pathway with {totals.totalResources}+ linked resources across 8 levels.
          Every step tells you what to teach, what to print, what to read and what to practise.
        </p>
      </header>

      {/* The school cycle */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">The school cycle</h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <CycleStep icon={<ClipboardCheck className="w-5 h-5" />} title="Assessment window" body="Assess online at entry and each half term." />
          <CycleArrow />
          <CycleStep icon={<Users className="w-5 h-5" />} title="Regroup" body="Group children by level and block." />
          <CycleArrow />
          <CycleStep icon={<GraduationCap className="w-5 h-5" />} title="Teach blocks" body="Move through the pathway using teacher judgement." />
          <CycleArrow />
          <CycleStep icon={<Repeat className="w-5 h-5" />} title="Next window" body="Reassess, regroup and plan the next cycle." />
        </div>
        <p className="text-xs text-slate-500 mt-3 max-w-3xl">
          Schools use half-termly assessment windows to assess, regroup and track progress. Between windows, teachers
          move children through the pathway using professional judgement — no formal test after every book.
        </p>
      </section>

      {/* Classroom teaching flow */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">In the classroom — flow inside a level</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            'Sound Book',
            'Sound Book worksheet',
            'Blending Book (where available)',
            'Storybook',
            'Built-in practice',
            'Interactive version',
            'Worksheet pack',
            'Teacher judgement',
            'Next block',
          ].map((label, i, arr) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">{label}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 max-w-3xl">
          Sound Books introduce new GPCs with real photographs. Blending Books build decoding confidence (L1–L5 only;
          from L6 children blend in context inside the storybooks). Storybooks apply the sounds in culturally diverse
          decodable narratives with built-in practice and a full interactive version.
        </p>
      </section>

      {/* Level switcher */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Choose a level</h2>
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
                  active ? 's-bg-level scale-[1.03] s-ring' : 's-bg-level opacity-70 hover:opacity-100',
                ].join(' ')}
              >
                <div className="text-xs font-semibold opacity-90">L{l.level}</div>
                <div className="text-xs font-bold mt-0.5 leading-tight">{l.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Level pathway */}
      <section data-school-level={level} className="space-y-4">
        <div className="rounded-2xl s-bg-level text-white px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Level {lvl.level} · {lvl.colourName}</span>
            <h2 className="font-display text-2xl font-extrabold">{lvl.name}</h2>
          </div>
          <div className="text-sm font-semibold opacity-95">
            {counts.teachingSteps} teaching steps · {counts.total} linked resources · {teachingBlockCount} teaching blocks{hasReview ? ' plus review' : ''}
          </div>
        </div>

        <LevelResourceSummary level={level} />

        <div className="space-y-4">
          {blocks.map((b) => (
            <PathwayBlockCard key={`${b.level}-${b.blockNumber}`} block={b} />
          ))}
        </div>
      </section>

      {/* Resource counts by level */}
      <section>
        <h2 className="font-display text-xl font-bold mb-1">Resources by level</h2>
        <p className="text-sm text-slate-600 mb-3">
          {totals.visibleResources} visible printable/digital resources plus {totals.phonemeAudio}+ phoneme audio files —
          {' '}{totals.totalResources}+ in total.
        </p>
        <ResourceCountSummary counts={ALL_LEVEL_COUNTS} />
      </section>
    </div>
  );
}

function CycleStep({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4">
      <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 text-white mb-2">{icon}</div>
      <div className="font-bold text-sm">{title}</div>
      <p className="text-xs text-slate-500 mt-0.5 leading-snug">{body}</p>
    </div>
  );
}

function CycleArrow() {
  return (
    <div className="flex items-center justify-center text-slate-300">
      <ArrowRight className="w-5 h-5 rotate-90 sm:rotate-0" />
    </div>
  );
}
