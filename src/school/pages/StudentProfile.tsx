import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, CalendarCheck, Check, CheckCircle2, ClipboardCheck, Copy, Dot,
  FileText, Home, LifeBuoy, Loader2, Printer, Sparkles, TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, downloadSchoolResource, type AttendanceRow } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { getSchoolBookById, type SchoolBook } from '../data/bookCatalog';
import {
  levelStepStatus, completedResourceTally, assessmentWindowForDate, blockOfStep,
  JUDGEMENT_LABEL, type TeacherJudgement, type PupilStep, type ResolvedStep,
} from '../data/pathway';

type Student = {
  id: string; first_name: string; last_name: string | null; classroom_id: string; school_id: string;
  current_level: string | null; date_of_birth: string | null;
  pathway_completed: number | null; teacher_judgement: TeacherJudgement | null; teacher_note: string | null;
};
type Classroom = { id: string; name: string; year_group: string | null };
type Assessment = { id: string; created_at: string; recommended_level: string | null; score_total: number | null; score_max: number | null; payload: Record<string, unknown> | null };

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));
const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));

function parseLevel(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}
function storageKey(subLevel: string): string { return subLevel.replace(/^L/, '').replace('.', '_'); }

const SUGGESTED_ACTION: Record<TeacherJudgement, string> = {
  continue: 'Continue through the current block',
  ready_soon: 'Nearly ready — prepare for the next block / assessment window',
  needs_support: 'Provide targeted support before moving on (see support plan)',
};

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { memberships } = useSchoolMemberships();
  const isAdminOrTeacher = !!memberships[0];

  // Downloads go through the school-download edge function (signed URL +
  // membership check + logging); buckets stay private.
  const dl = async (resource: Parameters<typeof downloadSchoolResource>[0]) => {
    const r = await downloadSchoolResource(resource);
    if (!r.ok) toast({ title: 'Download failed', description: r.error, variant: 'destructive' });
  };

  const [student, setStudent] = useState<Student | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  const load = async () => {
    if (!id) return;
    const { data: s } = await schoolDb.students()
      .select('id, first_name, last_name, classroom_id, school_id, current_level, date_of_birth, pathway_completed, teacher_judgement, teacher_note')
      .eq('id', id).single();
    setStudent((s ?? null) as Student | null);
    setNoteDraft(((s as Student | null)?.teacher_note) ?? '');
    if (s) {
      const st = s as Student;
      const [{ data: c }, { data: a }, { data: att }] = await Promise.all([
        schoolDb.classrooms().select('id, name, year_group').eq('id', st.classroom_id).single(),
        schoolDb.assessments().select('id, created_at, recommended_level, score_total, score_max, payload').eq('student_id', id).order('created_at', { ascending: true }),
        schoolDb.attendance().select('id, school_id, student_id, session_date, lesson, context_type, group_level, classroom_id, status, recorded_by, note, created_at').eq('student_id', id).order('session_date', { ascending: false }),
      ]);
      setClassroom((c ?? null) as Classroom | null);
      setAssessments((a ?? []) as Assessment[]);
      setAttendance((att ?? []) as AttendanceRow[]);
    }
  };

  useEffect(() => { (async () => { setLoading(true); await load(); setLoading(false); })(); /* eslint-disable-next-line */ }, [id]);

  const level = parseLevel(student?.current_level ?? null);
  const completed = student?.pathway_completed ?? 0;
  const status = useMemo(() => (level ? levelStepStatus(level, completed) : null), [level, completed]);
  const judgement: TeacherJudgement = student?.teacher_judgement ?? 'continue';

  // The storybook the child is reading or about to read (first storybook from current position).
  const nextStorybookStep = useMemo<PupilStep | undefined>(() => {
    if (!status) return undefined;
    return status.steps.find((s) => s.kind === 'storybook' && (s.status === 'in_progress' || s.status === 'next' || s.status === 'upcoming'))
      ?? [...status.steps].reverse().find((s) => s.kind === 'storybook');
  }, [status]);
  const nextStorybook: SchoolBook | undefined = nextStorybookStep ? getSchoolBookById(nextStorybookStep.resourceId) : undefined;

  const tally = useMemo(() => (level ? completedResourceTally(level, completed) : null), [level, completed]);

  const attStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    return { total, present, absent: attendance.filter((a) => a.status === 'absent').length, pct: total ? Math.round((present / total) * 100) : null };
  }, [attendance]);

  const patch = async (fields: Record<string, unknown>) => {
    if (!student) return;
    const { error } = await schoolDb.students().update({ ...fields, updated_at: new Date().toISOString() }).eq('id', student.id);
    if (error) { toast({ title: 'Could not save', description: (error as { message?: string }).message, variant: 'destructive' }); return false; }
    setStudent({ ...student, ...fields } as Student);
    return true;
  };

  const markStepComplete = async () => {
    if (!status || status.isLevelComplete) return;
    const ok = await patch({ pathway_completed: completed + 1 });
    if (ok) toast({ title: 'Step marked complete', description: status.current?.title });
  };
  const setJudgement = async (j: TeacherJudgement) => {
    const ok = await patch({ teacher_judgement: j });
    if (ok) toast({ title: `Marked “${JUDGEMENT_LABEL[j]}”` });
  };
  const saveNote = async () => {
    setSavingNote(true);
    const ok = await patch({ teacher_note: noteDraft.trim() || null });
    setSavingNote(false);
    if (ok) toast({ title: 'Note saved' });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!student) return (
    <div className="text-center py-20"><p className="text-slate-600 mb-4">Pupil not found.</p>
      <Link to="/school/app" className="text-pink-600 font-semibold hover:underline">← Back to dashboard</Link></div>
  );

  const fullName = `${student.first_name} ${student.last_name ?? ''}`.trim();
  const currentBlock = status?.current ? blockOfStep(level!, status.current.step.order) : null;
  const lastWindow = assessments.length ? assessmentWindowForDate(assessments[assessments.length - 1].created_at) : null;

  return (
    <div className="space-y-6">
      <Link to={`/school/app/classrooms/${student.classroom_id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" /> {classroom?.name ?? 'Back to class'}
      </Link>

      {/* 1. Snapshot */}
      <section data-school-level={level ?? 1} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <header className="s-bg-level text-white px-5 py-4">
          <h1 className="font-display text-2xl font-extrabold">{fullName}</h1>
          <p className="text-sm opacity-90">{classroom?.year_group ?? '—'} · {classroom?.name ?? '—'}</p>
        </header>
        {level ? (
          <div className="p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
            <Snap label="Current placement" value={`L${level} ${LEVEL_NAME[level]}`} />
            <Snap label="Current block" value={currentBlock ? (currentBlock.isReview ? 'Level review' : `Block ${currentBlock.blockNumber} of ${currentBlock.totalTeachingBlocks}: ${currentBlock.focusLabel}`) : '—'} />
            <Snap label="Current step" value={status?.isLevelComplete ? 'Level complete' : (status?.current?.title ?? '—')} />
            <Snap label="Next resource" value={status?.next?.title ?? (status?.isLevelComplete ? 'Ready for next level' : '—')} />
            <Snap label="Last assessed" value={lastWindow ? `${lastWindow} assessment window` : 'Not yet assessed'} />
            <Snap label="Current judgement" value={JUDGEMENT_LABEL[judgement]} />
            <div className="sm:col-span-2 lg:col-span-3 mt-1 text-slate-600">
              <span className="font-semibold text-slate-500">Suggested action:</span> {SUGGESTED_ACTION[judgement]}
            </div>
          </div>
        ) : (
          <div className="p-5">
            <p className="text-sm text-amber-700 font-semibold mb-3">Not yet assessed — run an assessment to place {student.first_name} on the pathway.</p>
            <Link to={`/school/app/students/${student.id}/assess`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700"><ClipboardCheck className="w-4 h-4" /> Assess now</Link>
          </div>
        )}
      </section>

      {level && status && (
        <>
          {/* 2. Next teaching actions */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Next teaching actions</h2>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-4">
              <Snap label="Read next" value={nextStorybook?.title ?? status.next?.title ?? '—'} />
              <Snap label="Print next" value={nextStorybook ? `${nextStorybook.subLevel} worksheet pack` : '—'} />
              <Snap label="Use during reading" value={`L${level} Sound Mat`} />
              <Snap label="Practise" value={currentBlock?.focusLabel ?? '—'} />
            </div>
            <div className="flex flex-wrap gap-2">
              {nextStorybook && (
                <>
                  <a href={`/library?book=${nextStorybook.slug}`} target="_blank" rel="noopener" className="inline-flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700"><Sparkles className="w-4 h-4" /> Open interactive book</a>
                  <button onClick={() => dl({ resourceType: 'storybook', resourceKey: storageKey(nextStorybook.parent6SubLevel), format: 'a4', filename: `${nextStorybook.title} (A5 Booklet).pdf` })} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"><Printer className="w-4 h-4" /> Print A5 booklet</button>
                  <button onClick={() => dl({ resourceType: 'worksheet_pack', resourceKey: storageKey(nextStorybook.parent6SubLevel), filename: `${nextStorybook.title} — Worksheets.pdf` })} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"><FileText className="w-4 h-4" /> Print worksheet pack</button>
                </>
              )}
              <button onClick={markStepComplete} disabled={status.isLevelComplete} className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50"><CheckCircle2 className="w-4 h-4" /> Mark current step complete</button>
            </div>
            {student.teacher_note && (
              <p className="mt-3 text-sm text-slate-600"><span className="font-semibold text-slate-500">Teacher note:</span> {student.teacher_note}</p>
            )}
          </section>

          {/* 3. Progression pathway */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Whole pathway progress</h2>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
              {SCHOOL_LEVELS.map((l) => {
                const state = l.level < level ? 'complete' : l.level === level ? 'current' : 'upcoming';
                return (
                  <div key={l.level} className="text-center">
                    <div data-school-level={l.level} className={['rounded-lg py-2 text-white text-xs font-bold', state === 'complete' ? 's-bg-level' : state === 'current' ? 's-bg-level s-ring' : 's-bg-level opacity-25'].join(' ')}>L{l.level}</div>
                    <div className="text-[10px] text-slate-500 mt-1">{state === 'complete' ? 'Complete' : state === 'current' ? 'In progress' : 'Not started'}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-slate-600 flex-shrink-0">L{level} {LEVEL_NAME[level]}</span>
              <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${status.total ? (status.completed / status.total) * 100 : 0}%`, backgroundColor: HEX[level] }} />
              </div>
              <span className="text-sm font-bold text-slate-700 flex-shrink-0">{status.completed} of {status.total} steps</span>
            </div>
          </section>

          {/* 4. Current block table */}
          <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <header className="px-5 py-3 border-b border-slate-100">
              <h2 className="font-bold">Current block{currentBlock ? ` — Block ${currentBlock.blockNumber}: ${currentBlock.focusLabel}` : ''}</h2>
            </header>
            <BlockTable steps={status.steps.filter((s) => currentBlock && blockOfStep(level, s.step.order)?.blockNumber === currentBlock.blockNumber)} fallback={status.steps} />
          </section>

          {/* 6. Teacher judgement */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Teacher judgement</h2>
            <div className="grid sm:grid-cols-3 gap-2 mb-3">
              <JudgeBtn active={judgement === 'continue'} tone="slate" onClick={() => setJudgement('continue')} title="Continue" desc="Progressing through the block" disabled={!isAdminOrTeacher} />
              <JudgeBtn active={judgement === 'ready_soon'} tone="emerald" onClick={() => setJudgement('ready_soon')} title="Ready soon" desc="Nearly ready for next block / level" disabled={!isAdminOrTeacher} />
              <JudgeBtn active={judgement === 'needs_support'} tone="amber" onClick={() => setJudgement('needs_support')} title="Needs support" desc="Extra practice before moving on" disabled={!isAdminOrTeacher} />
            </div>
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">Teacher note</span>
              <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2} placeholder="e.g. Reads sh words confidently but still guesses th words."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none text-sm" />
            </label>
            <button onClick={saveNote} disabled={savingNote} className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60">
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Save note
            </button>
          </section>

          {/* 10. Intervention — only if needs support */}
          {judgement === 'needs_support' && currentBlock && (
            <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
              <h2 className="font-bold text-amber-900 flex items-center gap-1.5 mb-2"><LifeBuoy className="w-4 h-4" /> Support plan</h2>
              <p className="text-sm text-amber-800 mb-2"><span className="font-semibold">Focus:</span> {currentBlock.focusLabel} (L{level} Block {currentBlock.blockNumber})</p>
              <div className="text-sm text-amber-900">
                <div className="font-semibold mb-1">Recommended resources</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {status.steps.filter((s) => blockOfStep(level, s.step.order)?.blockNumber === currentBlock.blockNumber).map((s) => <li key={s.resourceId}>{s.title}</li>)}
                </ul>
              </div>
              <div className="mt-3 text-sm text-amber-900">
                <div className="font-semibold mb-1">Suggested routine</div>
                <p>10 minutes daily: review sound cards · blend 5 words · read 1 page · repeat for 3 days · teacher listens again.</p>
              </div>
            </section>
          )}
        </>
      )}

      {/* 5. Assessment history */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><ClipboardCheck className="w-4 h-4" /> Assessment window history</h2>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-500">No assessments recorded yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] uppercase tracking-wider text-slate-500"><tr><th className="text-left py-1.5">Window</th><th className="text-left py-1.5">Level placed</th><th className="text-left py-1.5">Notes</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {assessments.map((a, i) => {
                    const note = (a.payload && typeof a.payload.note === 'string') ? a.payload.note as string : (i === 0 ? 'Initial placement' : 'Whole-school window');
                    return (
                      <tr key={a.id}>
                        <td className="py-1.5">{assessmentWindowForDate(a.created_at)} <span className="text-slate-400">· {new Date(a.created_at).toLocaleDateString('en-GB')}</span></td>
                        <td className="py-1.5 font-semibold">{a.recommended_level ?? '—'}</td>
                        <td className="py-1.5 text-slate-600">{note}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              <span className="font-semibold text-slate-500">Movement:</span>{' '}
              {assessments.map((a) => `${assessmentWindowForDate(a.created_at)}: ${a.recommended_level ?? '—'}`).join(' → ')}
            </p>
          </>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* 7. Completed resources */}
        {tally && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Completed resources</h2>
            <div className="grid grid-cols-2 gap-y-1.5 text-sm">
              <Tally label="Sound Books" n={tally.soundBooks} />
              <Tally label="Blending Books" n={tally.blendingBooks} />
              <Tally label="Storybooks" n={tally.storybooks} />
              <Tally label="Interactive books" n={tally.interactive} />
              <Tally label="Worksheet packs" n={tally.worksheetPacks} />
              <Tally label="Certificates earned" n={tally.certificates} />
            </div>
          </section>
        )}

        {/* Attendance */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" /> Attendance</h2>
          {attStats.total === 0 ? (
            <p className="text-sm text-slate-500">No register taken yet.</p>
          ) : (
            <div className="flex items-baseline gap-4">
              <div><span className="text-3xl font-extrabold">{attStats.pct}%</span><span className="text-xs text-slate-500 ml-1">present</span></div>
              <div className="text-sm text-slate-500">{attStats.present} attended · {attStats.absent} missed · {attStats.total} sessions</div>
            </div>
          )}
        </section>
      </div>

      {/* 9. Home reading */}
      {level && nextStorybook && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><Home className="w-4 h-4" /> Home reading</h2>
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5 text-sm mb-4">
            <Snap label="Current home book" value={nextStorybook.title} />
            <Snap label="Format" value="Printable A5 booklet" />
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/library?book=${nextStorybook.slug}`); toast({ title: 'Parent reading link copied' }); }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"><Copy className="w-4 h-4" /> Copy parent link</button>
            <button onClick={() => dl({ resourceType: 'storybook', resourceKey: storageKey(nextStorybook.parent6SubLevel), format: 'a4', filename: `${nextStorybook.title} (Home Booklet).pdf` })} className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"><Printer className="w-4 h-4" /> Print home booklet</button>
          </div>
          <p className="text-xs text-slate-400 mt-2">Shared with parents through the school so home practice matches class teaching.</p>
        </section>
      )}
    </div>
  );
}

function Snap({ label, value }: { label: string; value: string }) {
  return <div><span className="text-slate-500">{label}:</span> <span className="font-semibold text-slate-800">{value}</span></div>;
}

function Tally({ label, n }: { label: string; n: number }) {
  return <div className="flex items-center gap-1.5"><span className="text-2xl font-extrabold text-slate-900 w-8">{n}</span><span className="text-slate-600">{label}</span></div>;
}

function JudgeBtn({ active, tone, onClick, title, desc, disabled }: { active: boolean; tone: 'slate' | 'emerald' | 'amber'; onClick: () => void; title: string; desc: string; disabled?: boolean }) {
  const tones: Record<string, string> = {
    slate: active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-400',
    emerald: active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white border-slate-200 hover:border-emerald-300',
    amber: active ? 'bg-amber-500 text-white border-amber-500' : 'bg-white border-slate-200 hover:border-amber-300',
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`text-left rounded-xl border p-3 transition-colors disabled:opacity-60 ${tones[tone]}`}>
      <div className="font-bold text-sm">{title}</div>
      <div className={`text-xs ${active ? 'opacity-90' : 'text-slate-500'}`}>{desc}</div>
    </button>
  );
}

function BlockTable({ steps, fallback }: { steps: PupilStep[]; fallback: PupilStep[] }) {
  const rows = steps.length ? steps : fallback;
  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
        <tr><th className="text-left px-5 py-2 w-10">#</th><th className="text-left px-2 py-2">Resource</th><th className="text-left px-2 py-2">Status</th><th className="text-left px-2 py-2">Companion</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((s, i) => (
          <tr key={s.resourceId} className={s.status === 'in_progress' ? 'bg-sky-50/60' : ''}>
            <td className="px-5 py-2 text-slate-400 font-mono">{i + 1}</td>
            <td className="px-2 py-2 font-semibold text-slate-800">{s.title}</td>
            <td className="px-2 py-2"><StatusChip status={s.status} /></td>
            <td className="px-2 py-2 text-xs text-slate-500">{companionText(s)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function companionText(s: ResolvedStep): string {
  if (s.kind === 'sound_book') return 'Sound Book worksheet';
  if (s.kind === 'blending_book') return 'No companion';
  return 'Worksheet pack + interactive book';
}

function StatusChip({ status }: { status: PupilStep['status'] }) {
  const map = {
    complete: { c: 'bg-emerald-100 text-emerald-800', t: 'Complete' },
    in_progress: { c: 'bg-sky-100 text-sky-800', t: 'In progress' },
    next: { c: 'bg-pink-100 text-pink-800', t: 'Next' },
    upcoming: { c: 'bg-slate-100 text-slate-500', t: 'Upcoming' },
  }[status];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${map.c}`}>{status === 'complete' && <Dot className="w-3 h-3" />}{map.t}</span>;
}
