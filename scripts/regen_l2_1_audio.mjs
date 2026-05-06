// One-off: regenerate the 8 sentence audios for L2.1 "The Night Light"
// after the story rewrite. Deletes existing files then synthesises new ones
// via ElevenLabs (George voice, same settings as the original L1 batch).
import fs from 'fs';
import path from 'path';
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Set ELEVENLABS_API_KEY first.');
  process.exit(1);
}

const VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb'; // George
const OUTPUT_DIR = 'C:/Users/ASUS/myphonicsbooks/public/sounds/sentences';

const SENTENCES = {
  L2_1_p1: 'The day ends. I can\'t see my toy cat.',
  L2_1_p2: 'We go out to look. It is night.',
  L2_1_p3: 'Look at the lights. I can see in the shop.',
  L2_1_p4: 'It is dim on the way. I need a light.',
  L2_1_p5: 'Look, a light up high! It is the moon.',
  L2_1_p6: 'Dad can see I am sad. He hugs me in the light.',
  L2_1_p7: 'I see my toy cat! Dad and I run to it.',
  L2_1_p8: 'I hug my toy cat. I say, "Yay, my toy!"',
};

function tts(text, outFile) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0, use_speaker_boost: true },
    });
    const req = https.request({
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${VOICE_ID}?output_format=mp3_44100_128`,
      method: 'POST',
      headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    }, res => {
      if (res.statusCode !== 200) {
        let err = '';
        res.on('data', c => err += c);
        res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${err}`)));
        return;
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        fs.writeFileSync(outFile, Buffer.concat(chunks));
        resolve();
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  for (const [key, text] of Object.entries(SENTENCES)) {
    const out = path.join(OUTPUT_DIR, `${key}.mp3`);
    if (fs.existsSync(out)) fs.unlinkSync(out);
    process.stdout.write(`→ ${key}: ${text}\n`);
    await tts(text, out);
    process.stdout.write(`  saved ${out}\n`);
  }
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
