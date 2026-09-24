import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('schoolApp');
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
        toast({ title: t('assess.notFound'), description: (error as { message?: string }).message, variant: 'destructive' });
      } else {
        setStudent(data as Pick<SchoolStudentRow, 'id' | 'first_name' | 'last_name' | 'classroom_id' | 'school_id' | 'current_level'>);
      }
      setLoading(false);
    })();
  }, [id, toast, t]);

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
      toast({ title: t('assess.saveFailed'), description: (assErr as { message?: string }).message, variant: 'destructive' });
      setSaving(false);
      return;
    }
    const { error: updErr } = await schoolDb
      .students()
      .update({ current_level: level, pathway_completed: 0, updated_at: new Date().toISOString() })
      .eq('id', student.id);
    if (updErr) {
      toast({ title: t('assess.updateFailed'), description: (updErr as { message?: string }).message, variant: 'destructive' });
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
        <p className="text-slate-600 mb-4">{t('assess.notFoundBody')}</p>
        <Link to="/school/app" className="text-pink-600 font-semibold hover:underline"><span className="inline-block rtl:-scale-x-100">←</span> {t('backToDashboard')}</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <header>
        <Link to={`/school/app/classrooms/${student.classroom_id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('assess.backToClassroom')}
        </Link>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {t('assess.title', { name: `${student.first_name} ${student.last_name ?? ''}`.trim() })}
        </h1>
        {student.current_level && (
          <p className="text-slate-600">{t('assess.currentLevel')} <span dir="ltr" className="font-semibold">{student.current_level}</span></p>
        )}
      </header>

      {mode === 'choose' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setMode('screener')}
            className="bg-white border border-slate-200 rounded-2xl p-6 text-start hover:border-pink-300 hover:shadow-sm transition-all"
          >
            <ClipboardCheck className="w-6 h-6 text-pink-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">{t('assess.quickScreener')}</h3>
            <p className="text-sm text-slate-600">{t('assess.quickScreenerBody')}</p>
          </button>
          <button
            onClick={() => setMode('manual')}
            className="bg-white border border-slate-200 rounded-2xl p-6 text-start hover:border-slate-400 hover:shadow-sm transition-all"
          >
            <Trophy className="w-6 h-6 text-slate-600 mb-2" />
            <h3 className="font-bold text-lg mb-1">{t('assess.manual')}</h3>
            <p className="text-sm text-slate-600">{t('assess.manualBody')}</p>
          </button>
        </div>
      )}

      {mode === 'screener' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-bold text-lg mb-1">{t('assess.screener')}</h2>
            <p className="text-sm text-slate-600 mb-4">
              {t('assess.screenerBody', { name: student.first_name })}
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
                <span dir="ltr" lang="en" className="font-semibold text-lg flex-1 text-start">{w.word}</span>
                <span className="text-xs font-bold uppercase text-slate-400">{t('assess.level', { n: w.level })}</span>
              </label>
            ))}
          </div>
          <label className="block">
            <span className="block text-xs font-bold text-slate-600 mb-1">{t('assess.notes')}</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder={t('assess.notesPlaceholder')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </label>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setMode('choose')}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold hover:bg-slate-50"
            >
              {t('common:actions.cancel')}
            </button>
            <button
              onClick={handleScreenerSubmit}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('assess.saveRecommend')}
            </button>
          </div>
        </div>
      )}

      {mode === 'manual' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="font-bold text-lg mb-1">{t('assess.manual')}</h2>
            <p className="text-sm text-slate-600 mb-4">{t('assess.manualChoose', { name: student.first_name })}</p>
          </div>
          <div dir="ltr" className="grid grid-cols-4 sm:grid-cols-8 gap-2">
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
            <span className="block text-xs font-bold text-slate-600 mb-1">{t('assess.notes')}</span>
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
              {t('common:actions.cancel')}
            </button>
            <button
              onClick={handleManualSubmit}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('assess.setTo', { name: student.first_name, level: `L${manualLevel}` })}
            </button>
          </div>
        </div>
      )}

      {mode === 'done' && resultLevel && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h2 className="text-2xl font-extrabold mb-2">{t('assess.saved')}</h2>
          <p className="text-slate-600 mb-1">
            <Trans t={t} i18nKey="assess.nowOn" values={{ name: student.first_name, level: resultLevel }} components={{ b: <span className="font-bold" dir="ltr" /> }} />
          </p>
          <p className="text-sm text-slate-500 mb-6">
            {t('assess.savedBody')}
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={() => navigate(`/school/app/classrooms/${student.classroom_id}`)}
              className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800"
            >
              {t('assess.backToClassroom')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
