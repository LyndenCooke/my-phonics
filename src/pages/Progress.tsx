import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useProgressData } from '@/hooks/useBooks';
import { useNavigate } from 'react-router-dom';
import { JOURNEY_LEVELS, journeyLevelOf, getJourneyLevel } from '@/lib/levels8';
import { Flame, Star } from 'lucide-react';

// Assessment results still store legacy parent-6 levels; map to the 8-level
// journey for display (first journey level of each legacy band — same
// mapping as Profile.tsx and Index.tsx).
const LEGACY_TO_JOURNEY: Record<number, number> = { 1: 1, 2: 4, 3: 5, 4: 6, 5: 7, 6: 8 };

/** Sticker shadow — white border + soft drop, same as /learn and /library. */
const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';

export default function Progress() {
  const { user } = useAuth();
  const { data, isLoading } = useProgressData();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Layout>
        <div className="px-4 pt-10 pb-4 max-w-md mx-auto text-center">
          <h2 className="font-display text-2xl font-extrabold text-foreground mb-3">Progress</h2>
          <p className="text-sm text-muted-foreground mb-6">Sign in to track your child's reading progress.</p>
          <button
            onClick={() => navigate('/auth')}
            className="py-3 px-8 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
            style={{ background: '#E84B8A', boxShadow: '0 4px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
          >
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

  // Books are tagged with legacy parent-6 sub_levels in Supabase; place each
  // on the 8-level journey at render time (same mapping as /learn + /library).
  const journeyLevelOfBook = (book: { sub_level?: string | null; level: number }) =>
    book.sub_level ? journeyLevelOf(book.sub_level) : book.level;

  const levelProgress = JOURNEY_LEVELS.map(level => {
    const booksAtLevel = data?.allBooks.filter(b => journeyLevelOfBook(b) === level.level) ?? [];
    const completedAtLevel = data?.userBooks.filter(ub => {
      const book = data?.allBooks.find(b => b.id === ub.book_id);
      return book && journeyLevelOfBook(book) === level.level && ub.completed_at;
    }).length ?? 0;
    return { ...level, total: booksAtLevel.length, completed: completedAtLevel };
  });

  const progressPct = totalBooks > 0 ? (completedCount / totalBooks) * 100 : 0;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <Layout>
      <div className="px-4 pt-6 lg:pt-12 pb-8 max-w-md lg:max-w-4xl mx-auto">
        <div className="text-center lg:text-left mb-6">
          <h2 className="font-display text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">Progress</h2>
          <p className="text-sm text-muted-foreground mt-1">The whole reading journey, level by level.</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-[1.75rem] bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Headline card: books read + streak ── */}
            <div
              className="rounded-[1.75rem] bg-white p-6 mb-6 flex items-center gap-6"
              style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
            >
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="42" fill="none" strokeWidth="7" className="stroke-muted" />
                  <circle
                    cx="48" cy="48" r="42" fill="none" strokeWidth="7"
                    stroke="#E84B8A"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-extrabold text-foreground">{completedCount}</span>
                  <span className="text-[10px] font-bold text-muted-foreground">of {totalBooks}</span>
                </div>
              </div>
              <div>
                <p className="font-display font-extrabold text-foreground text-lg">Books completed</p>
                <p className="text-xs text-muted-foreground mt-1">Keep reading to unlock more!</p>
                {streakDays > 0 && (
                  <span
                    className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-white px-3 py-1.5 text-xs font-extrabold -rotate-1 text-amber-700"
                    style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #F59E0B30' }}
                  >
                    <Flame className="w-4 h-4 text-amber-500" /> {streakDays} day streak
                  </span>
                )}
              </div>
            </div>

            {/* ── The 8 journey levels ── */}
            <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
              {levelProgress.map((lp) => {
                const done = lp.total > 0 && lp.completed === lp.total;
                return (
                  <div
                    key={lp.level}
                    className="rounded-[1.5rem] bg-white p-4 lg:p-5"
                    style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-7 h-7 rounded-full text-white text-xs font-extrabold flex items-center justify-center shrink-0"
                          style={{ background: lp.hex }}
                        >
                          {lp.level}
                        </span>
                        <span className="text-sm font-bold text-foreground truncate">{lp.name}</span>
                        {done && <Star className="w-4 h-4 shrink-0" style={{ color: lp.hex, fill: lp.hex }} strokeWidth={0} />}
                      </div>
                      {lp.total > 0 ? (
                        <span className="text-xs font-bold tabular-nums" style={{ color: lp.inkHex }}>
                          {lp.completed}/{lp.total}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">Coming soon</span>
                      )}
                    </div>
                    {lp.total > 0 && (
                      <div className="h-2.5 rounded-full bg-black/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(lp.completed / lp.total) * 100}%`, background: lp.hex }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {data?.latestAssessment && (() => {
              const journeyRec = LEGACY_TO_JOURNEY[data.latestAssessment.recommended_level] ?? data.latestAssessment.recommended_level;
              const recInfo = getJourneyLevel(journeyRec);
              return (
                <div
                  className="rounded-[1.5rem] bg-white p-4 mt-6"
                  style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
                >
                  <p className="text-sm font-bold text-foreground mb-1">Latest Level Check</p>
                  <p className="text-xs text-muted-foreground">
                    Recommended Level {journeyRec}{recInfo ? ` · ${recInfo.name}` : ''} · {new Date(data.latestAssessment.completed_at!).toLocaleDateString()}
                  </p>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </Layout>
  );
}
