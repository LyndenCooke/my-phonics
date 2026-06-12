/**
 * LandingPage — public front door.
 *
 * Message hierarchy (from the printed leaflet, per user):
 *   1. Explore the books — the library is open, free books included
 *   2. Assess your child free (3 minutes)
 *   3. Read on any screen, or download & print real booklets
 *   4. "From first sounds to last sounds" — the 8-level journey
 * Plus the floating cover imagery (kept) and real testimonials (kept).
 *
 * "Paper & stickers" design language shared with the app: sticker chips,
 * white sticker cards, 3D pressable buttons, journey-level colours.
 */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Sparkles, Globe, BarChart3, CheckCircle2, ChevronRight, Volume2,
  Trophy, GraduationCap, Printer, Heart, ClipboardList,
} from 'lucide-react';
import { JOURNEY_LEVELS } from '@/lib/levels8';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import LandingTestimonials from '@/components/LandingTestimonials';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
const PINK = '#E84B8A';
const PINK_INK = '#BE1862';

/* ─── Book cover data for hero carousel (journey-8 levels) ─── */
const SHOWCASE_BOOKS = [
  { key: '1_1', title: 'Tap! Tap! Tap!', journey: 1 },
  { key: '2_1', title: 'The Night Light', journey: 4 },
  { key: '3_1', title: 'The Big Bike Race', journey: 5 },
  { key: '4_1', title: 'The Purple Purse', journey: 6 },
  { key: '5_1', title: 'Before the Shore', journey: 7 },
  { key: '6_1', title: 'The Marvellous Neighbourhood', journey: 8 },
  { key: '1_3', title: 'The Fish in the Tank', journey: 3 },
  { key: '2_3', title: 'Morning on the Farm', journey: 4 },
];

/** Books per journey level (33 total). */
const BOOK_COUNTS: Record<number, number> = { 1: 2, 2: 5, 3: 3, 4: 6, 5: 5, 6: 4, 7: 4, 8: 4 };

/* ─── Scroll-reveal hook ─── */
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold: 0.15 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/** 3D pressable button — the app's signature CTA. */
function PushButton({ onClick, children, tone = 'pink', className = '' }: {
  onClick: () => void; children: React.ReactNode; tone?: 'pink' | 'white'; className?: string;
}) {
  if (tone === 'white') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-display font-extrabold text-base bg-white text-foreground transition-all active:translate-y-[3px] ${className}`}
        style={{ boxShadow: `0 4px 0 rgba(40,30,40,0.10), ${STICKER}`, border: '1px solid rgba(40,30,40,0.06)' }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px] ${className}`}
      style={{ background: PINK, boxShadow: `0 5px 0 ${PINK_INK}, 0 14px 28px -10px ${PINK}80` }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  useFunnelTracker();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <a href="#main" className="skip-link">Skip to main content</a>

      <NavBar onBrowse={() => navigate('/library')} />

      <main id="main">
        <HeroSection onBrowse={() => navigate('/library')} onAssess={() => navigate('/assessment')} />
        <ThreeThings
          onAssess={() => navigate('/assessment')}
          onBrowse={() => navigate('/library')}
        />
        <LandingTestimonials />
        <LevelJourney />
        <FeatureShowcase />
        <Pricing onFree={() => navigate('/auth')} onFull={() => navigate('/shop')} />
        <FooterCTA onBrowse={() => navigate('/library')} onAssess={() => navigate('/assessment')} />
      </main>
      <Footer />
    </div>
  );
}

