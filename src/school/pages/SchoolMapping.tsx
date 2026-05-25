import { INTERNATIONAL_MAPPING } from '../data/internationalMapping';
import { PARENT_6_TO_SCHOOL_8 } from '../data/sublevelMapping';
import { SCHOOL_BOOKS } from '../data/bookCatalog';

export default function SchoolMapping() {
  // Build a mapping table that joins each parent-6 sub_level to its book + new ID.
  const rows = Object.entries(PARENT_6_TO_SCHOOL_8).map(([p6, s8]) => {
    const book = SCHOOL_BOOKS.find((b) => b.subLevel === s8);
    return { p6, s8, title: book?.title ?? '—', level: book?.level ?? 0 };
  }).sort((a, b) => {
    // Sort by school-8 level then sub-level numeric suffix.
    if (a.level !== b.level) return a.level - b.level;
    const aNum = parseInt(a.s8.split('.')[1] ?? '0', 10);
    const bNum = parseInt(b.s8.split('.')[1] ?? '0', 10);
    return aNum - bNum;
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">Curriculum mapping</h1>
        <p className="text-slate-600">
          How our 8 levels map to the major UK and international curricula, and how
          each book's new ID relates back to the existing production ID.
        </p>
      </header>

      {/* International table. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">International equivalents</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Level</Th>
                <Th>UK Letters &amp; Sounds</Th>
                <Th>UK Read Write Inc</Th>
                <Th>UK Year</Th>
                <Th>Australia</Th>
                <Th>US Common Core</Th>
                <Th>IB PYP</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {INTERNATIONAL_MAPPING.map((m) => (
                <tr key={m.level} data-school-level={m.level}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full s-bg-level" />
                      <span className="font-semibold">L{m.level} {m.name}</span>
                    </div>
                  </Td>
                  <Td>{m.ukLetterSounds}</Td>
                  <Td>{m.ukRwi}</Td>
                  <Td>{m.ukYearGroup}</Td>
                  <Td>{m.australia}</Td>
                  <Td>{m.usCommonCore}</Td>
                  <Td>{m.ibPyp}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sub-level remap table. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">Sub-level remap (parent-6 → school-8)</h2>
        <p className="text-sm text-slate-600 mb-3">
          Used by the DB merge: existing rows in the <code className="font-mono">books</code> table
          still carry parent-6 IDs. The school app translates on the fly.
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Parent-6 ID</Th>
                <Th>→</Th>
                <Th>School-8 ID</Th>
                <Th>Title</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.p6} data-school-level={r.level}>
                  <Td><code className="font-mono">{r.p6}</code></Td>
                  <Td className="text-slate-400">→</Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full s-bg-level" />
                      <code className="font-mono font-semibold">{r.s8}</code>
                    </span>
                  </Td>
                  <Td>{r.title}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider">{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2 align-middle ${className}`}>{children}</td>;
}
