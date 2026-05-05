"""
Near the Door — Level 5.2 Story
Focus sounds: ear, oor
Setting: Snowy Nordic woods (winter) — outdoor journey/discovery story
Cultural approach: Visual texture only — modern Scandinavian log cabin and
snowy pine forest shown in images, universal story about finding three animals
in the snow.

REWRITTEN 2026-05-05 — image-driven pivot rewrite. Original (2026-04-16)
text described the child indoors hearing a crunch and finding a fox at the
door. Rendered images show an outdoor journey through three animals (fox,
rabbit, deer) before returning to Dad at the cabin door. Text re-aligned
to the rendered reality. -ed past tense forms reintroduced where natural
(L5 cumulative graphemes include -ed).

Story structure: Outdoor journey, three animal encounters
- Page 1: Child hears a crunch at the door (cabin interior, dressed for snow)
- Page 2: Steps out into the woods, glimpses a red tail
- Page 3: Reveal — a red fox in the soft snow
- Page 4: Soft tap near a stream, two long ears poke up over a rock
- Page 5: Reveal — a rabbit leaps clear over the water
- Page 6: Two dark points on a snow mound — log? or deer?
- Page 7: Reveal — a tall deer with antlers steps out
- Page 8: Returns to Dad at the cabin door, recounts the journey

Each page a different forest location → minimises AI background-consistency
burden (per memory: journey/location-change stories preferred at all levels).

Phonics validation: ALL words verified decodable at L5 cumulative level
or are cumulative tricky words. Avoided per critique: heard (irregular ear
for /ɜːr/ — used as tricky once on p1 only, the pre-existing usage carries
forward), open (single o saying /oe/), come/comes/been/have/friends
(non-decodable bases), little (final -le), by (y for /igh/ not taught),
boar (oar not taught), bare (a-e split with intervening r).

Focus 'ear' words: near (x10), ear/ears (x6), hear/hear (x3), dear (x4),
clear (x3), fear (x3)
Focus 'oor' words: door (x4), floor (x1), indoors (x1)

-ed past tense words: stepped, peeked, swayed, popped, looked (x4), sniffed,
trotted, stuck, kept, sprang (irreg), called, landed, spotted, poked,
waited, dusted

Image feasibility: PASS — every page a different location, hero (Astrid)
is the only visual consistency burden. Each animal appears only on its
clue + reveal pages. Dad only on pages 1 and 8 (bookends).
"""

