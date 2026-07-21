"""One-off: regenerate L4 (ay/ee/igh) Sound Spotlight clip-art in the clean
house style (flat cartoon, bold outline, solid colours, NO faces on objects,
solid-black oval eyes only on real creatures). Reuses regen() + STYLE from
regen_spotlight_vertex so output matches the cup/mug look.
"""
from regen_spotlight_vertex import regen

# grapheme, word, subject
TARGETS = [
    ("ay", "day",
     "a single bright yellow cartoon sun with short straight rays and two small "
     "simple white clouds. The sun is completely plain with NO face, NO eyes, NO "
     "mouth, NO smile."),
    ("ay", "hay",
     "a single round golden bale of hay, a rolled cylindrical straw bale with "
     "visible straw lines, sitting on the ground. NO face, NO eyes."),
    ("ay", "ray",
     "a single blue manta ray (stingray) seen from above gliding, wings spread, "
     "long thin tail. It has two small SOLID-BLACK oval eyes (100% black, no "
     "white, no shine, no catchlight) and NO mouth, NO smile, calm and plain."),
    ("ee", "bee",
     "a single honey bee with a rounded yellow-and-black striped body and two "
     "simple translucent wings. It has two small SOLID-BLACK oval eyes (100% "
     "black, no white, no shine) and NO smiling mouth."),
    ("ee", "seed",
     "a single brown seed, like one large smooth sunflower seed or apple pip, "
     "plain and simple. NO face, NO eyes."),
    ("ee", "reef",
     "a simple coral reef: two or three coral shapes in soft calm colours with "
     "one small orange fish beside them. Keep it calm and uncluttered, NOT a "
     "busy rainbow scene. NO faces."),
    ("igh", "high",
     "a single red-and-white hot-air balloon floating up high in the sky with "
     "two small simple white clouds below it. NO face, NO eyes anywhere."),
    ("igh", "night",
     "a single yellow crescent moon with three small stars. The moon is "
     "completely plain with NO face, NO eyes, NO mouth, NO smile. For THIS card "
     "only, use a soft dark navy-blue night-sky background instead of white."),
    ("igh", "light",
     "a single glowing light bulb (clear glass with a warm yellow glow inside) "
     "with a few short straight light rays around it. NO face, NO eyes."),
]

if __name__ == "__main__":
    ok = 0
    for g, w, subj in TARGETS:
        if regen(g, w, subj):
            ok += 1
    print(f"\nDone: {ok}/{len(TARGETS)} regenerated.")
