# MyPhonicsBooks — Launch Overview

A short, marketing-oriented snapshot of what the product is, who it's for, and
why it exists. Use this as a starting briefing when discussing positioning,
ads, social copy, or partnerships. The repo-level README covers code structure
and operations; this doc is for non-engineering conversations.

---

## One-line pitch

> A premium decodable-reader app that finds your child's exact phonics level in
> minutes, then guides them — book by book, sound by sound — until they can
> read confidently.

---

## The problem

Most parents teaching their child to read run into the same three walls:

1. **Levelling is guesswork.** Books are sold by age band ("ages 4-6"), not by
   the sounds the child actually knows. A new reader is given books that are
   too hard, gives up, and loses confidence.
2. **Mass-market phonics products are bland.** Cat. Mat. Pat. The same Western
   suburb, same blond protagonist, same generic storyworld for 30 books in a
   row. Children — especially expat and minority families — don't see
   themselves on the page.
3. **Parents have no way to verify progress.** "Sight-reading" hides gaps.
   Children memorise repeated stories instead of decoding them, and the gap
   only surfaces years later in school.

## The product

MyPhonicsBooks attacks all three:

- **Adaptive 3-minute assessment** finds the child's working level (1-6) by
  testing real sounds, real words, and tricky words. No guessing.
- **33 culturally-grounded decodable books** across 6 levels. Each story is set
  in a different real-world setting (Kenyan farmhouse, Iceland fishing town,
  Pakistani market) with characters that match the customer's child where they
  buy a personalised book. Phonetically pure: every word is decodable using
  only the sounds taught up to that point.
- **Honest fluency loop.** Each book is read 5 times, with quick "Checks" at
  reads 3, 4 and 5 that confirm the child can actually decode — not just
  recite. A child only progresses when they pass.
- **Level Check** at the end of each level tests retention across all books
  before unlocking the next level.

The Levels (UK Letters and Sounds aligned):
- L1 *Starting Stories* — `s a t p i n m d g o c k`
- L2 *Longer Sounds* — final blends, `ck`, `ng`
- L3 *New Spellings* — long vowels (`ai`, `ee`, `igh`)
- L4 *Building Fluency* — alternative spellings, prefixes
- L5 *Reading Together* — Phase 5/6 patterns, multi-syllable words
- L6 *Reading Champion* — non-fiction text features, fluent reading

## Who it's for

**Primary:** parents of children aged 4-8 who want to teach reading at home.

**Sub-segments where positioning is sharpest:**

- **Expat families** — UK-curriculum parents living abroad whose children
  are missing structured phonics teaching. The cultural diversity in the books
  is a feature, not a token.
- **Muslim families** — content is screened for Islamic appropriateness
  (modesty, no haram themes) without being explicitly Islamic. A meaningful
  market underserved by mainstream children's reading apps.
- **Home-school families** — they need rigour, progress tracking, and
  evidence of decoding (not memorising) — exactly what the Checks provide.
- **Tutors and small-group teachers** — the levelled progression and gap
  detection is what they'd otherwise pay £200+ to a publisher for.

## Pricing

Available in [Shop.tsx](src/pages/Shop.tsx). Live tiers:

| Plan | Price | What's included |
|---|---|---|
| **Free Sample** | £0 | One book matched to assessed level |
| **Founders Club** | £1 lifetime *(limited to 1,000 spots)* | All 33 books, all assessments, all future books, in exchange for two short reviews (24h + 1 week) |
| **Full Bundle** | One-time | All 33 books, no expiry, all future books |
| **Subscription** | £x/month | All books, new releases, full assessment suite, cancel anytime |
| **Annual** | £x/year | Same as subscription, ~30% saving |

Founders Club is the current acquisition lever — heavily discounted in
exchange for genuine product feedback that funds the next iteration.

## Differentiators (what to lead with in ads)

1. **"Find their level in 3 minutes"** — adaptive assessment with a
   national + international comparison chart at the end. No other phonics app
   shows you where your child sits relative to UK age expectations.
2. **"Books your child sees themselves in."** Cultural settings that aren't a
   token brown character in a Western village.
3. **"Earned progression, not unlocked."** Children can't button-mash their
   way to the next level. Parents trust the result.
4. **"Tells you what they don't know."** The result screen now distinguishes
   "passed" from "not tested" — most assessment apps fudge this.

## What's launch-ready (live now)

- Marketing landing page → assessment → free book funnel
- Quick Check (3-min) and Full Test (~10-min) assessments
- Stripe checkout for all tiers, including guest checkout
- Founders Club countdown + terms gate
- Affiliate / referrals — 50% commission, share via WhatsApp / Facebook
- 33 books across L1-L6, each with stamps + Checks
- Parent dashboard with progress, weekly reads, Level Check status
- Profile with Account Settings, Download History, Help & Support
- GoHighLevel CRM sync on signup, purchase, assessment completion
- Native mobile-app shell (PWA + Capacitor wrappers)
- Service-worker caching for offline-first reading

## Deferred (won't block launch)

These are flagged as "Coming soon" or are silently inert today:

- **Manual "Unlock Next Book"** in Parent Dashboard (UI exists, toasts a
  message; backend RPC needs writing).
- **Messages inbox** — page exists at `/profile/messages`, but the
  `parent_messages` Supabase table doesn't exist yet, so the inbox is empty.
- **Premium / Basic toggle** on Pricing — current Stripe products map to a
  different shape (Founders Club, Bundle, Subscription, Annual). Hardcoded
  £9.99 / £4.99 redesign would need new Stripe products.
- **Multi-child support** — schema allows it, UI assumes one child per
  account.

None of these break a customer's first session.

## Founder context

Built and maintained by **Lynden Cooke**. Background includes phonics
teaching, illustration direction, and full-stack engineering. The illustration
style is consistent because the same person briefs every cover and every
in-page image; the phonics is rigorous because the curriculum was built before
any code was written.

The product's centre of gravity is **honesty over engagement metrics** —
it's the opposite of an addictive-loop kid app. Parents who want their child
genuinely reading, not glued to a screen, are the target.

## Channels worth testing first

- Facebook ads to expat-mum groups (Singapore, Dubai, KL, Pakistan, India,
  Saudi)
- Muslim-family TikTok / Instagram (modest content angle)
- Homeschool subreddits and forums (rigour angle)
- UK Year-1 / Reception parents whose children "aren't getting it" at school
- Tutoring agencies as a B2B partnership

## Tech (one-liner each)

- Frontend: Vite + React + TypeScript + Tailwind, deployed on Vercel
- Backend: Supabase (Postgres + Auth + Edge Functions in Deno)
- Payments: Stripe (one-time + subscriptions, with webhook-driven entitlement)
- CRM: GoHighLevel via webhook-driven sync
- Books: bespoke Python/Jinja pipeline producing A5 PDFs + interactive HTML
- Native: Capacitor wrappers around the same web app

---

*Last refreshed at the launch milestone. Update the deferred list as items
ship; update the channels list with what's actually working after the first
month of paid traffic.*
