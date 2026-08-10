// ---------------------------------------------------------------------------
// Scene invention — the missing half of a layout remake.
//
// planFromLayout can rebuild a "look at the picture, write about it" sheet, but
// the picture slots came out empty because nothing decided WHAT the pictures
// show. This asks for a coherent SET of scenes for the sheet's own task, then
// draws them in house style (content/artgen.ensureScenes).
//
// Each scene comes with a model sentence, which the block prints upside-down at
// the foot for the grown-up — so the adult has something to prompt with without
// handing the child the answer.
// ---------------------------------------------------------------------------
import { geminiJSON } from './llm.mjs';
import { ensureScenes } from '../content/artgen.mjs';

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** Short stable hash of a scene description — the cache key MUST depend on what
 *  we asked to be drawn. Keying on the slot index instead meant a re-run reused
 *  the old picture while pairing it with a newly-invented sentence, so the model
 *  answer described a different scene from the one on the page. */
function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

/**
 * Invent `count` scenes for a sheet.
 * @returns [{ description, sentence }] — [] if the AI is unavailable.
 */
export async function inventScenes({ title, task, count = 4, subject = 'literacy' }) {
  const out = await geminiJSON(`
You are planning the pictures for a children's worksheet (ages 5-7).

The sheet is titled: "${title}"
The child's task: "${task || 'write about each picture'}"
Subject: ${subject}

Invent ${count} DIFFERENT pictures for it. They must work as a set: the same
character(s) in ${count} clearly different situations, ordered so the sheet
builds. Each must be instantly readable as a small picture and give a child
something obvious to write about.

For each picture give:
- "description": what to draw, in one sentence, concrete and visual. Name the
  characters simply ("a young boy", "his brown dog"). Describe ONLY what is
  visible — no names, no text, no words in the image. If the task is about what
  a character thinks or says, include "one large EMPTY thought bubble" so the
  child supplies the words.
- "sentence": one simple model sentence a child might write for that picture.
  6-12 words, one idea, correctly punctuated.

Return ONLY JSON: {"scenes":[{"description":string,"sentence":string}]}
`.trim(), { maxTokens: 1024, thinking: 0 });

  const scenes = Array.isArray(out?.scenes) ? out.scenes : [];
  return scenes
    .filter((s) => s && typeof s.description === 'string' && s.description.trim())
    .slice(0, count)
    .map((s) => ({
      description: s.description.trim(),
      sentence: typeof s.sentence === 'string' ? s.sentence.trim() : '',
    }));
}

/**
 * Fill every empty picture slot in a spec's illustrated_write / prompt_grid
 * blocks with freshly drawn house-style scenes. Mutates and returns the spec.
 * Degrades quietly: no AI or no art => the slots stay as empty frames, which is
 * still a usable sheet.
 */
export async function illustrateSpec(spec, { log = () => {} } = {}) {
  const targets = (spec.blocks ?? []).filter(
    (b) => (b.type === 'illustrated_write' || b.type === 'prompt_grid')
      && Array.isArray(b.items)
      && b.items.some((it) => !it?.picture),
  );
  if (!targets.length) return spec;

  for (const block of targets) {
    const count = block.items.length;
    const invented = await inventScenes({
      title: spec.title, task: block.instr ?? '', count, subject: spec.subject,
    });
    if (!invented.length) { log('no scene plan (AI unavailable) — leaving blank frames'); continue; }

    const base = slug(spec.title || 'scene');
    const wanted = invented.map((s) => ({ key: `${base}-${hash(s.description)}`, description: s.description }));
    const drawn = new Set(await ensureScenes(wanted, { log }));

    block.items = block.items.map((it, i) => {
      const w = wanted[i];
      return w && drawn.has(w.key) ? { ...it, picture: w.key } : it;
    });
    // Aligned to items, NOT compacted — the block prints each prompt against
    // its own row number, so a slot that failed to draw must leave a hole
    // rather than shift the rest.
    const answers = block.items.map((_, i) => (drawn.has(wanted[i]?.key) ? invented[i].sentence : ''));
    if (answers.some(Boolean)) block.answers = answers;
  }
  return spec;
}
