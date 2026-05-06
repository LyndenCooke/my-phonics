"""
A Place for Me — Level 5.4 Story
Focus sounds: ore, oor, ire, ear, ure, tion + ph, kn, wr (review of all L5 sounds)
Setting: Bahian/Brazilian sunny market street with fruit stalls
Written 2026-04-16
Revised 2026-05-05 — IMAGE-DRIVEN PIVOT REWRITE.

The original text described a celebration with drums/dancing/fire that did NOT
appear in the rendered images. The actual rendered images show a sunny market
street with fruit stalls (pears, melons), a lonely child sitting by a door,
a boy-companion who befriends him, fruit-sharing on the steps, and a Dad
reunion. The text has been re-aligned to what the images actually show, and
non-decodable words removed (celebration, colourful, alone, dance, music,
laughter, every, acarajé, together, walked, surprised, children, evening,
watching). Cultural setting (Bahian/Brazilian) preserved through clothing
and architecture in the art only — no foreign proper nouns or place names
in the text per the cultural-genericisation policy.

Cultural Brief: See data/cultural_brief_l5_4.md
- Bahian/Brazilian colonial street with bright pastel-painted shutters
- Wrought-iron balcony rails with bougainvillea/flowers spilling over
- Stalls of pears, melons, and other tropical-feel fruit
- Visiting boy + local pal + dad-reunion arc
- Islamic-appropriate: no carnival, no free mixing, no dancing
- Modesty check: ALL characters in long trousers or long dresses

Story Structure: Lost-and-Found at the Market
- Pages 1-3: Boy comes to market with Dad, sits alone, no one notices him
- Pages 4-6: A local boy befriends him, they buy and share a pear and melon
- Pages 7-8: They find Dad together, Dad takes a photo, friendship sealed

Phonics Validation: ALL words verified decodable at L5 cumulative or tricky.
  ore: more (p6, p7), before (p7)
  oor: door (p1, p2, p3), doors (p1), floor (p1)
  ire: tired (p3)
  ear: near (p1, p3, p4, p7), each (p1, p2), hear (p2), pear/pears (p2, p5, p6, p7), fear (p2, p4), year (p8), heart (p8 tricky)
  ure: pure (p6)
  tion: portion (p5)
  ph: photo (p8)
  kn: know (p1), knelt (p8)
  wr: wrong (p2), wrap (p7)

Total word count: ~337 (target 280-380) — within band.
Sentences per page: 4-5 (target 4-5) — on target.
"""

