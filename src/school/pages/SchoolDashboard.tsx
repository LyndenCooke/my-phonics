import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, Camera, FileText, Globe2, ListChecks } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import { SCHOOL_BOOKS } from '../data/bookCatalog';
import { SOUND_BOOK_TOTAL } from '../data/soundBooks';
import { BLENDING_BOOK_TOTAL } from '../data/blendingBooks';

export default function SchoolDashboard() {
  const { t } = useTranslation('schoolApp');
  const totalStorybooks = SCHOOL_BOOKS.length;
  const totalBooks = totalStorybooks + SOUND_BOOK_TOTAL + BLENDING_BOOK_TOTAL;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">{t('dashboard.title')}</h1>
        <p className="text-slate-600 max-w-2xl">
          {t('dashboard.intro')}
        </p>
      </header>

      {/* Level palette strip — at-a-glance view of all 8 levels and colours. */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('dashboard.levels')}</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SCHOOL_LEVELS.map((lvl) => (
            <Link
              key={lvl.level}
              to="/school/levels"
              data-school-level={lvl.level}
              className="s-bg-level rounded-xl p-3 text-white text-center hover:scale-[1.02] transition-transform"
            >
              <div dir="ltr" lang="en">
                <div className="text-xs font-semibold opacity-90">L{lvl.level}</div>
                <div className="text-xs font-bold mt-0.5 leading-tight">{lvl.name}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Resource totals at a glance. */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">{t('dashboard.resourcesPlanned')}</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={<BookOpen className="w-5 h-5" />} value={totalStorybooks} label={t('dashboard.stats.storybooks')} hint={t('dashboard.stats.storybooksHint')} />
          <StatCard icon={<Camera className="w-5 h-5" />}   value={SOUND_BOOK_TOTAL} label={t('dashboard.stats.soundBooks')} hint={t('dashboard.stats.soundBooksHint')} />
          <StatCard icon={<FileText className="w-5 h-5" />} value={BLENDING_BOOK_TOTAL} label={t('dashboard.stats.blendingBooks')} hint={t('dashboard.stats.blendingBooksHint')} />
          <StatCard icon={<ListChecks className="w-5 h-5" />} value={totalBooks} label={t('dashboard.stats.total')} hint={t('dashboard.stats.totalHint')} />
        </div>
      </section>

      {/* Nav cards. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <NavCard to="/school/preview/levels"  icon={<ListChecks className="w-5 h-5" />}  title={t('dashboard.nav.levels.title')} body={t('dashboard.nav.levels.body', { count: SCHOOL_LEVELS.length })} />
        <NavCard to="/school/preview/library" icon={<BookOpen className="w-5 h-5" />}    title={t('dashboard.nav.library.title')} body={t('dashboard.nav.library.body', { count: totalStorybooks })} />
        <NavCard to="/school/preview/mapping" icon={<Globe2 className="w-5 h-5" />}      title={t('dashboard.nav.mapping.title')} body={t('dashboard.nav.mapping.body')} />
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900">
          <Trans t={t} i18nKey="dashboard.devNotice" components={{ b: <strong />, code: <code className="text-xs" /> }} />
        </p>
      </section>
    </div>
  );
}

function StatCard({ icon, value, label, hint }: { icon: React.ReactNode; value: number; label: string; hint: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="flex items-center gap-2 text-slate-500 mb-1">{icon}<span className="text-xs font-bold uppercase tracking-wider">{label}</span></div>
      <div className="text-3xl font-extrabold text-slate-900">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{hint}</div>
    </div>
  );
}

function NavCard({ to, icon, title, body }: { to: string; icon: React.ReactNode; title: string; body: string }) {
  return (
    <Link to={to} className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-400 transition-colors">
      <div className="flex items-center gap-2 text-slate-700 mb-2">
        {icon}
        <h3 className="font-bold">{title}</h3>
        <ArrowRight className="w-4 h-4 ms-auto opacity-0 group-hover:opacity-100 rtl:-scale-x-100" />
      </div>
      <p className="text-sm text-slate-600">{body}</p>
    </Link>
  );
}
