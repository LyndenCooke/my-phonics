"""
You Are Remarkable — Level 6.2 Story
Focus sounds: able, ible
Setting: Guilin, Guangxi, China — Lantern Festival (Yuanxiao), Li River riverside park,
         karst limestone mountains, modern city, lantern stalls, street food
Written 2026-03-18

Cultural Brief Applied:
- Guilin is a modern Chinese city surrounded by dramatic karst limestone mountains.
- The Li River runs through the city; the riverside parks are gathering places.
- Yuanxiao (Lantern Festival) on the 15th night of Chinese New Year is a living,
  celebrated tradition — families gather to view lanterns, eat tangyuan, release
  river lanterns, and enjoy street food stalls.
- January/February in Guilin: mild winter, 8–15°C, overcast or clear evenings.
- Contemporary-first: the girl wears a red padded jacket + dark jeans + trainers
  (standard Chinese children's winter casual wear). NOT a qipao or hanfu.
- Security guards at Chinese public parks/events wear distinctive high-vis jackets.
- Sweet potato (hong shu) roasted on street carts is extremely common in China winter.
- "Xiao peng you" (小朋友) = "little friend" — how adults address small Chinese children.
- Stuffed panda: iconic, universally beloved in China; a child's natural toy.

Story structure: Cumulative Chain (each step of helping leads to the next)
Grammar focus: Complex sentences with multiple clauses, passive constructions,
               reported speech, reflective evaluative language
Non-fiction feature: Letter/Note — the girl writes a note and shows it to people;
                     the note text appears embedded in the story on page 3.

Phonics validation: ALL words verified decodable at L6 cumulative level
(full phonics code) or are cumulative tricky words L1-L6.

Focus 'able' words: capable (×4), remarkable (×3), comfortable (×2), adorable (×1),
                    valuable (×1), admirable (×1), readable (×1)
Focus 'ible' words: miserable (×2), terrible (×2), responsible (×2), sensible (×2),
                    possible (×3), incredible (×2), visible (×1)
Grand total: 27 able/ible appearances

Consonant clusters used: fl, gl, cr, str, bl, gr, pl, sn, sp, cl (all unlocked at L3+)
Total word count: ~455 (target 380–500) ✓
Sentences per page: 5–6 (target 5–6) ✓
"""

# ---------------------------------------------------------------------------
# LOCKED CHARACTER SPECS (added 2026-08-05 after the boy drifted across the
# whole book).  The girl was always given her full spec in every page prompt;
# the boy was only ever "the small boy with stuffed panda", so the generator
# reinvented him page by page — three different haircuts, buttons and pocket
# appearing and vanishing, shoes flipping between white, navy and black.
#
# Rule for this book: BOTH children get their full spec in EVERY prompt, and
# BOTH reference images (hero_reference.png + boy_reference.png) get injected
# into every scene.  Never shorten these to "the boy" or "the girl".
# ---------------------------------------------------------------------------

# The whole story happens on one night. Four pages drifted to daylight on the
# 2026-08-05 re-render because the prompts said "lantern light" but never said
# NIGHT — so this goes in every page prompt verbatim.
NIGHT = (
    "IT IS NIGHT — a dark blue-purple night sky full of stars, everything lit "
    "only by the warm orange glow of the festival lanterns. Never daylight, "
    "never a pale blue or cream daytime sky."
)

NO_LETTERING = (
    "Do NOT draw any letters, words, numbers or Chinese characters anywhere in "
    "the picture — not on signs, stalls, banners, lanterns, badges or paper. "
    "Any signage must be blank or purely decorative shapes."
)

GIRL_SPEC = (
    "the older girl (8–9 years old, Chinese, skin #D4A574, straight black hair "
    "#1A1110 in two short plaits, bright red padded puffer jacket, dark navy "
    "jeans, white trainers)"
)

