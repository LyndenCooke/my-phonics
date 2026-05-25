import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Globe2, ListChecks } from 'lucide-react';
import { SCHOOL_LEVELS } from '../data/levels';
import { SCHOOL_BOOKS } from '../data/bookCatalog';

export default function SchoolDashboard() {
  const totalBooks = SCHOOL_BOOKS.length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">School preview</h1>
        <p className="text-slate-600 max-w-2xl">
          RWI-aligned 8-level curriculum, in development.
          Source-of-truth: <code className="px-1.5 py-0.5 bg-slate-200 rounded text-xs">myphonics_books/output/worksheet_plan/CURRICULUM_LEDGER.md</code>
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

      {/* Nav cards. */}
      <section className="grid gap-3 sm:grid-cols-3">
        <NavCard to="/school/levels" icon={<ListChecks className="w-5 h-5" />} title="Levels" body={`${SCHOOL_LEVELS.length} levels with GPCs, tricky words, sentence-length bands.`} />
        <NavCard to="/school/library" icon={<BookOpen className="w-5 h-5" />} title="Library" body={`${totalBooks} books grouped under the new structure.`} />
        <NavCard to="/school/mapping" icon={<Globe2 className="w-5 h-5" />} title="Curriculum mapping" body="UK L&S, UK RWI, UK Year, Australia, US CC, IB PYP." />
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
