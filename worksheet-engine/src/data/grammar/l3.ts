import type { GrammarUnit } from '@/data/grammarSchema';

// L3 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l3-1",
    "code": "G-L3.1",
    "name": "Capital letters for names",
    "doInstruction": "Tick the words that are names",
    "objective": "Names of people and places take a capital letter.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "capital letter",
      "name"
    ],
    "anchorBook": "Level 3 readers",
    "s1": {
      "prompt": "Tick: Sam",
      "answer": "Sam"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your name with a capital letter."
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        "name",
        "not a name"
      ],
      "rows": [
        {
          "text": "Jack",
          "answer": "name"
        },
        {
          "text": "dog",
          "answer": "not a name"
        },
        {
          "text": "Nan",
          "answer": "name"
        },
        {
          "text": "cat",
          "answer": "not a name"
        },
        {
          "text": "Jill",
          "answer": "name"
        },
        {
          "text": "mat",
          "answer": "not a name"
        }
      ]
    },
    "level": 3,
    "levelLabel": "L3",
    "strand": "Grammar",
    "levelSubtitle": "Level 3 · Special Friends",
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
    "id": "g-l3-2",
    "code": "G-L3.2",
    "name": "Question marks",
    "doInstruction": "Write each question with a question mark",
    "objective": "A question ends with a question mark.",
    "ncLink": "Year 1 punctuation",
    "terminology": [
      "question mark"
    ],
    "anchorBook": "Level 3 readers",
    "s1": {
      "prompt": "Is it hot",
      "answer": "Is it hot?"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a question about a pet."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "Is it hot",
          "answer": "Is it hot?"
        },
        {
          "text": "Can Sam hop",
          "answer": "Can Sam hop?"
        },
        {
          "text": "Will Jack run",
          "answer": "Will Jack run?"
        },
        {
          "text": "Is the cat on the mat",
          "answer": "Is the cat on the mat?"
        }
      ]
    },
    "level": 3,
    "levelLabel": "L3",
    "strand": "Grammar",
    "levelSubtitle": "Level 3 · Special Friends",
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
    "id": "g-l3-3",
    "code": "G-L3.3",
    "name": "Statement or question?",
    "doInstruction": "Tick statement or question",
    "objective": "A statement tells; a question asks.",
    "ncLink": "Year 1 sentence",
    "terminology": [
      "statement",
      "question"
    ],
    "anchorBook": "Level 3 readers",
    "s1": {
      "prompt": "The cat is on the mat",
      "answer": "statement"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a question and a statement."
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        "statement",
        "question"
      ],
      "rows": [
        {
          "text": "The cat is on the mat",
          "answer": "statement"
        },
        {
          "text": "Can the dog run",
          "answer": "question"
        },
        {
          "text": "Sam is in the hut",
          "answer": "statement"
        },
        {
          "text": "Is it hot",
          "answer": "question"
        },
        {
          "text": "Jack can hop",
          "answer": "statement"
        },
        {
          "text": "Will Nan sing",
          "answer": "question"
        }
      ]
    },
    "level": 3,
    "levelLabel": "L3",
    "strand": "Grammar",
    "levelSubtitle": "Level 3 · Special Friends",
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
    "id": "g-l3-4",
    "code": "G-L3.4",
    "name": "Question words",
    "doInstruction": "Draw a line to match the question to its answer",
    "objective": "Questions can start who, what, where, when.",
    "ncLink": "Year 1 sentence",
    "terminology": [
      "question"
    ],
    "anchorBook": "Level 3 readers",
    "s1": {
      "prompt": "Who is in the hut?, Nan is in the hut.",
      "answer": "Who is in the hut?, Nan is in the hut."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a question and answer about a pet."
    },
    "format": "match",
    "match": {
      "pairs": [
        {
          "left": "Who is in the hut?",
          "right": "Nan is in the hut."
        },
        {
          "left": "What can Jack do?",
          "right": "Jack can hop."
        },
        {
          "left": "Where is the cat?",
          "right": "The cat is on the mat."
        },
        {
          "left": "When is it hot?",
          "right": "It is hot at noon."
        },
        {
          "left": "Who has a dog?",
          "right": "Sam has a dog."
        }
      ]
    },
    "level": 3,
    "levelLabel": "L3",
    "strand": "Grammar",
    "levelSubtitle": "Level 3 · Special Friends",
    "decorations": [
      {
        "key": "banana",
        "xMm": 158,
        "yMm": 237,
        "sizeMm": 46
      }
    ]
  }
];

export default units;
