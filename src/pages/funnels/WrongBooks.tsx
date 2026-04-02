import { useState } from 'react';
import { AlertTriangle, Check } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import EmailCapture from '@/components/funnels/EmailCapture';
import QuickScreening from '@/components/funnels/QuickScreening';
import AssessmentResult from './AssessmentResult';
import BundleUpsell from './BundleUpsell';
import MonthlyDownsell from './MonthlyDownsell';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/';

type Step = 'landing' | 'assessment' | 'result' | 'upsell' | 'downsell';

export default function WrongBooks() {
  useFunnelTracker();
  const [step, setStep] = useState<Step>('landing');
  const [childName, setChildName] = useState('');
  const [level, setLevel] = useState(1);

  const handleEmailSuccess = ({ childName: name }: { childName: string; email: string }) => {
    setChildName(name);
    setStep('assessment');
  };

  const handleAssessmentComplete = (resultLevel: number) => {
    setLevel(resultLevel);
    setStep('result');
  };

  const goToHub = () => { window.location.href = HUB_URL; };

  return (
    <FunnelLayout>
      {step === 'landing' && (
        <>
          {/* Hero */}
          <div className="max-w-lg mx-auto text-center pt-8 sm:pt-12 mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-2xl flex items-center justify-center animate-in zoom-in duration-300">
              <AlertTriangle size={32} className="text-red-500" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              Wrong books{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
                kill confidence
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Too hard = frustration. Too easy = boredom.
            </p>

            <p className="text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              Find their exact level in 3 minutes and unlock a free book matched to what they can actually read.
            </p>
          </div>

          {/* What they get */}
          <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-3">What you'll get:</p>
              <ul className="space-y-2">
                {['Quick phonics screening (6 words)', '1 free interactive book at their level', 'Based on UK phonics curriculum'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-[hsl(var(--primary))] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <EmailCapture source="wrong-books" onSuccess={handleEmailSuccess} buttonText="Find Their Level" />
        </>
      )}

      {step === 'assessment' && (
        <QuickScreening
          childName={childName}
          onComplete={handleAssessmentComplete}
          onBack={() => setStep('landing')}
        />
      )}

      {step === 'result' && (
        <AssessmentResult childName={childName} level={level} onContinue={() => setStep('upsell')} />
      )}

      {step === 'upsell' && (
        <BundleUpsell childName={childName} level={level} onAccept={goToHub} onDecline={() => setStep('downsell')} />
      )}

      {step === 'downsell' && (
        <MonthlyDownsell childName={childName} level={level} onAccept={goToHub} onDecline={goToHub} />
      )}
    </FunnelLayout>
  );
}
