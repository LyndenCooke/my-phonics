import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, Loader2, Plus, ClipboardCheck, BookOpen, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, type ClassroomRow, type SchoolStudentRow } from '../lib/schoolClient';
import { StudentPathwayStatus } from '../components/LearnerStatus';
import RegisterDialog from '../components/RegisterDialog';

function parseLevelNum(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}

type Student = {
  id: string;
  first_name: string;
  last_name: string | null;
  date_of_birth: string | null;
  current_level: string | null;
  pathway_completed: number | null;
  teacher_judgement: 'continue' | 'ready_soon' | 'needs_support' | null;
  last_assessment?: {
    created_at: string;
    recommended_level: string | null;
  } | null;
};

type Classroom = {
  id: string;
  name: string;
  year_group: string | null;
  school_id: string;
};

export default function ClassroomDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { memberships } = useSchoolMemberships();
  const school = memberships[0]?.school;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [adding, setAdding] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data: cls, error: clsErr } = await schoolDb
        .classrooms()
        .select('id, name, year_group, school_id')
        .eq('id', id)
        .single();
      if (clsErr) {
        toast({ title: 'Classroom not found', description: (clsErr as { message?: string }).message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      setClassroom(cls as Pick<ClassroomRow, 'id' | 'name' | 'year_group' | 'school_id'>);

      const { data: rows } = await schoolDb
        .students()
        .select('id, first_name, last_name, date_of_birth, current_level, pathway_completed, teacher_judgement')
        .eq('classroom_id', id)
        .order('first_name', { ascending: true });

      const rowList = (rows ?? []) as Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'current_level' | 'pathway_completed' | 'teacher_judgement'>[];
      const studentIds = rowList.map((r) => r.id);
      const assessmentByStudent: Record<string, { created_at: string; recommended_level: string | null }> = {};
      if (studentIds.length > 0) {
        const { data: ass } = await schoolDb
          .assessments()
          .select('student_id, created_at, recommended_level')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false });
        for (const a of (ass ?? []) as { student_id: string; created_at: string; recommended_level: string | null }[]) {
          if (!assessmentByStudent[a.student_id]) {
            assessmentByStudent[a.student_id] = { created_at: a.created_at, recommended_level: a.recommended_level };
          }
        }
      }
      setStudents(rowList.map((r) => ({ ...r, last_assessment: assessmentByStudent[r.id] ?? null })));
      setLoading(false);
    })();
  }, [id, toast]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroom || !school || !firstName.trim()) return;
    setAdding(true);
    const { data, error } = await schoolDb
      .students()
      .insert({
        school_id: school.id,
        classroom_id: classroom.id,
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        date_of_birth: dob || null,
      })
      .select('id, first_name, last_name, date_of_birth, current_level')
      .single();
    setAdding(false);
    if (error) {
      toast({ title: 'Could not add student', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    const created = data as Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'current_level'>;
    setStudents((prev) => [...prev, { ...created, pathway_completed: 0, teacher_judgement: null, last_assessment: null }].sort((a, b) => a.first_name.localeCompare(b.first_name)));
    setFirstName('');
    setLastName('');
    setDob('');
    toast({ title: `${created.first_name} added` });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }
  if (!classroom) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 mb-4">Classroom not found.</p>
        <Link to="/school/app" className="text-pink-600 font-semibold hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <Link to="/school/app" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4" /> All classrooms
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{classroom.name}</h1>
        <p className="text-slate-600">{classroom.year_group ?? '—'} · {students.length} student{students.length === 1 ? '' : 's'}</p>
      </header>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Students</h2>
          <div className="flex gap-2">
            {students.length > 0 && (
              <button
                onClick={() => setShowRegister(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-semibold rounded-lg hover:bg-slate-50"
              >
                <CalendarCheck className="w-4 h-4" /> Take register
              </button>
            )}
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Add student
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAdd} className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 grid sm:grid-cols-[1fr,1fr,auto,auto] gap-3 items-end">
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">First name</span>
              <input
                required
                autoFocus
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">Last name</span>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">Date of birth</span>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-40 px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={adding}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
            </button>
          </form>
        )}

        {students.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center">
            <p className="text-slate-600">No students yet. Add your first one above.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {students.map((s) => {
              const level = parseLevelNum(s.current_level);
              const needsAssessment = !level && !s.last_assessment;
              return (
                <div key={s.id} className={['rounded-2xl border p-4 flex flex-col justify-between gap-3', needsAssessment ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'].join(' ')}>
                  <StudentPathwayStatus name={`${s.first_name} ${s.last_name ?? ''}`.trim()} level={level} seed={s.id} completedCount={s.pathway_completed} judgement={s.teacher_judgement} />
                  <div className="grid grid-cols-2 gap-1.5">
                    <Link
                      to={`/school/app/students/${s.id}`}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                    >
                      <User className="w-3.5 h-3.5" /> View report
                    </Link>
                    <Link
                      to={`/school/app/students/${s.id}/assess`}
                      className={[
                        'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg',
                        needsAssessment ? 'bg-pink-600 text-white hover:bg-pink-700' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
                      ].join(' ')}
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      {needsAssessment ? 'Assess' : 'Re-assess'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex items-start gap-3">
        <BookOpen className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold mb-1">Books for this class</h3>
          <p className="text-sm text-slate-600">
            Browse all 33 storybooks + worksheets in the <Link to="/school/app/library" className="font-semibold text-pink-600 hover:underline">school library</Link>.
            Use <Link to="/school/app/groups" className="font-semibold text-pink-600 hover:underline">Phonics groups</Link> to organise this class by ability level.
          </p>
        </div>
      </section>

      {showRegister && school && (
        <RegisterDialog
          open
          onClose={() => setShowRegister(false)}
          schoolId={school.id}
          title={`${classroom.name} — class register`}
          students={students.map((s) => ({ id: s.id, first_name: s.first_name, last_name: s.last_name }))}
          context={{ type: 'class', classroomId: classroom.id }}
        />
      )}
    </div>
  );
}
