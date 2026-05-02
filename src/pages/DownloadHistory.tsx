/**
 * DownloadHistory — past purchases / unlocks for this account.
 *
 * Pulls from the existing `purchases` table via usePurchases(). Read-only;
 * if a parent needs a refund or replacement they go through Help & Support.
 */
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { usePurchases } from '@/hooks/useBooks';
import { ArrowLeft, ShoppingBag, Receipt, Calendar, CheckCircle2 } from 'lucide-react';

function formatGbp(pence?: number | null): string {
  if (pence == null) return '—';
  if (pence === 0) return 'Free';
  return `£${(pence / 100).toFixed(2)}`;
}

function formatDate(iso?: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

export default function DownloadHistory() {
  const { user } = useAuth();
  const { data, isLoading } = usePurchases();
  const purchases = (data?.purchases ?? []) as Array<{
    id: string;
    created_at?: string;
    amount_pence?: number;
    status?: string;
    products?: { name?: string; description?: string } | null;
  }>;

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Download History</h1>
        </div>

        {!user ? (
          <div className="bg-card rounded-3xl border border-border p-8 text-center shadow-card">
            <p className="text-sm text-muted-foreground">Sign in to see your purchase history.</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="bg-card rounded-3xl border border-border p-8 text-center shadow-card">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No purchases yet</p>
            <p className="text-xs text-muted-foreground mt-1">Anything you buy will appear here.</p>
            <Link
              to="/shop"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button"
            >
              Browse plans
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
                          {p.products?.name ?? 'Purchase'}
                        </p>
                        <span className="text-sm font-extrabold text-foreground tabular-nums shrink-0">
                          {formatGbp(p.amount_pence)}
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
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}

            <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
              Need a receipt or refund? Contact support from the Help page.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
