import { SCHOOL_LEVELS } from '../data/levels';
import { getSchoolBooksByLevel, type SchoolBook } from '../data/bookCatalog';

export default function SchoolLibrary() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Library — 33 books</h1>
        <p className="text-slate-600">
          Same shipped books and PDFs as production, regrouped under the 8-level structure.
          The pill on each card shows the original (parent-6) sub-level for cross-reference.
        </p>
      </header>

      <div className="space-y-8">
        {SCHOOL_LEVELS.map((lvl) => {
          const books = getSchoolBooksByLevel(lvl.level);
          if (books.length === 0) return null;
          return (
            <section key={lvl.level} data-school-level={lvl.level}>
              <header className="flex items-baseline justify-between mb-3">
                <h2 className="font-display text-xl font-extrabold s-text-ink">
                  L{lvl.level} · {lvl.name}
                </h2>
                <span className="text-xs text-slate-500">{books.length} book{books.length === 1 ? '' : 's'} · {lvl.colourName}</span>
              </header>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {books.map((book) => (
                  <BookCard key={book.subLevel} book={book} level={lvl.level} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BookCard({ book, level }: { book: SchoolBook; level: number }) {
  return (
    <article data-school-level={level} className="bg-white rounded-xl border-2 border-slate-200 p-4">
      <header className="flex items-start justify-between gap-2 mb-2">
        <div>
          <div className="text-[10px] font-mono text-slate-500">{book.subLevel}</div>
          <h3 className="font-bold text-slate-900 leading-tight">{book.title}</h3>
        </div>
        {book.isFreeSample && (
          <span className="px-1.5 py-0.5 bg-green-100 text-green-800 rounded text-[10px] font-semibold uppercase">free</span>
        )}
      </header>

      <div className="flex flex-wrap gap-1 mb-2">
        {book.focusSounds.slice(0, 8).map((s) => (
          <span key={s} className="px-1.5 py-0.5 s-bg-tint s-text-ink rounded text-xs font-mono">{s}</span>
        ))}
      </div>

      <footer className="text-[11px] text-slate-500 pt-2 mt-2 border-t border-slate-100">
        was <code className="font-mono">{book.parent6SubLevel}</code>
      </footer>
    </article>
  );
}
