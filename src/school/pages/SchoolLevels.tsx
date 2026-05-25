import { SCHOOL_LEVELS } from '../data/levels';
import { getSchoolBooksByLevel } from '../data/bookCatalog';
import { getSoundBooksByLevel } from '../data/soundBooks';
import { getBlendingBooksByLevel } from '../data/blendingBooks';
import { WORKSHEET_COMPONENTS, LIFECYCLE_META, WORKSHEET_PACKS } from '../data/worksheets';

export default function SchoolLevels() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">8 Levels</h1>
        <p className="text-slate-600">Each level lists GPCs, tricky words, the decodable rule, and the full resource plan: storybooks, Sound Books, Blending Books and worksheet types.</p>
      </header>

      <div className="space-y-4">
        {SCHOOL_LEVELS.map((lvl) => {
          const storybooks = getSchoolBooksByLevel(lvl.level);
          const soundBooks = getSoundBooksByLevel(lvl.level);
          const blendingBooks = getBlendingBooksByLevel(lvl.level);

          return (
            <article
              key={lvl.level}
              data-school-level={lvl.level}
              className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden"
            >
              <header className="s-bg-level text-white px-5 py-3 flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-semibold opacity-80 uppercase tracking-wider">Level {lvl.level} · {lvl.colourName}</span>
                  <h2 className="font-display text-2xl font-extrabold">{lvl.name}</h2>
                </div>
                <div className="text-right text-xs opacity-90">
                  <div>{lvl.ageRange}</div>
                  <div className="mt-0.5">{lvl.phaseLabel}</div>
                </div>
              </header>

              <div className="p-5 grid gap-4 md:grid-cols-2">
                <Field label="RWI band">{lvl.rwiBand}</Field>
                <Field label="Sentence length">{lvl.sentenceLength}</Field>

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
              </div>

              {/* Resource summary row */}
              <div data-school-level={lvl.level} className="px-5 py-3 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <ResourceCount label="Storybooks"      value={storybooks.length} />
                <ResourceCount label="Sound Books"     value={soundBooks.length} />
                <ResourceCount label="Blending Books"  value={blendingBooks.length} />
                <ResourceCount label="Worksheet packs" value={WORKSHEET_PACKS.reduce((n, p) => n + p.countPerLevel(lvl.level), 0)} />
              </div>

              {/* Resource details — collapsible by section */}
              <div className="px-5 pb-5 space-y-4">
                {storybooks.length > 0 && (
                  <ResourceList
                    title="Storybooks (illustrated narratives)"
                    items={storybooks.map((b) => `${b.subLevel} — ${b.title}`)}
                  />
                )}
                {soundBooks.length > 0 && (
                  <ResourceList
                    title={`Sound Books (real photos · one per GPC)`}
                    items={soundBooks.map((s) => s.title + (s.comparisonSounds.length ? ` · alt: ${s.comparisonSounds.join(', ')}` : ''))}
                  />
                )}
                {blendingBooks.length > 0 && (
                  <ResourceList
                    title="Blending Books (A6 · pre-storybook practice)"
                    items={blendingBooks.map((b) => `${b.title} — ${b.focus}`)}
                  />
                )}

                {/* Worksheet lifecycle for THIS level */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Worksheet components at this level</h3>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {WORKSHEET_COMPONENTS.map((c) => {
                      const lc = c.lifecycle[lvl.level];
                      const meta = LIFECYCLE_META[lc];
                      return (
                        <div key={c.id} className="flex items-center gap-2 text-sm">
                          <span className={`inline-flex items-center justify-center min-w-[3rem] px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${meta.tone}`}>
                            {meta.label}
                          </span>
                          <span className="text-slate-700">{c.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
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

function ResourceCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="s-bg-tint rounded-lg p-2">
      <div className="text-2xl font-extrabold s-text-ink leading-none">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-600 mt-1">{label}</div>
    </div>
  );
}

function ResourceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">{title}</h3>
      <ul className="text-sm text-slate-700 space-y-0.5">
        {items.map((it) => (
          <li key={it} className="flex items-baseline gap-2">
            <span className="text-slate-300">•</span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
