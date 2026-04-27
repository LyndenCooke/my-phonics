import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, Tag, User, LogIn, Baby, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAppMode } from '@/hooks/useAppMode';

// Nav items shared between mobile bottom-bar and desktop top-nav.
// "Home" = the hub home (/library), NOT the marketing landing — once the user
// is inside the app, Home should mean hub home.
// Reading progress lives inside the Profile page; we keep the nav tight at 4.
const PARENT_NAV = [
  { path: '/library', label: 'Home', icon: Home },
  { path: '/assess', label: 'Assess', icon: ClipboardCheck },
  { path: '/shop', label: 'Pricing', icon: Tag },
  { path: '/profile', label: 'Profile', icon: User },
];

// Child-mode nav: only Home (the simplified library). Hides Pricing,
// Assess, and Profile so kids can't wander into purchase flows or settings.
const CHILD_NAV = [
  { path: '/library', label: 'Home', icon: Home },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { mode, toggle } = useAppMode();
  const navItems = mode === 'child' ? CHILD_NAV : PARENT_NAV;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — logo links back to the hub home so users are never trapped */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between gap-4 shadow-card">
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

        {/* Right-side: mode toggle + auth + exit */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Parent / Child mode toggle. In child mode, the button is small,
           *  unobtrusive (kids shouldn't tap it accidentally), and labelled
           *  "PARENT" so a grown-up can switch back. In parent mode, it's a
           *  more inviting "Child mode" button. */}
          <button
            onClick={toggle}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all
              ${mode === 'child'
                ? 'border-2 border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'border-2 border-primary/30 bg-tint-pink text-primary-ink hover:border-primary'
              }`}
            aria-label={mode === 'child' ? 'Switch to parent mode' : 'Switch to child mode'}
            title={mode === 'child' ? 'Switch to parent mode' : 'Switch to child mode (kid-safe)'}
          >
            {mode === 'child' ? <Users className="w-3.5 h-3.5" /> : <Baby className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{mode === 'child' ? 'Parent' : 'Child mode'}</span>
          </button>
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
          {mode === 'parent' && (
            <Link
              to="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
              aria-label="Back to landing page"
            >
              Exit
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>

      {/* Bottom tab bar (mobile only — desktop uses the top-nav) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
        <div className="flex items-center justify-around py-2 px-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-primary-ink'
                    : 'text-muted-foreground'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
