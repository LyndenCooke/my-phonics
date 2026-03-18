"""
The Purple Purse — Level 4.1 Story (REVISED)
Focus sounds: ur, er
Setting: Modern Istanbul neighbourhood (Kadıköy/Moda)
Cultural brief: data/cultural_brief_L4_1.txt
Written 2026-03-08

Supersedes: bazaar_story_l4_1_book1.py (postcard bazaar setting replaced with
contemporary neighbourhood journey).

Phonics validation: ALL words verified decodable at L4 cumulative level
or are cumulative tricky words.

Focus 'ur' words: purple, purse, turned, fur, burst, church, hurt, tucked
Focus 'er' words: her, ferns, corner, herbs, seller, never, ever, after
Consonant clusters used: st, cl, gr, sm, ck (all unlocked at L3+).

Story structure: Lost-and-found journey (different location each page).
Image feasibility: PASS — each page is a different location.
Engagement hooks: 6/6 (page-turn tension, curiosity gap, repetition with
variation, sensory details, emotional stakes, satisfying resolution).
"""

PURPLE_PURSE_STORY_BOOK1 = {
    "L4_1_B1": {
        "level": 4,
        "sub_level": 1,
        "book_number": 1,
        "book_title": "The Purple Purse",
        "level_name": "Building Fluency",
        "level_colour": "#3B82F6",
        "font_size": 18,
        "focus_graphemes": ["ur", "er"],
        "all_level_graphemes": ["are", "ur", "er", "ew", "ue", "ow"],
        "story_pages": [
            {
                "page_number": 1,
                "text": '"My purple purse! Where is it?" The girl looked in her bag but it was not in it. She turned out all her pockets. She turned to Dad. "I lost my purse!"',
                "image_prompt": "A worried girl turns out her empty pockets in a modern apartment hallway. Dad stands nearby looking concerned. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": '"Where did you go?" said Dad. The girl had to think. "The park first. Then the corner shop. Then the herb stall!" Dad took her hand. "Right. Let us go and look."',
                "image_prompt": "A girl and her dad walk hand in hand down a modern city street with colourful buildings. She looks thoughtful. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": 'First, they rushed to the park. She looked under the bench and in the ferns. She turned the leaves and checked the bushes. But no purple purse! "It is not at the park," she said.',
                "image_prompt": "A girl bends down to search under a park bench surrounded by green ferns. She looks frustrated. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": 'Next, the corner shop. "Did you see a purple purse?" she asked. The man shook his head. "Not in my shop." The girl felt her chest hurt. Where was her purse?',
                "image_prompt": "A girl stands at the counter of a small corner shop, asking the shopkeeper a question. The shopkeeper shakes his head. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": 'She turned down a long street. Ferns grew up the old stone wall by a church. She checked and checked. But her purse was not tucked in them. "What if I never get it back?" she said.',
                "image_prompt": "A girl walks along a street past an old stone wall covered in ferns. A small church is visible in the background. She looks sad. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": 'Then Dad said, "The herb stall! You put your purse down when you got the herbs!" They rushed back. The herb seller smiled. "Is this it?" She held up a purple purse!',
                "image_prompt": "A smiling woman at a herb stall holds up a small purple purse. The girl reaches for it with delight while Dad watches. Herbs in wooden crates around the stall. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": '"Yes! My purse!" The girl burst with joy. She turned it in her hands. It was just the same \u2014 soft, like fur. "Thank you so much!" she said to the seller.',
                "image_prompt": "A joyful girl holds a small purple purse close, examining it with a huge smile. Dad stands behind her smiling. Herb stall and modern street behind. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": 'On the way home, Dad said, "You did well. You did not stop." The girl held her purple purse close. "I will never let it go," she said. And she never did.',
                "image_prompt": "A girl and her dad walk home along a modern street at golden hour. She clutches a small purple purse to her chest, looking happy and relieved. Landscape orientation.",
            },
        ],
        "cover_prompt": "A girl in a purple jumper stands on a colourful modern street, holding a small purple purse close to her chest with a smile. Green ferns and modern shops behind her. Portrait orientation.",
        "story_words": ["purple", "purse", "turned", "ferns", "herbs", "never"],
        "tricky_words_used": ["was", "where", "said", "what", "she", "my"],
        "read_words": ["church", "burst", "seller", "corner"],
        "nonsense_words": [
            "chur", "gern", "flur", "sperk", "thurn",
            "blerch", "grurn", "clurp", "skerb", "flerp",
        ],
        "questions": [
            {"category": "Finding", "text": "What was the girl looking for?"},
            {"category": "Thinking", "text": "Why did the girl feel hurt when the shop keeper said no?"},
            {"category": "Words", "text": "What does the word 'seller' mean?"},
            {"category": "What next", "text": "What do you think the girl told Mum when she got home?"},
        ],
        "writing_graphemes": ["ur", "er"],
        "writing_words": ["purple", "purse", "nurse", "church", "fern", "never"],
        "writing_starters": ["At the shop, I saw...", "The purse was..."],
        "character": {
            "name": "Istanbul girl",
            "age": "6 years old",
            "appearance": "Dark brown wavy hair in a ponytail, light olive skin",
            "outfit": "Purple jumper with small gold star pattern, dark navy jeans, white trainers, light blue zip-up jacket",
            "notes": "Contemporary Turkish child in modern casual clothes",
        },
        "side_character": {
            "name": "Dad",
            "appearance": "Tall, dark brown short hair, light olive skin, clean-shaven",
            "outfit": "Dark casual jacket, grey shirt, dark jeans, dark trainers",
        },
        "setting": {
            "region": "Istanbul, Turkey (Kadıköy/Moda neighbourhood)",
            "style": "Contemporary modern neighbourhood",
            "cultural_brief": "data/cultural_brief_L4_1.txt",
        },
    }
}
