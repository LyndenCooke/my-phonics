"""
Blend Books — Pre-L1 / RWI Sound Blending Book equivalent.

Four 8-page A6 mini-books that teach blending strictly within SATPIN+MDGO,
introduced cumulatively. Tricky words allowed: 'I', 'the' (only).

Format: one CVC (or VC) word + matching picture per page, picture-dominant.
No connected narrative required; repetition + image cue is the engine.

Constraints (per new Curriculum Ledger v2.0, L1 Ditties):
  - Only the cumulative grapheme set per book.
  - Tricky words: I, the only.
  - CVC or VC only. No consonant clusters. No digraphs. No double letters.
  - Plurals (-s) NOT yet permitted at this level.

These are DRAFT outlines for OpenAI senior-literacy review before image-gen.
"""

BLEND_BOOKS = {
    "Blend_1": {
        "book_number": 1,
        "title": "Sat!",
        "focus_graphemes_new": ["s", "a", "t"],
        "cumulative_graphemes": ["s", "a", "t"],
        "tricky_words_allowed": ["I", "the"],
        "structure": "word-card",  # single word per page + image, no sentences
        "pages": [
            {"word": "at",   "image_prompt": "child standing AT a doorway, looking in"},
            {"word": "sat",  "image_prompt": "child sitting on a low chair"},
            {"word": "at",   "image_prompt": "child standing AT a table"},
            {"word": "sat",  "image_prompt": "child sitting on a mat (the mat itself is undescribed visually — child only)"},
            {"word": "I sat", "image_prompt": "child sitting cross-legged, smiling"},
            {"word": "Sat!", "image_prompt": "child triumphantly seated on a small stool"},
        ],
        "note_for_consult": "3-letter pool is extremely thin. Is word-card format the right call? Should Book 1 instead drill /a/ + /s/ + /t/ as standalone sounds with no blending yet?",
    },

    "Blend_2": {
        "book_number": 2,
        "title": "I Sip, I Tap",
        "focus_graphemes_new": ["p", "i", "n"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n"],
        "tricky_words_allowed": ["I", "the"],
        "structure": "fragment",  # 2-3 word fragments per page
        "pages": [
            {"text": "I sit.",     "image_prompt": "child sitting on the floor"},
            {"text": "I tap.",     "image_prompt": "child tapping on a desk with one finger"},
            {"text": "I sip.",     "image_prompt": "child sipping water from a cup"},
            {"text": "A pin.",     "image_prompt": "single safety pin on a plain surface"},
            {"text": "A pan.",     "image_prompt": "single small frying pan on a plain surface"},
            {"text": "I nap.",     "image_prompt": "child curled up sleeping"},
        ],
        "note_for_consult": "Mix of 'I + verb' patterns and 'A + noun' patterns. Is the variety helpful or confusing? Should I commit to one pattern for the whole book?",
    },

    "Blend_3": {
        "book_number": 3,
        "title": "Mum and Dad",
        "focus_graphemes_new": ["m", "d"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n", "m", "d"],
        "tricky_words_allowed": ["I", "the"],
        "structure": "fragment",
        "pages": [
            {"text": "I am Pat.",    "image_prompt": "child smiling at camera, name-tag energy"},
            {"text": "Pat is sad.",  "image_prompt": "the same child looking downcast"},
            {"text": "Dad sat.",     "image_prompt": "adult man sitting on a chair"},
            {"text": "Mum sat.",     "image_prompt": "adult woman sitting on a chair next to him"},
            {"text": "Dad is mad.",  "image_prompt": "man with a comical 'mad' face (mock-cross)"},
            {"text": "I am mad!",    "image_prompt": "Pat pulling a mock-cross face like Dad"},
        ],
        "note_for_consult": "'Mum'/'Dad' as decoded proper nouns + 'Pat' as a character name. Is naming a character at this level helpful for narrative attachment, or is it cognitive load?",
    },

    "Blend_4": {
        "book_number": 4,
        "title": "The Dog and the Pot",
        "focus_graphemes_new": ["g", "o"],
        "cumulative_graphemes": ["s", "a", "t", "p", "i", "n", "m", "d", "g", "o"],
        "tricky_words_allowed": ["I", "the"],
        "structure": "mini-narrative",  # gentle through-line
        "pages": [
            {"text": "The dog.",       "image_prompt": "a happy small dog sitting"},
            {"text": "A pot.",         "image_prompt": "a single cooking pot on a kitchen floor"},
            {"text": "The dog sat.",   "image_prompt": "the dog sitting next to the pot"},
            {"text": "I got the pot.", "image_prompt": "child lifting the pot"},
            {"text": "Mum mops.",      "image_prompt": "INVALID — 'mops' has plural-s, not allowed at L1. NEEDS REWRITE."},
            {"text": "The dog is on.", "image_prompt": "the dog sitting ON the upturned pot, comic"},
        ],
        "note_for_consult": "Book 4 attempts a through-line. Page 5 currently has a plural-s violation flagged. Suggest a replacement page that keeps the narrative flow with strict SATPIN+MDGO. Also: is 'is on' as a sentence acceptable, or jarring?",
    },
}
