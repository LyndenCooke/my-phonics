import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, ClipboardCheck, Home, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, type AttendanceRow } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { learnerPosition, getBlocks, JUDGEMENT_LABEL } from '../data/pathway';
import { StudentPathwayStatus } from '../components/LearnerStatus';
import { ResourceTypeBadge } from '../components/PathwayPieces';

type Student = { id: string; first_name: string; last_name: string | null; classroom_id: string; school_id: string; current_level: string | null; date_of_birth: string | null };
type Classroom = { id: string; name: string; year_group: string | null };
type Assessment = { id: string; created_at: string; recommended_level: string | null; score_total: number | null; score_max: number | null; payload: Record<string, unknown> | null };

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

function parseLevel(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { memberships } = useSchoolMemberships();
  const [student, setStudent] = useState<Student | null>(null);
  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: s } = await schoolDb.students()
        .select('id, first_name, last_name, classroom_id, school_id, current_level, date_of_birth')
        .eq('id', id).single();
      setStudent((s ?? null) as Student | null);
      if (s) {
        const [{ data: c }, { data: a }, { data: att }] = await Promise.all([
          schoolDb.classrooms().select('id, name, year_group').eq('id', (s as Student).classroom_id).single(),
          schoolDb.assessments().select('id, created_at, recommended_level, score_total, score_max, payload').eq('student_id', id).order('created_at', { ascending: false }),
          schoolDb.attendance().select('id, school_id, student_id, session_date, lesson, context_type, group_level, classroom_id, status, recorded_by, note, created_at').eq('student_id', id).order('session_date', { ascending: false }),
        ]);
        setClassroom((c ?? null) as Classroom | null);
        setAssessments((a ?? []) as Assessment[]);
        setAttendance((att ?? []) as AttendanceRow[]);
      }
      setLoading(false);
    })();
  }, [id]);

  const level = parseLevel(student?.current_level ?? null);
  const pos = useMemo(() => (level && student ? learnerPosition(level, student.id) : null), [level, student]);

  const focusBlock = useMemo(() => {
    if (!level) return null;
    return getBlocks(level).find((b) => !b.isReview && b.steps.some((s) => s.resourceId === pos?.current?.resourceId))
      ?? getBlocks(level).find((b) => !b.isReview);
  }, [level, pos]);

  const attStats = useMemo(() => {
    const total = attendance.length;
    const present = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
    const absent = attendance.filter((a) => a.status === 'absent').length;
    const pct = total ? Math.round((present / total) * 100) : null;
    return { total, present, absent, pct };
  }, [attendance]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  if (!student) return (
    <div className="text-center py-20">
      <p className="text-slate-600 mb-4">Pupil not found.</p>
      <Link to="/school/app" className="text-pink-600 font-semibold hover:underline">← Back to dashboard</Link>
    </div>
  );

  const fullName = `${student.first_name} ${student.last_name ?? ''}`.trim();

  return (
    <div className="space-y-6">
      <header>
        <Link to={`/school/app/classrooms/${student.classroom_id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4" /> {classroom?.name ?? 'Back to class'}
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold tracking-tight">{fullName}</h1>
            <p className="text-slate-600">{classroom?.name}{classroom?.year_group ? ` · ${classroom.year_group}` : ''}</p>
          </div>
          <Link to={`/school/app/students/${student.id}/assess`} className="inline-flex items-center gap-1.5 px-4 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700">
            <ClipboardCheck className="w-4 h-4" /> {level ? 'Re-assess' : 'Assess now'}
          </Link>
        </div>
      </header>

      {/* Pathway position */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" /> Where {student.first_name} is on the pathway</h2>
        {level ? (
          <StudentPathwayStatus name={fullName} level={level} seed={student.id} />
        ) : (
          <p className="text-sm text-amber-700 font-semibold">Not yet assessed — run an assessment to place {student.first_name} on the pathway.</p>
        )}
      </section>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Focus at home / gaps */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><Home className="w-4 h-4" /> Focus areas — what to practise at home</h2>
          {level && focusBlock ? (
            <div className="space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-1">Sounds in focus now</div>
                <div className="flex flex-wrap gap-1.5">
                  {focusBlock.focusLabel.split(',').map((g) => (
                    <span key={g} className="px-2 py-1 bg-slate-100 rounded font-mono text-sm">{g.trim()}</span>
                  ))}
                </div>
              </div>
              {pos?.next && (
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Coming next</div>
                  <div className="flex items-center gap-1.5">
                    <ResourceTypeBadge type={pos.next.kind as never} />
                    <span className="font-semibold text-sm text-slate-700">{pos.next.title}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 leading-relaxed">
                Read the current Storybook together, practise the sounds above, and revisit any tricky words.
                This summary is shared with parents through the school so home practice matches class teaching.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Focus areas appear once {student.first_name} has been assessed.</p>
          )}
        </section>

        {/* Attendance */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><CalendarCheck className="w-4 h-4" /> Attendance</h2>
          {attStats.total === 0 ? (
            <p className="text-sm text-slate-500">No register taken yet. Take the register from a phonics group or class.</p>
          ) : (
            <>
              <div className="flex items-baseline gap-4 mb-3">
                <div><span className="text-3xl font-extrabold">{attStats.pct}%</span><span className="text-xs text-slate-500 ml-1">present</span></div>
                <div className="text-sm text-slate-500">{attStats.present} attended · {attStats.absent} missed · {attStats.total} sessions</div>
              </div>
              <ul className="space-y-1 max-h-48 overflow-y-auto">
                {attendance.slice(0, 12).map((a) => (
                  <li key={a.id} className="flex items-center justify-between text-sm border-b border-slate-100 py-1">
                    <span className="text-slate-600">{new Date(a.session_date).toLocaleDateString('en-GB')} · {a.lesson}</span>
                    <StatusPill status={a.status} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {/* Assessment history */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Assessment history</h2>
        {assessments.length === 0 ? (
          <p className="text-sm text-slate-500">No assessments recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {assessments.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                <span className="text-slate-600">{new Date(a.created_at).toLocaleDateString('en-GB')}</span>
                <span className="flex items-center gap-3">
                  {a.recommended_level && <span className="font-semibold">{a.recommended_level} {LEVEL_NAME[parseLevel(a.recommended_level) ?? 0] ?? ''}</span>}
                  {a.score_total != null && a.score_max != null && <span className="text-slate-500">{a.score_total}/{a.score_max}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusPill({ status }: { status: 'present' | 'absent' | 'late' }) {
  const map = {
    present: 'bg-emerald-100 text-emerald-800',
    late: 'bg-amber-100 text-amber-800',
    absent: 'bg-rose-100 text-rose-800',
  };
  const label = { present: 'Present', late: 'Late', absent: 'Absent' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${map[status]}`}>{label[status]}</span>;
}
