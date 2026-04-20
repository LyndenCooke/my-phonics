/**
 * Lightweight check for whether a book has interactive data without
 * importing the ~400kB interactiveBookData.ts module. Kept as a simple
 * Set so Index, BookCard, and other places can gate on it cheaply.
 *
 * Keep this list in sync with INTERACTIVE_BOOKS in interactiveBookData.ts.
 */
export const INTERACTIVE_SUB_LEVELS: ReadonlySet<string> = new Set([
  'L1.1', 'L1.2', 'L1.3', 'L1.4', 'L1.5',
  'L1.6', 'L1.7', 'L1.8', 'L1.9', 'L1.10',
  'L2.1', 'L2.2', 'L2.3', 'L2.4', 'L2.5', 'L2.6',
  'L3.1', 'L3.2', 'L3.3', 'L3.4', 'L3.5',
  'L4.1', 'L4.2', 'L4.3', 'L4.4',
  'L5.1', 'L5.2', 'L5.3', 'L5.4',
  'L6.1', 'L6.2', 'L6.3', 'L6.4',
]);

export function hasInteractiveData(subLevel: string): boolean {
  return INTERACTIVE_SUB_LEVELS.has(subLevel);
}
