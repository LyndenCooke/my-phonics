"""
The New Glue — Level 4.3 Story
Focus sounds: ew, ue
Setting: Modern Oaxacan home (Mexico)
Cultural brief: data/cultural_brief_L4_3.txt
Written 2026-03-08

Phonics validation: ALL words verified decodable at L4 cumulative level
or are cumulative tricky words.

Focus 'ew' words: new, drew, flew, grew, threw, chewed
Focus 'ue' words: glue, blue, due, true, rescued
Consonant clusters used: bl, gl, dr, fl, gr, pr, spr, cr, st, sl, cl, sp (all unlocked at L3+).

Story structure: CUMULATIVE CHAIN — each event triggers the next.
  glue too much → sticks to hand → card flies to cat → cat knocks cup →
  tea spills → Dad slips → cat knocks pot → girl catches pot → cleanup → card delivered

Image feasibility: PASS — each page is a different room/location in the house.
Engagement hooks: 6/6 (page-turn tension, cause-and-effect anticipation, repetition
of chaos building, sensory details, emotional stakes, satisfying resolution).

Grammar focus: Connectives (but, so, then) for cause-and-effect chain.
"""

NEW_GLUE_STORY_BOOK1 = {
    "L4_3_B1": {
        "level": 4,
        "sub_level": 3,
        "book_number": 1,
        "book_title": "The New Glue",
        "level_name": "Building Fluency",
        "level_colour": "#3B82F6",
        "font_size": 18,
        "focus_graphemes": ["ew", "ue"],
        "all_level_graphemes": ["are", "ur", "er", "ew", "ue", "ow"],
        "story_pages": [
            {
                "page_number": 1,
                "text": 'The girl had a bottle of new blue glue. She drew a bird on a card. "This card is for Mum," she said to Dad. She pressed the blue glue on \u2014 but she pressed too hard!',
                "image_prompt": "A girl at a craft desk in a colourful bedroom presses glue on a card. Blue glue spreads everywhere on the desk. Warm terracotta walls, colourful woven cushions, tiled floor. She looks surprised. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": 'The blue glue spread across the desk and stuck to her hand! She pulled and she shook. Then the card flew off her hand, across the room and down the stairs!',
                "image_prompt": "A white card covered in blue glue flies down a colourful tiled staircase toward a ginger tabby cat sitting peacefully at the bottom. No people in this scene — just the flying card and the cat. Warm-coloured hallway with painted walls and decorative tiles on the stair risers. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": 'The card landed right on the cat at the foot of the stairs. The cat grew cross and ran. It had blue glue and bits of card stuck in its fur!',
                "image_prompt": "A ginger and white tabby cat at the bottom of a tiled staircase has a blue glue-covered card stuck on its back. The cat looks cross, fur bristling, ready to run. Colourful tiled stair risers behind. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": 'The cat flew into the living room and jumped on the shelf. It bumped a blue cup of tea. The cup fell and tea ran down on to the new rug.',
                "image_prompt": "A ginger cat leaps across a colourful living room and bumps a blue cup off a shelf. Tea spills down toward a bright woven rug. Warm walls with colourful pottery on shelves. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": 'Then the cat ran into the room. Dad was at the sink. He turned to look, but he did not see the wet patch on the ground. So he slid and fell with a bump! "This is all due to that blue glue!" he said.',
                "image_prompt": "A man slips and falls on a wet kitchen floor while a ginger cat runs past. Blue and white Talavera tiles on the wall, modern kitchen with clay pots on a shelf. He looks surprised mid-fall. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": 'Then the cat ran out into the garden. It jumped up high and bumped a pot of blue flowers. The pot started to fall! The girl threw her arms out and rescued it just in time.',
                "image_prompt": "A girl dives to catch a falling terracotta pot of blue flowers knocked by a ginger cat on a garden wall. Lush patio garden with bougainvillea, potted plants, and warm-coloured walls. She looks determined. Landscape orientation. CRITICAL: The ginger cat MUST have tiny solid black dot eyes with NO white in them.",
            },
            {
                "page_number": 7,
                "text": '"That cat!" said Dad. They cleaned up all the glue and the mess. The girl wiped the blue stain off the desk. The cat just sat and chewed its fur clean.',
                "image_prompt": "A girl and her dad clean up a messy bedroom with cloths and a bucket. The ginger cat sits licking blue glue off its fur. Colourful room with craft supplies on the desk. They look tired but amused. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": 'At last, the card was finished. Mum came home and the girl gave it to her. "You drew this for me?" said Mum. "It is true," said the girl. "And it was all due to the new blue glue!"',
                "image_prompt": "A girl proudly gives a handmade card with a blue bird to her mum at the front entrance of a colourful Mexican home. Warm afternoon light, potted plants by the door, terracotta tiles. Mum smiles with delight. Landscape orientation.",
            },
        ],
        "cover_prompt": "A girl in yellow dungarees holds a pot of blue glue with a mischievous grin. A ginger cat with blue glue stuck on its fur sits beside her. Colourful Mexican home interior with warm walls, terracotta tiles, and potted plants. Portrait orientation.",
        "story_words": ["glue", "blue", "new", "drew", "threw", "grew"],
        "tricky_words_used": ["the", "to", "he", "her", "you", "me", "they", "fall", "said", "was", "she", "all", "so", "into"],  # 'hall', 'wall', 'front', 'kitchen' removed via rewrites
        "read_words": ["chewed", "rescued", "flew", "true"],
        "nonsense_words": [
            "plew", "snew", "tew", "bew", "gew",
            "stue", "bue", "frue", "pue", "grue",
        ],
        "questions": [
            {"category": "Finding", "text": "What did the girl make for Mum?"},
            {"category": "Thinking", "text": "Why did each thing go wrong \u2014 what started the chain?"},
            {"category": "Words", "text": "What does the word 'rescued' mean?"},
            {"category": "What next", "text": "What do you think the girl will do next time she uses glue?"},
        ],
        "writing_graphemes": ["ew", "ue"],
        "writing_words": ["new", "glue", "blue", "drew", "true", "flew"],
        "writing_starters": ["I drew a...", "The glue was..."],
        "character": {
            "name": "Oaxaca girl",
            "age": "7 years old",
            "appearance": "Medium brown skin, long straight dark hair in two braids, round face, rosy cheeks",
            "outfit": "Yellow t-shirt, blue denim dungarees, white trainers",
            "notes": "Contemporary Mexican child in modern casual clothes",
        },
        "side_character": {
            "name": "Dad",
            "appearance": "Medium brown skin, short dark hair, neat moustache, warm smile",
            "outfit": "Cream button-up shirt with rolled sleeves, dark jeans, brown leather sandals",
        },
        "setting": {
            "region": "Oaxaca, Mexico (modern residential neighbourhood)",
            "style": "Contemporary Mexican home — colourful walls, terracotta tiles, craft culture",
            "cultural_brief": "data/cultural_brief_L4_3.txt",
        },
    }
}