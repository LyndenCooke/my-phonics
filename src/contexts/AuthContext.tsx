import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { syncSourceToCRM } from '@/hooks/useFunnelTracker';
import { syncToGHL } from '@/lib/ghlClient';
import { getStoredRefCode } from '@/lib/referral';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // After signup, sync funnel source to CRM and push to GHL
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to let the DB trigger create the crm_contact first
        setTimeout(() => {
          syncSourceToCRM().catch(() => {});
          syncToGHL('contact.created', {
            source: localStorage.getItem('mpb_funnel_source')
              ? JSON.parse(localStorage.getItem('mpb_funnel_source')!).ref || 'direct'
              : 'direct',
          }).catch(() => {});

          // Tier 2 affiliate: if this user logged in via a referral link
          // but wasn't originally referred (recruited_by is NULL), claim
          // the relationship now. First-touch only — no overwriting.
          const storedRef = getStoredRefCode();
          if (storedRef) {
            supabase.rpc('claim_recruited_by', { p_ref_code: storedRef }).then(
              () => {},
              () => {},
            );
          }

          // Self-heal book unlocks once per session. Idempotent — only
          // inserts user_books rows that don't already exist for this
          // user's completed purchases. Belt-and-braces guarantee for
          // founders who hit the "ready but no books" bug.
          (supabase.rpc as unknown as (fn: string) => Promise<unknown>)('ensure_my_books_unlocked').then(
            () => {},
            (err) => console.warn('ensure_my_books_unlocked failed (non-fatal):', err),
          );
        }, 2000);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Pass stored referral code in user_metadata so the DB trigger can
    // set recruited_by on the new user's referrals row (Tier 2 tracking).
    const refCode = getStoredRefCode();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, ...(refCode ? { ref_code: refCode } : {}) },
        emailRedirectTo: window.location.origin,
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
