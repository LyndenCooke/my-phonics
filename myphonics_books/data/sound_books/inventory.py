"""
Sound Books — full inventory (73 books across L1-L8).

Word lists are SOUND-SPOTLIGHT (image-able, initial-sound matching)
authored by senior literacy consultant — NOT decodable drills.
See output/sound_books/_word_consult_transcript.md for full brief.

Each entry shape:
  level / sub_level / book_number   — IDs
  title                              — display title
  sounds                             — list of {grapheme, instruction?, words}
  comparison_sounds                  — list of alternative spellings (L5+)
"""

LEVEL_COLOURS = {
    1: "#E84B8A",
    2: "#F97066",
    3: "#F59E0B",
    4: "#22C55E",
    5: "#3B82F6",
    6: "#6366F1",
    7: "#8B5CF6",
    8: "#14B8A6",
}

LEVEL_NAMES = {
    1: "Ditties",
    2: "First Sounds",
    3: "Special Friends",
    4: "Longer Sounds",
    5: "New Spellings",
    6: "Building Fluency",
    7: "Reading Together",
    8: "Reading Champion",
}

# QUERY_OVERRIDES kept for backwards compat — most queries now live
# inline in each word dict via {'word': ..., 'query': ...}.
QUERY_OVERRIDES = {}

def _b(level, sub, num, title, sounds, comparison=None):
    return {
        "level": level, "sub_level": sub, "book_number": num,
        "title": title, "sounds": sounds,
        "comparison_sounds": comparison or [],
    }

def _s(grapheme, instruction, words):
    return {"grapheme": grapheme, "instruction": instruction, "words": words}


