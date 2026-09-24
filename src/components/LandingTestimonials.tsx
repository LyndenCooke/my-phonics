import { useEffect, useRef, useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface Testimonial {
  id: string;
  rating: number | null;
  quote: string;
  first_name: string | null;
}

/**
 * Swipeable wall of REAL, consented parent testimonials. Reads the
 * `public_testimonials` view (admin-featured + consent_marketing rows only).
 * Renders nothing until at least one is featured — so the page never ships
 * empty or invented quotes.
 */
export default function LandingTestimonials() {
  const { t } = useTranslation('landing');
  const [items, setItems] = useState<Testimonial[]>([]);
  const trackRef = useRef<HTMLDivElement>(null);

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
        .limit(20);
      if (alive) setItems(data ?? []);
    })();
    return () => { alive = false; };
  }, []);

  const scroll = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    // scrollBy is physical; in RTL the 'next' direction is leftwards.
    const sign = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollBy({ left: sign * dir * Math.min(el.clientWidth * 0.85, 380), behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{t('testimonials.title')}</h2>
            <p className="mt-2 text-muted-foreground text-lg">{t('testimonials.subtitle')}</p>
          </div>
          {items.length > 1 && (
            <div className="hidden sm:flex gap-2 shrink-0">
              <button onClick={() => scroll(-1)} aria-label={t('testimonials.previous')} className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ChevronLeft className="w-5 h-5 rtl:-scale-x-100" />
              </button>
              <button onClick={() => scroll(1)} aria-label={t('testimonials.next')} className="w-10 h-10 rounded-full border border-border bg-background flex items-center justify-center hover:bg-muted/50 transition-colors">
                <ChevronRight className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            </div>
          )}
        </div>

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-none -mx-4 px-4 pb-2"
          style={{ scrollbarWidth: 'none' }}
        >
          {items.map((item) => (
            <figure
              key={item.id}
              className="snap-start shrink-0 w-[85%] sm:w-[360px] bg-background rounded-3xl border border-border p-6 shadow-card flex flex-col"
            >
              <Quote className="w-7 h-7 text-primary/30 mb-3" />
              <div className="flex items-center gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${(item.rating ?? 5) >= n ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30'}`} />
                ))}
              </div>
              {/* Genuine parent quotes — shown exactly as written, never translated. */}
              <blockquote dir="auto" className="text-foreground leading-relaxed flex-1">“{item.quote}”</blockquote>
              <figcaption className="mt-4 text-sm font-bold text-primary-ink">
                — {item.first_name ? item.first_name : t('testimonials.aParent')}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
