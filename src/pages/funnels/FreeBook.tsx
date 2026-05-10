import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle } from 'lucide-react';
import { useFunnelTracker } from '@/hooks/useFunnelTracker';
import FunnelLayout from '@/components/funnels/FunnelLayout';
import EmailCapture from '@/components/funnels/EmailCapture';
import BundleUpsell from './BundleUpsell';
import MonthlyDownsell from './MonthlyDownsell';
import BookUnlockedModal from '@/components/BookUnlockedModal';
import { BOOK_CATALOG } from '@/lib/bookCatalog';

const HUB_URL = import.meta.env.VITE_HUB_URL || '/library';

type Step = 'pick' | 'email' | 'upsell' | 'downsell' | 'unlocked';

const LEVEL_PREVIEWS: { level: number; key: string; title: string; colour: string; sounds: string }[] = [
  { level: 1, key: '1_1', title: 'Starting Stories',     colour: '#E84B8A', sounds: 's, a, t, p, sh' },
  { level: 2, key: '2_1', title: 'Longer Sounds',        colour: '#F5A623', sounds: 'ay, ee, igh, oo' },
  { level: 3, key: '3_1', title: 'New Spellings',        colour: '#4ABD6D', sounds: 'a-e, i-e, ea, oi' },
  { level: 4, key: '4_1', title: 'Building Fluency',     colour: '#5B9EFF', sounds: 'ur, er, ew, ow' },
  { level: 5, key: '5_1', title: 'Reading Together',     colour: '#A78EFF', sounds: 'ore, ear, tion' },
  { level: 6, key: '6_1', title: 'Reading Champion',     colour: '#2B8A6E', sounds: '-ous, -able, -cious' },
];

export default function FreeBook() {
  useFunnelTracker();
  const [step, setStep] = useState<Step>('pick');
  const [level, setLevel] = useState(1);
  const [childName, setChildName] = useState('');
  const [email, setEmail] = useState('');

  const goToHub = () => { window.location.href = HUB_URL; };

  const handlePickLevel = (lv: number) => {
    setLevel(lv);
    setStep('email');
  };

  const handleEmailSuccess = ({ childName: name, email: e }: { childName: string; email: string }) => {
    setChildName(name);
    setEmail(e);
    setStep('upsell');
  };

  if (step === 'pick') {
    return (
      <FunnelLayout>
        <div className="max-w-2xl mx-auto text-center pt-6 sm:pt-10 mb-6">
          <div className="w-16 h-16 mx-auto mb-5 bg-gradient-to-br from-[hsl(var(--primary))] to-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-pink-500/20 animate-in zoom-in duration-300">
            <BookOpen size={32} />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
            Pick a free book{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
              for your child
            </span>
          </h1>
          <p className="text-muted-foreground mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Tap their level. We'll unlock one matching book — free, no card.
          </p>
        </div>

        <div className="max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 px-1 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {LEVEL_PREVIEWS.map((p) => (
            <button
              key={p.level}
              onClick={() => handlePickLevel(p.level)}
              className="group relative bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all overflow-hidden text-left active:scale-[0.98] border-2 border-transparent hover:border-[hsl(var(--primary))]"
            >
              <div className="aspect-[3/4] overflow-hidden bg-gray-100">
                <img
                  src={`/illustrations/${p.key}/cover.png`}
                  alt={`Level ${p.level} sample cover`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  draggable={false}
                />
              </div>
              <div className="px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-extrabold shrink-0"
                    style={{ backgroundColor: p.colour }}
                  >
                    {p.level}
                  </span>
                  <span className="text-xs font-bold text-foreground truncate">{p.title}</span>
                </div>
                <p className="text-[10px] text-muted-foreground truncate">{p.sounds}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="max-w-md mx-auto text-center animate-in fade-in duration-500 delay-300">
          <Link
            to="/assessment"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors py-3 px-4 rounded-xl"
          >
            <HelpCircle size={16} />
            Not sure? Take the 3-minute assessment
          </Link>
        </div>
      </FunnelLayout>
    );
  }

  if (step === 'email') {
    const preview = LEVEL_PREVIEWS.find(p => p.level === level)!;
    return (
      <FunnelLayout>
        <div className="max-w-md mx-auto text-center pt-6 sm:pt-10 mb-6">
          <div
            className="w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden shadow-xl border-4 border-white animate-in zoom-in duration-300"
          >
            <img
              src={`/illustrations/${preview.key}/cover.png`}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
            One free Level {level} book{' '}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--primary))] via-rose-500 to-amber-500">
              on its way
            </span>
          </h1>
          <p className="text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            Drop your email and we'll unlock it now.
          </p>
        </div>

        <EmailCapture
          source={`free-book-l${level}`}
          onSuccess={handleEmailSuccess}
          buttonText="Unlock My Free Book"
        />

        <div className="max-w-md mx-auto text-center mt-4">
          <button
            onClick={() => setStep('pick')}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Pick a different level
          </button>
        </div>
      </FunnelLayout>
    );
  }

  if (step === 'upsell') {
    return (
      <FunnelLayout>
        <BundleUpsell
          childName={childName}
          level={level}
          onAccept={goToHub}
          onDecline={() => setStep('downsell')}
        />
      </FunnelLayout>
    );
  }

  if (step === 'downsell') {
    return (
      <FunnelLayout>
        <MonthlyDownsell
          childName={childName}
          level={level}
          onAccept={goToHub}
          onDecline={() => setStep('unlocked')}
        />
      </FunnelLayout>
    );
  }

  // unlocked — show the modal so the user feels rewarded before being routed
  const firstBook = BOOK_CATALOG.find(b => b.level === level);
  const coverUrl = firstBook
    ? `/covers/${firstBook.sub_level.replace(/^L/, '').replace('.', '_')}_cover.jpg`
    : null;

  return (
    <FunnelLayout>
      <BookUnlockedModal
        open={true}
        onClose={goToHub}
        onContinue={goToHub}
        title={firstBook?.title ?? `Level ${level} Book`}
        level={level}
        coverUrl={coverUrl}
        subtitle={`Check ${email} for your login link`}
        ctaLabel="Browse the Library"
      />
    </FunnelLayout>
  );
}
