// ---------------------------------------------------------------------------
// generate-clipart.mjs — fill the worksheet picture library with flat, single
// object clipart via gemini-2.5-flash-image ("Nano Banana").
//
// Auth (in priority order):
//   1. GOOGLE_GEMINI_API_KEY  — AI Studio key (env, or read from
//      ../myphonics_books/.env). Uses the generativelanguage endpoint. PREFERRED.
//   2. gcloud user OAuth token — Vertex AI endpoint (run `gcloud auth login`).
//
//   node scripts/generate-clipart.mjs            # all words below
//   node scripts/generate-clipart.mjs cat mat    # just these keys
//
// CONSISTENCY: an existing flat-style clipart (pan.png) is loaded as the STYLE
// ANCHOR and injected into every request so new art matches the owned pieces.
// ---------------------------------------------------------------------------

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const MODEL = 'gemini-2.5-flash-image';
const PROJECT = process.env.GCP_PROJECT || 'iron-entropy-496317-q9';
const LOCATION = process.env.GCP_LOCATION || 'global';

const GCLOUD =
  process.env.GCLOUD_PATH ||
  'C:\\Users\\ASUS\\AppData\\Local\\Google\\Cloud SDK\\google-cloud-sdk\\bin\\gcloud.cmd';

const OUT = path.join(process.cwd(), 'public', 'clipart');
fs.mkdirSync(OUT, { recursive: true });

