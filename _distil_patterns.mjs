// Distil the 33 published books into reusable STORY PATTERNS (Lynden
// 2026-08-21: "all 33 books should allow you stories that work... even if its
// a level 1 book it can follow a level 4 story structure but reimagine it").
// A pattern is the structure, not the words: what happens, in what order, and
// the device that makes it work for a child. One-off cost; the result is
// static data every future book reads for free.
import fs from "node:fs";
import { cfg } from "./server/forge/env.mjs";

const books = JSON.parse(fs.readFileSync("myphonics_books/data/core_story_digest.json", "utf8")).books;

const SCHEMA = {
  type: "object",
  properties: {
    patterns: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "The published book's exact title." },
          pattern_name: { type: "string", description: "Four to six words naming the STRUCTURE, not the content: 'three reveals on a journey', 'the thing that will not fit', 'wrong one, then the right one'." },
          spine: {
            type: "array",
            items: { type: "string" },
            description: "The structural beats in order, 4-8 of them, written so they could be staged anywhere: 'hero leaves home for a reason', 'a partial clue appears', 'hero guesses wrongly', not 'the fox comes out of the snow'.",
          },
          device: { type: "string", description: "The one thing that makes this book work for a young child - the repetition, the guess, the escalation, the reveal, the reassurance. One sentence." },
          slots: {
            type: "array",
            items: { type: "string" },
            description: "What a reimagining must swap out: the place, the three creatures, the object that breaks, the person waiting at home. Name them concretely, 3-6 slots.",
          },
          reimagine_hints: {
            type: "array",
            items: { type: "string" },
            description: "Three short, DIFFERENT settings this pattern would work in, each naming what fills the slots there. e.g. 'a Kenyan riverbank: three birds glimpsed by a beak, a wing, a shadow'.",
          },
          simplest_level: { type: "integer", description: "The lowest MPB level (1-8) this pattern can carry with very short sentences. Most patterns go down to 1 or 2; say so honestly." },
        },
        required: ["title", "pattern_name", "spine", "device", "slots", "reimagine_hints", "simplest_level"],
        additionalProperties: false,
      },
    },
  },
  required: ["patterns"],
  additionalProperties: false,
};

const system =
  "You are the story editor for MyPhonicsBooks, distilling the publisher's own published books into reusable STORY PATTERNS. " +
  "A pattern is the skeleton a new book can wear in a completely different place, with different characters and objects, at a different reading level - the way films retell the same handful of stories. " +
  "Write every beat so it could be staged anywhere: 'a partial clue appears and the reader guesses' NOT 'a red tail peeks out of the snow'. " +
  "Be precise about the DEVICE, because that is what a writer must preserve: the three-fold repetition, the guess before the reveal, the escalating failure, the reassurance at the end. " +
  "Levels: MPB runs 1-8, where 1 is a child's very first decodable book (one very short sentence a page) and 8 is fluent. A strong structure usually works at ANY level - only the sentence length and vocabulary change - so be generous with simplest_level and say 1 or 2 unless the pattern genuinely needs more language.";

const content =
  "Distil each of these published books into one pattern. Return all of them, in order.\n\n" +
  books.map((b, i) => `${i + 1}. "${b.title}" (level ${b.level})\n${b.pages.map((p, n) => `   ${n + 1}. ${p}`).join("\n")}`).join("\n\n");

const res = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.OPENAI_API_KEY}` },
  body: JSON.stringify({
    model: "gpt-5.6-sol",
    input: [{ role: "system", content: system }, { role: "user", content }],
    reasoning: { effort: "medium" },
    text: { format: { type: "json_schema", name: "patterns", schema: SCHEMA, strict: true } },
  }),
});
const j = await res.json();
if (!res.ok) throw new Error(`${res.status} ${JSON.stringify(j).slice(0, 400)}`);
const text = (j.output || []).flatMap((o) => o.content || []).find((c) => c.type === "output_text")?.text ?? "";
const data = JSON.parse(text);
const cost = ((j.usage?.input_tokens || 0) * 5 + (j.usage?.output_tokens || 0) * 30) / 1e6;

const byTitle = Object.fromEntries(books.map((b) => [b.title, b]));
const out = {
  _note: "Reusable story patterns distilled from the 33 published MyPhonicsBooks (Lynden 2026-08-21: 'all 33 books should allow you stories that work'). A pattern is the STRUCTURE, not the words - a Level 1 book may wear a Level 5 book's structure, with only the sentence length and vocabulary changing. Static data: costs nothing per book. Regenerate with _distil_patterns.mjs.",
  patterns: data.patterns.map((p) => ({
    ...p,
    source_level: byTitle[p.title]?.level ?? null,
    source_pages: byTitle[p.title]?.pages ?? [],
  })),
};
fs.writeFileSync("myphonics_books/data/story_patterns.json", JSON.stringify(out, null, 1));
console.log(`distilled ${out.patterns.length} patterns  $${cost.toFixed(3)}`);
for (const p of out.patterns) console.log(`  L${p.source_level} ${p.title.padEnd(30)} -> ${p.pattern_name} (works from L${p.simplest_level})`);
