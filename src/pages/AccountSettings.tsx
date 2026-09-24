/**
 * AccountSettings — edit the parent's profile + their child's details.
 *
 * Backed by the existing `profiles` and `children` tables. Email is
 * read-only: changing it goes through Supabase Auth's flow which needs
 * verification, deferred until we have a proper email-change UI.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useChildren } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Mail, Lock, CreditCard, ExternalLink, Languages } from 'lucide-react';
import PasswordSetup from '@/components/PasswordSetup';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useQuery } from '@tanstack/react-query';

export default function AccountSettings() {
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: children } = useChildren();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const child = children?.[0] as { id?: string; name?: string; date_of_birth?: string } | undefined;

  const [fullName, setFullName] = useState('');
  const [childName, setChildName] = useState('');
  const [childDob, setChildDob] = useState('');
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  // Show the Manage Subscription button only for users who have a Stripe
  // customer (i.e. have ever bought or started a trial). Lifetime-only
  // buyers still get the button because they may want to update their
  // payment method or pull invoices.
  const { data: hasStripeCustomer } = useQuery({
    queryKey: ['has-stripe-customer', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from('purchases')
        .select('stripe_customer_id')
        .eq('user_id', user!.id)
        .not('stripe_customer_id', 'is', null)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  // Hydrate once data lands. We track changed-vs-loaded with a separate
  // ref-style guard via the loaded values themselves — simpler than a
  // Boolean flag.
  useEffect(() => {
    if (profile?.full_name !== undefined) setFullName(profile.full_name ?? '');
  }, [profile?.full_name]);
  useEffect(() => {
    if (child?.name !== undefined) setChildName(child.name ?? '');
    if (child?.date_of_birth !== undefined) setChildDob(child.date_of_birth ?? '');
  }, [child?.name, child?.date_of_birth]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Profile name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Child details
      if (child?.id) {
        const { error: childError } = await supabase
          .from('children')
          .update({
            name: childName.trim(),
            date_of_birth: childDob || null,
          })
          .eq('id', child.id);
        if (childError) throw childError;
      }

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['children'] });
      toast({ title: t('account.savedToast'), description: t('account.savedToastBody') });
    } catch (err) {
      toast({
        title: t('account.saveFailed'),
        description: (err as Error).message ?? t('account.tryAgain'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {},
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url as string;
        return;
      }
      throw new Error(data?.error || t('account.portalFailed'));
    } catch (err) {
      toast({
        title: t('account.portalFailed'),
        description: (err as Error).message ?? t('account.tryAgain'),
        variant: 'destructive',
      });
      setOpeningPortal(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: t('account.resetFailed'), description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: t('account.resetSent'),
      description: t('account.resetSentBody', { email: user.email }),
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-6 pb-8 max-w-lg mx-auto text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('account.signInPrompt')}</p>
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button"
          >
            {t('common:actions.signInTitle')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label={t('backToProfile')}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground rtl:-scale-x-100" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">{t('links.accountSettings')}</h1>
        </div>

        {/* Language — the grown-up interface only; books stay English. */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Languages className="w-3.5 h-3.5" aria-hidden /> {t('account.language')}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground flex-1 min-w-[12rem]">{t('account.languageHint')}</p>
            <LanguageSwitcher variant="full" align="end" />
          </div>
        </section>

        {/* Your details */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('account.yourDetails')}</p>

          <Field label={t('account.yourName')}>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t('account.parentNamePlaceholder')}
              className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </Field>

          <Field label={t('account.email')}>
            <div className="w-full px-4 py-3 rounded-xl bg-muted text-sm text-foreground flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="truncate" dir="ltr">{user.email}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {t('account.emailHint')}
            </p>
          </Field>

          {/* Inline set/change password — works for users who signed in
              via magic link and never set one. The "Send reset email"
              button below stays as the fallback in case they want a
              link to set it from another device. */}
          <PasswordSetup
            title={t('account.passwordTitle')}
            subtitle={t('account.passwordSubtitle')}
            required
          />

          <button
            onClick={handlePasswordReset}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Lock className="w-4 h-4" /> {t('account.sendReset')}
          </button>
        </section>

        {/* Billing — only rendered for users who have ever bought or
            trialed. Stripe Customer Portal owns the cancel/update UX so
            we don't have to. */}
        {hasStripeCustomer && (
          <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('account.billing')}</p>
            <p className="text-sm text-muted-foreground">
              {t('account.billingBody')}
            </p>
            <button
              onClick={handleManageSubscription}
              disabled={openingPortal}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-bold text-foreground hover:bg-muted/50 transition-colors disabled:opacity-60"
            >
              <CreditCard className="w-4 h-4" />
              {openingPortal ? t('account.opening') : t('account.manageSubscription')}
              {!openingPortal && <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </section>
        )}

        {/* Child details */}
        <section className="bg-card rounded-3xl border border-border p-5 shadow-card space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t('account.childDetails')}</p>

          {child?.id ? (
            <>
              <Field label={t('account.childName')}>
                <input
                  type="text"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  placeholder={t('account.childName')}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
              <Field label={t('account.dob')}>
                <input
                  type="date"
                  value={childDob}
                  onChange={(e) => setChildDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </Field>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('account.noChild')}
            </p>
          )}
        </section>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {saving ? t('common:actions.saving') : t('account.saveChanges')}
        </button>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}
