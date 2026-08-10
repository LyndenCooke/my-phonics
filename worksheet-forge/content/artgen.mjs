// ---------------------------------------------------------------------------
// On-demand clipart generation — the piece that lets the forge COMPLETELY
// remake picture-led worksheets. When a sheet needs art for a word that has
// none, we generate it in the house flat-clip-art style via Vertex AI
// (gemini-2.5-flash-image, same endpoint + style rules as
// myphonics_books/scripts/regen_spotlight_vertex.py), cache it in
// worksheet-forge/artcache/ and register it in the live clipart index — so
// the art library grows with every remake.
//
// Rules honoured: solid-black-oval eyes (non-negotiable), single subject on
// pure white, no baked-in text, Vertex = sequential with backoff (never
// fan out).
// ---------------------------------------------------------------------------
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { FORGE_ROOT } from '../design/tokens.mjs';
import { clipart, NOUNS } from './content.mjs';
import { geminiJSON } from '../planner/llm.mjs';

export const ART_CACHE = path.join(FORGE_ROOT, 'artcache');
const IMG_MODEL = 'gemini-2.5-flash-image';

// House style — ported from regen_spotlight_vertex.py STYLE.
const STYLE =
  'Simple, clear educational flashcard clip-art for children aged 4-6. ' +
  'Flat cartoon style with bold black outlines and bright solid colours, on a ' +
  'plain pure-WHITE background. ONE clear simple subject, large and centred, ' +
  'immediately recognisable. Keep it minimal: a single object, plus at most ' +
  'one small prop. ' +
  'NO baked-in text, letters, words, labels or numbers anywhere in the image. ' +
  'NO busy or cluttered scene, NO several unrelated objects, NO coloured or ' +
  'patterned background, NO borders or frames, NO photographic style. ' +
  'EYES RULE (mandatory, non-negotiable): if the subject has any eyes, draw ' +
  'each eye as a single SOLID-BLACK FILLED OVAL - completely, 100% black, with ' +
  'absolutely NO white, NO white sclera, NO catchlight, NO glint, NO highlight, ' +
  'NO shine and NO coloured iris inside the eye. Just a plain black oval.';

let auth = null; // { tok, proj, at }
function vertexAuth() {
  if (auth && Date.now() - auth.at < 45 * 60 * 1000) return auth;
  const gcloud = (args) => execFileSync('gcloud', args, { encoding: 'utf-8', shell: true, timeout: 30000 }).trim();
  const tok = gcloud(['auth', 'print-access-token']);
  const proj = gcloud(['config', 'get-value', 'project']);
  if (!tok || !proj) throw new Error('gcloud auth unavailable');
  auth = { tok, proj, at: Date.now() };
  return auth;
}

// Scene style — for "write about the picture" sheets. Same house DNA as STYLE
// (flat, bold outlines, white ground, solid-black-oval eyes) but a small SCENE
// rather than one object, because the child is writing about what's happening.
const SCENE_STYLE =
  'Simple, clear educational illustration for children aged 5-7. Flat cartoon ' +
  'style with bold black outlines and bright solid colours, on a plain pure-WHITE ' +
  'background. A small, uncluttered SCENE: one or two characters doing one clear ' +
  'thing, large and centred, instantly readable at postage-stamp size. ' +
  'NO baked-in text, letters, words, labels, speech or numbers anywhere. ' +
  'If a thought bubble appears it must be COMPLETELY EMPTY — the child writes ' +
  'the words themselves. ' +
  'NO coloured or patterned background, NO borders or frames, NO photographic style. ' +
  'EYES RULE (mandatory, non-negotiable): every eye is a single SOLID-BLACK FILLED ' +
  'OVAL - 100% black, NO white sclera, NO catchlight, NO glint, NO coloured iris.';

/**
 * Generate (and cache) a SCENE by key. Unlike ensureClipart, which is keyed by a
 * noun it can draw, a scene is keyed by an id and described in full — so a
 * layout remake can fill its picture slots with our own artwork instead of
 * leaving blank frames or copying the source's drawings.
 * Never throws: returns the keys that ended up with art.
 */
