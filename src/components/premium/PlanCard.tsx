/**
 * PlanCard — Free vs Premium side by side, the live founding tally, and the
 * one action that fits this visitor: claim a founding spot (guest), see your
 * status (premium), or buy Premium for life (free plan, once the 500 are gone).
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Crown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import FoundingTally from '@/components/premium/FoundingTally';
import { PREMIUM_PRICE_LABEL, startPremiumCheckout, useDownloadPlan, useFoundingSpots } from '@/lib/premium';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

export default function PlanCard({ className = '' }: { className?: string }) {
  const { t } = useTranslation('premium');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: spots } = useFoundingSpots();
  const { data: plan } = useDownloadPlan();
  const [busy, setBusy] = useState(false);

  const spotsLeft = !!spots && spots.remaining > 0;
  const isPremium = plan?.plan === 'premium';

  const upgrade = async () => {
    setBusy(true);
    try {
      await startPremiumCheckout();
    } catch {
      toast.error(t('errors.checkoutFailed'));
      setBusy(false);
    }
  };

  const status = !user || !plan
    ? null
    : plan.premium_reason === 'founding' && plan.founding_number
      ? t('status.founder', { number: plan.founding_number })
      : isPremium
        ? t('status.premium')
        : t('status.free', {
            books: plan.used.books,
            bookLimit: plan.limits.books,
            worksheets: plan.used.worksheets,
            worksheetLimit: plan.limits.worksheets,
          });

  return (
    <div className={`rounded-[2rem] bg-white p-6 ${className}`} style={{ boxShadow: STICKER, border: '2px solid #E84B8A' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-2xl bg-tint-pink flex items-center justify-center shrink-0">
          <Crown className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-extrabold text-lg text-foreground leading-tight">
            {spotsLeft ? t('offer.title') : t('plans.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {spotsLeft ? t('offer.badge') : t('plans.subtitle', { price: PREMIUM_PRICE_LABEL })}
          </p>
        </div>
      </div>

      {status && (
        <div className={`mb-4 rounded-2xl p-3 flex items-center gap-2 text-sm font-bold ${
          isPremium ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-muted text-foreground'
        }`}>
          {isPremium && <Check className="w-4 h-4 shrink-0" />} {status}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground">{t('plans.free.name')}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            <li>{t('plans.free.read')}</li>
            <li>{t('plans.free.books')}</li>
            <li>{t('plans.free.worksheets')}</li>
          </ul>
        </div>
        <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-4">
          <p className="text-[11px] uppercase tracking-wide font-bold text-primary-ink">{t('plans.premium.name')}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-foreground">
            <li>{t('plans.premium.books')}</li>
            <li>{t('plans.premium.worksheets')}</li>
            <li>{t('plans.premium.forLife')}</li>
          </ul>
        </div>
      </div>

      {spotsLeft && (
        <>
          <p className="text-sm text-muted-foreground leading-relaxed mt-4">{t('offer.body')}</p>
          <FoundingTally className="mt-3" />
        </>
      )}

      {!user && (
        <button
          onClick={() => navigate(`/auth?mode=signup&redirect=${encodeURIComponent('/library')}`)}
          className="mt-4 w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px]"
          style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862' }}
        >
          {spotsLeft ? t('offer.cta') : t('signupGate.cta')}
        </button>
      )}
      {user && plan && !isPremium && (
        <>
          <button
            onClick={upgrade}
            disabled={busy}
            className="mt-4 w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px] disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862' }}
          >
            {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-4 h-4" />}
            {t('limit.upgrade', { price: PREMIUM_PRICE_LABEL })}
          </button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">{t('limit.upgradeNote')}</p>
        </>
      )}
      {spotsLeft && !isPremium && (
        <p className="text-[11px] text-muted-foreground text-center leading-relaxed mt-3">
          {t('offer.afterNote', { price: PREMIUM_PRICE_LABEL })}
        </p>
      )}
    </div>
  );
}
