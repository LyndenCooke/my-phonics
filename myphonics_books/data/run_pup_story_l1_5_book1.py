"""
Run, Pup, Run! — Level 1.5 Focus Story
Written 2026-03-04 following narrative-first, majority decodable approach
Focus sounds: u, r, h, b (building on SATPIN + MDGO + sh/nk + c/k/ck/e)

Engagement hooks:
  - Repetitive "Run, pup, run!" structure (chase pattern)
  - Curiosity: Where will the pup hide next?
  - Humour: Pup hiding in the tub, getting wet
  - Sensory: Rub, rub, rub! (touch)
  - Emotional arc: excitement → chase → surprise/humour → tenderness → love

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: pup(p-u-p), run(r-u-n), hid(h-i-d), hut(h-u-t),
    bush(b-u-sh), tub(t-u-b), rub(r-u-b), hug(h-u-g),
    big(b-i-g), can(c-a-n), in(i-n), it(i-t), not(n-o-t), and(a-n-d)
  Tricky: I, the, a, have, is, me, happy
  Borderline (accepted): happy
"""

RUN_PUP_STORY_BOOK1 = {
    "L1_5_B1": {
        "level": 1,
        "sub_level": "L1.5",
        "book_number": 1,
        "book_title": "Run, Pup, Run!",
        "focus_graphemes": ["u", "r", "h", "b"],  # L1.5 focus sounds
        "character_id": "CHAR-L",
        "character_name": "Mixed heritage boy (pet owner)",
        "story_pages": [
            {"text": "I have a pup. The pup can run!", "image": None},
            {"text": "Run, pup, run! The pup hid in the hut.", "image": None},
            {"text": "Run, pup, run! The pup hid in the bush.", "image": None},
            {"text": "Run, pup, run! The pup is in the tub!", "image": None},
            {"text": "I rub the pup. Rub, rub, rub!", "image": None},
            {"text": "The pup and me! A big hug!", "image": None},
        ],
        "story_words": ["run", "pup", "hut", "tub", "rub", "hug", "hid"],  # bush moved out 2026-07-13 — u says /uu/ + sh untaught: tricky only, never sound-buttoned
        "tricky_words_used": ["I", "the", "bush"],  # 'bush' uses sh (untaught at L2.2) — flag it; 'a'/'is'/'have' auto-detected from the master list
        "read_words": ["hub", "rub", "hut", "bug"],  # Focus on u, r, h, b
        "nonsense_words": [
            "hup", "rud", "bup", "reb",  # u, r, h, b focus
            "hib", "rup", "hab", "bek",  # mixed with focus sounds
            "gub", "mub", "kub", "dut",  # u combinations (l/v/sh untaught yet)
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the pup hide?"},
            {"category": "Thinking", "text": "Why did the pup run?"},
            {"category": "Words", "text": "What is a hut?"},
            {"category": "What next", "text": "Have you ever played with a puppy?"},
        ],
        "writing_graphemes": ["u", "r", "h", "b"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
