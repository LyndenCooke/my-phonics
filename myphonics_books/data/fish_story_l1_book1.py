"""
The Fish in the Tank — Level 1.3 Digraphs Focus Story
Written 2026-03-03 following narrative-first, majority decodable approach
Digraphs featured: fish (sh), tank (nk), wish (sh)
"""

FISH_STORY_BOOK1 = {
    "L1_B1": {
        "level": 1,
        "book_number": 1,
        "book_title": "The Fish in the Tank",
        "focus_graphemes": ["sh", "nk"],  # Actually used in story
        "story_pages": [
            {"text": "I have a fish! It is in a bag.", "image": None},
            {"text": "The fish is sad. The bag is not big.", "image": None},
            {"text": "I get a cup. No! It is not big.", "image": None},
            {"text": "I get a tank. Yes! The fish can go in!", "image": None},
            {"text": "Wish, wish! The fish is in the tank!", "image": None},
            {"text": "The fish is not sad. I am happy!", "image": None},
        ],
        "story_words": ["fish", "tank", "wish", "bag", "cup", "sad"],
        "tricky_words_used": ["I", "a", "the", "no", "go", "is"],  # Actually used in story (6 max for layout)
        "read_words": ["fish", "tank", "wish", "bag"],
        "nonsense_words": [
            "shim", "fash", "nush", "gish",  # sh words
            "tink", "donk", "bunk", "lenk",  # nk words
            "thud", "chop", "thib", "quop",  # other digraphs
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the fish go?"},
            {"category": "Thinking", "text": "Why was the fish sad at first?"},
            {"category": "Words", "text": "What is a tank?"},
            {"category": "What next", "text": "What would you name the fish?"},
        ],
        "writing_graphemes": ["sh", "nk"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
