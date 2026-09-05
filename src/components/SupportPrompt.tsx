/**
 * SupportPrompt — the optional "support this business" pop-up shown ONCE,
 * right after a parent creates their account (Gumtree-style optional
 * payment). No pricing is ever required: "Maybe later" closes it for good.
 *
 * Mounted in Layout so it appears wherever the new account lands. Auth.tsx
 * sets the pending flag on signup; we wait for a live session so the
 * checkout call has a JWT (email-confirmation flows arrive here later).
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  SUPPORT_AMOUNTS,
  clearSupportPrompt,
  isSupportPromptPending,
  startSupportCheckout,
} from '@/lib/support';

export default function SupportPrompt() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isSupportPromptPending()) {
      // Small delay so the destination page paints first — the prompt
      // should feel like a friendly aside, not a wall.
      const t = setTimeout(() => setOpen(true), 900);
      return () => clearTimeout(t);
    }
  }, [user]);

  const close = () => {
    clearSupportPrompt();
    setOpen(false);
  };

  const choose = async (pence: number) => {
    setBusy(pence);
    try {
      clearSupportPrompt();
      await startSupportCheckout(pence);
    } catch (err) {
      toast.error((err as Error).message);
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm mx-auto rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-tint-pink flex items-center justify-center mb-1">
            <Heart className="w-6 h-6 text-primary fill-current" />
          </div>
          <DialogTitle className="font-display text-xl font-extrabold text-foreground">
            You're in — everything's free
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Every book, game and worksheet is yours at no cost. If MyPhonicsBooks
            helps your child, you can leave a small thank-you to keep it free for
            other families. Completely optional.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2 pt-1">
          {SUPPORT_AMOUNTS.map((a) => (
            <button
              key={a.pence}
              type="button"
              disabled={busy !== null}
              onClick={() => choose(a.pence)}
              className={`rounded-2xl border-2 py-3 text-center transition-all active:scale-[0.96] disabled:opacity-60 ${
                a.pence === 500 ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              {busy === a.pence ? (
                <Loader2 className="w-4 h-4 mx-auto animate-spin" />
              ) : (
                <>
                  <span className="block font-display font-extrabold text-base text-foreground">{a.label}</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5">{a.note}</span>
                </>
              )}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <button
            type="button"
            onClick={() => { close(); navigate('/support'); }}
            className="text-xs font-bold text-primary-ink hover:underline"
          >
            Choose a different amount
          </button>
          <button
            type="button"
            onClick={close}
            className="w-full py-3 rounded-2xl font-display font-extrabold text-sm text-foreground bg-muted hover:bg-muted/70 transition-colors"
          >
            Maybe later — take me to the books
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
