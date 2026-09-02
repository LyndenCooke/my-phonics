import { X, Heart } from "lucide-react";
import type { CustomBookPage } from "@/lib/forgeApi";
import FlipBook from "@/components/FlipBook";

/**
 * Full-screen reader for custom (family-made) books. Pages turn like a real
 * book (see FlipBook): cover → story pages (image + big decodable text) →
 * "Meet the star" profile page at the back. The profile always shows the
 * cartoon hero, never a real photo.
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: colour }}>
        <span className="truncate font-bold text-white">{pages[0]?.title || "My Book"}</span>
        <button onClick={onClose} aria-label="Close" className="rounded-full bg-white/20 p-1.5 text-white">
          <X className="h-5 w-5" />
        </button>
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

/**
 * One page of a family-made book, sized off its container. Exported so the
 * share page (/story/:id) renders the exact pages the family saw — same
 * markup, same fonts, no second reader to drift.
 */
export function CustomBookPageView({ page, colour }: { page: CustomBookPage; colour: string }) {
  return (
    <div className="h-full w-full bg-white" style={{ containerType: "inline-size" }}>
      {page.type === "cover" && (
        <div className="flex h-full w-full flex-col">
          <div
            className="px-[6cqw] py-[3cqw] text-center text-[3.4cqw] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: colour }}
          >
            {page.levelName} · Sound "{page.focusSound}"
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
        <div className="flex h-full w-full flex-col gap-[4cqw] p-[6cqw]">
          <p
            className="text-[6cqw] font-semibold leading-snug text-slate-800"
            style={{ fontFamily: "'Andika', 'Comic Sans MS', sans-serif" }}
          >
            {page.text}
          </p>
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
