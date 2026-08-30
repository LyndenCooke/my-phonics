/**
 * Door Dash (the running-man game) — a lane-runner where the child reads
 * doors and runs through the right one.
 *
 * A kid (drawn from behind — we run WITH them) sprints down a meadow path.
 * Three wooden doors rush up from the horizon; steer into a lane (tap a
 * door, or arrow keys / 1-2-3) and the answer resolves when the runner
 * PHYSICALLY passes the door plane. The chosen door glows the whole
 * approach with a bouncing chevron, so the commitment is always visible.
 *
 * What the doors ask depends on what the child can actually do:
 *  - WORD rounds (all of L1-4, and the first two rounds at L5-8):
 *    George says a real curriculum word (recorded MP3 — never TTS), the
 *    three doors wear written words from the level's bank, and the child
 *    must READ the doors to find the one they heard. Distractors are
 *    picked to look similar (shared letters / length), so decoding is
 *    genuinely required. Tap the prompt plank to hear the word again;
 *    it also replays halfway down the path.
 *  - SENTENCE rounds (L5-8, after the warm-ups — the grammar strand):
 *    a sentence missing its end mark, doors wearing . ? !. The doors
 *    HOLD at the horizon for a reading beat scaled to sentence length,
 *    and the approach itself is slower than word rounds. A miss teaches:
 *    "It's asking — asking sentences end with a question mark."
 *
 * Correct door: green flash, confetti, star, the run speeds up. Wrong
 * door: it's shut — thud, bounce, the correct door shows a tick and the
 * teaching line appears. Eight doors a run.
 *
 * Shared engine scene: fixed 1280×720 logical space. The painted path
 * backdrop, door sprite and 3-frame run-cycle kid (gpt-image, real alpha)
 * are all optional assets — procedural versions draw when any is missing.
 * No TTS anywhere: recorded audio or silence.
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

/** Longest word that fits on a door plank at horizon size. */
const MAX_DOOR_WORD = 9;

interface Wave {
  mode: 'word' | 'sentence';
  labels: string[];       // what each door wears (words, or . ? !)
  correctLane: number;
  target: string;         // the heard word, or the missing mark
  sentence: string;       // '' in word mode
  hold: number;           // reading beat before the doors move
  u: number;              // 0 (horizon) → 1 (runner plane)
  replayed: boolean;      // word said again at half way
  resolved: 'no' | 'hit' | 'miss';
  t: number;              // time since resolution
}

/** Lane x at a given depth. The spread converges to the path's vanishing
 *  point (near-zero at the horizon) so the doors are always ON the path —
 *  the old fixed base spread put the outer doors on the grass and barn. */
function laneX(lane: number, u: number) {
  return LW / 2 + (lane - 1) * (34 + 296 * u);
}

/** Pick two distractors that make the child actually read: prefer words
 *  that share length / first letter / last letter with the target. */
function pickDistractors(target: string, pool: string[]): string[] {
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
  // choose from the look-alike top so rounds vary run to run
  const top = scored.slice(0, 6).map(x => x.w);
  return shuffle(top).slice(0, 2);
}

