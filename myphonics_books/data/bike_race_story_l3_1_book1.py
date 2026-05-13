"""
The Big Bike Race — Level 3.1 Story
Focus sounds: a-e, i-e (split digraphs)
Setting: French countryside bike race
Character: Boy in green cycling jersey and white helmet (HERO_PROMPTS["3.1"])
Written 2026-03-05

Phonics validation: ALL words verified decodable at L3 cumulative level
or are cumulative tricky words (the, to, I, my, said, go, so, some, she, me, like, be, what, all).
Consonant clusters used: gr, tr, st, sl, sm, pl, pr, fl, nd (all unlocked at L3).
"""

BIKE_RACE_STORY_BOOK1 = {
    "L3_1_B1": {
        "level": 3,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "The Big Bike Race",
        "focus_graphemes": ["a-e", "i-e"],
        "story_pages": [
            {"text": "Bikes line up at the gate. It is time for the race to start! I stand with my bike on the line.", "image": None},
            {"text": "\u2018Ride to the lake and back!\u2019 the man said. Can I win? I grip my bike tight.", "image": None},
            {"text": "Off I go! Past a tall pine tree. Past a wide stone gate. I ride fast in the sun.", "image": None},
            {"text": "Look out! Stones on the track. A bike slides and a girl falls off. She gives me a brave smile.", "image": None},
            {"text": "I can see the lake! It shines in the sun. I ride past it and head back.", "image": None},
            {"text": "Can I make it back in time? I ride and ride. I must not be late!", "image": None},
            {"text": "I am past the line! I made it! I race past the line with a wide grin.", "image": None},
            {"text": "A prize! A gold medal! I wave at my mates. What a good day!", "image": None},
        ],
        "story_words": ["ride", "bike", "gate", "lake", "made", "brave"],
        "tricky_words_used": ["the", "I", "to", "my", "she", "said", "me", "go", "what"],  # Removed unused 'some/like/all'; added words actually in text
        "read_words": ["shine", "prize", "plate", "flame", "wave", "pine"],
        "nonsense_words": [
            "dake", "fape", "tave", "bave", "jate", "mape",
            "tife", "bive", "nipe", "fime", "jide", "zike",
        ],
        "questions": [
            {"category": "Finding", "text": "What did the boy ride past on his way to the lake?"},
            {"category": "Thinking", "text": "Why did the girl smile when she came off her bike?"},
            {"category": "Words", "text": "What does the word \u2018prize\u2019 mean?"},
            {"category": "What next", "text": "Would you like to ride in a bike race? Why?"},
        ],
        "writing_graphemes": ["a-e", "i-e"],
        "writing_words": [],
        "writing_starters": [],

        # Per-book pronunciation notes — surfaced on page 3 (Sounds + Story
        # Words) as a small "Watch Out" callout for the parent.  Used here
        # to explain that 'c' says /s/ before 'e' in race / face / place —
        # the soft-c rule sits alongside the a-e split digraph in this book.
        "pronunciation_notes": [
            {
                "title": "Watch Out — Soft C",
                "body": (
                    "When 'c' comes before 'e' (or 'i' or 'y'), it says /s/ "
                    "instead of /k/.  In this story you'll meet 'race' — "
                    "the 'c' says /s/ because it sits before the silent 'e'."
                ),
                "examples": ["race", "face", "place"],
            },
        ],
    }
}
