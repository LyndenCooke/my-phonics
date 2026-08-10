// ---------------------------------------------------------------------------
// Vision analysis for "upload a worksheet → recreate it". Gemini looks at the
// uploaded image and maps what it sees onto OUR block catalogue; the planner
// then rebuilds those activity types with our own decodable content. Nothing
// from the uploaded sheet (words, art, layout) is ever copied.
// ---------------------------------------------------------------------------
import { geminiJSON } from './llm.mjs';
import { CATALOG } from '../blocks/blocks.mjs';

/**
 * LAYOUT mode — read a sheet as STRUCTURE, not as phonics.
 *
 * The phonics analyser below asks "which of our phonics activities is this?",
 * which only works for sheets that have a phonics equivalent. A "write about
 * the picture" sheet has none, so it got mangled into the nearest phonics
 * block. This pass instead describes the page: how many sections, what shape
 * each one is, how many rows/lines/columns — and maps that onto the generic
 * layouts, which are subject-neutral by design.
 *
 * It reports the SHAPE. It never copies the source's words or artwork.
 */
export async function analyzeWorksheetLayout(b64, mime = 'image/png') {
  const prompt = `You are looking at a photo or scan of a children's worksheet.
Describe its LAYOUT so we can rebuild the same shape of sheet in our own house
style, with our own content. Do NOT transcribe the source's words or describe
its artwork for copying — we only want the structure.

Available layouts (use these exact type names):
- illustrated_write: rows of [picture][box of ruled writing lines]. Fields:
  "count" (how many rows), "linesPerItem" (ruled lines inside each box).
- prompt_grid: a grid of cards, each with a picture and/or short prompt and an
  answer line or box. Fields: "count", "perRow", "answer": "line"|"box".
- question_rows: numbered questions each with a ruled line or an answer box.
  Fields: "count", "answer": "line"|"box".
- match_columns: two columns, draw a line between the pairs. Field: "count".
- fill_table: a grid/table with some cells filled and others blank. Fields:
  "rows", "cols".
- write_lines: a plain block of ruled writing lines. Field: "count" (lines).
- check_strip: a small self-check reminder bar, usually at the foot
  ("capital letters / gaps / full stops"). Field: "labels": [string].

Also report:
- "title": the sheet's instruction/heading, REWRITTEN in your own words.
- "subject": one of "phonics", "maths", "literacy", "general".
- "stage": year group if obvious (e.g. "Year 2"), else null.
- "task": one short sentence on what the child actually does.

Report ONLY sections that are really on the page, top to bottom. Most sheets
have 1-3. Never invent a section to make the page look fuller.

Return ONLY JSON:
{"title": string, "subject": string, "stage": string|null, "task": string,
 "sections": [{"type": string, ...fields}]}`;

  return geminiJSON(prompt, { image: { b64, mime }, maxTokens: 1024, thinking: 0 });
}

export async function analyzeWorksheetImage(b64, mime = 'image/png') {
  const blockList = Object.entries(CATALOG)
    .filter(([k, v]) => k !== 'bingo' && !v.generic)
    .map(([k, v]) => `- ${k}: ${v.desc}`)
    .join('\n');

  const prompt = `You are looking at a photo or scan of a children's phonics worksheet.
Identify the activities on it and map EACH one to the CLOSEST block in this catalogue
(use the exact keys, in the order the activities appear on the page).

Report ONLY the activities that are ACTUALLY on the page — 1 block if the sheet
has one activity, 4 if it has four. Never pad the list to make a fuller sheet:
we rebuild exactly what you report, so an invented block becomes an activity the
teacher did not ask for. Many worksheets are a single activity.

CATALOGUE:

${blockList}

Also work out:
- "level": our 8-level scheme. Rough UK mapping: Letters & Sounds phase 2 / RWI set 1 ≈ level 2,
  phase 3 / set 2 ≈ level 3, phase 5 / set 3 ≈ levels 4-6, suffixes (-tion/-sion) ≈ 7-8.
  Single letters s/a/t/p ≈ level 1-2, digraphs sh/ch/th ≈ 3, vowel digraphs ay/ee/igh ≈ 4-5.
  null if you can't tell.
- "grapheme": the target sound/grapheme the sheet drills (e.g. "sh", "ay", "a-e"), null if none.
- "summary": one sentence describing the sheet's purpose.

Return ONLY JSON: {"level": number|null, "grapheme": string|null, "blocks": [string], "summary": string}`;

  return geminiJSON(prompt, { image: { b64, mime } });
}
