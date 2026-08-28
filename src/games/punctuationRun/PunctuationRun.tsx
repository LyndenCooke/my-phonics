/**
 * PunctuationRun — "Punctuation Run", a lane-runner for the grammar strand.
 *
 * A kid (drawn from behind — we run WITH them) sprints down a meadow path.
 * Every few seconds a row of three wooden doors rushes up from the
 * horizon, each wearing a punctuation mark. Steer into a lane (tap a
 * door, or arrow keys / 1-2-3); the answer resolves when the runner
 * PHYSICALLY passes the door plane, not on the tap.
 *
 * Progression (the user's design):
 *  - early levels (1-4): MATCH rounds — a big mark on the prompt plank,
 *    run through the same mark; symbol recognition plus its printed name;
 *  - later levels (5-8): after two warm-up matches, SENTENCE rounds — a
 *    sentence missing its end mark ("Can you see the cat __") and the
 *    child must choose the door that finishes it. Real reading, real
 *    grammar, right when the curriculum's grammar strand begins.
 *
 * Correct door: swings a green flash, confetti, star, and the run speeds
 * up. Wrong door: it's shut — thud, bounce, the right door shows a tick,
 * and the pace resets. Eight doors a run.
 *
 * Shared engine scene: fixed 1280×720 logical space. The painted path
 * backdrop, door sprite and 3-frame run-cycle kid (gpt-image, real alpha)
 * are all optional assets — procedural versions draw when any is missing.
 * No TTS anywhere.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { sfx } from '@/games/audio';
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

interface Wave {
  marks: Mark[];          // mark per lane
  correctLane: number;
  mode: 'match' | 'sentence';
  sentence: string;       // '' in match mode
  target: Mark;
  u: number;              // 0 (horizon) → 1 (runner plane)
  resolved: 'no' | 'hit' | 'miss';
  t: number;              // time since resolution
}

/** Lane x at a given depth (lanes fan out as they approach). */
function laneX(lane: number, u: number) {
  return LW / 2 + (lane - 1) * (90 + 240 * u);
}

