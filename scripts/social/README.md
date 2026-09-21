# Daily Facebook printable

One free printable a day goes to the MyPhonicsBooks Facebook Page, in
curriculum order, with no one touching it.

## What goes out

`marketing/social/queue.json` — 22 posts, built by `build_queue.py`, each
carrying two or three of the designed worksheets from `public/worksheets/**`
(57 single sheets; the 8 full-pack PDFs are linked, not posted).

- Teaching order (`WS_LEVEL` order + `SOUND_ORDER`): the s a t p i n sound
  sheets, then the Tap! Tap! Tap! book pack, then m d g o, then The Mud on the
  Dog pack, then Level 2 sounds, then sh/nk, The Fish in the Tank pack, and the
  Level 3 practice pack.
- Groups never mix packs and are balanced (7 sheets -> 3, 2, 2).
- Every caption lists each sheet with an Objective, a How line and its link,
  then the full-pack link, then the sign-off. Objectives come from
  `worksheet_objective` in `build_queue.py`.

When there are more worksheets, drop them in `public/worksheets/<pack>/`,
add the folder to `WS_LEVEL`, force-add the PDFs (`*.pdf` is git-ignored)
and re-run `build_queue.py`. When the queue is exhausted it loops.

## The creative

`creative.py` renders one 1080x1080 card showing the day's sheets side by
side (first page of each in a white card, name underneath), with the level
pill, pack name, a "Today: part n of m" line and the logo. Font:
`marketing/social/assets/Outfit.ttf` (the site's display font, OFL).

## How it posts

`.github/workflows/daily-post.yml` runs `post_next.py` at 06:30 UTC every day.
It renders the printable's page to a JPG, uploads it as a photo post with the
caption, and commits the id to `marketing/social/posted.json`. When all 408 have
gone out it starts again from the top (different people see the Page each day).

Post a specific item by hand: Actions -> Daily Facebook printable -> Run
workflow -> enter the queue id.

## One-time setup (Lynden)

Two repository secrets (Settings -> Secrets and variables -> Actions):

- `FB_PAGE_ID` — the Page's numeric id (Page -> About -> Page transparency).
- `FB_PAGE_ACCESS_TOKEN` — a long-lived Page token with `pages_manage_posts`
  and `pages_read_engagement`. Meta for Developers -> your app -> Tools ->
  Graph API Explorer -> pick the Page under "User or Page" -> Generate ->
  then extend it to 60 days via Access Token Debugger -> "Extend". A Page token
  derived from a long-lived user token does not expire.

Until the secrets exist the workflow runs as a dry run and posts nothing.

## Groups are manual

Meta removed the Groups API in 2024, so nothing can post into Facebook groups
for you. Use the same queue as a spreadsheet (`MyPhonicsBooks_PDF_post_list.xlsx`,
regenerated from `queue.json`) and paste the caption into two or three groups a
day from your personal profile.
