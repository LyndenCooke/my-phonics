import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardCheck, Loader2, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, type SchoolStudentRow } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

type Student = Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'current_level' | 'classroom_id' | 'school_id'>;

type ClassroomLite = { id: string; name: string };

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type Level = (typeof LEVELS)[number];

const UNASSIGNED = 'unassigned' as const;

function parseLevel(s: string | null | undefined): Level | typeof UNASSIGNED {
  if (!s) return UNASSIGNED;
  const m = /^L?([1-8])$/.exec(s.trim());
  return m ? (Number(m[1]) as Level) : UNASSIGNED;
}

function levelLabel(l: Level | typeof UNASSIGNED): string {
  return l === UNASSIGNED ? 'Not assessed' : `Level ${l}`;
}

export default function PhonicsGroups() {
  const { memberships } = useSchoolMemberships();
  const { toast } = useToast();
  const school = memberships[0]?.school;

  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomLite[]>([]);
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [moveTarget, setMoveTarget] = useState<Student | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!school) return;
    (async () => {
      setLoading(true);
      const [{ data: rooms }, { data: rows }] = await Promise.all([
        schoolDb.classrooms().select('id, name').eq('school_id', school.id).order('name'),
        schoolDb.students().select('id, first_name, last_name, current_level, classroom_id, school_id').eq('school_id', school.id).order('first_name'),
      ]);
      setClassrooms((rooms ?? []) as ClassroomLite[]);
      setStudents((rows ?? []) as Student[]);
      setLoading(false);
    })();
  }, [school]);

  const filtered = useMemo(() => {
    if (classroomFilter === 'all') return students;
    return students.filter((s) => s.classroom_id === classroomFilter);
  }, [students, classroomFilter]);

  const byLevel = useMemo(() => {
    const groups: Record<string, Student[]> = { [UNASSIGNED]: [] };
    for (const l of LEVELS) groups[String(l)] = [];
    for (const s of filtered) {
      const key = String(parseLevel(s.current_level));
      groups[key].push(s);
    }
    return groups;
  }, [filtered]);

  const moveStudent = async (studentId: string, newLevel: Level | typeof UNASSIGNED) => {
    setSaving(true);
    const newValue = newLevel === UNASSIGNED ? null : `L${newLevel}`;
    const previous = students;
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, current_level: newValue } : s)));
    const { error } = await schoolDb
      .students()
      .update({ current_level: newValue, updated_at: new Date().toISOString() })
      .eq('id', studentId);
    setSaving(false);
    setMoveTarget(null);
    if (error) {
      setStudents(previous);
      toast({ title: 'Could not move student', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    toast({ title: `Moved to ${newLevel === UNASSIGNED ? 'unassigned' : `L${newLevel}`}` });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  const totalStudents = filtered.length;
  const unassessedCount = byLevel[UNASSIGNED].length;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Phonics groups</h1>
        <p className="text-slate-600">
          {totalStudents} student{totalStudents === 1 ? '' : 's'} grouped by current level.
          {unassessedCount > 0 && (
            <> <span className="text-amber-700 font-semibold">{unassessedCount} not yet assessed.</span></>
          )}
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Class:</span>
        <button
          onClick={() => setClassroomFilter('all')}
          className={[
            'px-3 py-1.5 rounded-full text-sm font-semibold',
            classroomFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
          ].join(' ')}
        >
          All classes
        </button>
        {classrooms.map((c) => (
          <button
            key={c.id}
            onClick={() => setClassroomFilter(c.id)}
            className={[
              'px-3 py-1.5 rounded-full text-sm font-semibold',
              classroomFilter === c.id ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
            ].join(' ')}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Unassigned bucket — surfaces students who still need an initial assessment. */}
      {byLevel[UNASSIGNED].length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-bold text-amber-900 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4" /> Needs initial assessment
              </h2>
              <p className="text-xs text-amber-800">Run the screener to assign each child a starting level.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {byLevel[UNASSIGNED].map((s) => (
              <StudentChip key={s.id} student={s} variant="amber" onMove={() => setMoveTarget(s)} />
            ))}
          </div>
        </section>
      )}

      {/* 8-level grid. Click a chip → modal to move. */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LEVELS.map((level) => {
          const list = byLevel[String(level)];
          return (
            <div
              key={level}
              data-school-level={level}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden"
            >
              <header className="s-bg-level text-white px-4 py-2 flex items-center justify-between gap-2">
                <span className="font-bold text-sm truncate">L{level} {LEVEL_NAME[level]}</span>
                <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5 flex-shrink-0">{list.length}</span>
              </header>
              <div className="p-3 min-h-[120px] flex flex-wrap gap-1.5 content-start">
                {list.length === 0 ? (
                  <p className="text-xs text-slate-400 italic w-full text-center py-6">No students at this level yet.</p>
                ) : (
                  list.map((s) => (
                    <StudentChip key={s.id} student={s} variant="solid" level={level} onMove={() => setMoveTarget(s)} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </section>

      {totalStudents === 0 && (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-lg mb-1">No students yet</h3>
          <p className="text-slate-600 text-sm mb-4">Add students to a classroom first, then group them by level here.</p>
          <Link
            to="/school/app/classrooms"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
          >
            Go to classrooms <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Move modal */}
      {moveTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setMoveTarget(null)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-xl">{moveTarget.first_name} {moveTarget.last_name ?? ''}</h3>
                <p className="text-sm text-slate-500">Currently at <span className="font-semibold">{levelLabel(parseLevel(moveTarget.current_level))}</span></p>
              </div>
              <button onClick={() => setMoveTarget(null)} className="text-slate-400 hover:text-slate-900"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Move to</p>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  disabled={saving}
                  onClick={() => moveStudent(moveTarget.id, l)}
                  data-school-level={l}
                  className={[
                    'rounded-xl p-3 text-center font-bold text-sm transition-all',
                    parseLevel(moveTarget.current_level) === l
                      ? 's-bg-level text-white s-ring'
                      : 's-bg-tint s-text-ink hover:opacity-80',
                  ].join(' ')}
                >
                  L{l}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={saving}
                onClick={() => moveStudent(moveTarget.id, UNASSIGNED)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
              >
                Mark unassigned
              </button>
              <Link
                to={`/school/app/students/${moveTarget.id}/assess`}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-pink-600 text-white text-sm font-semibold rounded-lg hover:bg-pink-700"
              >
                <ClipboardCheck className="w-4 h-4" /> Run assessment
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentChip({
  student,
  variant,
  level,
  onMove,
}: {
  student: Student;
  variant: 'solid' | 'amber';
  level?: Level;
  onMove: () => void;
}) {
  const initials = `${student.first_name.charAt(0)}${(student.last_name ?? '').charAt(0)}`.toUpperCase();
  const baseClasses = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer';
  const variantClasses =
    variant === 'amber'
      ? 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
      : 'bg-white/95 backdrop-blur text-slate-900 hover:bg-white shadow-sm';
  return (
    <button
      data-school-level={level}
      onClick={onMove}
      className={[baseClasses, variantClasses].join(' ')}
      title={`${student.first_name} ${student.last_name ?? ''} — click to move`}
    >
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">{initials || '?'}</span>
      <span>{student.first_name}{student.last_name ? ` ${student.last_name.charAt(0)}.` : ''}</span>
    </button>
  );
}
