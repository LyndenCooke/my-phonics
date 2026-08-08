import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, BookHeart, Dices, Download, FileText, ImageUp, Loader2,
  Sparkles, Wand2, X,
} from "lucide-react";
import { getJourneyLevel } from "@/lib/levels8";

/**
 * Create-A-Worksheet — the worksheet machine (worksheet-forge) on the web.
 * Type what you want ("a handwriting sheet for sh", "level 4 spelling for ay")
 * and the forge plans a full A4 sheet from its 19 activity blocks, renders it
 * in Chromium and hands back a PNG preview + print-ready PDF.
 * Localhost workflow preview; API at /api/worksheet-forge (dev server only),
 * exactly like Create-A-Book's forge.
 */

interface Sheet {
  slug: string;
  title: string;
  subtitle: string | null;
  level: number;
  grapheme: string | null;
  blocks: string[];
  prompt: string;
  seed: number;
  overflow: number;
  trimmed: boolean;
  created: number;
  png: string;
  pdf: string;
}

const EXAMPLES = [
  "handwriting for the sound s",
  "a board game for sh",
  "a word search for ay",
  "crack the code for ee",
];

// Bobbing grapheme tiles for the hero — one per journey level, in that
// level's ledger colour, so the header shows the whole curriculum at a glance.
const HERO_TILES: Array<{ g: string; level: number }> = [
  { g: "s", level: 1 }, { g: "ck", level: 2 }, { g: "sh", level: 3 },
  { g: "ay", level: 4 }, { g: "igh", level: 5 }, { g: "ew", level: 6 },
  { g: "tion", level: 7 }, { g: "sion", level: 8 },
];

