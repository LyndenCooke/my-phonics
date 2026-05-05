// One-off: regenerate the 8 sentence audios for L3.4 "What Min Saw"
// after the story rewrite to match the new images. ElevenLabs George voice.
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
  L3_4_p1: "Min and Mum put on thick coats. 'Let us go!' said Min with a big grin.",
  L3_4_p2: "Min and Mum step on to the street. Min points at a big block. 'Look at that!' she said.",
  L3_4_p3: "They go to the park. A cat sits in the grass. 'Look! A cat!' said Min.",
  L3_4_p4: "Min sees a stream. She hops on the stones in the soil. 'Min, look out!' said Mum.",
  L3_4_p5: "They go up the hill. Min sees big trees and hills. 'Look at this!' she said.",
  L3_4_p6: "A big hawk is up high! Min points at it. The hawk has sharp claws.",
  L3_4_p7: "They sit on the grass. The hawk stays up high. 'It looks just right,' Mum said.",
  L3_4_p8: "On the way home, Min runs in the leaves. 'I will tell Dad what I saw!' said Min.",
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
