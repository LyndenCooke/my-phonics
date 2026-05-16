import { ReactNode, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, FolderOpen, User, LogIn, Baby, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/hooks/useAppMode';
import { hapticLight } from '@/lib/native';
import { hasParentPin } from '@/hooks/useAppMode';
import { useNotifications } from '@/hooks/useNotifications';

// Founders feedback modal — auto-pops globally when a review is due.
// Component handles all gating internally (returns null when nothing to
// show, when snoozed, or when the user is signed-out).
const FoundersReviewPrompt = lazy(() => import('@/components/FoundersReviewPrompt'));

// Lazy: the PIN dialog is only used on the parent toggle; no need to ship
// it in the main bundle for kids who never see it.
const ParentPinDialog = lazy(() => import('@/components/ParentPinDialog'));
import ModeToggleHint from '@/components/ModeToggleHint';

// Nav items shared between mobile bottom-bar and desktop top-nav.
// Library-first model: every visitor lands in /library, the assessment and
// pricing pages are accessible from inside the library/resources flows but
// removed from primary nav to reduce friction. Three tabs only.
const PARENT_NAV = [
  { path: '/library', label: 'Library', icon: BookOpen, badgeKey: null as 'messages' | null },
  { path: '/resources', label: 'Resources', icon: FolderOpen, badgeKey: null },
  { path: '/profile', label: 'Profile', icon: User, badgeKey: 'messages' as const },
];

// Child-mode nav: only Library (the simplified hub). Hides Resources and
// Profile so kids can't wander into adult-facing pages.
const CHILD_NAV = [
  { path: '/library', label: 'Library', icon: BookOpen, badgeKey: null as 'messages' | null },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { mode, setMode, toggle } = useAppMode();
  const navItems = mode === 'child' ? CHILD_NAV : PARENT_NAV;
  const [pinOpen, setPinOpen] = useState(false);

  // Profile-tab unread badge — reflects unread in-app notifications
  // (download ready, etc.). Per-user localStorage; once a server-side
  // parent_messages table lands, merge its count in here too.
  const { unreadCount: unreadMessages } = useNotifications();

  // Toggle behaviour:
  //  parent → child: free, no gate (the parent is in control).
  //  child → parent: ONLY PIN-gated if a PIN has been set. The PIN is
  //                  opt-in — parents who want kid-proofing can set one
  //                  via Profile → Settings (or proactively via the
  //                  dialog when they first switch to child mode). If
  //                  no PIN exists, switching back is free — we don't
  //                  bully a parent into setting up security they didn't
  //                  ask for. Auto-default-to-child mustn't trap them.
  const handleToggle = () => {
    hapticLight();
    if (mode === 'parent') { toggle(); return; }
    if (!hasParentPin()) { setMode('parent'); return; }
    setPinOpen(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — logo links back to the hub home so users are never trapped.
       *  pt-safe pads behind the iOS notch / Android status bar so the
       *  status bar text isn't overlapping our logo. */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border px-4 pt-safe py-3 flex items-center justify-between gap-4 shadow-card no-select">
        <Link
          to="/library"
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
          aria-label="Go to Learning Hub home"
        >
          <img
            src="/logo/mpb-mark-transparent.png"
            alt=""
            className="w-10 h-10 object-contain"
            draggable={false}
          />
          <h1 className="font-display text-lg font-extrabold text-foreground tracking-tight">
            My<span className="text-primary-ink">Phonics</span>Books
          </h1>
        </Link>

        {/* Desktop top-nav — hidden on mobile (where bottom-nav takes over) */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary-ink'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Right-side: mode toggle + auth + exit.
         *  (Smart Nudge button removed — there's no real data to surface
         *  yet. Once a parent_messages table exists and the badge can
         *  show genuine new items, restore it here.) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Parent / Child mode toggle. In child mode, the button is small,
           *  unobtrusive (kids shouldn't tap it accidentally), and labelled
           *  "PARENT" so a grown-up can switch back. In parent mode, it's a
           *  more inviting "Child mode" button.
           *
           *  Wrapped in `relative` so the first-run ModeToggleHint can
           *  position itself directly underneath it. */}
          <div className="relative">
            <button
              onClick={handleToggle}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all
                ${mode === 'child'
                  ? 'border-2 border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                  : 'border-2 border-primary/30 bg-tint-pink text-primary-ink hover:border-primary animate-pulse-soft'
                }`}
              aria-label={mode === 'child' ? 'Switch to parent mode' : 'Switch to child mode'}
              title={mode === 'child' ? 'Switch to parent mode' : 'Switch to child mode (kid-safe)'}
            >
              {mode === 'child' ? <Users className="w-3.5 h-3.5" /> : <Baby className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{mode === 'child' ? 'Parent' : 'Child mode'}</span>
            </button>
            <ModeToggleHint />
            <style>{`
              @keyframes pulse-soft {
                0%, 100% { box-shadow: 0 0 0 0 rgba(232, 75, 138, 0.0); }
                50% { box-shadow: 0 0 0 6px rgba(232, 75, 138, 0.15); }
              }
              .animate-pulse-soft { animation: pulse-soft 2.4s ease-in-out infinite; }
            `}</style>
          </div>
          {!user && mode === 'parent' && (
            <Link
              to="/auth"
              className="flex items-center gap-1 text-sm font-bold text-white gradient-primary px-3 py-1.5 rounded-xl shadow-button hover:opacity-90 transition-opacity"
              aria-label="Sign in"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}
        </div>
      </header>

      {/* Main content. pb-20 clears the bottom nav on mobile; on iOS the
       *  nav itself adds safe-area padding for the home indicator, so
       *  content underneath only needs the nav's height (80px). */}
      <main className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4">
        {children}
      </main>

      {/* Parent PIN gate */}
      {pinOpen && (
        <Suspense fallback={null}>
          <ParentPinDialog
            open={pinOpen}
            onClose={() => setPinOpen(false)}
            onSuccess={() => { setPinOpen(false); setMode('parent'); }}
          />
        </Suspense>
      )}

      {/* Bottom tab bar (mobile only — desktop uses the top-nav).
       *  Rendered via a portal directly onto document.body so the
       *  page-transition wrapper's `transform/opacity` willChange doesn't
       *  create a containing block for it. (Without the portal, fixed
       *  positioning gets resolved against the transformed ancestor and
       *  the nav scrolls with the page on iOS PWAs.)
       *  pb-safe gives the iOS home indicator + Android gesture bar room. */}
      {typeof document !== 'undefined' && createPortal(
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden no-select pb-safe">
          <div className="flex items-center justify-around py-2 px-2">
            {navItems.map(({ path, label, icon: Icon, badgeKey }) => {
              const isActive = pathname === path;
              const badgeCount = badgeKey === 'messages' ? unreadMessages : 0;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => { if (!isActive) hapticLight(); }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 press-scale ${
                    isActive
                      ? 'text-primary-ink'
                      : 'text-muted-foreground'
                  }`}
                >
                  <span className="relative">
                    <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center px-1 ring-2 ring-card">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>,
        document.body
      )}

      {/* Global founders-feedback modal. Only mount in parent mode so a
       *  child can't see it. The component itself handles "is there a
       *  due review" gating, so on most page-loads this lazy module
       *  briefly renders nothing and returns null. */}
      {mode === 'parent' && (
        <Suspense fallback={null}>
          <FoundersReviewPrompt />
        </Suspense>
      )}
    </div>
  );
}
