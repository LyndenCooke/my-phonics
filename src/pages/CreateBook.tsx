import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Camera, Check, Dices, Globe2, Loader2,
  PartyPopper, ShieldCheck, Sparkles, Wand2, X,
} from "lucide-react";
import { forgeApi, type CustomBook, type ForgeLevel } from "@/lib/forgeApi";
import CustomBookReader from "@/components/CustomBookReader";
import FlipBook from "@/components/FlipBook";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Create-A-Book — the custom phonics book wizard.
 * Flow: child profile → level + one focus sound → review + consents →
 * pay £4.99 → live generation progress → book reveal + £10
 * World of Books upsell. Localhost workflow preview; API at /api/forge.
 */

const COUNTRIES: Array<[string, string]> = [
  ["United Kingdom", "🇬🇧"], ["United States", "🇺🇸"], ["Saudi Arabia", "🇸🇦"],
  ["United Arab Emirates", "🇦🇪"], ["Egypt", "🇪🇬"], ["Pakistan", "🇵🇰"], ["India", "🇮🇳"],
  ["Nigeria", "🇳🇬"], ["Ghana", "🇬🇭"], ["Kenya", "🇰🇪"], ["South Africa", "🇿🇦"],
  ["Jamaica", "🇯🇲"], ["Poland", "🇵🇱"], ["Romania", "🇷🇴"], ["Turkey", "🇹🇷"],
  ["Bangladesh", "🇧🇩"], ["China", "🇨🇳"], ["Japan", "🇯🇵"], ["Philippines", "🇵🇭"],
  ["Brazil", "🇧🇷"], ["Mexico", "🇲🇽"], ["France", "🇫🇷"], ["Spain", "🇪🇸"],
  ["Italy", "🇮🇹"], ["Germany", "🇩🇪"], ["Ireland", "🇮🇪"], ["Australia", "🇦🇺"],
  ["Somalia", "🇸🇴"], ["Morocco", "🇲🇦"], ["Malaysia", "🇲🇾"], ["Indonesia", "🇮🇩"],
];

const SKIN_TONES = [
  { label: "Light", hex: "#F0D0B0" },
  { label: "Light-medium", hex: "#D4A574" },
  { label: "Medium", hex: "#B8956A" },
  { label: "Medium-dark", hex: "#8B6B4A" },
  { label: "Dark", hex: "#4E3524" },
  { label: "Very dark", hex: "#3A2518" },
];

type Step = "intro" | "child" | "level" | "review" | "pay" | "generating" | "ready";

// Coherent test personas for the randomiser — name, home and culture belong
// together so the generated stories/art are a realistic test of the pipeline.
const PERSONAS = [
  { names: ["Maryam", "Yusuf", "Aisha"], country: "Somalia", city: "Mogadishu", culture: "A Somali family — we love suqaar, bariis and Eid mornings with the whole family", faith: "Muslim", hair: ["curly black hair", "black hair with a hijab", "short black curls"] },
  { names: ["Priya", "Arjun", "Anaya"], country: "India", city: "Jaipur", culture: "An Indian family — Diwali lights, dosas at the weekend and cricket in the park", faith: "Hindu", hair: ["long black plaited hair", "short black hair"] },
  { names: ["Kofi", "Ama", "Kwame"], country: "Ghana", city: "Accra", culture: "A Ghanaian family — jollof Sundays, highlife music and bright kente colours", faith: "Christian", hair: ["short afro hair", "braided hair with beads"] },
  { names: ["Zofia", "Jan", "Lena"], country: "Poland", city: "Kraków", culture: "A Polish family — pierogi with babcia, forest walks and Wigilia at Christmas", faith: "Christian", hair: ["blonde plaits", "short brown hair"] },
  { names: ["Mei", "Jun", "Lin"], country: "China", city: "Chengdu", culture: "A Chinese family — dumplings together at New Year, red lanterns and calligraphy", faith: "", hair: ["straight black hair", "black hair in bunches"] },
  { names: ["Santiago", "Valentina", "Mateo"], country: "Mexico", city: "Oaxaca", culture: "A Mexican family — tacos de canasta, mariachi at parties and Día de los Muertos marigolds", faith: "Christian", hair: ["dark wavy hair", "short black hair"] },
  { names: ["Oliver", "Poppy", "Alfie"], country: "United Kingdom", city: "London", culture: "A London family — fish and chips on Fridays, muddy park football and seaside trips", faith: "", hair: ["short ginger hair", "brown curly hair", "blonde hair"] },
  { names: ["Fatima", "Omar", "Layla"], country: "United Arab Emirates", city: "Dubai", culture: "An Emirati family — dates and karak, desert picnics and Eid with the cousins", faith: "Muslim", hair: ["long dark hair", "black hair with a hijab"] },
  { names: ["Amara", "Chidi", "Ngozi"], country: "Nigeria", city: "Lagos", culture: "A Nigerian family — jollof vs fried rice debates, church on Sunday and afrobeats", faith: "Christian", hair: ["braided hair", "short coily hair"] },
  { names: ["Hana", "Kenji", "Yuki"], country: "Japan", city: "Kyoto", culture: "A Japanese family — bento boxes, cherry blossom picnics and origami rainy days", faith: "", hair: ["straight black bob", "short black hair"] },
];
// A real book from the library, shown as a turn-the-pages preview on the
// intro — the WHOLE book, cover to back cover, so parents can see every page
// of what they're buying. ("Hot Food, Cool Moon", Level 4.)
//
// These come from the CURRENT published PDF, not from public/book-pages/
// (a June-2026 render under the old level ids). Regenerate after re-publishing:
//   py -3.12 scripts/make_create_book_demo.py [book_id]
// 20 pages, matching the real retail book's page count exactly: the printed
// story (p1-p19), then the "Meet the Star" profile page (p20) REPLACES the
// generic back cover — parents need to SEE that a profile page will be made
// for their child, and that's a stronger closing page for this marketing
// demo than a level-grid back cover duplicated elsewhere on the site.
const DEMO_BOOK_PAGES = Array.from(
  { length: 20 },
  (_, i) => `/create-book-demo/p${i + 1}.jpg`,
);

