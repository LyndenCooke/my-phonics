/**
 * DownloadHistory — recent PDF downloads + purchase receipts.
 *
 * Two sections:
 *  1. Recent Downloads — pulled from `download_log`, lets the parent
 *     re-grab a PDF without finding the original file on their device.
 *  2. Purchases — Stripe receipts. Read-only; refund flow goes through
 *     Help & Support.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchases, useDownloadLog } from '@/hooks/useBooks';
import { useNotifications } from '@/hooks/useNotifications';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, ShoppingBag, Receipt, Calendar, CheckCircle2,
  Download, FileText, Loader2,
} from 'lucide-react';
import { useState } from 'react';
import { LEVELS } from '@/lib/types';

function formatGbp(pence: number | null | undefined, freeLabel: string): string {
  if (pence == null) return '—';
  if (pence === 0) return freeLabel;
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(i18n.language, {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function DownloadHistory() {
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { add: addNotification } = useNotifications();
  const { data: purchaseData, isLoading: purchasesLoading } = usePurchases();
  const { data: downloads, isLoading: downloadsLoading } = useDownloadLog();
  const [busyBookId, setBusyBookId] = useState<string | null>(null);

  const purchases = (purchaseData?.purchases ?? []) as Array<{
    id: string;
    created_at?: string;
    amount_pence?: number;
    status?: string;
    products?: { name?: string; description?: string } | null;
  }>;

  const reDownload = async (bookId: string, title: string) => {
    setBusyBookId(bookId);
    const tid = toast.loading(t('downloads.preparing', { title }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ book_id: bookId, format: 'a5' }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || data?.error || t('downloads.failed'));

      const pdfRes = await fetch(data.url);
      if (!pdfRes.ok) throw new Error(t('downloads.unavailable'));
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `${title}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);

      // Belt-and-braces client-side log (the edge function tries too, but
      // we kept seeing it sit at zero rows — see comment in Index.tsx).
      if (user && !bookId.startsWith('local-')) {
        const { error: logErr } = await supabase
          .from('download_log')
          .insert({ user_id: user.id, book_id: bookId });
        if (logErr) console.warn('download_log insert failed (client):', logErr);
      }

      toast.success(t('downloads.downloaded', { title }), { id: tid });
      // English text is the stored fallback; the keys let Profile show the
      // notification in whatever language the parent is using later.
      addNotification({
        icon: 'download',
        title: `${title} downloaded`,
        body: 'Tap to re-download from your history',
        ctaLabel: 'View',
        ctaHref: '/profile/downloads',
        titleKey: 'downloads.downloaded',
        bodyKey: 'downloads.notificationBody',
        ctaKey: 'downloads.view',
        params: { title },
      });
      queryClient.invalidateQueries({ queryKey: ['download_log'] });
    } catch (err) {
      toast.error((err as Error).message || t('downloads.failed'), { id: tid });
    } finally {
      setBusyBookId(null);
    }
  };

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
          <h1 className="font-display text-xl font-extrabold text-foreground">{t('links.downloads')}</h1>
        </div>

        {!user ? (
          <div className="bg-card rounded-3xl border border-border p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t('downloads.signInPrompt')}</p>
          </div>
        ) : (
          <>
            {/* Recent downloads */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {t('downloads.recent')}
              </h2>
              {downloadsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : !downloads || downloads.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t('downloads.emptyTitle')}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('downloads.emptyBody')}</p>
                  <button
                    onClick={() => navigate('/library')}
                    className="mt-3 text-xs font-bold text-primary-ink hover:underline"
                  >
                    {t('downloads.goToLibrary')} <span className="inline-block rtl:-scale-x-100">→</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {downloads.map((d: any) => {
                    const title = d.books?.title ?? t('downloads.bookFallback');
                    const level = d.books?.level ?? 1;
                    const levelInfo = LEVELS.find(l => l.level === level);
                    const isBusy = busyBookId === d.book_id;
                    return (
                      <article key={d.book_id} className="bg-card rounded-2xl border border-border p-3 shadow-card flex items-center gap-3">
                        <div className={`${levelBgs[level]} w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0`}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate" dir="ltr" lang="en">{title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {t('downloads.level', { level })}
                            {levelInfo ? <> · <span dir="ltr" lang="en">{levelInfo.name}</span></> : null}
                            {' · '}{formatDate(d.downloaded_at)}
                          </p>
                        </div>
                        <button
                          onClick={() => reDownload(d.book_id, title)}
                          disabled={isBusy}
                          aria-label={t('downloads.reDownload', { title })}
                          className="shrink-0 w-9 h-9 rounded-full bg-tint-pink text-primary-ink flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isBusy
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Download className="w-4 h-4" />}
                        </button>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Purchases */}
            <section>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {t('downloads.purchases')}
              </h2>
              {purchasesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : purchases.length === 0 ? (
                <div className="bg-card rounded-2xl border border-border p-5 text-center shadow-card">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                    <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">{t('downloads.noPurchases')}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{t('downloads.noPurchasesBody')}</p>
                  <Link
                    to="/support"
                    className="inline-block mt-3 px-4 py-2 rounded-xl gradient-primary text-primary-foreground font-bold text-xs shadow-button"
                  >
                    {t('links.support')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {purchases.map((p) => {
                    const completed = (p.status ?? 'completed').toLowerCase() === 'completed';
                    return (
                      <article key={p.id} className="bg-card rounded-2xl border border-border p-4 shadow-card">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-tint-pink flex items-center justify-center shrink-0">
                            <Receipt className="w-5 h-5 text-primary-ink" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-bold text-foreground truncate">
                                {p.products?.name ?? t('downloads.purchaseFallback')}
                              </p>
                              <span className="text-sm font-extrabold text-foreground tabular-nums shrink-0">
                                {formatGbp(p.amount_pence, t('downloads.free'))}
                              </span>
                            </div>
                            {p.products?.description && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                                {p.products.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(p.created_at)}
                              </span>
                              {completed && (
                                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3 h-3" /> {t('downloads.completed')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}

                  <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
                    {t('downloads.receiptHint')}
                  </p>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
