/**
 * WordPopGame — Word Pop rebuilt as a real 2D canvas game.
 *
 * The player IS an entity: Buzz the bee. Word-bubbles rise from behind
 * the meadow into the big farm sky with buoyancy, wander and soft mutual
 * collision. The target word is spoken; the child taps (or steers with
 * arrow keys) and Buzz dashes there — but nothing resolves on the tap:
 * the bubble only pops when the BEE physically reaches it. The right
 * bubble bursts (rings, droplets, a star flies to the score); a wrong
 * one flashes, deflects, and knocks Buzz spinning backwards. A target
 * that escapes off the top of the sky is a visible miss.
 *
 * AUDIO-FIRST: the target word is heard (George / ElevenLabs), never
 * printed — printing it would turn listening-and-reading into visual
 * text matching. The word is revealed in print only AFTER the pop (read
 * what you just heard) or when it escapes.
 *
 * 60 seconds, combo multiplier (x2 at 3 straight, x3 at 6 — sparkle
 * arpeggio when a milestone lands), waves rise faster as the score
 * climbs. Words come from the green-words ledger for the level.
 *
 * Scene architecture: shared engine (fixed 1280×720 logical space,
 * letterboxed; layers scenery → bubbles → bee → effects → HUD).
 * The painted sky is environment only — remove it and the game still
 * plays over the procedural sky gradient.
 */
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { JourneyLevel } from '@/lib/levels8';
import { speakWord, WORD_BANK } from '@/lib/soundGameWords';
import { useGameBank } from '@/lib/greenWords';
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
const GAME_SECONDS = 60;
const WAVE_SIZE = 4;
const HILL_Y = 620; // bubbles surface from behind this line

interface Bubble {
  word: string; isTarget: boolean;
  x: number; y: number; r: number;
  vx: number; vy: number;
  ph: number; wrong: number;
  state: 'rise' | 'burst' | 'fade';
  t: number;
}

interface EndStats { score: number; best: number; }

