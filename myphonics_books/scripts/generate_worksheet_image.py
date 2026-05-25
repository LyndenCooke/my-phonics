"""Generate a MyPhonicsBooks worksheet page via OpenAI gpt-image-1.

Sends the prompt + 5 visual reference images to images.edit so the model
treats the references as style anchors. Saves PNG to marketing-mockups.

Usage:
    py -3.12 scripts/generate_worksheet_image.py 1   # worksheet 1 only
"""
from __future__ import annotations

import argparse
import base64
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

REPO = ROOT.parent  # C:/Users/ASUS/myphonicsbooks
REF_DIR = REPO / "marketing-mockups" / "worksheet images"
EXTRA_REF_DIR = REPO / "marketing-mockups" / "worksheet images" / "v2"
EXTRA_REF_FILES = ["2118f643-67e0-47d6-bf31-5dcfc7cb6ccc.png"]  # new tracing reference

# Character references — used only when a worksheet actually shows a book character.
# Single-sound worksheets do NOT include these refs (no book character on the page).
# L1.1 book character set: boy + ginger cat ('Tap! Tap! Tap!')
CHAR_REF_FILES = [
    ROOT / "output" / "images" / "L1_1_B1" / "hero_reference.png",
    ROOT / "output" / "images" / "L1_1_B1" / "page5.png",
]
# L1.2 book character set: British-Asian girl (red top, denim dungarees, blue wellies)
# + golden retriever dog. From 'The Mud on the Dog'.
CHAR_REF_FILES_L1_2 = [
    ROOT / "output" / "images" / "L1_2_B1" / "hero_reference.png",
    ROOT / "output" / "images" / "L1_2_B1" / "page5.png",
]
# L1.3 book character set: girl in lavender hijab + yellow top + mint trousers
# (wheelchair user; chair appears in some scenes, not all). Companion: orange goldfish.
# From 'The Fish in the Tank'.
CHAR_REF_FILES_L1_3 = [
    ROOT / "output" / "images" / "L1_3_B1" / "hero_reference.png",
    ROOT / "output" / "images" / "L1_3_B1" / "page5.png",
]

OUT_DIR = REPO / "marketing-mockups" / "worksheet images" / "v2"
OUT_DIR.mkdir(parents=True, exist_ok=True)


WORKSHEET_1_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "1. Tap! Tap! Sound Hunt"   Level chip: "Level 1 · SATPIN"   Book chip: "Tap! Tap! Tap!"

Use the attached images for STYLE ONLY (pink rounded banner, soft pastel boxes, cute cartoons,
grey footer). Do not copy their content. The new tracing reference (6th image) shows the
EXACT tracing pattern §2 must follow.

FIVE RULES — follow all five:
1. ONLY TWO activities on this page (§1 and §2). Each one fills roughly half the page below
   the banner. Big, airy, generous white space. NO reward stars on the sections.
   NO bottom "colour the stars" strip. NO row of stars anywhere.
2. NEVER draw a water tap. The word "tap" always means the ACTION of tapping — show a hand
   tapping a table/mat with 2–3 motion arcs and a tiny "Tap!" speech tag.
3. Only these letters/words may appear anywhere on the page: s a t p i n, sit, tap, pin, nap,
   plus the tricky word "the" if needed. No other letters or words.
4. Handwriting strips in §2 must use real 3-zone guide lines: solid BASELINE, dashed MIDLINE
   at x-height, faint dotted TOPLINE. Each strip is big and tall (≈ 22mm). Lowercase only,
   single-storey a, no serifs. CRITICAL: every letter must SIT DIRECTLY ON THE BASELINE —
   the bottom edge of s, a, t, i, n must TOUCH the baseline (not float a millimetre above it,
   not hover, not sit between the midline and baseline). The 'p' is the only letter whose
   body sits on the baseline AND whose tail descends below it. The x-height of every letter
   must reach EXACTLY up to the dashed midline, not under it, not over it.
5. Top banner pink (#E84B8A) with title, two chips top-right (Level 1 · SATPIN and
   Tap! Tap! Tap!), and a small roundel of the boy + ginger cat top-left. Footer left
   (grey, 9pt): "MyPhonicsBooks · decodable phonics practice". Footer right (grey, 9pt):
   "Worksheet 1 of 5". Nothing else in the footer area.

LAYOUT:

[1] "Say and Find" — "Circle the picture that starts with the sound."
    Six columns side by side: s | a | t | p | i | n.
    Each column has the lowercase letter at the top in a small pink square, then THREE
    small pictures stacked beneath. The child circles the one that begins with that letter.
    One picture per column matches the sound (from the visual dictionary); the other two
    are distractor pictures from the dictionary that DO NOT start with that sound.
    Vary the position of the correct picture across columns (top / middle / bottom).
    Example correct + distractors:
      s : sun (correct), pin, net
      a : ant (correct), sun, net
      t : hand-tapping (correct), ink-pot, pin
      p : pin (correct), ant, hand-tapping
      i : ink-pot (correct), sun, net
      n : net (correct), ant, pin
    All pictures clean, well-spaced, unambiguous.

[2] "Trace and Write" — "Trace each letter. Then write one more."
    EXACTLY match the tracing pattern in the 6th attached reference image.
    Two long horizontal handwriting strips spanning the full width of the section.
    A small "1" label sits to the left of the first strip, a small "2" left of the second.
    Strip 1 contains the letters  s  a  t  in order.
    Strip 2 contains the letters  p  i  n  in order.
    For EACH letter in a strip: first one SOLID dark model letter, then 4 dotted-grey
    TRACE copies of the same letter following it, evenly spaced. So strip 1 reads
    visually as:  [s] s s s s   [a] a a a a   [t] t t t t   (solid then 4 dotted each).
    Strip 2 similarly:  [p] p p p p   [i] i i i i   [n] n n n n.
    Both strips use full 3-zone guide lines running their entire length: solid BASELINE,
    dashed MIDLINE at x-height, faint dotted TOPLINE. Letters are lowercase, single-storey
    a, no serifs.
    BASELINE COMPLIANCE (binding): the bottom edge of every letter body must sit flush ON
    the solid baseline — touching it, not floating above it, not centred between baseline
    and midline. The TOP of each letter's x-height (the round body of a, s, p; the top of
    i, n; the rounded body of t below its ascender) must reach EXACTLY the dashed midline.
    The 'p' is the only letter whose tail (descender) crosses BELOW the baseline; its
    round body still sits on the baseline. The 't' ascender rises above the midline toward
    the topline. Same x-height across both strips. No floating glyphs. No drift.

VISUAL DICTIONARY (use exactly these meanings):
  s = sun (smiling cartoon)
  a = ant — small cute cartoon ant with the body in three rounded segments
       (HEAD at the front, thorax, abdomen at the back). The two antennae grow
       from the TOP OF THE HEAD (the front segment), NEVER from the rear/butt.
       Six legs underneath, friendly smile on the head. Side-view.
  t = a hand tapping a table/mat with motion arcs + tiny "Tap!" tag — NOT a water tap
  p = drawing pin (push-pin, point down, coloured head)
  i = ink pot with a blue ink blob
  n = small hand net
  boy = white British boy, blue t-shirt, brown hair, age ~5
  cat = fat friendly ginger cat from the story
"""


WORKSHEET_2_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "2. Tap the Sounds"   Level chip: "Level 1 · SATPIN"   Book chip: "Tap! Tap! Tap!"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Do not copy their content. Match this overall look.
- Image 6: tracing-strip reference for the 3-zone handwriting guide style.
- Images 7-8: CHARACTER references — the boy and the ginger cat from the book.
  ANY time you draw the boy or the cat anywhere on this worksheet (including the roundel in
  the banner and the "sit" / "nap" pictures in §1) they MUST match these character refs:
  same brown hair, green-stripe t-shirt, blue trousers; same fat friendly ginger cat.
  EYE STYLE — applies to EVERY character, animal, and creature on the page (boy, cat,
  ant, sun if smiling): eyes are TWO SMALL PURE BLACK SOLID DOTS only. NO whites,
  NO pupils, NO irises, NO eyelashes, NO sparkle highlights. Just two small black dots.

FIVE RULES — follow all five:
1. ONLY TWO activities on this page (§1 and §2). Each fills roughly half the page below the
   banner. Big, airy, generous white space. NO reward stars on the sections. NO bottom
   "colour the stars" strip. NO row of stars anywhere.
2. NEVER draw a water tap. The word "tap" always means the ACTION of tapping — show a hand
   tapping a table/mat with 2–3 motion arcs and a tiny "Tap!" speech tag.
3. Only these letters/words may appear anywhere on the page: s a t p i n, sit, tap, pin, nap,
   pan, tin, ant, sap, plus the tricky word "the" if needed. No other letters or words.
4. Letter tiles in §2 must be lowercase, clearly readable, single-storey a, no serifs.
   Every printed letter (in tiles AND on the handwriting strip) must sit ON the baseline.
   The handwriting strip uses real 3-zone guide lines: solid BASELINE, dashed MIDLINE at
   x-height, faint dotted TOPLINE. The 'p' descender drops cleanly below the baseline.
5. Top banner pink (#E84B8A) with title, two chips top-right (Level 1 · SATPIN and
   Tap! Tap! Tap!), and a small roundel of the boy + ginger cat top-left. Footer left
   (grey, 9pt): "MyPhonicsBooks · decodable phonics practice". Footer right (grey, 9pt):
   "Worksheet 2 of 5". Nothing else in the footer area.

LAYOUT:

[1] "Tap the Sounds" — "Say each word. Tap a circle for each sound you hear."
    Four CVC words shown in a single row across the section: sit | tap | pin | nap.
    For each word:
      - ABOVE the word: ONE clear small picture from the visual dictionary
        (sit = boy sitting cross-legged on a striped mat; tap = hand tapping with
        motion arcs and a "Tap!" tag; pin = red drawing pin; nap = ginger cat
        curled asleep with a small "Z").
      - The word printed clearly in the middle.
      - BELOW the word: three small empty OUTLINED circles in a horizontal row
        (sound buttons — leave the circles EMPTY, no letters inside, no fill).
    Same vertical structure for all four words. Lots of space between words.

[2] "Blend a Word" — "Look at the picture. Say each sound. Write the word."
    A vertical stack of FOUR rows, one row per word: pan | tin | ant | sap.
    Each row has three side-by-side cells across the full width of the section:
      Left cell:    ONE clear picture from the visual dictionary
                    (pan = a cooking pan side-view with a black handle;
                     tin = a food tin can with a blank label;
                     ant = the SAME ant style as Worksheet 1 — three rounded body
                           segments, antennae on the HEAD (front segment), six legs,
                           NEVER antennae on the rear;
                     sap = a small green leaf with a drop of golden sap dripping
                           from its tip).
      Middle cell:  Three small square letter tiles side by side, one letter per
                    tile, in the correct order to spell the word. Pink-outlined
                    rounded squares, lowercase letters inside.
                    Row 1 tiles: p | a | n
                    Row 2 tiles: t | i | n
                    Row 3 tiles: a | n | t
                    Row 4 tiles: s | a | p
      Right cell:   ONE long handwriting strip with the full 3-zone guide lines
                    (solid baseline, dashed midline, faint dotted topline). The
                    strip is EMPTY for the child to write the word — no model
                    letter, no trace letter, just the empty 3-zone lines.
    Same row height across all four rows. Generous spacing.

VISUAL DICTIONARY (use exactly these meanings):
  sit = boy sitting cross-legged on his striped mat
  tap = a hand tapping a table/mat with motion arcs + tiny "Tap!" tag — NOT a water tap
  pin = drawing pin (push-pin, point down, red dome head with grey shaft)
  nap = ginger cat curled asleep with a small "Z"
  pan = cooking pan, side view, with a black handle on the right
  tin = food tin can, side view, blank label
  ant = small cute cartoon ant with three rounded body segments — HEAD at the front
        (left) with both antennae growing from the TOP OF THE HEAD, abdomen at the
        back (right). Six legs underneath. Friendly smile on the head. Antennae
        NEVER on the rear/butt.
  sap = a small green leaf tilted, with a golden drop of sap forming at its tip
  boy = white British boy, blue t-shirt, brown hair, age ~5
  cat = fat friendly ginger cat from the story
"""


WORKSHEET_3_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "3. Read and Do"   Level chip: "Level 1 · SATPIN"   Book chip: "Tap! Tap! Tap!"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Do not copy their content. Match this overall look.
- Image 6: tracing/handwriting style reference (not needed on this worksheet but keep style).
- Images 7-8: CHARACTER references — the boy and the ginger cat from the book.
  ANY time you draw the boy or the cat anywhere on this worksheet (banner roundel + every
  picture in §1 + the cat in §2) they MUST match these character refs: same brown hair,
  green-stripe t-shirt, blue trousers; same fat friendly ginger cat.
  EYE STYLE — applies to EVERY character, animal, and creature on the page (boy, cat,
  rat, bat): eyes are TWO SMALL PURE BLACK SOLID DOTS only. NO whites, NO pupils, NO
  irises, NO eyelashes, NO sparkle highlights. Just two small black dots.

