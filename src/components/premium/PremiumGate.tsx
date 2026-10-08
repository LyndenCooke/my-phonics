/**
 * PremiumGate — one place that decides whether a download goes ahead.
 *
 *   const { guard } = useDownloadGate();
 *   if (await guard('worksheet', href)) save the file
 *
 *   guest            → the sign-up offer dialog (why an account, and the
 *                      founding-member offer while spots remain)
 *   over the plan    → the limit dialog (when the next one unlocks + Premium)
 *   otherwise        → true, and the download is logged against the week
 *
 * Also owns the once-a-week founding-offer pop-up for signed-out visitors.
 * Mounted once in App, inside the router.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Crown, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useTeacherSession } from '@/lib/teacherSession';
import i18n from '@/i18n';
import FoundingTally from '@/components/premium/FoundingTally';
import {
  PREMIUM_PRICE_LABEL,
  requestDownload,
  startPremiumCheckout,
  useFoundingSpots,
  type DownloadKind,
} from '@/lib/premium';

type GateContext = {
  /** Resolves true when the download may proceed. Shows the right dialog otherwise. */
  guard: (kind: DownloadKind, item: string) => Promise<boolean>;
};

const Ctx = createContext<GateContext | null>(null);

export function useDownloadGate(): GateContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useDownloadGate must be used inside <PremiumGateProvider>');
  return ctx;
}

type SignupState = { source: 'download' | 'visit' } | null;
type LimitState = { kind: DownloadKind; reason: 'limit' | 'premium_only'; nextAt: string | null } | null;

// ── Founding-offer pop-up for signed-out visitors ────────────────────────
const OFFER_SEEN_KEY = 'mpb_founding_offer_seen';
const OFFER_QUIET_KEY = 'mpb_founding_offer_quiet';
const OFFER_REPEAT_MS = 7 * 24 * 60 * 60 * 1000;
const OFFER_DELAY_MS = 5000;
// Never interrupt sign-in, checkout, the funnels' own flows, school/admin, or
// a child who just scanned a printed book's QR code (/b/…).
const OFFER_BLOCKED_PATHS = [
  '/auth', '/reset-password', '/admin', '/school', '/b/', '/teachers', '/privacy', '/terms',
  '/payment-success', '/assess', '/f/', '/free-book', '/links', '/prototype',
];

function offerSeenRecently(): boolean {
  try {
    if (sessionStorage.getItem(OFFER_QUIET_KEY)) return true;
    const at = Number(localStorage.getItem(OFFER_SEEN_KEY) || 0);
    return Date.now() - at < OFFER_REPEAT_MS;
  } catch {
    return true;
  }
}

function markOfferSeen() {
  try { localStorage.setItem(OFFER_SEEN_KEY, String(Date.now())); } catch { /* ignore */ }
}

function formatUnlock(iso: string | null): string {
  if (!iso) return '';
  return new Intl.DateTimeFormat(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(iso));
}

