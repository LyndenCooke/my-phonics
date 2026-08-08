import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BookHeart, BookOpen, Globe2, Heart, Layers, Loader2, Lock, Sparkles } from "lucide-react";
import { forgeApi, type CustomBook, type CustomBookPage } from "@/lib/forgeApi";
import CustomBookReader from "@/components/CustomBookReader";
import WorldGlobe, { type GlobePin } from "@/components/WorldGlobe";
// Level colours come from the ledger (src/lib/levels8.ts), never hand-copied
// hexes — the chips must match the banner colour on the books themselves.
import { getJourneyLevel } from "@/lib/levels8";
import { LIBRARY_WORLD, libraryCoverUrl, libraryJourneyLevel } from "@/lib/libraryWorld";

/**
 * The World of Books — every story's place on the planet.
 *
 * Two kinds of book share one globe and one shelf:
 *   · the PRINTED LIBRARY (src/lib/libraryWorld.ts) — Lynden's 33 books, each
 *     pinned to the country its story lives in (the early levels are mostly
 *     UK; the later fleet is the open-window-on-the-world strand), and
 *   · FAMILY-MADE books from Create-A-Book, admin-approved before they appear.
 *
 * Styled to the site's own warm daylight look — cream paper, sky pastels,
 * brand pink accents (Lynden 2026-08-08: the night-sky version "looks off").
 * Motion stays: stagger-reveals, hover lifts, one shine sweep. Nothing dark,
 * nothing that reads as a different website.
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
  custom?: CustomBook; // family books keep their row for the reader/PDF
  href?: string;       // library books link into the library
}

export default function WorldOfBooks() {
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState(false);
  const [books, setBooks] = useState<CustomBook[]>([]);
  const [wall, setWall] = useState<CustomBookPage[]>([]);
  const [reading, setReading] = useState<CustomBook | null>(null);
  const [busy, setBusy] = useState(false);
  const [pdfBusyId, setPdfBusyId] = useState<string | null>(null);
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

  // One shelf: the printed library first (it IS the world today), then the
  // family-made books as they earn their place.
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
      href: `/library?book=${b.slug}`,
    })),
    ...books.map((b): ShelfBook => ({
      key: `fam-${b.id}`,
      kind: "family",
      title: b.title || "Untitled",
      level: b.level,
      country: b.country || null,
      flag: b.country_flag || "🌍",
      cover: b.pages?.[0]?.imageUrl || b.cover || null,
      subtitle: `${b.child_name}'s own book · "${b.focus_sound}"`,
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

  const levelCounts = useMemo(() => {
    const by = new Map<number, number>();
    for (const b of shelf) by.set(b.level, (by.get(b.level) || 0) + 1);
    return [...by.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([level, count]) => ({ level, count, colour: getJourneyLevel(level)?.hex || "#64748b" }));
  }, [shelf]);

  const visibleBooks = useMemo(
    () => shelf.filter((b) =>
      (!country || b.country === country) &&
      (levelFilter === null || b.level === levelFilter)),
    [shelf, country, levelFilter],
  );

  const familyCount = books.length;

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

  const openFamilyBook = async (b: CustomBook) => {
    if (!access || !b.pages) return;
    setPdfBusyId(b.id);
    try {
      const { url } = await forgeApi.pdf(b.id);
      window.open(url, "_blank");
    } catch {
      setReading(b);
    } finally {
      setPdfBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-[#FDF8F7] to-[#FDF8F7] pb-24 [font-family:Outfit,system-ui,sans-serif]">
      {/* ------------------------------------------------ daylight hero --- */}
      <div className="relative overflow-hidden pt-12">
        {/* soft brand-colour fields, faint enough to stay paper */}
        <div aria-hidden className="pointer-events-none absolute -left-40 -top-24 h-[26rem] w-[26rem] rounded-full opacity-[0.10] blur-3xl"
          style={{ background: "radial-gradient(circle, #E84B8A, transparent 65%)" }} />
        <div aria-hidden className="pointer-events-none absolute -right-40 top-16 h-[24rem] w-[24rem] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "radial-gradient(circle, #38bdf8, transparent 65%)" }} />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-sky-600 shadow-sm">
              <Globe2 className="h-3.5 w-3.5" /> Every story lives somewhere
            </div>
            <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.05] tracking-tight text-slate-900 sm:text-5xl">
              The World{" "}
              <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
                of Books
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-slate-500">
              Every pin is a real book and the place its story calls home — our own library from
              Britain to the Blue Mountains, plus books made by families like yours.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/create-book"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:shadow-xl"
              >
                <Sparkles className="h-4 w-4 transition group-hover:rotate-12" /> Put your child on the map — £3
              </Link>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-8 w-8 animate-spin text-sky-300" /></div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.6 }} className="mt-8">
              <div className="mb-5 flex justify-center">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                  {([["globe", Globe2, "Globe"], ["levels", Layers, "Levels"]] as const).map(([v, Icon, label]) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-5 py-1.5 text-sm font-bold transition ${
                        view === v ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:text-slate-800"
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
                        ? "bg-slate-900 text-white shadow-md"
                        : "border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-slate-300"
                    }`}
                  >
                    All levels
                  </button>
                  {levelCounts.map(({ level, colour, count }) => (
                    <button
                      key={level}
                      onClick={() => setLevelFilter(levelFilter === level ? null : level)}
                      style={levelFilter === level
                        ? { backgroundColor: colour, boxShadow: `0 6px 18px ${colour}55` }
                        : { borderColor: `${colour}66`, color: colour }}
                      className={`rounded-full border px-5 py-2 text-sm font-bold transition ${
                        levelFilter === level ? "border-transparent text-white" : "bg-white shadow-sm hover:shadow"
                      }`}
                    >
                      Level {level} <span className="opacity-60">· {count}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- shelf --- */}
      <div className="relative mx-auto mt-8 max-w-5xl px-4">
        {!loading && (
          <>
            {!access && familyCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 flex flex-col items-center gap-3 rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-center shadow-sm"
              >
                <div className="flex items-center gap-2 text-lg font-black text-slate-900">
                  <Lock className="h-5 w-5 text-amber-500" /> Unlock the family-made books
                </div>
                <p className="max-w-md text-sm leading-relaxed text-slate-600">
                  £10, once — read all {familyCount} famil{familyCount === 1 ? "y" : "ies"}' book{familyCount === 1 ? "" : "s"} and
                  every one made after you, forever. The library books are part of your MyPhonicsBooks membership as usual.
                </p>
                <button
                  onClick={unlock}
                  disabled={busy}
                  className="rounded-full bg-slate-900 px-8 py-2.5 font-bold text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : "Unlock — £10, once"}
                </button>
                {import.meta.env.DEV && (
                  <button onClick={unlockFree} disabled={busy} className="text-xs text-slate-400 underline-offset-2 hover:underline">
                    🧪 dev: unlock free
                  </button>
                )}
              </motion.div>
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
                const lvlColour = getJourneyLevel(b.level)?.hex || "#64748b";
                const locked = b.kind === "family" && !access;
                const card = (
                  <>
                    <div className="relative overflow-hidden">
                      {b.cover ? (
                        <img
                          src={b.cover}
                          alt=""
                          loading="lazy"
                          className={`aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-[1.04] ${locked ? "blur-[3px] brightness-90" : ""}`}
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center bg-slate-100">
                          <BookHeart className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      <div className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      <div
                        className="absolute left-2.5 top-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-black text-white shadow"
                        style={{ backgroundColor: lvlColour }}
                      >
                        L{b.level}
                      </div>
                      {b.kind === "family" && (
                        <div className="absolute right-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-violet-600 shadow-sm">
                          <Heart className="mr-0.5 inline h-2.5 w-2.5 fill-violet-500 text-violet-500" /> family-made
                        </div>
                      )}
                      {locked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="rounded-full bg-slate-900/50 p-2.5 backdrop-blur-sm"><Lock className="h-5 w-5 text-white" /></div>
                        </div>
                      )}
                      {b.custom && pdfBusyId === b.custom.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                          <Loader2 className="h-7 w-7 animate-spin text-violet-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-3 text-left">
                      <div className="truncate text-sm font-extrabold text-slate-900">{b.title}</div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">{b.flag} {b.subtitle}</div>
                    </div>
                  </>
                );
                const shellClass =
                  "group relative block overflow-hidden rounded-2xl bg-white text-left shadow-md shadow-slate-200/70 ring-1 ring-slate-900/5 transition-shadow hover:shadow-xl hover:shadow-slate-300/70";
                return (
                  <motion.div
                    key={b.key}
                    initial={{ opacity: 0, y: 22, rotate: idx % 2 ? 1 : -1 }}
                    whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: (idx % 4) * 0.05, duration: 0.45, ease: "easeOut" }}
                    whileHover={{ y: -7 }}
                  >
                    {b.kind === "library" ? (
                      <Link to={b.href!} className={shellClass}>{card}</Link>
                    ) : (
                      <button onClick={() => openFamilyBook(b.custom!)} className={`${shellClass} w-full`}>{card}</button>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {familyCount === 0 && (
              <div className="mt-10 rounded-3xl border border-dashed border-violet-200 bg-white/70 p-8 text-center">
                <BookOpen className="mx-auto mb-2 h-8 w-8 text-violet-300" />
                <div className="font-bold text-slate-700">The next book on this globe could be your child's</div>
                <p className="mt-1 text-sm text-slate-500">
                  Families' books appear here once our team has read and approved them.
                </p>
                <Link to="/create-book" className="mt-4 inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-violet-700">
                  <Sparkles className="h-4 w-4" /> Create their book — £3
                </Link>
              </div>
            )}

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
