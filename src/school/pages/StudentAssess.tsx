import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardCheck, Loader2, Trophy, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, type SchoolStudentRow } from '../lib/schoolClient';
import { SCREENING_WORDS, calculateStartLevel } from '@/lib/adaptiveEngine';

type Student = {
  id: string;
  first_name: string;
  last_name: string | null;
  classroom_id: string;
  school_id: string;
  current_level: string | null;
};

type Mode = 'choose' | 'screener' | 'manual' | 'done';

export default function StudentAssess() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { memberships } = useSchoolMemberships();

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>('choose');
  const [checks, setChecks] = useState<Record<number, boolean>>({});
  const [manualLevel, setManualLevel] = useState<string>('1');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [resultLevel, setResultLevel] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await schoolDb
        .students()
        .select('id, first_name, last_name, classroom_id, school_id, current_level')
        .eq('id', id)
        .single();
      if (error) {
        toast({ title: 'Student not found', description: (error as { message?: string }).message, variant: 'destructive' });
      } else {
        setStudent(data as Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'classroom_id' | 'school_id' | 'current_level'>);
      }
      setLoading(false);
    })();
  }, [id, toast]);

  const saveResult = async (level: string, payload: object, scoreTotal?: number, scoreMax?: number) => {
    if (!student || !memberships[0]) return;
    setSaving(true);
    const { error: assErr } = await schoolDb.assessments().insert({
      student_id: student.id,
      classroom_id: student.classroom_id,
      school_id: student.school_id,
      administered_by: user?.id ?? null,
      recommended_level: level,
      score_total: scoreTotal ?? null,
      score_max: scoreMax ?? null,
      payload,
    });
    if (assErr) {
      toast({ title: 'Could not save assessment', description: (assErr as { message?: string }).message, variant: 'destructive' });
      setSaving(false);
      return;
    }
    const { error: updErr } = await schoolDb
      .students()
      .update({ current_level: level, pathway_completed: 0, updated_at: new Date().toISOString() })
      .eq('id', student.id);
    if (updErr) {
      toast({ title: 'Could not update level', description: (updErr as { message?: string }).message, variant: 'destructive' });
    }
    setSaving(false);
    setResultLevel(level);
    setMode('done');
  };

  const handleScreenerSubmit = () => {
    const startLevel = calculateStartLevel(checks);
    const scoreTotal = Object.values(checks).filter(Boolean).length;
    saveResult(`L${startLevel}`, { method: 'screener', checks, notes }, scoreTotal, SCREENING_WORDS.length);
  };

  const handleManualSubmit = () => {
    saveResult(`L${manualLevel}`, { method: 'manual', notes });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }
  if (!student) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-600 mb-4">Student not found.</p>
        <Link to="/school/app" className="text-pink-600 font-semibold hover:underline">← Back to dashboard</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <Link to={`/school/app/classrooms/${student.classroom_id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to classroom
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Assess {student.first_name} {student.last_name ?? ''}
        </h1>
        {student.current_level && (
          <p className="text-slate-600">Current level: <span className="font-semibold">{student.current_level}</span></p>
        )}
      </header>

      {mode === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('screener')}
            className="bg-white border border-slate-200 rounded-2xl p-6 text-left hover:border-pink-300 hover:shadow-sm transition-all"
          >
            <ClipboardCheck className="w-6 h-6 text-pink-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">Quick screener</h3>
            <p className="text-sm text-slate-600">2 minutes. Have the child read 6 sample words — we'll pinpoint their level.</p>
          </button>
          <button
            onClick={() => setMode('manual')}
            className="bg-white border border-slate-200 rounded-2xl p-6 text-left hover:border-slate-400 hover:shadow-sm transition-all"
          >
            <Trophy className="w-6 h-6 text-slate-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">Set level manually</h3>
            <p className="text-sm text-slate-600">Already know where they are? Choose the level and add a note.</p>
          </button>
        </div>
      )}

      {mode === 'screener' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-bold text-lg mb-1">Screener</h2>
            <p className="text-sm text-slate-600 mb-4">
              Ask {student.first_name} to read each word. Tick the ones they read correctly.
            </p>
          </div>
          <div className="space-y-2">
            {SCREENING_WORDS.map((w) => (
              <label
                key={w.level}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={!!checks[w.level]}
                  onChange={(e) => setChecks((prev) => ({ ...prev, [w.level]: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300"
                />
                <span className="font-semibold text-lg flex-1">{w.word}</span>
                <span className="text-xs font-bold uppercase text-slate-400">Level {w.level}</span>
              </label>
            ))}
          </div>
          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any observations..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setMode('choose')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleScreenerSubmit}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & recommend level'}
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-bold text-lg mb-1">Set level manually</h2>
            <p className="text-sm text-slate-600 mb-4">Choose the level that matches {student.first_name}'s current ability.</p>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {[1,2,3,4,5,6,7,8].map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setManualLevel(String(l))}
                data-school-level={l}
                className={[
                  'rounded-xl p-3 text-center font-bold text-sm transition-all',
                  manualLevel === String(l)
                    ? 's-bg-level text-white s-ring'
                    : 's-bg-tint s-text-ink hover:opacity-80',
                ].join(' ')}
              >
                L{l}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setMode('choose')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : `Set ${student.first_name} to L${manualLevel}`}
            </button>
          </div>
        </div>
      )}

      {mode === 'done' && resultLevel && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-2xl font-extrabold mb-2">Assessment saved</h2>
          <p className="text-slate-600 mb-1">
            {student.first_name} is now on <span className="font-bold">{resultLevel}</span>.
          </p>
          <p className="text-sm text-slate-500 mb-6">
            We've stored the result and updated their record. You can re-assess any time.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => navigate(`/school/app/classrooms/${student.classroom_id}`)}
              className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
            >
              Back to classroom
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
