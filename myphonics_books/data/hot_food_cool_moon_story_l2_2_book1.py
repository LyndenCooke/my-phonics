"""
Hot Food, Cool Moon — Level 2.2 Focus Story
Written 2026-07-22, replacing the original 2026-03-06 story for this slot.
Focus sounds: ow, oo
Setting: A street-food night market, England — child visits with Mum

RULINGS THIS STORY EXISTS TO HONOUR (Lynden, 2026-07-22) — the story it
replaced broke all three, so do not reintroduce them:
  1. "ow" at this level teaches ONLY the /oʊ/ pronunciation (blow/snow/show).
     The /aʊ/ sound (owl/cow/wow/now/bow) is NOT taught until level 6 — see
     shifty_sounds.json. The old story was built around hunting an "owl".
  2. A sound target needs ~3 genuine words in the story, and no more. Do NOT
     force examples into every line: a redraft that packed each sentence with
     sound-matching words stopped reading like real English and was rejected.
     Check every added word against the level, too — one such patch used
     "shark", but "ar" isn't taught until L2.3.
  3. Use the book as a lowkey window onto another place or community (the
     project mission) rather than a generic setting. Demographic chosen here:
     a white English revert (convert) Muslim family — Malaysia is already
     covered elsewhere in the fleet.

CREATIVE DIRECTION: A British street-food night market (string lights,
bunting, food stalls). The demographic is carried by the ILLUSTRATIONS —
a white English revert (convert) Muslim family, both mum and daughter in
hijab — while the text stays universal. Nothing in the story is "about"
identity; it is simply ordinary life. The wok stall is a standard UK
street-food vendor; the "mat" on page 8 is a picnic blanket on the
market green. Dignity check: modern everyday scene, no stereotypes, no
tokenism — hijab drawn as normal clothing, never remarked on.

Character: A girl (~5yo) with light skin, wearing a soft pink hijab, a
mustard-yellow long-sleeved tunic top, navy trousers, and white trainers.
Mum: A white English woman (~30s) wearing a soft sage-green hijab and a
long-sleeved cream cardigan over a long navy dress.
(Eyes: solid black filled ovals, house rule.)

STORY STRUCTURE: Small universal drama — the food is too hot to eat.
Anticipation → wonder (wok show) → obstacle (too hot!) → frustration
(huff and puff) → Mum's redirect (sit, watch the moon) → reward (food has
cooled, dig in) → cosy closure. Teaches patience without preaching it.

Engagement hooks:
  - Universal kid moment: blowing on food that will not cool down
  - Onomatopoeia: Hiss! Pop! Huff! Puff! Yum! (fun to read aloud)
  - Page-turn hooks: "Food shops in a row!" → what will they get?
    "It is too hot!" → will he get to eat it?
  - Emotional arc: excitement → wonder → frustration → calm → joy
  - Quiet beat: sitting with Mum under a big yellow moon

Word validation (L2.2 cumulative graphemes + tricky words):
  L2.2 cumulative graphemes: s,a,t,p,i,n,m,d,g,o,c,k,ck,e,u,r,h,b,f,ff,
    l,ll,ss,j,v,w,x,y,z,zz,qu,ch,sh,th,ng,nk + ay,ee,igh + ow(blow/snow
    pronunciation only),oo(long/zoo pronunciation only)
  NOTE: "ar" is NOT taught until L2.3 — no market/shark/star words.
  L2.2 cumulative tricky words: the,to,I,no,go,into,he,she,we,me,be,my,
    you,her,said,your,are,put (+ "is", precedent from the shipped
    interactive reader — voiced /z/ makes it a trap word)
  Word structure: CVC + all digraphs + vowel digraphs (NO consonant
  clusters). Adding -s for plurals/verbs is permitted. "and" permitted
  by fleet precedent.

ALL WORDS VERIFIED DECODABLE OR TRICKY — word-by-word check:

Page 1: The(T) sun dips low(ow). I(T) go(T) with(th) my(T) mum to(T)
         get food(oo).
Page 2: It is(T) night(igh). Food(oo) shops(sh) in a row(ow)! Yum!
Page 3: I(T) see(ee) a man at a big wok. Hiss(ss)! Pop! The(T) food(oo)
         hops!
Page 4: Mum gets me(T) a bowl(ow). Ooh(oo)! It is(T) too(oo) hot!
Page 5: I(T) huff(ff) and puff(ff) on it. Huff! Puff! This(th) is(T)
         no(T) fun!
Page 6: Mum said(T), "Sit with(th) me(T). See(ee) the(T) moon(oo)!"
Page 7: The(T) moon(oo) is(T) big and yellow(ow)! Then(th) I(T) dig in.
         It is(T) not hot! Yum, yum, yum!
         (2026-07-22: was the bare fragment "Not hot!" — Lynden asked whether it
         needed a subject. It does: a verbless exclamative is fine in speech but
         these books model whole sentences, and the full form now mirrors p4's
         "It is too hot!" so the payoff lands as a direct answer to it.)
Page 8: We(T) sit low(ow) on the(T) mat. The(T) night(igh) is(T)
         cool(oo). I(T) am with(th) my(T) mum. It is(T) fun!

Focus sound density (natural placement, not forced):
  ow tokens (blow/snow pronunciation, all correct): low(p1), row(p2),
             bowl(p4), yellow(p7), low(p8) = 5
  oo tokens (long/zoo pronunciation, all correct): food(p1), food(p2),
             food(p3), ooh(p4), too(p4), moon(p6), moon(p7), cool(p8) = 8
  Both targets clear the 3-word minimum; no sentence carries a word it
  would not carry in natural speech.
"""

HOT_FOOD_COOL_MOON_STORY_BOOK1 = {
    "L2_2_B1": {
        "level": 2,
        "sub_level": "L2.2",
        "book_number": 1,
        "book_title": "Hot Food, Cool Moon",
        "focus_graphemes": ["ow", "oo"],
        "character_id": None,  # Custom characters — boy + mum, pasar malam
        "story_pages": [
            {
                "text": "The sun dips low. I go with my mum to get food.",
                "image": None,
            },
            {
                "text": "It is night. Food shops in a row! Yum!",
                "image": None,
            },
            {
                "text": "I see a man at a big wok. Hiss! Pop! The food hops!",
                "image": None,
            },
            {
                "text": "Mum gets me a bowl. Ooh! It is too hot!",
                "image": None,
            },
            {
                "text": "I huff and puff on it. Huff! Puff! This is no fun!",
                "image": None,
            },
            {
                "text": "Mum said, \"Sit with me. See the moon!\"",
                "image": None,
            },
            {
                "text": "The moon is big and yellow! Then I dig in. It is not hot! Yum, yum, yum!",
                "image": None,
            },
            {
                "text": "We sit low on the mat. The night is cool. I am with my mum. It is fun!",
                "image": None,
            },
        ],
        "story_words": ["food", "moon", "wok", "bowl", "row", "low"],
        "tricky_words_used": ["the", "I", "to", "my", "me", "we", "said"],
        "read_words": ["food", "moon", "bowl", "low"],
        "nonsense_words": [
            "dow", "jow", "fow", "zow",
            "dool", "toof", "mool", "joom",
            "choom", "voot", "foom", "thook",
        ],
        "questions": [
            {"text": "What did the child go to get with Mum?"},
            {"text": "Why was the child sad?"},
            {"text": "What did Mum say to look at?"},
            {"text": "Was the food still hot at the end?"},
        ],
        "writing_graphemes": ["ow", "oo"],
    }
}
