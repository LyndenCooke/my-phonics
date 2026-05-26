import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Loader2, Plus, Users, ClipboardCheck } from 'lucide-react';
import { useSchoolMemberships } from '../hooks/useSchool';
import { useToast } from '@/hooks/use-toast';
import { schoolDb, type ClassroomRow } from '../lib/schoolClient';

type Classroom = {
  id: string;
  name: string;
  year_group: string | null;
  student_count?: number;
};

export default function SchoolAppHome() {
  const { memberships } = useSchoolMemberships();
  const { toast } = useToast();
  const school = memberships[0]?.school;

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYearGroup, setNewYearGroup] = useState('Year 1');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!school) return;
    (async () => {
      setLoading(true);
      const { data: rooms, error } = await schoolDb
        .classrooms()
        .select('id, name, year_group')
        .eq('school_id', school.id)
        .order('created_at', { ascending: true });
      if (error) {
        toast({ title: 'Could not load classrooms', description: (error as { message?: string }).message, variant: 'destructive' });
        setClassrooms([]);
      } else {
        const roomList = (rooms ?? []) as Pick<ClassroomRow, 'id' | 'name' | 'year_group'>[];
        const ids = roomList.map((r) => r.id);
        const counts: Record<string, number> = {};
        if (ids.length > 0) {
          const { data: students } = await schoolDb
            .students()
            .select('classroom_id')
            .in('classroom_id', ids);
          for (const s of (students ?? []) as { classroom_id: string }[]) {
            counts[s.classroom_id] = (counts[s.classroom_id] ?? 0) + 1;
          }
        }
        setClassrooms(roomList.map((r) => ({ ...r, student_count: counts[r.id] ?? 0 })));
      }
      setLoading(false);
    })();
  }, [school, toast]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !newName.trim()) return;
    setCreating(true);
    const { data, error } = await schoolDb
      .classrooms()
      .insert({ school_id: school.id, name: newName.trim(), year_group: newYearGroup.trim() || null })
      .select('id, name, year_group')
      .single();
    setCreating(false);
    if (error) {
      toast({ title: 'Could not create classroom', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    const created = data as Pick<ClassroomRow, 'id' | 'name' | 'year_group'>;
    setClassrooms((prev) => [...prev, { ...created, student_count: 0 }]);
    setNewName('');
    setShowNewForm(false);
    toast({ title: 'Classroom created' });
  };

  const totalStudents = classrooms.reduce((sum, c) => sum + (c.student_count ?? 0), 0);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">
          Welcome to {school?.name ?? 'your school'}
        </h1>
        <p className="text-slate-600">
          {classrooms.length === 0
            ? "Let's get your first classroom set up."
            : `${classrooms.length} classroom${classrooms.length === 1 ? '' : 's'} · ${totalStudents} student${totalStudents === 1 ? '' : 's'}`}
        </p>
      </header>

      <section className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={<Users className="w-5 h-5" />} label="Classrooms" value={classrooms.length} />
        <StatCard icon={<Users className="w-5 h-5" />} label="Students" value={totalStudents} />
        <StatCard icon={<ClipboardCheck className="w-5 h-5" />} label="Seat allowance" value={school?.seat_count ?? '—'} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Classrooms</h2>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> New classroom
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 grid sm:grid-cols-[1fr,auto,auto] gap-3 items-end">
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">Class name</span>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Cherry Class"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">Year group</span>
              <input
                type="text"
                value={newYearGroup}
                onChange={(e) => setNewYearGroup(e.target.value)}
                placeholder="Year 1"
                className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-1">No classrooms yet</h3>
            <p className="text-slate-600 text-sm mb-4">Create your first classroom to add students and run assessments.</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> Create classroom
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {classrooms.map((c) => (
              <Link
                key={c.id}
                to={`/school/app/classrooms/${c.id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-400 hover:shadow-sm transition-all flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-lg">{c.name}</div>
                  <div className="text-sm text-slate-500">
                    {c.year_group ?? '—'} · {c.student_count ?? 0} student{c.student_count === 1 ? '' : 's'}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
        {icon} {label}
      </div>
      <div className="text-3xl font-extrabold">{value}</div>
    </div>
  );
}