const api = {
  async health(): Promise<{ ok: boolean }> {
    const r = await fetch("/api/worksheet-forge/health");
    if (!r.ok) throw new Error("no forge");
    return r.json();
  },
  async recent(): Promise<{ sheets: Sheet[] }> {
    const r = await fetch("/api/worksheet-forge/recent");
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  },
  async generate(prompt: string, seed?: number): Promise<{ sheet: Sheet }> {
    const r = await fetch("/api/worksheet-forge/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(seed == null ? { prompt } : { prompt, seed }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "generation failed");
    return data;
  },
  async recreate(imageB64: string, mime: string): Promise<{ sheet: Sheet; detected: { summary?: string } }> {
    const r = await fetch("/api/worksheet-forge/recreate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_b64: imageB64, mime }),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "recreation failed");
    return data;
  },
};

function levelChip(level: number) {
  const l = getJourneyLevel(level);
  return (
    <span
      className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white"
      style={{ backgroundColor: l?.hex ?? "#3B82F6" }}
    >
      Level {level}{l ? ` · ${l.name}` : ""}
    </span>
  );
}

export default function CreateWorksheet() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [recent, setRecent] = useState<Sheet[]>([]);
  const [offline, setOffline] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.health()
      .then(() => api.recent())
      .then((r) => setRecent(r.sheets))
      .catch(() => setOffline(true));
  }, []);

  const generate = useCallback(async (p: string, seed?: number) => {
    const clean = p.trim();
    if (!clean || busy) return;
    setBusy(true);
    setError(null);
    try {
      const { sheet: s } = await api.generate(clean, seed);
      setSheet(s);
      setRecent((prev) => [s, ...prev.filter((x) => x.slug !== s.slug)].slice(0, 24));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [busy]);

  // Same prompt, fresh dice — the planner re-rolls words, layouts and titles.
  const reroll = useCallback(() => {
    if (sheet) generate(sheet.prompt);
    else if (prompt.trim()) generate(prompt);
  }, [sheet, prompt, generate]);

  // Upload any worksheet (photo/screenshot) → vision maps its activities onto
  // our blocks → the forge rebuilds it with our own decodable content.
  const recreate = useCallback(async (file: File) => {
    if (busy || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
        r.onerror = () => reject(new Error("Couldn't read that file."));
        r.readAsDataURL(file);
      });
      const { sheet: s } = await api.recreate(b64, file.type || "image/png");
      setSheet(s);
      setRecent((prev) => [s, ...prev.filter((x) => x.slug !== s.slug)].slice(0, 24));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }, [busy, uploading]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-amber-50 pb-24">
      <div className="mx-auto max-w-3xl px-4 pt-8">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/library" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
            <ArrowLeft className="h-4 w-4" /> Library
          </Link>
          <Link to="/create-book" className="flex items-center gap-1 text-sm font-semibold text-violet-600">
            <BookHeart className="h-4 w-4" /> Create a Book
          </Link>
        </div>

        <div className="text-center">
          <div className="flex items-end justify-center gap-2 sm:gap-3">
            {HERO_TILES.map((t, i) => {
              const l = getJourneyLevel(t.level);
              return (
                <motion.div
                  key={t.g}
                  animate={{ y: [0, -7, 0], rotate: i % 2 ? [-4, 3, -4] : [3, -4, 3] }}
                  transition={{ duration: 2.8 + i * 0.35, repeat: Infinity, ease: "easeInOut", delay: i * 0.2 }}
                  className={`h-12 w-12 items-center justify-center rounded-2xl border-b-4 bg-white font-extrabold shadow-md sm:h-14 sm:w-14 ${
                    t.g.length > 2 ? "text-sm sm:text-base" : "text-xl sm:text-2xl"
                  } ${i >= 6 ? "hidden sm:flex" : "flex"}`}
                  style={{ color: l?.inkHex, borderColor: l?.hex }}
                >
                  {t.g}
                </motion.div>
              );
            })}
          </div>
          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Make a worksheet{" "}
            <span className="bg-gradient-to-r from-sky-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
              in seconds
            </span>
          </h1>
          <p className="mx-auto mt-2 text-slate-500">Type what you need. Print it.</p>
          <div className="mx-auto mt-4 flex h-1.5 max-w-xs overflow-hidden rounded-full">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((l) => (
              <div key={l} className="flex-1" style={{ backgroundColor: getJourneyLevel(l)?.hex }} />
            ))}
          </div>
        </div>

        {offline && (
          <div className="mx-auto mt-6 max-w-lg rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
            The machine only runs on the local dev server — start it with <code>npm run dev</code>.
          </div>
        )}

        {error && (
          <div className="mt-6 flex items-start justify-between rounded-xl bg-red-50 p-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)}><X className="h-4 w-4" /></button>
          </div>
        )}

        <form
          className="mx-auto mt-8 max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            generate(prompt);
          }}
        >
          <div className="flex gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm focus-within:border-sky-400">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "a board game for sh"'
              className="min-w-0 flex-1 rounded-xl px-3 py-2 outline-none"
              disabled={busy || offline}
            />
            <button
              type="submit"
              disabled={busy || offline || !prompt.trim()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-sky-600 px-5 py-2 font-bold text-white shadow hover:bg-sky-700 disabled:opacity-40"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              {busy ? "Forging…" : "Make it"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                disabled={busy || offline}
                onClick={() => {
                  setPrompt(ex);
                  generate(ex);
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-sky-300 hover:text-sky-700 disabled:opacity-40"
              >
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-4 text-center">
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) recreate(f);
              }}
            />
            <button
              type="button"
              disabled={busy || uploading || offline}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-sky-600 disabled:opacity-40"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageUp className="h-4 w-4" />}
              {uploading ? "Recreating your worksheet…" : "or upload a worksheet — we'll remake it our way"}
            </button>
          </div>
        </form>

        <AnimatePresence>
          {busy && !sheet && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-8 text-center text-sm text-slate-500"
            >
              <Sparkles className="mr-1 inline h-4 w-4 text-sky-500" />
              Designing your sheet…
            </motion.p>
          )}
        </AnimatePresence>

        {sheet && (
          <motion.div
            key={sheet.slug}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="mx-auto mt-10 max-w-2xl"
          >
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-lg">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900">{sheet.title}</h2>
                  {sheet.subtitle && <p className="text-sm text-slate-500">{sheet.subtitle}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {levelChip(sheet.level)}
                  {sheet.grapheme && (
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                      {sheet.grapheme}
                    </span>
                  )}
                </div>
              </div>
              <a href={sheet.pdf} target="_blank" rel="noreferrer" title="Open the print-ready PDF">
                <img
                  src={sheet.png}
                  alt={`${sheet.title} — worksheet preview`}
                  className="w-full rounded-lg border border-slate-100"
                />
              </a>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={sheet.pdf}
                  download={`${sheet.slug}.pdf`}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-2.5 font-bold text-white shadow hover:bg-sky-700"
                >
                  <Download className="h-4 w-4" /> Download PDF
                </a>
                <button
                  onClick={reroll}
                  disabled={busy}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 font-semibold text-slate-700 hover:border-sky-300 disabled:opacity-40"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Dices className="h-4 w-4" />}
                  Another version
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {recent.length > 0 && (
          <div className="mx-auto mt-12 max-w-3xl">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-400">
              <FileText className="h-4 w-4" /> Recently forged
            </h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {recent.map((s) => (
                <button
                  key={s.slug}
                  onClick={() => setSheet(s)}
                  className={`group overflow-hidden rounded-xl border bg-white text-left shadow-sm transition hover:shadow-md ${
                    sheet?.slug === s.slug ? "border-sky-400 ring-2 ring-sky-200" : "border-slate-200"
                  }`}
                >
                  <img src={s.png} alt={s.title} loading="lazy" className="aspect-[210/297] w-full object-cover object-top" />
                  <div className="p-2">
                    <p className="truncate text-xs font-semibold text-slate-700">{s.title}</p>
                    <p className="text-[10px] text-slate-400">Level {s.level}{s.grapheme ? ` · ${s.grapheme}` : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
