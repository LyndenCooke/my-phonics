import { useState, useCallback, useRef, useEffect } from 'react';
import type { StoryWord } from '@/lib/interactiveBookData';

// ─── Audio helpers ─────────────────────────────────────────────────────

function playAudioFile(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error(`Audio not found: ${url}`));
    audio.oncanplaythrough = () => { audio.play().catch(reject); };
    audio.load();
  });
}

async function playPhoneme(grapheme: string): Promise<void> {
  const key = grapheme.toLowerCase().replace(/-/g, '_');
  try { await playAudioFile(`/sounds/${key}.mp3`); } catch {}
}

function playWordAudio(word: string): Promise<void> {
  // Plays the pre-recorded ElevenLabs (George) MP3 at /sounds/words/<word>.mp3.
  // Silent-on-miss by design: never fall back to browser TTS, since that
  // produces a different voice (Microsoft David / Samantha / etc) and the
  // brand is single-voice George across every book.
  return new Promise((resolve) => {
    const key = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!key) { resolve(); return; }
    const audio = new Audio(`/sounds/words/${key}.mp3`);
    audio.onended = () => resolve();
    audio.onerror = () => resolve();
    audio.oncanplaythrough = () => { audio.play().catch(() => resolve()); };
    audio.load();
  });
}

// ─── Known grapheme sets ───────────────────────────────────────────────

const SPLIT_DIGRAPHS = new Set(['a-e', 'i-e', 'o-e', 'u-e', 'e-e']);

const MULTI_LETTER = new Set([
  'sh', 'ch', 'th', 'ng', 'nk', 'ck', 'ff', 'll', 'ss', 'zz', 'qu',
  'ph', 'kn', 'wr', 'wh', 'tch',
  'ay', 'ee', 'oo', 'ar', 'or', 'ir', 'ou', 'oy',
  'oa', 'oi', 'aw', 'ai', 'ea', 'ie', 'ue', 'ew', 'ow', 'ey', 'oe', 'au',
  'igh', 'air', 'ear', 'oor', 'ore', 'ure', 'ire', 'are', 'eer', 'ere',
  'tion', 'cious', 'tious', 'able', 'ible', 'ous',
  'dd', 'gg', 'mm', 'nn', 'pp', 'rr', 'tt',
]);

// ─── Phoneme-to-letter span builder ────────────────────────────────────

interface LetterSpan {
  letter: string;
  annotation: 'dot' | 'line-start' | 'line-mid' | 'line-end' | 'arc-start' | 'arc-mid-dot' | 'arc-end' | 'none';
  phonemeIdx: number;
}

