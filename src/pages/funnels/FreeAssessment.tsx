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
          <div className="max-w-lg mx-auto text-center pt-6 sm:pt-10 mb-6">
            <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4 animate-in fade-in duration-300">
              <HelpCircle size={14} />
              3-minute phonics check
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
              Find their exact{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
                reading level
              </span>
            </h1>

            <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
              In 3 minutes. Free book at their level when you're done.
            </p>
          </div>

          <EmailCapture source="free-assessment" onSuccess={handleEmailSuccess} buttonText="Start Free Assessment" />

          <div className="max-w-md mx-auto mt-5 animate-in fade-in duration-500 delay-200">
            <ul className="space-y-2 px-2">
              {['Their reading level (1–6)', 'Sounds they know vs. need to practise', '1 free interactive book to keep'].map((item, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check size={16} className="text-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
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
