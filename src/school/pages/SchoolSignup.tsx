import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { rpcCreateSchoolWithAdmin } from '../lib/schoolClient';

export default function SchoolSignup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [schoolName, setSchoolName] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [seatCount, setSeatCount] = useState('30');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      toast({ title: 'School name required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      if (!user) {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName, signup_source: 'school' },
            emailRedirectTo: `${window.location.origin}/school/app`,
          },
        });
        if (signUpError) throw signUpError;
        // Sign the user in immediately so we have a session for the RPC call.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      const { data, error } = await rpcCreateSchoolWithAdmin({
        p_name: schoolName.trim(),
        p_country: country.trim() || null,
        p_seat_count: Math.max(parseInt(seatCount, 10) || 30, 1),
      });
      if (error) throw error as Error;
      if (!data?.ok) {
        throw new Error(data && 'reason' in data ? data.reason : 'Could not create school');
      }

      toast({ title: 'Welcome aboard!', description: `${schoolName} is set up. Let's add your first classroom.` });
      navigate('/school/app');
    } catch (err: any) {
      toast({ title: 'Sign-up failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Free 30-day trial · no card
        </div>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">
          Sign your school up
        </h1>
        <p className="text-slate-600">
          Already have an account?{' '}
          <Link to="/school/signin" className="text-pink-600 font-semibold hover:underline">Sign in</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <SectionHeader>About your school</SectionHeader>
        <Field label="School name">
          <input
            type="text"
            required
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            placeholder="Greenfield Primary School"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Country">
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </Field>
          <Field label="Approx. number of students">
            <input
              type="number"
              min={1}
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
            />
          </Field>
        </div>

        {!user && (
          <>
            <SectionHeader>Your account</SectionHeader>
            <Field label="Your name">
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </Field>
            <Field label="Work email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@greenfieldprimary.school"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
              />
            </Field>
          </>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Create school <ArrowRight className="w-4 h-4" /></>}
        </button>

        <p className="text-xs text-slate-500 text-center">
          By signing up you agree to our <Link to="/terms" className="underline">Terms</Link> and <Link to="/privacy" className="underline">Privacy Policy</Link>.
        </p>
      </form>
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

function SectionHeader({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-2">{children}</h2>;
}
