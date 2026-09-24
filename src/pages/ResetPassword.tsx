import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { authErrorMessage } from '@/lib/authErrors';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('auth');

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast({ title: t('toast.error'), description: authErrorMessage(error), variant: 'destructive' });
    } else {
      toast({ title: t('toast.passwordUpdated'), description: t('toast.passwordUpdatedBody') });
      navigate('/library');
    }
    setSubmitting(false);
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 gap-4 relative">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher variant="compact" />
        </div>
        <p className="text-muted-foreground text-sm">{t('reset.invalidLink')}</p>
        <Link to="/" className="text-sm font-bold text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('page.backToHome')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <Link
        to="/"
        className="absolute top-4 start-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
        aria-label={t('page.backToHome')}
      >
        <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('page.back')}
      </Link>
      <div className="absolute top-4 end-4">
        <LanguageSwitcher variant="compact" />
      </div>
      <div className="w-full max-w-sm">
        <h2 className="text-2xl font-extrabold text-foreground mb-2 text-center">{t('reset.title')}</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">{t('reset.subtitle')}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              placeholder={t('reset.newPassword')}
              aria-label={t('reset.newPassword')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full ps-10 pe-4 py-3 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-60"
          >
            {submitting ? t('reset.updating') : t('reset.update')}
          </button>
        </form>
      </div>
    </div>
  );
}
