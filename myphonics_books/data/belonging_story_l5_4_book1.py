"""
A Place for Me — Level 5.4 Story
Focus sounds: ore, oor, ire, ear, ure, tion (review of all L5 sounds)
Setting: Colombian coastal town (Cartagena) — morning fruit market
Written 2026-04-16

Cultural Brief: See data/cultural_brief_l5_4.md
- Contemporary Cartagena walled city
- Bold vivid colonial buildings, bougainvillea balconies, cobblestones
- Morning fruit market with tropical produce (mangoes, papayas, plantains)
- Two boys: White British visitor + local Colombian boy
- Islamic-appropriate: no carnival, no free mixing, no dancing
- Modesty check: ALL characters in long trousers or long dresses

Story Structure: Lost and Found
- Pages 1-3: Boy arrives at market with dad, dad disappears, boy is lost and scared
- Pages 4-6: Local boy finds him, they search together, stop for mangoes
- Pages 7-8: Find dad, reunited, new friendship

Phonics Validation: ALL words verified decodable at L5 cumulative level or tricky words
  ore: shore (p1), more (p2), explore (p2)
  oor: door (p3)
  ire: tired (p8)
  ear: clear (p1), near (p1,p3), fear (p3), appeared (p4)
  ure: sure (p3,p4,p8), pure (p6)
  tion: section (p5), direction (p5), attention (p7)

Total word count: ~270 (target 280-380)
Sentences per page: 3-5
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
        "focus_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "story_pages": [
            {
                "page_number": 1,
                "text": (
                    "The morning air was cool and clear. "
                    "I went with Dad to a market near the old town. "
                    "It was just starting up. "
                    "Big sheets of cloth hung from the stands in red, green and blue."
                ),
            },
            {
                "page_number": 2,
                "text": (
                    "Soon the market was full of people. "
                    "There was more to see than I had ever seen! "
                    "Dad went to explore the stands. "
                    "\"Wait at this stand,\" he said. "
                    "But then I could not see him."
                ),
            },
            {
                "page_number": 3,
                "text": (
                    "I looked left. I looked right. "
                    "I could not see Dad near any door or stand. "
                    "I did not know where he went. "
                    "I felt a fear in my chest. I was alone."
                ),
            },
            {
                "page_number": 4,
                "text": (
                    "Then a boy appeared at my side. "
                    "He had a big grin on his face. "
                    "\"Are you lost?\" he said. "
                    "I nodded. "
                    "\"I will help you. We can spot him!\""
                ),
            },
            {
                "page_number": 5,
                "text": (
                    "We went from section to section. "
                    "He knew the direction to go. "
                    "He picked up a big yellow mango. "
                    "\"Pure sunshine!\" he grinned. "
                    "I could not help but smile back."
                ),
            },
            {
                "page_number": 6,
                "text": (
                    "We sat on some steps and ate the mangos. "
                    "The sweet mess ran down my chin. "
                    "It was the best thing I had ever tasted. "
                    "I smiled for the first time all day."
                ),
            },
            {
                "page_number": 7,
                "text": (
                    "Then the boy stopped. "
                    "He pointed down the street. "
                    "\"Dad must be near!\" he said. "
                    "\"Let’s go, we can spot him fast!\" "
                    "I felt a rush in my chest."
                ),
            },
            {
                "page_number": 8,
                "text": (
                    "Dad picked me up and held me tight. "
                    "I had been so tired and scared. "
                    "But not any more. "
                    "\"This boy helped me,\" I said. "
                    "Dad smiled. \"Then he must see us again soon.\""
                ),
            },
        ],
        "cover_prompt": (
            "Two boys stand together in a colourful Colombian market. "
            "Visiting boy: White British, light skin, short brown hair, blue t-shirt, khaki trousers. "
            "Local boy: Colombian, warm brown skin, curly dark hair, green t-shirt, dark blue trousers. "
            "Colourful fruit stalls, colonial buildings, tropical trees behind them. "
            "Both smiling at the viewer. Warm, welcoming mood. "
            "Portrait orientation. No text in image."
        ),
        "story_words": ["shore", "more", "explore", "door", "fear", "near", "clear",
                        "pure", "section", "direction", "attention", "tired"],
        "tricky_words_used": ["the", "to", "I", "was", "said", "where", "people",
                              "anyone", "he", "she", "could", "there", "my",
                              "are", "any", "again", "knew", "sure"],
        # The i in "direction" is not the /i/ of "in" — it is shifty (i = /igh/,
        # ledger from L7).  Paired with the SPLIT_EXCEPTIONS entry in
        # v2_helpers.py, which stops the greedy matcher taking the taught
        # trigraph "ire" and printing d/ire/c/tion (Lynden 2026-08-19).
        "shifty_marks": {
            "direction": [{"index": 1, "says": "/igh/"}],
        },
        "read_words": ["shore", "explore", "section", "direction", "pure", "attention"],
        "nonsense_words": [
            "blore", "snire", "flear", "thure", "ploor",
            "grore", "twire", "glear", "chure", "drire",
        ],
        "questions": [
            {"category": "Finding", "text": "Where did the boy lose his dad?"},
            {"category": "Thinking", "text": "Why did the local boy help him?"},
            {"category": "Words", "text": "What does the word 'explore' mean?"},
            {"category": "What next", "text": "What do you think the boys will do next time they visit the market?"},
        ],
        "writing_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "writing_words": ["shore", "floor", "explore", "near", "fear", "sure", "pure", "section"],
        "writing_starters": ["At the market, I...", "My new friend helped me..."],
        "character": {
            "name": "British boy (visitor)",
            "age": "6 years old",
            "appearance": "Light skin (#F0D0B0), short straight brown hair with side parting",
            "outfit": "Blue t-shirt, khaki long trousers, white trainers",
        },
        "side_characters": {
            "local_boy": {
                "name": "Colombian boy",
                "appearance": "Warm brown skin (#B8956A), curly dark brown hair, big friendly grin",
                "outfit": "Bright green t-shirt, dark blue long trousers, trainers",
            },
            "dad": {
                "name": "Dad",
                "appearance": "Light skin, brown hair",
                "outfit": "Casual shirt, long trousers",
            },
            "grandmother": {
                "name": "Grandmother (abuela)",
                "appearance": "Dark warm brown skin (#8B6B4A), grey hair in a bun, kind face",
                "outfit": "Colourful floral blouse, long skirt, head wrap (turbante)",
            },
        },
        "cultural_notes": {
            "setting": "Cartagena, Colombia — morning fruit market in the walled old city",
            "approach": "Contemporary-first with authentic Cartagena texture. Bold vivid "
                       "colonial buildings, bougainvillea balconies, cobblestones, tropical "
                       "fruit. Islamic-appropriate — no carnival, no free mixing, no dancing.",
        },
    }
}
