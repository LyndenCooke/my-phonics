import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Sparkles, Globe, BarChart3, CheckCircle2, Star, ChevronRight, X, Volume2, Trophy, Users, GraduationCap } from 'lucide-react';
import { LEVELS } from '@/lib/types';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';

/* ─── Book cover data for hero carousel ─── */
const SHOWCASE_BOOKS = [
  { key: '1_1', title: 'Tap! Tap! Tap!', level: 1 },
  { key: '2_1', title: 'The Night Light', level: 2 },
  { key: '3_1', title: 'The Big Bike Race', level: 3 },
  { key: '4_1', title: 'The Purple Purse', level: 4 },
  { key: '5_1', title: 'Before the Shore', level: 5 },
  { key: '6_1', title: 'The Marvellous Neighbourhood', level: 6 },
  { key: '1_3', title: 'The Fish in the Tank', level: 1 },
  { key: '2_3', title: 'Morning on the Farm', level: 2 },
];

const LEVEL_COLORS: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D', 4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

const LEVEL_EXAMPLES: Record<number, string> = {
  1: 's, a, t, p, sh, ch, th',
  2: 'ay, ee, igh, oo, ar, or',
  3: 'a-e, i-e, o-e, ea, oi',
  4: 'ur, er, ew, ue, ow',
  5: 'ore, ire, ear, ure, tion',
  6: '-ous, -able, -ible, -cious',
};

const BOOK_COUNTS: Record<number, number> = { 1: 10, 2: 5, 3: 5, 4: 4, 5: 4, 6: 4 };

const CULTURAL_COVERS = [
  { key: '2_1', country: 'Japan' },
  { key: '2_3', country: 'Kenya' },
  { key: '3_2', country: 'Morocco' },
  { key: '3_1', country: 'France' },
  { key: '4_1', country: 'Turkey' },
  { key: '4_3', country: 'Mexico' },
  { key: '5_1', country: 'London' },
  { key: '6_1', country: 'Egypt' },
];

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

/* ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  useFunnelTracker();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem('mpb_seen_welcome');
    if (!seen) {
      const t = setTimeout(() => setShowWelcome(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('mpb_seen_welcome', '1');
  };

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* ── Welcome popup ── */}
      {showWelcome && <WelcomePopup onDismiss={dismissWelcome} onAction={() => { dismissWelcome(); navigate('/assess'); }} />}

      {/* ── Sticky nav ── */}
      <NavBar onSignIn={() => navigate('/auth')} onAssess={() => navigate('/assess')} />

      {/* ── Sections ── */}
      <HeroSection onAssess={() => navigate('/assess')} onTry={() => navigate('/auth')} />
      <HowItWorks />
      <FeatureShowcase />
      <LevelProgression />
      <CulturalDiversity />
      <Testimonials />
      <Pricing onFree={() => navigate('/auth')} onFull={() => navigate('/shop')} />
      <FooterCTA onAssess={() => navigate('/assess')} />
      <Footer />
    </div>
  );
}

/* ─── NAV BAR ─── */
function NavBar({ onSignIn, onAssess }: { onSignIn: () => void; onAssess: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-card/95 backdrop-blur-xl shadow-card border-b border-border' : 'bg-transparent'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] gradient-primary flex items-center justify-center shadow-button">
            <span className="text-white font-extrabold text-sm">M</span>
          </div>
          <span className="text-lg font-extrabold text-foreground tracking-tight">
            My<span className="text-primary">Phonics</span>Books
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onSignIn} className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-2">
            Sign In
          </button>
          <button onClick={onAssess} className="text-sm font-bold text-white gradient-primary px-4 py-2 rounded-xl shadow-button hover:opacity-90 transition-opacity">
            Free Assessment
          </button>
        </div>
      </div>
    </header>
  );
}

