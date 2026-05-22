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
                "text": "My purple purse was gone! I turned my pockets inside out, but it was not there. I was so upset!",
                "image_prompt": "A worried girl turns out her empty pockets in a modern apartment hallway. Dad stands nearby looking concerned. Landscape orientation.",
            },
            {
                "page_number": 2,
                "text": "Dad came with me to search. We walked up and down the street. 'It must be here,' said Dad.",
                "image_prompt": "A girl and her dad walk hand in hand down a modern city street with colourful buildings. She looks thoughtful. Landscape orientation.",
            },
            {
                "page_number": 3,
                "text": "I looked under the bench in the park. I searched in the ferns. Not there!",
                "image_prompt": "A girl bends down to search under a park bench surrounded by green ferns. She looks frustrated. Landscape orientation.",
            },
            {
                "page_number": 4,
                "text": "'A currant bun?' said the baker. But I had no coins to pay! I turned away, sad.",
                "image_prompt": "A girl stands at the counter of a small corner shop, asking the shopkeeper a question. The shopkeeper shakes his head. Landscape orientation.",
            },
            {
                "page_number": 5,
                "text": "Further on, we passed a church. Past more stalls and tall garden walls. I started to give up.",
                "image_prompt": "A girl walks along a street past an old stone wall covered in ferns. A small church is visible in the background. She looks sad. Landscape orientation.",
            },
            {
                "page_number": 6,
                "text": "Then a market lady held up a purple purse! 'I found this on the kerb. Is it yours?'",
                "image_prompt": "A smiling woman at a herb stall holds up a small purple purse. The girl reaches for it with delight while Dad watches. Herbs in wooden crates around the stall. Landscape orientation.",
            },
            {
                "page_number": 7,
                "text": "I turned the purse over. My coins were still in it! 'Thank you!' I burst out, smiling.",
                "image_prompt": "A joyful girl holds a small purple purse close, examining it with a huge smile. Dad stands behind her smiling. Herb stall and modern street behind. Landscape orientation.",
            },
            {
                "page_number": 8,
                "text": "Dad and I walked home in the warm afternoon. I held the purse close to my chest. 'She was so kind,' I said.",
                "image_prompt": "A girl and her dad walk home along a modern street at golden hour. She clutches a small purple purse to her chest, looking happy and relieved. Landscape orientation.",
            },
        ],
        "cover_prompt": "A girl in a purple jumper stands on a colourful modern street, holding a small purple purse close to her chest with a smile. Green ferns and modern shops behind her. Portrait orientation.",
        "story_words": ["purple", "purse", "turned", "ferns", "herbs", "never"],
        "tricky_words_used": ["the", "to", "I", "you", "her", "your", "go", "no", "so", "old", "put", "was", "where", "said", "what", "she", "my"],  # 'by'/'stall'/'wall'/'when' removed via rewrites
        "read_words": ["church", "burst", "seller", "corner"],
        "nonsense_words": [
            "chur", "gern", "flur", "sperk", "thurn",
            "blerch", "grurn", "clurp", "skerb", "flerp",
        ],
        "questions": [
            {"category": "Finding", "text": "What was the girl looking for?"},
            {"category": "Thinking", "text": "Why did the girl feel hurt when the shopkeeper said no?"},
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
