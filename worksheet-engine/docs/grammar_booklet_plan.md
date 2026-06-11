# Grammar booklet: plan and handoff

This is the entry point for the L6 grammar booklet rebuild. It names the
deliverables, the pagination, and what each downstream agent does next.

## Files in this set

| File | Purpose | Consumed by |
| --- | --- | --- |
| `grammar_booklet_plan.md` | This overview and pagination | You |
| `grammar_layout_spec.md` | The definitive flowy grammar page spec (mm, pt, rules, acceptance checks) | Cowork, Claude Code |
| `grammar_issues_analysis.md` | Each of the nine issues, root cause, exact fix, file to touch | Claude Code |
| `grammar_L6_contents.md` | The seven L6 units verbatim plus front and back matter copy | Cowork |
| `grammar_level_content_template.md` | Fill-in skeleton to extend the same shape to L1 to L8 | You, Cowork |
| `grammar_schema_changes.md` | The schema v2 to v3 deltas needed to support the spec | Claude Code |

## Final pagination (13 pages)

The current render is missing the review or challenge page that the booklet
assembly rule requires. It is added here, so page numbers shift from page 11
onward.

| Page | Section |
| --- | --- |
| 1 | Cover |
| 2 | Contents |
| 3 | How this pack works |
| 4 | Four kinds of sentence (G-L6.1, tickgrid) |
| 5 | Make the noun phrase grow (G-L6.2, build) |
| 6 | Joining with and, but, or, so (G-L6.3, cloze) |
| 7 | Joining with when, if, that, because (G-L6.4, cloze) |
| 8 | Adjectives and adverbs (G-L6.5, circle) |
| 9 | Apostrophes for contractions (G-L6.6, match) |
| 10 | Keep the tense the same (G-L6.7, rewrite) |
| 11 | Show what you know (review) |
| 12 | Answers |
| 13 | Well done! (certificate) |

## Workflow handoff

1. Claude Chat (done): this plan, the spec, the issues analysis, the L6
   contents, the template and the schema note.
2. Cowork: write `grammar_L6_contents.md` into the data files
   (`src/data/grammar/l6.ts`), regenerate the booklet, render previews of all
   13 pages, run the acceptance checks in `grammar_layout_spec.md` section 8.
3. Claude Code: implement the layout and schema changes in
   `grammar_issues_analysis.md` and `grammar_schema_changes.md` against
   `FlowySheet.tsx`, `FlowyLayout.tsx`, `WriteLine`, `grammarSchema.ts` and the
   print route, then re-render.

## Two decisions you should sign off

1. Single writing-line gap token. The brief names the rewrite sheet line
   spacing as the target. I have set one token, `--write-line-gap`, used by
   every black line on every sheet (apply lines, build lines, rewrite lines,
   instruction-to-first-line). Spec default is 9 mm. If your measured value
   from the rewrite render differs, set the token to that one number and
   everything stays uniform.
2. Review page content. The review reuses sentences already approved in the
   seven units. It invents no new decodable text, in line with the
   MyPhonicsBooks rule that new book or decodable text is written only by you.
   If you want fresh review items, supply them and I will slot them in.
