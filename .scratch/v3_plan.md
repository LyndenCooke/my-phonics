# Meta Visuals v3 — Visual-First, Scroll-Stopping

All visuals are built to stop the scroll. Images do the talking. Captions under the post do the selling.

## Design Principles

1. **Visual over verbal.** One idea per image. Icon-led infographic.
2. **British English.** No Oxford commas. No em dashes. No emojis.
3. **No realistic human faces.** Silhouettes, icons, abstract figures, book covers only.
4. **Brand palette.** Pink `#E84B8A`, Amber `#F59E0B`, Green `#22C55E`, Blue `#3B82F6`, Purple `#8B5CF6`, Teal `#14B8A6` on near-black `#0B0B0F` or warm cream.
5. **Three words or fewer on screen where possible.** Supporting captions go in the post body.
6. **Meta compliance.** Never "your child". No urgency. No guarantees. No faces.

## Audience Pivot — Emerging-Market English Aspirational

Primary markets for this wave of creative are parents in high-English-demand regions where English reading fluency is tied to upward mobility, expat mobility, or private-school parity with British schools.

| Tier | Region | Countries |
|------|--------|-----------|
| Home | UK | United Kingdom (control) |
| South Asia | | Pakistan, Bangladesh, India |
| South East Asia | | Malaysia, Philippines, Indonesia, Vietnam |
| Africa | | Nigeria, Kenya, Ghana, Egypt |
| MENA / Mediterranean | | Turkey, Morocco, Tunisia |

**15 countries total.** Each country gets two creatives: a Critical-Window card and a Founders Club card.

Meta ad-policy compliance varies by market. Always verify: political-ad rules (Turkey, India), child-imagery rules, and pricing-disclaimer rules before scheduling. No claims about speed or outcomes.

## Theme Groups

### A. The 4-7 Window (effect of not learning English from 4 to 7)

| File | Concept | Size | On-image text |
|------|---------|------|---------------|
| `A1_window_brain.png` | Brain lit up at ages 4-7, dim after | 1080x1080 | "4 · 5 · 6 · 7" |
| `A2_window_staircase.png` | Glowing steps 4-7, missing steps after | 1080x1080 | "The window" |
| `A3_two_trees.png` | Rooted tree (early) vs shallow tree (late) | 1080x1080 | None |
| `A4_gaps_compound.png` | Diverging curves from age 4 | 1080x1080 | "Age 4 → 11" |
| `A5_foundation_crack.png` | Two buildings: solid foundation vs cracked | 1080x1080 | None |

### B. Reading Age Awareness

| File | Concept | Size | On-image text |
|------|---------|------|---------------|
| `B1_reading_age_gap.png` | Chronological age vs reading age mismatch | 1080x1080 | "Age 6 · Reading age 4" |
| `B2_parents_73pct.png` | 10 parent silhouettes, 7 with "?" | 1080x1080 | "73%" |
| `B3_book_above_level.png` | A too-heavy book on a small stack | 1080x1080 | None |

### C. 10-Minute Habit Math

| File | Concept | Size | On-image text |
|------|---------|------|---------------|
| `C1_habit_math_feed.png` | 10 → 60 → 240 with growing book stacks | 1080x1080 | "10 min · 60 hrs · 240 hrs" |
| `C2_habit_story.png` | Vertical three-stage tower (day/year/4yrs) | 1080x1920 | "10 min / 1 year / 4 years" |
| `C3_habit_seed.png` | Seed → sapling → tree metaphor | 1080x1080 | None |

### D. Do The Assessment First — 4-Step Journey

| File | Concept | Size | On-image text |
|------|---------|------|---------------|
| `D1_journey_4_step.png` | 4 panels: assess → book → print → read | 1536x1024 | "1 · 2 · 3 · 4" |
| `D2_journey_story.png` | Vertical 4-step for Stories | 1080x1920 | "Assess · Get · Print · Read" |

### E. £1 Founders Club (per country)

Same layout system, with local currency equivalent shown as the primary price.

| Country | Local price shown | Native label |
|---------|-------------------|--------------|
| United Kingdom | £1 | Founders Club |
| Pakistan | Rs 299 | Founders Club |
| Bangladesh | ৳120 | Founders Club |
| India | ₹99 | Founders Club |
| Malaysia | RM 5 | Founders Club |
| Philippines | ₱60 | Founders Club |
| Indonesia | Rp 20K | Founders Club |
| Vietnam | ₫25K | Founders Club |
| Nigeria | ₦1,500 | Founders Club |
| Kenya | KSh 150 | Founders Club |
| Ghana | GH₵ 15 | Founders Club |
| Egypt | E£ 60 | Founders Club |
| Turkey | ₺40 | Kurucu Kulübü |
| Morocco | MAD 10 | Founders Club |
| Tunisia | 3 DT | Founders Club |

