-- Insert Level 2 books
INSERT INTO public.books (level, sub_level, title, slug, focus_sounds, tricky_words, story_words, page_count, sort_order, is_free_sample, is_published, cover_image_url)
VALUES
  (2, 'L2.1', 'The Night Light', 'the-night-light', ARRAY['ay','ee','igh'], ARRAY['the','I','is'], ARRAY['high','day','sigh','need','light','see','way','night','say','yay'], 16, 1, false, true, 'https://qzwkyubbtjqpgqdthwal.supabase.co/storage/v1/object/public/book-covers/the-night-light.jpg'),
  (2, 'L2.2', 'Moo at the Zoo', 'moo-at-the-zoo', ARRAY['ow','oo'], ARRAY['the','I','my','no'], ARRAY['zoo','cow','owl','moo','hoop','cool'], 16, 2, false, true, 'https://qzwkyubbtjqpgqdthwal.supabase.co/storage/v1/object/public/book-covers/moo-at-the-zoo.jpg'),
  (2, 'L2.3', 'Morning on the Farm', 'morning-on-the-farm', ARRAY['ar','or'], ARRAY['the','I','we','her'], ARRAY['farm','barn','corn','torch','dark','morning'], 16, 3, false, true, 'https://qzwkyubbtjqpgqdthwal.supabase.co/storage/v1/object/public/book-covers/morning-on-the-farm.jpg'),
  (2, 'L2.4', 'The Fair in the Air', 'the-fair-in-the-air', ARRAY['air','ir'], ARRAY['the','I','my','no'], ARRAY['fair','air','pair','hair','sir','chair'], 16, 4, false, true, 'https://qzwkyubbtjqpgqdthwal.supabase.co/storage/v1/object/public/book-covers/the-fair-in-the-air.jpg'),
  (2, 'L2.5', 'The Loud Toy', 'the-loud-toy', ARRAY['ou','oy'], ARRAY['the','I','my','she'], ARRAY['around','loud','out','shout','found','toy','joy','zoom'], 16, 5, false, true, 'https://qzwkyubbtjqpgqdthwal.supabase.co/storage/v1/object/public/book-covers/the-loud-toy.jpg');

-- Insert book pages for L2.1 The Night Light
INSERT INTO public.book_pages (book_id, page_number, page_type, text_content, sort_order)
SELECT b.id, v.page_number, v.page_type, v.text_content, v.page_number
FROM books b, (VALUES
  (1, 'cover', 'The Night Light'),
  (2, 'guide', E'Before reading: Look at the cover and read the title together. Practise the sounds on page 3 before starting.\n\nDuring reading: Point to each word as your child reads. If stuck, help them sound out each letter. Praise the effort, not just accuracy!\n\nAfter reading: Talk about what happened in the story. Read it again another day for confidence.'),
  (3, 'reference', 'Focus sounds: ay, ee, igh'),
  (4, 'story', 'The sun is up high.'),
  (5, 'story', 'The day is ending.'),
  (6, 'story', 'I sigh. It is dim.'),
  (7, 'story', 'I need a light!'),
  (8, 'story', 'A light! Up high! I can see!'),
  (9, 'story', 'I see the way. The night is lit.'),
  (10, 'story', 'Lights in the night. I can see!'),
  (11, 'story', E'Day and night! I say \'Yay!\''),
  (12, 'reference', E'Can You Read These Words?\nhigh, day, sigh, light, see, way, night'),
  (13, 'certificate', 'Reading Star Certificate'),
  (14, 'back_cover', 'MyPhonicsBooks — Level 2: Longer Sounds')
) AS v(page_number, page_type, text_content)
WHERE b.slug = 'the-night-light';

-- Insert book pages for L2.2 Moo at the Zoo
INSERT INTO public.book_pages (book_id, page_number, page_type, text_content, sort_order)
SELECT b.id, v.page_number, v.page_type, v.text_content, v.page_number
FROM books b, (VALUES
  (1, 'cover', 'Moo at the Zoo'),
  (2, 'guide', E'Before reading: Look at the cover and read the title together. Practise the sounds on page 3 before starting.\n\nDuring reading: Point to each word as your child reads. If stuck, help them sound out each letter. Praise the effort, not just accuracy!\n\nAfter reading: Talk about what happened in the story. Read it again another day for confidence.'),
  (3, 'reference', 'Focus sounds: ow, oo'),
  (4, 'story', 'I go to the zoo with my dad. I need to see the owl!'),
  (5, 'story', 'I look at the cows. Moo! Moo! No owl. I will look on.'),
  (6, 'story', 'Wow! A big show. A seal can shoot a hoop! No owl.'),
  (7, 'story', 'Ooh! I see a cool pool. Fish zoom in it. No owl.'),
  (8, 'story', 'Boo! A big dim room. I see bats. No owl!'),
  (9, 'story', E'I am so sad now. Then my dad calls, "Look up!"'),
  (10, 'story', 'Hoo! Hoo! I look up. The owl! It is up high!'),
  (11, 'story', 'The owl bows at me. I bow too. The zoo is so good!'),
  (12, 'reference', E'Can You Read These Words?\nzoo, owl, cool, hoop'),
  (13, 'certificate', 'Reading Star Certificate'),
  (14, 'back_cover', 'MyPhonicsBooks — Level 2: Longer Sounds')
) AS v(page_number, page_type, text_content)
WHERE b.slug = 'moo-at-the-zoo';