export default function PunctuationRun({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ended, setEnded] = useState<{ stars: number } | null>(null);
  const endedRef = useRef(setEnded);
  endedRef.current = setEnded;

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
    const sentencesLeft: Record<Mark, string[]> = {
      '.': shuffle(SENTENCES['.']), '?': shuffle(SENTENCES['?']), '!': shuffle(SENTENCES['!']),
    };

    function approachTime() { return 3.4 / speed; }

    function spawnWave() {
      if (over) return;
      waveN += 1;
      if (waveN > WAVES) {
        over = true;
        sfx.fanfare();
        ev.at(0.8, () => endedRef.current({ stars }));
        return;
      }
      const target = MARKS[Math.floor(Math.random() * MARKS.length)];
      // early levels match symbols; later levels read sentences after two warm-ups
      const mode: Wave['mode'] = level.level >= 5 && waveN > 2 ? 'sentence' : 'match';
      let sentence = '';
      if (mode === 'sentence') {
        if (!sentencesLeft[target].length) sentencesLeft[target] = shuffle(SENTENCES[target]);
        sentence = sentencesLeft[target].pop() as string;
      }
      const marks = shuffle([...MARKS]) as Mark[];
      wave = {
        marks, correctLane: marks.indexOf(target), mode, sentence, target,
        u: 0, resolved: 'no', t: 0,
      };
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
      }
      ev.at(hitIt ? 0.7 : 1.4, spawnWave);
    }

    function start() {
      waveN = 0; stars = 0; over = false; speed = 1;
      runner.lane = 1; runner.x = 1; runner.stumble = 0;
      ev.clear(); wave = null;
      spawnWave();
    }

    function steer(lane: number) {
      if (over) return;
      const l = clamp(lane, 0, 2);
      if (l !== runner.lane) { runner.lane = l; sfx.tick(); }
    }

    const scene: Scene = {
      W: LW, H: LH, bars: '#12202E',
      update(dt, t) {
        ev.update(t);
        fx.update(dt);
        shake *= Math.pow(0.001, dt);
        if (shake < 0.2) shake = 0;
        roadPhase += dt * 3.2 * speed;
        runner.stride += dt * 11 * speed;
        runner.stumble = Math.max(0, runner.stumble - dt * 1.6);
        runner.x += (runner.lane - runner.x) * Math.min(1, dt * 9);

        if (wave) {
          if (wave.resolved === 'no') {
            wave.u += dt / approachTime();
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
            const x0 = LW / 2 + sep * 2 * (90 + 240 * Math.pow(u0, 1.6));
            const x1 = LW / 2 + sep * 2 * (90 + 240 * Math.pow(u1, 1.6));
            ctx.globalAlpha = 0.25 + u0 * 0.6;
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;

        // ── the doors ──
        if (wave) {
          const ue = easeOutCubic(wave.u) * 0.4 + wave.u * 0.6; // slight ease
          const s = 0.22 + 0.78 * ue;
          const y = HORIZON_Y + (RUNNER_Y - 40 - HORIZON_Y) * Math.pow(ue, 1.6);
          for (let lane = 0; lane < 3; lane++) {
            const x = laneX(lane, Math.pow(ue, 1.6));
            const w = 150 * s, h = 210 * s;
            const isCorrect = lane === wave.correctLane;
            const gone = wave.resolved === 'hit' && lane === runner.lane;
            ctx.save();
            ctx.translate(x, y);
            if (wave.resolved !== 'no' && lane === runner.lane && wave.resolved === 'miss') {
              ctx.translate(Math.sin(wave.t * 40) * 5 * Math.max(0, 1 - wave.t), 0);
            }
            if (gone) ctx.globalAlpha = Math.max(0, 1 - wave.t * 2.2);
            const open = wave.resolved === 'hit' && lane === runner.lane;
            const missed = wave.resolved === 'miss' && lane === runner.lane;
            if (ok(doorImg)) {
              // painted sprite: sign plate baked in at the top (~12% down)
              const dh = 330 * s, dw = dh * doorImg.naturalWidth / doorImg.naturalHeight;
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
                ctx.globalAlpha = gone ? Math.max(0, 1 - wave.t * 2.2) : 1;
              }
              const signY = -dh * 0.885;
              ctx.fillStyle = missed && lane === runner.lane ? '#E5484D' : ink;
              ctx.font = `800 ${Math.round(46 * s)}px ${F}`;
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(wave.marks[lane], 0, signY);
              if (isCorrect && wave.resolved === 'miss' && wave.t > 0.3) {
                ctx.fillStyle = '#22C55E'; ctx.font = `800 ${Math.round(38 * s)}px ${FD}`;
                ctx.fillText('✓', dw * 0.42, signY - 20 * s);
              }
            } else {
              // procedural fallback door
              ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.3)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 5 * s;
              ctx.fillStyle = '#8A5A2B';
              roundRect(ctx, -w / 2, -h, w, h, 14 * s); ctx.fill(); ctx.restore();
              ctx.fillStyle = open ? '#BFE8C5' : missed ? '#F3C1C1' : '#C68B59';
              roundRect(ctx, -w / 2 + 9 * s, -h + 9 * s, w - 18 * s, h - 12 * s, 10 * s); ctx.fill();
              ctx.save(); ctx.translate(0, -h - 34 * s);
              ctx.fillStyle = '#FFFFFF';
              ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, 7); ctx.fill();
              ctx.lineWidth = 4 * s; ctx.strokeStyle = isCorrect && wave.resolved === 'miss' ? '#22C55E' : `${ink}`;
              ctx.beginPath(); ctx.arc(0, 0, 34 * s, 0, 7); ctx.stroke();
              ctx.fillStyle = ink; ctx.font = `800 ${Math.round(44 * s)}px ${F}`;
              ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText(wave.marks[lane], 0, 3 * s);
              if (isCorrect && wave.resolved === 'miss' && wave.t > 0.3) {
                ctx.fillStyle = '#22C55E'; ctx.font = `800 ${Math.round(36 * s)}px ${FD}`;
                ctx.fillText('✓', 34 * s, -26 * s);
              }
              ctx.restore();
            }
            ctx.restore();
          }
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
        const plankW = wave?.mode === 'sentence' ? 640 : 380;
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#FFFFFF'; roundRect(ctx, LW / 2 - plankW / 2, 26, plankW, 74, 18); ctx.fill(); ctx.restore();
        ctx.strokeStyle = `${hex}55`; ctx.lineWidth = 3; roundRect(ctx, LW / 2 - plankW / 2, 26, plankW, 74, 18); ctx.stroke();
        ctx.textAlign = 'center';
        if (wave?.mode === 'sentence') {
          ctx.fillStyle = 'rgba(90,78,86,0.75)'; ctx.font = `700 14px ${FD}`; ctx.textBaseline = 'alphabetic';
          ctx.fillText('Which mark ends the sentence? Run through its door!', LW / 2, 48);
          ctx.fillStyle = ink; ctx.font = `700 27px ${F}`;
          ctx.fillText(`${wave.sentence} __`, LW / 2, 84);
        } else if (wave) {
          ctx.fillStyle = 'rgba(90,78,86,0.75)'; ctx.font = `700 14px ${FD}`; ctx.textBaseline = 'alphabetic';
          ctx.fillText(`Run through the ${MARK_NAMES[wave.target]}!`, LW / 2, 48);
          ctx.fillStyle = ink; ctx.font = `800 40px ${F}`;
          ctx.fillText(wave.target, LW / 2, 90);
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
        // tap a door column (or anywhere in its third of the path)
        steer(x < LW / 2 - 90 ? 0 : x > LW / 2 + 90 ? 2 : 1);
        void y;
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
