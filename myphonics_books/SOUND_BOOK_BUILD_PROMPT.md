# Sound Book Build Prompt — for Claude Code

Paste this entire prompt into Claude Code to generate all 73 Sound Books.

---

## Context

You are working on the MyPhonicsBooks project at `C:\Users\ASUS\myphonicsbooks\myphonics_books\`.

The **Curriculum Ledger** is the source of truth:
`output/worksheet_plan/CURRICULUM_LEDGER.md`

The **Sound Book inventory** (all 73 books with word lists) is in:
`output/worksheet_plan/curriculum_resource_plan.md` — Section 2

The **Jinja2 template** is at:
`templates/sound_book.html`

The **existing render pipeline** is in:
`scripts/generate_book.py` — see `render_book_html()` and `html_to_pdf()`

Two **sample data files** show the data structure:
- `data/sound_book_sh_l3.py` (single sound)
- `data/sound_book_ff_ll_l2.py` (combined sounds)

## What to build

Generate all **73 Sound Books** as PDFs. Each book is dead simple:

1. **Cover page** — level colour band, book title, sound in a circle
2. **Sound page** — "Today we are learning [sound]" with the grapheme large. At L5+ show comparison sounds (alternative spellings of the same phoneme)
3. **Word pages** (4-6 per sound) — the word at the top with sound buttons, then a **real photograph filling the rest of the page**. The photo should take up as much space as possible. No borders, no frames. Just word + photo.
4. **Read Them All page** — all words listed with tick boxes
5. **Back cover** — "Well done!" + sticker space

For combined books (ff+ll, ss+zz, v+w, x+y+z, ew+ue, wr+kn, ge+dge, mb+gn, ph+wh), each sound gets its own sound page + word pages, then they share one Read Them All page.

## Photos

Use the **Pexels API** (free, high quality, real photos) to grab images for each word.
- API: `https://api.pexels.com/v1/search?query={word}&per_page=1`
- Header: `Authorization: {PEXELS_API_KEY}`
- Use the `src.large` or `src.medium` URL from the response
- Download the image and convert to base64 data URI using the existing `image_to_data_uri()` function in `scripts/generate_book.py`
- If Pexels doesn't return a good match for a word, try a more descriptive query (e.g. "ship sailing" instead of just "ship")
- Store the API key in a `.env` file or accept it as an environment variable `PEXELS_API_KEY`

Alternative if Pexels doesn't work well: use **Unsplash API** (`https://api.unsplash.com/search/photos?query={word}&per_page=1`, header `Authorization: Client-ID {UNSPLASH_ACCESS_KEY}`).

## Data structure

For each Sound Book, create a Python data file in `data/sound_books/`. The structure is:

```python
book_type = "sound_book"
level = 3
sub_level = 1
book_number = 1

book_title = "Sound Book: sh"
level_colour = "#F59E0B"
level_name = "L3 — Special Friends"
page_count = 10  # varies by word count

comparison_sounds = []  # empty at L1-L4, populated at L5+

sounds = [
    {
        "grapheme": "sh",
        "instruction": "Say the sound: sh. Can you think of a word with this sound?",
        "words": [
            {
                "word": "ship",
                "word_html": "<span style='color:#F59E0B; font-weight:bold;'>sh</span>ip",
                "photo": None,  # will be replaced with base64 data URI at render time
                "photo_query": "ship sailing",  # Pexels search query
                "sound_buttons": ["dash", "dot", "dot"],
            },
            # ... more words
        ],
    }
]
```

### Sound buttons logic

- Single letter = `"dot"`
- Digraph (2 letters making one sound: sh, ch, th, ng, nk, qu, ck, ff, ll, ss, zz, ay, ee, ow, oo, ar, or, ir, ou, oy, ai, ea, ie, oi, aw, oa, ur, er, ew, ue, wr, kn, mb, gn, ph, wh) = `"dash"`
- Trigraph (3+ letters: igh, air, ear, ure, ire, ore, oor, a-e, i-e, o-e, u-e, dge, tion) = `"long-dash"`
- Split digraphs (a-e, i-e, o-e, u-e): the two parts are `"dot"` each with the middle letter(s) as `"dot"` too. E.g. "cake" = dot (c), long-dash (a-e), dot (k) — actually treat the whole split digraph as one unit with `"long-dash"`.

### word_html formatting

Highlight the focus grapheme in the word using the level colour:
```html
<span style='color:{level_colour}; font-weight:bold;'>{grapheme}</span>
```
The rest of the word is plain text.

## Level colours

| Level | Name | Hex |
|---|---|---|
| L1 | Ditties | #E84B8A |
| L2 | First Sounds | #F97066 |
| L3 | Special Friends | #F59E0B |
| L4 | Longer Sounds | #22C55E |
| L5 | New Spellings | #3B82F6 |
| L6 | Building Fluency | #6366F1 |
| L7 | Reading Together | #8B5CF6 |
| L8 | Reading Champion | #14B8A6 |

## The 73 Sound Books — full inventory

### L1 — Ditties (10 books)
1. s — sun, sit, sip, sad, six
2. a — ant, add, at, an
3. t — tap, tin, ten, top, tip
4. p — pin, pan, pat, pip, peg
5. i — in, it, ink
6. n — net, nap, nit, nip, nut
7. m — mat, man, map, mop, mug
8. d — dog, dig, dad, dip, den
9. g — gap, got, gas, gum
10. o — on, off, odd, ox

