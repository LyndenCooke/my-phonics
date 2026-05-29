import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, ClipboardCheck, Loader2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, type SchoolStudentRow } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { getBlocks } from '../data/pathway';
import RegisterDialog from '../components/RegisterDialog';

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

// First teaching block focus + the level's first storybook — a sensible
// "what this group is working towards" line for the column header.
function GroupFocusLine({ level }: { level: number }) {
  const block = getBlocks(level).find((b) => !b.isReview);
  if (!block) return null;
  const story = block.steps.find((s) => s.kind === 'storybook');
  return (
    <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[11px] text-slate-500">
      <span className="font-semibold text-slate-600">Block {block.blockNumber} of {block.totalTeachingBlocks}:</span> {block.focusLabel}
      {story && <> · <span className="text-slate-400">towards</span> {story.title}</>}
    </div>
  );
}

type Student = Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'current_level' | 'classroom_id' | 'school_id'>;

type ClassroomLite = { id: string; name: string; year_group: string | null };

// "Year 2 Cedar" / year_group "Year 2" → "Y2"; "Reception" → "R".
function shortYear(yearGroup: string | null): string {
  if (!yearGroup) return '';
  const t = yearGroup.trim();
  if (/^reception/i.test(t) || /^fs/i.test(t) || /\bR\b/.test(t)) return 'R';
  const m = /(\d+)/.exec(t);
  return m ? `Y${m[1]}` : t.slice(0, 3);
}

const LEVELS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
type Level = (typeof LEVELS)[number];

const UNASSIGNED = 'unassigned' as const;

function parseLevel(s: string | null | undefined): Level | typeof UNASSIGNED {
  if (!s) return UNASSIGNED;
  const m = /^L?([1-8])$/.exec(s.trim());
  return m ? (Number(m[1]) as Level) : UNASSIGNED;
}

