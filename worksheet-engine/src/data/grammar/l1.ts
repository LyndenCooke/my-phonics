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
      "prompt": "I pat a dog",
      "answer": "I | pat | a | dog",
      "note": "Each word is one unit."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Circle each word in the sentence."
    },
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
          "text": "I sit in a pit",
          "finds": [
            {
              "word": "I",
              "target": "word"
            },
            {
              "word": "sit",
              "target": "word"
            },
            {
              "word": "in",
              "target": "word"
            },
            {
              "word": "a",
              "target": "word"
            },
            {
              "word": "pit",
              "target": "word"
            }
          ]
        },
        {
          "text": "Pat is in a pan",
          "finds": [
            {
              "word": "Pat",
              "target": "word"
            },
            {
              "word": "is",
              "target": "word"
            },
            {
              "word": "in",
              "target": "word"
            },
            {
              "word": "a",
              "target": "word"
            },
            {
              "word": "pan",
              "target": "word"
            }
          ]
        },
        {
          "text": "The dog sat",
          "finds": [
            {
              "word": "The",
              "target": "word"
            },
            {
              "word": "dog",
              "target": "word"
            },
            {
              "word": "sat",
              "target": "word"
            }
          ]
        },
        {
          "text": "I got a map",
          "finds": [
            {
              "word": "I",
              "target": "word"
            },
            {
              "word": "got",
              "target": "word"
            },
            {
              "word": "a",
              "target": "word"
            },
            {
              "word": "map",
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
      "prompt": "I sit in a pit",
      "answer": "I sit in a pit"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Say and write a new sentence."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "I pat a dog",
          "answer": "I pat a dog"
        },
        {
          "text": "The cat sat",
          "answer": "The cat sat"
        },
        {
          "text": "I got a map",
          "answer": "I got a map"
        },
        {
          "text": "Pat is in a pan",
          "answer": "Pat is in a pan"
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
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "Thesatcat",
          "answer": "The sat cat"
        },
        {
          "text": "Igottopan",
          "answer": "I got to pan"
        },
        {
          "text": "Patininpit",
          "answer": "Pat in in pit"
        },
        {
          "text": "Dogonmat",
          "answer": "Dog on mat"
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
