import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNative } from '@/lib/native';
import {
  GOOGLE_CLIENT_ID,
  createNoncePair,
  isGoogleIdentityOrigin,
  loadGoogleIdentity,
  type GoogleCredentialResponse,
} from '@/lib/googleIdentity';

interface Props {
  /** Called once Supabase has a live session for the Google account. */
  onSignedIn: () => void;
  /** Called with a human-readable message when sign-in fails. */
  onError: (message: string) => void;
  /**
   * Legacy path: supabase.auth.signInWithOAuth redirect. Used when the
   * Google client ID is not configured, on native builds (the GIS script
   * does not run inside a Capacitor WebView), on hosts not registered as
   * JavaScript origins with Google (preview deploys), or when the GIS
   * script cannot load at all.
   */
  onFallback: () => void;
  disabled?: boolean;
}

type State = 'loading' | 'gis' | 'fallback';

/**
 * "Continue with Google" that keeps the parent on our own domain.
 *
 * Renders Google's own button (Google Identity Services). Google returns an
 * ID token straight to this page, and we exchange it for a Supabase session
 * with signInWithIdToken. The consent screen shows our app name and our
 * domain, never the Supabase project hostname, and AuthContext picks the
 * session up through onAuthStateChange exactly as before.
 */
export default function GoogleSignInButton({ onSignedIn, onError, onFallback, disabled }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(() =>
    GOOGLE_CLIENT_ID && !isNative && isGoogleIdentityOrigin() ? 'loading' : 'fallback',
  );
  const [exchanging, setExchanging] = useState(false);
  // Keep the latest callbacks without re-initialising GIS on every render.
  const callbacks = useRef({ onSignedIn, onError });
  callbacks.current = { onSignedIn, onError };

  useEffect(() => {
    if (state !== 'loading' || !GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    (async () => {
      try {
        const [gis, nonce] = await Promise.all([loadGoogleIdentity(), createNoncePair()]);
        if (cancelled || !containerRef.current) return;

        gis.initialize({
          client_id: GOOGLE_CLIENT_ID,
          nonce: nonce.hashed,
          // FedCM is the browser-native prompt Chrome now requires for
          // One Tap; harmless for the button-only flow we use here.
          use_fedcm_for_prompt: true,
          itp_support: true,
          callback: async (response: GoogleCredentialResponse) => {
            setExchanging(true);
            try {
              const { error } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: response.credential,
                nonce: nonce.raw,
              });
              if (error) throw error;
              callbacks.current.onSignedIn();
            } catch (err) {
              callbacks.current.onError(err instanceof Error ? err.message : 'Google sign-in failed');
            } finally {
              setExchanging(false);
            }
          },
        });

        // Google's button needs a pixel width; match the form column
        // (max-w-sm is 384px, and GIS caps at 400).
        const width = Math.min(400, Math.max(200, Math.round(containerRef.current.clientWidth || 384)));
        gis.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width,
        });
        setState('gis');
      } catch (err) {
        console.warn('Google Identity unavailable, using redirect sign-in:', err);
        if (!cancelled) setState('fallback');
      }
    })();

    return () => { cancelled = true; };
  }, [state]);

  if (state === 'fallback') {
    return (
      <button
        type="button"
        onClick={onFallback}
        disabled={disabled}
        className="w-full py-3 rounded-xl bg-white border-2 border-border hover:border-primary/40 text-foreground font-bold text-sm shadow-sm hover:shadow flex items-center justify-center gap-2.5 transition-all disabled:opacity-60"
      >
        <GoogleMark />
        Continue with Google
      </button>
    );
  }

  return (
    <div className="relative min-h-[44px] flex justify-center">
      {/* GIS paints its iframe button into this node. */}
      <div ref={containerRef} className="w-full flex justify-center" aria-busy={state === 'loading' || exchanging} />
      {(state === 'loading' || exchanging || disabled) && (
        <div
          className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center text-xs text-muted-foreground"
          aria-hidden={state === 'gis' && !exchanging}
        >
          {exchanging ? 'Signing you in...' : state === 'loading' ? 'Loading Google...' : ''}
        </div>
      )}
    </div>
  );
}

/** Google "G" mark, inline to avoid an extra dependency. */
function GoogleMark() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.61 20.08H42V20H24v8h11.3c-1.65 4.66-6.08 8-11.3 8-6.63 0-12-5.37-12-12s5.37-12 12-12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 12.95 4 4 12.95 4 24s8.95 20 20 20 20-8.95 20-20c0-1.34-.14-2.65-.39-3.92z"/>
      <path fill="#FF3D00" d="M6.31 14.69l6.57 4.81C14.66 15.13 18.97 12 24 12c3.06 0 5.84 1.15 7.96 3.04l5.66-5.66C34.05 6.05 29.27 4 24 4 16.32 4 9.66 8.34 6.31 14.69z"/>
      <path fill="#4CAF50" d="M24 44c5.17 0 9.86-1.98 13.41-5.21l-6.19-5.24C29.21 35.09 26.71 36 24 36c-5.2 0-9.62-3.32-11.28-7.96l-6.52 5.02C9.5 39.55 16.23 44 24 44z"/>
      <path fill="#1976D2" d="M43.61 20.08H42V20H24v8h11.3c-.79 2.24-2.23 4.16-4.09 5.55l6.19 5.24C40.99 35.27 44 30 44 24c0-1.34-.14-2.65-.39-3.92z"/>
    </svg>
  );
}
