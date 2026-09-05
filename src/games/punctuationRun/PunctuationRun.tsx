/**
 * Door Dash v4 — read the signs, pick an arch, and the hero ACTUALLY RUNS
 * THROUGH THE DOOR.
 *
 * Built around the user's mockup: three glowing archway gates at the top
 * of a forking country path, a big expressive boy seen from behind, and a
 * warm storybook HUD (hearts, star count, banner, "Hear it again" pill).
 *
 * The old conveyor (gates sliding at a static runner) is gone. Now:
 *  - READ: the boy jogs on the spot at the fork. George says the word
 *    (recorded MP3, never printed first). No timer — speed must never
 *    punish careful decoding.
 *  - COMMIT: tap an arch (or its path, or keys 1/2/3) and the boy sprints
 *    up that fork, shrinking into the perspective, dust at his heels.
 *  - THROUGH: arriving at the RIGHT arch, the portal flares and he
 *    disappears through it — confetti, star, next round. The WRONG arch
 *    thuds shut: he bounces back down the path, a heart is lost, the
 *    correct sign shows its tick, the word is spoken again, and the same
 *    round is retried. Three hearts, eight arches a run; stars count
 *    first-try successes.
 *
 * Rounds: L1-4 (and two warm-ups at L5-8) are hear-it-read-it word rounds
 * with look-alike distractors ramping over the run; L5-8 rounds 3-8 are
 * sentence rounds, arch signs wearing . ? ! with a teaching line on any
 * miss.
 *
 * Assets: arch_scene.webp (the mockup scene, boy removed, signs blanked)
 * and kid2_{0,1,2}.png (3-frame run cycle in the same style, real alpha).
 * ARCH_X / SIGN geometry is MEASURED from the PNG — re-measure if the
 * scene is regenerated. Procedural fallbacks draw if any asset is missing.
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
const ROUNDS = 8;
const HEARTS = 3;
const MARKS = ['.', '?', '!'] as const;
type Mark = typeof MARKS[number];

// ── arch_scene.webp geometry (logical 1280×720, measured) ──
const ARCH_X = [372, 634, 912];         // arch opening centres
const ARCH_BASE = 345;                  // where the path meets the glow
const SIGNS = [
  { x: 346, w: 200 },
  { x: 637, w: 185 },
  { x: 915, w: 170 },
];
const SIGN_CY = 134, SIGN_H = 60;
// the boy's journey
const START = { x: 640, y: 700 };
const KID_H0 = 300;                     // hero height at the fork
const KID_H1 = 108;                     // height at the arch
const RUN_T = 1.5;                      // seconds up the path
const BACK_T = 0.6;                     // bounce-back after a shut door

const MARK_NAMES: Record<Mark, string> = {
  '.': 'full stop',
  '?': 'question mark',
  '!': 'exclamation mark',
};

const MARK_TEACH: Record<Mark, string> = {
  '.': 'It tells us something — telling sentences end with a full stop.',
  '?': 'It asks — asking sentences end with a question mark.',
  '!': 'It shouts with feeling — that needs an exclamation mark!',
};

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

const MAX_DOOR_WORD = 9;

interface Round {
  mode: 'word' | 'sentence';
  labels: string[];
  correct: number;
  target: string;
  sentence: string;
  firstTry: boolean;
}

/** Quadratic bezier point from the fork to an arch. */
function pathPoint(archX: number, t: number): { x: number; y: number } {
  const p1x = (START.x + archX) / 2, p1y = 520;
  const a = 1 - t;
  return {
    x: a * a * START.x + 2 * a * t * p1x + t * t * archX,
    y: a * a * START.y + 2 * a * t * p1y + t * t * (ARCH_BASE + 8),
  };
}

/** Distractors ramp from easy-to-tell-apart to true look-alikes. */
function pickDistractors(target: string, pool: string[], hardness: number): string[] {
  const scored = pool
    .filter(w => w !== target)
    .map(w => {
      let s = Math.random();
      if (Math.abs(w.length - target.length) <= 1) s += 2;
      if (w[0] === target[0]) s += 2;
      if (w[w.length - 1] === target[target.length - 1]) s += 1;
      return { w, s };
    })
    .sort((a, b) => b.s - a.s);
  const slice = Math.max(4, Math.round(14 - 10 * hardness));
  return shuffle(scored.slice(0, slice).map(x => x.w)).slice(0, 2);
}

