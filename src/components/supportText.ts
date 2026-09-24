/**
 * Translation keys (namespace `support`) for text that lives in the shared
 * src/lib/support.ts module, which stays English because Auth.tsx and
 * Profile also use it. Used by /support and the post-signup SupportPrompt.
 */

/** SUPPORT_AMOUNTS notes by amount in pence → `amounts.<key>`. */
export const SUPPORT_NOTE_KEYS: Record<number, string> = {
  300: 'coffee', 500: 'book', 1000: 'level', 2000: 'shelf',
};

/** Known English errors thrown by startSupportCheckout → translation keys. */
export const SUPPORT_ERROR_KEYS: Record<string, string> = {
  'Please sign in first.': 'errors.signInFirst',
  'Could not start checkout': 'errors.checkoutFailed',
};
