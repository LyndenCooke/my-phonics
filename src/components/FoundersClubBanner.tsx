/**
 * FoundersClubBanner — promotional callout for the £1 launch offer with a
 * live countdown. Two visual variants:
 *
 *   'hero'    — a big, eye-catching card meant to live near the top of the
 *               landing page hero (sets the urgency before scroll).
 *   'inline'  — a slimmer card for embedding inside Library / Child home /
 *               Profile (visible to logged-in parents without dominating).
 *
 * After the offer expires the component returns null so we don't render a
 * stale "00d 00h 00m 00s" — keeps prod clean even if we forget to remove
 * the import.
 */
import { Link } from 'react-router-dom';
import { Sparkles, Clock, Check } from 'lucide-react';
import { useCountdown, FOUNDERS_PRICE_DISPLAY } from '@/lib/foundersClub';
import { usePurchases } from '@/hooks/useBooks';

interface Props {
  variant?: 'hero' | 'inline';
  className?: string;
}

export default function FoundersClubBanner({ variant = 'hero', className = '' }: Props) {
  const c = useCountdown();
  const { data: purchases } = usePurchases();
  if (c.expired) return null;

  // Already a member — show a quiet "you're in" badge instead of nagging
  // them to buy what they already own. Skipped on the hero variant because
  // members shouldn't see launch-pitch hero copy at all.
  if (purchases?.hasFoundersClub || purchases?.hasFullBundle || purchases?.hasActiveSubscription) {
    if (variant === 'hero') return null;
    return (
      <div className={`rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-3 shadow-card flex items-center gap-3 ${className}`}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Check className="w-5 h-5" strokeWidth={3} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-tight">You're a Founder 🎉</p>
          <p className="text-[11px] text-white/85">Lifetime access unlocked. Thank you for backing us.</p>
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <Link
        to="/shop?founders=1"
        className={`block rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 text-white p-4 shadow-card hover:shadow-card-hover transition-all active:scale-[0.99] ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-extrabold text-base">Founders Club</span>
              <span className="text-xs font-bold bg-white/25 px-2 py-0.5 rounded-full">{FOUNDERS_PRICE_DISPLAY}</span>
            </div>
            <p className="text-xs text-white/85 mt-0.5">
              Lifetime access · ends in <CountdownText c={c} compact />
            </p>
          </div>
          <span className="text-xs font-bold bg-white text-fuchsia-700 px-3 py-1.5 rounded-lg">Claim →</span>
        </div>
      </Link>
    );
  }

  // hero variant
  return (
    <div className={`rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 text-white p-5 sm:p-6 shadow-card-hover ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
          <Sparkles className="w-3 h-3" /> Limited Launch Offer
        </div>
      </div>

      <h3 className="font-display text-2xl sm:text-3xl font-extrabold leading-tight">
        £1 Founders Club
      </h3>
      <p className="text-sm sm:text-base text-white/90 mt-2 leading-relaxed">
        Lifetime access to all 33 books, every assessment, all future releases.
        For our first 1,000 founding families only.
      </p>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <Clock className="w-4 h-4" />
        <span>Ends in</span>
        <CountdownChips c={c} />
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
        <Link
          to="/shop?founders=1"
          className="bg-white text-fuchsia-700 font-extrabold px-5 py-3 rounded-xl text-center shadow-button hover:shadow-card-hover active:scale-[0.97] transition-all"
        >
          Claim your £1 spot
        </Link>
        <Link
          to="/library"
          className="bg-white/15 backdrop-blur-sm border border-white/30 text-white font-bold px-5 py-3 rounded-xl text-center hover:bg-white/25 transition-all"
        >
          See what's inside
        </Link>
      </div>
    </div>
  );
}

function CountdownChips({ c }: { c: ReturnType<typeof useCountdown> }) {
  const cell = (n: number, label: string) => (
    <div className="flex flex-col items-center bg-white/15 backdrop-blur-sm rounded-lg px-2.5 py-1.5 min-w-[3rem]">
      <span className="font-display font-extrabold text-lg leading-none tabular-nums">
        {String(n).padStart(2, '0')}
      </span>
      <span className="text-[9px] uppercase tracking-wider text-white/80 mt-0.5">{label}</span>
    </div>
  );
  return (
    <div className="flex gap-1.5">
      {cell(c.days, 'days')}
      {cell(c.hours, 'hrs')}
      {cell(c.minutes, 'min')}
      {cell(c.seconds, 'sec')}
    </div>
  );
}

function CountdownText({ c, compact }: { c: ReturnType<typeof useCountdown>; compact?: boolean }) {
  if (compact) {
    if (c.days > 0) return <span className="font-bold tabular-nums">{c.days}d {c.hours}h {c.minutes}m</span>;
    return <span className="font-bold tabular-nums">{c.hours}h {c.minutes}m {String(c.seconds).padStart(2, '0')}s</span>;
  }
  return <span className="tabular-nums">{c.days}d {c.hours}h {c.minutes}m {String(c.seconds).padStart(2, '0')}s</span>;
}
