import { Check } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import EmailCapture from '@/components/funnels/EmailCapture';
import { useTranslation, Trans } from 'react-i18next';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/';

export default function TheGap() {
  useFunnelTracker();
  const { t } = useTranslation('funnels');
  const handleSuccess = () => {
    window.location.href = HUB_URL;
  };

  return (
    <FunnelLayout>
      <div className="max-w-lg mx-auto text-center pt-8 sm:pt-12 mb-8">
        {/* Split visual */}
        <div className="flex items-center justify-center gap-4 mb-8 animate-in fade-in duration-500">
          <div className="w-20 h-28 rounded-lg bg-slate-200 flex items-center justify-center border-2 border-slate-300 animate-in slide-in-from-left duration-500">
            <span className="text-xs text-slate-400 font-semibold text-center px-1">{t('theGap.boring')}</span>
          </div>

          <div className="text-2xl font-bold text-slate-300 animate-in zoom-in duration-500 delay-200">
            {t('theGap.vs')}
          </div>

          <div className="w-20 h-28 rounded-lg bg-red-100 flex items-center justify-center border-2 border-red-200 animate-in slide-in-from-right duration-500">
            <span className="text-xs text-red-400 font-semibold text-center px-1">{t('theGap.tooHard')}</span>
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <Trans
            t={t}
            i18nKey="theGap.title"
            components={{ em: <em />, br: <br />, hl: <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500" /> }}
          />
        </h1>

        <p className="text-xl font-semibold text-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          {t('theGap.whyBoth')}
        </p>

        <p className="text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          {t('theGap.body')}
        </p>
      </div>

      {/* Differentiators */}
      <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
        <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-5">
          <p className="text-sm font-semibold text-foreground mb-3">{t('theGap.diffTitle')}</p>
          <ul className="space-y-2">
            {[
              t('theGap.diffDecodable'),
              t('theGap.diffStories'),
              t('theGap.diffCultures'),
              t('theGap.diffCurriculum'),
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check size={16} className="text-[hsl(var(--primary))] shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <EmailCapture source="the-gap" onSuccess={handleSuccess} buttonText={t('theGap.button')} />
    </FunnelLayout>
  );
}
