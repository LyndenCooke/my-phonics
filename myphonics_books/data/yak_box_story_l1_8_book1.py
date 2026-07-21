"""
The Yak and the Box — Level 1.8 Focus Story
Written 2026-03-04, REVISED 2026-03-04 (assessor fixes)
Focus sounds: x, y, z (building on all prior L1 sounds)

CREATIVE DIRECTION: Global diversity — set in a Himalayan / Central Asian mountain
village. A grandmother and her grandchild with their yak. Visual: snow-capped
mountains, colourful prayer flags, stone houses, bright woven textiles.
The grandmother wears a traditional chuba (Tibetan dress) or shalwar kameez.
The child wears a warm woolly hat and layered clothes.
The yak is the animal co-star — big, fluffy, friendly.

Engagement hooks:
  - Mystery box: what's in the box? (curiosity gap)
  - Physical comedy: yak sits on the box! (repeated tension)
  - Problem-solving: child moves box up high where yak can't reach
  - Emotional arc: curiosity → discovery → mishap → clever fix → triumph

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: yak(y-a-k), box(b-o-x), six(s-i-x), mix(m-i-x),
    fix(f-i-x), zip(z-i-p), zap(z-a-p), big(b-i-g), sit(s-i-t),
    on(o-n), it(i-t), up(u-p), not(n-o-t), in(i-n), got(g-o-t),
    get(g-e-t), did(d-i-d), rug(r-u-g), bun(b-u-n), fig(f-i-g),
    hut(h-u-t), top(t-o-p), set(s-e-t)
  Tricky: I, the, a, no, oh, happy
  REVISED: removed "and" (nd cluster). Gave story a cleverer resolution
  (box on top of hut). New ending: triumph not "I am happy".
"""

YAK_BOX_STORY_BOOK1 = {
    "L1_8_B1": {
        "level": 1,
        "sub_level": "L1.8",
        "book_number": 1,
        "book_title": "The Yak and the Box",
        "focus_graphemes": ["x", "y", "z"],  # L1.8 focus sounds
        "character_id": None,  # No roster character — custom mountain village child
        "character_name": "Child in a mountain village with a yak",
        "story_pages": [
            {"text": "I am with a yak. The yak is big!", "image": None},
            {"text": "I get a box. Six figs in the box. I zip it up.", "image": None},
            {"text": "The yak sat on the box! No, no!", "image": None},
            {"text": "I fix the box. I set it on top of the hut.", "image": None},
            {"text": "The yak can't get it! I will get the six figs.", "image": None},
            {"text": "I toss a fig. The big yak gets a fig. Yum!", "image": None},
        ],
        "story_words": ["yak", "box", "six", "zip", "fix", "fig", "hut", "set", "top"],
        "tricky_words_used": ["I", "the", "no"],  # 'with' de-listed (Lynden 2026-07-15: not tricky — th previewed on the Future Sounds band); "can't" replaces "cannot" (2026-07-15, apostrophe is spelling not a sound); 'a' treated as decodable; 'have', 'oh' removed via rewrites
        "read_words": ["fox", "yak", "zip", "mix"],  # Focus on x, y, z
        "nonsense_words": [
            "yad", "yud", "yem", "yig",  # y onset
            "zod", "zem", "zub", "zeg",  # z onset
            "dex", "nox", "vix", "vux",  # x in coda
        ],
        "questions": [
            {"category": "Finding", "text": "What was in the box?"},
            {"category": "Thinking", "text": "Why did the child put the box on the hut?"},
            {"category": "Words", "text": "What is a yak?"},
            {"category": "What next", "text": "Have you ever seen a yak?"},
        ],
        "writing_graphemes": ["x", "y", "z"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
