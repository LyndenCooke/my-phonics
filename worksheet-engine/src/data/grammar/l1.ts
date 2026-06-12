import type { GrammarUnit } from '@/data/grammarSchema';

// L1 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l1-1",
    "code": "G-L1.1",
    "name": "What is a word?",
    "doInstruction": "Find each word",
    "objective": "A word is one unit you can point to.",
    "ncLink": "EYFS Literacy",
    "terminology": [
      "word"
    ],
    "anchorBook": "Level 1 readers",
    "s1": {
      "prompt": "I pat the cat.",
      "answer": "I | pat | the | cat",
      "note": "Each word is one unit."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Say your own sentence, write it, then circle each word."
    },
    // Rows replaced 2026-06-12: the draft rows were invented and had no end
    // marks. These are VERBATIM Tap! Tap! Tap! sentences (this unit sits in
    // book 1's week) — no new words.
    "format": "circle",
    "circle": {
      "targets": [
        {
          "label": "word",
          "mark": "circle"
        }
      ],
      "rows": [
        {
          "text": "It is not a rat.",
          "finds": [
            {
              "word": "It",
              "target": "word"
            },
            {
              "word": "is",
              "target": "word"
            },
            {
              "word": "not",
              "target": "word"
            },
            {
              "word": "a",
              "target": "word"
            },
            {
              "word": "rat",
              "target": "word"
            }
          ]
        },
        {
          "text": "Is it a bat?",
          "finds": [
            {
              "word": "Is",
              "target": "word"
            },
            {
              "word": "it",
              "target": "word"
            },
            {
              "word": "a",
              "target": "word"
            },
            {
              "word": "bat",
              "target": "word"
            }
          ]
        },
        {
          "text": "I am happy!",
          "finds": [
            {
              "word": "I",
              "target": "word"
            },
            {
              "word": "am",
              "target": "word"
            },
            {
              "word": "happy",
              "target": "word"
            }
          ]
        },
        {
          "text": "The cat naps.",
          "finds": [
            {
              "word": "The",
              "target": "word"
            },
            {
              "word": "cat",
              "target": "word"
            },
            {
              "word": "naps",
              "target": "word"
            }
          ]
        }
      ]
    },
    "level": 1,
    "levelLabel": "L1",
    "strand": "Grammar",
    "levelSubtitle": "Level 1 · Ditties",
    "decorations": [
      {
        "key": "tree",
        "xMm": 148,
        "yMm": 227,
        "sizeMm": 56
      }
    ]
  },
  {
    "id": "g-l1-2",
    "code": "G-L1.2",
    "name": "Say a sentence",
    "doInstruction": "Read it, then write it",
    "objective": "Say a whole idea, then write it.",
    "ncLink": "EYFS C&L",
    "terminology": [
      "sentence"
    ],
    "anchorBook": "Level 1 readers",
    "s1": {
      "prompt": "It is a big dog.",
      "answer": "It is a big dog."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Say and write a new sentence."
    },
    // Rows replaced 2026-06-12: the draft rows were invented and had no end
    // marks. These are VERBATIM The Mud on the Dog sentences (this unit sits
    // in book 2's week), avoiding the hold/listen and G-L1.3 picks.
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "The dog ran in the mud.",
          "answer": "The dog ran in the mud."
        },
        {
          "text": "The dog is a mess!",
          "answer": "The dog is a mess!"
        },
        {
          "text": "Mum got a tub.",
          "answer": "Mum got a tub."
        },
        {
          "text": "The dog sat in it.",
          "answer": "The dog sat in it."
        }
      ]
    },
    "level": 1,
    "levelLabel": "L1",
    "strand": "Grammar",
    "levelSubtitle": "Level 1 · Ditties",
    "decorations": [
      {
        "key": "leaf",
        "xMm": 158,
        "yMm": 237,
        "sizeMm": 46
      }
    ]
  },
  {
    "id": "g-l1-3",
    "code": "G-L1.3",
    "name": "Finger spaces",
    "doInstruction": "Write it again with finger spaces",
    "objective": "Leave a finger space between words.",
    "ncLink": "EYFS Literacy",
    "terminology": [
      "word",
      "finger space"
    ],
    "anchorBook": "Level 1 readers",
    "s1": {
      "prompt": "Ipatadog",
      "answer": "I pat a dog",
      "note": "Put a finger space between each word."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write the sentence with finger spaces."
    },
    // Rows replaced 2026-06-12: the draft rows were not real sentences
    // ("The sat cat", "Pat in in pit"). These are VERBATIM book sentences
    // (Tap! Tap! Tap! and The Mud on the Dog) with the spaces removed — a
    // mechanical squash of approved text, no new words.
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "Ipatthecat.",
          "answer": "I pat the cat."
        },
        {
          "text": "Thecatnaps.",
          "answer": "The cat naps."
        },
        {
          "text": "Igotadog.",
          "answer": "I got a dog."
        },
        {
          "text": "Igetamop.",
          "answer": "I get a mop."
        }
      ]
    },
    "level": 1,
    "levelLabel": "L1",
    "strand": "Grammar",
    "levelSubtitle": "Level 1 · Ditties",
    "decorations": [
      {
        "key": "feather",
        "xMm": 160,
        "yMm": 239,
        "sizeMm": 44
      }
    ]
  }
];

export default units;
