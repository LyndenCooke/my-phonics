// Client for the local forge API (custom "Create-A-Book" pipeline).
// The API is served by the Vite dev server at /api/forge (dev/localhost only).
import { supabase } from "@/integrations/supabase/client";

export interface ForgeLevel {
  level: number;
  name: string;
  colour: string;
  graphemes: string[];
  cumulative: string[];
  trickyWords: string[];
  storyPages: number;
}

export interface CustomBookPage {
  type: "cover" | "story" | "profile";
  title?: string;
  text?: string;
  imageUrl?: string;
  levelColour?: string;
  levelName?: string;
  focusSound?: string;
  // profile page fields
  heroUrl?: string;
  name?: string;
  age?: number | null;
  country?: string | null;
  countryFlag?: string | null;
  likes?: string | null;
  culture?: string | null;
  faith?: string | null;
}

export interface CustomBook {
  id: string;
  status: string;
  title?: string | null;
  child_name: string;
  level: number;
  focus_sound: string;
  country?: string | null;
  country_flag?: string | null;
  pages?: CustomBookPage[] | null;
  profile?: CustomBookPage | null;
  progress?: { step: string; message: string; pct: number } | null;
  share_requested?: boolean;
  wall_of_love_opt_in?: boolean;
  cost_usd?: number;
  cost_breakdown?: Record<string, unknown>;
  email?: string | null;
  user_id?: string | null;
  generating?: boolean;
  review_note?: string | null;
  created_at?: string;
  cover?: string | null;
  locked?: boolean;
}

const base = "/api/forge";

// Attach the signed-in user's Supabase session token, when there is one, so
// the server can verify identity for anything account-gated (World of Books
// access + purchase, saving a book to an account). Harmless on routes that
// don't care — the server only checks it where it matters.
async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const auth = await authHeaders();
  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...auth },
    ...init,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data as T;
}

export const forgeApi = {
  health: () => req<{ ok: boolean; config: Record<string, string>; store: string }>("/health"),
  levels: () =>
    req<{ levels: ForgeLevel[]; prices: Record<string, { amount: number; name: string }> }>("/levels"),
  createBook: (body: Record<string, unknown>) =>
    req<{ book: CustomBook }>("/books", { method: "POST", body: JSON.stringify(body) }),
  getBook: (id: string) => req<{ book: CustomBook }>(`/books/${id}`),
  // `voucher` redeems a private test code server-side. A successful redeem
  // returns { free: true } and no Stripe URL — the caller must handle both.
  // Advance a generating book by one step. Production has no background
  // worker — a serverless function cannot outlive its request — so the wizard
  // drives the step machine itself by calling this until { done: true }.
  // Under vite dev the in-process driver holds the lock and this returns
  // { step: "busy" }, which the driver treats as "wait and poll".
  step: (bookId: string) =>
    req<{ done: boolean; step: string; status: string }>(`/books/${bookId}/step`, { method: "POST" }),
  checkout: (body: { kind: "book" | "world"; book_id?: string; email?: string; voucher?: string; credit_from?: string }) =>
    req<{ url?: string; free?: boolean }>("/checkout", { method: "POST", body: JSON.stringify(body) }),
  verify: (sessionId: string) =>
    req<{ paid: boolean; kind?: string; book_id?: string | null; email?: string | null }>(
      `/verify?session_id=${encodeURIComponent(sessionId)}`,
    ),
  simulatePay: (body: { kind: "book" | "world"; book_id?: string; email?: string }) =>
    req<{ ok: boolean }>("/dev/simulate-pay", { method: "POST", body: JSON.stringify(body) }),
  retry: (bookId: string) =>
    req<{ ok: boolean }>("/retry", { method: "POST", body: JSON.stringify({ book_id: bookId }) }),
  pdf: (bookId: string) => req<{ url: string }>(`/books/${bookId}/pdf`, { method: "POST" }),
  // Link a created book to the signed-in account. Server verifies the
  // bearer token itself — a missing/invalid session comes back as a 401.
  saveToAccount: (bookId: string) =>
    req<{ ok: boolean; book: CustomBook }>(`/books/${bookId}/save`, { method: "POST" }),
  world: (email?: string | null) =>
    req<{ access: boolean; books: CustomBook[]; wall: CustomBookPage[] }>(
      `/world${email ? `?email=${encodeURIComponent(email)}` : ""}`,
    ),
  adminQueue: () =>
    req<{ queue: CustomBook[]; decided: CustomBook[]; costs: Record<string, number> }>(
      "/admin/queue",
    ),
  adminDecision: (body: { book_id: string; approve: boolean; note?: string }) =>
    req<{ ok: boolean }>("/admin/decision", { method: "POST", body: JSON.stringify(body) }),
};
