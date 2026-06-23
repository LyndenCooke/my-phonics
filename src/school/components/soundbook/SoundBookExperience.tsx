import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { type SoundBookContent, type ActivityKind, theme } from './engine';
import Confetti from './Confetti';
import { MeetTheSound, PicturePop, BlendIt, SoundHunt, BuildTheWord, StarFinish, type ActivityProps } from './activities';

const STEP_LABEL: Record<ActivityKind, string> = {
  meet: 'Meet the sound', pop: 'Listen', blend: 'Blend it', hunt: 'Sound hunt', build: 'Build a word', finish: 'Finish',
};

export default function SoundBookExperience({ content, onClose }: { content: SoundBookContent; onClose: () => void }) {
  const t = theme(content.level);
  const steps = content.activities;
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [confetti, setConfetti] = useState(0);

  const kind = steps[index];
  const isLast = index === steps.length - 1;
  const go = useCallback((d: number) => {
    setIndex((i) => { const n = i + d; if (n < 0 || n >= steps.length) return i; setDir(d); return n; });
  }, [steps.length]);
  const celebrate = useCallback(() => setConfetti((c) => c + 1), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  const props: ActivityProps = { content, t, onCelebrate: celebrate };
  const render = () => {
    switch (kind) {
      case 'meet': return <MeetTheSound {...props} />;
      case 'pop': return <PicturePop {...props} />;
      case 'blend': return <BlendIt {...props} />;
      case 'hunt': return <SoundHunt {...props} />;
      case 'build': return <BuildTheWord {...props} />;
      case 'finish': return <StarFinish {...props} onReplay={() => { setDir(-1); setIndex(0); }} onClose={onClose} />;
    }
  };

  return (
    <div className={`fixed inset-0 z-[9999] ${t.bg} flex flex-col select-none`}>
      {/* top bar */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0">
        <button onClick={onClose} aria-label="Close" className="bg-white/70 backdrop-blur text-slate-700 rounded-full p-2 shadow hover:bg-white">
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="font-extrabold text-slate-800 leading-tight">{content.title}</div>
          <div className={`text-xs font-bold uppercase tracking-wider ${t.accentText}`}>{STEP_LABEL[kind]}</div>
        </div>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <span key={i} className={`h-2.5 rounded-full transition-all duration-300 ${i === index ? `w-7 ${t.accentBg}` : i < index ? 'w-2.5 bg-slate-400' : 'w-2.5 bg-white/70'}`} />
          ))}
        </div>
      </div>

      {/* slide */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={index} custom={dir}
            initial={{ x: dir * 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: dir * -80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="absolute inset-0 flex flex-col px-4 sm:px-8 py-2 sm:py-4">
            {render()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* nav */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-4 flex-shrink-0">
        <button onClick={() => go(-1)} disabled={index === 0}
          className="flex items-center gap-1 bg-white/70 backdrop-blur text-slate-700 font-bold rounded-full pl-3 pr-5 py-2.5 shadow disabled:opacity-0 hover:bg-white">
          <ChevronLeft className="w-5 h-5" /> Back
        </button>
        {!isLast ? (
          <button onClick={() => go(1)}
            className={`flex items-center gap-1 ${t.bubble} text-white font-extrabold rounded-full pl-6 pr-4 py-2.5 shadow-lg hover:brightness-105`}>
            Next <ChevronRight className="w-5 h-5" />
          </button>
        ) : <span className="w-24" />}
      </div>

      {confetti > 0 && <Confetti seedKey={confetti} />}
    </div>
  );
}
