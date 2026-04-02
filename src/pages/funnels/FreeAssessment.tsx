import { useState } from 'react';
import { HelpCircle, Check } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import EmailCapture from '@/components/funnels/EmailCapture';
import QuickScreening from '@/components/funnels/QuickScreening';
import AssessmentResult from './AssessmentResult';
import BundleUpsell from './BundleUpsell';
import MonthlyDownsell from './MonthlyDownsell';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/';

type Step = 'landing' | 'assessment' | 'result' | 'upsell' | 'downsell';

export default function FreeAssessment() {
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
          <div className="max-w-lg mx-auto text-center pt-8 sm:pt-12 mb-8">
            <div className="w-16 h-16 mx-auto mb-6 bg-amber-50 rounded-2xl flex items-center justify-center animate-in zoom-in duration-300">
              <HelpCircle size={32} className="text-amber-500" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              Still guessing their{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
                reading level?
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              Find out exactly where they are in 3 minutes.
            </p>

            <p className="text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
              Our quick screening checks the sounds they know, finds their level, and unlocks a free book matched to them.
            </p>
          </div>

          {/* Benefits */}
          <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-3">In 3 minutes you'll know:</p>
              <ul className="space-y-2">
                {['Which sounds they know confidently', 'Which sounds they need to practise', 'Their exact reading level (1-6)'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-amber-500 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="max-w-md mx-auto mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <div className="bg-white/80 backdrop-blur-md border border-white/30 shadow-xl rounded-2xl p-5">
              <p className="text-sm font-semibold text-foreground mb-3">Plus you'll get:</p>
              <ul className="space-y-2">
                {['1 free interactive book at their level', 'Based on the UK phonics curriculum', 'No card required'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check size={16} className="text-[hsl(var(--primary))] shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <EmailCapture source="free-assessment" onSuccess={handleEmailSuccess} buttonText="Start Free Assessment" />
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
