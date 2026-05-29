import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSchoolMemberships } from '../hooks/useSchool';
import { schoolDb } from '../lib/schoolClient';

export default function SchoolSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { memberships, loading, refresh } = useSchoolMemberships();
  const membership = memberships[0];
  const school = membership?.school;
  const isAdmin = membership?.role === 'admin';

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [seatCount, setSeatCount] = useState('30');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (school) {
      setName(school.name);
      setCountry(school.country ?? '');
      setSeatCount(String(school.seat_count));
    }
  }, [school]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!school) return;
    setSaving(true);
    const { error } = await schoolDb
      .schools()
      .update({ name: name.trim(), country: country.trim() || null, seat_count: Math.max(parseInt(seatCount, 10) || 1, 1), updated_at: new Date().toISOString() })
      .eq('id', school.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Could not save', description: (error as { message?: string }).message, variant: 'destructive' });
      return;
    }
    await refresh();
    toast({ title: 'Settings saved' });
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="space-y-6 max-w-xl">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Settings</h1>
        <p className="text-slate-600">Your school details and account.</p>
      </header>

      <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <Field label="School name">
          <input value={name} onChange={(e) => setName(e.target.value)} disabled={!isAdmin}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Country">
            <input value={country} onChange={(e) => setCountry(e.target.value)} disabled={!isAdmin}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
          </Field>
          <Field label="Pupil places">
            <input type="number" min={1} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} disabled={!isAdmin}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none disabled:bg-slate-50" />
          </Field>
        </div>
        {isAdmin && (
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save settings
          </button>
        )}
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Your account</div>
        <div className="text-sm text-slate-700">{user?.email}</div>
        <div className="text-xs text-slate-500 mt-0.5">Role: {membership?.role}</div>
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
