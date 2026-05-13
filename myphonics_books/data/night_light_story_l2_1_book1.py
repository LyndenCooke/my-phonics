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
            {"text": "The sun is up.", "image": None},
            {"text": "The day is ending.", "image": None},
            {"text": "I sigh. It is dim.", "image": None},
            {"text": "I need more light!", "image": None},
            {"text": "A light! Up high! I can see!", "image": None},
            {"text": "I see the way. The night is lit.", "image": None},
            {"text": "Lights in the night. I can see!", "image": None},
            {"text": "Day and night! I say 'Yay!'", "image": None},
        ],
        "story_words": ["high", "day", "sigh", "need", "light", "see", "way", "night", "say", "yay"],
        "tricky_words_used": ["the", "I"],  # 'is', 'a' are decodable at this level
        "read_words": ["high", "day", "sigh", "light", "see", "way", "night"],
        "nonsense_words": [
            "fay", "tay", "zay", "nay",  # ay words
            "tee", "mee", "ree", "zee",  # ee words
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
