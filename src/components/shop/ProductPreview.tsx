/**
 * ProductPreview — the "peek inside" overlay for /shop.
 *
 * Two modes, both teasers (a few pages/cards, then a lock):
 *  - book:  a page-turn flip-through of a storybook or workbook. The final
 *           page arrives pre-blurred (baked into the image) with a lock CTA.
 *  - cards: a card deck. Tap the card to flip front → back (plain word to
 *           sound-marked back); tap again to send it to the pile on the left
 *           and bring the next card forward. Stops after a few cards.
 *
 * Portals to document.body so position:fixed resolves against the viewport
 * (an ancestor motion.div in AnimatedRoutes is a fixed containing block).
 */
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Lock, RefreshCw, BookOpen, Sparkles } from 'lucide-react';
import type { PreviewData } from '@/lib/shopCatalogue';

const PINK = '#E84B8A';
const PINK_INK = '#BE1862';

interface Props {
  preview: PreviewData;
  accentHex: string;
  onClose: () => void;
  onRegister: () => void;
  onReadOnline: () => void;
}

/* ── Locked end panel, shared by both modes ──────────────────────────── */
function LockCTA({ onRegister, onReadOnline, kind }: {
  onRegister: () => void; onReadOnline: () => void; kind: 'book' | 'cards';
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 gap-3 bg-white/55 backdrop-blur-[2px]">
      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-md">
        <Lock className="w-5 h-5" style={{ color: PINK_INK }} />
      </div>
      <p className="font-display font-extrabold text-foreground text-lg max-w-xs">
        {kind === 'book' ? 'That is a taste of the story.' : 'The rest is in the full deck.'}
      </p>
      <p className="text-sm text-muted-foreground max-w-xs">
        {kind === 'book'
          ? 'Read the whole book free on any screen, or register interest in the printed set.'
          : 'Every sound and word is in the printed deck. Register your interest below.'}
      </p>
      <div className="flex flex-col sm:flex-row gap-2 mt-1">
        {kind === 'book' && (
          <button
            onClick={onReadOnline}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-extrabold text-sm bg-white text-foreground transition-all active:translate-y-[3px]"
            style={{ boxShadow: '0 4px 0 rgba(40,30,40,0.10)', border: '1px solid rgba(40,30,40,0.08)' }}
          >
            <BookOpen className="w-4 h-4" /> Read it free online
          </button>
        )}
        <button
          onClick={onRegister}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[4px]"
          style={{ background: PINK, boxShadow: `0 5px 0 ${PINK_INK}` }}
        >
          <Sparkles className="w-4 h-4" /> Register interest
        </button>
      </div>
    </div>
  );
}

