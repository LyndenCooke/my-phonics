import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, BookHeart, ClipboardList, Tag, User, LogIn, Home, Heart, Printer, ShoppingBag, PanelLeftClose, PanelLeftOpen , Globe2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { hapticLight } from '@/lib/native';
import { useNotifications } from '@/hooks/useNotifications';

// Five primary tabs. Resources merged into Library as a Books/Worksheets
// sub-toggle, freeing the slot for Assess + Pricing. The same list drives
// three responsive chromes: the mobile bottom-nav, the tablet top-nav, and
// the desktop left sidebar.
const NAV = [
  { path: '/learn', label: 'Learn', icon: Home, badgeKey: null as 'messages' | null, desktopOnly: false },
  { path: '/assess', label: 'Assess', icon: ClipboardList, badgeKey: null, desktopOnly: false },
  { path: '/library', label: 'Library', icon: BookOpen, badgeKey: null, desktopOnly: false },
  { path: '/pricing', label: 'Pricing', icon: Tag, badgeKey: null, desktopOnly: false },
  { path: '/profile', label: 'Profile', icon: User, badgeKey: 'messages' as const, desktopOnly: false },
  // Wall of Love and Shop live in the desktop side panel only — the mobile
  // bottom bar stays at five tabs (Shop is reachable from Pricing there).
  { path: '/love', label: 'Wall of Love', icon: Heart, badgeKey: null, desktopOnly: true },
  { path: '/shop', label: 'Shop', icon: ShoppingBag, badgeKey: null, desktopOnly: true },
  { path: '/create-book', label: 'Create a Book', icon: BookHeart, badgeKey: null, desktopOnly: true },
  { path: '/world-of-books', label: 'World of Books', icon: Globe2, badgeKey: null, desktopOnly: true },
  { path: '/create-worksheet', label: 'Make a Worksheet', icon: Printer, badgeKey: null, desktopOnly: true },
];

