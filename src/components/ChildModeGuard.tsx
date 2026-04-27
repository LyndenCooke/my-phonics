/**
 * ChildModeGuard — wraps any route that should be inaccessible in child mode
 * (purchase flows, account settings, admin). Redirects child-mode users back
 * to /library so they land on the kid-safe home instead of a paywall.
 *
 * Usage in App.tsx:
 *   <Route path="/shop" element={<ChildModeGuard><Shop /></ChildModeGuard>} />
 *
 * Pair with a PIN gate on the parent toggle so children can't simply flip
 * mode → open shop. The guard is the second line of defence; the toggle
 * gate is the first.
 */
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppMode } from '@/hooks/useAppMode';

export default function ChildModeGuard({ children }: { children: ReactNode }) {
  const { mode } = useAppMode();
  if (mode === 'child') return <Navigate to="/library" replace />;
  return <>{children}</>;
}
