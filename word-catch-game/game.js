// Word Catch! - a MyPhonicsBooks 2D phonics game.
// Canvas gameplay + DOM overlays. No frameworks, no external requests.
import { STR } from "./strings.js";
import { LEVELS } from "./assets/words.js";

/* ---------------- constants ---------------- */
const W = 960, H = 540, GROUND = 468;
const STEP = 1000 / 60;
const CAT_SPEED = 470, POUNCE_VY = -640, GRAVITY = 1560;
const WORDS_PER_ROUND = 5, ROUNDS_PER_LEVEL = 4;
const SAVE_KEY = "wordcatch.progress.v1";

const HOSTS = ["mascot", "dog", "hen", "fox", "tank", "reader"];

/* ---------------- tiny seeded RNG ---------------- */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------------- assets ---------------- */
const IMG = {};
function loadImages(names) {
  return Promise.all(names.map(n => new Promise(res => {
    const im = new Image();
    im.onload = () => { IMG[n] = im; res(); };
    im.onerror = () => { IMG[n] = null; res(); };
    im.src = `./assets/img/${n}.png`;
  })));
}

/* ---------------- audio ---------------- */
const AudioMan = {
  ctx: null, master: null, musicGain: null, muted: false,
  phonemes: new Map(), musicTimer: null,
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 1;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.10;
      this.musicGain.connect(this.master);
      this.startMusic();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
    return this.ctx;
  },
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 1;
    if (m) speechSynthesis?.cancel();
  },
  tone(freq, t0, dur, type = "sine", vol = 0.25, glide = 0) {
    const ctx = this.ctx; if (!ctx) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + glide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  },
  sfx(name) {
    const ctx = this.ensure(); if (!ctx || this.muted) return;
    const t = ctx.currentTime;
    if (name === "pop") { this.tone(520, t, 0.09, "sine", 0.3, 400); this.tone(1240, t + 0.03, 0.12, "sine", 0.18); }
    if (name === "boing") { this.tone(300, t, 0.28, "triangle", 0.22, -180); }
    if (name === "click") { this.tone(700, t, 0.06, "sine", 0.15); }
    if (name === "word") { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.09, 0.22, "triangle", 0.2)); }
    if (name === "star") { [784, 988, 1175].forEach((f, i) => this.tone(f, t + i * 0.12, 0.35, "sine", 0.22)); }
    if (name === "fanfare") { [523, 523, 659, 784, 1047].forEach((f, i) => this.tone(f, t + i * 0.13, 0.3, "triangle", 0.22)); }
  },
  // gentle generative pentatonic music, glockenspiel-ish
  startMusic() {
    const ctx = this.ctx;
    const notes = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
    const rng = mulberry32(20260721);
    let bar = 0;
    const beat = 60 / 92;
    let nextAt = ctx.currentTime + 0.3;
    const schedule = () => {
      if (!this.ctx) return;
      while (nextAt < ctx.currentTime + 1.2) {
        for (let s = 0; s < 4; s++) {
          if (rng() < (s === 0 ? 0.95 : 0.55)) {
            const f = notes[(rng() * notes.length) | 0] / (rng() < 0.2 ? 2 : 1);
            const t0 = nextAt + s * (beat / 2);
            const o = ctx.createOscillator(), g = ctx.createGain();
            o.type = "triangle"; o.frequency.value = f;
            g.gain.setValueAtTime(0, t0);
            g.gain.linearRampToValueAtTime(0.5, t0 + 0.01);
            g.gain.exponentialRampToValueAtTime(0.001, t0 + beat * 0.9);
            o.connect(g); g.connect(this.musicGain);
            o.start(t0); o.stop(t0 + beat);
          }
        }
        nextAt += beat * 2; bar++;
      }
      this.musicTimer = setTimeout(schedule, 380);
    };
    schedule();
  },
  phoneme(tok) {
    if (this.muted) return;
    const fn = tok.replace(/-/g, "_");
    let a = this.phonemes.get(fn);
    if (!a) { a = new Audio(`./assets/sounds/${fn}.mp3`); this.phonemes.set(fn, a); }
    a.currentTime = 0;
    a.play().catch(() => {});
  },
  preload(tokens) { tokens.forEach(t => {
    const fn = t.replace(/-/g, "_");
    if (!this.phonemes.has(fn)) this.phonemes.set(fn, new Audio(`./assets/sounds/${fn}.mp3`));
  }); },
  speak(word) {
    if (this.muted || !("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.rate = 0.8; u.pitch = 1.05;
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => v.lang === "en-GB") || vs.find(v => v.lang.startsWith("en")) || null;
    speechSynthesis.speak(u);
  },
};

