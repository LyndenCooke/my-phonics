/**
 * Generate ALL missing sentence audio for interactive books L2-L5.
 * Uses ElevenLabs George voice with consistent settings matching L1.
 * Run: node generate_all_sentence_audio.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

// ─── L2 Sentences ───────────────────────────────────────────────────────────
const L2_SENTENCES = {
  // L2.1 Day and Night
  "L2_1_p1": "The day ends. I can not see my toy cat.",
  "L2_1_p2": "We go out to look. It is night.",
  "L2_1_p3": "Look at the lights. I can see in the shop.",
  "L2_1_p4": "It is dim on the way. I need a light.",
  "L2_1_p5": "Look, a light up high! It is the moon.",
  "L2_1_p6": "Dad can see I am sad. He hugs me in the light.",
  "L2_1_p7": "I see my toy cat! Dad and I run to it.",
  "L2_1_p8": "I hug my toy cat. I say, \"Yay, my toy!\"",
  // L2.2 Zoo Adventure
  "L2_2_p1": "I go to the zoo with my dad. I need to see the owl!",
  "L2_2_p2": "I look at the cows. Moo! Moo! No owl. I will look on.",
  "L2_2_p3": "Wow! A big show. A seal can shoot a hoop! No owl.",
  "L2_2_p4": "Ooh! I see a cool pool. Fish zoom in it. No owl.",
  "L2_2_p5": "Boo! A big dim room. I see bats. No owl!",
  "L2_2_p6": "I am so sad now. Then my dad calls, Look up!",
  "L2_2_p7": "Hoo! Hoo! I look up. The owl! It is up high!",
  "L2_2_p8": "The owl bows at me. I bow too. The zoo is so good!",
  // L2.3 Farm Visit
  "L2_3_p1": "We go far in the car. I can see a farm!",
  "L2_3_p2": "The farm is big! I see a yard with corn in a jar.",
  "L2_3_p3": "I get a fork for the garden. I dig, dig, dig! Good food for the farm.",
  "L2_3_p4": "Now it is dark. I look at the barn. I need to look in the barn!",
  "L2_3_p5": "I get a torch for the dark. I march to the big barn.",
  "L2_3_p6": "It is dark in the barn. I look far into the barn. I see a thing!",
  "L2_3_p7": "A kid! Born this morning! Her mum is with her.",
  "L2_3_p8": "I hug the warm kid with my dad. This farm is too good!",
  // L2.4 Fair Adventure
  "L2_4_p1": "I go to the fair! I can see it. The air is cool. The fair is so big!",
  "L2_4_p2": "The air is in my hair! It is such a gush! I put my hat on.",
  "L2_4_p3": "Look! Toy ducks, a pair! I can win! I say.",
  "L2_4_p4": "Yes! I say. I win the pair! I hug my pair. My pair is so good!",
  "L2_4_p5": "A gush in the air! My pair shoots up, up, up! No! My pair!",
  "L2_4_p6": "Sir! Sir! My pair is in the air! The sir said, I can see it! By the fir!",
  "L2_4_p7": "The sir ran to a big fir. My pair is in the fir! He got my pair down!",
  "L2_4_p8": "I hug my pair. I sit in a chair. The fair is fun! My pair is back!",
  // L2.5 Lost Toy
  "L2_5_p1": "I went out with my toy car. I zoomed it round and round. Zoom! Zoom!",
  "L2_5_p2": "I zoomed it far down the path. Round and round! It got loud!",
  "L2_5_p3": "But it ran too far! My toy! I looked around and around. I can not see it!",
  "L2_5_p4": "I shouted out loud. Mum! I need you! I can not see my toy!",
  "L2_5_p5": "Mum ran out to me. I will look around and around, she said.",
  "L2_5_p6": "We looked around the big rock. No toy! We looked around the shed. No toy!",
  "L2_5_p7": "Look! said Mum. I found it! My toy! Joy! Joy! I shouted out loud!",
  "L2_5_p8": "I hugged my toy and I hugged Mum. Thank you! I said. We went in.",
  // L2.6 The Night Fair
  "L2_6_p1": "It is night! We go to the souq. The lights up high are so bright!",
  "L2_6_p2": "I see lots of lamps. Each one is so cool! I feel such joy.",
  "L2_6_p3": "A man plays a drum in the dark. Tap, tap, tap! I stay to see.",
  "L2_6_p4": "Mum gets food for us. I try a spoon. It is hot and so yum!",
  "L2_6_p5": "I see a toy bird with soft hair. \"Can I get it?\" I say. Mum says yes!",
  "L2_6_p6": "I sit on a stool. The fair is so much fun! The air is cool.",
  "L2_6_p7": "Look up! I see stars in the sky. The moon is low and round.",
  "L2_6_p8": "My night at the souq is so good. I wave good night to the big moon.",
};

// ─── L3 Sentences ───────────────────────────────────────────────────────────
const L3_SENTENCES = {
  // L3.1 The Bike Race
  "L3_1_p1": "Bikes line up at the gate. It is time for the race to start! I stand with my bike on the line.",
  "L3_1_p2": "Ride to the lake and back! the man said. Can I win? I grip my bike tight.",
  "L3_1_p3": "Off I go! Past a tall pine tree. Past a wide stone gate. I ride fast in the sun.",
  "L3_1_p4": "Look out! Stones on the track. A bike slides and a girl falls off. She gave me a brave smile.",
  "L3_1_p5": "I can see the lake! It shines in the sun. I ride past it and turn back.",
  "L3_1_p6": "Can I make it back in time? I ride and ride. I must not be late!",
  "L3_1_p7": "I am past the line! I made it! I slide off my bike with a wide grin.",
  "L3_1_p8": "A prize! I am on the top step! I smile and wave at my mates. What a good day!",
  // L3.2 The Stone Flute
  "L3_2_p1": "Mum and I went to the night market. It was huge! 'Stay close to me,' Mum spoke. And I did.",
  "L3_2_p2": "We see cute stone elephants on a stall. We see bright noodle pots. The food smelt so good!",
  "L3_2_p3": "Then a man bumped me! I spun round and round. I cannot see Mum! I froze.",
  "L3_2_p4": "It was dark and loud. I felt so small. 'Mum!' I shout. But Mum is not there.",
  "L3_2_p5": "Then I see the cute stone elephants! We went past those! Mum must be close!",
  "L3_2_p6": "I run past the bright lights. I run past the noodle stall. Then… I see Mum!",
  "L3_2_p7": "Mum gave me a huge tight hug. 'You are safe!' she spoke. I did not let go.",
  "L3_2_p8": "We sat close and ate hot noodles in the moonlight. 'Stay close to me!' spoke Mum. I gave a huge grin. Home time!",
  // L3.3 The Ripe Mango
  "L3_3_p1": "Nana sits by her gate. She looks so tired. \"I need to clean,\" she said. \"But it is too much.\"",
  "L3_3_p2": "I kneel by each plant pot and clean the leaves. \"Let me help, Nana!\" I said. She tried to grin.",
  "L3_3_p3": "I run and find him. \"Please, can you help?\" I cried. \"We need to be a team!\"",
  "L3_3_p4": "We each grab a cloth. We clean the step and sweep the yard. Leaves fly!",
  "L3_3_p5": "I stand on a stool. He holds it. I reach up and grab each tin from the shelf. \"I got them!\"",
  "L3_3_p6": "We clean each tin and line them up neat. Nana peeks in. \"What a dream team!\" she cried.",
  "L3_3_p7": "Then we run to the shop. We get beans and rice and sweet plantain for Nana. What a treat!",
  "L3_3_p8": "Nana grins and grins. She brings us each a big feast — beans and rice with fried plantain! We beam. \"Thank you, Nana!\"",
  // L3.4 What Min Saw
  "L3_4_p1": "Min and Mum put on thick coats. 'Let us go!' said Min with a big grin.",
  "L3_4_p2": "Min and Mum step on to the street. Min points at a big block. 'Look at that!' she said.",
  "L3_4_p3": "They go to the park. A cat sits in the grass. 'Look! A cat!' said Min.",
  "L3_4_p4": "Min sees a stream. She hops on the stones in the soil. 'Min, look out!' said Mum.",
  "L3_4_p5": "They go up the hill. Min sees big trees and hills. 'Look at this!' she said.",
  "L3_4_p6": "A big hawk is up high! Min points at it. The hawk has sharp claws.",
  "L3_4_p7": "They sit on the grass. The hawk stays up high. 'It looks just right,' Mum said.",
  "L3_4_p8": "On the way home, Min runs in the leaves. 'I will tell Dad what I saw!' said Min.",
  // L3.5 Kai and the Boat
  "L3_5_p1": "Kai stands at the coast in the warm rain. He waits for a boat to sail in. The sea is still. He lets out a long groan.",
  "L3_5_p2": "He moans and paces the road. It is so slow! he said. He spots a snail. Even the snail wins the race! he said.",
  "L3_5_p3": "Then a shape floats on the foam! It bobs and dips in the waves. Is it the boat? He springs to his feet!",
  "L3_5_p4": "The boat sails in close. He can spot a red stripe on the sail! That is the stripe on Dad's boat! Can it be?",
  "L3_5_p5": "He can see fish! A big load sits at the front. Kai claps! Dad loads his boat with fish each time. Is this his?",
  "L3_5_p6": "Then a voice calls from the boat. Kai! Kai! Kai shouts back as loud as he can. DAD! Is that you?",
  "L3_5_p7": "The boat docks. Dad leaps off and runs to Kai. Dad scoops him up. They spin and spin. What a hug!",
  "L3_5_p8": "I was at sea for so long, said Dad. I am so glad to be back! Kai gave him a big grin. The long wait was worth it.",
};

// ─── L4 Sentences ───────────────────────────────────────────────────────────
const L4_SENTENCES = {
  // L4.1 The Purple Purse
  "L4_1_p1": "My purple purse was gone! I turned my pockets inside out, but it was not there. I was so upset!",
  "L4_1_p2": "Dad came with me to search. We walked up and down the street. It must be here, said Dad.",
  "L4_1_p3": "I looked under the bench in the park. I searched in the ferns. Not there!",
  "L4_1_p4": "A currant bun? said the baker. But I had no coins to pay! I turned away, sad.",
  "L4_1_p5": "Further on, we passed a church. Past more stalls and tall garden walls. I started to give up.",
  "L4_1_p6": "Then a market lady held up a purple purse! I found this on the kerb. Is it yours?",
  "L4_1_p7": "I turned the purse over. My coins were still in it! Thank you! I burst out, smiling.",
  "L4_1_p8": "Dad and I walked home in the warm afternoon. I held the purse close to my chest. She was so kind, I said.",
  // L4.2 The Brown Owl
  "L4_2_p1": "It was getting dark. From deep in the trees came a loud howl, then a growl. What was that? I stared out the window but all I saw were shadows.",
  "L4_2_p2": "Can we go and look? I asked Mum. She got me my thick coat and boots. We set off down the dark path together. The air was cool on my bare cheeks.",
  "L4_2_p3": "Then Mum stopped and stared up. Look! she said. A big brown owl sat on a bare branch. It stared down at us and did not look scared at all.",
  "L4_2_p4": "I stared at the owl. The owl stared right back. How rare! said Mum. You do not see owls like this! I wanted to get close but I did not dare.",
  "L4_2_p5": "Then the owl spread its wings and swooped down. Wow! It landed on a stump close to us. I froze. I did not dare to make a sound.",
  "L4_2_p6": "The owl looked up at a hole high in the tree. Out came soft cheeps. Owlets! said Mum. She must look after them! I peeked and saw fluffy brown faces staring down at me.",
  "L4_2_p7": "The owl swooped back up with a mouse in its claws. The owlets crowded round, cheeping loud. What a rare sight! Mum and I shared a smile.",
  "L4_2_p8": "We went home under the stars. I want to go back and care for them, I said. Mum took my hand. We will, she said. I smiled all the way home. The brown owl and her owlets were safe in the dark.",
  // L4.3 The Blue Glue
  "L4_3_p1": "The girl had a pot of new blue glue. She drew a bird on a card. This card is for Mum, she said to Dad. She pressed the blue glue on — but she pressed too hard!",
  "L4_3_p2": "The blue glue spread across the desk and stuck to her hand! She pulled and she shook. Then the card flew off her hand, down the hall and down the stairs!",
  "L4_3_p3": "The card landed right on the cat at the foot of the stairs. The cat grew cross and ran. It had blue glue and bits of card stuck in its fur!",
  "L4_3_p4": "The cat flew into the front room and jumped on the shelf. It bumped a blue cup of tea. The cup fell and tea ran down on to the new rug.",
  "L4_3_p5": "Then the cat ran into the kitchen. Dad was at the sink. He turned to look, but he did not see the wet patch on the ground. So he slid and fell with a bump! This is all due to that blue glue! he said.",
  "L4_3_p6": "Then the cat ran out into the garden. It jumped on the wall and bumped a pot of blue flowers. The pot started to fall! The girl threw her arms out and rescued it just in time.",
  "L4_3_p7": "That cat! said Dad. They cleaned up all the glue and the mess. The girl wiped the blue stain off the desk. The cat just sat and chewed its fur clean.",
  "L4_3_p8": "At last, the card was finished. Mum came home and the girl gave it to her. You drew this for me? said Mum. It is true, said the girl. And it was all due to the new blue glue!",
  // L4.4 The Pink Mosque
  "L4_4_p1": "The sun was up. It was a new day! The boy and Mum went to the big pink mosque. Wow! said the boy. It is so big!",
  "L4_4_p2": "They went down to the water. The blue lake was still and cool. Pink and blue — how grand it was!",
  "L4_4_p3": "But then he saw something brown and furry. A monkey! It sat on a wall and turned to stare. Wow! said the boy. What is THAT?",
  "L4_4_p4": "The monkey had his snack! It ran into the garden — fast! Stop! said the boy. But the monkey just grinned and ran on.",
  "L4_4_p5": "The boy ran after it. Round and round! The brown furry tail went past a tree. Oh no! Where did it go?",
  "L4_4_p6": "At last, the boy stopped. The monkey sat by the water with his snack. It had not run off! It just sat and munched.",
  "L4_4_p7": "Mum got there too. Her dark gown flowed in the warm air. She had a true glow. You ran so fast! she said with a grin.",
  "L4_4_p8": "The boy sat down with Mum by the water. The monkey was still munching. Wow! said the boy with a grin. This is the best day!",
};

// ─── L5 Sentences ───────────────────────────────────────────────────────────
const L5_SENTENCES = {
  // L5.1 Before the Shore (rewritten 2026-05-05 — full decodability + Dad-only)
  "L5_1_p1": "The boy went through the park on his way home. He was tired, and his feet were sore from play. He sat on a bench to rest for a bit. On the path he saw a smooth, flat stone. He bent to pick it up and held it.",
  "L5_1_p2": "The stone felt cool in his hand as he sat. It had a shine, like one found by the shore. Once, before this winter, he had seen a stone like it. He sat still and went back to that day. Leaves fell near the bench, and he shut his eyes.",
  "L5_1_p3": "Before winter came, Dad took him to the shore. The sea air was pure and fresh, and the sand felt soft. \"Let us explore!\" said Dad, and they ran on the beach. They splashed in waves and watched the fire by the rocks. Dad took a photo as flames moved in slow motion.",
  "L5_1_p4": "The next day, he explored the rock pools near the shore. He found more and more shells and set them in a pile. Dad helped him put the best ones on a wire. \"We can make a gift,\" said Dad, and the boy grinned. He twisted the wire with care, and it looked nice.",
  "L5_1_p5": "Then it was time to go home from the shore. He spotted a smooth, flat stone by the water line. \"Keep it safe,\" said Dad, so you remember this trip. He put the stone in his pocket and smiled.",
  "L5_1_p6": "Back on the bench, the boy sat up and smiled. He still had that shore stone at home on a shelf. But this was a new stone, smooth and cool to hold. He held it up to the light and took a breath. The shore felt so close again, right at his feet.",
  "L5_1_p7": "He ran home and in at the front door. He got his shore stone, so now he had two. He knew where Dad kept the wire and thin cord. He made a loop for each stone and tied knots. He wrote Dad on a tag, for a gift later.",
  "L5_1_p8": "He gave the stones to Dad in the sitting room. \"From the shore and from the park,\" he said, proud. Dad smiled wide and hooked them on his brown bag. \"I will keep them with me, so I never forget.\" Dad wore them that day, hanging bright on his bag.",
  // L5.2 The Red Fox
    "L5_2_p1": "Dad sat at the fire in his thick wool socks. I stood near the door with my coat and hat. It was cool outside, and I could hear a soft crunch. I put my ear to the door and heard it again. What could it be out there in the snow?",
    "L5_2_p2": "I pulled the door wide and stepped out into the woods. It was still cool, and I could hear that crunch again. It was near a tall pine tree, but I could not see more. A red tail peeked out, swayed, then went still. I crept near.",
    "L5_2_p3": "Out popped a fox, with neat paws and sharp ears. He looked at me and sat down in the soft snow. I felt a bit of fear, but I did not run. I spoke soft and clear. \"Dear fox, you are safe with me.\"",
    "L5_2_p4": "The fox sniffed and trotted off into the trees. Then a soft tap came near a rock at the stream. Two long ears stuck up, pink and still in the snow. A rabbit was near the rock, under a thin sheet of snow. I kept still.",
    "L5_2_p5": "The rabbit sprang from the rock and ran to the stream. It leapt clear over the water with long, strong legs. Splash, splash, then the rabbit ran on again. I called out as it landed safe and kept on. What a dear, quick rabbit with big pink ears!",
    "L5_2_p6": "Next, I spotted two dark points on a pale mound of snow. They poked up out of the snow like small twigs. I went near and a snort came from under the mound. Was it a log, or was it a deer? I waited, still as a rock, and did not fear.",
    "L5_2_p7": "Out stepped a deer, tall and grand, with big antlers. He stood near me and did not run. I spoke clear and slow. \"Dear deer,\" I said, \"we will not harm you.\" He looked at me, then stepped off into the trees.",
    "L5_2_p8": "Snow dusted my coat as I ran back to the door. Dad waited there, warm from the fire and keen to hear. \"I saw a fox, a rabbit, and a deer!\" We sat on the floor indoors and read at the fire.",
  // L5.3 The Kite
  "L5_3_p1": "Kites of every colour filled the sky over Jaipur. Red and green and blue, they soared and spun and dipped in the clear winter air. The girl stood on the rooftop and watched with wide eyes. She wanted to fly a kite more than anything. But she did not own one.",
  "L5_3_p2": "Dadaji sat near the wall, smiling at all the kites. He held up a thin sheet of paper and two bamboo sticks. We can make one, he said. I can show you the instructions. Pay close attention and follow each step. She felt a rush of joy.",
  "L5_3_p3": "Step one, said Dadaji. Lay the sticks in a cross shape. Tie them at this section here — that is the frame. With great concentration, the girl tied the sticks. Perfect! said Dadaji. Now pass the string around each point.",
  "L5_3_p4": "Step two, said Dadaji. Lay the paper flat on the frame. Fold each section over the string and press it down. The girl worked fast. But the paper slipped. There was a rip — a long split ran right through the kite. Her heart sank.",
  "L5_3_p5": "The girl crumpled the torn paper in her hands. I am full of frustration! she said. I give up! Dadaji did not rush. He sat with a calm look on his face and waited. Are you sure you want to stop? he said softly. We are not done yet.",
  "L5_3_p6": "The girl took a long breath and tried again. Slow action this time, said Dadaji. Press each section flat before you move on. Work in one direction only. She worked with great care. She pressed. She smoothed. She waited. The paper held. It is working! she cried.",
  "L5_3_p7": "At last, the kite was done. Look at the picture we made! she cried. Dadaji tied the string to the centre. Now for the action! he said. Run in that direction and let the wind catch it! She ran with all her might and let the string out.",
  "L5_3_p8": "The kite shot up into the pure blue sky. It soared higher and higher! Woh Kata! cheered the people on the next rooftop. Dadaji clapped his hands with joy. The girl watched her kite spin and dance over the pink city. Pure joy! she cried. Pure joy!",
  // L5.4 The Celebration
  "L5_4_p1": "Dad and I came to a bright market street. Doors stood open, with flowers over rails on each floor. Dad went to a stall, and I sat near a door. I did not know anyone and felt a bit left out.",
  "L5_4_p2": "I could hear chat and calls from each stall and door. I went the wrong way and slid by the pears. Men and mums looked at them, but no one saw me. I felt my fear rise and I went back.",
  "L5_4_p3": "I sat on a step by a tall brown door. People were near, but no one came to chat. I shut my eyes and counted to ten, very slow. I did not want to cry, but I was tired.",
  "L5_4_p4": "Then a boy came by and sat down near me. He gave me a big grin and held out his hand. Do you want to look at that stall? he said. I went with him, and my fear went away.",
  "L5_4_p5": "We met a man at a stall of pears and melons. He let us hold a melon, and it was big. My new pal put it on top like a hat. I chose a ripe pear, and we paid the man. He gave us a small portion.",
  "L5_4_p6": "We sat on the steps and ate the pear and melon. Sweet, wet bits ran on my chin and on my shirt. We both smiled more and more, with pure joy inside. When we were done, we slid the peels in a bin.",
  "L5_4_p7": "Then my pal said, Look, Dad is near. We went down the street, and he ran before me. We got one more pear and a wrap for Dad. I said, Thank you, and he said, See you soon.",
  "L5_4_p8": "Dad knelt and held me, and I felt safe again. He got a photo of us with my new pal. I said, Can I see him next year? Dad said yes, and I waved to the boy. This street felt like home, and my heart was light.",
};

// ─── L6 Sentences ───────────────────────────────────────────────────────────
const L6_SENTENCES = {
  // L6.1 My Marvellous Home (rewrite 2026-05-05 — Sam, no foreign place names)
    "L6_1_p1": "Sam sat on the front steps of his block, chin in hands. Hot air shimmered above the road, and horns gave short, cross honks. \"Nothing glorious or fabulous ever turns up on this street,\" he said. From the market corner came calls, clatter, and the rattle of carts. A man with a worn notebook sat beside Sam and said nothing.",
    "L6_1_p2": "\"You look cross and bored,\" the man said, tapping his little notebook. Sam shrugged. \"I live on this street. It is just flats, traffic, and the same old market.\" The man's eyes looked luminous and joyous, as if he knew something tremendous. \"I have seen marvellous lands,\" he said, leaning forward toward Sam. \"Let me show you how glorious this place is, if you are curious.\"",
    "L6_1_p3": "They walked together to the broad road that runs beside the river. \"That is the great river,\" the man said in a wondrous tone. \"It has flowed past this spot for thousands and thousands of years.\" Sam had used this river road countless times, but he had not looked. He stared at the wide green water as boats slid past, amazed.",
    "L6_1_p4": "Next, the man led Sam back to the old bakery on their street. A warm, delicious smell of bread drifted out through the wide door. \"The baker has worked in this shop for forty years,\" he said. \"He knows many people by name and is generous with crusts.\" The baker smiled, then held out flat bread, hot, round, and fabulous. Sam had walked past many times, yet had not waved or said hello.",
    "L6_1_p5": "They went on, and the man pointed up at the slim tower. \"On still mornings, the call from that tower carries for miles,\" he said. Down by the river, sail boats drifted past on the calm water. A cluster of street cats lay still, sunning on a long, warm wall. \"Is this place still boring to you?\" the man asked, smiling.",
    "L6_1_p6": "Sam stood very still and looked round with new, curious eyes. Far off, the enormous pyramids sat golden in the dusty afternoon haze. From the market, joyous calls drifted round the corner and along the road. From the bakery, that fabulous smell rose again and made his tummy rumble. \"It is marvellous,\" he said in a hushed, amazed tone. \"So marvellous.\"",
    "L6_1_p7": "The man smiled and put a notebook and a pen in Sam's hand. \"Write down what you see,\" he said. \"Give each place a name.\" Sam sat on the wall and wrote neat labels for each place. He wrote: The Marvellous River Road, The Enormous River, The Famous Bakery. Then he added: The Joyous Market and The Glorious Tower above the flats. He grinned, feeling proud and capable, as if the street sang back.",
    "L6_1_p8": "Later, after the storyteller had gone, Sam sat on his steps again. This time he was not bored, but curious, watchful, and adventurous. The enormous city hummed and buzzed around him with marvellous, ordinary life. He opened his notebook and added one last label: My Marvellous Home. From that day on, he felt the world outside his door was glorious.",
  // L6.2 You Are Remarkable
  "L6_2_p1": "The Lantern Festival had filled the river park with golden light. Hundreds of glowing lanterns drifted above the Li River, and the karst mountains rose like dark peaks behind the city. The girl was watching a paper lantern float upward when she noticed something terrible. A small boy sat alone on a stone step, clutching a stuffed panda, with tears on his face. The people all around him walked past as if he were invisible. She stopped.",
  "L6_2_p2": "She crouched down beside the boy and spoke to him in a gentle voice. He was perhaps three years old, and he looked absolutely miserable — his face red, his eyes wide, his small hands gripping the panda. \"Where is your family?\" she asked, but he could only shake his head and sob. It was clear he was not capable of finding them alone. She looked around at the crowds flowing past, and she made a decision: she was responsible for helping him, and it was possible to do it.",
  "L6_2_p3": "She pulled a small notebook from her jacket pocket and thought for a moment. Then she wrote a careful note in neat, readable handwriting and tore it out. The note said: \"Lost child — dark jacket, green buttons, age 3. He is by the red lantern at the bridge. His family is searching for him. If you have seen them, please come at once.\" She held it up as high as she could. It was a sensible and responsible plan.",
  "L6_2_p4": "She took the boy's hand and walked towards the busy lantern stalls. An elderly woman selling tangyuan shook her head when she saw the note, but pointed further along the riverbank towards the bridge. A group of young people gathered, read the note, and looked around — but nobody recognised the child. Each person was willing, but none were able to help. She did not give up. Giving up was not a reasonable or responsible option.",
  "L6_2_p5": "Near the entrance of the park, she spotted a security guard in a yellow jacket. She walked straight up to him, held out the note, and said clearly, \"This child is lost. He has been here for some time.\" The guard read the note carefully, nodded, and spoke into his radio. He asked her to stay in one comfortable spot beside the red lantern at the bridge. She sat with the boy and told him a quiet story about the panda in his arms. He stopped crying and leaned against her shoulder.",
  "L6_2_p6": "While they waited, she bought the boy a warm roasted sweet potato from a nearby cart. His face changed — from miserable and terrified, to curious, to something almost cheerful. He held the sweet potato in both hands and looked up at her. \"Panda,\" he said, and held the toy out to her. It was an adorable thing to do, and she understood it at once — he was sharing his most valuable possession with her. She held it carefully, and for the first time that evening, he smiled.",
  "L6_2_p7": "The guard came running back with a woman and a man following close behind. The little boy looked up — and in less than a second, his face went from frightened to overjoyed. \"Mama!\" he cried, and the woman rushed forward and scooped him up, clutching him in an incredible, tearful hug. The man gripped the guard's hand and then looked at the girl with a grateful and disbelieving expression. She stood a little way back, watching the most remarkable reunion she had ever seen, with something warm and steady building inside her.",
  "L6_2_p8": "The mother turned to the girl, still holding her son tightly. \"You kept him safe,\" she said, and her voice was not quite steady. \"You stayed. You helped.\" She paused for a moment, and then she said something the girl would always remember. \"You are remarkable.\" The girl walked back through the incredible festival, past the glowing lanterns and the karst mountains rising in the dark. She thought about what it meant to be capable, and she thought it was quite simple: when something terrible is visible, a responsible person does not walk past.",
  // L6.3 It Looks Suspicious!
  "L6_3_p1": "Luca stood in Nonna's spacious kitchen and crossed his arms. The morning sun streamed through the open window, and the bright clifftop houses of the Amalfi Coast glowed pink and cream outside. Nonna had set a big glass dish on the tiled bench, and inside it sat something green, something red, and something Luca did not trust. \"What is that?\" he asked, taking a cautious step back. \"It looks suspicious.\"",
  "L6_3_p2": "Nonna just smiled. She was a gracious and patient woman who had fed this cautious boy for all of his visits, and she understood him. She picked up a fat, ripe lemon from the tree outside the door — its skin was bright and luscious. She sliced it open, and a sharp, fresh smell burst into the room. Luca sniffed. \"That smells not bad,\" he admitted, but he remained cautious.",
  "L6_3_p3": "Nonna drizzled green oil over the sliced tomatoes and torn basil leaves. Then she grated fresh lemon rind on top and added a pinch of salt. \"This is bruschetta,\" she said. \"It is simple and nutritious.\" Luca peered at the crusty bread stacked on a plate beside the dish. He picked one up and inspected it. \"It looks suspicious,\" he said again. But the smell was delicious — fresh and bright and sharp.",
  "L6_3_p4": "Next, Nonna filled a big pot with hot water and set it on the stove. She tipped in long strands of fresh pasta and stirred them with a wooden spoon. \"Pasta al limone,\" she announced. \"My mother's precious secret — lemon, cream, and a sprinkle of pepper.\" The steam that rose from the pot smelled absolutely delicious, and Luca found himself stepping closer, even though he was still cautious. \"I am not eating that,\" he said, but his feet did not step back.",
  "L6_3_p5": "Nonna set the last dish on the kitchen table: a small glass cup of pale yellow granita, topped with a thin slice of lemon and a mint leaf. \"Limoncello granita,\" she said. \"Frozen, sweet, and scrumptious. This is the most delicious treat on the Amalfi Coast.\" Luca looked at the bruschetta, the pasta, and the granita. All three smelled delicious, and he had to admit something: he was not just cautious any more — he was also very, very hungry.",
  "L6_3_p6": "He reached out — slowly, carefully — and picked up one small piece of bruschetta. He took the tiniest bite. His eyes went wide. It was delicious. He took a bigger bite, and then another. The fresh tomato and lemon burst across his mouth, and the crusty bread was perfect. He tried the pasta next. It was creamy, sharp, and absolutely scrumptious. \"Nonna,\" he said, and his voice was thick with feeling, \"this is the most delicious thing I have ever tasted.\"",
  "L6_3_p7": "The front door clicked open and small feet pattered down the hall. Luca's little sister Sofia ran into the kitchen, her yellow headband bright against her dark curls. She stopped at the table and stared at the granita with a suspicious look on her face. \"What is that?\" she asked, pointing at the frozen treat. \"It looks suspicious!\" Luca grinned. He knew those words — he had said them himself, not long before.",
  "L6_3_p8": "Luca picked up the glass of granita and held it out to his sister. \"Trust me,\" he said. \"I was suspicious too. But Nonna's cooking is nutritious and delicious — and this is the most precious treat on the whole coast.\" Sofia took a cautious lick. Her face lit up at once. Nonna watched them from the window, the lemon groves glowing golden on the clifftop behind her, and she thought that feeding the people you love was the most ambitious and delicious thing a person could ever do.",
  // L6.4 The Incredible Bush Walk
  "L6_4_p1": "May felt ambitious at the start of the bush walk trail. The enormous blue mountains stretched before them, with famous blue haze above the peaks. She said, \"I will spot it all first today, as I am the most capable.\" Tom said nothing, opened his small notebook, and started a careful sketch. Dad waited nearby with water, smiling at his ambitious start.",
  "L6_4_p2": "The trail led them through spacious groves of tall gum trees. May strode ahead, ambitious and keen, pointing at things that seemed glorious. \"Look at that gorgeous parrot in the branches,\" she called to Tom. Tom walked behind, slower and more cautious, with his notebook in hand. He crouched by a fallen log, peering at something small and precious.",
  "L6_4_p3": "\"Tom, you are too cautious and too slow,\" May said with a frown. \"If you keep stopping, it will be impossible to reach the lookout.\" She was not gracious about it and stamped off down the track. Tom shut his notebook and tried to keep up, but felt nervous. From deep in the bush he heard a curious mix of calls.",
  "L6_4_p4": "Tom stepped off the trail, cautious and sensible, placing each foot with care. Behind a thick fern, he sighted a wondrous fan tail mimic bird. Its enormous tail feathers lifted and fanned like a gorgeous silver sail. The bird performed a famous song, copying calls from many creatures. It was the most incredible thing Tom had ever seen, and he sketched fast.",
  "L6_4_p5": "\"May, come here, be sensible, and move very slowly to me,\" Tom whispered. May padded back along the trail, still a little suspicious of this fuss. She crouched beside Tom, and her face changed when she saw the bird. She breathed, \"That is remarkable, and I had no idea it was here.\" She grew conscious that speed was not admirable.",
  "L6_4_p6": "When the mimic bird slipped back, they walked on together. This time May let Tom set the pace, which felt right and sensible. He pointed out observable things she never noticed, like a notable pattern in bark. He found a tiny bush berry that was edible and delicious. \"You are admirable at this,\" May said, and Tom blushed but smiled.",
  "L6_4_p7": "Near the end of the trail they reached the visitor hall. On the walls hangs a display of swirling, joyous dot art. Tom held up his notebook and compared his sketches with the paintings. \"Your sketches are incredible,\" said Dad, who was comfortable walking at the back. May nodded, proud of his remarkable skill, and admired his careful sketches.",
  "L6_4_p8": "That evening, Tom read aloud from his notebook while May sat beside him. He read, \"Today was an incredible bush walk with enormous blue mountains.\" \"I was cautious and still, and I spotted a precious mimic bird.\" \"It was the most glorious and wondrous moment of the whole walk.\" He closed the notebook, and May said, \"You are remarkable, Tom.\"",
};

const ALL_SENTENCES = { ...L2_SENTENCES, ...L3_SENTENCES, ...L4_SENTENCES, ...L5_SENTENCES, ...L6_SENTENCES };

// Ensure output dir exists
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function generateAudio(key, text) {
  return new Promise((resolve, reject) => {
    const outPath = path.join(OUTPUT_DIR, `${key}.mp3`);
    if (fs.existsSync(outPath)) {
      console.log(`SKIP ${key} (already exists)`);
      return resolve();
    }

    const body = JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: { stability: 0.75, similarity_boost: 0.75, speed: 0.85 },
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errBody = '';
        res.on('data', d => errBody += d);
        res.on('end', () => {
          console.error(`FAIL ${key}: ${res.statusCode} ${errBody}`);
          reject(new Error(`${res.statusCode} for ${key}`));
        });
        return;
      }
      const file = fs.createWriteStream(outPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`OK   ${key}`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const entries = Object.entries(ALL_SENTENCES);
  console.log(`Generating ${entries.length} sentence audio files (L2-L5)...`);
  let ok = 0, skip = 0, fail = 0;

  for (const [key, text] of entries) {
    try {
      const outPath = path.join(OUTPUT_DIR, `${key}.mp3`);
      if (fs.existsSync(outPath)) { skip++; console.log(`SKIP ${key}`); continue; }
      await generateAudio(key, text);
      ok++;
      // Rate limit: ~2 per second
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      fail++;
      console.error(`ERR  ${key}: ${e.message}`);
    }
  }

  console.log(`\nDone! Generated: ${ok}, Skipped: ${skip}, Failed: ${fail}`);
}

main().catch(console.error);
