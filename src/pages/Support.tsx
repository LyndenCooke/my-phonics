/**
 * /support — "Support MyPhonicsBooks". Replaces /pricing (launch 2026-09-05).
 *
 * The whole library and every game are free to use without an account;
 * a free account unlocks PDF downloads. This page is the one place a parent
 * can choose to pay: a pay-what-you-like thank-you, nothing gated behind it.
 * (Create-A-Book keeps its own £4.99 / £10 World of Books pricing.)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchases } from '@/hooks/useBooks';
import { Heart, Loader2, Check, BookOpen, Gamepad2, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation, Trans } from 'react-i18next';
import { SUPPORT_ERROR_KEYS, SUPPORT_NOTE_KEYS } from '@/components/supportText';
import {
  SUPPORT_AMOUNTS,
  formatSupportAmount,
  parseSupportAmount,
  startSupportCheckout,
} from '@/lib/support';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

const FREE_ITEMS = [
  { icon: BookOpen, key: 'books' },
  { icon: Gamepad2, key: 'games' },
  { icon: Download, key: 'pdfs' },
  { icon: Sparkles, key: 'check' },
] as const;


export default function Support() {
  const { t } = useTranslation('support');
  const { user } = useAuth();
  const { data: purchases } = usePurchases();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number>(500);
  const [custom, setCustom] = useState('');
  const [busy, setBusy] = useState(false);

  // A support payment has no product row — that's how we tell it apart
  // from a Create-A-Book or membership purchase in the same table.
  const hasSupported = (purchases?.purchases ?? []).some(
    (p: { product_id: string | null; amount_paid: number | null }) => !p.product_id && (p.amount_paid ?? 0) > 0,
  );

  const customPence = custom.trim() ? parseSupportAmount(custom) : null;
  const amount = custom.trim() ? customPence : selected;

  const go = async () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent('/support')}`);
      return;
    }
    if (!amount) {
      toast.error(t('errors.amountRange'));
      return;
    }
    setBusy(true);
    try {
      await startSupportCheckout(amount);
    } catch (err) {
      const msg = (err as Error).message;
      toast.error(SUPPORT_ERROR_KEYS[msg] ? t(SUPPORT_ERROR_KEYS[msg]) : msg);
      setBusy(false);
    }
  };

  return (
    <Layout>
      <div className="px-4 lg:px-8 pt-5 pb-10 max-w-lg lg:max-w-4xl mx-auto">
        <div className="text-center mb-8 px-2">
          <span
            className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold rotate-1 text-primary-ink"
            style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
          >
            {t('page.sticker')}
          </span>
          <h1 className="font-display text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight leading-tight mt-4">
            {t('page.heading')}
          </h1>
          <p className="text-sm lg:text-base text-muted-foreground mt-2 leading-relaxed">
            {t('page.intro')}
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start space-y-5 lg:space-y-0">
          {/* What you get — all of it, free */}
          <div className="rounded-[2rem] bg-white p-6" style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}>
            <p className="text-[11px] uppercase tracking-wide font-bold text-muted-foreground mb-3">{t('page.alwaysFree')}</p>
            <ul className="space-y-3">
              {FREE_ITEMS.map(({ icon: Icon, key }) => (
                <li key={key} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="w-7 h-7 rounded-lg bg-tint-pink flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </span>
                  <span className="leading-snug">{t(`page.free.${key}`)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-5 leading-relaxed">
              {t('page.downloadsNote')}
            </p>
            {!user && (
              <button
                onClick={() => navigate(`/auth?redirect=${encodeURIComponent('/library')}`)}
                className="mt-4 w-full h-11 rounded-2xl font-display font-extrabold text-sm text-primary-ink bg-tint-pink hover:bg-tint-pink/70 transition-colors"
              >
                {t('page.createAccount')}
              </button>
            )}
          </div>

          {/* Support card */}
          <div className="rounded-[2rem] bg-white p-6" style={{ boxShadow: STICKER, border: '2px solid #E84B8A' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-tint-pink flex items-center justify-center">
                <Heart className="w-5 h-5 text-primary fill-current" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-lg text-foreground leading-tight">{t('page.cardTitle')}</h2>
                <p className="text-xs text-muted-foreground">{t('page.cardSubtitle')}</p>
              </div>
            </div>

            {hasSupported && (
              <div className="mb-4 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2 text-sm text-emerald-800 font-bold">
                <Check className="w-4 h-4 shrink-0" /> {t('page.alreadySupported')}
              </div>
            )}

            <div className="grid grid-cols-4 gap-2">
              {SUPPORT_AMOUNTS.map((a) => {
                const active = !custom.trim() && selected === a.pence;
                return (
                  <button
                    key={a.pence}
                    type="button"
                    onClick={() => { setSelected(a.pence); setCustom(''); }}
                    className={`rounded-2xl border-2 py-3 text-center transition-all active:scale-[0.96] ${
                      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
                    }`}
                    aria-pressed={active}
                  >
                    <span className="block font-display font-extrabold text-base text-foreground">{a.label}</span>
                    <span className="block text-[10px] text-muted-foreground mt-0.5">
                      {SUPPORT_NOTE_KEYS[a.pence] ? t(`amounts.${SUPPORT_NOTE_KEYS[a.pence]}`, { defaultValue: a.note }) : a.note}
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="block mt-3">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{t('page.otherAmount')}</span>
              <div dir="ltr" className="mt-1 flex items-center rounded-2xl border-2 border-border bg-card px-3 h-11 focus-within:border-primary">
                <span className="font-display font-extrabold text-foreground mr-1">£</span>
                <input
                  inputMode="decimal"
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  placeholder="7.50"
                  className="flex-1 bg-transparent outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground/60"
                  aria-label={t('page.customAria')}
                />
              </div>
              {custom.trim() && !customPence && (
                <span className="block text-[11px] text-destructive mt-1">{t('errors.amountRangeShort')}</span>
              )}
            </label>

            <button
              onClick={go}
              disabled={busy || (!!custom.trim() && !customPence)}
              className="mt-4 w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862, 0 12px 24px -10px #E84B8A80' }}
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-4 h-4 fill-current" />}
              {user
                ? t('page.supportWith', { amount: amount ? formatSupportAmount(amount) : '…' })
                : t('page.signInToSupport')}
            </button>
            <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
              {t('page.stripeNote')}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          <Trans
            t={t}
            i18nKey="page.createBookNote"
            components={{
              link: <button onClick={() => navigate('/create-book')} className="font-bold text-primary-ink hover:underline" />,
            }}
          />
        </p>
      </div>
    </Layout>
  );
}
