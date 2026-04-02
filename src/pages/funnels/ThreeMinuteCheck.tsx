import { Clock, Sparkles, Check } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import EmailCapture from '@/components/funnels/EmailCapture';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/';

export default function ThreeMinuteCheck() {
  useFunnelTracker();
  const handleSuccess = () => {
    window.location.href = HUB_URL;
  };

  return (
    <FunnelLayout>
      <div className="max-w-lg mx-auto text-center pt-8 sm:pt-12 mb-8">
        {/* Big number hook */}
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-[hsl(var(--primary))] to-rose-500 rounded-full flex items-center justify-center shadow-xl shadow-pink-500/30 animate-in zoom-in duration-500">
          <span className="text-4xl font-bold text-white">3</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
            3 minutes
          </span>{' '}
          to find their exact reading level
        </h1>

        <p className="text-lg text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          Stop guessing. Get a clear answer and free resources matched to them.
        </p>
      </div>

      {/* Steps */}
      <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-5">
          <div className="space-y-4">
            {[
              { step: '1', text: 'Quick assessment checks which sounds they know', icon: Clock },
              { step: '2', text: 'Get their exact level (1-6) instantly', icon: Sparkles },
              { step: '3', text: 'Access free books matched to their level', icon: Check },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-50 text-[hsl(var(--primary))] rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                  {item.step}
                </div>
                <p className="text-sm text-muted-foreground pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <EmailCapture source="3-minute-check" onSuccess={handleSuccess} buttonText="Check Their Level" />
    </FunnelLayout>
  );
}
