import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { authErrorMessage } from '@/lib/authErrors';

interface PasswordSetupProps {
  /** Override the title — defaults to "Create a password". */
  title?: string;
  /** Override the helper text shown under the title. */
  subtitle?: string;
  /** When true, hides the "Optional — you can skip this" footer. */
  required?: boolean;
}

/**
 * Inline form that calls supabase.auth.updateUser({ password }) so a
 * logged-in user (who currently has no password — e.g. signed in via
 * magic link) can set one without leaving the page.
 *
 * Used on /welcome right after the funnel auto-login, and on Account
 * Settings as the fallback entry point for anyone who skipped initially.
 */
export default function PasswordSetup({
  title,
  subtitle,
  required = false,
}: PasswordSetupProps) {
  const { t } = useTranslation('auth');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        {t('passwordSetup.done')}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError(t('passwordSetup.tooShort')); return; }
    if (password !== confirm) { setError(t('passwordSetup.mismatch')); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(authErrorMessage(err)); return; }
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-card border border-border rounded-xl p-4 text-start">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">{title ?? t('passwordSetup.title')}</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {subtitle ?? t('passwordSetup.subtitle')}
      </p>
      <input
        type="password"
        placeholder={t('passwordSetup.placeholder')}
        aria-label={t('passwordSetup.placeholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-2"
      />
      <input
        type="password"
        placeholder={t('passwordSetup.confirm')}
        aria-label={t('passwordSetup.confirm')}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-3"
      />
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('passwordSetup.submit')}
      </button>
      {!required && (
        <p className="text-xs text-muted-foreground mt-2 text-center">{t('passwordSetup.optional')}</p>
      )}
    </form>
  );
}
