import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// The Vite SPA can't set httpOnly cookies (no server we control), so the
// teacher's session token lives in localStorage. The token itself is just
// an opaque UUID — every gated lookup goes through the
// `lookup_teacher_session` RPC, which is the real source of truth (revoking
// a code in `teacher_codes` instantly disables every redemption that used
// it). A stolen token would give read access to the free TPT library, which
// is already free — no payment or PII surface to defend.
const STORAGE_KEY = 'mpb_teacher_session';

export interface TeacherSession {
  code: string;
  label: string;
}

export function getTeacherSessionToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setTeacherSessionToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Private browsing / disabled storage — fall through; the teacher
    // will be asked to re-enter the code on next visit, which is fine.
  }
}

export function clearTeacherSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

type RedeemResponse =
  | { ok: true; session_token: string; code: string; label: string }
  | { ok: false; reason: string };

type LookupResponse =
  | { ok: true; code: string; label: string }
  | { ok: false; reason: string };

export async function redeemTeacherCode(
  code: string,
): Promise<{ ok: true; session: TeacherSession } | { ok: false; error: string }> {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, error: 'Please enter a code.' };

  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: RedeemResponse | null; error: unknown }>)('redeem_teacher_code', {
    p_code: trimmed,
    p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });

  if (error || !data) {
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
  if (!data.ok) {
    return { ok: false, error: 'That code is not valid or has expired.' };
  }

  setTeacherSessionToken(data.session_token);
  return { ok: true, session: { code: data.code, label: data.label } };
}

export async function lookupTeacherSession(
  token: string,
): Promise<TeacherSession | null> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: LookupResponse | null; error: unknown }>)('lookup_teacher_session', {
    p_session_token: token,
  });

  if (error || !data || !data.ok) return null;
  return { code: data.code, label: data.label };
}

/**
 * React hook for components that need to know "is this visitor a teacher?".
 * Returns `null` while the session is being validated, then either the
 * resolved TeacherSession or `false` for "no teacher pass."
 */
export function useTeacherSession(): {
  session: TeacherSession | null;
  loading: boolean;
} {
  const [session, setSession] = useState<TeacherSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const token = getTeacherSessionToken();
    if (!token) {
      setLoading(false);
      return;
    }
    lookupTeacherSession(token).then((result) => {
      if (cancelled) return;
      if (!result) {
        clearTeacherSession();
        setSession(null);
      } else {
        setSession(result);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { session, loading };
}

/**
 * Synchronous "do we have any teacher token at all?" — useful for places
 * like the reader unlock check where a network round-trip would block
 * rendering. The server-side validation still runs on every gated
 * download / lookup call.
 */
export function hasTeacherTokenSync(): boolean {
  return !!getTeacherSessionToken();
}
