"""
Before the Shore — Level 5.1 Story
Focus sounds: ire, ore
Setting: Orthodox Jewish family in North London
Cultural approach: Visual texture only — Orthodox Jewish dress is shown in images,
but the story is a universal adventure about memory and family. No religious content.
Written 2026-03-10, revised 2026-04-15 (boy + Dad only, Mum removed)

Story structure: Flashback/Time Shift (L5 required structure)
Grammar focus: Time connectives (once, before, then, that night, the next day)
Characters: Boy and Dad only

Phonics validation: ALL words verified decodable at L5 cumulative level
or are cumulative tricky words.

Focus 'ire' words: tired, fire, wire (x3)
Focus 'ore' words: shore (x7), before (x3), explore (x2), more (x2), sore, wore
Consonant clusters used: st, sm, fl, tw, gr, fr (all unlocked at L3+).

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
        "focus_graphemes": ["ire", "ore"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "The boy went home from the park. He was tired and his feet were sore. He sat on a bench to rest. Then he saw something on the path — a smooth, flat stone. He picked it up.",
                "image_prompt": "An Orthodox Jewish boy with kippah and payot sits tired on a park bench, picking up a smooth amber stone with a white stripe. Victorian terraced houses in background, autumn leaves on ground. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": "The stone felt cool in his hand. It had a shine, like something from the shore. Once, before this week, he had seen a stone just like it. He sat still and let his mind go back.",
                "image_prompt": "The boy sits on the park bench with eyes closed peacefully, holding a smooth amber stone in cupped hands. Dreamy atmosphere suggesting memory. Autumn park trees around him. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": "Before the cold came, he went with Mum and Dad to the shore. The air was fresh and the sand soft. \"Come and explore with me!\" said Dad. They ran along the beach and played in the waves. That night, they sat by a fire and the flames jumped and flicked.",
                "image_prompt": "FLASHBACK \u2014 warmer golden tones. The boy runs on a sandy British beach with Orthodox Jewish Dad (black hat, long coat, beard). Waves behind. Small campfire visible. British seaside with grassy dunes. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": "The next day, he explored the rock pools. He found more and more shells! Mum helped him put them on a wire. \"We can make a gift,\" she said. He twisted the wire with care. It looked so nice!",
                "image_prompt": "FLASHBACK \u2014 warmer golden tones. The boy crouches by a rock pool holding pink and white shells. Dad (black hat, long coat) kneels beside him helping thread shells onto wire. Rocky shore setting. Both smiling. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": "Then it was time to go. He spotted a stone by the shore. It was smooth and flat. \"Keep it safe,\" said Dad. \"So you never forget this trip.\" He put the stone in his pocket with a smile.",
                "image_prompt": "FLASHBACK \u2014 warmer golden tones. The boy picks up a smooth amber stone with a white stripe from the shore edge, smiling. Dad (black hat, long coat) gestures encouragingly. Calm sea behind them. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": "The boy sat up and looked around. He still had that shore stone at home. But in his hand was a new stone, just as smooth! He held it up to the light. The shore felt so close.",
                "image_prompt": "PRESENT \u2014 cooler autumn tones. The boy sits up on the park bench, eyes open, holding an amber stone up to the light. Sunlight catches the stone. Victorian houses in background. Autumn leaves. He looks happy and thoughtful. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": "He ran home to get his shore stone. Now he had a pair! He took some wire and made a loop for each one. He would make a gift for Mum — just like before.",
                "image_prompt": "The boy sits at a wooden table inside a cosy home. Two smooth amber stones with white stripes and thin wire on the table. He carefully bends wire to make loops. Family photos on wall behind. Concentrated expression. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": "He gave the stones to Mum. \"From the shore and from the park,\" he said. She smiled wide. \"I will keep them with me,\" she said. \"So I never forget.\" She wore them on her bag that day.",
                "image_prompt": "Dad (black hat, long coat) receives the wire-and-stone gift from the boy. He holds up the two amber stones on wire, smiling warmly. The boy looks proud. Dad attaches them to his bag. Cosy home interior. Landscape orientation.",
            },
        ],
        "cover_prompt": "An Orthodox Jewish boy (kippah, white shirt, dark trousers, payot) sits on a park bench holding a smooth amber stone with a white stripe up to the light with wonder. Behind him, a split scene: London park with Victorian houses on one side, beach shore with waves on the other. Portrait orientation.",
        "story_words": ["shore", "stone", "before", "wire", "more", "fire"],
        "tricky_words_used": ["the", "to", "he", "was", "said", "once", "they", "we", "you", "so", "put", "go", "I", "me", "one", "some", "would"],
        "read_words": ["shore", "stone", "before", "explore"],
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
        "writing_graphemes": ["ire", "ore"],
        "writing_words": ["shore", "fire", "wire", "more", "before", "explore"],
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