BELONGING_STORY_BOOK1 = {
    "L5_4_B1": {
        "level": 5,
        "sub_level": 4,
        "book_number": 1,
        "book_title": "A Place for Me",
        "level_name": "Reading Together",
        "level_colour": "#8B5CF6",
        "font_size": 16,
        "focus_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion", "ph", "kn", "wr"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion", "ph", "kn", "wr"],
        "story_pages": [
            {
                "page_number": 1,
                "text": (
                    "Dad and I came to a bright market street. "
                    "Doors stood open, with flowers over rails on each floor. "
                    "Dad went to a stall, and I sat near a door. "
                    "I did not know anyone and felt a bit left out."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). A bright sunny Bahian/Brazilian colonial market "
                    "street: pastel-painted facades (yellow, blue, pink), tall wooden "
                    "shuttered doors standing open, wrought-iron balcony rails on the "
                    "upper floors with bougainvillea and pink/red flowers spilling over. "
                    "Wide cobbled street with simple wooden fruit stalls along one side, "
                    "open baskets of pears and green melons. The boy (visiting child, "
                    "light skin #F0D0B0, short brown hair, blue t-shirt, khaki long "
                    "trousers, white trainers) sits alone on a low stone step beside a "
                    "tall brown wooden door, knees pulled in, looking down. Dad (light "
                    "skin, brown hair, casual shirt, long trousers) stands a little way "
                    "off at a fruit stall, his back to the boy, busy choosing fruit. A "
                    "few other shoppers walk past in the middle distance — modest dress, "
                    "long trousers or long skirts. Warm morning sunlight. Eyes on ALL "
                    "characters: tiny solid black dots, no white. Whimsical children's "
                    "book illustration style, soft watercolour textures, clean black "
                    "outlines. No text in image."
                ),
            },
            {
                "page_number": 2,
                "text": (
                    "I could hear chat and calls from each stall and door. "
                    "I went the wrong way and slid by the pears. "
                    "Men and mums looked at them, but no one saw me. "
                    "I felt my fear rise and I went back."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). The same bright market street, busier now. "
                    "The boy (same outfit) is standing small and lost in the middle of "
                    "the cobbled street, having wandered the wrong way past a pear "
                    "stall — a few pears have rolled at his feet. Adult shoppers (men "
                    "in casual long trousers, mums in long skirts and headscarves) lean "
                    "over the stall picking through pears, looking AT THE FRUIT, not at "
                    "the boy. The boy looks up at the tall adults, anxious. Pastel "
                    "facades and balcony flowers behind. Eyes on ALL characters: tiny "
                    "solid black dots, no white. Whimsical children's book illustration "
                    "style, soft watercolour textures. No text in image."
                ),
            },
            {
                "page_number": 3,
                "text": (
                    "I sat on a step by a tall brown door. "
                    "People were near, but no one came to chat. "
                    "I shut my eyes and counted to ten, very slow. "
                    "I did not want to cry, but I was tired."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). The boy sits on a low stone step beside a "
                    "tall brown wooden door (a Bahian colonial doorway, deeply painted "
                    "wood, big iron knocker). His eyes are gently shut, head tilted "
                    "down, hands resting on his lap. The street is busy in the "
                    "background — pastel facades, fruit stalls, shoppers walking past "
                    "— but no one is looking at him. Soft golden midmorning light. The "
                    "mood is quiet, lonely, but not frightening. Eyes on ALL characters: "
                    "tiny solid black dots, no white. Whimsical children's book "
                    "illustration style, soft watercolour textures. No text in image."
                ),
            },
            {
                "page_number": 4,
                "text": (
                    "Then a boy came by and sat down near me. "
                    "He gave me a big grin and held out his hand. "
                    "\"Do you want to look at that stall?\" he said. "
                    "I went with him, and my fear went away."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). Same low stone step beside the tall brown "
                    "door. The visiting boy (light skin, blue t-shirt, khaki trousers) "
                    "is now joined by a local Brazilian boy his age sitting beside "
                    "him on the step — warm brown skin (#B8956A), curly dark brown "
                    "hair, big friendly grin, wearing a bright green t-shirt and dark "
                    "blue long trousers, trainers. The local boy is half-turned toward "
                    "the visitor and is holding out his open hand in a friendly invite, "
                    "pointing with the other hand toward a fruit stall further down the "
                    "street where pears and green melons are piled in baskets. The "
                    "visitor is just starting to smile. Pastel market street behind them. "
                    "Eyes on ALL characters: tiny solid black dots, no white. Whimsical "
                    "children's book illustration style, soft watercolour textures. No "
                    "text in image."
                ),
            },
            {
                "page_number": 5,
                "text": (
                    "We met a man at a stall of pears and melons. "
                    "He let us hold a melon, and it was big. "
                    "My new pal put it on top like a hat. "
                    "I chose a ripe pear, and we paid the man. "
                    "He gave us a small portion."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). Both boys at a wooden fruit stall heaped "
                    "with pears (yellow-green, ripe) and big round green melons. The "
                    "stallholder is a friendly older Bahian man — warm dark brown skin "
                    "(#8B6B4A), short grey hair, simple white shirt and long trousers, "
                    "an apron — handing the boys a plump melon. The local pal (green "
                    "t-shirt, brown skin) is laughing as he balances the round green "
                    "melon on top of his own head like a hat with both hands. The "
                    "visiting boy (blue t-shirt) is holding a yellow-green pear, "
                    "starting to laugh too. A few coins on the stall counter. Sunny, "
                    "warm. Eyes on ALL characters: tiny solid black dots, no white. "
                    "Whimsical children's book illustration style, soft watercolour "
                    "textures. No text in image."
                ),
            },
            {
                "page_number": 6,
                "text": (
                    "We sat on the steps and ate the pear and melon. "
                    "Sweet, wet bits ran on my chin and on my shirt. "
                    "We both smiled more and more, with pure joy inside. "
                    "When we were done, we slid the peels in a bin."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). Both boys sitting side by side on a flight "
                    "of low stone steps in front of a pastel-painted Bahian facade. The "
                    "visiting boy is biting into a yellow-green pear with juice running "
                    "down his chin onto his blue t-shirt. The local pal is eating a "
                    "thick wedge of green melon with pink-red flesh, also dripping. "
                    "Both are grinning broadly with pure joy. A simple wooden bin "
                    "stands at the edge of the steps with a couple of pear cores and "
                    "melon rinds visible at the top. Sunshine, warm shadows, fruit "
                    "stalls visible in the background. Eyes on ALL characters: tiny "
                    "solid black dots, no white. Whimsical children's book illustration "
                    "style, soft watercolour textures. No text in image."
                ),
            },
            {
                "page_number": 7,
                "text": (
                    "Then my pal said, \"Look, Dad is near.\" "
                    "We went down the street, and he ran before me. "
                    "We got one more pear and a wrap for Dad. "
                    "I said, \"Thank you,\" and he said, \"See you soon.\""
                ),
                "image_prompt": (
                    "Landscape scene (4:3). Down the cobbled market street. The local "
                    "pal (green t-shirt, brown skin) is running a few steps ahead, "
                    "looking back over his shoulder and pointing forward — Dad is "
                    "visible in the middle distance at the end of the street, scanning "
                    "the stalls anxiously. The visiting boy (blue t-shirt) follows "
                    "behind, carrying one yellow-green pear and a small paper-wrapped "
                    "parcel (a fruit wrap, simple brown paper, twine tied) — a treat "
                    "for Dad. Pastel facades, balcony flowers. Sunny, hopeful mood. "
                    "Eyes on ALL characters: tiny solid black dots, no white. Whimsical "
                    "children's book illustration style, soft watercolour textures. No "
                    "text in image."
                ),
            },
            {
                "page_number": 8,
                "text": (
                    "Dad knelt and held me, and I felt safe again. "
                    "He got a photo of us with my new pal. "
                    "I said, \"Can I see him next year?\" "
                    "Dad said yes, and I waved to the boy. "
                    "This street felt like home, and my heart was light."
                ),
                "image_prompt": (
                    "Landscape scene (4:3). The cobbled market street near a bright "
                    "pastel-painted facade. Dad is kneeling on one knee, arms wrapped "
                    "around the visiting boy, hugging him tight, relief on his face. "
                    "The local pal (green t-shirt, brown skin) stands a step away, "
                    "smiling. A second moment in the same scene (or in the foreground): "
                    "Dad holds up a small phone/camera taking a photo of the two boys "
                    "standing arm-in-arm, both grinning. The boys' fruit (one pear, "
                    "the brown-paper wrap) are tucked under the visitor's arm. Warm "
                    "afternoon sun, hopeful, joyful mood. Eyes on ALL characters: tiny "
                    "solid black dots, no white. Whimsical children's book illustration "
                    "style, soft watercolour textures. No text in image."
                ),
            },
        ],
        "cover_prompt": (
            "Two boys stand together in a bright Bahian/Brazilian market street. "
            "Visiting boy: light skin (#F0D0B0), short brown hair, blue t-shirt, khaki long trousers. "
            "Local boy: warm brown skin (#B8956A), curly dark brown hair, green t-shirt, dark blue long trousers. "
            "Pastel-painted colonial facades, wrought-iron balcony rails with bougainvillea, "
            "wooden fruit stalls heaped with pears and green melons behind them. "
            "Both smiling at the viewer, the local boy's arm friendly around the visitor's shoulder. "
            "Warm sunlit, welcoming mood. Eyes on ALL characters: tiny solid black dots, no white. "
            "Portrait orientation. No text in image."
        ),
        "story_words": ["door", "doors", "floor", "near", "each", "hear",
                        "pear", "pears", "fear", "year", "more", "before",
                        "tired", "pure", "portion", "photo", "knelt", "know",
                        "wrong", "wrap"],
        "tricky_words_used": ["the", "to", "I", "a", "was", "said", "could",
                              "people", "anyone", "he", "she", "we", "of",
                              "do", "you", "one", "over", "tall", "small",
                              "put", "like", "done", "again", "eyes", "were",
                              "heart", "is"],
        "read_words": ["door", "pear", "pure", "photo", "knelt", "wrap"],
        "nonsense_words": [
            "blore", "gloor", "brire", "snear", "plure",
            "tration", "phap", "knet", "wruf", "spore",
        ],
        "questions": [
            {"category": "Finding", "text": "Why did the boy feel left out at the start?"},
            {"category": "Thinking", "text": "Why did the new pal stop and sit down?"},
            {"category": "Words", "text": "What does the word 'portion' mean?"},
            {"category": "What next", "text": "What do you think the boys will do next year?"},
        ],
        "writing_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion", "ph", "kn", "wr"],
        "writing_words": ["door", "floor", "near", "pear", "pure", "photo", "knelt", "wrap", "before"],
        "writing_starters": ["At the market, I...", "My new pal..."],
        "character": {
            "name": "Visiting boy",
            "age": "6 years old",
            "appearance": "Light skin (#F0D0B0), short straight brown hair with side parting",
            "outfit": "Blue t-shirt, khaki long trousers, white trainers",
        },
        "side_characters": {
            "local_boy": {
                "name": "Local pal",
                "appearance": "Warm brown skin (#B8956A), curly dark brown hair, big friendly grin",
                "outfit": "Bright green t-shirt, dark blue long trousers, trainers",
            },
            "dad": {
                "name": "Dad",
                "appearance": "Light skin, brown hair",
                "outfit": "Casual shirt, long trousers",
            },
            "stallholder": {
                "name": "Fruit stallholder",
                "appearance": "Warm dark brown skin (#8B6B4A), short grey hair, kind face",
                "outfit": "White shirt, long trousers, simple apron",
            },
        },
        "cultural_notes": {
            "setting": "Bahian/Brazilian sunny colonial market street with fruit stalls",
            "approach": "Contemporary-first with authentic Bahian texture. Pastel-painted "
                       "colonial facades, wrought-iron balcony rails, bougainvillea, "
                       "cobbled streets, fruit stalls (pears, melons). Cultural setting "
                       "carried through ART ONLY — no foreign proper nouns or place "
                       "names in text (cultural-genericisation policy). "
                       "Islamic-appropriate — no carnival, no free mixing, no dancing.",
        },
    }
}