const LIKES_POOL = ["cats and football", "dinosaurs", "baking with mum", "space rockets", "swimming", "drawing animals", "trains", "dancing", "lego towers", "the beach"];

function pick<T>(arr: T[] | readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function CreateBook() {
  const [params, setParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<Step>("intro");
  const [levels, setLevels] = useState<ForgeLevel[]>([]);
  const [book, setBook] = useState<CustomBook | null>(null);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [voucher, setVoucher] = useState("");
  const [showVoucher, setShowVoucher] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  // Sticky, not per-click: once production tells us PDF typesetting isn't
  // available (DEPLOY.md — needs Python + Playwright, studio-machine only),
  // stop offering the button rather than let a family hit the same dead
  // end twice.
  const [pdfUnavailable, setPdfUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [worldPaid, setWorldPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [age, setAge] = useState("5");
  const [country, setCountry] = useState("United Kingdom");
  const [city, setCity] = useState("");
  const [culture, setCulture] = useState("");
  const [likes, setLikes] = useState("");
  const [faith, setFaith] = useState("");
  const [gender, setGender] = useState("girl");
  const [skinTone, setSkinTone] = useState(SKIN_TONES[0]);
  const [hair, setHair] = useState("");
  const [photoB64, setPhotoB64] = useState<string | null>(null);
  const [level, setLevel] = useState<number>(2);
  const [sound, setSound] = useState<string>("");
  const [email, setEmail] = useState(() => localStorage.getItem("forge_email") || "");
  const [shareRequested, setShareRequested] = useState(true);
  const [wallOptIn, setWallOptIn] = useState(true);

  const fileRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<number | null>(null);
  // Set when a content-rejected book's restored credit should pay for the
  // next book ("Change the story idea") — passed to checkout as credit_from.
  const [creditFrom, setCreditFrom] = useState<string | null>(null);

  const selectedLevel = useMemo(() => levels.find((l) => l.level === level), [levels, level]);
  const flag = useMemo(() => COUNTRIES.find(([c]) => c === country)?.[1] || "🌍", [country]);

  useEffect(() => {
    forgeApi.levels().then((r) => setLevels(r.levels)).catch(() => setError(
      "The Create-A-Book service isn't reachable right now — give it a moment and refresh.",
    ));
  }, []);

  // Two loops share the work of "generating":
  //   poll  — reads the book row for the progress bar (cheap, every 2.5s)
  //   drive — POSTs /step so the machine actually advances. In production
  //           there is NO background worker (serverless functions end with
  //           their request), so if nobody drives, nothing happens. Under
  //           vite dev the in-process driver holds the step lock and these
  //           calls just come back "busy" — harmless.
  const driveRef = useRef(false);
  const startDriving = useCallback((bookId: string) => {
    if (driveRef.current) return;
    driveRef.current = true;
    (async () => {
      try {
        for (;;) {
          const r = await forgeApi.step(bookId).catch(() => ({ done: false, step: "error", status: "" }));
          if (r.done || ["failed", "content_rejected", "paused_provider_credit", "paused_budget"].includes(r.status)) break;
          // busy/error → the dev driver owns it or a blip; wait, then retry.
          if (r.step === "busy" || r.step === "error") await new Promise((res) => setTimeout(res, 4000));
        }
      } finally {
        driveRef.current = false;
      }
    })();
  }, []);

  const startPolling = useCallback((bookId: string) => {
    if (pollRef.current) window.clearInterval(pollRef.current);
    startDriving(bookId);
    const tick = async () => {
      try {
        const { book: b } = await forgeApi.getBook(bookId);
        setBook(b);
        if (b.status === "ready" || b.status === "approved") {
          if (pollRef.current) window.clearInterval(pollRef.current);
          setStep("ready");
        } else if (["failed", "content_rejected", "paused_provider_credit", "paused_budget"].includes(b.status) && !b.generating) {
          if (pollRef.current) window.clearInterval(pollRef.current);
        }
      } catch {
        /* transient */
      }
    };
    tick();
    pollRef.current = window.setInterval(tick, 2500);
  }, [startDriving]);
  useEffect(() => () => { if (pollRef.current) window.clearInterval(pollRef.current); }, []);

  // Handle return from Stripe (?paid=book|world&book=<id>&session_id=...)
  useEffect(() => {
    const paid = params.get("paid");
    const sessionId = params.get("session_id");
    const bookId = params.get("book") || localStorage.getItem("forge_book_id");
    if (!paid || !sessionId) return;
    (async () => {
      try {
        const v = await forgeApi.verify(sessionId);
        if (v.paid && paid === "book" && bookId) {
          setStep("generating");
          startPolling(bookId);
        } else if (v.paid && paid === "world") {
          setWorldPaid(true);
          if (bookId) {
            const { book: b } = await forgeApi.getBook(bookId);
            setBook(b);
            setStep("ready");
          }
        }
      } catch (e) {
        setError(String((e as Error).message));
      } finally {
        setParams({}, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle the return trip from a sign-in redirect (?resume=1&want=world|save)
  // — payForWorld/saveToAccount send guests here when they need an account,
  // via localStorage("forge_book_id") since React state doesn't survive the
  // round trip. Waits for AuthContext to resolve the session before acting,
  // otherwise "want" would fire while `user` is still momentarily null.
  useEffect(() => {
    const resume = params.get("resume");
    if (!resume || authLoading) return;
    const want = params.get("want");
    const bookId = localStorage.getItem("forge_book_id");
    if (!bookId) { setParams({}, { replace: true }); return; }
    (async () => {
      try {
        const { book: b } = await forgeApi.getBook(bookId);
        setBook(b);
        if (b.status === "ready" || b.status === "approved") setStep("ready");
        else if (b.status === "generating") { setStep("generating"); startPolling(bookId); }
        if (user && want === "world") await payForWorld();
        else if (user && want === "save") await saveToAccount(bookId);
      } catch (e) {
        setError(String((e as Error).message));
      } finally {
        setParams({}, { replace: true });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // Downscale the photo client-side so it travels as a small base64 payload.
  const onPhoto = (file: File) => {
    const img = new Image();
    img.onload = () => {
      const max = 768;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      setPhotoB64(canvas.toDataURL("image/jpeg", 0.85).split(",")[1]);
    };
    img.src = URL.createObjectURL(file);
  };

  // Fill every field with a coherent random persona — one click per test run.
  const randomise = () => {
    const p = pick(PERSONAS);
    setName(pick(p.names));
    setAge(pick(["4", "5", "6", "7"]));
    setCountry(p.country);
    setCity(p.city || "");
    setCulture(p.culture);
    setLikes(pick(LIKES_POOL));
    setFaith(p.faith);
    setGender(pick(["girl", "boy"]));
    setSkinTone(pick(SKIN_TONES));
    setHair(pick(p.hair));
    setPhotoB64(null);
    if (!email.trim()) setEmail("test@localhost");
    if (levels.length) {
      const l = pick(levels);
      setLevel(l.level);
      setSound(pick(l.graphemes));
    }
    setBook(null);
  };

  const createDraft = async (): Promise<CustomBook> => {
    const { book: b } = await forgeApi.createBook({
      child_name: name.trim(),
      child_age: age,
      country,
      country_flag: flag,
      city: city.trim() || null,
      culture_notes: culture.trim() || null,
      likes: likes.trim() || null,
      faith: faith.trim() || null,
      appearance: { gender, skinTone: `${skinTone.hex} (${skinTone.label})`, hair: hair.trim() || null },
      photo_b64: photoB64,
      photo_mime: "image/jpeg",
      level,
      focus_sound: sound,
      email: email.trim() || null,
      share_requested: shareRequested,
      wall_of_love_opt_in: wallOptIn,
    });
    setBook(b);
    localStorage.setItem("forge_book_id", b.id);
    if (email.trim()) localStorage.setItem("forge_email", email.trim());
    return b;
  };

  // Pay, or redeem a code. The voucher is checked server-side and never
  // reaches this bundle, so an invalid code just comes back as a 400.
  const payForBook = async (voucher?: string) => {
    setBusy(true); setError(null);
    try {
      const b = book ?? (await createDraft());
      const r = await forgeApi.checkout({
        kind: "book", book_id: b.id, email: email.trim() || undefined,
        voucher: voucher?.trim() || undefined,
        credit_from: creditFrom || undefined,
      });
      if (r.free) {
        // Redeemed (voucher or restored credit) — generation already started.
        setCreditFrom(null);
        setStep("generating");
        startPolling(b.id);
        return;
      }
      if (!r.url) throw new Error("Checkout did not return a payment link.");
      window.location.href = r.url;
    } catch (e) {
      setError(String((e as Error).message));
      setBusy(false);
    }
  };

  const devSkipPay = async () => {
    setBusy(true); setError(null);
    try {
      const b = book ?? (await createDraft());
      await forgeApi.simulatePay({ kind: "book", book_id: b.id, email: email.trim() || undefined });
      setStep("generating");
      startPolling(b.id);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setBusy(false);
    }
  };

  // World of Books (£10) requires an account from the start — send guests to
  // sign in first, then back here with ?resume=1&want=world to pick up the
  // purchase automatically.
  const payForWorld = async () => {
    if (!user) {
      if (book?.id) localStorage.setItem("forge_book_id", book.id);
      window.location.href = `/auth?redirect=${encodeURIComponent("/create-book?resume=1&want=world")}`;
      return;
    }
    setBusy(true); setError(null);
    try {
      const { url } = await forgeApi.checkout({ kind: "world", book_id: book?.id, email: email.trim() || user.email || undefined });
      window.location.href = url;
    } catch (e) {
      setError(String((e as Error).message));
      setBusy(false);
    }
  };

  // Optional "Add to my account" for the £4.99 book — also needs sign-in, but
  // unlike World of Books it's never required to read/print the book itself.
  const saveToAccount = async (bookId: string) => {
    if (!user) {
      localStorage.setItem("forge_book_id", bookId);
      window.location.href = `/auth?redirect=${encodeURIComponent("/create-book?resume=1&want=save")}`;
      return;
    }
    setSaving(true); setError(null);
    try {
      const { book: b } = await forgeApi.saveToAccount(bookId);
      setBook(b);
      setSaved(true);
    } catch (e) {
      setError(String((e as Error).message));
    } finally {
      setSaving(false);
    }
  };

  // The real thing: the full phonics book PDF, typeset through the same
  // book_v2 template as the printed library books.
  const openPdf = async () => {
    if (!book) return;
    setPdfBusy(true); setError(null);
    try {
      const { url } = await forgeApi.pdf(book.id);
      window.open(url, "_blank");
    } catch (e) {
      const msg = String((e as Error).message);
      if (/not available online/i.test(msg)) {
        // Expected in production, not a fault — swap the button out instead
        // of leaving a red alert sitting over an otherwise happy page.
        setPdfUnavailable(true);
      } else {
        setError(msg);
      }
    } finally {
      setPdfBusy(false);
    }
  };

  const canContinueChild = name.trim().length >= 2;
  const colour = selectedLevel?.colour || "#3B82F6";

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf6ee] pb-24 [font-family:Outfit,system-ui,sans-serif]">
      {/* the atelier light — two slow colour fields, never in the way */}
      <div aria-hidden className="pointer-events-none absolute -left-48 -top-32 h-[30rem] w-[30rem] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: "radial-gradient(circle, #8b5cf6, transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute -right-48 top-64 h-[26rem] w-[26rem] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 65%)" }} />
      <div className="relative mx-auto max-w-2xl px-4 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/library" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/create-worksheet" className="flex items-center gap-1 text-sm font-semibold text-sky-600">
              <Wand2 className="h-4 w-4" /> Make a Worksheet
            </Link>
            <Link to="/world-of-books" className="flex items-center gap-1 text-sm font-semibold text-violet-600">
              <Globe2 className="h-4 w-4" /> World of Books
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.25 }}>

            {step === "intro" && (
              <div className="text-center">
                <FlipBook
                  pages={DEMO_BOOK_PAGES.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt={i === 0 ? "Sample book cover" : `Sample book page ${i}`}
                      loading={i < 3 ? "eager" : "lazy"}
                      draggable={false}
                      className="h-full w-full object-cover"
                    />
                  ))}
                  pageWidth={230}
                  autoPlayMs={3400}
                  loop
                  showCounter
                />
                <p className="mt-2 text-xs font-medium text-slate-400">
                  A whole MyPhonicsBooks story, cover to cover — tap or swipe to turn the pages
                </p>
                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
                  Your child,{" "}
                  <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-amber-500 bg-clip-text text-transparent">
                    the main character
                  </span>
                </h1>
                <p className="mx-auto mt-3 max-w-md text-lg leading-relaxed text-slate-500">
                  A real, properly decodable phonics book — written, illustrated and
                  checked for your child, in minutes.
                </p>
                <div className="mx-auto mt-6 grid max-w-md gap-3 text-left text-sm">
                  {[
                    ["🎨", "Your child is the main character", "Drawn in our house style, dot eyes and all"],
                    ["🔤", "Properly decodable at their level", "Every word checked against the sounds they know"],
                    ["🌍", "'Meet the star' page at the back", "Their country, their culture, their landmark"],
                    ["💝", "Share it to the World of Books", "A light on the globe with the family's blessing"],
                  ].map(([e, t, d], i) => (
                    <motion.div key={t} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex items-start gap-3.5 rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-900/5 backdrop-blur-sm transition hover:shadow-md">
                      <span className="text-2xl">{e}</span>
                      <span>
                        <span className="block font-bold text-slate-800">{t}</span>
                        <span className="block text-xs text-slate-400">{d}</span>
                      </span>
                    </motion.div>
                  ))}
                </div>
                <motion.button
                  onClick={() => setStep("child")}
                  whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                  className="group relative mt-9 inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-10 py-4 text-lg font-black text-white shadow-xl shadow-violet-300/60"
                >
                  <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Sparkles className="h-5 w-5" /> Start their book — £4.99
                </motion.button>
                <p className="mt-2.5 text-xs text-slate-400">One book, yours to keep and print, forever.</p>
              </div>
            )}

            {step === "child" && (
              <div>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-2xl font-extrabold text-slate-900">Who is the star? ⭐</h2>
                  {import.meta.env.DEV && (
                    <button onClick={randomise} title="Fill every step with random test data"
                      className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-violet-300 px-4 py-1.5 text-xs font-semibold text-violet-600 hover:bg-violet-50">
                      <Dices className="h-4 w-4" /> Randomise (test)
                    </button>
                  )}
                </div>
                <p className="mb-5 text-sm text-slate-500">This shapes the story, the pictures, and the profile page at the back.</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <label className="col-span-2 block">
                      <span className="text-sm font-semibold text-slate-700">First name</span>
                      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Maryam"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Age</span>
                      <select value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3">
                        {["3", "4", "5", "6", "7", "8"].map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Where are you from? {flag}</span>
                      <select value={country} onChange={(e) => setCountry(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-3">
                        {COUNTRIES.map(([c, f]) => <option key={c} value={c}>{f} {c}</option>)}
                      </select>
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">City / town <span className="font-normal text-slate-400">(optional)</span></span>
                      <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Mogadishu, Lagos, Kraków"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Your family's world <span className="font-normal text-slate-400">(culture, food, places, traditions)</span></span>
                    <textarea value={culture} onChange={(e) => setCulture(e.target.value)} rows={2}
                      placeholder="e.g. We're a Somali family in London — we love suqaar, Eid mornings and trips to the mosque"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">They love...</span>
                      <input value={likes} onChange={(e) => setLikes(e.target.value)} placeholder="cats, football, baking"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700">Faith <span className="font-normal text-slate-400">(optional)</span></span>
                      <input value={faith} onChange={(e) => setFaith(e.target.value)} placeholder="e.g. Muslim, Christian"
                        className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                    </label>
                  </div>

                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">What do they look like?</span>
                    <div className="mt-2 flex gap-2">
                      {["girl", "boy"].map((g) => (
                        <button key={g} onClick={() => setGender(g)}
                          className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${gender === g ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                          {g}
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SKIN_TONES.map((t) => (
                        <button key={t.hex} onClick={() => setSkinTone(t)} title={t.label}
                          className={`h-9 w-9 rounded-full border-2 ${skinTone.hex === t.hex ? "border-violet-600 ring-2 ring-violet-300" : "border-white"}`}
                          style={{ backgroundColor: t.hex }} />
                      ))}
                    </div>
                    <input value={hair} onChange={(e) => setHair(e.target.value)} placeholder="Hair — e.g. curly black hair, hijab, short brown hair"
                      className="mt-3 w-full rounded-xl border border-slate-200 p-3" />
                    <div className="mt-3 flex items-center gap-3">
                      <button onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">
                        <Camera className="h-4 w-4" /> {photoB64 ? "Change photo" : "Add a photo (optional)"}
                      </button>
                      {photoB64 && (
                        <span className="flex items-center gap-1 text-sm text-green-600"><Check className="h-4 w-4" /> Photo added</span>
                      )}
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={(e) => e.target.files?.[0] && onPhoto(e.target.files[0])} />
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-400">
                      <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      The photo is only used to draw the cartoon character. It is never stored, published or shown to anyone.
                    </p>
                  </div>
                </div>
                <WizardNav onBack={() => setStep("intro")} onNext={() => setStep("level")} nextDisabled={!canContinueChild} />
              </div>
            )}

            {step === "level" && (
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Pick a level and one focus sound 🔤</h2>
                <p className="mb-5 text-sm text-slate-500">
                  One sound keeps the story free and fun — it only needs to appear a few times.
                  Not sure of the level? <Link to="/assessment" className="font-semibold text-violet-600">Take the 3-minute check</Link>.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {levels.map((l) => (
                    <button key={l.level} onClick={() => { setLevel(l.level); setSound(""); }}
                      className={`rounded-xl p-3 text-left text-white shadow-sm transition ${level === l.level ? "ring-4 ring-offset-2" : "opacity-80 hover:opacity-100"}`}
                      style={{ backgroundColor: l.colour }}>
                      <div className="text-xs font-bold opacity-80">Level {l.level}</div>
                      <div className="text-sm font-extrabold leading-tight">{l.name}</div>
                    </button>
                  ))}
                </div>
                {selectedLevel && (
                  <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                    <span className="text-sm font-semibold text-slate-700">Focus sound for this book</span>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedLevel.graphemes.map((g) => (
                        <button key={g} onClick={() => setSound(g)}
                          className={`rounded-xl px-4 py-2 font-bold ${sound === g ? "text-white" : "bg-slate-100 text-slate-700"}`}
                          style={sound === g ? { backgroundColor: selectedLevel.colour } : undefined}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <WizardNav onBack={() => setStep("child")} onNext={() => setStep("review")} nextDisabled={!sound} />
              </div>
            )}

            {step === "review" && (
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Nearly there! 🎉</h2>
                <p className="mb-5 text-sm text-slate-500">Check the details, choose how you'd like to share, and we'll start the presses.</p>

                {/* Mock cover preview */}
                <div className="mx-auto w-56 overflow-hidden rounded-2xl shadow-xl" style={{ backgroundColor: colour }}>
                  <div className="p-4 text-center text-white">
                    <div className="text-[10px] font-bold uppercase tracking-wider opacity-80">MyPhonicsBooks · Level {level} · "{sound}"</div>
                    <div className="mt-6 text-6xl">{flag}</div>
                    <div className="mt-6 text-xl font-extrabold leading-tight">{name || "?"}'s Story</div>
                    <div className="mb-2 mt-1 text-xs opacity-80">A book starring {name || "your child"}</div>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">Your email (for your receipt + book link)</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                      className="mt-1 w-full rounded-xl border border-slate-200 p-3" />
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <input type="checkbox" checked={shareRequested} onChange={(e) => setShareRequested(e.target.checked)} className="mt-1 h-5 w-5 accent-violet-600" />
                    <span className="text-sm text-slate-700">
                      <b>Share our book to the World of Books</b> 🌍<br />
                      <span className="text-slate-500">After a quick review by our team, other families can read {name || "your child"}'s book. Bring the world together, one story at a time.</span>
                    </span>
                  </label>
                  <label className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                    <input type="checkbox" checked={wallOptIn} onChange={(e) => setWallOptIn(e.target.checked)} className="mt-1 h-5 w-5 accent-violet-600" />
                    <span className="text-sm text-slate-700">
                      <b>Show us on the Wall of Love</b> 💝<br />
                      <span className="text-slate-500">The "Meet the star" page (cartoon character only — never the photo) appears in the community gallery.</span>
                    </span>
                  </label>
                </div>
                <WizardNav onBack={() => setStep("level")} onNext={() => setStep("pay")} nextLabel="Continue to payment" />
              </div>
            )}

            {step === "pay" && (
              <div className="text-center">
                <h2 className="text-2xl font-extrabold text-slate-900">Create {name}'s book</h2>
                <div className="mx-auto mt-5 max-w-sm rounded-3xl bg-white p-6 shadow-lg">
                  <div className="text-5xl font-extrabold text-slate-900">£4.99</div>
                  <div className="mt-1 text-sm font-semibold text-violet-600">One personalised book · yours to keep</div>
                  <ul className="mt-4 space-y-2 text-left text-sm text-slate-600">
                    {[
                      `A full decodable story around the sound "${sound}"`,
                      `${name} illustrated as the hero on every page`,
                      "Eye-rule + phonics QA on every single page",
                      "The 'Meet the star' family page at the back",
                      "Read it instantly on screen, forever",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />{t}</li>
                    ))}
                  </ul>
                  <button onClick={() => payForBook()} disabled={busy}
                    className="mt-5 w-full rounded-full bg-violet-600 py-3 font-bold text-white shadow-md hover:bg-violet-700 disabled:opacity-50">
                    {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Create my book — £4.99"}
                  </button>

                  {/* Private code. Deliberately understated: it exists so one
                      person can test the real flow end to end without paying,
                      not as a discount anyone hunts for. */}
                  {!showVoucher ? (
                    <button onClick={() => setShowVoucher(true)}
                      className="mt-3 w-full text-xs text-slate-400 hover:text-slate-600">
                      Have a code?
                    </button>
                  ) : (
                    <div className="mt-3 flex gap-2">
                      <input value={voucher} onChange={(e) => setVoucher(e.target.value)}
                        placeholder="Enter code"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter" && voucher.trim()) payForBook(voucher); }}
                        className="min-w-0 flex-1 rounded-full border border-slate-300 px-4 py-2 text-sm focus:border-violet-500 focus:outline-none" />
                      <button onClick={() => payForBook(voucher)} disabled={busy || !voucher.trim()}
                        className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">
                        Apply
                      </button>
                    </div>
                  )}

                  {/* Dev-only. The forge API is dev-only too, but this button
                      must never render in a production build even so. */}
                  {import.meta.env.DEV && (
                    <button onClick={devSkipPay} disabled={busy}
                      className="mt-2 w-full rounded-full border border-dashed border-slate-300 py-2 text-xs text-slate-400 hover:text-slate-600">
                      🧪 Create free (dev test mode — no charge)
                    </button>
                  )}
                </div>
                <WizardNav onBack={() => setStep("review")} />
              </div>
            )}

            {step === "generating" && (
              <div className="text-center">
                {/* the atelier at work — a slow halo, a steady hand */}
                <div className="relative mx-auto h-28 w-28">
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    style={{ background: `conic-gradient(from 0deg, ${colour}, #f59e0b, #ec4899, ${colour})` }}
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                  />
                  <div className="absolute inset-[5px] flex items-center justify-center rounded-full bg-[#faf6ee]">
                    <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
                      <Wand2 className="h-10 w-10" style={{ color: colour }} />
                    </motion.div>
                  </div>
                </div>
                <h2 className="mt-6 text-3xl font-black tracking-tight text-slate-900">
                  Painting {name.trim() || "your child"}'s book
                </h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">
                  Written, illustrated and checked page by page — yes, we check the eyes.
                  Keep this page open; it takes a few minutes.
                </p>
                <div className="mx-auto mt-7 max-w-sm">
                  <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80 shadow-inner">
                    <motion.div className="relative h-full overflow-hidden rounded-full" style={{ backgroundColor: colour }}
                      animate={{ width: `${book?.progress?.pct ?? 3}%` }} transition={{ duration: 0.6 }}>
                      {/* shimmer riding the fill */}
                      <motion.div
                        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ["-100%", "260%"] }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                      />
                    </motion.div>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={book?.progress?.message || "warmup"}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="mt-3.5 min-h-[1.5rem] text-sm font-bold text-slate-700"
                    >
                      {book?.progress?.message || "Warming up the paints..."}
                    </motion.p>
                  </AnimatePresence>
                  {book?.status === "failed" && !book.generating && (
                    <button onClick={() => { forgeApi.retry(book.id); startPolling(book.id); }}
                      className="mt-4 rounded-full bg-slate-900 px-7 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800">
                      Something hiccupped — pick up where it stopped (free)
                    </button>
                  )}
                  {book?.status === "content_rejected" && !book.generating && (
                    <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left">
                      <p className="text-sm font-extrabold text-slate-900">
                        We couldn't get this story to meet our quality standard.
                      </p>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                        Your book credit has not been used. You can try the same idea again
                        or choose a different story idea.
                      </p>
                      <div className="mt-4 flex flex-col gap-2">
                        <button onClick={() => { forgeApi.retry(book.id); startPolling(book.id); }}
                          className="rounded-full bg-slate-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-slate-800">
                          Try the same idea again (free)
                        </button>
                        <button onClick={() => { setCreditFrom(book.id); setBook(null); localStorage.removeItem("forge_book_id"); setStep("child"); }}
                          className="rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                          Change the story idea (credit carries over)
                        </button>
                      </div>
                    </div>
                  )}
                  {["paused_provider_credit", "paused_budget"].includes(book?.status || "") && !book?.generating && (
                    <p className="mx-auto mt-4 max-w-sm rounded-xl bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">
                      Your book is safe and saved. It's taking a little longer than usual —
                      it will continue from exactly where it stopped, and we'll email you
                      when it's ready.
                    </p>
                  )}
                </div>
              </div>
            )}

            {step === "ready" && book?.pages && (() => {
              // The book's own level (name + colour), the SAME source used
              // to write the story — not a re-derived guess.
              const bookLevel = levels.find((l) => l.level === book.level);
              const levelColour = bookLevel?.colour || "#3B82F6";
              return (
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500 shadow-lg">
                  <PartyPopper className="h-8 w-8 text-white" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Their book is ready!</h2>
                <p className="mt-1 text-slate-500">Made for the {book.child_name} family {book.country_flag}</p>

                {/* The real MyPhonicsBooks cover template (book_v2.html
                    .cover): level-colour top band + brand, full-bleed
                    illustration, level-colour bottom band with the title —
                    pixel-for-pixel the same layout as every printed cover in
                    /public/covers/, not just the raw painted art. */}
                <button onClick={() => setReading(true)}
                  className="group mx-auto mt-5 block w-64 overflow-hidden rounded-2xl shadow-xl ring-1 ring-black/5 transition hover:scale-[1.02]">
                  <div className="flex items-center justify-between px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white"
                    style={{ backgroundColor: levelColour }}>
                    <span>Level {book.level} · {bookLevel?.name || ""}</span>
                    <span className="opacity-95">MyPhonicsBooks</span>
                  </div>
                  <div className="aspect-[3/4] w-full overflow-hidden bg-slate-100">
                    {book.pages[0]?.imageUrl && (
                      <img src={book.pages[0].imageUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="px-4 py-4 text-center text-white" style={{ backgroundColor: levelColour }}>
                    <div className="text-lg font-extrabold leading-tight">{book.title}</div>
                    <div className="mt-0.5 text-xs italic text-white/90">Level {book.level} · {bookLevel?.name || ""}</div>
                  </div>
                </button>

                {/* PDF typesetting needs Python + Playwright, which run on the
                    studio machine only — production returns 501 (DEPLOY.md).
                    Once that's known, the button disappears rather than
                    inviting another dead click; "Read it here" carries the
                    weight as the primary, permanent way to enjoy the book. */}
                {pdfUnavailable ? (
                  <p className="mx-auto mt-4 max-w-xs text-xs text-slate-400">
                    Printable PDFs are coming soon — for now, enjoy the book right here.
                  </p>
                ) : (
                  <button onClick={openPdf} disabled={pdfBusy}
                    className="mt-4 rounded-full bg-violet-600 px-8 py-3 font-bold text-white shadow-md hover:bg-violet-700 disabled:opacity-60">
                    {pdfBusy ? <span className="flex items-center gap-2"><Loader2 className="h-5 w-5 animate-spin" /> Typesetting the book...</span> : "Open the book 📕 (full phonics book PDF)"}
                  </button>
                )}
                <button onClick={() => setReading(true)}
                  className="mx-auto mt-2 block rounded-full bg-violet-50 px-6 py-2.5 text-sm font-bold text-violet-700 hover:bg-violet-100">
                  Read it here — turn the pages 📖
                </button>

                {saved || book.user_id ? (
                  <p className="mt-3 flex items-center justify-center gap-1 text-xs font-semibold text-green-600">
                    <Check className="h-3.5 w-3.5" /> Saved to your account
                  </p>
                ) : (
                  <button onClick={() => saveToAccount(book.id)} disabled={saving}
                    className="mx-auto mt-3 block rounded-full border border-violet-200 px-5 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50 disabled:opacity-50">
                    {saving ? "Saving..." : "+ Add to my account"}
                  </button>
                )}

                {book.share_requested && book.status === "ready" && (
                  <p className="mt-3 text-xs text-slate-400">Your book is with our team for a quick review before it appears in the World of Books.</p>
                )}
                {book.status === "approved" && (
                  <p className="mt-3 text-xs font-semibold text-green-600">Your book is live in the World of Books! 🌍</p>
                )}

                {!worldPaid && (
                  <div className="mx-auto mt-8 max-w-sm rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-left">
                    <div className="flex items-center gap-2 font-extrabold text-slate-900"><Globe2 className="h-5 w-5 text-amber-500" /> Unlock the World of Books</div>
                    <p className="mt-1 text-sm text-slate-600">
                      Read every book made by families around the world — and every one made after you. One payment, forever.
                    </p>
                    {!user && (
                      <p className="mt-1.5 text-xs text-slate-400">
                        You'll need to sign in — it's how your access travels with you and stays yours.
                      </p>
                    )}
                    <button onClick={payForWorld} disabled={busy}
                      className="mt-3 w-full rounded-full bg-slate-900 py-2.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50">
                      {busy ? "..." : user ? "Unlock the world — £10, once" : "Sign in to unlock the world — £10"}
                    </button>
                    {import.meta.env.DEV && (
                      <button onClick={async () => {
                        const testEmail = email.trim() || book.email || "test@localhost";
                        localStorage.setItem("forge_email", testEmail);
                        try {
                          await forgeApi.simulatePay({ kind: "world", email: testEmail });
                          setWorldPaid(true);
                        } catch (e) {
                          setError(String((e as Error).message));
                        }
                      }}
                        className="mt-2 w-full text-xs text-slate-400 underline-offset-2 hover:underline">
                        🧪 dev: unlock free
                      </button>
                    )}
                  </div>
                )}
                {worldPaid && (
                  <Link to="/world-of-books" className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-500 px-8 py-3 font-bold text-white shadow-md">
                    <Globe2 className="h-5 w-5" /> Enter the World of Books
                  </Link>
                )}
              </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
      </div>

      {reading && book?.pages && <CustomBookReader pages={book.pages} onClose={() => setReading(false)} />}
    </div>
  );
}

function WizardNav({ onBack, onNext, nextDisabled, nextLabel }: {
  onBack?: () => void; onNext?: () => void; nextDisabled?: boolean; nextLabel?: string;
}) {
  return (
    <div className="mt-8 flex items-center justify-between">
      {onBack ? (
        <button onClick={onBack} className="flex items-center gap-1 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-100">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : <span />}
      {onNext && (
        <button onClick={onNext} disabled={nextDisabled}
          className="flex items-center gap-1 rounded-full bg-violet-600 px-7 py-2.5 font-bold text-white shadow-md hover:bg-violet-700 disabled:opacity-40">
          {nextLabel || "Next"} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