INVENTORY = [
    _b(1, 1, 1, "Sound Book: s", [
        _s("s", "Say the sound: s. Snake sound, hiss like a snake. ssss!", [
            {"word": "sun", "query": "bright sun in the sky"},
            {"word": "snake", "query": "green snake on grass"},
            {"word": "sock", "query": "colourful striped knitted socks"},
            {"word": "sandwich", "query": "ham sandwich on plate"},
            {"word": "star", "query": "gold star ornament decoration"},
            {"word": "spoon", "query": "silver spoon on table"},
        ])
    ]),
    _b(1, 2, 1, "Sound Book: a", [
        _s("a", "Say the sound: a. Open your mouth, short sound. a-a-a!", [
            {"word": "apple", "query": "red apple on tree"},
            {"word": "ant", "query": "ant on leaf"},
            {"word": "astronaut", "query": "astronaut in space suit"},
            {"word": "alligator", "query": "alligator in water"},
            {"word": "ambulance", "query": "ambulance on road"},
            {"word": "anchor", "query": "ship anchor on dock"},
        ])
    ]),
    _b(1, 3, 1, "Sound Book: t", [
        _s("t", "Say the sound: t. Tongue behind teeth, short puff. t-t-t!", [
            {"word": "tiger", "query": "bengal tiger in jungle"},
            {"word": "train", "query": "steam train on tracks"},
            {"word": "tree", "query": "oak tree in forest"},
            {"word": "turtle", "query": "sea turtle swimming"},
            {"word": "tent", "query": "camping tent in forest"},
            {"word": "teapot", "query": "ceramic teapot on table"},
        ])
    ]),
    _b(1, 4, 1, "Sound Book: p", [
        _s("p", "Say the sound: p. Pop your lips. p-p-p!", [
            {"word": "penguin", "query": "emperor penguin on ice"},
            {"word": "piano", "query": "grand piano in room"},
            {"word": "pumpkin", "query": "orange pumpkin in field"},
            {"word": "parrot", "query": "colourful parrot on branch"},
            {"word": "pencil", "query": "yellow pencil on desk"},
            {"word": "pizza", "query": "pepperoni pizza on plate"},
        ])
    ]),
    _b(1, 5, 1, "Sound Book: i", [
        _s("i", "Say the sound: i. Short and quick. i-i-i!", [
            {"word": "icecream", "query": "ice cream cone"},
            {"word": "igloo", "query": "snow igloo in arctic"},
            {"word": "insect", "query": "ladybird on leaf"},
            {"word": "island", "query": "tropical island in ocean"},
            {"word": "iron", "query": "electric iron on board"},
            {"word": "iguana", "query": "green iguana on branch"},
        ])
    ]),
    _b(1, 6, 1, "Sound Book: n", [
        _s("n", "Say the sound: n. Tongue at the top, hum. nnnn!", [
            {"word": "nest", "query": "bird nest in tree"},
            {"word": "nose", "query": "child's nose close-up"},
            {"word": "net", "query": "fishing net on boat"},
            {"word": "nurse", "query": "nurse in hospital"},
            {"word": "necklace", "query": "pearl necklace on display"},
            {"word": "napkin", "query": "folded napkin on table"},
        ])
    ]),
    _b(1, 7, 1, "Sound Book: m", [
        _s("m", "Say the sound: m. Lips together, hum. mmmm!", [
            {"word": "monkey", "query": "monkey in jungle"},
            {"word": "moon", "query": "full moon in night sky"},
            {"word": "mushroom", "query": "red mushroom in forest"},
            {"word": "mountain", "query": "snowy mountain peak"},
            {"word": "motorbike", "query": "red motorbike on road"},
            {"word": "milk", "query": "glass of milk on table"},
        ])
    ]),
    _b(1, 8, 1, "Sound Book: d", [
        _s("d", "Say the sound: d. Tongue behind teeth, voiced. d-d-d!", [
            {"word": "dog", "query": "golden retriever dog"},
            {"word": "dinosaur", "query": "dinosaur skeleton in museum"},
            {"word": "drum", "query": "drum set on stage"},
            {"word": "duck", "query": "mallard duck on pond"},
            {"word": "door", "query": "wooden door in house"},
            {"word": "dolphin", "query": "dolphin jumping in ocean"},
        ])
    ]),
    _b(1, 9, 1, "Sound Book: g", [
        _s("g", "Say the sound: g. Back of the throat. g-g-g!", [
            {"word": "giraffe", "query": "giraffe in savannah"},
            {"word": "guitar", "query": "acoustic guitar on stand"},
            {"word": "goat", "query": "goat on farm"},
            {"word": "grape", "query": "bunch of grapes on vine"},
            {"word": "glove", "query": "winter glove on hand"},
            {"word": "garden", "query": "flower garden in spring"},
        ])
    ]),
    _b(1, 10, 1, "Sound Book: o", [
        _s("o", "Say the sound: o. Round mouth, short. o-o-o!", [
            {"word": "octopus", "query": "octopus in aquarium"},
            {"word": "orange", "query": "orange fruit on tree"},
            {"word": "ostrich", "query": "ostrich in desert"},
            {"word": "oven", "query": "kitchen oven with door open"},
            {"word": "owl", "query": "barn owl perched"},
            {"word": "onion", "query": "red onion on cutting board"},
        ])
    ]),
    _b(2, 1, 1, "Sound Book: c", [
        _s("c", "Say the sound: c. Back of the throat, like a cough. c-c-c!", [
            {"word": "cat", "query": "tabby cat sitting"},
            {"word": "carrot", "query": "bunch of carrots"},
            {"word": "camel", "query": "camel in desert"},
            {"word": "castle", "query": "medieval castle on hill"},
            {"word": "candle", "query": "lit candle on table"},
            {"word": "cactus", "query": "cactus in desert"},
        ])
    ]),
    _b(2, 2, 1, "Sound Book: k", [
        _s("k", "Say the sound: k. Same sound as c — back of the throat. k-k-k!", [
            {"word": "kite", "query": "colourful kite in sky"},
            {"word": "kangaroo", "query": "kangaroo in outback"},
            {"word": "key", "query": "golden key on table"},
            {"word": "koala", "query": "koala in eucalyptus tree"},
            {"word": "kettle", "query": "electric kettle on counter"},
            {"word": "king", "query": "king with crown"},
        ])
    ]),
    _b(2, 3, 1, "Sound Book: ck", [
        _s("ck", "Say the sound: ck. Two letters, one sound — same as c and k. ck-ck-ck!", [
            {"word": "duck", "query": "mallard duck on pond"},
            {"word": "lock", "query": "padlock on gate"},
            {"word": "rock", "query": "large rock on beach"},
            {"word": "clock", "query": "wall clock showing time"},
            {"word": "sock", "query": "colourful striped knitted socks"},
            {"word": "backpack", "query": "school backpack on floor"},
        ])
    ]),
    _b(2, 4, 1, "Sound Book: e", [
        _s("e", "Say the sound: e. Short and open. e-e-e!", [
            {"word": "elephant", "query": "elephant in savannah"},
            {"word": "egg", "query": "egg in nest"},
            {"word": "engine", "query": "steam engine on tracks"},
            {"word": "envelope", "query": "white envelope on table"},
            {"word": "eagle", "query": "bald eagle flying"},
            {"word": "escalator", "query": "escalator in shopping mall"},
        ])
    ]),
    _b(2, 5, 1, "Sound Book: u", [
        _s("u", "Say the sound: u. Open mouth, short. u-u-u!", [
            {"word": "umbrella", "query": "red umbrella in rain"},
            {"word": "unicorn", "query": "unicorn toy"},
            {"word": "urn", "query": "decorative urn on shelf"},
            {"word": "uniform", "query": "school uniform on hanger"},
            {"word": "ukulele", "query": "ukulele on table"},
            {"word": "utensil", "query": "kitchen utensils on counter"},
        ])
    ]),
    _b(2, 6, 1, "Sound Book: r", [
        _s("r", "Say the sound: r. Tongue back, voiced. rrrr!", [
            {"word": "rabbit", "query": "white rabbit in field"},
            {"word": "rainbow", "query": "rainbow in sky"},
            {"word": "robot", "query": "toy robot on floor"},
            {"word": "rocket", "query": "space rocket launch"},
            {"word": "rose", "query": "red rose in garden"},
            {"word": "ruler", "query": "wooden ruler on desk"},
        ])
    ]),
    _b(2, 7, 1, "Sound Book: h", [
        _s("h", "Say the sound: h. A puff of air. h-h-h!", [
            {"word": "hat", "query": "straw hat on beach"},
            {"word": "horse", "query": "brown horse in field"},
            {"word": "helicopter", "query": "helicopter flying in sky"},
            {"word": "house", "query": "cottage house in countryside"},
            {"word": "hedgehog", "query": "hedgehog in garden"},
            {"word": "hammer", "query": "hammer on workbench"},
        ])
    ]),
    _b(2, 8, 1, "Sound Book: b", [
        _s("b", "Say the sound: b. Lips together, then pop. b-b-b!", [
            {"word": "ball", "query": "football on grass"},
            {"word": "butterfly", "query": "monarch butterfly on flower"},
            {"word": "banana", "query": "bunch of bananas"},
            {"word": "boat", "query": "sailboat on lake"},
            {"word": "bear", "query": "brown bear in forest"},
            {"word": "book", "query": "open book on table"},
        ])
    ]),
    _b(2, 9, 1, "Sound Book: f", [
        _s("f", "Say the sound: f. Top teeth on bottom lip. ffff!", [
            {"word": "fish", "query": "goldfish in aquarium"},
            {"word": "frog", "query": "green frog on lily pad"},
            {"word": "flower", "query": "sunflower in field"},
            {"word": "fire", "query": "campfire at night"},
            {"word": "feather", "query": "peacock feather on ground"},
            {"word": "flag", "query": "British flag waving"},
        ])
    ]),
    _b(2, 10, 1, "Sound Book: l", [
        _s("l", "Say the sound: l. Tongue at the top, voiced. llll!", [
            {"word": "lion", "query": "lion in savannah"},
            {"word": "lamp", "query": "table lamp with light on"},
            {"word": "lemon", "query": "lemon on tree"},
            {"word": "ladder", "query": "wooden ladder against wall"},
            {"word": "leaf", "query": "maple leaf on ground"},
            {"word": "lighthouse", "query": "lighthouse on cliff"},
        ])
    ]),
    _b(2, 11, 1, "Sound Book: ff + ll", [
        _s("ff", "Say the sound: ff. Double letter — two f's make one sound. ff!", [
            {"word": "cliff", "query": "cliff by the sea"},
            {"word": "puff", "query": "steam puff from train"},
            {"word": "scarf", "query": "wool scarf on hanger"},
            {"word": "muffin", "query": "blueberry muffin on plate"},
            {"word": "waffle", "query": "single waffle with syrup"},
            {"word": "fluff", "query": "fluffy white cotton on white background"},
        ]),
        _s("ll", "Say the sound: ll. Double letter — two l's make one sound. ll!", [
            {"word": "bell", "query": "church bell in tower"},
            {"word": "shell", "query": "seashell on beach"},
            {"word": "doll", "query": "rag doll on bed"},
            {"word": "jellyfish", "query": "single jellyfish in ocean"},
            {"word": "gorilla", "query": "silverback gorilla close-up"},
            {"word": "mill", "query": "old windmill in countryside"},
        ])
    ]),
    _b(2, 12, 1, "Sound Book: ss + zz", [
        _s("ss", "Say the sound: ss. Double letter — two s's, same as a single s. ssss!", [
            {"word": "glass", "query": "glass of water"},
            {"word": "dress", "query": "summer dress on hanger"},
            {"word": "compass", "query": "compass on map"},
            {"word": "grass", "query": "green grass field close-up"},
            {"word": "princess", "query": "princess in pink dress"},
            {"word": "walrus", "query": "walrus on ice"},
        ]),
        _s("zz", "Say the sound: zz. Double letter — two z's. zzzz!", [
            {"word": "buzz", "query": "bee buzzing on flower"},
            {"word": "fizz", "query": "fizzy drink bubbling"},
            {"word": "jazz", "query": "jazz band playing"},
            {"word": "puzzle", "query": "jigsaw puzzle assembled"},
            {"word": "blizzard", "query": "snow blizzard storm"},
            {"word": "muzzle", "query": "horse muzzle close-up"},
        ])
    ]),
    _b(2, 13, 1, "Sound Book: j", [
        _s("j", "Say the sound: j. Voiced, like at the start of jam. j-j-j!", [
            {"word": "jelly", "query": "strawberry jelly on plate"},
            {"word": "jacket", "query": "denim jacket on hanger"},
            {"word": "jungle", "query": "dense jungle with trees"},
            {"word": "jigsaw", "query": "jigsaw puzzle pieces"},
            {"word": "juice", "query": "orange juice in glass"},
            {"word": "jeep", "query": "jeep on safari"},
        ])
    ]),
    _b(2, 14, 1, "Sound Book: v + w", [
        _s("v", "Say the sound: v. Top teeth on bottom lip, voiced — like f but louder. vvv!", [
            {"word": "violin", "query": "violin on music stand"},
            {"word": "vase", "query": "flower vase on table"},
            {"word": "volcano", "query": "erupting volcano"},
            {"word": "van", "query": "delivery van on road"},
            {"word": "vest", "query": "wool vest on hanger"},
            {"word": "vine", "query": "grape vine with leaves"},
        ]),
        _s("w", "Say the sound: w. Round your lips. wwww!", [
            {"word": "window", "query": "open window with curtains"},
            {"word": "wagon", "query": "wooden wagon in field"},
            {"word": "watermelon", "query": "watermelon slice"},
            {"word": "worm", "query": "earthworm on soil"},
            {"word": "walnut", "query": "single walnut close-up"},
            {"word": "wig", "query": "blonde wig on stand"},
        ])
    ]),
    _b(2, 15, 1, "Sound Book: x + y + z", [
        _s("x", "Say the sound: x. Two sounds blended — ks. x-x-x!", [
            {"word": "xylophone", "query": "colourful xylophone on floor"},
            {"word": "box", "query": "cardboard box on floor"},
            {"word": "fox", "query": "red fox in forest"},
            {"word": "taxi", "query": "yellow taxi cab on street"},
            {"word": "axe", "query": "axe in tree stump"},
            {"word": "six", "query": "number six on door"},
        ]),
        _s("y", "Say the sound: y. Tongue up, voiced. y-y-y!", [
            {"word": "yacht", "query": "sailing yacht on sea"},
            {"word": "yogurt", "query": "strawberry yogurt in bowl"},
            {"word": "yak", "query": "tibetan yak in mountains"},
            {"word": "yoyo", "query": "wooden yo-yo toy"},
            {"word": "yarn", "query": "ball of colourful yarn"},
            {"word": "yam", "query": "sweet potato yam on table"},
        ]),
        _s("z", "Say the sound: z. Same as ss but louder. zzz!", [
            {"word": "zebra", "query": "zebra in savannah"},
            {"word": "zip", "query": "zip on jacket"},
            {"word": "zoo", "query": "zoo entrance sign"},
            {"word": "zero", "query": "number zero on door"},
            {"word": "zucchini", "query": "green zucchini courgette"},
            {"word": "zipper", "query": "metal zipper close-up"},
        ])
    ]),
    _b(3, 1, 1, "Sound Book: sh", [
        _s("sh", "Say the sound: sh. Lips pushed forward, quiet sound. shhhh!", [
            {"word": "shark", "query": "great white shark"},
            {"word": "sheep", "query": "fluffy sheep field"},
            {"word": "shell", "query": "seashell on sand"},
            {"word": "shoe", "query": "red shoe on floor"},
            {"word": "ship", "query": "cargo ship at sea"},
            {"word": "shovel", "query": "garden shovel in soil"},
        ])
    ]),
    _b(3, 2, 1, "Sound Book: nk", [
        _s("nk", "Say the sound: nk. Back of the throat, two sounds blended. nk!", [
            {"word": "tank", "query": "military tank on field"},
            {"word": "bank", "query": "river bank with trees"},
            {"word": "sink", "query": "kitchen sink with dishes"},
            {"word": "pink", "query": "pink flower in garden"},
            {"word": "trunk", "query": "elephant trunk close-up"},
            {"word": "drink", "query": "cold drink with ice"},
        ])
    ]),
    _b(3, 3, 1, "Sound Book: ch", [
        _s("ch", "Say the sound: ch. Like a train chugging. ch-ch-ch!", [
            {"word": "chicken", "query": "chicken on farm"},
            {"word": "chair", "query": "wooden chair at table"},
            {"word": "cheese", "query": "cheddar cheese block"},
            {"word": "chimpanzee", "query": "chimpanzee in zoo"},
            {"word": "cherry", "query": "cherry on tree"},
            {"word": "chain", "query": "metal chain on ground"},
        ])
    ]),
    _b(3, 4, 1, "Sound Book: th", [
        _s("th", "Say the sound: th. Tongue between teeth, then breathe. th!", [
            {"word": "thumb", "query": "thumbs up gesture"},
            {"word": "thunder", "query": "thunderstorm with lightning"},
            {"word": "throne", "query": "royal throne in palace"},
            {"word": "tooth", "query": "toothbrush with toothpaste"},
            {"word": "thermometer", "query": "thermometer showing temperature"},
            {"word": "thorn", "query": "rose thorn close-up"},
        ])
    ]),
    _b(3, 5, 1, "Sound Book: ng", [
        _s("ng", "Say the sound: ng. Back of the throat, hum. ng!", [
            {"word": "king", "query": "king with crown"},
            {"word": "ring", "query": "gold ring on finger"},
            {"word": "wing", "query": "bird wing in flight"},
            {"word": "song", "query": "bird singing on branch"},
            {"word": "spring", "query": "spring flowers blooming"},
            {"word": "swing", "query": "swing in playground"},
        ])
    ]),
    _b(3, 6, 1, "Sound Book: qu", [
        _s("qu", "Say the sound: qu. Two letters that always go together — k+w. qu!", [
            {"word": "queen", "query": "queen with crown"},
            {"word": "quilt", "query": "colourful quilt on bed"},
            {"word": "quail", "query": "quail in field"},
            {"word": "quarter", "query": "quarter coin on table"},
            {"word": "quiver", "query": "archery quiver with arrows"},
            {"word": "quest", "query": "knight on quest"},
        ])
    ]),
    _b(4, 1, 1, "Sound Book: ay", [
        _s("ay", "Say the sound: ay. Long a — like in 'day'. ay!", [
            {"word": "play", "query": "children playing in park"},
            {"word": "tray", "query": "serving tray with food"},
            {"word": "clay", "query": "hands shaping clay"},
            {"word": "ray", "query": "sun rays through clouds"},
            {"word": "bay", "query": "bay with boats"},
            {"word": "hay", "query": "hay bales in field"},
        ])
    ]),
    _b(4, 2, 1, "Sound Book: ee", [
        _s("ee", "Say the sound: ee. Long e — like in 'see'. ee!", [
            {"word": "tree", "query": "oak tree in forest"},
            {"word": "bee", "query": "bee on flower"},
            {"word": "sheep", "query": "fluffy sheep in field"},
            {"word": "wheel", "query": "bicycle wheel spinning"},
            {"word": "cheese", "query": "cheddar cheese block"},
            {"word": "feet", "query": "child's feet in sand"},
        ])
    ]),
    _b(4, 3, 1, "Sound Book: igh", [
        _s("igh", "Say the sound: igh. Three letters, one sound — long i. igh!", [
            {"word": "light", "query": "lamp light in dark room"},
            {"word": "night", "query": "starry night sky"},
            {"word": "sight", "query": "binoculars for sight"},
            {"word": "fright", "query": "child with fright expression"},
            {"word": "flight", "query": "airplane in flight"},
            {"word": "bright", "query": "bright sun in sky"},
        ])
    ]),
    _b(4, 4, 1, "Sound Book: ow", [
        _s("ow", "Say the sound: ow. Long o — like in 'blow'. ow!", [
            {"word": "snow", "query": "snow on mountain"},
            {"word": "bow", "query": "gift bow on present"},
            {"word": "crow", "query": "crow on branch"},
            {"word": "window", "query": "open window with curtains"},
            {"word": "shadow", "query": "tree shadow on ground"},
            {"word": "yellow", "query": "yellow flower in garden"},
        ])
    ]),
    _b(4, 5, 1, "Sound Book: oo (long)", [
        _s("oo", "Say the sound: oo. Long oo — like in 'zoo'. oooo!", [
            {"word": "moon", "query": "full moon in night sky"},
            {"word": "spoon", "query": "silver spoon on table"},
            {"word": "balloon", "query": "red balloon in sky"},
            {"word": "bamboo", "query": "bamboo forest"},
            {"word": "kangaroo", "query": "kangaroo in outback"},
            {"word": "noodle", "query": "bowl of noodles"},
        ])
    ]),
    _b(4, 6, 1, "Sound Book: oo (short)", [
        _s("oo", "Say the sound: oo. Short oo — like in 'look'. oo!", [
            {"word": "book", "query": "open book on table"},
            {"word": "foot", "query": "child's foot in sand"},
            {"word": "wood", "query": "stack of firewood"},
            {"word": "wool", "query": "ball of wool yarn"},
            {"word": "hook", "query": "fishing hook on line"},
            {"word": "cook", "query": "chef cooking in kitchen"},
        ])
    ]),
    _b(4, 7, 1, "Sound Book: ar", [
        _s("ar", "Say the sound: ar. Open your mouth wide. arrr!", [
            {"word": "car", "query": "red car on road"},
            {"word": "star", "query": "gold star ornament decoration"},
            {"word": "jar", "query": "glass jar with lid"},
            {"word": "guitar", "query": "acoustic guitar on stand"},
            {"word": "shark", "query": "great white shark"},
            {"word": "park", "query": "children playing in park"},
        ])
    ]),
    _b(4, 8, 1, "Sound Book: or", [
        _s("or", "Say the sound: or. Round your lips. orrr!", [
            {"word": "fork", "query": "silver fork on table"},
            {"word": "corn", "query": "corn on the cob"},
            {"word": "storm", "query": "thunderstorm with lightning"},
            {"word": "horse", "query": "brown horse in field"},
            {"word": "door", "query": "wooden door in house"},
            {"word": "floor", "query": "wooden floor in room"},
        ])
    ]),
    _b(4, 9, 1, "Sound Book: air", [
        _s("air", "Say the sound: air. Three letters, one sound. air!", [
            {"word": "chair", "query": "wooden chair at table"},
            {"word": "fair", "query": "funfair with rides"},
            {"word": "hair", "query": "child's hair being brushed"},
            {"word": "pair", "query": "pair of shoes"},
            {"word": "stair", "query": "wooden staircase"},
            {"word": "bear", "query": "brown bear in forest"},
        ])
    ]),
    _b(4, 10, 1, "Sound Book: ir", [
        _s("ir", "Say the sound: ir. Like 'er' — same sound, different spelling. ir!", [
            {"word": "bird", "query": "sparrow bird on branch"},
            {"word": "shirt", "query": "striped shirt on hanger"},
            {"word": "skirt", "query": "denim skirt on hanger"},
            {"word": "dirt", "query": "dirt path in forest"},
            {"word": "stir", "query": "spoon stirring in cup"},
            {"word": "first", "query": "first place trophy"},
        ])
    ]),
    _b(4, 11, 1, "Sound Book: ou", [
        _s("ou", "Say the sound: ou. Like 'ow' in 'cow'. ou!", [
            {"word": "house", "query": "cottage house in countryside"},
            {"word": "mouse", "query": "mouse on desk"},
            {"word": "cloud", "query": "fluffy cloud in sky"},
            {"word": "shout", "query": "child shouting outdoors"},
            {"word": "couch", "query": "sofa couch in living room"},
            {"word": "mouth", "query": "child's mouth smiling"},
        ])
    ]),
    _b(4, 12, 1, "Sound Book: oy", [
        _s("oy", "Say the sound: oy. Round your lips, then smile. oy!", [
            {"word": "toy", "query": "toy car on floor"},
            {"word": "boy", "query": "boy playing in park"},
            {"word": "enjoy", "query": "child enjoying ice cream"},
            {"word": "employ", "query": "employ sign in window"},
            {"word": "destroy", "query": "building being destroyed"},
            {"word": "annoy", "query": "child looking annoyed"},
        ])
    ]),
    _b(5, 1, 1, "Sound Book: a-e", [
        _s("a-e", "Say the sound: a-e. Split digraph — silent e at the end makes the a say its name. a-e!", [
            {"word": "cake", "query": "birthday cake with candles"},
            {"word": "snake", "query": "green snake on grass"},
            {"word": "plane", "query": "airplane in flight"},
            {"word": "grape", "query": "bunch of grapes on vine"},
            {"word": "gate", "query": "wooden gate in garden"},
            {"word": "lake", "query": "serene lake with reflection"},
        ])
    ], comparison=["ay", "ai"]),
    _b(5, 2, 1, "Sound Book: i-e", [
        _s("i-e", "Say the sound: i-e. Split digraph — silent e makes the i say its name. i-e!", [
            {"word": "kite", "query": "colourful kite in sky"},
            {"word": "bike", "query": "child's bike on path"},
            {"word": "slide", "query": "playground slide with children"},
            {"word": "smile", "query": "child's smile close-up"},
            {"word": "pine", "query": "pine tree in forest"},
            {"word": "five", "query": "number five on dice"},
        ])
    ], comparison=["igh", "ie"]),
    _b(5, 3, 1, "Sound Book: o-e", [
        _s("o-e", "Say the sound: o-e. Split digraph — silent e makes the o say its name. o-e!", [
            {"word": "bone", "query": "dog bone on grass"},
            {"word": "stone", "query": "smooth stone on beach"},
            {"word": "home", "query": "brick home with garden"},
            {"word": "nose", "query": "child's nose close-up"},
            {"word": "rope", "query": "coiled rope on dock"},
            {"word": "globe", "query": "world globe on desk"},
        ])
    ], comparison=["ow", "oa"]),
    _b(5, 4, 1, "Sound Book: u-e", [
        _s("u-e", "Say the sound: u-e. Split digraph — silent e makes the u say its name. u-e!", [
            {"word": "cube", "query": "ice cube melting"},
            {"word": "flute", "query": "silver flute on stand"},
            {"word": "tube", "query": "toothpaste tube on sink"},
            {"word": "mule", "query": "mule in field"},
            {"word": "rude", "query": "child making rude face"},
            {"word": "tune", "query": "guitar being tuned"},
        ])
    ], comparison=["oo", "ue", "ew"]),
    _b(5, 5, 1, "Sound Book: ea", [
        _s("ea", "Say the sound: ea. Long e — like in 'sea'. ea!", [
            {"word": "leaf", "query": "maple leaf on ground"},
            {"word": "beach", "query": "sandy beach with waves"},
            {"word": "peach", "query": "ripe peach on tree"},
            {"word": "seal", "query": "seal on rock"},
            {"word": "bread", "query": "loaf of bread on board"},
            {"word": "eagle", "query": "bald eagle flying"},
        ])
    ], comparison=["ee"]),
    _b(5, 6, 1, "Sound Book: ie", [
        _s("ie", "Say the sound: ie. Long i — like in 'pie'. ie!", [
            {"word": "pie", "query": "apple pie on plate"},
            {"word": "tie", "query": "necktie on shirt"},
            {"word": "field", "query": "wheat field in summer"},
            {"word": "chief", "query": "fire chief in uniform"},
            {"word": "thief", "query": "thief sneaking in alley"},
            {"word": "brief", "query": "briefcase on desk"},
        ])
    ], comparison=["igh", "i-e"]),
    _b(5, 7, 1, "Sound Book: oi", [
        _s("oi", "Say the sound: oi. Like 'oy' — same sound, different spelling. oi!", [
            {"word": "coin", "query": "gold coin on table"},
            {"word": "boil", "query": "water boiling in pot"},
            {"word": "soil", "query": "soil in garden"},
            {"word": "point", "query": "finger pointing"},
            {"word": "noise", "query": "child covering ears from noise"},
            {"word": "spoil", "query": "spoiled fruit on ground"},
        ])
    ], comparison=["oy"]),
    _b(5, 8, 1, "Sound Book: aw", [
        _s("aw", "Say the sound: aw. Like 'or' — same sound, different spelling. aw!", [
            {"word": "saw", "query": "hand saw on workbench"},
            {"word": "claw", "query": "cat's claw close-up"},
            {"word": "straw", "query": "straw in drink"},
            {"word": "paw", "query": "dog's paw on grass"},
            {"word": "jaw", "query": "shark's jaw open"},
            {"word": "draw", "query": "child drawing with crayons"},
        ])
    ], comparison=["or"]),
    _b(5, 9, 1, "Sound Book: ai", [
        _s("ai", "Say the sound: ai. Long a — like in 'rain'. ai!", [
            {"word": "rain", "query": "rain falling on window"},
            {"word": "train", "query": "steam train on tracks"},
            {"word": "paint", "query": "paintbrush with paint"},
            {"word": "snail", "query": "snail on leaf"},
            {"word": "chain", "query": "metal chain on ground"},
            {"word": "mail", "query": "mailbox with letters"},
        ])
    ], comparison=["ay", "a-e"]),
    _b(5, 10, 1, "Sound Book: oa", [
        _s("oa", "Say the sound: oa. Long o — like in 'boat'. oa!", [
            {"word": "boat", "query": "sailboat on lake"},
            {"word": "goat", "query": "goat on farm"},
            {"word": "coat", "query": "winter coat on hanger"},
            {"word": "road", "query": "winding road through forest"},
            {"word": "loaf", "query": "loaf of bread on board"},
            {"word": "toad", "query": "toad on lily pad"},
        ])
    ], comparison=["ow", "o-e"]),
    _b(6, 1, 1, "Sound Book: ur", [
        _s("ur", "Say the sound: ur. Same as ir and er — three ways to spell the same sound. ur!", [
            {"word": "fur", "query": "cat's fur close-up"},
            {"word": "nurse", "query": "nurse in hospital"},
            {"word": "purse", "query": "leather purse on table"},
            {"word": "burn", "query": "campfire burning"},
            {"word": "church", "query": "stone church with steeple"},
            {"word": "surf", "query": "surfer riding wave"},
        ])
    ], comparison=["ir", "er"]),
    _b(6, 2, 1, "Sound Book: er", [
        _s("er", "Say the sound: er. Same as ir and ur. er!", [
            {"word": "flower", "query": "sunflower in field"},
            {"word": "butter", "query": "butter on bread"},
            {"word": "river", "query": "river flowing through forest"},
            {"word": "hammer", "query": "hammer on workbench"},
            {"word": "paper", "query": "stack of paper on desk"},
            {"word": "tiger", "query": "bengal tiger in jungle"},
        ])
    ], comparison=["ir", "ur"]),
    _b(6, 3, 1, "Sound Book: are", [
        _s("are", "Say the sound: are. Like 'air' — same sound, different spelling. are!", [
            {"word": "care", "query": "child being cared for"},
            {"word": "hare", "query": "hare in field"},
            {"word": "scare", "query": "child with scared expression"},
            {"word": "share", "query": "children sharing toys"},
            {"word": "flare", "query": "flare in night sky"},
            {"word": "stare", "query": "child staring at screen"},
        ])
    ], comparison=["air"]),
    _b(6, 4, 1, "Sound Book: ow", [
        _s("ow", "Say the sound: ow. Like 'ou' in 'out' — same sound. ow!", [
            {"word": "cow", "query": "cow in field"},
            {"word": "owl", "query": "barn owl perched"},
            {"word": "towel", "query": "towel on rack"},
            {"word": "frown", "query": "child with frown"},
            {"word": "crown", "query": "gold crown with jewels"},
            {"word": "howl", "query": "wolf howling at moon"},
        ])
    ], comparison=["ou"]),
    _b(6, 5, 1, "Sound Book: ew + ue", [
        _s("ew", "Say the sound: ew. Like 'oo' in 'zoo'. ew!", [
            {"word": "stew", "query": "bowl of stew on table"},
            {"word": "chew", "query": "child chewing food"},
            {"word": "new", "query": "new shoes in box"},
            {"word": "screw", "query": "single metal screw close-up"},
            {"word": "jewel", "query": "sparkling jewel ring"},
            {"word": "dew", "query": "morning dew drops on grass"},
        ]),
        _s("ue", "Say the sound: ue. Like 'oo' in 'zoo'. ue!", [
            {"word": "blue", "query": "blue sky with clouds"},
            {"word": "glue", "query": "bottle of glue on desk"},
            {"word": "rescue", "query": "rescue boat in action"},
            {"word": "barbecue", "query": "barbecue grill with food"},
            {"word": "statue", "query": "stone statue in park"},
            {"word": "tissue", "query": "box of tissues on table"},
        ])
    ], comparison=["oo", "u-e"]),
    _b(6, 6, 1, "Sound Book: wr + kn", [
        _s("wr", "Say the sound: wr. The w is silent — only the r is heard. wr!", [
            {"word": "wrist", "query": "wristwatch on wrist"},
            {"word": "write", "query": "child writing with pencil"},
            {"word": "wrap", "query": "gift being wrapped"},
            {"word": "wreath", "query": "christmas wreath on door"},
            {"word": "wren", "query": "small wren bird perched"},
            {"word": "wrench", "query": "metal wrench tool"},
        ]),
        _s("kn", "Say the sound: kn. The k is silent — only the n is heard. kn!", [
            {"word": "knee", "query": "child's knee close-up"},
            {"word": "knife", "query": "kitchen knife on board"},
            {"word": "knight", "query": "medieval knight in armour"},
            {"word": "knot", "query": "rope tied in knot"},
            {"word": "knob", "query": "brass door knob close-up"},
            {"word": "knuckle", "query": "human knuckle close-up"},
        ])
    ], comparison=["r", "n"]),
    _b(6, 7, 1, "Sound Book: ge + dge", [
        _s("ge", "Say the sound: ge. Like j — same sound, different spelling. ge!", [
            {"word": "cage", "query": "bird in cage"},
            {"word": "stage", "query": "theatre stage with curtains"},
            {"word": "page", "query": "open book page close-up"},
            {"word": "garage", "query": "garage with cars"},
            {"word": "sponge", "query": "kitchen sponge close-up"},
            {"word": "hinge", "query": "metal door hinge close-up"},
        ]),
        _s("dge", "Say the sound: dge. Three letters, one sound — like j. dge!", [
            {"word": "bridge", "query": "stone bridge over river"},
            {"word": "hedge", "query": "trimmed hedge in garden"},
            {"word": "badge", "query": "police badge on uniform"},
            {"word": "fridge", "query": "kitchen fridge with magnets"},
            {"word": "wedge", "query": "wedge of cheese on board"},
            {"word": "fudge", "query": "chocolate fudge squares"},
        ])
    ], comparison=["j"]),
    _b(6, 8, 1, "Sound Book: mb + gn", [
        _s("mb", "Say the sound: mb. The b is silent — only the m is heard. mb!", [
            {"word": "thumb", "query": "thumbs up gesture"},
            {"word": "lamb", "query": "lamb in field"},
            {"word": "comb", "query": "hair comb on table"},
            {"word": "crumb", "query": "bread crumb close-up"},
            {"word": "climb", "query": "child climbing rocks"},
            {"word": "plumber", "query": "plumber fixing pipe"},
        ]),
        _s("gn", "Say the sound: gn. The g is silent — only the n is heard. gn!", [
            {"word": "gnome", "query": "garden gnome with hat"},
            {"word": "gnat", "query": "gnat on leaf"},
            {"word": "sign", "query": "stop sign on street"},
            {"word": "gnu", "query": "gnu wildebeest in africa"},
            {"word": "gnocchi", "query": "plate of gnocchi pasta"},
            {"word": "signpost", "query": "wooden signpost on trail"},
        ])
    ], comparison=["m", "n"]),
    _b(6, 9, 1, "Sound Book: ph + wh", [
        _s("ph", "Say the sound: ph. Two letters, one sound — like f. ph!", [
            {"word": "phone", "query": "smartphone on desk"},
            {"word": "photo", "query": "photo album on table"},
            {"word": "elephant", "query": "elephant in savannah"},
            {"word": "graph", "query": "bar graph on paper"},
            {"word": "alphabet", "query": "alphabet wooden blocks"},
            {"word": "trophy", "query": "gold trophy cup on shelf"},
        ]),
        _s("wh", "Say the sound: wh. The h is silent — only the w is heard. wh!", [
            {"word": "whale", "query": "blue whale in ocean"},
            {"word": "wheel", "query": "bicycle wheel spinning"},
            {"word": "whisper", "query": "child whispering in ear"},
            {"word": "whisker", "query": "cat whiskers close-up"},
            {"word": "wheat", "query": "wheat field at sunset"},
            {"word": "whisk", "query": "metal whisk in bowl"},
        ])
    ], comparison=["f", "w"]),
    _b(7, 1, 1, "Sound Book: ire", [
        _s("ire", "Say the sound: ire. Three letters, one sound — long i + er. ire!", [
            {"word": "fire", "query": "campfire at night"},
            {"word": "tire", "query": "car tire on road"},
            {"word": "wire", "query": "copper wire coil"},
            {"word": "hire", "query": "hire sign in window"},
            {"word": "spire", "query": "church spire against sky"},
            {"word": "inspire", "query": "teacher inspiring students"},
        ])
    ], comparison=["i-e", "igh"]),
    _b(7, 2, 1, "Sound Book: ore", [
        _s("ore", "Say the sound: ore. Like 'or' — same sound, different spelling. ore!", [
            {"word": "shore", "query": "sandy shore with waves"},
            {"word": "store", "query": "grocery store entrance"},
            {"word": "bore", "query": "child looking bored"},
            {"word": "core", "query": "apple core on table"},
            {"word": "more", "query": "child asking for more"},
            {"word": "explore", "query": "child exploring forest"},
        ])
    ], comparison=["or", "aw", "oor"]),
    _b(7, 3, 1, "Sound Book: ear", [
        _s("ear", "Say the sound: ear. Three letters, one sound — like 'eer'. ear!", [
            {"word": "gear", "query": "cog gear on machine"},
            {"word": "hear", "query": "child listening with headphones"},
            {"word": "near", "query": "child near playground"},
            {"word": "year", "query": "calendar year"},
            {"word": "dear", "query": "handwritten letter dear"},
            {"word": "clear", "query": "clear glass water"},
        ])
    ], comparison=["ee", "ea"]),
    _b(7, 4, 1, "Sound Book: oor", [
        _s("oor", "Say the sound: oor. Like 'or' — same sound, different spelling. oor!", [
            {"word": "door", "query": "wooden door in house"},
            {"word": "floor", "query": "wooden floor in room"},
            {"word": "poor", "query": "child with sad expression"},
            {"word": "moor", "query": "heather moorland landscape"},
            {"word": "boor", "query": "boorish behaviour at table"},
            {"word": "outdoor", "query": "outdoor picnic setup"},
        ])
    ], comparison=["or", "ore"]),
    _b(7, 5, 1, "Sound Book: ure", [
        _s("ure", "Say the sound: ure. Three letters, one sound. ure!", [
            {"word": "picture", "query": "family picture on wall"},
            {"word": "nature", "query": "nature scene with trees"},
            {"word": "future", "query": "child looking at future"},
            {"word": "cure", "query": "medicine bottle with cure"},
            {"word": "adventure", "query": "child on adventure trail"},
            {"word": "capture", "query": "photographer capturing moment"},
        ])
    ], comparison=["oo"]),
    _b(7, 6, 1, "Sound Book: tion", [
        _s("tion", "Say the sound: tion. Four letters, one sound — like 'shun'. tion!", [
            {"word": "station", "query": "train station platform"},
            {"word": "action", "query": "child in action pose"},
            {"word": "caution", "query": "caution sign on road"},
            {"word": "nation", "query": "flags of different nations"},
            {"word": "vacation", "query": "family on vacation at beach"},
            {"word": "education", "query": "classroom education scene"},
        ])
    ]),
    # Combined suffix books — these abstract spelling patterns share the same
    # job and have few image-able words, so they're grouped. 3-sound book = 9
    # examples (3 each); 2-sound book = 8 examples (4 each). Cover photos come
    # from the image-able query hints (cake, salad, jewellery, rainbow…).
    _b(8, 1, 1, "Sound Book: -ous, -cious & -tious", [
        _s("ous", "Say the sound: ous. Ending found on adjectives — 'full of'. ous!", [
            {"word": "famous", "query": "famous landmark"},
            {"word": "dangerous", "query": "dangerous cliff edge"},
            {"word": "fabulous", "query": "fabulous fireworks display"},
        ]),
        _s("cious", "Say the sound: cious. Spelt c-i-o-u-s, sounds like 'shus'. cious!", [
            {"word": "delicious", "query": "delicious cake on plate"},
            {"word": "precious", "query": "precious gem in hand"},
            {"word": "spacious", "query": "spacious living room"},
        ]),
        _s("tious", "Say the sound: tious. Spelt t-i-o-u-s, sounds like 'shus'. tious!", [
            {"word": "nutritious", "query": "nutritious salad on plate"},
            {"word": "scrumptious", "query": "scrumptious chocolate cupcakes"},
            {"word": "cautious", "query": "cautious child crossing street"},
        ]),
    ]),
    _b(8, 2, 1, "Sound Book: -able & -ible", [
        _s("able", "Say the sound: able. Ending — means 'can be'. able!", [
            {"word": "comfortable", "query": "comfortable sofa in living room"},
            {"word": "reliable", "query": "reliable car on road"},
            {"word": "valuable", "query": "valuable jewellery in box"},
            {"word": "enjoyable", "query": "enjoyable picnic in park"},
        ]),
        _s("ible", "Say the sound: ible. Ending — also means 'can be'. ible!", [
            {"word": "visible", "query": "visible rainbow in sky"},
            {"word": "edible", "query": "edible mushrooms in basket"},
            {"word": "flexible", "query": "flexible gymnast performing"},
            {"word": "incredible", "query": "incredible fireworks display"},
        ]),
    ]),
]

if __name__ == "__main__":
    print(f"Total Sound Books: {len(INVENTORY)}")
    by_level = {}
    for b in INVENTORY:
        by_level.setdefault(b["level"], []).append(b["title"])
    for lv in sorted(by_level):
        print(f"  L{lv}: {len(by_level[lv])} books")
