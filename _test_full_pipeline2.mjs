// Full end-to-end production test, re-run after fixing: object identity
// references (cap drift), concealed-object plausibility check (book visible
// before its reveal), and deterministic focus-sound phoneme check (mixed
// short/long oo). Same shape as the previous run for a fair comparison.
import { cfg } from "./server/forge/env.mjs";

const BASE = "https://myphonicsbooks.co.uk/api/forge";

async function j(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  if (!res.ok) throw new Error(`${path} -> ${res.status}: ${JSON.stringify(data).slice(0, 400)}`);
  return data;
}

console.log("1) Creating book...");
const { book } = await j("/books", {
  method: "POST",
  body: JSON.stringify({
    child_name: "Amina",
    child_age: 6,
    country: "Nigeria",
    country_flag: "🇳🇬",
    city: "Lagos",
    culture_notes: "A Muslim family in Lagos who love the market and the beach.",
    likes: "Drawing",
    faith: "Muslim",
    level: 4,
    focus_sound: "oo",
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