export async function ensureScenes(scenes, { log = () => {} } = {}) {
  fs.mkdirSync(ART_CACHE, { recursive: true });
  const index = clipart();
  const done = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  for (const { key, description } of scenes) {
    const file = path.join(ART_CACHE, `${key}.png`);
    try {
      if (!fs.existsSync(file)) {
        log(`drawing scene "${key}"…`);
        // Vertex rate-limits image gen hard. A 429 mid-batch used to abandon
        // the rest, leaving a half-illustrated sheet — wait it out instead,
        // since the whole point is a COMPLETE set of pictures.
        let png = null;
        for (let attempt = 0; attempt < 3 && !png; attempt++) {
          try {
            png = await generateOne(description, SCENE_STYLE);
          } catch (e) {
            if (e.status !== 429 || attempt === 2) throw e;
            const wait = 20000 * (attempt + 1);
            log(`rate-limited — waiting ${wait / 1000}s`);
            await sleep(wait);
          }
        }
        fs.writeFileSync(file, png);
        await sleep(6000); // courtesy gap between images
      }
      index.set(key, file);
      done.push(key);
    } catch (e) {
      log(`scene "${key}" failed (${e.message}) — skipping`);
    }
  }
  return done;
}

async function generateOne(word, style = null) {
  const { tok, proj } = vertexAuth();
  const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${proj}/locations/us-central1/publishers/google/models/${IMG_MODEL}:generateContent`;
  const body = {
    contents: [{ role: 'user', parts: [{ text: style ? `${style}\n\nScene: ${word}` : `${STYLE}\n\nSubject: a single simple ${word}.` }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  };
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) { const e = new Error(`vertex HTTP ${res.status}`); e.status = res.status; throw e; }
    const out = await res.json();
    const part = out?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
    if (!part) throw new Error('no image in response');
    return Buffer.from(part.inlineData.data, 'base64');
  } finally { clearTimeout(t); }
}

/**
 * Make sure `words` have clipart, generating any missing ones (concrete nouns
 * only — a picture must be nameable). Sequential with a courtesy delay
 * (Vertex rate-limits hard). Never throws: returns the list of words that
 * ended up with art.
 */
export async function ensureClipart(words, { limit = 6, log = () => {} } = {}) {
  fs.mkdirSync(ART_CACHE, { recursive: true });
  const index = clipart();
  const withoutArt = [...new Set(words.map((w) => w.toLowerCase()))].filter((w) => !index.has(w));

  // Drawability gate: the curated NOUNS list is precise but narrow (it exists
  // for sentence frames). When it leaves us short, let Gemini judge which of
  // the rest name a concrete, drawable object; if the AI is dark we just fall
  // back to the narrow list.
  let imageable = withoutArt.filter((w) => NOUNS.has(w));
  if (imageable.length < limit && withoutArt.length > imageable.length) {
    const rest = withoutArt.filter((w) => !NOUNS.has(w));
    const judged = await geminiJSON(
      `Which of these words name a single concrete OBJECT or ANIMAL that a young child would instantly recognise as a simple flashcard picture (no actions, no abstract words)? Words: ${rest.join(', ')}. Return ONLY a JSON array of the qualifying words.`,
    );
    if (Array.isArray(judged)) {
      const ok = new Set(rest);
      imageable = [...imageable, ...judged.map((w) => String(w).toLowerCase()).filter((w) => ok.has(w))];
    }
  }
  const missing = imageable.slice(0, limit);

  const done = [];
  for (const w of missing) {
    const file = path.join(ART_CACHE, `${w}.png`);
    try {
      if (!fs.existsSync(file)) {
        log(`drawing "${w}"…`);
        const png = await generateOne(w);
        fs.writeFileSync(file, png);
        await new Promise((r) => setTimeout(r, 1500)); // courtesy gap — Vertex 429s on bursts
      }
      index.set(w, file);
      done.push(w);
    } catch (e) {
      log(`art for "${w}" failed (${e.message}) — skipping`);
      if (e.status === 429) break; // rate-limited: stop the whole batch, don't hammer
    }
  }
  return done;
}
