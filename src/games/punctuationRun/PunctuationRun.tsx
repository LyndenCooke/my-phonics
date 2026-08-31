/**
 * Door Dash (the running-man game) — a lane-runner where the child reads
 * doors and runs through the right one.
 *
 * A kid (drawn from behind — we run WITH them) sprints down a meadow path.
 * A fence row with THREE ARCHED GATES rushes up from the horizon; steer
 * into a lane (tap a gate, or arrow keys / 1-2-3) and the answer resolves
 * when the runner PHYSICALLY passes the gate plane. The chosen gate glows
 * with a bouncing chevron the whole approach.
 *
 * The gate row is ONE painted sprite (gate_row.png — three gates joined by
 * split-rail fence, signs, grass and ground shadow baked in, generated in
 * the run_path backdrop's own watercolour style) so it can never read as
 * separate floating doors. Labels are drawn onto the baked sign faces; the
 * lane geometry converges to the path's vanishing point so the row is
 * always ON the path. GATE_X/SIGN_* constants are MEASURED from the PNG —
 * re-measure if the sprite is ever regenerated.
 *
 * What the gates ask depends on what the child can actually do:
 *  - WORD rounds (all of L1-4, and the first two rounds at L5-8):
 *    George says a real curriculum word (recorded MP3 — never TTS), the
 *    three signs wear written words from the level's bank, and the child
 *    must READ them to find the one they heard. Distractors are picked to
 *    look similar (shared letters / length), so decoding is genuinely
 *    required. Tap the prompt plank to hear the word again; it also
 *    replays halfway down the path.
 *  - SENTENCE rounds (L5-8, after the warm-ups — the grammar strand):
 *    a sentence missing its end mark, signs wearing . ? !. The row HOLDS
 *    at the horizon for a reading beat scaled to sentence length, and the
 *    approach is slower than word rounds. A miss teaches: "It's asking —
 *    asking sentences end with a question mark."
 *
 * Correct gate: green flash, confetti, star, the run speeds up. Wrong
 * gate: it's shut — thud, the row judders, the correct sign shows a tick
 * and the teaching line appears. Eight gates a run.
 *
 * Shared engine scene: fixed 1280×720 logical space. Backdrop, gate row
 * and 3-frame run-cycle kid are all optional assets — procedural versions
 * draw when any is missing. No TTS anywhere: recorded audio or silence.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { sfx } from '@/games/audio';
import { useGameBank, hasAudio } from '@/lib/greenWords';
import { speakWord } from '@/lib/soundGameWords';
import {
  mountScene, EventQueue, Particles, drawCover, roundRect, starPath,
  easeOutCubic, clamp, shuffle, type Scene,
} from '@/games/engine';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

const LW = 1280, LH = 720;
const WAVES = 8;
const HORIZON_Y = 330;
const RUNNER_Y = 598;
const MARKS = ['.', '?', '!'] as const;
type Mark = typeof MARKS[number];

// ── gate_row.png geometry, measured from the sprite (fractions of the
// trimmed image). Gate centres, row aspect, and the blank sign faces. ──
const GATE_X = [0.1907, 0.4994, 0.8094];
const GATE_GAP = (GATE_X[2] - GATE_X[0]) / 2;   // lane gap as a row-width fraction
const ROW_ASPECT = 0.3127;                       // row height / row width
const SIGN_CY = 0.097;                           // sign face centre y (of row height)
const SIGN_H = 0.135;                            // sign face height (of row height)
const SIGN_W = 0.116;                            // sign face width (of row width)
const SIGN_FACE = '#F5EBD0';                     // the baked cream — panels extend invisibly
const SIGN_EDGE = '#8B7355';

const MARK_NAMES: Record<Mark, string> = {
  '.': 'full stop',
  '?': 'question mark',
  '!': 'exclamation mark',
};

/** What a miss teaches — why THAT mark ends THAT sentence. */
const MARK_TEACH: Record<Mark, string> = {
  '.': 'It tells us something — telling sentences end with a full stop.',
  '?': 'It asks — asking sentences end with a question mark.',
  '!': 'It shouts with feeling — that needs an exclamation mark!',
};

/** Sentence bank for the later-level rounds — short, familiar words. */
const SENTENCES: Record<Mark, string[]> = {
  '.': [
    'The dog sat on the mat', 'We went to the park', 'The cat is black',
    'I can see a ship', 'Mum has a red hat', 'The frog jumps in the pond',
    'Dad is in the shed', 'The sun is hot',
  ],
  '?': [
    'Can you see the cat', 'What is in the box', 'Where is my hat',
    'Is the dog wet', 'Do you like jam', 'Who is at the door',
    'Can we go to the park', 'What time is it',
  ],
  '!': [
    'What a mess', 'Watch out', 'We won the cup', 'What a big ship',
    'Stop that dog', 'How amazing', 'Look at that', 'Well done',
  ],
};

