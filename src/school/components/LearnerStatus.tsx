import { SCHOOL_LEVELS } from '../data/levels';
import {
  learnerPosition,
  getBlocks,
  resolveStep,
  JUDGEMENT_LABEL,
  type TeacherJudgement,
} from '../data/pathway';

export type { TeacherJudgement };
import { getTeachingSequence } from '../data/teachingSequence';
import { ResourceTypeBadge } from './PathwayPieces';

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

const JUDGEMENT_TONE: Record<TeacherJudgement, string> = {
  continue: 'bg-slate-100 text-slate-700',
  ready_soon: 'bg-emerald-100 text-emerald-800',
  needs_support: 'bg-amber-100 text-amber-800',
};

/**
 * StudentPathwayStatus — level, block, current step, next resource and the
 * teacher-judgement flag for one learner. Position is derived from the student
 * id (see learnerPosition) since per-step progress isn't stored yet.
 */
export function StudentPathwayStatus({
  name,
  level,
  seed,
  compact = false,
  completedCount,
  judgement,
}: {
  name: string;
  level: number | null;
  seed: string;
  compact?: boolean;
  completedCount?: number | null;
  judgement?: TeacherJudgement | null;
}) {
  if (!level) {
    return (
      <div className="text-sm">
        <div className="font-bold text-slate-900">{name}</div>
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase mt-1">
          Not yet assessed
        </div>
      </div>
    );
  }

  const pos = learnerPosition(level, seed, { completedCount, judgement });
  return (
    <div className="text-sm">
      <div className="font-bold text-slate-900">{name}</div>
      <div className="text-slate-600">L{level} {LEVEL_NAME[level]}</div>
      {pos.block && !pos.block.isReview && (
        <div className="text-xs text-slate-500 mt-0.5">
          Block {pos.block.blockNumber} of {pos.block.totalTeachingBlocks}: {pos.block.focusLabel}
        </div>
      )}
      {pos.block?.isReview && (
        <div className="text-xs text-amber-700 font-semibold mt-0.5">Level review</div>
      )}
      {!compact && pos.current && (
        <div className="text-xs text-slate-500 mt-0.5">
          Current step: <span className="font-semibold text-slate-700">{pos.current.title}</span>
        </div>
      )}
      {!compact && pos.next && (
        <div className="text-xs text-slate-500">
          Next resource: <span className="font-semibold text-slate-700">{pos.next.title}</span>
        </div>
      )}
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold mt-1 ${JUDGEMENT_TONE[pos.judgement]}`}>
        {JUDGEMENT_LABEL[pos.judgement]}
      </div>
    </div>
  );
}

/**
 * GroupPathwayStatus — what a whole level-group is working on. Defaults to the
 * first teaching block; "today's resource" is the block's blending book (or its
 * first sound book), "next resource" is the block's first storybook.
 */
export function GroupPathwayStatus({
  level,
  childCount,
  blockNumber = 1,
}: {
  level: number;
  childCount: number;
  blockNumber?: number;
}) {
  const blocks = getBlocks(level).filter((b) => !b.isReview);
  const block = blocks[Math.min(blockNumber - 1, blocks.length - 1)];
  const steps = getTeachingSequence(level).map(resolveStep);

  const today =
    block?.steps.find((s) => s.kind === 'blending_book') ??
    block?.steps.find((s) => s.kind === 'sound_book') ??
    block?.steps[0];
  const next =
    block?.steps.find((s) => s.kind === 'storybook') ??
    steps.find((s) => s.step.order > (block?.steps.at(-1)?.step.order ?? 0));

  if (!block) {
    return (
      <div className="text-xs text-slate-500">L{level} {LEVEL_NAME[level]} · {childCount} children</div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3" data-school-level={level}>
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm">L{level} {LEVEL_NAME[level]}</span>
        <span className="text-xs font-semibold text-slate-500">{childCount} {childCount === 1 ? 'child' : 'children'}</span>
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        Block {block.blockNumber} of {block.totalTeachingBlocks}: {block.focusLabel}
      </div>
      {today && (
        <div className="flex items-center gap-1.5 mt-2 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider w-14">Today</span>
          <ResourceTypeBadge type={today.kind as never} />
          <span className="font-semibold text-slate-700 truncate">{today.title}</span>
        </div>
      )}
      {next && (
        <div className="flex items-center gap-1.5 mt-1 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider w-14">Next</span>
          <ResourceTypeBadge type={next.kind as never} />
          <span className="font-semibold text-slate-700 truncate">{next.title}</span>
        </div>
      )}
    </div>
  );
}
