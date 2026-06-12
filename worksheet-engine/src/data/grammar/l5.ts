import type { GrammarUnit } from '@/data/grammarSchema';

// L5 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l5-1",
    "code": "G-L5.1",
    "name": "Double then add the ending",
    "doInstruction": "Build the new word",
    "objective": "Some short words double the last letter before -ing or -ed.",
    "ncLink": "Year 1/2 word",
    "terminology": [
      "suffix"
    ],
    "anchorBook": "Level 5 readers",
    "format": "build",
    "s1": {
      "prompt": "hop + ing =",
      "answer": "hopping",
      "note": "Double the p before adding -ing."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence with one new word you built."
    },
    "build": {
      "wordBank": [
        "hop",
        "hopping",
        "hop",
        "hopped",
        "buzz",
        "buzzing",
        "buzzed",
        "pat",
        "patting",
        "patted"
      ],
      "rows": [
        {
          "base": "hop + ed =",
          "answer": "hopped"
        },
        {
          "base": "buzz + ing =",
          "answer": "buzzing"
        },
        {
          "base": "pat + ed =",
          "answer": "patted"
        },
        {
          "base": "pat + ing =",
          "answer": "patting"
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
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
    "id": "g-l5-2",
    "code": "G-L5.2",
    "name": "The prefix un-",
    "doInstruction": "Draw a line to match the word to its un- word",
    "objective": "The prefix un- means not.",
    "ncLink": "Year 1 word",
    "terminology": [
      "prefix"
    ],
    "anchorBook": "Level 5 readers",
    "format": "match",
    "s1": {
      "prompt": "kind, unkind",
      "answer": "kind, unkind"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence with an un- word."
    },
    "match": {
      "rightShuffled": ["unzip", "unpack", "unkind", "unplug", "unlock"],
      "pairs": [
        {
          "left": "kind",
          "right": "unkind"
        },
        {
          "left": "lock",
          "right": "unlock"
        },
        {
          "left": "zip",
          "right": "unzip"
        },
        {
          "left": "pack",
          "right": "unpack"
        },
        {
          "left": "plug",
          "right": "unplug"
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
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
    "id": "g-l5-3",
    "code": "G-L5.3",
    "name": "Commas in a list",
    "doInstruction": "Write each list with commas",
    "objective": "Use commas to separate items in a list.",
    "ncLink": "Year 2 punctuation",
    "terminology": [
      "comma"
    ],
    "anchorBook": "Level 5 readers",
    "format": "rewrite",
    "s1": {
      "prompt": "I can see a cat a dog a rat.",
      "answer": "I can see a cat, a dog, a rat."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own list with three things."
    },
    "rewrite": {
      "rows": [
        {
          "text": "She has a pen a pad a bag.",
          "answer": "She has a pen, a pad, a bag."
        },
        {
          "text": "We saw a duck a hen a pig.",
          "answer": "We saw a duck, a hen, a pig."
        },
        {
          "text": "He got a cup a bun a jam.",
          "answer": "He got a cup, a bun, a jam."
        },
        {
          "text": "They can hop skip jump.",
          "answer": "They can hop, skip, jump."
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
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
    "id": "g-l5-4",
    "code": "G-L5.4",
    "name": "Put it in order",
    "doInstruction": "Write the three steps in order with First, Next, Then",
    "objective": "Order events with First, Next, Then.",
    "ncLink": "Year 1 text",
    "terminology": [
      "sentence"
    ],
    "anchorBook": "Level 5 readers",
    "format": "rewrite",
    "s1": {
      "prompt": "First, get a cup. Next, fill it. Then, sip it.",
      "answer": "First, get a cup. Next, fill it. Then, sip it."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write three steps for making a jam bun."
    },
    "rewrite": {
      "rows": [
        {
          "text": "First, pick a pen. Next, get a pad. Then, jot it.",
          "answer": "First, pick a pen. Next, get a pad. Then, jot it."
        },
        {
          "text": "First, pack a bag. Next, zip it. Then, go out.",
          "answer": "First, pack a bag. Next, zip it. Then, go out."
        },
        {
          "text": "First, put jam on. Next, add bun. Then, eat it.",
          "answer": "First, put jam on. Next, add bun. Then, eat it."
        },
        {
          "text": "First, get up. Next, get dressed. Then, go.",
          "answer": "First, get up. Next, get dressed. Then, go."
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
    "decorations": [
      {
        "key": "paintbrush",
        "xMm": 162,
        "yMm": 241,
        "sizeMm": 42
      }
    ]
  },
  {
    "id": "g-l5-5",
    "code": "G-L5.5",
    "name": "Nouns and verbs",
    "doInstruction": "Circle the noun. Underline the verb",
    "objective": "A noun is a thing; a verb is an action.",
    "ncLink": "Year 1/2 word classes",
    "terminology": [
      "noun",
      "verb"
    ],
    "anchorBook": "Level 5 readers",
    "format": "circle",
    "s1": {
      "prompt": "The cat jumps.",
      "answer": "Circle: cat, Underline: jumps"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence and mark the noun and verb."
    },
    "circle": {
      "targets": [
        {
          "label": "noun",
          "mark": "circle"
        },
        {
          "label": "verb",
          "mark": "underline"
        }
      ],
      "rows": [
        {
          "text": "The dog runs.",
          "finds": [
            {
              "word": "dog",
              "target": "noun"
            },
            {
              "word": "runs",
              "target": "verb"
            }
          ]
        },
        {
          "text": "The duck quacks.",
          "finds": [
            {
              "word": "duck",
              "target": "noun"
            },
            {
              "word": "quacks",
              "target": "verb"
            }
          ]
        },
        {
          "text": "The fox jumps.",
          "finds": [
            {
              "word": "fox",
              "target": "noun"
            },
            {
              "word": "jumps",
              "target": "verb"
            }
          ]
        },
        {
          "text": "The pig sits.",
          "finds": [
            {
              "word": "pig",
              "target": "noun"
            },
            {
              "word": "sits",
              "target": "verb"
            }
          ]
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
    "decorations": [
      {
        "key": "abc",
        "xMm": 160,
        "yMm": 239,
        "sizeMm": 44
      }
    ]
  },
  {
    "id": "g-l5-6",
    "code": "G-L5.6",
    "name": "Words before a noun",
    "doInstruction": "Build the noun phrase",
    "objective": "A noun can have words before it.",
    "ncLink": "Year 1/2 word",
    "terminology": [
      "noun"
    ],
    "anchorBook": "Level 5 readers",
    "format": "build",
    "s1": {
      "prompt": "the big dog",
      "answer": "the big dog"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a noun phrase with two words before the noun."
    },
    "build": {
      "wordBank": [
        "the",
        "big",
        "red",
        "long",
        "soft",
        "wet",
        "hot",
        "dog",
        "cat",
        "fish",
        "bun",
        "cup",
        "fox",
        "duck"
      ],
      "rows": [
        {
          "base": "the soft bun",
          "answer": "the soft bun"
        },
        {
          "base": "the wet fox",
          "answer": "the wet fox"
        },
        {
          "base": "the long fish",
          "answer": "the long fish"
        },
        {
          "base": "the hot cup",
          "answer": "the hot cup"
        }
      ]
    },
    "level": 5,
    "levelLabel": "L5",
    "strand": "Grammar",
    "levelSubtitle": "Level 5 · New Spellings",
    "decorations": [
      {
        "key": "owl",
        "xMm": 150,
        "yMm": 229,
        "sizeMm": 54
      }
    ]
  }
];

export default units;
