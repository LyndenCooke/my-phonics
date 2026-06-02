"""
Sound Book: ff + ll — Level 2 (First Sounds)
Combined sound book: two sounds sharing one book.

Each sound gets its own Sound Page followed by its word pages.
The Read Them All page at the end lists all words from both sounds.
"""

book_type = "sound_book"
level = 2
sub_level = 3
book_number = 1

book_title = "Sound Book: ff + ll"
level_colour = "#F97066"
level_name = "L2 — First Sounds"
page_count = 12  # cover + (sound page + 3 words) x 2 + read all + back cover

comparison_sounds = []

sounds = [
    {
        "grapheme": "ff",
        "instruction": "Say the sound: ff. This is a double letter — two f's make one sound. ff!",
        "words": [
            {
                "word": "huff",
                "word_html": "hu<span style='color:#F97066; font-weight:bold;'>ff</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
            {
                "word": "cuff",
                "word_html": "cu<span style='color:#F97066; font-weight:bold;'>ff</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
            {
                "word": "off",
                "word_html": "o<span style='color:#F97066; font-weight:bold;'>ff</span>",
                "photo": None,
                "sound_buttons": ["dot", "dash"],
            },
        ],
    },
    {
        "grapheme": "ll",
        "instruction": "Say the sound: ll. Another double letter — two l's make one sound. ll!",
        "words": [
            {
                "word": "bell",
                "word_html": "be<span style='color:#F97066; font-weight:bold;'>ll</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
            {
                "word": "hill",
                "word_html": "hi<span style='color:#F97066; font-weight:bold;'>ll</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
            {
                "word": "doll",
                "word_html": "do<span style='color:#F97066; font-weight:bold;'>ll</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
        ],
    },
]
