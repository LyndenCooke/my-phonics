/**
 * Resolves image paths for book covers and PDF pages.
 */

function parseLevelSub(subLevel: string): string | null {
  const match = subLevel.match(/^L(\d+)\.(\d+)$/);
  if (!match) return null;
  return `${match[1]}_${match[2]}`;
}

export function getCoverImageUrl(subLevel: string, existingUrl?: string): string | undefined {
  if (existingUrl) return existingUrl;
  const key = parseLevelSub(subLevel);
  if (!key) return undefined;
  return `/covers/${key}_cover.jpg`;
}

export function getBookPageUrl(subLevel: string, pageNumber: number): string | undefined {
  const key = parseLevelSub(subLevel);
  if (!key) return undefined;
  return `/book-pages/${key}/p${pageNumber}.jpg`;
}
