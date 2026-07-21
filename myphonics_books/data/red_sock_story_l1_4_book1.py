"""
The Red Socks — Level 2.1 Focus Story (renders as new-scheme L2 "First Sounds")
Story text revised 2026-06-19: simpler, controlled, fully decodable at L2;
forced "kicking" ending removed; "me" removed (not an L2 tricky word); the
search verb "check" (which needs the "ch" digraph, a LEVEL 3 sound) replaced
with the "Is it ... ?" question structure, using "is" — a Level 2 tricky word.
Focus sounds: c, k, ck, e

Engagement hooks:
  - Repetitive "Is it ...?" search structure (Dear Zoo pattern)
  - Curiosity: Where are the red socks?
  - Humour: a hen has the socks!
  - Sensory: Peck, peck! (sound)
  - Emotional arc: sad (socks missing) → searching → found with the hen →
    socks back → no longer sad

Word validation (Level 2 cumulative graphemes + tricky words) — every word
in the story is now either decodable at L2 or an L2 tricky word:
  Decodable: red(r-e-d), socks(s-o-ck-s), sad(s-a-d), it(i-t), on(o-n),
    bed(b-e-d), sock(s-o-ck), not(n-o-t), in(i-n), bag(b-a-g), hen(h-e-n),
    pen(p-e-n), get(g-e-t), peck(p-e-ck), am(a-m), a(a)
  Tricky: I, the (taught L1); no, is (new at L2)
"""

RED_SOCK_STORY_BOOK1 = {
    "L1_4_B1": {
        "level": 1,
        "sub_level": "L1.4",
        "book_number": 1,
        "book_title": "The Red Socks",
        "focus_graphemes": ["c", "k", "ck", "e"],  # L1.4 focus sounds
        "character_id": "CHAR-C",
        "character_name": "Black British girl (smart casual)",
        "story_pages": [
            {"text": "No red socks. I am sad.", "image": None},
            {"text": "Is it on the bed? A sock. Not red.", "image": None},
            {"text": "Is it in the bag? A sock. Not red.", "image": None},
            {"text": "Is it in the hen pen? Red socks!", "image": None},
            {"text": "I get the red socks. Peck, peck!", "image": None},
            {"text": "Red socks on. I am not sad.", "image": None},
        ],
        "story_words": ["socks", "red", "bed", "bag", "hen", "pen", "peck", "get", "sad", "not"],
        "tricky_words_used": ["I", "the", "no", "is"],  # 'a'/'it'/'in'/'on' decodable at L2; 'is' new tricky at L2
        "read_words": ["sock", "neck", "kick", "peck"],  # Focus on c, k, ck, e (b/r/f/v/u untaught yet)
        "nonsense_words": [
            "ket", "ced", "dek", "kem",  # c, k, e focus
            "seck", "meck", "gick", "dack",  # ck combinations
            "cag", "kod", "nack", "teck",  # mixed
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the child find the red socks?"},
            {"category": "Thinking", "text": "Why did the hen peck?"},
            {"category": "Words", "text": "What is a hen pen?"},
            {"category": "What next", "text": "Have you ever lost your socks?"},
        ],
        "writing_graphemes": ["c", "k", "ck", "e"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
