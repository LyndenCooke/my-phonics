# Image prompts for L5.1 "Before the Shore"
# Orthodox Jewish boy + Dad in North London (Mum removed)
# Art style: Whimsical children's book illustration, soft watercolour textures, clean black outlines
# Stone: Distinctive amber/honey colour with thin white stripe for consistency

# Character definitions (use EXACT descriptions in all prompts)
CHARACTER_BOY = """
A 5-year-old Orthodox Jewish boy with light olive skin, short dark brown hair on top with distinctive long curled payot (side curls) in front of each ear. He wears a small dark navy kippah (skullcap) on top of his head, a white button-up collared shirt tucked into dark navy trousers, and black leather shoes. His eyes are ABSOLUTELY CRITICAL: tiny solid black filled circles like dots drawn with a marker — NO white sclera, NO highlights, NO iris detail, NO anime-style eyes. Eyes must look like a teddy bear's eyes — just small black dots.
"""

CHARACTER_DAD = """
A tall Orthodox Jewish man (the boy's father) with light olive skin, a dark beard, and payot (curled side locks). He wears a black wide-brimmed fedora hat, a long black frock coat over a white shirt, and dark trousers. Eyes are ABSOLUTELY CRITICAL: tiny solid black filled circles — NO white at all.
"""

# Object definitions (use EXACT descriptions for consistency)
OBJECT_STONE = "A smooth, flat, oval AMBER/HONEY-coloured stone with a thin white stripe across one side, palm-sized"
OBJECT_WIRE = "Thin silver craft wire"
OBJECT_SHELLS = "Small seashells in pink, white, and cream colours"

# Art style to append to ALL prompts
ART_STYLE = """
Whimsical children's book illustration style. Soft watercolour textured backgrounds with warm, inviting colours. Clean black-outlined characters. No text, words, or letters anywhere in the image. Eyes on ALL characters must be tiny solid black dots with absolutely NO white.
"""

PROMPTS = {
    "hero": f"""
Full body portrait of {CHARACTER_BOY}
Standing in a neutral pose, facing slightly to the right, full body visible from head to toe.
Simple light grey background.
{ART_STYLE}
""",

    "hero_dad": f"""
Full body portrait of {CHARACTER_DAD}
Standing in a neutral pose, facing slightly to the left, full body visible from head to toe.
Simple light grey background.
{ART_STYLE}
""",

    "cover": f"""
Portrait composition (3:4 ratio).
{CHARACTER_BOY}
He is sitting on a wooden park bench in a London park, holding {OBJECT_STONE} up to the light with wonder in his expression. Behind him, the scene splits subtly: on one side, Victorian terraced houses and autumn trees (the park); on the other side, a hint of beach/shore with waves and sand.
Title area at top. Warm, inviting autumn colours.
{ART_STYLE}
""",

    "page1": f"""
Landscape scene (4:3 ratio).
{CHARACTER_BOY}
He looks tired, sitting on a wooden park bench in a London park, picking up {OBJECT_STONE} from the ground near his feet. Victorian red-brick terraced houses with bay windows visible in the background. Autumn leaves scattered on the ground. Overcast British sky with soft light.
{ART_STYLE}
""",

    "page2": f"""
Landscape scene (4:3 ratio).
{CHARACTER_BOY}
He is sitting on the park bench with his eyes peacefully closed, holding {OBJECT_STONE} in his cupped hands. A soft, dreamy glow or slight blur around the edges of the image suggests he is remembering something. AUTUMN trees with orange, red, brown and golden leaves. NO spring blossom, NO green summer trees.
{ART_STYLE}
""",

    "page3": f"""
Landscape scene (4:3 ratio). FLASHBACK — warmer, golden tones.
{CHARACTER_BOY} running joyfully on a sandy British beach with {CHARACTER_DAD} running alongside him. JUST THESE TWO CHARACTERS — no one else. Waves rolling onto the shore behind them. In the corner/background, a small beach campfire with orange flames jumping upward. British seaside setting with some pebbles mixed in the sand and grassy dunes visible.
{ART_STYLE}
""",

    "page4": f"""
Landscape scene (4:3 ratio). FLASHBACK — warmer, golden tones.
{CHARACTER_BOY} crouching beside a rocky tidal pool, his hands full of {OBJECT_SHELLS}. {CHARACTER_DAD} kneels beside him, helping him thread shells onto {OBJECT_WIRE} to make a craft. Both are smiling happily. JUST THESE TWO CHARACTERS — no one else. Rocky shore with shallow pools of water reflecting blue sky. More shells scattered around — various sizes and colours.
{ART_STYLE}
""",

    "page5": f"""
Landscape scene (4:3 ratio). FLASHBACK — warmer, golden tones.
{CHARACTER_BOY} picking up {OBJECT_STONE} from the edge of the shore, looking at it with delight. {CHARACTER_DAD} stands nearby, gesturing encouragingly toward the stone. JUST THESE TWO CHARACTERS — no one else. The calm sea is behind them with gentle waves. The boy is putting the stone into his trouser pocket with a big smile.
{ART_STYLE}
""",

    "page6": f"""
Landscape scene (4:3 ratio). BACK TO PRESENT — cooler autumn tones.
{CHARACTER_BOY} sitting up alertly on the park bench, eyes open and bright, holding {OBJECT_STONE} up to the light. Sunlight catches the stone's smooth surface. He looks thoughtful and happy, as if he has just had a wonderful idea. London park with Victorian terraced houses in the background. Autumn leaves.
{ART_STYLE}
""",

    "page7": f"""
Landscape scene (4:3 ratio).
{CHARACTER_BOY} sitting at a wooden table inside a cosy home. On the table in front of him are TWO of the same stone: {OBJECT_STONE} — a matching pair. He is carefully bending {OBJECT_WIRE} to make loops around the stones. His tongue sticks out slightly in concentration. Warm home interior with family photos visible on the wall behind him.
{ART_STYLE}
""",

    "page8": f"""
Landscape scene (4:3 ratio).
{CHARACTER_DAD} receiving a handmade gift from {CHARACTER_BOY}. Dad holds up the two amber/honey stones with white stripes, now threaded on {OBJECT_WIRE} as a charm. Dad is smiling warmly with joy. The boy looks proud and happy. Dad is attaching them to his bag. JUST THESE TWO CHARACTERS — no one else. Warm family moment in their cosy home.
{ART_STYLE}
"""
}
