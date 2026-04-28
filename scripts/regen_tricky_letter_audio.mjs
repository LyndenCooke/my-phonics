// Re-records the tricky single-letter / short-word MP3s with explicit
// phonetic prompts so George's pronunciation matches what children hear
// when they sound the word out at school. Default ElevenLabs pronunciation
// of bare 'I' / 'a' was producing the wrong vowel; phonetic spelling pins it.
import fs from "fs";
import path from "path";
import https from "https";

const API_KEY = "sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727";
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George
const OUTPUT_DIR = "C:/Users/ASUS/myphonicsbooks/public/sounds/words";

// Each entry: { filename: <key>.mp3, prompt: text actually sent to TTS }
// The prompt is the phonetic spelling of the desired sound; the file is
// saved at <key>.mp3 so callsites that expect /sounds/words/i.mp3 still work.
const TARGETS = [
  { key: "i",   prompt: "Eye." },        // /aɪ/  — pronoun I
  { key: "a",   prompt: "Ay." },         // /eɪ/  — letter name (per user direction)
  { key: "the", prompt: "Thuh." },       // /ðə/  — schwa, not "thee"
  { key: "am",  prompt: "Am." },         // /æm/  — already correct, regenerated for consistency
];

function generate({ key, prompt }) {
  return new Promise((resolve, reject) => {
    const out = path.join(OUTPUT_DIR, `${key}.mp3`);
    const body = JSON.stringify({
      text: prompt,
      model_id: "eleven_turbo_v2_5",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    });
    const opts = {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: "POST",
      headers: {
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };
    const req = https.request(opts, (res) => {
      if (res.statusCode !== 200) {
        let err = "";
        res.on("data", (d) => (err += d));
        res.on("end", () => reject(new Error(`HTTP ${res.statusCode} for ${key}: ${err.slice(0,200)}`)));
        return;
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(out, buf);
        console.log(`  OK: ${key}.mp3 (${buf.length}B, prompt='${prompt}')`);
        resolve();
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Regenerating ${TARGETS.length} tricky-letter audios...\n`);
  for (const t of TARGETS) {
    try { await generate(t); }
    catch (e) { console.error(`  FAIL ${t.key}: ${e.message}`); }
    await new Promise(r => setTimeout(r, 300));
  }
  console.log("\nDone.");
}
main();
