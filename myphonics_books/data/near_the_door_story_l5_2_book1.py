"""
Near the Door — Level 5.2 Story
Focus sounds: ear, oor
Setting: Snowy Swedish forest (winter) — journey/discovery story
Cultural approach: Visual texture only — modern Scandinavian log cabin and
Swedish winter forest shown in images, universal story about finding animals
in the snow.
Rewritten 2026-04-16 — replaced static-cabin story with journey/peek-reveal
structure for image consistency and L5 text density (~76 words/page).

Story structure: Peek → Reveal journey (Dear Zoo-style hooks)
- Page 1: Girl leaves cabin with Dad's warning to stay near
- Pages 2-3: Clue (one ear) → Reveal (fox)
- Pages 4-5: Clue (two long ears) → Reveal (snow hare)
- Pages 6-7: Clue (ears + antlers) → Reveal (deer)
- Page 8: Return to cabin door
Each page a different forest location → minimises AI background-consistency
burden (per memory: journey/location-change stories preferred at all levels).

Phonics validation: ALL words verified decodable at L5 cumulative level
or are cumulative tricky words. Previous flagged words removed:
- "heart" (ear→/ar/ irregular) → replaced with "did not move" / "did not dare move"
- "thought" (ough L6) → replaced with "said to myself"

Focus 'ear' words: near (x6), ear/ears (x9 — both body-part and phoneme
reinforcement), hear/heard (x4), dear (x4), fear, clear
Focus 'oor' words: door (x3), floor (x3), poor

Consonant clusters used: st, cr, fl, sp, sn, sm, cl, tr, br, gr, fr, pr
(all unlocked at L3+)

Image feasibility: PASS — every page a different location, hero (Astrid)
is the only visual consistency burden. Animals appear only on their reveal
page (no cross-page animal consistency needed). Dad only in pages 1 and 8
(bookends).
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
                "text": "I stood at the door and looked out. Snow had come in the night. It was thick on the trees and thick on the path. \"Stay near the cabin, my dear,\" Dad said from his seat by the fire. \"Do not go far.\" I put on my thick coat and my hat and my scarf. \"I will not,\" I said back. I opened the door and stepped out. My boots went crunch, crunch on the soft snow.",
                "perspective": "GIRL",
                "image_prompt": "Interior of a cosy Scandinavian log cabin, warm morning light. Astrid (Swedish girl, 5 years old, light skin with rosy cheeks, long blonde hair in two braids, tiny solid black dot eyes) stands by an open wooden front door, pulling on her thick dark blue winter coat. Red hand-knitted wool jumper visible under the coat, cream wool hat with Nordic snowflake pattern on her head, red wool scarf and dark blue mittens ready on a wooden bench beside her, brown leather winter boots. Through the open doorway: a snowy path between tall snow-covered pine trees. In the background, Dad (Swedish man, short brown hair, slight stubble, grey wool sweater with Nordic pattern at the neckline, dark trousers) sits in a wooden armchair by a wood-burning stove with warm firelight glowing. Wooden floors, sheepskin rug, minimalist Scandinavian decor. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 2,
                "text": "I went in under the trees. The forest floor was soft with fresh snow. I could hear the wind up in the branches. Then I heard something else — a small crunch, near a big pine tree. I stopped and kept still. I did not move a bit. What was it? I crept near. And there, sticking up from behind the tree, I could see one small pointed ear. Just one ear. Red and soft.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same character: Swedish girl, blonde hair in two braids, cream wool hat with Nordic snowflake pattern, red jumper under dark blue winter coat, red scarf, blue mittens, brown winter boots, rosy cheeks, tiny solid black dot eyes) walking under tall snow-covered pine trees in deep fresh snow. Small boot prints trail behind her on the forest floor. She has stopped and is listening intently, head tilted, one mittened hand raised near her ear. Beside a large pine tree just ahead of her, ONLY the tip of a single red fox ear pokes out from behind the trunk — just the ear tip and a small edge of orange-red fur visible, the rest of the fox completely hidden behind the tree. Winter Swedish forest, soft dappled light, gentle snowfall. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 3,
                "text": "I bent down low and looked around the side of the tree. Two bright eyes looked right back at me! It was a fox! A little red fox with a thick bushy tail. His ears were sharp and black at the tips. \"Hello, dear fox,\" I said. \"I will not hurt you.\" He did not run. He just looked at me and twitched his ears. I had spotted him first! I felt so proud.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit: blonde braids, cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, rosy cheeks, tiny black dot eyes) crouched low in the snow, peeking around the side of a thick pine tree trunk with a delighted smile on her face. A beautiful red fox is now fully revealed sitting in the snow facing her — bright orange-red fur, white chest and belly, large pointed ears with black tips, thick bushy tail with a white tip curled around his paws, tiny solid black dot eyes, small sharp muzzle. The fox looks at Astrid with calm curiosity. Same snowy pine forest setting as the previous page. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 4,
                "text": "I went on. The snow got deep and my boots sank down. I came to a stream, all frozen hard. The ice made a strange cracking sound in the cold. I stopped to listen. Then I heard a soft hop, hop, hop. Near a big grey rock, I could see something move. Two long ears were sticking up above the rock! White ears, with black at the tips. What could it be? I did not dare move.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outdoor outfit: blonde braids, cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, brown winter boots, rosy cheeks, tiny black dot eyes) standing beside a frozen stream with jagged patterns of pale blue ice, her breath visible as soft white puffs in the cold air. Deep untouched snow all around. Near a large weathered grey boulder just ahead of her, TWO long white ears with black tips poke straight up above the top of the rock — only the ear tips visible, the animal fully hidden behind the boulder. Astrid's expression is alert, curious, holding very still. Snowy Swedish forest with birch and pine trees in the background. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 5,
                "text": "I tiptoed near the rock and looked over the top. A snow hare! His coat was all white, white as the snow. His big back legs were bent, ready to spring. His long ears stood tall and still. He looked at me with dark round eyes, then — thump, thump, thump — he hopped off fast across the snow. I could hear his feet on the hard ice of the stream. \"Goodbye!\" I called.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit) tiptoeing quietly on the snow beside the large grey boulder, peeking over the top of the rock with wide delighted eyes, one finger to her lips. A snow hare (pure white winter coat blending with the snow, long upright ears with black tips, powerful bent back legs mid-spring, small front paws, short white tail, tiny solid black dot eyes) leaps away across the snow with a soft motion-blur suggesting quick movement. The frozen stream and snowy Swedish forest visible in the scene. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 6,
                "text": "The trees were thick here. Not much light came down to the forest floor. Could I go on? \"Dad said stay near,\" I said to myself. \"But just a bit more.\" Then — crack! A branch snapped. My heart beat fast. I felt a little fear. Peeking out from behind a big snow dune: two tall bare branches going up into the sky. But — were they branches? Horns!",
                "perspective": "GIRL",
                "image_prompt": "Zoomed-in close-up composition. In the foreground, dominating most of the frame: a MASSIVE ancient pine tree trunk — enormously thick and wide (wide enough to completely hide a large stag behind it), dark weathered bark with patches of snow clinging to it, filling the centre and much of the width of the image. Rising above the top of this huge tree trunk: two tall branching antlers poke up into the pale grey winter sky — dark silhouette shape, elegant symmetrical branching pattern, clearly antlers (not tree branches) but looking deceptively like bare winter branches at first glance. Peeking around one side of the massive tree trunk: Astrid (same outfit — blonde braids under cream Nordic hat, red jumper under dark blue winter coat, red scarf, blue mittens, rosy cheeks, tiny black dot eyes), small in the frame compared to the giant tree, looking up at the antlers with wide curious eyes. CRITICAL: the massive pine trunk is so thick it completely hides the body, head, ears, and legs of the stag — the ONLY part of the stag visible is the branching antlers rising above the top of the tree. Do NOT show the stag's body, head, ears, face, or any fur anywhere — ONLY the antlers above the trunk. Dense dark misty pine forest with pale light behind. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 7,
                "text": "I stood as still as a stone. Out from the trees stepped a big brown deer. His coat was thick and warm. His eyes were dark and kind. His tall horns branched up into the cold sky. He saw me, but he did not run. He just looked at me for a long, long time. \"My dear,\" I whispered. \"You are so big.\" Then he turned and went off, soft as snow falling.",
                "perspective": "GIRL",
                "image_prompt": "Astrid (same outfit) standing very still and small in a snowy forest clearing, hands at her sides, looking up in awe. A majestic red deer stag has stepped out from between the dark pines — thick warm brown winter coat, tall branching antlers (4-5 points per side) reaching up into the pale grey winter sky, strong neck, kind dark eyes looking directly at Astrid, elegant legs in the snow, tiny solid black dot eyes. The stag stands calm and still, meeting Astrid's gaze. Soft snow falling gently. Quiet, reverent, magical mood. Landscape orientation. Warm children's book illustration style.",
            },
            {
                "page_number": 8,
                "text": "I turned back for the cabin. The snow was falling fast now. When I got to the door, Dad was there, waiting. He opened it wide. \"Was it all clear out there, my dear?\" he said. I sat down on the floor by the fire. My cheeks were red and my hands were cold. \"Dad,\" I said, \"I saw a fox, and a hare, and a big deer with horns. Poor things, out in the snow. I hope they find somewhere warm.\"",
                "perspective": "BOTH",
                "image_prompt": "The open front door of the Scandinavian log cabin, late afternoon. Dad (Swedish man, short brown hair, slight stubble, grey wool sweater with Nordic pattern at the neckline) holds the wooden door wide open with a warm, welcoming smile. Astrid (same outdoor outfit: blonde braids, cream Nordic hat, red jumper, dark blue winter coat, red scarf, blue mittens, brown boots — now lightly dusted with snow on her coat and hat, extra rosy cheeks, happy smile) stands on the wooden threshold stepping inside. Warm orange firelight spills out onto the snowy step. Inside behind Dad: wooden armchair, wood-burning stove glowing, sheepskin rug, wooden floors. Outside: snow falling thickly in the soft late-afternoon light, snow-covered pines beyond the garden. Landscape orientation. Warm children's book illustration style.",
            },
        ],
        "cover_prompt": "Magical winter discovery scene for the book cover. Astrid (Swedish girl, 5 years old, long blonde hair in two braids, cream wool hat with Nordic snowflake pattern, red hand-knitted wool jumper under a thick dark blue winter coat, red wool scarf, dark blue mittens, brown leather winter boots, light skin with rosy cheeks from the cold, tiny solid black dot eyes) stands in the centre of a snowy Swedish forest clearing, looking around with wonder and delight. Around her, peeking out from behind different snow-covered pine trees and rocks: a red fox (bright orange-red fur, white chest, black-tipped pointed ears, bushy tail) peeks from behind a pine on the left; a pure white snow hare with long black-tipped ears peers from beside a grey rock in the foreground; a majestic red deer stag (thick brown coat, tall branching antlers) is visible between the dark pines in the background. Soft snow falls gently. Warm golden winter light filters through the trees. Portrait orientation. Warm children's book cover illustration style, inviting and full of quiet magic.",
        "story_words": ["hear", "near", "door", "floor", "ear", "dear", "fear", "clear", "poor"],
        "tricky_words_used": ["I", "the", "to", "my", "said", "you", "do", "what", "he", "was", "one", "some", "where", "saw", "there", "were", "eyes", "into", "could", "heart"],
        "read_words": ["hear", "near", "door", "floor", "dear", "clear"],
        "nonsense_words": [
            "blear", "snear", "drear", "twear", "frear",
            "ploor", "smoor", "gloor", "troor", "choor",
        ],
        "questions": [
            {"category": "Finding", "text": "What three animals did the girl see in the snowy forest?"},
            {"category": "Thinking", "text": "Why did the girl have to be still and quiet when she got near the animals?"},
            {"category": "Words", "text": "What does 'poor' mean when she says 'poor things, out in the snow'?"},
            {"category": "What next", "text": "If you went on a walk in the snow, what animal would you most hope to see?"},
        ],
        "writing_graphemes": ["ear", "oor"],
        "writing_words": ["hear", "near", "dear", "fear", "door", "floor", "poor"],
        "writing_starters": ["Near the door, I heard...", "I saw a ___ near the ___."],
        "character": {
            "name": "Swedish girl (Astrid)",
            "age": "5 years old",
            "appearance": "Light skin with rosy cheeks from the cold (skin #F0D0B0). Long straight blonde hair in two braids (hair #D4B87A). Tiny solid black dot eyes (simple illustrated style).",
            "outfit_indoor": "Red hand-knitted wool jumper, dark blue jeans, thick woolly socks (pages where she is inside before dressing for outdoors)",
            "outfit_outdoor": "Red hand-knitted wool jumper under a thick dark blue winter coat (knee-length), cream wool hat with Nordic snowflake pattern, red wool scarf, dark blue mittens, brown leather winter boots (all pages 2-8 outdoor scenes)",
            "notes": "Swedish setting is visual texture only — shown in images through minimalist Scandinavian log cabin interior, snowy Swedish pine forest, Nordic knitwear patterns. Not mentioned in the text. Outfit is consistent across all outdoor pages for hero-injection consistency.",
        },
        "side_characters": {
            "dad": {
                "name": "Swedish Dad",
                "appearance": "Light skin, short brown hair, friendly face with slight stubble, warm kind eyes",
                "outfit": "Grey wool sweater with subtle Nordic pattern at the neckline, dark trousers, woolly socks",
                "appears_on": "Pages 1 and 8 only (bookends at the cabin door)",
            },
            "fox": {
                "name": "The red fox",
                "appearance": "Bright orange-red fur, white chest and belly, large pointed ears with black tips, thick bushy tail with a white tip, small sharp muzzle, tiny solid black dot eyes, delicate black legs",
                "appears_on": "Pages 2 (just ear tip visible) and 3 (full reveal)",
            },
            "snow_hare": {
                "name": "The snow hare",
                "appearance": "Mountain hare in pure white winter coat, long upright ears with black tips, powerful bent back legs, small front paws, short white tail, tiny solid black dot eyes, dark round eyes for the close-up reveal",
                "appears_on": "Pages 4 (just ear tips visible above a rock) and 5 (full reveal, mid-hop)",
            },
            "deer": {
                "name": "The red deer stag",
                "appearance": "Large red deer stag, thick warm brown winter coat, tall branching antlers (4-5 points per side), strong neck, kind dark eyes, elegant legs, tiny solid black dot eyes",
                "appears_on": "Pages 6 (ears and antler tips visible between trees) and 7 (full reveal in clearing)",
            },
        },
        "cultural_notes": {
            "setting": "Snowy Swedish forest in winter, with a Scandinavian log cabin as the starting and ending point",
            "approach": "Contemporary-first with cultural texture. Modern Scandinavian log cabin with minimalist interior — wood-burning stove, wooden floors, sheepskin rugs, Nordic-patterned knitwear. Snowy Swedish pine and birch forest. Universal story about quiet discovery of wildlife and kindness to animals. Visual texture only — text does not mention Sweden.",
        },
    }
}
