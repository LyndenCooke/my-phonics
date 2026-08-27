# Create-A-Book forge: current operating contract

Read this file completely before changing or operating the forge. It contains
only current rules. Incident history is in `history/forge-lessons.md`; consult
that when diagnosing a recurrence, not as a runtime prompt.

## Product contract

- British English, Letters and Sounds, ages 4–8. Never use Read Write Inc rules.
- `PHONICS_PEDAGOGY.md` is authoritative before changing phonics data.
- Every printed custom book is saddle stitched: exactly 16 PDF pages for a
  six-story-page L1–4 book and exactly 20 for an eight-story-page book or any
  L5–8 book. Never weaken this gate.
- The title contains the hero's exact name and is decodable at the selected
  level. This is checked in code before illustration.
- Every word must be decodable at the level or an explicitly permitted tricky
  word. The hero's name is the only personal-name exemption.
- Values rules apply to every output: modest clothing with knees and shoulders
  covered, no pork, alcohol, gambling, idols or non-Islamic festivals. Do not
  default names or settings to Muslim cultures. Vary countries, cities and lives.

## Pipeline

`story → phonics QA → story editor → direction → hero → scenes → cover crop →
country/profile → whole-book editor → optional repair batch → assemble → ready`

The text gates precede every image. Once painting begins, the story is immutable.
Recovery resumes at the interrupted gate and never rewrites a painted story.

### Story

- Generate one constrained draft from a proven story shape. Never run a
  candidate tournament in production.
- Deterministic checks run before a paid judge: title/hero, page count, phonics,
  tricky words, focus sound, hero-name frequency, parent frequency, safety and
  one principal action per page.
- The demanding editor may request one bounded same-premise revision. A second
  blocking failure stops for review; it does not lower the quality bar.
- A child notices, chooses and acts. An adult may support a risky action but may
  not solve the plot for the child.
- Scene text is narration, not instructions. Avoid robotic Name–verb–object
  repetition, empty evaluation and props that exist only because they decode.

### Canonical visual identity

- `CharacterSpec` is the sole authority for the hero: age, skin, hair, exact
  outfit, footwear and immutable marks.
- The hero sheet is generated once and injected into every scene. Never make a
  second hero or cast sheet.
- Story and director output may describe the hero's action, pose and emotion but
  may not invent or replace appearance. If they conflict, `CharacterSpec` wins.
- Relatives inherit the hero's colouring. Other cast members have one fixed
  specification and one sheet each.
- Recurring plot-critical objects have one fixed identity. A distinguishing mark
  exists only when two similar objects must be told apart.
- Every human and animal has a tiny solid black filled oval eye with no white or
  catchlight. Fix eyes using the approved reference, never manual painting.

### Scenes and continuity

- Each call receives only the canonical references needed for that page, its
  compact scene brief and the relevant location/object state.
- Do not carry a growing conversation through a whole book. A response chain is
  allowed for at most two adjacent transitions in the same location when a
  mutable physical state genuinely carries forward, then it resets.
- Connection-like objects must be traceable end to end. Each end states what it
  attaches to. A floating, detached or wrongly attached end is blocking.
- The director specifies counts, contact/support, ownership, forbidden states
  and the one visible action. Schemas and deterministic validation outrank prose.

### Review and repair

- Generate all pages before judging cosmetic continuity. Per-page repaint QA is
  off in production.
- Objective catastrophic failures may stop immediately: unsafe content, missing
  or wrong hero, wrong required count, impossible anatomy or a central
  text–image contradiction.
- The director's per-page entity states are persisted as the book's state
  ledger. A "stays", "remains" or "still" transition must agree with the prior
  state before any illustration is purchased.
- The final editor reads 1024 px pages plus every sentence once. It returns a
  literal observation for every code-supplied count, contact, cropping, identity
  and story-state assertion. Missing or failed assertions become majors in code.
- Any identity, outfit, skin or hair conflict is major and blocks release.
- The editor returns one consolidated page list. At most one repair batch runs,
  one page per server invocation. There is no automatic cosmetic repair and no
  second text/repaint loop.
- The cover is cropped from a reviewed story page. Never buy a separate cover
  illustration.
- Admin reviews the real typeset PDF, never a substitute screen reader.

## Spend and concurrency contract

- Default hard cap is `MAX_BOOK_SPEND_USD`; automation never raises it.
- Before each paid provider request, atomically create a durable attempt with a
  unique operation key, maximum estimate and `X-Client-Request-Id`.
- Database uniqueness prevents the browser, sweep and retry route from buying
  the same operation twice.
- Keep these separate everywhere:
  - `confirmed_spend_usd`: completed calls with returned usage
  - `uncertain_exposure_usd`: interrupted calls which may have been billed
  - `active_reservation_usd`: calls currently in flight
- `cost_usd` and stage/model totals contain confirmed spend only. Never turn an
  estimate into actual cost or assign uncertainty to a story/image bucket.
- The cap tests confirmed + uncertain + active + the next maximum estimate.
- A returned success reconciles actual usage. A definitive unbilled error
  releases the reservation. An ambiguous timeout/process death becomes uncertain.
- Log provider request IDs. They aid tracing but are not provider idempotency;
  the application's operation key is the duplicate-spend barrier.
- A human retry increments the spend epoch. It acknowledges uncertainty without
  erasing or relabelling it.
- No top-ups, auto-recharge or limit increases may be performed or recommended.

## Persistence and recovery

- Supabase is shared production data, including local development. Never run
  `supabase db push`. Apply reviewed idempotent SQL with `supabase db query --linked`.
- Every step checkpoints its complete job. A ready book retains full job state.
- Never edit `server/forge/*.mjs` while a paid dev job is running; Vite restarts.
- Provider-credit exhaustion pauses with all finished work intact. Do not change
  image provider mid-book.
- The production sweep adopts only recent stalled customer books. It never adopts
  historical debris or a book with an unresolved paid operation.
- Repair preserves all unaffected files and regenerates only named pages.

## Acceptance criteria

A book may become `ready` only when:

1. deterministic story and phonics checks pass;
2. the story editor has no open major;
3. every required image and canonical reference exists;
4. the whole-book editor has no open major;
5. the PDF passes the exact 16/20-page gate;
6. confirmed spend is within cap and no paid operation remains active;
7. the complete resumable job remains stored.

## Verification before release

- Run forge unit/invariant tests with provider calls mocked.
- Run the production build.
- For library-book publishing, also run from `myphonics_books`:
  `py -3.12 -X utf8 scripts/audit_release.py`
- Run paid end-to-end tests only with explicit owner authority, one selected book
  and a fixed cap. Confirm no other book is generating before and after.
- Evaluate at least ten controlled books before changing cost expectations.
  Track p50/p90 confirmed spend, uncertain exposure, draft count, image calls,
  repairs, identity failures, phonics failures, PDF page count and approval rate.

## Supporting references

- Phonics rules: `../../myphonics_books/PHONICS_PEDAGOGY.md`
- Historical incidents and superseded rulings: `history/forge-lessons.md`
- Spend schema: `../../supabase/forge_spend_attempts.sql`
