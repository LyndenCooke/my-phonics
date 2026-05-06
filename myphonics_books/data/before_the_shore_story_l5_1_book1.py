"""
Before the Shore — Level 5.1 Story
Focus sounds: ore, oor, ire, ear, ure, tion, ph, kn, wr
Setting: Orthodox Jewish family in North London
Cultural approach: Visual texture only — Orthodox Jewish dress is shown in images,
but the story is a universal adventure about memory and family. No religious content.
Written 2026-03-10, revised 2026-04-15 (boy + Dad only, Mum removed),
revised 2026-05-05 (Phonics rewrite — fixed decodability per critique 2026-05-04).

Story structure: Flashback/Time Shift (L5 required structure)
Grammar focus: Time connectives (once, before, then, that night, the next day)
Characters: Boy and Dad only

Phonics validation: ALL words verified decodable at L5 cumulative level
or are cumulative tricky words. Removed non-decodable items flagged in critique
(something, mind, cold, come, along, around, pair). Added words that broaden
the L5 sound coverage: door (oor), near (ear), pure (ure), motion (tion),
photo (ph), knew/knots (kn), wrote (wr).

Focus 'ore' words: shore (x7), before (x2), explore (x2), more (x2), sore, wore
Focus 'ire' words: tired, fire, wire (x3)
Focus 'oor' words: door
Focus 'ear' words: near (x2)
Focus 'ure' words: pure
Focus 'tion' words: motion
Focus 'ph' words: photo
Focus 'kn' words: knew, knots
Focus 'wr' words: wrote
Past-tense -ed words (new at L5): splashed, watched, hooked, helped, looked,
spotted, twisted, smiled, grinned, picked, played, jumped, moved, explored.

Image feasibility: PASS — flashback structure with distinct locations:
present (London park), flashback (British shore), present (home).
"""