export default function PunctuationRun({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ended, setEnded] = useState<{ stars: number } | null>(null);
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
    const doorImg = new Image();
    doorImg.src = '/images/games/sprites/door.png';
    const kidImgs = [0, 1, 2].map(i => { const im = new Image(); im.src = `/images/games/sprites/kid_${i}.png`; return im; });
    const ok = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;
    let fontReady = false;
    try { document.fonts.ready.then(() => { fontReady = true; }); } catch { fontReady = true; }

    // ── state ──
    let wave: Wave | null = null;
    let waveN = 0;
    let stars = 0;
    let over = false;
    let speed = 1;            // pace multiplier — correct doors speed the run up
    let roadPhase = 0;        // scrolling dashes
    let shake = 0;
    const runner = { lane: 1, x: 1, stride: 0, stumble: 0 };
    const usedWords = new Set<string>();
    const sentencesLeft: Record<Mark, string[]> = {
      '.': shuffle(SENTENCES['.']), '?': shuffle(SENTENCES['?']), '!': shuffle(SENTENCES['!']),
    };

    /** Voiced, door-sized words for this level — reading is only honest
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
      return (mode === 'sentence' ? 5.2 : 4.4) / speed;
    }

    function spawnWave() {
      if (over) return;
      waveN += 1;
      if (waveN > WAVES) {
        over = true;
        sfx.fanfare();
        ev.at(0.8, () => endedRef.current({ stars }));
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
          // reading beat: doors wait at the horizon while the child reads
          hold: 1.1 + 0.3 * sentence.split(' ').length,
          u: 0, replayed: false, resolved: 'no', t: 0,
        };
      } else {
        const pool = wordPool();
        const fresh = pool.filter(w => !usedWords.has(w));
        const target = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];
        usedWords.add(target);
        const labels = shuffle([target, ...pickDistractors(target, pool)]);
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
        speed = Math.min(1.8, speed + 0.12);
        sfx.pop();
        if (waveN % 3 === 0) sfx.chord();
        fx.burst(doorX, RUNNER_Y - 120, [hex, '#FDBA2D', '#22C55E', '#ffffff'], 22);
        shake = Math.max(shake, 3);
      } else {
        speed = 1;
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
      waveN = 0; stars = 0; over = false; speed = 1;
      runner.lane = 1; runner.x = 1; runner.stumble = 0;
      usedWords.clear();
      ev.clear(); wave = null;
      spawnWave();
    }

    function steer(lane: number) {
      if (over) return;
      const l = clamp(lane, 0, 2);
      if (l !== runner.lane) { runner.lane = l; sfx.tick(); }
    }

    /** Current door depth for drawing and hit-testing. */
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

        if (wave) {
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

        ctx.save();
        if (shake > 0) ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
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

        // ── the doors ──
        if (wave) {
          const d = doorDepth(wave);
          const ue = easeOutCubic(wave.u) * 0.4 + wave.u * 0.6;
          const s = 0.22 + 0.78 * ue;
          const y = HORIZON_Y + (RUNNER_Y - 40 - HORIZON_Y) * d;
          // fade in at the vanishing point so the row doesn't pop into being
          const rowAlpha = clamp(wave.u / 0.08, 0, 1);
          ctx.save();
          ctx.globalAlpha = rowAlpha;

          // ── the gate row: the three doors are GATES in a fence that
          // crosses the path — rails and end posts in the same weathered
          // wood as the painted roadside fences, so the row belongs to the
          // scene instead of floating over it ──
          {
            const gateH = 330 * s;                 // matches sprite door height
            const spanL = laneX(0, d), spanR = laneX(2, d);
            const postW = 16 * s, postH = gateH * 0.62;
            const railH = 13 * s;
            const endL = spanL - 96 * s, endR = spanR + 96 * s;
            // contact shadows for the whole row first
            ctx.fillStyle = 'rgba(70,50,30,0.20)';
            for (let lane = 0; lane < 3; lane++) {
              const x = laneX(lane, d);
              ctx.beginPath(); ctx.ellipse(x, y + 6 * s, 78 * s, 13 * s, 0, 0, 7); ctx.fill();
            }
            ctx.beginPath(); ctx.ellipse(endL, y + 5 * s, 22 * s, 8 * s, 0, 0, 7); ctx.fill();
            ctx.beginPath(); ctx.ellipse(endR, y + 5 * s, 22 * s, 8 * s, 0, 0, 7); ctx.fill();
            // two rails spanning the row (drawn behind the doors)
            ctx.fillStyle = '#8B7355'; ctx.strokeStyle = '#5E4B37'; ctx.lineWidth = 2 * s;
            for (const rh of [0.30, 0.55]) {
              const ry = y - gateH * rh;
              roundRect(ctx, endL, ry - railH / 2, endR - endL, railH, railH / 2);
              ctx.fill(); ctx.stroke();
            }
            // end posts where the row meets the roadside grass
            ctx.fillStyle = '#7A6349';
            for (const px of [endL, endR]) {
              roundRect(ctx, px - postW / 2, y - postH, postW, postH, 4 * s);
              ctx.fill(); ctx.stroke();
              ctx.fillStyle = '#7A6349';
            }
          }

          for (let lane = 0; lane < 3; lane++) {
            const x = laneX(lane, d);
            const w = 150 * s, h = 210 * s;
            const isCorrect = lane === wave.correctLane;
            const chosen = lane === runner.lane;
            const gone = wave.resolved === 'hit' && lane === runner.lane;
            ctx.save();
            ctx.translate(x, y);
            if (wave.resolved === 'miss' && lane === runner.lane) {
              ctx.translate(Math.sin(wave.t * 40) * 5 * Math.max(0, 1 - wave.t), 0);
            }
            if (gone) ctx.globalAlpha = Math.max(0, 1 - wave.t * 2.2);
            const open = wave.resolved === 'hit' && lane === runner.lane;
            const missed = wave.resolved === 'miss' && lane === runner.lane;
            const label = wave.labels[lane];
            const isMarkLabel = wave.mode === 'sentence';
            if (ok(doorImg)) {
              const dh = 330 * s, dw = dh * doorImg.naturalWidth / doorImg.naturalHeight;
              // the chosen door glows in the level colour the whole approach
              if (chosen && wave.resolved === 'no') {
                const glow = ctx.createRadialGradient(0, -dh * 0.45, 8, 0, -dh * 0.45, dh * 0.62);
                glow.addColorStop(0, `${hex}66`); glow.addColorStop(1, `${hex}00`);
                ctx.fillStyle = glow; ctx.fillRect(-dw, -dh * 1.1, dw * 2, dh * 1.25);
              }
              if (open) {
                const glow = ctx.createRadialGradient(0, -dh * 0.45, 8, 0, -dh * 0.45, dh * 0.55);
                glow.addColorStop(0, 'rgba(140,240,160,0.75)'); glow.addColorStop(1, 'rgba(140,240,160,0)');
                ctx.fillStyle = glow; ctx.fillRect(-dw, -dh * 1.05, dw * 2, dh * 1.2);
              }
              ctx.save();
              ctx.shadowColor = 'rgba(40,30,40,0.35)'; ctx.shadowBlur = 12 * s; ctx.shadowOffsetY = 6 * s;
              ctx.drawImage(doorImg, -dw / 2, -dh, dw, dh);
              ctx.restore();
              if (missed) {
                ctx.globalAlpha *= 0.35; ctx.fillStyle = '#E5484D';
                roundRect(ctx, -dw * 0.38, -dh * 0.72, dw * 0.76, dh * 0.7, 12 * s); ctx.fill();
                ctx.globalAlpha = 1;
              }
              if (isMarkLabel) {
                // punctuation fits the baked sign plate
                const signY = -dh * 0.885;
                ctx.fillStyle = missed ? '#E5484D' : ink;
                ctx.font = `800 ${Math.round(46 * s)}px ${F}`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(label, 0, signY);
              } else {
                // words get a hanging plank above the door — sized to fit
                ctx.font = `800 40px ${F}`;
                const tw = ctx.measureText(label).width;
                const fpx = Math.min(34 * s * 1.35, (dw * 1.5) / Math.max(1, tw / 40)) ;
                ctx.font = `800 ${Math.round(fpx)}px ${F}`;
                const lw2 = ctx.measureText(label).width;
                const pw = lw2 + 34 * s, ph = fpx * 1.7, py = -dh * 1.02;
                ctx.save();
                ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 4 * s;
                ctx.fillStyle = '#FFF9EF';
                roundRect(ctx, -pw / 2, py - ph / 2, pw, ph, 10 * s); ctx.fill();
                ctx.restore();
                ctx.lineWidth = 3 * s;
                ctx.strokeStyle = missed ? '#E5484D' : chosen && wave.resolved === 'no' ? hex : `${ink}44`;
                roundRect(ctx, -pw / 2, py - ph / 2, pw, ph, 10 * s); ctx.stroke();
                ctx.fillStyle = missed ? '#E5484D' : ink;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(label, 0, py + 1);
              }
              if (isCorrect && wave.resolved === 'miss' && wave.t > 0.3) {
                ctx.fillStyle = '#22C55E'; ctx.font = `800 ${Math.round(38 * s)}px ${FD}`;
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText('✓', dw * 0.42, -dh * 0.885 - 20 * s);
              }
              // chevron over the chosen door — "this is where I'm running"
              if (chosen && wave.resolved === 'no') {
                const cy = -dh * (isMarkLabel ? 1.06 : 1.18) - Math.abs(Math.sin(t * 4.4)) * 10 * s;
                ctx.fillStyle = hex;
                ctx.beginPath();
                ctx.moveTo(0, cy + 14 * s); ctx.lineTo(-13 * s, cy - 6 * s); ctx.lineTo(13 * s, cy - 6 * s);
                ctx.closePath(); ctx.fill();
              }
            } else {
              // procedural fallback door
              ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.3)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 5 * s;
              ctx.fillStyle = '#8A5A2B';
              roundRect(ctx, -w / 2, -h, w, h, 14 * s); ctx.fill(); ctx.restore();
              ctx.fillStyle = open ? '#BFE8C5' : missed ? '#F3C1C1' : '#C68B59';
              roundRect(ctx, -w / 2 + 9 * s, -h + 9 * s, w - 18 * s, h - 12 * s, 10 * s); ctx.fill();
              if (chosen && wave.resolved === 'no') {
                ctx.lineWidth = 5 * s; ctx.strokeStyle = hex;
                roundRect(ctx, -w / 2, -h, w, h, 14 * s); ctx.stroke();
              }
              ctx.save(); ctx.translate(0, -h - 40 * s);
              ctx.font = `800 40px ${F}`;
              const tw = ctx.measureText(label).width;
              const fpx = isMarkLabel ? 44 * s : Math.min(34 * s * 1.35, (w * 1.9) / Math.max(1, tw / 40));
              ctx.font = `800 ${Math.round(fpx)}px ${F}`;
              const lw2 = isMarkLabel ? 50 * s : ctx.measureText(label).width;
              const pw = lw2 + 30 * s, ph = Math.max(fpx * 1.6, 52 * s);
              ctx.fillStyle = '#FFFFFF';
              roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 12 * s); ctx.fill();
              ctx.lineWidth = 4 * s;
              ctx.strokeStyle = isCorrect && wave.resolved === 'miss' ? '#22C55E' : chosen && wave.resolved === 'no' ? hex : `${ink}`;
              roundRect(ctx, -pw / 2, -ph / 2, pw, ph, 12 * s); ctx.stroke();
              ctx.fillStyle = missed ? '#E5484D' : ink;
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(label, 0, 2 * s);
              if (isCorrect && wave.resolved === 'miss' && wave.t > 0.3) {
                ctx.fillStyle = '#22C55E'; ctx.font = `800 ${Math.round(36 * s)}px ${FD}`;
                ctx.fillText('✓', pw / 2 + 18 * s, -ph / 2);
              }
              if (chosen && wave.resolved === 'no') {
                const cy = -ph / 2 - 24 * s - Math.abs(Math.sin(t * 4.4)) * 10 * s;
                ctx.fillStyle = hex;
                ctx.beginPath();
                ctx.moveTo(0, cy + 14 * s); ctx.lineTo(-13 * s, cy - 6 * s); ctx.lineTo(13 * s, cy - 6 * s);
                ctx.closePath(); ctx.fill();
              }
              ctx.restore();
            }
            ctx.restore();
          }
          ctx.restore(); // rowAlpha
        }

        // ── the runner (from behind — we run with them) ──
        const rx = laneX(runner.x, 1);
        const bob = Math.abs(Math.sin(runner.stride)) * 7;
        const lean = (runner.lane - runner.x) * -0.4;
        const stumbleRot = runner.stumble > 0 ? Math.sin(runner.stumble * 14) * 0.14 * runner.stumble : 0;
        ctx.save();
        ctx.translate(rx, RUNNER_Y - bob);
        ctx.rotate(lean * 0.25 + stumbleRot);
        ctx.fillStyle = 'rgba(40,30,40,0.22)';
        ctx.beginPath(); ctx.ellipse(0, 64 + bob, 34, 8, 0, 0, 7); ctx.fill();
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
            ctx.fillText(wave.hold > 0 ? 'Read the sentence — get ready to run!' : 'Which mark ends it? Run through its door!', LW / 2, 50);
            ctx.fillStyle = ink; ctx.font = `700 29px ${F}`;
            ctx.fillText(`${wave.sentence} __`, LW / 2, 88);
          } else {
            // AUDIO-FIRST: the target is never printed before the answer —
            // the child hears George and must READ the doors.
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
        // steer to the door column nearest the tap AT ITS CURRENT DEPTH —
        // near the horizon the doors are close together, so fixed screen
        // thirds sent taps to the wrong lane
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
              {ended.stars === WAVES ? 'Perfect run! 🌟' : `${ended.stars} of ${WAVES} doors!`}
            </p>
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
