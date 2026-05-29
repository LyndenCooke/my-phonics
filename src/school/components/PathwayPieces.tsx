import { BookOpen, Camera, FileText, Sparkles, Grid3x3, KeySquare, Layers, ShieldCheck, Globe2 } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import {
  RESOURCE_TYPE_LABEL,
  type ResourceType,
  type CompanionResource,
  type LevelResource,
  type PathwayBlock,
  type ResolvedStep,
  type LevelCounts,
  getLevelResources,
} from '../data/pathway';

const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));
const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

const TYPE_ICON: Partial<Record<ResourceType, React.ComponentType<{ className?: string }>>> = {
  sound_book: Camera,
  sound_book_worksheet: FileText,
  blending_book: Layers,
  storybook: BookOpen,
  storybook_builtin: Sparkles,
  storybook_worksheet_pack: FileText,
  interactive_storybook: Sparkles,
  sound_mat: Grid3x3,
  tricky_word_cards: KeySquare,
  phoneme_audio: Sparkles,
};

const TYPE_TONE: Partial<Record<ResourceType, string>> = {
  sound_book: 'bg-rose-50 text-rose-700 border-rose-200',
  sound_book_worksheet: 'bg-rose-50/60 text-rose-600 border-rose-200',
  blending_book: 'bg-amber-50 text-amber-700 border-amber-200',
  storybook: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  storybook_builtin: 'bg-emerald-50/60 text-emerald-600 border-emerald-200',
  storybook_worksheet_pack: 'bg-emerald-50/60 text-emerald-600 border-emerald-200',
  interactive_storybook: 'bg-violet-50 text-violet-700 border-violet-200',
  sound_mat: 'bg-sky-50 text-sky-700 border-sky-200',
  tricky_word_cards: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  phoneme_audio: 'bg-slate-50 text-slate-600 border-slate-200',
};

