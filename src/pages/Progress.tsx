import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressData } from '@/hooks/useBooks';
import { useNavigate } from 'react-router-dom';
import { LEVELS } from '@/lib/types';
import { Flame } from 'lucide-react';

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Progress() {
  const { user } = useAuth();
  const { data, isLoading } = useProgressData();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-2xl font-extrabold text-foreground mb-3">Progress</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to track your child's reading progress.</p>
          <button onClick={() => navigate('/auth')} className="py-3 px-8 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button">
            Sign In
          </button>
        </div>
      </Layout>
    );
  }

  const completedCount = data?.userBooks.filter(ub => ub.completed_at).length ?? 0;
  const totalBooks = data?.allBooks.length ?? 0;

  const streakDays = (() => {
    if (!data?.recentStreaks.length) return 0;
    const sorted = [...data.recentStreaks].sort((a, b) => b.activity_date.localeCompare(a.activity_date));
    let count = 0;
    const today = new Date();
    for (const s of sorted) {
      const d = new Date(s.activity_date);
      const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (diffDays === count) count++;
      else break;
    }
    return count;
  })();

  const levelProgress = LEVELS.map(level => {
    const booksAtLevel = data?.allBooks.filter(b => b.level === level.level) ?? [];
    const completedAtLevel = data?.userBooks.filter(ub => {
      const book = data?.allBooks.find(b => b.id === ub.book_id);
      return book?.level === level.level && ub.completed_at;
    }).length ?? 0;
    return { ...level, total: booksAtLevel.length, completed: completedAtLevel };
  });

  const progressPct = totalBooks > 0 ? (completedCount / totalBooks) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-md mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-5 tracking-tight">Progress</h2>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="bg-card rounded-2xl border border-border p-6 mb-5 shadow-card flex items-center gap-6">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="42" fill="none" strokeWidth="6" className="stroke-muted" />
                  <circle
                    cx="48" cy="48" r="42" fill="none" strokeWidth="6"
                    className="stroke-primary"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-extrabold text-foreground">{completedCount}</span>
                  <span className="text-[10px] text-muted-foreground">of {totalBooks}</span>
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">Books Completed</p>
                <p className="text-xs text-muted-foreground mt-1">Keep reading to unlock more!</p>
                {streakDays > 0 && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">{streakDays} day streak</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              {levelProgress.map((lp) => (
                <div key={lp.level} className="bg-card rounded-xl border border-border p-4 shadow-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${levelBgs[lp.level]}`} />
                      <span className="text-sm font-bold text-foreground">Level {lp.level}: {lp.name}</span>
                    </div>
                    {lp.total > 0 ? (
                      <span className="text-xs text-muted-foreground">{lp.completed}/{lp.total}</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Coming soon</span>
                    )}
                  </div>
                  {lp.total > 0 && (
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${levelBgs[lp.level]} rounded-full transition-all duration-500`}
                        style={{ width: `${lp.total > 0 ? (lp.completed / lp.total) * 100 : 0}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {data?.latestAssessment && (
              <div className="bg-card rounded-xl border border-border p-4 mt-5 shadow-card">
                <p className="text-sm font-bold text-foreground mb-1">Latest Assessment</p>
                <p className="text-xs text-muted-foreground">
                  Recommended Level {data.latestAssessment.recommended_level} · {new Date(data.latestAssessment.completed_at!).toLocaleDateString()}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}