FIVE RULES — follow all five:
1. ONLY TWO activities on this page (§1 and §2). Each fills roughly half the page below
   the banner. Big, airy, generous white space. NO reward stars on the sections. NO
   bottom "colour the stars" strip. NO row of stars anywhere.
2. NEVER draw a water tap. The word "tap" always means the ACTION of tapping — show the
   boy or his hand tapping a table/mat with motion arcs and a tiny "Tap!" speech tag.
3. Only these letters/words may appear anywhere on the page: s a t p i n, sit, tap, pat,
   nap, rat, bat, cat, mat, plus the tricky words "I" and "the". Sentences end with a
   full stop. No other letters or words. Sentences must be EXACTLY as written below — do
   not add commas, exclamation marks, or extra words.
4. Picture-action consistency: in §1 the boy performs the action described. In §2 each
   picture is a distinct, unambiguous object from the visual dictionary.
5. Top banner pink (#E84B8A) with title, two chips top-right (Level 1 · SATPIN and
   Tap! Tap! Tap!), and a small roundel of the boy + ginger cat top-left. Footer left
   (grey, 9pt): "MyPhonicsBooks · decodable phonics practice". Footer right (grey, 9pt):
   "Worksheet 3 of 5". Nothing else in the footer area.

LAYOUT:

[1] "Read and Do" — "Read each sentence. Do it! Then tick the box."
    Four rows stacked vertically across the section. Each row has three cells side by side:
      Left cell:   ONE picture from the visual dictionary showing the boy doing the action.
      Middle cell: the sentence printed in large clear lowercase letters (capital "I" for
                   the pronoun, full stop at the end), nothing else.
      Right cell:  ONE small empty square tick-box (~10mm), left empty.
    Row 1:  [boy sitting cross-legged on striped mat]   "I sit."        ☐
    Row 2:  [boy tapping a table with motion arcs + Tap! tag]   "I tap."   ☐
    Row 3:  [boy gently patting the ginger cat on its head]    "I pat."   ☐
    Row 4:  [boy curled asleep on a small pillow with a tiny Z]   "I nap."   ☐
    Same row height across all four rows. Lots of vertical breathing room.

[2] "Read and Choose" — "Read the word. Tick the box under the right picture."
    Four rows stacked vertically. Each row has two regions side by side:
      Left region:   the word printed in large clear lowercase letters, nothing else.
      Right region:  TWO picture choices side by side. EACH picture sits in a soft rounded
                     outline box, with ONE small empty square tick-box (~9mm) directly
                     BELOW the picture, centred. Both tick-boxes start EMPTY — no tick
                     already drawn. The child ticks the box under the picture that matches
                     the word.
    Row 1:  "rat"  →  [rat picture] ☐    [cat picture] ☐
    Row 2:  "bat"  →  [bat picture] ☐    [mat picture] ☐
    Row 3:  "cat"  →  [cat picture] ☐    [rat picture] ☐
    Row 4:  "mat"  →  [mat picture] ☐    [bat picture] ☐
    Vary the position of the correct picture (sometimes left, sometimes right).
    All eight tick-boxes are the same size; all eight picture boxes are the same size.

VISUAL DICTIONARY (use exactly these meanings):
  boy = white British boy, brown hair, green-stripe t-shirt, blue trousers; PURE BLACK
        DOT EYES (two solid black dots, no whites, no pupils).
  cat = fat friendly ginger cat from the story; PURE BLACK DOT EYES.
  boy sitting = boy sitting cross-legged on the striped story mat
  boy tapping = boy (or just his hand) tapping a table with 2-3 motion arcs and a
                tiny "Tap!" speech-tag — NEVER a water tap
  boy patting cat = boy bending slightly, one open hand resting gently on the ginger
                    cat's head. Cat is sitting upright next to him.
  boy napping = boy curled on his side on a small pillow, eyes closed (two simple
                closed-eye curves), small "Z" floating above his head
  rat = small grey cartoon rat, long pink tail, side view; PURE BLACK DOT EYES
  bat = small flying bat with spread wings, side view; PURE BLACK DOT EYES
  mat = the striped story mat (no character on it), rectangular, viewed from above
"""


WORKSHEET_4_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "4. Alien Word Mission"   Level chip: "Level 1 · SATPIN"   Book chip: "Tap! Tap! Tap!"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Do not copy their content. Match this overall look.
- Image 6: tracing/handwriting style reference (keep style if any letters appear).
- Images 7-8: CHARACTER references — the boy and the ginger cat from the book.
  The boy appears in the banner roundel; he must match these refs: brown hair, green-stripe
  t-shirt, blue trousers. PURE BLACK DOT EYES on the boy and on every alien character on
  the page — two small solid black dots, no whites, no pupils, no sparkle highlights.

FIVE RULES — follow all five:
1. ONLY TWO activities on this page (§1 and §2). Each fills roughly half the page below
   the banner. Big, airy, generous white space. NO reward stars on the sections. NO
   bottom "colour the stars" strip. NO row of stars anywhere.
2. The page theme is OUTER-SPACE fun: friendly cartoon aliens (purple, green, or teal
   blob-shaped aliens, two stubby legs, one or two antennae with little balls on top,
   PURE BLACK DOT EYES, simple smile). Aliens are small and decorative — they hold or
   sit next to the alien words. Optional: tiny stars/planets in the background of §1
   only, very faint, do not crowd the words.
3. Only these letters/words may appear anywhere on the page: s a t p i n, and these
   exact word strings: sit, tap, pan, pin (REAL words from the story/SATPIN), and tas,
   pim, nas, tib, pis, sib (ALIEN nonsense words). No other letters or words. No
   punctuation other than the question-mark in the section title.
4. Every printed letter must be lowercase, single-storey a, no serifs, clearly readable.
   Letters in tick-boxes / table cells sit cleanly on an implicit baseline.
5. Top banner pink (#E84B8A) with title, two chips top-right (Level 1 · SATPIN and
   Tap! Tap! Tap!), and a small roundel of the boy + ginger cat top-left. Footer left
   (grey, 9pt): "MyPhonicsBooks · decodable phonics practice". Footer right (grey, 9pt):
   "Worksheet 4 of 5".

LAYOUT:

[1] "Read the Alien Words" — "Read each alien word out loud."
    Six alien words shown in a 3-columns x 2-rows grid (six cards total). Each card is
    a soft rounded pink-outlined box (~50mm wide, ~30mm tall) containing:
      - one cute small alien cartoon to the LEFT (different colour each card: purple,
        teal, lime, pink, orange, blue) holding a little flag or speech bubble
      - the alien WORD printed large in the centre/right of the card in clear lowercase
    Card 1: alien + word  tas
    Card 2: alien + word  pim
    Card 3: alien + word  nas
    Card 4: alien + word  pis
    Card 5: alien + word  tib
    Card 6: alien + word  sib
    Same card size across all six. Generous spacing. EVERY alien has pure black dot eyes.

[2] "Real or Alien?" — "Read each word. Tick Real or Alien."
    A simple table with THREE columns and a header row plus six body rows.
    Header row (small pink banner across the top of the table):
      | Word | Real | Alien |
    Body rows — each row: word in left column, ONE empty tick-box centred in the Real
    column, ONE empty tick-box centred in the Alien column. All twelve tick-boxes are
    the same square size (~9mm), all start EMPTY (no tick already drawn).
      Row 1:  sit  | ☐ | ☐
      Row 2:  tas  | ☐ | ☐
      Row 3:  tap  | ☐ | ☐
      Row 4:  pim  | ☐ | ☐
      Row 5:  pan  | ☐ | ☐
      Row 6:  tib  | ☐ | ☐
    Rows are evenly spaced. Pink-outlined cell borders, white background.

VISUAL DICTIONARY:
  alien = small friendly cartoon space alien — round or blob body in bright colour
          (purple/teal/lime/pink/orange/blue), two stubby legs, one or two thin antennae
          each topped with a small ball, a simple smile, TWO PURE BLACK DOT EYES.
          No whites of the eyes. No pupils. No sparkles.
  boy = white British boy, brown hair, green-stripe t-shirt, blue trousers; PURE BLACK
        DOT EYES.
  cat = fat friendly ginger cat from the story; PURE BLACK DOT EYES.
"""


WORKSHEET_5_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "5. Story and Draw"   Level chip: "Level 1 · SATPIN"   Book chip: "Tap! Tap! Tap!"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Do not copy their content. Match this overall look.
- Image 6: handwriting style reference (not used here, keep general style consistent).
- Images 7-8: CHARACTER references — the boy and the ginger cat from the book.
  The boy appears in the banner roundel AND in every story-scene picture in §1. He MUST
  match these refs: brown hair, green-stripe t-shirt, blue trousers. The cat MUST match
  the ginger cat from page 5 (fluffy, friendly, ginger).
  EYE STYLE on every face on the page: TWO SMALL PURE BLACK SOLID DOTS only. No whites,
  no pupils, no irises, no eyelashes, no sparkle highlights.

FIVE RULES — follow all five:
1. ONLY TWO activities on this page (§1 and §2). §1 takes about 55% of the page below the
   banner, §2 takes about 45%. Big, airy, generous white space. NO reward stars on the
   sections. NO bottom "colour the stars" strip. NO row of stars anywhere.
2. NEVER draw a water tap. Any tapping in the story scenes shows the boy or his hand
   tapping a surface with 2-3 motion arcs.
3. No text on the page except: section titles, section instructions, footer text, banner
   chips, and the four small empty number boxes in §1. NO sentences anywhere on this page.
4. The four story scenes in §1 must be drawn in SCRAMBLED order on the page (not 1-2-3-4
   in left-to-right reading order). The actual story order is given in the layout below;
   the on-page positions are deliberately mixed so the child has a real ordering task.
5. Top banner pink (#E84B8A) with title, two chips top-right (Level 1 · SATPIN and
   Tap! Tap! Tap!), and a small roundel of the boy + ginger cat top-left. Footer left
   (grey, 9pt): "MyPhonicsBooks · decodable phonics practice". Footer right (grey, 9pt):
   "Worksheet 5 of 5".

LAYOUT:

[1] "Story Order" — "Look at the pictures. Write 1, 2, 3 or 4 to put the story in order."
    Four story-scene cards arranged in a 2-columns x 2-rows grid (four cards total).
    Each card is a soft rounded pink-outlined box containing:
      - the scene illustration filling the box (warm storybook-style colour)
      - directly BELOW each picture, ONE small empty square number-box (~12mm) outlined
        in pink, centred. The boxes start EMPTY — no number already written inside.

    The four scenes (the child must put them in this STORY order — but they appear on
    the page in the SCRAMBLED layout positions below):

      Story moment 1 — boy sitting cross-legged on his striped mat at home, hand cupped
                       to his ear, listening, small "Tap! Tap!" sound tag near the wall.
      Story moment 2 — boy looking puzzled, with two small thought bubbles above his
                       head: one showing a small grey rat, the other showing a small
                       flying bat. Hand on chin.
      Story moment 3 — boy reaching out and tapping the wall/door with his hand, motion
                       arcs around the hand, a small "Tap!" tag.
      Story moment 4 — boy gently patting the fat ginger cat's head, cat sitting beside
                       him looking happy with closed-eye smile.

    Scrambled on-page positions:
      Top-left:    story moment 3 (the tapping scene)
      Top-right:   story moment 1 (sitting on mat, listening)
      Bottom-left: story moment 4 (patting the cat)
      Bottom-right: story moment 2 (thought bubbles of rat and bat)

    All four card sizes equal. All four number-boxes equal. Boy + cat appearance
    consistent across cards (same brown hair, green-stripe tee, blue trousers; same
    ginger cat).

[2] "Draw the Ending" — "Draw the boy and the cat at the end of the story."
    One LARGE rectangular drawing box that fills the section width, soft pink-outlined,
    white interior, no grid, no example drawing inside, no extra labels. In the very
    bottom-left CORNER of the box, faintly suggest the striped story mat (a small thin
    rectangle in pale pink and cream stripes) — leave the rest of the box empty for the
    child to draw.

VISUAL DICTIONARY:
  boy = white British boy, brown hair, green-stripe t-shirt, blue trousers; PURE BLACK
        DOT EYES.
  cat = fat friendly ginger cat from the story; PURE BLACK DOT EYES.
  mat = striped pink/cream rectangular floor mat from the story
  rat = small grey cartoon rat; PURE BLACK DOT EYES; shown inside a small thought bubble
  bat = small flying bat with spread wings; PURE BLACK DOT EYES; shown inside a small
        thought bubble