NEAR_THE_DOOR_STORY_BOOK1 = {
    "L5_2_B1": {
        "level": 5,
        "sub_level": 2,
        "book_number": 1,
        "book_title": "Near the Door",
        "level_name": "Reading Together",
        "level_colour": "#8B5CF6",
        "font_size": 16,
        "focus_graphemes": ["ear", "oor"],
        "all_level_graphemes": ["ore", "oor", "ire", "ear", "ure", "tion"],
        "story_pages": [
            {
                "page_number": 1,
                "text": "Dad sat at the fire in his thick wool socks. I stood near the door with my coat and hat. It was cool outside, and I could hear a soft crunch. I put my ear to the door and heard it again. What could it be out there in the snow?",
                "perspective": "GIRL",
                "image_prompt": "Interior of a cosy Scandinavian log cabin, warm morning light. Astrid (Swedish girl, 5 years old, light skin with rosy cheeks (#F0D0B0), long blonde hair (#D4B87A) in two braids, tiny solid black dot eyes) stands near an open wooden front door, fully dressed for the snow: red hand-knitted wool jumper under a thick dark blue knee-length winter coat, cream wool hat with Nordic snowflake pattern, red wool scarf, dark blue mittens, brown leather winter boots. She has her ear tilted toward the door, listening intently, head slightly cocked. In the background, Dad (Swedish man, light skin, short brown hair (#5C3D2E), slight stubble, grey wool sweater with subtle Nordic pattern at the neckline, dark trousers, thick wool socks) sits in a wooden armchair at a wood-burning stove with warm orange firelight glowing. Wooden floors, sheepskin rug, minimalist Scandinavian decor. Through the partly open doorway: a glimpse of snowy pine trees. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 2,
                "text": "I pulled the door wide and stepped out into the woods. It was still cool, and I could hear that crunch again. It was near a tall pine tree, but I could not see more. A red tail peeked out, swayed, then went still. I crept near.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same character: blonde braids, cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, brown winter boots, rosy cheeks, tiny solid black dot eyes) walking carefully under tall snow-covered pine trees in deep fresh snow. Small boot prints trail behind her on the forest floor. She has stopped near a large pine and is leaning forward, listening, one mittened hand raised near her ear. Beside the tall pine tree just ahead of her, ONLY the tip of a single bushy red fox tail with a white tip pokes out from behind the trunk — just the tail visible, the rest of the fox completely hidden behind the tree. Winter Nordic forest, soft dappled light, gentle snowfall. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 3,
                "text": "Out popped a fox, with neat paws and sharp ears. He looked at me and sat down in the soft snow. I felt a bit of fear, but I did not run. I spoke soft and clear. \"Dear fox, you are safe with me.\"",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit: blonde braids, cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, rosy cheeks, tiny black dot eyes) crouched gently in the snow with a soft, calm expression, one mittened hand held out low and open. A beautiful red fox is now fully revealed sitting in the snow facing her — bright orange-red fur, white chest and belly, large pointed ears with black tips, thick bushy tail with a white tip curled around his paws, tiny solid black dot eyes, small sharp muzzle, neat black paws. The fox looks at Astrid with calm curiosity. Same snowy pine forest setting as the previous page. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 4,
                "text": "The fox sniffed and trotted off into the trees. Then a soft tap came near a rock at the stream. Two long ears stuck up, pink and still in the snow. A rabbit was near the rock, under a thin sheet of snow. I kept still.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outdoor outfit: blonde braids, cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, brown winter boots, rosy cheeks, tiny black dot eyes) standing very still near a frozen stream with jagged patterns of pale blue ice, her breath visible as soft white puffs in the cold air. Deep untouched snow all around. Near a large weathered grey boulder just ahead of her, TWO long upright ears with pink inner colour and black tips poke straight up above the top of the rock — only the ear tips visible, the rabbit fully hidden behind the boulder. Astrid's expression is alert, hands held low at her sides, holding very still. Snowy Nordic forest with birch and pine trees in the background. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 5,
                "text": "The rabbit sprang from the rock and ran to the stream. It leapt clear over the water with long, strong legs. Splash, splash, then the rabbit ran on again. I called out as it landed safe and kept on. What a dear, quick rabbit with big pink ears!",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit) standing at the edge of a frozen stream, eyes wide with delight, mouth slightly open in a happy gasp, one mittened hand raised. A snow rabbit (pure white winter coat blending with the snow, long upright ears with pink inner colour and black tips, powerful bent back legs caught mid-leap, small front paws extended, short white tail, tiny solid black dot eyes, dark visible eye accents) leaps in mid-air over the icy stream with a soft motion-blur suggesting quick movement, small splashes of water and snow underneath. The frozen stream and snowy Nordic forest visible in the scene. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 6,
                "text": "Next, I spotted two dark points on a pale mound of snow. They poked up out of the snow like small twigs. I went near and a snort came from under the mound. Was it a log, or was it a deer? I waited, still as a rock, and did not fear.",
                "perspective": "GIRL",
                "image_prompt": "Zoomed-in composition. In the foreground, dominating the centre of the frame: a large pale snow mound (a snow-buried log or possibly a hidden animal) — smooth white humped shape with a dusting of frost. Rising above the top of the snow mound: two tall branching antler tips poke up into the pale grey winter sky — dark silhouette shape, elegant symmetrical branching pattern, clearly antler tips (not tree branches) but looking deceptively like bare winter twigs at first glance. Peeking around one side of the snow mound, small in the frame: Astrid (same outfit — blonde braids under cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, rosy cheeks, tiny black dot eyes), looking up at the antler tips with wide curious eyes, hands clasped at her chest. CRITICAL: the snow mound completely hides the body, head, ears, and legs of the deer — the ONLY part of the deer visible is the antler tips above the mound. Do NOT show the deer's body, head, ears, face, or any fur anywhere — ONLY the antler tips above the snow. Dense dark misty pine forest with pale grey light behind. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 7,
                "text": "Out stepped a deer, tall and grand, with big antlers. He stood near me and did not run. I spoke clear and slow. \"Dear deer,\" I said, \"we will not harm you.\" He looked at me, then stepped off into the trees.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit) standing very still and small in a snowy forest clearing, hands at her sides, looking up in awe at the big animal in front of her. A majestic red deer stag has stepped out from between the dark pines — thick warm brown winter coat, tall branching antlers (4-5 points per side) reaching up into the pale grey winter sky, strong neck, kind dark eyes looking directly at Astrid, elegant legs in the snow, tiny solid black dot eyes. The stag stands calm and still, meeting Astrid's gaze. Soft snow falling gently. Quiet, reverent, magical mood. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 8,
                "text": "Snow dusted my coat as I ran back to the door. Dad waited there, warm from the fire and keen to hear. \"I saw a fox, a rabbit, and a deer!\" We sat on the floor indoors and read at the fire.",
                "perspective": "BOTH",
                "image_prompt": "Interior of the cosy Scandinavian log cabin, late afternoon. Astrid (same outdoor outfit but now lightly dusted with fresh snow on her coat, hat, and shoulders, extra rosy cheeks, big happy smile, blonde braids slightly mussed) sits cross-legged on a sheepskin rug on the wooden floor at the wood-burning stove, an open picture book in her lap. Dad (Swedish man, short brown hair, slight stubble, grey wool sweater with Nordic pattern at the neckline) sits beside her on the floor cross-legged, arm gently around her shoulders, listening with a warm interested smile. Warm orange firelight glows from the wood-burning stove. Through a small window in the background: snow falling thickly in the soft late-afternoon light, dim outline of pine trees beyond. Wooden floors, sheepskin rug, minimalist Scandinavian decor, wooden armchair to one side. Landscape orientation. Warm children's book illustration style.",
            },
        ],
        "cover_prompt": "Magical winter discovery scene for the book cover. Astrid (Swedish girl, 5 years old, long blonde hair in two braids, cream wool hat with Nordic snowflake pattern, red hand-knitted wool jumper under a thick dark blue winter coat, red wool scarf, dark blue mittens, brown leather winter boots, light skin with rosy cheeks from the cold, tiny solid black dot eyes) stands in the centre of a snowy Nordic forest clearing, looking around with wonder and delight. Around her, peeking out from behind different snow-covered pine trees and rocks: a red fox (bright orange-red fur, white chest, black-tipped pointed ears, bushy tail) peeks from behind a pine on the left; a snow rabbit with long pink-and-black-tipped ears peers from beside a grey rock in the foreground; a majestic red deer stag (thick brown coat, tall branching antlers) is visible between the dark pines in the background. Soft snow falls gently. Warm golden winter light filters through the trees. Portrait orientation. Warm children's book cover illustration style, inviting and full of quiet magic.",
        "story_words": ["hear", "near", "door", "floor", "ear", "ears", "dear", "fear", "clear", "indoors"],
        "tricky_words_used": ["I", "the", "to", "my", "a", "was", "could", "again", "there", "into", "of", "you", "are", "he", "two", "they", "like", "small", "or", "over", "water", "called", "tall", "we", "said", "saw", "pulled", "heard"],
        "read_words": ["near", "hear", "dear", "fear", "clear", "door", "floor"],
        "nonsense_words": [
            "snear", "drear", "frear", "spear", "blear",
            "gloor", "ploor", "broor", "troor", "smoor",
        ],
        "questions": [
            {"category": "Finding", "text": "What three animals did the child meet in the woods?"},
            {"category": "Thinking", "text": "Why did the child speak soft and clear to the fox and the deer?"},
            {"category": "Words", "text": "What does 'crept' mean? Show me how a person creeps."},
            {"category": "What next", "text": "If you went out into the snowy woods, what animal would you most like to meet?"},
        ],
        "writing_graphemes": ["ear", "oor"],
        "writing_words": ["hear", "near", "dear", "fear", "clear", "door", "floor", "indoors"],
        "writing_starters": ["Near the door, I heard...", "I saw a ___ in the snow."],
        "character": {
            "name": "Swedish girl (Astrid)",
            "age": "5 years old",
            "appearance": "Light skin with rosy cheeks from the cold (skin #F0D0B0). Long straight blonde hair in two braids (hair #D4B87A). Tiny solid black dot eyes (simple illustrated style).",
            "outfit_indoor": "Red hand-knitted wool jumper, dark blue jeans, thick woolly socks (only briefly hinted at the very start of page 1; she is already dressed for snow on page 1).",
            "outfit_outdoor": "Red hand-knitted wool jumper under a thick dark blue winter coat (knee-length), cream wool hat with Nordic snowflake pattern, red wool scarf, dark blue mittens, brown leather winter boots (all pages 1-8: full outfit visible from page 1 onwards as she is already dressed for the snow when standing near the door).",
            "notes": "Nordic setting is visual texture only — shown in images through minimalist Scandinavian log cabin interior, snowy Nordic pine forest, Nordic knitwear patterns. Not mentioned in the text. Outfit is consistent across all outdoor pages for hero-injection consistency.",
        },
        "side_characters": {
            "dad": {
                "name": "Nordic Dad",
                "appearance": "Light skin, short brown hair, friendly face with slight stubble, warm kind eyes",
                "outfit": "Grey wool sweater with subtle Nordic pattern at the neckline, dark trousers, thick woolly socks",
                "appears_on": "Pages 1 and 8 only (bookends at the cabin)",
            },
            "fox": {
                "name": "The red fox",
                "appearance": "Bright orange-red fur, white chest and belly, large pointed ears with black tips, thick bushy tail with a white tip, small sharp muzzle, tiny solid black dot eyes, neat black paws",
                "appears_on": "Pages 2 (just bushy red tail tip visible behind a tree) and 3 (full reveal, sitting calmly)",
            },
            "snow_rabbit": {
                "name": "The snow rabbit",
                "appearance": "Snow rabbit / mountain hare in pure white winter coat, long upright ears with pink inner colour and black tips, powerful bent back legs, small front paws, short white tail, tiny solid black dot eyes",
                "appears_on": "Pages 4 (just two ear tips visible above a rock) and 5 (full reveal, leaping clear over the stream)",
            },
            "deer": {
                "name": "The red deer stag",
                "appearance": "Large red deer stag, thick warm brown winter coat, tall branching antlers (4-5 points per side), strong neck, kind dark eyes, elegant legs, tiny solid black dot eyes",
                "appears_on": "Pages 6 (only antler tips visible above a snow mound) and 7 (full reveal in clearing)",
            },
        },
        "cultural_notes": {
            "setting": "Snowy Nordic forest in winter, with a Scandinavian log cabin as the starting and ending point",
            "approach": "Contemporary-first with cultural texture. Modern Scandinavian log cabin with minimalist interior — wood-burning stove, wooden floors, sheepskin rugs, Nordic-patterned knitwear. Snowy Nordic pine and birch forest. Universal story about quiet discovery of wildlife and kindness to animals. Visual texture only — text does not mention any place name.",
        },
    }
}
