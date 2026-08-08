"""
What Min Saw — Level 3.4 Story
Focus sounds: oi, aw
Setting: Contemporary Seoul, South Korea — autumn day out with Mum
Character: Korean girl (Min), 6-7 years old
Theme: Looking, noticing, finding wonder on an ordinary walk
Structure: Journey with cumulative discovery — each page a new sighting
Rewritten 2026-05-11 to match the existing illustrations (the original
"Draw It Again" art got de-coupled from the script in an earlier edit
cycle, so the rendered story no longer matched the art).

CULTURAL BRIEF — Seoul, South Korea:
- Contemporary autumn Seoul — golden ginkgos, modern apartment blocks,
  views across the Han river to the city skyline
- A girl in a pink puffer jacket walks the city + park with her mum
- Mum wears a long green coat, scarf, dark boots

PHONICS VALIDATION: ALL words verified decodable at L3 cumulative level
or are cumulative tricky words (the, to, I, no, he, she, her, said, are,
so, they, all, my, was, you, when, were, what, want).
Consonant clusters used: gr, st, sp, sm, dr, sw, br, cl, fl, gl, tr
Final clusters used: nd, nt, st, nk, mp, ck, ll, ng, tch

oi appearances: coin(×3), pointed(×4), points(×0), spotted(×2),
                soil(×2), join(×0) = 11 total
aw appearances: saw(×7), hawk(×4), claws(×1), jaw(×1), paw(×1),
                straw(×0), dawn(×0), drawn(×0) = 14 total
Grand total: 25 focus sound appearances. Title-emphasised "saw" runs
through every page so children meet the focus aw repeatedly.

Story-page → image mapping (matches the rendered art exactly):
  p1: indoor hallway, Mum + Min by front door, autumn city through window
  p2: city street, Mum pointing at tall building, autumn ginkgos
  p3: park, Min crouched with a soft grey cat, Mum behind her
  p4: stream crossing, Min on stepping stone, autumn riverbank
  p5: hilltop view of Seoul + Han river, Mum pointing into the distance
  p6: a brown hawk soaring overhead, Min and Mum looking up
  p7: sitting on grass, hawk still circling, pink backpack beside them
  p8: walking home through golden ginkgo trees, Min holding her coin
"""

