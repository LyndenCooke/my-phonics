"""
The Fair in the Air — Level 2.4 Focus Story (new-scheme 4.4)
REWRITTEN 2026-07-15 (Lynden: old text didn't make sense — "gush", a hat that
isn't in the art, "I say" tags. Whole story rewritten against the EXISTING
images, no regen needed.)

Focus sounds: air, ir
Setting: British village fair on a windy day

SCENE MAP (text written to match the existing art in output/images/L2_4_B1):
  p1 boy arrives at the fair — stalls, bunting, breeze
  p2 wind whips his big curly hair up, hands on head, laughing (NO hat)
  p3 at the toy stall with the stall man — a pair of yellow ducks to win
  p4 boy jumping for joy holding the two ducks, man clapping
  p5 the wind lifts the pair up into the air, boy chasing
  p6 boy runs to the older fair man, pointing — ducks stuck up a tall fir
  p7 the man climbs and gets the pair from the top of the fir
  p8 boy in a folding chair hugging both ducks, calm golden evening

Taught window at new-4.4 (L1-L3 in full + L4 up to focus): all singles and
consonant digraphs, Phase 4 clusters (L3), and ay, ee, igh, ow(snow), oo,
ar, or, air, ir.  NOT yet taught: ou, oy (so no "toy", no "down", no "now"),
er, ur, are, ew, ue (L4 later books), split digraphs (L5).
No -ed words used (ed lands L7; 4.4 keeps its Future Sounds band clean).

RULINGS APPLIED (2026-07-15): no "gush", no hat, no "I say" tags anywhere.
Dialogue is either untagged or uses decodable "says".

WORD CHECK (non-tricky): fair(f-air) air(air) hair(h-air) pair(p-air)
  sir(s-ir) fir(f-ir) swirls(s-w-ir-l-s) wind(w-i-n-d) win(w-i-n)
  stand(s-t-a-n-d) ducks(d-u-ck-s) man(m-a-n) says(s-ay-s) claps(c-l-a-p-s)
  jump(j-u-m-p) high(h-igh) lifts(l-i-f-t-s) lands(l-a-n-d-s) tree(t-r-ee)
  quick(qu-i-ck) top(t-o-p) from(f-r-o-m) soft(s-o-f-t) chair(ch-air)
  best(b-e-s-t) day(d-ay) see(s-ee) big(b-i-g) cool(c-oo-l) stop(s-t-o-p)
  run(r-u-n) sit(s-i-t) can(c-a-n) it(i-t) is(i-s) in(i-n) up(u-p)
Tricky: the, I, my, to, no, go, he, me, into (+ a/is/of auto-detected).
"""

FAIR_AIR_STORY_BOOK1 = {
    "L2_4_B1": {
        "level": 2,
        "sub_level": "L2.4",
        "book_number": 1,
        "book_title": "The Fair in the Air",
        "focus_graphemes": ["air", "ir"],  # L2.4 focus sounds

        "character_id": "CHAR-E",
        "character_name": "Mixed heritage boy (outdoor explorer) at a village fair",

        "story_pages": [
            {
                "text": "I go to the fair. The fair is so big! The air is cool on my chin.",
                "image": None,
            },
            {
                "text": "A big wind swirls in. It picks up my hair! My hair is up in the air!",
                "image": None,
            },
            {
                "text": "I stop at a stand. A pair of ducks! The man says I can win the pair.",
                "image": None,
            },
            {
                "text": "I win! I win the pair! I jump up high and the man claps for me.",
                "image": None,
            },
            {
                "text": "But the wind swirls back! It lifts my pair up into the air. No, no! My pair!",
                "image": None,
            },
            {
                "text": "My pair lands up in a fir tree. I run to the man. \"Sir! Sir! My pair is in the fir!\"",
                "image": None,
            },
            {
                "text": "The man is quick. Up the fir he goes! He gets my pair from the top.",
                "image": None,
            },
            {
                "text": "The wind is soft. I sit in a chair with my pair. It is the best day at the fair!",
                "image": None,
            },
        ],

        "story_words": ["fair", "air", "pair", "hair", "sir", "fir", "wind"],
        "tricky_words_used": ["the", "I", "my", "to", "no", "go", "he", "me", "into"],  # 'a'/'is'/'of' auto-detected from the master list
        "read_words": ["fair", "pair", "chair", "fir"],
        "nonsense_words": [
            "dair", "jair", "vair", "tair",     # air combinations (vair replaces real word 'lair')
            "gir", "nir", "dir", "bir",          # ir combinations
            "mair", "vair", "zair", "chir",      # mixed digraph onsets
        ],
        "questions": [
            {"category": "Finding", "text": "What did the child win at the fair?"},
            {"category": "Thinking", "text": "Why did the pair go up in the air?"},
            {"category": "Words", "text": "What is a fir?"},
            {"category": "What next", "text": "What would you win at a fair?"},
        ],
        "writing_graphemes": ["air", "ir"],  # Focus sounds from story
        "writing_words": [],
        "writing_starters": [],
    }
}
