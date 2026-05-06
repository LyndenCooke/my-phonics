import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

// All L1 story sentences extracted from interactiveBookData.ts
const SENTENCES = {
  // L1.1 Tap! Tap! Tap!
  "L1_1_p1": "I sit at a mat. Tap, tap, tap!",
  "L1_1_p2": "Is it a rat? Is it a bat?",
  "L1_1_p3": "It is not a rat. It is not a bat.",
  "L1_1_p4": "Tap, tap! I pat at it.",
  "L1_1_p5": "It is a cat! A fat cat!",
  "L1_1_p6": "I pat the cat. The cat naps. I am happy!",
  // L1.2 The Mud on the Dog
  "L1_2_p1": "I got a dog. It is a big dog.",
  "L1_2_p2": "The dog ran in the mud. Mud, mud, mud!",
  "L1_2_p3": "The dog is a mess! Mud is on the dog.",
  "L1_2_p4": "I get a mop. I mop the dog.",
  "L1_2_p5": "No! The mop is a mess! Mud is on me!",
  "L1_2_p6": "Mum got a tub. The dog sat in it. No mud! No mess!",
  // L1.3 The Fish in the Tank
  "L1_3_p1": "I have a fish! It is in a bag.",
  "L1_3_p2": "The fish is sad. The bag is not big.",
  "L1_3_p3": "I get a cup. No! It is not big.",
  "L1_3_p4": "I get a tank. Yes! The fish can go in!",
  "L1_3_p5": "Wish, wish! The fish is in the tank!",
  "L1_3_p6": "The fish is not sad. I am happy!",
  // L1.4 The Red Socks
  "L1_4_p1": "I have no socks! I am sad.",
  "L1_4_p2": "I check the bed. I get a sock. Not red!",
  "L1_4_p3": "I check the bag. I get a sock. Not red!",
  "L1_4_p4": "I check the hen pen. The hen has red socks!",
  "L1_4_p5": "I get the socks. The hen pecks me! Peck, peck!",
  "L1_4_p6": "Red socks on me! I can kick! I am so happy!",
  // L1.5 Run, Pup, Run!
  "L1_5_p1": "I have a pup. The pup can run!",
  "L1_5_p2": "Run, pup, run! The pup hid in the hut.",
  "L1_5_p3": "Run, pup, run! The pup hid in the bush.",
  "L1_5_p4": "Run, pup, run! The pup is in the tub!",
  "L1_5_p5": "I rub the pup. Rub, rub, rub!",
  "L1_5_p6": "The pup and me! A big hug!",
  // L1.6 Fox Fell Off!
  "L1_6_p1": "I have a fox. Fox is on a log.",
  "L1_6_p2": "Fox fell off the log! Oh, Fox!",
  "L1_6_p3": "Fox is on a wall. Fox fell off the wall!",
  "L1_6_p4": "Fox is on a hill. Fox fell off the hill!",
  "L1_6_p5": "I get a big, fat mat. Sit on it, Fox!",
  "L1_6_p6": "Fox is on the mat! Fox did not fall off! I hug Fox!",
  // L1.7 The Jam Jug
  "L1_7_p1": "Dad has a van. The van has jam in big jugs.",
  "L1_7_p2": "I dip in a jug. Fig jam! It is yum!",
  "L1_7_p3": "I dip in a jug. Red jam! It is yum!",
  "L1_7_p4": "The jug tips! Jam on the rug! Oh, no!",
  "L1_7_p5": "I get a wet rag. I mop it up.",
  "L1_7_p6": "No jam on the rug! I did it! I hug Dad.",
  // L1.8 The Yak and the Box
  "L1_8_p1": "I have a yak. The yak is big!",
  "L1_8_p2": "I have a box. I zip it up. Six figs in the box.",
  "L1_8_p3": "The yak sat on the box! Oh, no!",
  "L1_8_p4": "I fix the box. I set it on top of the hut.",
  "L1_8_p5": "The yak can not get it! I get the six figs.",
  "L1_8_p6": "I munch a fig. The big yak gets a fig. Yum!",
  // L1.9 Chop, Chop, Chop!
  "L1_9_p1": "Nan chops, chops, chops! This is fun!",
  "L1_9_p2": "Nan chops it thin. Nan chops it thick.",
  "L1_9_p3": "Chips in a hot pan. I got a big dish!",
  "L1_9_p4": "I got a chip. That chip is thick!",
  "L1_9_p5": "I dip a chip in. Yum, yum, yum!",
  "L1_9_p6": "Chips with Nan! Munch, munch, munch!",
  // L1.10 Buzz and Sing!
  "L1_10_p1": "I sit on a big log. Buzz, buzz, buzz!",
  "L1_10_p2": "A big bug sits on a rock. Hiss, hiss, hiss!",
  "L1_10_p3": "I sing a long, long song!",
  "L1_10_p4": "I sing! No buzz! No hiss!",
  "L1_10_p5": "I sing quick! I sing and sing!",
  "L1_10_p6": "Buzz! Hiss! I sing with the bugs!",
};

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
        console.log(`OK   ${key}: "${text}"`);
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
  console.log(`Generating ${entries.length} sentence audio files...`);

  for (const [key, text] of entries) {
    await generateAudio(key, text);
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('Done!');
}

main().catch(console.error);
