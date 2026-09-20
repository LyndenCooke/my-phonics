# Daily Facebook printable

One free printable a day goes to the MyPhonicsBooks Facebook Page, in
curriculum order, with no one touching it.

## What goes out

`marketing/social/queue.json` — 164 posts, built by `build_queue.py`:

| kind | count | source |
|---|---|---|
| book | 33 | Supabase Storage, public bucket `book-pdfs/a5/<id>.pdf` (the published books are not in git or on Vercel: `*.pdf` is ignored) |
| worksheet (from books) | 66 | two per book, composed from its activity pages by `compose_worksheets`: the **Sounds worksheet** (Sound Spotlight → Trace & Form → Alien Words → Can You Read These? → Shifty Sounds, whichever the book has) and the **Story worksheet** (sequencing → Tell the Story → Your Turn to Write → Talk About It → Grammar Spotlight). Served as one PDF by `api/printable.py` at `/p/<book>/<page list>` |
| worksheet (designed) | 65 | `public/worksheets/**` (git-tracked, re-included in `.vercelignore`) |

A worksheet is a task sequence with one purpose. Reference pages (Our Sounds,
Story Words) are not worksheets and are never posted on their own; the book
post tells parents to use them before reading.

Order, per book: the book, its sounds worksheet, its story worksheet. Books
run Level 1 to 8, with each level's designed worksheets after its books.

Every caption states an OBJECTIVE and a HOW TO USE line (see `PAGE_TYPES` and
`worksheet_objective` in `build_queue.py`), then the print link and sign-off.

## The creative

`creative.py` wraps the printable's page in a branded 1080x1350 card: level
pill, activity name, the book it belongs to, the page in a white card, the
objective, and the logo lockup. Font: `marketing/social/assets/Outfit.ttf`
(the site's display font, OFL).

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
