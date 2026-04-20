/**
 * Generate MISSING sentence audio for L2.6 and L6.1-L6.4.
 * Uses ElevenLabs George voice with consistent settings matching all other levels.
 * Run: node generate_missing_sentence_audio.mjs
 */
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY || 'sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727';
const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

// ─── L2.6 — The Night Fair (Night at the Souq) ─────────────────────────────
const L2_6_SENTENCES = {
  "L2_6_p1": "The night is here! The lights up high are so bright!",
  "L2_6_p2": "I see lots of lamps. Each one is so cool! I feel such joy.",
  "L2_6_p3": "A man plays a drum in the dark. Tap, tap, tap! I stay to see.",
  "L2_6_p4": "Mum gets food for us. I try a spoon. It is hot and so yum!",
  "L2_6_p5": "I see a toy bird with soft hair. \"Can I get it?\" I say. Mum says yes!",
  "L2_6_p6": "I sit on a stool. The fair is so much fun! The air is cool.",
  "L2_6_p7": "Look up! I see stars in the sky. The moon is low and round.",
  "L2_6_p8": "My night at the souq is so good. I wave good night to the big moon.",
};

// ─── L6.1 — The Marvellous Neighbourhood (Cairo, Egypt) ────────────────────
const L6_1_SENTENCES = {
  "L6_1_p1": "Yusuf sat on the front steps of his apartment block and frowned at the street below. Rows of cream-coloured blocks lined the road, and cars honked in the hot afternoon heat. From the market around the corner, he could hear the calls of vendors and the clatter of carts. \"Nothing glorious or fabulous ever happens here,\" he muttered. \"This place is so ordinary.\" Just then, a curious-looking man with a worn notebook sat down quietly on the step beside him.",
  "L6_1_p2": "\"You look like somebody who thinks they have seen everything there is to see,\" said the man with a smile. Yusuf shrugged. \"I live here. It is just houses, traffic, and the same old market.\" The man had a luminous look in his eyes, as if he knew something tremendous. \"I have spent my whole life travelling to marvellous places,\" he said, leaning forward. \"And I am going to tell you something. This is one of the most glorious cities on Earth.\"",
  "L6_1_p3": "The man stood and walked with Yusuf to the wide road that ran along the edge of the river. \"That is the Nile,\" he said in a wondrous voice, \"the most famous river in the whole world.\" \"It has flowed past this very spot for thousands and thousands of years.\" Yusuf had walked along the corniche countless times, but he had never stopped to wonder. He looked at the grey-green water as if he was seeing it for the very first time.",
  "L6_1_p4": "Next, the man led Yusuf around the corner to the old bakery on their street. An enormous cloud of warm bread smell drifted out through the open door. \"The baker has been here for forty years,\" said the man. \"He knows every family by name.\" Yusuf realised he had never once stopped to wave or say good morning to him. The baker spotted them and held out a warm round of aish baladi, the famous flat bread of Egypt.",
  "L6_1_p5": "They walked on, and the man pointed to the slim minaret that rose above the rooftops. \"On quiet mornings, the call from that tower can be heard for miles and miles,\" he said. Down by the river, white-sailed boats drifted past on the gleaming water. A cluster of street cats — Cairo was famous for its cats — sunned themselves on a warm wall. \"Is this place still boring to you?\" the man asked, his eyes twinkling.",
  "L6_1_p6": "Yusuf stood still for a moment and looked around with new, curious eyes. He could see the enormous pyramids on the far horizon, golden in the dusty afternoon haze. He could hear the joyous calls of the market sellers drifting around the corner. He could smell the fabulous bread from the bakery he had walked past hundreds of times. \"It is marvellous,\" he said, in a quiet, amazed voice. \"My neighbourhood is truly marvellous.\"",
  "L6_1_p7": "The man smiled and handed Yusuf a small notebook and a pen. \"Write down what you see,\" he said. \"Give each part of your neighbourhood the name it deserves.\" Yusuf picked up the pen and began to write, one label for each place he could now see. He wrote: The Marvellous Corniche. The Enormous Nile. The Famous Bakery. The Joyous Market. The Glorious Minaret. \"These are the tremendous things that make up my home,\" said Yusuf, and he felt proud.",
  "L6_1_p8": "Later, when the storyteller had gone, Yusuf sat on his step once more. But this time, he was not bored — he was curious and adventurous, watching the world with new eyes. The enormous city hummed and buzzed all around him, full of marvellous, ordinary life. He opened his notebook and added one last label at the bottom of the page: My Marvellous Home. And from that day on, Yusuf never forgot that the most glorious place in the world was the one right outside his door.",
};