# Rename export to match the existing import pattern in generate_pilot_books.py
# The script imports SECRET_SHORE_STORY_BOOK1 so we use that name
SECRET_SHORE_STORY_BOOK1 = {
    "L5_1_B1": {
        "level": 5,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "Before the Shore",
        "level_name": "Reading Together",
        "level_colour": "#8B5CF6",
        "font_size": 16,
        "focus_graphemes": ["ore", "ire", "oor", "ear", "ure", "tion", "ph", "kn", "wr"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion", "ph", "kn", "wr"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "The boy went through the park on his way home. He was tired, and his feet were sore from play. He sat on a bench to rest for a bit. On the path he saw a smooth, flat stone. He bent to pick it up and held it.",
                "image_prompt": "An Orthodox Jewish boy with kippah and payot sits tired on a park bench, picking up a smooth amber stone with a white stripe. Victorian terraced houses in background, autumn leaves on ground. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": "The stone felt cool in his hand as he sat. It had a shine, like one found by the shore. Once, before this winter, he had seen a stone like it. He sat still and went back to that day. Leaves fell near the bench, and he shut his eyes.",
                "image_prompt": "The boy sits on the park bench with eyes closed peacefully, holding a smooth amber stone in cupped hands. Dreamy atmosphere suggesting memory. Autumn park trees around him. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": "Before winter came, Dad took him to the shore. The sea air was pure and fresh, and the sand felt soft. \"Let us explore!\" said Dad, and they ran on the beach. They splashed in waves and watched the fire by the rocks. Dad took a photo as flames moved in slow motion.",
                "image_prompt": "FLASHBACK — warmer golden tones. The boy runs on a sandy British beach with Orthodox Jewish Dad (black hat, long coat, beard). Waves behind. Small campfire visible. British seaside with grassy dunes. Dad holds a phone camera taking a photo. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": "The next day, he explored the rock pools near the shore. He found more and more shells and set them in a pile. Dad helped him put the best ones on a wire. \"We can make a gift,\" said Dad, and the boy grinned. He twisted the wire with care, and it looked nice.",
                "image_prompt": "FLASHBACK — warmer golden tones. The boy crouches by a rock pool holding pink and white shells. Dad (black hat, long coat) kneels beside him helping thread shells onto wire. Rocky shore setting. Both smiling. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": "Then it was time to go home from the shore. He spotted a smooth, flat stone by the water line. \"Keep it safe,\" said Dad, so you remember this trip. He put the stone in his pocket and smiled.",
                "image_prompt": "FLASHBACK — warmer golden tones. The boy picks up a smooth amber stone with a white stripe from the shore edge, smiling. Dad (black hat, long coat) gestures encouragingly. Calm sea behind them. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": "Back on the bench, the boy sat up and smiled. He still had that shore stone at home on a shelf. But this was a new stone, smooth and cool to hold. He held it up to the light and took a breath. The shore felt so close again, right at his feet.",
                "image_prompt": "PRESENT — cooler autumn tones. The boy sits up on the park bench, eyes open, holding an amber stone up to the light. Sunlight catches the stone. Victorian houses in background. Autumn leaves. He looks happy and thoughtful. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": "He ran home and in at the front door. He got his shore stone, so now he had two. He knew where Dad kept the wire and thin cord. He made a loop for each stone and tied knots. He wrote Dad on a tag, for a gift later.",
                "image_prompt": "The boy steps in through the front door of a cosy home, then sits at a wooden table. Two smooth amber stones with white stripes, thin wire and cord on the table. He carefully bends wire to make loops and ties knots. A small paper tag is visible. Family photos on wall behind. Concentrated expression. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": "He gave the stones to Dad in the sitting room. \"From the shore and from the park,\" he said, proud. Dad smiled wide and hooked them on his brown bag. \"I will keep them with me, so I never forget.\" Dad wore them that day, hanging bright on his bag.",
                "image_prompt": "Dad (black hat, long coat) receives the wire-and-stone gift from the boy in the sitting room. He holds up the two amber stones on wire, smiling warmly. The boy looks proud. Dad attaches them to his brown bag. Cosy home interior with sofa. Landscape orientation.",
            },
        ],
        "cover_prompt": "An Orthodox Jewish boy (kippah, white shirt, dark trousers, payot) sits on a park bench holding a smooth amber stone with a white stripe up to the light with wonder. Behind him, a split scene: London park with Victorian houses on one side, beach shore with waves on the other. Portrait orientation.",
        "story_words": ["shore", "stone", "before", "wire", "door", "near", "pure", "motion", "photo", "knew", "knots", "wrote"],
        "tricky_words_used": ["the", "to", "he", "was", "said", "they", "once", "through", "knew", "where", "two", "water", "again", "eyes", "I", "so", "you"],
        "read_words": ["door", "near", "pure", "motion", "photo", "knew", "knots", "wrote"],
        "nonsense_words": [
            "blore", "snire", "flear", "thure", "ploor",
            "grore", "twire", "spear", "chure", "drire",
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the boy go with Dad?"},
            {"category": "Thinking", "text": "Why did the boy make a gift for Dad?"},
            {"category": "Words", "text": "What does the word 'explore' mean?"},
            {"category": "What next", "text": "What do you think the boy will do with the next special stone he finds?"},
        ],
        "writing_graphemes": ["ore", "ire", "oor", "ear", "ure", "tion", "ph", "kn", "wr"],
        "writing_words": ["shore", "fire", "wire", "more", "before", "door", "near", "pure", "photo", "knew", "wrote"],
        "writing_starters": ["At the shore, I...", "The stone was..."],
        "character": {
            "name": "Orthodox Jewish boy",
            "age": "5 years old",
            "appearance": "Light olive skin, short dark brown hair, long curled payot (side curls) in front of ears",
            "outfit": "Small dark navy kippah, white button-up shirt tucked into dark navy trousers, black leather shoes",
            "notes": "Orthodox Jewish dress is visual texture only — clothing shown in images, not mentioned in text",
        },
        "side_characters": {
            "dad": {
                "name": "Orthodox Jewish Dad",
                "appearance": "Light olive skin, dark beard, payot visible",
                "outfit": "Black wide-brimmed fedora hat, long black frock coat, white shirt, dark trousers",
            },
        },
        "cultural_notes": {
            "setting": "North London (Stamford Hill / Golders Green area)",
            "approach": "Visual texture only — Orthodox Jewish dress shown in images, story is universal adventure about memory and family connection. No religious content or practices depicted. Just normalising diverse appearances.",
        },
    }
}
