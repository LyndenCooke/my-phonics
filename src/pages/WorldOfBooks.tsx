import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, Globe2, Heart, Layers, Loader2, Lock, Sparkles } from "lucide-react";
import { forgeApi, type CustomBook, type CustomBookPage } from "@/lib/forgeApi";
import CustomBookReader from "@/components/CustomBookReader";
import WorldGlobe, { type GlobePin } from "@/components/WorldGlobe";
// Level colours come from the ledger (src/lib/levels8.ts), never hand-copied
// hexes — the chips must match the banner colour on the books themselves.
import { getJourneyLevel } from "@/lib/levels8";

/**
 * The World of Books — community gallery of admin-approved, family-made books.
 *
 * ART DIRECTION — "the night atelier" (write it down or drift into generic):
 * The page opens as a NIGHT SKY — deep ink-navy, aurora glows, a slowly
 * turning toy planet whose golden lights are real families' books — then
 * lands on a WARM PAPER shelf where the books themselves live. Cool and vast
 * above, warm and close below; the eye travels from wonder to touch.
 * Type is Outfit at heavy weights, tight leading, oversized. Motion is
 * everywhere but slow: stagger-reveals, hover lifts, one shine sweep.
 * Nothing bounces. Nothing strobes.
 */
export default function WorldOfBooks() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [books, setBooks] = useState<CustomBook[]>([]);
  const [wall, setWall] = useState<CustomBookPage[]>([]);
  const [reading, setReading] = useState<CustomBook | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
  // Two ways into the same shelf: "where in the world" and "what level".
  const [view, setView] = useState<"globe" | "levels">("globe");
  const [country, setCountry] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const email = localStorage.getItem("forge_email");

  const load = () => {
    forgeApi
      .world(email)
      .then((r) => { setAccess(r.access); setBooks(r.books); setWall(r.wall); })
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const globePins: GlobePin[] = useMemo(() => {
    const by = new Map<string, GlobePin>();
    for (const b of books) {
      const name = b.country?.trim();
      if (!name) continue;
      const cur = by.get(name);
      if (cur) cur.count += 1;
      else by.set(name, { country: name, flag: b.country_flag || "🌍", count: 1 });
    }
    return [...by.values()].sort((a, b) => b.count - a.count);
  }, [books]);

  const levelCounts = useMemo(() => {
    const by = new Map<number, number>();
    for (const b of books) by.set(b.level, (by.get(b.level) || 0) + 1);
    return [...by.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ level, count, colour: getJourneyLevel(level)?.hex || "#64748b" }));
  }, [books]);

  const visibleBooks = useMemo(
    () => books.filter((b) =>
      (!country || b.country === country) &&
      (levelFilter === null || b.level === levelFilter)),
    [books, country, levelFilter],
  );

  const unlock = async () => {
    setBusy(true);
    try {
      const r = await forgeApi.checkout({ kind: "world", email: email || undefined });
      if (r.url) window.location.href = r.url;
      else setBusy(false);
    } catch {
      setBusy(false);
    }
  };

  // Localhost test mode: unlock without paying (the API route 404s in prod,
  // so the button only renders in dev builds).
  const unlockFree = async () => {
    setBusy(true);
    try {
      const testEmail = email || "test@localhost";
      localStorage.setItem("forge_email", testEmail);
      await forgeApi.simulatePay({ kind: "world", email: testEmail });
      setAccess(true);
      forgeApi.world(testEmail).then((r) => { setBooks(r.books); setWall(r.wall); });
    } finally {
      setBusy(false);
    }
  };

  const openBook = async (b: CustomBook) => {
    if (!access || !b.pages) return;
    setPdfBusyId(b.id);
    try {
      const { url } = await forgeApi.pdf(b.id);
      window.open(url, "_blank");
    } catch {
      setReading(b); // PDF unavailable (prod) → the interactive reader
    } finally {
      setPdfBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f4ec] pb-24 [font-family:Outfit,system-ui,sans-serif]">
      {/* ---------------------------------------------------- night sky --- */}
      <div className="relative overflow-hidden bg-[#0a1631] pb-40 pt-14 text-white">
        {/* aurora — two soft colour fields drifting behind everything */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-[-8rem] h-[34rem] w-[34rem] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #7c3aed 0%, transparent 65%)" }}
          animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-24 h-[30rem] w-[30rem] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #0ea5e9 0%, transparent 65%)" }}
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 31, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200 backdrop-blur-sm">
              <Globe2 className="h-3.5 w-3.5" /> A planet of family stories
            </div>
            <h1 className="mx-auto max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              The World{" "}
              <span className="bg-gradient-to-r from-amber-300 via-rose-300 to-violet-300 bg-clip-text text-transparent">
                of Books
              </span>
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-indigo-100/80">
              Every light on this globe is a real book, made by a real family, starring their own
              child — their country, their culture, their story.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/create-book"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:shadow-xl hover:shadow-violet-800/50"
              >
                <Sparkles className="h-4 w-4 transition group-hover:rotate-12" /> Put your child on the map — £3
              </Link>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-indigo-300" /></div>
          ) : (
            <>
              {books.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25, duration: 0.7 }} className="mt-10">
                  {/* View switch — filters the shelf below, never navigates away */}
                  <div className="mb-6 flex justify-center">
                    <div className="inline-flex rounded-full border border-white/15 bg-white/10 p-1 backdrop-blur-sm">
                      {([["globe", Globe2, "Globe"], ["levels", Layers, "Levels"]] as const).map(([v, Icon, label]) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-bold transition ${
                            view === v ? "bg-white text-slate-900 shadow" : "text-indigo-200 hover:text-white"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {view === "globe" && <WorldGlobe pins={globePins} selected={country} onSelect={setCountry} />}

                  {view === "levels" && (
                    <div className="mx-auto flex max-w-2xl flex-wrap justify-center gap-2.5 py-6">
                      <button
                        onClick={() => setLevelFilter(null)}
                        className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                          levelFilter === null
                            ? "bg-white text-slate-900 shadow-lg"
                            : "border border-white/20 bg-white/10 text-indigo-100 backdrop-blur-sm hover:bg-white/20"
                        }`}
                      >
                        All levels
                      </button>
                      {levelCounts.map(({ level, colour, count }) => (
                        <button
                          key={level}
                          onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                          style={levelFilter === level ? { backgroundColor: colour, boxShadow: `0 8px 24px ${colour}66` } : { borderColor: `${colour}88`, color: "#fff" }}
                          className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                            levelFilter === level ? "text-white" : "border bg-white/10 backdrop-blur-sm hover:bg-white/20"
                          }`}
                        >
                          <span style={levelFilter === level ? undefined : { color: colour }}>●</span>{" "}
                          Level {level} <span className="opacity-70">· {count}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </>
          )}
        </div>

        {/* horizon — the night dissolves into the paper shelf */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-b from-transparent to-[#f8f4ec]" />
      </div>

      {/* --------------------------------------------------- paper shelf --- */}
      <div className="relative mx-auto -mt-16 max-w-5xl px-4">
        {!loading && (
          <>
            {!access && books.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 overflow-hidden rounded-3xl border border-amber-200/80 bg-white shadow-xl shadow-amber-100/60"
              >
                <div className="flex flex-col items-center gap-3 p-6 text-center sm:p-8">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                    <Lock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="text-xl font-black text-slate-900">Unlock every family's book</div>
                  <p className="max-w-md text-sm leading-relaxed text-slate-500">
                    £10, once. Read all {books.length} book{books.length === 1 ? "" : "s"} on the shelf today —
                    and every book families add after you, forever.
                  </p>
                  <button
                    onClick={unlock}
                    disabled={busy}
                    className="mt-1 rounded-full bg-slate-900 px-8 py-3 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                  >
                    {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Unlock the world — £10"}
                  </button>
                  {import.meta.env.DEV && (
                    <button onClick={unlockFree} disabled={busy} className="text-xs text-slate-400 underline-offset-2 hover:underline">
                      🧪 dev: unlock free
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {books.length === 0 && (
              <div className="rounded-3xl border border-slate-200/70 bg-white p-12 text-center shadow-sm">
                <BookHeart className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                <div className="text-lg font-bold text-slate-700">No books in the world yet</div>
                <p className="mt-1 text-sm text-slate-500">Be the first family on the map 🌍</p>
              </div>
            )}

            {(country || levelFilter !== null) && (
              <div className="mb-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                <span>
                  {visibleBooks.length} book{visibleBooks.length === 1 ? "" : "s"}
                  {country ? ` from ${country}` : ""}
                  {levelFilter !== null ? ` at Level ${levelFilter}` : ""}
                </span>
                <button
                  onClick={() => { setCountry(null); setLevelFilter(null); }}
                  className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-300"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4">
              {visibleBooks.map((b, idx) => {
                const cover = b.pages?.[0]?.imageUrl || b.cover;
                const lvlColour = getJourneyLevel(b.level)?.hex || "#64748b";
                return (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, y: 24, rotate: idx % 2 ? 1.2 : -1.2 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: (idx % 4) * 0.06, duration: 0.5, ease: "easeOut" }}
                    whileHover={{ y: -8, rotate: idx % 2 ? 0.6 : -0.6 }}
                    onClick={() => openBook(b)}
                    className="group relative overflow-hidden rounded-2xl bg-white text-left shadow-md shadow-slate-200/80 ring-1 ring-slate-900/5 transition-shadow hover:shadow-2xl hover:shadow-slate-300/80"
                  >
                    <div className="relative overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt=""
                          loading="lazy"
                          className={`aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04] ${access ? "" : "blur-[3px] brightness-90"}`}
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-100">
                          <BookHeart className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      {/* one shine sweep on hover — the "new book" glint */}
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <div
                        className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-black text-white shadow"
                        style={{ backgroundColor: lvlColour }}
                      >
                        L{b.level}
                      </div>
                      {!access && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-slate-900/50 p-2.5 backdrop-blur-sm"><Lock className="h-5 w-5 text-white" /></div>
                        </div>
                      )}
                      {pdfBusyId === b.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="truncate text-sm font-extrabold text-slate-900">{b.title || "Untitled"}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        {b.country_flag} {b.child_name} · learning "{b.focus_sound}"
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {wall.length > 0 && (
              <div className="mt-16">
                <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
                  <h2 className="inline-flex items-center gap-2.5 text-3xl font-black tracking-tight text-slate-900">
                    <Heart className="h-7 w-7 fill-rose-500 text-rose-500" /> Wall of Love
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">The stars behind the stories.</p>
                </motion.div>
                <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {wall.map((p, idx) => (
                    <motion.div
                      key={`${p.name}-${idx}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true, margin: "-30px" }}
                      transition={{ delay: (idx % 3) * 0.07 }}
                      whileHover={{ y: -4 }}
                      className="rounded-2xl bg-white p-4 text-center shadow-md shadow-slate-200/70 ring-1 ring-slate-900/5"
                    >
                      {p.heroUrl && <img src={p.heroUrl} alt="" loading="lazy" className="mx-auto h-28 w-24 rounded-xl object-cover" />}
                      <div className="mt-2.5 font-extrabold text-slate-900">
                        {p.name}{p.age ? `, ${p.age}` : ""} {p.countryFlag}
                      </div>
                      {p.country && <div className="text-xs text-slate-500">{p.country}</div>}
                      {p.likes && <div className="mt-1 text-xs text-slate-600">loves {p.likes}</div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {reading?.pages && <CustomBookReader pages={reading.pages} onClose={() => setReading(null)} />}
    </div>
  );
}