// ─── L6.2 — You Are Remarkable (Guilin, China) ─────────────────────────────
const L6_2_SENTENCES = {
  "L6_2_p1": "The Lantern Festival had filled the river park with golden light. Hundreds of glowing lanterns drifted above the Li River, and the karst mountains rose like dark peaks behind the city. The girl was watching a paper lantern float upward when she noticed something terrible. A small boy sat alone on a stone step, clutching a stuffed panda, with tears on his face. The people all around him walked past as if he were invisible. She stopped.",
  "L6_2_p2": "She crouched down beside the boy and spoke to him in a gentle voice. He was perhaps three years old, and he looked absolutely miserable — his face red, his eyes wide, his small hands gripping the panda. \"Where is your family?\" she asked, but he could only shake his head and sob. It was clear he was not capable of finding them alone. She looked around at the crowds flowing past, and she made a decision: she was responsible for helping him, and it was possible to do it.",
  "L6_2_p3": "She pulled a small notebook from her jacket pocket and thought for a moment. Then she wrote a careful note in neat, readable handwriting and tore it out. The note said: \"Lost child — dark jacket, green buttons, age 3. He is by the red lantern at the bridge. His family is searching for him. If you have seen them, please come at once.\" She held it up as high as she could. It was a sensible and responsible plan.",
  "L6_2_p4": "She took the boy's hand and walked towards the busy lantern stalls. An elderly woman selling tangyuan shook her head when she saw the note, but pointed further along the riverbank towards the bridge. A group of young people gathered, read the note, and looked around — but nobody recognised the child. Each person was willing, but none were able to help. She did not give up. Giving up was not a reasonable or responsible option.",
  "L6_2_p5": "Near the entrance of the park, she spotted a security guard in a yellow jacket. She walked straight up to him, held out the note, and said clearly, \"This child is lost. He has been here for some time.\" The guard read the note carefully, nodded, and spoke into his radio. He asked her to stay in one comfortable spot beside the red lantern at the bridge. She sat with the boy and told him a quiet story about the panda in his arms. He stopped crying and leaned against her shoulder.",
  "L6_2_p6": "While they waited, she bought the boy a warm roasted sweet potato from a nearby cart. His face changed — from miserable and terrified, to curious, to something almost cheerful. He held the sweet potato in both hands and looked up at her. \"Panda,\" he said, and held the toy out to her. It was an adorable thing to do, and she understood it at once — he was sharing his most valuable possession with her. She held it carefully, and for the first time that evening, he smiled.",
  "L6_2_p7": "The guard came running back with a woman and a man following close behind. The little boy looked up — and in less than a second, his face went from frightened to overjoyed. \"Mama!\" he cried, and the woman rushed forward and scooped him up, clutching him in an incredible, tearful hug. The man gripped the guard's hand and then looked at the girl with a grateful and disbelieving expression. She stood a little way back, watching the most remarkable reunion she had ever seen, with something warm and steady building inside her.",
  "L6_2_p8": "The mother turned to the girl, still holding her son tightly. \"You kept him safe,\" she said, and her voice was not quite steady. \"You stayed. You helped.\" She paused for a moment, and then she said something the girl would always remember. \"You are remarkable.\" The girl walked back through the incredible festival, past the glowing lanterns and the karst mountains rising in the dark. She thought about what it meant to be capable, and she thought it was quite simple: when something terrible is visible, a responsible person does not walk past.",
};

// ─── L6.3 — It Looks Suspicious! (Amalfi Coast, Italy) ─────────────────────
const L6_3_SENTENCES = {
  "L6_3_p1": "Luca stood in Nonna's spacious kitchen and crossed his arms. The morning sun streamed through the open window, and the bright clifftop houses of the Amalfi Coast glowed pink and cream outside. Nonna had set a big glass dish on the tiled bench, and inside it sat something green, something red, and something Luca did not trust. \"What is that?\" he asked, taking a cautious step back. \"It looks suspicious.\"",
  "L6_3_p2": "Nonna just smiled. She was a gracious and patient woman who had fed this cautious boy for all of his visits, and she understood him. She picked up a fat, ripe lemon from the tree outside the door — its skin was bright and luscious. She sliced it open, and a sharp, fresh smell burst into the room. Luca sniffed. \"That smells not bad,\" he admitted, but he remained cautious.",
  "L6_3_p3": "Nonna drizzled green oil over the sliced tomatoes and torn basil leaves. Then she grated fresh lemon rind on top and added a pinch of salt. \"This is bruschetta,\" she said. \"It is simple and nutritious.\" Luca peered at the crusty bread stacked on a plate beside the dish. He picked one up and inspected it. \"It looks suspicious,\" he said again.",
  "L6_3_p4": "Next, Nonna filled a big pot with hot water and set it on the stove. She tipped in long strands of fresh pasta and stirred them with a wooden spoon. \"Pasta al limone,\" she announced. \"My mother's precious secret — lemon, cream, and a sprinkle of pepper.\" The steam that rose from the pot smelled absolutely delicious, and Luca found himself stepping closer, even though he was still cautious. \"I am not eating that,\" he said, but his feet did not step back.",
  "L6_3_p5": "Nonna set the last dish on the kitchen table: a small glass cup of pale yellow granita, topped with a thin slice of lemon and a mint leaf. \"Limoncello granita,\" she said. \"Frozen, sweet, and scrumptious. This is the most delicious treat on the Amalfi Coast.\" Luca looked at the bruschetta, the pasta, and the granita. All three smelled delicious, and he had to admit something: he was not just cautious any more — he was also very, very hungry.",
  "L6_3_p6": "He reached out — slowly, carefully — and picked up one small piece of bruschetta. He took the tiniest bite. His eyes went wide. It was delicious. He took a bigger bite, and then another. The fresh tomato and lemon burst across his mouth, and the crusty bread was perfect. He tried the pasta next. It was creamy, sharp, and absolutely scrumptious. \"Nonna,\" he said, and his voice was thick with feeling, \"this is the most delicious thing I have ever tasted.\"",
  "L6_3_p7": "The front door clicked open and small feet pattered down the hall. Luca's little sister Sofia ran into the kitchen, her yellow headband bright against her dark curls. She stopped at the table and stared at the granita with a suspicious look on her face. \"What is that?\" she asked, pointing at the frozen treat. \"It looks suspicious!\" Luca grinned. He knew those words — he had said them himself, not long before.",
  "L6_3_p8": "Luca picked up the glass of granita and held it out to his sister. \"Trust me,\" he said. \"I was suspicious too. But Nonna's cooking is nutritious and delicious — and this is the most precious treat on the whole coast.\" Sofia took a cautious lick. Her face lit up at once. Nonna watched them from the doorway, the lemon groves glowing golden on the clifftop behind her, and she thought that feeding the people you love was the most ambitious and delicious thing a person could ever do.",
};

