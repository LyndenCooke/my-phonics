"""
Tap! Tap! Tap! — Level 1.1 SATPIN Focus Story
Written 2026-03-04 following narrative-first, majority decodable approach
Focus sounds: s, a, t, p, i, n (SATPIN)
"""

TAP_STORY_BOOK1 = {
    "L1_1_B1": {
        "level": 1,
        "sub_level": "L1.1",
        "book_number": 1,
        "book_title": "Tap! Tap! Tap!",
        "focus_graphemes": ["s", "a", "t", "p", "i", "n"],  # SATPIN focus
        "character_id": "CHAR-B",
        "character_name": "White British boy (casual home)",
        "story_pages": [
            {"text": "I sit at a mat. Tap, tap, tap!", "image": None},
            {"text": "Is it a rat? Is it a bat?", "image": None},
            {"text": "It is not a rat. It is not a bat.", "image": None},
            {"text": "Tap, tap! I pat at it.", "image": None},
            {"text": "It is a cat! A fat cat!", "image": None},
            {"text": "I pat the cat. The cat naps. I am happy!", "image": None},
        ],
        "story_words": ["sit", "mat", "tap", "rat", "bat", "pat", "cat", "fat", "naps"],
        "tricky_words_used": ["I", "a", "the", "is", "happy"],  # Actually used - "it" is decodable (i-t), "happy" is tricky (2 syllables)
        "read_words": ["sat", "pat", "tap", "nap"],  # SATPIN focus for activity
        "nonsense_words": [
            "sap", "tas", "pim", "nit",  # SATPIN only
            "tib", "pag", "nas", "sib",  # SATPIN + simple
            "nat", "pis", "tup", "sut",  # Mixed SATPIN
        ],
        "questions": [
            {"category": "Finding", "text": "What was making the tap sound?"},
            {"category": "Thinking", "text": "Why was the boy surprised?"},
            {"category": "Words", "text": "What does 'naps' mean?"},
            {"category": "What next", "text": "What would you name the cat?"},
        ],
        "writing_graphemes": ["s", "a", "t", "p"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