-- Insert book pages for L2.3 Morning on the Farm
INSERT INTO public.book_pages (book_id, page_number, page_type, text_content, sort_order)
SELECT b.id, v.page_number, v.page_type, v.text_content, v.page_number
FROM books b, (VALUES
  (1, 'cover', 'Morning on the Farm'),
  (2, 'guide', E'Before reading: Look at the cover and read the title together. Practise the sounds on page 3 before starting.\n\nDuring reading: Point to each word as your child reads. If stuck, help them sound out each letter. Praise the effort, not just accuracy!\n\nAfter reading: Talk about what happened in the story. Read it again another day for confidence.'),
  (3, 'reference', 'Focus sounds: ar, or'),
  (4, 'story', 'We go far in the car. I can see a farm!'),
  (5, 'story', 'The farm is big! I see a yard with corn in a jar.'),
  (6, 'story', 'I get a fork for the garden. I dig, dig, dig! Good food for the farm.'),
  (7, 'story', 'Now it is dark. I look at the barn. I need to look in the barn!'),
  (8, 'story', 'I get a torch for the dark. I march to the big barn door.'),
  (9, 'story', 'It is dark in the barn. I look far into a corner. I see a thing!'),
  (10, 'story', 'A kid! Born this morning! Her mum is with her.'),
  (11, 'story', 'I hug the warm kid with my dad. This farm is too good! I wish I had a farm!'),
  (12, 'reference', E'Can You Read These Words?\nfarm, barn, torch, morning, dark, corn'),
  (13, 'certificate', 'Reading Star Certificate'),
  (14, 'back_cover', 'MyPhonicsBooks — Level 2: Longer Sounds')
) AS v(page_number, page_type, text_content)
WHERE b.slug = 'morning-on-the-farm';

-- Insert book pages for L2.4 The Fair in the Air
INSERT INTO public.book_pages (book_id, page_number, page_type, text_content, sort_order)
SELECT b.id, v.page_number, v.page_type, v.text_content, v.page_number
FROM books b, (VALUES
  (1, 'cover', 'The Fair in the Air'),
  (2, 'guide', E'Before reading: Look at the cover and read the title together. Practise the sounds on page 3 before starting.\n\nDuring reading: Point to each word as your child reads. If stuck, help them sound out each letter. Praise the effort, not just accuracy!\n\nAfter reading: Talk about what happened in the story. Read it again another day for confidence.'),
  (3, 'reference', 'Focus sounds: air, ir'),
  (4, 'story', 'I go to the fair! I can see it. The air is cool. The fair is so big!'),
  (5, 'story', 'My hair is up in the air! It is a big gush. I hug my hair down!'),
  (6, 'story', E'I see a pair! Toy ducks! "I can win!" I say. I shoot!'),
  (7, 'story', E'"Yes!" I say. I win the pair! I hug my pair. My pair is so good!'),
  (8, 'story', 'A big gush! My pair is up in the air! No! No! My pair!'),
  (9, 'story', E'"Sir! Sir!" I say. "My pair is in the air!" The sir said, "I can see it!"'),
  (10, 'story', 'The sir ran to a big fir. My pair is in the fir! He got my pair down!'),
  (11, 'story', 'I hug my pair. I sit in a chair. The fair is fun! My pair is back!'),
  (12, 'reference', E'Can You Read These Words?\nfair, pair, chair, sir'),
  (13, 'certificate', 'Reading Star Certificate'),
  (14, 'back_cover', 'MyPhonicsBooks — Level 2: Longer Sounds')
) AS v(page_number, page_type, text_content)
WHERE b.slug = 'the-fair-in-the-air';

-- Insert book pages for L2.5 The Loud Toy
INSERT INTO public.book_pages (book_id, page_number, page_type, text_content, sort_order)
SELECT b.id, v.page_number, v.page_type, v.text_content, v.page_number
FROM books b, (VALUES
  (1, 'cover', 'The Loud Toy'),
  (2, 'guide', E'Before reading: Look at the cover and read the title together. Practise the sounds on page 3 before starting.\n\nDuring reading: Point to each word as your child reads. If stuck, help them sound out each letter. Praise the effort, not just accuracy!\n\nAfter reading: Talk about what happened in the story. Read it again another day for confidence.'),
  (3, 'reference', 'Focus sounds: ou, oy'),
  (4, 'story', 'I am out with my toy car. I zoom it round and round. Zoom! Zoom!'),
  (5, 'story', 'I zoom it far down the path. Round and round! My toy is loud!'),
  (6, 'story', 'But it ran too far! My toy! I look around and around. I can not see it!'),
  (7, 'story', E'I shout out loud. "Mum! I need you! I can not see my toy!"'),
  (8, 'story', E'Mum is with me now. "We will look around and around," she said.'),
  (9, 'story', 'We look around the big rock. No toy! We look around the shed. No toy!'),
  (10, 'story', 'Look! said Mum. I found it! My toy! Joy! Joy! I shout out loud!'),
  (11, 'story', E'I hug my toy and I hug Mum. "Thank you!" I say. We go in.'),
  (12, 'reference', E'Can You Read These Words?\nout, shout, round, toy'),
  (13, 'certificate', 'Reading Star Certificate'),
  (14, 'back_cover', 'MyPhonicsBooks — Level 2: Longer Sounds')
) AS v(page_number, page_type, text_content)
WHERE b.slug = 'the-loud-toy';