export default function WordPopGame({ level, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bank = useGameBank(level);
  const bankRef = useRef(bank);
  bankRef.current = bank;
  const [ended, setEnded] = useState<EndStats | null>(null);
  const endedRef = useRef(setEnded);
  endedRef.current = setEnded;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const hex = level.hex, ink = level.inkHex;
    const ev = new EventQueue();
    const fx = new Particles();
    const art = new Image();
    art.src = '/images/games/wordpop_sky.webp';
    // painted sprites (optional — procedural fallbacks below)
    const beeImgs = [0, 1].map(i => { const im = new Image(); im.src = `/images/games/sprites/bee_${i}.png`; return im; });
    const hillsImg = new Image();
    hillsImg.src = '/images/games/sprites/hills_fg.png';
    const okIm = (im: HTMLImageElement) => im.complete && im.naturalWidth > 0;
    let fontReady = false;
    try { document.fonts.ready.then(() => { fontReady = true; }); } catch { fontReady = true; }

    // ── state ──
    let bubbles: Bubble[] = [];
    let target = '';
    let score = 0, streak = 0, best = 0, timeLeft = GAME_SECONDS;
    let over = false;
    let waveN = 0;
    let escapedFlash = 0;
    let escapedWord = '';
    let shake = 0;
    // After a pop the word is REVEALED in print — listen first, read after.
    const reveals: { text: string; x: number; y: number; t: number }[] = [];
    const flyStars: { x: number; y: number; t: number }[] = [];
    const clouds = [
      { x: 200, y: 120, s: 1.1, v: 9 },
      { x: 900, y: 210, s: 0.7, v: 14 },
    ];
    // Buzz the bee — the player entity
    const bee = {
      x: LW / 2, y: 500, vx: 0, vy: 0,
      tx: LW / 2, ty: 500,        // steering goal
      dashing: false, spin: 0, ph: Math.random() * 7,
      r: 26,                       // hitbox radius
      keys: { l: false, r: false, u: false, d: false },
    };
    const speaker = { x: LW / 2 + 190, y: 62, r: 30 };

    function pool(): string[] {
      const b = bankRef.current;
      const own = new Set(level.gpcs.flatMap(g => (b[g] ?? WORD_BANK[g] ?? [])));
      if (own.size < 12) for (const ws of Object.values(b)) { ws.forEach(w => own.add(w)); if (own.size >= 24) break; }
      return [...own];
    }

    function riseSpeed() { return 46 + Math.min(60, score * 3); }

    function newWave() {
      waveN += 1;
      const words = shuffle(pool()).slice(0, WAVE_SIZE);
      target = words[Math.floor(Math.random() * words.length)];
      const lanes = shuffle([190, 500, 810, 1110]);
      bubbles = words.map((w, i) => ({
        word: w, isTarget: w === target,
        x: clamp(lanes[i] + (Math.random() * 60 - 30), 90, LW - 90),
        y: HILL_Y + 90 + i * 46,
        r: w.length > 7 ? 84 : w.length > 4 ? 72 : 62,
        vx: 0, vy: -riseSpeed(),
        ph: Math.random() * 7, wrong: 0, state: 'rise', t: 0,
      }));
      speakWord(target);
    }

    function endWave(delay = 0.15) {
      for (const b of bubbles) if (b.state === 'rise') { b.state = 'fade'; b.t = 0; }
      ev.at(delay + 0.35, newWave);
    }

    /** Buzz physically reached a bubble — resolve the collision. */
    function hit(b: Bubble) {
      if (b.state !== 'rise' || over) return;
      if (b.isTarget) {
        b.state = 'burst'; b.t = 0;
        fx.drops(b.x, b.y, 14);
        fx.burst(b.x, b.y, [hex, '#FDBA2D', '#ffffff'], 12, 180);
        streak += 1; best = Math.max(best, streak);
        const mult = streak >= 6 ? 3 : streak >= 3 ? 2 : 1;
        if (streak === 3 || streak === 6) sfx.sparkle(); else sfx.pop();
        score += mult;
        flyStars.push({ x: b.x, y: b.y, t: 0 });
        reveals.push({ text: b.word, x: b.x, y: b.y - b.r - 6, t: 0 });
        shake = Math.max(shake, 3);
        endWave();
      } else {
        // wrong: bubble complains, Buzz bounces off spinning
        b.wrong = 0.6; sfx.bonk();
        speakWord(b.word);
        const nx = bee.x - b.x, ny = bee.y - b.y, nl = Math.hypot(nx, ny) || 1;
        bee.vx = (nx / nl) * 620; bee.vy = (ny / nl) * 620;
        bee.dashing = false; bee.spin = 1;
        b.vx -= (nx / nl) * 120; b.vy -= (ny / nl) * 60;
        streak = 0;
        shake = Math.max(shake, 5);
      }
    }

    function start() {
      score = 0; streak = 0; best = 0; timeLeft = GAME_SECONDS; over = false;
      ev.clear(); bubbles = []; flyStars.length = 0; reveals.length = 0;
      newWave();
    }

    const scene: Scene = {
      W: LW, H: LH, bars: '#12202E',
      update(dt, t) {
        ev.update(t);
        fx.update(dt);
        shake *= Math.pow(0.001, dt);
        if (shake < 0.2) shake = 0;
        escapedFlash = Math.max(0, escapedFlash - dt);

        if (!over) {
          timeLeft -= dt;
          if (timeLeft <= 0) {
            timeLeft = 0; over = true;
            sfx.fanfare();
            ev.at(0.6, () => endedRef.current({ score, best }));
          }
        }

        for (const c of clouds) { c.x += c.v * dt; if (c.x - 180 * c.s > LW) c.x = -200 * c.s; }

        // ── bubbles ──
        for (let i = bubbles.length - 1; i >= 0; i--) {
          const b = bubbles[i]; b.t += dt;
          if (b.wrong > 0) b.wrong -= dt;
          if (b.state === 'rise') {
            b.vy = -riseSpeed() + Math.sin(t * 0.9 + b.ph) * 6;
            b.vx += Math.sin(t * 0.7 + b.ph * 2) * 14 * dt;
            b.vx *= Math.pow(0.5, dt);
            b.x = clamp(b.x + b.vx * dt, b.r * 0.8, LW - b.r * 0.8);
            b.y += b.vy * dt;
            // soft mutual repulsion
            for (const o of bubbles) {
              if (o === b || o.state !== 'rise') continue;
              const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy) || 1, min = (b.r + o.r) * 0.9;
              if (d < min) { const push = (min - d) * 0.5; b.x += (dx / d) * push * dt * 8; o.x -= (dx / d) * push * dt * 8; }
            }
            // escape off the top
            if (b.y < -b.r) {
              bubbles.splice(i, 1);
              if (b.isTarget && !over) {
                streak = 0; escapedFlash = 1.8; escapedWord = b.word;
                sfx.bonk();
                endWave(0);
              }
              continue;
            }
          } else {
            if (b.t > 0.45) { bubbles.splice(i, 1); continue; }
          }
        }

        // ── Buzz ──
        const k = bee.keys;
        const keying = k.l || k.r || k.u || k.d;
        if (keying) {
          bee.dashing = false;
          bee.vx += ((k.r ? 1 : 0) - (k.l ? 1 : 0)) * 2400 * dt;
          bee.vy += ((k.d ? 1 : 0) - (k.u ? 1 : 0)) * 2400 * dt;
        } else if (bee.dashing) {
          const dx = bee.tx - bee.x, dy = bee.ty - bee.y, d = Math.hypot(dx, dy) || 1;
          const sp = 1150;
          bee.vx = (dx / d) * sp; bee.vy = (dy / d) * sp;
          if (d < 18) bee.dashing = false;
        } else {
          bee.vx *= Math.pow(0.02, dt); bee.vy *= Math.pow(0.02, dt);
        }
        const vmax = 1200, v = Math.hypot(bee.vx, bee.vy);
        if (v > vmax) { bee.vx *= vmax / v; bee.vy *= vmax / v; }
        bee.x = clamp(bee.x + bee.vx * dt, 30, LW - 30);
        bee.y = clamp(bee.y + bee.vy * dt, 110, LH - 40);
        bee.spin = Math.max(0, bee.spin - dt * 1.6);
        if (Math.hypot(bee.vx, bee.vy) > 260) {
          fx.list.push({ kind: 'drop', x: bee.x - bee.vx * 0.02, y: bee.y - bee.vy * 0.02, vx: 0, vy: 0, life: 0.2, max: 0.2, size: 3, color: 'rgba(253,186,45,0.5)', rot: 0, vr: 0 });
        }
        // physical bee↔bubble collision resolves the answer
        if (!over) {
          for (const b of bubbles) {
            if (b.state !== 'rise' || b.wrong > 0.25) continue;
            if (Math.hypot(b.x - bee.x, b.y - bee.y) < b.r + bee.r - 8) { hit(b); break; }
          }
        }

        for (let i = reveals.length - 1; i >= 0; i--) {
          const rv = reveals[i]; rv.t += dt; rv.y -= 26 * dt;
          if (rv.t > 1.4) reveals.splice(i, 1);
        }
        for (let i = flyStars.length - 1; i >= 0; i--) {
          const f = flyStars[i]; f.t += dt / 0.7;
          if (f.t >= 1) { flyStars.splice(i, 1); sfx.tick(); }
        }
      },

      draw(ctx, t) {
        // scenery
        if (!drawCover(ctx, art, LW, LH)) {
          const sky = ctx.createLinearGradient(0, 0, 0, LH);
          sky.addColorStop(0, '#AEDCEF'); sky.addColorStop(0.8, '#FDF3E7');
          ctx.fillStyle = sky; ctx.fillRect(0, 0, LW, LH);
          ctx.fillStyle = '#7FB069'; ctx.beginPath();
          ctx.moveTo(0, HILL_Y + 30); ctx.quadraticCurveTo(LW / 2, HILL_Y - 60, LW, HILL_Y + 40);
          ctx.lineTo(LW, LH); ctx.lineTo(0, LH); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const c of clouds) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, 30 * c.s, 0, 7); ctx.arc(c.x + 34 * c.s, c.y - 14 * c.s, 36 * c.s, 0, 7);
          ctx.arc(c.x + 74 * c.s, c.y - 2 * c.s, 28 * c.s, 0, 7); ctx.arc(c.x + 44 * c.s, c.y + 12 * c.s, 30 * c.s, 0, 7);
          ctx.closePath(); ctx.fill();
        }

        ctx.save();
        if (shake > 0) ctx.translate((Math.random() * 2 - 1) * shake, (Math.random() * 2 - 1) * shake);
        const F = fontReady ? 'Andika' : 'sans-serif';
        const FD = fontReady ? 'Outfit' : 'sans-serif';

        // ── bubbles ──
        for (const b of bubbles) {
          let rx = b.r, ry = b.r, alpha = 1;
          if (b.state === 'rise') {
            const wob = Math.sin(t * 3 + b.ph) * 0.05;
            rx *= 1 + wob; ry *= 1 - wob;
            const pop = Math.min(1, b.t / 0.35);
            rx *= easeOutCubic(pop); ry *= easeOutCubic(pop);
          } else if (b.state === 'burst') {
            const e = b.t / 0.45; rx *= 1 + e * 0.6; ry *= 1 + e * 0.6; alpha = 1 - e;
          } else {
            const e = b.t / 0.45; rx *= 1 - e * 0.4; ry *= 1 - e * 0.4; alpha = 1 - e;
          }
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(b.x, b.y);
          ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.2)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 5;
          const grad = ctx.createLinearGradient(0, -ry, 0, ry);
          grad.addColorStop(0, 'rgba(255,255,255,0.96)');
          grad.addColorStop(1, b.wrong > 0 ? 'rgba(254,226,226,0.92)' : 'rgba(224,244,252,0.92)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill(); ctx.restore();
          ctx.lineWidth = 3; ctx.strokeStyle = b.wrong > 0 ? '#EF4444' : 'rgba(126,200,227,0.9)';
          ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.stroke();
          ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.arc(0, 0, rx * 0.66, -2.4, -1.7); ctx.stroke();
          ctx.fillStyle = b.wrong > 0 ? '#EF4444' : ink;
          const fs = clamp((rx * 1.7) / Math.max(3, b.word.length), 17, 34);
          ctx.font = `700 ${Math.round(fs)}px ${F}`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(b.word, 0, 2);
          ctx.restore();
        }

        // ── foreground hills: bubbles rise from BEHIND the meadow ──
        if (okIm(hillsImg)) {
          const hw = LW, hh = hw * hillsImg.naturalHeight / hillsImg.naturalWidth;
          ctx.drawImage(hillsImg, 0, LH + 120 - hh, hw, hh);
        }

        // ── Buzz the bee ──
        const flap = Math.sin(t * 26) * 0.9;
        const ang = clamp(bee.vx * 0.0004, -0.35, 0.35) + bee.spin * Math.sin(t * 30) * 0.5;
        ctx.save(); ctx.translate(bee.x, bee.y); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(40,30,40,0.16)'; ctx.beginPath(); ctx.ellipse(0, 34, 20, 5, 0, 0, 7); ctx.fill();
        if (beeImgs.every(okIm)) {
          // painted bee, two wing frames; sprite faces right — flip with vx
          const frame = beeImgs[Math.floor(t * 14) % 2];
          const bh = 96, bw = bh * frame.naturalWidth / frame.naturalHeight;
          if (bee.vx < -40) ctx.scale(-1, 1);
          ctx.drawImage(frame, -bw / 2, -bh / 2 - 6, bw, bh);
          ctx.restore();
        } else {
        // wings
        ctx.fillStyle = 'rgba(235,248,255,0.85)';
        ctx.save(); ctx.rotate(-0.5 - flap * 0.35); ctx.beginPath(); ctx.ellipse(-4, -20, 9, 17, 0.3, 0, 7); ctx.fill(); ctx.restore();
        ctx.save(); ctx.rotate(0.2 + flap * 0.35); ctx.beginPath(); ctx.ellipse(6, -20, 9, 17, -0.3, 0, 7); ctx.fill(); ctx.restore();
        // body
        ctx.fillStyle = '#FDBA2D'; ctx.beginPath(); ctx.ellipse(0, 0, 24, 19, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#5B4222';
        ctx.beginPath(); ctx.ellipse(-8, 0, 4.5, 18, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(6, 0, 4, 16.5, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = '#5B4222'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(18, -12); ctx.quadraticCurveTo(24, -22, 30, -24); ctx.stroke();
        // face (eyes: solid black dots — house rule)
        ctx.fillStyle = '#0D0D0D';
        ctx.beginPath(); ctx.arc(13, -5, 2.8, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(20, -5, 2.8, 0, 7); ctx.fill();
        ctx.strokeStyle = '#0D0D0D'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(14, 2); ctx.quadraticCurveTo(17, 5, 20, 2); ctx.stroke();
        ctx.restore();
        }

        fx.draw(ctx);

        for (const f of flyStars) {
          const e = easeOutCubic(f.t);
          const fxp = f.x + (LW - 90 - f.x) * e, fyp = f.y + (40 - f.y) * e - Math.sin(Math.PI * f.t) * 60;
          ctx.save(); ctx.translate(fxp, fyp); ctx.rotate(f.t * 6);
          ctx.fillStyle = '#FDBA2D'; starPath(ctx, 0, 0, 14 * (1 - f.t * 0.4)); ctx.fill();
          ctx.restore();
        }

        // ── HUD ──
        // instruction plank — audio-first: the target word is HEARD, never
        // printed, or the game becomes visual text matching.
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
        ctx.fillStyle = '#FFFFFF'; roundRect(ctx, LW / 2 - 170, 30, 340, 64, 18); ctx.fill(); ctx.restore();
        ctx.strokeStyle = `${hex}55`; ctx.lineWidth = 3; roundRect(ctx, LW / 2 - 170, 30, 340, 64, 18); ctx.stroke();
        ctx.fillStyle = ink; ctx.font = `700 22px ${FD}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('Pop the word you hear!', LW / 2 - 26, 58);
        ctx.fillStyle = 'rgba(90,78,86,0.7)'; ctx.font = `700 13px ${FD}`;
        ctx.fillText('Tap the speaker to hear it again', LW / 2 - 26, 82);
        ctx.fillStyle = hex; ctx.beginPath(); ctx.arc(speaker.x, speaker.y, speaker.r, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = '22px sans-serif'; ctx.textBaseline = 'middle';
        ctx.fillText('🔊', speaker.x, speaker.y + 1);
        // score
        ctx.save(); ctx.shadowColor = 'rgba(40,30,40,0.15)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#fff'; roundRect(ctx, LW - 148, 22, 116, 40, 20); ctx.fill(); ctx.restore();
        ctx.fillStyle = '#FDBA2D'; starPath(ctx, LW - 122, 42, 12); ctx.fill();
        ctx.fillStyle = ink; ctx.font = `800 20px ${FD}`; ctx.textAlign = 'left';
        ctx.fillText(String(score), LW - 102, 43);
        // combo
        if (streak >= 3) {
          ctx.fillStyle = ink; ctx.font = `800 16px ${FD}`; ctx.textAlign = 'right';
          ctx.fillText(`⚡ x${streak >= 6 ? 3 : 2} combo`, LW - 40, 84);
        }
        // timer bar
        ctx.fillStyle = 'rgba(255,255,255,0.6)'; roundRect(ctx, 40, 30, 220, 14, 7); ctx.fill();
        ctx.fillStyle = timeLeft < 10 ? '#EF4444' : hex;
        roundRect(ctx, 40, 30, Math.max(8, 220 * (timeLeft / GAME_SECONDS)), 14, 7); ctx.fill();
        ctx.fillStyle = 'rgba(90,78,86,0.85)'; ctx.font = `800 15px ${FD}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        ctx.fillText(`${Math.ceil(timeLeft)}s`, 40, 66);
        // popped-word reveals (read what you just heard)
        for (const rv of reveals) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, Math.min(1, (1.4 - rv.t) / 0.5));
          ctx.font = `700 34px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineJoin = 'round';
          ctx.strokeText(rv.text, rv.x, rv.y);
          ctx.fillStyle = ink; ctx.fillText(rv.text, rv.x, rv.y);
          ctx.restore();
        }
        // escape flash — reveal what got away
        if (escapedFlash > 0) {
          ctx.globalAlpha = Math.min(1, escapedFlash / 0.4);
          ctx.fillStyle = 'rgba(90,78,86,0.9)'; ctx.font = `700 22px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(`"${escapedWord}" got away! 💨`, LW / 2, 136);
          ctx.globalAlpha = 1;
        }
        ctx.restore();
      },

      onTap(x, y) {
        if (Math.hypot(x - speaker.x, y - speaker.y) < speaker.r + 8) { speakWord(target); sfx.tick(); return; }
        if (over) return;
        bee.tx = x; bee.ty = clamp(y, 110, LH - 40);
        bee.dashing = true;
      },
      onKey(e) {
        const k = bee.keys;
        const down = e.type === 'keydown';
        if (e.key === 'ArrowLeft') { k.l = down; e.preventDefault(); }
        else if (e.key === 'ArrowRight') { k.r = down; e.preventDefault(); }
        else if (e.key === 'ArrowUp') { k.u = down; e.preventDefault(); }
        else if (e.key === 'ArrowDown') { k.d = down; e.preventDefault(); }
        else if (e.key === ' ') { speakWord(target); e.preventDefault(); }
      },
      destroy() {
        try { window.speechSynthesis?.cancel(); } catch { /* n/a */ }
      },
    };

    // keyup for steering keys (mountScene only wires keydown)
    const onKeyUp = (e: KeyboardEvent) => scene.onKey?.(e);
    window.addEventListener('keyup', onKeyUp);

    (canvas as unknown as { __restart?: () => void }).__restart = () => { endedRef.current(null); start(); };
    const cleanup = mountScene(canvas, scene);
    start();

    return () => {
      window.removeEventListener('keyup', onKeyUp);
      cleanup();
    };
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
              {ended.score} star{ended.score === 1 ? '' : 's'}!{ended.best >= 3 ? ` Best combo: ${ended.best} ⚡` : ''}
            </p>
          </div>
          <button
            onClick={restart}
            className="w-full h-14 rounded-2xl font-display text-base font-extrabold text-white active:translate-y-[3px]"
            style={{ background: level.hex, boxShadow: `0 5px 0 ${level.inkHex}` }}
          >
            Play again
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
