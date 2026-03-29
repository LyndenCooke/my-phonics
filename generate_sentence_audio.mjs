import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = 'sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

const SENTENCES = {
  "L3_1_p1": "Bikes line up at the gate.",
  "L3_1_p2": "'Ride to the lake and back!' the man said.",
  "L3_1_p3": "Off I go!",
  "L3_1_p4": "Look out!",
  "L3_1_p5": "I can see the lake!",
  "L3_1_p6": "Can I make it back in time?",
  "L3_1_p7": "I am past the line!",
  "L3_1_p8": "A prize!",
  "L3_2_p1": "Mum has a huge box at home.",
  "L3_2_p2": "I take the top off the box.",
  "L3_2_p3": "I blow into the flute.",
  "L3_2_p4": "'Close your lips,' spoke Mum.",
  "L3_2_p5": "I use the flute like Mum said.",
  "L3_2_p6": "Those notes make a tune at last!",
  "L3_2_p7": "The tune woke Dad from his nap.",
  "L3_2_p8": "We all sit close to Mum.",
  "L3_3_p1": "The mango hangs up high in the tree.",
  "L3_3_p2": "He jumps up high.",
  "L3_3_p3": "A girl runs up with a long stick.",
  "L3_3_p4": "She tries to reach it with the stick.",
  "L3_3_p5": "'What if I lift you up?' said the boy.",
  "L3_3_p6": "He lifts her up high.",
  "L3_3_p7": "'We got it!' cries the girl.",
  "L3_3_p8": "'I am glad I met you,' said the boy.",
  "L3_4_p1": "Min gets out her oil sticks and a big sheet.",
  "L3_4_p2": "She draws and draws.",
  "L3_4_p3": "A boy points at it.",
  "L3_4_p4": "She wants to spoil it all.",
  "L3_4_p5": "This time, she draws with smooth oil strokes.",
  "L3_4_p6": "The boy steps up to look.",
  "L3_4_p7": "Min nods.",
  "L3_4_p8": "They pin it up for the class to see.",
  "L3_5_p1": "Kai stands at the coast in the warm rain.",
  "L3_5_p2": "He moans and paces the road.",
  "L3_5_p3": "Then a shape floats on the foam!",
  "L3_5_p4": "The boat sails in close.",
  "L3_5_p5": "He can see fish!",
  "L3_5_p6": "Then a voice calls from the boat.",
  "L3_5_p7": "The boat docks.",
  "L3_5_p8": "'I was at sea for so long,' said Dad.",
  "L4_1_p1": "My purple purse was gone!",
  "L4_1_p2": "Dad came with me to search.",
  "L4_1_p3": "I looked under the bench in the park.",
  "L4_1_p4": "'A currant bun?' said the baker.",
  "L4_1_p5": "Further on, we passed a church.",
  "L4_1_p6": "Then a market lady held up a purple purse!",
  "L4_1_p7": "I turned the purse over.",
  "L4_1_p8": "Dad and I walked home in the warm afternoon.",
  "L4_2_p1": "It was getting dark.",
  "L4_2_p2": "'Can we go and look?' I asked Mum.",
  "L4_2_p3": "Then Mum stopped and stared up.",
  "L4_2_p4": "I stared at the owl.",
  "L4_2_p5": "Then the owl spread its wings and swooped down.",
  "L4_2_p6": "The owl looked up at a hole high in the tree.",
  "L4_2_p7": "The owl swooped back up with a mouse in its claws.",
  "L4_2_p8": "We went home under the stars.",
  "L4_3_p1": "The girl had a pot of new blue glue.",
  "L4_3_p2": "The blue glue spread across the desk and stuck to her hand!",
  "L4_3_p3": "The card landed right on the cat at the foot of the stairs.",
  "L4_3_p4": "The cat flew into the front room and jumped on the shelf.",
  "L4_3_p5": "Then the cat ran into the kitchen.",
  "L4_3_p6": "Then the cat ran out into the garden.",
  "L4_3_p7": "'That cat!' said Dad.",
  "L4_3_p8": "At last, the card was finished.",
  "L4_4_p1": "The sun was up.",
  "L4_4_p2": "They went down to the water.",
  "L4_4_p3": "But then he saw something brown and furry.",
  "L4_4_p4": "The monkey had his snack!",
  "L4_4_p5": "The boy ran after it.",
  "L4_4_p6": "At last, the boy stopped.",
  "L4_4_p7": "Mum got there too.",
  "L4_4_p8": "The boy sat down with Mum by the water.",
  "L5_1_p1": "The boy went home from the park.",
  "L5_1_p2": "The stone felt cool in his hand.",
  "L5_1_p3": "Before the cold came, he went with Mum and Dad to the shore.",
  "L5_1_p4": "The next day, he explored the rock pools.",
  "L5_1_p5": "Then it was time to go.",
  "L5_1_p6": "The boy sat up and looked around.",
  "L5_1_p7": "He ran home to get his shore stone.",
  "L5_1_p8": "He gave the stones to Mum.",
  "L5_2_p1": "I was sitting on the floor when I heard a sound.",
  "L5_2_p2": "Dad heard it too.",
  "L5_2_p3": "But what was it?",
  "L5_2_p4": "Dad just sat and smiled at me.",
  "L5_2_p5": "I reached for the door.",
  "L5_2_p6": "Dad stood up and came over.",
  "L5_2_p7": "Dad got some food and set it on the floor of the step.",
  "L5_2_p8": "'Dear little fox,' I said to him.",
  "L5_3_p1": "Kites of every colour filled the sky over Jaipur.",
  "L5_3_p2": "Dadaji sat near the wall, smiling at all the kites.",
  "L5_3_p3": "'Step one,' said Dadaji.",
  "L5_3_p4": "'Step two,' said Dadaji.",
  "L5_3_p5": "The girl crumpled the torn paper in her hands.",
  "L5_3_p6": "The girl took a long breath and tried again.",
  "L5_3_p7": "At last, the kite was done.",
  "L5_3_p8": "The kite shot up into the pure blue sky.",
  "L5_4_p1": "I came to a celebration in a colourful street near the shore.",
  "L5_4_p2": "I could hear music and laughter from every door.",
  "L5_4_p3": "The song grew louder.",
  "L5_4_p4": "Then a boy saw me.",
  "L5_4_p5": "We went to a food stall.",
  "L5_4_p6": "We walked down the street together.",
  "L5_4_p7": "Soon we were dancing!",
  "L5_4_p8": "As evening came, we sat together."
};

function generateTTS(key, text) {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(OUTPUT_DIR, `${key}.mp3`);

    if (fs.existsSync(outputPath)) {
      console.log(`  SKIP: ${key} (exists)`);
      resolve();
      return;
    }

    const body = JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 }
    });

    const options = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let errData = '';
        res.on('data', d => errData += d);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode} for "${key}": ${errData}`)));
        return;
      }
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        fs.writeFileSync(outputPath, Buffer.concat(chunks));
        console.log(`  OK: ${key}`);
        resolve();
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const entries = Object.entries(SENTENCES);
  console.log(`Generating ${entries.length} sentence audio files...\n`);

  const BATCH_SIZE = 5;
  let done = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = entries.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(([key, text]) =>
      generateTTS(key, text).catch(e => console.error(`  ERROR: ${key} — ${e.message}`))
    ));
    done += batch.length;
    console.log(`Progress: ${Math.min(done, entries.length)}/${entries.length}`);
    if (i + BATCH_SIZE < entries.length) {
      await new Promise(r => setTimeout(r, 300));
    }
  }

  console.log('\nDone!');
}

main();
