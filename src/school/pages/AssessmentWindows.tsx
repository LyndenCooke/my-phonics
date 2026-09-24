import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { ArrowUpRight, CheckCircle2, ClipboardCheck, Loader2, Minus, TriangleAlert, Users } from 'lucide-react';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { learnerPosition } from '../data/pathway';

type Student = { id: string; classroom_id: string; first_name: string; last_name: string | null; current_level: string | null; pathway_completed: number | null; teacher_judgement: 'continue' | 'ready_soon' | 'needs_support' | null };
type Classroom = { id: string; name: string; year_group: string | null };
type Assessment = { student_id: string; created_at: string };

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));
const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));
const DAY = 24 * 60 * 60 * 1000;

function parseLevel(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}

function fmt(d: Date): string {
  return d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AssessmentWindows() {
  const { t } = useTranslation('schoolApp');
  const { memberships } = useSchoolMemberships();
  const school = memberships[0]?.school;

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  // Current half-term assessment window: a six-week window ending today.
  const windowEnd = useMemo(() => new Date(), []);
  const windowStart = useMemo(() => new Date(Date.now() - 42 * DAY), []);

  useEffect(() => {
    if (!school) return;
    (async () => {
      setLoading(true);
      const [{ data: rooms }, { data: stu }, { data: ass }] = await Promise.all([
        schoolDb.classrooms().select('id, name, year_group').eq('school_id', school.id).order('name'),
        schoolDb.students().select('id, classroom_id, first_name, last_name, current_level, pathway_completed, teacher_judgement').eq('school_id', school.id),
        schoolDb.assessments().select('student_id, created_at').eq('school_id', school.id),
      ]);
      setClassrooms((rooms ?? []) as Classroom[]);
      setStudents((stu ?? []) as Student[]);
      setAssessments((ass ?? []) as Assessment[]);
      setLoading(false);
    })();
  }, [school]);

  const model = useMemo(() => {
    const startMs = windowStart.getTime();
    const assessedInWindow = new Set(
      assessments.filter((a) => new Date(a.created_at).getTime() >= startMs).map((a) => a.student_id),
    );

    const perClass = classrooms.map((c) => {
      const list = students.filter((s) => s.classroom_id === c.id);
      const done = list.filter((s) => assessedInWindow.has(s.id)).length;
      return { ...c, total: list.length, done, remaining: list.length - done };
    });

    // Regrouping outcomes from teacher-judgement derivation.
    let readyUp = 0, staying = 0, intervention = 0, unassessed = 0;
    const levelDist: Record<number, number> = {};
    for (const s of students) {
      const lvl = parseLevel(s.current_level);
      if (!lvl) { unassessed++; continue; }
      levelDist[lvl] = (levelDist[lvl] ?? 0) + 1;
      const j = learnerPosition(lvl, s.id, { completedCount: s.pathway_completed, judgement: s.teacher_judgement }).judgement;
      if (j === 'ready_soon') readyUp++;
      else if (j === 'needs_support') intervention++;
      else staying++;
    }

    const totalAssessed = assessedInWindow.size;
    return { perClass, readyUp, staying, intervention, unassessed, levelDist, totalAssessed, total: students.length };
  }, [classrooms, students, assessments, windowStart]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">{t('windowsPage.title')}</h1>
        <p className="text-slate-600 max-w-3xl">
          {t('windowsPage.intro')}
        </p>
      </header>

      {/* Current window */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold uppercase mb-1">
              <ClipboardCheck className="w-3.5 h-3.5" /> {t('windowsPage.rolling')}
            </div>
            <h2 className="font-display text-xl font-extrabold">{t('windowsPage.recent')}</h2>
            <p className="text-sm text-slate-500">{fmt(windowStart)} – {fmt(windowEnd)} · {t('windowsPage.allClasses')}</p>
          </div>
          <div className="text-end">
            <div dir="ltr" className="text-3xl font-extrabold">{model.totalAssessed}<span className="text-slate-400 text-lg">/{model.total}</span></div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{t('windowsPage.assessedLast6')}</div>
          </div>
        </div>

        {/* Per-class completion */}
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {model.perClass.map((c) => {
            const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <Link key={c.id} to={`/school/app/classrooms/${c.id}`} className="rounded-xl border border-slate-200 p-3 hover:border-slate-400 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{c.name}</span>
                  <span dir="ltr" className="text-xs font-semibold text-slate-500">{c.done}/{c.total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {c.remaining > 0 ? t('windowsPage.remaining', { count: c.remaining }) : t('windowsPage.allAssessed')}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Regrouping outcomes */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('windowsPage.indicators')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <OutcomeCard icon={<ArrowUpRight className="w-5 h-5" />} tone="emerald" value={model.readyUp} label={t('outcomes.readyUp')} />
          <OutcomeCard icon={<Minus className="w-5 h-5" />} tone="slate" value={model.staying} label={t('outcomes.staying')} />
          <OutcomeCard icon={<TriangleAlert className="w-5 h-5" />} tone="amber" value={model.intervention} label={t('outcomes.intervention')} />
          <OutcomeCard icon={<ClipboardCheck className="w-5 h-5" />} tone="rose" value={model.unassessed} label={t('outcomes.stillToAssess')} />
        </div>
      </section>

      {/* Phonics lead summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> {t('windowsPage.leadSummary')}</h2>
        <p className="text-sm text-slate-600 mb-4">
          {t('windowsPage.summary', {
            total: model.total,
            classes: model.perClass.length,
            assessed: model.totalAssessed,
            remaining: model.total - model.totalAssessed,
            readyUp: model.readyUp,
            intervention: model.intervention,
          })}
        </p>
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t('windowsPage.regroupingView')}</div>
        <div className="space-y-2">
          {SCHOOL_LEVELS.map((l) => {
            const n = model.levelDist[l.level] ?? 0;
            const pct = model.total ? Math.round((n / model.total) * 100) : 0;
            return (
              <div key={l.level} className="flex items-center gap-3">
                <span dir="ltr" lang="en" className="w-20 text-xs font-semibold text-slate-600 flex-shrink-0 text-start">L{l.level} {LEVEL_NAME[l.level]}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(pct, n > 0 ? 3 : 0)}%`, backgroundColor: HEX[l.level] }} />
                </div>
                <span className="w-8 text-end text-xs font-bold text-slate-700 flex-shrink-0">{n}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Link to="/school/app/groups" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800">
            {t('windowsPage.openGroups')} <ArrowUpRight className="w-4 h-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function OutcomeCard({ icon, tone, value, label }: { icon: React.ReactNode; tone: 'emerald' | 'slate' | 'amber' | 'rose'; value: number; label: string }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    slate: 'bg-white border-slate-200 text-slate-800',
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    rose: 'bg-rose-50 border-rose-200 text-rose-800',
  };
  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="mb-1 opacity-80">{icon}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
    </div>
  );
}