// ─── L6.4 — The Incredible Bush Walk (Blue Mountains, Australia) ────────────
const L6_4_SENTENCES = {
  "L6_4_p1": "Mia was ambitious. She stood at the start of the bush walk trail and looked out at the enormous Blue Mountains stretching before them. The famous blue haze hung over the peaks like a glorious curtain of mist. \"I am going to spot everything first,\" she told her brother Tom. \"I am the most capable one here.\" Tom said nothing. He just opened his small notebook and started to draw.",
  "L6_4_p2": "The trail led them through spacious groves of tall gum trees. Mia strode ahead, pointing at everything she saw. \"Look at that gorgeous rosella in the branches!\" she called back. \"And those enormous cliffs are visible from here — they are famous!\" Tom walked behind, slower and more cautious. He crouched down beside a fallen log and peered at something small and precious that Mia had walked straight past.",
  "L6_4_p3": "\"Tom, you are too cautious and too slow,\" Mia said with a sigh. \"If you keep stopping, it will be impossible to reach the lookout before lunch.\" She was not gracious about it. Tom closed his notebook and tried to keep up, but he felt nervous. He could hear something incredible deep in the bush — a curious sound, like a song mixed with the calls of other birds. He stopped walking and listened.",
  "L6_4_p4": "Tom crept off the trail, cautious and sensible, placing each foot with care. Behind a thick fern, he saw something wondrous — a lyrebird. Its enormous tail feathers fanned out like a gorgeous silver veil. The bird was performing its famous song, copying the calls of every creature in the bush. It was the most incredible thing Tom had ever seen. He held his breath and sketched it in his notebook as fast as he could.",
  "L6_4_p5": "\"Mia!\" Tom whispered. \"Come here — but be flexible and go slowly!\" Mia came back along the trail, looking suspicious. But when she crouched beside Tom and saw the lyrebird, her face changed. \"That is remarkable,\" she breathed. \"I had no idea it was there.\" She was conscious now that she had rushed past something precious. Being fast did not make her more capable — it just meant she had missed the most valuable thing on the whole walk.",
  "L6_4_p6": "After the lyrebird slipped back into the bush, they walked on together. This time, Mia let Tom set the pace. He showed her observable things she had never noticed — a notable pattern in the bark of a gum tree, a tiny scrumptious bush berry that was edible, and the delicious smell of eucalyptus oil hanging in the warm air. \"You are admirable at this,\" Mia said, and she meant it. The glorious view from the lookout was even better when they reached it side by side.",
  "L6_4_p7": "At the visitor centre near the end of the trail, they found a gallery of Aboriginal dot art on the walls — swirling, joyous paintings of the land and its creatures in dots of red, gold, and white. Tom held up his notebook and compared his own drawings to the art. \"Your sketches are incredible,\" said Dad, who had been comfortable walking at the back the whole time. \"You were responsible and patient, and you saw more than anyone.\" Mia nodded. She was not adventurous in the same way as Tom, but she was learning that his way of seeing was just as remarkable as hers.",
  "L6_4_p8": "That evening, Tom read from his notebook. \"Dear Journal. Today was an incredible bush walk. The enormous mountains were visible through the famous blue haze.\" \"I was cautious and quiet, and I spotted a precious lyrebird with gorgeous tail feathers performing its marvellous song.\" \"Mia missed it at first, but then she came back and we watched it together. It was the most impossible, glorious, wondrous moment.\" He closed the notebook. Mia smiled. \"You are remarkable, Tom,\" she said.",
};

const ALL_SENTENCES = {
  ...L2_6_SENTENCES,
  ...L6_1_SENTENCES,
  ...L6_2_SENTENCES,
  ...L6_3_SENTENCES,
  ...L6_4_SENTENCES,
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
  console.log(`Generating ${entries.length} missing sentence audio files (L2.6 + L6)...`);
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

main();
