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
  // L5.1 The Shore Stone
  "L5_1_p1": "The boy went home from the park. He was tired, and his feet were sore. He sat on a bench to rest. Then he saw something on the path — a smooth, flat stone. He picked it up.",
  "L5_1_p2": "The stone felt cool in his hand. It had a shine, like something from the shore. Once, before this week, he had seen a stone just like it. He sat still and let his mind go back.",
  "L5_1_p3": "Before the cold came, he went with Mum and Dad to the shore. The air was fresh and the sand soft. Come and explore with me! said Dad. They ran along the beach and played in the waves. That night, they sat by a fire and the flames jumped and flicked.",
  "L5_1_p4": "The next day, he explored the rock pools. He found more and more shells! Mum helped him put them on a wire. We can make a gift, she said. He twisted the wire with care. It looked so nice!",
  "L5_1_p5": "Then it was time to go. He spotted a stone by the shore. It was smooth and flat. Keep it safe, said Dad. So you never forget this trip. He put the stone in his pocket with a smile.",
  "L5_1_p6": "The boy sat up and looked around. He still had that shore stone at home. But in his hand was a new stone, just as smooth! He held it up to the light. The shore felt so close.",
  "L5_1_p7": "He ran home to get his shore stone. Now he had a pair! He took some wire and made a loop for each one. He would make a gift for Mum — just like before.",
  "L5_1_p8": "He gave the stones to Mum. From the shore and from the park, he said. She smiled wide. I will keep them with me, she said. So I never forget. She wore them on her bag that day.",
  // L5.2 The Red Fox
  "L5_2_p1": "I was sitting on the floor when I heard a sound. Crunch, crunch, crunch. It came from near the door. What could it be? I crept over and put my ear to the door. Crunch, crunch. I heard it again.",
  "L5_2_p2": "Dad heard it too. He was in his seat by the fire. He looked at me and smiled. I can tell what that is, he said. It is clear to me. But I will not say.",
  "L5_2_p3": "But what was it? I saw a dark shape near the door through the window. It seemed to shift in the snow. Was it a big beast from the forest? My heart beat fast. I felt a little fear.",
  "L5_2_p4": "Dad just sat and smiled at me. My dear, he said, you do not need to fear. Just open the door and look. You will see what it is.",
  "L5_2_p5": "I reached for the door. My hand felt cool on the handle. I pulled the door wide open. And sitting in the snow was... a fox! A soft red fox with big, pointed ears!",
  "L5_2_p6": "Dad stood up and came over. I have been feeding him, he said. The poor little thing was so thin. He comes near when he is looking for food.",
  "L5_2_p7": "Dad got some food and set it on the floor of the step. The fox crept near, his feet soft on the snow. He ate and ate! His tail flicked as he munched. I sat on the floor and just looked at him.",
  "L5_2_p8": "Dear little fox, I said to him. You are safe. Come back soon. Dad smiled at me. He will, my dear. He can tell that we are his friends. The fox looked up, then ran back into the trees.",
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
  "L5_4_p1": "I came to a celebration in a colourful street near the shore. But I did not know anyone. I stood alone in the corner, watching the people dance and sing. My heart felt heavy.",
  "L5_4_p2": "I could hear music and laughter from every door. I could see food and drums. But no one saw me. I felt left out.",
  "L5_4_p3": "The song grew louder. Everyone was having the best time. But not me. I put my hand on my heart. I was alone.",
  "L5_4_p4": "Then a boy saw me. He had a warm smile. He came over and held out his hand. Will you come dance with me? he said. I felt surprised and happy!",
  "L5_4_p5": "We went to a food stall. The man gave us golden-brown acarajé. It was so good! I took a bite and smiled. This pure joy was new to me.",
  "L5_4_p6": "We walked down the street together. We saw the old colourful buildings. We heard drums near the fire. I like this place, I said. And I like you, said the boy.",
  "L5_4_p7": "Soon we were dancing! Other children came to join us. The music was all around. We spun and laughed. The fire and the drums made the perfect sound for our dance.",
  "L5_4_p8": "As evening came, we sat together. I held the boy's hand. I did not want to leave. Will you come back? he asked. Yes, I said. This is my place too.",
};

