import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ClipboardCheck, ShoppingBag, BarChart3, User } from 'lucide-react';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/assess', label: 'Assess', icon: ClipboardCheck },
  { path: '/shop', label: 'Shop', icon: ShoppingBag },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] gradient-primary flex items-center justify-center shadow-button">
            <span className="text-primary-foreground font-extrabold text-sm tracking-tight">M</span>
          </div>
          <h1 className="text-lg font-extrabold text-foreground tracking-tight">
            My<span className="text-primary">Phonics</span>Books
          </h1>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-4">
        {children}
      </main>

      {/* Bottom tab bar (mobile) */}
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
                    ? 'text-primary'
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