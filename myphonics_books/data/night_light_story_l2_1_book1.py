"""
The Night Light — Level 2.1 Japanese Garden Story
Focus sounds: ay, ee, igh
Setting: Japanese night garden with stone lanterns
Character: Japanese girl in pink yukata
Written 2026-03-05
"""

NIGHT_LIGHT_STORY_BOOK1 = {
    "L2_1_B1": {
        "level": 2,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "The Night Light",
        "focus_graphemes": ["ay", "ee", "igh"],  # L2.1 focus sounds
        "story_pages": [
            {"text": "The day ends. I can't see my toy cat.", "image": None},  # "can not" → "can't" (Lynden 2026-07-15)
            {"text": "We go out to look. It is night.", "image": None},
            {"text": "Look at the lights. I can see in the shop.", "image": None},
            {"text": "It is dim on the way. I need a light.", "image": None},
            {"text": "Look, a light up high! It is the moon.", "image": None},
            {"text": "Dad can see I am sad. He hugs me in the light.", "image": None},
            {"text": "I see my toy cat! Dad and I run to it.", "image": None},
            {"text": "I hug my toy cat. \"Yay, my toy!\"", "image": None},  # "I say" tag removed (Lynden 2026-07-15)
        ],
        "story_words": ["high", "day", "sigh", "need", "light", "see", "way", "night", "yay"],  # 'say' dropped with its "I say" tag — no longer in the story
        "tricky_words_used": ["the", "I"],  # 'is', 'a' are decodable at this level
        "read_words": ["high", "day", "sigh", "light", "see", "way", "night"],
        "nonsense_words": [
            "fay", "tay", "zay", "thay",  # ay words
            "chee", "mee", "ree", "zee",  # ee words
            "nigh", "digh", "figh", "jigh",  # igh words
        ],
        "questions": [
            {"category": "Finding", "text": "What lit up the sky?"},
            {"category": "Thinking", "text": "Why did the child need a light?"},
            {"category": "Words", "text": "What is a street lamp?"},
            {"category": "What next", "text": "What would you do in the night?"},
        ],
        "writing_graphemes": ["ay", "ee", "igh"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
