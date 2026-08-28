/**
 * WordCannonGame — "Milo's Cannon" full-screen mini-game.
 *
 * A pirate-ship word-building game: sound bubbles drift over the waves,
 * a wooden word-plank is carried by two gulls. The child aims the cannon
 * (it tracks the pointer/finger) and fires at the sound bubble that
 * belongs in the next empty slot. Correct → the sound sails into the
 * plank with a splash + ring + rising note; the word completing fires
 * a confetti burst and a star flies into the HUD counter. Wrong → the
 * bubble bounces off red.
 *
 * Same "paper & stickers" family as the other games, but rendered on
 * <canvas> with a real 60fps game loop (screen shake, hitstop, particles,
 * squash/stretch, eased motion) — this is deliberately more "arcade" than
 * SoundGame/FinishWordGame, for variety in the games row.
 *
 * Two modes, same shape as your other games:
 *  - Relax  — 5 words, collect a star per word
 *  - Speedy — 40 seconds, how many words can you complete?
 *
 * No data writes — pure practice, same as the other three games.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { speakWord } from '@/lib/soundGameWords';
import { hasAudio, loadAudioManifest } from '@/lib/greenWords';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

interface WordEntry {
  word: string;
  tiles: string[];
}

const RELAX_ROUNDS = 5;
const SPEEDY_SECONDS = 40;

/**
 * Curated word banks per journey level. Tiles are the letter/grapheme
 * breakdown the child builds (matches the `letters:` arrays already used
 * for this word elsewhere in the curriculum, e.g. interactiveBookData.ts).
 * Every word here has a matching /images/words/{word}.png asset.
 */
const WORD_DATA: Record<number, WordEntry[]> = {
  1: [
    { word: 'cat', tiles: ['c', 'a', 't'] }, { word: 'tap', tiles: ['t', 'a', 'p'] },
    { word: 'mat', tiles: ['m', 'a', 't'] }, { word: 'sat', tiles: ['s', 'a', 't'] },
    { word: 'pig', tiles: ['p', 'i', 'g'] }, { word: 'pan', tiles: ['p', 'a', 'n'] },
    { word: 'pin', tiles: ['p', 'i', 'n'] }, { word: 'nap', tiles: ['n', 'a', 'p'] },
  ],
  2: [
    { word: 'dog', tiles: ['d', 'o', 'g'] }, { word: 'mud', tiles: ['m', 'u', 'd'] },
    { word: 'mop', tiles: ['m', 'o', 'p'] }, { word: 'tub', tiles: ['t', 'u', 'b'] },
    { word: 'run', tiles: ['r', 'u', 'n'] }, { word: 'pup', tiles: ['p', 'u', 'p'] },
    { word: 'hug', tiles: ['h', 'u', 'g'] }, { word: 'fox', tiles: ['f', 'o', 'x'] },
    { word: 'jam', tiles: ['j', 'a', 'm'] }, { word: 'van', tiles: ['v', 'a', 'n'] },
    { word: 'yak', tiles: ['y', 'a', 'k'] }, { word: 'zip', tiles: ['z', 'i', 'p'] },
  ],
  3: [
    { word: 'ship', tiles: ['sh', 'i', 'p'] }, { word: 'fish', tiles: ['f', 'i', 'sh'] },
    { word: 'chop', tiles: ['ch', 'o', 'p'] }, { word: 'chip', tiles: ['ch', 'i', 'p'] },
    { word: 'thin', tiles: ['th', 'i', 'n'] }, { word: 'ring', tiles: ['r', 'i', 'ng'] },
    { word: 'song', tiles: ['s', 'o', 'ng'] }, { word: 'quiz', tiles: ['qu', 'i', 'z'] },
    { word: 'buzz', tiles: ['b', 'u', 'zz'] }, { word: 'hiss', tiles: ['h', 'i', 'ss'] },
  ],
  4: [
    { word: 'day', tiles: ['d', 'ay'] }, { word: 'see', tiles: ['s', 'ee'] },
    { word: 'high', tiles: ['h', 'igh'] }, { word: 'night', tiles: ['n', 'igh', 't'] },
    { word: 'zoo', tiles: ['z', 'oo'] }, { word: 'cow', tiles: ['c', 'ow'] },
    { word: 'cool', tiles: ['c', 'oo', 'l'] }, { word: 'farm', tiles: ['f', 'ar', 'm'] },
    { word: 'corn', tiles: ['c', 'or', 'n'] }, { word: 'fork', tiles: ['f', 'or', 'k'] },
    { word: 'hair', tiles: ['h', 'air'] }, { word: 'fair', tiles: ['f', 'air'] },
  ],
  5: [
    { word: 'cake', tiles: ['c', 'a', 'k', 'e'] }, { word: 'bike', tiles: ['b', 'i', 'k', 'e'] },
    { word: 'bone', tiles: ['b', 'o', 'n', 'e'] }, { word: 'gate', tiles: ['g', 'a', 't', 'e'] },
    { word: 'boat', tiles: ['b', 'oa', 't'] }, { word: 'coat', tiles: ['c', 'oa', 't'] },
    { word: 'rain', tiles: ['r', 'ai', 'n'] }, { word: 'tail', tiles: ['t', 'ai', 'l'] },
    { word: 'coin', tiles: ['c', 'oi', 'n'] }, { word: 'soil', tiles: ['s', 'oi', 'l'] },
  ],
  6: [
    { word: 'fur', tiles: ['f', 'ur'] }, { word: 'burn', tiles: ['b', 'ur', 'n'] },
    { word: 'care', tiles: ['c', 'are'] }, { word: 'share', tiles: ['sh', 'are'] },
    { word: 'blue', tiles: ['bl', 'ue'] }, { word: 'glue', tiles: ['gl', 'ue'] },
    { word: 'phone', tiles: ['ph', 'o', 'n', 'e'] }, { word: 'whale', tiles: ['wh', 'a', 'l', 'e'] },
  ],
  7: [
    { word: 'fire', tiles: ['f', 'ire'] }, { word: 'wire', tiles: ['w', 'ire'] },
    { word: 'more', tiles: ['m', 'ore'] }, { word: 'shore', tiles: ['sh', 'ore'] },
    { word: 'hear', tiles: ['h', 'ear'] }, { word: 'near', tiles: ['n', 'ear'] },
    { word: 'door', tiles: ['d', 'oor'] }, { word: 'floor', tiles: ['fl', 'oor'] },
  ],
  8: [
    { word: 'famous', tiles: ['f', 'a', 'm', 'ous'] }, { word: 'nervous', tiles: ['n', 'er', 'v', 'ous'] },
    { word: 'precious', tiles: ['p', 'r', 'e', 'cious'] }, { word: 'delicious', tiles: ['d', 'e', 'l', 'i', 'cious'] },
    { word: 'enjoyable', tiles: ['e', 'n', 'j', 'oy', 'able'] }, { word: 'comfortable', tiles: ['c', 'o', 'm', 'f', 'or', 't', 'able'] },
  ],
};

// Full letter/grapheme pool per level, used to draw wrong-answer bubbles.
const GRAPHEME_POOL: Record<number, string[]> = {
  1: ['s', 'a', 't', 'p', 'i', 'n', 'm', 'd', 'g', 'o'],
  2: ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'l', 'j', 'v', 'w', 'x', 'y', 'z'],
  3: ['sh', 'nk', 'ch', 'th', 'ng', 'qu', 'zz'],
  4: ['ay', 'ee', 'igh', 'ow', 'oo', 'ar', 'or', 'air', 'ir', 'ou', 'oy'],
  5: ['ea', 'ie', 'oi', 'aw', 'ai', 'oa', 'a', 'e', 'i', 'o'],
  6: ['ur', 'er', 'are', 'ew', 'ue', 'wr', 'kn', 'ph', 'wh'],
  7: ['ire', 'ore', 'ear', 'oor', 'ure', 'tion'],
  8: ['ous', 'cious', 'tious', 'able', 'ible'],
};

