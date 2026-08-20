// Full end-to-end production test #4: first run with the cold-editor gate,
// rewrite-once recovery, page-count gate, six story words, pinned
// distinguishing marks and the custom-book sound chart all live.
import { cfg } from "./server/forge/env.mjs";

const BASE = "https://myphonicsbooks.co.uk/api/forge";

async function j(path, opts = {}) {
  // Network-level failures (ECONNRESET mid-generation) retry; HTTP errors throw.
  for (let attempt = 0; ; attempt++) {
    let res;
    try {
      res = await fetch(`${BASE}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
      });
    } catch (e) {
      if (attempt >= 5) throw e;
      console.log(`   (network error, retry ${attempt + 1}/5: ${e.cause?.code || e.message})`);
      await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
      continue;
    }
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
    return data;
  }
}

console.log("1) Creating book...");
const { book } = await j("/books", {
  method: "POST",
  body: JSON.stringify({
    child_name: "Zahra",
    child_age: 6,
    country: "Morocco",
    country_flag: "🇲🇦",
    city: "Marrakech",
    culture_notes: "A Muslim family in Marrakech; the souk, the riad courtyard and mint tea with Grandma.",
    likes: "Drawing patterns",
    appearance: { gender: "girl", skinTone: "warm brown", hair: "dark curly hair under a small white hijab" },
    faith: "Muslim",
    level: 4,
    focus_sound: "ar",
    email: "lyndencooke@gmail.com",
  }),
});
console.log("   book_id:", book.id);

console.log("2) Redeeming test voucher (starts generation)...");
await j("/checkout", {
  method: "POST",
  body: JSON.stringify({ kind: "book", book_id: book.id, voucher: cfg.FORGE_VOUCHER_CODE }),
});

console.log("3) Driving steps...");
let lastStep = "";
for (let i = 0; i < 60; i++) {
  const r = await j(`/books/${book.id}/step`, { method: "POST" });
  if (r.step && r.step !== lastStep) {
    console.log(`   step: ${r.step}`);
    lastStep = r.step;
  }
  if (r.done) {
    console.log("   done. status:", r.status);
    break;
  }
  if (r.status === "failed") {
    console.error("   FAILED:", JSON.stringify(r));
    process.exit(1);
  }
}

console.log("4) Rendering PDF + sending email...");
const pdfRes = await j(`/books/${book.id}/pdf`, { method: "POST" });
console.log("   PDF URL:", pdfRes.url);

console.log("\nDONE. book_id:", book.id);
