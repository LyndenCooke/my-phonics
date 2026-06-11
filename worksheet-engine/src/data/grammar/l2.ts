import type { GrammarUnit } from '@/data/grammarSchema';

// L2 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l2-1",
    "code": "G-L2.1",
    "name": "Capital letters start sentences",
    "doInstruction": "Write each sentence with a capital letter",
    "objective": "A sentence starts with a capital letter.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "capital letter",
      "sentence"
    ],
    "anchorBook": "Level 2 readers",
    "s1": {
      "prompt": "the cat is on a mat",
      "answer": "The cat is on a mat."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "write a sentence about a dog with a capital letter"
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "i can hop",
          "answer": "I can hop."
        },
        {
          "text": "sam is in a box",
          "answer": "Sam is in a box."
        },
        {
          "text": "it is a big cat",
          "answer": "It is a big cat."
        },
        {
          "text": "pat and dan run",
          "answer": "Pat and Dan run."
        }
      ]
    },
    "level": 2,
    "levelLabel": "L2",
    "strand": "Grammar",
    "levelSubtitle": "Level 2 · First Sounds",
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
    "id": "g-l2-2",
    "code": "G-L2.2",
    "name": "Full stops end sentences",
    "doInstruction": "Write each sentence with a full stop",
    "objective": "A sentence ends with a full stop.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "full stop"
    ],
    "anchorBook": "Level 2 readers",
    "s1": {
      "prompt": "The dog is in the sun",
      "answer": "The dog is in the sun."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "write a sentence about a pet with a full stop"
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "I am in a van",
          "answer": "I am in a van."
        },
        {
          "text": "The pig is big",
          "answer": "The pig is big."
        },
        {
          "text": "It is hot",
          "answer": "It is hot."
        },
        {
          "text": "Pam can run",
          "answer": "Pam can run."
        }
      ]
    },
    "level": 2,
    "levelLabel": "L2",
    "strand": "Grammar",
    "levelSubtitle": "Level 2 · First Sounds",
    "decorations": [
      {
        "key": "feather",
        "xMm": 160,
        "yMm": 239,
        "sizeMm": 44
      }
    ]
  },
  {
    "id": "g-l2-3",
    "code": "G-L2.3",
    "name": "The word I",
    "doInstruction": "Write each sentence with a capital I",
    "objective": "The word I is always a capital letter.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "capital letter"
    ],
    "anchorBook": "Level 2 readers",
    "s1": {
      "prompt": "i am in a box",
      "answer": "I am in a box."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "write a sentence about what I can do"
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "i can sit",
          "answer": "I can sit."
        },
        {
          "text": "i am on a mat",
          "answer": "I am on a mat."
        },
        {
          "text": "i go to the van",
          "answer": "I go to the van."
        },
        {
          "text": "i can hop and run",
          "answer": "I can hop and run."
        }
      ]
    },
    "level": 2,
    "levelLabel": "L2",
    "strand": "Grammar",
    "levelSubtitle": "Level 2 · First Sounds",
    "decorations": [
      {
        "key": "moon",
        "xMm": 164,
        "yMm": 243,
        "sizeMm": 40
      }
    ]
  },
  {
    "id": "g-l2-4",
    "code": "G-L2.4",
    "name": "Is it a sentence?",
    "doInstruction": "Tick the one that is a sentence",
    "objective": "A sentence makes a whole idea.",
    "ncLink": "Year 1 sentence",
    "terminology": [
      "word",
      "sentence"
    ],
    "anchorBook": "Level 2 readers",
    "s1": {
      "prompt": "The dog is big",
      "answer": "Sentence"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "tick the sentence about a cat"
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        "Word",
        "Sentence"
      ],
      "rows": [
        {
          "text": "cat",
          "answer": "Word"
        },
        {
          "text": "I am Sam",
          "answer": "Sentence"
        },
        {
          "text": "mat",
          "answer": "Word"
        },
        {
          "text": "Pam can hop",
          "answer": "Sentence"
        },
        {
          "text": "dog",
          "answer": "Word"
        },
        {
          "text": "The sun is hot",
          "answer": "Sentence"
        }
      ]
    },
    "level": 2,
    "levelLabel": "L2",
    "strand": "Grammar",
    "levelSubtitle": "Level 2 · First Sounds",
    "decorations": [
      {
        "key": "monkey",
        "xMm": 152,
        "yMm": 231,
        "sizeMm": 52
      }
    ]
  }
];

export default units;
