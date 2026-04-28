/**
 * ReferralPanel — the parent's affiliate dashboard.
 *
 *   - Shows their personal share link with a Copy button
 *   - Pre-formatted WhatsApp + Facebook share messages with one-tap copy
 *   - Live earnings: clicks, signups, conversions, £ earned
 *
 * The referrals row is auto-created by a database trigger on signup, so by
 * the time a user opens this panel they already have a code. If the row is
 * still missing (migration not applied yet, or trigger failed), we fall
 * back to a friendly empty state instead of crashing.
 *
 * Commission: 50% of gross paid by the referred buyer, computed by the
 * stripe-webhook on checkout completion. We display total_earnings_pence
 * straight from the rollup column — no aggregation queries needed.
 */
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { buildShareUrl, buildWhatsappMessage, buildFacebookMessage } from '@/lib/referral';
import { Copy, Check, Share2, Users, MousePointer2, PoundSterling, MessageCircle, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReferralRow {
  code: string;
  total_clicks: number;
  total_signups: number;
  total_conversions: number;
  total_earnings_pence: number;
}

export function ReferralPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [row, setRow] = useState<ReferralRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'link' | 'wa' | 'fb' | null>(null);
  // Collapsed by default — parents see a small earnings teaser and click to
  // open the full panel. Reduces visual noise on the Profile page for the
  // 95% of visits that aren't about sharing.
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('referrals')
        .select('code, total_clicks, total_signups, total_conversions, total_earnings_pence')
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
  const earningsGbp = (row.total_earnings_pence / 100).toFixed(2);

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
              {row.total_earnings_pence > 0 && (
                <span className="text-[11px] font-extrabold bg-white text-fuchsia-700 px-2 py-0.5 rounded-full tabular-nums">
                  £{earningsGbp}
                </span>
              )}
            </div>
            <p className="text-xs text-white/85 leading-snug">
              {expanded
                ? 'Share MyPhonicsBooks and earn 50% on every Founders Club spot you bring in.'
                : `Earn 50% per Founders Club referral · ${row.total_clicks} clicks · ${row.total_conversions} sales`}
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
            Get my share link →
          </button>
        </div>
      )}

      {expanded && (
      <div className="px-5 py-4 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-2.5">
          <Stat icon={MousePointer2} label="Clicks" value={String(row.total_clicks)} tone="blue" />
          <Stat icon={Users} label="Conversions" value={String(row.total_conversions)} tone="green" />
          <Stat icon={PoundSterling} label="Earned" value={`£${earningsGbp}`} tone="violet" wide />
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
          Earnings are credited within 24 hours of a successful purchase. Payouts go to your bank monthly once you reach £20.
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
  tone: 'blue' | 'green' | 'violet'; wide?: boolean;
}) {
  const toneClasses = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
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
