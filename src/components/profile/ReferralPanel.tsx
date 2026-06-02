/**
 * ReferralPanel — the parent's two-tier affiliate dashboard.
 *
 *   - Shows their personal share link with a Copy button
 *   - Pre-formatted WhatsApp + Facebook share messages with one-tap copy
 *   - Live earnings: Tier 1 (direct referrals) + Tier 2 (network earnings)
 *   - Recruits count (affiliates they've brought in)
 *
 * The referrals row is auto-created by a database trigger on signup, so by
 * the time a user opens this panel they already have a code.
 *
 * Commission:
 *   Tier 1: 50% of gross paid by the referred buyer (recurring for monthly)
 *   Tier 2: 10% of gross from anyone referred by your recruits
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { buildShareUrl, buildWhatsappMessage, buildFacebookMessage } from '@/lib/referral';
import { Copy, Check, Share2, Users, MousePointer2, PoundSterling, MessageCircle, ChevronDown, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralRow {
  code: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earnings_pence: number;
  total_tier2_earnings_pence: number;
  total_recruits: number;
}

export function ReferralPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [row, setRow] = useState<ReferralRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'link' | 'wa' | 'fb' | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('referrals')
        .select('code, total_clicks, total_signups, total_conversions, total_earnings_pence, total_tier2_earnings_pence, total_recruits')
        .eq('user_id', user.id)
        .single();
      if (!cancelled) {
        setRow(data as ReferralRow | null);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const copy = async (text: string, kind: 'link' | 'wa' | 'fb') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast({ title: 'Copied!', description: kind === 'link' ? 'Your share link is on the clipboard.' : 'Paste it into WhatsApp, Messages, or anywhere you like.' });
      setTimeout(() => setCopied(null), 2000);
    } catch {
      toast({ title: 'Copy failed', description: 'Long-press the text to select and copy manually.', variant: 'destructive' });
    }
  };

  if (!user) return null;
  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
        <div className="h-5 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="h-12 w-full bg-muted rounded animate-pulse" />
      </div>
    );
  }
  if (!row) {
    return (
      <div className="bg-card rounded-2xl border border-border p-5 mb-6 shadow-card">
        <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
          <Share2 className="w-4 h-4 text-primary" /> Refer & Earn
        </h3>
        <p className="text-xs text-muted-foreground">
          Your referral link will appear here shortly. Refresh the page in a moment.
        </p>
      </div>
    );
  }

  const shareUrl = buildShareUrl(row.code);
  const waMsg = buildWhatsappMessage(row.code);
  const fbMsg = buildFacebookMessage(row.code);
  const tier1Gbp = (row.total_earnings_pence / 100).toFixed(2);
  const tier2Gbp = (row.total_tier2_earnings_pence / 100).toFixed(2);
  const totalGbp = ((row.total_earnings_pence + row.total_tier2_earnings_pence) / 100).toFixed(2);

  return (
    <div className="bg-card rounded-2xl border border-border shadow-card mb-6 overflow-hidden">
      {/* Gradient header — also acts as the expand/collapse toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 text-white px-5 py-4 text-left hover:brightness-105 transition-all"
        aria-expanded={expanded}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <Share2 className="w-4 h-4" />
              <h3 className="font-bold text-base">Refer & Earn</h3>
              {(row.total_earnings_pence + row.total_tier2_earnings_pence) > 0 && (
                <span className="text-[11px] font-extrabold bg-white text-fuchsia-700 px-2 py-0.5 rounded-full tabular-nums">
                  £{totalGbp}
                </span>
              )}
            </div>
            <p className="text-xs text-white/85 leading-snug">
              {expanded
                ? 'Earn 50% on direct referrals + 10% from your network.'
                : `50% direct + 10% network · ${row.total_clicks} clicks · ${row.total_conversions} sales`}
            </p>
          </div>
          <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {!expanded && (
        <div className="px-5 py-3">
          <button
            onClick={() => setExpanded(true)}
            className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-bold shadow-button active:scale-[0.97] transition-transform"
          >
            Get my share link
          </button>
        </div>
      )}

      {expanded && (
      <div className="px-5 py-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon={MousePointer2} label="Clicks" value={String(row.total_clicks)} tone="blue" />
          <Stat icon={Users} label="Sales" value={String(row.total_conversions)} tone="green" />
          <Stat icon={PoundSterling} label="Direct earnings" value={`£${tier1Gbp}`} tone="violet" />
          <Stat icon={Network} label="Network earnings" value={`£${tier2Gbp}`} tone="amber" />
          {row.total_recruits > 0 && (
            <Stat icon={Users} label="Your affiliates" value={String(row.total_recruits)} tone="blue" wide />
          )}
        </div>

        {/* Total earnings callout */}
        {(row.total_earnings_pence + row.total_tier2_earnings_pence) > 0 && (
          <div className="rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200 p-3 text-center">
            <div className="text-xs font-semibold text-violet-600 mb-0.5">Total earned</div>
            <div className="font-display text-2xl font-extrabold text-violet-700">£{totalGbp}</div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
          <p className="text-xs font-bold text-foreground">How it works</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Tier 1:</strong> Earn 50% commission on every subscriber you refer, recurring monthly or one-time on lifetime purchases.
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <strong>Tier 2:</strong> When someone you referred also shares their link and brings in a subscriber, you earn 10% of that sale too.
          </p>
        </div>

        {/* Share link */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide">Your share link</label>
          <div className="mt-1.5 flex gap-2">
            <input
              readOnly
              value={shareUrl}
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className="flex-1 min-w-0 px-3 py-2.5 rounded-xl bg-muted text-foreground text-sm font-mono"
            />
            <button
              onClick={() => copy(shareUrl, 'link')}
              className="px-4 rounded-xl gradient-primary text-primary-foreground text-sm font-bold shadow-button active:scale-[0.97] transition-transform flex items-center gap-1.5"
            >
              {copied === 'link' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'link' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* WhatsApp */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <MessageCircle className="w-3.5 h-3.5 text-green-600" /> WhatsApp message
          </label>
          <div className="mt-1.5 bg-muted rounded-xl p-3 text-xs text-foreground whitespace-pre-line leading-relaxed">
            {waMsg}
          </div>
          <button
            onClick={() => copy(waMsg, 'wa')}
            className="mt-2 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold shadow-button active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
          >
            {copied === 'wa' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'wa' ? 'Copied — paste into WhatsApp' : 'Copy WhatsApp message'}
          </button>
        </div>

        {/* Facebook */}
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Share2 className="w-3.5 h-3.5 text-[#1877F2]" /> Facebook post
          </label>
          <div className="mt-1.5 bg-muted rounded-xl p-3 text-xs text-foreground whitespace-pre-line leading-relaxed">
            {fbMsg}
          </div>
          <button
            onClick={() => copy(fbMsg, 'fb')}
            className="mt-2 w-full py-2.5 rounded-xl bg-[#1877F2] hover:bg-[#1666D8] text-white text-sm font-bold shadow-button active:scale-[0.97] transition-transform flex items-center justify-center gap-2"
          >
            {copied === 'fb' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied === 'fb' ? 'Copied — paste into Facebook' : 'Copy Facebook post'}
          </button>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Earnings are credited within 24 hours of a successful payment. Monthly commissions recur for as long as the subscriber stays active. Payouts go to your bank monthly once you reach £20.
          Self-referrals don't count.
        </p>
      </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, tone, wide,
}: {
  icon: typeof Users; label: string; value: string;
  tone: 'blue' | 'green' | 'violet' | 'amber'; wide?: boolean;
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
  }[tone];
  return (
    <div className={`rounded-xl border p-3 ${toneClasses} ${wide ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 text-xs font-semibold opacity-80">
        <Icon className="w-3.5 h-3.5" /> {label}
      </div>
      <div className="font-display text-xl font-extrabold mt-0.5">{value}</div>
    </div>
  );
}