export function ResourceTypeBadge({ type, children }: { type: ResourceType; children?: React.ReactNode }) {
  const Icon = TYPE_ICON[type] ?? BookOpen;
  const tone = TYPE_TONE[type] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${tone}`}>
      <Icon className="w-3 h-3" />
      {children ?? RESOURCE_TYPE_LABEL[type]}
    </span>
  );
}

export function CompanionResourceList({ companions }: { companions: CompanionResource[] }) {
  if (companions.length === 0) {
    return <span className="text-[11px] text-slate-400 italic">No companion needed — the blending practice is the resource.</span>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5">
      {companions.map((c) => {
        const Icon = TYPE_ICON[c.type] ?? FileText;
        return (
          <li key={c.type} className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 rounded px-1.5 py-0.5">
            <Icon className="w-3 h-3 text-slate-400" />
            {c.label}
          </li>
        );
      })}
    </ul>
  );
}

export function LevelResourceSummary({ level }: { level: number }) {
  const resources = getLevelResources(level);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Level resources used throughout this level</div>
      <div className="flex flex-wrap gap-2">
        {resources.map((r: LevelResource) => (
          <span key={r.type} className="inline-flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-700">
            <ResourceTypeBadge type={r.type} />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function ReviewGateCard({ step }: { step: ResolvedStep }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-4 h-4 text-amber-700" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Review gate · consolidates the whole level</span>
      </div>
      <h4 className="font-bold text-amber-900">{step.title}</h4>
      <p className="text-xs text-amber-800 mt-0.5">
        Requires every other storybook in this level to be completed first.
      </p>
    </div>
  );
}

function StepRow({ step, index }: { step: ResolvedStep; index: number }) {
  return (
    <li className="flex gap-3">
      <span className="flex-none w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <ResourceTypeBadge type={step.kind as ResourceType} />
          <span className="font-bold text-slate-900 text-sm">{step.title}</span>
        </div>
        {step.companions.length > 0 ? (
          <div className="mt-1"><CompanionResourceList companions={step.companions} /></div>
        ) : step.kind === 'blending_book' ? (
          <div className="mt-1 text-[11px] text-slate-400 italic">Companion: none needed</div>
        ) : null}
      </div>
    </li>
  );
}

export function PathwayBlockCard({ block }: { block: PathwayBlock }) {
  if (block.isReview) {
    return (
      <div data-school-level={block.level} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <header className="px-4 py-2 bg-amber-100 border-b border-amber-200">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Review · level gate</span>
        </header>
        <div className="p-4 space-y-2">
          {block.steps.map((s) => <ReviewGateCard key={s.resourceId} step={s} />)}
        </div>
      </div>
    );
  }

  // Block-level resource tally.
  const tally = block.steps.reduce(
    (acc, s) => {
      if (s.kind === 'sound_book') { acc.soundBooks++; acc.soundWorksheets++; }
      else if (s.kind === 'blending_book') acc.blending++;
      else { acc.storybooks++; acc.packs++; acc.interactive++; }
      return acc;
    },
    { soundBooks: 0, soundWorksheets: 0, blending: 0, storybooks: 0, packs: 0, interactive: 0 },
  );
  const total = tally.soundBooks + tally.soundWorksheets + tally.blending + tally.storybooks + tally.packs + tally.interactive;

  return (
    <div data-school-level={block.level} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <header className="s-bg-level text-white px-4 py-2.5 flex items-center justify-between gap-2">
        <span className="font-bold text-sm">
          Block {block.blockNumber} of {block.totalTeachingBlocks}: {block.focusLabel}
        </span>
        <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5 flex-shrink-0">{block.steps.length} steps</span>
      </header>
      <ol className="p-4 space-y-3">
        {block.steps.map((s, i) => <StepRow key={s.resourceId} step={s} index={i + 1} />)}
      </ol>
      <footer className="px-4 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500">
        Resources in this block: {tally.soundBooks} Sound Books · {tally.soundWorksheets} worksheets
        {tally.blending > 0 && <> · {tally.blending} Blending Book{tally.blending > 1 ? 's' : ''}</>}
        {tally.storybooks > 0 && <> · {tally.storybooks} Storybook{tally.storybooks > 1 ? 's' : ''} · {tally.packs} pack{tally.packs > 1 ? 's' : ''} · {tally.interactive} interactive</>}
        {' '}<span className="font-bold text-slate-700">({total} total)</span>
      </footer>
    </div>
  );
}

export function ResourceCountSummary({ counts }: { counts: LevelCounts[] }) {
  const totals = counts.reduce((a, c) => ({
    soundBooks: a.soundBooks + c.soundBooks,
    soundBookWorksheets: a.soundBookWorksheets + c.soundBookWorksheets,
    blendingBooks: a.blendingBooks + c.blendingBooks,
    storybooks: a.storybooks + c.storybooks,
    storybookWorksheetPacks: a.storybookWorksheetPacks + c.storybookWorksheetPacks,
    interactiveBooks: a.interactiveBooks + c.interactiveBooks,
    soundMats: a.soundMats + c.soundMats,
    trickyWordCards: a.trickyWordCards + c.trickyWordCards,
    total: a.total + c.total,
  }), { soundBooks: 0, soundBookWorksheets: 0, blendingBooks: 0, storybooks: 0, storybookWorksheetPacks: 0, interactiveBooks: 0, soundMats: 0, trickyWordCards: 0, total: 0 });

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider">
          <tr>
            <th className="text-left px-3 py-2 font-bold">Level</th>
            <th className="text-right px-2 py-2 font-bold">Sound<br />Books</th>
            <th className="text-right px-2 py-2 font-bold">Sound bk<br />worksheets</th>
            <th className="text-right px-2 py-2 font-bold">Blending<br />Books</th>
            <th className="text-right px-2 py-2 font-bold">Story<br />books</th>
            <th className="text-right px-2 py-2 font-bold">Worksheet<br />packs</th>
            <th className="text-right px-2 py-2 font-bold">Inter<br />active</th>
            <th className="text-right px-2 py-2 font-bold">Sound<br />Mat</th>
            <th className="text-right px-2 py-2 font-bold">Tricky<br />cards</th>
            <th className="text-right px-3 py-2 font-bold">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {counts.map((c) => (
            <tr key={c.level} data-school-level={c.level}>
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: HEX[c.level] }} />
                  L{c.level} {LEVEL_NAME[c.level]}
                </span>
              </td>
              <td className="text-right px-2 py-2">{c.soundBooks}</td>
              <td className="text-right px-2 py-2">{c.soundBookWorksheets}</td>
              <td className="text-right px-2 py-2">{c.blendingBooks || '—'}</td>
              <td className="text-right px-2 py-2">{c.storybooks}</td>
              <td className="text-right px-2 py-2">{c.storybookWorksheetPacks}</td>
              <td className="text-right px-2 py-2">{c.interactiveBooks}</td>
              <td className="text-right px-2 py-2">{c.soundMats}</td>
              <td className="text-right px-2 py-2">{c.trickyWordCards}</td>
              <td className="text-right px-3 py-2 font-bold">{c.total}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-bold">
            <td className="px-3 py-2">All levels</td>
            <td className="text-right px-2 py-2">{totals.soundBooks}</td>
            <td className="text-right px-2 py-2">{totals.soundBookWorksheets}</td>
            <td className="text-right px-2 py-2">{totals.blendingBooks}</td>
            <td className="text-right px-2 py-2">{totals.storybooks}</td>
            <td className="text-right px-2 py-2">{totals.storybookWorksheetPacks}</td>
            <td className="text-right px-2 py-2">{totals.interactiveBooks}</td>
            <td className="text-right px-2 py-2">{totals.soundMats}</td>
            <td className="text-right px-2 py-2">{totals.trickyWordCards}</td>
            <td className="text-right px-3 py-2">{totals.total}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function OpenWindowFeatureCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6">
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-slate-900 text-white mb-3">
        <Globe2 className="w-5 h-5" />
      </div>
      <h3 className="font-bold text-lg mb-1">The Open Window philosophy</h3>
      <p className="text-slate-600 text-sm leading-relaxed">
        Every storybook is an open window into a different child, family or community. Children learn through a
        British phonics progression while seeing diverse, contemporary cultures represented naturally and
        respectfully — a strength for diverse British-curriculum and international schools alike.
      </p>
    </div>
  );
}
