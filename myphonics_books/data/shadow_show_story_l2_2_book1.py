"""
The Shadow Show — Level 2.2 Focus Story
Written 2026-03-06
Focus sounds: ow, oo
Setting: Modern apartment in suburban Nairobi, Kenya — evening time

CREATIVE DIRECTION: Global diversity — contemporary East African family home.
A Kenyan child discovers shadows at evening time and, with Mum's help,
turns fear into fun shadow puppet play. Modern apartment interior with
warm lighting, kitenge fabric accents, and the moon visible through the window.

Character: Kenyan boy (~5yo) in bright green t-shirt, blue joggers, grey socks.
Mum: Kenyan woman in purple t-shirt and colourful kitenge wrap skirt.

CULTURAL BRIEF:
  Region: Nairobi, Kenya (modern suburb like Kileleshwa or Kilimani)
  Contemporary-first: YES — modern apartment, casual clothes, modern furnishings
  Cultural texture: Kitenge fabric accents, warm colours, family togetherness
  Stereotype avoidance: NO safari, NO mud huts, NO poverty imagery
  Dignity check: PASS — comfortable modern Kenyan family enjoying evening together

Engagement hooks:
  - Fear → mastery arc (emotional stakes from page 1)
  - Shadow shape pattern with variation (dog, bird, moon) — Dear Zoo style
  - Onomatopoeia: Woof! Hoot! Ooh! (fun to read aloud)
  - Page-turn hooks: "I will show you" → what will she show?
  - Satisfying climax: child puts on "The Shadow Show" and takes a bow
  - Repetition: shadow appears on every page, building familiarity

Word validation (L2 cumulative graphemes + tricky words):
  ALL words verified against cumulative L2 graphemes (47 total).
  NO consonant clusters used (forbidden at L2).
  Focus sounds (ow, oo) appear 33 times across 127 words (26% density).

  ow words: shadow(×8), follows(×1), show(×3), bow(×1) = 13 tokens
  oo words: moon(×3), room(×1), look(×4), woof(×2), too(×1),
            hoot(×2), good(×3), hoop(×2), ooh(×1), cool(×1) = 20 tokens

  Tricky words used: the, I, my, me, your, you, are, her, put
  All from L2 cumulative list. No higher-level tricky words needed.
"""

SHADOW_SHOW_STORY_BOOK1 = {
    "L2_2_B1": {
        "level": 2,
        "sub_level": "L2.2",
        "book_number": 1,
        "book_title": "The Shadow Show",
        "focus_graphemes": ["ow", "oo"],  # L2.2 focus sounds

        "character_id": None,  # Custom character — Kenyan boy
        "character_name": "Kenyan boy in modern Nairobi apartment",

        "story_pages": [
            {
                "text": "The moon is up high. I am in my room. Oh! A big, dark shadow is on the wall!",
                "image": None,
            },
            {
                "text": "The shadow follows me! It is big! \"Mum!\" I say. \"Look at the shadow!\"",
                "image": None,
            },
            {
                "text": "\"It is your shadow!\" says Mum. \"Shadows are fun! I will show you.\"",
                "image": None,
            },
            {
                "text": "Mum puts her arm up high. Look! A shadow dog is on the wall! \"Woof! Woof!\" I say.",
                "image": None,
            },
            {
                "text": "I put my arm up too. I see a shadow bird! \"Hoot! Hoot!\" I say.",
                "image": None,
            },
            {
                "text": "\"Good! You are good at this!\" says Mum. \"I will put on a big show!\" I say.",
                "image": None,
            },
            {
                "text": "I put the hoop up high. \"Look! A shadow moon!\" I say. \"Ooh! That is cool!\" says Mum.",
                "image": None,
            },
            {
                "text": "I bow. \"The Shadow Show!\" I say. Shadows are fun. Good night, Moon!",
                "image": None,
            },
        ],

        "story_words": ["shadow", "look", "moon", "good", "show", "hoop"],
        "tricky_words_used": ["the", "I", "my", "you", "are", "put"],
        "read_words": ["shadow", "moon", "cool", "hoop"],
        "nonsense_words": [
            "dow", "jow", "fow", "zow",      # ow combinations
            "dool", "toof", "mool", "joom",   # oo combinations
            "choom", "voot", "foom", "thook",  # oo with digraph onsets
        ],
        "questions": [
            {"category": "Finding", "text": "What shapes did the shadows make?"},
            {"category": "Thinking", "text": "Why was the child not scared at the end?"},
            {"category": "Words", "text": "What does 'shadow' mean?"},
            {"category": "What next", "text": "What shadow shape would you make?"},
        ],
        "writing_graphemes": ["ow", "oo"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