// ─── L6 Sentences ───────────────────────────────────────────────────────────
const L6_SENTENCES = {
  // L6.1 The Marvellous Neighbourhood
  "L6_1_p1": "Yusuf sat on the front steps of his apartment block and frowned at the street below. Rows of cream-coloured blocks lined the road, and cars honked in the hot afternoon heat. From the market around the corner, he could hear the calls of vendors and the clatter of carts. \"Nothing glorious or fabulous ever happens here,\" he muttered. \"This place is so ordinary.\" Just then, a curious-looking man with a worn notebook sat down quietly on the step beside him.",
  "L6_1_p2": "\"You look like somebody who thinks they have seen everything there is to see,\" said the man with a smile. Yusuf shrugged. \"I live here. It is just houses, traffic, and the same old market.\" The man had a luminous look in his eyes, as if he knew something tremendous. \"I have spent my whole life travelling to marvellous places,\" he said, leaning forward. \"And I am going to tell you something. This is one of the most glorious cities on Earth.\"",
  "L6_1_p3": "The man stood and walked with Yusuf to the wide road that ran along the edge of the river. \"That is the Nile,\" he said in a wondrous voice, \"the most famous river in the whole world.\" \"It has flowed past this very spot for thousands and thousands of years.\" Yusuf had walked along the corniche countless times, but he had never stopped to wonder. He looked at the grey-green water as if he was seeing it for the very first time.",
  "L6_1_p4": "Next, the man led Yusuf around the corner to the old bakery on their street. An enormous cloud of warm bread smell drifted out through the open door. \"The baker has been here for forty years,\" said the man. \"He knows every family by name.\" Yusuf realised he had never once stopped to wave or say good morning to him. The baker spotted them and held out a warm round of aish baladi, the famous flat bread of Egypt.",
  "L6_1_p5": "They walked on, and the man pointed to the slim minaret that rose above the rooftops. \"On quiet mornings, the call from that tower can be heard for miles and miles,\" he said. Down by the river, white-sailed boats drifted past on the gleaming water. A cluster of street cats — Cairo was famous for its cats — sunned themselves on a warm wall. \"Is this place still boring to you?\" the man asked, his eyes twinkling.",
  "L6_1_p6": "Yusuf stood still for a moment and looked around with new, curious eyes. He could see the enormous pyramids on the far horizon, golden in the dusty afternoon haze. He could hear the joyous calls of the market sellers drifting around the corner. He could smell the fabulous bread from the bakery he had walked past hundreds of times. \"It is marvellous,\" he said, in a quiet, amazed voice. \"My neighbourhood is truly marvellous.\"",
  "L6_1_p7": "The man smiled and handed Yusuf a small notebook and a pen. \"Write down what you see,\" he said. \"Give each part of your neighbourhood the name it deserves.\" Yusuf picked up the pen and began to write, one label for each place he could now see. He wrote: The Marvellous Corniche. The Enormous Nile. The Famous Bakery. The Joyous Market. The Glorious Minaret. \"These are the tremendous things that make up my home,\" said Yusuf, and he felt proud.",
  "L6_1_p8": "Later, when the storyteller had gone, Yusuf sat on his step once more. But this time, he was not bored — he was curious and adventurous, watching the world with new eyes. The enormous city hummed and buzzed all around him, full of marvellous, ordinary life. He opened his notebook and added one last label at the bottom of the page: My Marvellous Home. And from that day on, Yusuf never forgot that the most glorious place in the world was the one right outside his door.",
  // L6.2 You Are Remarkable
    "L6_2_p1": "The Lantern Festival filled the river park with golden light. Lines of red lanterns drifted over the water and the stalls. Dark rock hills rose behind the city like black shapes. A girl looked up and saw something terrible. A small boy sat on a stone step, hugging a panda. People went past as if he were invisible, and she stopped.",
    "L6_2_p2": "She knelt by the boy and spoke in a soft voice. He looked about three, and he was shaking and very sad. \"Where is your family?\" she asked, but he could only sob. It was clear he was not capable of finding them alone. She looked round at the crowd and started to make a plan.",
    "L6_2_p3": "She took a small notebook from her pocket and thought hard. Then she wrote a clear note in neat handwriting. It said, \"Lost child: dark jacket, green buttons, age three, soft panda. He is by the big red lantern at the stone arch.\" She held the note up high and asked people to read it. It was a sensible, responsible plan.",
    "L6_2_p4": "She took the boy's hand and went towards the lantern stalls. An old woman selling rice balls read the note and sighed. She pointed along the bank and sent them on to the arch. Some older kids read the note and looked all around. No one knew the child, and no one was able to help. She did not give up.",
    "L6_2_p5": "Near the gate, she saw a park warden in a yellow jacket. She went right up to him, held out the note, and spoke. \"This child is lost. He has been here for some time.\" The warden read the note, nodded, and spoke into his radio. \"Stay by the red lantern at the stone arch,\" he said. She sat with the boy and told a soft story.",
    "L6_2_p6": "As they waited, she bought him a warm sweet potato from a cart. His face changed from sad to curious, then to almost cheerful. He held the potato in both hands and looked up. \"Panda,\" he said, and he held the toy out to her. It was adorable, and she understood what he meant. She took the panda, and he smiled.",
    "L6_2_p7": "The warden came back, and a woman and a man ran with him. The little boy looked up, and then he was overjoyed. \"Mama!\" he cried, as the woman rushed in and hugged him. She stood back a little, glad to see such an incredible hug.",
    "L6_2_p8": "The mother turned to the girl, still holding her son very tight. \"You kept him safe, and you helped.\" She paused, then said: \"You are remarkable.\" The girl went back through the festival, past red lanterns and dark hills. She felt warm and capable. When something terrible is visible, a responsible person does not walk past.",
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
  "L6_4_p1": "Mia was ambitious. She stood at the start of the bush walk trail and looked out at the enormous Blue Mountains stretching before them. The famous blue haze hung over the peaks like a glorious curtain of mist. \"I am going to spot everything first,\" she told her brother Tom. \"I am the most capable one here.\" Tom said nothing. He just opened his small notebook and started to draw.",
  "L6_4_p2": "The trail led them through spacious groves of tall gum trees. Mia strode ahead, pointing at everything she saw. \"Look at that gorgeous rosella in the branches!\" she called back. \"And those enormous cliffs are visible from here — they are famous!\" Tom walked behind, slower and more cautious. He crouched down beside a fallen log and peered at something small and precious that Mia had walked straight past.",
  "L6_4_p3": "\"Tom, you are too cautious and too slow,\" Mia said with a sigh. \"If you keep stopping, it will be impossible to reach the lookout before lunch.\" She was not gracious about it. Tom closed his notebook and tried to keep up, but he felt nervous. He could hear something incredible deep in the bush — a curious sound, like a song mixed with the calls of other birds. He stopped walking and listened.",
  "L6_4_p4": "Tom crept off the trail, cautious and sensible, placing each foot with care. Behind a thick fern, he saw something wondrous — a lyrebird. Its enormous tail feathers fanned out like a gorgeous silver veil. The bird was performing its famous song, copying the calls of every creature in the bush. It was the most incredible thing Tom had ever seen. He held his breath and sketched it in his notebook as fast as he could.",
  "L6_4_p5": "\"Mia!\" Tom whispered. \"Come here — but be flexible and go slowly!\" Mia came back along the trail, looking suspicious. But when she crouched beside Tom and saw the lyrebird, her face changed. \"That is remarkable,\" she breathed. \"I had no idea it was there.\" She was conscious now that she had rushed past something precious. Being fast did not make her more capable — it just meant she had missed the most valuable thing on the whole walk.",
  "L6_4_p6": "After the lyrebird slipped back into the bush, they walked on together. This time, Mia let Tom set the pace. He showed her observable things she had never noticed — a notable pattern in the bark of a gum tree, a tiny scrumptious bush berry that was edible, and the delicious smell of eucalyptus oil hanging in the warm air. \"You are admirable at this,\" Mia said, and she meant it. The glorious view from the lookout was even better when they reached it side by side.",
  "L6_4_p7": "At the visitor centre near the end of the trail, they found a gallery of Aboriginal dot art on the walls — swirling, joyous paintings of the land and its creatures in dots of red, gold, and white. Tom held up his notebook and compared his own drawings to the art. \"Your sketches are incredible,\" said Dad, who had been comfortable walking at the back the whole time. \"You were responsible and patient, and you saw more than anyone.\" Mia nodded. She was not adventurous in the same way as Tom, but she was learning that his way of seeing was just as remarkable as hers.",
  "L6_4_p8": "That evening, Tom read from his notebook. \"Dear Journal. Today was an incredible bush walk. The enormous mountains were visible through the famous blue haze.\" \"I was cautious and quiet, and I spotted a precious lyrebird with gorgeous tail feathers performing its marvellous song.\" \"Mia missed it at first, but then she came back and we watched it together. It was the most impossible, glorious, wondrous moment.\" He closed the notebook. Mia smiled. \"You are remarkable, Tom,\" she said.",
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
