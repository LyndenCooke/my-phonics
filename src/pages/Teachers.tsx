import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Loader2, ShieldCheck } from 'lucide-react';
import {
  getTeacherSessionToken,
  lookupTeacherSession,
  redeemTeacherCode,
} from '@/lib/teacherSession';

export default function Teachers() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // If the teacher already has a valid session, send them straight through.
  // Stops a returning teacher from re-typing the code every visit.
  useEffect(() => {
    const token = getTeacherSessionToken();
    if (!token) {
      setCheckingExisting(false);
      return;
    }
    lookupTeacherSession(token).then((existing) => {
      if (existing) {
        navigate('/teachers/library', { replace: true });
      } else {
        setCheckingExisting(false);
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await redeemTeacherCode(code);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    navigate('/teachers/library', { replace: true });
  };

  if (checkingExisting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 relative">
      <Link
        to="/"
        className="absolute top-4 left-4 flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-4 h-4" /> Back
      </Link>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tint-pink mb-3">
            <GraduationCap className="w-8 h-8 text-primary-ink" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-foreground tracking-tight">
            Teacher Access
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-snug">
            Enter the code from your MyPhonicsBooks TPT download to unlock the
            whole library — every book, every worksheet, free.
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-trust-tint text-trust-ink text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            No signup, no email required
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Voucher code
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter your code"
              autoComplete="off"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="mt-1 w-full px-4 py-3 rounded-xl border-2 border-border focus:border-primary focus:outline-none text-center font-mono text-base font-bold tracking-wider"
              disabled={submitting}
              required
            />
          </label>

          {error && (
            <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button active:scale-[0.97] transition-transform disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Unlocking…
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                Unlock the library
              </>
            )}
          </button>
        </form>

        <p className="text-[11px] text-muted-foreground text-center mt-6 leading-snug">
          Codes ship with every MyPhonicsBooks resource on Teachers Pay Teachers.
          Not a teacher?{' '}
          <Link to="/library" className="text-primary-ink font-semibold underline">
            Browse the parent library
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
