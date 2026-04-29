// Quick fix: re-record only a.mp3. Yesterday's regen run accidentally
// wrote the same byte buffer to a/i/I.mp3 (all 12164B) — the "Eye"
// recording overwrote the "a" tricky word. Reader is now playing
// "Eye" wherever the lone "a" tricky word appears. Founders user
// caught this in Buzz and Sing.
//
// Try a slightly more specific phonetic prompt so ElevenLabs doesn't
// fall back to /aɪ/.
import fs from "fs";
import https from "https";

const API_KEY = process.env.ELEVENLABS_API_KEY || "sk_fd4349fd01d40a4ccee25a4ece5adf9577c6c4bde3380727";
const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // George
const OUTPUT = "C:/Users/ASUS/myphonicsbooks/public/sounds/words/a.mp3";

// Phonetic spellings to try in order until one sounds right
const PROMPT = "Eh."; // Schwa-style — matches how 'a' is spoken in connected speech ("a cat" → "uh cat"). Better fit than the letter name /eɪ/ for in-story usage.

const body = JSON.stringify({
  text: PROMPT,
  model_id: "eleven_turbo_v2_5",
  voice_settings: { stability: 0.6, similarity_boost: 0.75 },
});

const req = https.request({
  hostname: "api.elevenlabs.io",
  path: `/v1/text-to-speech/${VOICE_ID}`,
  method: "POST",
  headers: { "xi-api-key": API_KEY, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
}, (res) => {
  if (res.statusCode !== 200) {
    let err = "";
    res.on("data", (d) => (err += d));
    res.on("end", () => { console.error(`HTTP ${res.statusCode}: ${err.slice(0,200)}`); process.exit(1); });
    return;
  }
  const chunks = [];
  res.on("data", (c) => chunks.push(c));
  res.on("end", () => {
    const buf = Buffer.concat(chunks);
    fs.writeFileSync(OUTPUT, buf);
    console.log(`OK: a.mp3 (${buf.length}B, prompt='${PROMPT}')`);
  });
});
req.on("error", (e) => { console.error(e); process.exit(1); });
req.write(body);
req.end();