function buildLetterSpans(display: string, phonemes: string[]): LetterSpan[] {
  // Strip trailing punctuation for mapping, re-append at end
  const match = display.match(/^(.*?)([^a-zA-Z]*)$/);
  const core = match ? match[1] : display;
  const trailing = match ? match[2] : '';
  const letters = core.split('');
  const result: LetterSpan[] = [];
  let charIdx = 0;

  // Find split digraph
  const splitPhIdx = phonemes.findIndex(p => SPLIT_DIGRAPHS.has(p));

  // Build a plan: for each phoneme, how many letters does it consume?
  interface PhPlan { ph: string; idx: number; letterCount: number; type: 'single' | 'multi' | 'split'; }
  const plan: PhPlan[] = [];

  for (let pi = 0; pi < phonemes.length; pi++) {
    const ph = phonemes[pi];
    if (SPLIT_DIGRAPHS.has(ph)) {
      plan.push({ ph, idx: pi, letterCount: 1, type: 'split' }); // just the first vowel
    } else if (MULTI_LETTER.has(ph.toLowerCase())) {
      const clean = ph.replace(/[-]/g, '');
      plan.push({ ph, idx: pi, letterCount: clean.length, type: 'multi' });
    } else {
      plan.push({ ph, idx: pi, letterCount: 1, type: 'single' });
    }
  }

  // If there's a split digraph, we need to account for the trailing 'e'
  // The plan above only consumed the first vowel of the split digraph
  // After all phonemes, there should be a final 'e' left

  // Track whether we've consumed the split digraph trailing 'e'
  let splitEConsumed = false;

  for (const p of plan) {
    if (p.type === 'split') {
      // First vowel of split digraph
      if (charIdx < letters.length) {
        result.push({ letter: letters[charIdx], annotation: 'arc-start', phonemeIdx: p.idx });
        charIdx++;
      }
    } else if (p.type === 'multi') {
      // Digraph/trigraph
      for (let j = 0; j < p.letterCount && charIdx < letters.length; j++) {
        const ann = j === 0 ? 'line-start' : j === p.letterCount - 1 ? 'line-end' : 'line-mid';
        result.push({ letter: letters[charIdx], annotation: ann, phonemeIdx: p.idx });
        charIdx++;
      }
    } else {
      // Single letter — check if it's the middle consonant of a split digraph
      if (charIdx < letters.length) {
        const isMiddleOfSplit = splitPhIdx >= 0 && !splitEConsumed && p.idx === splitPhIdx + 1;
        if (isMiddleOfSplit) {
          // Middle consonant between the split digraph vowels
          result.push({ letter: letters[charIdx], annotation: 'arc-mid-dot', phonemeIdx: p.idx });
          charIdx++;
          // Now consume the trailing 'e' as arc-end
          if (charIdx < letters.length) {
            result.push({ letter: letters[charIdx], annotation: 'arc-end', phonemeIdx: splitPhIdx });
            charIdx++;
            splitEConsumed = true;
          }
        } else {
          result.push({ letter: letters[charIdx], annotation: 'dot', phonemeIdx: p.idx });
          charIdx++;
        }
      }
    }
  }

  // Any truly remaining letters (shouldn't normally happen)
  while (charIdx < letters.length) {
    result.push({ letter: letters[charIdx], annotation: 'none', phonemeIdx: -1 });
    charIdx++;
  }

  // Add trailing punctuation to last span
  if (trailing && result.length > 0) {
    result[result.length - 1].letter += trailing;
  }

  return result;
}

// ─── Types ─────────────────────────────────────────────────────────────

export interface NarrationHighlight {
  wholeWord: boolean;
}

interface TappableWordProps {
  wordData: StoryWord;
  focusSounds?: string[];
  size?: 'normal' | 'medium' | 'large';
  highlight?: boolean;
  narrationHighlight?: NarrationHighlight | null;
  showAnnotations?: boolean;
}

// ─── Component ─────────────────────────────────────────────────────────

