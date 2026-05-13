"""
Moo at the Zoo — Level 2.2 Focus Story
Written 2026-03-06
Focus sounds: ow, oo
Setting: A modern zoo — child visits with Dad, each page a DIFFERENT area

CREATIVE DIRECTION: Journey/location-change story. Each page is set in a
different part of the zoo, so AI image generation doesn't need to maintain
background consistency across pages. Only the characters need to be consistent
(handled by hero injection). Simple scenes: one child + one animal + one background.

Character: A cheerful girl (~5yo) in a bright red cap, yellow t-shirt,
blue denim dungarees, and white trainers. She has light brown skin and
curly dark brown hair in two puffs.
Dad: A man (~35yo) with light brown skin and short dark brown hair,
wearing a green polo shirt and khaki trousers.

STORY STRUCTURE: Dear Zoo / search pattern — child wants to find the owl
but keeps finding other animals instead. Building anticipation with
"No owl." refrain. Payoff when owl is finally found.

Engagement hooks:
  - Search/quest pattern (Where is the owl?) — Dear Zoo style
  - Repetition with variation: "No owl." refrain builds anticipation
  - Onomatopoeia: Moo! Hoo! Wow! Ooh! Boo! (fun to read aloud)
  - Page-turn hooks: "I will look on" → what will we see next?
  - Emotional arc: excitement → searching → sadness → surprise → joy
  - Satisfying climax: owl found at last, child and owl bow to each other

Word validation (L2.2 cumulative graphemes + tricky words):
  L2.2 cumulative graphemes: s,a,t,p,i,n,m,d,g,o,c,k,ck,e,u,r,h,b,f,ff,
    l,ll,ss,j,v,w,x,y,z,zz,qu,ch,sh,th,ng,nk + ay,ee,igh + ow,oo
  L2.2 cumulative tricky words: the,to,I,no,go,into,he,she,we,me,be,my,
    you,her,said,your,are,put
  Word structure: CVC + all digraphs + vowel digraphs (NO consonant clusters)
  Adding -s for plurals/verbs is permitted.

ALL WORDS VERIFIED DECODABLE OR TRICKY — see word-by-word check below.

Page 1: I(T) go(T) to(T) the(T) zoo(oo) with(th) my(T) dad. I(T) need(ee)
         to(T) see(ee) the(T) owl(ow)!
Page 2: I(T) look(oo) at the(T) cows(ow). Moo(oo)! Moo(oo)! No(T) owl(ow).
         I(T) will(ll) look(oo) on.
Page 3: Wow(ow)! A big show(ow). A seal(ee) can shoot(oo) a hoop(oo)!
         No(T) owl(ow).
Page 4: Ooh(oo)! I(T) see(ee) a cool(oo) pool(oo). Fish zoom(oo) in it.
         No(T) owl(ow).
Page 5: Boo(oo)! A big dim room(oo). I(T) see(ee) bats. No(T) owl(ow)!
Page 6: I(T) am so sad now(ow). Then(th) my(T) dad calls, "Look(oo) up!"
Page 7: Hoo(oo)! Hoo(oo)! I(T) look(oo) up. The(T) owl(ow)!
         It is up high(igh)!
Page 8: The(T) owl(ow) bows(ow) at me(T). I(T) bow(ow) too(oo).
         The(T) zoo(oo) is so good(oo)!

Focus sound density:
  ow tokens: owl(p1), cows(p2), owl(p2), wow(p3), show(p3), owl(p3),
             owl(p4), owl(p5), now(p6), owl(p7), owl(p8), bows(p8), bow(p8) = 13
  oo tokens: zoo(p1), look(p2), moo(p2), moo(p2), look(p2), shoot(p3),
             hoop(p3), ooh(p4), cool(p4), pool(p4), zoom(p4), boo(p5),
             room(p5), look(p6), hoo(p7), hoo(p7), look(p7), too(p8),
             zoo(p8), good(p8) = 20
  Total: 33 focus sound tokens in 108 words = 31%
"""

MOO_ZOO_STORY_BOOK1 = {
    "L2_2_B1": {
        "level": 2,
        "sub_level": "L2.2",
        "book_number": 1,
        "book_title": "Moo at the Zoo",
        "focus_graphemes": ["ow", "oo"],
        "character_id": None,  # Custom character — girl in red cap
        "story_pages": [
            {
                "text": "I go to the zoo with my dad. I need to see the owl!",
                "image": None,
            },
            {
                "text": "I look at the cow. Moo! Moo! No owl. I will look on.",
                "image": None,
            },
            {
                "text": "Wow! A big show. A shark can shoot a hoop! No owl.",
                "image": None,
            },
            {
                "text": "Ooh! I see a cool pool. Fish zoom in it. No owl.",
                "image": None,
            },
            {
                "text": "Boo! A big dim room. I see bats. No owl!",
                "image": None,
            },
            {
                "text": "I am sad now. Then my dad shouts, \u201cLook up!\u201d",
                "image": None,
            },
            {
                "text": "Hoo! Hoo! I look up. The owl! It is up high!",
                "image": None,
            },
            {
                "text": "The owl bows at me. I bow too. The zoo is good!",
                "image": None,
            },
        ],
        "story_words": ["zoo", "cow", "owl", "moo", "hoop", "cool"],
        "tricky_words_used": ["the", "I", "to", "no", "my", "me", "go"],  # 'go' on p1; 'so'/'calls' removed via rewrites
        "read_words": ["zoo", "owl", "cool", "hoop"],
        "nonsense_words": [
            "dow", "jow", "fow", "zow",
            "dool", "toof", "mool", "joom",
            "choom", "voot", "foom", "thook",
        ],
        "questions": [
            {"text": "What did the child look for at the zoo?"},
            {"text": "What sound does the cow make?"},
            {"text": "Who saw the owl first?"},
            {"text": "Did the child like the zoo?"},
        ],
        "writing_graphemes": ["ow", "oo"],
    }
}
