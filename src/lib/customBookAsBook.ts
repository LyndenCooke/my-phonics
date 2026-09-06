import type { Book } from "@/lib/types";
import type { CustomBook } from "@/lib/forgeApi";

/**
 * Dress a family-made Create-A-Book row as the library's `Book` shape so the
 * InteractiveBookReader can drive it. The id is prefixed `local-` on purpose:
 * useUpdateReadingProgress skips those, so a custom book never tries to write
 * a reading-progress row against a library book id.
 */
export function customBookAsBook(b: CustomBook): Book {
  return {
    id: `local-custom-${b.id}`,
    level: Number(b.level) || 1,
    subLevel: `custom-${b.id}`,
    title: b.title || "My Book",
    slug: `custom-${b.id}`,
    focusSounds: b.focus_sound ? [b.focus_sound] : [],
    trickyWords: [],
    storyWords: [],
    coverImageUrl: b.pages?.[0]?.imageUrl,
    pageCount: b.interactive?.length ?? b.pages?.length ?? 0,
    sortOrder: 0,
    unlocked: true,
    completed: false,
    lastPageRead: 0,
    pages: [],
  };
}
