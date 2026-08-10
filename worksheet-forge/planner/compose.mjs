// ---------------------------------------------------------------------------
// Free-form composer — "build anything".
//
// The keyword intents in planner.mjs cover the 13 requests we ask for most,
// but a prompt like "cut-and-stick sorting, then write a sentence about each
// group" matches ONE of them at best and loses the rest. This module hands the
// whole block catalogue to Gemini and asks it to compose a line-up for the
// request as written.
//
// The AI chooses the LINE-UP ONLY — never a word, never a sentence, never a
// level. Every block it names is still filled by the deterministic builders
// through the decodability guard, so pedagogy cannot drift. Anything the model
// returns that isn't a real, level-legal, budget-fitting block id is dropped;
// if nothing survives we return null and the caller keeps its keyword recipe.
// ---------------------------------------------------------------------------
import { geminiJSON } from './llm.mjs';
import { CATALOG } from '../blocks/blocks.mjs';

// Blocks the planner may never be talked into using, whatever the prompt says.
const BANNED = new Set(['bingo']); // retired 2026-07-24 — self-spoiling on one sheet

function catalogueForPrompt(level) {
  return Object.entries(CATALOG)
    // Generic layouts need content from a subject engine we haven't wired to
    // the phonics prompt path yet — offering them here would plan empty panels.
    .filter(([id, c]) => !BANNED.has(id) && !c.generic && level >= c.levels[0] && level <= c.levels[1])
    .map(([id, c]) => `- ${id} (~${c.approxH}mm): ${c.desc}`)
    .join('\n');
}

export const PROMPT = ({ request, level, grapheme, suggestion, catalogue, budget }) => `
You compose A4 phonics worksheets for MyPhonicsBooks from a fixed library of
activity blocks. Choose which blocks go on ONE sheet for the request below.

REQUEST: "${request}"
The sheet is Level ${level}, target sound "${grapheme}". Both are already
decided — do not change them.

BLOCKS AVAILABLE AT THIS LEVEL (approximate height on the page):
${catalogue}

Our keyword matcher would have chosen: ${suggestion.join(' + ')}.
Keep that line-up if it already serves the request well. Change or extend it
when the request asks for something it misses.

RULES
- Use only block ids from the list above. 2 to 4 blocks.
- Total height must land near ${budget}mm and must not exceed ${budget + 25}mm.
  A half-empty sheet is a failure; so is one that overflows.
- Order them the way a child should work: recognise → read → write. Any
  writing-heavy block (dictation, sentence_unjumble, read_draw_write) goes last.
- No two blocks that do the same job (e.g. speed_read AND roll_and_read).
- If the request asks for something we have no block for, choose the closest
  blocks we do have — never invent an id.

- Also name ONE small extra block ("spare") that suits the same request. We add
  it only if the finished page has room left. It must not contradict the
  request — if they hate writing, don't name a writing block.

Reply with JSON only:
{"blocks":["id","id"],"spare":"id",
 "strand":"label for the sheet, MAX 3 WORDS, no 'and', e.g. Sound games",
 "why":"one short sentence on how this serves the request"}
`.trim();

/**
 * @returns {Promise<{blocks:string[], strand:string|null, why:string|null}|null>}
 *   null whenever the AI is unavailable or its answer doesn't survive
 *   validation — the caller then uses its deterministic keyword recipe.
 */
export async function composeRecipe(request, { level, grapheme, suggestion = [], budget = 240 } = {}) {
  const catalogue = catalogueForPrompt(level);
  if (!catalogue) return null;

  // thinking off: this is a constrained pick from a listed menu, and reasoning
  // tokens would eat the output budget and truncate the JSON.
  const out = await geminiJSON(
    PROMPT({ request, level, grapheme, suggestion, catalogue, budget }),
    { thinking: 0, maxTokens: 512 },
  );
  if (!out || !Array.isArray(out.blocks)) return null;

  // --- validation: everything the model said is a suggestion, not a fact ---
  const seen = new Set();
  const blocks = [];
  let height = 0;
  for (const raw of out.blocks) {
    if (typeof raw !== 'string') continue;
    const id = raw.trim().toLowerCase();
    const cat = CATALOG[id];
    if (!cat || BANNED.has(id) || seen.has(id)) continue;
    if (level < cat.levels[0] || level > cat.levels[1]) continue;
    // approxH is the block at its typical fill; composeBlocks trims to fit, so
    // this only has to keep the line-up in the right ballpark.
    if (height + cat.approxH > budget + 25 && blocks.length) continue;
    seen.add(id);
    blocks.push(id);
    height += cat.approxH;
  }
  if (!blocks.length) return null;

  // The strand rides in the header pill and the footer — keep it short, but cut
  // on a word boundary ("Sound sorting and writin" looked broken).
  let strand = typeof out.strand === 'string' ? out.strand.trim().replace(/[^\w '&-]/g, '') : '';
  if (strand.length > 22) strand = strand.slice(0, 22).replace(/\s+\S*$/, '');
  // ...and never leave it dangling on a conjunction ("Sh sound sorting and").
  strand = strand.replace(/\s+(and|or|the|with|for|to|&)$/i, '').trim();
  const why = typeof out.why === 'string' ? out.why.trim().slice(0, 160) : null;

  // The spare only earns its place if it's real, legal here, and not already on
  // the sheet — it's the one top-up we'll allow on a composed page.
  const spareId = typeof out.spare === 'string' ? out.spare.trim().toLowerCase() : '';
  const spareCat = CATALOG[spareId];
  const spare = spareCat && !BANNED.has(spareId) && !seen.has(spareId)
    && level >= spareCat.levels[0] && level <= spareCat.levels[1] ? spareId : null;

  return { blocks: blocks.slice(0, 4), spare, strand: strand || null, why };
}