export function PremiumGateProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('premium');
  const { user, loading } = useAuth();
  const { session: teacherSession } = useTeacherSession();
  const { data: spots } = useFoundingSpots();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const [signup, setSignup] = useState<SignupState>(null);
  const [limit, setLimit] = useState<LimitState>(null);
  const [checkoutBusy, setCheckoutBusy] = useState(false);

  const guard = useCallback(async (kind: DownloadKind, item: string) => {
    if (!user) {
      markOfferSeen();
      setSignup({ source: 'download' });
      return false;
    }
    try {
      const decision = await requestDownload(kind, item);
      queryClient.invalidateQueries({ queryKey: ['download_plan'] });
      queryClient.invalidateQueries({ queryKey: ['founding_spots'] });
      if (decision.allowed) return true;
      if (decision.reason === 'sign_in') {
        setSignup({ source: 'download' });
        return false;
      }
      setLimit({ kind, reason: decision.reason, nextAt: decision.next_at ?? null });
      return false;
    } catch (err) {
      // The allowance check being unreachable must not break downloads.
      console.warn('request_download failed; allowing download:', err);
      return true;
    }
  }, [user, queryClient]);

  // A visitor who lands on a printed book's QR link is a child about to
  // read: stay quiet for the whole session.
  const landedOn = useRef(location.pathname);
  useEffect(() => {
    if (landedOn.current.startsWith('/b/')) {
      try { sessionStorage.setItem(OFFER_QUIET_KEY, '1'); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (loading || user || teacherSession) return;
    if (!spots || spots.remaining <= 0) return;
    if (OFFER_BLOCKED_PATHS.some((p) => location.pathname.startsWith(p))) return;
    if (offerSeenRecently()) return;
    const timer = setTimeout(() => {
      if (offerSeenRecently()) return;
      markOfferSeen();
      setSignup((current) => current ?? { source: 'visit' });
    }, OFFER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loading, user, teacherSession, spots, location.pathname]);

  const goToAuth = (mode: 'signup' | 'signin') => {
    const back = `${location.pathname}${location.search}`;
    setSignup(null);
    navigate(`/auth?mode=${mode}&redirect=${encodeURIComponent(back.startsWith('/landing') ? '/library' : back)}`);
  };

  const upgrade = async () => {
    setCheckoutBusy(true);
    try {
      await startPremiumCheckout();
    } catch {
      toast.error(t('errors.checkoutFailed'));
      setCheckoutBusy(false);
    }
  };

  const value = useMemo(() => ({ guard }), [guard]);
  const spotsLeft = !!spots && spots.remaining > 0;

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Sign-up offer: a guest tapped Download, or the weekly visit pop-up. */}
      <Dialog open={!!signup} onOpenChange={(o) => !o && setSignup(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-tint-pink flex items-center justify-center mb-1">
              {spotsLeft ? <Crown className="w-6 h-6 text-primary" /> : <Sparkles className="w-6 h-6 text-primary" />}
            </div>
            {spotsLeft && (
              <p className="text-[11px] font-extrabold uppercase tracking-wide text-primary-ink">{t('offer.badge')}</p>
            )}
            <DialogTitle className="font-display text-xl font-extrabold text-foreground">
              {spotsLeft ? t('offer.title') : t('signupGate.title')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {signup?.source === 'download' && spotsLeft && <>{t('signupGate.lead')} </>}
              {spotsLeft ? t('offer.body') : t('signupGate.bodySoldOut')}
            </DialogDescription>
          </DialogHeader>

          {spotsLeft && <FoundingTally className="pt-1" />}

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => goToAuth('signup')}
              className="w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px]"
              style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862' }}
            >
              {spotsLeft ? t('offer.cta') : t('signupGate.cta')}
            </button>
            <button
              type="button"
              onClick={() => goToAuth('signin')}
              className="text-xs font-bold text-primary-ink hover:underline py-1"
            >
              {t('offer.haveAccount')}
            </button>
            <button
              type="button"
              onClick={() => setSignup(null)}
              className="w-full py-2.5 rounded-2xl font-display font-extrabold text-sm text-foreground bg-muted hover:bg-muted/70 transition-colors"
            >
              {signup?.source === 'download' ? t('offer.keepReading') : t('offer.notNow')}
            </button>
          </div>
          {spotsLeft && (
            <p className="text-[11px] text-muted-foreground text-center leading-relaxed">{t('offer.afterNote', { price: PREMIUM_PRICE_LABEL })}</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Limit reached on the free plan. */}
      <Dialog open={!!limit} onOpenChange={(o) => !o && setLimit(null)}>
        <DialogContent className="max-w-sm mx-auto rounded-3xl">
          <DialogHeader>
            <div className="w-12 h-12 rounded-2xl bg-tint-pink flex items-center justify-center mb-1">
              <Crown className="w-6 h-6 text-primary" />
            </div>
            <DialogTitle className="font-display text-xl font-extrabold text-foreground">
              {limit?.reason === 'premium_only'
                ? t('limit.packTitle')
                : limit?.kind === 'book' ? t('limit.bookTitle') : t('limit.worksheetTitle')}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {limit?.reason === 'premium_only'
                ? t('limit.packBody')
                : limit?.kind === 'book'
                  ? t('limit.bookBody', { when: formatUnlock(limit?.nextAt ?? null) })
                  : t('limit.worksheetBody', { when: formatUnlock(limit?.nextAt ?? null) })}
              {limit?.kind === 'book' && <> {t('limit.readFree')}</>}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border-2 border-primary/30 bg-primary/5 p-3">
            <p className="text-sm font-extrabold text-foreground">{t('limit.premiumTitle')}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{t('limit.premiumBody')}</p>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={upgrade}
              disabled={checkoutBusy}
              className="w-full h-12 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[3px] disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862' }}
            >
              {checkoutBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Crown className="w-4 h-4" />}
              {t('limit.upgrade', { price: PREMIUM_PRICE_LABEL })}
            </button>
            <p className="text-[11px] text-muted-foreground text-center">{t('limit.upgradeNote')}</p>
            <button
              type="button"
              onClick={() => setLimit(null)}
              className="w-full py-2.5 rounded-2xl font-display font-extrabold text-sm text-foreground bg-muted hover:bg-muted/70 transition-colors"
            >
              {t('limit.close')}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}