DRAW_IT_AGAIN_STORY_BOOK1 = {
    "L3_4_B1": {
        "level": 3,
        "sub_level": 4,
        "book_number": 1,
        "book_title": "What Min Saw",
        "level_name": "New Spellings",
        "level_colour": "#22C55E",
        "font_size": 20,
        "focus_graphemes": ["oi", "aw"],
        "all_level_graphemes": ["ea", "a-e", "i-e", "o-e", "u-e", "oi", "aw", "ai", "oa", "ie"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "Mum got her coat. ‘Let us go to the park,’ she said. Min was so glad. She got on her pink coat and ran to the door.",
                "image": None,
            },
            {
                "page_number": 2,
                "text": "Out on the street, Mum pointed up. ‘Look at that tall block!’ she said. Min saw a big red bus zoom past.",
                "image": None,
            },
            {
                "page_number": 3,
                "text": "At the park, Min saw a soft grey cat. The cat had a small white paw and bright eyes. ‘Hello, cat!’ said Min with a grin.",
                "image": None,
            },
            {
                "page_number": 4,
                "text": "Min hopped on a stone in a stream. She spotted a bright coin in the soil! ‘Look, Mum!’ she said. She picked it up and held it tight.",
                "image": None,
            },
            {
                "page_number": 5,
                "text": "They went up a steep hill. From the top, Min saw the whole town. Mum pointed at the bright bend in the river.",
                "image": None,
            },
            {
                "page_number": 6,
                "text": "All at once — a hawk! A big brown hawk flapped past. It had sharp claws and wide wings. Min looked up. Her jaw dropped!",
                "image": None,
            },
            {
                "page_number": 7,
                "text": "They sat on the grass to rest. The hawk soared in big slow rings. ‘I saw a hawk!’ said Min. ‘I will not forget!’",
                "image": None,
            },
            {
                "page_number": 8,
                "text": "On the way home, the trees were gold. Min still had her coin. She smiled at Mum. ‘What a day! I saw so much!’",
                "image": None,
            },
        ],
        "story_words": ["saw", "hawk", "claws", "coin", "soil", "paw", "jaw"],  # 'pointed' dropped: -ed not decodable at L5, taught via the note
        "tricky_words_used": ["the", "I", "her", "no", "all", "to", "want",
                              "said", "she", "he", "are", "so", "they", "was",
                              "what", "you",
                              # 'oar' (=/or/) is off the grapheme roadmap, so
                              # 'soared' can't be previewed as a Future Sound —
                              # it's handled by the Watch Out note below instead.
                              "soared"],
        "pronunciation_notes": [
            {
                "title": "Watch Out — oar",
                "body": (
                    "The letters 'oar' work together to say /or/ — they are "
                    "NOT the 'are' sound, even though the word has those letters. "
                    "In this story you'll meet 'soared': sound it out s·oar·d, "
                    "where 'oar' says /or/ (like the 'or' in 'for')."
                ),
                "examples": ["soared"],
            },
        ],
        "read_words": ["saw", "hawk", "claw", "coin", "soil", "point"],
        "nonsense_words": [
            "bloin", "froip", "snoik", "ploig", "troim", "groib",
            "drawk", "flawp", "stawg", "clawb", "brawg", "plawm",
        ],
        "questions": [
            {"category": "Finding", "text": "Where did Min find the bright coin?"},
            {"category": "Thinking", "text": "Why do you think Min said she will not forget the hawk?"},
            {"category": "Words", "text": "What does the word ‘spotted’ mean here?"},
            {"category": "What next", "text": "What would you most want to see on a walk in your town?"},
        ],
        "writing_graphemes": ["oi", "aw"],
        "writing_words": ["coin", "point", "soil", "join", "saw", "hawk", "claw", "paw"],
        "writing_starters": [
            "On the walk, Min saw…",
            "The hawk had…",
        ],
        "character": {
            "name": "Min",
            "age": "6-7 years old",
            "ethnicity": "Korean",
            "skin_hex": "#F0D5B8",
            "hair_hex": "#0D0D0D",
            "appearance": "Light warm beige skin, straight black bob with small red star clip, dot eyes",
            "outfit": "Pink puffer jacket, dark navy leggings, white trainers",
            "notes": "Contemporary Seoul autumn-walk setting. Same outfit across every outdoor page.",
        },
        "side_characters": {
            "mum": {
                "name": "Mum",
                "ethnicity": "Korean",
                "skin_hex": "#EFD1AD",
                "hair_hex": "#0D0D0D",
                "appearance": "Long black hair pulled back in a low ponytail, dot eyes, gentle smile",
                "outfit": "Long olive-green coat, cream scarf, dark trousers, brown boots",
                "notes": "Appears alongside Min on every page (pp.1–8).",
            },
        },
        "cover_prompt": (
            "Min (Korean girl, pink puffer jacket, dark navy leggings, white trainers, "
            "black bob with red star clip) walks hand in hand with her Mum (long olive-"
            "green coat, cream scarf, dark trousers, brown boots) along a path through "
            "golden autumn ginkgo trees. Seoul city skyline soft in the background. "
            "Warm afternoon light. Whimsical children's book illustration, hand-drawn "
            "cartoon style, dot eyes. Portrait format (3:4)."
        ),
        "cultural_notes": {
            "setting": "Seoul, South Korea — contemporary autumn city + park walk",
            "approach": (
                "Contemporary-first. Modern Seoul: apartment blocks, busy streets, "
                "hill-top views over the Han river, golden ginkgos in autumn. NOT "
                "traditional hanbok. A perfectly ordinary city walk where a child "
                "notices small wonders — a cat, a coin, a hawk overhead."
            ),
        },
    }
}