/* ---------------- progress ---------------- */
const Progress = {
  data: { stars: {} },
  load() { try { this.data = JSON.parse(localStorage.getItem(SAVE_KEY)) || { stars: {} }; } catch { this.data = { stars: {} }; } },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch {} },
  stars(w, r) { return this.data.stars[`${w}-${r}`] || 0; },
  setStars(w, r, n) {
    const k = `${w}-${r}`;
    this.data.stars[k] = Math.max(this.data.stars[k] || 0, n);
    this.save();
  },
  unlocked(w, r) {
    if (w === 1 && r === 1) return true;
    if (r > 1) return this.stars(w, r - 1) > 0;
    return this.stars(w - 1, ROUNDS_PER_LEVEL) > 0;
  },
};

/* ---------------- helpers ---------------- */
function hex(c) { return { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) }; }
function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2);
  const v = k => Math.round(a[k] + (b[k] - a[k]) * t);
  return `rgb(${v("r")},${v("g")},${v("b")})`;
}

/* ---------------- game state ---------------- */
const canvas = document.getElementById("c");
const ctx = canvas.getContext("2d");
let screen = "menu";           // menu | map | play | roundend
let paused = false;
const G = {                     // live round state
  world: 1, round: 1, level: null,
  words: [], wordIdx: 0, soundIdx: 0,
  bubbles: [], particles: [], confetti: [],
  misses: 0, score: 0, rng: Math.random,
  spawnT: 0, phase: "intro", phaseT: 0,   // intro | catch | worddone | done
  praise: "", hint: "", hintT: 0,
  cat: { x: W / 2, y: GROUND, vy: 0, air: false, face: 1, squash: 0, targetX: null },
  hostBounce: 0, t: 0,
};

/* ---------------- input ---------------- */
const BIND = {
  ArrowLeft: "left", ArrowRight: "right", KeyA: "left", KeyD: "right",
  Space: "action", ArrowUp: "action", KeyW: "action",
  KeyP: "pause", Escape: "pause", KeyM: "mute",
};
const held = new Set();
let padPounceWas = false, padPauseWas = false;
addEventListener("keydown", e => {
  const c = BIND[e.code]; if (!c) return;
  e.preventDefault();
  if (c === "pause") { if (screen === "play") togglePause(); return; }
  if (c === "mute") { AudioMan.setMuted(!AudioMan.muted); return; }
  if (c === "action" && screen === "play" && !paused) pounce();
  held.add(c);
});
addEventListener("keyup", e => { const c = BIND[e.code]; if (c) held.delete(c); });

function padCommands() {
  const out = new Set();
  for (const gp of navigator.getGamepads?.() ?? []) {
    if (!gp) continue;
    const ax = gp.axes[0] || 0;
    if (ax < -0.35 || gp.buttons[14]?.pressed) out.add("left");
    if (ax > 0.35 || gp.buttons[15]?.pressed) out.add("right");
    const p = gp.buttons[0]?.pressed;
    if (p && !padPounceWas && screen === "play" && !paused) pounce();
    padPounceWas = !!p;
    const st = gp.buttons[9]?.pressed;
    if (st && !padPauseWas && screen === "play") togglePause();
    padPauseWas = !!st;
  }
  return out;
}

// pointer: move toward x; quick tap = pounce
let pointerDown = false, pointerStart = 0, pointerMoved = 0, lastPX = 0;
function canvasPos(e) {
  const r = canvas.getBoundingClientRect();
  const p = e.touches ? e.touches[0] : e;
  return { x: (p.clientX - r.left) / r.width * W, y: (p.clientY - r.top) / r.height * H };
}
canvas.addEventListener("pointerdown", e => {
  AudioMan.ensure();
  if (screen !== "play" || paused) return;
  const p = canvasPos(e);
  if (hudHit(p)) return;
  pointerDown = true; pointerStart = performance.now(); pointerMoved = 0; lastPX = p.x;
  G.cat.targetX = p.x;
});
canvas.addEventListener("pointermove", e => {
  if (!pointerDown || screen !== "play" || paused) return;
  const p = canvasPos(e);
  pointerMoved += Math.abs(p.x - lastPX); lastPX = p.x;
  G.cat.targetX = p.x;
});
addEventListener("pointerup", () => {
  if (pointerDown && screen === "play" && !paused
      && performance.now() - pointerStart < 230 && pointerMoved < 18) pounce();
  pointerDown = false; G.cat.targetX = null;
});

