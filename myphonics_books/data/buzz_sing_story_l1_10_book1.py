"""
Buzz and Sing! — Level 1.10 Focus Story
Written 2026-03-04, REVISED 2026-03-04 (3rd pass — clarity fixes)
Focus sounds: ng, qu, ss, zz (building on all prior L1 sounds — FINAL L1 book!)

CREATIVE DIRECTION: Global diversity — set on a lush Caribbean island.
A child sits in a tropical garden full of flowers, buzzing bees, and singing.
Visual: bright hibiscus flowers, palm trees, turquoise sea in background,
colourful wooden house with tin roof, bees, insects.
The child wears a bright yellow sundress with dark navy leggings underneath.
Dark-skinned Caribbean child with short natural hair and big smile.

This is a PROBLEM-SOLVING story: a noisy garden goes quiet, and the child
must bring the sounds back by singing. Real narrative arc with agency.

Engagement hooks:
  - Onomatopoeia: buzz, hiss (fun to read aloud!)
  - Sound pattern builds through pages 1-3
  - PROBLEM: the bugs STOP on page 4 — creates tension
  - Child brings them back by singing (child has agency)
  - Emotional arc: joy → silence → action → sounds return → triumph

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: buzz(b-u-zz), sing(s-i-ng),
    hiss(h-i-ss), song(s-o-ng), long(l-o-ng),
    quick(qu-i-ck), big(b-i-g), bug(b-u-g), bugs(b-u-g-s),
    sit(s-i-t), log(l-o-g), rock(r-o-ck),
    stop(s-t-o-p), and(a-n-d),
    with(w-i-th), sits(s-i-t-s), on(o-n)
  Tricky: I, the, a, no
  REVISED (3rd pass): removed "ring" (doesn't make sense as singing sound),
  removed "hush" (awkward phrasing "It is hush"), removed "Shh".
  Replaced with clearer text: "The bugs stop!" and "I sing and sing!"
"""

BUZZ_SING_STORY_BOOK1 = {
    "L1_10_B1": {
        "level": 1,
        "sub_level": "L1.10",
        "book_number": 1,
        "book_title": "Buzz and Sing!",
        "focus_graphemes": ["ng", "qu", "ss", "zz"],  # L1.10 focus — final L1 sounds!
        "character_id": None,  # No roster character — Caribbean child in tropical garden
        "character_name": "Caribbean child in a tropical garden",
        "story_pages": [
            {"text": "I sit on a big log. Buzz, buzz, buzz!", "image": None},
            {"text": "A big bug sits on a rock. Hiss, hiss, hiss!", "image": None},
            {"text": "I sing a long, long song!", "image": None},
            {"text": "The bugs go! No buzz. No hiss.", "image": None},
            {"text": "I sing quick, quick! I sing and sing!", "image": None},
            {"text": "Buzz! Hiss! I sing with the bugs!", "image": None},
        ],
        "story_words": ["buzz", "sing", "song", "long", "hiss", "quick", "log", "bug", "and"],
        "tricky_words_used": ["I", "the", "no", "go"],  # 'a' decodable; 'go' used on p4 ("The bugs go!")
        "read_words": ["ring", "buzz", "hiss", "king"],  # Focus on ng, zz, ss, qu
        "nonsense_words": [
            "rong", "bung", "ning", "mang",  # ng combinations
            "quob", "quem", "quep", "quag",  # qu onset
            "doss", "tuss", "giss", "nass",  # ss coda
            "mozz", "nuzz", "lizz", "dazz",  # zz coda
        ],
        "questions": [
            {"category": "Finding", "text": "What sounds did the child hear?"},
            {"category": "Thinking", "text": "Why did the child sing quick, quick?"},
            {"category": "Words", "text": "What does 'hiss' sound like?"},
            {"category": "What next", "text": "What sounds can you hear outside?"},
        ],
        "writing_graphemes": ["ng", "qu", "ss", "zz"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