/**
 * Green-words ledger (`public/green_words.json`, generated by
 * scripts/build_word_ledger.py — never hand-edited). Fetched once per session
 * and shared by every mount. The curated WORD_DATA / GRAPHEME_POOL above stay
 * as the fallback for when the fetch fails, so the game is never wordless.
 */
interface LedgerWord { word: string; sound: string; level: number; units: string[] }

let ledgerPromise: Promise<LedgerWord[]> | null = null;
function loadLedger(): Promise<LedgerWord[]> {
  if (!ledgerPromise) {
    ledgerPromise = fetch('/green_words.json')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { words?: LedgerWord[] }) => d.words ?? [])
      .catch(() => []);
  }
  return ledgerPromise;
}

/** The plank only fits this many sound buttons. */
const MIN_UNITS = 2;
const MAX_UNITS = 6;

/** Words that sit exactly at the child's level and fit on the plank. */
function bankFor(all: LedgerWord[], lvl: number): WordEntry[] {
  return all
    // hasAudio: speakWord no longer falls back to TTS, and the word being
    // SPOKEN is the whole cue on audio-only rounds — unvoiced words are out.
    .filter(w => w.level === lvl && w.units.length >= MIN_UNITS && w.units.length <= MAX_UNITS && hasAudio(w.word))
    .map(w => ({ word: w.word, tiles: w.units }));
}

/** Distractors are drawn only from graphemes the child has already been
 *  taught — never a sound from a level they have not reached. */
function poolFor(all: LedgerWord[], lvl: number): string[] {
  const seen = new Set<string>();
  for (const w of all) {
    if (w.level > lvl) continue;
    for (const u of w.units) seen.add(u);
  }
  return [...seen];
}

type Phase = 'intro' | 'play' | 'celebrate';
type Mode = 'relax' | 'speedy';

interface Ball {
  g: string; id: string; r: number;
  x: number; y: number; vx: number; vy: number;
  state: 'float' | 'flying' | 'placed';
  t: number; sx: number; sy: number; slot: number;
  wrong: number; born: number; ph: number; spin: number;
}
interface Slot { expected: string; filled: string | null; land: number; x: number; y: number; size: number; }
interface Particle { kind: 'puff' | 'conf'; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; vr: number; }
/** A real cannonball: spawned at the muzzle with a velocity, integrated
 *  every frame, resolved by circle-circle collision with whatever bubble
 *  it actually hits — never by which bubble was clicked. */
interface Shot { x: number; y: number; vx: number; vy: number; r: number; t: number; dead: boolean; }

const HEX_FALLBACK = '#E84B8A';
const INK_FALLBACK = '#BE1862';

