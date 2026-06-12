import type { GrammarUnit } from '@/data/grammarSchema';

// L4 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l4-1",
    "code": "G-L4.1",
    "name": "Joining with and",
    "doInstruction": "Write the two ideas as one, joined with and",
    "objective": "Join two ideas with and.",
    "ncLink": "Year 1 sentence",
    "terminology": [
      "sentence"
    ],
    "anchorBook": "Level 4 readers",
    "s1": {
      "prompt": "I can hop. I can run.",
      "answer": "I can hop and run."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own sentence with and."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "The cat is big. The cat is soft.",
          "answer": "The cat is big and soft."
        },
        {
          "text": "I jump. I sing.",
          "answer": "I jump and sing."
        },
        {
          "text": "It is hot. It is sunny.",
          "answer": "It is hot and sunny."
        },
        {
          "text": "We can dig. We can run.",
          "answer": "We can dig and run."
        }
      ]
    },
    "level": 4,
    "levelLabel": "L4",
    "strand": "Grammar",
    "levelSubtitle": "Level 4 · Longer Sounds",
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
    "id": "g-l4-2",
    "code": "G-L4.2",
    "name": "Choose the end mark",
    "doInstruction": "Tick the right end mark",
    "objective": "Choose . or ? or ! to end the sentence.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "full stop",
      "question mark",
      "exclamation mark"
    ],
    "anchorBook": "Level 4 readers",
    "s1": {
      "prompt": "Can you sing",
      "answer": "question mark"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence and pick the end mark."
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        ".",
        "?",
        "!"
      ],
      "rows": [
        {
          "text": "Can you jump",
          "answer": "?"
        },
        {
          "text": "It is hot",
          "answer": "."
        },
        {
          "text": "Look at the cat",
          "answer": "!"
        },
        {
          "text": "Is it dark",
          "answer": "?"
        },
        {
          "text": "The dog is big",
          "answer": "."
        },
        {
          "text": "Run to the hut",
          "answer": "!"
        }
      ]
    },
    "level": 4,
    "levelLabel": "L4",
    "strand": "Grammar",
    "levelSubtitle": "Level 4 · Longer Sounds",
    "decorations": [
      {
        "key": "monkey",
        "xMm": 152,
        "yMm": 231,
        "sizeMm": 52
      }
    ]
  },
  {
    "id": "g-l4-3",
    "code": "G-L4.3",
    "name": "Capital letters for days",
    "doInstruction": "Write each day with a capital letter",
    "objective": "Days of the week take a capital letter.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "capital letter"
    ],
    "anchorBook": "Level 4 readers",
    "s1": {
      "prompt": "monday",
      "answer": "Monday"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your favourite day with a capital letter."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "tuesday",
          "answer": "Tuesday"
        },
        {
          "text": "wednesday",
          "answer": "Wednesday"
        },
        {
          "text": "thursday",
          "answer": "Thursday"
        },
        {
          "text": "friday",
          "answer": "Friday"
        }
      ]
    },
    "level": 4,
    "levelLabel": "L4",
    "strand": "Grammar",
    "levelSubtitle": "Level 4 · Longer Sounds",
    "decorations": [
      {
        "key": "banana",
        "xMm": 158,
        "yMm": 237,
        "sizeMm": 46
      }
    ]
  },
  {
    "id": "g-l4-4",
    "code": "G-L4.4",
    "name": "One and more than one",
    "doInstruction": "Draw a line to match one to more than one",
    "objective": "Add -s or -es to make a plural.",
    "ncLink": "Year 1 word",
    "terminology": [
      "singular",
      "plural"
    ],
    "anchorBook": "Level 4 readers",
    "s1": {
      "prompt": "cat, cats",
      "answer": "cat, cats"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a word and its plural."
    },
    "format": "match",
    "match": {
      "rightShuffled": ["wishes", "chips", "dogs", "foxes", "ducks"],
      "pairs": [
        {
          "left": "dog",
          "right": "dogs"
        },
        {
          "left": "fox",
          "right": "foxes"
        },
        {
          "left": "duck",
          "right": "ducks"
        },
        {
          "left": "wish",
          "right": "wishes"
        },
        {
          "left": "chip",
          "right": "chips"
        }
      ]
    },
    "level": 4,
    "levelLabel": "L4",
    "strand": "Grammar",
    "levelSubtitle": "Level 4 · Longer Sounds",
    "decorations": [
      {
        "key": "coins",
        "xMm": 164,
        "yMm": 243,
        "sizeMm": 40
      }
    ]
  },
  {
    "id": "g-l4-5",
    "code": "G-L4.5",
    "name": "Add -ing, -ed, -er",
    "doInstruction": "Build the new word",
    "objective": "Add -ing, -ed or -er to the root word.",
    "ncLink": "Year 1 word",
    "terminology": [
      "suffix"
    ],
    "anchorBook": "Level 4 readers",
    "s1": {
      "prompt": "jump + ing",
      "answer": "jumping"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Pick a word and add -ing, -ed or -er."
    },
    "format": "build",
    "build": {
      "wordBank": [
        "sing",
        "buzz",
        "wish",
        "jump",
        "hunt",
        "mix"
      ],
      "rows": [
        {
          "base": "sing + er",
          "answer": "singer"
        },
        {
          "base": "buzz + ing",
          "answer": "buzzing"
        },
        {
          "base": "wish + ed",
          "answer": "wished"
        },
        {
          "base": "mix + ing",
          "answer": "mixing"
        }
      ]
    },
    "level": 4,
    "levelLabel": "L4",
    "strand": "Grammar",
    "levelSubtitle": "Level 4 · Longer Sounds",
    "decorations": [
      {
        "key": "paintbrush",
        "xMm": 162,
        "yMm": 241,
        "sizeMm": 42
      }
    ]
  }
];

export default units;
