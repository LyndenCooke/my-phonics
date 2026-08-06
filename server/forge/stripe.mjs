// Stripe checkout for the custom-book flow. Self-contained (no webhook):
// sessions are created with inline price_data, and on return we verify the
// session server-side before unlocking anything.
import { cfg } from "./env.mjs";

export const PRICES = {
  // £3 from 2026-08-06 (Lynden), up from the £1 founder price.
  book: { amount: 300, name: "Create-A-Book", desc: "Your child's own personalised phonics book" },
  world: { amount: 1000, name: "World of Books — Lifetime Access", desc: "Every family-made book in the MyPhonicsBooks world, forever" },
};

function form(params) {
  const out = new URLSearchParams();
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}[${k}]` : k;
      if (v && typeof v === "object") walk(v, key);
      else if (v !== undefined && v !== null) out.append(key, String(v));
    }
  };
  walk(params, "");
  return out;
}

async function stripeApi(pathName, params, method = "POST") {
  const res = await fetch(`https://api.stripe.com/v1/${pathName}`, {
    method,
    headers: {
      Authorization: `Bearer ${cfg.STRIPE_SECRET_KEY}`,
      ...(method === "POST" ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: method === "POST" ? form(params) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`stripe ${res.status}: ${data?.error?.message || "unknown"}`);
  return data;
}

export async function createCheckout({ kind, bookId, email, origin }) {
  const price = PRICES[kind];
  if (!price) throw new Error(`unknown price kind ${kind}`);
  const session = await stripeApi("checkout/sessions", {
    mode: "payment",
    "line_items[0]": {
      quantity: 1,
      price_data: {
        currency: "gbp",
        unit_amount: price.amount,
        product_data: { name: price.name, description: price.desc },
      },
    },
    ...(email ? { customer_email: email } : {}),
    success_url: `${origin}/create-book?paid=${kind}&book=${bookId || ""}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/create-book?cancelled=${kind}&book=${bookId || ""}`,
    "metadata[kind]": kind,
    "metadata[book_id]": bookId || "",
  });
  return session; // {id, url}
}

export async function verifySession(sessionId) {
  const s = await stripeApi(`checkout/sessions/${sessionId}`, null, "GET");
  return {
    paid: s.payment_status === "paid",
    email: s.customer_details?.email || s.customer_email || null,
    amount: s.amount_total,
    kind: s.metadata?.kind,
    bookId: s.metadata?.book_id || null,
  };
}
