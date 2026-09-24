import { X, Heart } from "lucide-react";
import type { TFunction } from "i18next";
import type { CustomBookPage } from "@/lib/forgeApi";
import FlipBook from "@/components/FlipBook";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

/** A translated UI line inside the English LTR island. */
const ui = () => ({ dir: "auto" as const, lang: i18n.language });
/** Keep an English fragment (level name, sound, hero name) in its own LTR run. */
const iso = (s: string | number) => `⁨${s}⁩`;

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
  const { t } = useTranslation("reader");
  const colour = pages[0]?.levelColour || "#3B82F6";

  return (
    // The family's book is English (title, story, back-page profile) and
    // reads left-to-right — an LTR island even on an RTL site.
    <div dir="ltr" lang="en" className="fixed inset-0 z-50 flex flex-col bg-slate-100">
      <div className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: colour }}>
        <span className="truncate font-bold text-white">{pages[0]?.title || <span {...ui()}>{t("custom.myBook")}</span>}</span>
        <button onClick={onClose} aria-label={t("closeBook")} className="rounded-full bg-white/20 p-1.5 text-white">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="min-h-0 flex-1 p-4">
        <FlipBook
          pages={pages.map((page, i) => (
            <Page key={i} page={page} colour={colour} t={t} />
          ))}
          pageWidth={420}
          fitHeight
          showCounter
        />
      </div>
    </div>
  );
}

function Page({ page, colour, t }: { page: CustomBookPage; colour: string; t: TFunction<"reader"> }) {
  return (
    <div className="h-full w-full bg-white" style={{ containerType: "inline-size" }}>
      {page.type === "cover" && (
        <div className="flex h-full w-full flex-col">
          <div
            {...ui()}
            className="px-[6cqw] py-[3cqw] text-center text-[3.4cqw] font-bold uppercase tracking-wider text-white"
            style={{ backgroundColor: colour }}
          >
            {t("custom.levelSound", { name: iso(page.levelName ?? ""), sound: iso(page.focusSound ?? "") })}
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden p-[5cqw]">
            {page.imageUrl && (
              <img src={page.imageUrl} alt={t("custom.coverAlt")} draggable={false} className="max-h-full w-full object-contain" />
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
            <Heart className="h-[4cqw] w-[4cqw] shrink-0 fill-current" /> <span {...ui()}>{t("custom.meetStar")}</span>
          </div>
          {page.heroUrl && (
            <img
              src={page.heroUrl}
              alt={page.name || t("custom.hero")}
              draggable={false}
              className="h-[38cqw] w-[30cqw] rounded-[3cqw] object-cover shadow-lg"
            />
          )}
          <h2 className="text-[6cqw] font-extrabold text-slate-800">
            {page.age
              ? <span {...ui()}>{t("custom.nameAge", { name: iso(page.name ?? ""), age: page.age })}</span>
              : page.name}
            {" "}{page.countryFlag}
          </h2>
          <div className="space-y-[1.5cqw] text-[3.6cqw] text-slate-600">
            {/* Labels translated; the parent's typed answers stay as typed. */}
            {page.country && (<p><span {...ui()} className="font-semibold">{t("custom.from")}</span> {page.country}</p>)}
            {page.likes && (<p><span {...ui()} className="font-semibold">{t("custom.loves")}</span> {page.likes}</p>)}
            {page.culture && (<p><span {...ui()} className="font-semibold">{t("custom.world")}</span> {page.culture}</p>)}
            {page.faith && (<p><span {...ui()} className="font-semibold">{t("custom.faith")}</span> {page.faith}</p>)}
          </div>
          <p {...ui()} className="mt-auto text-[3cqw] text-slate-400">
            {t("custom.thanks")} 🌍
          </p>
        </div>
      )}
    </div>
  );
}
