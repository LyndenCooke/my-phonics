import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Copy, KeyRound, Loader2, RefreshCw, Save, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb, rpcRegenerateJoinCode } from '../lib/schoolClient';

type MemberRow = { id: string; user_id: string; role: 'admin' | 'teacher'; invited_email: string | null };

export default function SchoolSettings() {
  const { t } = useTranslation('schoolApp');
  const { user } = useAuth();
  const { toast } = useToast();
  const { memberships, loading, refresh } = useSchoolMemberships();
  const membership = memberships[0];
  const school = membership?.school;
  const isAdmin = membership?.role === 'admin';

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [seatCount, setSeatCount] = useState('30');
  const [academicYear, setAcademicYear] = useState('');
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    if (school) {
      setName(school.name);
      setCountry(school.country ?? '');
      setSeatCount(String(school.seat_count));
      setAcademicYear(school.academic_year ?? '');
      setJoinCode(school.join_code ?? null);
    }
  }, [school]);

  useEffect(() => {
    if (!school) return;
    (async () => {
      const { data } = await schoolDb.memberships().select('id, user_id, role, invited_email').eq('school_id', school.id);
      setMembers((data ?? []) as MemberRow[]);
    })();
  }, [school]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    const { error } = await schoolDb.schools()
      .update({ name: name.trim(), country: country.trim() || null, seat_count: Math.max(parseInt(seatCount, 10) || 1, 1), academic_year: academicYear.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', school.id);
    setSaving(false);
    if (error) { toast({ title: t('couldNotSave'), description: (error as { message?: string }).message, variant: 'destructive' }); return; }
    await refresh();
    toast({ title: t('settings.saved') });
  };

  const copyCode = () => {
    if (!joinCode) return;
    navigator.clipboard?.writeText(joinCode);
    toast({ title: t('settings.codeCopied') });
  };

  const regenerate = async () => {
    if (!school) return;
    setRegenerating(true);
    const { data, error } = await rpcRegenerateJoinCode(school.id);
    setRegenerating(false);
    if (error || !data?.ok || !data.join_code) {
      toast({ title: t('settings.regenFailed'), description: (error as { message?: string })?.message ?? data?.reason, variant: 'destructive' });
      return;
    }
    setJoinCode(data.join_code);
    await refresh();
    toast({ title: t('settings.regenDone'), description: t('settings.regenDoneBody') });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;

  const admins = members.filter((m) => m.role === 'admin').length;
  const teachers = members.filter((m) => m.role === 'teacher').length;

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">{t('settings.title')}</h1>
        <p className="text-slate-600">{t('settings.intro')}</p>
      </header>

      {/* Staff join code */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold flex items-center gap-2 mb-1"><KeyRound className="w-4 h-4 text-slate-500" /> {t('settings.joinCode')}</h2>
        <p className="text-sm text-slate-600 mb-3">
          <Trans t={t} i18nKey="settings.joinCodeBody" values={{ school: school?.name ?? '' }} components={{ path: <span className="font-mono" dir="ltr" /> }} />
        </p>
        <div className="flex items-center gap-2">
          <span dir="ltr" className="font-mono text-2xl font-extrabold tracking-[0.3em] bg-slate-100 rounded-lg px-4 py-2">{joinCode ?? '——————'}</span>
          <button onClick={copyCode} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50"><Copy className="w-4 h-4" /> {t('settings.copy')}</button>
          {isAdmin && (
            <button onClick={regenerate} disabled={regenerating} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 disabled:opacity-60">
              {regenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} {t('settings.regenerate')}
            </button>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-2">{t('settings.invitesSoon')}</p>
      </section>

      {/* Members */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-slate-500" /> {t('settings.staff')}</h2>
        <p className="text-sm text-slate-600">{t('counts.admin', { count: admins })} · {t('counts.teacher', { count: teachers })}</p>
        <ul className="mt-3 divide-y divide-slate-100">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">{m.user_id === user?.id ? t('settings.you') : (m.invited_email ?? t('settings.staffMember'))}</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-xs font-semibold uppercase">{t(`settings.roles.${m.role}`)}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* School details */}
      <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <h2 className="font-bold">{t('settings.details')}</h2>
        <Field label={t('settings.schoolName')}>
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
        </Field>
        <div className="grid sm:grid-cols-3 gap-4">
          <Field label={t('settings.country')}>
            <input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!isAdmin}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
          </Field>
          <Field label={t('settings.places')}>
            <input type="number" min={1} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} disabled={!isAdmin}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
          </Field>
          <Field label={t('settings.academicYear')}>
            <input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025–26" disabled={!isAdmin}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
          </Field>
        </div>
        {isAdmin && (
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t('settings.save')}
          </button>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{t('settings.yourAccount')}</div>
        <div className="text-sm text-slate-700">{(user?.user_metadata?.full_name as string | undefined) || t('settings.administrator')}</div>
        <div className="text-xs text-slate-500 mt-0.5">{t('settings.role', { role: membership?.role ? t(`settings.roles.${membership.role}`) : '' })}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
