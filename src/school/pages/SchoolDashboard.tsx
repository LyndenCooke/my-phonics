import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Camera, FileText, Globe2, ListChecks } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import { SCHOOL_BOOKS } from '../data/bookCatalog';
import { SOUND_BOOK_TOTAL } from '../data/soundBooks';
import { BLENDING_BOOK_TOTAL } from '../data/blendingBooks';

export default function SchoolDashboard() {
  const totalStorybooks = SCHOOL_BOOKS.length;
  const totalBooks = totalStorybooks + SOUND_BOOK_TOTAL + BLENDING_BOOK_TOTAL;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">The 8-level curriculum</h1>
        <p className="text-slate-600 max-w-2xl">
          A British phonics progression in a Letters and Sounds style structure — eight levels of
          Sound Books, Blending Books and Storybooks with matched worksheets, sound mats and tricky word cards.
        </p>
      </header>

      {/* Level palette strip — at-a-glance view of all 8 levels and colours. */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Levels</h2>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {SCHOOL_LEVELS.map((lvl) => (
            <Link
              key={lvl.level}
              to="/school/levels"
              data-school-level={lvl.level}
              className="s-bg-level rounded-xl p-3 text-white text-center hover:scale-[1.02] transition-transform"
            >
              <div className="text-xs font-semibold opacity-90">L{lvl.level}</div>
              <div className="text-xs font-bold mt-0.5 leading-tight">{lvl.name}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Resource totals at a glance. */}
      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Resources planned</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard icon={<BookOpen className="w-5 h-5" />} value={totalStorybooks} label="Storybooks"     hint="illustrated narratives" />
          <StatCard icon={<Camera className="w-5 h-5" />}   value={SOUND_BOOK_TOTAL} label="Sound Books"   hint="real-photo, 1 per GPC" />
          <StatCard icon={<FileText className="w-5 h-5" />} value={BLENDING_BOOK_TOTAL} label="Blending Books" hint="A6 pre-storybook practice" />
          <StatCard icon={<ListChecks className="w-5 h-5" />} value={totalBooks} label="Books total" hint="across 8 levels" />
        </div>
      </section>

      {/* Nav cards. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <NavCard to="/school/preview/levels"  icon={<ListChecks className="w-5 h-5" />}  title="Levels"             body={`${SCHOOL_LEVELS.length} levels with GPCs, tricky words, full resource plan.`} />
        <NavCard to="/school/preview/library" icon={<BookOpen className="w-5 h-5" />}    title="Library"            body={`${totalStorybooks} storybooks grouped under the new structure.`} />
        <NavCard to="/school/preview/mapping" icon={<Globe2 className="w-5 h-5" />}      title="Curriculum mapping" body="Per-level resource plan, worksheet lifecycle, international equivalents." />
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-900">
          <strong>In development.</strong> This preview is admin-only and writes nothing to the database.
          The parent-facing site at <code className="text-xs">/library</code> and <code className="text-xs">/assessment</code> still runs the original 6-level structure, untouched.
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
        <ArrowRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
      </div>
      <p className="text-sm text-slate-600">{body}</p>
    </Link>
  );
}
