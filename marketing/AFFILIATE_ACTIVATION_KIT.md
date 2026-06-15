# MyPhonicsBooks — Affiliate Activation Kit

Everything you need to switch the referral engine on. All mechanics below are taken from your live code, not assumed: `src/lib/referral.ts`, `src/components/profile/ReferralPanel.tsx`, `src/pages/Referrals.tsx`.

**The programme, in one line:** anyone with an account already has a referral code (auto-created on signup), earns 50% on direct referrals plus 10% on their network, tracked by a 90-day cookie, paid monthly once they pass £20.

---

## 1. Fix these two things first (before you recruit anyone)

Recruiting affiliates into a broken share experience burns goodwill you only get once. Both of these are in your code right now.

**Blocker 1: the creative library link is dead.**
In `src/pages/Referrals.tsx` the "Open creative library" button points at:

```
const CREATIVES_URL = 'https://drive.google.com/drive/folders/REPLACE_ME';
```

Every affiliate who taps "Open creative library" hits a 404. You already have a full content library in `/content` (awareness, consideration, conversion graphics, reels scripts, audio) and `/marketing/leaflet`. Put a curated set into a public Google Drive or Notion folder and swap `REPLACE_ME` for the real link. This is a 30-minute job that unblocks every affiliate at once.

**Blocker 2: the share copy prices don't match your launch pricing.**
`src/lib/referral.ts` hardcodes "£4.99/month or £39 lifetime" and "free 7-day trial" into the WhatsApp and Facebook messages. But `LAUNCH_OVERVIEW.md` lists Founders Club at £1 lifetime, plus Full Bundle and Subscription at prices still marked `£x`. Before affiliates start sharing, reconcile these so the auto-generated share copy matches what a buyer actually sees at Stripe checkout. Pick the canonical prices, update `referral.ts`, done.

(Minor: the comment block in `referral.ts` says "60-day TTL" in the header but the constant is 90 days. Cosmetic, but worth a one-word fix so future-you isn't confused.)

---

## 2. Who to recruit first

You do not need hundreds of affiliates. You need ten good ones who already talk to your exact parent. Ranked by warmth and fit:

| Priority | Cohort | Why they convert | Where you find them |
|---|---|---|---|
| 1 | **Teacher peers** | They trust your judgement and have parent WhatsApp groups already | Your own staffroom, PGCE cohort, teacher Instagram, school networks |
| 2 | **Tutors and tutoring agencies** | They'd otherwise pay a publisher £200+ for levelled progression. 50% recurring is real income | Local tutor directories, EAL tutor groups, your Alim Education network |
| 3 | **Expat mum accounts** | Your cultural-books angle and the comparison chart land hardest here | Instagram and Facebook parent accounts in Singapore, Dubai, KL, Pakistan, India, Saudi |
| 4 | **Muslim family creators** | Underserved, high trust, modest-content angle is a genuine differentiator | Muslim-parenting Instagram and TikTok |
| 5 | **Homeschool community leaders** | They want rigour and proof of decoding, exactly what the Checks give | Homeschool Facebook groups and subreddits |

Start with cohort 1. A warm message from you to ten teachers you know will out-convert any cold outreach to strangers.

---

## 3. The offer to lead with

Affiliates need three things stated plainly: what they earn, how easy it is, and why their audience will actually thank them.

- **50% commission, recurring.** On a monthly subscriber, they keep earning every month that person stays. On a lifetime sale, a one-time 50%.
- **Plus 10% on their network.** When someone they recruited also refers a buyer, they earn 10% of that too.
- **Zero friction.** No application, no minimum following. Make an account, grab the link, share. The code already exists.
- **A free first book for the parent.** They are not pushing a hard sell. They are handing a friend a free 3-minute assessment and a free personalised book. The product does the convincing.

---

## 4. Paste-ready outreach

British English, your voice. Swap the bracketed bits. These are written to be sent as-is.

### A. WhatsApp / DM to a teacher friend

> Hi [name], quick one. I've built MyPhonicsBooks: decodable readers for 4 to 8s, every word matched to the child's phonics level, stories set all over the world so kids actually see themselves on the page. There's a free 3-minute assessment that tells a parent exactly where their child sits against UK age expectations, then a free book.
>
> I've turned on a referral programme and I'd love you to be one of the first in. You share a link, and you earn 50% on anyone who subscribes, every month they stay. Takes two minutes to set up. Want me to send you the steps?

### B. Message to a tutor or tutoring agency

> Hi [name], I run MyPhonicsBooks, a levelled decodable reading library for 4 to 8s built on Letters and Sounds. It does the bit tutors usually pay a publisher a fortune for: a 3-minute assessment that places a child on a 6-level ladder, then books where every word is decodable at that level, with built-in checks that prove the child is decoding rather than memorising.
>
> I'm opening a referral programme to tutors first. 50% recurring commission on every family you bring in, plus a free assessment and book for them up front so it's genuinely useful to your clients, not a pitch. Happy to set you up with a link and a small pack of graphics. Interested?

### C. Public "calling first affiliates" post (Instagram / Facebook / your teacher network)

> I'm opening the MyPhonicsBooks referral programme to a first group of teachers, tutors and parents.
>
> If you know families with a 4 to 8 year old learning to read, you can earn 50% commission, recurring, on every subscriber you refer. There's a free 3-minute reading assessment and a free personalised book for every family, so you're sharing something genuinely useful, not selling.
>
> No application and no minimum following. Comment "link" or DM me and I'll send you everything to start.

---

## 5. Affiliate onboarding one-pager

Send this to anyone who says yes. Everything here is true to the live product.

**Welcome. Here's how to start earning in five minutes.**

**Step 1 — Get your link.**
Go to myphonicsbooks.com, create a free account, then open Profile > Refer & Earn (or go straight to /profile/referrals). Your personal share link and code are already there. It looks like `myphonicsbooks.com/?ref=YOURCODE`.

**Step 2 — Use the ready-made messages.**
On that same page, tap "Copy WhatsApp message" or "Copy Facebook post". The copy and your link are filled in for you. Paste and send. There's also a creative library button for graphics you can drop into posts and stories.

**Step 3 — Share where parents already trust you.**
A class WhatsApp group, your stories, a homeschool forum, a message to a friend whose child is learning to read. One honest "we use this and it's brilliant" beats fifty cold posts.

**How you get paid:**

- **50%** of every direct sale you refer. On a monthly subscription, that recurs for as long as they stay subscribed. On a lifetime purchase, a one-time 50%.
- **10%** of sales made by anyone you recruit who then refers their own buyers.
- Clicks are tracked for **90 days**, so even if a parent buys a fortnight after clicking, you're still credited.
- Earnings show up in your Refer & Earn dashboard within **24 hours** of a payment.
- Payouts go to your bank **monthly, once you reach £20**. Self-referrals don't count.

**What to say:** lead with the free assessment and free book, never the price. The parent gets something real before they're ever asked to pay. That honesty is why this converts.

---

## What to do this week

1. Fix the dead creative link and the pricing mismatch (Section 1).
2. Build the public creative folder from your existing `/content` assets.
3. Message the first ten teachers and tutors you know personally (Section 4A and 4B).
4. Send each "yes" the one-pager (Section 5).
5. Post the public call once the link works (Section 4C).

Ten warm affiliates sharing into trusted parent groups will tell you more in a fortnight than a month of paid ads, and it costs you nothing until a sale lands.
