import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, BookOpen, Database, Layers, Loader2, Plus, Route as RouteIcon, Users, ClipboardCheck } from 'lucide-react';
import { useSchoolMemberships } from '../hooks/useSchool';
import { useToast } from '@/hooks/use-toast';
import { schoolDb, type ClassroomRow } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { seedDemoSchool } from '../lib/seedDemo';

type StudentLite = { id: string; classroom_id: string; current_level: string | null };
type AssessmentLite = { student_id: string; classroom_id: string; created_at: string };

type Classroom = {
  id: string;
  name: string;
  year_group: string | null;
  student_count: number;
  unassessed_count: number;
  level_counts: Record<number, number>;
};

const LEVEL_HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));
const DAY = 24 * 60 * 60 * 1000;

function parseLevelNum(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}

export default function SchoolAppHome() {
  const { memberships } = useSchoolMemberships();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const school = memberships[0]?.school;
  const seedMode = searchParams.get('seed') === 'true';

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newYearGroup, setNewYearGroup] = useState('Year 1');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

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
        setLoading(false);
        return;
      }
      const roomList = (rooms ?? []) as Pick<ClassroomRow, 'id' | 'name' | 'year_group'>[];

      const [{ data: studentRows }, { data: assessmentRows }] = await Promise.all([
        schoolDb.students().select('id, classroom_id, current_level').eq('school_id', school.id),
        schoolDb.assessments().select('student_id, classroom_id, created_at').eq('school_id', school.id),
      ]);
      const studentList = (studentRows ?? []) as StudentLite[];
      const assessmentList = (assessmentRows ?? []) as AssessmentLite[];
      setStudents(studentList);
      setAssessments(assessmentList);

      const byRoom: Record<string, StudentLite[]> = {};
      for (const s of studentList) (byRoom[s.classroom_id] ??= []).push(s);

      setClassrooms(
        roomList.map((r) => {
          const list = byRoom[r.id] ?? [];
          const level_counts: Record<number, number> = {};
          let unassessed = 0;
          for (const s of list) {
            const lvl = parseLevelNum(s.current_level);
            if (lvl) level_counts[lvl] = (level_counts[lvl] ?? 0) + 1;
            else unassessed++;
          }
          return { ...r, student_count: list.length, unassessed_count: unassessed, level_counts };
        }),
      );
      setLoading(false);
    })();
  }, [school, toast, reloadKey]);

  const stats = useMemo(() => {
    const total = students.length;
    const assessed = students.filter((s) => s.current_level).length;
    const unassessed = total - assessed;

    const levelDistribution: Record<number, number> = {};
    const activeLevels = new Set<number>();
    for (const s of students) {
      const lvl = parseLevelNum(s.current_level);
      if (lvl) {
        levelDistribution[lvl] = (levelDistribution[lvl] ?? 0) + 1;
        activeLevels.add(lvl);
      }
    }

    // Latest assessment per student.
    const latestByStudent: Record<string, number> = {};
    for (const a of assessments) {
      const t = new Date(a.created_at).getTime();
      if (!latestByStudent[a.student_id] || t > latestByStudent[a.student_id]) latestByStudent[a.student_id] = t;
    }
    const now = Date.now();
    // "Stuck": assessed student whose most recent assessment is 28+ days old.
    const stuck = students.filter((s) => s.current_level && latestByStudent[s.id] && now - latestByStudent[s.id] > 28 * DAY).length;

    // Classrooms with no assessment in the last 30 days.
    const latestByRoom: Record<string, number> = {};
    for (const a of assessments) {
      const t = new Date(a.created_at).getTime();
      if (!latestByRoom[a.classroom_id] || t > latestByRoom[a.classroom_id]) latestByRoom[a.classroom_id] = t;
    }
    const staleRooms = classrooms.filter((c) => c.student_count > 0 && (!latestByRoom[c.id] || now - latestByRoom[c.id] > 30 * DAY)).length;

    return { total, assessed, unassessed, levelDistribution, activeLevels: activeLevels.size, stuck, staleRooms };
  }, [students, assessments, classrooms]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school || !newName.trim()) return;
    setCreating(true);
    const { error } = await schoolDb
      .classrooms()
      .insert({ school_id: school.id, name: newName.trim(), year_group: newYearGroup.trim() || null });
    setCreating(false);
    if (error) {
      toast({ title: 'Could not create classroom', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    setNewName('');
    setShowNewForm(false);
    setReloadKey((k) => k + 1);
    toast({ title: 'Classroom created' });
  };

  const handleSeed = async () => {
    if (!school) return;
    setSeeding(true);
    const result = await seedDemoSchool(school.id);
    setSeeding(false);
    if (!result.ok) {
      toast({ title: 'Seed failed', description: result.error, variant: 'destructive' });
      return;
    }
    setReloadKey((k) => k + 1);
    toast({ title: 'Demo data seeded', description: `${result.classrooms} classrooms, ${result.students} students.` });
  };

  return (
    <div className="space-y-8">
      {seedMode && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" />
            <div>
              <div className="font-bold text-sm">Demo seed mode</div>
              <p className="text-xs text-slate-300">Replaces this school's classrooms with a realistic demo set (Al Noor-style). Idempotent.</p>
            </div>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            Seed demo data
          </button>
        </div>
      )}

      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">
          Welcome to {school?.name ?? 'your school'}
        </h1>
        <p className="text-slate-600">
          {classrooms.length === 0
            ? "Let's get your first classroom set up."
            : `${classrooms.length} classroom${classrooms.length === 1 ? '' : 's'} · ${stats.total} student${stats.total === 1 ? '' : 's'}`}
        </p>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-5 h-5" />} label="Total students" value={stats.total} />
        <StatCard icon={<ClipboardCheck className="w-5 h-5" />} label="Assessed" value={stats.assessed} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label="Not yet assessed" value={stats.unassessed} tone={stats.unassessed > 0 ? 'amber' : undefined} />
        <StatCard icon={<Layers className="w-5 h-5" />} label="Levels active" value={stats.activeLevels} />
      </section>

      {/* Actions needed */}
      {(stats.unassessed > 0 || stats.stuck > 0 || stats.staleRooms > 0) && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-bold text-amber-900 flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4" /> Actions needed
          </h2>
          <ul className="space-y-2 text-sm">
            {stats.unassessed > 0 && (
              <ActionRow
                to="/school/app/groups"
                text={`${stats.unassessed} child${stats.unassessed === 1 ? '' : 'ren'} not yet assessed`}
                cta="Assess"
              />
            )}
            {stats.stuck > 0 && (
              <ActionRow
                to="/school/app/groups"
                text={`${stats.stuck} child${stats.stuck === 1 ? '' : 'ren'} at the same level for 4+ weeks`}
                cta="Review"
              />
            )}
            {stats.staleRooms > 0 && (
              <ActionRow
                to="/school/app/classrooms"
                text={`${stats.staleRooms} classroom${stats.staleRooms === 1 ? '' : 's'} with no assessment this month`}
                cta="Open"
              />
            )}
          </ul>
        </section>
      )}

      {/* Level distribution */}
      {stats.assessed > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Level distribution across the school</h2>
          <div className="space-y-2">
            {SCHOOL_LEVELS.map((lvl) => {
              const count = stats.levelDistribution[lvl.level] ?? 0;
              const pct = stats.assessed > 0 ? Math.round((count / stats.assessed) * 100) : 0;
              return (
                <div key={lvl.level} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-semibold text-slate-600 flex-shrink-0">L{lvl.level} {lvl.name}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, backgroundColor: lvl.hex }}
                    />
                  </div>
                  <span className="w-10 text-right text-xs font-bold text-slate-700 flex-shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink to="/school/app/groups"     icon={<Layers className="w-5 h-5" />}     title="Phonics groups" body="Group students by level for intervention." />
        <QuickLink to="/school/app/pathway"    icon={<RouteIcon className="w-5 h-5" />}  title="Teaching pathway" body="Sound Book → Blending Book → Storybook." />
        <QuickLink to="/school/app/library"    icon={<BookOpen className="w-5 h-5" />}   title="Library"        body="118 books + worksheets, ready to print." />
        <QuickLink to="/school/app/mapping"    icon={<ClipboardCheck className="w-5 h-5" />} title="Curriculum"  body="UK, Gulf, Pakistan, US, IB alignment." />
      </section>

      {/* Classrooms */}
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
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-bold text-lg">{c.name}</div>
                    <div className="text-sm text-slate-500">
                      {c.year_group ?? '—'} · {c.student_count} student{c.student_count === 1 ? '' : 's'}
                      {c.unassessed_count > 0 && (
                        <span className="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          {c.unassessed_count} to assess
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                </div>
                <LevelMiniBar levelCounts={c.level_counts} total={c.student_count} />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LevelMiniBar({ levelCounts, total }: { levelCounts: Record<number, number>; total: number }) {
  if (total === 0) return null;
  return (
    <div className="flex h-2 rounded-full overflow-hidden bg-slate-100">
      {SCHOOL_LEVELS.map((lvl) => {
        const count = levelCounts[lvl.level] ?? 0;
        if (count === 0) return null;
        return (
          <div
            key={lvl.level}
            style={{ width: `${(count / total) * 100}%`, backgroundColor: lvl.hex }}
            title={`L${lvl.level}: ${count}`}
          />
        );
      })}
    </div>
  );
}

function ActionRow({ to, text, cta }: { to: string; text: string; cta: string }) {
  return (
    <li className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2">
      <span className="text-amber-900 font-medium">{text}</span>
      <Link to={to} className="inline-flex items-center gap-1 text-amber-900 font-bold text-xs hover:underline whitespace-nowrap">
        {cta} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </li>
  );
}

function QuickLink({ to, icon, title, body }: { to: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="group bg-white border border-slate-200 rounded-2xl p-4 hover:border-slate-400 hover:shadow-sm transition-all">
      <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 text-white mb-2">
        {icon}
      </div>
      <div className="font-bold mb-0.5">{title}</div>
      <p className="text-xs text-slate-500 leading-tight">{body}</p>
    </Link>
  );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number | string; tone?: 'amber' }) {
  return (
    <div className={['rounded-2xl p-5 border', tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'].join(' ')}>
      <div className={['flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1', tone === 'amber' ? 'text-amber-700' : 'text-slate-500'].join(' ')}>
        {icon} {label}
      </div>
      <div className={['text-3xl font-extrabold', tone === 'amber' ? 'text-amber-900' : ''].join(' ')}>{value}</div>
    </div>
  );
}
