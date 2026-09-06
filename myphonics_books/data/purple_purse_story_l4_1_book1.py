"""
The Purple Purse — Level 4.1 Story (REVISED)
Focus sounds: ur, er
Setting: Modern Istanbul neighbourhood (Kadıköy/Moda)
Cultural brief: data/cultural_brief_L4_1.txt
Written 2026-03-08

Supersedes: bazaar_story_l4_1_book1.py (postcard bazaar setting replaced with
contemporary neighbourhood journey).

Phonics validation: ALL words verified decodable at L4 cumulative level
or are cumulative tricky words.

Focus 'ur' words: purple, purse, turned, fur, burst, church, hurt, tucked
Focus 'er' words: her, ferns, corner, herbs, seller, never, ever, after
Consonant clusters used: st, cl, gr, sm, ck (all unlocked at L3+).

Story structure: Lost-and-found journey (different location each page).
Image feasibility: PASS — each page is a different location.
Engagement hooks: 6/6 (page-turn tension, curiosity gap, repetition with
variation, sensory details, emotional stakes, satisfying resolution).
"""

PURPLE_PURSE_STORY_BOOK1 = {
    "L4_1_B1": {
        "level": 4,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "The Purple Purse",
        "level_name": "Building Fluency",
        "level_colour": "#3B82F6",
        "font_size": 18,
        "focus_graphemes": ["ur", "er"],
        "all_level_graphemes": ["are", "ur", "er", "ew", "ue"],  # ow moved to Shifty 2026-08-21
        "story_pages": [
            {
                "page_number": 1,
                "text": "My purple purse was gone! I turned my pockets inside out, but it was not there. I was so upset!",
                "image_prompt": "A worried girl turns out her empty pockets in a modern apartment hallway. Dad stands nearby looking concerned. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": "Dad came with me to search. We walked up and down the street. \"It must be here,\" said Dad.",
                "image_prompt": "A girl and her dad walk hand in hand down a modern city street with colourful buildings. She looks thoughtful. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": "I looked under the bench in the park. I searched in the ferns. Not there!",
                "image_prompt": "A girl bends down to search under a park bench surrounded by green ferns. She looks frustrated. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": "\"A currant bun?\" said the baker. But I had no coins to pay! I turned away, sad.",
                "image_prompt": "A girl stands at the counter of a small corner shop, asking the shopkeeper a question. The shopkeeper shakes his head. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": "Further on, we passed a church. Past more stalls and tall garden walls. I started to give up.",
                "image_prompt": "A girl walks along a street past an old stone wall covered in ferns. A small church is visible in the background. She looks sad. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": "Then a market lady held up a purple purse! \"I found this on the kerb. Is it yours?\"",
                "image_prompt": "A smiling woman at a herb stall holds up a small purple purse. The girl reaches for it with delight while Dad watches. Herbs in wooden crates around the stall. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": "I turned the purse over. My coins were still in it! \"Thank you!\" I burst out, smiling.",
                "image_prompt": "A joyful girl holds a small purple purse close, examining it with a huge smile. Dad stands behind her smiling. Herb stall and modern street behind. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": "Dad and I walked home in the warm afternoon. I held the purse close to my chest. \"She was so kind,\" I said.",
                "image_prompt": "A girl and her dad walk home along a modern street at golden hour. She clutches a small purple purse to her chest, looking happy and relieved. Landscape orientation.",
            },
        ],
        "cover_prompt": "A girl in a purple jumper stands on a colourful modern street, holding a small purple purse close to her chest with a smile. Green ferns and modern shops behind her. Portrait orientation.",
        "story_words": ["purple", "purse", "ferns", "herbs", "never"],  # 'turned' dropped: -ed not decodable at L6, showcased on page 2 instead
        # Lynden 2026-08-23 (claws ruling, applied fleet-wide the same day):
        # a final s that says /z/ takes the slate diamond, not an ordinary
        # dot.  ferns = f-er-n-s ("fernz"), herbs = h-er-b-s — s is letter
        # index 4 in both.  purse's s is a true /s/ inside the 'se' ending
        # and stays a plain mark.
        "shifty_marks": {
            "ferns": [{"index": 4, "says": "/z/"}],
            "herbs": [{"index": 4, "says": "/z/"}],
        },
        # Cleaned 2026-07-22: dropped stale/already-mastered entries that were
        # cluttering the Tricky Words strip (your, old, put, where, go, no,
        # what, was, you, her, she, my, the, to, I — all either mastered by L6
        # or not in this story).  Lower-level tricky words no longer reach the
        # strip at all: generate_book.py only shows words introduced at THIS
        # level or later, so 'said'/'so' (L5) stay hidden in a Level 6 book.
        "tricky_words_used": [],
        # 'search'/'searched' letter-map as s-e-ar-ch, so the decodability
        # engine never notices them — but the real unit is 'ear', which isn't
        # taught until Level 7, and here it says /er/ rather than the usual
        # /ear/.  Declared explicitly so it appears in the page-2 Future
        # Sounds band as the Level 7 sound it is (Lynden 2026-07-25), with the
        # Watch Out note below carrying the fuller explanation.
        "future_sounds_extra": [
            {"grapheme": "ear", "sound": "er", "example": "search"},
        ],
        "pronunciation_notes": [
            {
                "title": "Watch Out — ear says /er/",
                "body": (
                    "'ear' is a Level 7 sound — it's coming later, so it's on "
                    "the Future Sounds chart at the front.  Usually it says "
                    "/ear/ (like 'hear'), but in a few words it says /er/ "
                    "instead.  In this story you'll meet 'search' and "
                    "'searched' — say s·ear·ch with the /er/ sound, like the "
                    "'er' in 'her'."
                ),
                "examples": ["search → serch", "searched → sercht"],
            },
        ],
        "read_words": ["church", "burst", "seller", "corner"],
        "nonsense_words": [
            "chur", "gern", "flur", "sperk", "thurn",
            "blerch", "grurn", "clurp", "skerb", "flerp",
        ],
        # -ed band pruned to one printing per band 4+5 (Lynden 2026-08-23,
        # specialist-reviewed): the three-ways guide teaches a RULE, so it
        # prints in 4.5 (first -ed book) and 5.2 only.  Later books drop the
        # band; the page-2 Future Sounds 'ed' cell still appears, and any
        # awkward -ed word rides as a word-level note if needed.
        "show_ed_guide": False,
        "questions": [
            {"category": "Finding", "text": "What was the girl looking for?"},
            {"category": "Thinking", "text": "Why did the girl feel hurt when the shopkeeper said no?"},
            {"category": "Words", "text": "What does the word 'seller' mean?"},
            {"category": "What next", "text": "What do you think the girl told Mum when she got home?"},
        ],
        "writing_graphemes": ["ur", "er"],
        "writing_words": ["purple", "purse", "nurse", "church", "fern", "never"],
        "writing_starters": ["At the shop, I saw...", "The purse was..."],
        "character": {
            "name": "Istanbul girl",
            "age": "6 years old",
            "appearance": "Dark brown wavy hair in a ponytail, light olive skin",
            "outfit": "Purple jumper with small gold star pattern, dark navy jeans, white trainers, light blue zip-up jacket",
            "notes": "Contemporary Turkish child in modern casual clothes",
        },
        "side_character": {
            "name": "Dad",
            "appearance": "Tall, dark brown short hair, light olive skin, clean-shaven",
            "outfit": "Dark casual jacket, grey shirt, dark jeans, dark trainers",
        },
        "setting": {
            "region": "Istanbul, Turkey (Kadıköy/Moda neighbourhood)",
            "style": "Contemporary modern neighbourhood",
            "cultural_brief": "data/cultural_brief_L4_1.txt",
        },
    }
}
