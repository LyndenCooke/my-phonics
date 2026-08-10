// ---------------------------------------------------------------------------
// Minimal Gemini text client: direct GOOGLE_GEMINI_API_KEY first, Vertex AI
// (gcloud OAuth, us-central1) on auth/billing failure — same fallback ladder
// as myphonics_books/scripts/generate_gemini_images.py. Any failure returns
// null: the forge always works offline via the deterministic planner.
// ---------------------------------------------------------------------------
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from '../design/tokens.mjs';

const MODEL = 'gemini-2.5-flash';
let vertexAuth = null; // { tok, proj, at }
let backend = null; // 'gemini' | 'vertex'
// Never mark the AI permanently dead: a long-lived dev server would otherwise
// stay dark AFTER the user runs `gcloud auth login`. Back off for a minute
// instead, then try the full ladder again.
let deadUntil = 0;

function geminiKey() {
  // Strict charset: the .env once had prose accidentally pasted onto the key
  // line, which silently broke auth. Only accept key-shaped characters.
  const clean = (v) => v?.match(/^[A-Za-z0-9._-]+/)?.[0] ?? null;
  if (process.env.GOOGLE_GEMINI_API_KEY) return clean(process.env.GOOGLE_GEMINI_API_KEY);
  try {
    const env = fs.readFileSync(path.join(REPO_ROOT, 'myphonics_books', '.env'), 'utf-8');
    const m = env.match(/^GOOGLE_GEMINI_API_KEY=(\S+)/m);
    return m ? clean(m[1]) : null;
  } catch { return null; }
}

function getVertexAuth() {
  // gcloud tokens last ~1h; refresh ours after 45 min.
  if (vertexAuth && Date.now() - vertexAuth.at < 45 * 60 * 1000) return vertexAuth;
  const gcloud = (args) => execFileSync('gcloud', args, { encoding: 'utf-8', shell: true, timeout: 30000 }).trim();
  const tok = gcloud(['auth', 'print-access-token']);
  const proj = gcloud(['config', 'get-value', 'project']);
  if (!tok || !proj) throw new Error('gcloud auth unavailable');
  vertexAuth = { tok, proj, at: Date.now() };
  return vertexAuth;
}

async function call(url, headers, body, timeoutMs = 45000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) { const e = new Error(`HTTP ${res.status}`); e.status = res.status; throw e; }
    return await res.json();
  } finally { clearTimeout(t); }
}

/** Ask Gemini for text. Returns the text or null (never throws).
 *  Pass `image: { b64, mime }` to include an inline image (vision).
 *  `thinking: 0` disables 2.5-flash's reasoning pass — reasoning tokens come
 *  out of maxOutputTokens, and a long prompt could burn the whole budget
 *  thinking and return TRUNCATED json. Structured picks don't need it. */
export async function geminiText(prompt, { json = false, image = null, maxTokens = 2048, thinking = null } = {}) {
  if (Date.now() < deadUntil) {
    if (process.env.FORGE_DEBUG) console.error(`[llm] skipped: backing off for ${Math.ceil((deadUntil - Date.now()) / 1000)}s`);
    return null;
  }
  const parts = [{ text: prompt }];
  if (image) parts.push({ inlineData: { mimeType: image.mime, data: image.b64 } });
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: image ? 0.2 : 0.8,
      maxOutputTokens: maxTokens,
      ...(thinking !== null ? { thinkingConfig: { thinkingBudget: thinking } } : {}),
      ...(json ? { responseMimeType: 'application/json' } : {}),
    },
  };
  const key = geminiKey();
  const gemini = key ? {
    name: 'gemini',
    url: `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    // Header auth works for both classic AIza keys and the new AQ.* keys
    // (the ?key= query param rejects AQ.* keys with a 401).
    headers: { 'x-goog-api-key': key },
  } : null;
  const vertex = { name: 'vertex', lazy: true };

  // `backend` is a PREFERENCE, not a filter. It used to exclude the other
  // provider entirely once one had worked — so when the pinned backend went
  // bad (expired gcloud token, exhausted key) a long-lived dev server stayed
  // dark until it was restarted, reporting "AI unavailable" forever. Always
  // keep both rungs on the ladder; just try the last-known-good one first.
  const attempts = backend === 'vertex'
    ? [vertex, gemini].filter(Boolean)
    : [gemini, vertex].filter(Boolean);

  for (const a of attempts) {
    try {
      let url = a.url, headers = a.headers;
      if (a.lazy) {
        const { tok, proj } = getVertexAuth();
        url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${proj}/locations/us-central1/publishers/google/models/${MODEL}:generateContent`;
        headers = { Authorization: `Bearer ${tok}` };
      }
      const out = await call(url, headers, body);
      backend = a.name;
      const text = out?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
      if (text.trim()) return text.trim();
    } catch (e) {
      // Failures here are deliberately non-fatal (the forge must work offline),
      // but silent ones are impossible to diagnose in a long-lived dev server.
      if (process.env.FORGE_DEBUG) console.error(`[llm] ${a.name} failed: ${e.status ?? ''} ${e.message}`);
      if (a.name === 'vertex' && e.status === 401 && vertexAuth) {
        // Expired token? Re-mint once and retry before moving on.
        vertexAuth = null;
        try {
          const { tok, proj } = getVertexAuth();
          const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${proj}/locations/us-central1/publishers/google/models/${MODEL}:generateContent`;
          const out = await call(url, { Authorization: `Bearer ${tok}` }, body);
          const text = out?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
          if (text.trim()) { backend = 'vertex'; return text.trim(); }
        } catch { /* fall through to the next rung */ }
      }
      continue;
    }
  }

  // Every rung failed. Back off briefly so we don't hammer a dead provider on
  // each request, and forget the preferred backend so the next attempt re-probes
  // both from scratch rather than inheriting a stale choice.
  backend = null;
  deadUntil = Date.now() + 60 * 1000;
  if (process.env.FORGE_DEBUG) console.error('[llm] all backends failed — backing off 60s');
  return null;
}

/** Ask for strict JSON; parse defensively. Returns object or null. */
export async function geminiJSON(prompt, { image = null, maxTokens = 2048, thinking = null } = {}) {
  const text = await geminiText(prompt, { json: true, image, maxTokens, thinking });
  if (!text) return null;
  const clean = text.replace(/^```(json)?/m, '').replace(/```$/m, '').trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Truncated response: close whatever strings/brackets are still open so a
    // cut-off tail costs us one field, not the whole answer.
    return salvageJSON(clean);
  }
}

function salvageJSON(s) {
  let out = s.replace(/,\s*$/, '');
  const quotes = (out.match(/(?<!\\)"/g) ?? []).length;
  if (quotes % 2) out = out.replace(/[^"]*$/, '') + '"'; // drop the partial value
  out = out.replace(/,\s*$/, '');
  const stack = [];
  let inStr = false;
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (inStr) { if (c === '\\') i++; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{' || c === '[') stack.push(c);
    else if (c === '}' || c === ']') stack.pop();
  }
  while (stack.length) out += stack.pop() === '{' ? '}' : ']';
  try { return JSON.parse(out); } catch { return null; }
}
