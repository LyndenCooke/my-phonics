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
  "L2_1_p1": "The day ends. I sigh.",
  "L2_1_p2": "We go out. It is night.",
  "L2_1_p3": "See the lights! I can see!",
  "L2_1_p4": "It is dim. I need a light.",
  "L2_1_p5": "A light up high! The moon!",
  "L2_1_p6": "Dad can see. I am sad.",
  "L2_1_p7": "My cat! I see it! Yay!",
  "L2_1_p8": "Day and night! I say Yay!",
  // L2.2 Hot Food, Cool Moon (was "Moo at the Zoo"; re-set 2026-07-22 — night food market)
  "L2_2_p1": "The sun dips low. I go with my mum to get food.",
  "L2_2_p2": "It is night. Food shops in a row! Yum!",
  "L2_2_p3": "I see a man at a big wok. Hiss! Pop! The food hops!",
  "L2_2_p4": "Mum gets me a bowl. Ooh! It is too hot!",
  "L2_2_p5": "I huff and puff on it. Huff! Puff! This is no fun!",
  "L2_2_p6": "Mum said, Sit with me. See the moon!",
  "L2_2_p7": "The moon is big and yellow! Then I dig in. It is not hot! Yum, yum, yum!",
  "L2_2_p8": "We sit low on the mat. The night is cool. I am with my mum. It is fun!",
  // L2.3 Farm Visit
  "L2_3_p1": "We go far in the car. I can see a farm!",
  "L2_3_p2": "The farm is big! I see a yard with corn in a jar.",
  "L2_3_p3": "I get a fork for the garden. I dig, dig, dig! Good food for the farm.",
  "L2_3_p4": "Now it is dark. I look at the barn. I need to look in the barn!",
  "L2_3_p5": "I get a torch for the dark. I march to the big barn door.",
  "L2_3_p6": "It is dark in the barn. I look far into a corner. I see a thing!",
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
  "L3_1_p8": "A prize! A flat plate with my name on it! I wave at my mates. What a good day!",
  // L3.2 The Stone Flute
  "L3_2_p1": "Mum has a huge box at home. This is for you, she said. What can be inside?",
  "L3_2_p2": "I take the top off the box. Inside is a stone flute! It looks old but so cute.",
  "L3_2_p3": "I blow into the flute. What a rude, flat note! That is not a tune at all.",
  "L3_2_p4": "Close your lips, spoke Mum. Blow soft and slow, like this. She gave a cute, sweet note.",
  "L3_2_p5": "I use the flute like Mum said. A cute note rose up! I play note, note, note!",
  "L3_2_p6": "Those notes make a tune at last! The tune fills up the room. It is huge and sweet!",
  "L3_2_p7": "The tune woke Dad from his nap. What a cute stone flute! said Dad. He gave me a huge smile.",
  "L3_2_p8": "We all sit close to Mum. I play my stone flute and smile. The best tune fills the room!",
  // L3.3 The Ripe Mango
  "L3_3_p1": "The mango hangs up high in the tree. It is big and ripe. The boy wants it so much, but the branch is too far.",
  "L3_3_p2": "He jumps up high. His hands reach and reach, but he can not grab it. I am not big! he said.",
  "L3_3_p3": "A girl runs up with a long stick. She spies the same ripe mango too. I want that treat! she said.",
  "L3_3_p4": "She tries to reach it with the stick. Tap, tap, tap! But the mango stays up high. This is no good, she said.",
  "L3_3_p5": "What if I lift you up? said the boy. Then you can reach it with the stick! The girl grins. Yes! We can be a team!",
  "L3_3_p6": "He lifts her up high. She swings the stick and hits the branch. Crack! The mango falls to the ground.",
  "L3_3_p7": "We got it! cries the girl. The mango is plump and sweet. They each eat a big bit. What a feast!",
  "L3_3_p8": "I am glad I met you, said the boy. The girl ties a leaf on the stick. This is OUR tree, she said. And from that day, they are the best mates.",
  // L3.4 Min's Hawk
  "L3_4_p1": "Min gets out her oil sticks and a big sheet. I will draw a hawk with sharp claws! she said. She grips a stick tight.",
  "L3_4_p2": "She draws and draws. The hawk has sharp claws and a long beak. Oil drips on the sheet.",
  "L3_4_p3": "A boy points at it. That is not right! he said. The claws are too big! Min feels raw inside.",
  "L3_4_p4": "She wants to spoil it all. But she stops. No! She takes a fresh sheet. I will draw that hawk! she said.",
  "L3_4_p5": "This time, she draws with smooth oil strokes. The claws look just right. The wings spread wide and shine in the light!",
  "L3_4_p6": "The boy steps up to look. He points at the claws. Those claws are so good! he said. Can I join in?",
  "L3_4_p7": "Min nods. He grabs oil sticks too. They draw a green lawn with soil and straw. They toil and toil!",
  "L3_4_p8": "They pin it up for the class to see. Min grins. I am glad I did not stop, she said. The boy grins too. That hawk is the best!",
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

const ALL_SENTENCES = { ...L2_SENTENCES, ...L3_SENTENCES, ...L4_SENTENCES, ...L5_SENTENCES };

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
      model_id: 'eleven_multilingual_v2',
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
