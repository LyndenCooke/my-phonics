import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useBooks, useUserBooks } from '@/hooks/useBooks';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ChevronRight, Loader2, BookOpen, Lock, Check } from 'lucide-react';
import { LEVELS } from '@/lib/types';

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Welcome() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: userBooks, isLoading: ubLoading } = useUserBooks();
  const { data: allBooks, isLoading: booksLoading } = useBooks();

  // Find the first free-sample book the user has unlocked
  type UnlockedBook = NonNullable<typeof allBooks>[number];
  const [unlockedBook, setUnlockedBook] = useState<UnlockedBook | null>(null);

  useEffect(() => {
    if (!userBooks || !allBooks) return;
    const freeSample = userBooks.find((ub) => ub.source === 'free_sample') || userBooks[0];
    if (!freeSample) return;
    const book = allBooks.find((b) => b.id === freeSample.book_id);
    if (book) setUnlockedBook(book);
  }, [userBooks, allBooks]);

  // If not logged in, bounce to assessment
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/assess');
    }
  }, [authLoading, user, navigate]);

  const loading = authLoading || ubLoading || booksLoading;

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const level = unlockedBook?.level ?? 1;
  const levelInfo = LEVELS.find(l => l.level === level);

  return (
    <Layout>
      <div className="px-4 pt-8 pb-8 max-w-md mx-auto text-center">
        <div className="mb-5">
          <div className="inline-flex items-center gap-2 bg-tint-pink px-3 py-1.5 rounded-full mb-3">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wide">
              You're in!
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Your free book is ready
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            We've unlocked a book at your child's level. Tap to start reading.
          </p>
        </div>

        {unlockedBook ? (
          <button
            onClick={() => navigate('/library', { state: { filterLevel: level, openBookId: unlockedBook.id } })}
            className="block w-full mb-6 group"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-card bg-card border-2 border-primary transition-transform duration-200 group-active:scale-[0.97]">
              {unlockedBook.cover_image_url ? (
                <img
                  src={unlockedBook.cover_image_url}
                  alt={unlockedBook.title}
                  className="w-full aspect-[3/4] object-cover"
                />
              ) : (
                <div className={`w-full aspect-[3/4] flex items-center justify-center ${LEVEL_COLORS[level]} text-white`}>
                  <BookOpen className="w-16 h-16 opacity-70" />
                </div>
              )}
              <div className={`${LEVEL_COLORS[level]} text-white py-3 px-4`}>
                <p className="text-xs opacity-90">Level {level} — {levelInfo?.name}</p>
                <p className="font-bold text-lg">{unlockedBook.title}</p>
              </div>
            </div>
          </button>
        ) : (
          <div className="mb-6 p-6 bg-card border border-border rounded-2xl">
            <p className="text-sm text-muted-foreground">
              Your book is being prepared. Head to the library to browse what's available.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/library')}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
        >
          Continue to Library <ChevronRight className="w-4 h-4" />
        </button>

        {/* Password creation for magic-link users */}
        <PasswordSetup />

        <p className="text-xs text-muted-foreground mt-4">
          Your progress is saved. Come back anytime to pick up where you left off.
        </p>
      </div>
    </Layout>
  );
}

function PasswordSetup() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  if (done) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-green-600">
        <Check className="w-4 h-4" />
        Password set — you can now sign in with email &amp; password
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('At least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords don\'t match'); return; }
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 bg-card border border-border rounded-xl p-4 text-left">
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-bold text-foreground">Create a password</p>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        So you can sign in next time without a magic link.
      </p>
      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-2"
      />
      <input
        type="password"
        placeholder="Confirm password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm mb-3"
      />
      {error && <p className="text-xs text-destructive mb-2">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-2.5 rounded-lg gradient-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Set Password'}
      </button>
      <p className="text-xs text-muted-foreground mt-2 text-center">Optional — you can skip this</p>
    </form>
  );
}