export default function PunctuationRun({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ended, setEnded] = useState<{ stars: number; newBest: boolean } | null>(null);
  const endedRef = useRef(setEnded);
  endedRef.current = setEnded;

  const bank = useGameBank(level);
  const bankRef = useRef(bank);
  bankRef.current = bank;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hex = level.hex, ink = level.inkHex;
    const ev = new EventQueue();
    const fx = new Particles();
    const art = new Image();
    art.src = '/images/games/arch_scene.webp';
    const kidImgs = [0, 1, 2].map(i => { const im = new Image(); im.src = `/images/games/sprites/kid2_${i}.png`; return im; });
    const ok = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;
    let fontReady = false;
    try { document.fonts.ready.then(() => { fontReady = true; }); } catch { fontReady = true; }

    // ── state ──
    let round: Round | null = null;
    let roundN = 0;
    let stars = 0;
    let hearts = HEARTS;
    let over = false;
    // phase machine: read → run → (through | back → read)
    let phase: 'read' | 'run' | 'through' | 'back' = 'read';
    let phaseT = 0;
    let chosen = 1;
    let lastMiss = -1;          // which arch thudded (for the red flash)
    let teach = '';             // banner line after a miss
    let stride = 0;
    let lastLeg = 0;
    let shake = 0;
    let steered = false;
    const usedWords = new Set<string>();
    const sentencesLeft: Record<Mark, string[]> = {
      '.': shuffle(SENTENCES['.']), '?': shuffle(SENTENCES['?']), '!': shuffle(SENTENCES['!']),
    };

    function wordPool(): string[] {
      const all = [...new Set(Object.values(bankRef.current).flat())]
        .filter(w => w.length <= MAX_DOOR_WORD && !w.includes(' '));
      const voiced = all.filter(hasAudio);
      const pool = voiced.length >= 3 ? voiced : all;
      return pool.length >= 3 ? pool : ['sat', 'tap', 'pin'];
    }

    function nextRound() {
      if (over) return;
      roundN += 1;
      lastMiss = -1; teach = '';
      phase = 'read'; phaseT = 0;
      if (roundN > ROUNDS) { finish(); return; }
      const mode: Round['mode'] = level.level >= 5 && roundN > 2 ? 'sentence' : 'word';
      if (mode === 'sentence') {
        const target = MARKS[Math.floor(Math.random() * MARKS.length)];
        if (!sentencesLeft[target].length) sentencesLeft[target] = shuffle(SENTENCES[target]);
        const sentence = sentencesLeft[target].pop() as string;
        const labels = shuffle([...MARKS]) as string[];
        round = { mode, labels, correct: labels.indexOf(target), target, sentence, firstTry: true };
      } else {
        const pool = wordPool();
        const fresh = pool.filter(w => !usedWords.has(w));
        const target = (fresh.length ? fresh : pool)[Math.floor(Math.random() * (fresh.length ? fresh.length : pool.length))];
        usedWords.add(target);
        const labels = shuffle([target, ...pickDistractors(target, pool, Math.min(1, (roundN - 1) / 5))]);
        round = { mode, labels, correct: labels.indexOf(target), target, sentence: '', firstTry: true };
        speakWord(target);
      }
    }

    function finish() {
      over = true;
      sfx.fanfare();
      let newBest = false;
      try {
        const b = Number(localStorage.getItem('mpb_doordash_best') || 0);
        if (stars > b) { localStorage.setItem('mpb_doordash_best', String(stars)); newBest = stars > 0; }
      } catch { /* private mode */ }
      ev.at(0.8, () => endedRef.current({ stars, newBest }));
    }

    function commit(lane: number) {
      if (over || phase !== 'read' || !round) return;
      steered = true;
      chosen = clamp(lane, 0, 2);
      phase = 'run'; phaseT = 0;
      teach = '';
      sfx.tick();
    }

    function arrive() {
      if (!round) return;
      if (chosen === round.correct) {
        phase = 'through'; phaseT = 0;
        if (round.firstTry) stars += 1;
        sfx.pop(); sfx.whoosh();
        if (roundN % 3 === 0) sfx.chord();
        const p = pathPoint(ARCH_X[chosen], 1);
        fx.burst(p.x, p.y - 70, [hex, '#FDBA2D', '#FFF3C2', '#ffffff'], 30);
        ev.at(0.9, nextRound);
      } else {
        phase = 'back'; phaseT = 0;
        round.firstTry = false;
        lastMiss = chosen;
        hearts -= 1;
        shake = 6;
        sfx.bonk();
        const p = pathPoint(ARCH_X[chosen], 1);
        fx.puff(p.x, p.y - 40, 8, 'rgba(140,100,60,0.5)');
        teach = round.mode === 'word'
          ? `Not that one — listen again!`
          : MARK_TEACH[round.target as Mark];
        ev.at(0.7, () => { if (round && phase !== 'through') speakWord(round.target); });
        if (hearts <= 0) ev.at(1.4, finish);
      }
    }

    function start() {
      roundN = 0; stars = 0; hearts = HEARTS; over = false;
      phase = 'read'; phaseT = 0; chosen = 1; teach = ''; lastMiss = -1;
      usedWords.clear();
      ev.clear(); round = null;
      nextRound();
    }

    const scene: Scene = {
      W: LW, H: LH, bars: '#173049',
      update(dt, t) {
        ev.update(t);
        fx.update(dt);
        shake *= Math.pow(0.001, dt);
        if (shake < 0.2) shake = 0;
        phaseT += dt;
        const running = phase === 'run' || phase === 'back';
        stride += dt * (running ? 13 : 7);
        // footsteps while sprinting
        const leg = Math.sin(stride);
        if (running && ((lastLeg <= 0 && leg > 0) || (lastLeg >= 0 && leg < 0))) sfx.step();
        lastLeg = leg;
        if (phase === 'run' && phaseT >= RUN_T) arrive();
        if (phase === 'back' && phaseT >= BACK_T) { phase = 'read'; phaseT = 0; }
      },

      draw(ctx, t) {
        // ── the scene ──
        if (!drawCover(ctx, art, LW, LH)) {
          const sky = ctx.createLinearGradient(0, 0, 0, LH);
          sky.addColorStop(0, '#7EC4EE'); sky.addColorStop(0.5, '#CBE6C0'); sky.addColorStop(1, '#E9C883');
          ctx.fillStyle = sky; ctx.fillRect(0, 0, LW, LH);
          for (let a = 0; a < 3; a++) {
            const x = ARCH_X[a];
            ctx.fillStyle = '#8A5A2B';
            roundRect(ctx, x - 90, 170, 180, 190, 26); ctx.fill();
            ctx.fillStyle = '#FFF6C9';
            ctx.beginPath(); ctx.ellipse(x, ARCH_BASE - 70, 62, 92, 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#F1E4C3';
            roundRect(ctx, SIGNS[a].x - SIGNS[a].w / 2, SIGN_CY - SIGN_H / 2, SIGNS[a].w, SIGN_H, 12); ctx.fill();
          }
        }

        ctx.save();
        if (shake > 0) ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
        const F = fontReady ? 'Andika' : 'sans-serif';
        const FD = fontReady ? 'Outfit' : 'sans-serif';

        // ── sign labels ──
        if (round) {
          for (let a = 0; a < 3; a++) {
            const s = SIGNS[a];
            const label = round.labels[a];
            ctx.font = `800 40px ${F}`;
            const tw = ctx.measureText(label).width;
            const fpx = round.mode === 'sentence'
              ? 52
              : Math.min(46, ((s.w * 0.88) / Math.max(1, tw)) * 40);
            ctx.font = `800 ${Math.round(fpx)}px ${F}`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            // sign face shading is baked; a soft dark ink reads as painted-on
            ctx.fillStyle = lastMiss === a ? '#C93A3F' : '#3E2E1E';
            ctx.fillText(label, s.x, SIGN_CY + 2);
            // tick on the correct sign after a miss
            if (a === round.correct && teach && phase !== 'through') {
              ctx.fillStyle = '#1FA84F';
              ctx.font = `800 34px ${FD}`;
              ctx.fillText('✓', s.x + s.w / 2 + 22, SIGN_CY - SIGN_H / 2);
            }
          }
          // red flush over a freshly-shut arch
          if (phase === 'back' && lastMiss >= 0) {
            ctx.save();
            ctx.globalAlpha = 0.28 * Math.max(0, 1 - phaseT / BACK_T);
            ctx.fillStyle = '#E5484D';
            ctx.beginPath();
            ctx.ellipse(ARCH_X[lastMiss], ARCH_BASE - 80, 70, 105, 0, 0, 7);
            ctx.fill();
            ctx.restore();
          }
        }

        // ── the boy ──
        let kx = START.x, ky = START.y, kh = KID_H0, alpha = 1, rot = 0;
        if (phase === 'run') {
          const p = easeOutCubic(Math.min(1, phaseT / RUN_T));
          const pt = pathPoint(ARCH_X[chosen], p);
          kx = pt.x; ky = pt.y;
          kh = KID_H0 + (KID_H1 - KID_H0) * p;
          // melt into the portal glow over the last stretch (right arch only)
          if (round && chosen === round.correct && p > 0.9) alpha = 1 - (p - 0.9) / 0.1;
        } else if (phase === 'through') {
          alpha = 0;
        } else if (phase === 'back') {
          const p = 1 - phaseT / BACK_T; // reverse, fast
          const pt = pathPoint(ARCH_X[chosen], easeOutCubic(Math.max(0, p)));
          kx = pt.x; ky = pt.y;
          kh = KID_H0 + (KID_H1 - KID_H0) * Math.max(0, p);
          rot = Math.sin(phaseT * 22) * 0.08 * (1 - phaseT / BACK_T);
        }
        const bob = Math.abs(Math.sin(stride)) * (phase === 'read' ? 6 : 3) * (kh / KID_H0);
        if (alpha > 0) {
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(kx, ky - bob);
          ctx.rotate(rot);
          const sc = kh / KID_H0;
          ctx.fillStyle = 'rgba(60,40,25,0.28)';
          ctx.beginPath(); ctx.ellipse(0, bob + 4, 52 * sc, 12 * sc, 0, 0, 7); ctx.fill();
          if (kidImgs.every(ok)) {
            const seq = [0, 1, 2, 1];
            const frame = kidImgs[seq[Math.floor(stride * 1.6) % 4]];
            const kw = kh * frame.naturalWidth / frame.naturalHeight;
            ctx.drawImage(frame, -kw / 2, -kh, kw, kh);
          } else {
            // procedural fallback boy
            const legSwing = Math.sin(stride);
            ctx.scale(sc, sc);
            ctx.strokeStyle = '#2E4A8F'; ctx.lineWidth = 22; ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(-14, -60); ctx.lineTo(-14 - legSwing * 12, -8); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(14, -60); ctx.lineTo(14 + legSwing * 12, -8); ctx.stroke();
            ctx.fillStyle = '#19B8AF';
            roundRect(ctx, -36, -150, 72, 95, 20); ctx.fill();
            ctx.fillStyle = '#2F5FBF';
            roundRect(ctx, -26, -140, 52, 62, 16); ctx.fill();
            ctx.fillStyle = '#E8B48C'; ctx.beginPath(); ctx.arc(0, -175, 30, 0, 7); ctx.fill();
            ctx.fillStyle = '#7A4A22'; ctx.beginPath(); ctx.ellipse(0, -185, 31, 22, 0, 0, 7); ctx.fill();
          }
          ctx.restore();
          // dust while sprinting
          if ((phase === 'run' || phase === 'back') && Math.abs(Math.sin(stride)) > 0.93 && fx.list.length < 80) {
            fx.puff(kx - 8 + Math.random() * 16, ky + 2, 1, 'rgba(214,183,120,0.6)');
          }
        }

        // ── portal flare when he goes through ──
        if (phase === 'through' && round) {
          const x = ARCH_X[round.correct];
          const a = Math.max(0, 1 - phaseT / 0.8);
          const r = 60 + 90 * easeOutCubic(Math.min(1, phaseT / 0.35));
          const glow = ctx.createRadialGradient(x, ARCH_BASE - 80, 6, x, ARCH_BASE - 80, r);
          glow.addColorStop(0, `rgba(255,250,215,${0.95 * a})`);
          glow.addColorStop(0.6, `rgba(255,230,150,${0.6 * a})`);
          glow.addColorStop(1, 'rgba(255,230,150,0)');
          ctx.fillStyle = glow;
          ctx.fillRect(x - r, ARCH_BASE - 80 - r, r * 2, r * 2);
        }

        fx.draw(ctx);

        // ── HUD (mockup layout) ──
        // hearts, top-left
        for (let i = 0; i < HEARTS; i++) {
          const x = 44 + i * 40;
          ctx.font = `28px ${FD}`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.globalAlpha = i < hearts ? 1 : 0.28;
          ctx.fillText('❤️', x, 42);
          ctx.globalAlpha = 1;
        }
        // stars, top-right
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.2)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#fff'; roundRect(ctx, LW - 140, 24, 108, 42, 21); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#FDBA2D'; starPath(ctx, LW - 112, 45, 13); ctx.fill();
        ctx.fillStyle = '#33261A'; ctx.font = `800 22px ${FD}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
        ctx.fillText(String(stars), LW - 90, 46);
        // banner, top-centre
        if (round) {
          const msg = teach
            ? teach
            : round.mode === 'sentence'
              ? `${round.sentence} __`
              : 'Run through the word you hear';
          ctx.font = teach || round.mode !== 'sentence' ? `800 24px ${FD}` : `700 27px ${F}`;
          const bw = Math.min(760, ctx.measureText(msg).width + 60);
          ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.22)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
          ctx.fillStyle = teach ? '#FFF4E8' : 'rgba(255,255,255,0.94)';
          roundRect(ctx, LW / 2 - bw / 2, 16, bw, 46, 23); ctx.fill(); ctx.restore();
          ctx.fillStyle = teach ? '#9A5A1E' : '#26364F';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(msg, LW / 2, 40);
          // "hear it again" pill (word rounds)
          if (round.mode === 'word') {
            ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.2)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
            ctx.fillStyle = '#2F5FBF';
            ctx.beginPath(); ctx.arc(LW / 2 - 74, 88, 20, 0, 7); ctx.fill();
            ctx.fillStyle = '#fff';
            roundRect(ctx, LW / 2 - 50, 72, 132, 32, 16); ctx.fill();
            ctx.restore();
            ctx.font = `20px ${FD}`; ctx.fillStyle = '#fff';
            ctx.fillText('🔊', LW / 2 - 74, 89);
            ctx.font = `800 15px ${FD}`; ctx.fillStyle = '#26364F';
            ctx.fillText('Hear it again', LW / 2 + 16, 89);
          }
          // first-timer hint
          if (!steered && phase === 'read' && roundN === 1) {
            const pulse = 0.7 + Math.sin(t * 5) * 0.3;
            ctx.save(); ctx.globalAlpha = pulse;
            ctx.font = `700 21px ${FD}`;
            const hint = '👆 Tap a door to run through it!';
            const hw = ctx.measureText(hint).width + 44;
            ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 4;
            ctx.fillStyle = '#FFFFFF';
            roundRect(ctx, LW / 2 - hw / 2, 452, hw, 44, 16); ctx.fill();
            ctx.restore();
            ctx.fillStyle = '#26364F'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.font = `700 21px ${FD}`;
            ctx.fillText(hint, LW / 2, 474);
          }
        }
        // round progress dots, bottom-left
        for (let i = 0; i < ROUNDS; i++) {
          ctx.beginPath(); ctx.arc(40 + i * 22, LH - 26, 6, 0, 7);
          ctx.fillStyle = i < roundN - (phase === 'through' ? 0 : 1) ? hex : 'rgba(255,255,255,0.85)';
          ctx.fill();
        }
        ctx.restore();
      },

      onTap(x, y) {
        if (over) return;
        // "hear it again" pill
        if (round?.mode === 'word' && y > 60 && y < 116 && Math.abs(x - LW / 2) < 110) {
          speakWord(round.target);
          sfx.tick();
          return;
        }
        if (phase !== 'read') return;
        // tap an arch, its sign, or its fork of the path
        if (y < 480) {
          let best = 1, bd = Infinity;
          for (let a = 0; a < 3; a++) {
            const d = Math.abs(x - ARCH_X[a]);
            if (d < bd) { bd = d; best = a; }
          }
          commit(best);
        } else {
          commit(x < 500 ? 0 : x > 780 ? 2 : 1);
        }
      },
      onKey(e) {
        if (e.key === '1' || e.key === '2' || e.key === '3') { commit(Number(e.key) - 1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { commit(0); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { commit(1); e.preventDefault(); }
        else if (e.key === 'ArrowRight') { commit(2); e.preventDefault(); }
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
    <div className="fixed inset-0 z-[70]" style={{ background: '#173049' }}>
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
              {ended.stars === ROUNDS ? 'Perfect run! 🌟' : `${ended.stars} of ${ROUNDS} doors first try!`}
            </p>
            {ended.newBest && ended.stars < ROUNDS && (
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
