import type { GrammarUnit } from '@/data/grammarSchema';

// L7 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l7-1",
    "code": "G-L7.1",
    "name": "The possessive apostrophe",
    "doInstruction": "Write each one with an apostrophe",
    "objective": "An apostrophe shows something belongs to one person.",
    "ncLink": "Year 2 punctuation",
    "terminology": [
      "apostrophe"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "This is Sam hat.",
      "answer": "This is Sam's hat."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence to show something belongs to Jack."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "That is Tim bag.",
          "answer": "That is Tim's bag."
        },
        {
          "text": "This is Meg cat.",
          "answer": "This is Meg's cat."
        },
        {
          "text": "That is Kim cup.",
          "answer": "That is Kim's cup."
        },
        {
          "text": "This is Pat pen.",
          "answer": "This is Pat's pen."
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
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
    "id": "g-l7-2",
    "code": "G-L7.2",
    "name": "Which homophone?",
    "doInstruction": "Write the best word in each gap",
    "objective": "Homophones sound the same but are spelled differently.",
    "ncLink": "Year 2 word",
    "terminology": [
      "homophone"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "The sun is over ___ (their/there).",
      "answer": "The sun is over there."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence with 'their' or 'there'."
    },
    "format": "cloze",
    "cloze": {
      "wordBank": [
        "their",
        "there",
        "here",
        "hear"
      ],
      "rows": [
        {
          "before": "I can see the cat over",
          "after": ".",
          "answer": "there"
        },
        {
          "before": "They put",
          "after": " hats on the mat.",
          "answer": "their"
        },
        {
          "before": "Can you",
          "after": " the bell ring?",
          "answer": "hear"
        },
        {
          "before": "Come and sit",
          "after": " with me.",
          "answer": "here"
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
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
    "id": "g-l7-3",
    "code": "G-L7.3",
    "name": "Tell it in order",
    "doInstruction": "Write the recount with time words",
    "objective": "Order a recount with first, next, then, after that, finally.",
    "ncLink": "Year 2 text",
    "terminology": [
      "sentence"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "I went to the park. I ran. I got wet.",
      "answer": "First, I went to the park. Next, I ran. Then, I got wet."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write three things you did in order using time words."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "I had lunch. I went out. I saw a dog.",
          "answer": "First, I had lunch. Next, I went out. Then, I saw a dog."
        },
        {
          "text": "I got up. I made my bed. I had milk.",
          "answer": "First, I got up. Next, I made my bed. Then, I had milk."
        },
        {
          "text": "I met Sam. We ran. We had a chat.",
          "answer": "First, I met Sam. Next, we ran. Then, we had a chat."
        },
        {
          "text": "I saw a cat. I gave it fish. It sat.",
          "answer": "First, I saw a cat. Next, I gave it fish. Then, it sat."
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
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
    "id": "g-l7-4",
    "code": "G-L7.4",
    "name": "Was -ing",
    "doInstruction": "Write each sentence in the was -ing form",
    "objective": "The progressive tense shows an action going on.",
    "ncLink": "Year 2 text",
    "terminology": [
      "verb",
      "tense"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "I run to the shop.",
      "answer": "I was running to the shop."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a sentence about what you were doing."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "He jump in the pond.",
          "answer": "He was jumping in the pond."
        },
        {
          "text": "She play with the dog.",
          "answer": "She was playing with the dog."
        },
        {
          "text": "We look at the cat.",
          "answer": "We were looking at the cat."
        },
        {
          "text": "They sing a song.",
          "answer": "They were singing a song."
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
    "decorations": [
      {
        "key": "owl",
        "xMm": 150,
        "yMm": 229,
        "sizeMm": 54
      }
    ]
  },
  {
    "id": "g-l7-5",
    "code": "G-L7.5",
    "name": "Suffix sort",
    "doInstruction": "Tick the suffix each word uses",
    "objective": "Suffixes -ness -ful -less -ly build new words.",
    "ncLink": "Year 2 word",
    "terminology": [
      "suffix"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "kindness",
      "answer": "-ness"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a word with the suffix -ful."
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        "-ness",
        "-ful",
        "-less",
        "-ly"
      ],
      "rows": [
        {
          "text": "sadness",
          "answer": "-ness"
        },
        {
          "text": "painful",
          "answer": "-ful"
        },
        {
          "text": "hopeless",
          "answer": "-less"
        },
        {
          "text": "kindly",
          "answer": "-ly"
        },
        {
          "text": "thankful",
          "answer": "-ful"
        },
        {
          "text": "spotless",
          "answer": "-less"
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
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
    "id": "g-l7-6",
    "code": "G-L7.6",
    "name": "Build a recount",
    "doInstruction": "Write three sentences with a list and time words",
    "objective": "Use commas in a list and time words in a recount.",
    "ncLink": "Year 2 punctuation/text",
    "terminology": [
      "comma"
    ],
    "anchorBook": "Level 7 readers",
    "s1": {
      "prompt": "I had a pen a cup and a bun. First I had a pen. Next I had a cup. Then I had a bun.",
      "answer": "First, I had a pen, a cup, and a bun."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write a recount of your day with a list and time words."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "I got a hat a bag and a bat. First I got a hat. Next I got a bag. Then I got a bat.",
          "answer": "First, I got a hat, a bag, and a bat."
        },
        {
          "text": "I met Tim Meg and Pat. First I met Tim. Next I met Meg. Then I met Pat.",
          "answer": "First, I met Tim, Meg, and Pat."
        },
        {
          "text": "I saw a dog a cat and a rat. First I saw a dog. Next I saw a cat. Then I saw a rat.",
          "answer": "First, I saw a dog, a cat, and a rat."
        },
        {
          "text": "I had jam ham and bun. First I had jam. Next I had ham. Then I had bun.",
          "answer": "First, I had jam, ham, and bun."
        }
      ]
    },
    "level": 7,
    "levelLabel": "L7",
    "strand": "Grammar",
    "levelSubtitle": "Level 7 · Reading Together",
    "decorations": [
      {
        "key": "leaf",
        "xMm": 158,
        "yMm": 237,
        "sizeMm": 46
      }
    ]
  }
];

export default units;
