import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Loader2, LogOut, LayoutDashboard, Users, BookOpen, Layers, Route as RouteIcon, Globe2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolMemberships } from './hooks/useSchool';
import './school.css';

export default function SchoolAppLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { memberships, loading } = useSchoolMemberships();
  const navigate = useNavigate();

  if (authLoading || loading) {
    return (
      <div className="school-app min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/school/signin" replace />;
  }

  if (memberships.length === 0) {
    return <Navigate to="/school/signup" replace />;
  }

  const primary = memberships[0];

  const handleSignOut = async () => {
    await signOut();
    navigate('/school');
  };

  return (
    <div className="school-app min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/school/app" className="flex items-center gap-2 min-w-0">
            <img src="/logo/mpb-mark-transparent.png" alt="MyPhonicsBooks" className="w-7 h-7 object-contain flex-shrink-0" draggable={false} />
            <span className="font-extrabold text-lg truncate">
              {primary.school.name}
            </span>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full uppercase flex-shrink-0">
              {primary.role}
            </span>
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <span className="hidden sm:inline text-slate-500 px-2">{user.email}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto pb-1">
          <SchoolAppNavLink to="/school/app" end icon={<LayoutDashboard className="w-4 h-4" />}>Dashboard</SchoolAppNavLink>
          <SchoolAppNavLink to="/school/app/groups" icon={<Layers className="w-4 h-4" />}>Phonics groups</SchoolAppNavLink>
          <SchoolAppNavLink to="/school/app/classrooms" icon={<Users className="w-4 h-4" />}>Classrooms</SchoolAppNavLink>
          <SchoolAppNavLink to="/school/app/pathway" icon={<RouteIcon className="w-4 h-4" />}>Pathway</SchoolAppNavLink>
          <SchoolAppNavLink to="/school/app/mapping" icon={<Globe2 className="w-4 h-4" />}>Curriculum</SchoolAppNavLink>
          <SchoolAppNavLink to="/school/app/library" icon={<BookOpen className="w-4 h-4" />}>Library</SchoolAppNavLink>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function SchoolAppNavLink({
  to, end, icon, children,
}: { to: string; end?: boolean; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'inline-flex items-center gap-2 px-3 py-2 rounded-t-lg text-sm font-semibold whitespace-nowrap transition-colors -mb-px',
          isActive
            ? 'bg-slate-50 text-slate-900 border-t border-x border-slate-200'
            : 'text-slate-600 hover:text-slate-900',
        ].join(' ')
      }
    >
      {icon}
      {children}
    </NavLink>
  );
}
