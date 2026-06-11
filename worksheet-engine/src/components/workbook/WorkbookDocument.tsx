import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { SheetPage, mm } from '@/components/SheetShell';
import { GRAMMAR_LAYOUT_VARS, gType } from '@/design/grammarTokens';
import { MatterPage } from '@/components/grammar/booklet/MatterChrome';
import { assembleWorkbook, type Edition, type AssembledWorkbook } from '@/lib/workbook';
import type { PoolObject } from '@/data/pool/schema';

import T1Handwriting from '@/components/workbook/templates/T1Handwriting';
import GrammarPoolPage from '@/components/workbook/templates/GrammarPoolPage';
import T4SentenceWork from '@/components/workbook/templates/T4SentenceWork';
import T5BigWrite from '@/components/workbook/templates/T5BigWrite';
import T6Swyk from '@/components/workbook/templates/T6Swyk';
import T7Answers from '@/components/workbook/templates/T7Answers';
import T8Lcwc from '@/components/workbook/templates/T8Lcwc';
import T9ListenWrite from '@/components/workbook/templates/T9ListenWrite';
import T10SpellingTest from '@/components/workbook/templates/T10SpellingTest';

// ---------------------------------------------------------------------------
// WorkbookDocument — renders an assembled workbook (level, edition) page by
// page. The assembler owns the order (teaching order per the sequence doc),
// the page numbers, the contents lines and the Answers placement; this
// component only dispatches each pool object to its template.
// ---------------------------------------------------------------------------

type Theme = ReturnType<typeof getLevelTheme>;

/** Page 1 — the cover PLACEHOLDER: a plain level-colour page with title text
 *  only. The real cover system is a separate workstream. */
function CoverPlaceholder({ theme, level }: { theme: Theme; level: number }) {
  return (
    <SheetPage>
      <div style={{ position: 'absolute', inset: 0, background: theme.primary, ...GRAMMAR_LAYOUT_VARS, fontWeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: mm(6) }}>
        <div style={{ color: '#fff', ...gType('display') }}>Workbook</div>
        <div style={{ color: '#fff', ...gType('title') }}>Level {level} · {theme.name}</div>
      </div>
    </SheetPage>
  );
}

/** Page 2 — the child-facing contents: navigation only, "Book → pages". */
function WorkbookContents({ theme, doc }: { theme: Theme; doc: AssembledWorkbook }) {
  return (
    <MatterPage theme={theme} title="Contents" page={2}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: mm(6) }}>
        {doc.contents.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', color: INK.text, ...gType('body') }}>
            <span>{l.label}</span>
            <span style={{ flex: 1, margin: `0 ${mm(3)}`, borderBottom: `0.3mm dotted ${theme.border}`, transform: 'translateY(-1mm)' }} />
            <span style={{ color: theme.accentText }}>{l.pages}</span>
          </div>
        ))}
      </div>
    </MatterPage>
  );
}

function PoolPage({ pool, page }: { pool: PoolObject; page: number }) {
  switch (pool.template) {
    case 'T1': return <T1Handwriting pool={pool} page={page} />;
    case 'T2': return <GrammarPoolPage pool={pool} page={page} />;
    case 'T4': return <T4SentenceWork pool={pool} page={page} />;
    case 'T5': return <T5BigWrite pool={pool} page={page} />;
    case 'T6': return <T6Swyk pool={pool} page={page} />;
    case 'T7': return <T7Answers pool={pool} page={page} />;
    case 'T8': return <T8Lcwc pool={pool} page={page} />;
    case 'T9': return <T9ListenWrite pool={pool} page={page} />;
    case 'T10': return <T10SpellingTest pool={pool} page={page} />;
    default:
      throw new Error(`No workbook renderer for template ${pool.template} (${pool.id}).`);
  }
}

export default function WorkbookDocument({ level, edition }: { level: number; edition: Edition }) {
  const doc = assembleWorkbook(level, edition);
  const theme = getLevelTheme(level);
  return (
    <>
      {doc.pages.map((pg) => {
        if (pg.kind === 'cover') return <CoverPlaceholder key="cover" theme={theme} level={level} />;
        if (pg.kind === 'contents') return <WorkbookContents key="contents" theme={theme} doc={doc} />;
        return <PoolPage key={pg.pool!.id} pool={pg.pool!} page={pg.page} />;
      })}
    </>
  );
}
