"""
[STALE 2026-05-04] This file describes the OLD L3.4 story ("Draw It Again!"),
where Min drew a hawk in art class. The L3.4 images have since been replaced
with an autumn-walk scene through Seoul, and the interactive book has been
rewritten as "What Min Saw". This file has NOT been updated to match — the
print-PDF pipeline will still produce the old story until this is rewritten.
See src/lib/interactiveBookDataL3.ts for the canonical new story text.

Draw It Again! — Level 3.4 Story
Focus sounds: oi, aw
Setting: Contemporary Seoul, South Korea — modern school art class
Character: Korean girl (Min), 6-7 years old, drawing with oil sticks
Theme: Dealing with criticism / bouncing back / perseverance
Structure: Repetition with Variation (draw > rejection > draw again > acceptance)
Written 2026-03-20

CULTURAL BRIEF — Seoul, South Korea:
- Contemporary Korean elementary school art class (modern, bright, well-equipped)
- NOT traditional hanbok — contemporary-first: modern school clothes, art smock
- Korean schools have strong art programmes; drawing/painting is common
- Modern apartment blocks visible through school windows
- Warm, supportive school environment
- Children address each other informally; collaborative art is encouraged

PHONICS VALIDATION: ALL words verified decodable at L3 cumulative level
or are cumulative tricky words (the, to, I, no, he, she, her, said, are, so, they, all).
Consonant clusters used: st, gr, cl, fr, sp, sm, dr, str, spr (all unlocked at L3).
Final clusters used: nd, nt, st, nk, mp (all allowed).

REPETITION WITH VARIATION structure:
- ATTEMPT 1 (Pages 1-2): Min draws a hawk — effort and pride
- CRITICISM (Page 3): Boy points and says it's not right — Min feels raw
- BOUNCE BACK (Page 4): Min almost spoils it, but stops — fresh start
- ATTEMPT 2 (Page 5): She draws with care — this time it's just right
- ACCEPTANCE (Page 6): The boy is impressed, asks to join in
- COLLABORATION (Pages 7-8): They draw together, pin it up — joy

oi appearances: oil(×4), points(×2), spoil(×1), join(×1), soil(×1), toil(×2) = 11 total
aw appearances: draw(×3), draws(×4), hawk(×4), claws(×5), raw(×1),
               lawn(×1), straw(×1) = 19 total
Grand total: 30 focus sound appearances
"""

