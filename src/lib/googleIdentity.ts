/**
 * Google Identity Services (GIS) loader + nonce helpers.
 *
 * Why this exists: the old sign-in used supabase.auth.signInWithOAuth, which
 * bounces the parent through accounts.google.com and back via
 * <project>.supabase.co. Google's consent screen therefore says
 * "continue to jfbgdeyjngvzpfucwpuk.supabase.co", which looks like a
 * phishing page to a parent. With GIS the whole exchange happens on our
 * own origin: Google returns an ID token to the page, and we hand that
 * token to Supabase with signInWithIdToken. Supabase never appears in the
 * browser chrome.
 *
 * Config: VITE_GOOGLE_CLIENT_ID (Google Cloud OAuth "Web application"
 * client). When it is unset the button falls back to the redirect flow so
 * preview deploys without the env var still work.
 */

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** Shape of the GIS credential callback payload (subset we use). */
export interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  nonce?: string;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonConfig {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export interface GoogleAccountsId {
  initialize: (config: GoogleIdConfig) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfig) => void;
  prompt: () => void;
  cancel: () => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let loader: Promise<GoogleAccountsId> | null = null;

/**
 * Inject the GIS script once and resolve with google.accounts.id.
 * Rejects if the script cannot load (offline, blocked by an extension,
 * or a Content-Security-Policy that omits accounts.google.com).
 */
export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (loader) return loader;
  loader = new Promise<GoogleAccountsId>((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Google Identity is browser-only'));
      return;
    }
    const existing = window.google?.accounts?.id;
    if (existing) {
      resolve(existing);
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const api = window.google?.accounts?.id;
      if (api) resolve(api);
      else reject(new Error('Google Identity script loaded without google.accounts.id'));
    };
    script.onerror = () => reject(new Error('Failed to load Google Identity script'));
    document.head.appendChild(script);
  });
  // Allow a retry on a later mount if the first load failed.
  loader.catch(() => { loader = null; });
  return loader;
}

/**
 * Supabase's nonce contract for signInWithIdToken: the ID token must carry
 * the SHA-256 hash of the nonce we pass to Supabase. So Google gets the
 * hash, Supabase gets the raw value, and Supabase checks they line up.
 * This defeats token replay from another origin.
 */
export async function createNoncePair(): Promise<{ raw: string; hashed: string }> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
  const hashed = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
  return { raw, hashed };
}
