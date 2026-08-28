/**
 * SafariGame — Sound Spotter rebuilt as a real 2D canvas game.
 *
 * A hidden-object detective scene. Objects are world entities scattered
 * with depth, tilt and a gentle idle sway; a brass MAGNIFYING GLASS
 * follows the pointer, and anything under the lens leans in larger —
 * scanning the scene is the core feel. Tap a find and it doesn't just
 * vanish: it POPS, says its word, and physically arcs across the scene
 * into the evidence tray, landing with a squash next to its word (target
 * spelling lit up). Wrong objects shake, bonk and say their word — a
 * teaching moment, not a punishment. Each completed round slams a rubber
 * stamp ("Sharp eyes!") onto the scene.
 *
 * Five rounds; a round with at most one wrong tap earns its star.
 * Content comes from safariData (the curated emoji-object bank), same
 * pedagogy as before: matching is by spelling, targets prefer the
 * chosen level's own sounds.
 *
 * Shared engine: fixed 1280×720 logical space, letterboxed; painted
 * study backdrop is environment only (procedural study drawn if absent).
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { displayGrapheme, speakWord } from '@/lib/soundGameWords';
import { sfx } from '@/games/audio';
import {
  mountScene, EventQueue, Particles, drawCover, roundRect, starPath,
  easeOutBack, easeOutCubic, clamp, shuffle, type Scene,
} from '@/games/engine';
import { loadLedger } from '@/lib/greenWords';
import { buildSafariRounds, type SafariRound } from './safariData';

interface Props {
  level: JourneyLevel;
  onClose: () => void;
}

const LW = 1280, LH = 720;
const ROUNDS = 5;
const TRAY_Y = 664;

type ObjState = 'in' | 'idle' | 'shake' | 'fly' | 'done';

interface ObjE {
  word: string; emoji: string; isTarget: boolean;
  x: number; y: number; size: number; rot: number; ph: number;
  state: ObjState; t: number;
  fx: number; fy: number;      // fly-from
  slot: number;                 // tray slot when found
}

export default function SafariGame({ level, onClose }: Props) {
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
    const art = new Image();
    art.src = '/images/games/spotter_study.webp';
    let fontReady = false;
    try { document.fonts.ready.then(() => { fontReady = true; }); } catch { fontReady = true; }

    let rounds: SafariRound[] = [];
    let roundIdx = 0;
    let objs: ObjE[] = [];
    let wrongTaps = 0;
    let stars: boolean[] = [];
    let stamp = 0;               // stamp animation timer (0 = hidden)
    let stampGood = true;
    let over = false;
    const lens = { x: LW / 2, y: LH / 2, px: LW / 2, py: LH / 2 };
    const speaker = { x: LW / 2 + 250, y: 62, r: 26 };

    function placeRound(r: SafariRound) {
      const cells: { x: number; y: number }[] = [];
      for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
        cells.push({ x: 200 + col * 293, y: 200 + row * 160 });
      }
      const spots = shuffle(cells);
      let slot = 0;
      objs = r.items.map((it, i) => ({
        word: it.word, emoji: it.emoji, isTarget: it.isTarget,
        x: clamp(spots[i].x + (Math.random() * 120 - 60), 90, LW - 90),
        y: clamp(spots[i].y + (Math.random() * 70 - 35), 170, 590),
        size: 54 + Math.random() * 26,
        rot: (Math.random() * 26 - 13) * Math.PI / 180,
        ph: Math.random() * 7,
        state: 'in', t: -i * 0.045,
        fx: 0, fy: 0,
        slot: it.isTarget ? slot++ : -1,
      }));
    }

    function startRound(i: number) {
      roundIdx = i;
      wrongTaps = 0;
      placeRound(rounds[i]);
      ev.at(0.7, () => speakWord(rounds[i].example));
    }

    function start() {
      rounds = buildSafariRounds(level, ROUNDS);
      stars = []; over = false; stamp = 0;
      ev.clear();
      if (rounds.length) startRound(0);
    }

    function tapObj(o: ObjE) {
      const r = rounds[roundIdx];
      if (o.isTarget) {
        sfx.pop(); speakWord(o.word);
        fx.burst(o.x, o.y, [hex, '#FDBA2D', '#ffffff'], 10, 160);
        o.state = 'fly'; o.t = 0; o.fx = o.x; o.fy = o.y;
        const remaining = objs.filter(z => z.isTarget && z.state !== 'fly' && z.state !== 'done').length;
        if (remaining === 0) {
          const good = wrongTaps <= 1;
          stars.push(good);
          ev.at(0.55, () => { stamp = 0.001; stampGood = good; sfx.chord(); });
          ev.at(2.1, () => {
            stamp = 0;
            if (roundIdx + 1 >= rounds.length) {
              over = true; sfx.fanfare();
              ev.at(0.7, () => endedRef.current({ stars: stars.filter(Boolean).length }));
            } else {
              startRound(roundIdx + 1);
            }
          });
        }
      } else {
        sfx.bonk(); speakWord(o.word);
        wrongTaps += 1;
        o.state = 'shake'; o.t = 0;
      }
    }

    function trayX(slot: number, total: number) {
      const w = 210, gap = 16;
      const totalW = total * w + (total - 1) * gap;
      return LW / 2 - totalW / 2 + slot * (w + gap) + w / 2;
    }

    const scene: Scene = {
      W: LW, H: LH, bars: '#241A10',
      update(dt, t) {
        ev.update(t);
        fx.update(dt);
        if (stamp > 0) stamp += dt;
        // lens follows the pointer with a soft lag
        lens.x += (lens.px - lens.x) * Math.min(1, dt * 10);
        lens.y += (lens.py - lens.y) * Math.min(1, dt * 10);

        const total = rounds[roundIdx]?.targetCount ?? 0;
        for (const o of objs) {
          o.t += dt;
          if (o.state === 'in' && o.t >= 0.4) { o.state = 'idle'; }
          else if (o.state === 'shake' && o.t >= 0.55) { o.state = 'idle'; o.t = 0.5; }
          else if (o.state === 'fly') {
            if (o.t >= 0.62) { o.state = 'done'; sfx.tick(); fx.puff(trayX(o.slot, total), TRAY_Y - 14, 4, 'rgba(255,255,255,0.7)'); }
          }
        }
      },

      draw(ctx, t) {
        const F = fontReady ? 'Andika' : 'sans-serif';
        const FD = fontReady ? 'Outfit' : 'sans-serif';
        const r = rounds[roundIdx];

        // ── scenery ──
        if (!drawCover(ctx, art, LW, LH)) {
          ctx.fillStyle = '#F6E7CE'; ctx.fillRect(0, 0, LW, LH);
          ctx.fillStyle = '#B98A54'; ctx.fillRect(0, LH - 120, LW, 120);
          ctx.fillStyle = '#8A6A45'; ctx.fillRect(0, 0, 120, LH); ctx.fillRect(LW - 120, 0, 120, LH);
        }

        // ── objects ──
        const total = r?.targetCount ?? 0;
        for (const o of objs) {
          if (o.state === 'done') continue;
          let x = o.x, y = o.y, s = o.size, rot = o.rot, alpha = 1;
          if (o.state === 'in') {
            if (o.t < 0) continue;
            const k = easeOutBack(Math.min(1, o.t / 0.4));
            s *= Math.max(0.01, k);
          } else if (o.state === 'idle') {
            y += Math.sin(t * 1.4 + o.ph) * 4;
            rot += Math.sin(t * 1.1 + o.ph * 2) * 0.03;
            // the lens makes things lean in closer
            const d = Math.hypot(o.x - lens.x, o.y - lens.y);
            if (d < 150) s *= 1 + 0.24 * (1 - d / 150);
          } else if (o.state === 'shake') {
            x += Math.sin(o.t * 42) * 8 * Math.max(0, 1 - o.t / 0.55);
            rot += Math.sin(o.t * 42) * 0.06;
          } else if (o.state === 'fly') {
            const e = o.t / 0.62;
            const tx = trayX(o.slot, total), ty = TRAY_Y - 14;
            const k = easeOutCubic(Math.min(1, e));
            x = o.fx + (tx - o.fx) * k;
            y = o.fy + (ty - o.fy) * k - Math.sin(Math.PI * Math.min(1, e)) * 150;
            s *= 1 - 0.45 * k;
          }
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(x, y); ctx.rotate(rot);
          ctx.shadowColor = 'rgba(40,30,40,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 4;
          ctx.font = `${Math.round(s)}px sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(o.emoji, 0, 0);
          ctx.restore();
        }

        fx.draw(ctx);

        // ── candle-lit gloom with the lens as a pool of light — the
        // magnifier is a real torch, not a cursor decoration ──
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, LW, LH);
        ctx.arc(lens.x, lens.y, 118, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(38,24,10,0.34)';
        ctx.fill('evenodd');
        const rim = ctx.createRadialGradient(lens.x, lens.y, 92, lens.x, lens.y, 150);
        rim.addColorStop(0, 'rgba(255,214,140,0.16)');
        rim.addColorStop(1, 'rgba(255,214,140,0)');
        ctx.fillStyle = rim;
        ctx.beginPath(); ctx.arc(lens.x, lens.y, 150, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        // ── magnifying glass (the detective's tool) ──
        ctx.save();
        ctx.translate(lens.x, lens.y);
        ctx.strokeStyle = '#B98A2E'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.arc(0, 0, 118, 0, 7); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 106, -2.6, -1.9); ctx.stroke();
        ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = 17; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(85, 85); ctx.lineTo(150, 150); ctx.stroke();
        ctx.restore();

        // ── HUD: the brief ──
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#FFFFFF'; roundRect(ctx, LW / 2 - 210, 28, 420, 66, 18); ctx.fill(); ctx.restore();
        ctx.strokeStyle = `${hex}55`; ctx.lineWidth = 3; roundRect(ctx, LW / 2 - 210, 28, 420, 66, 18); ctx.stroke();
        if (r) {
          const shown = displayGrapheme(r.target);
          ctx.fillStyle = hex; roundRect(ctx, LW / 2 - 192, 40, 88, 42, 12); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = `700 ${shown.length > 3 ? 22 : 28}px ${F}`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(shown, LW / 2 - 148, 62);
          ctx.fillStyle = ink; ctx.font = `700 24px ${FD}`; ctx.textAlign = 'left';
          const found = objs.filter(o => o.isTarget && (o.state === 'fly' || o.state === 'done')).length;
          ctx.fillText(`Find ${r.targetCount} with "${shown}"  ·  ${found}/${r.targetCount}`, LW / 2 - 88, 62);
        }
        ctx.fillStyle = hex; ctx.beginPath(); ctx.arc(speaker.x, speaker.y, speaker.r, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🔊', speaker.x, speaker.y + 1);
        // round pips
        for (let i = 0; i < ROUNDS; i++) {
          ctx.beginPath(); ctx.arc(48 + i * 24, 44, 7, 0, 7);
          ctx.fillStyle = i < roundIdx ? hex : i === roundIdx ? ink : 'rgba(255,255,255,0.8)';
          ctx.fill();
        }

        // ── evidence tray ──
        if (r) {
          for (let i = 0; i < r.targetCount; i++) {
            const cx = trayX(i, r.targetCount);
            const found = objs.find(o => o.isTarget && o.slot === i && o.state === 'done');
            ctx.save();
            if (found) {
              ctx.shadowColor = 'rgba(40,30,40,0.2)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
              ctx.fillStyle = '#fff'; roundRect(ctx, cx - 102, TRAY_Y - 34, 204, 52, 26); ctx.fill();
              ctx.shadowColor = 'transparent';
              ctx.strokeStyle = hex; ctx.lineWidth = 3; roundRect(ctx, cx - 102, TRAY_Y - 34, 204, 52, 26); ctx.stroke();
              ctx.font = '28px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
              ctx.fillText(found.emoji, cx - 88, TRAY_Y - 7);
              // word with target spelling lit
              const g = displayGrapheme(r.target);
              const at = found.word.indexOf(g);
              ctx.font = `700 24px ${F}`;
              const pre = found.word.slice(0, at), mid = found.word.slice(at, at + g.length), post = found.word.slice(at + g.length);
              let tx = cx - 50;
              ctx.fillStyle = 'hsl(260 10% 25%)'; ctx.fillText(pre, tx, TRAY_Y - 6); tx += ctx.measureText(pre).width;
              ctx.fillStyle = hex; ctx.fillText(mid, tx, TRAY_Y - 6); tx += ctx.measureText(mid).width;
              ctx.fillStyle = 'hsl(260 10% 25%)'; ctx.fillText(post, tx, TRAY_Y - 6);
            } else {
              ctx.globalAlpha = 0.75;
              ctx.fillStyle = 'rgba(255,255,255,0.7)'; roundRect(ctx, cx - 102, TRAY_Y - 34, 204, 52, 26); ctx.fill();
              ctx.setLineDash([8, 7]); ctx.strokeStyle = 'rgba(120,95,60,0.6)'; ctx.lineWidth = 3;
              roundRect(ctx, cx - 102, TRAY_Y - 34, 204, 52, 26); ctx.stroke(); ctx.setLineDash([]);
              ctx.fillStyle = 'rgba(120,95,60,0.5)'; ctx.font = `800 26px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
              ctx.fillText('?', cx, TRAY_Y - 7);
            }
            ctx.restore();
          }
        }

        // ── round stamp ──
        if (stamp > 0) {
          const k = Math.min(1, stamp / 0.28);
          const s = 2.2 - 1.2 * easeOutCubic(k);
          ctx.save();
          ctx.translate(LW / 2, LH / 2 - 40); ctx.rotate(-0.09); ctx.scale(s, s);
          ctx.globalAlpha = Math.min(1, k * 1.4);
          ctx.shadowColor = 'rgba(40,30,40,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
          ctx.fillStyle = '#fff'; roundRect(ctx, -150, -56, 300, 112, 20); ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.strokeStyle = stampGood ? hex : '#B98A54'; ctx.lineWidth = 5;
          roundRect(ctx, -138, -44, 276, 88, 14); ctx.stroke();
          ctx.fillStyle = stampGood ? ink : '#8A6A45';
          ctx.font = `800 34px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(stampGood ? 'SHARP EYES!' : 'ALL FOUND!', 0, 0);
          ctx.restore();
          if (stamp > 0.26 && stamp < 0.3) fx.puff(LW / 2, LH / 2 - 40, 8, 'rgba(185,138,46,0.35)');
        }
      },

      onMove(x, y) { lens.px = x; lens.py = y; },
      onTap(x, y) {
        lens.px = x; lens.py = y;
        if (Math.hypot(x - speaker.x, y - speaker.y) < speaker.r + 8) {
          const r = rounds[roundIdx]; if (r) { speakWord(r.example); sfx.tick(); }
          return;
        }
        if (over || stamp > 0) return;
        let bestObj: ObjE | null = null, bestD = 1e9;
        for (const o of objs) {
          if (o.state !== 'idle' && o.state !== 'shake') continue;
          const d = Math.hypot(o.x - x, o.y - y);
          if (d < o.size * 0.75 + 14 && d < bestD) { bestD = d; bestObj = o; }
        }
        if (bestObj) tapObj(bestObj);
      },
      onKey(e) {
        if (e.key === ' ') { const r = rounds[roundIdx]; if (r) speakWord(r.example); e.preventDefault(); }
      },
      destroy() {
        try { window.speechSynthesis?.cancel(); } catch { /* n/a */ }
      },
    };

    (canvas as unknown as { __restart?: () => void }).__restart = () => { endedRef.current(null); start(); };
    const cleanup = mountScene(canvas, scene);
    // Rounds need the ledger's phonics breakdown — matching is by real
    // sounds (units), never letter-containment.
    let live = true;
    loadLedger().then(() => { if (live) start(); });
    return () => { live = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level]);

  const restart = () => (canvasRef.current as unknown as { __restart?: () => void })?.__restart?.();

  return createPortal(
    <div className="fixed inset-0 z-[70]" style={{ background: '#241A10' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', touchAction: 'none', cursor: 'none' }} />
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
              {ended.stars === ROUNDS ? 'Master detective! 🌟' : `${ended.stars} sharp-eyed round${ended.stars === 1 ? '' : 's'}!`}
            </p>
          </div>
          <button
            onClick={restart}
            className="w-full h-14 rounded-2xl font-display text-base font-extrabold text-white active:translate-y-[3px]"
            style={{ background: level.hex, boxShadow: `0 5px 0 ${level.inkHex}` }}
          >
            New case
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