export default function PhonicsGroups() {
  const { memberships } = useSchoolMemberships();
  const { toast } = useToast();
  const navigate = useNavigate();
  const school = memberships[0]?.school;

  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomLite[]>([]);
  const [classroomFilter, setClassroomFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [registerLevel, setRegisterLevel] = useState<Level | null>(null);
  const [saving, setSaving] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null); // level number as string, or UNASSIGNED

  const openProfile = (id: string) => navigate(`/school/app/students/${id}`);

  const handleDrop = (target: Level | typeof UNASSIGNED) => {
    const id = draggedId;
    setDraggedId(null);
    setDragOver(null);
    if (!id) return;
    const current = students.find((s) => s.id === id);
    if (!current || parseLevel(current.current_level) === target) return; // no-op if same group
    moveStudent(id, target);
  };

  useEffect(() => {
    if (!school) return;
    (async () => {
      setLoading(true);
      const [{ data: rooms }, { data: rows }] = await Promise.all([
        schoolDb.classrooms().select('id, name, year_group').eq('school_id', school.id).order('name'),
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

  const yearByClassroom = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of classrooms) m[c.id] = shortYear(c.year_group);
    return m;
  }, [classrooms]);

  // How many distinct year groups feed each level — used to flag mixed-age groups.
  const yearSpreadByLevel = useMemo(() => {
    const spread: Record<string, Set<string>> = {};
    for (const [key, list] of Object.entries(byLevel)) {
      spread[key] = new Set(list.map((s) => yearByClassroom[s.classroom_id]).filter(Boolean));
    }
    return spread;
  }, [byLevel, yearByClassroom]);

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
          {totalStudents} student{totalStudents === 1 ? '' : 's'} grouped by current level — across year groups, the way schools actually teach phonics.
          {unassessedCount > 0 && (
            <> <span className="text-amber-700 font-semibold">{unassessedCount} not yet assessed.</span></>
          )}
        </p>
        <p className="text-xs text-slate-400 mt-1">Drag a name into another group to move them · click a name to open their profile.</p>
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

      {/* Unassigned bucket — surfaces students who still need an initial assessment.
          Also a drop target: drag a child here to clear their level. */}
      {byLevel[UNASSIGNED].length > 0 && (
        <section
          onDragOver={(e) => { if (draggedId) { e.preventDefault(); setDragOver(UNASSIGNED); } }}
          onDragLeave={() => setDragOver((d) => (d === UNASSIGNED ? null : d))}
          onDrop={(e) => { e.preventDefault(); handleDrop(UNASSIGNED); }}
          className={['border rounded-2xl p-4 transition-colors', dragOver === UNASSIGNED ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300' : 'bg-amber-50 border-amber-200'].join(' ')}
        >
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
              <StudentChip key={s.id} student={s} variant="amber" year={yearByClassroom[s.classroom_id]} onOpenProfile={() => openProfile(s.id)} onDragStart={() => setDraggedId(s.id)} onDragEnd={() => { setDraggedId(null); setDragOver(null); }} />
            ))}
          </div>
        </section>
      )}

      {/* 8-level grid. Drag a chip into a column to move; click a chip for profile. */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {LEVELS.map((level) => {
          const list = byLevel[String(level)];
          const mixedYears = yearSpreadByLevel[String(level)]?.size ?? 0;
          const isDropTarget = dragOver === String(level);
          return (
            <div
              key={level}
              data-school-level={level}
              onDragOver={(e) => { if (draggedId) { e.preventDefault(); setDragOver(String(level)); } }}
              onDragLeave={() => setDragOver((d) => (d === String(level) ? null : d))}
              onDrop={(e) => { e.preventDefault(); handleDrop(level); }}
              className={['bg-white border rounded-2xl overflow-hidden transition-all', isDropTarget ? 's-border ring-2 s-ring' : 'border-slate-200'].join(' ')}
            >
              <header className="s-bg-level text-white px-4 py-2 flex items-center justify-between gap-2">
                <span className="font-bold text-sm truncate">L{level} {LEVEL_NAME[level]}</span>
                <span className="flex items-center gap-1.5 flex-shrink-0">
                  {list.length > 0 && (
                    <button
                      onClick={() => setRegisterLevel(level)}
                      title="Take the register for this group"
                      className="inline-flex items-center gap-1 bg-white/25 hover:bg-white/40 rounded-full px-2 py-0.5 text-[11px] font-bold transition-colors"
                    >
                      <CalendarCheck className="w-3 h-3" /> Register
                    </button>
                  )}
                  <span className="text-xs font-bold bg-white/25 rounded-full px-2 py-0.5">{list.length}</span>
                </span>
              </header>
              {list.length > 0 && <GroupFocusLine level={level} />}
              {mixedYears > 1 && (
                <div className="px-3 py-1 bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Mixed years: {[...(yearSpreadByLevel[String(level)] ?? [])].sort().join(' · ')}
                </div>
              )}
              <div className="p-3 min-h-[120px] flex flex-wrap gap-1.5 content-start">
                {list.length === 0 ? (
                  <p className={['text-xs italic w-full text-center py-6', isDropTarget ? 's-text-ink font-semibold' : 'text-slate-400'].join(' ')}>
                    {isDropTarget ? 'Drop to move here' : 'No students at this level yet.'}
                  </p>
                ) : (
                  list.map((s) => (
                    <StudentChip key={s.id} student={s} variant="solid" level={level} year={yearByClassroom[s.classroom_id]} onOpenProfile={() => openProfile(s.id)} onDragStart={() => setDraggedId(s.id)} onDragEnd={() => { setDraggedId(null); setDragOver(null); }} />
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

      {/* Register dialog for a level group */}
      {registerLevel !== null && school && (
        <RegisterDialog
          open
          onClose={() => setRegisterLevel(null)}
          schoolId={school.id}
          title={`L${registerLevel} ${LEVEL_NAME[registerLevel]} — phonics group`}
          students={filtered.filter((s) => parseLevel(s.current_level) === registerLevel).map((s) => ({ id: s.id, first_name: s.first_name, last_name: s.last_name }))}
          context={{ type: 'group', level: registerLevel }}
        />
      )}
    </div>
  );
}

function StudentChip({
  student,
  variant,
  level,
  year,
  onOpenProfile,
  onDragStart,
  onDragEnd,
}: {
  student: Student;
  variant: 'solid' | 'amber';
  level?: Level;
  year?: string;
  onOpenProfile: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const baseClasses = 'inline-flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-grab active:cursor-grabbing select-none';
  const variantClasses =
    variant === 'amber'
      ? 'bg-white border border-amber-300 text-amber-900 hover:bg-amber-100'
      : 'bg-white/95 backdrop-blur text-slate-900 hover:bg-white shadow-sm';
  return (
    <button
      type="button"
      draggable
      data-school-level={level}
      onClick={onOpenProfile}
      onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', student.id); onDragStart(); }}
      onDragEnd={onDragEnd}
      className={[baseClasses, variantClasses].join(' ')}
      title={`${student.first_name} ${student.last_name ?? ''}${year ? ` (${year})` : ''} — drag to move, click for profile`}
    >
      {year && (
        <span className="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 rounded-full bg-slate-900 text-white text-[10px]">{year}</span>
      )}
      <span>{student.first_name}{student.last_name ? ` ${student.last_name.charAt(0)}.` : ''}</span>
    </button>
  );
}
