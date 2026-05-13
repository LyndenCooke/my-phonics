"""
Fox Fell Off! — Level 1.6 Focus Story
Written 2026-03-04 following narrative-first, majority decodable approach
Focus sounds: f, l, ff, ll (building on all prior L1 sounds)

CREATIVE DIRECTION: Animal protagonist with child as observer/helper.
This breaks the "child searches for something" pattern of earlier books.
The child still appears in all images (for personalisation swap).

Engagement hooks:
  - Repetitive "Fox fell off the..." structure (slapstick pattern)
  - Physical comedy: Fox keeps falling!
  - Curiosity: Will Fox fall again?
  - Problem-solving: Child gets a mat to help
  - Emotional arc: amusement → concern → problem-solving → triumph

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: fox(f-o-x), fell(f-e-ll), off(o-ff), log(l-o-g),
    wall(w-a-ll), hill(h-i-ll), get(g-e-t), big(b-i-g), fat(f-a-t),
    mat(m-a-t), sit(s-i-t), it(i-t), did(d-i-d), not(n-o-t),
    on(o-n), fall(f-a-ll), am(a-m), hug(h-u-g)
  Tricky: I, the, a, have, is, oh, happy
  Borderline (accepted): oh, happy
"""

FOX_FELL_STORY_BOOK1 = {
    "L1_6_B1": {
        "level": 1,
        "sub_level": "L1.6",
        "book_number": 1,
        "book_title": "Fox Fell Off!",
        "focus_graphemes": ["f", "l", "ff", "ll"],  # L1.6 focus sounds
        "character_id": "CHAR-K",
        "character_name": "White British girl (pet owner)",
        "story_pages": [
            {"text": "I am with a fox. Fox is on a log.", "image": None},
            {"text": "Fox fell off the log!", "image": None},
            {"text": "Fox is on a rock. Fox fell off the rock!", "image": None},
            {"text": "Fox is on a hill. Fox fell off the hill!", "image": None},
            {"text": "I get a big, fat mat. Sit on it, Fox!", "image": None},
            {"text": "Fox is on the mat! Fox did not slip off! I hug Fox!", "image": None},
        ],
        "story_words": ["fox", "fell", "off", "log", "rock", "hill", "slip", "mat"],
        "tricky_words_used": ["I", "the"],  # 'a' treated as decodable; 'have', 'oh', 'wall', 'fall' removed via rewrites
        "read_words": ["fill", "fell", "huff", "doll"],  # Focus on f, l, ff, ll
        "nonsense_words": [
            "feg", "lod", "fep", "lig",  # f, l single letter focus
            "hiff", "noff", "wiff", "deff",  # ff combinations
            "mell", "sull", "nill", "boll",  # ll combinations
        ],
        "questions": [
            {"category": "Finding", "text": "What did Fox keep falling off?"},
            {"category": "Thinking", "text": "Why did the child get a mat?"},
            {"category": "Words", "text": "What does 'fell off' mean?"},
            {"category": "What next", "text": "Have you ever fallen off something?"},
        ],
        "writing_graphemes": ["f", "l", "ff", "ll"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
