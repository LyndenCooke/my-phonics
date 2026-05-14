"""
The Night Light — Level 2.1 Tokyo Night Story
Focus sounds: ay, ee, igh
Setting: Tokyo at dusk → night, lit by convenience stores and street lamps
Character: A boy (~6yo) in a blue puffer jacket. Dad in a dark coat.
Story: The boy's cat ran off at dusk. He and his dad search the lit streets
       and find the cat sitting on a ledge outside a convenience store.

Written 2026-05-14 (rewrite from earlier abstract day/night text that did not
match the boy+dad+cat search the existing images already depicted).
"""

NIGHT_LIGHT_STORY_BOOK1 = {
    "L2_1_B1": {
        "level": 2,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "The Night Light",
        "focus_graphemes": ["ay", "ee", "igh"],  # L2.1 focus sounds
        "story_pages": [
            {"text": "My cat ran off! It is the end of the day. I sigh.", "image": None},
            {"text": "I go with my dad. We can see the way. The night is dim.", "image": None},
            {"text": "The shop is lit. I peek in. \"Is my cat in it?\" I say.", "image": None},
            {"text": "I sigh. It is dim. I cannot see my cat in the night.", "image": None},
            {"text": "Dad said, \"Up high!\" I see a big light. The night is lit!", "image": None},
            {"text": "I am sad. Dad said, \"I am with you. We can see.\"", "image": None},
            {"text": "My cat! I see my cat! It sits in the light. I dash up!", "image": None},
            {"text": "I hug my cat. Dad said, \"Yay!\" My cat is back!", "image": None},
        ],
        "story_words": ["day", "high", "sigh", "see", "night", "say", "light", "way", "peek", "yay"],
        "tricky_words_used": ["the", "I", "my", "go", "we", "said", "you", "of"],
        "read_words": ["high", "day", "sigh", "light", "see", "way", "night", "peek"],
        "nonsense_words": [
            "fay", "tay", "zay", "nay",  # ay words
            "tee", "mee", "ree", "zee",  # ee words
            "nigh", "digh", "figh", "jigh",  # igh words
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the boy find his cat?"},
            {"category": "Thinking", "text": "Why did the boy need a light?"},
            {"category": "Words", "text": "What is a street lamp?"},
            {"category": "What next", "text": "What would you name the cat?"},
        ],
        "writing_graphemes": ["ay", "ee", "igh"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