/** Longest word that fits on a gate sign at approach sizes. */
const MAX_DOOR_WORD = 9;

interface Wave {
  mode: 'word' | 'sentence';
  labels: string[];       // what each gate sign wears (words, or . ? !)
  correctLane: number;
  target: string;         // the heard word, or the missing mark
  sentence: string;       // '' in word mode
  hold: number;           // reading beat before the row moves
  u: number;              // 0 (horizon) → 1 (runner plane)
  replayed: boolean;      // word said again at half way
  resolved: 'no' | 'hit' | 'miss';
  t: number;              // time since resolution
}

/** Lane x at a given depth. The spread converges to the path's vanishing
 *  point (near-zero at the horizon) so the gates are always ON the path. */
function laneX(lane: number, u: number) {
  return LW / 2 + (lane - 1) * (34 + 296 * u);
}

/** Pick two distractors. `hardness` 0→1 ramps the difficulty curve: early
 *  rounds draw easy-to-tell-apart words, later rounds draw look-alikes
 *  (shared length / first letter / last letter) that force a real read. */
function pickDistractors(target: string, pool: string[], hardness: number): string[] {
  const scored = pool
    .filter(w => w !== target)
    .map(w => {
      let s = Math.random(); // tie-break variety
      if (Math.abs(w.length - target.length) <= 1) s += 2;
      if (w[0] === target[0]) s += 2;
      if (w[w.length - 1] === target[target.length - 1]) s += 1;
      return { w, s };
    })
    .sort((a, b) => b.s - a.s);
  // hard rounds choose from the look-alike top; easy rounds from a wide slice
  const slice = Math.max(4, Math.round(14 - 10 * hardness));
  const top = scored.slice(0, slice).map(x => x.w);
  return shuffle(top).slice(0, 2);
}

