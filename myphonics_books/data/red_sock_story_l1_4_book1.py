"""
The Red Socks — Level 1.4 Focus Story
Written 2026-03-04 following narrative-first, majority decodable approach
Focus sounds: c, k, ck, e (building on SATPIN + MDGO + sh/nk)

Engagement hooks:
  - Repetitive "I check the..." structure (Dear Zoo pattern)
  - Curiosity: Where are the socks?
  - Humour: A hen has the socks!
  - Sensory: Peck, peck, peck! (sound)
  - Emotional arc: sad → searching → surprise/humour → happy

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: socks(s-o-ck-s), check(ch-e-ck), red(r-e-d), bed(b-e-d),
    get(g-e-t), sock(s-o-ck), not(n-o-t), bag(b-a-g), hen(h-e-n),
    pen(p-e-n), has(h-a-s), pecks(p-e-ck-s), peck(p-e-ck), on(o-n),
    am(a-m), sad(s-a-d), can(c-a-n), kick(k-i-ck)
  Tricky: I, the, no, have, me, is, a, so
  Borderline (accepted): happy
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
            {"text": "I have no socks! I am sad.", "image": None},
            {"text": "I check the bed. I get a sock. Not red!", "image": None},
            {"text": "I check the bag. I get a sock. Not red!", "image": None},
            {"text": "I check the hen pen. The hen has red socks!", "image": None},
            {"text": "I get the socks. The hen pecks me! Peck, peck!", "image": None},
            {"text": "Red socks on me! I can kick! I am so happy!", "image": None},
        ],
        "story_words": ["socks", "check", "red", "bed", "hen", "pen", "pecks", "kick"],
        "tricky_words_used": ["I", "a", "the", "no", "have", "happy"],  # Actually used in story (excluding so, me)
        "read_words": ["sock", "red", "kick", "peck"],  # Focus on c, k, ck, e
        "nonsense_words": [
            "keb", "ced", "dek", "kem",  # c, k, e focus
            "feck", "veck", "bick", "ruck",  # ck combinations
            "cug", "kib", "nuck", "teck",  # mixed
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