### L2 — First Sounds (15 books)
1. c — cat, cap, can, cot, cup
2. k — kit, kid, keg, ken, kip
3. ck — sock, duck, neck, back, kick
4. e — egg, end, elf, elm
5. u — up, us, under, umbrella
6. r — rat, rug, red, run, rip
7. h — hat, hop, hug, hen, hit
8. b — bat, bed, bus, bib, bun
9. f — fan, fit, fog, fun, fig
10. l — leg, lip, log, lot, lid
11. ff + ll — off, puff, huff, cuff / bell, doll, fill, hill, well
12. ss + zz — miss, hiss, fuss, boss / buzz, fuzz, fizz, jazz
13. j — jam, jug, jet, job, jog
14. v + w — van, vet, vest / web, win, wig, wag, wet
15. x + y + z — fox, box, mix / yak, yam, yes / zip, zap

### L3 — Special Friends (6 books)
1. sh — ship, shop, shed, shell, fish, rush
2. nk — sink, bank, pink, trunk, drink
3. ch — chip, chop, chin, chest, rich, much
4. th — thin, thick, this, that, with
5. ng — ring, song, king, long, sing
6. qu — quiz, queen, quick, quilt, squid

### L4 — Longer Sounds (12 books)
1. ay — day, play, say, stay, clay
2. ee — see, tree, feet, sleep, green
3. igh — night, light, right, sight, bright
4. ow (blow) — show, slow, grow, snow, blow
5. oo (zoo) — moon, food, cool, spoon, boot
6. oo (look) — book, cook, look, hook, foot
7. ar — car, star, park, dark, farm
8. or — for, sort, fork, horn, short
9. air — fair, hair, pair, chair, stair
10. ir — bird, girl, first, third, skirt
11. ou (out) — out, loud, round, found, shout
12. oy — boy, toy, joy, enjoy

### L5 — New Spellings (10 books) — comparison_sounds populated
1. a-e [compare: ay, ai] — cake, make, lake, space, name, race
2. i-e [compare: igh, ie] — bike, time, like, smile, white, prize
3. o-e [compare: ow, oa] — home, bone, stone, phone, rope, nose
4. u-e [compare: oo, ue, ew] — cute, huge, cube, tube, tune, rule
5. ea [compare: ee] — sea, tea, read, eat, beach, dream
6. ie [compare: igh, i-e] — pie, tie, lie, die, dried, cried
7. oi [compare: oy] — oil, coin, join, point, soil, boil
8. aw [compare: or] — saw, paw, draw, straw, claw, yawn
9. ai [compare: ay, a-e] — rain, train, wait, snail, tail, paint
10. oa [compare: ow, o-e] — boat, coat, road, load, soap, toast

### L6 — Building Fluency (9 books) — comparison_sounds populated
1. ur [compare: ir, er] — burn, turn, hurt, church, nurse, purse
2. er [compare: ir, ur] — letter, under, sister, never, river
3. are [compare: air] — care, share, stare, dare, hare, square
4. ow (brown) [compare: ou] — cow, now, how, town, down, brown
5. ew + ue [compare: oo, u-e] — new, few, chew / blue, true, glue, clue
6. wr + kn [compare: r, n] — write, wrong, wrap, wrist / know, knee, knit, knock
7. ge + dge [compare: j] — page, huge, cage, stage / bridge, badge, fudge, ledge
8. mb + gn [compare: m, n] — lamb, climb, thumb, comb / gnaw, gnat, gnome, sign
9. ph + wh [compare: f, w] — phone, photo, graph, elephant / when, where, which, while

### L7 — Reading Together (6 books)
1. ire [compare: i-e, igh] — fire, tire, wire, hire, bonfire
2. ore [compare: or, aw, oor] — more, store, score, before, shore
3. ear [compare: ee, ea] — hear, near, dear, fear, year, clear
4. oor [compare: or, ore] — door, floor, poor, moor
5. ure [compare: oo] — sure, pure, cure, mature, endure
6. tion — station, action, fiction, section, nation, fraction

### L8 — Reading Champion (5 books)
1. -ous — marvellous, dangerous, famous, enormous, jealous
2. -cious — spacious, gracious, vicious, precious, conscious
3. -tious — cautious, ambitious, nutritious, infectious, superstitious
4. -able — remarkable, comfortable, reasonable, enjoyable, valuable
5. -ible — sensible, accessible, terrible, visible, incredible

## Build steps

1. Create `data/sound_books/` directory
2. Write a generator script `scripts/generate_sound_books.py` that:
   a. Reads the inventory above
   b. For each book, fetches photos from Pexels API for each word
   c. Generates the data dict
   d. Renders the Jinja2 template with the data
   e. Converts to PDF using the existing `html_to_pdf()` pipeline
   f. Saves to `output/sound_books/L{level}/`
3. Add `book_type` check to `scripts/generate_book.py` so it selects `sound_book.html` when `book_data.get("book_type") == "sound_book"`
4. Run the generator

## Important constraints

- **British English** spelling throughout (colour, favourite, centre, etc.)
- Use the **Andika** font (same as storybooks) — the font embedding code is already in `generate_book.py`
- Photos must be **real photographs** — no illustrations, no cartoons, no AI-generated images
- The level colour should be used for the highlighted grapheme in word_html
- Sound buttons: dots for single phonemes, dashes for digraphs, long dashes for trigraphs
- All characters/people in photos should have appropriate representation — if a photo shows faces, that's fine (these are stock photos, not illustrated characters, so the small-dot-eyes rule doesn't apply)
- Page size is A5 portrait (148mm x 210mm)

## What NOT to do

- Don't modify any existing storybook files
- Don't modify the Curriculum Ledger
- Don't modify the existing book_v2.html template
- Don't generate worksheets — just Sound Books
