"""
The Mud on the Dog — Level 1.2 Focus Story
Written 2026-03-04 following narrative-first, majority decodable approach
Focus sounds: m, d, g, o (building on SATPIN)
"""

MUD_DOG_STORY_BOOK1 = {
    "L1_2_B1": {
        "level": 1,
        "sub_level": "L1.2",
        "book_number": 1,
        "book_title": "The Mud on the Dog",
        "focus_graphemes": ["m", "d", "g", "o"],  # L1.2 focus sounds
        "character_id": "CHAR-D",
        "character_name": "British-Asian girl (outdoor adventure)",
        "story_pages": [
            {"text": "I got a dog. It is a big dog.", "image": None},
            {"text": "The dog ran in the mud. Mud, mud, mud!", "image": None},
            {"text": "The dog is a mess! Mud is on the dog.", "image": None},
            {"text": "I get a mop. I mop the dog.", "image": None},
            {"text": "No! The mop is a mess! Mud is on me!", "image": None},
            {"text": "Mum got a tub. The dog sat in it. No mud! No mess!", "image": None},
        ],
        "story_words": ["dog", "mud", "mop", "mum", "mess", "got", "big", "tub"],
        "tricky_words_used": ["I", "the", "no", "me"],  # 'me' added (high-utility, p5 keeps it); 'a'/'is' removed via rewrites
        "read_words": ["dog", "mud", "mop", "mum"],  # Focus on m, d, g, o
        "nonsense_words": [
            "mog", "dum", "gop", "dob",  # m, d, g, o focus
            "mib", "gat", "dom", "mug",  # mixed
            "dop", "gum", "mod", "gim",  # more combinations
        ],
        "questions": [
            {"category": "Finding", "text": "What did the dog run in?"},
            {"category": "Thinking", "text": "Why did the mop not help?"},
            {"category": "Words", "text": "What is a tub?"},
            {"category": "What next", "text": "What would you name the dog?"},
        ],
        "writing_graphemes": ["m", "d", "g", "o"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
