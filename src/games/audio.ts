/**
 * Shared WebAudio sound kit for the mini-games.
 *
 * Lifted from Milo's Cannon (WordCannonGame.tsx), which synthesises all
 * its effects with oscillators — no audio files, nothing to load, and the
 * same "paper toy" sound palette for every game: triangle-wave pops for
 * correct answers, a soft sawtooth bonk for wrong ones, a rising chord +
 * sparkle arpeggio for finishing.
 *
 * Everything is fire-and-forget and best-effort: no AudioContext (old
 * browser, autoplay policy) means silence, never an error. The context is
 * created lazily on the first call — which in every game is always inside
 * a user gesture (a tap), so autoplay rules are satisfied.
 */

let audioCtx: AudioContext | null = null;

function actx(): AudioContext | null {
  if (!audioCtx) {
    try {
      audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch { /* no audio available */ }
  }
  if (audioCtx?.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

/** One enveloped oscillator note. */
export function tone(freq: number, dur: number, type: OscillatorType, vol = 0.18): void {
  const c = actx();
  if (!c) return;
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    o.connect(g);
    g.connect(c.destination);
    const t = c.currentTime;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.03);
  } catch { /* context died mid-call — stay silent */ }
}

export const sfx = {
  /** Correct answer — bright bubble pop. */
  pop(): void {
    tone(880 + Math.random() * 240, 0.09, 'triangle', 0.18);
    tone(1400, 0.05, 'sine', 0.08);
  },
  /** Wrong answer — soft low bonk, deliberately un-scary. */
  bonk(): void {
    tone(110, 0.16, 'sawtooth', 0.1);
  },
  /** Small neutral click — card flips, taps, UI. */
  tick(): void {
    tone(600, 0.05, 'sine', 0.06);
  },
  /** A star earned — quick two-note rise. */
  star(): void {
    tone(880, 0.1, 'triangle', 0.14);
    setTimeout(() => tone(1320, 0.14, 'triangle', 0.14), 70);
  },
  /** Combo / streak milestone — rising sparkle arpeggio. */
  sparkle(): void {
    [660, 880, 1100, 1320, 1760].forEach((f, i) =>
      setTimeout(() => tone(f * (0.98 + Math.random() * 0.04), 0.18, 'triangle', 0.12), i * 60));
  },
  /** Word / round complete — warm major chord. */
  chord(): void {
    [523, 659, 784, 1047].forEach((f, i) =>
      setTimeout(() => tone(f, 0.24, 'triangle', 0.16), i * 80));
  },
  /** End-of-game celebration — chord into sparkle. */
  fanfare(): void {
    sfx.chord();
    setTimeout(() => sfx.sparkle(), 350);
  },
};