"""


SOUND_S_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  s"   Left chip: "Level 1"   Right chip: "Sound · s"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline). Letters sit DIRECTLY on the baseline.

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. NO boy. NO cat. Pure handwriting +
word-writing practice for the sound /s/. Lowercase only — no uppercase letters anywhere.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18% of page, §2 ~52%, §3 ~22%.
   Big, airy, generous white space. NO reward stars on sections. NO bottom star strip.
   NO row of stars anywhere. NO stroke-direction arrows, NO numbered stroke order,
   NO start/end coloured dots — just clean dotted letters to trace.
2. Only these letters/words may appear anywhere on the page: lowercase s; the §2 words
   sun, sit, sock, six, soap; and the §3 word fragments _nake, _tar, _eal, _pider
   (with a blank space where the s goes). NO uppercase S. No other letters or words
   anywhere.
3. Every printed letter on the page must sit DIRECTLY on the baseline (touching it, not
   floating above). Lowercase s is single-storey, no serifs. Every handwriting strip has
   the full 3-zone guide lines (solid baseline, dashed midline, faint dotted topline).
4. NO cartoon faces, animals, or characters on this page — only object pictures (sun,
   sock, soap, the numeral 6 for "six", a chair-and-child silhouette for "sit"). The
   sun is the only element with a face; it gets TWO SMALL PURE BLACK SOLID DOT EYES
   only — no whites, no pupils, no sparkles. Nothing else has eyes.
5. Top banner pink (#E84B8A) with title "The Sound  s" and two small chips top-right:
   "Level 1" and "Sound · s". On the left of the banner: one small white circular badge
   containing a clean lowercase "s" in pink — no arrows, no dots, just the letter.
   Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · s".

LAYOUT:

[1] "Trace the Letter s" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    The strip reads: ONE solid dark lowercase model s on the left, then EIGHT dotted-grey
    trace copies of lowercase s evenly spaced across the strip, then the rest of the
    strip is BLANK ruled space (3-zone guide lines continue) for the child to write more
    s's on their own. Lowercase only — no uppercase S anywhere.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells side
    by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word — see visual
                                dictionary. Pictures only, no labels under them.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word written
                                ONCE as a dotted-grey trace word for the child to trace.
                                Lowercase letters, single-storey a, no serifs, every
                                letter sitting on the baseline.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY (just
                                the baseline, dashed midline, dotted topline) — for the
                                child to write the word again on their own.
    Row 1:  [sun picture]   sun    [empty strip]
    Row 2:  [sit picture]   sit    [empty strip]
    Row 3:  [sock picture]  sock   [empty strip]
    Row 4:  [six picture]   six    [empty strip]
    Row 5:  [soap picture]  soap   [empty strip]

[3] "Write the Missing s" — "What letter is missing? Write the s."
    FOUR cells in a single horizontal row across the section. The four pictures in §3
    MUST be different from the five pictures in §2 (no sun, no sit, no sock, no six,
    no soap). Use the four §3-only pictures listed below. Each cell contains:
      - ONE small picture from the visual dictionary at the top of the cell
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        with the initial s REPLACED by a blank space the same width as a letter. The
        rest of the word is solid black. The blank space is just empty ruled lines
        (NOT a dotted s, NOT an underscore — just empty) where the child writes the s.
    Cell 1:  [snake picture]   _nake    ←   child writes "s" in the blank to make "snake"
    Cell 2:  [star picture]    _tar     ←   child writes "s" to make "star"
    Cell 3:  [seal picture]    _eal     ←   child writes "s" to make "seal"
    Cell 4:  [spider picture]  _pider   ←   child writes "s" to make "spider"
    All four cells the same size. All four blanks the same width. The 3-zone guide
    lines run continuously through the blank and under the rest of the word.

VISUAL DICTIONARY (use exactly these meanings):
  sun   = smiling cartoon sun with simple rays; TWO SMALL PURE BLACK SOLID DOT EYES,
          small smile
  sit   = simple cartoon of a child SITTING on a small wooden chair, side view,
          minimal face (only two small black dot eyes if any) — purely to illustrate
          the action of sitting
  sock  = a single child's sock, side view, with a colourful stripe pattern
  six   = the numeral "6" drawn LARGE and friendly in pink (this represents the WORD
          "six")
  soap  = a rectangular bar of soap with a few small bubbles floating above it
  snake = friendly cartoon green snake, gently coiled, smiling, no fangs; TWO SMALL
          PURE BLACK SOLID DOT EYES
  star  = a single gold/yellow five-pointed star, simple sparkle accent, no face
  seal  = cute grey cartoon seal sitting upright with both flippers; small whiskers;
          TWO SMALL PURE BLACK SOLID DOT EYES, small smile
  spider = friendly cartoon spider with a round black body and eight thin legs evenly
          arranged, small smile, hanging from a tiny thread above its head; TWO
          SMALL PURE BLACK SOLID DOT EYES
"""


SOUND_A_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  a"   Left chip: "Level 1"   Right chip: "Sound · a"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline). Letters sit DIRECTLY on the baseline.

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. NO boy. NO cat. Pure handwriting +
word-writing practice for the SHORT /a/ sound (as in "ant", "apple"). Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18% of page, §2 ~52%, §3 ~22%.
   Big, airy, generous white space. NO reward stars on sections. NO bottom star strip.
   NO stroke-direction arrows, NO numbered stroke order, NO start/end coloured dots —
   just clean dotted letters to trace.
2. Only these letters/words may appear anywhere on the page: lowercase a (single-storey,
   no two-storey); the §2 words cat, mat, hat, bag, pan; and the §3 word fragments
   _nt, _xe, r_t, j_m (mix of START and MIDDLE position for the missing a). NO uppercase
   A. No other letters or words anywhere.
3. Every printed letter on the page must sit DIRECTLY on the baseline (touching it, not
   floating above). Single-storey 'a' throughout — the form that looks like an o with a
   vertical line on the right — NO two-storey 'a'. Every handwriting strip uses full
   3-zone guide lines.
4. Every cartoon face on the page has TWO SMALL PURE BLACK SOLID DOT EYES only — no
   whites, no pupils, no sparkle highlights. The cat, rat, ant have pure black dot
   eyes; the mat, hat, bag, pan, jam, axe have no faces and no eyes.
