import { Unlock, ArrowRight, Clock } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

const LEVEL_COLOURS: Record<number, string> = {
  1: '#E84B8A', 2: '#F5A623', 3: '#4ABD6D',
  4: '#5B9EFF', 5: '#A78EFF', 6: '#2B8A6E',
};

interface MonthlyDownsellProps {
  childName: string;
  level: number;
  onAccept: () => void;
  onDecline: () => void;
}

export default function MonthlyDownsell({ childName, level, onAccept, onDecline }: MonthlyDownsellProps) {
  const { t } = useTranslation('funnels');
  const colour = LEVEL_COLOURS[level] || '#E84B8A';

  return (
    <div className="max-w-md mx-auto pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-6 sm:p-8 text-center">
        <div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-lg animate-in zoom-in duration-300"
          style={{ backgroundColor: colour }}
        >
          <Unlock size={28} />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
          {t('monthlyDownsell.title')}
        </h1>

        <p className="text-muted-foreground mb-6">
          <Trans t={t} i18nKey="monthlyDownsell.body" components={{ b: <strong /> }} />
        </p>

        {/* Price highlight */}
        <div className="rounded-xl p-5 mb-6 bg-gradient-to-br from-pink-50 to-amber-50 border border-pink-100">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock size={18} className="text-[hsl(var(--primary))]" />
            <span className="text-sm font-semibold text-[hsl(var(--primary))]">{t('monthlyDownsell.monthlyAccess')}</span>
          </div>
          <p className="text-3xl font-bold text-foreground">
            &pound;4.99<span className="text-base text-muted-foreground font-normal">{t('monthlyDownsell.perMonth')}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {t('monthlyDownsell.allLevels')}
          </p>
        </div>

        <ul className="text-start space-y-2 mb-6 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span style={{ color: colour }}>&#10003;</span>
            {t('monthlyDownsell.benefitEveryBook')}
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: colour }}>&#10003;</span>
            {t('monthlyDownsell.benefitNewBooks')}
          </li>
          <li className="flex items-center gap-2">
            <span style={{ color: colour }}>&#10003;</span>
            {childName
              ? t('monthlyDownsell.benefitMoveUpNamed', { name: childName })
              : t('monthlyDownsell.benefitMoveUpAnon')}
          </li>
        </ul>

        {/* Accept */}
        <button
          onClick={onAccept}
          className="w-full py-4 bg-gradient-to-r from-[hsl(var(--primary))] to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mb-4"
        >
          {t('monthlyDownsell.accept')}
          <ArrowRight size={20} className="rtl:-scale-x-100" />
        </button>

        {/* Decline */}
        <button
          onClick={onDecline}
          className="w-full py-3 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          {t('monthlyDownsell.decline')}
        </button>
      </div>
    </div>
  );
}