export default function PunctuationRun({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ended, setEnded] = useState<{ stars: number; newBest: boolean } | null>(null);
  const endedRef = useRef(setEnded);
  endedRef.current = setEnded;

  // Level word bank (upgrades in place once the ledger fetch lands); the
  // scene reads it through a ref so rounds always use the freshest bank.
  const bank = useGameBank(level);
  const bankRef = useRef(bank);
  bankRef.current = bank;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hex = level.hex, ink = level.inkHex;
    const ev = new EventQueue();
    const fx = new Particles();
    // Painted scenery + sprites (all optional — procedural fallbacks below)
    const art = new Image();
    art.src = '/images/games/run_path.webp';
    const rowImg = new Image();
    rowImg.src = '/images/games/sprites/gate_row.png';
    const kidImgs = [0, 1, 2].map(i => { const im = new Image(); im.src = `/images/games/sprites/kid_${i}.png`; return im; });
    const ok = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;
    let fontReady = false;
    try { document.fonts.ready.then(() => { fontReady = true; }); } catch { fontReady = true; }

    // ── state ──
    let wave: Wave | null = null;
    let waveN = 0;
    let stars = 0;
    let streak = 0;           // consecutive correct gates
    let over = false;
    let speed = 1;            // pace multiplier — correct gates speed the run up
    let roadPhase = 0;        // scrolling dashes
    let shake = 0;
    let steered = false;      // has the child ever changed lane? (drives the hint)
    let lastLeg = 0;          // stride phase sign, for footstep timing
    const clouds = [          // slow sky drift — the painting breathes
      { x: 180, y: 74, s: 1.0, v: 9 },
      { x: 760, y: 120, s: 0.7, v: 13 },
      { x: 1150, y: 56, s: 0.85, v: 11 },
    ];
    const runner = { lane: 1, x: 1, stride: 0, stumble: 0 };
    const usedWords = new Set<string>();
    const sentencesLeft: Record<Mark, string[]> = {
      '.': shuffle(SENTENCES['.']), '?': shuffle(SENTENCES['?']), '!': shuffle(SENTENCES['!']),
    };

    /** Voiced, sign-sized words for this level — reading is only honest
     *  when the child HEARS the target in George's voice. */
    function wordPool(): string[] {
      const all = [...new Set(Object.values(bankRef.current).flat())]
        .filter(w => w.length <= MAX_DOOR_WORD && !w.includes(' '));
      const voiced = all.filter(hasAudio);
      const pool = voiced.length >= 3 ? voiced : all;
      return pool.length >= 3 ? pool : ['sat', 'tap', 'pin'];
    }

    function approachTime(mode: Wave['mode']) {
      // Sentence rounds approach slower — there are three symbols but a
      // whole sentence to think about; word rounds ask for three reads.
      // The very first gate of a run comes gentler still.
      return ((mode === 'sentence' ? 5.2 : 4.4) / speed) * (waveN === 1 ? 1.3 : 1);
    }

    function spawnWave() {
      if (over) return;
      waveN += 1;
      if (waveN > WAVES) {
        over = true;
        sfx.fanfare();
        let newBest = false;
        try {
          const b = Number(localStorage.getItem('mpb_doordash_best') || 0);
          if (stars > b) { localStorage.setItem('mpb_doordash_best', String(stars)); newBest = stars > 0; }
        } catch { /* private mode — no best tracking */ }
        ev.at(0.8, () => endedRef.current({ stars, newBest }));
        return;
      }
      // Sentences only where the grammar strand lives (L5+), after two
      // word-round warm-ups. Everything else is hear-it-read-it.
      const mode: Wave['mode'] = level.level >= 5 && waveN > 2 ? 'sentence' : 'word';
      if (mode === 'sentence') {
        const target = MARKS[Math.floor(Math.random() * MARKS.length)];
        if (!sentencesLeft[target].length) sentencesLeft[target] = shuffle(SENTENCES[target]);
        const sentence = sentencesLeft[target].pop() as string;
        const labels = shuffle([...MARKS]) as string[];
        wave = {
          mode, labels, correctLane: labels.indexOf(target), target, sentence,
          // reading beat: the row waits at the horizon while the child reads
          hold: 1.1 + 0.3 * sentence.split(' ').length,
          u: 0, replayed: false, resolved: 'no', t: 0,
        };
      } else {
        const pool = wordPool();
        const fresh = pool.filter(w => !usedWords.has(w));
        const target = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];
        usedWords.add(target);
        const labels = shuffle([target, ...pickDistractors(target, pool, Math.min(1, (waveN - 1) / 5))]);
        wave = {
          mode, labels, correctLane: labels.indexOf(target), target, sentence: '',
          hold: 0.5, u: 0, replayed: false, resolved: 'no', t: 0,
        };
        speakWord(target);
      }
    }

    function resolve() {
      if (!wave || wave.resolved !== 'no') return;
      const hitIt = runner.lane === wave.correctLane;
      wave.resolved = hitIt ? 'hit' : 'miss';
      wave.t = 0;
      const doorX = laneX(runner.lane, 1);
      if (hitIt) {
        stars += 1;
        streak += 1;
        speed = Math.min(1.8, speed + 0.12);
        sfx.pop();
        sfx.whoosh();
        if (streak === 3 || streak === 5 || streak === WAVES) sfx.sparkle();
        else if (waveN % 3 === 0) sfx.chord();
        fx.burst(doorX, RUNNER_Y - 120, [hex, '#FDBA2D', '#22C55E', '#ffffff'], streak >= 3 ? 34 : 22);
        shake = Math.max(shake, 3);
      } else {
        speed = 1;
        streak = 0;
        sfx.bonk();
        runner.stumble = 1;
        shake = Math.max(shake, 6);
        fx.puff(doorX, RUNNER_Y - 80, 8, 'rgba(140,100,60,0.5)');
        // a miss re-teaches: hear the word again while the tick shows
        if (wave.mode === 'word') ev.at(0.5, () => { if (wave?.resolved === 'miss') speakWord(wave.target); });
      }
      ev.at(hitIt ? 0.9 : (wave.mode === 'sentence' ? 2.6 : 1.8), spawnWave);
    }

    function start() {
      waveN = 0; stars = 0; streak = 0; over = false; speed = 1;
      runner.lane = 1; runner.x = 1; runner.stumble = 0;
      usedWords.clear();
      ev.clear(); wave = null;
      spawnWave();
    }

    function steer(lane: number) {
      if (over) return;
      steered = true;
      const l = clamp(lane, 0, 2);
      if (l !== runner.lane) { runner.lane = l; sfx.tick(); }
    }

    /** Current gate-row depth for drawing and hit-testing. */
    function doorDepth(w: Wave) {
      const ue = easeOutCubic(w.u) * 0.4 + w.u * 0.6;
      return Math.pow(ue, 1.6);
    }

    const scene: Scene = {
      W: LW, H: LH, bars: '#12202E',
      update(dt, t) {
        ev.update(t);
        fx.update(dt);
        shake *= Math.pow(0.001, dt);
        if (shake < 0.2) shake = 0;
        // during a reading beat the runner jogs on the spot
        const moving = !wave || wave.hold <= 0;
        roadPhase += dt * 3.2 * speed * (moving ? 1 : 0.25);
        runner.stride += dt * 11 * speed * (moving ? 1 : 0.6);
        runner.stumble = Math.max(0, runner.stumble - dt * 1.6);
        runner.x += (runner.lane - runner.x) * Math.min(1, dt * 9);
        // footsteps land on the stride beat
        const leg = Math.sin(runner.stride);
        if (moving && lastLeg <= 0 && leg > 0) sfx.step();
        if (moving && lastLeg >= 0 && leg < 0) sfx.step();
        lastLeg = leg;
        // sky drifts — the scene is alive even between gates
        for (const c of clouds) {
          c.x -= c.v * dt;
          if (c.x < -160) { c.x = LW + 160; c.y = 40 + Math.random() * 100; }
        }

        if (wave) {
          // dust on landing after the victory leap
          if (wave.resolved === 'hit' && wave.t - dt < 0.55 && wave.t >= 0.55) {
            fx.puff(laneX(runner.x, 1), RUNNER_Y + 56, 6, 'rgba(214,183,120,0.6)');
          }
          if (wave.hold > 0) {
            wave.hold -= dt;
          } else if (wave.resolved === 'no') {
            wave.u += dt / approachTime(wave.mode);
            if (wave.mode === 'word' && !wave.replayed && wave.u >= 0.5) {
              wave.replayed = true;
              speakWord(wave.target);
            }
            if (wave.u >= 1) { wave.u = 1; resolve(); }
          } else {
            wave.t += dt;
          }
        }
      },

      draw(ctx, t) {
        // ── scenery ──
        if (!drawCover(ctx, art, LW, LH)) {
          const sky = ctx.createLinearGradient(0, 0, 0, LH);
          sky.addColorStop(0, '#AEDCEF'); sky.addColorStop(0.75, '#FDF3E7');
          ctx.fillStyle = sky; ctx.fillRect(0, 0, LW, LH);
          ctx.fillStyle = '#7FB069'; ctx.fillRect(0, HORIZON_Y, LW, LH - HORIZON_Y);
        }

        // drifting clouds over the painted sky — gentle life
        for (const c of clouds) {
          ctx.save();
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = '#FFFFFF';
          for (const [dx, dy, r] of [[-34, 4, 22], [0, -6, 30], [36, 4, 24], [10, 10, 26]] as const) {
            ctx.beginPath(); ctx.ellipse(c.x + dx * c.s, c.y + dy * c.s, r * c.s, r * 0.62 * c.s, 0, 0, 7); ctx.fill();
          }
          ctx.restore();
        }

        ctx.save();
        if (shake > 0) ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
        // camera bobs against the stride — the run is felt, not just shown
        ctx.translate(0, Math.sin(runner.stride * 2) * 1.6);
        const F = fontReady ? 'Andika' : 'sans-serif';
        const FD = fontReady ? 'Outfit' : 'sans-serif';

        // ── the path — only drawn when the painted backdrop (which has the
        // path baked in) is missing ──
        if (!ok(art)) {
          ctx.fillStyle = '#E4C98F';
          ctx.beginPath();
          ctx.moveTo(LW / 2 - 120, HORIZON_Y);
          ctx.lineTo(LW / 2 + 120, HORIZON_Y);
          ctx.lineTo(LW / 2 + 520, LH);
          ctx.lineTo(LW / 2 - 520, LH);
          ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(140,100,50,0.4)'; ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(LW / 2 - 120, HORIZON_Y); ctx.lineTo(LW / 2 - 520, LH); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(LW / 2 + 120, HORIZON_Y); ctx.lineTo(LW / 2 + 520, LH); ctx.stroke();
        }
        // scrolling dashes — the speed feel — subtle over the painted path
        ctx.strokeStyle = ok(art) ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 4; ctx.lineCap = 'round';
        for (const sep of [-0.5, 0.5]) {
          for (let k = 0; k < 9; k++) {
            const u0 = ((k + (roadPhase % 1)) / 9);
            const u1 = u0 + 0.035;
            if (u1 >= 1) continue;
            const y0 = HORIZON_Y + (LH - HORIZON_Y) * Math.pow(u0, 1.6);
            const y1 = HORIZON_Y + (LH - HORIZON_Y) * Math.pow(u1, 1.6);
            const x0 = LW / 2 + sep * 2 * (34 + 296 * Math.pow(u0, 1.6));
            const x1 = LW / 2 + sep * 2 * (34 + 296 * Math.pow(u1, 1.6));
            ctx.globalAlpha = 0.25 + u0 * 0.6;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        // speed streaks at full sprint — the reward for a hot streak
        const rush = clamp((speed - 1.3) * 2, 0, 1);
        if (rush > 0) {
          ctx.strokeStyle = `rgba(255,255,255,${0.28 * rush})`;
          ctx.lineWidth = 3; ctx.lineCap = 'round';
          for (let i = 0; i < 7; i++) {
            const a = (i / 7) * Math.PI * 2 + 0.4;
            const p = ((roadPhase * 1.7 + i * 0.37) % 1);
            const r0 = 260 + p * 420, r1 = r0 + 60 + p * 90;
            const cxr = LW / 2, cyr = HORIZON_Y + 30;
            ctx.globalAlpha = rush * p;
            ctx.beginPath();
            ctx.moveTo(cxr + Math.cos(a) * r0, cyr + Math.sin(a) * r0 * 0.62);
            ctx.lineTo(cxr + Math.cos(a) * r1, cyr + Math.sin(a) * r1 * 0.62);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // ── the gate row — ONE unit crossing the path ──
        if (wave) {
          const d = doorDepth(wave);
          const y = HORIZON_Y + (RUNNER_Y - 40 - HORIZON_Y) * d;
          const gap = 34 + 296 * d;                    // lane gap on screen
          const rowW = gap / GATE_GAP;                 // gates land exactly on lanes
          const rowH = rowW * ROW_ASPECT;
          const left = LW / 2 - GATE_X[1] * rowW;
          const rowTop = y - rowH;
          const gx = (lane: number) => left + GATE_X[lane] * rowW;
          // fade in at the vanishing point; fade out as we burst through
          const rowAlpha = clamp(wave.u / 0.08, 0, 1)
            * (wave.resolved === 'hit' ? Math.max(0, 1 - wave.t * 1.6) : 1);
          ctx.save();
          ctx.globalAlpha = rowAlpha;
          // the whole row judders when the runner thumps a shut gate
          if (wave.resolved === 'miss') {
            ctx.translate(Math.sin(wave.t * 40) * 4 * Math.max(0, 1 - wave.t), 0);
          }

          if (ok(rowImg)) {
            ctx.drawImage(rowImg, left, rowTop, rowW, rowH);
          } else {
            // procedural fallback row: shadows, rails, end posts, plain gates
            ctx.fillStyle = 'rgba(70,50,30,0.20)';
            for (let lane = 0; lane < 3; lane++) {
              ctx.beginPath(); ctx.ellipse(gx(lane), y - 2, rowW * 0.075, rowH * 0.035, 0, 0, 7); ctx.fill();
            }
            ctx.fillStyle = '#8B7355'; ctx.strokeStyle = '#5E4B37'; ctx.lineWidth = rowW * 0.004;
            for (const rh of [0.32, 0.52]) {
              roundRect(ctx, left, y - rowH * rh - rowH * 0.02, rowW, rowH * 0.04, rowH * 0.02);
              ctx.fill(); ctx.stroke();
            }
            for (const px of [left + rowW * 0.02, left + rowW * 0.98]) {
              ctx.fillStyle = '#7A6349';
              roundRect(ctx, px - rowW * 0.012, y - rowH * 0.62, rowW * 0.024, rowH * 0.62, rowW * 0.006);
              ctx.fill(); ctx.stroke();
            }
            for (let lane = 0; lane < 3; lane++) {
              const x = gx(lane);
              ctx.fillStyle = '#8A5A2B';
              roundRect(ctx, x - rowW * 0.065, y - rowH * 0.66, rowW * 0.13, rowH * 0.64, rowW * 0.02);
              ctx.fill();
              ctx.fillStyle = SIGN_FACE; ctx.strokeStyle = SIGN_EDGE; ctx.lineWidth = rowW * 0.004;
              roundRect(ctx, x - rowW * SIGN_W / 2, rowTop + (SIGN_CY - SIGN_H / 2) * rowH, rowW * SIGN_W, SIGN_H * rowH, rowW * 0.008);
              ctx.fill(); ctx.stroke();
            }
          }

          // ── per-gate overlays: labels on the signs, glow, chevron ──
          const faceW = rowW * SIGN_W, faceH = rowH * SIGN_H;
          const signY = rowTop + SIGN_CY * rowH;
          for (let lane = 0; lane < 3; lane++) {
            const x = gx(lane);
            const isCorrect = lane === wave.correctLane;
            const chosen = lane === runner.lane;
            const missed = wave.resolved === 'miss' && chosen;
            const label = wave.labels[lane];

            // chosen-gate glow behind the door area
            if (chosen && wave.resolved === 'no') {
              const glow = ctx.createRadialGradient(x, y - rowH * 0.33, 6, x, y - rowH * 0.33, rowH * 0.55);
              glow.addColorStop(0, `${hex}55`); glow.addColorStop(1, `${hex}00`);
              ctx.fillStyle = glow;
              ctx.fillRect(x - rowH * 0.6, y - rowH * 0.95, rowH * 1.2, rowH);
            }
            if (wave.resolved === 'hit' && chosen) {
              const glow = ctx.createRadialGradient(x, y - rowH * 0.33, 6, x, y - rowH * 0.33, rowH * 0.6);
              glow.addColorStop(0, 'rgba(140,240,160,0.7)'); glow.addColorStop(1, 'rgba(140,240,160,0)');
              ctx.fillStyle = glow;
              ctx.fillRect(x - rowH * 0.65, y - rowH, rowH * 1.3, rowH * 1.1);
            }
            // the shut gate flushes red on a miss
            if (missed) {
              ctx.save();
              ctx.globalAlpha = rowAlpha * 0.32;
              ctx.fillStyle = '#E5484D';
              roundRect(ctx, x - rowW * 0.062, y - rowH * 0.64, rowW * 0.124, rowH * 0.6, rowW * 0.015);
              ctx.fill();
              ctx.restore();
            }

            // label on the sign face — a matching cream panel extends the
            // baked sign invisibly when the word needs more room
            ctx.font = `800 40px ${F}`;
            const tw40 = ctx.measureText(label).width;
            const isMark = wave.mode === 'sentence';
            const maxW = Math.min(gap * 0.9, Math.max(faceW * 0.92, isMark ? 0 : faceW * 1.7));
            const fpx = isMark
              ? faceH * 0.85
              : Math.min(faceH * 0.72, (maxW / Math.max(1, tw40)) * 40);
            ctx.font = `800 ${Math.round(fpx)}px ${F}`;
            const lw2 = ctx.measureText(label).width;
            if (!isMark && lw2 > faceW * 0.92) {
              const pw = lw2 + faceH * 0.5;
              ctx.fillStyle = SIGN_FACE; ctx.strokeStyle = SIGN_EDGE; ctx.lineWidth = Math.max(1.5, rowW * 0.003);
              roundRect(ctx, x - pw / 2, signY - faceH * 0.44, pw, faceH * 0.88, faceH * 0.18);
              ctx.fill(); ctx.stroke();
            }
            ctx.fillStyle = missed ? '#E5484D' : ink;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(label, x, signY + faceH * 0.04);

            // the correct sign earns its tick after a miss
            if (isCorrect && wave.resolved === 'miss' && wave.t > 0.3) {
              ctx.fillStyle = '#22C55E'; ctx.font = `800 ${Math.round(faceH * 0.8)}px ${FD}`;
              ctx.fillText('✓', x + faceW * 0.62, signY - faceH * 0.5);
            }
            // chevron over the chosen sign — "this is where I'm running"
            if (chosen && wave.resolved === 'no') {
              const ch = Math.max(10, faceH * 0.55);
              const cy = signY - faceH * 0.8 - Math.abs(Math.sin(t * 4.4)) * ch * 0.8;
              ctx.fillStyle = hex;
              ctx.beginPath();
              ctx.moveTo(x, cy + ch * 0.6); ctx.lineTo(x - ch * 0.55, cy - ch * 0.4); ctx.lineTo(x + ch * 0.55, cy - ch * 0.4);
              ctx.closePath(); ctx.fill();
            }
          }
          ctx.restore(); // rowAlpha
        }

        // first-timer hint: until the child ever steers, show them how
        if (!steered && wave && wave.resolved === 'no' && wave.hold <= 0 && wave.u > 0.22) {
          const pulse = 0.7 + Math.sin(t * 5) * 0.3;
          const hint = '👆 Tap a gate to change lane!';
          ctx.font = `700 22px ${FD}`;
          const hw = ctx.measureText(hint).width + 48;
          ctx.save();
          ctx.globalAlpha = pulse;
          ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#FFFFFF';
          roundRect(ctx, LW / 2 - hw / 2, 486, hw, 48, 16); ctx.fill();
          ctx.restore();
          ctx.fillStyle = ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(hint, LW / 2, 511);
        }

        // ── the runner (from behind — we run with them) ──
        const rx = laneX(runner.x, 1);
        const bob = Math.abs(Math.sin(runner.stride)) * 7;
        // the victory leap through an open gate
        const jump = wave && wave.resolved === 'hit' && wave.t < 0.55
          ? Math.sin(Math.PI * wave.t / 0.55) * 64 : 0;
        const lean = (runner.lane - runner.x) * -0.4;
        const stumbleRot = runner.stumble > 0 ? Math.sin(runner.stumble * 14) * 0.14 * runner.stumble : 0;
        ctx.save();
        ctx.translate(rx, RUNNER_Y - bob - jump);
        ctx.rotate(lean * 0.25 + stumbleRot);
        // ground shadow stays on the path and shrinks under the leap
        ctx.fillStyle = 'rgba(40,30,40,0.22)';
        const shScale = 1 - jump / 200;
        ctx.beginPath(); ctx.ellipse(0, 64 + bob + jump, 34 * shScale, 8 * shScale, 0, 0, 7); ctx.fill();
        const legSwing = Math.sin(runner.stride);
        if (kidImgs.every(ok)) {
          // painted run cycle: stride phase walks the frames 0-1-2-1
          const seq = [0, 1, 2, 1];
          const frame = kidImgs[seq[Math.floor(runner.stride * 1.7) % 4]];
          const kh = 180, kw = kh * frame.naturalWidth / frame.naturalHeight;
          ctx.save();
          ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 6;
          ctx.drawImage(frame, -kw / 2, -kh + 62, kw, kh);
          ctx.restore();
          // running dust at the heels (scene space)
          if (Math.abs(legSwing) > 0.94 && fx.list.length < 90) {
            fx.puff(rx - 6 + Math.random() * 12, RUNNER_Y + 56, 1, 'rgba(214,183,120,0.55)');
          }
          ctx.restore();
        } else {
        // procedural fallback runner
        // legs (navy trousers)
        ctx.strokeStyle = '#3A4A6B'; ctx.lineWidth = 15; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-9, 18); ctx.lineTo(-9 - legSwing * 8, 52 - Math.max(0, legSwing) * 14); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(9, 18); ctx.lineTo(9 + legSwing * 8, 52 - Math.max(0, -legSwing) * 14); ctx.stroke();
        // shoes
        ctx.fillStyle = '#2B2833';
        ctx.beginPath(); ctx.ellipse(-9 - legSwing * 8, 56 - Math.max(0, legSwing) * 14, 10, 6, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(9 + legSwing * 8, 56 - Math.max(0, -legSwing) * 14, 10, 6, 0, 0, 7); ctx.fill();
        // body (level-colour t-shirt)
        ctx.fillStyle = hex;
        roundRect(ctx, -22, -34, 44, 56, 14); ctx.fill();
        // arms swinging opposite the legs
        ctx.strokeStyle = hex; ctx.lineWidth = 12;
        ctx.beginPath(); ctx.moveTo(-20, -22); ctx.lineTo(-28 + legSwing * 10, 6); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(20, -22); ctx.lineTo(28 - legSwing * 10, 6); ctx.stroke();
        ctx.fillStyle = '#E8B48C';
        ctx.beginPath(); ctx.arc(-28 + legSwing * 10, 10, 7, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(28 - legSwing * 10, 10, 7, 0, 7); ctx.fill();
        // head from behind: hair only, no face
        ctx.fillStyle = '#E8B48C'; ctx.beginPath(); ctx.arc(0, -50, 19, 0, 7); ctx.fill();
        ctx.fillStyle = '#5B4222';
        ctx.beginPath(); ctx.arc(0, -53, 19, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, -58, 19, 13, 0, 0, 7); ctx.fill();
        ctx.restore();
        }

        fx.draw(ctx);

        // ── HUD: prompt plank ──
        if (wave) {
          const plankW = wave.mode === 'sentence' ? 680 : 420;
          const plankH = 78;
          ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#FFFFFF'; roundRect(ctx, LW / 2 - plankW / 2, 26, plankW, plankH, 18); ctx.fill(); ctx.restore();
          ctx.strokeStyle = `${hex}55`; ctx.lineWidth = 3; roundRect(ctx, LW / 2 - plankW / 2, 26, plankW, plankH, 18); ctx.stroke();
          ctx.textAlign = 'center';
          if (wave.mode === 'sentence') {
            ctx.fillStyle = 'rgba(90,78,86,0.75)'; ctx.font = `700 15px ${FD}`; ctx.textBaseline = 'alphabetic';
            ctx.fillText(wave.hold > 0 ? 'Read the sentence — get ready to run!' : 'Which mark ends it? Run through its gate!', LW / 2, 50);
            ctx.fillStyle = ink; ctx.font = `700 29px ${F}`;
            ctx.fillText(`${wave.sentence} __`, LW / 2, 88);
          } else {
            // AUDIO-FIRST: the target is never printed before the answer —
            // the child hears George and must READ the signs.
            ctx.fillStyle = 'rgba(90,78,86,0.75)'; ctx.font = `700 15px ${FD}`; ctx.textBaseline = 'alphabetic';
            ctx.fillText('Run through the word you hear', LW / 2, 50);
            // speaker button (tappable — replays the word)
            ctx.font = `700 30px ${FD}`;
            ctx.fillStyle = ink;
            ctx.fillText('🔊', LW / 2 - 60, 88);
            ctx.font = `700 17px ${FD}`;
            ctx.fillStyle = 'rgba(90,78,86,0.85)';
            ctx.fillText('tap to hear it again', LW / 2 + 34, 84);
          }
          // resolution banner: reveal + teach
          if (wave.resolved !== 'no') {
            const msg = wave.resolved === 'hit'
              ? (wave.mode === 'word' ? `Yes — "${wave.target}"!` : `Yes — the ${MARK_NAMES[wave.target as Mark]}!`)
              : (wave.mode === 'word' ? `It was "${wave.target}"` : MARK_TEACH[wave.target as Mark]);
            ctx.font = `700 21px ${FD}`;
            const mw = ctx.measureText(msg).width + 44;
            const by = 26 + plankH + 12;
            ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.2)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
            ctx.fillStyle = wave.resolved === 'hit' ? '#E9F9EE' : '#FFF4E8';
            roundRect(ctx, LW / 2 - mw / 2, by, mw, 44, 14); ctx.fill(); ctx.restore();
            ctx.fillStyle = wave.resolved === 'hit' ? '#177A3E' : '#9A5A1E';
            ctx.textBaseline = 'middle';
            ctx.fillText(msg, LW / 2, by + 23);
          }
        }
        // streak chip — the fire the child runs to keep alive
        if (streak >= 2) {
          const chip = `🔥 ${streak} in a row`;
          ctx.font = `800 17px ${FD}`;
          const cw = ctx.measureText(chip).width + 32;
          ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.15)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
          ctx.fillStyle = '#FFF4DC'; roundRect(ctx, LW - 164 - cw, 22, cw, 40, 20); ctx.fill(); ctx.restore();
          ctx.fillStyle = '#B45309'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(chip, LW - 164 - cw / 2, 43);
        }
        // score + progress
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.15)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#fff'; roundRect(ctx, LW - 148, 22, 116, 40, 20); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#FDBA2D'; starPath(ctx, LW - 122, 42, 12); ctx.fill();
        ctx.fillStyle = ink; ctx.font = `800 20px ${FD}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(stars), LW - 102, 43);
        for (let i = 0; i < WAVES; i++) {
          ctx.beginPath(); ctx.arc(48 + i * 22, 40, 6, 0, 7);
          ctx.fillStyle = i < waveN - (wave && wave.resolved === 'no' ? 1 : 0) ? hex : 'rgba(255,255,255,0.8)';
          ctx.fill();
        }
        ctx.restore();
      },

      onTap(x, y) {
        if (over) return;
        // the speaker plank replays the word
        if (wave?.mode === 'word' && y < 116 && Math.abs(x - LW / 2) < 210) {
          speakWord(wave.target);
          sfx.tick();
          return;
        }
        // steer to the gate nearest the tap AT ITS CURRENT DEPTH — near the
        // horizon the gates are close together, so fixed screen thirds sent
        // taps to the wrong lane
        if (wave && wave.resolved === 'no') {
          const d = doorDepth(wave);
          let best = 1, bestDist = Infinity;
          for (let lane = 0; lane < 3; lane++) {
            const dist = Math.abs(x - laneX(lane, d));
            if (dist < bestDist) { bestDist = dist; best = lane; }
          }
          steer(best);
        } else {
          steer(x < LW / 2 - 90 ? 0 : x > LW / 2 + 90 ? 2 : 1);
        }
      },
      onKey(e) {
        if (e.key === 'ArrowLeft') { steer(runner.lane - 1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { steer(runner.lane + 1); e.preventDefault(); }
        else if (e.key === '1' || e.key === '2' || e.key === '3') { steer(Number(e.key) - 1); e.preventDefault(); }
      },
    };

    (canvas as unknown as { __restart?: () => void }).__restart = () => { endedRef.current(null); start(); };
    const cleanup = mountScene(canvas, scene);
    start();
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const restart = () => (canvasRef.current as unknown as { __restart?: () => void })?.__restart?.();

  return createPortal(
    <div className="fixed inset-0 z-[70]" style={{ background: '#12202E' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none' }} />
      <button
        onClick={onClose}
        aria-label="Close game"
        className="absolute top-3.5 right-4 w-10 h-10 rounded-full bg-white flex items-center justify-center press-scale"
        style={{ boxShadow: '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)' }}
      >
        <span style={{ fontSize: 18, color: 'rgba(0,0,0,0.4)' }}>&times;</span>
      </button>
      {ended && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-8 w-full max-w-xs px-5 flex flex-col gap-2.5">
          <div className="rounded-2xl bg-white/95 px-4 py-3 text-center" style={{ boxShadow: '0 8px 20px rgba(40,30,40,0.2)' }}>
            <p className="font-display text-lg font-extrabold" style={{ color: level.inkHex }}>
              {ended.stars === WAVES ? 'Perfect run! 🌟' : `${ended.stars} of ${WAVES} gates!`}
            </p>
            {ended.newBest && ended.stars < WAVES && (
              <p className="font-display text-sm font-extrabold mt-0.5" style={{ color: '#B45309' }}>
                New best! 🏅
              </p>
            )}
          </div>
          <button
            onClick={restart}
            className="w-full h-14 rounded-2xl font-display text-base font-extrabold text-white active:translate-y-[3px]"
            style={{ background: level.hex, boxShadow: `0 5px 0 ${level.inkHex}` }}
          >
            Run again
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