export default function WordCannonGame({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [showPicker, setShowPicker] = useState(true);

  // Everything below is mutable game state living outside React render —
  // this is a real-time 60fps loop, not something React should re-render for.
  const g = useRef({
    HEX: level.hex || HEX_FALLBACK, INK: level.inkHex || INK_FALLBACK,
    words: WORD_DATA[level.level] || WORD_DATA[1],
    pool: GRAPHEME_POOL[level.level] || GRAPHEME_POOL[1],
    t: 0, freeze: 0,
    clouds: [] as { x: number; y: number; s: number; v: number; ph: number }[],
    balls: [] as Ball[], particles: [] as Particle[], rings: [] as { x: number; y: number; t: number }[],
    trails: [] as { x: number; y: number; life: number; max: number; size: number }[],
    flyStars: [] as { x: number; y: number; t: number }[], shots: [] as Shot[],
    slots: [] as Slot[], queue: [] as WordEntry[], qi: 0, round: null as WordEntry | null,
    stars: 0, phase: 'intro' as Phase, mode: 'relax' as Mode, score: 0, timeLeft: SPEEDY_SECONDS,
    shake: 0, cannonKick: 0,
    aimX: 0, aimY: 0, aimA: -1.1,
    celebrateAt: 0, roundIn: 0, wordWave: -1,
    pics: {} as Record<string, HTMLImageElement>, fontReady: false,
    // Painted scenery (public/images/cannon). Each is optional: if it fails to
    // load the procedural version below draws instead, so the game never breaks
    // on a missing asset.
    art: {} as Record<string, HTMLImageElement>,
    sparks: [] as { x: number; y: number; ph: number; sp: number; r: number }[],
    gullBoost: 0,
    raf: 0, last: 0, W: 0, H: 0, dpr: 1,
    audioCtx: null as AudioContext | null,
    timerHandle: 0 as any,
  });

  // Bind the bank to the real ledger so it always matches the child's level.
  // Runs alongside the game loop: if it lands mid-session the next queue refill
  // picks it up, and if it fails the curated fallback is already in place.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLedger(), loadAudioManifest()]).then(([all]) => {
      if (cancelled || !all.length) return;
      const state = g.current;
      const bank = bankFor(all, level.level);
      const pool = poolFor(all, level.level);
      // A thin bank or pool would make rounds repetitive or leave too few
      // distractors, so keep the curated list in that case.
      if (bank.length < 4 || pool.length < 3) return;
      state.words = bank;
      state.pool = pool;
      if (state.phase === 'intro') { state.queue = []; state.qi = 0; }
    });
    return () => { cancelled = true; };
  }, [level.level]);

  useEffect(() => {
    const state = g.current;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pictures load lazily per round: a full ledger level can be 400+ words and
    // most have no artwork, so preloading the bank would fire hundreds of 404s.
    // A word with no image falls back to the audio-only speaker card.
    state.words.slice(0, 12).forEach(w => { const im = new Image(); im.src = `/images/words/${w.word}.png`; state.pics[w.word] = im; });

    // Painted sky and sea, drawn under the animated sun, clouds and foam.
    // Only the backdrop is a bitmap: the plank resizes to 2-6 slots and the
    // cannon rotates to track the finger, so both stay procedural rather than
    // being stretched or skewed sprites.
    (['sea'] as const).forEach(k => {
      const im = new Image();
      im.src = `/images/cannon/cannon_${k}.webp`;
      state.art[k] = im;
    });
    const ready = (k: string) => {
      const im = state.art[k];
      return !!(im && im.complete && im.naturalWidth);
    };
    try { document.fonts.ready.then(() => { state.fontReady = true; }); } catch { state.fontReady = true; }

    // ── geometry ──
    // A short landscape phone has very little room between the picture card
    // and the plank, so the layout adapts rather than letting bubbles cover
    // the slots: the card shrinks, the plank drops, and the bubbles size
    // themselves from whatever band is left.
    const short = () => state.H < 520;
    const cardW = () => Math.min(140, state.W * 0.3, state.H * (short() ? 0.2 : 0.24));
    const cardY = () => state.H * 0.035;
    const plankY = () => state.H * (short() ? 0.7 : 0.64);
    const slotSize = () => Math.max(46, Math.min(70, state.W / (Math.max(3, state.slots.length) + 3.4)));
    const plankTop = () => plankY() - slotSize() / 2 - slotSize() * 0.34;

    const ballR = () => {
      const floor = state.W < 480 ? 21 : 26;
      const byWidth = Math.max(floor, Math.min(38, state.W * 0.05));
      // enough band for a bubble plus a little drift above and below
      const byBand = (plankTop() - 10 - (cardY() + cardW() + 20)) / 2.6;
      return Math.max(14, Math.min(38, byWidth, byBand));
    };
    const arenaTop = () => cardY() + cardW() + 20 + ballR();
    // Hard ceiling: never let the arena floor cross the plank, even if that
    // leaves the band thinner than a bubble.
    const arenaBot = () => Math.max(arenaTop(), plankTop() - ballR() - 10);
    const seaY = () => state.H * 0.56;
    const deckY = () => state.H * 0.8;
    const miloSize = () => Math.min(140, state.W * 0.26);
    const cannonPos = () => { const ms = miloSize(); return { x: ms * 0.72, y: state.H * 0.93 - ms * 0.3 }; };

    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      state.dpr = dpr;
      state.W = canvas!.clientWidth; state.H = canvas!.clientHeight;
      canvas!.width = Math.round(state.W * dpr); canvas!.height = Math.round(state.H * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildWorld(); positionSlots();
    }
    function buildWorld() {
      state.clouds = Array.from({ length: 4 }, () => ({
        x: Math.random() * state.W, y: state.H * (0.04 + Math.random() * 0.14),
        s: 0.45 + Math.random() * 0.8, v: 5 + Math.random() * 9, ph: Math.random() * 7,
      }));
      state.aimX = state.W * 0.7; state.aimY = state.H * 0.35;
    }
    function positionSlots() {
      if (!state.slots.length) return;
      const n = state.slots.length, size = slotSize(), gap = size * 0.24;
      const totalW = n * size + (n - 1) * gap, startX = state.W / 2 - totalW / 2, y = plankY();
      state.slots.forEach((s, i) => { s.size = size; s.x = startX + i * (size + gap) + size / 2; s.y = y; });
    }

    const easeOutBack = (t: number) => { const c = 1.70158 * 1.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    // ── audio ──
    function actx() { if (!state.audioCtx) { try { state.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch { /* n/a */ } } return state.audioCtx; }
    function tone(f: number, dur: number, type: OscillatorType, vol?: number) {
      const c = actx(); if (!c) return;
      if (c.state === 'suspended') { c.resume().catch(() => {}); }
      const o = c.createOscillator(), gn = c.createGain();
      o.type = type; o.frequency.value = f; o.connect(gn); gn.connect(c.destination);
      const t = c.currentTime;
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.exponentialRampToValueAtTime(vol ?? 0.18, t + 0.01);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.03);
    }
    function boom() {
      const c = actx(); if (!c) return;
      const o = c.createOscillator(), gn = c.createGain();
      o.type = 'square'; o.connect(gn); gn.connect(c.destination);
      const t = c.currentTime;
      o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.18);
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.14, t + 0.012); gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.start(t); o.stop(t + 0.24);
    }
    const popSnd = () => { tone(880 + Math.random() * 240, 0.09, 'triangle', 0.18); tone(1400, 0.05, 'sine', 0.08); };
    const thunk = () => { tone(180 + Math.random() * 40, 0.1, 'triangle', 0.22); tone(80, 0.16, 'sine', 0.2); };
    const bonk = () => tone(110, 0.16, 'sawtooth', 0.12);
    const sparkleArp = () => [660, 880, 1100, 1320, 1760].forEach((f, i) => setTimeout(() => tone(f * (0.98 + Math.random() * 0.04), 0.18, 'triangle', 0.12), i * 60));
    const chord = () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.24, 'triangle', 0.16), i * 80));

    // ── rounds ──
    function shuffle<T>(a: T[]): T[] { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1));[a[i], a[j]] = [a[j], a[i]]; } return a; }
    function newRound(qi: number) {
      if (!state.queue.length || qi >= state.queue.length) { state.queue = shuffle(state.words); qi = 0; }
      state.qi = qi;
      const w = state.queue[qi];
      state.round = w;
      if (!state.pics[w.word]) {                       // lazy picture for this round
        const im = new Image();
        im.src = `/images/words/${w.word}.png`;
        state.pics[w.word] = im;
      }
      state.slots = w.tiles.map(t => ({ expected: t, filled: null, land: 0, x: 0, y: 0, size: 0 }));
      positionSlots();
      state.roundIn = 0; state.wordWave = -1;
      const dist = shuffle(state.pool.filter(t => w.tiles.indexOf(t) < 0)).slice(0, 2);
      const set = shuffle(w.tiles.map((t, i) => ({ g: t, id: 'c' + i })).concat(dist.map((t, i) => ({ g: t, id: 'd' + i }))));
      const aT = arenaTop(), aB = arenaBot();
      state.balls = set.map((b, i) => ({
        g: b.g, id: b.id + '_' + qi, r: ballR(),
        x: Math.max(ballR() * 1.15 + 10, Math.min(state.W - ballR() * 1.15 - 10,
             state.W * (0.14 + 0.72 * (i + 0.5) / set.length) + (Math.random() * 20 - 10))),
        y: aT + Math.random() * Math.max(10, aB - aT),
        vx: (Math.random() * 2 - 1) * 30, vy: (Math.random() * 2 - 1) * 24,
        state: 'float', t: 0, sx: 0, sy: 0, slot: -1, wrong: 0, born: -i * 0.09, ph: Math.random() * 7, spin: 0,
      }));
      setTimeout(() => speakWord(w.word), 300);
    }

    // ── input ──
    function aimAngle(x: number, y: number) {
      const cp = cannonPos();
      const a = Math.atan2(y - cp.y, x - cp.x);
      return Math.max(-2.2, Math.min(-0.15, a));
    }
    function onAim(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      state.aimX = e.clientX - rect.left; state.aimY = e.clientY - rect.top;
    }
    function smoke(x: number, y: number) {
      for (let i = 0; i < 7; i++) {
        const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 60;
        state.particles.push({ kind: 'puff', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 8 + Math.random() * 10, color: 'rgba(255,255,255,0.9)', rot: 0, vr: 0 });
      }
    }
    function droplets(x: number, y: number) {
      for (let i = 0; i < 12; i++) {
        const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
        state.particles.push({ kind: 'puff', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.35 + Math.random() * 0.25, max: 0.6, size: 3 + Math.random() * 4, color: 'rgba(160,220,245,0.95)', rot: 0, vr: 0 });
      }
    }
    function burst(x: number, y: number, colors: string[], n: number, spread?: number) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 70 + Math.random() * (spread || 280);
        state.particles.push({ kind: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0.7 + Math.random() * 0.7, max: 1.4, size: 4 + Math.random() * 7, color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() * 2 - 1) * 12 });
      }
    }
    function fire(x: number, y: number) {
      const cp = cannonPos(); const barrel = miloSize() * 0.62;
      const a = aimAngle(x, y);
      const mx = cp.x + Math.cos(a) * barrel, my = cp.y + Math.sin(a) * barrel;
      // Muzzle velocity along the aim line. Fast enough that a shot aimed
      // squarely at a bubble lands before it drifts away, slow enough that
      // the ball visibly crosses the sky.
      const speed = Math.max(state.W, state.H) * 1.7;
      state.shots.push({ x: mx, y: my, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: 9, t: 0, dead: false });
      state.cannonKick = 1; boom(); smoke(mx, my); state.shake = Math.max(state.shake, 3);
    }
    /** The cannonball physically struck this bubble. */
    function resolveHit(sh: Shot, b: Ball) {
      const nextIdx = state.slots.findIndex(s => !s.filled);
      if (nextIdx >= 0 && b.g === state.slots[nextIdx].expected) {
        popSnd(); state.rings.push({ x: b.x, y: b.y, t: 0 }); droplets(b.x, b.y);
        b.state = 'flying'; b.t = 0; b.sx = b.x; b.sy = b.y; b.slot = nextIdx;
        sh.dead = true;
      } else {
        // Wrong bubble: it wobbles red and shrugs the ball off — the shot
        // deflects away with most of its energy gone.
        b.wrong = 0.55; bonk(); state.shake = Math.max(state.shake, 5);
        b.vx += sh.vx * 0.12; b.vy += sh.vy * 0.08 - 60;
        const nx = (sh.x - b.x), ny = (sh.y - b.y), nl = Math.hypot(nx, ny) || 1;
        const dot = (sh.vx * nx + sh.vy * ny) / nl;
        sh.vx = (sh.vx - 2 * dot * (nx / nl)) * 0.3;
        sh.vy = (sh.vy - 2 * dot * (ny / nl)) * 0.3 + 40;
        sh.t = Math.max(sh.t, 1.8); // dies shortly after the bounce
      }
    }
    function complete() {
      state.phase = 'celebrate'; state.celebrateAt = state.t;
      state.shake = 9; state.freeze = 0.05; state.wordWave = state.t;
      if (state.round) speakWord(state.round.word);
      chord(); setTimeout(sparkleArp, 350);
      if (state.mode === 'relax') state.stars += 1; else state.score += 1;
      const cols = [state.HEX, state.INK, '#FDBA2D', '#22C55E', '#3B82F6', '#ffffff'];
      burst(state.W / 2, plankY(), cols, 44);
      setTimeout(() => burst(state.W * 0.3, state.H * 0.4, cols, 22, 200), 200);
      setTimeout(() => burst(state.W * 0.7, state.H * 0.4, cols, 22, 200), 340);
      state.flyStars.push({ x: state.W / 2, y: plankY() - 40, t: 0 });
    }
    // Keyboard: arrows swing the barrel, Space/Enter fires along it.
    function onKey(e: KeyboardEvent) {
      if (state.phase !== 'play') return;
      const cp = cannonPos();
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const a = Math.max(-2.15, Math.min(-0.2, state.aimA + (e.key === 'ArrowLeft' ? -0.11 : 0.11)));
        state.aimX = cp.x + Math.cos(a) * 400; state.aimY = cp.y + Math.sin(a) * 400;
        e.preventDefault();
      } else if (e.key === ' ' || e.key === 'Enter') {
        fire(cp.x + Math.cos(state.aimA) * 400, cp.y + Math.sin(state.aimA) * 400);
        e.preventDefault();
      }
    }

    function onTap(e: PointerEvent) {
      const c = actx(); if (c && c.state === 'suspended') c.resume().catch(() => {});
      const rect = canvas!.getBoundingClientRect();
      const x = e.clientX - rect.left, y = e.clientY - rect.top;
      state.aimX = x; state.aimY = y;
      if (state.phase === 'intro' && !state.round) return; // waiting for the picker buttons, not a bare tap-to-start
      if (state.round && y < cardY() + cardW() && Math.abs(x - state.W / 2) < cardW() * 0.7) { speakWord(state.round.word); tone(600, 0.05, 'sine', 0.06); return; }
      if (state.phase !== 'play') return;
      fire(x, y);
    }
    function startMode(mode: Mode) {
      if (state.timerHandle) clearInterval(state.timerHandle);
      state.mode = mode; state.stars = 0; state.score = 0; state.timeLeft = SPEEDY_SECONDS;
      state.queue = []; state.qi = 0; state.phase = 'play';
      setShowPicker(false);
      newRound(0);
      if (mode === 'speedy') {
        state.timerHandle = setInterval(() => {
          state.timeLeft -= 1;
          if (state.timeLeft <= 0) { clearInterval(state.timerHandle); state.timeLeft = 0; state.phase = 'intro'; state.round = null; setShowPicker(true); }
        }, 1000);
      }
    }
    (canvasRef.current as any).__startMode = startMode;

    // ── update ──
    function update(dt: number) {
      dt = Math.min(dt, 0.05);
      if (state.freeze > 0) { state.freeze -= dt; return; }
      state.t += dt;
      state.roundIn = Math.min(1, state.roundIn + dt / 0.6);
      state.shake *= Math.pow(0.001, dt);
      state.cannonKick *= Math.pow(0.02, dt);
      state.gullBoost *= Math.pow(0.05, dt);
      if (state.shake < 0.2) state.shake = 0;
      const ta = aimAngle(state.aimX, state.aimY);
      state.aimA += (ta - state.aimA) * Math.min(1, dt * 10);

      for (const c of state.clouds) { c.x += c.v * dt; if (c.x - 160 * c.s > state.W) c.x = -170 * c.s; }

      const aT = arenaTop(), aB = arenaBot();
      for (const b of state.balls) {
        b.born += dt;
        if (b.wrong > 0) b.wrong -= dt;
        if (b.state === 'float') {
          b.x += b.vx * dt; b.y += b.vy * dt;
          b.vx += (Math.random() * 2 - 1) * 8 * dt; b.vy += (Math.random() * 2 - 1) * 8 * dt;
          const sp = Math.hypot(b.vx, b.vy), MAX = 58; if (sp > MAX) { b.vx *= MAX / sp; b.vy *= MAX / sp; }
          const L = b.r * 1.15 + 10, R = state.W - b.r * 1.15 - 10;
          if (b.x < L) { b.x = L; b.vx = Math.abs(b.vx); } if (b.x > R) { b.x = R; b.vx = -Math.abs(b.vx); }
          if (b.y < aT) { b.y = aT; b.vy = Math.abs(b.vy); } if (b.y > aB) { b.y = aB; b.vy = -Math.abs(b.vy); }
          for (const o of state.balls) {
            if (o === b || o.state !== 'float' || o.born < 0) continue;
            const dx = b.x - o.x, dy = b.y - o.y, dist = Math.hypot(dx, dy) || 0.001, min = b.r + o.r + 4;
            if (dist < min) {
              const push = (min - dist) / 2, ux = dx / dist, uy = dy / dist;
              b.x += ux * push; b.y += uy * push; o.x -= ux * push; o.y -= uy * push;
              b.vx += ux * 26; b.vy += uy * 26; o.vx -= ux * 26; o.vy -= uy * 26;
              b.x = Math.max(L, Math.min(R, b.x)); o.x = Math.max(L, Math.min(R, o.x));
              b.y = Math.max(aT, Math.min(aB, b.y)); o.y = Math.max(aT, Math.min(aB, o.y));
            }
          }
        } else if (b.state === 'flying') {
          b.t += dt / 0.38; b.spin += dt * 9;
          const s = state.slots[b.slot];
          state.trails.push({ x: b.x, y: b.y, life: 0.35, max: 0.35, size: 3 + Math.random() * 4 });
          if (b.t >= 1) {
            b.state = 'placed'; b.x = s.x; b.y = s.y; s.filled = b.g; s.land = state.t;
            thunk(); state.shake = Math.max(state.shake, 6); state.freeze = 0.045;
            state.gullBoost = 1;
            state.rings.push({ x: s.x, y: s.y, t: 0 });
            burst(s.x, s.y, [state.HEX, '#FDBA2D', '#ffffff'], 14, 180);
            tone(880 + state.slots.filter(z => z.filled).length * 120, 0.12, 'triangle', 0.14);
            if (state.slots.every(z => z.filled)) complete();
          } else {
            const e = b.t * b.t * (3 - 2 * b.t);
            b.x = b.sx + (s.x - b.sx) * e;
            b.y = b.sy + (s.y - b.sy) * e - Math.sin(Math.PI * b.t) * (state.H * 0.1);
          }
        }
      }
      for (let i = state.shots.length - 1; i >= 0; i--) {
        const sh = state.shots[i]; sh.t += dt;
        // Light gravity: shots arc very slightly, like a real (toy) cannon.
        sh.vy += 260 * dt;
        sh.x += sh.vx * dt; sh.y += sh.vy * dt;
        state.trails.push({ x: sh.x, y: sh.y, life: 0.25, max: 0.25, size: 2.5 + Math.random() * 3 });
        // Collision sweep against the floating bubbles — whichever the ball
        // actually reaches first is the one that resolves.
        if (!sh.dead) {
          for (const b of state.balls) {
            if (b.state !== 'float' || b.born < 0) continue;
            if (Math.hypot(b.x - sh.x, b.y - sh.y) < b.r + sh.r) { resolveHit(sh, b); break; }
          }
        }
        // A shot that sails into the sea splashes; one that leaves the sky
        // just expires. Either way a miss is a visible non-event, not a hit.
        const splashY = plankTop() - 6;
        if (!sh.dead && sh.vy > 0 && sh.y > splashY) { droplets(sh.x, splashY); sh.dead = true; }
        if (sh.dead || sh.t > 2.4 || sh.x < -60 || sh.x > state.W + 60 || sh.y < -80) {
          state.shots.splice(i, 1);
        }
      }
      for (let i = state.trails.length - 1; i >= 0; i--) { const p = state.trails[i]; p.life -= dt; if (p.life <= 0) state.trails.splice(i, 1); }
      for (let i = state.rings.length - 1; i >= 0; i--) { const r = state.rings[i]; r.t += dt / 0.45; if (r.t >= 1) state.rings.splice(i, 1); }
      for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i]; p.life -= dt;
        if (p.life <= 0) { state.particles.splice(i, 1); continue; }
        if (p.kind === 'conf') p.vy += 600 * dt; else { p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt); p.size += 14 * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      }
      for (let i = state.flyStars.length - 1; i >= 0; i--) {
        const f = state.flyStars[i]; f.t += dt / 0.8;
        if (f.t >= 1) { state.flyStars.splice(i, 1); tone(1320, 0.14, 'triangle', 0.14); state.shake = Math.max(state.shake, 3); }
      }
      if (state.phase === 'celebrate' && state.t - state.celebrateAt > 1.7) {
        if (state.mode === 'relax' && state.stars >= RELAX_ROUNDS) { state.phase = 'intro'; state.round = null; setShowPicker(true); }
        else { state.phase = 'play'; newRound(state.qi + 1); }
      }
    }

    // ── drawing helpers ──
    function rr(x: number, y: number, w: number, h: number, r: number) { ctx!.beginPath(); ctx!.moveTo(x + r, y); ctx!.arcTo(x + w, y, x + w, y + h, r); ctx!.arcTo(x + w, y + h, x, y + h, r); ctx!.arcTo(x, y + h, x, y, r); ctx!.arcTo(x, y, x + w, y, r); ctx!.closePath(); }
    function starPath(x: number, y: number, r: number) { ctx!.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 === 0 ? r : r * 0.45; const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad; if (i === 0) ctx!.moveTo(px, py); else ctx!.lineTo(px, py); } ctx!.closePath(); }
    function cloud(x: number, y: number, s: number) { ctx!.beginPath(); ctx!.arc(x, y, 26 * s, 0, 7); ctx!.arc(x + 30 * s, y - 12 * s, 32 * s, 0, 7); ctx!.arc(x + 66 * s, y - 2 * s, 26 * s, 0, 7); ctx!.arc(x + 92 * s, y + 8 * s, 20 * s, 0, 7); ctx!.arc(x + 40 * s, y + 12 * s, 28 * s, 0, 7); ctx!.closePath(); ctx!.fill(); }
    function gull(x: number, y: number, t: number, s: number) {
      // The gulls get excited for a beat whenever a sound lands: they flap
      // faster and lift, which sells the plank as something they are carrying.
      const boost = state.gullBoost;
      const flap = Math.sin(t * (9 + boost * 16)) * (0.6 + boost * 0.5);
      y -= boost * 7;
      ctx!.save(); ctx!.translate(x, y); ctx!.scale(s, s);
      ctx!.fillStyle = '#fff';
      ctx!.beginPath(); ctx!.ellipse(0, 0, 13, 8, 0, 0, 7); ctx!.fill();
      ctx!.beginPath(); ctx!.arc(11, -4, 6, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#F59E0B'; ctx!.beginPath(); ctx!.moveTo(16, -4); ctx!.lineTo(22, -2.5); ctx!.lineTo(16, -1); ctx!.closePath(); ctx!.fill();
      ctx!.fillStyle = '#2b2330'; ctx!.beginPath(); ctx!.ellipse(12, -5, 1.6, 2, 0, 0, 7); ctx!.fill(); // eye rule: solid black oval
      ctx!.fillStyle = '#E8E5E0';
      ctx!.save(); ctx!.rotate(-0.2 - flap * 0.5); ctx!.beginPath(); ctx!.ellipse(-4, -6, 12, 5, -0.5, 0, 7); ctx!.fill(); ctx!.restore();
      ctx!.restore();
    }

    function drawWorld() {
      const W = state.W, H = state.H, t = state.t;
      const sy0 = seaY(), dy0 = deckY();
      // The gradient always goes down first as a base. On a tall phone screen
      // the painted image cannot reach both the top of the sky and the deck at
      // once, and without this the uncovered band showed the page background.
      const base = ctx!.createLinearGradient(0, 0, 0, sy0);
      base.addColorStop(0, '#BFE5F2'); base.addColorStop(1, '#FDF3E7');
      ctx!.fillStyle = base; ctx!.fillRect(0, 0, W, sy0 + 2);

      // Painted sky + sea if the art loaded, cover-fitted across the whole
      // area above the deck; otherwise the original gradients.
      if (ready('sea')) {
        // Align the painted horizon with the game's waterline rather than just
        // cover-fitting, or the drawn foam lines end up over painted sky. The
        // horizon sits ~55% down the source image.
        const im = state.art.sea;
        const HZ = 0.55;
        const aspect = im.naturalWidth / im.naturalHeight;
        let ih = W / aspect;
        // Grow it if a narrow viewport would leave the deck edge uncovered, and
        // again if the sky above the horizon would come up short. On a phone the
        // second case is what bites: the frame is far taller than 16:9.
        const needBelow = (dy0 + 4 - sy0) / (1 - HZ);
        const needAbove = sy0 / HZ;
        ih = Math.max(ih, needBelow, needAbove);
        const iw = ih * aspect;
        ctx!.drawImage(im, (W - iw) / 2, sy0 - HZ * ih, iw, ih);
      } else {
        const sky = ctx!.createLinearGradient(0, 0, 0, sy0);
        sky.addColorStop(0, '#BFE5F2'); sky.addColorStop(1, '#FDF3E7');
        ctx!.fillStyle = sky; ctx!.fillRect(0, 0, W, sy0 + 2);
      }
      const sx = W * 0.88, sy1 = H * 0.09;
      ctx!.fillStyle = 'rgba(253,186,45,0.25)'; ctx!.beginPath(); ctx!.arc(sx, sy1, 52 + Math.sin(t * 1.2) * 4, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#FDBA2D'; ctx!.beginPath(); ctx!.arc(sx, sy1, 30, 0, 7); ctx!.fill();
      ctx!.strokeStyle = 'rgba(253,186,45,0.7)'; ctx!.lineWidth = 4; ctx!.lineCap = 'round';
      for (let i = 0; i < 8; i++) { const a = t * 0.25 + i * Math.PI / 4; ctx!.beginPath(); ctx!.moveTo(sx + Math.cos(a) * 42, sy1 + Math.sin(a) * 42); ctx!.lineTo(sx + Math.cos(a) * 52, sy1 + Math.sin(a) * 52); ctx!.stroke(); }
      ctx!.fillStyle = 'rgba(255,255,255,0.92)';
      for (const c of state.clouds) cloud(c.x, c.y + Math.sin(t * 0.5 + c.ph) * 4, c.s);
      if (!ready('sea')) {
        const sea = ctx!.createLinearGradient(0, sy0, 0, H);
        sea.addColorStop(0, '#7EC8E3'); sea.addColorStop(1, '#4FA3C7');
        ctx!.fillStyle = sea; ctx!.fillRect(0, sy0, W, H - sy0);
      }

      // Sun glints on the water — seeded once, then twinkling on their own
      // phase so the sea reads as moving even when nothing else is.
      if (!state.sparks.length) {
        for (let i = 0; i < 26; i++) {
          state.sparks.push({
            x: Math.random(), y: Math.random(), ph: Math.random() * 7,
            sp: 1.6 + Math.random() * 2.4, r: 1.2 + Math.random() * 2.2,
          });
        }
      }
      for (const s of state.sparks) {
        const a = Math.max(0, Math.sin(t * s.sp + s.ph));
        if (a < 0.05) continue;
        ctx!.fillStyle = `rgba(255,255,255,${a * 0.65})`;
        ctx!.beginPath();
        ctx!.arc(s.x * W, sy0 + s.y * (dy0 - sy0), s.r * (0.6 + a * 0.7), 0, 7);
        ctx!.fill();
      }

      // The painted sea brings its own crests — drawing the procedural foam
      // lines on top of it just muddies the water.
      for (let k = 0; k < (ready('sea') ? 0 : 3); k++) {
        const wy = sy0 + 14 + k * ((dy0 - sy0) / 3.2);
        ctx!.strokeStyle = 'rgba(255,255,255,' + (0.5 - k * 0.13) + ')'; ctx!.lineWidth = 3; ctx!.lineCap = 'round';
        ctx!.beginPath();
        for (let x = -20; x <= W + 20; x += 8) { const y = wy + Math.sin(x * 0.025 + t * (1.2 + k * 0.3) + k * 2) * 4; if (x === -20) ctx!.moveTo(x, y); else ctx!.lineTo(x, y); }
        ctx!.stroke();
      }
      const WOOD = '#C68B59', WOOD_D = '#9C6B3F';
      const bob = Math.sin(t * 0.9) * 3;
      ctx!.save(); ctx!.translate(0, bob);
      ctx!.fillStyle = WOOD_D;
      ctx!.beginPath(); ctx!.moveTo(-10, dy0); ctx!.quadraticCurveTo(W * 0.5, dy0 - 14, W + 10, dy0); ctx!.lineTo(W + 10, H + 20); ctx!.lineTo(-10, H + 20); ctx!.closePath(); ctx!.fill();
      ctx!.strokeStyle = 'rgba(60,38,20,0.25)'; ctx!.lineWidth = 2;
      for (let k = 1; k <= 4; k++) { const py = dy0 + k * ((H - dy0) / 4.6); ctx!.beginPath(); ctx!.moveTo(0, py); ctx!.quadraticCurveTo(W * 0.5, py - 10, W, py); ctx!.stroke(); }
      ctx!.fillStyle = WOOD;
      for (let x = W * 0.04; x < W; x += W * 0.09) ctx!.fillRect(x - 4, dy0 - 26 + Math.sin(x * 0.01) * 2, 8, 30);
      ctx!.beginPath(); ctx!.moveTo(-10, dy0 - 30); ctx!.quadraticCurveTo(W * 0.5, dy0 - 44, W + 10, dy0 - 30); ctx!.lineTo(W + 10, dy0 - 18); ctx!.quadraticCurveTo(W * 0.5, dy0 - 32, -10, dy0 - 18); ctx!.closePath(); ctx!.fill();
      ctx!.restore();
    }

    function drawPlank(): number {
      if (!state.slots.length) return 0;
      const t = state.t, WOOD = '#C68B59', WOOD_DD = '#7d5330';
      const first = state.slots[0], last = state.slots[state.slots.length - 1];
      const size = first.size, padX = size * 0.42, padY = size * 0.34, bobY = Math.sin(t * 1.1) * 4;
      const x0 = first.x - size / 2 - padX, x1 = last.x + size / 2 + padX;
      const y0 = first.y - size / 2 - padY + bobY, hh = size + padY * 2;
      ctx!.strokeStyle = 'rgba(125,83,48,0.85)'; ctx!.lineWidth = 3;
      ctx!.beginPath(); ctx!.moveTo(x0 + 10, y0); ctx!.lineTo(x0 + 16, y0 - 34); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(x1 - 10, y0); ctx!.lineTo(x1 - 16, y0 - 34); ctx!.stroke();
      gull(x0 + 16, y0 - 44 + Math.sin(t * 2.2) * 3, t, 1.15);
      gull(x1 - 16, y0 - 44 + Math.sin(t * 2.2 + 1.3) * 3, t + 3, 1.15);
      ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.22)'; ctx!.shadowBlur = 16; ctx!.shadowOffsetY = 8;
      ctx!.fillStyle = WOOD; rr(x0, y0, x1 - x0, hh, 16); ctx!.fill(); ctx!.restore();
      ctx!.strokeStyle = WOOD_DD; ctx!.lineWidth = 3; rr(x0, y0, x1 - x0, hh, 16); ctx!.stroke();
      ctx!.strokeStyle = 'rgba(60,38,20,0.18)'; ctx!.lineWidth = 2;
      ctx!.beginPath(); ctx!.moveTo(x0 + 8, y0 + hh * 0.5); ctx!.lineTo(x1 - 8, y0 + hh * 0.5); ctx!.stroke();
      return bobY;
    }

    function draw() {
      const W = state.W, H = state.H; if (!W) return;
      const t = state.t;
      ctx!.clearRect(0, 0, W, H);
      drawWorld();
      ctx!.save();
      if (state.shake > 0) ctx!.translate((Math.random() * 2 - 1) * state.shake, (Math.random() * 2 - 1) * state.shake);
      const font = state.fontReady ? 'Andika' : 'sans-serif';
      const ofont = state.fontReady ? 'Outfit' : 'sans-serif';

      const hudX = W - 20;
      ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.15)'; ctx!.shadowBlur = 10; ctx!.shadowOffsetY = 3;
      ctx!.fillStyle = '#fff'; rr(hudX - 86, 14, 86, 36, 18); ctx!.fill(); ctx!.restore();
      ctx!.fillStyle = '#FDBA2D'; starPath(hudX - 64, 32, 11); ctx!.fill();
      ctx!.fillStyle = state.INK; ctx!.font = '800 17px ' + ofont; ctx!.textAlign = 'left'; ctx!.textBaseline = 'middle';
      ctx!.fillText(String(state.mode === 'relax' ? state.stars : state.score), hudX - 48, 33);
      ctx!.save(); ctx!.translate(24, 32); ctx!.rotate(-0.03);
      ctx!.font = '800 16px ' + ofont; ctx!.textAlign = 'left';
      // Soft light halo: the painted backdrop can put a dark mast right behind
      // the title, and the level ink alone disappears against it.
      ctx!.strokeStyle = 'rgba(255,255,255,0.85)'; ctx!.lineWidth = 4;
      ctx!.lineJoin = 'round';
      ctx!.strokeText("Milo's Cannon", 0, 0);
      ctx!.fillStyle = state.INK;
      ctx!.fillText("Milo's Cannon", 0, 0); ctx!.restore();
      if (state.mode === 'speedy' && state.phase === 'play') {
        ctx!.fillStyle = state.INK; ctx!.font = '800 14px ' + ofont; ctx!.textAlign = 'left';
        ctx!.fillText(state.timeLeft + 's', 24, 52);
      }

      const inE = easeOutBack(state.roundIn);
      const bw = cardW(), bx = W / 2 - bw / 2, by = cardY() + (1 - inE) * -(bw + H * 0.08);
      if (state.round) {
        ctx!.save();
        ctx!.translate(bx + bw / 2, by + bw / 2); ctx!.rotate(-0.026 + (1 - inE) * 0.2); ctx!.translate(-bw / 2, -bw / 2);
        ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.2)'; ctx!.shadowBlur = 24; ctx!.shadowOffsetY = 10;
        ctx!.fillStyle = '#fff'; rr(0, 0, bw, bw, 22); ctx!.fill(); ctx!.restore();
        ctx!.strokeStyle = 'rgba(232,75,138,0.25)'; ctx!.lineWidth = 3; rr(0, 0, bw, bw, 22); ctx!.stroke();
        const im = state.pics[state.round.word];
        if (im && im.complete && im.naturalWidth) {
          const pad = bw * 0.13; ctx!.drawImage(im, pad, pad, bw - pad * 2, bw - pad * 2);
        } else if (im && im.complete) {
          // No artwork for this word (the ledger is far bigger than the image
          // set) — show the audio-only speaker card rather than a blank square.
          ctx!.fillStyle = state.HEX;
          ctx!.beginPath(); ctx!.arc(bw / 2, bw / 2, bw * 0.24, 0, 7); ctx!.fill();
          ctx!.fillStyle = '#fff';
          ctx!.font = `700 ${Math.round(bw * 0.26)}px sans-serif`;
          ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText('🔊', bw / 2, bw / 2 + bw * 0.01);
          ctx!.textBaseline = 'alphabetic';
        }
        ctx!.fillStyle = state.HEX; ctx!.beginPath(); ctx!.arc(bw - 6, bw - 6, 16, 0, 7); ctx!.fill();
        ctx!.fillStyle = '#fff'; ctx!.font = '700 14px sans-serif'; ctx!.textAlign = 'center'; ctx!.fillText('\uD83D\uDD0A', bw - 6, bw - 5);
        ctx!.restore();
        ctx!.textAlign = 'center'; ctx!.fillStyle = 'rgba(90,78,86,0.95)'; ctx!.font = '700 15px ' + ofont;
        ctx!.fillText('Pop the sound you hear!', W / 2, by + bw + 24 * inE);
      }

      if (state.phase === 'intro') {
        ctx!.fillStyle = 'rgba(90,78,86,0.95)'; ctx!.font = '700 15px ' + ofont; ctx!.textAlign = 'center';
        ctx!.fillText('Fire the cannon \u2014 pop the sound bubbles!', W / 2, H * 0.42 + 12);
      }

      const bobY = drawPlank() || 0;
      for (let i = 0; i < state.slots.length; i++) {
        const s = state.slots[i];
        let sz = s.size, y = s.y + bobY;
        const x = s.x;
        if (s.filled) { const lt = Math.min(1, (t - s.land) / 0.4); const k = Math.sin(lt * Math.PI) * (1 - lt) * 0.25; sz *= 1 + k; }
        if (state.wordWave > 0) { const wt = t - state.wordWave - i * 0.09; if (wt > 0 && wt < 0.6) y -= Math.sin(Math.min(1, wt / 0.6) * Math.PI) * 24; }
        const half = sz / 2;
        if (s.filled) {
          ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.15)'; ctx!.shadowBlur = 10; ctx!.shadowOffsetY = 4;
          ctx!.fillStyle = '#FFF9F2'; rr(x - half, y - half, sz, sz, 13); ctx!.fill(); ctx!.restore();
          ctx!.lineWidth = 3; ctx!.strokeStyle = state.HEX; rr(x - half, y - half, sz, sz, 13); ctx!.stroke();
          ctx!.fillStyle = state.HEX; ctx!.font = '700 ' + Math.round(sz * 0.52) + 'px ' + font; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText(s.expected, x, y + 2);
        } else {
          const next = state.slots.find(z => !z.filled) === s;
          const glow = next ? (0.55 + Math.sin(t * 4.4) * 0.35) : 0;
          ctx!.fillStyle = 'rgba(255,249,242,0.55)'; rr(x - half, y - half, sz, sz, 13); ctx!.fill();
          if (next) { ctx!.save(); ctx!.shadowColor = 'rgba(232,75,138,' + glow + ')'; ctx!.shadowBlur = 18; ctx!.lineWidth = 4; ctx!.strokeStyle = state.HEX; rr(x - half, y - half, sz, sz, 13); ctx!.stroke(); ctx!.restore(); }
          else { ctx!.setLineDash([6, 5]); ctx!.lineWidth = 3; ctx!.strokeStyle = 'rgba(125,83,48,0.5)'; rr(x - half, y - half, sz, sz, 13); ctx!.stroke(); ctx!.setLineDash([]); }
        }
      }

      // cannon
      const ms = miloSize(), groundY = H * 0.93, cp = cannonPos(), a = state.aimA;
      const bl = ms * 0.85, bwd = ms * 0.26, recoil = state.cannonKick * ms * 0.13;
      const IRON = '#3E3A45', IRON_D = '#2b2833';
      const bob = Math.sin(t * 0.9) * 3;
      ctx!.save(); ctx!.translate(0, bob);
      ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.25)'; ctx!.shadowBlur = 8; ctx!.shadowOffsetY = 3;
      ctx!.fillStyle = IRON_D;
      ctx!.beginPath(); ctx!.moveTo(cp.x - ms * 0.24, groundY + 6); ctx!.lineTo(cp.x + ms * 0.24, groundY + 6); ctx!.lineTo(cp.x + ms * 0.12, cp.y); ctx!.lineTo(cp.x - ms * 0.12, cp.y); ctx!.closePath(); ctx!.fill(); ctx!.restore();
      ctx!.save(); ctx!.translate(cp.x, cp.y); ctx!.rotate(a); ctx!.translate(-recoil, 0);
      ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.3)'; ctx!.shadowBlur = 10; ctx!.shadowOffsetY = 4;
      ctx!.fillStyle = IRON;
      ctx!.beginPath(); ctx!.moveTo(-bwd * 0.1, -bwd * 0.5); ctx!.lineTo(bl * 0.82, -bwd * 0.34); ctx!.lineTo(bl * 0.82, bwd * 0.34); ctx!.lineTo(-bwd * 0.1, bwd * 0.5); ctx!.closePath(); ctx!.fill(); ctx!.restore();
      ctx!.fillStyle = IRON_D; rr(bl * 0.82, -bwd * 0.44, bwd * 0.3, bwd * 0.88, bwd * 0.12); ctx!.fill();
      ctx!.fillStyle = IRON; ctx!.beginPath(); ctx!.ellipse(-bwd * 0.14, 0, bwd * 0.32, bwd * 0.52, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = IRON_D; ctx!.beginPath(); ctx!.arc(-bwd * 0.52, 0, bwd * 0.16, 0, 7); ctx!.fill();
      ctx!.fillStyle = IRON_D; rr(bl * 0.3, -bwd * 0.46, bwd * 0.16, bwd * 0.92, 4); ctx!.fill(); rr(bl * 0.56, -bwd * 0.42, bwd * 0.14, bwd * 0.84, 4); ctx!.fill();
      ctx!.fillStyle = state.HEX; rr(bl * 0.08, -bwd * 0.5, bwd * 0.18, bwd, 5); ctx!.fill();
      ctx!.strokeStyle = 'rgba(255,255,255,0.25)'; ctx!.lineWidth = 3; ctx!.lineCap = 'round';
      ctx!.beginPath(); ctx!.moveTo(bwd * 0.15, -bwd * 0.3); ctx!.lineTo(bl * 0.72, -bwd * 0.22); ctx!.stroke();
      ctx!.restore(); ctx!.restore();

      for (const p of state.trails) { ctx!.globalAlpha = p.life / p.max; ctx!.fillStyle = '#FDBA2D'; starPath(p.x, p.y, p.size); ctx!.fill(); ctx!.globalAlpha = 1; }
      for (const r of state.rings) { const e = easeOutCubic(r.t); ctx!.globalAlpha = 1 - r.t; ctx!.strokeStyle = state.HEX; ctx!.lineWidth = 4 * (1 - r.t) + 1; ctx!.beginPath(); ctx!.arc(r.x, r.y, 10 + e * 52, 0, 7); ctx!.stroke(); ctx!.globalAlpha = 1; }
      for (const b of state.balls) {
        if (b.state === 'placed' || b.born < 0) continue;
        const pop = b.born < 0.3 ? easeOutBack(Math.min(1, b.born / 0.3)) : 1;
        const wob = b.state === 'float' ? Math.sin(t * 3 + b.ph) * 0.04 : 0;
        const rr0 = b.r * Math.max(0.05, pop);
        const rx = rr0 * (1 + wob), ry = rr0 * (1 - wob);
        const bobBY = b.state === 'float' ? Math.sin(t * 1.7 + b.ph) * 3 : 0;
        ctx!.save(); ctx!.translate(b.x, b.y + bobBY);
        if (b.spin) ctx!.rotate(Math.sin(b.spin) * 0.25);
        ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.2)'; ctx!.shadowBlur = 10; ctx!.shadowOffsetY = 4;
        const grad = ctx!.createLinearGradient(0, -ry, 0, ry);
        grad.addColorStop(0, 'rgba(255,255,255,0.95)'); grad.addColorStop(1, b.wrong > 0 ? 'rgba(254,226,226,0.9)' : 'rgba(224,244,252,0.9)');
        ctx!.fillStyle = grad; ctx!.beginPath(); ctx!.ellipse(0, 0, rx, ry, 0, 0, 7); ctx!.fill(); ctx!.restore();
        ctx!.lineWidth = 2.5; ctx!.strokeStyle = b.wrong > 0 ? '#EF4444' : 'rgba(126,200,227,0.85)';
        ctx!.beginPath(); ctx!.ellipse(0, 0, rx, ry, 0, 0, 7); ctx!.stroke();
        ctx!.strokeStyle = 'rgba(255,255,255,0.95)'; ctx!.lineWidth = 3; ctx!.lineCap = 'round';
        ctx!.beginPath(); ctx!.arc(0, 0, rr0 * 0.68, -2.4, -1.7); ctx!.stroke();
        ctx!.fillStyle = b.wrong > 0 ? '#EF4444' : state.INK;
        ctx!.font = '700 ' + Math.round(rr0 * 0.92) + 'px ' + font; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
        ctx!.fillText(b.g, 0, 1); ctx!.restore();
      }
      for (const sh of state.shots) {
        if (sh.x == null) continue;
        ctx!.save(); ctx!.shadowColor = 'rgba(40,30,40,0.3)'; ctx!.shadowBlur = 6; ctx!.shadowOffsetY = 2;
        ctx!.fillStyle = '#3E3A45'; ctx!.beginPath(); ctx!.arc(sh.x, sh.y, 9, 0, 7); ctx!.fill(); ctx!.restore();
        ctx!.fillStyle = 'rgba(255,255,255,0.5)'; ctx!.beginPath(); ctx!.arc(sh.x - 2.5, sh.y - 2.5, 3, 0, 7); ctx!.fill();
      }
      for (const p of state.particles) {
        ctx!.save(); ctx!.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5)); ctx!.translate(p.x, p.y); ctx!.rotate(p.rot);
        if (p.kind === 'puff') { ctx!.fillStyle = p.color; ctx!.beginPath(); ctx!.arc(0, 0, p.size, 0, 7); ctx!.fill(); }
        else { ctx!.fillStyle = p.color; ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); }
        ctx!.restore();
      }
      for (const f of state.flyStars) {
        const e = easeOutCubic(f.t);
        const fx = f.x + (hudX - 64 - f.x) * e, fy = f.y + (32 - f.y) * e - Math.sin(Math.PI * f.t) * 60;
        ctx!.save(); ctx!.translate(fx, fy); ctx!.rotate(f.t * 6);
        ctx!.fillStyle = '#FDBA2D'; starPath(0, 0, 14 * (1 - f.t * 0.4)); ctx!.fill(); ctx!.restore();
      }
      ctx!.restore();

      // Warm vignette last of all, outside the shake transform so it stays
      // welded to the screen edge. Keeps the eye on the plank and the bubbles.
      const vig = ctx!.createRadialGradient(
        state.W / 2, state.H * 0.52, Math.min(state.W, state.H) * 0.34,
        state.W / 2, state.H * 0.52, Math.max(state.W, state.H) * 0.78
      );
      vig.addColorStop(0, 'rgba(60,40,30,0)');
      vig.addColorStop(1, 'rgba(60,40,30,0.20)');
      ctx!.fillStyle = vig;
      ctx!.fillRect(0, 0, state.W, state.H);
    }

    function loop(now: number) {
      const dt = (now - state.last) / 1000; state.last = now;
      if (canvas!.clientWidth !== state.W || canvas!.clientHeight !== state.H) {
        if (canvas!.clientWidth > 0 && canvas!.clientHeight > 0) layout();
      }
      try { update(dt || 0); draw(); } catch { /* keep loop alive */ }
      state.raf = requestAnimationFrame(loop);
    }

    layout();
    window.addEventListener('resize', layout);
    canvas.addEventListener('pointerdown', onTap);
    canvas.addEventListener('pointermove', onAim);
    window.addEventListener('keydown', onKey);
    state.last = performance.now();
    state.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(state.raf);
      window.removeEventListener('resize', layout);
      canvas.removeEventListener('pointerdown', onTap);
      canvas.removeEventListener('pointermove', onAim);
      window.removeEventListener('keydown', onKey);
      if (state.timerHandle) clearInterval(state.timerHandle);
      try { window.speechSynthesis?.cancel(); } catch { /* n/a */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const startMode = (mode: Mode) => { (canvasRef.current as any)?.__startMode?.(mode); };

  // Portalled to <body>: the child screen wraps its sections in transformed
  // motion.div elements, and a transformed ancestor becomes the containing
  // block for position:fixed — so inset-0 would stretch to the page height
  // instead of the viewport and the canvas would run off the bottom.
  return createPortal(
    <div ref={rootRef} className="fixed inset-0 z-[70]" style={{ background: '#FFF7F3' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'crosshair' }} />
      <button
        onClick={onClose}
        aria-label="Close game"
        className="absolute top-3.5 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
        style={{ boxShadow: '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)' }}
      >
        <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>&times;</span>
      </button>
      {/* Mode picker overlay, shown only before/between rounds */}
      {showPicker && (
      <div className="absolute left-1/2 -translate-x-1/2 bottom-8 flex gap-3 w-full max-w-xs px-5" style={{ pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto', display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={() => startMode('relax')}
            className="w-full h-14 rounded-2xl font-display text-base font-extrabold text-white flex items-center justify-center gap-2 active:translate-y-[3px]"
            style={{ background: level.hex, boxShadow: `0 5px 0 ${level.inkHex}, 0 12px 22px -10px ${level.hex}80` }}
          >
            5 words · take your time
          </button>
          <button
            onClick={() => startMode('speedy')}
            className="w-full h-12 rounded-2xl font-display text-sm font-extrabold bg-white active:translate-y-[3px]"
            style={{ color: level.inkHex, boxShadow: `0 4px 0 ${level.hex}40, 0 8px 18px rgba(40,30,40,0.1)`, border: `2px solid ${level.hex}50` }}
          >
            Speedy — 40 seconds!
          </button>
        </div>
      </div>
      )}
    </div>,
    document.body
  );
}
