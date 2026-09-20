# Daily Facebook printable

One free printable a day goes to the MyPhonicsBooks Facebook Page, in
curriculum order, with no one touching it.

## What goes out

`marketing/social/queue.json` — 408 posts, built by `build_queue.py`:

| kind | count | source |
|---|---|---|
| book | 33 | `public/book-pdfs/*.pdf` |
| page | 310 | every activity page inside those books (Our Sounds, Story Words, Sound Spotlight, Trace & Form, Alien Words, sequencing, Tell the Story, Talk About It, Grammar Spotlight, Can You Read These?, Shifty Sounds), served one page at a time by `api/printable.py` at `/p/<book>/<page>` |
| worksheet | 65 | `public/worksheets/**` |

Order: Level 1 books, then their activity pages, then Level 1 worksheets, then
Level 2, and so on to Level 8. Each item has a paste-ready caption that names
the level out of 8, the sounds, and the sign-off pointing to the Page.

Rebuild after adding books or worksheets:

```bash
py -3.12 scripts/social/build_queue.py
```

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
