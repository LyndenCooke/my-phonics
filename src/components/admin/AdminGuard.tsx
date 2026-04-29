import { Navigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { Loader2, ShieldAlert, LogIn } from 'lucide-react';

/**
 * AdminGuard — gate for the /admin/* routes.
 *
 * Three outcomes, each with explicit feedback so a clicked-by-mistake admin
 * link doesn't fail silently:
 *   - auth still loading → spinner
 *   - not signed in → redirect to /auth with a returnTo so the user lands
 *     back here after sign-in, NOT silently bouncing to /
 *   - signed in but not admin → friendly "not authorized" page with a
 *     home button, NOT a silent redirect (a silent redirect makes people
 *     think the link is broken)
 *   - signed in + admin → render the admin shell
 */
export default function AdminGuard() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ returnTo: '/admin' }} />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-card rounded-2xl border border-border shadow-card p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-foreground mb-1.5">Admin only</h1>
          <p className="text-sm text-muted-foreground mb-5">
            You're signed in as <span className="font-semibold text-foreground">{user.email}</span>, but this account isn't an admin.
            If you should have access, ask the team to add the admin role to your profile.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform"
          >
            <LogIn className="w-4 h-4" />
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
