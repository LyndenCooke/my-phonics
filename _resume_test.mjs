// Resume driving an already-created/paid test book after a client-side
// network timeout (not a server error) interrupted the step loop.
const BASE = "https://myphonicsbooks.co.uk/api/forge";
const BOOK_ID = process.argv[2];
if (!BOOK_ID) throw new Error("usage: node _resume_test.mjs <book_id>");

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

console.log("Driving steps for", BOOK_ID);
let lastStep = "";
for (let i = 0; i < 60; i++) {
  const r = await j(`/books/${BOOK_ID}/step`, { method: "POST" });
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

console.log("Rendering PDF + sending email...");
const pdfRes = await j(`/books/${BOOK_ID}/pdf`, { method: "POST" });
console.log("   PDF URL:", pdfRes.url);
console.log("\nDONE. book_id:", BOOK_ID);
