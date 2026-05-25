import { SCHOOL_LEVELS } from '../data/levels';
import { getSchoolBooksByLevel } from '../data/bookCatalog';

export default function SchoolLevels() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">8 Levels</h1>
        <p className="text-slate-600">Each level lists the GPCs taught, new tricky words, decodable rule, and sentence-length band.</p>
      </header>

      <div className="space-y-4">
        {SCHOOL_LEVELS.map((lvl) => {
          const books = getSchoolBooksByLevel(lvl.level);
          return (
            <article
              key={lvl.level}
              data-school-level={lvl.level}
              className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden"
            >
              {/* Coloured header strip — uses the school palette. */}
              <header className="s-bg-level text-white px-5 py-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Level {lvl.level} · {lvl.colourName}</span>
                  <h2 className="font-display text-2xl font-extrabold">{lvl.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-xs opacity-80">{lvl.ageRange}</div>
                  <div className="text-xs opacity-80">{books.length} book{books.length === 1 ? '' : 's'}</div>
                </div>
              </header>

              <div className="p-5 grid gap-4 md:grid-cols-2">
                <Field label="RWI band">{lvl.rwiBand}</Field>
                <Field label="Phase label">{lvl.phaseLabel}</Field>

                <Field label="GPCs taught" full>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lvl.gpcs.map((g) => (
                      <span key={g} className="px-2 py-0.5 bg-slate-100 rounded text-sm font-mono">{g}</span>
                    ))}
                  </div>
                </Field>

                <Field label="New tricky words" full>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {lvl.trickyWordsNew.map((w) => (
                      <span key={w} className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-sm">{w}</span>
                    ))}
                  </div>
                </Field>

                <Field label="Decodable rule" full>{lvl.decodableRule}</Field>
                <Field label="Sentence length">{lvl.sentenceLength}</Field>

                {books.length > 0 && (
                  <Field label="Books" full>
                    <ul className="mt-1 space-y-1">
                      {books.map((b) => (
                        <li key={b.subLevel} className="text-sm">
                          <span className="font-mono text-xs text-slate-500 mr-2">{b.subLevel}</span>
                          <span className="font-semibold">{b.title}</span>
                          <span className="text-slate-500 ml-2 text-xs">
                            (was {b.parent6SubLevel})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </Field>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  );
}