File naming: `E1_founders_<country_slug>.png`.

**Local prices are placeholders. Verify FX and your own pricing strategy before publishing.** Edit `COUNTRY_DATA` in `generate_meta_visuals.py` to adjust.

### F. Country Critical-Window Cards (speak with local data)

One variant per country. Same visual system, different on-card anchor.

| File | Country | Local anchor (editable in script) |
|------|---------|-----------------------------------|
| `F1_window_uk.png` | UK | "Reception starts the window" |
| `F1_window_pakistan.png` | Pakistan | "English-medium from KG" |
| `F1_window_bangladesh.png` | Bangladesh | "English from Class 1" |
| `F1_window_india.png` | India | "LKG to UKG: the window" |
| `F1_window_malaysia.png` | Malaysia | "English from Tahun 1" |
| `F1_window_philippines.png` | Philippines | "English from Kinder" |
| `F1_window_indonesia.png` | Indonesia | "English from SD kelas 1" |
| `F1_window_vietnam.png` | Vietnam | "English from Lớp 1" |
| `F1_window_nigeria.png` | Nigeria | "English from Primary 1" |
| `F1_window_kenya.png` | Kenya | "English from Grade 1" |
| `F1_window_ghana.png` | Ghana | "English from KG" |
| `F1_window_egypt.png` | Egypt | "English from KG1" |
| `F1_window_turkey.png` | Turkey | "İngilizce 2. sınıftan" |
| `F1_window_morocco.png` | Morocco | "English from primary" |
| `F1_window_tunisia.png` | Tunisia | "Anglais dès l'école" |

Every local claim is a **default** and must be reviewed by someone who knows the local curriculum before posting. Adjust in `COUNTRY_DATA`.

## Output Location

All generated PNGs land in `marketing-mockups/v3/output/`.

## How to Run

```bash
# 1. Put your OpenAI key in the repo-root .env
echo 'OPENAI_API_KEY=sk-...' >> .env

# 2. Install deps (same as the book illustrator)
pip install requests python-dotenv

# 3. Generate everything (approx 42 images, ~$3-4 at high quality)
python marketing-mockups/v3/generate_meta_visuals.py

# 4. Or generate by theme group
python marketing-mockups/v3/generate_meta_visuals.py A      # A1-A5
python marketing-mockups/v3/generate_meta_visuals.py E      # all founders
python marketing-mockups/v3/generate_meta_visuals.py F      # all country windows

# 5. Or a single country
python marketing-mockups/v3/generate_meta_visuals.py pakistan
python marketing-mockups/v3/generate_meta_visuals.py e1_founders_india

# 6. Or a single visual
python marketing-mockups/v3/generate_meta_visuals.py A1_window_brain
```

Each call uses `gpt-image-1` at `quality=high`. A rate-limit sleep of 12 s sits between images.

## Caption Library (for the post body)

These are drop-in captions for each visual. Swap country names and local stats as needed.

### A. Critical Window
- "Between 4 and 7, the brain is wired for decoding. Miss the window and reading becomes harder, not impossible, but harder. 10 minutes a day, right now, is worth 30 minutes a day later. Find their reading level. Link in bio."

### B. Reading Age
- "Age 6 on paper. Reading age 4 in practice. If the books they're given don't match the sounds they know, they're not reading. They're guessing. The free assessment tells you where they actually are. 3 minutes. Link in bio."

### C. 10-Minute Habit
- "10 minutes a day. 60 hours in a year. 240 hours in four years. That's the difference between a child who guesses and a child who reads. Pick 10 minutes. Keep 10 minutes. Link in bio."

### D. Assessment Journey
- "Step 1: 3-minute reading assessment. Step 2: free decodable book at their exact level. Step 3: print at home in minutes. Step 4: they read it. Every word uses only the sounds they know. Link in bio."

### E. Founders Club
- "The £1 Founders Club. (Local equivalent: [X].) Join the first parents using the same phonics system British schools use. Lifetime locked-in rate. Built by a British primary school teacher. Link in bio."

### F. Country Critical Window
- "Between 4 and 7, the brain is wired for English decoding. [Country] schools teach English early, but the fluency comes from practice at home. 10 minutes a day with books at the right level. Free reading assessment. Link in bio."
