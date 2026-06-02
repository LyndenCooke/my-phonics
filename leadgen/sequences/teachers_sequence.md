# Teachers Cold Sequence — v1

**Audience:** Individual EYFS / Reception / Year 1 / Kindergarten / 1st-Grade teachers, scraped from public sources (YouTube channels, blogs, TPT, IG bios).
**Tone:** Peer-to-peer, classroom-tool, not corporate. You're a small UK indie maker, not a sales rep.
**Offer:** Free Level 1 + Level 3 sample PDFs. No paywall, no signup wall. Ask for honest feedback if they try them.
**Volume:** 30–40 sends/day per inbox. Stop on reply.

---

## EMAIL 1 — The Free Sample (Day 0)

**Subject:** Free decodable phonics books for your classroom?

```
Hi {first_name_or_there},

{intro_line}

I run MyPhonicsBooks — a small UK project building decodable phonics readers
matched exactly to Letters and Sounds progression. Quick differences from the
typical decodable reader:

  • Every book is set in a different contemporary culture
    (Birmingham → Nairobi → Yokohama → Cairo). Same phonics rigour,
    much wider window for the child.
  • Print-at-home A5 PDFs. Fold and staple — proper saddle-stitched books,
    not worksheet sheets.
  • Every word in every story is either decodable at the level or a listed
    tricky word. No "guess from the picture" stuff.

I'm giving away free sample PDFs to teachers right now — Level 1 and Level 3,
covering early decoding and split digraphs. Would you like me to send them
across?

Best,
Lynden Cooke
MyPhonicsBooks
{unsubscribe}
```

## EMAIL 2 — One-line nudge (Day 3)

**Subject:** re: Free decodable phonics books for your classroom?

```
Hi {first_name_or_there},

Just bumping this in case you missed it. Want me to send the Level 1 + L3
sample PDFs over? No catch, no signup form.

Lynden
{unsubscribe}
```

## EMAIL 3 — Drop the samples directly (Day 7)

**Subject:** The sample books (no need to reply unless useful)

```
Hi {first_name_or_there},

Rather than keep nudging, just sending the samples directly.

  • Level 1 "The Fish in the Tank" — SATPIN + sh/nk/ck
  • Level 3 "The Big Bike Race" — split digraphs a-e/i-e, clusters

[Drive link]

If you try one with a child and have *any* feedback — what landed, what
didn't, what felt wrong — I'd genuinely love to hear it. Tiny team, every
piece of classroom feedback shapes the next book.

And if you have a colleague who'd want these too, please pass them on.

Best,
Lynden
MyPhonicsBooks
{unsubscribe}
```

---

## Why this works as a school wedge

A teacher who tries the books and likes them is the strongest possible referral
into their school. The "ask a colleague" line at the end of Email 3 is the soft
expansion — costs nothing, opens a door. Later, when the product is school-ready,
those teachers become our case studies and warm intros to admin.

## GHL wiring

1. Import `output/youtube_teachers.csv` (and later `teacher_blogs.csv`) merged
   into one Smart List tagged `teachers-v1`.
2. Workflow: Email 1 immediate -> Email 2 +3 days (no reply) -> Email 3 +7 days (no reply).
3. **Stop on reply** for all steps.
4. Notification rule: notify Lynden on `Email Replied` only.
5. Sender: dedicated subdomain warmed for 2+ weeks.
6. Map `intro_line` -> `{{custom.intro_line}}`. If `first_name` is empty, GHL
   should fall back to "there".

## Hard rules

- **Never** send without `intro_line` populated.
- **Never** mass-send to corporate edu brands (filter handled in scraper).
- One-click unsubscribe in footer. Honour requests immediately.
- If a teacher asks how we got their email, answer plainly: "Your business
  contact was published on your YouTube channel / blog. Happy to remove you
  from any future emails."
