import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, RotateCcw, Volume2 } from 'lucide-react';
import {
  type SoundBookContent, type Theme,
  playPhoneme, playWord, soundOutThenBlend, imgFor, distractorsWithout,
} from './engine';

export interface ActivityProps {
  content: SoundBookContent;
  t: Theme;
  onCelebrate: () => void;
}

const spring = { type: 'spring' as const, stiffness: 380, damping: 26 };
const shuffle = <T,>(a: T[]) => a.map((v) => [Math.random(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);

function WordImg({ word, className }: { word: string; className?: string }) {
  return <img src={imgFor(word)} alt={word} draggable={false} className={className}
    onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = 'hidden'; }} />;
}

function Title({ children, t }: { children: React.ReactNode; t: Theme }) {
  return <motion.h2 initial={{ y: -16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={spring}
    className="text-center font-extrabold text-2xl sm:text-3xl md:text-4xl text-slate-800 mb-4 md:mb-8 px-6">{children}</motion.h2>;
}

// Render a word with its focus grapheme in the accent colour.
function FocusWord({ word, g, accent, className }: { word: string; g: string; accent: string; className?: string }) {
  const idx = word.indexOf(g);
  return (
    <span className={className}>
      {word.split('').map((ch, i) => (
        <span key={i} className={i >= idx && i < idx + g.length ? accent : 'text-slate-800'}>{ch}</span>
      ))}
    </span>
  );
}

/* ── 1. MEET THE SOUND ─────────────────────────────────────────────────────── */
export function MeetTheSound({ content, t, onCelebrate }: ActivityProps) {
  const [pulse, setPulse] = useState(0);
  useEffect(() => { const id = setTimeout(() => { playPhoneme(content.grapheme); onCelebrate(); }, 450); return () => clearTimeout(id); }, [content.grapheme, onCelebrate]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8">
      <motion.button
        onClick={() => { playPhoneme(content.grapheme); setPulse((p) => p + 1); }}
        className={`relative ${t.bubble} text-white rounded-[28%] shadow-2xl flex items-center justify-center`}
        style={{ width: 'min(58vw, 22rem)', height: 'min(58vw, 22rem)' }}
        initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0, y: [0, -14, 0] }}
        transition={{ scale: spring, opacity: { duration: 0.4 }, rotate: spring, y: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }}
        whileTap={{ scale: 0.92 }}
      >
        <motion.span key={pulse} initial={{ scale: 1 }} animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 0.5 }}
          className="font-black leading-none" style={{ fontSize: 'min(34vw, 13rem)' }}>{content.grapheme}</motion.span>
        <span className="absolute bottom-5 right-6 bg-white/25 rounded-full p-2"><Volume2 className="w-7 h-7" /></span>
      </motion.button>
      <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="text-center text-xl sm:text-2xl font-bold text-slate-600 px-8">{content.hint}</motion.p>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }} className={`text-sm font-bold uppercase tracking-wider ${t.accentText}`}>Tap the letter to hear it</motion.p>
    </div>
  );
}