/* HUD buttons on canvas (play screen) */
const HUD_BTNS = {
  listen: { x: 30, y: 18, w: 64, h: 44 },
  pause: { x: W - 150, y: 18, w: 52, h: 44 },
  mute: { x: W - 84, y: 18, w: 52, h: 44 },
};
function hudHit(p) {
  for (const [k, b] of Object.entries(HUD_BTNS)) {
    if (p.x >= b.x && p.x <= b.x + b.w && p.y >= b.y && p.y <= b.y + b.h) {
      AudioMan.sfx("click");
      if (k === "listen") speakTarget();
      if (k === "pause") togglePause();
      if (k === "mute") AudioMan.setMuted(!AudioMan.muted);
      return true;
    }
  }
  // tapping a filled tile replays its phoneme
  const tiles = tileRects();
  const word = currentWord();
  if (word) for (let i = 0; i < tiles.length; i++) {
    const t = tiles[i];
    if (i < G.soundIdx && p.x >= t.x && p.x <= t.x + t.w && p.y >= t.y && p.y <= t.y + t.h) {
      AudioMan.phoneme(word.s[i]); return true;
    }
  }
  return false;
}

/* ---------------- round flow ---------------- */
function currentWord() { return G.words[G.wordIdx] || null; }

function startRound(w, r) {
  const level = LEVELS[w - 1];
  G.world = w; G.round = r; G.level = level;
  G.words = level.rounds[r - 1];
  G.wordIdx = 0; G.soundIdx = 0; G.misses = 0; G.score = 0;
  G.bubbles = []; G.particles = []; G.confetti = [];
  G.rng = mulberry32(w * 1000 + r * 100 + (Date.now() % 97));
  G.cat.x = W / 2; G.cat.y = GROUND; G.cat.vy = 0; G.cat.air = false;
  AudioMan.preload(level.graphemes);
  showScreen("play");
  startWord();
}
function startWord() {
  G.soundIdx = 0; G.bubbles = []; G.spawnT = 0.4;
  G.phase = "intro"; G.phaseT = 1.0;
  speakTarget();
}
function speakTarget() {
  const word = currentWord();
  if (word) AudioMan.speak(word.w);
}
function wordComplete() {
  const word = currentWord();
  G.score += 10;
  G.phase = "worddone"; G.phaseT = 1.7;
  G.praise = STR.praise[(G.wordIdx + G.world) % STR.praise.length];
  G.hostBounce = 1;
  AudioMan.sfx("word");
  setTimeout(() => AudioMan.speak(word.w), 350);
  spawnConfetti();
}
function nextWord() {
  G.wordIdx++;
  if (G.wordIdx >= G.words.length) { endRound(); return; }
  startWord();
}
function endRound() {
  const stars = G.misses === 0 ? 3 : G.misses <= 3 ? 2 : 1;
  Progress.setStars(G.world, G.round, stars);
  AudioMan.sfx("fanfare");
  document.getElementById("stars").textContent = "⭐".repeat(stars) + "☆".repeat(3 - stars);
  document.getElementById("starsLabel").textContent = STR.starsEarned(stars);
  const last = G.round === ROUNDS_PER_LEVEL;
  document.getElementById("roundDoneTitle").textContent =
    last ? STR.worldDone(STR.levelLabel(G.world)) : STR.roundDone;
  document.getElementById("nextBtn").style.display =
    (last && G.world === LEVELS.length) ? "none" : "";
  showScreen("roundend");
}
function togglePause() {
  if (screen !== "play") return;
  paused = !paused;
  document.getElementById("pause").classList.toggle("show", paused);
  if (paused) speechSynthesis?.cancel();
}

