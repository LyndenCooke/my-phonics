import { useState, useEffect } from 'react';
import { Ticket, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { setRefCode, getStoredRefCode, clearStoredRefCode } from '@/lib/referral';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

// partner_code_discount was added after the last `supabase gen types` run.
const sbRpc = (supabase as unknown as {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
}).rpc;

/**
 * Compact "have a discount code?" field for the Shop page. A partner code (from
 * a poster / a shop) gives the customer their discount and credits the partner.
 * We confirm validity via the public partner_code_discount RPC, then store it in
 * the same slot the ?ref= link uses, so checkout applies it automatically.
 */
export default function PartnerCodeField() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [checking, setChecking] = useState(false);
  const [applied, setApplied] = useState<{ code: string; pct: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // On mount, if a stored code is already a valid partner code, show it applied.
  useEffect(() => {
    const existing = getStoredRefCode();
    if (!existing) return;
    (async () => {
      const { data } = await sbRpc('partner_code_discount', { p_code: existing });
      if (typeof data === 'number' && data > 0) setApplied({ code: existing, pct: data });
    })();
  }, []);

  const apply = async () => {
    setError(null);
    const code = value.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) { setError('Codes are 4–12 letters or numbers.'); return; }
    setChecking(true);
    try {
      const { data, error: rpcErr } = await sbRpc('partner_code_discount', { p_code: code });
      if (rpcErr) { setError('Could not check that code. Try again.'); return; }
      if (typeof data === 'number' && data > 0) {
        setRefCode(code);
        setApplied({ code, pct: data });
        setValue('');
        setOpen(false);
      } else {
        setError("That code isn't recognised.");
      }
    } finally {
      setChecking(false);
    }
  };

  const remove = () => {
    clearStoredRefCode();
    setApplied(null);
    setError(null);
  };

  if (applied) {
    return (
      <div
        className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3"
        style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #22C55E40' }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="grid place-items-center h-7 w-7 rounded-full bg-green-100 text-green-600 shrink-0">
            <Check className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-foreground truncate">
            Code <span className="font-mono text-primary-ink">{applied.code}</span> applied — {applied.pct}% off at checkout
          </p>
        </div>
        <button onClick={remove} className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0">
          <X className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
    );
  }

  return (
    <div className="mb-5 text-center">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary-ink"
        >
          <Ticket className="h-4 w-4" /> Got a discount code?
        </button>
      ) : (
        <div
          className="mx-auto max-w-sm rounded-2xl bg-white p-3"
          style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
        >
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={value}
              onChange={(e) => { setValue(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)); setError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') apply(); }}
              placeholder="Enter code"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono tracking-wide uppercase outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              onClick={apply}
              disabled={checking || value.length < 4}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-display font-extrabold text-primary-foreground press-scale disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
            </button>
          </div>
          {error && <p className="text-xs text-red-500 mt-2 text-left px-1">{error}</p>}
        </div>
      )}
    </div>
  );
}
