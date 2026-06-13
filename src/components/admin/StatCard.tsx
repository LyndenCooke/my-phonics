import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  className?: string;
}

/** Sticker shadow — same recipe as the consumer app's cards. */
const STICKER = '0 1px 2px rgba(40,30,40,0.08), 0 8px 20px rgba(40,30,40,0.08)';

export default function StatCard({ label, value, icon: Icon, trend, className }: StatCardProps) {
  return (
    <div
      className={cn('rounded-2xl bg-white', className)}
      style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.05)' }}
    >
      <div className="flex items-center gap-4 p-5">
        <div className="rounded-xl bg-primary/10 p-3">
          <Icon className="h-5 w-5 text-primary-ink" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-extrabold text-foreground tabular-nums">{value}</p>
          {trend && (
            <p className={cn('text-xs font-semibold', trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
              {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
