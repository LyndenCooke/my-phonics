import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('schoolPublic');
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
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">{t('pathway.title')}</h1>
        <p className="text-slate-600 max-w-3xl">
          {t('pathway.intro', { steps: totals.teachingSteps, resources: totals.totalResources })}
        </p>
      </header>

      {/* The school cycle */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('pathway.cycleTitle')}</h2>
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <CycleStep icon={<ClipboardCheck className="w-5 h-5" />} title={t('pathway.cycle.window.title')} body={t('pathway.cycle.window.body')} />
          <CycleArrow />
          <CycleStep icon={<Users className="w-5 h-5" />} title={t('pathway.cycle.regroup.title')} body={t('pathway.cycle.regroup.body')} />
          <CycleArrow />
          <CycleStep icon={<GraduationCap className="w-5 h-5" />} title={t('pathway.cycle.teach.title')} body={t('pathway.cycle.teach.body')} />
          <CycleArrow />
          <CycleStep icon={<Repeat className="w-5 h-5" />} title={t('pathway.cycle.next.title')} body={t('pathway.cycle.next.body')} />
        </div>
        <p className="text-xs text-slate-500 mt-3 max-w-3xl">
          {t('pathway.cycleNote')}
        </p>
      </section>

      {/* Classroom teaching flow */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('pathway.flowTitle')}</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            'soundBook',
            'soundBookWorksheet',
            'blendingBook',
            'storybook',
            'builtIn',
            'interactive',
            'pack',
            'judgement',
            'nextBlock',
          ].map((key) => t(`pathway.flow.${key}`)).map((label, i, arr) => (
            <span key={label} className="inline-flex items-center gap-2">
              <span className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">{label}</span>
              {i < arr.length - 1 && <ArrowRight className="w-3.5 h-3.5 text-slate-300 rtl:-scale-x-100" />}
            </span>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3 max-w-3xl">
          {t('pathway.flowNote')}
        </p>
      </section>

      {/* Level switcher */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('pathway.chooseLevel')}</h2>
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
                <div className="text-xs font-semibold opacity-90" dir="ltr">L{l.level}</div>
                <div className="text-xs font-bold mt-0.5 leading-tight" dir="ltr" lang="en">{l.name}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Level pathway */}
      <section data-school-level={level} className="space-y-4">
        <div className="rounded-2xl s-bg-level text-white px-5 py-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">{t('levelTag', { level: lvl.level, colour: t(`colours.${lvl.colourName}`, { defaultValue: lvl.colourName }) })}</span>
            <h2 dir="ltr" lang="en" className="font-display text-2xl font-extrabold text-start">{lvl.name}</h2>
          </div>
          <div className="text-sm font-semibold opacity-95">
            {t('pathway.levelSummary', { steps: counts.teachingSteps, resources: counts.total, blocks: teachingBlockCount })}{hasReview ? t('pathway.plusReview') : ''}
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
        <h2 className="font-display text-xl font-bold mb-1">{t('pathway.byLevelTitle')}</h2>
        <p className="text-sm text-slate-600 mb-3">
          {t('pathway.byLevelBody', { visible: totals.visibleResources, audio: totals.phonemeAudio, total: totals.totalResources })}
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
      <ArrowRight className="w-5 h-5 rotate-90 sm:rotate-0 sm:rtl:rotate-180" />
    </div>
  );
}
