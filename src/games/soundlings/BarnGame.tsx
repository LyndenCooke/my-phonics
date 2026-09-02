/**
 * BarnGame — Soundlings rebuilt as a real 2D canvas game scene.
 *
 * Architecture (same school as WordCannonGame): one responsive <canvas>
 * with a FIXED LOGICAL SPACE of 1280×720, letterboxed to fit any screen —
 * gameplay geometry never changes with viewport size. A continuous
 * requestAnimationFrame loop advances every entity with delta time.
 * React only launches/closes the scene and shows the small end-of-visit
 * overlay; nothing inside the world is a DOM element.
 *
 * Layers (drawn back to front each frame):
 *   1. scenery   — painted barn backdrop (or a procedural barn if the
 *                  image is missing — the game must survive its removal)
 *   2. ambient   — lantern glow flicker, drifting dust motes
 *   3. entities  — nests, eggs, hatched Soundlings, feed bucket
 *   4. effects   — grain projectiles, shell shrapnel, puffs, confetti
 *   5. HUD       — word plank + speaker, round pips (restrained, top)
 *
 * Gameplay loop (one "visit" = 5 words):
 *   Three eggs sit in nests, each wearing a grapheme. A word is spoken
 *   and shown on the plank. The child feeds the egg whose sound hides in
 *   the word — tap the egg or press 1/2/3 — which tosses real grain from
 *   the bucket in an arc; the RESOLUTION happens when grain physically
 *   lands in the egg's hitbox, not on click. Correct: munch, crack lines
 *   spread; enough feeds and the shell BURSTS into pieces, the Soundling
 *   emerges, looks around, then hops across the floor to join the huddle
 *   of previously-hatched Soundlings by the hay bale (progress lives in
 *   the world). Wrong: the egg shakes, a "?" puffs out, the word repeats.
 *
 * Persistence and pedagogy are unchanged: feeds go through
 *   soundlingStore.feedSoundling, words come from the green-words bank,
 *   distractor eggs never carry a sound that also appears in the word.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { displayGrapheme, soundInWord, speakWord, WORD_BANK } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
import { sfx } from '@/games/audio';
import { soundlingName } from './soundlingNames';
import {
  feedSoundling, getAllSoundlings, glowingEggOfDay, stageOf,
  GLOW_HATCH_FEEDS, HATCH_FEEDS,
} from './soundlingStore';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

// ── logical scene space ─────────────────────────────────────────────
const LW = 1280;
const LH = 720;
const VISIT_ROUNDS = 5;
const GRAIN_G = 1500;      // grain gravity, logical px/s²
const NESTS = [
  { x: 330, y: 560, s: 1 },
  { x: 640, y: 596, s: 1.08 },
  { x: 950, y: 560, s: 1 },
];
const BUCKET = { x: 132, y: 636 };
const HUDDLE = { x: 1132, y: 596 };

type EggState = 'in' | 'idle' | 'munch' | 'wrong' | 'burst' | 'gone';
type CreatureState = 'emerge' | 'look' | 'hop' | 'settled';

interface EggE {
  g: string; nest: number; state: EggState; t: number;
  x: number; y: number; scale: number; ph: number; hitR: number;
}
interface CreatureE {
  g: string; state: CreatureState; t: number;
  x: number; y: number; vx: number; vy: number; scale: number; ph: number;
  hopsLeft: number; grounded: boolean;
}
interface GrainE { x: number; y: number; vx: number; vy: number; t: number; T: number; nest: number; live: boolean; }
interface ShellE { x: number; y: number; vx: number; vy: number; rot: number; vr: number; life: number; big: boolean; }
interface PuffE { kind: 'puff' | 'conf' | 'q' | 'straw'; x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; rot: number; vr: number; }
interface Ev { at: number; fn: () => void; }

function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
function hashOf(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const easeOutBack = (t: number) => { const c = 1.70158 * 1.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

export default function BarnGame({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bank = useGameBank(level);
  const bankRef = useRef(bank);
  bankRef.current = bank;
  const [ended, setEnded] = useState<{ fed: number; hatched: string[] } | null>(null);
  const endedRef = useRef(setEnded);
  endedRef.current = setEnded;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // ── mutable scene state (outside React) ─────────────────────────
    const S = {
      t: 0, last: performance.now(), raf: 0,
      // view transform
      scale: 1, ox: 0, oy: 0, dpr: 1, cw: 0, ch: 0,
      // content
      pool: [] as string[], glowing: null as string | null,
      targets: [] as string[], round: -1, word: '', firstTry: true, fed: 0,
      hatchedThisVisit: [] as string[],
      busy: true, over: false,
      eggs: [] as EggE[], creatures: [] as CreatureE[],
      grains: [] as GrainE[], shells: [] as ShellE[], puffs: [] as PuffE[],
      motes: [] as { x: number; y: number; v: number; ph: number; r: number }[],
      events: [] as Ev[],
      art: new Image(), artOk: false,
      fontReady: false,
      speakerHit: { x: LW / 2 + 178, y: 64, r: 26 },
      wordPop: 0, // plank pop-in animation
    };

    S.art.src = '/images/games/soundlings_barn.webp';
    S.art.onload = () => { if (S.art.naturalWidth) S.artOk = true; };
    try { document.fonts.ready.then(() => { S.fontReady = true; }); } catch { S.fontReady = true; }

    const hatchAt = (g: string) => (g === S.glowing ? GLOW_HATCH_FEEDS : HATCH_FEEDS);
    const feedsOf = (g: string) => getAllSoundlings()[g]?.feeds ?? 0;

    // ── content setup ───────────────────────────────────────────────
    function setupVisit() {
      const b = bankRef.current;
      S.pool = level.gpcs.filter(g => (b[g] ?? WORD_BANK[g])?.length);
      S.glowing = glowingEggOfDay(S.pool);
      const coll = getAllSoundlings();
      // hungriest unhatched sounds first; hatched ones live in the huddle
      const unhatched = S.pool.filter(g => stageOf(coll[g] ?? { feeds: 0, lastFedDate: '', hatchedDate: '' }, g === S.glowing) === 'egg');
      const byHunger = [...(unhatched.length >= 3 ? unhatched : S.pool)]
        .sort((a, c) => (coll[a]?.feeds ?? 0) - (coll[c]?.feeds ?? 0));
      S.targets = [];
      for (let i = 0; i < VISIT_ROUNDS; i++) S.targets.push(byHunger[i % byHunger.length]);
      // the already-hatched huddle (progress shown in the world)
      S.creatures = S.pool
        .filter(g => stageOf(coll[g] ?? { feeds: 0, lastFedDate: '', hatchedDate: '' }, g === S.glowing) !== 'egg')
        .slice(0, 6)
        .map((g, i) => makeCreature(g, 'settled', HUDDLE.x + (i % 3) * 46 - 40, HUDDLE.y + Math.floor(i / 3) * 34 - 12));
      // A fresh visit must not inherit the old one's timeline or effects —
      // a stale scheduled nextRound would silently skip rounds.
      S.events = []; S.grains = []; S.shells = []; S.puffs = [];
      S.round = -1; S.fed = 0; S.hatchedThisVisit = []; S.over = false; S.busy = true;
      nextRound();
    }

    function wordFor(g: string): string {
      const b = bankRef.current;
      const shown = displayGrapheme(g);
      const words = (b[g] ?? WORD_BANK[g] ?? []).filter(w => w.includes(shown));
      const all = words.length ? words : (b[g] ?? WORD_BANK[g] ?? [shown]);
      return all[Math.floor(Math.random() * all.length)];
    }

    function nextRound() {
      S.round += 1;
      if (S.round >= VISIT_ROUNDS) { celebrate(); return; }
      const target = S.targets[S.round];
      S.word = wordFor(target);
      S.firstTry = true;
      const shownWord = S.word;
      const ok = (g: string) => g !== target && !shownWord.includes(displayGrapheme(g)) && !soundInWord(g, shownWord);
      const distractors = shuffle(S.pool.filter(ok)).slice(0, 2);
      const three = shuffle([target, ...distractors]);
      S.eggs = three.map((g, i) => ({
        g, nest: i, state: 'in' as EggState, t: -i * 0.12,
        x: NESTS[i].x, y: NESTS[i].y - 260, scale: NESTS[i].s, ph: Math.random() * 7,
        hitR: 64 * NESTS[i].s,
      }));
      S.busy = true;
      at(0.65, () => { S.busy = false; S.wordPop = 0; speakWord(S.word); });
    }

    function at(delay: number, fn: () => void) { S.events.push({ at: S.t + delay, fn }); }

    function makeCreature(g: string, state: CreatureState, x: number, y: number): CreatureE {
      return { g, state, t: 0, x, y, vx: 0, vy: 0, scale: state === 'emerge' ? 0 : 1, ph: Math.random() * 7, hopsLeft: 3, grounded: true };
    }

    // ── feeding ─────────────────────────────────────────────────────
    function feed(nest: number) {
      if (S.busy || S.over) return;
      const egg = S.eggs.find(e => e.nest === nest && (e.state === 'idle' || e.state === 'munch'));
      if (!egg) return;
      S.busy = true;
      // toss real grain from the bucket: solve the arc so it lands on the egg
      const T = 0.55;
      for (let i = 0; i < 7; i++) {
        const jx = (Math.random() - 0.5) * 26, jy = (Math.random() - 0.5) * 14;
        const dx = egg.x + jx - BUCKET.x, dy = egg.y - 20 + jy - (BUCKET.y - 34);
        S.grains.push({
          x: BUCKET.x, y: BUCKET.y - 34,
          vx: dx / T + (Math.random() - 0.5) * 30,
          vy: dy / T - 0.5 * GRAIN_G * T + (Math.random() - 0.5) * 30,
          t: -i * 0.03, T, nest, live: i === 0, // the lead grain resolves
        });
      }
      sfx.tick();
    }

    function resolveGrainLanding(nest: number) {
      const egg = S.eggs.find(e => e.nest === nest);
      if (!egg) { S.busy = false; return; }
      const target = S.targets[S.round];
      if (egg.g === target) {
        egg.state = 'munch'; egg.t = 0;
        sfx.pop();
        const res = feedSoundling(egg.g, S.firstTry, egg.g === S.glowing);
        S.fed += 1;
        if (res.before === 'egg' && res.after !== 'egg') {
          at(0.45, () => hatch(egg));
        } else {
          // crack advances (drawn from the store's feed count)
          at(0.4, () => { sfx.star(); strawPuff(egg.x, egg.y + 30, 6); });
          at(1.25, () => nextRound());
        }
      } else {
        egg.state = 'wrong'; egg.t = 0;
        sfx.bonk();
        S.puffs.push({ kind: 'q', x: egg.x + 26, y: egg.y - 70, vx: 12, vy: -46, life: 0.9, max: 0.9, size: 30, color: '#8A5A2B', rot: -0.15, vr: 0.4 });
        S.firstTry = false;
        at(0.7, () => { speakWord(S.word); S.busy = false; });
        at(0.7, () => { const e2 = S.eggs.find(e => e.nest === nest); if (e2 && e2.state === 'wrong') e2.state = 'idle'; });
      }
    }

    function hatch(egg: EggE) {
      egg.state = 'burst'; egg.t = 0;
      S.hatchedThisVisit.push(egg.g);
      // shell shrapnel — the shell visibly splits into pieces
      for (let i = 0; i < 8; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
        const sp = 180 + Math.random() * 260;
        S.shells.push({
          x: egg.x + (Math.random() - 0.5) * 30, y: egg.y - 30 + (Math.random() - 0.5) * 40,
          vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
          rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, life: 1.4, big: i < 3,
        });
      }
      confetti(egg.x, egg.y - 40, 26);
      sfx.chord();
      const c = makeCreature(egg.g, 'emerge', egg.x, egg.y - 8);
      S.creatures.push(c);
      at(0.5, () => { c.state = 'look'; c.t = 0; });
      at(2.0, () => { c.state = 'hop'; c.t = 0; c.hopsLeft = 3 + Math.floor(Math.random() * 2); sfx.sparkle(); });
      at(0.1, () => { const e2 = S.eggs.find(e => e.g === egg.g); if (e2) e2.state = 'gone'; });
      at(3.6, () => nextRound());
    }

    function celebrate() {
      S.over = true; S.busy = true;
      sfx.fanfare();
      for (let i = 0; i < 5; i++) at(i * 0.25, () => confetti(200 + Math.random() * (LW - 400), 160 + Math.random() * 220, 18));
      for (const c of S.creatures) if (c.state === 'settled') { c.state = 'hop'; c.hopsLeft = 2; c.t = 0; }
      at(2.2, () => endedRef.current({ fed: S.fed, hatched: S.hatchedThisVisit }));
    }

    function confetti(x: number, y: number, n: number) {
      const cols = [level.hex, level.inkHex, '#FDBA2D', '#22C55E', '#3B82F6', '#ffffff'];
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = 90 + Math.random() * 260;
        S.puffs.push({ kind: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, life: 0.8 + Math.random() * 0.6, max: 1.4, size: 5 + Math.random() * 7, color: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
      }
    }
    function strawPuff(x: number, y: number, n: number) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI, sp = 60 + Math.random() * 120;
        S.puffs.push({ kind: 'straw', x, y, vx: Math.cos(a + Math.PI) * sp, vy: -Math.abs(Math.sin(a)) * sp, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 8 + Math.random() * 8, color: '#D9A852', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 8 });
      }
    }

    // ── update ──────────────────────────────────────────────────────
    function update(dt: number) {
      dt = Math.min(dt, 0.05);
      S.t += dt;
      S.wordPop = Math.min(1, S.wordPop + dt / 0.4);

      for (let i = S.events.length - 1; i >= 0; i--) {
        if (S.t >= S.events[i].at) { const ev = S.events[i]; S.events.splice(i, 1); ev.fn(); }
      }

      for (const e of S.eggs) {
        e.t += dt;
        if (e.state === 'in') {
          if (e.t >= 0) {
            const k = Math.min(1, e.t / 0.5);
            e.y = (NESTS[e.nest].y - 260) + 260 * easeOutBack(k);
            if (k >= 1) { e.state = 'idle'; e.y = NESTS[e.nest].y; strawPuff(e.x, e.y + 26, 5); }
          }
        } else if (e.state === 'gone') {
          e.scale = Math.max(0, e.scale - dt * 3);
        }
      }

      for (let i = S.grains.length - 1; i >= 0; i--) {
        const g = S.grains[i]; g.t += dt;
        if (g.t < 0) continue;
        g.vy += GRAIN_G * dt; g.x += g.vx * dt; g.y += g.vy * dt;
        // physical landing: the lead grain resolves the feed when it enters
        // the egg's hitbox (or completes its arc)
        const egg = S.eggs.find(z => z.nest === g.nest);
        const hit = egg && Math.hypot(g.x - egg.x, g.y - (egg.y - 20)) < egg.hitR * 0.6;
        if (g.live && (hit || g.t >= g.T)) { g.live = false; resolveGrainLanding(g.nest); }
        if (g.t >= g.T + 0.25 || g.y > LH + 30) S.grains.splice(i, 1);
      }

      for (let i = S.shells.length - 1; i >= 0; i--) {
        const sh = S.shells[i];
        sh.vy += 1300 * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.rot += sh.vr * dt; sh.life -= dt;
        if (sh.y > 700 && sh.vy > 0) { sh.vy *= -0.35; sh.vx *= 0.6; sh.y = 700; }
        if (sh.life <= 0) S.shells.splice(i, 1);
      }

      for (const c of S.creatures) {
        c.t += dt;
        if (c.state === 'emerge') c.scale = easeOutBack(Math.min(1, c.t / 0.45));
        else if (c.state === 'hop') {
          if (c.grounded) {
            if (c.hopsLeft <= 0) { c.state = 'settled'; c.t = 0; c.x = Math.min(c.x, HUDDLE.x + 60); continue; }
            const dir = Math.sign(HUDDLE.x - c.x) || 1;
            c.vx = dir * (120 + Math.random() * 60); c.vy = -330; c.grounded = false; c.hopsLeft -= 1;
          }
          c.vy += 1250 * dt; c.x += c.vx * dt; c.y += c.vy * dt;
          const floor = HUDDLE.y + (Math.abs(c.x - HUDDLE.x) < 90 ? 0 : -10);
          if (c.y >= floor && c.vy > 0) { c.y = floor; c.vy = 0; c.vx = 0; c.grounded = true; strawPuff(c.x, c.y + 24, 3); sfx.tick(); }
        }
      }

      for (let i = S.puffs.length - 1; i >= 0; i--) {
        const p = S.puffs[i]; p.life -= dt;
        if (p.life <= 0) { S.puffs.splice(i, 1); continue; }
        if (p.kind === 'conf') p.vy += 640 * dt;
        else if (p.kind === 'straw') p.vy += 900 * dt;
        else { p.vx *= Math.pow(0.2, dt); p.vy *= Math.pow(0.4, dt); }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      }

      if (!S.motes.length) {
        for (let i = 0; i < 16; i++) S.motes.push({ x: Math.random() * LW, y: Math.random() * LH * 0.7, v: 4 + Math.random() * 8, ph: Math.random() * 7, r: 1.2 + Math.random() * 1.8 });
      }
      for (const m of S.motes) {
        m.x += Math.sin(S.t * 0.4 + m.ph) * 6 * dt; m.y -= m.v * dt;
        if (m.y < -4) { m.y = LH * 0.75; m.x = Math.random() * LW; }
      }
    }

    // ── drawing ─────────────────────────────────────────────────────
    const F = () => (S.fontReady ? 'Andika' : 'sans-serif');
    const FD = () => (S.fontReady ? 'Outfit' : 'sans-serif');
    function rr(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath(); ctx!.moveTo(x + r, y); ctx!.arcTo(x + w, y, x + w, y + h, r); ctx!.arcTo(x + w, y + h, x, y + h, r); ctx!.arcTo(x, y + h, x, y, r); ctx!.arcTo(x, y, x + w, y, r); ctx!.closePath();
    }

    function drawScenery() {
      if (S.artOk) {
        const im = S.art, ar = im.naturalWidth / im.naturalHeight;
        let w = LW, h = LW / ar;
        if (h < LH) { h = LH; w = LH * ar; }
        ctx!.drawImage(im, (LW - w) / 2, (LH - h) / 2, w, h);
      } else {
        // Procedural barn — the acceptance-test fallback: still a barn.
        const wall = ctx!.createLinearGradient(0, 0, 0, LH);
        wall.addColorStop(0, '#B57F45'); wall.addColorStop(1, '#C89055');
        ctx!.fillStyle = wall; ctx!.fillRect(0, 0, LW, LH);
        ctx!.strokeStyle = 'rgba(90,55,25,0.35)'; ctx!.lineWidth = 4;
        for (let x = 90; x < LW; x += 120) { ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, LH * 0.72); ctx!.stroke(); }
        ctx!.fillStyle = '#5E4426'; ctx!.fillRect(0, 0, LW, 46);
        const straw = ctx!.createLinearGradient(0, LH * 0.66, 0, LH);
        straw.addColorStop(0, '#E8C070'); straw.addColorStop(1, '#D3A253');
        ctx!.fillStyle = straw; ctx!.fillRect(0, LH * 0.66, LW, LH * 0.34);
      }
      // lantern glow flicker (top-left of the painted barn)
      const flick = 0.16 + Math.sin(S.t * 6.3) * 0.02 + Math.sin(S.t * 17.7) * 0.012;
      const glow = ctx!.createRadialGradient(120, 130, 10, 120, 130, 260);
      glow.addColorStop(0, `rgba(255,196,90,${flick})`); glow.addColorStop(1, 'rgba(255,196,90,0)');
      ctx!.fillStyle = glow; ctx!.fillRect(0, 0, 420, 420);
      ctx!.fillStyle = 'rgba(255,240,200,0.5)';
      for (const m of S.motes) { ctx!.beginPath(); ctx!.arc(m.x, m.y, m.r, 0, 7); ctx!.fill(); }
    }

    function drawNest(x: number, y: number, s: number) {
      ctx!.save(); ctx!.translate(x, y + 26); ctx!.scale(s, s);
      ctx!.fillStyle = 'rgba(80,50,15,0.22)'; ctx!.beginPath(); ctx!.ellipse(0, 16, 74, 15, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#D9A852'; ctx!.beginPath(); ctx!.ellipse(0, 6, 70, 20, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#EFCB7B'; ctx!.beginPath(); ctx!.ellipse(0, 0, 60, 16, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#B9853C'; ctx!.beginPath(); ctx!.ellipse(0, 1, 42, 11, 0, 0, 7); ctx!.fill();
      ctx!.strokeStyle = '#A97B33'; ctx!.lineWidth = 3; ctx!.lineCap = 'round';
      ctx!.beginPath(); ctx!.moveTo(-62, 2); ctx!.quadraticCurveTo(-44, -12, -26, -6); ctx!.stroke();
      ctx!.beginPath(); ctx!.moveTo(60, 6); ctx!.quadraticCurveTo(46, -10, 28, -5); ctx!.stroke();
      ctx!.restore();
    }

    function drawEgg(e: EggE) {
      if (e.scale <= 0.01 || e.state === 'burst') return;
      const target = S.targets[S.round];
      const h = hashOf(e.g);
      const frac = Math.min(1, feedsOf(e.g) / hatchAt(e.g));
      const wob = e.state === 'idle' ? Math.sin(S.t * 2.1 + e.ph) * 0.035 : 0;
      let rot = ((h % 9) - 4) * 0.02 + wob;
      let squash = 1;
      if (e.state === 'munch') { const k = Math.min(1, e.t / 0.4); squash = 1 + Math.sin(k * Math.PI) * 0.16; }
      if (e.state === 'wrong') rot += Math.sin(e.t * 34) * 0.09 * Math.max(0, 1 - e.t / 0.6);
      // near-hatch eggs quiver on their own
      if (e.state === 'idle' && frac >= 0.6 && Math.sin(S.t * 1.1 + e.ph) > 0.86) rot += Math.sin(S.t * 40) * 0.05;

      ctx!.save(); ctx!.translate(e.x, e.y); ctx!.scale(e.scale, e.scale); ctx!.rotate(rot);
      ctx!.scale(2 - squash, squash);
      ctx!.save(); ctx!.shadowColor = 'rgba(80,50,15,0.3)'; ctx!.shadowBlur = 12; ctx!.shadowOffsetY = 5;
      ctx!.fillStyle = '#FBF3DE';
      ctx!.beginPath();
      ctx!.moveTo(0, -84);
      ctx!.bezierCurveTo(34, -84, 56, -40, 56, -6);
      ctx!.bezierCurveTo(56, 30, 32, 52, 0, 52);
      ctx!.bezierCurveTo(-32, 52, -56, 30, -56, -6);
      ctx!.bezierCurveTo(-56, -40, -34, -84, 0, -84);
      ctx!.closePath(); ctx!.fill(); ctx!.restore();
      ctx!.strokeStyle = 'rgba(138,106,59,0.4)'; ctx!.lineWidth = 3; ctx!.stroke();
      ctx!.fillStyle = 'rgba(255,255,255,0.6)';
      ctx!.beginPath(); ctx!.ellipse(-20, -46, 12, 22, -0.5, 0, 7); ctx!.fill();
      ctx!.fillStyle = 'rgba(201,161,94,0.45)';
      for (let i = 0; i < 4; i++) { ctx!.beginPath(); ctx!.arc(-28 + ((h >> (i * 3)) % 56), -52 + ((h >> (i * 2 + 1)) % 84), 2.5 + (i % 2), 0, 7); ctx!.fill(); }
      // cracks (feed progress lives on the shell)
      ctx!.strokeStyle = 'rgba(110,80,40,0.8)'; ctx!.lineWidth = 3; ctx!.lineJoin = 'round'; ctx!.lineCap = 'round';
      const cracks = [
        [[-12, -66], [-4, -50], [-14, -36]],
        [[16, -52], [8, -32], [20, -18], [10, -6]],
        [[-38, -10], [-22, -2], [-30, 12], [-12, 18], [-18, 32]],
      ];
      const n = frac >= 0.85 ? 3 : frac >= 0.5 ? 2 : frac > 0.1 ? 1 : 0;
      for (let i = 0; i < n; i++) {
        ctx!.beginPath();
        cracks[i].forEach(([px, py], j) => (j ? ctx!.lineTo(px, py) : ctx!.moveTo(px, py)));
        ctx!.stroke();
      }
      // grapheme on the shell
      const shown = displayGrapheme(e.g);
      ctx!.fillStyle = 'rgba(138,90,43,0.55)';
      ctx!.font = `800 ${shown.length > 2 ? 26 : 34}px ${F()}`;
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      ctx!.fillText(shown, 0, -8);
      // the glowing egg of the day sparkles
      if (e.g === S.glowing) {
        const tw = 0.5 + Math.sin(S.t * 3) * 0.5;
        ctx!.globalAlpha = 0.5 + tw * 0.5;
        ctx!.fillStyle = '#FDBA2D';
        ctx!.font = '24px sans-serif'; ctx!.fillText('✨', 42, -70);
        ctx!.globalAlpha = 1;
      }
      ctx!.restore();

      // hint arrow: gently mark the egg being fed? No — the word is the clue.
      void target;
    }

    function drawCreature(c: CreatureE) {
      const gold = false;
      const body = gold ? '#F6C453' : level.hex;
      const ink = level.inkHex;
      const breathe = c.state === 'settled' ? Math.sin(S.t * 1.8 + c.ph) * 0.03 : 0;
      const air = !c.grounded && c.state === 'hop';
      const stretch = air ? 1.08 : 1 + breathe;
      const r = 34;
      ctx!.save(); ctx!.translate(c.x, c.y - r * 0.9); ctx!.scale(c.scale, c.scale);
      ctx!.scale(2 - stretch, stretch);
      ctx!.fillStyle = 'rgba(80,50,15,0.25)'; ctx!.beginPath(); ctx!.ellipse(0, r * 0.98, r * 0.8, 7, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#FFFFFF'; ctx!.beginPath(); ctx!.ellipse(0, 0, r, r, 0, 0, 7); ctx!.fill();
      ctx!.globalAlpha = 0.45; ctx!.fillStyle = body; ctx!.beginPath(); ctx!.ellipse(0, 0, r, r, 0, 0, 7); ctx!.fill(); ctx!.globalAlpha = 1;
      ctx!.strokeStyle = ink; ctx!.globalAlpha = 0.35; ctx!.lineWidth = 2.5; ctx!.beginPath(); ctx!.ellipse(0, 0, r, r, 0, 0, 7); ctx!.stroke(); ctx!.globalAlpha = 1;
      // eyes: solid black dots (house rule); looking around shifts them
      let dx = 0;
      if (c.state === 'look') dx = Math.sin(c.t * 4.2) * 4;
      const blink = Math.sin(S.t * 1.3 + c.ph * 3) > 0.985;
      ctx!.fillStyle = '#0D0D0D';
      if (blink) {
        ctx!.fillRect(-11 + dx, -10, 7, 2.4); ctx!.fillRect(4 + dx, -10, 7, 2.4);
      } else {
        ctx!.beginPath(); ctx!.arc(-8 + dx, -9, 3.4, 0, 7); ctx!.fill();
        ctx!.beginPath(); ctx!.arc(8 + dx, -9, 3.4, 0, 7); ctx!.fill();
      }
      ctx!.strokeStyle = '#0D0D0D'; ctx!.lineWidth = 2; ctx!.lineCap = 'round';
      ctx!.beginPath(); ctx!.moveTo(-4, -1); ctx!.quadraticCurveTo(0, 3, 4, -1); ctx!.stroke();
      // belly badge
      ctx!.fillStyle = 'rgba(255,253,246,0.95)'; ctx!.beginPath(); ctx!.ellipse(0, r * 0.45, r * 0.55, r * 0.34, 0, 0, 7); ctx!.fill();
      const shown = displayGrapheme(c.g);
      ctx!.fillStyle = ink; ctx!.font = `800 ${shown.length > 2 ? 13 : 17}px ${FD()}`;
      ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
      ctx!.fillText(shown, 0, r * 0.45);
      ctx!.restore();
    }

    function drawBucket() {
      ctx!.save(); ctx!.translate(BUCKET.x, BUCKET.y);
      ctx!.fillStyle = 'rgba(80,50,15,0.25)'; ctx!.beginPath(); ctx!.ellipse(0, 16, 52, 10, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#8A5A2B';
      ctx!.beginPath(); ctx!.moveTo(-44, -34); ctx!.lineTo(-34, 12); ctx!.lineTo(34, 12); ctx!.lineTo(44, -34); ctx!.closePath(); ctx!.fill();
      ctx!.strokeStyle = '#6B4523'; ctx!.lineWidth = 4;
      ctx!.beginPath(); ctx!.moveTo(-41, -20); ctx!.lineTo(41, -20); ctx!.stroke();
      ctx!.fillStyle = '#EFCB7B'; ctx!.beginPath(); ctx!.ellipse(0, -34, 42, 11, 0, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#D9A852';
      for (let i = 0; i < 7; i++) { ctx!.beginPath(); ctx!.arc(-30 + i * 10, -34 - (i % 2) * 4, 3.4, 0, 7); ctx!.fill(); }
      ctx!.restore();
    }

    function drawHud() {
      // word plank
      const pop = easeOutBack(S.wordPop);
      const w = 320, hgt = 74, x = LW / 2 - w / 2, y = 26 * pop;
      ctx!.save(); ctx!.translate(LW / 2, y + hgt / 2); ctx!.scale(Math.max(0.01, pop), Math.max(0.01, pop)); ctx!.translate(-LW / 2, -(y + hgt / 2));
      ctx!.save(); ctx!.shadowColor = 'rgba(60,35,10,0.3)'; ctx!.shadowBlur = 14; ctx!.shadowOffsetY = 5;
      ctx!.fillStyle = '#C68B59'; rr(x, y, w, hgt, 14); ctx!.fill(); ctx!.restore();
      ctx!.strokeStyle = '#7d5330'; ctx!.lineWidth = 3; rr(x, y, w, hgt, 14); ctx!.stroke();
      ctx!.fillStyle = '#FFF6E3'; ctx!.font = `800 15px ${FD()}`; ctx!.textAlign = 'center'; ctx!.textBaseline = 'alphabetic';
      ctx!.fillText('Feed the sound hiding in…', LW / 2, y + 24);
      ctx!.font = `700 34px ${F()}`;
      ctx!.fillText(S.word, LW / 2, y + 58);
      // speaker
      const sp = S.speakerHit; sp.y = y + hgt / 2;
      ctx!.fillStyle = '#FFF6E3'; ctx!.beginPath(); ctx!.arc(sp.x, sp.y, sp.r, 0, 7); ctx!.fill();
      ctx!.fillStyle = '#8A5A2B'; ctx!.font = '22px sans-serif'; ctx!.textBaseline = 'middle';
      ctx!.fillText('🔊', sp.x, sp.y + 1);
      ctx!.restore();
      // round pips
      for (let i = 0; i < VISIT_ROUNDS; i++) {
        ctx!.beginPath(); ctx!.arc(34 + i * 22, 34, 6, 0, 7);
        ctx!.fillStyle = i < S.round ? level.hex : i === S.round ? '#8A5A2B' : 'rgba(255,246,227,0.75)';
        ctx!.fill();
      }
      // creature name tag while it emerges/looks
      for (const c of S.creatures) {
        if (c.state === 'look' || c.state === 'emerge') {
          ctx!.fillStyle = 'rgba(138,90,43,0.92)';
          const name = soundlingName(c.g);
          ctx!.font = `800 17px ${FD()}`;
          const tw = ctx!.measureText(name).width + 22;
          rr(c.x - tw / 2, c.y - 132, tw, 30, 9); ctx!.fill();
          ctx!.fillStyle = '#FFF6E3'; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText(name, c.x, c.y - 117);
        }
      }
    }

    function draw() {
      // letterbox bars
      ctx!.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
      ctx!.fillStyle = '#20150C';
      ctx!.fillRect(0, 0, S.cw, S.ch);
      ctx!.setTransform(S.dpr * S.scale, 0, 0, S.dpr * S.scale, S.dpr * S.ox, S.dpr * S.oy);
      ctx!.save();
      ctx!.beginPath(); ctx!.rect(0, 0, LW, LH); ctx!.clip();

      drawScenery();
      // depth order: back nests first, middle (closer) last
      const order = [0, 2, 1];
      for (const i of order) drawNest(NESTS[i].x, NESTS[i].y, NESTS[i].s);
      drawBucket();
      for (const sh of S.shells) {
        ctx!.save(); ctx!.translate(sh.x, sh.y); ctx!.rotate(sh.rot);
        ctx!.globalAlpha = Math.min(1, sh.life / 0.4);
        ctx!.fillStyle = '#FBF3DE'; ctx!.strokeStyle = 'rgba(138,106,59,0.5)'; ctx!.lineWidth = 2;
        const s2 = sh.big ? 16 : 9;
        ctx!.beginPath(); ctx!.moveTo(-s2, 0); ctx!.lineTo(0, -s2 * 1.2); ctx!.lineTo(s2, 0); ctx!.lineTo(0, s2 * 0.5); ctx!.closePath();
        ctx!.fill(); ctx!.stroke(); ctx!.restore();
      }
      for (const i of order) { const e = S.eggs.find(z => z.nest === i); if (e) drawEgg(e); }
      for (const c of S.creatures) drawCreature(c);
      ctx!.fillStyle = '#EFCB7B';
      for (const g of S.grains) {
        if (g.t < 0) continue;
        ctx!.beginPath(); ctx!.ellipse(g.x, g.y, 4.5, 3.2, g.vx * 0.001, 0, 7); ctx!.fill();
      }
      for (const p of S.puffs) {
        ctx!.save(); ctx!.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5)); ctx!.translate(p.x, p.y); ctx!.rotate(p.rot);
        if (p.kind === 'conf') { ctx!.fillStyle = p.color; ctx!.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66); }
        else if (p.kind === 'straw') { ctx!.strokeStyle = p.color; ctx!.lineWidth = 3; ctx!.lineCap = 'round'; ctx!.beginPath(); ctx!.moveTo(-p.size / 2, 0); ctx!.lineTo(p.size / 2, 0); ctx!.stroke(); }
        else if (p.kind === 'q') { ctx!.fillStyle = p.color; ctx!.font = `800 ${p.size}px ${FD()}`; ctx!.textAlign = 'center'; ctx!.fillText('?', 0, 0); }
        else { ctx!.fillStyle = p.color; ctx!.beginPath(); ctx!.arc(0, 0, p.size, 0, 7); ctx!.fill(); }
        ctx!.restore();
      }
      drawHud();
      ctx!.restore();
    }

    // ── view scaling: fixed logical space, letterboxed ──────────────
    function layout() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      S.dpr = dpr; S.cw = canvas!.clientWidth; S.ch = canvas!.clientHeight;
      canvas!.width = Math.round(S.cw * dpr); canvas!.height = Math.round(S.ch * dpr);
      S.scale = Math.min(S.cw / LW, S.ch / LH);
      S.ox = (S.cw - LW * S.scale) / 2;
      S.oy = (S.ch - LH * S.scale) / 2;
    }

    function toLogical(e: PointerEvent): { x: number; y: number } {
      const rect = canvas!.getBoundingClientRect();
      return { x: (e.clientX - rect.left - S.ox) / S.scale, y: (e.clientY - rect.top - S.oy) / S.scale };
    }

    function onTap(e: PointerEvent) {
      const p = toLogical(e);
      const sp = S.speakerHit;
      if (Math.hypot(p.x - sp.x, p.y - sp.y) < sp.r + 8) { speakWord(S.word); sfx.tick(); return; }
      // egg hit test (generous circle around each egg)
      for (const egg of S.eggs) {
        if (egg.state !== 'idle') continue;
        if (Math.hypot(p.x - egg.x, p.y - (egg.y - 20)) < egg.hitR) { feed(egg.nest); return; }
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === '1' || e.key === '2' || e.key === '3') { feed(Number(e.key) - 1); e.preventDefault(); }
      else if (e.key === ' ') { speakWord(S.word); e.preventDefault(); }
    }

    function loop(now: number) {
      const dt = (now - S.last) / 1000; S.last = now;
      if (canvas!.clientWidth !== S.cw || canvas!.clientHeight !== S.ch) layout();
      try { update(dt || 0); draw(); } catch (err) {
        // keep the loop alive, but never silently
        console.error('[BarnGame]', err);
      }
      S.raf = requestAnimationFrame(loop);
    }

    (canvas as unknown as { __restart?: () => void }).__restart = () => { endedRef.current(null); setupVisit(); };
    // Dev-only scene handle so automated tests can assert on game state.
    if (import.meta.env.DEV) {
      (canvas as unknown as { __S?: typeof S; __feed?: (n: number) => void }).__S = S;
      (canvas as unknown as { __S?: typeof S; __feed?: (n: number) => void }).__feed = feed;
    }

    layout();
    setupVisit();
    window.addEventListener('resize', layout);
    canvas.addEventListener('pointerdown', onTap);
    window.addEventListener('keydown', onKey);
    S.last = performance.now();
    S.raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(S.raf);
      window.removeEventListener('resize', layout);
      canvas.removeEventListener('pointerdown', onTap);
      window.removeEventListener('keydown', onKey);
      try { window.speechSynthesis?.cancel(); } catch { /* n/a */ }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const restart = () => (canvasRef.current as unknown as { __restart?: () => void })?.__restart?.();

  return createPortal(
    <div className="fixed inset-0 z-[70]" style={{ background: '#20150C' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      <button
        onClick={onClose}
        aria-label="Close game"
        className="absolute top-3.5 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
        style={{ boxShadow: '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)' }}
      >
        <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>&times;</span>
      </button>
      {/* End-of-visit overlay — interface, not gameplay */}
      {ended && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-full max-w-xs px-5 flex flex-col gap-2.5">
          <div className="rounded-2xl bg-white/95 px-4 py-3 text-center" style={{ boxShadow: '0 8px 20px rgba(40,30,40,0.2)' }}>
            <p className="font-display text-lg font-extrabold" style={{ color: level.inkHex }}>
              {ended.hatched.length
                ? `${ended.hatched.map(g => soundlingName(g)).join(' and ')} hatched! 🎉`
                : `${ended.fed} tasty feed${ended.fed === 1 ? '' : 's'}!`}
            </p>
          </div>
          <button
            onClick={restart}
            className="w-full h-14 rounded-2xl font-display text-base font-extrabold text-white active:translate-y-[3px]"
            style={{ background: level.hex, boxShadow: `0 5px 0 ${level.inkHex}` }}
          >
            Feed more Soundlings
          </button>
          <button
            onClick={onClose}
            className="w-full h-12 rounded-2xl font-display text-sm font-extrabold bg-white active:translate-y-[3px]"
            style={{ color: level.inkHex, boxShadow: '0 4px 0 rgba(40,30,40,0.15)' }}
          >
            All done
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
