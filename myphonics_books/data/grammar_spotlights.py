"""
Grammar Spotlights — the per-book writing-development ladder for all 33
MyPhonicsBooks titles.  Sourced from a senior-pedagogue consultation
(gpt-5, 2026-05-10, "From Sounds to Sense — building a writer in 33 small
steps") and stored verbatim so a developer can ship the design without
re-deriving it.

Each book has ONE focus skill + ONE prior-skill review, manifested in the
SAME five touchpoints in every book:

    grownups_tip   — coaching line on the Guide for Grown-Ups page (p2)
    reference_tip  — Writing Tip on the Sounds + Story Words page (p3)
    spot_it        — margin nudge on one story page (default: page 2)
    retell_note    — single line above the retell scaffold (p15)
    spotlight      — Word Workshop mini-task (p17), optional structured
                     items + Listen-and-Write extension on p18

The `spotlight` sub-object, when present, has:
    skill        — short heading
    instruction  — one-line task instruction
    items        — list of {text, choices?} rows (tickbox or open answer)

When `spotlight` is absent, the template auto-builds a text-only spotlight
from `focus_skill` + the Spotlight portion of `workshop_listen_write`.

The L1.1-L6.4 ladder is dense by design — one new behaviour per book, with
a tangible mastery signal so an adult can tell whether it landed.
"""