/* ── Book flip-through ───────────────────────────────────────────────── */
function BookFlip({ pages, accentHex, onRegister, onReadOnline }: {
  pages: string[]; accentHex: string; onRegister: () => void; onReadOnline: () => void;
}) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const last = pages.length - 1;
  const go = (delta: number) => {
    const next = Math.min(Math.max(index + delta, 0), last);
    if (next !== index) setState([next, delta]);
  };

  const variants = {
    enter: (d: number) => ({ rotateY: d > 0 ? 38 : -38, x: d > 0 ? 90 : -90, opacity: 0 }),
    center: { rotateY: 0, x: 0, opacity: 1 },
    exit: (d: number) => ({ rotateY: d > 0 ? -38 : 38, x: d > 0 ? -90 : 90, opacity: 0 }),
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div
        className="relative w-full max-w-[300px] aspect-[3/4] select-none"
        style={{ perspective: 1400 }}
      >
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={index}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.4, 0, 0.2, 1] }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(_, info) => {
              if (info.offset.x < -60) go(1);
              else if (info.offset.x > 60) go(-1);
            }}
            className="absolute inset-0 rounded-xl overflow-hidden bg-white cursor-grab active:cursor-grabbing"
            style={{ boxShadow: '0 10px 30px -8px rgba(40,30,40,0.30)', transformStyle: 'preserve-3d' }}
          >
            <img src={pages[index]} alt={`Page ${index + 1}`} className="w-full h-full object-contain" draggable={false} />
            {/* page-edge sheen for a paper feel */}
            <div className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/10 to-transparent pointer-events-none" />
            {index === last && (
              <LockCTA kind="book" onRegister={onRegister} onReadOnline={onReadOnline} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="w-11 h-11 rounded-full flex items-center justify-center bg-white disabled:opacity-30 transition-all active:translate-y-[2px]"
          style={{ boxShadow: '0 3px 0 rgba(40,30,40,0.10)', border: '1px solid rgba(40,30,40,0.08)' }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold text-muted-foreground tabular-nums">
          {index + 1} / {pages.length} · sample
        </span>
        <button
          onClick={() => go(1)}
          disabled={index === last}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-30 transition-all active:translate-y-[2px]"
          style={{ background: accentHex, boxShadow: `0 3px 0 rgba(0,0,0,0.18)` }}
          aria-label="Next page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/* ── Card flip-and-advance ───────────────────────────────────────────── */
function CardFlip({ cards, accentHex, landscape, onRegister, onReadOnline }: {
  cards: { front: string; back: string }[]; accentHex: string; landscape?: boolean;
  onRegister: () => void; onReadOnline: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const locked = index >= cards.length;
  const remaining = Math.max(cards.length - index - 1, 0);
  // Word cards are A7 landscape; sound cards A7 portrait.
  const frameClass = landscape ? 'w-full max-w-[360px] aspect-[105/74]' : 'w-full max-w-[280px] aspect-[3/4]';

  const act = () => {
    if (locked) return;
    if (!flipped) setFlipped(true);
    else {
      setFlipped(false);
      setIndex((i) => i + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className={`relative ${frameClass}`} style={{ perspective: 1400 }}>
        {/* stack hint on the right */}
        {[...Array(Math.min(remaining, 3))].map((_, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-2xl bg-white"
            style={{
              transform: `translateX(${(i + 1) * 10}px) translateY(${(i + 1) * 6}px) rotate(${(i + 1) * 2}deg)`,
              boxShadow: '0 6px 16px -6px rgba(40,30,40,0.25)',
              border: '1px solid rgba(40,30,40,0.06)',
              zIndex: 0,
            }}
          />
        ))}

        {locked ? (
          <div className="absolute inset-0 rounded-2xl overflow-hidden bg-white" style={{ boxShadow: '0 12px 30px -8px rgba(40,30,40,0.30)' }}>
            <img src={cards[cards.length - 1].back} alt="" className="w-full h-full object-contain opacity-40 blur-[6px]" draggable={false} />
            <LockCTA kind="cards" onRegister={onRegister} onReadOnline={onReadOnline} />
          </div>
        ) : (
          <AnimatePresence initial={false} mode="popLayout">
            <motion.div
              key={index}
              initial={{ x: 60, y: 30, opacity: 0, rotate: 4 }}
              animate={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              exit={{ x: -260, y: 20, opacity: 0, rotate: -8 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0 cursor-pointer"
              style={{ transformStyle: 'preserve-3d', zIndex: 5 }}
              onClick={act}
            >
              <motion.div
                className="relative w-full h-full"
                animate={{ rotateY: flipped ? 180 : 0 }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* front */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
                  style={{ backfaceVisibility: 'hidden', boxShadow: '0 12px 30px -8px rgba(40,30,40,0.30)', border: '1px solid rgba(40,30,40,0.06)' }}
                >
                  <img src={cards[index].front} alt={`Card ${index + 1} front`} className="w-full h-full object-contain" draggable={false} />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Front</span>
                </div>
                {/* back */}
                <div
                  className="absolute inset-0 rounded-2xl overflow-hidden bg-white"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', boxShadow: '0 12px 30px -8px rgba(40,30,40,0.30)', border: '1px solid rgba(40,30,40,0.06)' }}
                >
                  <img src={cards[index].back} alt={`Card ${index + 1} back`} className="w-full h-full object-contain" draggable={false} />
                  <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wide" style={{ color: accentHex }}>Back · sounds marked</span>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {!locked && (
        <>
          <button
            onClick={act}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
            style={{ background: accentHex, boxShadow: `0 4px 0 rgba(0,0,0,0.18)` }}
          >
            {flipped ? <><ChevronRight className="w-4 h-4" /> Next card</> : <><RefreshCw className="w-4 h-4" /> Flip it over</>}
          </button>
          <span className="text-sm font-bold text-muted-foreground tabular-nums">Card {index + 1} of {cards.length} · sample</span>
        </>
      )}
    </div>
  );
}

/* ── Overlay shell ───────────────────────────────────────────────────── */
export default function ProductPreview({ preview, accentHex, onClose, onRegister, onReadOnline }: Props) {
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={preview.label}>
      <button className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} aria-label="Close" />
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8" style={{ boxShadow: '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)' }}>
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-muted transition-colors" aria-label="Close">
          <X className="w-4 h-4" />
        </button>
        <div className="text-center mb-5">
          <div className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white mb-2" style={{ background: accentHex }}>
            {preview.label}
          </div>
          <h3 className="font-display text-lg font-extrabold text-foreground">{preview.sourceName}</h3>
        </div>
        {preview.kind === 'book' && preview.pages
          ? <BookFlip pages={preview.pages} accentHex={accentHex} onRegister={onRegister} onReadOnline={onReadOnline} />
          : preview.cards
          ? <CardFlip cards={preview.cards} accentHex={accentHex} landscape={preview.cardLandscape} onRegister={onRegister} onReadOnline={onReadOnline} />
          : null}
      </div>
    </div>,
    document.body,
  );
}