/* ── 2. PICTURE POP ────────────────────────────────────────────────────────── */
export function PicturePop({ content, t, onCelebrate }: ActivityProps) {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const all = Object.keys(done).length === content.words.length;
  useEffect(() => { if (all) onCelebrate(); }, [all, onCelebrate]);
  return (
    <div className="flex-1 flex flex-col">
      <Title t={t}>Tap a picture — can you hear the <span className={t.accentText}>{content.grapheme}</span>?</Title>
      <div className="flex-1 grid grid-cols-2 gap-4 sm:gap-6 max-w-3xl w-full mx-auto place-content-center">
        {content.words.map((w, i) => (
          <motion.button key={w} onClick={() => { soundOutThenBlend(w); setDone((d) => ({ ...d, [w]: true })); }}
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ ...spring, delay: i * 0.07 }}
            whileHover={{ y: -6 }} whileTap={{ scale: 0.9 }}
            className={`relative bg-white rounded-3xl shadow-lg p-4 flex flex-col items-center gap-2 ring-4 ${done[w] ? t.ring : 'ring-transparent'}`}>
            <div className="w-full aspect-square flex items-center justify-center"><WordImg word={w} className="max-w-full max-h-full object-contain" /></div>
            <FocusWord word={w} g={content.grapheme} accent={t.accentText} className="font-extrabold text-2xl sm:text-3xl" />
            <AnimatePresence>{done[w] && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                className="absolute -top-3 -right-3 bg-green-500 text-white rounded-full p-1.5 shadow-md"><Check className="w-5 h-5" /></motion.span>
            )}</AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ── 3. BLEND IT ───────────────────────────────────────────────────────────── */
export function BlendIt({ content, t, onCelebrate }: ActivityProps) {
  const [wi, setWi] = useState(0);
  const [phase, setPhase] = useState<'segments' | 'blending' | 'reveal'>('segments');
  const word = content.words[wi];
  const letters = word.split('');

  const blend = async () => {
    if (phase !== 'segments') return;
    setPhase('blending');
    for (const g of letters) { await playPhoneme(g); await new Promise((r) => setTimeout(r, 110)); }
    await new Promise((r) => setTimeout(r, 120));
    await playWord(word);
    setPhase('reveal'); onCelebrate();
  };
  const next = () => { setPhase('segments'); setWi((i) => (i + 1) % content.words.length); };

  return (
    <div className="flex-1 flex flex-col">
      <Title t={t}>Sound it out… then <span className={t.accentText}>blend</span> it!</Title>
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        <AnimatePresence mode="wait">
          {phase !== 'reveal' ? (
            <motion.div key="seg" exit={{ scale: 0.7, opacity: 0 }} transition={spring} className="flex items-center gap-3 sm:gap-5">
              {letters.map((g, i) => (
                <motion.button key={i} onClick={() => playPhoneme(g)} whileTap={{ scale: 0.9 }}
                  animate={phase === 'blending' ? { x: (letters.length / 2 - i - 0.5) * -8, scale: 0.9 } : { x: 0, scale: 1 }}
                  transition={spring}
                  className={`${t.bubble} text-white font-black rounded-2xl shadow-xl flex items-center justify-center`}
                  style={{ width: 'min(20vw, 6rem)', height: 'min(20vw, 6rem)', fontSize: 'min(11vw, 3.5rem)' }}>{g}</motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div key="rev" initial={{ scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}
              className="flex flex-col items-center gap-4">
              <div className="w-40 h-40 sm:w-52 sm:h-52 flex items-center justify-center"><WordImg word={word} className="max-w-full max-h-full object-contain drop-shadow-xl" /></div>
              <FocusWord word={word} g={content.grapheme} accent={t.accentText} className="font-black text-5xl sm:text-6xl" />
            </motion.div>
          )}
        </AnimatePresence>

        {phase === 'reveal' ? (
          <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} onClick={next} whileTap={{ scale: 0.95 }}
            className={`${t.bubble} text-white font-extrabold text-xl px-10 py-4 rounded-full shadow-lg`}>Next word →</motion.button>
        ) : (
          <motion.button onClick={blend} whileTap={{ scale: 0.95 }} disabled={phase === 'blending'}
            animate={{ scale: phase === 'segments' ? [1, 1.05, 1] : 1 }} transition={{ duration: 1.4, repeat: Infinity }}
            className="bg-slate-900 text-white font-extrabold text-xl px-10 py-4 rounded-full shadow-lg disabled:opacity-60">Blend it!</motion.button>
        )}
        <div className="flex gap-2">{content.words.map((_, i) => (
          <span key={i} className={`h-2 rounded-full transition-all ${i === wi ? `w-8 ${t.accentBg}` : 'w-2 bg-slate-300'}`} />
        ))}</div>
      </div>
    </div>
  );
}

/* ── 4. SOUND HUNT ─────────────────────────────────────────────────────────── */
export function SoundHunt({ content, t, onCelebrate }: ActivityProps) {
  const targets = content.words.slice(0, 3);
  const grid = useMemo(() => shuffle([
    ...targets.map((w) => ({ w, isTarget: true })),
    ...distractorsWithout(content.grapheme, content.words, 3).map((w) => ({ w, isTarget: false })),
  ]), [content.grapheme]); // eslint-disable-line react-hooks/exhaustive-deps
  const [found, setFound] = useState<Record<string, boolean>>({});
  const [wrong, setWrong] = useState<string | null>(null);
  const foundCount = targets.filter((w) => found[w]).length;
  const win = foundCount === targets.length;
  useEffect(() => { if (win) onCelebrate(); }, [win, onCelebrate]);

  const tap = (cell: { w: string; isTarget: boolean }) => {
    playWord(cell.w);
    if (cell.isTarget) setFound((f) => ({ ...f, [cell.w]: true }));
    else { setWrong(cell.w); setTimeout(() => setWrong((x) => (x === cell.w ? null : x)), 500); }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Title t={t}>Find the <span className={t.accentText}>{content.grapheme}</span>! Tap every picture with the sound.</Title>
      <div className="flex-1 grid grid-cols-3 gap-3 sm:gap-5 max-w-4xl w-full mx-auto place-content-center">
        {grid.map((cell, i) => {
          const isFound = found[cell.w];
          return (
            <motion.button key={cell.w + i} onClick={() => !isFound && tap(cell)}
              initial={{ scale: 0.5, opacity: 0 }} animate={wrong === cell.w ? { x: [0, -10, 10, -8, 8, 0] } : { scale: 1, opacity: 1 }}
              transition={wrong === cell.w ? { duration: 0.45 } : { ...spring, delay: i * 0.05 }}
              whileTap={{ scale: 0.92 }}
              className={`relative bg-white rounded-3xl shadow-lg p-3 aspect-square flex items-center justify-center ring-4 ${isFound ? 'ring-green-400' : 'ring-transparent'}`}>
              <WordImg word={cell.w} className="max-w-full max-h-full object-contain" />
              <AnimatePresence>{isFound && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={spring}
                  className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-3xl">
                  <span className="bg-green-500 text-white rounded-full p-2 shadow"><Check className="w-7 h-7" /></span>
                </motion.span>
              )}</AnimatePresence>
            </motion.button>
          );
        })}
      </div>
      <motion.p key={foundCount} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="text-center mt-4 font-extrabold text-xl text-slate-600">
        {win ? '🎉 You found them all!' : `Found ${foundCount} of ${targets.length}`}
      </motion.p>
    </div>
  );
}

/* ── 5. BUILD THE WORD ─────────────────────────────────────────────────────── */
export function BuildTheWord({ content, t, onCelebrate }: ActivityProps) {
  const [wi, setWi] = useState(0);
  const word = content.words[wi];
  const target = word.split('');
  const [bank, setBank] = useState<string[]>(() => shuffle(target));
  const [slots, setSlots] = useState<(string | null)[]>(() => target.map(() => null));
  const [status, setStatus] = useState<'building' | 'win' | 'wrong'>('building');

  const reset = (w: string) => { const ts = w.split(''); setBank(shuffle(ts)); setSlots(ts.map(() => null)); setStatus('building'); };
  useEffect(() => { reset(content.words[wi]); }, [wi]); // eslint-disable-line react-hooks/exhaustive-deps

  const place = (letter: string, bankIdx: number) => {
    if (status !== 'building') return;
    const slotIdx = slots.findIndex((s) => s === null);
    if (slotIdx === -1) return;
    const ns = [...slots]; ns[slotIdx] = letter; setSlots(ns);
    const nb = [...bank]; nb.splice(bankIdx, 1); setBank(nb);
    if (ns.every((s) => s !== null)) {
      if (ns.join('') === word) { setStatus('win'); playWord(word); onCelebrate(); }
      else { setStatus('wrong'); setTimeout(() => reset(word), 1100); }
    }
  };
  const pull = (slotIdx: number) => {
    if (status !== 'building') return;
    const letter = slots[slotIdx]; if (!letter) return;
    const ns = [...slots]; ns[slotIdx] = null; setSlots(ns); setBank((b) => [...b, letter]);
  };

  return (
    <div className="flex-1 flex flex-col">
      <Title t={t}>Build the word!</Title>
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-36 h-36 sm:w-48 sm:h-48 bg-white rounded-3xl shadow-lg flex items-center justify-center p-4"><WordImg word={word} className="max-w-full max-h-full object-contain" /></div>
          <button onClick={() => playWord(word)} className={`flex items-center gap-1.5 text-sm font-bold ${t.accentText}`}><Volume2 className="w-4 h-4" /> hear it</button>
        </div>
        <div className="flex flex-col items-center gap-8">
          <motion.div animate={status === 'wrong' ? { x: [0, -10, 10, -8, 8, 0] } : {}} transition={{ duration: 0.45 }} className="flex gap-3">
            {slots.map((s, i) => (
              <button key={i} onClick={() => pull(i)}
                className={`rounded-2xl border-4 border-dashed flex items-center justify-center font-black transition-colors ${status === 'win' ? 'border-green-400 bg-green-50 text-green-600' : s ? `${t.soft} border-slate-300 text-slate-800` : 'border-slate-300 text-slate-300'}`}
                style={{ width: 'min(18vw, 5rem)', height: 'min(18vw, 5rem)', fontSize: 'min(10vw, 2.75rem)' }}>{s ?? '·'}</button>
            ))}
          </motion.div>
          <div className="flex gap-3 flex-wrap justify-center min-h-[5rem]">
            <AnimatePresence>
              {bank.map((l, i) => (
                <motion.button key={l + i} layout initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={spring}
                  onClick={() => place(l, i)} whileTap={{ scale: 0.9 }} whileHover={{ y: -4 }}
                  className={`${t.bubble} text-white font-black rounded-2xl shadow-lg flex items-center justify-center`}
                  style={{ width: 'min(18vw, 5rem)', height: 'min(18vw, 5rem)', fontSize: 'min(10vw, 2.75rem)' }}>{l}</motion.button>
              ))}
            </AnimatePresence>
          </div>
          <AnimatePresence>
            {status === 'win' && (
              <motion.button initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                onClick={() => setWi((i) => (i + 1) % content.words.length)} whileTap={{ scale: 0.95 }}
                className={`${t.bubble} text-white font-extrabold text-lg px-8 py-3 rounded-full shadow-lg`}>Next word →</motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ── 6. STAR FINISH ────────────────────────────────────────────────────────── */
export function StarFinish({ content, t, onCelebrate, onReplay, onClose }: ActivityProps & { onReplay: () => void; onClose: () => void }) {
  useEffect(() => { onCelebrate(); }, [onCelebrate]);
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 text-center px-6">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ ...spring, delay: 0.1 }}
        className={`${t.bubble} text-white rounded-full shadow-2xl flex items-center justify-center`} style={{ width: 'min(48vw, 16rem)', height: 'min(48vw, 16rem)' }}>
        <motion.span animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} style={{ fontSize: 'min(26vw, 9rem)' }}>⭐</motion.span>
      </motion.div>
      <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="font-black text-3xl sm:text-5xl text-slate-800">You did it!</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xl text-slate-600 font-bold">
        You learned the <span className={t.accentText}>{content.grapheme}</span> sound.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="flex gap-4 flex-wrap justify-center">
        <button onClick={onReplay} className="flex items-center gap-2 bg-white text-slate-700 font-extrabold text-lg px-8 py-3 rounded-full shadow"><RotateCcw className="w-5 h-5" /> Play again</button>
        <button onClick={onClose} className={`${t.bubble} text-white font-extrabold text-lg px-10 py-3 rounded-full shadow-lg`}>Done</button>
      </motion.div>
    </div>
  );
}
