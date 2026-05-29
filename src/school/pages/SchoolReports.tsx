import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ClipboardCheck, Layers, Loader2, Users } from 'lucide-react';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb } from '../lib/schoolClient';
import { SCHOOL_LEVELS } from '../data/levels';
import { learnerPosition, programmeTotals } from '../data/pathway';

type Student = { id: string; classroom_id: string; current_level: string | null };
type Classroom = { id: string; name: string };

const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));
const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));

function parseLevel(s: string | null): number | null {
  if (!s) return null;
  const m = /([1-8])/.exec(s);
  return m ? Number(m[1]) : null;
}

export default function SchoolReports() {
  const { memberships } = useSchoolMemberships();
  const school = memberships[0]?.school;
  const [students, setStudents] = useState<Student[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const totals = useMemo(() => programmeTotals(), []);

  useEffect(() => {
    if (!school) return;
    (async () => {
      setLoading(true);
      const [{ data: stu }, { data: rooms }] = await Promise.all([
        schoolDb.students().select('id, classroom_id, current_level').eq('school_id', school.id),
        schoolDb.classrooms().select('id, name').eq('school_id', school.id),
      ]);
      setStudents((stu ?? []) as Student[]);
      setClassrooms((rooms ?? []) as Classroom[]);
      setLoading(false);
    })();
  }, [school]);

  const model = useMemo(() => {
    const dist: Record<number, number> = {};
    let assessed = 0, readyUp = 0, intervention = 0;
    for (const s of students) {
      const lvl = parseLevel(s.current_level);
      if (!lvl) continue;
      assessed++;
      dist[lvl] = (dist[lvl] ?? 0) + 1;
      const j = learnerPosition(lvl, s.id).judgement;
      if (j === 'ready_soon') readyUp++;
      else if (j === 'needs_support') intervention++;
    }
    return { dist, assessed, readyUp, intervention, total: students.length, unassessed: students.length - assessed };
  }, [students]);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Reports</h1>
        <p className="text-slate-600">A whole-school view of progress across the British phonics progression.</p>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={<Users className="w-5 h-5" />} value={model.total} label="Pupils tracked" />
        <Stat icon={<ClipboardCheck className="w-5 h-5" />} value={model.assessed} label="Placed by assessment" />
        <Stat icon={<ArrowRight className="w-5 h-5" />} value={model.readyUp} label="Ready to move up" />
        <Stat icon={<Layers className="w-5 h-5" />} value={model.intervention} label="Needing intervention" tone="amber" />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">Children at each level</h2>
        <div className="space-y-2">
          {SCHOOL_LEVELS.map((l) => {
            const n = model.dist[l.level] ?? 0;
            const pct = model.assessed ? Math.round((n / model.assessed) * 100) : 0;
            return (
              <div key={l.level} className="flex items-center gap-3">
                <span className="w-24 text-xs font-semibold text-slate-600 flex-shrink-0">L{l.level} {LEVEL_NAME[l.level]}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(pct, n > 0 ? 3 : 0)}%`, backgroundColor: HEX[l.level] }} />
                </div>
                <span className="w-8 text-right text-xs font-bold text-slate-700 flex-shrink-0">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-center gap-2 mb-1"><BookOpen className="w-4 h-4 text-slate-500" /><h2 className="font-bold">Programme at a glance</h2></div>
        <p className="text-sm text-slate-600">
          A complete {totals.teachingSteps}-step phonics pathway supported by {totals.totalResources}+ linked resources across 8 levels:
          {' '}{totals.soundBooks} real-photo Sound Books, {totals.blendingBooks} Blending Books, {totals.storybooks} illustrated Storybooks,
          {' '}{totals.interactiveBooks} interactive digital Storybooks, {totals.matchedWorksheets} matched worksheets,
          {' '}{totals.soundMats} sound mats, {totals.trickyWordCards} tricky word card sets and {totals.phonemeAudio}+ phoneme audio files.
        </p>
        <Link to="/school/app/pathway" className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800">
          View the learning pathway <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}

function Stat({ icon, value, label, tone }: { icon: React.ReactNode; value: number; label: string; tone?: 'amber' }) {
  return (
    <div className={['rounded-2xl border p-4', tone === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'].join(' ')}>
      <div className={['mb-1', tone === 'amber' ? 'text-amber-700' : 'text-slate-400'].join(' ')}>{icon}</div>
      <div className="text-3xl font-extrabold">{value}</div>
      <div className="text-xs font-semibold text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}