/* ─── NAV BAR ─── */
function NavBar({ onBrowse }: { onBrowse: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 safe-top ${scrolled ? 'bg-card/95 backdrop-blur-xl shadow-card border-b border-border' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 min-w-0" aria-label="MyPhonicsBooks home">
          <img src="/logo/mpb-mark-transparent.png" alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0" draggable={false} />
          <span className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight truncate hidden xs:inline">
            My<span className="text-primary-ink">Phonics</span>Books
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <Link to="/love" className="text-xs sm:text-sm font-bold text-foreground hover:text-primary-ink transition-colors whitespace-nowrap items-center gap-1 hidden sm:inline-flex">
            <Heart className="w-4 h-4" /> Wall of Love
          </Link>
          <Link to="/school" className="text-xs sm:text-sm font-bold text-foreground hover:text-primary-ink transition-colors whitespace-nowrap inline-flex items-center gap-1">
            <GraduationCap className="w-4 h-4" />
            <span className="hidden xs:inline">For Schools</span>
            <span className="xs:hidden">Schools</span>
          </Link>
          <button
            onClick={onBrowse}
            className="text-xs sm:text-sm font-display font-extrabold text-white px-3 sm:px-4 py-2 rounded-xl transition-all active:translate-y-[2px] whitespace-nowrap"
            style={{ background: PINK, boxShadow: `0 3px 0 ${PINK_INK}` }}
          >
            <span className="sm:hidden">Explore</span>
            <span className="hidden sm:inline">Explore the Books</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── HERO ─── */
function HeroSection({ onBrowse, onAssess }: { onBrowse: () => void; onAssess: () => void }) {
  return (
    <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(338,78%,96%)] via-background to-[hsl(142,60%,97%)]" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[hsl(var(--level-3))]/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Text */}
          <div className="text-center md:text-left">
            {/* Audience switch — parents stay here; schools/nurseries jump
                to their own product. Parent is the active state. */}
            <div className="inline-flex items-center gap-1 p-1 mb-5 rounded-full bg-card border border-border shadow-sm">
              <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary text-white">
                For Parents
              </span>
              <Link
                to="/school"
                className="px-3 py-1.5 rounded-full text-xs font-bold text-muted-foreground hover:text-primary-ink transition-colors inline-flex items-center gap-1"
              >
                <GraduationCap className="w-3.5 h-3.5" /> For Schools
              </Link>
            </div>

            <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-foreground tracking-tight leading-[1.05]">
              Books that grow with your child —{' '}
              <span className="text-primary-ink">from first sounds to fluent reading.</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
              33 decodable phonics books across 8 levels. Check your child's level free,
              read together on any screen, or print real booklets to hold.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <PushButton onClick={onBrowse}>
                <BookOpen className="w-5 h-5" /> Explore the books
              </PushButton>
              <PushButton onClick={onAssess} tone="white">
                Check their level — free <ChevronRight className="w-4 h-4" />
              </PushButton>
            </div>
            <p className="mt-4 text-xs text-muted-foreground font-semibold">
              The first books are free and open right now — no signup, no card.
            </p>
          </div>

          {/* Book carousel — the floating covers stay; they ARE the product */}
          <div className="relative h-[420px] md:h-[480px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-4 -rotate-3">
                {SHOWCASE_BOOKS.map((b, i) => {
                  // First 4 covers are above the fold even on mobile; load
                  // them eagerly with high priority so the hero looks
                  // populated immediately. The remaining 4 wait until the
                  // browser has bandwidth.
                  const aboveFold = i < 4;
                  const hex = JOURNEY_LEVELS[b.journey - 1].hex;
                  return (
                    <div
                      key={b.key}
                      className="w-32 md:w-40 rounded-2xl overflow-hidden shadow-card-hover transform transition-transform hover:scale-105 hover:-rotate-2"
                      style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}
                    >
                      {/* WebP first (~80KB) for browsers that support it,
                       *  PNG fallback (~450KB) for everyone else. */}
                      <picture>
                        <source srcSet={`/illustrations/${b.key}/cover.webp`} type="image/webp" />
                        <img
                          src={`/illustrations/${b.key}/cover.png`}
                          alt={b.title}
                          width={160}
                          height={213}
                          className="w-full aspect-[3/4] object-cover"
                          style={{ imageRendering: 'auto' }}
                          loading={aboveFold ? 'eager' : 'lazy'}
                          // @ts-expect-error fetchpriority not yet typed in React types
                          fetchpriority={aboveFold ? 'high' : 'auto'}
                          decoding="async"
                          draggable={false}
                        />
                      </picture>
                      <div className="px-2 py-1.5 bg-card">
                        <div className="w-full h-1 rounded-full" style={{ backgroundColor: hex }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </section>
  );
}

/* ─── THE THREE THINGS (leaflet message) ─── */
function ThreeThings({ onAssess, onBrowse }: { onAssess: () => void; onBrowse: () => void }) {
  const r = useReveal();
  const cards = [
    {
      icon: ClipboardList,
      hex: '#E84B8A',
      tilt: '-1deg',
      title: 'Check their level',
      desc: 'A free 3-minute sound check finds exactly the right starting point. No guessing, no card.',
      cta: 'Start the free check',
      onClick: onAssess,
    },
    {
      icon: Volume2,
      hex: '#3B82F6',
      tilt: '1deg',
      title: 'Read on any screen',
      desc: 'Interactive books on phone, tablet or laptop — tap any word to hear it sounded out.',
      cta: 'Explore the books',
      onClick: onBrowse,
    },
    {
      icon: Printer,
      hex: '#22C55E',
      tilt: '-0.5deg',
      title: 'Or print and hold',
      desc: 'Download any book as a fold-and-staple A5 booklet. Real pages for bedtime reading.',
      cta: 'See the library',
      onClick: onBrowse,
    },
  ];

  return (
    <section className="py-14 md:py-20">
      <div ref={r.ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <span
            className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold -rotate-1 text-primary-ink"
            style={{ boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${PINK}30` }}
          >
            Three ways to use it
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-4">
            Assess. Read. Print.
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">Everything a learning reader needs, in one place.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {cards.map((c, i) => (
            <div
              key={i}
              className="rounded-[2rem] bg-white p-6 flex flex-col text-center"
              style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)', rotate: c.tilt }}
            >
              <span
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white mx-auto"
                style={{ background: c.hex, boxShadow: `0 8px 18px -6px ${c.hex}90` }}
              >
                <c.icon className="w-7 h-7" />
              </span>
              <h3 className="font-display text-xl font-extrabold text-foreground mt-4">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">{c.desc}</p>
              <button
                onClick={c.onClick}
                className="mt-5 w-full py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
                style={{ background: c.hex, boxShadow: `0 4px 0 ${c.hex}AA` }}
              >
                {c.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── LEVEL JOURNEY — first sounds to last sounds ─── */
function LevelJourney() {
  const r = useReveal();

  return (
    <section className="py-14 md:py-20 bg-card">
      <div ref={r.ref} className={`max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            From first sounds to last sounds
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Eight levels, one clear path — every book uses only the sounds your child has learned.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {JOURNEY_LEVELS.map(lv => (
            <div
              key={lv.level}
              className="relative bg-background rounded-2xl p-4 border border-border hover:shadow-card-hover transition-shadow overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: lv.hex }} />
              <div className="flex items-center gap-2.5 mb-2.5 mt-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0" style={{ backgroundColor: lv.hex }}>
                  {lv.level}
                </div>
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-foreground text-sm leading-tight truncate">{lv.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{lv.ageRange}</p>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                <span className="font-child font-bold" style={{ color: lv.inkHex }}>
                  {lv.gpcs.slice(0, 5).join(' · ')}
                </span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1.5 font-semibold">
                {BOOK_COUNTS[lv.level]} books
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── FEATURES ─── */
function FeatureShowcase() {
  const r = useReveal();
  const features = [
    { icon: Volume2, text: 'Tap any word to hear it sounded out phoneme by phoneme' },
    { icon: BookOpen, text: '33 books across 8 carefully graded reading levels' },
    { icon: Globe, text: 'Stories set in Japan, Kenya, Morocco, France, Turkey & more' },
    { icon: Trophy, text: 'Comprehension quizzes and a "What sound is it?" game' },
    { icon: BarChart3, text: 'Progress tracking so parents can see growth' },
    { icon: CheckCircle2, text: 'Aligned with the UK Year 1 Phonics Screening Check' },
  ];

  return (
    <section className="py-14 md:py-20">
      <div ref={r.ref} className={`max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Everything your child needs to{' '}
              <span className="text-primary">love reading</span>
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Built by phonics experts, designed for real children. Every book uses only sounds your child has learned — so they succeed from the very first page.
            </p>
            <div className="mt-8 space-y-4">
              {features.map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <f.icon className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-foreground leading-relaxed">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative flex justify-center">
            <div className="w-64 md:w-72 bg-foreground rounded-[2.5rem] p-3 shadow-2xl rotate-2">
              <div className="bg-card rounded-[2rem] overflow-hidden">
                <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">M</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">The Fish in the Tank</span>
                </div>
                <img src="/illustrations/1_3/page1.png" alt="Interactive reading" className="w-full aspect-[4/3] object-cover" loading="lazy" decoding="async" />
                <div className="px-4 py-3 space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {['A', 'big', 'fish', 'is', 'in', 'the', 'tank!'].map(w => (
                      <span key={w} className="text-sm font-bold text-foreground bg-primary/5 px-2 py-0.5 rounded-lg" style={{ fontFamily: "'Andika', sans-serif" }}>
                        {w}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Volume2 className="w-3 h-3" /> Tap a word to hear it
                  </div>
                </div>
              </div>
            </div>
            {/* Print sticker — the second half of "read OR print" */}
            <span
              className="absolute -bottom-3 right-2 sm:right-10 rounded-full bg-white px-4 py-2 text-xs font-extrabold -rotate-3 text-emerald-700 inline-flex items-center gap-1.5"
              style={{ boxShadow: STICKER, border: '2px solid #fff', outline: '2px solid #22C55E40' }}
            >
              <Printer className="w-3.5 h-3.5" /> …or print it as a booklet
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing({ onFree, onFull }: { onFree: () => void; onFull: () => void }) {
  const r = useReveal();

  return (
    <section className="py-14 md:py-20 bg-card">
      <div ref={r.ref} className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Simple, fair pricing</h2>
          <p className="mt-3 text-muted-foreground text-lg">Start free. Go unlimited from £4.99.</p>
        </div>

        <div className="grid sm:grid-cols-3 gap-5">
          {/* Free */}
          <div className="bg-background rounded-[2rem] p-6 flex flex-col" style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}>
            <h3 className="font-display text-lg font-extrabold text-foreground">Free</h3>
            <div className="mt-2 mb-5"><span className="font-display text-4xl font-extrabold text-foreground">£0</span></div>
            <ul className="space-y-3 mb-6 flex-1">
              {['Free phonics assessment', '6 free books to read & download', 'Interactive tap-to-hear reading', 'Progress tracking'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--level-3))] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={onFree} className="w-full py-3 rounded-2xl border-2 border-primary text-primary font-display font-extrabold text-sm hover:bg-primary/5 transition-colors">
              Get started free
            </button>
          </div>

          {/* Monthly */}
          <div className="bg-background rounded-[2rem] p-6 flex flex-col" style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}>
            <h3 className="font-display text-lg font-extrabold text-foreground">Monthly</h3>
            <div className="mt-2 mb-5">
              <span className="font-display text-4xl font-extrabold text-foreground">£4.99</span>
              <span className="text-sm text-muted-foreground font-semibold">/mo</span>
            </div>
            <ul className="space-y-3 mb-6 flex-1">
              {['All 33 books across 8 levels', 'All comprehension quizzes', 'Full progress dashboard', 'New books added regularly', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={onFull} className="w-full py-3 rounded-2xl border-2 border-primary text-primary font-display font-extrabold text-sm hover:bg-primary/5 transition-colors">
              Start monthly
            </button>
          </div>

          {/* Yearly */}
          <div className="relative bg-background rounded-[2rem] p-6 flex flex-col" style={{ boxShadow: STICKER, border: `2px solid ${PINK}`, outline: `4px solid ${PINK}20` }}>
            <span
              className="absolute -top-3 right-5 rounded-full bg-white px-3 py-1 text-[11px] font-extrabold rotate-2 text-primary-ink"
              style={{ boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${PINK}40` }}
            >
              Best value
            </span>
            <h3 className="font-display text-lg font-extrabold text-foreground">Yearly</h3>
            <div className="mt-2 mb-1">
              <span className="font-display text-4xl font-extrabold text-foreground">£29.99</span>
              <span className="text-sm text-muted-foreground font-semibold">/yr</span>
            </div>
            <p className="text-xs font-bold text-primary-ink mb-4">Save 50% — under £2.50/mo</p>
            <ul className="space-y-3 mb-6 flex-1">
              {['Everything in Monthly', 'All 8 levels, all books', 'All comprehension quizzes', 'New books added regularly', 'Cancel anytime'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={onFull}
              className="w-full py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
              style={{ background: PINK, boxShadow: `0 4px 0 ${PINK_INK}` }}
            >
              Start yearly
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Or <Link to="/pricing" className="font-bold text-primary-ink hover:underline">£39 lifetime</Link> — everything, forever, one payment.
        </p>
      </div>
    </section>
  );
}

/* ─── FOOTER CTA ─── */
function FooterCTA({ onBrowse, onAssess }: { onBrowse: () => void; onAssess: () => void }) {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-gradient-to-br from-primary/10 via-background to-[hsl(var(--level-5))]/10 rounded-[2.5rem] p-10 md:p-14 border border-primary/20">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            The first books are already open.
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Have a look around — and when you're ready, a free 3-minute check finds your child's exact level.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <PushButton onClick={onBrowse}>
              <BookOpen className="w-5 h-5" /> Explore the books
            </PushButton>
            <PushButton onClick={onAssess} tone="white">
              Check their level <ChevronRight className="w-4 h-4" />
            </PushButton>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  const navigate = useNavigate();
  return (
    <footer className="border-t border-indigo-100 py-8 bg-gradient-to-b from-card to-indigo-50/40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <img src="/logo/mpb-mark-transparent.png" alt="" className="w-8 h-8 object-contain" draggable={false} />
          <span className="font-display text-sm font-bold text-foreground">MyPhonicsBooks</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <Link to="/love" className="hover:text-trust-ink transition-colors">Wall of Love</Link>
          <a href="/privacy" className="hover:text-trust-ink transition-colors">Privacy</a>
          <a href="/terms" className="hover:text-trust-ink transition-colors">Terms</a>
          <a href="mailto:hello@myphonicsbooks.co.uk" className="hover:text-trust-ink transition-colors">Contact</a>
          <button
            onClick={() => navigate('/admin')}
            className="hover:text-foreground transition-colors"
            aria-label="Admin"
          >
            Admin
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Made with care in the UK</p>
      </div>
    </footer>
  );
}
