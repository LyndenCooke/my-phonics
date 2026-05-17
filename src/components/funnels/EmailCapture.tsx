import { useState, FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface EmailCaptureProps {
  source: string;
  onSuccess: (data: { childName: string; email: string }) => void;
  buttonText?: string;
  collectName?: boolean;
}

export default function EmailCapture({
  source,
  onSuccess,
  buttonText = 'Get Started',
  collectName = true,
}: EmailCaptureProps) {
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim() && consent && !loading && (!collectName || childName.trim());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError('');

    try {
      // `funnel_leads` table exists but isn't in the generated Supabase
      // types yet — cast via `any` until types are regenerated.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('funnel_leads').insert({
        child_name: childName.trim() || null,
        email: email.trim(),
        source,
      });

      if (dbError) throw new Error(dbError.message);

      window.fbq?.('track', 'Lead', { content_name: source });

      onSuccess({ childName: childName.trim(), email: email.trim() });
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div className="space-y-4">
        {collectName && (
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Child's first name"
            className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
            required={collectName}
          />
        )}

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
          required
        />

        <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-pink-300 text-[hsl(var(--primary))] focus:ring-pink-500/20"
          />
          <span>I agree to receive free phonics resources by email. Unsubscribe any time.</span>
        </label>

        {error && (
          <p className="text-sm text-destructive text-center">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              {buttonText}
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Free — no card required. Based on Letters and Sounds.
      </p>
    </form>
  );
}
