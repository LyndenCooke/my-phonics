/**
 * WallOfLove — /love
 *
 * Every consented, admin-featured testimonial as a wall of sticker notes.
 * Reads the `public_testimonials` view (same source as the landing-page
 * carousel) so only real, consent_marketing quotes ever appear — the page
 * shows a warm invite instead if nothing is featured yet.
 *
 * Growth loop: signed-in families can add their own story (FeedbackDialog,
 * which feeds the admin feature queue); visitors get nudged to the free
 * assessment. "Paper & stickers" design language.
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Star, Heart, PenLine, Sparkles } from 'lucide-react';
import Layout from '@/components/Layout';
import FeedbackDialog from '@/components/FeedbackDialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Testimonial {
  id: string;
  rating: number | null;
  quote: string;
  first_name: string | null;
}

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];
const ACCENTS = ['#E84B8A', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6', '#14B8A6'];

export default function WallOfLove() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const [items, setItems] = useState<Testimonial[] | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => { order: (k: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: Testimonial[] | null }> } };
        };
      })
        .from('public_testimonials')
        .select('id, rating, quote, first_name')
        .order('submitted_at', { ascending: false })
        .limit(60);
      if (alive) setItems(data ?? []);
    })();
    return () => { alive = false; };
  }, []);

  const avgRating = useMemo(() => {
    const rated = (items ?? []).filter(t => t.rating);
    if (rated.length === 0) return null;
    return (rated.reduce((s, t) => s + (t.rating ?? 0), 0) / rated.length).toFixed(1);
  }, [items]);

  return (
    <Layout>
      <div className="px-5 lg:px-8 pt-8 lg:pt-12 pb-14 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          {...(reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.55 } })}
          className="text-center"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-2 text-primary-ink"
            style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #E84B8A30' }}
          >
            <Heart className="w-3.5 h-3.5 fill-current" /> Wall of Love
          </span>
          <h1 className="font-display text-3xl lg:text-5xl font-extrabold text-foreground tracking-tight mt-4 leading-tight">
            Real words from real families
          </h1>
          {avgRating && items && items.length > 2 && (
            <p className="mt-3 text-sm lg:text-base text-muted-foreground font-bold inline-flex items-center gap-1.5">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {avgRating} from {items.length} famil{items.length === 1 ? 'y' : 'ies'} and teachers
            </p>
          )}
        </motion.div>

        {/* The wall — masonry sticker notes */}
        {items === null ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-3xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 text-center max-w-sm mx-auto">
            <Sparkles className="w-8 h-8 text-primary mx-auto" />
            <p className="font-display text-xl font-extrabold text-foreground mt-3">The wall is just getting started</p>
            <p className="text-sm text-muted-foreground mt-2">Be one of the first families to share your story.</p>
          </div>
        ) : (
          <div className="mt-10 columns-1 sm:columns-2 lg:columns-3 gap-4 [column-fill:_balance]">
            {items.map((t, i) => {
              const accent = ACCENTS[i % ACCENTS.length];
              return (
                <motion.figure
                  key={t.id}
                  {...(reduceMotion ? {} : {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: '-30px' },
                    transition: { duration: 0.45, delay: (i % 3) * 0.07 },
                  })}
                  className="break-inside-avoid mb-4 rounded-3xl bg-white p-5 lg:p-6"
                  style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)', rotate: `${TILTS[i % TILTS.length]}deg` }}
                >
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <Star key={n} className={`w-4 h-4 ${(t.rating ?? 5) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/25'}`} />
                    ))}
                  </div>
                  <blockquote className="text-[15px] text-foreground leading-relaxed mt-3">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-4 flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                      style={{ background: accent }}
                    >
                      {(t.first_name?.[0] ?? '❤').toUpperCase()}
                    </span>
                    <span className="text-sm font-display font-extrabold text-foreground">
                      {t.first_name ?? 'A parent'}
                    </span>
                  </figcaption>
                </motion.figure>
              );
            })}
          </div>
        )}

        {/* Add your story / try it */}
        <motion.div
          {...(reduceMotion ? {} : { initial: { opacity: 0, y: 18 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } })}
          className="mt-12 text-center"
        >
          <h2 className="font-display text-xl lg:text-2xl font-extrabold text-foreground">
            {user ? 'Want to add your story?' : 'Want a story of your own?'}
          </h2>
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
            {user ? (
              <button
                onClick={() => setFeedbackOpen(true)}
                className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-2xl font-display text-base font-extrabold text-white transition-all active:translate-y-[4px]"
                style={{ background: '#E84B8A', boxShadow: '0 5px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
              >
                <PenLine className="w-[18px] h-[18px]" /> Leave a review
              </button>
            ) : (
              <button
                onClick={() => navigate('/assess')}
                className="inline-flex items-center gap-2 h-13 px-7 py-3.5 rounded-2xl font-display text-base font-extrabold text-white transition-all active:translate-y-[4px]"
                style={{ background: '#E84B8A', boxShadow: '0 5px 0 #BE1862, 0 14px 28px -10px #E84B8A80' }}
              >
                <Sparkles className="w-[18px] h-[18px]" /> Try the free 3-minute check
              </button>
            )}
            <button
              onClick={() => navigate('/support')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-display text-base font-extrabold bg-white text-foreground/70 press-scale"
              style={{ boxShadow: STICKER }}
            >
              Support MyPhonicsBooks
            </button>
          </div>
        </motion.div>
      </div>

      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} source="wall_of_love" />
    </Layout>
  );
}