// Persists the desktop (lg+) sidebar collapsed/expanded preference across
// reloads. Guarded for SSR / private-mode storage exceptions.
const SIDEBAR_COLLAPSED_KEY = 'mpb:sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();

  // Profile-tab unread badge — reflects unread in-app notifications
  // (download ready, etc.). Per-user localStorage; once a server-side
  // parent_messages table lands, merge its count in here too.
  const { unreadCount: unreadMessages } = useNotifications();

  // Desktop sidebar collapse state (lg+ only). Mobile/tablet chromes ignore
  // this. Persisted so the rail/full choice survives reloads.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarCollapsed);

  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      } catch {
        /* ignore storage errors (private mode, quota) */
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — mobile + tablet only. On laptop/desktop (lg+) the left
       *  sidebar takes over and this is hidden. pt-safe pads behind the iOS
       *  notch / Android status bar so the status bar text isn't overlapping
       *  our logo. */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border px-4 pt-safe py-3 flex items-center justify-between gap-4 shadow-card no-select lg:hidden">
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

        {/* Tablet top-nav — shows on md..lg (between the mobile bottom-nav
         *  and the desktop sidebar). */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {NAV.filter(i => !i.desktopOnly).map(({ path, label, icon: Icon }) => {
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

        <div className="flex items-center gap-2 shrink-0">
          {!user && (
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

      {/* Main content. pb clears the mobile bottom-nav (on iOS the nav adds
       *  its own safe-area padding, so content only needs the 80px height);
       *  lg:pl-60 clears the fixed desktop sidebar. */}
      <main
        className={`flex-1 pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-4 transition-[padding] duration-300 ease-in-out ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-60'
        }`}
      >
        {children}
      </main>

      {/* Desktop sidebar (lg+). Portaled to document.body for the same
       *  reason as the bottom nav below: the page-transition wrapper sets
       *  will-change:transform, which makes `fixed` resolve against that
       *  transformed ancestor instead of the viewport — the sidebar would
       *  otherwise scroll with the page. Rendering onto body sidesteps it. */}
      {typeof document !== 'undefined' && createPortal(
        <aside
          className={`hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col bg-card border-r border-border no-select transition-[width] duration-300 ease-in-out ${
            sidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Logo + collapse toggle. When collapsed the wordmark is hidden and
           *  the logo mark centres in the rail; the toggle sits beneath it. */}
          <div className={`flex shrink-0 ${sidebarCollapsed ? 'flex-col items-center gap-2 px-2 py-4' : 'items-center justify-between pl-5 pr-3 py-5'}`}>
            <Link
              to="/library"
              className={`flex items-center gap-2.5 hover:opacity-80 transition-opacity min-w-0 ${sidebarCollapsed ? 'justify-center' : ''}`}
              aria-label="Go to Learning Hub home"
              title={sidebarCollapsed ? 'MyPhonicsBooks — Home' : undefined}
            >
              <img
                src="/logo/mpb-mark-transparent.png"
                alt=""
                className="w-9 h-9 object-contain shrink-0"
                draggable={false}
              />
              {!sidebarCollapsed && (
                <span className="font-display text-lg font-extrabold text-foreground tracking-tight truncate">
                  My<span className="text-primary-ink">Phonics</span>Books
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={toggleSidebar}
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" strokeWidth={2} />
              ) : (
                <PanelLeftClose className="w-5 h-5" strokeWidth={2} />
              )}
            </button>
          </div>

          <nav className="flex-1 px-3 mt-1 space-y-1">
            {NAV.map(({ path, label, icon: Icon, badgeKey }) => {
              const isActive = pathname === path;
              const badgeCount = badgeKey === 'messages' ? unreadMessages : 0;
              return (
                <Link
                  key={path}
                  to={path}
                  aria-label={sidebarCollapsed ? label : undefined}
                  title={sidebarCollapsed ? label : undefined}
                  className={`flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                    sidebarCollapsed ? 'justify-center px-0' : 'px-3'
                  } ${
                    isActive
                      ? 'bg-primary/10 text-primary-ink'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <span className="relative">
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 min-w-[14px] h-3.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center px-1 ring-2 ring-card">
                        {badgeCount > 9 ? '9+' : badgeCount}
                      </span>
                    )}
                  </span>
                  {!sidebarCollapsed && label}
                </Link>
              );
            })}
          </nav>

          {!user && (
            <div className={sidebarCollapsed ? 'p-2' : 'p-3'}>
              <Link
                to="/auth"
                aria-label="Sign in"
                title={sidebarCollapsed ? 'Sign in' : undefined}
                className={`flex items-center justify-center gap-1.5 text-sm font-bold text-white gradient-primary rounded-xl shadow-button hover:opacity-90 transition-opacity ${
                  sidebarCollapsed ? 'px-0 py-2.5' : 'px-3 py-2.5'
                }`}
              >
                <LogIn className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && 'Sign In'}
              </Link>
            </div>
          )}
        </aside>,
        document.body
      )}

      {/* Bottom tab bar (mobile only — tablet uses the top-nav, desktop the
       *  sidebar). Rendered via a portal directly onto document.body so the
       *  page-transition wrapper's `transform/opacity` willChange doesn't
       *  create a containing block for it. (Without the portal, fixed
       *  positioning gets resolved against the transformed ancestor and
       *  the nav scrolls with the page on iOS PWAs.)
       *  pb-safe gives the iOS home indicator + Android gesture bar room. */}
      {typeof document !== 'undefined' && createPortal(
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden no-select pb-safe">
          <div className="flex items-center justify-around py-2 px-2">
            {NAV.filter(i => !i.desktopOnly).map(({ path, label, icon: Icon, badgeKey }) => {
              const isActive = pathname === path;
              const badgeCount = badgeKey === 'messages' ? unreadMessages : 0;
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => { if (!isActive) hapticLight(); }}
                  className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all duration-200 press-scale ${
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
    </div>
  );
}
