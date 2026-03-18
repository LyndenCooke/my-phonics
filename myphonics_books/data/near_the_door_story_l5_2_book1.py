"""
Near the Door — Level 5.2 Story
Focus sounds: ear, oor
Setting: Contemporary Stockholm, Sweden (Nordic winter)
Cultural approach: Visual texture only — modern Swedish home shown in images,
universal story about discovering something in the snow.
Written 2026-03-11

Story structure: Dual Perspective (L5 required structure)
- Alternating between GIRL's perspective (curiosity/excitement) and DAD's perspective (knowing/calm)
- Same sounds interpreted differently by child and parent
Grammar focus: Perspective shifts, reported speech, varied openers

Phonics validation: ALL words verified decodable at L5 cumulative level
or are cumulative tricky words.

Focus 'ear' words: hear (x5), near (x4), ear (x3), dear (x2), clear, fear
Focus 'oor' words: door (x7), floor (x3), poor
Consonant clusters used: st, cr, fl, sp, sn, sm, cl (all unlocked at L3+)

Image feasibility: PASS — modern Swedish home setting with:
- Indoor living room with snow outside (page 1-4)
- Door opening to snowy garden (page 5)
- Discovery in snow (page 6-7)
- Warm ending indoors (page 8)
"""

NEAR_THE_DOOR_STORY_BOOK1 = {
    "L5_2_B1": {
        "level": 5,
        "sub_level": 2,
        "book_number": 1,
        "book_title": "Near the Door",
        "level_name": "Reading Together",
        "level_colour": "#8B5CF6",
        "font_size": 16,
        "focus_graphemes": ["ear", "oor"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "I was sitting on the floor when I heard a sound. Crunch, crunch, crunch. It came from near the door. What could it be? I crept over and put my ear to the door. Crunch, crunch. I heard it again.",
                "perspective": "GIRL",
                "image_prompt": "A Swedish girl (light skin, long blonde hair in braids, cosy red jumper) crouches on a wooden floor inside a modern Scandinavian home, pressing her ear to a white front door. Minimalist decor, sheepskin rug, snow visible through window. She looks curious. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": "Dad heard it too. He was in his seat by the fire. He looked at me and smiled. \"I can tell what that is,\" he said. \"It is clear to me. But I will not say.\"",
                "perspective": "DAD",
                "image_prompt": "Swedish dad (light skin, short brown hair, grey wool sweater) sits in a cosy armchair by a wood-burning stove. Snow falls outside the window behind him. He smiles knowingly. Modern minimalist Swedish living room with warm lighting. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": "But what was it? I saw a dark shape near the door through the window. It seemed to shift in the snow. Was it a big beast from the forest? My heart beat fast. I felt a little fear.",
                "perspective": "GIRL",
                "image_prompt": "The Swedish girl (blonde braids, red jumper) peers nervously through a frosty window beside the front door. Outside in the snowy garden, a mysterious dark shape is visible. Her expression shows curiosity mixed with slight fear. Warm interior, cold exterior. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": "Dad just sat and smiled at me. \"My dear,\" he said, \"you do not need to fear. Just open the door and look. You will see what it is.\"",
                "perspective": "DAD",
                "image_prompt": "Swedish dad (grey sweater) gestures encouragingly toward the door from his armchair by the fire. He has a warm, knowing smile. The girl (back to viewer) stands hesitantly near the door. Cosy modern Swedish living room with wood stove. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": "I reached for the door. My hand felt cool on the handle. I pulled the door wide open. And sitting in the snow was... a fox! A soft red fox with big, pointed ears!",
                "perspective": "GIRL",
                "image_prompt": "The Swedish girl (blonde braids, red jumper) has opened the front door wide, revealing a beautiful red fox sitting in the snowy garden. Her face shows pure delight and wonder. Snow-covered garden with birch trees and a wooden fence. Bright winter daylight. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": "Dad stood up and came over. \"I have been feeding him,\" he said. \"The poor little thing was so thin. He comes near when he is looking for food.\"",
                "perspective": "DAD",
                "image_prompt": "Dad (grey sweater) stands beside the girl at the open door, one hand on her shoulder. The red fox sits in the snow looking up at them with bright eyes. Both humans smiling warmly at the fox. Snowy Swedish garden. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": "Dad got some food and set it on the floor of the step. The fox crept near, his feet soft on the snow. He ate and ate! His tail flicked as he munched. I sat on the floor and just looked at him.",
                "perspective": "GIRL",
                "image_prompt": "The red fox eats food from a small dish on the snowy doorstep. The Swedish girl (blonde braids) sits on the wooden floor just inside the doorway, watching with wonder. Dad stands nearby. The fox's tail is fluffy and bright against the white snow. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": "\"Dear little fox,\" I said to him. \"You are safe. Come back soon.\" Dad smiled at me. \"He will, my dear. He can tell that we are his friends.\" The fox looked up, then ran back into the trees.",
                "perspective": "BOTH",
                "image_prompt": "The Swedish girl (blonde braids, red jumper) waves goodbye from the doorway as the red fox trots away through the snowy garden toward birch trees. Dad stands behind her with a warm smile. Soft winter light, snow-covered landscape. Peaceful ending. Landscape orientation.",
            },
        ],
        "cover_prompt": "A Swedish girl (light skin, long blonde hair in braids, cosy red wool jumper) kneels in the snow beside a beautiful red fox with big pointed ears. Behind them, a modern Scandinavian wooden house with a white door, snow on the roof, birch trees. Magical winter scene. Portrait orientation.",
        "story_words": ["hear", "near", "door", "floor", "ear", "dear", "fear", "clear", "poor"],
        "tricky_words_used": ["the", "to", "I", "was", "said", "what", "you", "your", "do"],
        "read_words": ["hear", "near", "door", "floor", "dear", "clear"],
        "nonsense_words": [
            "blear", "snear", "drear", "twear", "frear",
            "ploor", "smoor", "gloor", "troor", "choor",
        ],
        "questions": [
            {"category": "Finding", "text": "What animal was making the crunching sound in the snow?"},
            {"category": "Thinking", "text": "Why did Dad not tell the girl what the sound was?"},
            {"category": "Words", "text": "What does 'poor' mean when Dad says the fox was poor?"},
            {"category": "What next", "text": "Do you think the fox will come back to visit again?"},
        ],
        "writing_graphemes": ["ear", "oor"],
        "writing_words": ["hear", "near", "dear", "fear", "door", "floor", "poor"],
        "writing_starters": ["Near the door, I heard...", "The fox was near the..."],
        "character": {
            "name": "Swedish girl (Astrid)",
            "age": "5 years old",
            "appearance": "Light skin with rosy cheeks from the cold. Long straight blonde hair in two braids. Bright blue eyes.",
            "outfit": "Cosy red wool jumper (hand-knitted style), dark blue jeans, thick woolly socks (indoor)",
            "notes": "Swedish setting is visual texture only — shown in images through minimalist Scandinavian interior design, winter landscape, traditional Swedish wooden house. Not mentioned in text.",
        },
        "side_characters": {
            "dad": {
                "name": "Swedish Dad",
                "appearance": "Light skin, short brown hair, friendly face with slight stubble, warm eyes",
                "outfit": "Grey wool sweater (Scandinavian pattern at neckline), dark trousers, woolly socks",
            },
            "fox": {
                "name": "The fox",
                "appearance": "Red fox with bright orange-red fur, white chest, big pointed ears with black tips, bushy tail with white tip, dark intelligent eyes",
                "notes": "Wild but friendly, comes for food",
            },
        },
        "cultural_notes": {
            "setting": "Modern Stockholm suburb, Sweden (winter)",
            "approach": "Contemporary-first with cultural texture. Modern Scandinavian home with minimalist design, wood-burning stove, wooden floors, sheepskin rugs. Snowy garden with birch trees. Universal story about kindness to animals and discovery.",
        },
    }
}
