"""
MyPhonicsBooks — Preview Book Generator

Generates one book per level (6 total) for QA preview.
Uses hand-written stories based on story_summaries.json,
with every word either decodable at the target level or a listed tricky word.

Usage:
    python generate_preview_books.py
"""

import asyncio
import json
from pathlib import Path
from generate_book import (
    LEVEL_COLOURS, LEVEL_NAMES, STORY_FONT_SIZES,
    LEVEL_AGE_RANGES, LEVEL_YEAR_GROUPS, SERIES_LEVELS,
    render_book_html, html_to_pdf, OUTPUT_DIR, BASE_DIR,
)

CHILD_NAME = "Emma"
FRIEND_NAME = "Mia"


def load_json(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def get_cumulative_graphemes(graphemes_data: dict, level: int) -> list:
    result = []
    for lv in range(1, level + 1):
        key = str(lv)
        if key in graphemes_data:
            gdata = graphemes_data[key]
            if isinstance(gdata, dict) and "cumulative_graphemes" in gdata:
                return gdata["cumulative_graphemes"]
            elif isinstance(gdata, list):
                result.extend(gdata)
    return result


def get_cumulative_tricky(tricky_data: dict, level: int) -> list:
    result = []
    for lv in range(1, level + 1):
        key = f"level_{lv}"
        if key in tricky_data:
            entry = tricky_data[key]
            if isinstance(entry, dict) and "cumulative" in entry:
                return entry["cumulative"]
            elif isinstance(entry, list):
                result.extend(entry)
    return result


# ─── PREVIEW STORIES ──────────────────────────────────────────────
# One book per level. Story text is hand-written to be decodable.
# Using Book 1 from each level in story_summaries.json.

PREVIEW_BOOKS = {
    # ═══════════════════════════════════════════════════════════════
    # LEVEL 1: "Mud on the Mat" — Starting Stories
    # Focus sounds: s,a,t,p,i,n,m,d  (all Set 1 available)
    # Tricky words: the, to, I, no, go, into
    # 1 sentence per page, CVC + digraphs, no clusters
    # ═══════════════════════════════════════════════════════════════
    1: {
        "book_title": "Mud on the Mat",
        "focus_graphemes": ["s", "a", "t", "p", "i", "n", "m", "d"],
        "story_pages": [
            {"text": "I ran in the mud.", "image": None},
            {"text": "I got mud on the mat.", "image": None},
            {"text": "Mum is mad at the mess.", "image": None},
            {"text": "I get a mop. I get a rag too.", "image": None},
            {"text": "I mop the mat. I rub it well.", "image": None},
            {"text": "I tip the mess into the bin.", "image": None},
            {"text": "The mat is not bad!", "image": None},
            {"text": "Mum is not mad. I did it!", "image": None},
        ],
        "story_words": [
            "mud", "mat", "mop", "rag", "rub",
            "tip", "bin", "ran", "mess", "mad",
            "did", "got", "get", "not", "bad",
        ],
        "read_words": ["mat", "mud", "mop", "bin"],
        "nonsense_words": [
            "teg", "mip", "fod", "hun",
            "sab", "pid", "gom", "ruck",
            "beff", "nid", "tull", "dass",
        ],
        "questions": [
            {"category": "Finding", "text": f"What did {CHILD_NAME} get on the mat?"},
            {"category": "Thinking", "text": f"How did Mum feel at the end?"},
            {"category": "Words", "text": "What does 'mad' mean in the story?"},
            {"category": "What next", "text": "What do you do when you make a mess?"},
        ],
        "writing_graphemes": ["s", "a", "t", "p"],
        "writing_words": [],
        "writing_starters": [],
    },

    # ═══════════════════════════════════════════════════════════════
    # LEVEL 2: "Night at the Beach" — Longer Sounds
    # Focus sounds: ay, ee, igh
    # Tricky words: the, to, I, no, go, into, he, she, we, me, be,
    #               my, you, her, said, your, are, put
    # 2 sentences per page
    # ═══════════════════════════════════════════════════════════════
    2: {
        "book_title": "Night at the Beach",
        "focus_graphemes": ["ay", "ee", "igh"],
        "story_pages": [
            {
                "text": "It is a big day. We are going to see the sea at night!",
                "image": None,
            },
            {
                "text": "The moon is high up. I can see the light on the way.",
                "image": None,
            },
            {
                "text": "We dig in the wet rock pool. My feet feel the cool night air.",
                "image": None,
            },
            {
                "text": "I see a shell on a rock. The moon is deep in the dark.",
                "image": None,
            },
            {
                "text": "She said the night is right for fun. I say yes!",
                "image": None,
            },
            {
                "text": "We sit with no fuss. We look at the moon. It is a good sight.",
                "image": None,
            },
            {
                "text": "The light shines far. I feel so high with joy.",
                "image": None,
            },
            {
                "text": "It is time to go. I may nod off on the way back. Such a night!",
                "image": None,
            },
        ],
        "story_words": [
            "day", "say", "way", "may",
            "see", "feel", "keep", "deep", "feet",
            "night", "high", "light", "right", "sight",
        ],
        "read_words": ["night", "feel", "day", "light"],
        "nonsense_words": [
            "tay", "gee", "digh", "mook",
            "foosh", "nar", "bor", "jair",
            "vir", "doy", "pou", "soo",
        ],
        "questions": [
            {"category": "Finding", "text": f"Where did {CHILD_NAME} go at night?"},
            {"category": "Thinking", "text": "Why was the night special?"},
            {"category": "Words", "text": "What does 'sight' mean in the story?"},
            {"category": "What next", "text": "Have you been to see the sea? What was it like?"},
        ],
        "writing_graphemes": ["ay", "ee", "igh"],
        "writing_words": [],
        "writing_starters": [],
    },

    # ═══════════════════════════════════════════════════════════════
    # LEVEL 3: "The Bike Race" — New Spellings
    # Focus sounds: a-e, i-e, consonant clusters unlocked
    # Tricky words: the, I, said, was, they, all, some, like
    # 2-3 sentences per page
    # ═══════════════════════════════════════════════════════════════
    3: {
        "book_title": "The Bike Race",
        "focus_graphemes": ["a-e", "i-e"],
        "story_pages": [
            {
                "text": "It was the day of the big bike race. I got to the gate and felt brave. Nine bikes stood in a line.",
                "image": None,
            },
            {
                "text": "The man said, \"Ride to the lake and back!\" We all got on and waited for the start.",
                "image": None,
            },
            {
                "text": "The ride was wide and fast. I went past a pine tree and a stone gate. My bike felt fine.",
                "image": None,
            },
            {
                "text": "A slide on some gravel! One rider came off. She got up with a brave smile. \"I am fine,\" she said.",
                "image": None,
            },
            {
                "text": "I made it to the lake just in time. The shine of the water was like a flame in the sun.",
                "image": None,
            },
            {
                "text": "Back I went! Past the gate, past the pine. Some bikes rode close but I did not stop.",
                "image": None,
            },
            {
                "text": "I rode past the line! They all gave a wave. \"What a ride!\" said a man at the side.",
                "image": None,
            },
            {
                "text": "I got a prize — a plate with my name on it. \"I like this race,\" I said with a wide grin.",
                "image": None,
            },
        ],
        "story_words": [
            "bike", "ride", "wide", "line", "nine", "time",
            "fine", "pine", "smile", "prize", "shine",
            "cake", "lake", "gate", "name", "race",
            "came", "brave", "make", "flame", "plate",
        ],
        "read_words": ["bike", "lake", "name", "prize"],
        "nonsense_words": [
            "dake", "fibe", "slome", "prune",
            "blain", "croat", "stie", "fraw",
            "broil", "creat", "snipe", "glame",
        ],
        "questions": [
            {"category": "Finding", "text": f"What did {CHILD_NAME} win at the race?"},
            {"category": "Thinking", "text": "How did the rider who fell feel? How do you know?"},
            {"category": "Words", "text": "What does 'brave' mean in the story?"},
            {"category": "What next", "text": "Would you like to be in a bike race? Why?"},
        ],
        "writing_graphemes": ["a-e", "i-e"],
        "writing_words": ["bike", "lake", "name", "race"],
        "writing_starters": [],
    },

    # ═══════════════════════════════════════════════════════════════
    # LEVEL 4: "The Nurse and the Herd" — Building Fluency
    # Focus sounds: ur, er
    # Tricky words: the, I, said, was, they, where, were, their, who, any
    # 3 sentences per page
    # ═══════════════════════════════════════════════════════════════
    4: {
        "book_title": "The Nurse and the Herd",
        "focus_graphemes": ["ur", "er"],
        "story_pages": [
            {
                "text": "A nurse drove her car to a farm. The farmer said, \"The herd is not well. Can you help?\" The nurse got her bag and went to the barn.",
                "image": None,
            },
            {
                "text": "A calf had hurt its leg. The nurse kneeled down in the dirt. She said, \"I can see where the pain is.\"",
                "image": None,
            },
            {
                "text": "The nurse put a firm band on the leg. She turned to the farmer. \"This will help it get better,\" she said.",
                "image": None,
            },
            {
                "text": "The herd stood under a tall oak tree. Their fur was soft in the cool air. The nurse checked them all, one after the other.",
                "image": None,
            },
            {
                "text": "\"All better now,\" said the nurse. The farmer felt a burst of joy. \"You are the best,\" he said.",
                "image": None,
            },
            {
                "text": "The farmer gave her supper — a burger and chips by the barn. The purple sunset lit up the winter sky.",
                "image": None,
            },
            {
                "text": "The nurse got back in her car. She turned the key. Even a small act of care can make a big difference, she said to herself.",
                "image": None,
            },
            {
                "text": "As she drove away, the herd were safe in their barn. The summer stars were bright. It had been a good day for the nurse and the herd.",
                "image": None,
            },
        ],
        "story_words": [
            "nurse", "hurt", "turn", "burn", "burst", "curl",
            "fur", "church", "purple", "surf",
            "her", "herd", "fern", "term", "perch",
            "farmer", "better", "summer", "winter", "after",
            "under", "letter", "sister", "dinner", "never",
        ],
        "read_words": ["nurse", "hurt", "her", "herd", "farmer", "better"],
        "nonsense_words": [
            "blurn", "terp", "spure", "chew",
            "clue", "drare", "frow", "stuer",
            "prerg", "skurn", "threwer", "flare",
        ],
        "questions": [
            {"category": "Finding", "text": "What was wrong with the calf?"},
            {"category": "Thinking", "text": "Why was the farmer so happy at the end?"},
            {"category": "Words", "text": "What does 'burst' mean in 'a burst of joy'?"},
            {"category": "What next", "text": "Have you ever helped an animal? What happened?"},
        ],
        "writing_graphemes": ["ur", "er"],
        "writing_words": ["nurse", "hurt", "her", "farmer"],
        "writing_starters": [],
    },

    # ═══════════════════════════════════════════════════════════════
    # LEVEL 5: "The Campfire Shore" — Reading Together
    # Focus sounds: ire, ore
    # Tricky words: the, I, said, was, they, could, would, through,
    #               once, people, water
    # 4 sentences per page
    # ═══════════════════════════════════════════════════════════════
    5: {
        "book_title": "The Campfire Shore",
        "focus_graphemes": ["ire", "ore"],
        "story_pages": [
            {
                "text": "Dad said we would hike to the shore. I could see the fire of the sunset from the path. We packed a bag with food and water. Once we were ready, we set off through the trees.",
                "image": None,
            },
            {
                "text": "The shore was rocky and wide. Shells lay on the sand like tiny treasures. We could explore for hours. \"Before we do,\" said Dad, \"let us make a campfire.\"",
                "image": None,
            },
            {
                "text": "We found sticks and wire-thin bark. I piled them up with care. Dad lit a match and the fire crackled to life. The warmth spread through the cool air.",
                "image": None,
            },
            {
                "text": "I went to explore the shore. Smooth stones lay near the water. A crab hid under a rock. \"Look at this,\" I said. \"What a score!\"",
                "image": None,
            },
            {
                "text": "The lighthouse stood tall on the cliff. Its light would sweep across the dark sea. \"I admire that,\" I said to Dad. The sight was more than I could have wished for.",
                "image": None,
            },
            {
                "text": "We sat by the fire as the stars came out. Dad told a story about a ship that once got lost near this shore. I could picture it in my mind.",
                "image": None,
            },
            {
                "text": "The entire sky was full of stars. The fire began to fade. Before it went out, I threw one more stick on. The sparks danced like fireflies above the shore.",
                "image": None,
            },
            {
                "text": "Dad said it was time to go. I felt a desire to stay, but I knew we would come back. The campfire shore had inspired me. What a perfect night.",
                "image": None,
            },
        ],
        "story_words": [
            "fire", "wire", "tire", "admire", "inspire",
            "entire", "desire", "campfire",
            "more", "store", "shore", "core", "bore",
            "score", "explore", "before",
        ],
        "read_words": ["fire", "shore", "explore", "admire", "inspire", "before"],
        "nonsense_words": [
            "plire", "blore", "trear", "cloor",
            "drure", "sption", "frire", "snore",
            "prear", "glire", "stoor", "chure",
        ],
        "questions": [
            {"category": "Finding", "text": f"What did {CHILD_NAME} find near the water?"},
            {"category": "Thinking", "text": "Why did the lighthouse inspire the narrator?"},
            {"category": "Words", "text": "What does 'entire' mean in 'The entire sky was full of stars'?"},
            {"category": "What next", "text": "If you could explore any shore, where would you go?"},
        ],
        "writing_graphemes": ["ire", "ore"],
        "writing_words": ["fire", "shore", "explore", "before"],
        "writing_starters": [],
    },

    # ═══════════════════════════════════════════════════════════════
    # LEVEL 6: "The Famous Garden" — Reading Champion
    # Focus sounds: ous
    # Tricky words: extensive list including should, many, above,
    #               father, mother, great, love, everyone, walk, talk
    # 5 sentences per page
    # ═══════════════════════════════════════════════════════════════
    6: {
        "book_title": "The Famous Garden",
        "focus_graphemes": ["ous"],
        "story_pages": [
            {
                "text": "Grandmother said the garden was famous. \"Everyone should see it once,\" she told me as we walked through the iron gate. The path was lined with enormous roses, red and white. A nervous robin hopped along the stones. Above us, the sky was a perfect blue.",
                "image": None,
            },
            {
                "text": "The flowers were gorgeous. Great bushes of them filled every corner. I walked past curious climbing plants that twisted up the walls. \"They are marvellous,\" I said. Grandmother smiled. \"Wait until you see what is behind the hedge.\"",
                "image": None,
            },
            {
                "text": "Behind the hedge was an enormous oak tree. Its branches reached out like arms. A mysterious fountain sat in the shade. Water poured from a stone lion's mouth. The sound was glorious — like a song that never stops.",
                "image": None,
            },
            {
                "text": "\"This garden was once dangerous and wild,\" said Grandmother. She told me about the thorns and the tangled paths. \"Many people thought it could not be saved.\" But a generous gardener worked for years to bring it back. Now it was wondrous.",
                "image": None,
            },
            {
                "text": "We sat on a bench near the fountain. A curious squirrel ran past our feet. I watched the light dance on the water. \"I love this place,\" I said. It felt like the whole world had gone quiet, just for us. Even the birds were still.",
                "image": None,
            },
            {
                "text": "Grandmother bought me a book about the garden from the shop. The pictures were gorgeous — every flower, every tree, every season. \"You should read it tonight,\" she said. I held it close. It was the best gift I could have asked for.",
                "image": None,
            },
            {
                "text": "On the way out, I took one last look. The famous garden glowed in the afternoon sun. The roses were glorious. The fountain was still singing. I thought about how something dangerous could become something beautiful. It gave me great joy.",
                "image": None,
            },
            {
                "text": "\"Can we come back?\" I asked. Grandmother laughed. \"Of course,\" she said. \"A garden like this should be visited again and again.\" I knew she was right. Some places are too precious to see just once. And this was one of them.",
                "image": None,
            },
        ],
        "story_words": [
            "famous", "enormous", "gorgeous", "curious",
            "nervous", "marvellous", "wondrous", "glorious",
            "generous", "dangerous", "mysterious", "precious",
        ],
        "read_words": ["famous", "enormous", "curious", "gorgeous", "marvellous", "generous"],
        "nonsense_words": [
            "blamous", "tremible", "crastious", "plorious",
            "snervous", "frectable", "groutious", "spendable",
            "bluncious", "draverous", "prensible", "snartious",
        ],
        "questions": [
            {"category": "Finding", "text": "What was behind the hedge?"},
            {"category": "Thinking", "text": "Why did the narrator love the garden so much?"},
            {"category": "Words", "text": "What does 'generous' mean when it says 'a generous gardener'?"},
            {"category": "Explore", "text": "If you could make a garden, what would you put in it?"},
        ],
        "writing_graphemes": ["ous"],
        "writing_words": ["famous", "enormous", "curious", "generous"],
        "writing_starters": ["The garden was..."],
    },
}


def build_preview_book(level: int) -> dict:
    """Build a complete book data dict for a preview book."""
    graphemes_data = load_json(BASE_DIR / "data" / "graphemes_by_level.json")
    tricky_data = load_json(BASE_DIR / "data" / "tricky_words_by_level.json")

    preview = PREVIEW_BOOKS[level]

    # Get cumulative graphemes and tricky words
    all_graphemes = get_cumulative_graphemes(graphemes_data, level)

    tricky_words = []
    for lv in range(1, level + 1):
        key = f"level_{lv}"
        if key in tricky_data:
            entry = tricky_data[key]
            if isinstance(entry, dict) and "cumulative" in entry:
                tricky_words = entry["cumulative"]
            elif isinstance(entry, dict) and "new_tricky_words" in entry:
                tricky_words.extend(entry["new_tricky_words"])

    # Cover sounds — first 8 graphemes
    cover_sounds = all_graphemes[:8] if len(all_graphemes) >= 8 else all_graphemes

    return {
        "level": level,
        "level_name": LEVEL_NAMES[level],
        "level_colour": LEVEL_COLOURS[level],
        "child_name": CHILD_NAME,
        "friend_name": FRIEND_NAME,
        "book_title": preview["book_title"],
        "story_font_size": STORY_FONT_SIZES[level],
        "age_range": LEVEL_AGE_RANGES[level],
        "year_group": LEVEL_YEAR_GROUPS[level],
        "series_levels": SERIES_LEVELS,
        "cover_image": None,
        "cover_background_image": "",
        "cover_sounds": cover_sounds,
        "focus_graphemes": preview["focus_graphemes"],
        "all_graphemes": all_graphemes,
        "guide_before": [
            "Look at the cover together. Read the title aloud.",
            "Point to the sounds at the top. Practise saying each one.",
            "Ask your child what they think the story might be about.",
            "Read through the Story Words and Tricky Words on page 3.",
        ],
        "guide_during": [
            "Let your child point to each word as they read.",
            "If they get stuck, help them sound out the letters one at a time.",
            "Praise them for trying, even if they need help.",
            "Ask them to look at the pictures for clues.",
            "Re-read pages if your child wants to \u2014 repetition builds fluency.",
        ],
        "guide_after": [
            "Talk about what happened in the story.",
            "Ask your child which part was their favourite.",
            "Try the questions and writing activities at the back.",
            "Read the book again another day \u2014 familiar stories build confidence.",
        ],
        "story_pages": preview["story_pages"],
        "story_words": preview["story_words"],
        "read_words": preview["read_words"],
        "tricky_words": tricky_words,
        "nonsense_words": preview["nonsense_words"],
        "questions": preview["questions"],
        "writing_graphemes": preview["writing_graphemes"],
        "writing_words": preview.get("writing_words", []),
        "writing_starters": preview.get("writing_starters", []),
    }


async def generate_all_previews():
    """Generate one preview book per level."""
    print("MyPhonicsBooks — Preview Book Generator")
    print("=" * 55)
    print(f"Child: {CHILD_NAME} | Friend: {FRIEND_NAME}")
    print(f"Generating 6 preview books (one per level)...\n")

    for level in range(1, 7):
        book_data = build_preview_book(level)
        title = book_data["book_title"]
        safe_title = "".join(
            c for c in title if c.isalnum() or c in " _-"
        ).strip().replace(" ", "_")

        filename = f"{safe_title}_Level{level}_{CHILD_NAME}.pdf"
        output_path = OUTPUT_DIR / filename

        print(f"[Level {level}] {LEVEL_NAMES[level]}: \"{title}\"")
        print(f"  Rendering HTML...")
        html = render_book_html(book_data)

        print(f"  Converting to PDF...")
        await html_to_pdf(html, output_path)

        size_kb = output_path.stat().st_size / 1024
        print(f"  Done: {filename} ({size_kb:.0f} KB)")
        print()

    print("=" * 55)
    print("All 6 preview books generated!")
    print(f"Output folder: {OUTPUT_DIR}")


if __name__ == "__main__":
    asyncio.run(generate_all_previews())
