import { BookOpen, Check, ArrowRight } from 'lucide-react';

const LEVEL_CONFIG: Record<number, { colour: string; name: string; books: number; price: string }> = {
  1: { colour: '#E84B8A', name: 'Starting Stories', books: 10, price: '14.99' },
  2: { colour: '#F5A623', name: 'Longer Sounds', books: 5, price: '9.99' },
  3: { colour: '#4ABD6D', name: 'New Spellings', books: 5, price: '9.99' },
  4: { colour: '#5B9EFF', name: 'Building Fluency', books: 4, price: '9.99' },
  5: { colour: '#A78EFF', name: 'Reading Together', books: 4, price: '9.99' },
  6: { colour: '#2B8A6E', name: 'Reading Champion', books: 4, price: '9.99' },
};

interface BundleUpsellProps {
  childName: string;
  level: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function BundleUpsell({ childName, level, onAccept, onDecline }: BundleUpsellProps) {
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG[1];

  const benefits = [
    `${config.books} interactive books at Level ${level}`,
    'Each book matched to their exact phonics level',
    'Comprehension quizzes after every story',
    'Progress tracking across all books',
    'Culturally diverse stories from around the world',
  ];

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        {/* Book mockup stack */}
        <div className="relative w-40 h-48 mx-auto mb-6">
          {[...Array(Math.min(config.books, 5))].map((_, i) => (
            <div
              key={i}
              className="absolute inset-0 rounded-xl shadow-lg border-2 border-white"
              style={{
                backgroundColor: config.colour,
                transform: `rotate(${-8 + i * 4}deg) translateX(${i * 4}px)`,
                zIndex: i,
                opacity: 0.6 + i * 0.1,
              }}
            >
              <BookOpen
                size={24}
                className="text-white/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              />
            </div>
          ))}
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          Unlock the full Level {level} bundle
        </h1>

        <p className="text-muted-foreground mb-1">
          {config.books} books for {childName || 'your child'} to read right now
        </p>

        {/* Price */}
        <div className="my-6">
          <span className="text-4xl font-bold" style={{ color: config.colour }}>
            &pound;{config.price}
          </span>
          <span className="text-muted-foreground text-sm ml-2">one-time</span>
        </div>

        {/* Benefits */}
        <ul className="text-left space-y-3 mb-8">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-foreground/80">
              <Check size={18} className="shrink-0 mt-0.5" style={{ color: config.colour }} />
              {benefit}
            </li>
          ))}
        </ul>

        {/* Accept */}
        <button
          onClick={onAccept}
          className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
        >
          Get the Bundle &mdash; &pound;{config.price}
          <ArrowRight size={20} />
        </button>

        {/* Decline */}
        <button
          onClick={onDecline}
          className="w-full py-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          No thanks, give me my free book
        </button>
      </div>
    </div>
  );
}
