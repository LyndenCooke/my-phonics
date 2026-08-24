// GoHighLevel sync for delivered Create-A-Books — the no-premium-trigger
// design (Lynden 2026-08-23: the Inbound Webhook trigger bills per
// execution). Instead of a webhook, the forge talks to the same
// LeadConnector API the Supabase edge functions already use (ghl-sync):
// find-or-create the contact, write the book's facts into custom fields,
// then re-add the "book-ready" tag — a workflow with the STANDARD
// "Contact Tag Added" trigger takes it from there.
//
// Wholly optional: without GHL_API_KEY + GHL_LOCATION_ID in the env this
// module does nothing, and no failure here may ever block delivery — the
// customer's Resend email with both PDFs has already gone out.
import { cfg } from "./env.mjs";

const BASE = "https://services.leadconnectorhq.com";
const headers = () => ({
  Authorization: `Bearer ${cfg.GHL_API_KEY}`,
  Version: "2021-07-28",
  "Content-Type": "application/json",
});

export function ghlEnabled() {
  return Boolean(cfg.GHL_API_KEY && cfg.GHL_LOCATION_ID);
}

// The contact custom fields the book data lands in, matched against
// Lynden's EXISTING field set (he pasted it 2026-08-23): "Book PDF URL"
// is his established name for the A5 link, and "Child's First Name"
// already exists from the earlier delivery flow, so the sync fills it.
// Each slot lists candidate names/keys, first match wins; a slot with no
// matching field is skipped with a warning, never an error ("Book Level"
// and "Book Focus Sound" are optional — create them only if wanted).
const BOOK_FIELDS = {
  book_title: ["Book Title"],
  book_a5_url: ["Book PDF URL", "Book A5 URL"],
  book_a4_url: ["Book A4 URL"],
  childs_first_name: ["Child's First Name", "Childs First Name"],
  book_level: ["Book Level"],
  book_focus_sound: ["Book Focus Sound"],
};

const norm = (s) => String(s || "").toLowerCase().replace(/^contact\./, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

let _fieldMap = null;
async function fieldIdMap() {
  if (_fieldMap) return _fieldMap;
  const res = await fetch(`${BASE}/locations/${cfg.GHL_LOCATION_ID}/customFields`, { headers: headers() });
  if (!res.ok) throw new Error(`GHL customFields lookup ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const map = {};
  for (const f of data?.customFields || []) {
    if (f.name) map[norm(f.name)] = f.id;
    if (f.fieldKey) map[norm(f.fieldKey)] = f.id;
  }
  _fieldMap = map;
  return map;
}

async function findContact(email) {
  const res = await fetch(
    `${BASE}/contacts/search/duplicate?locationId=${cfg.GHL_LOCATION_ID}&email=${encodeURIComponent(email)}`,
    { headers: headers() },
  );
  if (!res.ok) return null;
  return (await res.json())?.contact?.id ?? null;
}

async function tagOp(contactId, method, tags) {
  const res = await fetch(`${BASE}/contacts/${contactId}/tags`, {
    method,
    headers: headers(),
    body: JSON.stringify({ tags }),
  });
  return res.ok;
}

export async function syncBookReadyContact({ email, childName, title, a5Url, a4Url, level, focusSound }) {
  if (!ghlEnabled()) return { synced: false, reason: "no_ghl_env" };
  if (!email) return { synced: false, reason: "no_email" };

  const map = await fieldIdMap();
  const values = {
    book_title: title,
    book_a5_url: a5Url,
    book_a4_url: a4Url,
    childs_first_name: childName,
    book_level: level != null ? `Level ${level}` : null,
    book_focus_sound: focusSound,
  };
  const customFields = [];
  const missing = [];
  for (const [slug, names] of Object.entries(BOOK_FIELDS)) {
    const id = map[slug] || names.map((n) => map[norm(n)]).find(Boolean);
    if (!id) { missing.push(names[0]); continue; }
    if (values[slug] != null) customFields.push({ id, value: String(values[slug]) });
  }
  if (missing.length) console.warn(`[forge] GHL custom fields not found (optional, create in GHL if wanted): ${missing.join(", ")}`);

  let contactId = await findContact(email);
  if (!contactId) {
    const res = await fetch(`${BASE}/contacts/`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        locationId: cfg.GHL_LOCATION_ID,
        email,
        // The buyer's own name is unknown - the wizard only asks for the
        // child's. Never put the child's name on the CRM contact.
        tags: ["myphonicsbooks", "create-a-book"],
        customFields,
      }),
    });
    if (!res.ok) throw new Error(`GHL create ${res.status}: ${(await res.text()).slice(0, 200)}`);
    contactId = (await res.json())?.contact?.id;
  } else if (customFields.length) {
    const res = await fetch(`${BASE}/contacts/${contactId}`, {
      method: "PUT",
      headers: headers(),
      body: JSON.stringify({ customFields }),
    });
    if (!res.ok) console.warn(`[forge] GHL field update ${res.status} for ${contactId}`);
  }
  if (!contactId) return { synced: false, reason: "no_contact_id" };

  // Remove-then-add so a REPEAT buyer re-fires the tag-added trigger —
  // GHL only triggers on the transition, and the second book must get the
  // same delivery workflow as the first. The pause between the two is
  // load-bearing: back-to-back remove/add coalesced in GHL's trigger
  // engine and the workflow never saw an "added" edge (first live trial,
  // 2026-08-24 — tag landed, no email).
  await tagOp(contactId, "DELETE", ["book-ready"]);
  await new Promise((res) => setTimeout(res, 8000));
  const tagged = await tagOp(contactId, "POST", ["myphonicsbooks", "create-a-book", "book-ready"]);
  if (!tagged) return { synced: false, reason: "tag_failed", contactId };
  return { synced: true, contactId, fields: customFields.length, missing };
}
