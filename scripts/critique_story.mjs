#!/usr/bin/env node
// Send one book's story to GPT-5 with vision for a phonics-expert critique.
// Usage:
//   node scripts/critique_story.mjs L2_1
//
// Reads OPENAI_API_KEY from myphonics_books/.env (the canonical key store).
// Outputs the model's critique to stdout and saves to scripts/critique_output/<bookId>.md.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ── Load OPENAI_API_KEY from myphonics_books/.env ────────────────────────────
function loadKey() {
  const candidates = [
    path.join(ROOT, 'myphonics_books', '.env'),
    'C:/Users/ASUS/myphonicsbooks/myphonics_books/.env',
  ];
  for (const envPath of candidates) {
    if (!fs.existsSync(envPath)) continue;
    const txt = fs.readFileSync(envPath, 'utf8');
    const m = txt.match(/^OPENAI_API_KEY=(\S+)/m);
    if (m) return m[1];
  }
  throw new Error('OPENAI_API_KEY not found in any myphonics_books/.env');
}

// ── Parse the L{n}.{m} book pages out of the data file ───────────────────────
function loadBook(bookId) {
  // bookId like "L2_1" → level 2, sub 1
  const m = bookId.match(/^L(\d)_(\d+)$/);
  if (!m) throw new Error(`Bad book id: ${bookId} (expected like L2_1)`);
  const level = +m[1];
  const sub = +m[2];

  const dataFile = level === 1
    ? path.join(ROOT, 'src', 'lib', 'interactiveBookData.ts')
    : path.join(ROOT, 'src', 'lib', `interactiveBookDataL${level}.ts`);

  const src = fs.readFileSync(dataFile, 'utf8');

  // Find the BOOK_L{n}_{m}_PAGES block.
  const blockRe = new RegExp(
    `BOOK_L${level}_${sub}_PAGES[\\s\\S]*?\\n\\];`, 'm');
  const block = src.match(blockRe);
  if (!block) throw new Error(`Could not find BOOK_L${level}_${sub}_PAGES`);

  // Pull out cover title.
  const titleM = block[0].match(/type:\s*'cover'[^}]*title:\s*'([^']+)'/);
  const title = titleM ? titleM[1] : `Book ${bookId}`;

  // Pull out focusSounds.
  const fsM = block[0].match(/focusSounds:\s*\[([^\]]+)\]/);
  const focusSounds = fsM
    ? fsM[1].split(',').map(s => s.trim().replace(/['"]/g, '')).filter(Boolean)
    : [];

  // Pull out story pages. Match each `type: 'story'` object and its
  // sentences[] + imageUrl. Capture any `// Page N ...` comment that
  // immediately precedes it for visual context (optional).
  const pages = [];
  const pageRe = /(?:\/\/\s*Page\s*(\d+)[^\n]*\n\s*)?\{\s*type:\s*'story',\s*sentences:\s*\[([^\]]+)\][\s\S]*?imageUrl:\s*'([^']+)'/g;
  let pm;
  let auto = 0;
  while ((pm = pageRe.exec(block[0])) !== null) {
    auto++;
    const sentencesRaw = pm[2];
    let sentences = [];
    try {
      // Eval as a JS array literal — handles mixed quote types and escapes.
      sentences = new Function(`return [${sentencesRaw}]`)();
    } catch {
      sentences = [sentencesRaw.trim()];
    }
    pages.push({
      n: pm[1] ? +pm[1] : auto,
      visualNote: '',
      sentences,
      imageUrl: pm[3],
    });
  }
  if (pages.length === 0) throw new Error('No story pages parsed.');

  return { level, sub, title, focusSounds, pages };
}

// ── Load level constraints ───────────────────────────────────────────────────
function loadConstraints(level) {
  const g = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'myphonics_books', 'data', 'graphemes_by_level.json'), 'utf8'));
  const t = JSON.parse(fs.readFileSync(
    path.join(ROOT, 'myphonics_books', 'data', 'tricky_words_by_level.json'), 'utf8'));
  const lk = `level_${level}`;
  return {
    levelMeta: g[lk],
    cumulativeGraphemes: g[lk].cumulative_graphemes,
    newGraphemes: g[lk].graphemes,
    cumulativeTricky: t[lk].cumulative,
    newTricky: t[lk].new_tricky_words,
    previousLevelGraphemes: level > 1 ? g[`level_${level - 1}`].cumulative_graphemes : [],
    previousLevelTricky: level > 1 ? t[`level_${level - 1}`].cumulative : [],
  };
}

