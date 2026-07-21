"""
Blend Books — final content (post-OpenAI senior-literacy consult).

Pre-L1 RWI Sound Blending Book equivalent: 4 mini-books, A6 finished,
8 physical pages each (cover + 6 content + back cover).

Cumulative grapheme progression strictly within new Ledger v2.0 L1 set:
  Book 1: s, a, t
  Book 2: + p, i, n     (full SATPIN)
  Book 3: + m, d
  Book 4: + g, o        (full L1 set)

Tricky words allowed: 'I', 'the' only.

── L2-L5 extension (books 5-12, added 2026-07-07) ─────────────────────
The curriculum_resource_plan.md inventory calls for 12 Blending Books
across L1-L5. L1 shipped with 4 (not the planned 2), so the remaining 8
are split L2×3, L3×2, L4×2, L5×1 — the plan's per-level content
groupings (its books 3-12) compressed to keep the 12-book total. Every
word is decodable at its level per CURRICULUM_LEDGER.md, checked
grapheme by grapheme. NO new art: every check-page/cover image reuses
the existing Sound Spotlight library (assets/photos/<grapheme>/<word>.jpg)
via each page's "image_file". Books 5-12 carry:
  level / level_colour     — ledger level + banner colour
  cumulative_graphemes     — the sounds actually used in this book
                             (full cumulative sets are 30-50 GPCs by L4,
                             far too many for the chips/sounds grid)
  pages[].image_file       — repo-relative path to the reused art
  pages[].split            — split digraph (e.g. "a-e"): the blend page
                             shows the whole word with the split letters
                             coloured (no segment dots — you cannot
                             honestly dot a discontinuous grapheme)
"""

LEVEL_COLOUR = "#E84B8A"  # L1 Pink (books 1-4, kept for back-compat)

LEVEL_COLOURS = {
    "L1": "#E84B8A",
    "L2": "#F97066",
    "L3": "#F59E0B",
    "L4": "#22C55E",
    "L5": "#3B82F6",
}