GRAMMAR_SPOTLIGHTS = {
    # ─── Level 1 (10 books) — Sentence foundations + simple grammar ─────
    "1.1": {
        "book": "L1.1",
        "focus_skill":    "Finger spaces — leave one clear space between words.",
        "carry_review":   ["Left-to-right sweep", "Say-it-stretch-it-write-it (CVC)"],
        "mastery_signal": "In a two-word caption, space is visible between both words without prompting.",
        "grownups_tip":   "Say: 'Write two words from the story. Put one finger down to make a space between them.' Model 'A cat' with a gap.",
        "reference_tip":  "After a word, lift your pencil and leave a space you can see. e.g. 'A cat'.",
        "spot_it":        "Point to three spaces on this page. Spaces help us read.",
        "retell_note":    "Remember: one space between each word.",
        "workshop_listen_write": "Spotlight: Write two captions using story words, e.g., 'A ___'. 'A ___'. Listen-and-Write: adult dictates two-word captions from the story; child draws a finger gap between words.",
        "spotlight": {
            "skill": "Finger spaces between words",
            "instruction": "Complete each caption; leave one clear space.",
            "items": [
                {
                    "text": "A ___"
                },
                {
                    "text": "A ___"
                }
            ]
        },
    },
    "1.2": {
        "book": "L1.2",
        "focus_skill":    "Full stop — end the sentence with a dot.",
        "carry_review":   ["Finger spaces"],
        "mastery_signal": "Adds a full stop at the end of both retell sentences without a reminder.",
        "grownups_tip":   "Say: 'When your sentence is finished, put a dot. It shows STOP.' Tap the page where the stop goes.",
        "reference_tip":  "A full stop (.) shows the end. 'It is a cat.'",
        "spot_it":        "Find a full stop on this page. Touch it and say 'stop'.",
        "retell_note":    "End each sentence with a full stop.",
        "workshop_listen_write": "Spotlight: Copy two story sentences and add the missing full stop. Listen-and-Write: adult dictates one 4–5 word sentence; child adds a full stop.",
        "spotlight": {
            "skill": "Full stop at end",
            "instruction": "Copy and add a full stop at the end.",
            "items": [
                {
                    "text": "It is a cat"
                },
                {
                    "text": "I sit on the mat"
                }
            ]
        },
    },
    "1.3": {
        "book": "L1.3",
        "focus_skill":    "Capital letter to start a sentence (A, I).",
        "carry_review":   ["Full stops", "Finger spaces"],
        "mastery_signal": "Begins both retell sentences with a capital without prompting.",
        "grownups_tip":   "Say: 'A big letter starts a sentence.' Model writing 'A' or 'I' to begin.",
        "reference_tip":  "Start with a capital. 'A cat sits.'  'I can hop.'",
        "spot_it":        "Circle the first big letter in a sentence on this page.",
        "retell_note":    "Start with a capital letter.",
        "workshop_listen_write": "Spotlight: Change the first letter to a capital in two sentences from the story. Listen-and-Write: adult says 'a cat sits'; child writes 'A cat sits.'",
        "spotlight": {
            "skill": "Capital to start",
            "instruction": "Change the first letter to a capital; copy it.",
            "items": [
                {
                    "text": "a cat sits."
                },
                {
                    "text": "i can hop."
                }
            ]
        },
    },
    "1.4": {
        "book": "L1.4",
        "focus_skill":    "Join two nouns with 'and'.",
        "carry_review":   ["Capital to start", "Full stop"],
        "mastery_signal": "Writes a 5–6 word sentence with 'and' linking two nouns, with spaces intact.",
        "grownups_tip":   "Say: 'Use and to join two things: \"A cat and a dog.\"'",
        "reference_tip":  "'and' links two nouns. 'A hat and a cap.'",
        "spot_it":        "Find 'and' on this page. Read the two things it links.",
        "retell_note":    "Use 'and' to link two things from the story.",
        "workshop_listen_write": "Spotlight: Build three noun phrases with 'and' ('a ___ and a ___'). Listen-and-Write: adult dictates 'A ___ and a ___.' Child writes with a single 'and'.",
        "spotlight": {
            "skill": "Join nouns with and",
            "instruction": "Complete: a ___ and a ___.",
            "items": [
                {
                    "text": "a ___ and a ___"
                },
                {
                    "text": "a ___ and a ___"
                }
            ]
        },
    },
    "1.5": {
        "book": "L1.5",
        "focus_skill":    "Sentence frame: 'It is a …'",
        "carry_review":   ["Capital to start", "Full stop"],
        "mastery_signal": "Writes 'It is a ___.' twice using story nouns with correct spacing and punctuation.",
        "grownups_tip":   "Say: 'Tell me the sentence: It is a ___. Now write it.'",
        "reference_tip":  "Say it first. 'It is a mat.'",
        "spot_it":        "Find 'is' on this page. Read the whole sentence aloud.",
        "retell_note":    "Use the frame: 'It is a ___.'",
        "workshop_listen_write": "Spotlight: Complete 'It is a ___.' twice with story nouns. Listen-and-Write: adult dictates one 'It is a ___.' sentence from the story pictures.",
        "spotlight": {
            "skill": "Sentence frame: It is a",
            "instruction": "Complete each: It is a ___.",
            "items": [
                {
                    "text": "It is a ___"
                },
                {
                    "text": "It is a ___"
                }
            ]
        },
    },
    "1.6": {
        "book": "L1.6",
        "focus_skill":    "Use 'I' (capital) as a word.",
        "carry_review":   ["Spaces", "Full stop"],
        "mastery_signal": "Writes 'I can ___.' with a capital I and correct end mark.",
        "grownups_tip":   "Say: 'I is always a capital when it stands alone.'",
        "reference_tip":  "'I' is big. 'I can sit.'",
        "spot_it":        "Find 'I' on this page and touch the capital.",
        "retell_note":    "Try one sentence with 'I': 'I can ___.'",
        "workshop_listen_write": "Spotlight: Write 'I can ___.' using a story verb. Listen-and-Write: adult dictates 'I can ___.' with a decodable verb from the book.",
        "spotlight": {
            "skill": "Capital I as a word",
            "instruction": "Complete: I can ___. Add a full stop.",
            "items": [
                {
                    "text": "I can ___"
                },
                {
                    "text": "I can ___"
                }
            ]
        },
    },
    "1.7": {
        "book": "L1.7",
        "focus_skill":    "Plurals -s (more than one).",
        "carry_review":   ["Capital to start", "Full stop"],
        "mastery_signal": "Adds -s to make regular plurals in two captions from the story.",
        "grownups_tip":   "Say: 'One cat, two cats. Add s for more than one.'",
        "reference_tip":  "+s makes more than one. 'cats', 'hats'.",
        "spot_it":        "Spot a word on this page that ends with s. Is it more than one?",
        "retell_note":    "If there is more than one, add s (cats).",
        "workshop_listen_write": "Spotlight: Change 'a ___' to '___s' twice using story nouns. Listen-and-Write: adult dictates 'I see ___s.'; child writes with -s.",
        "spotlight": {
            "skill": "Plurals with -s",
            "instruction": "Change 'a ___' to '___s'; write the new word.",
            "items": [
                {
                    "text": "a cat → ___s"
                },
                {
                    "text": "a hat → ___s"
                }
            ]
        },
    },
    "1.8": {
        "book": "L1.8",
        "focus_skill":    "One describing word before a noun (a big cat).",
        "carry_review":   ["Spaces", "Full stop"],
        "mastery_signal": "Writes two noun phrases with an apt describing word from a provided bank.",
        "grownups_tip":   "Say: 'Add one describing word before the thing: a big cat.' Keep it to one word.",
        "reference_tip":  "One describing word + noun. 'a red hat'.",
        "spot_it":        "Find a describing word on this page (e.g., big, red).",
        "retell_note":    "Add one describing word: 'a ___ ___.'",
        "workshop_listen_write": "Spotlight: Pick from big, red, hot, wet to complete 'a ___ ___'. Listen-and-Write: adult dictates 'It is a big ___.'",
        "spotlight": {
            "skill": "One adjective before noun",
            "instruction": "Tick one word, then write it to complete the phrase.",
            "items": [
                {
                    "text": "a ___ cat",
                    "choices": [
                        "big",
                        "red",
                        "hot",
                        "wet"
                    ]
                },
                {
                    "text": "a ___ hat",
                    "choices": [
                        "big",
                        "red",
                        "hot",
                        "wet"
                    ]
                }
            ]
        },
    },
    "1.9": {
        "book": "L1.9",
        "focus_skill":    "Prepositions in / on / at to say where.",
        "carry_review":   ["Capital to start", "Full stop"],
        "mastery_signal": "Uses in or on or at correctly in two sentences about story pictures.",
        "grownups_tip":   "Say: 'in is inside, on is on top, at is the place.' Point to pictures to decide.",
        "reference_tip":  "in / on / at tell where. 'It is on a mat.'",
        "spot_it":        "Circle 'in', 'on' or 'at' in a sentence on this page.",
        "retell_note":    "Use in / on / at to show where.",
        "workshop_listen_write": "Spotlight: Write two sentences: 'It is ___ the ___.' Listen-and-Write: adult dictates 'It is on the ___.'",
        "spotlight": {
            "skill": "in / on / at to say where",
            "instruction": "Tick in/on/at to fit; write it in the gap.",
            "items": [
                {
                    "text": "It is ___ the mat.",
                    "choices": [
                        "in",
                        "on",
                        "at"
                    ]
                },
                {
                    "text": "I am ___ a bag.",
                    "choices": [
                        "in",
                        "on",
                        "at"
                    ]
                }
            ]
        },
    },
    "1.10": {
        "book": "L1.10",
        "focus_skill":    "All three basics together: capital + spaces + full stop.",
        "carry_review":   ["Describing word before noun", "and to link"],
        "mastery_signal": "Writes two 6–8 word sentences with capital, clear spaces and full stop, independently.",
        "grownups_tip":   "Say: 'Big letter, spaces you can see, dot at the end. Check with your finger.'",
        "reference_tip":  "Start big. Space. Stop. 'A big cat sat on a mat.'",
        "spot_it":        "Find a sentence with all three basics on this page. Tick each part.",
        "retell_note":    "Aim for all three on every line.",
        "workshop_listen_write": "Spotlight: Fix two sentences missing one part (add capital / space / stop). Listen-and-Write: adult dictates one 7–8 word story sentence; child writes with all three basics.",
        "spotlight": {
            "skill": "Capital, spaces, full stop",
            "instruction": "Fix each: add the missing capital, space or stop; then copy.",
            "items": [
                {
                    "text": "a big cat sat on a mat."
                },
                {
                    "text": "I can sit on a mat"
                },
                {
                    "text": "Acat sat."
                }
            ]
        },
    },

    # ─── Level 2 (6 books) — Function within sentences ──────────────────
    "2.1": {
        "book": "L2.1",
        "focus_skill":    "'and' to join actions or describing words within one sentence.",
        "carry_review":   ["Capital / space / full stop trio", "and for nouns (L1.4)"],
        "mastery_signal": "Writes one sentence with two verbs or two adjectives joined by 'and'.",
        "grownups_tip":   "Say: 'Keep it one sentence: The goat can hop and skip.'",
        "reference_tip":  "Join two doing words: 'can hop and skip'.",
        "spot_it":        "Find 'and' on this page that links two actions.",
        "retell_note":    "Use 'and' once to join two actions.",
        "workshop_listen_write": "Spotlight: Complete 'can ___ and ___'. Listen-and-Write: adult dictates one sentence with two actions to join.",
        "spotlight": {
            "skill": "Join actions/describing words with and",
            "instruction": "Complete both: I can ___ and ___; It is ___ and ___.",
            "items": [
                {
                    "text": "I can ___ and ___."
                },
                {
                    "text": "It is ___ and ___."
                }
            ]
        },
    },
    "2.2": {
        "book": "L2.2",
        "focus_skill":    "Plurals -es (boxes, buses, dishes).",
        "carry_review":   ["Plurals -s (L1.7)"],
        "mastery_signal": "Chooses -es for words ending in s, x, z, ch, sh in two tasks.",
        "grownups_tip":   "Say: 'If the word ends with a hissing or shushing sound, add es.'",
        "reference_tip":  "Add -es after s, x, z, ch, sh: 'boxes'.",
        "spot_it":        "Find a plural -es on this page.",
        "retell_note":    "Use -es when needed (e.g., boxes).",
        "workshop_listen_write": "Spotlight: Turn 'box' → 'boxes', 'dish' → 'dishes'. Listen-and-Write: adult dictates 'I see two boxes.'",
        "spotlight": {
            "skill": "Plurals with -es",
            "instruction": "Add -es to make more than one; write it.",
            "items": [
                {
                    "text": "box → __________"
                },
                {
                    "text": "dish → __________"
                }
            ]
        },
    },
    "2.3": {
        "book": "L2.3",
        "focus_skill":    "Suffix -ing for now (running, sitting).",
        "carry_review":   ["and for actions"],
        "mastery_signal": "Adds -ing to two base verbs from the story and uses one in a sentence.",
        "grownups_tip":   "Say: '-ing shows it's happening now: run → running.'",
        "reference_tip":  "Add -ing: 'The fish is swimming.'",
        "spot_it":        "Find a word ending in -ing on this page.",
        "retell_note":    "Use one -ing word in your writing.",
        "workshop_listen_write": "Spotlight: Make two -ing words from story verbs. Listen-and-Write: adult dictates 'It is ___ing.'",
        "spotlight": {
            "skill": "Suffix -ing for now",
            "instruction": "Add -ing to the verb; use one in 'It is ___ing.'",
            "items": [
                {
                    "text": "run → __________"
                },
                {
                    "text": "hop → __________"
                },
                {
                    "text": "It is ___ing."
                }
            ]
        },
    },
    "2.4": {
        "book": "L2.4",
        "focus_skill":    "Questions and the question mark (?).",
        "carry_review":   ["Capital at start"],
        "mastery_signal": "Writes one clear question beginning with Is / Are / Can and ending with ?.",
        "grownups_tip":   "Say: 'Your voice goes up at the end. Write a question and add ?'",
        "reference_tip":  "A question asks: 'Is it on the road?'",
        "spot_it":        "Spot a question on this page. Touch the ?",
        "retell_note":    "Write one question about the story.",
        "workshop_listen_write": "Spotlight: Turn a statement into a question (add Is / Are and ?). Listen-and-Write: adult dictates one question about a picture.",
        "spotlight": {
            "skill": "Questions and the question mark",
            "instruction": "Turn it into a question: begin with Is/Are/Can and add ?",
            "items": [
                {
                    "text": "it is on the road"
                },
                {
                    "text": "they are in the boat"
                }
            ]
        },
    },
    "2.5": {
        "book": "L2.5",
        "focus_skill":    "'but' to show contrast.",
        "carry_review":   ["'and' use (L2.1)"],
        "mastery_signal": "Writes one sentence using 'but' meaningfully (two contrasting parts).",
        "grownups_tip":   "Say: 'but changes the idea: It is big but it can hop fast.'",
        "reference_tip":  "Use 'but' to show difference.",
        "spot_it":        "Find 'but' on this page. What changed?",
        "retell_note":    "Use 'but' once to show a difference.",
        "workshop_listen_write": "Spotlight: Complete 'It is ___ but ___.' Listen-and-Write: adult dictates a 'but' sentence from a picture cue.",
        "spotlight": {
            "skill": "'but' to show contrast",
            "instruction": "Complete each: It is ___ but ___.",
            "items": [
                {
                    "text": "It is hot but ___."
                },
                {
                    "text": "It is big but ___."
                }
            ]
        },
    },
    "2.6": {
        "book": "L2.6",
        "focus_skill":    "Pronouns (he / she / we / me / be) + is / are.",
        "carry_review":   ["Question mark (L2.4)"],
        "mastery_signal": "Chooses correct pronoun in two gaps and writes one sentence with is / are.",
        "grownups_tip":   "Say: 'Use he / she for people, we / me for us, be as a tricky helper.'",
        "reference_tip":  "'He is…' 'She is…' 'We are…'.",
        "spot_it":        "Circle 'he', 'she' or 'we' on this page and read the sentence.",
        "retell_note":    "Try one sentence with he / she / we.",
        "workshop_listen_write": "Spotlight: Fill gaps: '__ is on the mat.' Listen-and-Write: adult dictates 'We are ___.'",
        "spotlight": {
            "skill": "Pronouns with is/are",
            "instruction": "Tick the best pronoun; then write the full sentence with is/are.",
            "items": [
                {
                    "text": "___ is/are on the mat.",
                    "choices": [
                        "he",
                        "she",
                        "we"
                    ]
                },
                {
                    "text": "___ is/are in the boat.",
                    "choices": [
                        "he",
                        "she",
                        "we"
                    ]
                },
                {
                    "text": "We are ___."
                }
            ]
        },
    },

    # ─── Level 3 (5 books) — Sentence types and sequencing ──────────────
    "3.1": {
        "book": "L3.1",
        "focus_skill":    "Choose the end mark: . or ?",
        "carry_review":   ["Capital to start", "Finger spaces"],
        "mastery_signal": "Adds the correct end mark to three sentences taken from the story (mix of statements and questions).",
        "grownups_tip":   "Say: 'Does it tell (.) or ask (?)? Read it out loud to decide.'",
        "reference_tip":  "Tell = .   Ask = ?",
        "spot_it":        "Find two sentences on this page: one with . and one with ?. Say why.",
        "retell_note":    "Pick the right end mark for each line.",
        "workshop_listen_write": "Spotlight: Add . or ? to three story sentences. Listen-and-Write: adult dictates one question and one statement.",
        # Hand-authored structured items for the Word Workshop tickbox UI.
        "spotlight": {
            "skill":       "End marks: . or ?",
            "instruction": "Choose . or ? for each sentence. Tick your choice, then write it at the end.",
            "items": [
                {"text": "Bikes line up at the gate",          "choices": [".", "?"]},
                {"text": "Can I win",                          "choices": [".", "?"]},
                {"text": "I ride past the lake and turn back", "choices": [".", "?"]},
            ],
        },
    },
    "3.2": {
        "book": "L3.2",
        "focus_skill":    "Commands and the exclamation mark (!) for strong feeling or orders.",
        "carry_review":   [". or ? (L3.1)"],
        "mastery_signal": "Writes one short command (e.g., 'Get the bag!') and explains why ! fits.",
        "grownups_tip":   "Say: 'A command tells you to do something: Get the…! Use ! when the feeling is strong.'",
        "reference_tip":  "Command = bossy verb: 'Get!  Stop!  Run!'",
        "spot_it":        "Find a command on this page. Does it need ! ?",
        "retell_note":    "Try one command with ! if it fits.",
        "workshop_listen_write": "Spotlight: Turn 'Get the ___.' into a strong command with !. Listen-and-Write: adult dictates one command.",
        "spotlight": {
            "skill": "Commands and exclamation mark",
            "instruction": "Make it a strong command; tick ! and write it with a !",
            "items": [
                {
                    "text": "Get the big red bag now",
                    "choices": [
                        ".",
                        "!"
                    ]
                },
                {
                    "text": "Stop at the pond and help",
                    "choices": [
                        ".",
                        "!"
                    ]
                }
            ]
        },
    },
    "3.3": {
        "book": "L3.3",
        "focus_skill":    "Time words to order events (First, Then, Next, Finally).",
        "carry_review":   ["Choose end mark"],
        "mastery_signal": "Writes a 3-step retell using First / Then / Finally correctly at the start of each sentence.",
        "grownups_tip":   "Say: 'Use a time word to start each sentence so we know the order.'",
        "reference_tip":  "First, …  Then, …  Finally, …",
        "spot_it":        "Find a time word on this page and read the sentence.",
        "retell_note":    "Begin each line with First, Then, Finally,",
        "workshop_listen_write": "Spotlight: Arrange three cut-up sentences and add the time words. Listen-and-Write: adult dictates a First / Then / Finally set from the story.",
        "spotlight": {
            "skill": "Time words to order events",
            "instruction": "Write First/Then/Finally at the start and add a comma.",
            "items": [
                {
                    "text": "_____ , we pack the bag."
                },
                {
                    "text": "_____ , we go to the pond."
                },
                {
                    "text": "_____ , we sit and rest."
                }
            ]
        },
    },
    "3.4": {
        "book": "L3.4",
        "focus_skill":    "Expanded noun phrase (two describing words + noun).",
        "carry_review":   ["'and' within a phrase (L2.1)"],
        "mastery_signal": "Writes two apt noun phrases like 'a big red crab' and uses one in a sentence.",
        "grownups_tip":   "Say: 'Pick two good describing words before the noun: big red crab.'",
        "reference_tip":  "describing word + describing word + noun.",
        "spot_it":        "Find a describing word on this page and say what it describes.",
        "retell_note":    "Use two describing words before one noun once.",
        "workshop_listen_write": "Spotlight: Build two noun phrases from a describing-word bank. Listen-and-Write: adult dictates one sentence with a two-adjective noun phrase.",
        "spotlight": {
            "skill": "What Min saw — two describing words + noun",
            "instruction": "Look at each picture. Write two describing words before the noun.",
            "items": [
                {"text": "___  ___  claws",  "image_word": "claw",  "image_grapheme": "aw"},
                {"text": "___  ___  oil",    "image_word": "oil",   "image_grapheme": "oi"},
                {"text": "___  ___  straw",  "image_word": "straw", "image_grapheme": "aw"},
            ],
        },
    },
    "3.5": {
        "book": "L3.5",
        "focus_skill":    "Compound sentence with and / but / so (one time only).",
        "carry_review":   [". ? ! control"],
        "mastery_signal": "Writes one 8–10 word sentence using and / but / so to join two clauses appropriately.",
        "grownups_tip":   "Say: 'Join two linked ideas with one word: and / but / so. One sentence, one join.'",
        "reference_tip":  "Two parts → one joiner: 'It is wet, so we run.'",
        "spot_it":        "Spot a joiner on this page. What are the two parts?",
        "retell_note":    "Use one joiner in one sentence only.",
        "workshop_listen_write": "Spotlight: Match clause halves with a good joiner. Listen-and-Write: adult dictates a compound sentence to write.",
        "spotlight": {
            "skill": "Compound sentence with and/but/so",
            "instruction": "Choose a good joiner; tick it, then write the sentence.",
            "items": [
                {
                    "text": "It is wet, ___ we run to the van.",
                    "choices": [
                        "and",
                        "but",
                        "so"
                    ]
                },
                {
                    "text": "I can not swim, ___ I get in the boat.",
                    "choices": [
                        "and",
                        "but",
                        "so"
                    ]
                }
            ]
        },
    },

    # ─── Level 4 (4 books) — Tense and cohesion ─────────────────────────
    "4.1": {
        "book": "L4.1",
        "focus_skill":    "Past tense with -ed for a recount.",
        "carry_review":   ["Time words (L3.3)"],
        "mastery_signal": "Writes a 3–4 sentence recount in past tense using at least two regular -ed verbs.",
        "grownups_tip":   "Say: 'We are telling what happened. Use -ed: jump → jumped.'",
        "reference_tip":  "Past tense: played, looked, landed.",
        "spot_it":        "Find a -ed word on this page and read the sentence.",
        "retell_note":    "Use -ed for what already happened.",
        "workshop_listen_write": "Spotlight: Change two present verbs to past with -ed. Listen-and-Write: adult dictates one past-tense sentence.",
        "spotlight": {
            "skill": "Past tense with -ed",
            "instruction": "Change the verb to past (-ed); then use one in a sentence.",
            "items": [
                {
                    "text": "look → __________"
                },
                {
                    "text": "help → __________"
                },
                {
                    "text": "We __________ on the sand."
                }
            ]
        },
    },
    "4.2": {
        "book": "L4.2",
        "focus_skill":    "Pronouns for cohesion (he / she / they / it) to avoid repetition.",
        "carry_review":   ["Compound with and / but / so (L3.5)"],
        "mastery_signal": "Rewrites two sentences swapping a repeated noun for a pronoun; uses a pronoun correctly in retell.",
        "grownups_tip":   "Say: 'Use he / she / they / it instead of saying the noun again.'",
        "reference_tip":  "'The crab was red. It hid.'",
        "spot_it":        "Circle a pronoun on this page; who or what does it stand for?",
        "retell_note":    "Try using he / she / they / it after you name the thing once.",
        "workshop_listen_write": "Spotlight: Replace repeated nouns with pronouns in two sentences. Listen-and-Write: adult dictates 'The ___ was ___. It ___.'",
        "spotlight": {
            "skill": "Pronouns for cohesion",
            "instruction": "Rewrite the second sentence with a pronoun (he/she/they/it).",
            "items": [
                {
                    "text": "The crab was red. The crab hid."
                },
                {
                    "text": "The kids were hot. The kids sat."
                }
            ]
        },
    },
    "4.3": {
        "book": "L4.3",
        "focus_skill":    "Comparatives -er / -est (faster, fastest).",
        "carry_review":   ["Past tense -ed"],
        "mastery_signal": "Uses -er / -est correctly in two caption pairs and one sentence.",
        "grownups_tip":   "Say: '-er compares two; -est is the most: fast, faster, fastest.'",
        "reference_tip":  "'The crab is faster than the cod.'",
        "spot_it":        "Find faster or fastest on this page or in the picture labels.",
        "retell_note":    "Use one -er or -est word if it fits.",
        "workshop_listen_write": "Spotlight: Make 'fast → faster → fastest' for two adjectives. Listen-and-Write: adult dictates a sentence using faster or fastest.",
        "spotlight": {
            "skill": "Comparatives -er / -est",
            "instruction": "Make each: adjective → -er → -est; then use one in a sentence.",
            "items": [
                {
                    "text": "fast → __________ → __________"
                },
                {
                    "text": "cold → __________ → __________"
                },
                {
                    "text": "The crab is _______ than the cod."
                }
            ]
        },
    },
    "4.4": {
        "book": "L4.4",
        "focus_skill":    "Fronted time adverbials with a comma (Later, …  After that, …).",
        "carry_review":   ["Pronouns for cohesion"],
        "mastery_signal": "Begins two sentences with time adverbials and adds the comma.",
        "grownups_tip":   "Say: 'Put a time word first, then a comma: Later, we…'",
        "reference_tip":  "'After that, they…'",
        "spot_it":        "Find a comma after a time word on this page.",
        "retell_note":    "Start one line with 'Later,' or 'After that,'.",
        "workshop_listen_write": "Spotlight: Match time starters to sentences; add commas. Listen-and-Write: adult dictates 'Later, ___.'",
        "spotlight": {
            "skill": "Fronted time adverbials + comma",
            "instruction": "Choose a time starter; tick it, add it to the start, and put a comma.",
            "items": [
                {
                    "text": "_____ we packed the tent.",
                    "choices": [
                        "Later,",
                        "After that,",
                        "At noon,"
                    ]
                },
                {
                    "text": "_____ they went to the beach.",
                    "choices": [
                        "Later,",
                        "After that,",
                        "In the end,"
                    ]
                }
            ]
        },
    },

    # ─── Level 5 (4 books) — Reasons, commas, contractions ──────────────
    "5.1": {
        "book": "L5.1",
        "focus_skill":    "Subordination with 'because' (give a reason).",
        "carry_review":   ["Fronted time adverbials (L4.4)"],
        "mastery_signal": "Writes one sentence with 'because' that truly explains (not tacked on).",
        "grownups_tip":   "Say: 'Finish the idea with a reason: …because…'",
        "reference_tip":  "'We hid because it was dark.'",
        "spot_it":        "Find 'because' on this page. What is the reason?",
        "retell_note":    "Add one 'because' sentence to explain.",
        "workshop_listen_write": "Spotlight: Match halves: cause → reason with because. Listen-and-Write: adult dictates one because sentence from the story context.",
        "spotlight": {
            "skill": "Because to give a reason",
            "instruction": "Tick because; then write the full sentence with because.",
            "items": [
                {
                    "text": "We hid ___ it was dark.",
                    "choices": [
                        "and",
                        "but",
                        "because"
                    ]
                },
                {
                    "text": "I sat by the fire ___ I was cold.",
                    "choices": [
                        "and",
                        "but",
                        "because"
                    ]
                }
            ]
        },
    },
    "5.2": {
        "book": "L5.2",
        "focus_skill":    "'When' at the start with a comma (When…, we…).",
        "carry_review":   ["because (L5.1)"],
        "mastery_signal": "Writes one sentence that begins with 'When' and includes a comma.",
        "grownups_tip":   "Say: 'Start with When…, add a comma, then finish the sentence.'",
        "reference_tip":  "'When it rained, we ran.'",
        "spot_it":        "Spot a comma after 'When' on this page.",
        "retell_note":    "Try a 'When…, we…' sentence.",
        "workshop_listen_write": "Spotlight: Complete two 'When…, we…' frames from picture prompts. Listen-and-Write: adult dictates one When sentence.",
        "spotlight": {
            "skill": "'When' at the start + comma",
            "instruction": "Begin with When…, add a comma, then finish the sentence.",
            "items": [
                {
                    "text": "When it rained, we ___."
                },
                {
                    "text": "When we got home, ___."
                }
            ]
        },
    },
    "5.3": {
        "book": "L5.3",
        "focus_skill":    "Commas in a list (three items).",
        "carry_review":   ["and / but / so control (L3.5)"],
        "mastery_signal": "Writes one sentence listing three nouns with commas and 'and' before the last.",
        "grownups_tip":   "Say: 'Item, item and item. Commas between, and before the last.'",
        "reference_tip":  "'I saw crabs, cod and eels.'",
        "spot_it":        "Find a list on this page or make one from a picture.",
        "retell_note":    "Add one neat list of three.",
        "workshop_listen_write": "Spotlight: Turn three picture labels into a list sentence. Listen-and-Write: adult dictates a simple list sentence.",
        "spotlight": {
            "skill": "Commas in a list",
            "instruction": "Add commas to make one list sentence.",
            "items": [
                {
                    "text": "I saw cats dogs and pigs."
                },
                {
                    "text": "We packed a map a torch and a rope."
                }
            ]
        },
    },
    "5.4": {
        "book": "L5.4",
        "focus_skill":    "Contractions (I'm, can't, didn't) from story words.",
        "carry_review":   ["Question forms (?)"],
        "mastery_signal": "Converts two pairs (I am → I'm, can not → can't) seen in the story and uses one in writing.",
        "grownups_tip":   "Say: 'We squash two words and add an apostrophe: I am → I'm.' Use only forms in this story.",
        "reference_tip":  "'can not → can't'    'I am → I'm'.",
        "spot_it":        "Find a word with an apostrophe on this page. Read it.",
        "retell_note":    "Use one contraction from the story.",
        "workshop_listen_write": "Spotlight: Match two pairs to their contraction. Listen-and-Write: adult dictates a sentence with a contraction from the book.",
        "spotlight": {
            "skill": "Contractions (I'm, can't, didn't)",
            "instruction": "Match each pair to its contraction; tick one, then write it.",
            "items": [
                {
                    "text": "I am",
                    "choices": [
                        "I'm",
                        "I’d",
                        "I’ll"
                    ]
                },
                {
                    "text": "did not",
                    "choices": [
                        "didn't",
                        "don't",
                        "didnt"
                    ]
                },
                {
                    "text": "can not",
                    "choices": [
                        "can't",
                        "cannot",
                        "cant"
                    ]
                },
                {
                    "text": "Write one sentence with a contraction."
                }
            ]
        },
    },

    # ─── Level 6 (4 books) — Suffix power, possession, speech ───────────
    "6.1": {
        "book": "L6.1",
        "focus_skill":    "Suffix -ly adverbs (slowly, quickly), including as openers with a comma.",
        "carry_review":   ["Commas after fronted elements (L4.4 / L5.2)"],
        "mastery_signal": "Uses one -ly adverb mid-sentence and one at the start with a comma.",
        "grownups_tip":   "Say: '-ly tells how. Slowly, we… or We moved slowly.'",
        "reference_tip":  "'Slowly, the crab hid.'    'They swam quickly.'",
        "spot_it":        "Find an -ly word on this page and read the sentence.",
        "retell_note":    "Use one -ly. Try one at the start: 'Slowly, …'",
        "workshop_listen_write": "Spotlight: Choose an apt -ly adverb for two sentences. Listen-and-Write: adult dictates one sentence starting with an -ly adverb.",
        "spotlight": {
            "skill": "-ly adverbs (mid and opener)",
            "instruction": "Tick a good -ly word; write it to complete the sentence.",
            "items": [
                {
                    "text": "______, the crab hid under the rock.",
                    "choices": [
                        "Slowly",
                        "Quickly",
                        "Quietly",
                        "Bravely"
                    ]
                },
                {
                    "text": "They swam ______ to the boat.",
                    "choices": [
                        "slowly",
                        "quickly",
                        "quietly",
                        "bravely"
                    ]
                }
            ]
        },
    },
    "6.2": {
        "book": "L6.2",
        "focus_skill":    "Suffixes -ness and -ful / -less to build precise words.",
        "carry_review":   ["-ly (L6.1)"],
        "mastery_signal": "Creates two new words with these suffixes and uses one in a sentence correctly.",
        "grownups_tip":   "Say: 'Add -ness for a thing (kind → kindness), -ful for full of (use → useful), -less for without (help → helpless).'",
        "reference_tip":  "kindness, useful, helpless.",
        "spot_it":        "Spot a -ness, -ful or -less word on this page or in the word bank.",
        "retell_note":    "Use one suffix word to be more exact.",
        "workshop_listen_write": "Spotlight: Make two suffix words from base words provided. Listen-and-Write: adult dictates one sentence using a chosen suffix word.",
        "spotlight": {
            "skill": "-ness, -ful, -less suffixes",
            "instruction": "Add a suffix to make a new word; then use one in a sentence.",
            "example": "use + <strong>ful</strong> &rarr; <strong>useful</strong>  (full of use)",
            "items": [
                {
                    "text": "kind &rarr; __________"
                },
                {
                    "text": "help &rarr; __________"
                },
            ],
        },
        "writing_prompt": (
            "The girl helped the lost boy.  Tell one thing she did.  "
            "Use a <strong>-ness</strong>, <strong>-ful</strong> or "
            "<strong>-less</strong> word in your sentence."
        ),
        "writing_lines": 4,
    },
    "6.3": {
        "book": "L6.3",
        "focus_skill":    "Apostrophe for singular possession ('the crab's shell').",
        "carry_review":   ["Past tense control"],
        "mastery_signal": "Writes two noun + 's + noun phrases correctly and uses one in a sentence.",
        "grownups_tip":   "Say: 'Use 's to show it belongs to one: the crab's shell.'",
        "reference_tip":  "owner + 's + thing.",
        "spot_it":        "Find 's on this page. Who owns what?",
        "retell_note":    "Use one 's phrase if it fits.",
        "workshop_listen_write": "Spotlight: Build two 's phrases from picture prompts. Listen-and-Write: adult dictates one sentence with 's.",
        "spotlight": {
            "skill": "Apostrophe for possession ('s)",
            "instruction": "Build owner + 's + thing; then write one sentence.",
            "items": [
                {
                    "text": "the crab + shell → __________"
                },
                {
                    "text": "Mum + bag → __________"
                },
                {
                    "text": "Write one sentence with 's."
                }
            ]
        },
    },
    "6.4": {
        "book": "L6.4",
        "focus_skill":    "Speech with inverted commas (one line) plus a final edit pass.",
        "carry_review":   ["End marks and capitals"],
        "mastery_signal": "Writes one correctly-punctuated speech line ('“Stop!” said Mum.') and completes an edit checklist on their paragraph.",
        "grownups_tip":   "Say: 'Put what is said inside “ ” and add who said it. Keep it simple.'",
        "reference_tip":  "“Stop!” said Dad.   Capital + end mark inside the quotes.",
        "spot_it":        "Find “ ” on this page. Who is speaking?",
        "retell_note":    "Add one short speech line if it fits your story.",
        "workshop_listen_write": "Spotlight: Punctuate one scrambled speech line. Listen-and-Write: adult dictates '“___!” said ___.'",
        "spotlight": {
            "skill": "Speech with inverted commas",
            "instruction": "Rewrite each line with “ ”, a capital, and the right end mark inside the quotes.",
            "items": [
                {"text": "stop said mum"},
                {"text": "go said dad"},
            ],
        },
    },
}


