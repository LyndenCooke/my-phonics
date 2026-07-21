# Image consistency audit — 2026-06-16

Swept all 33 book scene folders (`output/images/L*_B1/`) for character/eye drift,
and all 305 shared Sound Spotlight clip-art icons (`assets/photos/<sound>/<word>.jpg`)
for off-style or nonsensical images. Done with 11 parallel auditors.

## 1. Character / eye consistency — VERY GOOD

Eyes specifically held consistent in **every** book. Only two character issues:

| Book | Image | Problem | Severity |
|---|---|---|---|
| L1_2 The Mud on the Dog | page6 | Full character swap — a different child (different hair, outfit, eyes) | HIGH |
| L6_4 | page3, page8 | Mia's hair drifts loose/wavy vs her tied-back ponytail (eyes/face fine) | MED |

Everything else (31 books) consistent. Recurring side characters (mum/dad/grandparent)
and intentional outfit/emotion changes were correctly not flagged.

## 2. Sound Spotlight clip-art — SYSTEMIC issue (~90 flagged)

The flags fall into clear buckets.

### 2a. FALSE POSITIVES — leave as-is (the numeral IS the correct picture)
`s/six` (6), `t/ten` (10), `x/six` (6). The word is the number, so the numeral is correct.

### 2b. Word IS a person — human figure acceptable (optional restyle only)
`ir/girl`, `ir/sir`, `ss/boss`, `ss/miss`, `oy/boy`, `ng/king`.

### 2c. GROUP A — concrete objects, just wrong style/subject → clean regen (cheap win)
- `ore/core` — WRONG subject: drew human abs/"core muscles", should be an apple core — HIGH
- `t/tub`, `v/vest`, `w/wig`, `wr/wrist` — object fine, just on a tinted background → white
- `o_e/home` → simple house · `oo/moon` → simple moon · `e/red` → one red object

### 2d. GROUP P — "place" words drawn as scenes (regen cleaner OR swap)
`ea/beach`, `ore/shore`, `oor/moor`, `ay/bay`, `ay/day`, `d/dam`, `ar/far`, `air/fair`,
`oo/zoo`, `ee/reef`, `ear/near`, `ow/low`, `oa/road`, `th/path`, `oor/floor`.

### 2e. GROUP D — abstract / verb / adjective words → CANNOT be a clean single object, need a WORD SWAP
These came out as scenes, stray human figures, or baked-in text, and regenerating
will not help because the word itself is not picture-able as one object:

`ck/kick`, `are/share`, `are/stare`, `aw/draw`, `ch/chat`, `ch/chin`,
`cious/delicious`, `cious/gracious`, `cious/precious`, `cious/spacious`,
`able/comfortable`, `ible/incredible`, `ible/terrible`, `ible/horrible`, `ible/visible`,
`tious/ambitious`, `tious/cautious`, `tious/infectious`, `tious/nutritious`,
`tion/action`, `tion/nation`, `ff/off`, `ew/few`, `ew/new`, `g/gap`, `g/gas`, `g/gig`,
`h/hop`, `er/stern`, `ire/hire`, `ue/clue`, `ur/curl`, `ur/hurt`, `ur/surf`,
`ure/cure`, `ure/sure`, `y/yell`, `z/zen`, `zz/jazz`, `s/sad`, `ear/fear`, `ear/hear`,
`ou/loud`, `ou/out`, `ou/round`, `ou/shout`, `ous/joyous`, `ous/nervous`,
`ow/row`, `ow/show`, `oy/coy`, `oy/joy`, `qu/quit`, `qu/quiz`, `r/run`, `n/nod`,
`ore/snore`, `oor/poor`, `kn/knee`.

Baked-in text cases inside the above: `oo/zoo` ("ZOO"), `ou/out` ("out"),
`ou/round` ("Round"), `ew/few` ("few").

## Recommended fix order
1. **Eyes** (2): regenerate `L1_2 page6` and `L6_4 page3/page8` via the hero-injection
   scene pipeline (more involved than clip-art).
2. **Group A** (~8): clean single-object regen via Vertex — done in this pass.
3. **Group P + D** (~75): the systemic problem. Curate `data/spotlight_words.json`
   so each sound's spotlight only uses image-able single-object words (prefer the
   good words each sound already has; swap the unusable abstract ones). This is a
   curriculum/word-choice decision, not just an image job.
4. Re-render affected books ONCE after the clip-art set is finalised.