/* ---------------- bubbles ---------------- */
function neededToken() {
  const w = currentWord();
  return w ? w.s[G.soundIdx] : null;
}
function spawnBubble() {
  const need = neededToken();
  if (!need) return;
  const onScreen = G.bubbles.filter(b => b.state === "fall");
  const hasNeeded = onScreen.some(b => b.tok === need);
  let tok;
  if (!hasNeeded) tok = need;
  else {
    const pool = G.level.graphemes.filter(g => g !== need && !onScreen.some(b => b.tok === g));
    tok = pool.length ? pool[(G.rng() * pool.length) | 0] : need;
  }
  const r = tok.length >= 3 ? 54 : 46;
  G.bubbles.push({
    tok, r,
    x: 80 + G.rng() * (W - 160),
    y: -60,
    vy: 52 + G.world * 5 + G.rng() * 22,
    sway: 14 + G.rng() * 12,
    phase: G.rng() * Math.PI * 2,
    state: "fall", t: 0, alpha: 1,
  });
}
function pounce() {
  const c = G.cat;
  if (!c.air) { c.vy = POUNCE_VY; c.air = true; c.squash = -0.25; AudioMan.sfx("click"); }
}
function catchBubble(b) {
  const need = neededToken();
  if (b.tok === need) {
    b.state = "pop"; b.t = 0;
    AudioMan.phoneme(b.tok);
    AudioMan.sfx("pop");
    G.score += 2;
    burst(b.x, b.y, "#FFD34D");
    G.soundIdx++;
    if (G.soundIdx >= currentWord().s.length) wordComplete();
  } else {
    b.state = "flee"; b.t = 0;
    G.misses++;
    G.hint = STR.tryHint(need); G.hintT = 2.0;
    AudioMan.sfx("boing");
    setTimeout(() => AudioMan.phoneme(need), 420);
  }
}

/* ---------------- particles ---------------- */
function burst(x, y, col) {
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    G.particles.push({ x, y, vx: Math.cos(a) * (60 + G.rng() * 120), vy: Math.sin(a) * (60 + G.rng() * 120) - 60, t: 0, life: 0.7, col });
  }
}
function spawnConfetti() {
  const cols = ["#E84B8A", "#F97066", "#F59E0B", "#22C55E", "#3B82F6", "#FFD34D"];
  for (let i = 0; i < 60; i++) {
    G.confetti.push({
      x: G.rng() * W, y: -20 - G.rng() * 120,
      vy: 130 + G.rng() * 160, vx: (G.rng() - 0.5) * 60,
      rot: G.rng() * Math.PI, vr: (G.rng() - 0.5) * 8,
      col: cols[(G.rng() * cols.length) | 0], t: 0, life: 2.2,
    });
  }
}

