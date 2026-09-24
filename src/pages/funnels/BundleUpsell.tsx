import { Check, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LEVEL_COLOUR: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D',
  4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

// One representative cover per level — the first book in each progression.
// Stored under /public/covers/{level}_{sub}_cover.jpg.
// `title` is the English book title (never translated); the alt text around
// it is built at render time with t('bundleUpsell.coverAlt').
const LEVEL_COVERS: { level: number; src: string; title: string }[] = [
  { level: 1, src: '/covers/1_1_cover.jpg', title: 'Tap! Tap! Tap!' },
  { level: 2, src: '/covers/2_1_cover.jpg', title: 'The Night Light' },
  { level: 3, src: '/covers/3_1_cover.jpg', title: 'The Big Bike Race' },
  { level: 4, src: '/covers/4_1_cover.jpg', title: 'The Purple Purse' },
  { level: 5, src: '/covers/5_1_cover.jpg', title: 'Before the Shore' },
  { level: 6, src: '/covers/6_1_cover.jpg', title: 'My Marvellous Home' },
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
  const { t } = useTranslation('funnels');
  const accent = LEVEL_COLOUR[level] || LEVEL_COLOUR[1];

  const benefits = [
    t('bundleUpsell.benefitAllBooks', { count: ALL_BOOKS_TOTAL }),
    t('bundleUpsell.benefitQuizzes'),
    t('bundleUpsell.benefitProgress'),
    t('bundleUpsell.benefitForever'),
    t('bundleUpsell.benefitWorld'),
  ];

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        {/* Real cover grid — one per level so parents see what's actually
            inside the bundle. The child's current level is highlighted with
            a coloured ring so the upgrade story is "you're here → all this". */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {LEVEL_COVERS.map(({ level: lv, src, title }) => (
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
                alt={t('bundleUpsell.coverAlt', { level: lv, title })}
                className="w-full aspect-[3/4] object-cover"
                loading="lazy"
              />
              <div
                dir="ltr"
                className="absolute top-1 start-1 text-[10px] font-extrabold text-white px-1.5 py-0.5 rounded shadow"
                style={{ backgroundColor: LEVEL_COLOUR[lv] }}
              >
                L{lv}
              </div>
            </div>
          ))}
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-foreground mb-2">
          {t('bundleUpsell.title')}
        </h1>

        <p className="text-muted-foreground text-sm mb-1">
          {childName
            ? t('bundleUpsell.subtitleNamed', { count: ALL_BOOKS_TOTAL, name: childName })
            : t('bundleUpsell.subtitleAnon', { count: ALL_BOOKS_TOTAL })}
        </p>

        {/* Price */}
        <div className="my-6">
          <span className="text-4xl font-extrabold" style={{ color: accent }}>
            &pound;{ALL_BOOKS_PRICE}
          </span>
          <span className="text-muted-foreground text-sm ms-2">{t('bundleUpsell.oneTime')}</span>
        </div>

        {/* Benefits */}
        <ul className="text-start space-y-3 mb-8">
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
          {t('bundleUpsell.accept', { price: ALL_BOOKS_PRICE })}
          <ArrowRight size={20} className="rtl:-scale-x-100" />
        </button>

        {/* Decline */}
        <button
          onClick={onDecline}
          className="w-full py-3 text-muted-foreground hover:text-foreground text-sm font-semibold transition-colors"
        >
          {t('bundleUpsell.decline')}
        </button>
      </div>
    </div>
  );
}
