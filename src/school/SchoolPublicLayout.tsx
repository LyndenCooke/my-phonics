import { Link, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import './school.css';

export default function SchoolPublicLayout() {
  return (
    <div className="school-app min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/school" className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <span className="font-extrabold text-lg">
              MyPhonicsBooks <span className="text-slate-500 font-medium">/ Schools</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link to="/school/signin" className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold">
              Sign in
            </Link>
            <Link to="/school/signup" className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
              Sign up your school
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