def _auto_spotlight(entry: dict) -> dict:
    """Build a default spotlight for books without a hand-authored one.
    Uses the focus_skill as the heading and the 'Spotlight: …' portion of
    workshop_listen_write as the instruction.  No structured items — the
    template renders an open answer line."""
    wlw = entry.get("workshop_listen_write", "")
    spot_part = wlw.split("Listen-and-Write:")[0].strip()
    if spot_part.startswith("Spotlight:"):
        spot_part = spot_part[len("Spotlight:"):].strip()
    if spot_part.endswith("."):
        spot_part = spot_part[:-1] + "."
    return {
        "skill":       entry.get("focus_skill", "").rstrip(" .").rstrip("."),
        "instruction": spot_part,
        "items":       [],
    }


def _normalise_key(level, sub_level) -> str | None:
    """Build "{level}.{sub_level}" from any combination of int/str inputs.

    Story files are inconsistent — some store sub_level as 1 (int),
    others as "L1.1" (full string), others as "1.1" (decimal-string).
    """
    if sub_level is None:
        return None
    sub = str(sub_level)
    # Strip leading 'L' prefix and any "{level}." prefix.
    if sub.upper().startswith("L"):
        sub = sub[1:]
    if "." in sub:
        # Already in "1.1" form — trust it.
        return sub
    return f"{level}.{sub}"


def get_grammar_spotlight(level: int, sub_level=None,
                          override: dict = None) -> dict | None:
    """Return the grammar entry for a book, or None if no entry exists.

    Resolution order:
      1. Per-story override (story_dict["grammar_spotlight"])
      2. Static GRAMMAR_SPOTLIGHTS keyed by normalised "{level}.{sub_level}"
      3. None — template skips touchpoints entirely
    """
    if override:
        return override
    key = _normalise_key(level, sub_level)
    if key is None:
        return None
    entry = GRAMMAR_SPOTLIGHTS.get(key)
    if entry is None:
        return None
    if "spotlight" not in entry:
        entry = {**entry, "spotlight": _auto_spotlight(entry)}
    return entry
