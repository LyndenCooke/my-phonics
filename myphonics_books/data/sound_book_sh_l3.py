"""
Sound Book: sh — Level 3 (Special Friends)
Sample data file demonstrating the Sound Book data structure.

Variables:
  sounds          list of dicts, each with grapheme, instruction, and words
  comparison_sounds   list of alternative spellings shown at L5+ (empty here)
  book_title      display title
  level_colour    hex colour for the level
  level_name      display name for the level band
  page_count      total pages (used by generate_book.py for template selection)
  book_type       "sound_book" — used to select the sound_book.html template
"""

book_type = "sound_book"
level = 3
sub_level = 1
book_number = 1

book_title = "Sound Book: sh"
level_colour = "#F59E0B"
level_name = "L3 — Special Friends"
page_count = 10  # cover + sound page + 6 word pages + read all + back cover

# Empty at L1-L4. At L5+ this lists alternative spellings of the same phoneme.
comparison_sounds = []

sounds = [
    {
        "grapheme": "sh",
        "instruction": "Say the sound: sh. Lips pushed forward, quiet sound. Can you think of a word with sh?",
        "words": [
            {
                "word": "ship",
                "word_html": "<span style='color:#F59E0B; font-weight:bold;'>sh</span>ip",
                "photo": None,  # Replace with base64 data URI of a real photo
                "sound_buttons": ["dash", "dot", "dot"],
            },
            {
                "word": "shop",
                "word_html": "<span style='color:#F59E0B; font-weight:bold;'>sh</span>op",
                "photo": None,
                "sound_buttons": ["dash", "dot", "dot"],
            },
            {
                "word": "shed",
                "word_html": "<span style='color:#F59E0B; font-weight:bold;'>sh</span>ed",
                "photo": None,
                "sound_buttons": ["dash", "dot", "dot"],
            },
            {
                "word": "shell",
                "word_html": "<span style='color:#F59E0B; font-weight:bold;'>sh</span>e<span style='color:#F59E0B; font-weight:bold;'>ll</span>",
                "photo": None,
                "sound_buttons": ["dash", "dot", "dash"],
            },
            {
                "word": "fish",
                "word_html": "fi<span style='color:#F59E0B; font-weight:bold;'>sh</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
            {
                "word": "mesh",
                "word_html": "me<span style='color:#F59E0B; font-weight:bold;'>sh</span>",
                "photo": None,
                "sound_buttons": ["dot", "dot", "dash"],
            },
        ],
    }
]