/* ---------------- update ---------------- */
function update(dt) {
  const d = dt / 1000;
  G.t += d;
  const cmds = new Set([...held, ...padCommands()]);
  const c = G.cat;

  // cat movement
  let dir = 0;
  if (cmds.has("left")) dir -= 1;
  if (cmds.has("right")) dir += 1;
  if (dir !== 0) { c.x += dir * CAT_SPEED * d; c.face = dir; c.targetX = null; }
  else if (c.targetX != null) {
    const dx = c.targetX - c.x;
    if (Math.abs(dx) > 6) { c.x += Math.sign(dx) * Math.min(Math.abs(dx) * 10, CAT_SPEED) * d; c.face = Math.sign(dx); }
  }
  c.x = Math.max(55, Math.min(W - 55, c.x));
  if (c.air) {
    c.vy += GRAVITY * d; c.y += c.vy * d;
    if (c.y >= GROUND) { c.y = GROUND; c.vy = 0; c.air = false; c.squash = 0.22; }
  }
  c.squash *= Math.pow(0.0018, d);
  G.hostBounce *= Math.pow(0.02, d);
  if (G.hintT > 0) G.hintT -= d;

  // phases
  if (G.phase === "intro") {
    G.phaseT -= d;
    if (G.phaseT <= 0) G.phase = "catch";
  } else if (G.phase === "worddone") {
    G.phaseT -= d;
    if (G.phaseT <= 0) nextWord();
  } else if (G.phase === "catch") {
    // spawning
    G.spawnT -= d;
    const maxB = 4 + Math.min(2, (G.world / 3) | 0);
    if (G.spawnT <= 0 && G.bubbles.filter(b => b.state === "fall").length < maxB) {
      spawnBubble();
      G.spawnT = 0.75 + G.rng() * 0.5;
    }
    // bubbles
    for (const b of G.bubbles) {
      b.t += d;
      if (b.state === "fall") {
        b.y += b.vy * d;
        b.x += Math.sin(G.t * 1.4 + b.phase) * b.sway * d;
        b.x = Math.max(50, Math.min(W - 50, b.x));
        // catch check (generous, player-favoring)
        const cx = c.x, cy = c.y - 62;
        const dist = Math.hypot(b.x - cx, b.y - cy);
        if (dist < b.r + 46) { catchBubble(b); continue; }
        if (b.y > GROUND - b.r * 0.3) { b.state = "ground"; b.t = 0; }
      } else if (b.state === "flee") {
        b.y -= 220 * d; b.x += Math.sin(b.t * 10) * 60 * d; b.alpha = Math.max(0, 1 - b.t / 0.7);
      } else { // pop / ground fade
        b.alpha = Math.max(0, 1 - b.t / 0.35);
      }
    }
    G.bubbles = G.bubbles.filter(b => b.alpha > 0 && b.y > -100);
  }

  // particles + confetti
  for (const p of G.particles) { p.t += d; p.x += p.vx * d; p.y += p.vy * d; p.vy += 500 * d; }
  G.particles = G.particles.filter(p => p.t < p.life);
  for (const f of G.confetti) { f.t += d; f.x += f.vx * d; f.y += f.vy * d; f.rot += f.vr * d; }
  G.confetti = G.confetti.filter(f => f.t < f.life && f.y < H + 30);
}

/* ---------------- render ---------------- */
function tileRects() {
  const word = currentWord();
  if (!word) return [];
  const n = word.s.length;
  const tw = 74, gap = 10;
  const total = n * tw + (n - 1) * gap;
  const x0 = (W - total) / 2;
  return word.s.map((_, i) => ({ x: x0 + i * (tw + gap), y: 76, w: tw, h: 64 }));
}

function drawBackground() {
  const col = G.level.colour;
  const sky1 = mix(col, "#FFFFFF", 0.82), sky2 = mix(col, "#FFFFFF", 0.6);
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, sky1); grad.addColorStop(1, sky2);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
  // sun
  ctx.fillStyle = "rgba(255,225,130,.9)";
  ctx.beginPath(); ctx.arc(96, 84, 34, 0, 7); ctx.fill();
  // clouds
  ctx.fillStyle = "rgba(255,255,255,.85)";
  for (const [cx, cy, s] of [[240, 90, 1], [560, 60, 0.8], [820, 110, 1.1]]) {
    const drift = (G.t * 6 * s) % (W + 260) - 130;
    const x = (cx + drift) % (W + 260) - 60;
    ctx.beginPath();
    ctx.arc(x, cy, 26 * s, 0, 7); ctx.arc(x + 26 * s, cy - 12 * s, 20 * s, 0, 7); ctx.arc(x + 52 * s, cy, 24 * s, 0, 7);
    ctx.fill();
  }
  // hills
  ctx.fillStyle = mix(col, "#A9E7A0", 0.78);
  ctx.beginPath(); ctx.ellipse(180, GROUND + 70, 380, 130, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = mix(col, "#8BDC86", 0.62);
  ctx.beginPath(); ctx.ellipse(760, GROUND + 80, 420, 150, 0, Math.PI, 0); ctx.fill();
  // floor: cream boards with level-colour rug stripes (like the book rug)
  ctx.fillStyle = "#FFF3DF";
  ctx.fillRect(0, GROUND + 6, W, H - GROUND);
  ctx.fillStyle = mix(col, "#FFFFFF", 0.35);
  for (let x = -20; x < W; x += 64) {
    ctx.save(); ctx.translate(x, GROUND + 6); ctx.transform(1, 0, -0.35, 1, 0, 0);
    ctx.fillRect(0, 0, 26, H - GROUND); ctx.restore();
  }
  ctx.fillStyle = mix(col, "#000000", 0.15);
  ctx.fillRect(0, GROUND + 2, W, 6);
  // host character, bottom right
  const host = IMG[HOSTS[G.world - 1]];
  if (host) {
    const hh = 130 + G.hostBounce * -18;
    const hw = host.width / host.height * hh;
    ctx.drawImage(host, W - hw - 18, GROUND + 32 - hh, hw, hh);
  }
}

