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
"""

LEVEL_COLOUR = "#E84B8A"  # L1 Pink

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
}
