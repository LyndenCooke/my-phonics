import type { GrammarUnit } from '@/data/grammarSchema';

// L8 GRAMMAR, DRAFT content authored by scripts/author_grammar.py via the
// OpenAI specialist, constrained to this level's decodable graphemes + tricky
// words (grammar_scheme_of_work.md §5). NEEDS decodability/pedagogy QA before publish.

const units: GrammarUnit[] = [
  {
    "id": "g-l8-3",
    "code": "G-L8.3",
    "name": "One or more than one owner",
    "doInstruction": "Tick: one owner or more than one",
    "objective": "An apostrophe before -s shows one owner; after -s shows more.",
    "ncLink": "Year 2/3 punctuation",
    "terminology": [
      "apostrophe",
      "singular",
      "plural"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "the dog's tail",
      "answer": "one owner"
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own example of one owner and more than one owner."
    },
    "format": "tickgrid",
    "tickgrid": {
      "columns": [
        "one owner",
        "more than one"
      ],
      "rows": [
        {
          "text": "the cat's fur",
          "answer": "one owner"
        },
        {
          "text": "the cats' food",
          "answer": "more than one"
        },
        {
          "text": "the fox's den",
          "answer": "one owner"
        },
        {
          "text": "the dogs' park",
          "answer": "more than one"
        },
        {
          "text": "the bird's song",
          "answer": "one owner"
        },
        {
          "text": "the birds' nest",
          "answer": "more than one"
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
    "id": "g-l8-4",
    "code": "G-L8.4",
    "name": "Change the opener",
    "doInstruction": "Write each sentence with a different opener",
    "objective": "You can open a sentence in different ways.",
    "ncLink": "Year 2/3 sentence",
    "terminology": [
      "clause",
      "subordinate clause"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "Sam ran to the shop.",
      "answer": "At the shop, Sam ran in."
    },
    "weDoCount": 2,
    "apply": {
      "prompt": "Write a new opener for your own sentence."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "The dog sat on the mat.",
          "answer": "On the mat, the dog sat."
        },
        {
          "text": "Jack went to the park.",
          "answer": "To the park, Jack went."
        },
        {
          "text": "The cat slept in the sun.",
          "answer": "In the sun, the cat slept."
        },
        {
          "text": "Mum made a cake.",
          "answer": "With care, Mum made a cake."
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
    "id": "g-l8-6",
    "code": "G-L8.6",
    "name": "Be a proofreader",
    "doInstruction": "Write each sentence again, fixed",
    "objective": "Find and fix the mistakes.",
    "ncLink": "Year 2/3 text",
    "terminology": [
      "sentence",
      "punctuation"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "the fox ran up the hill",
      "answer": "The fox ran up the hill."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own sentence and check for mistakes."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "jack went to the shop",
          "answer": "Jack went to the shop."
        },
        {
          "text": "mum made a cake",
          "answer": "Mum made a cake."
        },
        {
          "text": "the cat is on the mat",
          "answer": "The cat is on the mat."
        },
        {
          "text": "i see the dog",
          "answer": "I see the dog."
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
    "id": "g-l8-1",
    "code": "G-L8.1",
    "name": "Fronted adverbials",
    "doInstruction": "Write each sentence with the opener and a comma",
    "objective": "Move the adverbial to the front and add a comma.",
    "ncLink": "Year 3 sentence",
    "terminology": [
      "adverbial",
      "comma"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "The cat slept under the tree at night.",
      "answer": "At night, the cat slept under the tree."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own sentence with a fronted adverbial."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "The dog barked in the park after lunch.",
          "answer": "After lunch, the dog barked in the park."
        },
        {
          "text": "Jack read his book before bed.",
          "answer": "Before bed, Jack read his book."
        },
        {
          "text": "The birds sang in the tree in the morning.",
          "answer": "In the morning, the birds sang in the tree."
        },
        {
          "text": "Mum baked a cake on Sunday.",
          "answer": "On Sunday, Mum baked a cake."
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
    "id": "g-l8-2",
    "code": "G-L8.2",
    "name": "Speech marks",
    "doInstruction": "Write each line with speech marks",
    "objective": "Inverted commas go around the words someone says.",
    "ncLink": "Year 3 punctuation",
    "terminology": [
      "inverted commas",
      "direct speech"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "I am going to the shop said Sam.",
      "answer": "\"I am going to the shop,\" said Sam."
    },
    "weDoCount": 2,
    "apply": {
      "prompt": "Write your own line of speech with speech marks."
    },
    "format": "rewrite",
    "rewrite": {
      "rows": [
        {
          "text": "Look at the dog said Jack.",
          "answer": "\"Look at the dog,\" said Jack."
        },
        {
          "text": "It is hot said Mum.",
          "answer": "\"It is hot,\" said Mum."
        },
        {
          "text": "Can I have cake asked Sam.",
          "answer": "\"Can I have cake?\" asked Sam."
        },
        {
          "text": "We can go to the park said Dad.",
          "answer": "\"We can go to the park,\" said Dad."
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
    "id": "g-l8-5",
    "code": "G-L8.5",
    "name": "Time, place and cause",
    "doInstruction": "Write the best word in each gap",
    "objective": "Words like before, outside and because add time, place and cause.",
    "ncLink": "Year 3 sentence",
    "terminology": [
      "conjunction",
      "preposition",
      "adverb"
    ],
    "anchorBook": "Level 8 readers",
    "s1": {
      "prompt": "___ the rain, we went inside.",
      "answer": "After the rain, we went inside."
    },
    "weDoCount": 1,
    "apply": {
      "prompt": "Write your own sentence using a word from the word bank."
    },
    "format": "cloze",
    "cloze": {
      "wordBank": [
        "before",
        "after",
        "because",
        "outside",
        "when"
      ],
      "rows": [
        {
          "before": "___",
          "after": " lunch, we went to the park.",
          "answer": "After"
        },
        {
          "before": "We sat ___",
          "after": " the tree.",
          "answer": "under"
        },
        {
          "before": "___",
          "after": " it was hot, we had ice cream.",
          "answer": "Because"
        },
        {
          "before": "___",
          "after": " you see the dog, tell me.",
          "answer": "When"
        }
      ]
    },
    "level": 8,
    "levelLabel": "L8",
    "strand": "Grammar",
    "levelSubtitle": "Level 8 · Reading Champion",
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