# No button COUNT on purpose — the generator miscounts "N of something", so a
# described row reads more reliably than a number.
BOY_SPEC = (
    "the little lost boy (a VERY YOUNG child of about THREE years old — small, "
    "short and round, with a big round head, full round cheeks with soft pink "
    "blush, and a NEAT SHORT BLACK BOWL CUT whose straight fringe sits well "
    "above his eyebrows and whose sides are cut ABOVE HIS EARS so both ears are "
    "clearly visible — never a long helmet of hair covering the ears. He wears "
    "a navy blue mandarin-collar jacket fastened by a vertical row of round "
    "BRIGHT GREEN buttons down the centre of his chest, with one small navy "
    "patch pocket low on his right-hand side, navy trousers, and WHITE trainers "
    "— the uppers are WHITE, with at most a thin blue stripe; NEVER navy, blue "
    "or dark uppers. He clutches a plain black-and-white stuffed panda with no "
    "collar, scarf or ribbon. He must read as a toddler: big head relative to "
    "his body, short arms and legs, standing no higher than the older girl's "
    "waist)"
)

REMARKABLE_STORY_BOOK1 = {
    "L6_2_B1": {
        "level": 6,
        "sub_level": 2,
        "book_number": 1,
        "book_title": "You Are Remarkable",
        "level_name": "Reading Champion",
        "level_colour": "#14B8A6",
        "font_size": 14,
        "focus_graphemes": ["able", "ible"],
        "all_level_graphemes": ["ous", "cious", "tious", "able", "ible"],
        "story_pages": [
            {
                "page_number": 1,
                "text": (
                    "The Lantern Festival had filled the river park with golden light. "
                    "Hundreds of glowing lanterns drifted above the Li River, and the karst mountains "
                    "rose like dark peaks behind the city. "
                    "The girl was watching a paper lantern float upwards when she noticed something terrible. "
                    "A small boy sat alone on a stone step, clutching a stuffed panda, with tears on his face. "
                    "The people all around him walked past as if he were invisible. "
                    "She stopped."
                ),
                "image_prompt": (
                    "Riverside festival park in Guilin, China, at night. Hundreds of red and gold paper "
                    "lanterns float above the Li River, with dramatic dark karst limestone mountains "
                    "silhouetted against a deep blue-purple sky. Modern city lights reflect in the river. "
                    f"{GIRL_SPEC} stands mid-path, having just stopped walking, looking down to one side "
                    "with a concerned expression. Sitting small and hunched on a low stone step nearby, "
                    f"{BOY_SPEC} clutches his panda and cries, while crowds of festival-goers walk past "
                    "him. He is SITTING and is much smaller than the girl — his seated head reaches only "
                    "about her hip. He MUST be holding the black-and-white stuffed panda in both arms — "
                    "the panda is essential and must be clearly visible. "
                    "Draw the whole of both children, full length. "
                    "Warm golden lantern light. Whimsical children's book illustration style, flat colour "
                    f"with soft watercolour texture. {NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots ONLY — no white, no "
                    "highlights. No text in image. Landscape orientation."
                ),
            },
            {
                "page_number": 2,
                "text": (
                    "She crouched down beside the boy and spoke to him in a gentle voice. "
                    "He was perhaps three years old, and he looked absolutely miserable — "
                    "his face red, his eyes wide, his small hands gripping the panda. "
                    "\"Where is your family?\" she asked, but he could only shake his head and sob. "
                    "It was clear he was not capable of finding them alone. "
                    "She looked around at the crowds flowing past, and she made a decision: "
                    "she was responsible for helping him, and it was possible to do it."
                ),
                "image_prompt": (
                    f"Close-up scene on a paved riverside path at night: {GIRL_SPEC} crouches down on "
                    f"one knee to meet the eyes of {BOY_SPEC}, who stands facing her holding his panda. "
                    "The girl's expression is warm, gentle and determined. "
                    "The boy looks miserable — round red-cheeked face, tears on his cheeks. "
                    "Even with the girl kneeling, the boy is only a little taller than she is. "
                    "Draw the whole of both children, full length, including their shoes. "
                    "Blurred festival-goers and floating river lanterns in warm lantern light behind them. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. No text. Landscape orientation."
                ),
            },
            {
                "page_number": 3,
                "text": (
                    "She pulled a small notebook from her jacket pocket and thought for a moment. "
                    "Then she wrote a careful note in neat, readable handwriting and tore it out. "
                    "The note said: "
                    "\"Lost child — dark jacket, green buttons, age 3. "
                    "He is by the red lantern at the bridge. "
                    "His family is searching for him. "
                    "If you have seen them, please come at once.\" "
                    "She held it up as high as she could. "
                    "It was a sensible and responsible plan."
                ),
                "image_prompt": (
                    f"{GIRL_SPEC} kneels on the stone path and holds a small white piece of paper up "
                    "high in one hand. Her face is calm and focused, her arm raised to show the note to "
                    f"the passing crowds. Beside her sits {BOY_SPEC}, cross-legged on the ground with "
                    "his panda in his lap, looking up at her. Lantern stalls line the path either side. "
                    "Warm lantern light. "
                    "The note is a BLANK piece of white paper with only faint wavy pen strokes to "
                    "suggest handwriting — do NOT draw any real or invented letters or Chinese "
                    "characters anywhere in the picture. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. Landscape orientation."
                ),
            },
            {
                "page_number": 4,
                "text": (
                    "She took the boy's hand and walked towards the busy lantern stalls. "
                    "An elderly woman selling tangyuan shook her head when she saw the note, "
                    "but pointed further along the riverbank towards the bridge. "
                    "A group of young people gathered, read the note and looked around — "
                    "but nobody recognised the child. "
                    "Each person was willing, but none were able to help. "
                    "She did not give up. "
                    "Giving up was not a reasonable or responsible option."
                ),
                "image_prompt": (
                    f"{GIRL_SPEC} holds the note up in one hand towards an elderly Chinese woman behind "
                    "a lantern stall of steaming red bowls of tangyuan (white glutinous rice balls in "
                    "clear broth), and holds the hand of "
                    f"{BOY_SPEC} with her other hand. THE GIRL holds the note, not the boy — the boy's "
                    "hands are busy with his panda and the girl's hand. "
                    "The elderly woman shakes her head with a kind expression and points along the "
                    "riverbank. Festival lanterns glow all around. Karst mountains visible in background. "
                    "Draw the whole of both children, full length, including their shoes. "
                    "The note is a BLANK piece of white paper — do NOT draw any real or invented letters "
                    "or Chinese characters anywhere in the picture. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. Landscape orientation."
                ),
            },
            {
                "page_number": 5,
                "text": (
                    "Near the entrance of the park, she spotted a security guard in a yellow jacket. "
                    "She walked straight up to him, held out the note and said clearly, "
                    "\"This child is lost. He has been here for some time.\" "
                    "The guard read the note carefully, nodded and spoke into his radio. "
                    "He asked her to stay in one comfortable spot beside the red lantern at the bridge. "
                    "She sat with the boy and told him a quiet story about the panda in his arms. "
                    "He stopped crying and leaned against her shoulder."
                ),
                "image_prompt": (
                    f"{GIRL_SPEC} stands before a Chinese security guard (middle-aged man, bright "
                    "yellow high-visibility jacket, dark trousers) and holds out her note, which he "
                    f"reads seriously. {BOY_SPEC} stands beside her holding HER hand, not the guard's — "
                    "his head reaches only her waist and barely past the guard's knee. He MUST be "
                    "holding the black-and-white stuffed panda in his other arm — the panda is "
                    "essential and must be clearly visible. "
                    "A large bright red paper lantern hangs above a stone arch behind them, with the "
                    "lantern-lit river and karst mountains beyond. "
                    "Fill the whole frame with the scene as a single continuous illustration — do NOT "
                    "draw the scene as a framed picture or vignette floating on a blank background. "
                    "Draw the whole of all three figures, full length, including their shoes. "
                    "The boy's trainers MUST be WHITE — not navy, not dark. "
                    "The note is a BLANK piece of white paper — do NOT draw any real or invented letters "
                    "or Chinese characters anywhere in the picture. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. Landscape orientation."
                ),
            },
            {
                "page_number": 6,
                "text": (
                    "While they waited, she bought the boy a warm roasted sweet potato from a nearby cart. "
                    "His face changed — from miserable and terrified, to curious, to something almost cheerful. "
                    "He held the sweet potato in both hands and looked up at her. "
                    "\"Panda,\" he said, and held the toy out to her. "
                    "It was an adorable thing to do, and she understood it at once — "
                    "he was sharing his most valuable possession with her. "
                    "She held it carefully, and for the first time that evening, he smiled."
                ),
                "image_prompt": (
                    "Night scene beside a stone bridge, with a large bright red paper lantern glowing "
                    f"above and karst mountains behind. {GIRL_SPEC} sits on a low stone wall. Standing "
                    f"in front of her is {BOY_SPEC}, looking curious and calmer. A split-open roasted "
                    "sweet potato with orange flesh in its charred skin rests on the wall beside the "
                    "girl. The boy holds his panda out towards her in both hands, offering it, and she "
                    "reaches out to take it gently with a warm smile. Standing, the boy's head reaches "
                    "only the seated girl's shoulder. "
                    "Draw the whole of both children, full length, including their shoes. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. No text. Landscape orientation."
                ),
            },
            {
                "page_number": 7,
                "text": (
                    "The guard came running back with a woman and a man following close behind. "
                    "The little boy looked up — and in less than a second, his face went from "
                    "frightened to overjoyed. "
                    "\"Mama!\" he cried, and the woman rushed forward and scooped him up, "
                    "clutching him in an incredible, tearful hug. "
                    "The man gripped the guard's hand and then looked at the girl "
                    "with a grateful and disbelieving expression. "
                    "She stood a little way back, watching the most remarkable reunion "
                    "she had ever seen, with something warm and steady building inside her."
                ),
                "image_prompt": (
                    "Joyful reunion scene by the lantern-lit river and stone bridge. "
                    "A Chinese woman in her 30s (grey padded winter coat, long dark hair, dark "
                    f"trousers) kneels down with her arms wrapped around {BOY_SPEC}, both of them "
                    "crying with joy — his round cheeks are lifted in a big open smile. He MUST still be "
                    "clutching his black-and-white stuffed panda, held out to one side so the whole "
                    "panda is clearly visible and not hidden by the hug. Keep his bowl-cut hair, his "
                    "green jacket buttons and his white trainers clearly visible past his mother's arms. "
                    "His father — a Chinese man in his 30s in a dark winter coat — stands right beside "
                    "them and MUST be in the picture. "
                    "A Chinese man beside her grips the hand of the security guard, who is the SAME "
                    "guard as earlier in the book and MUST still be wearing his bright yellow "
                    "high-visibility jacket with dark trousers — never a navy or dark uniform. "
                    f"{GIRL_SPEC} stands slightly apart, watching the reunion with a warm, quiet smile. "
                    "Red lanterns glow above, karst mountains in the background. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. No text. Landscape orientation."
                ),
            },
            {
                "page_number": 8,
                "text": (
                    "The mother turned to the girl, still holding her son tightly. "
                    "\"You kept him safe,\" she said, and her voice was not quite steady. "
                    "\"You stayed. You helped.\" "
                    "She paused for a moment, and then she said something the girl would always remember. "
                    "\"You are remarkable.\" "
                    "The girl walked back through the incredible festival, past the glowing lanterns "
                    "and the karst mountains rising in the dark. "
                    "She thought about what it meant to be capable, and she thought it was quite simple: "
                    "when something terrible is visible, a responsible person does not walk past."
                ),
                "image_prompt": (
                    "Night riverside festival scene. The Chinese mother (grey padded winter coat, long "
                    f"dark hair) kneels to look at {GIRL_SPEC} face to face, holding both her hands "
                    "warmly and speaking to her with tears of gratitude in her eyes. The girl's "
                    "expression is quietly proud and calm. Standing close by and watching is "
                    f"{BOY_SPEC} — his head reaches only the girl's waist. "
                    "Draw the whole of both children, full length, including their shoes. "
                    "Hundreds of glowing lanterns float above the Li River in the background, "
                    "with dramatic dark karst mountains silhouetted against the night sky. "
                    f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots. No text. Landscape orientation."
                ),
            },
        ],
        "cover_prompt": (
            "Chinese girl (8–9 years old, skin #D4A574, straight black hair #1A1110 in two short plaits, "
            "bright red padded puffer jacket, dark navy jeans, white trainers) holds the hand of a small "
            "Chinese boy (3–4 years old, dark jacket with green buttons) who clutches a stuffed "
            "black-and-white panda. They stand on a riverside path in Guilin, China, at night, "
            "surrounded by hundreds of glowing red and gold paper lanterns floating above the Li River. "
            "Dramatic dark karst limestone mountains rise behind the city lights. "
            "The girl looks calm, warm, and determined. "
            "Whimsical children's book illustration style, flat colour with soft watercolour texture. "
            f"{NIGHT} {NO_LETTERING} "
                    "Eyes: tiny solid black dots ONLY — no white, no highlights. "
            "No text in image. Portrait orientation (3:4)."
        ),
        # Practice-page words: only CLOSED-SYLLABLE -able/-ible items where
        # the syllable before the suffix has a real (short) vowel that the
        # child can sound out cleanly.  Open-syllable words like "capable"
        # /keɪ-pə-bəl/ and "remarkable" /rɪ-MAR-kə-bəl/ still appear in the
        # story text (with adult support) but are pulled from Read Words,
        # Listen-and-Write and Writing Practice to keep encoding clean.
        "story_words": [
            "sensible", "possible", "terrible", "horrible",
            "visible", "incredible", "responsible", "predictable",
        ],
        # The 's' in these two says /z/, not /s/ — a taught letter making one
        # of its other sounds, so it takes the slate diamond (PEDAGOGY §5),
        # not an ordinary dot.  Say them against their neighbours in the list:
        # sensible, possible and responsible all keep a true /s/ and must NOT
        # be marked, which is why this is per-word and not a rule about the
        # -sible ending (Lynden 2026-08-06).
        "shifty_marks": {
            "visible": [{"index": 2, "says": "/z/"}],
            # index was 3 until 2026-08-16 — that is the 'e', not the 's'.
            # is_shifty_allowed found no /z/ on 'e'/'er' and silently dropped
            # the mark, so the s printed with an ordinary dot.  m-i-s = 2.
            "miserable": [{"index": 2, "says": "/z/"}],
        },
        "tricky_words_used": ["the", "said", "was", "you", "her", "their", "people", "thought"],
        "read_words": ["sensible", "possible", "terrible", "incredible"],
        "nonsense_words": [
            "flable", "grable", "strable", "brable", "crable",
            "flosible", "grisible", "strable", "plossible", "drisible",
        ],
        "questions": [
            {
                "category": "Finding",
                "text": "What did the girl write in her note, and why was it helpful?",
            },
            {
                "category": "Thinking",
                "text": "Why did the girl not give up when the first people she asked could not help?",
            },
            {
                "category": "Words",
                "text": "What does 'remarkable' mean? Can you think of a time someone was remarkable?",
            },
            {
                "category": "What next",
                "text": "What do you think the girl told her family when she found them again?",
            },
        ],
        "writing_graphemes": ["able", "ible"],
        "writing_words": [
            "sensible", "possible", "terrible", "horrible",
            "visible", "incredible", "responsible", "predictable",
        ],
        "writing_starters": [
            "It was possible to help because...",
            "She was sensible when she...",
        ],
        # Open-syllable -able words and other awkward pronunciations are listed
        # here so the grown-up can pre-say them when they crop up in the story
        # text.  The Listen-and-Write / Read Words pages never use these — only
        # the story text does, where the parent is reading alongside.
        "pronunciation_notes": [
            {
                "title": "Watch Out — How to Say",
                # Six of the nine entries here were the SAME -able pattern
                # (capable, remarkable, miserable, adorable, valuable,
                # admirable), which filled the box and taught one rule six
                # times over — Lynden 2026-07-29: "too much in one column and
                # potentially too many words".  Same ruling as the -ed guide
                # (2026-07-25): give the rule, then two examples that show
                # what varies, not every word in the story.  Kept: the plain
                # case (remarkable) and the one that drops a syllable
                # (miserable), plus the three genuine one-offs.
                "body": (
                    "These story words don't follow the normal sound rules.  "
                    "The ending -able always says 'uh-bul', however long the "
                    "word looks.  Say each one once before reading so your "
                    "child hears the real word."
                ),
                "examples": [
                    "remarkable → ri-MARK-uh-bul",
                    "miserable → MIZ-ruh-bul",
                    "recognised → REK-og-nized",
                    "bridge → brij",
                    "tangyuan → tang · yoo · an",
                ],
            },
        ],
        "character": {
            "name": "Chinese girl",
            "age": "8–9 years old",
            "ethnicity": "Chinese (Guangxi/Guilin)",
            "skin_hex": "#D4A574",
            "hair_hex": "#1A1110",
            "appearance": (
                "Light-medium East Asian skin (#D4A574). Straight dark black-brown hair (#1A1110) "
                "in two short plaits. Warm, calm, determined expression. Bright eyes (tiny solid black dots)."
            ),
            "outfit": (
                "Bright red padded puffer jacket (standard Chinese children's winter outdoor wear). "
                "Dark navy jeans. White trainers. "
                "Full coverage: jacket fully covers torso and arms, jeans fully cover legs. ✓ "
                "Contemporary-first: this is what a Chinese child actually wears to a winter festival."
            ),
            "notes": (
                "Guilin setting shown through: Li River lanterns, karst mountains, tangyuan stall, "
                "sweet potato cart, security guard in yellow jacket. "
                "Contemporary-first: modern casual clothes, NOT traditional hanfu or qipao. "
                "Traditional elements (Yuanxiao festival, lanterns, tangyuan) exist within modern life."
            ),
        },
        "side_characters": {
            "lost_boy": {
                "name": "Small boy (lost child)",
                "appearance": BOY_SPEC,
                "outfit": (
                    "Navy blue mandarin-collar jacket, vertical row of round bright green buttons "
                    "down the centre front, one small navy patch pocket low on his right-hand side, "
                    "navy trousers, WHITE trainers with blue trim."
                ),
                "notes": (
                    "Reference image: boy_reference.png — MUST be injected into every scene he "
                    "appears in, exactly like the girl's hero_reference.png. Text description alone "
                    "is not enough: it was tried for pages 1-8 and gave him three different haircuts "
                    "and disappearing buttons (2026-08-05). His three fixed identifiers are the neat "
                    "bowl cut with ears showing, the green button row, and the white trainers."
                ),
            },
            "security_guard": {
                "name": "Security guard",
                "appearance": "Middle-aged Chinese man. Short black hair. Calm, professional manner.",
                "outfit": "Bright yellow high-visibility jacket. Dark trousers.",
                "notes": "Standard uniform for Chinese public park/event security.",
            },
            "mother": {
                "name": "Mother (the lost boy's mum)",
                "appearance": "Chinese woman, early 30s. Dark hair. Grey winter coat.",
                "outfit": "Grey padded winter coat. Dark trousers.",
                "notes": "Only appears on pages 7–8. Tearful, grateful, warm.",
            },
        },
        "recurring_objects": {
            "stuffed_panda": (
                "Small stuffed black-and-white panda bear, roughly the size of the boy's head. "
                "The boy clutches it throughout pages 1–7. It is his comfort object."
            ),
            "the_note": (
                "Small piece of white paper torn from a notebook. "
                "Neat handwriting in black pen. Held up by the girl from page 3 onwards."
            ),
            "red_lantern_bridge": (
                "A large, round bright red paper lantern hanging from a stone bridge arch. "
                "This is the landmark where the girl waits with the boy (pages 5–6)."
            ),
        },
        "cultural_notes": {
            "setting": "Guilin, Guangxi, China — Yuanxiao Lantern Festival, Li River riverside park",
            "approach": (
                "Contemporary-first. Guilin is a modern Chinese city; the karst mountains are simply "
                "the backdrop of daily life there, not a 'heritage' element. "
                "The Lantern Festival is a living, joyful tradition celebrated city-wide. "
                "Street food stalls (tangyuan, sweet potato), security guards in yellow jackets, "
                "and riverside parks with festival crowds are all genuine, contemporary details. "
                "The girl's red puffer jacket + jeans is exactly what a Chinese child wears in winter. "
                "The stuffed panda is culturally authentic and universally recognisable as a Chinese toy. "
                "Mandarin term 'Xiao peng you' (little friend) could be used optionally."
            ),
        },
    }
}