function drawBubbles() {
  const need = neededToken();
  for (const b of G.bubbles) {
    ctx.save();
    ctx.globalAlpha = b.alpha;
    const wob = 1 + Math.sin(G.t * 3 + b.phase) * 0.03;
    ctx.translate(b.x, b.y); ctx.scale(wob, 2 - wob);
    const g = ctx.createRadialGradient(-b.r * 0.3, -b.r * 0.35, b.r * 0.2, 0, 0, b.r);
    g.addColorStop(0, "rgba(255,255,255,.95)");
    g.addColorStop(1, "rgba(255,255,255,.55)");
    ctx.fillStyle = g;
    ctx.strokeStyle = b.tok === need ? "#E84B8A" : "rgba(200,160,180,.8)";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, b.r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#58212F";
    ctx.font = `700 ${b.tok.length >= 3 ? 30 : 36}px Andika, sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(b.tok, 0, 2);
    ctx.restore();
  }
}

function drawCat() {
  const c = G.cat, im = IMG.cat;
  if (!im) return;
  const h = 118, w = im.width / im.height * h;
  const sq = c.squash;
  ctx.save();
  ctx.translate(c.x, c.y);
  // shadow
  ctx.fillStyle = "rgba(88,33,47,.18)";
  const airLift = (GROUND - c.y) / 3;
  ctx.beginPath(); ctx.ellipse(0, 6, Math.max(24, w * 0.42 - airLift), 9, 0, 0, 7); ctx.fill();
  ctx.scale((1 + sq) * (c.face < 0 ? -1 : 1), 1 - sq);
  const tilt = c.air ? Math.max(-0.22, Math.min(0.22, c.vy / 2600)) : 0;
  ctx.rotate(tilt);
  ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
}

function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHUD() {
  const word = currentWord();
  // top banner strip (brand pink, like the book covers)
  ctx.fillStyle = "rgba(232,75,138,.95)";
  ctx.fillRect(0, 0, W, 56);
  ctx.fillStyle = "#fff";
  ctx.font = "700 17px Andika, sans-serif";
  ctx.textAlign = "left"; ctx.textBaseline = "middle";
  ctx.fillText(`${STR.levelLabel(G.world)} · ${G.level.name}`, 108, 28);
  ctx.textAlign = "right";
  ctx.fillText(`${STR.score}: ${G.score}`, W - 170, 28);
  ctx.fillText(STR.wordOf(Math.min(G.wordIdx + 1, G.words.length), G.words.length), W - 300, 28);
  // buttons
  for (const [k, b] of Object.entries(HUD_BTNS)) {
    ctx.fillStyle = "#fff";
    rr(b.x, b.y, b.w, b.h, 12); ctx.fill();
    ctx.font = "22px Andika, sans-serif"; ctx.textAlign = "center";
    ctx.fillStyle = "#E84B8A";
    const icon = k === "listen" ? "🔊" : k === "pause" ? "⏸" : (AudioMan.muted ? "🔇" : "🔉");
    ctx.fillText(icon, b.x + b.w / 2, b.y + b.h / 2 + 1);
  }
  if (!word) return;
  // word tiles
  const tiles = tileRects();
  const pulse = 1 + Math.sin(G.t * 5) * 0.05;
  tiles.forEach((t, i) => {
    const filled = i < G.soundIdx;
    const isNext = i === G.soundIdx && G.phase === "catch";
    ctx.save();
    if (isNext) { ctx.translate(t.x + t.w / 2, t.y + t.h / 2); ctx.scale(pulse, pulse); ctx.translate(-t.x - t.w / 2, -t.y - t.h / 2); }
    ctx.fillStyle = filled ? "#FFE9F2" : "rgba(255,255,255,.85)";
    rr(t.x, t.y, t.w, t.h, 12); ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = filled ? "#E84B8A" : isNext ? "#E84B8A" : "#D9C6B0";
    if (!filled && !isNext) ctx.setLineDash([7, 6]);
    rr(t.x, t.y, t.w, t.h, 12); ctx.stroke();
    ctx.setLineDash([]);
    if (filled) {
      ctx.fillStyle = "#58212F";
      ctx.font = "700 32px Andika, sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(word.s[i], t.x + t.w / 2, t.y + t.h / 2 + 2);
    }
    // sound-button dot (like the books)
    ctx.fillStyle = filled ? "#E84B8A" : "#D9C6B0";
    ctx.beginPath(); ctx.arc(t.x + t.w / 2, t.y + t.h + 10, 4, 0, 7); ctx.fill();
    ctx.restore();
  });
  // completed word / praise banner
  if (G.phase === "worddone") {
    ctx.fillStyle = "rgba(255,248,238,.96)";
    rr(W / 2 - 220, 220, 440, 130, 22); ctx.fill();
    ctx.strokeStyle = "#E84B8A"; ctx.lineWidth = 4;
    rr(W / 2 - 220, 220, 440, 130, 22); ctx.stroke();
    ctx.fillStyle = "#E84B8A";
    ctx.font = "700 30px Andika, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(G.praise, W / 2, 262);
    ctx.fillStyle = "#58212F";
    ctx.font = "700 44px Andika, sans-serif";
    ctx.fillText(word.w, W / 2, 314);
  }
  // intro cue
  if (G.phase === "intro") {
    ctx.fillStyle = "rgba(88,33,47,.75)";
    ctx.font = "700 24px Andika, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(`${STR.listen}: "${word.w}"`, W / 2, 180);
  }
  // hint toast
  if (G.hintT > 0 && G.phase === "catch") {
    ctx.globalAlpha = Math.min(1, G.hintT);
    ctx.fillStyle = "#FFF3DF";
    rr(W / 2 - 170, 156, 340, 46, 999); ctx.fill();
    ctx.strokeStyle = "#F59E0B"; ctx.lineWidth = 3;
    rr(W / 2 - 170, 156, 340, 46, 999); ctx.stroke();
    ctx.fillStyle = "#8a5a12";
    ctx.font = "700 20px Andika, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(G.hint, W / 2, 180);
    ctx.globalAlpha = 1;
  }
}

function drawParticles() {
  for (const p of G.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.col;
    ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 7); ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of G.confetti) {
    ctx.save();
    ctx.translate(f.x, f.y); ctx.rotate(f.rot);
    ctx.globalAlpha = Math.min(1, (f.life - f.t));
    ctx.fillStyle = f.col;
    ctx.fillRect(-6, -3, 12, 6);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function render() {
  ctx.clearRect(0, 0, W, H);
  if (screen !== "play" && screen !== "roundend") return;
  drawBackground();
  drawBubbles();
  drawCat();
  drawParticles();
  drawHUD();
}

/* ---------------- screens / DOM ---------------- */
function showScreen(s) {
  screen = s;
  paused = false;
  for (const id of ["menu", "map", "roundEnd", "pause"]) {
    document.getElementById(id).classList.remove("show");
  }
  if (s === "menu") document.getElementById("menu").classList.add("show");
  if (s === "map") { buildMap(); document.getElementById("map").classList.add("show"); }
  if (s === "roundend") document.getElementById("roundEnd").classList.add("show");
}

function buildMap() {
  const wrap = document.getElementById("worlds");
  wrap.innerHTML = "";
  const lockmsg = document.getElementById("lockmsg");
  lockmsg.textContent = "";
  LEVELS.forEach((lv, i) => {
    const w = i + 1;
    const card = document.createElement("div");
    card.className = "world";
    card.style.setProperty("--wc", lv.colour);
    const img = HOSTS[i];
    card.innerHTML = `<span class="tag">${STR.levelLabel(w)}</span><h3>${lv.name}</h3>
      <img src="./assets/img/${img}.png" alt="">`;
    const rounds = document.createElement("div");
    rounds.className = "rounds";
    let nextMarked = false;
    for (let r = 1; r <= ROUNDS_PER_LEVEL; r++) {
      const b = document.createElement("button");
      b.className = "round-btn";
      const st = Progress.stars(w, r);
      const unlocked = Progress.unlocked(w, r);
      b.innerHTML = `${STR.roundLabel(r)}<span class="st">${st ? "★".repeat(st) : (unlocked ? "···" : "🔒")}</span>`;
      b.disabled = !unlocked;
      if (unlocked && !st && !nextMarked) { b.classList.add("next"); nextMarked = true; }
      b.onclick = () => { AudioMan.ensure(); AudioMan.sfx("click"); startRound(w, r); };
      if (!unlocked) {
        b.disabled = true;
        b.onclick = null;
      }
      rounds.appendChild(b);
    }
    card.appendChild(rounds);
    if (!Progress.unlocked(w, 1)) {
      card.style.opacity = ".55";
      card.onclick = () => { lockmsg.textContent = STR.levelLocked(w - 1); };
    }
    wrap.appendChild(card);
  });
}

/* ---------------- boot ---------------- */
function wireDom() {
  document.getElementById("menuTitle").textContent = STR.gameTitle;
  document.getElementById("menuSub").textContent = STR.subtitle;
  document.getElementById("playBtn").textContent = STR.play;
  document.getElementById("menuHint").textContent = STR.grownUps;
  document.getElementById("menuVer").textContent = STR.version;
  document.getElementById("mapTitle").textContent = STR.chooseLevel;
  document.getElementById("mapBack").textContent = "← " + STR.back;
  document.getElementById("nextBtn").textContent = STR.nextRound;
  document.getElementById("endMapBtn").textContent = STR.levelMap;
  document.getElementById("pauseTitle").textContent = STR.paused;
  document.getElementById("pauseCtrl").textContent = STR.controlsHint;
  document.getElementById("resumeBtn").textContent = STR.backToGame;
  document.getElementById("pauseMapBtn").textContent = STR.levelMap;
  document.getElementById("rotate").textContent = STR.rotateHint;
  document.getElementById("playBtn").onclick = () => { AudioMan.ensure(); AudioMan.sfx("click"); showScreen("map"); };
  document.getElementById("mapBack").onclick = () => { AudioMan.sfx("click"); showScreen("menu"); };
  document.getElementById("nextBtn").onclick = () => {
    AudioMan.sfx("click");
    const nr = G.round < ROUNDS_PER_LEVEL ? G.round + 1 : 1;
    const nw = G.round < ROUNDS_PER_LEVEL ? G.world : G.world + 1;
    if (nw > LEVELS.length) { showScreen("map"); return; }
    startRound(nw, nr);
  };
  document.getElementById("endMapBtn").onclick = () => { AudioMan.sfx("click"); showScreen("map"); };
  document.getElementById("resumeBtn").onclick = () => togglePause();
  document.getElementById("pauseMapBtn").onclick = () => { togglePause(); showScreen("map"); };
}

function fitStage() {
  const frame = document.getElementById("frame");
  const s = Math.min(innerWidth / W, innerHeight / H);
  frame.style.width = W + "px"; frame.style.height = H + "px";
  frame.style.transform = `scale(${s})`;
  frame.style.transformOrigin = "center center";
}
addEventListener("resize", fitStage);
addEventListener("orientationchange", fitStage);

// canvas backing store for crispness
function setupCanvas() {
  const q = Math.min(2, devicePixelRatio || 1);
  canvas.width = W * q; canvas.height = H * q;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(q, 0, 0, q, 0, 0);
}

/* main loop */
let acc = 0, last = performance.now(), frames = 0, fpsAt = last;
const dev = new URLSearchParams(location.search).has("dev");
if (dev) {
  document.getElementById("dev").style.display = "block";
  window.__WC = { G, startRound, Progress, currentWord, showScreen };
}
addEventListener("blur", () => { if (screen === "play" && !paused) togglePause(); });

function frameLoop(now) {
  requestAnimationFrame(frameLoop);
  acc += now - last; last = now;
  if (acc > 250) acc = 250;
  if (screen === "play" && !paused) {
    while (acc >= STEP) { update(STEP); acc -= STEP; }
  } else acc = 0;
  render();
  if (dev) {
    frames++;
    if (now - fpsAt >= 500) {
      document.getElementById("dev").textContent =
        `${Math.round(frames * 1000 / (now - fpsAt))} fps | bubbles ${G.bubbles.length}`;
      frames = 0; fpsAt = now;
    }
  }
}

Progress.load();
wireDom();
fitStage();
setupCanvas();
if ("speechSynthesis" in window) speechSynthesis.getVoices();
loadImages(["cat", "logo", ...HOSTS]).then(() => requestAnimationFrame(frameLoop));