export default function TappableWord({
  wordData,
  size = 'normal',
  highlight = false,
  narrationHighlight = null,
  showAnnotations = false,
}: TappableWordProps) {
  const [isSoundingOut, setIsSoundingOut] = useState(false);
  const [activePhonemeIdx, setActivePhonemeIdx] = useState<number | null>(null);
  const [tapped, setTapped] = useState(false);
  const cancelRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const letterRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // Arc SVG state
  const [arcPath, setArcPath] = useState<string | null>(null);
  const [arcWidth, setArcWidth] = useState(0);
  const [arcOffset, setArcOffset] = useState(0);

  const textSize = size === 'large'
    ? 'text-3xl md:text-4xl lg:text-5xl'
    : size === 'medium'
      ? 'text-xl md:text-2xl lg:text-3xl'
      : 'text-base md:text-lg lg:text-xl';
  const wordPad = size === 'large' ? 'px-2 py-1 md:px-3' : size === 'medium' ? 'px-1.5 py-0.5' : 'px-1 py-0.5';
  const wordMargin = size === 'large' ? 'mx-0.5 mb-1.5 md:mx-1 md:mb-2' : size === 'medium' ? 'mx-0 mb-0.5 md:mx-0.5 md:mb-1' : 'mx-0 mb-0';
  const annotH = size === 'large' ? 16 : size === 'medium' ? 12 : 10;
  const dotR = size === 'large' ? 2.5 : 2;
  const strokeW = size === 'large' ? 2 : 1.5;

  // ─── Build letter spans for annotations ──────────────────────────────
  const spans = (wordData.phonemes.length > 0 && !wordData.isTricky)
    ? buildLetterSpans(wordData.display, wordData.phonemes)
    : null;

  // ─── Measure arc positions after render ──────────────────────────────
  useEffect(() => {
    if (!showAnnotations || !spans || !containerRef.current) {
      setArcPath(null);
      return;
    }

    const arcStartIdx = spans.findIndex(s => s.annotation === 'arc-start');
    const arcEndIdx = spans.findIndex(s => s.annotation === 'arc-end');
    if (arcStartIdx < 0 || arcEndIdx < 0) {
      setArcPath(null);
      return;
    }

    const container = containerRef.current;
    const startEl = letterRefs.current[arcStartIdx];
    const endEl = letterRefs.current[arcEndIdx];
    if (!startEl || !endEl || !container) { setArcPath(null); return; }

    const cRect = container.getBoundingClientRect();
    const sRect = startEl.getBoundingClientRect();
    const eRect = endEl.getBoundingClientRect();

    const x1 = sRect.left + sRect.width / 2 - cRect.left;
    const x2 = eRect.left + eRect.width / 2 - cRect.left;
    const w = x2 - x1;
    const h = annotH;

    setArcOffset(x1);
    setArcWidth(w);
    // Arc curves upward above the letters: starts at bottom corners, peaks above
    // Control point at -h*0.4 gives a gentle arc that clears middle letters
    setArcPath(`M 0,${h} Q ${w / 2},${-h * 0.4} ${w},${h}`);
  }, [showAnnotations, spans, annotH, size]);

  // ─── Tap handler ────────────────────────────────────────────────────
  const handleTap = useCallback(async () => {
    if (isSoundingOut) return;
    cancelRef.current = false;

    if (wordData.isTricky) {
      // Tricky word: quick purple highlight + speak the whole word
      setTapped(true);
      await playWordAudio(wordData.word);
      setTimeout(() => setTapped(false), 400);
    } else if (wordData.phonemes.length > 0) {
      // Normal word: sound out each phoneme, then blend the whole word
      setIsSoundingOut(true);
      for (let i = 0; i < wordData.phonemes.length; i++) {
        if (cancelRef.current) break;
        setActivePhonemeIdx(i);
        await playPhoneme(wordData.phonemes[i]);
        await new Promise(r => setTimeout(r, 150));
      }
      if (!cancelRef.current) {
        setActivePhonemeIdx(null);
        // Brief pause, then speak the blended word
        await new Promise(r => setTimeout(r, 200));
        await playWordAudio(wordData.word);
      }
      setActivePhonemeIdx(null);
      setIsSoundingOut(false);
    }
  }, [wordData, isSoundingOut]);

  // ─── Narration mode (Read to Me) ───────────────────────────────────
  const isNarrating = narrationHighlight !== null;
  const isTricky = wordData.isTricky;

  if (isNarrating) {
    const { wholeWord } = narrationHighlight;
    const colour = wholeWord
      ? (isTricky ? 'text-purple-600' : 'text-red-500')
      : 'text-slate-800';
    const scale = wholeWord ? 'scale-110' : '';

    return (
      <div className={`inline-flex flex-col items-center ${wordMargin}`}>
        <span
          className={`${textSize} font-bold ${wordPad} rounded-xl transition-all duration-200 ${colour} ${scale}`}
          style={{ fontFamily: "'Andika', sans-serif" }}
        >
          {wordData.display}
        </span>
        {showAnnotations && isTricky && (
          <div className="flex justify-center w-full" style={{ marginTop: 1 }}>
            <div className="bg-purple-500 rounded-full" style={{ height: strokeW, width: '85%' }} />
          </div>
        )}
      </div>
    );
  }

  // ─── Normal interactive mode ────────────────────────────────────────

  // Work out which letter spans are active during sounding out
  const getSpanHighlight = (span: LetterSpan): boolean => {
    if (activePhonemeIdx === null) return false;
    return span.phonemeIdx === activePhonemeIdx;
  };

  return (
    <div className={`inline-flex flex-col items-center ${wordMargin}`}>
      <button
        onClick={handleTap}
        className={`
          ${textSize} font-bold rounded-xl ${wordPad}
          transition-all duration-200 select-none
          ${highlight
            ? 'text-pink-600 scale-110 bg-pink-100'
            : tapped
              ? 'text-purple-600 scale-105 bg-purple-50'
              : isSoundingOut
                ? 'text-slate-800 bg-amber-50'
                : 'text-slate-800 hover:bg-pink-50 active:scale-95'
          }
        `}
        aria-label={`Tap to hear "${wordData.word}"`}
        style={{ fontFamily: "'Andika', sans-serif" }}
      >
        {(showAnnotations && spans) ? (
          /* ─── Annotated word (normal, non-tricky) ─── */
          <span className="inline-flex flex-col items-center relative" ref={containerRef}>
            {/* Split digraph arc — above the letters */}
            {arcPath && (
              <svg
                className="absolute pointer-events-none"
                style={{ left: arcOffset, top: -annotH * 0.5 }}
                width={arcWidth}
                height={annotH}
                viewBox={`0 0 ${arcWidth} ${annotH}`}
              >
                <path
                  d={arcPath}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth={strokeW}
                  strokeLinecap="round"
                />
              </svg>
            )}

            {/* Letters */}
            <span className="inline-flex">
              {spans.map((span, i) => (
                <span
                  key={i}
                  ref={el => { letterRefs.current[i] = el; }}
                  className={`transition-colors duration-100 ${getSpanHighlight(span) ? 'text-pink-600' : ''}`}
                >
                  {span.letter}
                </span>
              ))}
            </span>

            {/* Annotation row — dots and lines below letters */}
            <span className="relative flex items-end justify-start w-full" style={{ height: annotH }}>
              <span className="inline-flex items-center" style={{ height: annotH }}>
                {spans.map((span, i) => {
                  const cleanLen = span.letter.replace(/[^a-zA-Z]/g, '').length || 1;
                  const spanW = `${cleanLen}ch`;

                  if (span.annotation === 'dot' || span.annotation === 'arc-mid-dot') {
                    return (
                      <span key={i} className="inline-flex justify-center items-end" style={{ width: spanW, height: annotH }}>
                        <svg width={dotR * 2 + 2} height={dotR * 2 + 2}>
                          <circle cx={dotR + 1} cy={dotR + 1} r={dotR} fill="#1e293b" />
                        </svg>
                      </span>
                    );
                  }
                  if (span.annotation === 'line-start' || span.annotation === 'line-mid' || span.annotation === 'line-end') {
                    const isStart = span.annotation === 'line-start';
                    const isEnd = span.annotation === 'line-end';
                    return (
                      <span key={i} className="inline-flex items-end" style={{ width: spanW, height: annotH }}>
                        <span
                          className="bg-slate-800"
                          style={{
                            height: strokeW,
                            width: '100%',
                            borderRadius: isStart ? `${strokeW}px 0 0 ${strokeW}px` : isEnd ? `0 ${strokeW}px ${strokeW}px 0` : 0,
                          }}
                        />
                      </span>
                    );
                  }
                  if (span.annotation === 'arc-start' || span.annotation === 'arc-end') {
                    // No dot — the arc connects these two letters
                    return <span key={i} style={{ width: spanW, height: annotH }} />;
                  }
                  return <span key={i} style={{ width: spanW, height: annotH }} />;
                })}
              </span>
            </span>
          </span>
        ) : (showAnnotations && isTricky) ? (
          /* ─── Tricky word with purple underline ─── */
          <span className="inline-flex flex-col items-center">
            <span>{wordData.display}</span>
            <span className="flex justify-center w-full" style={{ height: annotH }}>
              <span className="bg-purple-500 rounded-full self-end" style={{ height: strokeW, width: '85%' }} />
            </span>
          </span>
        ) : (
          /* ─── Plain text (no annotations) ─── */
          wordData.display
        )}
      </button>
    </div>
  );
}
