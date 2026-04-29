-- ============================================================
-- Seed all 33 books into the books table.
-- Source of truth: src/lib/bookCatalog.ts (kept in sync with this).
--
-- Without these rows, paid customers can't have books unlocked because
-- user_books.book_id references this table. The interactive reader uses
-- hardcoded data for content but the DB still gates access.
-- ============================================================

INSERT INTO books (level, sub_level, title, slug, focus_sounds, tricky_words, story_words, page_count, sort_order, is_free_sample, is_published)
VALUES
  -- Level 1
  (1, 'L1.1', 'Tap! Tap! Tap!', 'tap-tap-tap', ARRAY['s','a','t','p','i','n'], ARRAY['the','to','I'], ARRAY[]::text[], 24, 11, false, true),
  (1, 'L1.2', 'The Mud on the Dog', 'the-mud-on-the-dog', ARRAY['m','d','g','o'], ARRAY['the','to','I','no'], ARRAY[]::text[], 24, 12, false, true),
  (1, 'L1.3', 'The Fish in the Tank', 'the-fish-in-the-tank', ARRAY['sh','nk'], ARRAY['the','I','into'], ARRAY[]::text[], 24, 13, false, true),
  (1, 'L1.4', 'The Red Socks', 'the-red-socks', ARRAY['c','k','ck','e'], ARRAY['the','I','no'], ARRAY[]::text[], 24, 14, false, true),
  (1, 'L1.5', 'Run, Pup, Run!', 'run-pup-run', ARRAY['u','r','h','b'], ARRAY['the','to','I'], ARRAY[]::text[], 24, 15, false, true),
  (1, 'L1.6', 'Fox Fell Off!', 'fox-fell-off', ARRAY['f','l','ff','ll'], ARRAY['the','I','no'], ARRAY[]::text[], 24, 16, false, true),
  (1, 'L1.7', 'The Jam Jug', 'the-jam-jug', ARRAY['j','v','w'], ARRAY['the','I','into'], ARRAY[]::text[], 24, 17, false, true),
  (1, 'L1.8', 'The Yak and the Box', 'the-yak-and-the-box', ARRAY['x','y','z'], ARRAY['the','I','no'], ARRAY[]::text[], 24, 18, false, true),
  (1, 'L1.9', 'Chop, Chop, Chop!', 'chop-chop-chop', ARRAY['ch','th'], ARRAY['the','I','to'], ARRAY[]::text[], 24, 19, false, true),
  (1, 'L1.10', 'Buzz and Sing!', 'buzz-and-sing', ARRAY['ng','qu','ss','zz'], ARRAY['the','I','go'], ARRAY[]::text[], 24, 110, false, true),
  -- Level 2
  (2, 'L2.1', 'The Night Light', 'the-night-light', ARRAY['ay','ee','igh'], ARRAY['he','she','we','me'], ARRAY[]::text[], 24, 21, false, true),
  (2, 'L2.2', 'Moo at the Zoo', 'moo-at-the-zoo', ARRAY['ow','oo'], ARRAY['you','said','your'], ARRAY[]::text[], 24, 22, false, true),
  (2, 'L2.3', 'Morning on the Farm', 'morning-on-the-farm', ARRAY['ar','or'], ARRAY['her','are','put'], ARRAY[]::text[], 24, 23, false, true),
  (2, 'L2.4', 'The Fair in the Air', 'the-fair-in-the-air', ARRAY['air','ir'], ARRAY['my','be','said'], ARRAY[]::text[], 24, 24, false, true),
  (2, 'L2.5', 'Round and Round', 'round-and-round', ARRAY['ou','oy'], ARRAY['you','your','are'], ARRAY[]::text[], 24, 25, false, true),
  (2, 'L2.6', 'The Night Fair', 'the-night-fair', ARRAY['ay','ee','igh','ow','oo','ar','or','air','ir','ou','oy'], ARRAY['the','I','we','to','my','are','said'], ARRAY[]::text[], 24, 26, false, true),
  -- Level 3
  (3, 'L3.1', 'The Big Bike Race', 'the-big-bike-race', ARRAY['a-e','i-e'], ARRAY['all','like','want'], ARRAY[]::text[], 24, 31, false, true),
  (3, 'L3.2', 'Lost at the Night Market', 'lost-at-the-night-market', ARRAY['o-e','u-e'], ARRAY['I','the','you','she','we','elephant'], ARRAY['close','spoke','huge','stone','bright','noodle'], 24, 32, false, true),
  (3, 'L3.3', 'Reach for the Treat!', 'reach-for-the-treat', ARRAY['ea','ie'], ARRAY['call','do','old'], ARRAY[]::text[], 24, 33, false, true),
  (3, 'L3.4', 'Draw It Again', 'draw-it-again', ARRAY['oi','aw'], ARRAY['was','so','what'], ARRAY[]::text[], 24, 34, false, true),
  (3, 'L3.5', 'The Boat with the Red Sail', 'the-boat-with-the-red-sail', ARRAY['ai','oa'], ARRAY['all','some','they'], ARRAY[]::text[], 24, 35, false, true),
  -- Level 4
  (4, 'L4.1', 'The Purple Purse', 'the-purple-purse', ARRAY['ur','er'], ARRAY['saw','watch','their'], ARRAY[]::text[], 24, 41, false, true),
  (4, 'L4.2', 'The Brown Owl', 'the-brown-owl', ARRAY['are','ow'], ARRAY['where','were','small'], ARRAY[]::text[], 24, 42, false, true),
  (4, 'L4.3', 'The New Glue', 'the-new-glue', ARRAY['ew','ue'], ARRAY['school','who','brother'], ARRAY[]::text[], 24, 43, false, true),
  (4, 'L4.4', 'The Cheeky Monkey', 'the-cheeky-monkey', ARRAY['ur','er','are','ow','ew','ue'], ARRAY['any','tall','fall'], ARRAY[]::text[], 24, 44, false, true),
  -- Level 5
  (5, 'L5.1', 'Before the Shore', 'before-the-shore', ARRAY['ire','ore'], ARRAY['does','could','would'], ARRAY[]::text[], 24, 51, false, true),
  (5, 'L5.2', 'Near the Door', 'near-the-door', ARRAY['ear','oor'], ARRAY['anyone','over','through'], ARRAY[]::text[], 24, 52, false, true),
  (5, 'L5.3', 'Sure She Can', 'sure-she-can', ARRAY['ure','tion'], ARRAY['once','whole','people'], ARRAY[]::text[], 24, 53, false, true),
  (5, 'L5.4', 'A Place for Me', 'a-place-for-me', ARRAY['ire','ore','ear','oor','ure','tion'], ARRAY['water','people','through'], ARRAY[]::text[], 24, 54, false, true),
  -- Level 6
  (6, 'L6.1', 'The Marvellous Neighbourhood', 'the-marvellous-neighbourhood', ARRAY['ous'], ARRAY['should','many','above'], ARRAY[]::text[], 24, 61, false, true),
  (6, 'L6.2', 'You Are Remarkable', 'you-are-remarkable', ARRAY['able','ible'], ARRAY['father','mother','great'], ARRAY[]::text[], 24, 62, false, true),
  (6, 'L6.3', 'It Looks Suspicious', 'it-looks-suspicious', ARRAY['cious','tious'], ARRAY['bought','caught','thought'], ARRAY[]::text[], 24, 63, false, true),
  (6, 'L6.4', 'The Incredible Bush Walk', 'the-incredible-bush-walk', ARRAY['ous','able','ible','cious','tious'], ARRAY['everyone','walk','talk'], ARRAY[]::text[], 24, 64, false, true)
ON CONFLICT (slug) DO NOTHING;