DRAW_IT_AGAIN_STORY_BOOK1 = {
    "L3_4_B1": {
        "level": 3,
        "sub_level": 4,
        "book_number": 1,
        "book_title": "Draw It Again!",
        "level_name": "New Spellings",
        "level_colour": "#22C55E",
        "font_size": 20,
        "focus_graphemes": ["oi", "aw"],
        "all_level_graphemes": ["ea", "a-e", "i-e", "o-e", "u-e", "oi", "aw", "ai", "oa", "ie"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "Min gets out her oil sticks and a big sheet. \u2018I will draw a hawk with sharp claws!\u2019 she said. She grips a stick tight.",
                "image": None,
            },
            {
                "page_number": 2,
                "text": "She draws and draws. The hawk has sharp claws and a long beak. Oil drips on the sheet.",
                "image": None,
            },
            {
                "page_number": 3,
                "text": "A boy points at it. \u2018That is not right!\u2019 he said. \u2018The claws are too big!\u2019 Min feels raw inside.",
                "image": None,
            },
            {
                "page_number": 4,
                "text": "She wants to spoil it all. But she stops. No! She takes a fresh sheet. \u2018I will draw that hawk!\u2019 she said.",
                "image": None,
            },
            {
                "page_number": 5,
                "text": "This time, she draws with smooth oil strokes. The claws look just right. The wings spread wide and shine in the light!",
                "image": None,
            },
            {
                "page_number": 6,
                "text": "The boy steps up to look. He points at the claws. \u2018Those claws are so good!\u2019 he said. \u2018Can I join in?\u2019",
                "image": None,
            },
            {
                "page_number": 7,
                "text": "Min nods. He grabs oil sticks too. They draw a green lawn with soil and straw. They toil and toil!",
                "image": None,
            },
            {
                "page_number": 8,
                "text": "They pin it up for the class to see. Min grins. \u2018I am glad I did not stop,\u2019 she said. The boy grins too. \u2018That hawk is the best!\u2019",
                "image": None,
            },
        ],
        "story_words": ["draw", "hawk", "claws", "oil", "points", "toil"],
        "tricky_words_used": ["said", "she", "he", "are", "so", "they"],
        "read_words": ["draw", "hawk", "claw", "join", "oil", "soil"],
        "nonsense_words": [
            "bloin", "froip", "snoik", "ploig", "troim", "groib",
            "drawk", "flawp", "stawg", "clawb", "brawg", "plawm",
        ],
        "questions": [
            {"category": "Finding", "text": "What does Min draw with her oil sticks?"},
            {"category": "Thinking", "text": "Why does Min feel raw when the boy points at her hawk?"},
            {"category": "Words", "text": "What does the word \u2018toil\u2019 mean?"},
            {"category": "What next", "text": "What do you think Min and the boy draw next?"},
        ],
        "writing_graphemes": ["oi", "aw"],
        "writing_words": ["oil", "join", "point", "soil", "draw", "claw", "hawk", "straw"],
        "writing_starters": [
            "Min draws a\u2026",
            "The hawk has sharp\u2026",
        ],
        "character": {
            "name": "Min",
            "age": "6-7 years old",
            "ethnicity": "Korean",
            "skin_hex": "#F0D5B8",
            "hair_hex": "#0D0D0D",
            "appearance": "Light warm beige skin, straight black shoulder-length hair with small pink hair clip, bright dot eyes",
            "outfit": "Light blue school art smock over a pink t-shirt, dark navy leggings, white trainers",
            "notes": "Contemporary Seoul school setting. Modern Korean child — NOT hanbok. Art smock has small paint smudges.",
        },
        "side_characters": {
            "boy": {
                "name": "the boy",
                "ethnicity": "Korean",
                "skin_hex": "#EFD1AD",
                "hair_hex": "#0D0D0D",
                "appearance": "Light warm beige skin, short straight black hair, bright dot eyes",
                "outfit": "Light green t-shirt, grey shorts, white trainers",
                "notes": "Classmate who initially criticises, then admires and joins in",
            },
        },
        "recurring_objects": {
            "oil_sticks": "Chunky colourful oil pastel sticks — bright reds, greens, blues, yellows — scattered on the desk and held in hand",
            "hawk_drawing": "A large hawk with sharp curved claws, spread wings, and long beak — drawn on white paper with bold oil pastel strokes",
            "art_sheet": "Big white sheet of paper on a flat desk, with oil pastel smudges and drips",
        },
        "cover_prompt": (
            "Min (Korean girl, skin #F0D5B8, straight black shoulder-length hair with pink clip, "
            "light blue art smock over pink t-shirt, dark navy leggings, white trainers) stands at a "
            "desk in a bright modern school art room, holding a chunky oil pastel stick, looking proudly "
            "at a large drawing of a hawk with spread wings and sharp claws on white paper. Colourful "
            "oil pastels scattered on the desk. Through the window: modern Seoul apartment buildings "
            "and autumn trees. Warm indoor light. Portrait format (3:4)."
        ),
        "cultural_notes": {
            "setting": "Seoul, South Korea — modern elementary school art class (contemporary)",
            "approach": (
                "Contemporary-first. Show a modern Korean school: bright, clean, well-equipped art room. "
                "Children in casual modern clothes (art smock for Min). NOT traditional hanbok. "
                "Modern Seoul visible through windows — apartment blocks, autumn trees with golden leaves. "
                "Korean schools value art education; collaborative projects are common. "
                "Warm, supportive classroom atmosphere."
            ),
        },
    }
}
