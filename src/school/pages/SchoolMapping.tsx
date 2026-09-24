import { INTERNATIONAL_MAPPING } from '../data/internationalMapping';
import { PARENT_6_TO_SCHOOL_8 } from '../data/sublevelMapping';
import { SCHOOL_BOOKS } from '../data/bookCatalog';
import { SCHOOL_LEVELS } from '../data/levels';
import { getSoundBooksByLevel, SOUND_BOOK_TOTAL } from '../data/soundBooks';
import { getBlendingBooksByLevel, BLENDING_BOOK_TOTAL } from '../data/blendingBooks';
import { getSchoolBooksByLevel } from '../data/bookCatalog';
import { WORKSHEET_COMPONENTS, LIFECYCLE_META, WORKSHEET_PACKS } from '../data/worksheets';
import { Trans, useTranslation } from 'react-i18next';

export default function SchoolMapping() {
  const { t } = useTranslation('schoolPublic');
  const totalStorybooks = SCHOOL_BOOKS.length;

  const rows = Object.entries(PARENT_6_TO_SCHOOL_8).map(([p6, s8]) => {
    const book = SCHOOL_BOOKS.find((b) => b.subLevel === s8);
    return { p6, s8, title: book?.title ?? '—', level: book?.level ?? 0 };
  }).sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level;
    const aNum = parseInt(a.s8.split('.')[1] ?? '0', 10);
    const bNum = parseInt(b.s8.split('.')[1] ?? '0', 10);
    return aNum - bNum;
  });

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-2">{t('mapping.title')}</h1>
        <p className="text-slate-600">
          {t('mapping.intro')}
        </p>
      </header>

      {/* Per-level resource plan — at-a-glance totals across all 3 book types. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">{t('mapping.perLevelTitle')}</h2>
        <p className="text-sm text-slate-600 mb-3">
          {t('mapping.perLevelBody')}
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t('mapping.level')}</Th>
                <Th align="right">{t('mapping.storybooks')}</Th>
                <Th align="right">{t('mapping.soundBooks')}</Th>
                <Th align="right">{t('mapping.blendingBooks')}</Th>
                <Th align="right">{t('mapping.worksheetPacks')}</Th>
                <Th align="right">{t('mapping.total')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SCHOOL_LEVELS.map((lvl) => {
                const sb = getSchoolBooksByLevel(lvl.level).length;
                const sndb = getSoundBooksByLevel(lvl.level).length;
                const blb = getBlendingBooksByLevel(lvl.level).length;
                const wsp = WORKSHEET_PACKS.reduce((n, p) => n + p.countPerLevel(lvl.level), 0);
                return (
                  <tr key={lvl.level} data-school-level={lvl.level}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-3 h-3 rounded-full s-bg-level" />
                        <span dir="ltr" lang="en" className="font-semibold">L{lvl.level} {lvl.name}</span>
                      </div>
                    </Td>
                    <Td align="right">{sb}</Td>
                    <Td align="right">{sndb}</Td>
                    <Td align="right">{blb}</Td>
                    <Td align="right">{wsp}</Td>
                    <Td align="right" className="font-semibold">{sb + sndb + blb}</Td>
                  </tr>
                );
              })}
              <tr className="bg-slate-50 font-bold">
                <Td>{t('mapping.total')}</Td>
                <Td align="right">{totalStorybooks}</Td>
                <Td align="right">{SOUND_BOOK_TOTAL}</Td>
                <Td align="right">{BLENDING_BOOK_TOTAL}</Td>
                <Td align="right">{WORKSHEET_PACKS.reduce((n, p) => n + SCHOOL_LEVELS.reduce((m, l) => m + p.countPerLevel(l.level), 0), 0)}</Td>
                <Td align="right">{totalStorybooks + SOUND_BOOK_TOTAL + BLENDING_BOOK_TOTAL}</Td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Worksheet component lifecycle table. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">{t('mapping.lifecycleTitle')}</h2>
        <p className="text-sm text-slate-600 mb-3">
          {t('mapping.lifecycleBody')}
          <span className="ms-2 text-xs">
            <Legend />
          </span>
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t('mapping.component')}</Th>
                {SCHOOL_LEVELS.map((l) => (
                  <Th key={l.level} align="center">
                    <span data-school-level={l.level} className="inline-flex flex-col items-center">
                      <span className="inline-block w-3 h-3 rounded-full s-bg-level" />
                      <span dir="ltr" className="text-[10px] mt-0.5">L{l.level}</span>
                    </span>
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {WORKSHEET_COMPONENTS.map((c) => (
                <tr key={c.id}>
                  <Td>
                    <div className="font-semibold">{t(`worksheets.components.${c.id}.label`, { defaultValue: c.label })}</div>
                    <div className="text-xs text-slate-500">{t(`worksheets.components.${c.id}.description`, { defaultValue: c.description })}</div>
                  </Td>
                  {SCHOOL_LEVELS.map((l) => {
                    const lc = c.lifecycle[l.level];
                    const meta = LIFECYCLE_META[lc];
                    return (
                      <Td key={l.level} align="center">
                        <span className={`inline-flex items-center justify-center min-w-[2.75rem] px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${meta.tone}`}>
                          {t(`lifecycle.${lc}`, { defaultValue: meta.label })}
                        </span>
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Worksheet pack types. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">{t('mapping.packTypesTitle')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {WORKSHEET_PACKS.map((p) => (
            <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="font-bold text-slate-900">{t(`worksheets.packs.${p.id}.label`, { defaultValue: p.label })}</div>
              <div className="text-xs text-slate-500 mb-2">{t(`worksheets.packs.${p.id}.perWhat`, { defaultValue: p.perWhat })}</div>
              <div className="text-sm text-slate-700">{t(`worksheets.packs.${p.id}.description`, { defaultValue: p.description })}</div>
            </div>
          ))}
        </div>
      </section>

      {/* International table. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">{t('mapping.intlTitle')}</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t('mapping.level')}</Th>
                <Th>{t('mapping.ukLetterSounds')}</Th>
                <Th>{t('mapping.ukYear')}</Th>
                <Th>{t('mapping.saudiGulf')}</Th>
                <Th>{t('mapping.pakistan')}</Th>
                <Th>{t('mapping.australia')}</Th>
                <Th>{t('mapping.usCommonCore')}</Th>
                <Th>{t('mapping.ibPyp')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {INTERNATIONAL_MAPPING.map((m) => (
                <tr key={m.level} data-school-level={m.level}>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-3 h-3 rounded-full s-bg-level" />
                      <span dir="ltr" lang="en" className="font-semibold">L{m.level} {m.name}</span>
                    </div>
                  </Td>
                  <Td><span dir="ltr" lang="en">{m.ukLetterSounds}</span></Td>
                  <Td><span dir="ltr" lang="en">{m.ukYearGroup}</span></Td>
                  <Td className="font-semibold"><span dir="ltr" lang="en">{m.saudiGulf}</span></Td>
                  <Td className="font-semibold"><span dir="ltr" lang="en">{m.pakistan}</span></Td>
                  <Td><span dir="ltr" lang="en">{m.australia}</span></Td>
                  <Td><span dir="ltr" lang="en">{m.usCommonCore}</span></Td>
                  <Td><span dir="ltr" lang="en">{m.ibPyp}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Sub-level remap table. */}
      <section>
        <h2 className="font-display text-xl font-bold mb-3">{t('mapping.remapTitle')}</h2>
        <p className="text-sm text-slate-600 mb-3">
          <Trans t={t} i18nKey="mapping.remapBody" components={{ code: <code className="font-mono" /> }} />
        </p>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>{t('mapping.parentId')}</Th>
                <Th><span className="inline-block rtl:-scale-x-100">→</span></Th>
                <Th>{t('mapping.schoolId')}</Th>
                <Th>{t('mapping.titleCol')}</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.p6} data-school-level={r.level}>
                  <Td><code className="font-mono">{r.p6}</code></Td>
                  <Td className="text-slate-400"><span className="inline-block rtl:-scale-x-100">→</span></Td>
                  <Td>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full s-bg-level" />
                      <code className="font-mono font-semibold">{r.s8}</code>
                    </span>
                  </Td>
                  <Td><span dir="ltr" lang="en">{r.title}</span></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Legend() {
  const { t } = useTranslation('schoolPublic');
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {(['core', 'intro', 'light', 'recap', 'none'] as const).map((k) => (
        <span key={k} className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase ${LIFECYCLE_META[k].tone}`}>
          {t(`lifecycle.${k}`, { defaultValue: LIFECYCLE_META[k].label })}
        </span>
      ))}
    </span>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  const a = align === 'right' ? 'text-end' : align === 'center' ? 'text-center' : 'text-start';
  return <th className={`px-3 py-2 ${a} text-[11px] font-bold uppercase tracking-wider`}>{children}</th>;
}

function Td({ children, align = 'left', className = '' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  const a = align === 'right' ? 'text-end' : align === 'center' ? 'text-center' : 'text-start';
  return <td className={`px-3 py-2 align-middle ${a} ${className}`}>{children}</td>;
}
