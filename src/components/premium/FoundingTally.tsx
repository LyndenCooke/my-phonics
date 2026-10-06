/**
 * FoundingTally — the live "N of 500 founding spots claimed" bar. The number
 * comes straight from the database (founding_spots RPC), never a made-up
 * counter. Renders nothing until the count has loaded, or if it fails.
 */
import { useTranslation } from 'react-i18next';
import { useFoundingSpots } from '@/lib/premium';

export default function FoundingTally({ className = '' }: { className?: string }) {
  const { t } = useTranslation('premium');
  const { data: spots } = useFoundingSpots();
  if (!spots) return null;

  const pct = Math.min(100, Math.max(2, Math.round((spots.claimed / spots.total) * 100)));
  return (
    <div className={className}>
      <div className="flex items-baseline justify-between gap-3 text-xs font-bold">
        <span className="text-foreground">
          {t('tally.claimed', { claimed: spots.claimed, total: spots.total })}
        </span>
        <span className="text-primary-ink whitespace-nowrap">
          {t('tally.left', { remaining: spots.remaining })}
        </span>
      </div>
      <div
        className="mt-1.5 h-2.5 rounded-full bg-muted overflow-hidden"
        role="progressbar"
        aria-label={t('tally.aria')}
        aria-valuemin={0}
        aria-valuemax={spots.total}
        aria-valuenow={spots.claimed}
      >
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
