import { Link, NavLink, Outlet } from 'react-router-dom';
import { AlertTriangle, LayoutDashboard, BookOpen, ListChecks, Globe2, Sparkles } from 'lucide-react';
import './school.css';

/**
 * SchoolLayout — chrome for every /school/* page.
 *
 * Self-contained: pulls only generic UI atoms, no level-aware imports from
 * the parent app. The `.school-app` wrapper scopes the school palette so
 * nothing leaks back into production styling.
 */
export default function SchoolLayout() {
  return (
    <div className="school-app min-h-screen bg-slate-50 text-slate-900">
      <div className="school-app__banner">
        <AlertTriangle className="w-4 h-4" />
        <span>School version · in development</span>
        <span className="hidden sm:inline">·</span>
        <Link to="/admin" className="hidden sm:inline">Back to admin</Link>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <header className="flex items-center justify-between mb-6">
          <Link to="/school/preview" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span className="font-extrabold text-lg">MyPhonicsBooks <span className="text-slate-500 font-medium">/ Schools preview</span></span>
          </Link>
        </header>

        <nav className="flex gap-1 mb-6 overflow-x-auto pb-1">
          <SchoolNavLink to="/school/preview" end icon={<LayoutDashboard className="w-4 h-4" />}>Overview</SchoolNavLink>
          <SchoolNavLink to="/school/preview/levels" icon={<ListChecks className="w-4 h-4" />}>Levels</SchoolNavLink>
          <SchoolNavLink to="/school/preview/library" icon={<BookOpen className="w-4 h-4" />}>Library</SchoolNavLink>
          <SchoolNavLink to="/school/preview/mapping" icon={<Globe2 className="w-4 h-4" />}>Curriculum mapping</SchoolNavLink>
        </nav>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SchoolNavLink({
  to,
  end,
  icon,
  children,
}: {
  to: string;
  end?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors',
          isActive
            ? 'bg-slate-900 text-white'
            : 'text-slate-700 hover:bg-slate-100',
        ].join(' ')
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
