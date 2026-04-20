# MyPhonicsBooks Marketing Content Index
**Generated:** 31 March 2026 | **Version:** v5 (Playwright renders)

## Core Messaging
- **Contrarian belief:** The reading gap doesn't close. It widens. Ages 4-6 is the critical window.
- **Offer:** Free 3-minute assessment > find reading level > 1 free personalised book
- **Never product-first.** Always pain > solution > proof > CTA.
- **Honest language:** "every word matched to their level" (not "every word decodable" as tricky words exist)

## Design System
- **Fonts:** Poppins (headings), Lato (body)
- **Panel:** Glass-panel dark overlay (rgba(12,12,18,0.78)) with backdrop blur
- **Level dots:** Pink #E84B8A, Amber #F59E0B, Green #22C55E, Blue #3B82F6, Purple #8B5CF6, Teal #14B8A6
- **CTA pills:** Rounded, bold, level-colour backgrounds
- **Watermark:** "MyPhonicsBooks" top-right in accent colour

---

## AWARENESS (Top of Funnel)

### Instagram Feed (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 01 | `awareness/instagram-feed/feed_01_reading_age.png` | "73% of parents don't know their child's reading age" | gem_01_children_reading_v2 |
| 02 | `awareness/instagram-feed/feed_02_read_like_british.png` | "Want them to read English like a British child?" | gem_04_world_connections |
| 03 | `awareness/instagram-feed/feed_03_critical_window.png` | "Between ages 4 and 6, something important happens" | gem_05_reading_gap |
| 04 | `awareness/instagram-feed/feed_04_ten_minutes.png` | "You don't need 50 minutes a day. You need 10." | gem_06_ten_minutes |

### Instagram Stories (1080x1920)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 04 | `awareness/instagram-stories/story_04_expat_fear.png` | "Living abroad? Scared they're falling behind?" | gem_04_world_connections |

### Facebook (1200x628)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 06 | `awareness/facebook/fb_06_gap_widens.png` | "The gap doesn't close. It widens." | gem_05_reading_gap |

### Meta Ads (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 12 | `awareness/meta-ads/meta_12_dont_guess.png` | "Don't guess their reading level. Know it." | gem_09_assessment |

### Reels (Voiceover + Script)
| # | Script | Audio File | Hook |
|---|--------|------------|------|
| 01 | `awareness/reels/reel_01_gap_widens_script.md` | `tts_2026-03-29T23-13-53-330Z.mp3` | "The gap doesn't close. It widens." |
| 02 | `awareness/reels/reel_02_gap_never_closes_script.md` | `tts_2026-03-29T23-13-59-970Z.mp3` | "Reading problems don't sort themselves out" |
| 03 | `awareness/reels/reel_03_ten_minutes_script.md` | `tts_2026-03-29T23-14-16-850Z.mp3` | "You don't need more reading time" |
| 04 | `awareness/reels/reel_04_expat_gap_script.md` | `tts_2026-03-29T23-14-23-792Z.mp3` | "Can they actually read it?" |

**Voice:** Freya (ElevenLabs, ID: jsCqWAovK2LkecY7zXl4) | **Audio saved to:** `C:\Users\ASUS\AppData\Local\ElevenLabs\output\`

---

## CONSIDERATION (Middle of Funnel)

### Instagram Feed (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 10 | `consideration/instagram-feed/feed_10_british_teacher.png` | "A British teacher built this for families like yours" | gem_07_british_teacher_v2 |
| 09 | `consideration/instagram-feed/feed_09_reading_purpose.png` | "Are they reading with purpose?" | gem_11_reading_purpose |

### Instagram Stories (1080x1920)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 05 | `consideration/instagram-stories/story_05_six_months.png` | "From first sounds to confident reader" | gem_03_level_pathway |

### Facebook (1200x628)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 07 | `consideration/facebook/fb_07_start_right.png` | "Start them off right" | gem_10_start_right_v2 |

### Meta Ads (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 08 | `consideration/meta-ads/meta_08_confident_reader.png` | "From guessing to reading" | gem_02_confident_reader_v2 |

---

## CONVERSION (Bottom of Funnel)

### Instagram Feed (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 14 | `conversion/instagram-feed/feed_14_social_proof.png` | "Built by a British teacher. Used by families worldwide." | gem_08_social_proof_v2 |

### Instagram Stories (1080x1920)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 13 | `conversion/instagram-stories/story_13_assessment_cta.png` | "What reading level are they actually at?" | gem_09_assessment |

### Facebook (1200x628)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 16 | `conversion/facebook/fb_16_reading_purpose.png` | "Give them books that actually match" | gem_11_reading_purpose |

### Meta Ads (1080x1080)
| # | File | Hook | Gemini Image |
|---|------|------|-------------|
| 09 | `conversion/meta-ads/meta_09_expat_reading.png` | "Living abroad? They can still read like a British child." | gem_04_world_connections |
| 15 | `conversion/meta-ads/meta_15_ten_minutes.png` | "10 minutes. The right book. Real progress." | gem_06_ten_minutes |

---

## Raw Assets

### Gemini Illustrations (`gemini-raw/`)
16 files: 11 original + 5 v2 (eye-fixed) versions. Generated via Gemini 2.5 Flash Image API with strict small black dot eyes prompt.

### Remotion Project
Full React/TypeScript compositions at `C:\Users\ASUS\myphonicsbooks-remotion\`. Contains animated versions of all content with spring animations, Sequence timing, and reel compositions with voiceover sync points. Ready for video rendering once `npm install` completes.

### Render Script
`render_marketing.py` in project root regenerates all 17 static images via Playwright. Requires Python + Playwright.

---

## Meta Ads Compliance Notes
- Never use "your child" in Meta ad copy (use "their" or "children")
- No urgency language ("limited time", "hurry")
- No real faces in ad creative (character illustrations only)
- Story #13 uses "your child" but is organic, not paid

## Hashtag Sets
**Expat:** #expat #expatlife #expatfamily #britishabroad #expatparents
**Phonics:** #phonics #earlyreading #readinglevel #britishphonics #lettersandsounds
**Parenting:** #parentingtips #primaryschool #homeeducation #learningenglish
**Brand:** #myphonicsbooks #readingage #decodablebooks
