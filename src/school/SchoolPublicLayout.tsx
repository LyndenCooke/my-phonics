import { Link, Outlet } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import './school.css';

export default function SchoolPublicLayout() {
  const { t } = useTranslation('schoolPublic');
  return (
    <div className="school-app min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-2">
          <Link to="/school" className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-pink-500 flex-shrink-0" />
            <span className="font-extrabold text-lg">
              <span dir="ltr">MyPhonicsBooks</span> <span className="text-slate-500 font-medium">{t('layout.schools')}</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <LanguageSwitcher variant="compact" />
            <Link to="/school/signin" className="px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold">
              {t('common:actions.signIn')}
            </Link>
            <Link to="/school/signup" className="px-3 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800">
              {t('layout.signUpSchool')}
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