// ── Encode an image as base64 data URL ───────────────────────────────────────
function imageToDataUrl(relPath) {
  const abs = path.join(ROOT, 'public', relPath.replace(/^\//, ''));
  if (!fs.existsSync(abs)) return null;
  const b64 = fs.readFileSync(abs).toString('base64');
  return `data:image/png;base64,${b64}`;
}

// ── Build the prompt ─────────────────────────────────────────────────────────
function buildPrompt(book, c) {
  const focusList = book.focusSounds.length ? book.focusSounds.join(', ') : '(none specified)';
  const pagesBlock = book.pages.map(p =>
    `Page ${p.n} — visual: ${p.visualNote}\n  Text: ${p.sentences.map(s => `"${s}"`).join('  ')}`
  ).join('\n\n');

  return `You are a senior British phonics expert specialising in systematic synthetic phonics (Letters and Sounds / RWI tradition). You write and audit decodable readers for ages 4–8 for the MyPhonicsBooks programme.

Your job: critique the story below for phonics accuracy, level-appropriateness, narrative quality, and image-text alignment. Then propose a rewrite of any pages that need it.

## Programme rules
- British English throughout (colour, mum, favourite).
- Every word in the story must be decodable using the cumulative graphemes for this level OR be in the cumulative tricky-words list. No exceptions.
- "Decodable using cumulative graphemes" means every grapheme in the word has been taught by this level. Words also must respect word-structure rules (e.g. no initial consonant clusters before L3).
- Adding -s for plurals or verb forms is permitted at all levels (e.g. "ends", "lights", "naps"). Do not flag plural/verb -s as a cluster violation.
- "a" and "is" are tricky words available from Level 1 (treat them as always allowed).
- Stories should USE earlier levels' sounds too — not just the new ones — so children build on prior learning. A book that only uses its new graphemes feels artificial and stilted.
- Narrative must have a clear beginning/middle/end. The reader should be able to follow what is happening from the text alone — the image supports the story but the words must carry it.
- Images and text must agree. If a page shows a cat being lost and found, the words should reference the cat.

## CRITICAL — Natural English over phoneme density
A common failure mode in phonics writing is sentences that exist to drill sounds rather than to communicate. The text must sound like real spoken English that a parent would actually say to a child. If a sentence reads like a phonics exercise, it has failed — even if every word is decodable.

Before submitting any rewritten line, ask yourself: "Would a real person actually say this to a child? Does it sound like English?"

Specific bans:
- NO semicolons. Use a full stop and start a new sentence. (Children at L1–L4 are not reading semicolons.)
- NO unnatural phrasings forced by the grapheme set. e.g. "We see light up high" — nobody talks like this. "I say yay day and night" — nobody talks like this. Better to use a simpler everyday sentence even if it foregrounds fewer focus sounds.
- NO listing words just to hit grapheme coverage. The sentence must serve the story, not the syllabus.
- NO awkward subject-drops or pronoun gymnastics ("Dad can see", "I am sad" without an object) when a more natural sentence is available.
- Use simple punctuation: full stop, comma, question mark, exclamation mark. That's it.
- Prefer everyday vocabulary and contractions where they're decodable. Match how a British parent actually talks to a 4–6 year old.

If you cannot make a page sound natural with the available graphemes, say so in section 5 rather than producing forced text.

## This book
- Title: "${book.title}"
- Level: L${book.level}.${book.sub} (${c.levelMeta.name})
- Focus sounds (new this book): ${focusList}
- Sentences per page: ${c.levelMeta.sentences_per_page}
- Words per sentence: ${c.levelMeta.words_per_sentence}
- Words per book target: ${c.levelMeta.words_per_book}
- Word structure: ${c.levelMeta.word_structure}

## Cumulative graphemes available at this level (everything taught so far)
${c.cumulativeGraphemes.join(', ')}

## NEW graphemes for this level only (book should foreground these)
${c.newGraphemes.join(', ')}

## Cumulative tricky words available
${c.cumulativeTricky.join(', ')}

## Forbidden — graphemes NOT yet taught
Anything not in the cumulative list above. In particular: ${
  ['ea','a-e','i-e','o-e','u-e','oi','aw','ai','oa','ie','are','ur','er','ew','ue','ore','oor','ire','ear','ure','tion','ph','kn','wr','ous','cious','tious','able','ible']
    .filter(g => !c.cumulativeGraphemes.includes(g))
    .join(', ') || '(none)'
}

## Current story (the page images are attached in order, page 1 first)
${pagesBlock}

## Your output format
Respond in this exact structure:

### 1. Phonics audit
For each page, flag any word that is NOT decodable at this level (and explain which grapheme is the problem) OR any tricky word used that is not yet on the cumulative list. If everything is fine, say so.

### 2. Narrative critique
Does the text alone tell the story? Does it match the images? Is the emotional arc clear? Are repetition patterns working or are they padding?

### 3. Level appropriateness
Is the text reaching the level's words/sentence and words/book targets? Is it building on prior levels (using L1/L2 graphemes the child already knows) rather than only the new focus sounds?

### 4. Proposed rewrite
Page-by-page rewrite. Same number of pages. Each page should be ${c.levelMeta.sentences_per_page} sentence(s) of ${c.levelMeta.words_per_sentence} words. Use ONLY cumulative graphemes + cumulative tricky words. Match the image. Keep the title's spirit.

### 5. Notes for the human editor
Anything you weren't sure about, anything I should double-check, or judgement calls you made.`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const bookId = process.argv[2];
  if (!bookId) {
    console.error('Usage: node scripts/critique_story.mjs L2_1');
    process.exit(1);
  }

  const apiKey = loadKey();
  const book = loadBook(bookId);
  const c = loadConstraints(book.level);
  const prompt = buildPrompt(book, c);

  // Build vision message with prompt + each page image inline.
  const content = [{ type: 'text', text: prompt }];
  for (const p of book.pages) {
    const dataUrl = imageToDataUrl(p.imageUrl);
    if (!dataUrl) {
      console.error(`(skipping missing image for page ${p.n}: ${p.imageUrl})`);
      continue;
    }
    content.push({ type: 'text', text: `\n[Image for page ${p.n}]` });
    content.push({ type: 'image_url', image_url: { url: dataUrl } });
  }

  console.error(`→ Sending ${book.pages.length} pages of "${book.title}" to GPT-5…`);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5',
      messages: [{ role: 'user', content }],
    }),
    signal: AbortSignal.timeout(420000),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`API error ${res.status}:`, errText);
    process.exit(1);
  }

  const json = await res.json();
  const out = json.choices?.[0]?.message?.content ?? '(no content)';

  const outDir = path.join(__dirname, 'critique_output');
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, `${bookId}.md`);
  fs.writeFileSync(outFile, out, 'utf8');

  console.log(out);
  console.error(`\n✔ Saved to ${path.relative(ROOT, outFile)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
