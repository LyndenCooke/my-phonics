import { BookOpen, Check, ArrowRight } from 'lucide-react';

const LEVEL_COLOUR: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D',
  4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

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
        {/* Cascading book stack — represents "all the books" */}
        <div className="relative w-44 h-48 mx-auto mb-6">
          {[
            LEVEL_COLOUR[1], LEVEL_COLOUR[2], LEVEL_COLOUR[3],
            LEVEL_COLOUR[4], LEVEL_COLOUR[5], LEVEL_COLOUR[6],
          ].map((colour, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-xl shadow-lg border-2 border-white"
              style={{
                backgroundColor: colour,
                transform: `rotate(${-10 + i * 4}deg) translateX(${i * 4}px)`,
                zIndex: i,
                opacity: 0.7 + i * 0.05,
              }}
            >
              <BookOpen
                size={26}
                className="text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
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