5. Top banner pink (#E84B8A) with title "The Sound  a" and two small chips top-right:
   "Level 1" and "Sound · a". On the left of the banner: one small white circular badge
   containing a clean single-storey lowercase "a" in pink — no arrows, no dots, just
   the letter. Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · a".

LAYOUT:

[1] "Trace the Letter a" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    Reads: ONE solid dark lowercase model a on the left, then EIGHT dotted-grey trace
    copies of lowercase a evenly spaced across the strip, then the rest of the strip
    is BLANK ruled space (3-zone guide lines continue) for the child to write more
    a's on their own. Lowercase single-storey only.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells
    side by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word — see visual
                                dictionary. Pictures only, no labels under them.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word written
                                ONCE as a dotted-grey trace word for the child to
                                trace. Lowercase, single-storey a, no serifs.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY for
                                the child to write the word again on their own.
    These are CVC words with the short /a/ sound IN THE MIDDLE — chosen so the child
    can sound them out (consonant-vowel-consonant), not just trace them visually.
    Row 1:  [cat picture]   cat   [empty strip]
    Row 2:  [mat picture]   mat   [empty strip]
    Row 3:  [hat picture]   hat   [empty strip]
    Row 4:  [bag picture]   bag   [empty strip]
    Row 5:  [pan picture]   pan   [empty strip]

[3] "Write the Missing a" — "What letter is missing? Write the a."
    FOUR cells in a single horizontal row across the section. The four pictures in §3
    MUST be different from the five in §2 (no cat, no mat, no hat, no bag, no pan).
    The blank position VARIES — 2 cells have a missing at the START of the word,
    2 cells have a missing in the MIDDLE of the word.
    Each cell contains:
      - ONE small picture from the visual dictionary at the top of the cell
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        with the letter a REPLACED by a blank space the same width as a letter. The
        other letters are solid black. The blank is empty ruled lines (NOT a dotted a,
        NOT an underscore) where the child writes the a.
    Cell 1:  [ant picture]   _nt   ←   blank at START. Child writes "a" to make "ant"
    Cell 2:  [axe picture]   _xe   ←   blank at START. "axe"
    Cell 3:  [rat picture]   r_t   ←   blank in MIDDLE. "rat"
    Cell 4:  [jam picture]   j_m   ←   blank in MIDDLE. "jam"
    All four cells the same size. All four blanks the same width. The 3-zone guide
    lines run continuously across each entire strip (through the blank and under the
    rest of the word).

VISUAL DICTIONARY (use exactly these meanings):
  cat = friendly cartoon ginger cat sitting upright, fluffy round face; TWO PURE BLACK
        SOLID DOT EYES, small smile
  mat = a small rectangular floor mat with simple stripes (pink/cream), viewed
        slightly from above; no face
  hat = a classic child's sun hat or party hat — simple, side view; no face
  bag = a small school bag or shopping bag with a handle, viewed side-on; no face
  pan = a cooking pan, side view, with a black handle on the right; no face
  ant = small cute cartoon ant with three rounded body segments — HEAD at the front
        (left), abdomen at the back (right), antennae growing from the TOP OF THE HEAD,
        six legs, friendly smile; TWO PURE BLACK SOLID DOT EYES. NEVER antennae on
        the rear.
  axe = a small wood-handled axe (hatchet), side view, with a grey metal axe-head; no
        face
  rat = small grey cartoon rat with a long pink tail, side view, friendly cute style;
        TWO PURE BLACK SOLID DOT EYES, small smile
  jam = a small clear jar of red jam with a chequered or striped lid; do NOT print
        the word "jam" inside the picture
"""


SOUND_T_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  t"   Left chip: "Level 1"   Right chip: "Sound · t"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline). Letters sit DIRECTLY on the baseline.

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. NO boy. NO cat. Pure handwriting +
word-writing practice for the /t/ sound. Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18% of page, §2 ~52%, §3 ~22%.
   Big, airy, generous white space. NO reward stars on sections. NO bottom star strip.
   NO stroke-direction arrows, NO numbered stroke order, NO start/end coloured dots.
2. Only these letters/words may appear anywhere on the page: lowercase t; the §2 words
   tap, ten, tin, pot, nut; and the §3 word fragments _op, ha_, ma_, ne_ (with a blank
   where the t goes — position varies: START or END). NO uppercase T. No other letters
   or words anywhere.
3. Every printed letter on the page must sit DIRECTLY on the baseline (touching it, not
   floating above). Lowercase t with a small horizontal crossbar at x-height. Every
   handwriting strip uses full 3-zone guide lines. The 't' ascender rises above the
   dashed midline toward the dotted topline.
4. CRITICAL: the word "tap" in §2 means the ACTION of tapping — show a hand tapping a
   table/surface with 2-3 small motion arcs and a tiny "Tap!" speech tag. NEVER draw a
   water tap. Every cartoon face on the page has TWO SMALL PURE BLACK SOLID DOT EYES
   only — no whites, no pupils, no sparkle highlights. The hand picture (no face), pot,
   nut, top, hat, mat, net all have no faces; only the optional small smile on the
   hand or any embellishment with eyes uses pure black dots.
5. Top banner pink (#E84B8A) with title "The Sound  t" and two small chips top-right:
   "Level 1" and "Sound · t". On the left of the banner: one small white circular badge
   containing a clean lowercase "t" in pink — no arrows, no dots, just the letter.
   Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · t".

LAYOUT:

[1] "Trace the Letter t" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    Reads: ONE solid dark lowercase model t on the left, then EIGHT dotted-grey trace
    copies of lowercase t evenly spaced across the strip, then the rest of the strip
    is BLANK ruled space (3-zone guide lines continue) for the child to write more
    t's on their own.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells
    side by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word — see visual
                                dictionary. Pictures only, no labels under them.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word written
                                ONCE as a dotted-grey trace word for the child to trace.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY for the
                                child to write the word again on their own.
    These are CVC words mixing /t/ at the START and at the END so the child sees the
    sound in different positions:
    Row 1:  [tap picture]   tap   [empty strip]   ←   t at START (hand tapping action)
    Row 2:  [ten picture]   ten   [empty strip]   ←   t at START (the numeral 10)
    Row 3:  [tin picture]   tin   [empty strip]   ←   t at START (food tin can)
    Row 4:  [pot picture]   pot   [empty strip]   ←   t at END (cooking pot)
    Row 5:  [nut picture]   nut   [empty strip]   ←   t at END (a walnut/peanut)

[3] "Write the Missing t" — "What letter is missing? Write the t."
    FOUR cells in a single horizontal row across the section. The four pictures in §3
    MUST be different from the five in §2 (no tap, no ten, no tin, no pot, no nut).
    The blank position VARIES — 1 cell has t at the START, 3 cells have t at the END.
    Each cell contains:
      - ONE small picture from the visual dictionary at the top of the cell
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        with one letter t REPLACED by a blank space the same width as a letter. The
        other letters are solid black. The blank is empty ruled lines (NOT a dotted t,
        NOT an underscore) where the child writes the t.
    Cell 1:  [top picture]   _op   ←   blank at START. Child writes "t" to make "top"
    Cell 2:  [hat picture]   ha_   ←   blank at END. "hat"
    Cell 3:  [mat picture]   ma_   ←   blank at END. "mat"
    Cell 4:  [net picture]   ne_   ←   blank at END. "net"
    All four cells the same size. All four blanks the same width.

VISUAL DICTIONARY (use exactly these meanings):
  tap = a cartoon hand (no face) tapping a small wooden table or surface from above,
        index finger pointing down onto the surface, 2-3 small motion arcs near the
        fingertip, a tiny "Tap!" speech-tag floating above. NEVER a water tap (faucet).
  ten = the numeral "10" drawn LARGE and friendly in pink — clearly the number ten,
        which represents the WORD "ten"
  tin = a food tin can, side view, clean blank label area (NO printed text on the
        label), small ring-pull or simple lid
  pot = a black/dark grey cooking pot with two small handles on the sides, simple
        side view, a small wisp of steam optional
  nut = a walnut or hazelnut — a brown nut with a textured shell, single view, no face
  top = a spinning top toy — colourful (pink/blue stripes) with a pointed tip and a
        small wooden peg on top, side view
  hat = a classic child's sun hat OR a small wizard's/party hat, simple side view;
        clearly recognisable as a hat
  mat = a small rectangular floor mat with simple stripes (pink/cream), viewed
        slightly from above
  net = a small hand net (butterfly/fish net) with a wooden handle and a blue hoop
        with fine mesh
"""


SOUND_P_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  p"   Left chip: "Level 1"   Right chip: "Sound · p"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline).

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. Pure handwriting + word-writing practice
for the /p/ sound. Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18%, §2 ~52%, §3 ~22%. Big, airy,
   generous white space. NO reward stars on sections. NO bottom star strip.
2. Only these letters/words may appear anywhere on the page: lowercase p; the §2 words
   pan, pen, pin, cup, map; and the §3 word fragments _ig, ca_, mo_, li_ (with a blank
   where the p goes — position varies: START or END). NO uppercase P. No other letters
   or words.
3. Lowercase p has a DESCENDER — its round body sits ON the baseline, and its vertical
   tail drops cleanly BELOW the baseline. The body's top reaches the dashed midline.
   Every printed letter must sit DIRECTLY on the baseline (touching it, not floating
   above). Every handwriting strip uses full 3-zone guide lines.
4. Every cartoon face on the page has TWO SMALL PURE BLACK SOLID DOT EYES only — no
   whites, no pupils, no sparkle highlights. The pig has pure black dot eyes; the pan,
   pen, pin, cup, map, cap, mop have no faces. The lip is a smiling mouth shape with
   no eyes.
5. Top banner pink (#E84B8A) with title "The Sound  p" and two small chips top-right:
   "Level 1" and "Sound · p". On the left of the banner: one small white circular badge
   containing a clean lowercase "p" in pink (with its descender visible) — no arrows,
   no dots, just the letter. Footer left (grey, 9pt):
   "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · p".

LAYOUT:

[1] "Trace the Letter p" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    Reads: ONE solid dark lowercase model p on the left, then EIGHT dotted-grey trace
    copies of lowercase p evenly spaced across the strip, then the rest of the strip
    is BLANK ruled space (3-zone guide lines continue) for the child to write more
    p's on their own. The descender of every p drops cleanly below the baseline.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells
    side by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word as a
                                dotted-grey trace word for the child to trace.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY for the
                                child to write the word again.
    These are CVC words mixing /p/ at the START and at the END so the child sees the
    sound in different positions:
    Row 1:  [pan picture]   pan   [empty strip]   ←   p at START (cooking pan)
    Row 2:  [pen picture]   pen   [empty strip]   ←   p at START (ballpoint pen)
    Row 3:  [pin picture]   pin   [empty strip]   ←   p at START (drawing pin)
    Row 4:  [cup picture]   cup   [empty strip]   ←   p at END (a teacup or mug)
    Row 5:  [map picture]   map   [empty strip]   ←   p at END (a folded map)

[3] "Write the Missing p" — "What letter is missing? Write the p."
    FOUR cells in a single horizontal row across the section. Pictures MUST be different
    from §2 (no pan, pen, pin, cup, map). Blank position varies — 1 START + 3 END.
    Each cell contains:
      - ONE small picture from the visual dictionary at the top
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        one letter p REPLACED by a blank space the same width as a letter. The blank
        is empty ruled lines (NOT a dotted p, NOT an underscore) where the child
        writes the p.
    Cell 1:  [pig picture]   _ig   ←   blank at START. Child writes "p" to make "pig"
    Cell 2:  [cap picture]   ca_   ←   blank at END. "cap"
    Cell 3:  [mop picture]   mo_   ←   blank at END. "mop"
    Cell 4:  [lip picture]   li_   ←   blank at END. "lip"
    All four cells the same size. All four blanks the same width.

VISUAL DICTIONARY (use exactly these meanings):
  pan = a cooking pan with a black handle on the right, side view
  pen = a single ballpoint pen with a coloured barrel and a small clip at one end
  pin = a red drawing pin (push-pin) viewed at an angle — red dome head, grey metal
        shaft pointing down
  cup = a simple teacup with a handle on the right (no saucer), side view
  map = a folded paper map showing a small treasure-island outline OR a simple
        country shape with a few colour blocks; NO printed text on the map
  pig = a friendly cute cartoon pig with a round pink body, small curly tail, small
        snout with two nostril dots, two small ears; TWO PURE BLACK SOLID DOT EYES
  cap = a children's baseball cap, side view, with a curved peak (visor) at the front
        and a small button on top. Colourful (red, blue or pink). Clearly a cap — NOT
        a hat with a brim all the way round, NOT a beanie
  mop = a household mop with a wooden/yellow handle and a fluffy white/grey mop head
        at the bottom, side view
  lip = a single smiling mouth shape — pink lips drawn from the front, showing a happy
        curve; no teeth shown; no eyes
"""


SOUND_I_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  i"   Left chip: "Level 1"   Right chip: "Sound · i"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline).

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. Pure handwriting + word-writing practice
for the SHORT /i/ sound (as in "pig", "sit"). Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18%, §2 ~52%, §3 ~22%. Big, airy,
   generous white space. NO reward stars on sections. NO bottom star strip.
2. Only these letters/words may appear anywhere on the page: lowercase i; the §2 words
   pig, bib, sit, lid, six; and the §3 word fragments b_n, f_n, k_t, w_g (with a blank
   where the i goes — the blank is always in the MIDDLE of each word because /i/ is a
   vowel and naturally sits in the middle of CVCs). NO uppercase I. No other letters
   or words anywhere.
3. Lowercase i SIZING (binding): the vertical stroke is SHORT — it starts on the solid
   baseline and reaches up ONLY to the dashed midline (x-height). The stroke is the
   SAME height as the body of x-height letters like s, a, n, c. The stroke MUST NOT
   reach the dotted topline. A small dot floats ABOVE the stroke, sitting roughly
   halfway between the midline and the topline. The total visual height (stroke + dot)
   is noticeably SHORTER than ascender letters like b, d, h, l, t. Every i sits DIRECTLY
   on the baseline (touching it, not floating). Every handwriting strip uses full
   3-zone guide lines.
4. Every cartoon face on the page has TWO SMALL PURE BLACK SOLID DOT EYES only — no
   whites, no pupils, no sparkle highlights. The pig has pure black dot eyes; the
   bib, lid, six, bin, fin, kit, wig have no faces. The sit picture is a small cartoon
   child silhouette sitting on a chair, minimal face with two black dots for eyes.
5. Top banner pink (#E84B8A) with title "The Sound  i" and two small chips top-right:
   "Level 1" and "Sound · i". On the left of the banner: one small white circular badge
   containing a clean lowercase "i" in pink (with its dot visible) — no arrows, no
   stroke-order dots, just the letter. Footer left (grey, 9pt):
   "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · i".

LAYOUT:

[1] "Trace the Letter i" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    Reads: ONE solid dark lowercase model i on the left, then EIGHT dotted-grey trace
    copies of lowercase i evenly spaced across the strip, then the rest of the strip
    is BLANK ruled space (3-zone guide lines continue) for the child to write more
    i's on their own. Every i has a small dot above the vertical stroke.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells
    side by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word as a
                                dotted-grey trace word for the child to trace.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY for the
                                child to write the word again.
    These are CVC words with the short /i/ in the MIDDLE — child can sound them out:
    Row 1:  [pig picture]   pig   [empty strip]   ←   pink cartoon pig
    Row 2:  [bib picture]   bib   [empty strip]   ←   baby's bib
    Row 3:  [sit picture]   sit   [empty strip]   ←   child sitting on a chair
    Row 4:  [lid picture]   lid   [empty strip]   ←   a jar with its lid on
    Row 5:  [six picture]   six   [empty strip]   ←   the numeral "6"

[3] "Write the Missing i" — "What letter is missing? Write the i."
    FOUR cells in a single horizontal row across the section. Pictures MUST be different
    from §2 (no pig, bib, sit, lid, six). Each cell contains:
      - ONE small picture from the visual dictionary at the top
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        the middle letter i REPLACED by a blank space the same width as a letter. The
        first and last letters are solid black. The blank is empty ruled lines (NOT a
        dotted i, NOT an underscore) where the child writes the i.
    Cell 1:  [bin picture]   b_n   ←   blank in MIDDLE. "bin"
    Cell 2:  [fin picture]   f_n   ←   blank in MIDDLE. "fin"
    Cell 3:  [kit picture]   k_t   ←   blank in MIDDLE. "kit"
    Cell 4:  [wig picture]   w_g   ←   blank in MIDDLE. "wig"
    All four cells the same size. All four blanks the same width.

VISUAL DICTIONARY (use exactly these meanings):
  pig = friendly cute cartoon pig with a round pink body, small curly tail, small
        snout with two nostril dots, two small ears; TWO PURE BLACK SOLID DOT EYES
  bib = a baby's bib with a simple stripe or polka-dot pattern and a small fastener
        at the neck, front view; no face
  sit = simple cartoon of a child sitting on a small wooden chair, side view, simple
        clothing (t-shirt + shorts), TWO PURE BLACK DOT EYES, small smile
  lid = a small glass jar with a screw-on lid sitting on top, side view; the lid is
        the prominent feature; no face
  six = the numeral "6" drawn LARGE and friendly in pink (this represents the WORD
        "six")
  bin = a small rubbish/recycling bin with a hinged lid, side view, a small handle
        on top; no face
  fin = a single shark or fish fin sticking out of a wavy water line; the fin is
        triangular and grey/blue; no face
  kit = a small white first-aid kit case (rectangular box) with a clear RED CROSS
        on the front and a small handle on top, side or front view; no face
  wig = a curly cartoon wig (a hairpiece), side view, bushy/curly with no head
        underneath — just the wig itself; bright colour (e.g. brown or red); no face
"""


SOUND_N_PROMPT = """Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  n"   Left chip: "Level 1"   Right chip: "Sound · n"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline).

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. Pure handwriting + word-writing practice
for the /n/ sound. Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18%, §2 ~52%, §3 ~22%. Big, airy,
   generous white space. NO reward stars on sections. NO bottom star strip.
2. Only these letters/words may appear anywhere on the page: lowercase n; the §2 words
   net, nap, nut, pen, can; and the §3 word fragments a_t, su_, te_, fa_ (with a blank
   where the n goes — position varies: MIDDLE or END). NO uppercase N. No other letters
   or words.
3. Lowercase n is an x-height letter — its arch sits in the middle zone, body resting
   ON the baseline and top of the arch reaching the dashed midline. NO ascender, NO
   descender. Every printed letter must sit DIRECTLY on the baseline (touching it, not
   floating above). Every handwriting strip uses full 3-zone guide lines.
4. Every cartoon face on the page has TWO SMALL PURE BLACK SOLID DOT EYES only — no
   whites, no pupils, no sparkle highlights. The ant and sun have pure black dot eyes;
   the net, nap-scene, nut, pen, can, ten, fan have no faces.
5. Top banner pink (#E84B8A) with title "The Sound  n" and two small chips top-right:
   "Level 1" and "Sound · n". On the left of the banner: one small white circular badge
   containing a clean lowercase "n" in pink — no arrows, no dots, just the letter.
   Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
   Footer right (grey, 9pt): "Single Sound · n".

LAYOUT:

[1] "Trace the Letter n" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    Reads: ONE solid dark lowercase model n on the left, then EIGHT dotted-grey trace
    copies of lowercase n evenly spaced across the strip, then the rest of the strip
    is BLANK ruled space (3-zone guide lines continue) for the child to write more
    n's on their own. Every n is an x-height letter — body on baseline, top of arch
    reaching the midline, NO ascender.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells
    side by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word as a
                                dotted-grey trace word for the child to trace.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY for the
                                child to write the word again.
    These are CVC words mixing /n/ at the START and at the END so the child sees the
    sound in different positions:
    Row 1:  [net picture]   net   [empty strip]   ←   n at START (butterfly net)
    Row 2:  [nap picture]   nap   [empty strip]   ←   n at START (a small child napping)
    Row 3:  [nut picture]   nut   [empty strip]   ←   n at START (a walnut)
    Row 4:  [pen picture]   pen   [empty strip]   ←   n at END (a ballpoint pen)
    Row 5:  [can picture]   can   [empty strip]   ←   n at END (a soup tin/can)

[3] "Write the Missing n" — "What letter is missing? Write the n."
    FOUR cells in a single horizontal row across the section. Pictures MUST be different
    from §2 (no net, nap, nut, pen, can). Blank position varies — 1 MIDDLE + 3 END.
    Each cell contains:
      - ONE small picture from the visual dictionary at the top
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        one letter n REPLACED by a blank space the same width as a letter. The blank
        is empty ruled lines (NOT a dotted n, NOT an underscore) where the child
        writes the n.
    Cell 1:  [ant picture]   a_t   ←   blank in MIDDLE. Child writes "n" to make "ant"
    Cell 2:  [sun picture]   su_   ←   blank at END. "sun"
    Cell 3:  [ten picture]   te_   ←   blank at END. "ten"
    Cell 4:  [fan picture]   fa_   ←   blank at END. "fan"
    All four cells the same size. All four blanks the same width.

VISUAL DICTIONARY (use exactly these meanings):
  net = a small butterfly/fish hand net with a wooden handle and a blue hoop with
        fine mesh, side view
  nap = a small cartoon child curled asleep on a small pillow with a tiny "Z" floating
        above their head, eyes closed (simple closed-eye curves); minimal face
  nut = a walnut or hazelnut — a brown nut with a textured shell, single view, no face
  pen = a single ballpoint pen with a coloured barrel and a small clip at one end,
        side view, no face
  can = a tin can / soup can, side view, blank label area (NO printed text on the
        label), small ring-pull or simple lid, no face
  ant = small cute cartoon ant with three rounded body segments — HEAD at the front
        with both antennae growing from the TOP OF THE HEAD, abdomen at the back. Six
        legs. TWO PURE BLACK SOLID DOT EYES. Friendly smile. NEVER antennae on the rear.
  sun = smiling cartoon sun with simple rays; TWO SMALL PURE BLACK SOLID DOT EYES,
        small smile
  ten = the numeral "10" drawn LARGE and friendly in pink (this represents the WORD
        "ten")
  fan = a small electric tabletop fan with a round mesh front and a stand, side view,
        no face
"""


# ============================================================
# LEVEL 1.2 — 'The Mud on the Dog' (focus sounds m d g o)
# Character set: British-Asian girl + golden retriever dog.
# ============================================================

L12_RULES_HEADER = """ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Match this overall look. Do not copy their content.
- Image 6: tracing-strip reference for the 3-zone handwriting guide style.
- Images 7-8: CHARACTER references — the British-Asian girl (curly black hair, red top,
  denim dungarees, blue wellies) and her golden retriever dog. ANY time the girl or the
  dog appears on this page (banner roundel and/or scenes) they MUST match these refs.
  EYE STYLE on every face on the page: TWO SMALL PURE BLACK SOLID DOTS only. NO whites,
  NO pupils, NO irises, NO eyelashes, NO sparkle highlights. Just two small black dots.

UNIVERSAL RULES:
- Banner pink (#E84B8A) at the top with the title on the left, TWO small chips top-right:
  "Level 1 · m d g o" and "The Mud on the Dog". Small roundel top-left of the BANNER
  showing the girl and the dog together (matching the character refs).
- Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
  Footer right (grey, 9pt): "Worksheet N of 5".
- NO reward stars on the sections. NO bottom "colour the stars" strip. NO row of stars
  anywhere on the page.
- "Tap" always means the ACTION of tapping (hand on surface, 2-3 motion arcs, tiny "Tap!"
  tag). NEVER draw a water tap.
- Strict letter inventory for L1.2: only the lowercase letters s a t p i n m d g o may
  appear in any printed word on the page. Tricky words allowed: the, to, I, no, go, me.
  NO 'u', NO 'b', NO 'e', NO 'h' or any other letter in any printed word. (Picture
  contents may be anything the visual dictionary specifies, since pictures are not read.)
- All letters lowercase, single-storey 'a', no serifs. Letters sit ON the baseline.
"""

WORKSHEET_1_L12_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "1. Sound Hunt: m d g o"

{L12_RULES_HEADER}

LAYOUT:

[1] "Say and Find" — "Circle the picture that starts with the sound."
    FOUR columns side by side, equal width: m | d | g | o.
    Each column has the lowercase letter at the top in a small pink rounded square,
    then THREE small pictures stacked beneath. The child circles the one that begins
    with that sound. One picture per column is the correct match; the other two are
    distractor pictures that do NOT start with that sound.
    Vary the vertical position of the correct picture across columns
    (top / middle / bottom / middle).

    Column m  (letter chip: m):
      pictures, top-to-bottom:  ant | mop | tap     (correct: mop = MIDDLE)
    Column d  (letter chip: d):
      pictures, top-to-bottom:  dog | pan | ink-pot (correct: dog = TOP)
    Column g  (letter chip: g):
      pictures, top-to-bottom:  pin | sit | gate    (correct: gate = BOTTOM)
    Column o  (letter chip: o):
      pictures, top-to-bottom:  net | octopus | tap (correct: octopus = MIDDLE)

    All twelve pictures cleanly drawn, well-spaced, unambiguous.

[2] "My New Sounds" — "Trace each new letter once. Then say its sound."
    A short horizontal pink-outlined strip below §1, containing the four NEW sounds
    laid out as tiles, left to right: m | d | g | o. Each tile contains one solid dark
    model lowercase letter sitting ON a solid baseline guide line inside the tile.
    NO tracing dots in this section — just clean model letters and the baseline.
    This is a SAY-AND-TOUCH warm-up, not a full handwriting strip (that comes in
    Worksheet 2).

VISUAL DICTIONARY (use exactly these meanings):
  ant       = cute cartoon ant with three rounded body segments, antennae on the HEAD
              (front segment), six legs, friendly smile, PURE BLACK DOT EYES.
  mop       = a string-headed mop with a wooden handle, head pointing DOWN, side view.
  tap       = a hand tapping a small table or mat, 2-3 motion arcs, tiny "Tap!" tag.
              NEVER a water tap.
  dog       = golden retriever puppy (matching the L1.2 dog character) sitting upright,
              tongue out, PURE BLACK DOT EYES.
  pan       = cooking pan side view, black handle on the right.
  ink-pot   = small open ink pot with a blue ink blob.
  pin       = red drawing pin / push-pin, point down.
  sit       = a small cartoon child sitting cross-legged on a mat (use the GIRL from
              the character refs).
  gate      = a simple wooden garden gate, closed, side view, two horizontal slats.
  net       = a small hand net with a wooden handle and a blue hoop with mesh.
  octopus   = a small cute cartoon octopus, eight legs, friendly smile, PURE BLACK
              DOT EYES, in a circle of bubbles.
  girl      = the British-Asian girl from the character refs (curly black hair, red
              top, denim dungarees, blue wellies); PURE BLACK DOT EYES.
"""

WORKSHEET_2_L12_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "2. Trace and Write: m d g o"

{L12_RULES_HEADER}

This worksheet is WRITING-FOCUSED. Pure letter-formation practice for the four NEW
sounds m d g o. Two long handwriting strips fill almost the whole page below the
banner. Children do NOT read words on this page — they trace letters.

LAYOUT:

Two long horizontal handwriting strips spanning the full width of the page below the
banner. A small "1" label sits to the LEFT of the first strip, a small "2" left of
the second.

Strip 1 contains the letters  m  d  in that order, left to right.
Strip 2 contains the letters  g  o  in that order, left to right.

For EACH letter in a strip:
  - first ONE SOLID dark model letter,
  - then 4 dotted-grey TRACE copies of the same letter following it, evenly spaced.

So Strip 1 reads visually as:   [m] m m m m   [d] d d d d
   Strip 2 reads visually as:   [g] g g g g   [o] o o o o

Both strips use full 3-zone guide lines running their entire length:
  solid BASELINE, dashed MIDLINE at x-height, faint dotted TOPLINE.

BASELINE COMPLIANCE (binding): the bottom edge of every letter body must sit flush ON
the solid baseline — touching it, not floating above it. The TOP of each letter's
x-height (the round body of m, d, g, o) must reach EXACTLY the dashed midline.

LETTER-SPECIFIC NOTES:
  m  body sits on baseline; x-height reaches midline; three legs straight down.
  d  round body sits on baseline; ascender rises ABOVE the midline toward the topline.
  g  round body sits on baseline; descender drops BELOW the baseline (open or closed
     loop tail, classroom-friendly single-storey style).
  o  perfectly round body, bottom on baseline, top on midline.
  No serifs. No fancy curls. Beginner-handwriting style throughout.

Bottom of the page (under Strip 2) leaves a single thin pink-outlined empty
"My Best Letter" box about 30mm tall × 80mm wide, centred, EMPTY — for the child
to write their best version of one letter. NO model letter inside.
"""

WORKSHEET_3_L12_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "3. Read and Do"

{L12_RULES_HEADER}

LAYOUT:

[1] "Read and Do" — "Read each sentence. Do the action! Then tick the box."
    Four rows stacked vertically across the section. Each row has three cells side
    by side:
      Left cell:   ONE picture from the visual dictionary showing the GIRL performing
                   the action described.
      Middle cell: the sentence printed in large clear lowercase letters (capital "I"
                   for the pronoun, full stop at the end). Nothing else.
      Right cell:  ONE small empty square tick-box (~10mm), left EMPTY.

    Row 1:  [girl tapping the dog gently on the head, motion arcs]  "Tap the dog."  ☐
    Row 2:  [girl patting the dog with one open hand on its back]   "Pat the dog."  ☐
    Row 3:  [girl gently nodding her head, small motion arcs]       "Nod at the dog." ☐
    Row 4:  [girl sitting cross-legged on a striped floor mat]      "Sit on the mat." ☐

    Same row height across all four rows. Lots of vertical breathing room.
    Sentences must be EXACTLY as written above — no commas, no exclamation marks,
    no extra words.

[2] "Pick the Word" — "Read the word. Tick the box under the right picture."
    Four rows stacked vertically. Each row has two regions side by side:
      Left region:   the word printed in large clear lowercase letters, nothing else.
      Right region:  TWO picture choices side by side. Each picture sits in a soft
                     rounded pink-outlined box, with ONE small empty square tick-box
                     (~9mm) directly BELOW the picture, centred. Both tick-boxes
                     start EMPTY.

    Row 1:  "dog"  →  [dog picture] ☐    [mop picture] ☐
    Row 2:  "mop"  →  [pan picture] ☐    [mop picture] ☐
    Row 3:  "pan"  →  [tin picture] ☐    [pan picture] ☐
    Row 4:  "ant"  →  [ant picture] ☐    [dog picture] ☐

    Vary the position of the correct picture (sometimes left, sometimes right).
    All eight tick-boxes the same size; all eight picture boxes the same size.

VISUAL DICTIONARY:
  girl  = the British-Asian girl from the character refs (curly black hair, red top,
          denim dungarees, blue wellies); PURE BLACK DOT EYES.
  dog   = the golden retriever from the character refs; PURE BLACK DOT EYES.
  mop   = string-headed mop with wooden handle, head down, side view.
  pan   = cooking pan, side view, black handle on the right.
  tin   = food tin can, side view, blank label.
  ant   = cartoon ant with three body segments, antennae on the HEAD, six legs,
          friendly smile, PURE BLACK DOT EYES.
"""

WORKSHEET_4_L12_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "4. Alien Word Mission"

{L12_RULES_HEADER}

The page theme is OUTER-SPACE fun: friendly cartoon aliens (purple, green, teal, lime,
pink, orange blob-shaped aliens, two stubby legs, one or two antennae topped with
little balls, PURE BLACK DOT EYES, simple smile). Aliens are small and decorative —
they sit next to the alien words. Optional: tiny stars/planets faint in the §1
background, not crowding the words.

WORDS ON THE PAGE (strict — these and ONLY these, plus section titles/instructions):
  Real (decodable at L1.2):  dog, pat, dot, tin
  Alien (decodable nonsense at L1.2):  mog, dop, gop, dob, gid, pog

LAYOUT:

[1] "Read the Alien Words" — "Read each alien word out loud."
    Six alien words shown in a 3-columns x 2-rows grid (six cards total). Each card is
    a soft rounded pink-outlined box (~50mm wide, ~30mm tall) containing:
      - one cute small cartoon alien on the LEFT of the card (different colour each
        card: purple, teal, lime, pink, orange, blue) holding a little flag or speech
        bubble.
      - the ALIEN WORD printed large in clear lowercase on the centre/right of the card.

    Card 1: alien + word  mog
    Card 2: alien + word  dop
    Card 3: alien + word  gop
    Card 4: alien + word  dob
    Card 5: alien + word  gid
    Card 6: alien + word  pog

    Same card size across all six. EVERY alien has PURE BLACK DOT EYES.

[2] "Real or Alien?" — "Read each word. Tick Real or Alien."
    A simple table with THREE columns and a header row plus SIX body rows.
    Header row (small pink banner across the top of the table):
      | Word | Real | Alien |
    Body rows — each row: word in the LEFT column, ONE empty tick-box centred in the
    Real column, ONE empty tick-box centred in the Alien column. All twelve tick-boxes
    the same square size (~9mm). All start EMPTY (no tick already drawn).

      Row 1:  dog  | ☐ | ☐
      Row 2:  mog  | ☐ | ☐
      Row 3:  pat  | ☐ | ☐
      Row 4:  dop  | ☐ | ☐
      Row 5:  dot  | ☐ | ☐
      Row 6:  gid  | ☐ | ☐

    Rows evenly spaced. Pink-outlined cell borders, white background.

VISUAL DICTIONARY:
  alien = small friendly cartoon space alien — round or blob body in bright colour
          (purple/teal/lime/pink/orange/blue), two stubby legs, one or two thin
          antennae each topped with a small ball, a simple smile, TWO PURE BLACK
          SOLID DOT EYES. No whites of the eyes. No pupils. No sparkles.
"""

WORKSHEET_5_L12_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "5. Story and Draw"

{L12_RULES_HEADER}

This worksheet is the ONE book-tied sheet of the pack. The child draws a single
moment from 'The Mud on the Dog'. NO sentence-ordering task — just one prompt and
one generous draw box. Banner roundel still shows the girl + dog as on every page.

LAYOUT:

[1] "Remember the Story" — small pink-outlined info strip (about 70mm wide × 50mm tall)
    in the TOP-LEFT area below the banner, containing TWO tiny scene illustrations
    side by side as a memory cue:
      Left scene:   the GIRL holding a mop while the muddy golden retriever DOG sits
                    on grass beside her, a few mud splats on the ground. The girl
                    looks slightly frustrated/surprised (small open mouth, raised
                    eyebrows — but still PURE BLACK DOT EYES).
      Right scene:  the same girl smiling, holding a yellow towel; the dog is now
                    clean and beside her in a small round wash tub.

    Below the two scenes, ONE short prompt line in clear small lowercase text:
        "Draw the dog in the mud."
    (Use ONLY this prompt sentence. The strict letter inventory applies — every
    letter is in s a t p i n m d g o + the tricky word "the".)

[2] "Your Picture" — one LARGE rectangular drawing box that fills most of the page
    below §1. Soft pink-outlined, white interior, NO grid, NO example drawing inside,
    NO extra labels. The box is the child's empty canvas.
    In the very bottom-left CORNER of the drawing box, faintly suggest a small patch
    of green grass (a few thin pale-green grass tufts about 10mm tall) — leave the
    rest of the box completely empty for the child to draw.

VISUAL DICTIONARY:
  girl  = the British-Asian girl from the character refs (curly black hair, red top,
          denim dungarees, blue wellies); PURE BLACK DOT EYES.
  dog   = the golden retriever from the character refs; PURE BLACK DOT EYES;
          appearing once muddy (paw and back splatter), once clean.
  mop   = string-headed mop with wooden handle, head down.
  tub   = small round wash tub, side view, water and a tiny soap bubble at the top
          (visual only; the word "tub" is NOT printed on the page since it uses 'u').
"""


# ============================================================
# Single-sound prompt builder for the L1.2+ packs (m d g o etc).
# Mirrors the proven SATPIN single-sound layout. Three sections:
#   §1 Trace the Letter — 1 model + 8 dotted traces + blank ruled line
#   §2 Trace the Words  — 5 pictures, each with a dotted trace word
#                         and a blank strip for the child to write again
#   §3 Write the Missing — 4 pictures with the initial letter blanked
# ============================================================

def build_sound_prompt(
    letter: str,
    sound_name: str,           # e.g. "/m/ (as in 'man')" — used in the writing-focus note
    s2_words: list[tuple[str, str]],   # 5 entries: (word, picture description for dictionary)
    s3_words: list[tuple[str, str]],   # 4 entries: (word, picture description)
    letter_specific_rule: str = "",    # extra constraint for tricky letters (e.g. g descender)
    position: str = "start",   # "start" for s/m/sh-prefix words, "end" for nk/ng-suffix words
) -> str:
    assert len(s2_words) == 5 and len(s3_words) == 4
    assert position in ("start", "end")
    plen = len(letter)  # 1 for single letters, 2 for digraphs (sh, nk, ch, th, ng, qu)
    s2_rows = "\n".join(
        f"    Row {i+1}:  [{w} picture]   {w}   [empty strip]"
        for i, (w, _) in enumerate(s2_words)
    )
    if position == "start":
        s3_cells = "\n".join(
            f"    Cell {i+1}:  [{w} picture]   _{w[plen:]}    ←   child writes \"{letter}\" to make \"{w}\""
            for i, (w, _) in enumerate(s3_words)
        )
    else:  # "end" — blank at the end of the word
        s3_cells = "\n".join(
            f"    Cell {i+1}:  [{w} picture]   {w[:-plen]}_    ←   child writes \"{letter}\" to make \"{w}\""
            for i, (w, _) in enumerate(s3_words)
        )
    dictionary = "\n".join(f"  {w} = {desc}" for w, desc in s2_words + s3_words)
    all_words = [w for w, _ in s2_words + s3_words]
    s3_fragments = ", ".join(f"_{w[1:]}" for w, _ in s3_words)
    extra_rule = f"\n   {letter_specific_rule}" if letter_specific_rule else ""
    return f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks — single-sound page.
Title: "The Sound  {letter}"   Left chip: "Level 1"   Right chip: "Sound · {letter}"

ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, grey footer).
- Image 6: handwriting/tracing reference. Every handwriting strip on the page MUST match
  this style: solid model + dotted trace copies, full 3-zone guide lines (solid baseline,
  dashed midline, faint dotted topline). Letters sit DIRECTLY on the baseline.

This worksheet is WRITING-FOCUSED. The child WRITES; they do not read for comprehension.
NO characters from any book appear on the page. NO boy. NO cat. NO girl. NO dog. Pure
handwriting + word-writing practice for the sound {sound_name}. Lowercase only.

FIVE RULES — follow all five:
1. THREE activities on this page (§1, §2, §3). §1 ~18% of page, §2 ~52%, §3 ~22%.
   Big, airy, generous white space. NO reward stars on sections. NO bottom star strip.
   NO row of stars anywhere. NO stroke-direction arrows, NO numbered stroke order,
   NO start/end coloured dots — just clean dotted letters to trace.
2. Only these letters/words may appear anywhere on the page: lowercase {letter}; the §2
   words {", ".join(all_words[:5])}; and the §3 word fragments {s3_fragments}
   (with a blank space where the {letter} goes). NO uppercase {letter.upper()}. No other
   letters or words anywhere.
3. Every printed letter on the page must sit DIRECTLY on the baseline (touching it, not
   floating above). Lowercase {letter} is single-storey, no serifs. Every handwriting
   strip has the full 3-zone guide lines (solid baseline, dashed midline, faint dotted
   topline).{extra_rule}
4. NO cartoon faces or characters on this page beyond the simple object pictures listed
   below. Any animal in the visual dictionary gets TWO SMALL PURE BLACK SOLID DOT EYES
   only — no whites, no pupils, no sparkles. Nothing else has eyes.
5. Top banner pink (#E84B8A) with title "The Sound  {letter}" and two small chips
   top-right: "Level 1" and "Sound · {letter}". On the left of the banner: one small
   white circular badge containing a clean lowercase "{letter}" in pink — no arrows,
   no dots, just the letter. Footer left (grey, 9pt): "MyPhonicsBooks · decodable
   phonics practice". Footer right (grey, 9pt): "Single Sound · {letter}".

LAYOUT:

[1] "Trace the Letter {letter}" — "Trace the letter. Then write some on your own."
    ONE long horizontal handwriting strip spanning the full width of the section.
    The strip reads: ONE solid dark lowercase model {letter} on the left, then EIGHT
    dotted-grey trace copies of lowercase {letter} evenly spaced across the strip,
    then the rest of the strip is BLANK ruled space (3-zone guide lines continue) for
    the child to write more {letter}'s on their own. Lowercase only — no uppercase
    {letter.upper()} anywhere.

[2] "Trace the Words" — "Trace each word. Then write it on your own."
    FIVE rows stacked vertically across the section. Each row contains THREE cells side
    by side, all the same height (~18mm tall):
      Left cell  (~25mm wide):  ONE small clear picture of the word — see visual
                                dictionary. Pictures only, no labels under them.
      Middle cell (~55mm wide): a short 3-zone handwriting strip with the word written
                                ONCE as a dotted-grey trace word for the child to trace.
                                Lowercase letters, single-storey a, no serifs, every
                                letter sitting on the baseline.
      Right cell  (~55mm wide): a short 3-zone handwriting strip that is EMPTY (just
                                the baseline, dashed midline, dotted topline) — for the
                                child to write the word again on their own.
{s2_rows}

[3] "Write the Missing {letter}" — "What letter is missing? Write the {letter}."
    FOUR cells in a single horizontal row across the section. The four pictures in §3
    MUST be different from the five pictures in §2. Each cell contains:
      - ONE small picture from the visual dictionary at the top of the cell
      - BELOW the picture, a SHORT 3-zone handwriting strip with the word printed but
        the initial {letter} REPLACED by a blank space the same width as a letter. The
        rest of the word is solid black. The blank space is just empty ruled lines
        (NOT a dotted {letter}, NOT an underscore — just empty) where the child writes
        the {letter}.
{s3_cells}
    All four cells the same size. All four blanks the same width. The 3-zone guide
    lines run continuously through the blank and under the rest of the word.

VISUAL DICTIONARY (use exactly these meanings):
{dictionary}
"""


# ============================================================
# LEVEL 1.3 — 'The Fish in the Tank' (focus digraphs sh, nk)
# Skill-only pack — story scaffold lives in the book itself.
# Character set: girl in lavender hijab + orange goldfish.
# ============================================================

L13_RULES_HEADER = """ATTACHED REFERENCE IMAGES:
- Images 1-5: prior worksheet pack — STYLE ONLY (pink banner, pastel boxes, cute cartoons,
  grey footer). Match this overall look. Do not copy their content.
- Image 6: tracing-strip reference for the 3-zone handwriting guide style.
- Images 7-8: CHARACTER references — the girl (light brown skin, lavender hijab framing
  her face, yellow long-sleeve top, mint-green trousers; she is a wheelchair user but
  the chair is OPTIONAL on worksheet scenes — focus on her face/top to keep
  consistency) and her orange goldfish (round body, smiling, in a clear water tank).
  EYE STYLE on every face: TWO SMALL PURE BLACK SOLID DOTS only. NO whites, NO pupils,
  NO irises, NO eyelashes, NO sparkle highlights.

UNIVERSAL RULES:
- Banner pink (#E84B8A) at the top with the title on the left, TWO small chips top-right:
  "Level 1 · sh nk" and "The Fish in the Tank". Small roundel top-left of the BANNER
  showing the girl in her hijab and the goldfish together (matching the character refs).
- Footer left (grey, 9pt): "MyPhonicsBooks · decodable phonics practice".
  Footer right (grey, 9pt): "Worksheet N of 5".
- NO reward stars on the sections. NO bottom "colour the stars" strip. NO row of stars.
- Strict letter inventory for L1.3: only lowercase s a t p i n m d g o and the
  DIGRAPHS sh, nk (always written as joined two-letter pairs) may appear in printed
  words. Tricky words allowed: the, to, I, no, go, into. NO 'b', 'c', 'e', 'f', 'h',
  'j', 'l', 'r', 'u', 'v', 'w', 'x', 'y', 'z', 'q' as standalone letters in printed
  words. (Pictures may show anything from the visual dictionary — pictures are not read.)
- All printed letters lowercase, single-storey 'a', no serifs. Letters sit ON the
  baseline. The 'sh' and 'nk' digraphs are written as a two-letter pair with no
  underline or accent, but always together — never split.
"""

WORKSHEET_1_L13_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "1. Sound Hunt: sh and nk"

{L13_RULES_HEADER}

LAYOUT:

[1] "Tick sh" — "Tick the pictures with the 'sh' sound."
    A SINGLE pink-outlined section with the digraph "sh" displayed LARGE on the left
    inside a small white circle, then a horizontal row of FOUR pictures to its right
    inside softly outlined picture boxes. Below each picture is ONE small empty square
    tick-box (~10mm), centred. All four tick-boxes start EMPTY.
    Pictures left-to-right: ship | dish | dog | tank
    Correct pictures (have the /sh/ sound): ship (initial sh), dish (final sh).
    Distractors: dog, tank.

[2] "Tick nk" — "Tick the pictures with the 'nk' sound."
    Same layout as §1 but with "nk" in the left circle and a different picture row.
    Pictures left-to-right: ink | sink | mat | pink
    Correct pictures (have the /nk/ sound): ink (final nk), sink (final nk),
    pink (final nk). Distractor: mat.

VISUAL DICTIONARY (use exactly these meanings):
  ship  = a small cartoon sailing ship, side view, white sails, blue hull, on a wavy
          line of water beneath.
  dish  = a single ceramic dish/plate, top view, plain white with a thin pink rim,
          no food.
  dog   = a golden retriever sitting upright; PURE BLACK DOT EYES, small smile.
  tank  = a clear glass fish tank, side view, water inside, a green plant and one
          orange goldfish visible inside.
  ink   = a small open ink pot, blue ink visible at the top, classic round shape.
  sink  = a kitchen sink, front view, with two taps and water dripping from one tap.
  mat   = a striped rectangular floor mat (pink and cream stripes), viewed from above.
  pink  = the word concept "pink" — show a single pink-coloured object (a pink heart
          or a pink balloon), no other content in the picture.
  girl  = the girl from the character refs (lavender hijab, yellow top, mint trousers,
          light brown skin); PURE BLACK DOT EYES.
"""

WORKSHEET_2_L13_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "2. Trace and Write: sh and nk"

{L13_RULES_HEADER}

This worksheet is WRITING-FOCUSED. Two long handwriting strips dominate the page.
The child traces the digraphs and the example words; no reading-comprehension.

LAYOUT:

Two long horizontal handwriting strips spanning the full width of the page below the
banner. A small "1" label sits to the LEFT of the first strip, a small "2" left of
the second.

Strip 1 — the digraph "sh":
  Reads left-to-right: ONE solid dark "sh" pair (the two letters joined as a single
  unit, kept together) on the LEFT of the strip, then 4 dotted-grey TRACE copies of
  "sh" following it. Then the rest of the strip continues with TWO trace words evenly
  spaced: "ship" (dotted) and "dish" (dotted) — both written with the "sh" digraph
  ALWAYS joined as a single two-letter unit.

Strip 2 — the digraph "nk":
  Same structure. ONE solid dark "nk" pair on the LEFT, then 4 dotted-grey TRACE
  copies of "nk". Then TWO trace words: "ink" (dotted) and "tank" (dotted) — "nk"
  always joined as a single two-letter unit.

Both strips use full 3-zone guide lines: solid BASELINE, dashed MIDLINE at x-height,
faint dotted TOPLINE. BASELINE COMPLIANCE: every letter body sits flush ON the
baseline. The 'h' ascender rises above the midline toward the topline. The 'k'
ascender does the same. The 'p' in "ship" has its body on the baseline and tail
BELOW. The 'i' and 'n' are pure x-height. No floating glyphs.

Below the two strips, ONE small pink-outlined empty box about 30mm tall × 130mm wide,
centred, labelled in small text "My best 'sh' or 'nk'". Empty inside — the child
writes their best version.
"""

WORKSHEET_3_L13_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "3. Read and Do"

{L13_RULES_HEADER}

LAYOUT:

[1] "Read and Do" — "Read each sentence. Do the action! Then tick the box."
    Four rows stacked vertically. Each row has three cells side by side:
      Left cell:   ONE picture from the visual dictionary showing the girl in her
                   lavender hijab performing the action described.
      Middle cell: the sentence in large clear lowercase letters (capital "I" for
                   the pronoun, full stop at the end). Nothing else.
      Right cell:  ONE empty tick-box (~10mm), centred.

    Row 1:  [girl dipping her finger into a small open ink pot] "Dip in the ink."  ☐
    Row 2:  [girl tapping a fish tank with her index finger]    "Tap the tank."    ☐
    Row 3:  [girl patting a small pink heart-shaped cushion]     "Pat the pink."    ☐
    Row 4:  [girl nodding her head, small motion arcs]           "Nod at the fish." ☐

    Same row height across all four rows. Sentences EXACTLY as written above — no
    commas, no exclamation marks, no extra words.

[2] "Word and Picture Match" — "Read each word. Tick the box under the right picture."
    Four rows stacked vertically. Each row: word on the left in large lowercase, then
    TWO picture choices side by side on the right. Each picture sits in a soft rounded
    pink-outlined box, with ONE small empty tick-box (~9mm) BELOW the picture, centred.

    Row 1:  "fish"  →  [fish picture] ☐    [dog picture]  ☐
    Row 2:  "tank"  →  [tin picture]  ☐    [tank picture] ☐
    Row 3:  "ink"   →  [ink-pot picture] ☐ [pin picture]  ☐
    Row 4:  "dish"  →  [dish picture] ☐    [mat picture]  ☐

    Vary the position of the correct picture (sometimes left, sometimes right). All
    eight tick-boxes the same size; all eight picture boxes the same size.

VISUAL DICTIONARY:
  girl     = the girl from the character refs (lavender hijab, yellow top, mint
             trousers, light brown skin); PURE BLACK DOT EYES.
  ink pot  = small open ink pot with blue ink visible.
  tank     = clear glass fish tank, water inside, one orange goldfish, side view.
  pink     = a small pink heart-shaped cushion (the action "pat the pink" means pat
             this cushion).
  fish     = orange goldfish from the character refs, side view, smiling, PURE BLACK
             DOT EYES.
  dog      = golden retriever sitting upright, PURE BLACK DOT EYES.
  tin      = a tin can, side view, blank label.
  pin      = red drawing pin / push pin.
  dish     = ceramic plate, top view, plain white with a pink rim, no food.
  mat      = striped rectangular floor mat, viewed from above.
"""

WORKSHEET_4_L13_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "4. Alien Word Mission"

{L13_RULES_HEADER}

The page theme is OUTER-SPACE fun: friendly cartoon aliens (purple, teal, lime, pink,
orange, blue blob bodies, two stubby legs, antennae topped with balls, PURE BLACK
DOT EYES, simple smile). Aliens are small and decorative beside each word.

WORDS ON THE PAGE (strict — only these, plus titles/instructions/footer):
  Real (decodable at L1.3):  ship, dash, tank, sink
  Alien (decodable nonsense at L1.3 using sh + nk):  shim, mish, tash, gonk, donk, nink

LAYOUT:

[1] "Read the Alien Words" — "Read each alien word out loud."
    Six alien words shown in a 3-cols × 2-rows grid (six cards total). Each card is
    a soft rounded pink-outlined box (~50mm wide, ~30mm tall) containing:
      - one cute cartoon alien on the LEFT of the card (different colour each card),
      - the ALIEN WORD printed large in clear lowercase on the centre/right.

    Card 1: alien + word  shim
    Card 2: alien + word  mish
    Card 3: alien + word  tash
    Card 4: alien + word  gonk
    Card 5: alien + word  donk
    Card 6: alien + word  nink

    Same card size across all six. EVERY alien has PURE BLACK DOT EYES.

[2] "Real or Alien?" — "Read each word. Tick Real or Alien."
    A simple table with THREE columns and a header row plus SIX body rows.
    Header row (small pink banner across the top of the table):
      | Word | Real | Alien |
    Body rows — word in the LEFT column, one empty tick-box in Real, one in Alien.
    All twelve tick-boxes start EMPTY.

      Row 1:  ship  | ☐ | ☐
      Row 2:  shim  | ☐ | ☐
      Row 3:  tank  | ☐ | ☐
      Row 4:  gonk  | ☐ | ☐
      Row 5:  dash  | ☐ | ☐
      Row 6:  tash  | ☐ | ☐

    Rows evenly spaced. Pink-outlined cell borders, white background.
"""

WORKSHEET_5_L13_PROMPT = f"""Printable A4 portrait phonics worksheet for MyPhonicsBooks.
Title: "5. Sound Sort: sh or nk?"

{L13_RULES_HEADER}

This is a SOUND-SORTING drill, not a story-tied worksheet. The child reads eight
words and sorts them into two columns by their digraph. No drawing, no story prompt.

LAYOUT:

[1] "Word Bank" — small pink-outlined strip near the top, containing EIGHT words
    arranged in two rows of four, separated by small dots. Each word is printed in
    clear lowercase. The eight words (exact order):
      Row A:  ship · dish · ink · tank
      Row B:  sink · dash · pink · monk

[2] "Sort by Sound" — TWO large columns side by side, equal width, filling most of
    the page below the word bank. Each column is a soft pink-outlined rectangle.
      Left column header (small pink banner): "sh"
      Right column header (small pink banner): "nk"
    Inside each column, EIGHT empty 3-zone handwriting rows stacked vertically
    (solid baseline, dashed midline, dotted topline; about 12mm tall each), so the
    child can write the words into the right column. The two columns must be the
    same size, equally tall, evenly spaced — NO model words pre-printed inside the
    columns.

[3] "Check Your Work" — a tiny pink-outlined strip at the bottom (~15mm tall) with
    one short instruction in lowercase: "say each word to a grown-up." Nothing else.

NO PICTURES of the goldfish or the girl in the body of this worksheet — banner
roundel only. This page is pure sound discrimination + handwriting practice.
"""


SOUND_M_PROMPT = build_sound_prompt(
    letter="m",
    sound_name='/m/ (as in "man", "mat")',
    s2_words=[
        ("man",  "simple cartoon man, side view, single colour shirt and trousers, friendly stance, PURE BLACK DOT EYES, small smile"),
        ("mat",  "a small striped rectangular floor mat viewed from above-side, pink and cream stripes, no character on it"),
        ("mug",  "a single white ceramic mug with a handle, side view, faint steam curl rising from the top"),
        ("moon", "a smiling crescent moon, pale cream colour, PURE BLACK DOT EYES (only the moon has eyes), small smile, surrounded by 3 tiny stars"),
        ("milk", "a cardboard milk carton, side view, plain white with a small blue band, no printed text"),
    ],
    s3_words=[
        ("monkey",   "small cartoon monkey sitting upright, brown body and lighter face, long curled tail, PURE BLACK DOT EYES, small smile"),
        ("mouse",    "tiny grey cartoon mouse standing on hind feet, large round ears, long thin tail, PURE BLACK DOT EYES, small smile"),
        ("mushroom", "a red-topped mushroom with white spots, plump white stem, no face"),
        ("mountain", "a single triangular mountain with a small snow cap, no face, side profile only"),
    ],
)

SOUND_D_PROMPT = build_sound_prompt(
    letter="d",
    sound_name='/d/ (as in "dog", "duck")',
    s2_words=[
        ("dog",  "a golden retriever puppy sitting upright, tongue out, PURE BLACK DOT EYES, small smile"),
        ("duck", "a yellow cartoon duckling standing upright, small orange beak, PURE BLACK DOT EYES"),
        ("drum", "a child's snare drum, side view, red and white striped sides, two drumsticks crossed on top, no face"),
        ("doll", "a simple rag doll standing upright, yarn hair in two pigtails, plain dress, no face features beyond PURE BLACK DOT EYES and a small smile"),
        ("dot",  "a single large black dot/circle centred in the cell"),
    ],
    s3_words=[
        ("deer",     "small cartoon deer standing in profile, light brown body, small antlers, PURE BLACK DOT EYES"),
        ("donut",    "a single pink-frosted donut with rainbow sprinkles, side view"),
        ("dinosaur", "small friendly green cartoon dinosaur, side view, short arms, PURE BLACK DOT EYES, small smile"),
        ("donkey",   "small grey cartoon donkey standing in profile, large ears, dark mane, PURE BLACK DOT EYES"),
    ],
    letter_specific_rule=(
        "Lowercase d has an ASCENDER: the round body sits on the baseline and reaches up "
        "to the midline, and the vertical stick rises above the midline toward the topline. "
        "No descender — d does NOT drop below the baseline."
    ),
)

SOUND_G_PROMPT = build_sound_prompt(
    letter="g",
    sound_name='/g/ (as in "goat", "gum")',
    s2_words=[
        ("gate",  "a simple wooden garden gate, closed, side view, two horizontal slats with two vertical posts, no face"),
        ("goat",  "small cartoon goat standing in profile, white body, small horns, PURE BLACK DOT EYES"),
        ("gum",   "a single piece of pink chewing gum (a small rectangular block) with one or two tiny bubbles floating above"),
        ("girl",  "simple cartoon girl, side view, brown short hair, plain pink t-shirt and blue trousers, PURE BLACK DOT EYES, small smile"),
        ("ghost", "small friendly cartoon ghost, white wavy body, no arms, PURE BLACK DOT EYES, small smile"),
    ],
    s3_words=[
        ("garden", "a small green grassy patch with three or four simple flowers (pink and yellow), no people"),
        ("grape",  "a small bunch of purple grapes with one green leaf at the top, no face"),
        ("glass",  "a single clear drinking glass with water inside, side view, no face, no other content"),
        ("guitar", "a single acoustic guitar standing upright on its base, brown body with a sound hole and six visible strings, no face"),
    ],
    letter_specific_rule=(
        "Lowercase g has a DESCENDER: the round body sits on the baseline and reaches up "
        "to the midline; the tail drops BELOW the baseline (classroom-friendly single-storey "
        "style — an open or closed loop tail, NOT a serif print g). Do not draw g with a "
        "double-storey loop like a print typeface."
    ),
)

SOUND_SH_PROMPT = build_sound_prompt(
    letter="sh",
    sound_name='/sh/ (as in "ship", "fish")',
    s2_words=[
        ("ship",  "a small cartoon sailing ship, side view, white sails, blue hull, on a wavy water line beneath"),
        ("shop",  "a small storefront with a striped awning and a single window display, side view, no people, no printed text on the sign"),
        ("sheep", "small cartoon sheep standing in profile, fluffy white body, simple black face and legs, PURE BLACK DOT EYES"),
        ("shoe",  "a single child's lace-up shoe, side view, simple cartoon style, no foot inside"),
        ("shark", "small friendly cartoon shark, side view, grey body, simple fin, simple closed mouth (no teeth), PURE BLACK DOT EYES"),
    ],
    s3_words=[
        ("shed",   "a small wooden garden shed, side view, sloped roof, closed door, no people"),
        ("shell",  "a single pink-and-cream spiral seashell, side view"),
        ("shorts", "a single pair of children's denim shorts on a tiny hanger, no person"),
        ("shrimp", "small cartoon shrimp, pink body, curled, simple cartoon, PURE BLACK DOT EYES"),
    ],
    letter_specific_rule=(
        "The 'sh' digraph is ALWAYS written as a joined two-letter unit (lowercase s "
        "and h together, no underline, no accent, no space between). The 'h' ascender "
        "rises above the midline toward the topline; the 's' is pure x-height."
    ),
)

SOUND_NK_PROMPT = build_sound_prompt(
    letter="nk",
    sound_name='/nk/ (as in "tank", "ink") — always at the END of the word',
    s2_words=[
        ("tank",  "a clear glass fish tank, side view, water inside, a green plant and an orange goldfish visible"),
        ("ink",   "a small open ink pot with blue ink visible at the top, classic round bottle shape"),
        ("sink",  "a kitchen sink, front view, two taps, water dripping from one"),
        ("pink",  "a single pink-coloured heart-shaped balloon with a thin string trailing down, no face, the WORD-CONCEPT 'pink'"),
        ("monk",  "small cartoon monk in a brown robe with a hood, hands clasped together, friendly face, PURE BLACK DOT EYES"),
    ],
    s3_words=[
        ("bank",  "a small piggy bank, side view, pink ceramic body, small slot on top, no face"),
        ("honk",  "a single yellow car-horn (the bulb-and-trumpet hand-honk style) with two motion lines and a small 'Honk!' tag — purely the horn, no car around it"),
        ("wink",  "a small cartoon child's face winking — one eye closed (a small curve), one eye an open PURE BLACK SOLID DOT, small smile, no body just the head"),
        ("junk",  "a small pile of cartoon objects (a tin can, a broken toy, a crumpled paper) representing junk, on a flat ground line, no people"),
    ],
    letter_specific_rule=(
        "The 'nk' digraph is ALWAYS at the END of these words and ALWAYS written as a "
        "joined two-letter unit (lowercase n and k together, no underline, no accent, "
        "no space between). The 'k' ascender rises above the midline toward the topline; "
        "the 'n' is pure x-height. There is NO initial-nk word in English — every §2 and "
        "§3 word ends in nk."
    ),
    position="end",
)


SOUND_O_PROMPT = build_sound_prompt(
    letter="o",
    sound_name='/o/ (as in "octopus", "ox") and /oh/ (as in "owl", "orange")',
    s2_words=[
        ("octopus", "small cute cartoon octopus, purple body, eight curling tentacles, PURE BLACK DOT EYES, small smile, a few small bubbles around it"),
        ("ox",      "small cartoon ox standing in profile, brown body, two small horns, PURE BLACK DOT EYES"),
        ("owl",     "small round cartoon owl, brown feathers, large round head, two small ear tufts, PURE BLACK DOT EYES, small beak"),
        ("orange",  "a single orange fruit with one green leaf on top, side view, simple cross-hatch texture"),
        ("otter",   "small cartoon otter floating on its back in calm blue water, brown fur, white belly, paws crossed, PURE BLACK DOT EYES, small smile"),
    ],
    s3_words=[
        ("oven",     "a small cartoon kitchen oven, front view, with a window in the door and two dials on top, no face"),
        ("olive",    "a small bunch of two green olives on a tiny stem with one olive leaf, no face"),
        ("ostrich",  "small cartoon ostrich standing tall in profile, long neck, brown body and grey legs, PURE BLACK DOT EYES, small beak"),
        ("omelette", "a single golden-yellow folded omelette on a small plate, side view, no face"),
    ],
    letter_specific_rule=(
        "Lowercase o is a perfectly round body that sits flush ON the baseline and reaches "
        "EXACTLY up to the midline. No ascender, no descender."
    ),
)


PROMPTS = {
    1:   {"file": "worksheet_01_tap_sound_hunt_v5.png",      "prompt": WORKSHEET_1_PROMPT, "char_refs": CHAR_REF_FILES},
    2:   {"file": "worksheet_02_tap_the_sounds_v1.png",      "prompt": WORKSHEET_2_PROMPT, "char_refs": CHAR_REF_FILES},
    3:   {"file": "worksheet_03_read_and_do_v2.png",         "prompt": WORKSHEET_3_PROMPT, "char_refs": CHAR_REF_FILES},
    4:   {"file": "worksheet_04_alien_word_mission_v1.png",  "prompt": WORKSHEET_4_PROMPT, "char_refs": CHAR_REF_FILES},
    5:   {"file": "worksheet_05_story_and_draw_v1.png",      "prompt": WORKSHEET_5_PROMPT, "char_refs": CHAR_REF_FILES},
    "1_l12": {"file": "l12_worksheet_01_sound_hunt_v1.png",     "prompt": WORKSHEET_1_L12_PROMPT, "char_refs": CHAR_REF_FILES_L1_2},
    "2_l12": {"file": "l12_worksheet_02_trace_and_write_v1.png", "prompt": WORKSHEET_2_L12_PROMPT, "char_refs": CHAR_REF_FILES_L1_2},
    "3_l12": {"file": "l12_worksheet_03_read_and_do_v1.png",    "prompt": WORKSHEET_3_L12_PROMPT, "char_refs": CHAR_REF_FILES_L1_2},
    "4_l12": {"file": "l12_worksheet_04_alien_words_v1.png",    "prompt": WORKSHEET_4_L12_PROMPT, "char_refs": CHAR_REF_FILES_L1_2},
    "5_l12": {"file": "l12_worksheet_05_story_and_draw_v1.png", "prompt": WORKSHEET_5_L12_PROMPT, "char_refs": CHAR_REF_FILES_L1_2},
    "s": {"file": "sound_s_v4.png",                          "prompt": SOUND_S_PROMPT,     "char_refs": False},
    "a": {"file": "sound_a_v3.png",                          "prompt": SOUND_A_PROMPT,     "char_refs": False},
    "t": {"file": "sound_t_v1.png",                          "prompt": SOUND_T_PROMPT,     "char_refs": False},
    "p": {"file": "sound_p_v2.png",                          "prompt": SOUND_P_PROMPT,     "char_refs": False},
    "i": {"file": "sound_i_v2.png",                          "prompt": SOUND_I_PROMPT,     "char_refs": False},
    "n": {"file": "sound_n_v1.png",                          "prompt": SOUND_N_PROMPT,     "char_refs": False},
    "m": {"file": "sound_m_v1.png",                          "prompt": SOUND_M_PROMPT,     "char_refs": False},
    "d": {"file": "sound_d_v1.png",                          "prompt": SOUND_D_PROMPT,     "char_refs": False},
    "g": {"file": "sound_g_v1.png",                          "prompt": SOUND_G_PROMPT,     "char_refs": False},
    "o": {"file": "sound_o_v1.png",                          "prompt": SOUND_O_PROMPT,     "char_refs": False},
    "1_l13": {"file": "l13_worksheet_01_sound_hunt_v1.png",     "prompt": WORKSHEET_1_L13_PROMPT, "char_refs": CHAR_REF_FILES_L1_3},
    "2_l13": {"file": "l13_worksheet_02_trace_and_write_v1.png", "prompt": WORKSHEET_2_L13_PROMPT, "char_refs": CHAR_REF_FILES_L1_3},
    "3_l13": {"file": "l13_worksheet_03_read_and_do_v1.png",    "prompt": WORKSHEET_3_L13_PROMPT, "char_refs": CHAR_REF_FILES_L1_3},
    "4_l13": {"file": "l13_worksheet_04_alien_words_v1.png",    "prompt": WORKSHEET_4_L13_PROMPT, "char_refs": CHAR_REF_FILES_L1_3},
    "5_l13": {"file": "l13_worksheet_05_sound_sort_v1.png",     "prompt": WORKSHEET_5_L13_PROMPT, "char_refs": CHAR_REF_FILES_L1_3},
    "sh": {"file": "sound_sh_v1.png", "prompt": SOUND_SH_PROMPT, "char_refs": False},
    "nk": {"file": "sound_nk_v1.png", "prompt": SOUND_NK_PROMPT, "char_refs": False},
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("worksheet", help=f"worksheet key — one of: {list(PROMPTS.keys())}")
    parser.add_argument("--size", default="1024x1536",
                        help="1024x1536 portrait | 1024x1024 | 1536x1024")
    parser.add_argument("--quality", default="high",
                        choices=["low", "medium", "high", "auto"])
    parser.add_argument("--model", default="gpt-image-2")
    args = parser.parse_args()
    # Accept either an int key (1-5) or string key ("s", "a", ...).
    key = int(args.worksheet) if args.worksheet.isdigit() else args.worksheet
    if key not in PROMPTS:
        print(f"ERROR: unknown worksheet {key!r}. Choices: {list(PROMPTS.keys())}",
              file=sys.stderr)
        return 2

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("ERROR: OPENAI_API_KEY not set", file=sys.stderr)
        return 2

    client = OpenAI(api_key=api_key)

    cfg = PROMPTS[key]
    out_name = cfg["file"]
    prompt = cfg["prompt"]
    char_refs_cfg = cfg.get("char_refs", True)
    out_path = OUT_DIR / out_name

    ref_files = sorted(REF_DIR.glob("ChatGPT Image*.png"))
    for extra in EXTRA_REF_FILES:
        p = EXTRA_REF_DIR / extra
        if p.exists():
            ref_files.append(p)
    # char_refs can be False (skip), True (legacy → CHAR_REF_FILES), or a list of Paths.
    if char_refs_cfg is True:
        char_paths = CHAR_REF_FILES
    elif char_refs_cfg is False or char_refs_cfg is None:
        char_paths = []
    else:
        char_paths = char_refs_cfg
    for c in char_paths:
        if c.exists():
            ref_files.append(c)
    if not ref_files:
        print(f"ERROR: no reference images in {REF_DIR}", file=sys.stderr)
        return 2
    print(f"Using {len(ref_files)} reference image(s):")
    for r in ref_files:
        print(f"  - {r.name}")

    # gpt-image-1 supports up to 16 input images via images.edit.
    opened = [open(r, "rb") for r in ref_files]
    try:
        print(f"\nCalling {args.model} images.edit  size={args.size}  quality={args.quality}")
        print(f"Prompt length: {len(prompt)} chars\n")
        result = client.images.edit(
            model=args.model,
            image=opened,
            prompt=prompt,
            size=args.size,
            quality=args.quality,
            n=1,
        )
    finally:
        for fh in opened:
            fh.close()

    b64 = result.data[0].b64_json
    out_path.write_bytes(base64.b64decode(b64))

    usage = getattr(result, "usage", None)
    if usage is not None:
        print(f"Tokens — input: {getattr(usage, 'input_tokens', '?')}  "
              f"output: {getattr(usage, 'output_tokens', '?')}")
    print(f"\nSaved: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
