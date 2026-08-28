/**
 * Tiny shared 2D scene engine for the phonics games.
 *
 * Extracted from the BarnGame/WordCannonGame pattern so every converted
 * game is just content + mechanics:
 *  - one responsive canvas with a FIXED LOGICAL SPACE, letterboxed to fit
 *    any screen (gameplay geometry never changes with viewport size);
 *  - a continuous requestAnimationFrame loop with clamped delta time;
 *  - pointer + keyboard input mapped into logical coordinates;
 *  - a time-based event queue (never setTimeout — survives pauses and
 *    dies with the scene);
 *  - errors logged, never swallowed silently, loop kept alive.
 *
 * A Scene is a plain object of closures over its own mutable state —
 * deliberately not a class hierarchy; each game defines whatever entity
 * shapes it needs (position, velocity, hitbox, state machines).
 */

export interface Scene {
  /** Logical space, e.g. 1280×720. Never changes after mount. */
  W: number;
  H: number;
  /** Letterbox bar colour. */
  bars?: string;
  update(dt: number, t: number): void;
  draw(ctx: CanvasRenderingContext2D, t: number): void;
  onTap?(x: number, y: number): void;
  onMove?(x: number, y: number): void;
  onKey?(e: KeyboardEvent): void;
  destroy?(): void;
}

export interface View {
  scale: number; ox: number; oy: number; cw: number; ch: number; dpr: number;
}

/** Mount a scene on a canvas. Returns the cleanup function. */
export function mountScene(canvas: HTMLCanvasElement, scene: Scene): () => void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return () => {};
  const view: View = { scale: 1, ox: 0, oy: 0, cw: 0, ch: 0, dpr: 1 };
  let raf = 0;
  let last = performance.now();
  let t = 0;

  function layout() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    view.dpr = dpr; view.cw = canvas.clientWidth; view.ch = canvas.clientHeight;
    canvas.width = Math.round(view.cw * dpr);
    canvas.height = Math.round(view.ch * dpr);
    view.scale = Math.min(view.cw / scene.W, view.ch / scene.H);
    view.ox = (view.cw - scene.W * view.scale) / 2;
    view.oy = (view.ch - scene.H * view.scale) / 2;
  }

  function toLogical(e: PointerEvent): { x: number; y: number } {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - view.ox) / view.scale,
      y: (e.clientY - rect.top - view.oy) / view.scale,
    };
  }

  const onDown = (e: PointerEvent) => { const p = toLogical(e); scene.onTap?.(p.x, p.y); };
  const onMove = (e: PointerEvent) => { const p = toLogical(e); scene.onMove?.(p.x, p.y); };
  const onKey = (e: KeyboardEvent) => scene.onKey?.(e);

  function frame(now: number) {
    const dt = Math.min((now - last) / 1000 || 0, 0.05);
    last = now;
    if (canvas.clientWidth !== view.cw || canvas.clientHeight !== view.ch) {
      if (canvas.clientWidth > 0 && canvas.clientHeight > 0) layout();
    }
    t += dt;
    try {
      scene.update(dt, t);
      ctx!.setTransform(view.dpr, 0, 0, view.dpr, 0, 0);
      ctx!.fillStyle = scene.bars ?? '#20150C';
      ctx!.fillRect(0, 0, view.cw, view.ch);
      ctx!.setTransform(view.dpr * view.scale, 0, 0, view.dpr * view.scale, view.dpr * view.ox, view.dpr * view.oy);
      ctx!.save();
      ctx!.beginPath(); ctx!.rect(0, 0, scene.W, scene.H); ctx!.clip();
      scene.draw(ctx!, t);
      ctx!.restore();
    } catch (err) {
      console.error('[scene]', err);
    }
    raf = requestAnimationFrame(frame);
  }

  layout();
  window.addEventListener('resize', layout);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  window.addEventListener('keydown', onKey);
  last = performance.now();
  raf = requestAnimationFrame(frame);

  if (import.meta.env.DEV) (canvas as unknown as { __scene?: Scene }).__scene = scene;

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', layout);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    window.removeEventListener('keydown', onKey);
    scene.destroy?.();
  };
}

// ── time-based event queue ──────────────────────────────────────────
export class EventQueue {
  private list: { at: number; fn: () => void }[] = [];
  private now = 0;
  at(delay: number, fn: () => void) { this.list.push({ at: this.now + delay, fn }); }
  update(t: number) {
    this.now = t;
    for (let i = this.list.length - 1; i >= 0; i--) {
      if (t >= this.list[i].at) { const e = this.list[i]; this.list.splice(i, 1); e.fn(); }
    }
  }
  clear() { this.list = []; }
  get pending() { return this.list.length; }
}

// ── shared helpers ──────────────────────────────────────────────────
export const easeOutBack = (t: number) => { const c = 1.70158 * 1.2; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}

export function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function starPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 === 0 ? r : r * 0.45;
    const px = x + Math.cos(a) * rad, py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Cover-fit a backdrop image into the logical space; returns false if the
 *  image isn't ready (caller draws its procedural fallback instead). */
export function drawCover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, W: number, H: number): boolean {
  if (!im.complete || !im.naturalWidth) return false;
  const ar = im.naturalWidth / im.naturalHeight;
  let w = W, h = W / ar;
  if (h < H) { h = H; w = H * ar; }
  ctx.drawImage(im, (W - w) / 2, (H - h) / 2, w, h);
  return true;
}

// ── generic particles (confetti / puffs / droplets / streaks) ───────
export interface Particle {
  kind: 'conf' | 'puff' | 'drop' | 'streak';
  x: number; y: number; vx: number; vy: number;
  life: number; max: number; size: number; color: string; rot: number; vr: number;
}

export class Particles {
  list: Particle[] = [];
  burst(x: number, y: number, colors: string[], n: number, spread = 280) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 70 + Math.random() * spread;
      this.list.push({ kind: 'conf', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, life: 0.7 + Math.random() * 0.7, max: 1.4, size: 4 + Math.random() * 7, color: colors[i % colors.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 12 });
    }
  }
  puff(x: number, y: number, n = 7, color = 'rgba(255,255,255,0.9)') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 20 + Math.random() * 60;
      this.list.push({ kind: 'puff', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 20, life: 0.5 + Math.random() * 0.3, max: 0.8, size: 8 + Math.random() * 10, color, rot: 0, vr: 0 });
    }
  }
  drops(x: number, y: number, n = 12, color = 'rgba(160,220,245,0.95)') {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 160;
      this.list.push({ kind: 'drop', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40, life: 0.35 + Math.random() * 0.25, max: 0.6, size: 3 + Math.random() * 4, color, rot: 0, vr: 0 });
    }
  }
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const p = this.list[i]; p.life -= dt;
      if (p.life <= 0) { this.list.splice(i, 1); continue; }
      if (p.kind === 'conf') p.vy += 600 * dt;
      else if (p.kind === 'drop') p.vy += 900 * dt;
      else { p.vx *= Math.pow(0.1, dt); p.vy *= Math.pow(0.1, dt); p.size += 14 * dt; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    for (const p of this.list) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.5));
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.kind === 'conf') ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
      else { ctx.beginPath(); ctx.arc(0, 0, p.size, 0, 7); ctx.fill(); }
      ctx.restore();
    }
  }
}
