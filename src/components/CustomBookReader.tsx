import { useCallback, useEffect, useRef, useState } from "react";
import { X, Heart, Volume2, Loader2 } from "lucide-react";
import type { CustomBookPage } from "@/lib/forgeApi";
import FlipBook from "@/components/FlipBook";

/**
 * Full-screen reader for custom (family-made) books. Pages turn like a real
 * book (see FlipBook): cover → story pages (image + big decodable text) →
 * "Meet the star" profile page at the back. The profile always shows the
 * cartoon hero, never a real photo.
 *
 * Sound: tap any word to hear it, "Read to me" reads the page, and the
 * focus-sound chip on the cover plays the pure phoneme from the same sound
 * bank the library uses. Word and sentence recordings are made once per book
 * when it is assembled (server/forge/audio.mjs) and stored with its images,
 * so playing them costs nothing. A book made before narration existed simply
 * shows no sound controls.
 *
 * Page content sizes itself off the page width (container query units) so the
 * same markup reads correctly at any book size.
 */
export default function CustomBookReader({
  pages,
  onClose,
}: {
  pages: CustomBookPage[];
  onClose: () => void;
}) {
  const colour = pages[0]?.levelColour || "#3B82F6";
  const narrated = pages.some((p) => p.audio?.sentence || Object.keys(p.audio?.words || {}).length);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: colour }}>
        <span className="min-w-0 truncate font-bold text-white">{pages[0]?.title || "My Book"}</span>
        <div className="flex shrink-0 items-center gap-3">
          {narrated && <span className="hidden text-[11px] text-white/80 sm:inline">Tap a word to hear it · voice is AI-generated</span>}
          <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/20 p-1.5 text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <FlipBook
          pages={pages.map((page, i) => (
            <CustomBookPageView key={i} page={page} colour={colour} />
          ))}
          pageWidth={420}
          fitHeight
          showCounter
        />
      </div>
    </div>
  );
}

// One shared player so a second tap never plays over the first.
let current: HTMLAudioElement | null = null;
function playUrl(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (current) { current.pause(); current = null; }
    const a = new Audio(url);
    current = a;
    a.onended = () => { if (current === a) current = null; resolve(); };
    a.onerror = () => { if (current === a) current = null; reject(new Error(`could not play ${url}`)); };
    a.play().catch(reject);
  });
}

// FlipBook turns a page on any tap inside it, so every control on a page
// must keep its pointer events to itself.
const keep = {
  onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
  onPointerUp: (e: React.PointerEvent) => e.stopPropagation(),
};

function usePlayer() {
  const [playing, setPlaying] = useState<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);
  const play = useCallback(async (id: string, url: string) => {
    setPlaying(id);
    try { await playUrl(url); } catch { /* missing file: stay silent */ }
    if (alive.current) setPlaying(null);
  }, []);
  return { playing, play };
}

/** The phoneme file for a grapheme, same convention as PhonemePlayer. */
function phonemeUrl(grapheme: string): string {
  return `/sounds/${grapheme.toLowerCase().trim().replace(/^-/, "").replace(/-/g, "_")}.mp3`;
}

