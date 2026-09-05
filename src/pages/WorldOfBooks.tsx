import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { BookHeart, BookOpen, Globe2, Heart, LayoutGrid, Loader2, Lock, Printer, Sparkles, Star, X } from "lucide-react";
import Layout from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useBooks, useUserBooks, useBookPages } from "@/hooks/useBooks";
import { hasInteractiveData } from "@/lib/interactiveBooksAvailability";
import type { Book } from "@/lib/types";
import { forgeApi, type CustomBook } from "@/lib/forgeApi";
import CustomBookReader from "@/components/CustomBookReader";
import DownloadFormatDialog, { type DownloadFormat, formatDisplayLabel } from "@/components/DownloadFormatDialog";
import WorldGlobe, { flagUrl, type GlobePin } from "@/components/WorldGlobe";
import { getJourneyLevel, JOURNEY_LEVELS } from "@/lib/levels8";
import { LIBRARY_WORLD, libraryCoverUrl, libraryJourneyLevel, type LibraryWorldBook } from "@/lib/libraryWorld";

const InteractiveBookReader = lazy(() => import("@/components/InteractiveBookReader"));
const BookReader = lazy(() => import("@/components/BookReader"));

/**
 * The World of Books — spin the globe, tap a flag, meet the books that live
 * there.
 *
 * Page shape (Lynden 2026-08-08): globe first, Wall of Love underneath, and
 * NO book grid until a flag is tapped — then that country's shelf appears
 * between them.
 *
 * Reading and downloading a library book both happen IN PLACE (Lynden
 * 2026-08-09: "the online book didn't load and I don't like the way it
 * jolts to the library"). The old version deep-linked to /library?book=,
 * which (a) full-page-navigated away — the "jolt" — and (b) silently did
 * nothing for any book the visitor wasn't entitled to: Index.tsx's deep-link
 * effect only opens the reader `if (match && match.unlocked)` and otherwise
 * just sits there, which read as "didn't load". So this page now fetches the
 * real book rows + entitlement the same way the library does (useBooks,
 * useUserBooks, useIsAdmin) and renders the SAME reader components
 * (InteractiveBookReader / BookReader) as an overlay here — no navigation —
 * with an honest locked-state message when the visitor genuinely isn't
 * entitled, instead of a silent no-op. Downloads go through the real gated
 * edge function (generate-pdf-download) via DownloadFormatDialog, the exact
 * mechanism the library page uses — the earlier version pointed at a static
 * /book-pdfs/*.pdf path that was never deployed (gitignored) and 404'd in
 * production for every single book.
 *
 * The Wall of Love here is the REAL one — the same `public_testimonials`
 * view as /love and the landing carousel, consented quotes only, in the same
 * paper-and-stickers style. Nothing invented.
 */

interface ShelfBook {
  key: string;
  kind: "library" | "family";
  title: string;
  level: number;
  country: string | null;
  flag: string;
  cover: string | null;
  subtitle: string;
  lib?: LibraryWorldBook;
  custom?: CustomBook;
}

interface Testimonial {
  id: string;
  rating: number | null;
  quote: string;
  first_name: string | null;
}

const STICKER = "0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)";
const TILTS = [-1.5, 1, -0.5, 1.5, -1, 0.5];
const ACCENTS = ["#E84B8A", "#F59E0B", "#22C55E", "#3B82F6", "#8B5CF6", "#14B8A6"];

