"""
The Jam Jug — Level 1.7 Focus Story
Written 2026-03-04, REVISED 2026-03-04 (assessor fixes)
Focus sounds: j, v, w (building on all prior L1 sounds)

CREATIVE DIRECTION: Global diversity — set in a vibrant North African / Middle Eastern
outdoor market (souk). A boy helps his dad at their jam stall. Visual: colourful
market canopy, woven rugs, clay jugs of jam, a van parked behind the stall.
No child character from roster — this is a NEW boy in traditional clothing
(white thobe / dishdasha with embroidered cap). Dad in similar traditional dress.
This book introduces children to a different cultural setting through images.

Engagement hooks:
  - Repetitive "I dip in..." tasting structure
  - Physical comedy: jam on the rug!
  - Sensory: different jam flavours (fig jam, etc.)
  - Problem-solving: clean up with a wet rag
  - Emotional arc: excitement → accident → worry → fix → pride

Word validation (L1 cumulative graphemes + tricky words):
  Decodable: jam(j-a-m), jug(j-u-g), van(v-a-n), vat(v-a-t),
    wet(w-e-t), win(w-i-n), rug(r-u-g), fig(f-i-g), big(b-i-g),
    tip(t-i-p), dip(d-i-p), mop(m-o-p), it(i-t),
    up(u-p), on(o-n), in(i-n), dad(d-a-d), got(g-o-t)
  Tricky: I, the, a, no, oh, happy
  REVISED: removed "wag" (nonsensical), "jab" (aggressive). Added "vat" for v coverage.
"""

JAM_JUG_STORY_BOOK1 = {
    "L1_7_B1": {
        "level": 1,
        "sub_level": "L1.7",
        "book_number": 1,
        "book_title": "The Jam Jug",
        "focus_graphemes": ["j", "v", "w"],  # L1.7 focus sounds
        "character_id": None,  # No roster character — custom market boy
        "character_name": "Boy in white thobe at a market",
        "story_pages": [
            {"text": "Dad has a van. The van has jam in big jugs.", "image": None},
            {"text": "I dip in a jug. Fig jam! It is yum!", "image": None},
            {"text": "I dip in a jug. Red jam! It is yum!", "image": None},
            {"text": "The jug tips! Jam on the rug! No!", "image": None},
            {"text": "I get a wet rag. I mop it up.", "image": None},
            {"text": "No jam on the rug! I did it! I hug Dad.", "image": None},
        ],
        "story_words": ["jam", "jug", "van", "wet", "win", "rug", "fig", "dip", "vat"],
        "tricky_words_used": ["I", "the", "no"],  # 'a' treated as decodable; 'oh' removed via rewrite
        "read_words": ["jug", "van", "web", "wig"],  # Focus on j, v, w
        "nonsense_words": [
            "jod", "jev", "jup", "jig",  # j onset
            "vob", "vem", "vud", "vig",  # v onset
            "wob", "wem", "wud", "wib",  # w onset
        ],
        "questions": [
            {"category": "Finding", "text": "What was in the big jugs?"},
            {"category": "Thinking", "text": "Why did the jam spill on the rug?"},
            {"category": "Words", "text": "What does 'dip' mean here?"},
            {"category": "What next", "text": "What is your favourite jam?"},
        ],
        "writing_graphemes": ["j", "v", "w"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