function wordKey(token: string): string {
  return token.replace(/[^A-Za-z']/g, "").replace(/^'+|'+$/g, "").toLowerCase();
}

/**
 * One page of a family-made book, sized off its container. Exported so the
 * share page (/story/:id) renders the exact pages the family saw — same
 * markup, same fonts, no second reader to drift.
 */
export function CustomBookPageView({ page, colour }: { page: CustomBookPage; colour: string }) {
  const { playing, play } = usePlayer();
  const words = page.audio?.words || {};

  return (
    <div className="h-full w-full bg-white" style={{ containerType: "inline-size" }}>
      {page.type === "cover" && (
        <div className="flex h-full w-full flex-col">
          <div
            className="flex items-center justify-center gap-[2cqw] px-[6cqw] py-[3cqw] text-center text-[3.4cqw] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: colour }}
          >
            <span>{page.levelName} · Sound "{page.focusSound}"</span>
            {page.focusSound && (
              <button
                {...keep}
                onClick={() => play("phoneme", phonemeUrl(page.focusSound!))}
                aria-label={`Hear the sound ${page.focusSound}`}
                title={`Hear "${page.focusSound}"`}
                className="rounded-full bg-white/25 p-[1cqw] transition hover:bg-white/40"
              >
                {playing === "phoneme" ? <Loader2 className="h-[3.6cqw] w-[3.6cqw] animate-spin" /> : <Volume2 className="h-[3.6cqw] w-[3.6cqw]" />}
              </button>
            )}
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-[5cqw]">
            {page.imageUrl && (
              <img src={page.imageUrl} alt="Cover" draggable={false} className="max-h-full w-full object-contain" />
            )}
          </div>
          <div className="px-[6cqw] py-[5cqw] text-center text-white" style={{ backgroundColor: colour }}>
            <h1 className="text-[7cqw] font-extrabold leading-tight">{page.title}</h1>
          </div>
        </div>
      )}

      {/* Story pages keep the printed order: sentence on top, picture below. */}
      {page.type === "story" && (
        <div className="flex h-full w-full flex-col gap-[3cqw] p-[6cqw]">
          <p
            className="text-[6cqw] font-semibold leading-snug text-slate-800"
            style={{ fontFamily: "'Andika', 'Comic Sans MS', sans-serif" }}
          >
            {(page.text || "").split(/(\s+)/).map((tok, i) => {
              if (/^\s*$/.test(tok)) return tok;
              const key = wordKey(tok);
              const url = words[key];
              if (!url) return <span key={i}>{tok}</span>;
              const on = playing === `w${i}`;
              return (
                <button
                  key={i}
                  {...keep}
                  onClick={() => play(`w${i}`, url)}
                  className="rounded-[1cqw] px-[0.4cqw] transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2"
                  style={{ backgroundColor: on ? "#fde68a" : undefined, color: on ? "#7c2d12" : undefined, font: "inherit" }}
                  aria-label={`Hear "${tok}"`}
                >
                  {tok}
                </button>
              );
            })}
          </p>
          {page.audio?.sentence && (
            <button
              {...keep}
              onClick={() => play("sentence", page.audio!.sentence!)}
              className="flex w-fit items-center gap-[1.5cqw] rounded-full px-[3.5cqw] py-[1.5cqw] text-[3.2cqw] font-bold text-white shadow-sm"
              style={{ backgroundColor: colour }}
            >
              {playing === "sentence" ? <Loader2 className="h-[3.4cqw] w-[3.4cqw] animate-spin" /> : <Volume2 className="h-[3.4cqw] w-[3.4cqw]" />}
              Read to me
            </button>
          )}
          {page.imageUrl && (
            <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden">
              <img src={page.imageUrl} alt="" draggable={false} className="max-h-full max-w-full rounded-[2cqw] object-contain" />
            </div>
          )}
        </div>
      )}

      {page.type === "profile" && (
        <div className="flex h-full w-full flex-col items-center gap-[2.5cqw] p-[6cqw] text-center">
          <div className="flex items-center gap-[1.5cqw] text-[4cqw] font-bold" style={{ color: colour }}>
            <Heart className="h-[4cqw] w-[4cqw] fill-current" /> Meet the star of this book
          </div>
          {page.heroUrl && (
            <img
              src={page.heroUrl}
              alt={page.name || "Hero"}
              draggable={false}
              className="h-[38cqw] w-[30cqw] rounded-[3cqw] object-cover shadow-lg"
            />
          )}
          <h2 className="text-[6cqw] font-extrabold text-slate-800">
            {page.name}
            {page.age ? `, age ${page.age}` : ""} {page.countryFlag}
          </h2>
          <div className="space-y-[1.5cqw] text-[3.6cqw] text-slate-600">
            {page.country && (<p><span className="font-semibold">From:</span> {page.country}</p>)}
            {page.likes && (<p><span className="font-semibold">Loves:</span> {page.likes}</p>)}
            {page.culture && (<p><span className="font-semibold">Our world:</span> {page.culture}</p>)}
            {page.faith && (<p><span className="font-semibold">Our faith:</span> {page.faith}</p>)}
          </div>
          <p className="mt-auto text-[3cqw] text-slate-400">
            Every MyPhonicsBooks story is a window into a family's world. Thank you for sharing yours. 🌍
          </p>
        </div>
      )}
    </div>
  );
}