// --- Auth resolution -------------------------------------------------------
// DEFAULT = Vertex (gcloud OAuth, project iron-entropy-496317-q9) because that
// is what the $300 Cloud free-trial credits flow through. The AI Studio key
// (generativelanguage endpoint) uses a SEPARATE "prepayment credits" pool that
// the free-trial credits do NOT cover — so it's opt-in via USE_API_KEY=1 only.
function readApiKey() {
  if (!process.env.USE_API_KEY) return null;
  if (process.env.GOOGLE_GEMINI_API_KEY) return process.env.GOOGLE_GEMINI_API_KEY.trim();
  const envPath = path.resolve(process.cwd(), '..', 'myphonics_books', '.env');
  if (fs.existsSync(envPath)) {
    const line = fs
      .readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find((l) => l.startsWith('GOOGLE_GEMINI_API_KEY='));
    if (line) {
      // Take only the token after '=' (ignore any inline comment / quotes).
      return line
        .slice('GOOGLE_GEMINI_API_KEY='.length)
        .trim()
        .replace(/^["']|["']$/g, '')
        .split(/\s+/)[0];
    }
  }
  return null;
}

const API_KEY = readApiKey();
const VERTEX_HOST = LOCATION === 'global' ? 'aiplatform.googleapis.com' : `${LOCATION}-aiplatform.googleapis.com`;
const URL = API_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`
  : `https://${VERTEX_HOST}/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}:generateContent`;

function authHeaders() {
  if (API_KEY) return { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' };
  const tok = execSync(`"${GCLOUD}" auth print-access-token`, { encoding: 'utf8' }).trim();
  return { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' };
}

// --- Clipart style ---------------------------------------------------------
// Two styles. LINEART=1 → black-and-white LINE ART (colouring-book look) in the
// house character style: prints clean, cheap, calm, and pairs with the worksheet
// chrome without competing with it. Default → the original flat-colour clipart.
const LINEART = !!process.env.LINEART;

const COLOUR_STYLE =
  'Simple flat educational flashcard clipart for a 5-year-old. ONE single object, ' +
  'centred, filling most of the frame. Bold clean even black outline, bright flat ' +
  'solid colours, soft rounded friendly shapes, NO gradients, NO shadow, NO 3D. ' +
  'Pure plain white background. Absolutely no text, letters, numbers, labels or ' +
  'borders. Square image. ' +
  'If the subject is an animal or creature, draw its eyes as simple solid pure-black ' +
  'round dots — small, friendly and gentle, never large, never scary, NO white ' +
  'shines or highlights, NO coloured irises. Matches the calm eye style of the ' +
  'storybook characters.';

const LINE_STYLE =
  'Black-and-white LINE-ART clipart for a children\'s worksheet — a clean ' +
  'colouring-book line drawing. ONE single subject, centred, filling most of the ' +
  'frame. Clean, even, medium-weight PURE BLACK outlines ONLY. NO colour, NO grey, ' +
  'NO shading, NO hatching, NO fills — leave the inside of every shape plain white, ' +
  'on a plain white background. Friendly, rounded, simple shapes in the warm ' +
  'MyPhonicsBooks storybook character style. Absolutely no text, letters, numbers, ' +
  'labels or borders. Square image. ' +
  'If the subject is an animal or creature, draw its eyes as simple solid pure-black ' +
  'round dots — small, friendly and gentle, never large, never scary, NO white ' +
  'shines or highlights. Matches the calm eye style of the storybook characters.';

const STYLE = LINEART ? LINE_STYLE : COLOUR_STYLE;

const COLOUR_MATCH =
  'Use the attached image ONLY as a style reference — match its line weight, flat ' +
  'colour fills, palette feel, rounded simple shapes and plain white background. ' +
  'Do NOT copy the object in the reference; draw a brand new object: ';

const LINE_MATCH =
  'Use the attached image ONLY as a style reference — match its black outline ' +
  'weight, clean line-art look, simple rounded shapes and plain white background, ' +
  'with NO colour and NO shading. Do NOT copy the object in the reference; draw a ' +
  'brand new object: ';

const STYLE_MATCH = LINEART ? LINE_MATCH : COLOUR_MATCH;

// key -> what to draw (depictable nouns from the book's decodable words)
const SUBJECTS = {
  tap: 'a single kitchen tap (faucet) with a chrome spout and one handle',
  pin: 'a single safety pin, closed, lying at a slight angle',
  pan: 'a single frying pan with one long handle, seen from a slight angle',
  ant: 'a single cute cartoon ant (insect) viewed from the side',
  tin: 'a single closed tin can',
  // Sound-pack /a/ sheet (matches public/worksheets/Sound_Pack/sound_a.pdf):
  cat: 'a single cute cartoon orange tabby cat sitting and facing forward',
  mat: 'a single rectangular floor mat / rug with simple horizontal stripes, slight angle',
  hat: 'a single blue party hat (cone shape) with yellow polka dots and a pom-pom on top',
  bag: 'a single blue gift bag with handles and a yellow star on the front',
  axe: 'a single axe with a wooden handle and a metal head',
  rat: 'a single cute cartoon grey rat with a long tail, side view',
  jam: 'a single glass jar of red jam with a red-and-white checkered lid',
  // L6 grammar booklet (line-art): nouns from the L6 books + an owl mascot.
  glue: 'a single tall bottle of school PVA glue with a pointed twist cap',
  purse: 'a single small coin purse with a round clasp at the top',
  branch: 'a single bare leafless tree branch with a few small twigs',
  owl: 'a single cute cartoon owl perched and facing forward, small round eyes, little ear tufts',
  // Grammar-booklet header mascot: child's alphabet blocks (the only place text
  // IS wanted — the three letters A B C on the block faces).
  abc: "three stacked wooden toy alphabet blocks (cubes) showing the capital letters A, B and C, one letter per block face",
  // L6 decorative objects (line art) to fill white space — varied, on-theme for
  // the four L6 books (Brown Owl, Purple Purse, New Glue, Cheeky Monkey).
  tree: 'a single simple leafy tree with a rounded bushy canopy and a short trunk',
  leaf: 'a single simple curved leaf with a central vein',
  feather: 'a single soft rounded feather',
  moon: 'a single friendly crescent moon',
  monkey: 'a single cute cartoon monkey sitting with a long curly tail, simple solid pure-black round dot eyes',
  banana: 'a single banana, slightly curved',
  coins: 'a small neat stack of three round coins',
  paintbrush: 'a single paintbrush held upright with a little paint on the tip',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callModel(parts, attempt = 0) {
  const res = await fetch(URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (res.status === 429 && attempt < 3) {
    await sleep(15000);
    return callModel(parts, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  const p = json?.candidates?.[0]?.content?.parts ?? [];
  const img = (p.find((x) => x.inlineData) || p.find((x) => x.inline_data))?.inlineData
    ?? p.find((x) => x.inline_data)?.inline_data;
  if (!img?.data) throw new Error('no image in response');
  return img.data; // base64 png
}

/** Load an existing flat-style clipart as the style anchor (so new art matches
 *  the owned pieces). Falls back to using the first generated image. */
function loadAnchor() {
  const ref = path.join(OUT, 'pan.png');
  if (fs.existsSync(ref)) return fs.readFileSync(ref).toString('base64');
  return null;
}

async function main() {
  const want = process.argv.slice(2);
  const keys = (want.length ? want : Object.keys(SUBJECTS)).filter((k) => {
    if (!SUBJECTS[k]) console.warn(`! no subject for "${k}" — skipping`);
    return SUBJECTS[k];
  });

  console.log(`${MODEL} via ${API_KEY ? 'API key (generativelanguage)' : `Vertex OAuth @ ${PROJECT}`}`);

  // Line-art mode must NOT anchor on the colour pan.png (it would drag colour
  // back in). Start anchorless; the first line-art image becomes the anchor so
  // the rest of the batch matches it.
  let anchor = LINEART ? null : loadAnchor(); // base64 style reference
  for (const key of keys) {
    const subject = SUBJECTS[key];
    const parts = anchor
      ? [
          { inlineData: { mimeType: 'image/png', data: anchor } },
          { text: `${STYLE_MATCH}${subject}. ${STYLE}` },
        ]
      : [{ text: `${STYLE} The object is: ${subject}.` }];
    try {
      const b64 = await callModel(parts);
      const file = path.join(OUT, `${key}.png`);
      fs.writeFileSync(file, Buffer.from(b64, 'base64'));
      console.log(`✓ ${key}.png (${(Buffer.from(b64, 'base64').length / 1024).toFixed(0)} KB)${anchor ? '' : '  [style anchor]'}`);
      if (!anchor) anchor = b64;
    } catch (e) {
      console.error(`✗ ${key}: ${e.message}`);
    }
    await sleep(2500);
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