/* ─── HERO ─── */
function HeroSection({ onAssess, onTry }: { onAssess: () => void; onTry: () => void }) {
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
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" /> UK Phonics Curriculum Aligned
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">
              Learn to Read with{' '}
              <span className="text-primary">Beautiful</span>{' '}
              Phonics Books
            </h1>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
              Personalised decodable books for children aged 4-8, with interactive reading, sound-by-sound guidance, and stories from around the world.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <button onClick={onAssess} className="gradient-primary text-white font-bold px-7 py-3.5 rounded-2xl shadow-button hover:opacity-90 transition-all text-base flex items-center justify-center gap-2">
                Start Free Assessment <ChevronRight className="w-4 h-4" />
              </button>
              <button onClick={onTry} className="bg-card text-foreground font-bold px-7 py-3.5 rounded-2xl shadow-card hover:shadow-card-hover transition-all text-base border border-border">
                Try a Free Book
              </button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No credit card required. 2 free books included.</p>
          </div>

          {/* Book carousel */}
          <div className="relative h-[420px] md:h-[480px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-4 -rotate-3">
                {SHOWCASE_BOOKS.map((b, i) => (
                  <div
                    key={b.key}
                    className="w-32 md:w-40 rounded-2xl overflow-hidden shadow-card-hover transform transition-transform hover:scale-105 hover:-rotate-2"
                    style={{ animation: 'float 3s ease-in-out infinite', animationDelay: `${i * 0.4}s` }}
                  >
                    <img src={`/illustrations/${b.key}/cover.png`} alt={b.title} className="w-full aspect-[3/4] object-cover" style={{ imageRendering: 'auto' }} loading="eager" draggable={false} />
                    <div className="px-2 py-1.5 bg-card">
                      <div className="w-full h-1 rounded-full" style={{ backgroundColor: LEVEL_COLORS[b.level] }} />
                    </div>
                  </div>
                ))}
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

/* ─── HOW IT WORKS ─── */
function HowItWorks() {
  const r = useReveal();
  const steps = [
    { icon: GraduationCap, title: 'Take the Free Assessment', desc: 'A child-friendly quiz finds their exact reading level in under 5 minutes.', color: 'bg-primary/10 text-primary' },
    { icon: BookOpen, title: 'Get Matched Books', desc: 'Phonics books at exactly the right difficulty — every word is carefully chosen.', color: 'bg-[hsl(var(--level-3))]/10 text-[hsl(var(--level-3))]' },
    { icon: Volume2, title: 'Read & Learn', desc: 'Tap any word to hear it sounded out. Track progress. Build confidence.', color: 'bg-[hsl(var(--level-4))]/10 text-[hsl(var(--level-4))]' },
  ];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div ref={r.ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">How It Works</h2>
          <p className="mt-3 text-muted-foreground text-lg">Three simple steps to confident reading</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="relative bg-background rounded-2xl p-6 text-center border border-border hover:shadow-card-hover transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-white text-xs font-bold">{i + 1}</span>
              </div>
              <div className={`w-14 h-14 rounded-2xl ${s.color} flex items-center justify-center mx-auto mt-3 mb-4`}>
                <s.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
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
    { icon: BookOpen, text: '32 books across 6 carefully graded reading levels' },
    { icon: Globe, text: 'Stories set in Japan, Kenya, Morocco, France, Turkey & more' },
    { icon: Trophy, text: 'Comprehension quizzes and nonsense word challenges' },
    { icon: BarChart3, text: 'Progress tracking so parents can see growth' },
    { icon: CheckCircle2, text: 'Aligned with the UK Year 1 Phonics Screening Check' },
  ];

  return (
    <section className="py-16 md:py-24">
      <div ref={r.ref} className={`max-w-6xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              Everything Your Child Needs to{' '}
              <span className="text-primary">Love Reading</span>
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
            <div className="w-64 md:w-72 bg-foreground rounded-[2.5rem] p-3 shadow-2xl">
              <div className="bg-card rounded-[2rem] overflow-hidden">
                <div className="bg-primary/10 px-4 py-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md gradient-primary flex items-center justify-center">
                    <span className="text-white text-[8px] font-bold">M</span>
                  </div>
                  <span className="text-xs font-bold text-foreground">The Fish in the Tank</span>
                </div>
                <img src="/illustrations/1_3/page1.png" alt="Interactive reading" className="w-full aspect-[4/3] object-cover" />
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
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── LEVEL PROGRESSION ─── */
function LevelProgression() {
  const r = useReveal();

  return (
    <section className="py-16 md:py-24 bg-card">
      <div ref={r.ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">6 Levels, One Clear Path</h2>
          <p className="mt-3 text-muted-foreground text-lg">From first sounds to confident reading</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {LEVELS.map(lv => (
            <div key={lv.level} className="relative bg-background rounded-2xl p-5 border border-border hover:shadow-card-hover transition-shadow overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: LEVEL_COLORS[lv.level] }} />
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm" style={{ backgroundColor: LEVEL_COLORS[lv.level] }}>
                  {lv.level}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">{lv.name}</h3>
                  <p className="text-xs text-muted-foreground">{lv.ageRange}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">Sounds:</span> {LEVEL_EXAMPLES[lv.level]}
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{BOOK_COUNTS[lv.level]} books</span> in this level
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CULTURAL DIVERSITY ─── */
function CulturalDiversity() {
  const r = useReveal();

  return (
    <section className="py-16 md:py-24">
      <div ref={r.ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Every Book Is a{' '}
            <span className="text-primary">Window Into the World</span>
          </h2>
          <p className="mt-3 text-muted-foreground text-lg max-w-2xl mx-auto">
            Simple phonics text, rich cultural settings. Each story transports your child to a different country — sparking curiosity about the people and places they share the world with.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {CULTURAL_COVERS.map(c => (
            <div key={c.key} className="group relative rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all">
              <img src={`/illustrations/${c.key}/cover.png`} alt={c.country} className="w-full aspect-[3/4] object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent pt-10 pb-3 px-3">
                <p className="text-white text-sm font-bold">{c.country}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TESTIMONIALS ─── */
function Testimonials() {
  const r = useReveal();
  const reviews = [
    { name: 'Sarah M.', child: 'Mum of Amira, age 5', text: "She went from sounding out single letters to reading whole sentences in just three weeks. The interactive tap-to-hear feature is brilliant.", stars: 5 },
    { name: 'James K.', child: 'Dad of Oliver, age 6', text: "Finally a phonics app that actually follows the school curriculum. Oliver's teacher noticed the improvement straight away.", stars: 5 },
    { name: 'Priya S.', child: 'Mum of Zara, age 4', text: "My daughter loves the stories from different countries. She asks me to read 'the Morocco one' every night. Beautiful illustrations too.", stars: 5 },
  ];

  return (
    <section className="py-16 md:py-24 bg-card">
      <div ref={r.ref} className={`max-w-5xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Parents Love It</h2>
          <p className="mt-3 text-muted-foreground text-lg">Real families, real reading progress</p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {reviews.map((rev, i) => (
            <div key={i} className="bg-background rounded-2xl p-6 border border-border">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: rev.stars }).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">"{rev.text}"</p>
              <div>
                <p className="text-sm font-bold text-foreground">{rev.name}</p>
                <p className="text-xs text-muted-foreground">{rev.child}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PRICING ─── */
function Pricing({ onFree, onFull }: { onFree: () => void; onFull: () => void }) {
  const r = useReveal();

  return (
    <section className="py-16 md:py-24">
      <div ref={r.ref} className={`max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ${r.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">Simple, Fair Pricing</h2>
          <p className="mt-3 text-muted-foreground text-lg">Start free. Upgrade when you're ready.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free */}
          <div className="bg-card rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-bold text-foreground">Free Starter</h3>
            <div className="mt-2 mb-5">
              <span className="text-4xl font-extrabold text-foreground">Free</span>
            </div>
            <ul className="space-y-3 mb-6">
              {['Full phonics assessment', '2 Level 1 sample books', 'Interactive reading', 'Progress tracking'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-[hsl(var(--level-3))] shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={onFree} className="w-full py-3 rounded-xl border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-colors">
              Get Started Free
            </button>
          </div>

          {/* Full */}
          <div className="bg-card rounded-2xl p-6 border-2 border-primary relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl">
              BEST VALUE
            </div>
            <h3 className="text-lg font-bold text-foreground">Full Access</h3>
            <div className="mt-2 mb-5">
              <span className="text-4xl font-extrabold text-foreground">All Levels</span>
            </div>
            <ul className="space-y-3 mb-6">
              {['All 32 books across 6 levels', 'All comprehension quizzes', 'Full progress dashboard', 'New books added regularly', 'Certificate on completion'].map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <button onClick={onFull} className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-button hover:opacity-90 transition-opacity">
              View Pricing
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER CTA ─── */
function FooterCTA({ onAssess }: { onAssess: () => void }) {
  return (
    <section className="py-16 md:py-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <div className="bg-gradient-to-br from-primary/10 via-background to-[hsl(var(--level-5))]/10 rounded-3xl p-10 md:p-14 border border-primary/20">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Ready to Start Your Child's Reading Journey?
          </h2>
          <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
            Our free assessment takes less than 5 minutes and tells you exactly where to begin.
          </p>
          <button onClick={onAssess} className="mt-8 gradient-primary text-white font-bold px-8 py-4 rounded-2xl shadow-button hover:opacity-90 transition-all text-base inline-flex items-center gap-2">
            Start Free Assessment <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  return (
    <footer className="border-t border-border py-8 bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-sm font-bold text-foreground">MyPhonicsBooks</span>
        </div>
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <span>Privacy</span>
          <span>Terms</span>
          <span>Contact</span>
        </div>
        <p className="text-xs text-muted-foreground">Made with care in the UK</p>
      </div>
    </footer>
  );
}

/* ─── WELCOME POPUP ─── */
function WelcomePopup({ onDismiss, onAction }: { onDismiss: () => void; onAction: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { icon: BookOpen, title: 'Welcome to MyPhonicsBooks!', desc: 'Beautiful decodable books that help your child learn to read — the right way.' },
    { icon: Volume2, title: 'Interactive Reading', desc: 'Your child taps any word to hear it sounded out, phoneme by phoneme. Learning happens naturally.' },
    { icon: Sparkles, title: 'Find Their Level', desc: 'Take our free 5-minute assessment. We will match your child with books at exactly the right difficulty.' },
  ];
  const slide = slides[step];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 px-4">
      <div className="bg-card rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300">
        <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
            <slide.icon className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-extrabold text-foreground">{slide.title}</h3>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{slide.desc}</p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mt-6">
          {slides.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full transition-all ${i === step ? 'bg-primary w-6' : 'bg-border'}`} />
          ))}
        </div>

        <div className="mt-6">
          {step < slides.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-button hover:opacity-90 transition-opacity">
              Next
            </button>
          ) : (
            <button onClick={onAction} className="w-full py-3 rounded-xl gradient-primary text-white font-bold text-sm shadow-button hover:opacity-90 transition-opacity">
              Start Free Assessment
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
