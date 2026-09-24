import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export default function SchoolSignin() {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation('schoolPublic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await signIn(email.trim(), password);
      if (error) throw error;
      navigate('/school/app');
    } catch (err: any) {
      toast({ title: t('signin.failed'), description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">
          {t('signin.title')}
        </h1>
        <p className="text-slate-600">
          {t('signin.newSchool')}{' '}
          <Link to="/school/signup" className="text-pink-600 font-semibold hover:underline">{t('signin.signUpHere')}</Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">{t('signin.email')}</span>
          <input
            type="email"
            dir="ltr"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-slate-700 mb-1.5">{t('signin.password')}</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900 outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{t('signin.submit')} <ArrowRight className="w-4 h-4 rtl:-scale-x-100" /></>}
        </button>
      </form>
    </div>
  );
}
