import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, Globe2, Heart, Loader2, Lock, Sparkles } from "lucide-react";
import { forgeApi, type CustomBook, type CustomBookPage } from "@/lib/forgeApi";
import CustomBookReader from "@/components/CustomBookReader";
import WorldGlobe, { type GlobePin } from "@/components/WorldGlobe";
// Level colours come from the ledger (src/lib/levels8.ts), never hand-copied
// hexes — the chips must match the banner colour on the books themselves.
import { getJourneyLevel } from "@/lib/levels8";

/**
 * World of Books — the community gallery of admin-approved, family-made
 * custom books, plus the Wall of Love (opted-in "Meet the star" profiles).
 * Reading the books requires the £10 lifetime unlock.
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

  // One pin per country, sized by how many books came from there.
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
      const { url } = await forgeApi.checkout({ kind: "world", email: email || undefined });
      window.location.href = url;
    } catch {
      setBusy(false);
    }
  };

  // Localhost test mode: unlock without paying. Defaults + persists a test
  // email so the access check matches on later visits too.
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-rose-50 pb-24">
      <div className="mx-auto max-w-4xl px-4 pt-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500 shadow-lg">
            <Globe2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900">The World of Books</h1>
          <p className="mx-auto mt-2 max-w-lg text-slate-600">
            Real phonics books made by real families around the world — every one starring their own
            child, their own culture, their own story.
          </p>
          <Link to="/create-book"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md">
            <Sparkles className="h-4 w-4" /> Make your own — £3
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
        ) : (
          <>
            {!access && books.length > 0 && (
              <div className="mb-6 flex flex-col items-center gap-3 rounded-3xl border-2 border-amber-200 bg-amber-50 p-5 text-center">
                <div className="flex items-center gap-2 font-extrabold text-slate-900">
                  <Lock className="h-5 w-5 text-amber-500" /> Unlock every family's book
                </div>
                <p className="max-w-md text-sm text-slate-600">
                  £10 once — read all {books.length} book{books.length === 1 ? "" : "s"} and every book families make after you, forever.
                </p>
                <button onClick={unlockFree} disabled={busy}
                  className="rounded-full bg-green-500 px-8 py-2.5 font-bold text-white hover:bg-green-600 disabled:opacity-50">
                  {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "🧪 Unlock free (test mode)"}
                </button>
                <button onClick={unlock} disabled={busy}
                  className="rounded-full border border-dashed border-amber-300 px-6 py-1.5 text-xs text-amber-600 disabled:opacity-50">
                  Real payment: £10 via Stripe (LIVE — actually charges)
                </button>
              </div>
            )}

            {books.length === 0 && (
              <div className="rounded-3xl bg-white p-10 text-center text-slate-500 shadow-sm">
                <BookHeart className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                No books in the world yet — be the first family on the map! 🌍
              </div>
            )}

            {books.length > 0 && (
              <>
                {/* View switch. Both views filter the same grid below rather
                    than replacing it, so a tap on a pin or a level chip reads
                    as "narrowing the shelf", not as navigating away. */}
                <div className="mb-5 flex justify-center">
                  <div className="inline-flex rounded-full bg-slate-200/70 p-1">
                    {([["globe", "🌍 Globe"], ["levels", "📚 Levels"]] as const).map(([v, label]) => (
                      <button key={v} onClick={() => setView(v)}
                        className={`rounded-full px-5 py-1.5 text-sm font-bold transition ${
                          view === v ? "bg-white text-slate-900 shadow" : "text-slate-500 hover:text-slate-700"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {view === "globe" && (
                  <div className="mb-6">
                    <WorldGlobe pins={globePins} selected={country} onSelect={setCountry} />
                  </div>
                )}

                {view === "levels" && (
                  <div className="mb-6 flex flex-wrap justify-center gap-2">
                    <button onClick={() => setLevelFilter(null)}
                      className={`rounded-full px-4 py-1.5 text-sm font-bold ${
                        levelFilter === null ? "bg-slate-900 text-white" : "bg-white text-slate-600 shadow-sm"}`}>
                      All levels
                    </button>
                    {levelCounts.map(({ level, colour, count }) => (
                      <button key={level} onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                        style={levelFilter === level ? { backgroundColor: colour } : { color: colour }}
                        className={`rounded-full px-4 py-1.5 text-sm font-bold shadow-sm ${
                          levelFilter === level ? "text-white" : "bg-white"}`}>
                        Level {level} · {count}
                      </button>
                    ))}
                  </div>
                )}

                {(country || levelFilter !== null) && (
                  <div className="mb-4 flex items-center justify-center gap-2 text-sm text-slate-500">
                    <span>
                      Showing {visibleBooks.length} book{visibleBooks.length === 1 ? "" : "s"}
                      {country ? ` from ${country}` : ""}
                      {levelFilter !== null ? ` at Level ${levelFilter}` : ""}
                    </span>
                    <button onClick={() => { setCountry(null); setLevelFilter(null); }}
                      className="rounded-full bg-slate-200 px-3 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-300">
                      Clear
                    </button>
                  </div>
                )}
              </>
            )}

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {visibleBooks.map((b, idx) => {
                const cover = b.pages?.[0]?.imageUrl || b.cover;
                return (
                  <motion.button
                    key={b.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={async () => {
                      if (!access || !b.pages) return;
                      // Open the full typeset phonics book PDF (book_v2
                      // template) — the interactive reader stays for later.
                      setPdfBusyId(b.id);
                      try {
                        const { url } = await forgeApi.pdf(b.id);
                        window.open(url, "_blank");
                      } catch {
                        setReading(b); // PDF unavailable → fall back to reader
                      } finally {
                        setPdfBusyId(null);
                      }
                    }}
                    className="group relative overflow-hidden rounded-2xl bg-white text-left shadow-sm transition hover:shadow-lg"
                  >
                    {cover ? (
                      <img src={cover} alt="" className={`aspect-[3/4] w-full object-cover ${access ? "" : "blur-[2px] brightness-90"}`} />
                    ) : (
                      <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-100">
                        <BookHeart className="h-8 w-8 text-slate-300" />
                      </div>
                    )}
                    {!access && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-7 w-7 text-white drop-shadow" />
                      </div>
                    )}
                    {pdfBusyId === b.id && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                      </div>
                    )}
                    <div className="p-2.5">
                      <div className="truncate text-sm font-bold text-slate-800">{b.title || "Untitled"}</div>
                      <div className="text-xs text-slate-500">
                        {b.country_flag} {b.child_name} · L{b.level} · "{b.focus_sound}"
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {wall.length > 0 && (
              <div className="mt-12">
                <h2 className="flex items-center justify-center gap-2 text-center text-2xl font-extrabold text-slate-900">
                  <Heart className="h-6 w-6 fill-rose-500 text-rose-500" /> Wall of Love
                </h2>
                <p className="mt-1 text-center text-sm text-slate-500">The stars behind the stories.</p>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {wall.map((p, idx) => (
                    <motion.div key={`${p.name}-${idx}`} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className="rounded-2xl bg-white p-4 text-center shadow-sm">
                      {p.heroUrl && <img src={p.heroUrl} alt="" className="mx-auto h-28 w-24 rounded-xl object-cover" />}
                      <div className="mt-2 font-extrabold text-slate-800">
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