BLEND_BOOKS = {
    "Blend_1": {
        "book_number": 1,
        "title": "Sat!",
        "subtitle": "First Blends",
        "focus_graphemes_new": ["s", "a", "t"],
        "cumulative_graphemes": ["s", "a", "t"],
        "cover_prompt": "A happy small child sitting cross-legged on the floor, smiling proudly at the viewer, hands resting on knees, plain pale background, soft cartoon illustration, child-friendly, no text",
        "pages": [
            {"word": "a",     "image_prompt": "A single bright red apple on a plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "sat",   "image_prompt": "A cheerful child sitting cross-legged on a wooden floor, gentle smile, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "as",    "image_prompt": "A child wearing a simple superhero cape, standing tall, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "sat",   "image_prompt": "A small child sitting on a green mat on the floor, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "I sat", "image_prompt": "A happy child sitting cross-legged smiling at the viewer, hands on knees, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Sat!",  "image_prompt": "A triumphant small child standing up after sitting, arms raised, joyful expression, plain background, soft cartoon illustration, child-friendly, no text"},
        ],
    },
    "Blend_2": {
        "book_number": 2,
        "title": "I Sip, I Tap",
        "subtitle": "SATPIN",
        "focus_graphemes_new": ["p", "i", "n"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n"],
        "pages": [
            {"word": "I sit.", "image_prompt": "A child sitting on the floor cross-legged, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "I tap.", "image_prompt": "A child tapping a wooden desk with one finger, small motion arcs around the finger, plain background, soft cartoon illustration, child-friendly, no text. CRITICAL: NEVER draw a water tap — 'tap' here means the ACTION of tapping"},
            {"word": "I sip.", "image_prompt": "A child sipping from a small cup, eyes closed contentedly, plain background, soft cartoon illustration, child-friendly, no text"},
            {"word": "A pin.", "image_prompt": "A single shiny silver safety pin lying on a plain pale background, soft cartoon illustration, no text"},
            {"word": "A pan.", "image_prompt": "A single small black frying pan with a long handle, viewed from above, plain pale background, soft cartoon illustration, no text"},
            {"word": "I nap.", "image_prompt": "A child curled up sleeping under a soft yellow blanket on the floor, eyes shut peacefully, plain background, soft cartoon illustration, child-friendly, no text"},
        ],
    },
    "Blend_3": {
        "book_number": 3,
        "title": "Mum and Dad",
        "subtitle": "+ m, d",
        "focus_graphemes_new": ["m", "d"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n", "m", "d"],
        "pages": [
            {"word": "I am Pat.",   "image_prompt": "A young child smiling at the viewer, friendly bright eyes, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Pat is sad.", "image_prompt": "The same young child looking sad, downturned mouth, small tear, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Dad sat.",    "image_prompt": "A friendly adult man sitting on a simple wooden chair, gentle expression, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Mum sat.",    "image_prompt": "A friendly adult woman sitting on a simple wooden chair next to the man, warm expression, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Dad is mad.", "image_prompt": "The adult man with a comical mock-cross face, eyebrows raised, hands on hips, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "I am mad!",   "image_prompt": "The young child Pat pulling a playful mock-cross face like the man, hands on hips, plain pale background, soft cartoon illustration, child-friendly, no text"},
        ],
    },
    "Blend_4": {
        "book_number": 4,
        "title": "The Dog and the Pot",
        "subtitle": "+ g, o",
        "focus_graphemes_new": ["g", "o"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n", "m", "d", "g", "o"],
        "pages": [
            {"word": "The dog.",       "image_prompt": "A happy small brown dog sitting on the floor, tongue out, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "A pot.",         "image_prompt": "A single black cooking pot with two handles on a plain kitchen floor, plain pale background, soft cartoon illustration, no text"},
            {"word": "The dog sat.",   "image_prompt": "The small brown dog sitting next to the black cooking pot on the floor, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "I got the pot.", "image_prompt": "A young child lifting the black cooking pot off the floor with both hands, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "Mum got a pot.", "image_prompt": "A friendly adult woman holding a black cooking pot, smiling, plain pale background, soft cartoon illustration, child-friendly, no text"},
            {"word": "The dog is on.", "image_prompt": "The small brown dog comically sitting ON TOP of the upturned black cooking pot, happy expression, plain pale background, soft cartoon illustration, child-friendly, no text"},
        ],
    },
    # ── L2 (Coral) — plan books 3-5: remaining singles + ck + doubles ──
    "Blend_5": {
        "book_number": 5,
        "level": "L2",
        "title": "Cup and Duck",
        "subtitle": "+ c, k, ck, e, u, r, h, b",
        "focus_graphemes_new": ["c", "k", "ck", "e", "u", "r", "h", "b"],
        "cumulative_graphemes": ["c", "k", "ck", "e", "u", "r", "h", "b",
                                 "p", "i", "n", "d", "g"],
        "cover_image_file": "assets/photos/ck/duck.jpg",
        "pages": [
            {"word": "cup",  "image_file": "assets/photos/c/cup.jpg"},
            {"word": "kid",  "image_file": "assets/photos/k/kid.jpg"},
            {"word": "duck", "image_file": "assets/photos/ck/duck.jpg"},
            {"word": "hen",  "image_file": "assets/photos/h/hen.jpg"},
            {"word": "rug",  "image_file": "assets/photos/r/rug.jpg"},
            {"word": "bed",  "image_file": "assets/photos/b/bed.jpg"},
        ],
    },
    "Blend_6": {
        "book_number": 6,
        "level": "L2",
        "title": "Jam in the Jug",
        "subtitle": "+ f, l, j, v, w",
        "focus_graphemes_new": ["f", "l", "j", "v", "w"],
        "cumulative_graphemes": ["f", "l", "j", "v", "w",
                                 "a", "n", "o", "g", "m", "e", "b", "u"],
        "cover_image_file": "assets/photos/v/van.jpg",
        "pages": [
            {"word": "fan", "image_file": "assets/photos/f/fan.jpg"},
            {"word": "log", "image_file": "assets/photos/l/log.jpg"},
            {"word": "jam", "image_file": "assets/photos/j/jam.jpg"},
            {"word": "van", "image_file": "assets/photos/v/van.jpg"},
            {"word": "web", "image_file": "assets/photos/w/web.jpg"},
            {"word": "jug", "image_file": "assets/photos/j/jug.jpg"},
        ],
    },
    "Blend_7": {
        "book_number": 7,
        "level": "L2",
        "title": "Puff and Hiss",
        "subtitle": "+ x, y, z, ff, ll, ss",
        "focus_graphemes_new": ["x", "y", "z", "ff", "ll", "ss"],
        "cumulative_graphemes": ["x", "y", "z", "ff", "ll", "ss",
                                 "f", "o", "a", "k", "i", "p", "u", "b", "e", "h"],
        "cover_image_file": "assets/photos/x/fox.jpg",
        "pages": [
            {"word": "fox",  "image_file": "assets/photos/x/fox.jpg"},
            {"word": "yak",  "image_file": "assets/photos/y/yak.jpg"},
            {"word": "zip",  "image_file": "assets/photos/z/zip.jpg"},
            {"word": "puff", "image_file": "assets/photos/ff/puff.jpg"},
            {"word": "bell", "image_file": "assets/photos/ll/bell.jpg"},
            {"word": "hiss", "image_file": "assets/photos/ss/hiss.jpg"},
        ],
    },
    # ── L3 (Amber) — plan books 6-7: special friends + ng/nk/qu/zz ──
    "Blend_8": {
        "book_number": 8,
        "level": "L3",
        "title": "The Thin Fish",
        "subtitle": "Special friends: sh, ch, th",
        "focus_graphemes_new": ["sh", "ch", "th"],
        "cumulative_graphemes": ["sh", "ch", "th",
                                 "i", "p", "o", "n", "f", "m"],
        "cover_image_file": "assets/photos/sh/fish.jpg",
        "pages": [
            {"word": "ship", "image_file": "assets/photos/sh/ship.jpg"},
            {"word": "chop", "image_file": "assets/photos/ch/chop.jpg"},
            {"word": "thin", "image_file": "assets/photos/th/thin.jpg"},
            {"word": "fish", "image_file": "assets/photos/sh/fish.jpg"},
            {"word": "moth", "image_file": "assets/photos/th/moth.jpg"},
            {"word": "chin", "image_file": "assets/photos/ch/chin.jpg"},
        ],
    },
    "Blend_9": {
        "book_number": 9,
        "level": "L3",
        "title": "Buzz! Ring! Quiz!",
        "subtitle": "+ ng, nk, qu, zz",
        "focus_graphemes_new": ["ng", "nk", "qu", "zz"],
        # "frog" has no new grapheme — it is the ledger's required Phase 4
        # adjacent-consonant (CCVC) blending practice at L3.
        "cumulative_graphemes": ["ng", "nk", "qu", "zz",
                                 "r", "i", "t", "a", "z", "b", "u", "f", "o", "g", "k"],
        "cover_image_file": "assets/photos/ng/king.jpg",
        "pages": [
            {"word": "ring", "image_file": "assets/photos/ng/ring.jpg"},
            {"word": "tank", "image_file": "assets/photos/nk/tank.jpg"},
            {"word": "quiz", "image_file": "assets/photos/qu/quiz.jpg"},
            {"word": "buzz", "image_file": "assets/photos/zz/buzz.jpg"},
            {"word": "frog", "image_file": "assets/photos/f/frog.jpg"},
            {"word": "king", "image_file": "assets/photos/ng/king.jpg"},
        ],
    },
    # ── L4 (Green) — plan books 8-10 compressed to two ──
    "Blend_10": {
        "book_number": 10,
        "level": "L4",
        "title": "The Moon in the Night",
        "subtitle": "Longer sounds: ay, ee, igh, ow, oo",
        "focus_graphemes_new": ["ay", "ee", "igh", "ow", "oo"],
        "cumulative_graphemes": ["ay", "ee", "igh", "ow", "oo",
                                 "d", "f", "t", "n", "sh", "m", "s"],
        "cover_image_file": "assets/photos/oo/moon.jpg",
        "pages": [
            {"word": "day",   "image_file": "assets/photos/ay/day.jpg"},
            {"word": "feet",  "image_file": "assets/photos/ee/feet.jpg"},
            {"word": "night", "image_file": "assets/photos/igh/night.jpg"},
            {"word": "show",  "image_file": "assets/photos/ow/show.jpg"},
            {"word": "moon",  "image_file": "assets/photos/oo/moon.jpg"},
            {"word": "seed",  "image_file": "assets/photos/ee/seed.jpg"},
        ],
    },
    "Blend_11": {
        "book_number": 11,
        "level": "L4",
        "title": "The Bird and the Toy",
        "subtitle": "+ ar, or, air, ir, ou, oy",
        "focus_graphemes_new": ["ar", "or", "air", "ir", "ou", "oy"],
        "cumulative_graphemes": ["ar", "or", "air", "ir", "ou", "oy",
                                 "c", "f", "k", "b", "d", "t"],
        "cover_image_file": "assets/photos/oy/toy.jpg",
        "pages": [
            {"word": "car",  "image_file": "assets/photos/ar/car.jpg"},
            {"word": "fork", "image_file": "assets/photos/or/fork.jpg"},
            {"word": "fair", "image_file": "assets/photos/air/fair.jpg"},
            {"word": "bird", "image_file": "assets/photos/ir/bird.jpg"},
            {"word": "out",  "image_file": "assets/photos/ou/out.jpg"},
            {"word": "toy",  "image_file": "assets/photos/oy/toy.jpg"},
        ],
    },
    # ── L5 (Blue) — plan books 11-12 compressed to one ──
    # Covers the four split digraphs + ai/oa. The plan's remaining L5
    # alternatives (ea, ie, oi, aw) get no blending-book slot in an
    # 8-book build; they are carried by storybooks L5.3/L5.4.
    "Blend_12": {
        "book_number": 12,
        "level": "L5",
        "title": "The Cake on the Boat",
        "subtitle": "New spellings: a-e, i-e, o-e, u-e, ai, oa",
        "focus_graphemes_new": ["a-e", "i-e", "o-e", "u-e", "ai", "oa"],
        "cumulative_graphemes": ["a-e", "i-e", "o-e", "u-e", "ai", "oa",
                                 "c", "k", "t", "b", "n", "r"],
        "cover_image_file": "assets/photos/oa/boat.jpg",
        "pages": [
            {"word": "cake", "split": "a-e", "image_file": "assets/photos/a_e/cake.jpg"},
            {"word": "kite", "split": "i-e", "image_file": "assets/photos/i_e/kite.jpg"},
            {"word": "bone", "split": "o-e", "image_file": "assets/photos/o_e/bone.jpg"},
            {"word": "cube", "split": "u-e", "image_file": "assets/photos/u_e/cube.jpg"},
            {"word": "rain", "image_file": "assets/photos/ai/rain.jpg"},
            {"word": "boat", "image_file": "assets/photos/oa/boat.jpg"},
        ],
    },
}
