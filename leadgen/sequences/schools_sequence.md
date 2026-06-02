# International Schools Cold Sequence — v1

**Audience:** Admissions / Head / Principal at British/American/IB international schools in Africa, SE Asia, Middle East.
**Tone:** Professional, peer-to-peer, curriculum-led. Not salesy. Lead with the differentiator.
**Volume:** 30–40 sends/day per inbox. Skip CCs.

---

## EMAIL 1 — The Hook (Day 0)

**Subject:** Decodable phonics + cultural diversity for {company_name}

```
Hi {role_or_first_name},

{intro_line}

I run MyPhonicsBooks — a small UK-built phonics programme that's structured
exactly to the Letters and Sounds progression, but with one difference: every
single book is set in a different contemporary culture around the world.

A child in {city} can read a phonics-decodable book set in Birmingham, Nairobi,
Yokohama, or Cairo — and every word in the story is one they can actually sound
out at their level.

We've built 15 books so far across Levels 1–3, with 17 more in production.
Print-at-home A5 PDFs, suitable for early-years and KS1 classrooms.

Would it be useful to send you a couple of sample PDFs to look at?
No charge, no obligation — just curious whether this fits how you teach reading.

Best,
Lynden Cooke
MyPhonicsBooks
{unsubscribe}
```

**Personalisation tokens to fill via `personalize.py`:**
- `{intro_line}` — Claude-generated 1 sentence referencing the school's curriculum/setting (e.g. "I saw {school} teaches the British curriculum in {city} — your early-years team might find this interesting.")
- `{role_or_first_name}` — fall back to "the {role}" or "there" if no name.
- `{city}`, `{company_name}` — from CSV.

## EMAIL 2 — Soft Follow-up (Day 4)

**Subject:** re: Decodable phonics + cultural diversity for {company_name}

```
Hi {role_or_first_name},

Wanted to circle back on this — no pressure.

Quick context on the cultural angle: most decodable readers are generic
(a girl, a boy, a pet). Most diverse children's books aren't phonics-controlled.
We sit at the intersection. Every word is decodable, every story opens a window
to a different part of the world.

Happy to send sample PDFs across (Level 1 + Level 3) so your reading lead
can have a look — would that be useful?

Best,
Lynden
{unsubscribe}
```

## EMAIL 3 — Value Drop + Soft Close (Day 9)

**Subject:** Sample books — Level 1 + Level 3 phonics readers

```
Hi {role_or_first_name},

Sharing two sample PDFs — both are full, print-ready A5 books:

  • Level 1 "The Fish in the Tank" — SATPIN + sh/nk + ck (early decoding)
  • Level 3 "The Big Bike Race" — split digraphs a-e / i-e (clusters)

[Drive link to 2 PDFs]

If your early-years lead reads either of these and has feedback (positive,
negative, or somewhere in between) I'd genuinely love to hear it. Building
this is a small team and any classroom reaction is gold.

If it's not a fit for {company_name}, all good — I won't follow up further.

Best,
Lynden
MyPhonicsBooks
{unsubscribe}
```

---

## GHL Workflow Wiring

1. Import `output/international_schools.csv` to a GHL Smart List tagged `intl-schools-v1`.
2. Create a 3-step workflow: Email 1 immediate, Email 2 +4 days (if no reply), Email 3 +9 days (if no reply).
3. **Stop on reply** for all three steps.
4. **Notification rule:** trigger Slack/SMS to Lynden only on `Email Replied` events — suppress opens, sends, bounces.
5. Custom field mapping: `intro_line` → `{{custom.intro_line}}`, `city` → `{{contact.city}}`, etc.
6. Sender: dedicated outreach domain (`hello.myphonicsbooks.com` or new domain), warmed for 2+ weeks before first send.

---

## Hard rules

- **Never** send without `intro_line` populated. Skip the row.
- **Never** exceed 40 sends/day per inbox.
- **Never** send to a generic `info@` if a role-specific email (`admissions@`, `principal@`) is in `all_emails`.
- **GDPR posture:** B2B school outreach under "legitimate interest". One-click unsubscribe footer is mandatory. Honour requests immediately.