export default function WorldOfBooks() {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const isQaUser = user?.email?.toLowerCase() === "hello@myphonicsbooks.co.uk";
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [books, setBooks] = useState<CustomBook[]>([]);
  const [reading, setReading] = useState<CustomBook | null>(null);
  const [readingLibraryId, setReadingLibraryId] = useState<string | null>(null);
  const [downloadLibraryBook, setDownloadLibraryBook] = useState<Book | null>(null);
  const [familyPdfBusy, setFamilyPdfBusy] = useState(false);
  const [country, setCountry] = useState<string | null>(null);
  const [view, setView] = useState<"globe" | "level">("globe");
  const [chooser, setChooser] = useState<ShelfBook | null>(null);
  const [quotes, setQuotes] = useState<Testimonial[] | null>(null);
  const email = localStorage.getItem("forge_email");

  // Real book rows + entitlements — the same source the library page reads,
  // so "unlocked" here means exactly what it means there.
  const { data: booksData } = useBooks(null);
  const { data: userBooksData } = useUserBooks();
  const { data: pagesData } = useBookPages(readingLibraryId);
  const userBooksMap = useMemo(
    () => new Map((userBooksData ?? []).map((ub) => [ub.book_id, ub])),
    [userBooksData],
  );
  // legacySub -> full Book, unlocked exactly like Index.tsx computes it.
  const libraryBooks = useMemo(() => {
    const m = new Map<string, Book>();
    for (const b of booksData ?? []) {
      const ub = userBooksMap.get(b.id);
      m.set(b.sub_level, {
        id: b.id,
        level: b.level,
        subLevel: b.sub_level,
        title: b.title,
        slug: b.slug,
        focusSounds: b.focus_sounds,
        trickyWords: b.tricky_words ?? [],
        storyWords: b.story_words ?? [],
        coverImageUrl: b.cover_image_url ?? undefined,
        pdfUrl: b.pdf_url ?? undefined,
        pageCount: b.page_count ?? 16,
        sortOrder: b.sort_order,
        // Launch 2026-09-05: library books are free to read for everyone.
        unlocked: true,
        completed: !!ub?.completed_at,
        lastPageRead: ub?.last_page_read ?? 0,
        pages: (pagesData && readingLibraryId === b.id)
          ? pagesData.map((p) => ({
              id: p.id,
              pageNumber: p.page_number,
              pageType: p.page_type as Book["pages"][0]["pageType"],
              textContent: p.text_content ?? undefined,
              imageUrl: p.image_url ?? undefined,
            }))
          : [],
      });
    }
    return m;
  }, [booksData, userBooksMap, isAdmin, isQaUser, pagesData, readingLibraryId]);
  const readingBook = useMemo(
    () => (readingLibraryId ? [...libraryBooks.values()].find((b) => b.id === readingLibraryId) ?? null : null),
    [libraryBooks, readingLibraryId],
  );

  // Re-checks whenever the signed-in user changes — e.g. landing back here
  // right after the sign-in redirect from a family-made-book chooser below.
  useEffect(() => {
    forgeApi
      .world(email)
      .then((r) => { setAccess(r.access); setBooks(r.books); })
      .catch(() => { /* world still renders with the library alone */ })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Real testimonials — same view as /love; consented quotes only.
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await (supabase as unknown as {
        from: (t: string) => {
          select: (c: string) => { order: (k: string, o: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: Testimonial[] | null }> } };
        };
      })
        .from("public_testimonials")
        .select("id, rating, quote, first_name")
        .order("submitted_at", { ascending: false })
        .limit(9);
      if (alive) setQuotes(data ?? []);
    })();
    return () => { alive = false; };
  }, []);

  const shelf: ShelfBook[] = useMemo(() => [
    ...LIBRARY_WORLD.map((b): ShelfBook => ({
      key: `lib-${b.legacySub}`,
      kind: "library",
      title: b.title,
      level: libraryJourneyLevel(b),
      country: b.country,
      flag: b.flag,
      cover: libraryCoverUrl(b),
      subtitle: b.setting,
      lib: b,
    })),
    ...books.map((b): ShelfBook => ({
      key: `fam-${b.id}`,
      kind: "family",
      title: b.title || "Untitled",
      level: b.level,
      country: b.country || null,
      flag: b.country_flag || "🌍",
      cover: b.pages?.[0]?.imageUrl || b.cover || null,
      subtitle: `${b.child_name}'s own book`,
      custom: b,
    })),
  ], [books]);

  const globePins: GlobePin[] = useMemo(() => {
    const by = new Map<string, GlobePin>();
    for (const b of shelf) {
      if (!b.country) continue;
      const cur = by.get(b.country);
      if (cur) cur.count += 1;
      else by.set(b.country, { country: b.country, flag: b.flag, count: 1 });
    }
    return [...by.values()].sort((a, b) => b.count - a.count);
  }, [shelf]);

  const countryBooks = useMemo(
    () => (country ? shelf.filter((b) => b.country === country) : []),
    [shelf, country],
  );

  // Level view — every book (library + family-made), grouped by journey
  // level in ledger order, for parents who'd rather browse by what their
  // child can actually read than spin a globe.
  const byLevel = useMemo(() => {
    const groups = new Map<number, ShelfBook[]>();
    for (const b of shelf) {
      const list = groups.get(b.level) ?? [];
      list.push(b);
      groups.set(b.level, list);
    }
    for (const list of groups.values()) list.sort((a, b) => a.title.localeCompare(b.title));
    return JOURNEY_LEVELS
      .map((lv) => ({ level: lv, books: groups.get(lv.level) ?? [] }))
      .filter((g) => g.books.length > 0);
  }, [shelf]);

  // Resolve a shelf entry's real Book row (library only) so the chooser can
  // show the true locked state instead of guessing.
  const realBookFor = (b: ShelfBook): Book | null =>
    b.kind === "library" ? libraryBooks.get(b.lib!.legacySub) ?? null : null;

  // "Read online" — opens the SAME reader the library uses, right here, no
  // navigation. Locked books show the honest reason instead of a silent
  // no-op (that silence is what read as "didn't load").
  const readOnline = (b: ShelfBook) => {
    if (b.kind === "library") {
      const real = realBookFor(b);
      if (!real?.unlocked) return; // chooser's own locked-state UI handles this
      setChooser(null);
      setReadingLibraryId(real.id);
      return;
    }
    if (b.custom?.pages && access) { setChooser(null); setReading(b.custom); }
  };

  // "Print at home" — the real gated flow (generate-pdf-download), same as
  // the library's download button, via the same format-picker dialog.
  const printBook = (b: ShelfBook) => {
    if (b.kind === "library") {
      const real = realBookFor(b);
      if (!real?.unlocked) return;
      setChooser(null);
      setDownloadLibraryBook(real);
      return;
    }
    if (!b.custom || !access) return;
    setChooser(null);
    setFamilyPdfBusy(true);
    forgeApi.pdf(b.custom.id)
      .then(({ url }) => window.open(url, "_blank"))
      .catch(() => setReading(b.custom!)) // no PDF in prod → the online reader
      .finally(() => setFamilyPdfBusy(false));
  };

  // Mirrors Index.tsx's performDownload exactly: hits generate-pdf-download
  // (tier throttling, real Supabase Storage URL), then forces a real file
  // save via blob + <a download> — window.open after an await chain is
  // silently popup-blocked on Safari/Chrome and installed PWAs.
  const performLibraryDownload = async (
    book: Book,
    format: DownloadFormat,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-pdf-download`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({ book_id: book.id, format }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "download_limit") {
          const cooldown = data.cooldown_until ? ` Try again soon.` : "";
          return { success: false, error: `${data.message ?? "Download not available."}${cooldown}` };
        }
        return { success: false, error: data?.error || "Download failed" };
      }
      const pdfRes = await fetch(data.url);
      if (!pdfRes.ok) return { success: false, error: "PDF file unavailable" };
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${book.title} (${formatDisplayLabel(format)}).pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      if (user && !book.id.startsWith("local-")) {
        await supabase.from("download_log").insert({ user_id: user.id, book_id: book.id });
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: String((e as Error).message || e) };
    }
  };

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 pb-16">
        {/* ---------------------------------------------------- header --- */}
        <div className="pt-6 text-center sm:pt-10">
          <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary-ink">
            <Globe2 className="h-3.5 w-3.5" /> The World of Books
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Every book takes you somewhere
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Spin the globe and tap a flag to meet the books that live there — from our own
            library, and made by families like yours.
          </p>

          {/* Globe vs. level-order toggle */}
          <div className="mx-auto mt-5 inline-flex rounded-full bg-muted p-1">
            <button
              onClick={() => setView("globe")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition ${
                view === "globe" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Globe2 className="h-3.5 w-3.5" /> Globe
            </button>
            <button
              onClick={() => setView("level")}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition ${
                view === "level" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> By level
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------- globe --- */}
        {view === "globe" && <div className="relative mt-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" /></div>
          ) : (
            <>
              <WorldGlobe pins={globePins} selected={country} onSelect={setCountry} />

              {/* Tap a flag → that country's books pop up beside the globe */}
              <AnimatePresence>
                {country && (
                  <motion.div
                    key={country}
                    initial={{ opacity: 0, y: 14, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="mx-auto mt-4 max-w-xl rounded-3xl border border-border bg-white p-4 text-left shadow-lg sm:absolute sm:right-0 sm:top-6 sm:mt-0 sm:w-72"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-display font-extrabold text-foreground">
                        {flagUrl(country) && (
                          <img src={flagUrl(country)!} alt="" className="h-4 w-6 rounded-[3px] object-cover ring-1 ring-foreground/10" />
                        )}
                        <span className="truncate">{country}</span>
                      </div>
                      <button onClick={() => setCountry(null)} aria-label="Close"
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-muted">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">Tap a book to read it online or print it at home.</p>
                    <div className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
                      {countryBooks.map((b) => (
                        <button key={b.key} onClick={() => setChooser(b)}
                          className="flex w-full items-start gap-3 rounded-2xl p-2 text-left transition hover:bg-primary/5">
                          {b.cover ? (
                            <img src={b.cover} alt="" className="h-16 w-12 shrink-0 rounded-lg object-cover ring-1 ring-foreground/10" />
                          ) : (
                            <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded-lg bg-muted"><BookHeart className="h-5 w-5 text-muted-foreground/40" /></div>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-extrabold text-foreground">{b.title}</span>
                            <span className="block truncate text-xs text-muted-foreground">{b.subtitle}</span>
                            <span className="mt-1 inline-block rounded-full px-2 py-px text-[10px] font-extrabold text-white"
                              style={{ backgroundColor: getJourneyLevel(b.level)?.hex || "#64748b" }}>
                              Level {b.level}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>}

        {/* ------------------------------------- shelf (only when tapped) --- */}
        <AnimatePresence>
          {view === "globe" && country && countryBooks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.3 }}
              className="mt-10"
            >
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
                  {flagUrl(country) && <img src={flagUrl(country)!} alt="" className="h-5 w-7 rounded-[3px] object-cover ring-1 ring-foreground/10" />}
                  Books from {country}
                </h2>
                <button onClick={() => setCountry(null)}
                  className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-border">
                  Close
                </button>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {countryBooks.map((b, idx) => (
                  <motion.button
                    key={b.key}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.35 }}
                    whileHover={{ y: -6 }}
                    onClick={() => setChooser(b)}
                    className="group overflow-hidden rounded-2xl bg-white text-left shadow-md shadow-foreground/5 ring-1 ring-foreground/5 transition-shadow hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden">
                      {b.cover ? (
                        <img src={b.cover} alt="" loading="lazy"
                          className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted"><BookHeart className="h-8 w-8 text-muted-foreground/40" /></div>
                      )}
                      <div className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow"
                        style={{ backgroundColor: getJourneyLevel(b.level)?.hex || "#64748b" }}>
                        L{b.level}
                      </div>
                      {b.kind === "family" && (
                        <div className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-ink shadow-sm">
                          <Heart className="mr-0.5 inline h-2.5 w-2.5 fill-primary text-primary" /> family-made
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-extrabold text-foreground">{b.title}</div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">{b.subtitle}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ------------------------------------------------ level view --- */}
        {view === "level" && (
          <div className="mt-8 space-y-10">
            {byLevel.map(({ level, books: levelBooks }) => (
              <div key={level.level}>
                <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
                  <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: level.hex }} />
                  Level {level.level} · {level.name}
                </h2>
                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                  {levelBooks.map((b, idx) => (
                    <motion.button
                      key={b.key}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: (idx % 8) * 0.04, duration: 0.3 }}
                      whileHover={{ y: -6 }}
                      onClick={() => setChooser(b)}
                      className="group overflow-hidden rounded-2xl bg-white text-left shadow-md shadow-foreground/5 ring-1 ring-foreground/5 transition-shadow hover:shadow-xl"
                    >
                      <div className="relative overflow-hidden">
                        {b.cover ? (
                          <img src={b.cover} alt="" loading="lazy"
                            className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
                        ) : (
                          <div className="flex aspect-[3/4] w-full items-center justify-center bg-muted"><BookHeart className="h-8 w-8 text-muted-foreground/40" /></div>
                        )}
                        {b.flag && (
                          <div className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-extrabold shadow">
                            {b.flag}
                          </div>
                        )}
                        {b.kind === "family" && (
                          <div className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primary-ink shadow-sm">
                            <Heart className="mr-0.5 inline h-2.5 w-2.5 fill-primary text-primary" /> family-made
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="truncate text-sm font-extrabold text-foreground">{b.title}</div>
                        <div className="mt-0.5 truncate text-xs text-muted-foreground">{b.subtitle}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ------------------------------- read online / print chooser ---
            Portalled to <body>: the route-transition wrapper carries a CSS
            transform, which turns position:fixed into "fixed inside the
            transformed box" — the card centred against the whole page height
            and landed off-screen (same trap the shop modals hit; see
            feedback_mpb memory "modals portal to body"). */}
        {createPortal(<AnimatePresence>
          {chooser && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-4 backdrop-blur-sm"
              onClick={() => setChooser(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 12 }}
                transition={{ duration: 0.2 }}
                className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start gap-3">
                  {chooser.cover && <img src={chooser.cover} alt="" className="h-24 w-[4.5rem] rounded-xl object-cover ring-1 ring-foreground/10" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-display text-lg font-extrabold leading-tight text-foreground">{chooser.title}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{chooser.subtitle}</div>
                    <span className="mt-1.5 inline-block rounded-full px-2 py-px text-[10px] font-extrabold text-white"
                      style={{ backgroundColor: getJourneyLevel(chooser.level)?.hex || "#64748b" }}>
                      Level {chooser.level}
                    </span>
                  </div>
                  <button onClick={() => setChooser(null)} aria-label="Close"
                    className="rounded-full p-1 text-muted-foreground transition hover:bg-muted"><X className="h-4 w-4" /></button>
                </div>
                {(() => {
                  const real = realBookFor(chooser);
                  const locked = chooser.kind === "family" ? !access : !real?.unlocked;
                  if (!locked) {
                    return (
                      <div className="mt-4 grid grid-cols-2 gap-2.5">
                        <button onClick={() => readOnline(chooser)}
                          className="flex flex-col items-center gap-1.5 rounded-2xl bg-primary px-3 py-4 font-bold text-primary-foreground shadow-md transition hover:opacity-90">
                          <BookOpen className="h-6 w-6" />
                          <span className="text-sm">Read online</span>
                        </button>
                        <button onClick={() => printBook(chooser)} disabled={familyPdfBusy}
                          className="flex flex-col items-center gap-1.5 rounded-2xl border-2 border-border bg-white px-3 py-4 font-bold text-foreground transition hover:border-foreground/30 disabled:opacity-50">
                          {familyPdfBusy ? <Loader2 className="h-6 w-6 animate-spin" /> : <Printer className="h-6 w-6" />}
                          <span className="text-sm">Print at home</span>
                        </button>
                      </div>
                    );
                  }
                  // Honest locked state — never a silent no-op. Library
                  // books that are simply above the free sample get the
                  // pricing link; family-made books get the £10 message.
                  return (
                    <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-center">
                      <Lock className="mx-auto h-5 w-5 text-amber-500" />
                      {!user ? (
                        <>
                          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to read this book.</p>
                          <Link
                            to={`/auth?redirect=${encodeURIComponent("/world-of-books")}`}
                            className="mt-3 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                          >
                            Sign in
                          </Link>
                        </>
                      ) : chooser.kind === "library" ? (
                        <>
                          <p className="mt-1.5 text-sm text-muted-foreground">
                            This book is free to read in the library.
                          </p>
                          <Link to="/library"
                            className="mt-3 inline-block rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800">
                            Open the library
                          </Link>
                        </>
                      ) : (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                          Family-made books unlock with World of Books access.
                        </p>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>, document.body)}

        {/* ---------------------------------------------- wall of love --- */}
        {quotes && quotes.length > 0 && (
          <div className="mt-14">
            <div className="text-center">
              <h2 className="inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight text-foreground">
                <Heart className="h-6 w-6 fill-primary text-primary" /> Wall of Love
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">Real words from real families.</p>
            </div>
            <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
              {quotes.map((t, i) => {
                const accent = ACCENTS[i % ACCENTS.length];
                return (
                  <motion.figure
                    key={t.id}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-30px" }}
                    transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                    className="mb-4 break-inside-avoid rounded-3xl bg-white p-5"
                    style={{ boxShadow: STICKER, border: "1px solid rgba(40,30,40,0.05)", rotate: `${TILTS[i % TILTS.length]}deg` }}
                  >
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className={`h-4 w-4 ${(t.rating ?? 5) >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"}`} />
                      ))}
                    </div>
                    <blockquote className="mt-3 text-[15px] leading-relaxed text-foreground">“{t.quote}”</blockquote>
                    <figcaption className="mt-4 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                        style={{ background: accent }}>
                        {(t.first_name?.[0] ?? "❤").toUpperCase()}
                      </span>
                      <span className="font-display text-sm font-extrabold text-foreground">{t.first_name ?? "A parent"}</span>
                    </figcaption>
                  </motion.figure>
                );
              })}
            </div>
            <div className="mt-4 text-center">
              <Link to="/love" className="text-sm font-semibold text-primary-ink underline-offset-4 hover:underline">
                Read the whole wall →
              </Link>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------- cta --- */}
        <div className="mt-14 rounded-3xl border border-dashed border-primary/30 bg-white/70 p-8 text-center">
          <Sparkles className="mx-auto mb-2 h-7 w-7 text-primary" />
          <div className="font-display text-lg font-extrabold text-foreground">The next flag on this globe could be yours</div>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Make a real decodable book starring your child — their name, their home, their story.
          </p>
          <Link to="/create-book"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:opacity-90">
            <Sparkles className="h-4 w-4" /> Create their book — £4.99
          </Link>
        </div>
      </div>

      {reading?.pages && <CustomBookReader pages={reading.pages} onClose={() => setReading(null)} />}

      {/* Library reader — IN PLACE, no navigation. Portalled the same way as
          the chooser: this whole tree sits under Layout's route-transition
          transform, which breaks position:fixed. */}
      {readingBook && createPortal(
        <Suspense fallback={<div className="fixed inset-0 z-[9999] bg-slate-900" />}>
          {hasInteractiveData(readingBook.subLevel) ? (
            <InteractiveBookReader
              book={readingBook}
              onClose={() => setReadingLibraryId(null)}
              onFinish={() => setReadingLibraryId(null)}
            />
          ) : (
            <BookReader
              book={readingBook}
              onClose={() => setReadingLibraryId(null)}
              onFinish={() => setReadingLibraryId(null)}
            />
          )}
        </Suspense>,
        document.body,
      )}

      {downloadLibraryBook && (
        <DownloadFormatDialog
          book={downloadLibraryBook}
          onClose={() => setDownloadLibraryBook(null)}
          onDownload={(format) => performLibraryDownload(downloadLibraryBook, format)}
        />
      )}
    </Layout>
  );
}
