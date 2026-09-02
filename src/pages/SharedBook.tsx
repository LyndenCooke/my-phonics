import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Globe2, Loader2, Sparkles } from "lucide-react";
import { forgeApi, type SharedBook as SharedBookRow } from "@/lib/forgeApi";
import CustomBookReader, { CustomBookPageView } from "@/components/CustomBookReader";
import FlipBook from "@/components/FlipBook";
import { flagUrl } from "@/lib/countries";

/**
 * /story/:id — the share link for a family-made book.
 *
 * Every Create-A-Book is sent to grandparents, aunties and school WhatsApp
 * groups the moment it is ready. Until this page existed there was nowhere
 * for that link to go: the book lived in the buyer's own browser (localStorage)
 * or behind the £10 World of Books. This is the public face of one book:
 * the real pages, turnable, with no account needed, and a gentle invitation
 * for the next family to make their own.
 *
 * Deliberately no Layout: the reader is usually a stranger to the app, so
 * the page stands on its own like the wizard does.
 */
export default function SharedBook() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<SharedBookRow | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!id) { setState("missing"); return; }
    let alive = true;
    forgeApi.share(id)
      .then((r) => { if (alive) { setBook(r.book); setState("ready"); } })
      .catch(() => { if (alive) setState("missing"); });
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    const prev = document.title;
    if (book) document.title = `${book.title || `${book.child_name}'s book`} — MyPhonicsBooks`;
    return () => { document.title = prev; };
  }, [book]);

  const colour = book?.pages[0]?.levelColour || "#3B82F6";
  const levelName = book?.pages[0]?.levelName || "";
  const flagArt = book?.country ? flagUrl(book.country) : null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#faf6ee] pb-20 [font-family:Outfit,system-ui,sans-serif]">
      <div aria-hidden className="pointer-events-none absolute -left-48 -top-32 h-[30rem] w-[30rem] rounded-full opacity-[0.14] blur-3xl"
        style={{ background: `radial-gradient(circle, ${colour}, transparent 65%)` }} />
      <div aria-hidden className="pointer-events-none absolute -right-48 top-64 h-[26rem] w-[26rem] rounded-full opacity-[0.12] blur-3xl"
        style={{ background: "radial-gradient(circle, #f59e0b, transparent 65%)" }} />

      <div className="relative mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-6 flex items-center justify-between text-sm">
          <Link to="/" className="font-extrabold text-slate-700">MyPhonicsBooks</Link>
          <Link to="/world-of-books" className="flex items-center gap-1 font-semibold text-violet-600">
            <Globe2 className="h-4 w-4" /> World of Books
          </Link>
        </div>

        {state === "loading" && (
          <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-slate-300" /></div>
        )}

        {state === "missing" && (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-900/5">
            <BookOpen className="mx-auto h-8 w-8 text-slate-300" />
            <h1 className="mt-3 text-xl font-extrabold text-slate-900">This book is not ready to share yet</h1>
            <p className="mt-2 text-sm text-slate-500">
              Either the link is missing a piece, or the book is still being painted. Ask whoever sent it to try again once it is finished.
            </p>
            <Link to="/create-book" className="mt-5 inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-violet-700">
              <Sparkles className="h-4 w-4" /> Make a book for your child
            </Link>
          </div>
        )}

        {state === "ready" && book && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <div className="text-center">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-600 shadow-sm ring-1 ring-slate-900/5">
                {flagArt ? (
                  <img src={flagArt} alt="" className="h-3.5 w-5 rounded-[2px] object-cover" />
                ) : (
                  <span>{book.country_flag || "🌍"}</span>
                )}
                <span>{book.country || "A family-made book"}</span>
                <span className="rounded-full px-2 py-px text-[10px] font-extrabold text-white" style={{ backgroundColor: colour }}>
                  Level {book.level}{levelName ? ` · ${levelName}` : ""}
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
                {book.title || `${book.child_name}'s Story`}
              </h1>
              <p className="mx-auto mt-2 max-w-md text-slate-500">
                A real decodable phonics book starring {book.child_name}, written around the sound
                <span className="font-bold text-slate-700"> "{book.focus_sound}"</span>. Tap or swipe to turn the pages.
              </p>
            </div>

            <div className="mt-6">
              <FlipBook
                pages={book.pages.map((page, i) => (
                  <CustomBookPageView key={i} page={page} colour={colour} />
                ))}
                pageWidth={340}
                showCounter
              />
            </div>

            <div className="mt-4 text-center">
              <button onClick={() => setReading(true)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-700 shadow-sm ring-1 ring-slate-900/5 hover:bg-slate-50">
                <BookOpen className="h-4 w-4" /> Read it full screen
              </button>
            </div>

            <div className="mx-auto mt-12 max-w-lg rounded-3xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-900/5">
              <Sparkles className="mx-auto h-6 w-6 text-violet-500" />
              <h2 className="mt-2 text-xl font-extrabold text-slate-900">Your child, the main character</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Every word in {book.child_name}'s book is matched to the sounds a child has been taught,
                following the UK phonics curriculum. Make one for a child you love: their name, their home,
                their story, illustrated in minutes.
              </p>
              <Link to="/create-book"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 py-3 font-black text-white shadow-lg shadow-violet-300/50 hover:opacity-95">
                <Sparkles className="h-5 w-5" /> Create their book — £4.99
              </Link>
              <p className="mt-3 text-xs text-slate-400">
                Not sure of their level? <Link to="/assessment" className="font-semibold text-violet-600">Take the free 3-minute check</Link>.
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {reading && book && <CustomBookReader pages={book.pages} onClose={() => setReading(false)} />}
    </div>
  );
}
