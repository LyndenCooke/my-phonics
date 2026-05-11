import { Check, ArrowRight } from 'lucide-react';

const LEVEL_COLOUR: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D',
  4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

// One representative cover per level — the first book in each progression.
// Stored under /public/covers/{level}_{sub}_cover.jpg.
const LEVEL_COVERS: { level: number; src: string; alt: string }[] = [
  { level: 1, src: '/covers/1_1_cover.jpg', alt: 'Level 1 — Tap! Tap! Tap!' },
  { level: 2, src: '/covers/2_1_cover.jpg', alt: 'Level 2 — The Night Light' },
  { level: 3, src: '/covers/3_1_cover.jpg', alt: 'Level 3 — The Big Bike Race' },
  { level: 4, src: '/covers/4_1_cover.jpg', alt: 'Level 4 — The Purple Purse' },
  { level: 5, src: '/covers/5_1_cover.jpg', alt: 'Level 5 — Before the Shore' },
  { level: 6, src: '/covers/6_1_cover.jpg', alt: 'Level 6 — My Marvellous Home' },
];

const ALL_BOOKS_PRICE = '49.99';
const ALL_BOOKS_TOTAL = 32;

interface BundleUpsellProps {
  childName: string;
  /** The child's assessed level — used only for the celebration accent colour. */
  level: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function BundleUpsell({ childName, level, onAccept, onDecline }: BundleUpsellProps) {
  const accent = LEVEL_COLOUR[level] || LEVEL_COLOUR[1];

  const benefits = [
    `All ${ALL_BOOKS_TOTAL} interactive books across all 6 levels`,
    'Comprehension quizzes after every story',
    'Progress tracking across the whole library',
    'Yours forever — no subscription',
    'Stories from around the world',
  ];

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        {/* Real cover grid — one per level so parents see what's actually
            inside the bundle. The child's current level is highlighted with
            a coloured ring so the upgrade story is "you're here → all this". */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {LEVEL_COVERS.map(({ level: lv, src, alt }) => (
            <div
              key={lv}
              className="relative rounded-lg overflow-hidden bg-white shadow-md"
              style={{
                outline: lv === level ? `3px solid ${accent}` : '1px solid rgba(0,0,0,0.06)',
                outlineOffset: lv === level ? '1px' : '0',
              }}
            >
              <img
                src={src}
                alt={alt}
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
              />
              <div
                className="absolute top-1 left-1 text-[10px] font-extrabold text-white px-1.5 py-0.5 rounded shadow"
                style={{ backgroundColor: LEVEL_COLOUR[lv] }}
              >
                L{lv}
              </div>
            </div>
          ))}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
          Want to unlock all the books?
        </h1>

        <p className="text-muted-foreground text-sm mb-1">
          {ALL_BOOKS_TOTAL} books, every level — for {childName || 'your child'} to grow into.
        </p>

        {/* Price */}
        <div className="my-6">
          <span className="text-4xl font-extrabold" style={{ color: accent }}>
            &pound;{ALL_BOOKS_PRICE}
          </span>
          <span className="text-muted-foreground text-sm ml-2">one-time</span>
        </div>

        {/* Benefits */}
        <ul className="text-left space-y-3 mb-8">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
              <Check size={18} className="shrink-0 mt-0.5" style={{ color: accent }} />
              {benefit}
            </li>
          ))}
        </ul>

        {/* Accept */}
        <button
          onClick={onAccept}
          className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
        >
          Yes — unlock all books &pound;{ALL_BOOKS_PRICE}
          <ArrowRight size={20} />
        </button>

        {/* Decline */}
        <button
          onClick={onDecline}
          className="w-full py-3 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
        >
          No thanks, just give me my free book
        </button>
      </div>
    </div>
  );
}
