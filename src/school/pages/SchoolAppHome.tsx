import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('schoolApp');
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
        toast({ title: t('home.loadFailed'), description: (error as { message?: string }).message, variant: 'destructive' });
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
  }, [school, toast, reloadKey, t]);

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
      toast({ title: t('home.createFailed'), description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    setNewName('');
    setShowNewForm(false);
    setReloadKey((k) => k + 1);
    toast({ title: t('home.created') });
  };

  const handleSeed = async () => {
    if (!school) return;
    // Destructive: seeding REPLACES all classrooms/pupils. Guard against a
    // real admin wiping live data — explicit confirmation required.
    if (!window.confirm(t('home.seed.confirm'))) return;
    setSeeding(true);
    const result = await seedDemoSchool(school.id);
    setSeeding(false);
    if (!result.ok) {
      toast({ title: t('home.seed.failed'), description: result.error, variant: 'destructive' });
      return;
    }
    setReloadKey((k) => k + 1);
    toast({ title: t('home.seed.done'), description: t('home.seed.doneBody', { classrooms: result.classrooms, students: result.students }) });
  };

  // Seed control is opt-in via ?seed=true ONLY. It used to auto-show on any
  // empty school, which exposed a destructive "replace all data" button to
  // real fresh-signup admins. Fresh schools now get the normal "create your
  // first classroom" empty state instead.
  const showSeed = seedMode;

  return (
    <div className="space-y-8">
      {showSeed && (
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5" />
            <div>
              <div className="font-bold text-sm">{t('home.seed.title')}</div>
              <p className="text-xs text-slate-300">
                {t('home.seed.body')}
              </p>
            </div>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-slate-900 text-sm font-bold rounded-lg hover:bg-slate-100 disabled:opacity-60 whitespace-nowrap"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
            {t('home.seed.button')}
          </button>
        </div>
      )}

      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">
          {t('home.welcome', { school: school?.name ?? t('home.yourSchool') })}
        </h1>
        <p className="text-slate-600">
          {classrooms.length === 0
            ? t('home.firstClassroom')
            : `${t('counts.classroom', { count: classrooms.length })} · ${t('counts.student', { count: stats.total })}`}
        </p>
      </header>

      {/* Stats row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Users className="w-5 h-5" />} label={t('home.stats.total')} value={stats.total} />
        <StatCard icon={<ClipboardCheck className="w-5 h-5" />} label={t('home.stats.assessed')} value={stats.assessed} />
        <StatCard icon={<AlertTriangle className="w-5 h-5" />} label={t('home.stats.notAssessed')} value={stats.unassessed} tone={stats.unassessed > 0 ? 'amber' : undefined} />
        <StatCard icon={<Layers className="w-5 h-5" />} label={t('home.stats.levelsActive')} value={stats.activeLevels} />
      </section>

      {/* Actions needed */}
      {(stats.unassessed > 0 || stats.stuck > 0 || stats.staleRooms > 0) && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h2 className="font-bold text-amber-900 flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-4 h-4" /> {t('home.actions.title')}
          </h2>
          <ul className="space-y-2 text-sm">
            {stats.unassessed > 0 && (
              <ActionRow
                to="/school/app/groups"
                text={t('home.actions.unassessed', { count: stats.unassessed })}
                cta={t('home.actions.assess')}
              />
            )}
            {stats.stuck > 0 && (
              <ActionRow
                to="/school/app/groups"
                text={t('home.actions.stuck', { count: stats.stuck })}
                cta={t('home.actions.review')}
              />
            )}
            {stats.staleRooms > 0 && (
              <ActionRow
                to="/school/app/classrooms"
                text={t('home.actions.stale', { count: stats.staleRooms })}
                cta={t('home.actions.open')}
              />
            )}
          </ul>
        </section>
      )}

      {/* Level distribution */}
      {stats.assessed > 0 && (
        <section className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">{t('home.distribution')}</h2>
          <div className="space-y-2">
            {SCHOOL_LEVELS.map((lvl) => {
              const count = stats.levelDistribution[lvl.level] ?? 0;
              const pct = stats.assessed > 0 ? Math.round((count / stats.assessed) * 100) : 0;
              return (
                <div key={lvl.level} className="flex items-center gap-3">
                  <span dir="ltr" lang="en" className="w-20 text-xs font-semibold text-slate-600 flex-shrink-0 text-start">L{lvl.level} {lvl.name}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%`, backgroundColor: lvl.hex }}
                    />
                  </div>
                  <span className="w-10 text-end text-xs font-bold text-slate-700 flex-shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Quick links */}
      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickLink to="/school/app/groups"     icon={<Layers className="w-5 h-5" />}     title={t('home.quick.groups.title')} body={t('home.quick.groups.body')} />
        <QuickLink to="/school/app/pathway"    icon={<RouteIcon className="w-5 h-5" />}  title={t('home.quick.pathway.title')} body={t('home.quick.pathway.body')} />
        <QuickLink to="/school/app/library"    icon={<BookOpen className="w-5 h-5" />}   title={t('home.quick.library.title')} body={t('home.quick.library.body')} />
        <QuickLink to="/school/app/mapping"    icon={<ClipboardCheck className="w-5 h-5" />} title={t('home.quick.curriculum.title')} body={t('home.quick.curriculum.body')} />
      </section>

      {/* Classrooms */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">{t('home.classrooms')}</h2>
          <button
            onClick={() => setShowNewForm((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
          >
            <Plus className="w-4 h-4" /> {t('home.newClassroom')}
          </button>
        </div>

        {showNewForm && (
          <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-2xl p-4 mb-4 grid sm:grid-cols-[1fr,auto,auto] gap-3 items-end">
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">{t('home.className')}</span>
              <input
                type="text"
                required
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={t('home.classNamePlaceholder')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-bold text-slate-600 mb-1">{t('home.yearGroup')}</span>
              <input
                type="text"
                value={newYearGroup}
                onChange={(e) => setNewYearGroup(e.target.value)}
                placeholder={t('home.yearGroupPlaceholder')}
                className="w-32 px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : t('home.create')}
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
            <h3 className="font-bold text-lg mb-1">{t('home.emptyTitle')}</h3>
            <p className="text-slate-600 text-sm mb-4">{t('home.emptyBody')}</p>
            <button
              onClick={() => setShowNewForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
            >
              <Plus className="w-4 h-4" /> {t('home.createClassroom')}
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
                      {c.year_group ?? '—'} · {t('counts.student', { count: c.student_count })}
                      {c.unassessed_count > 0 && (
                        <span className="ms-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold uppercase">
                          {t('home.toAssess', { count: c.unassessed_count })}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-slate-900 transition-colors rtl:-scale-x-100" />
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
        {cta} <ArrowRight className="w-3.5 h-3.5 rtl:-scale-x-100" />
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
