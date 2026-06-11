import React from 'react';
import type { PoolObject, T2Content, T9Content, T6Content } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { MatterPage } from '@/components/grammar/booklet/MatterChrome';
import { deriveAnswers } from '@/components/grammar/booklet/deriveAnswers';
import { getGrammarUnit } from '@/lib/grammarRegistry';
import { getPool, getBookTitles } from '@/lib/workbook';

// ---------------------------------------------------------------------------
// T7 — ANSWERS (final pages of the workbook). Re-paged from the approved L6
// key: grammar unit answers derive straight from the unit data (deriveAnswers
// — the key can never drift from the sheet), dictation sentences print here
// VERBATIM from their pool selections (they never appear on the T9 pages),
// and SWYK answers reuse the approved item answers. Spelling-test word lists
// are an authoring dependency — their entries stay flagged placeholders until
// the approved lists land (L6_DEPENDENCIES.md). No bold, no art, body ink
// answers under accent unit names.
// ---------------------------------------------------------------------------

interface AnswerEntry {
  heading: string;
  body: string;
  pending?: boolean;
}
interface AnswerSection {
  title: string;
  entries: AnswerEntry[];
}

function bookSections(level: number, books: number[]): AnswerSection[] {
  const pool = getPool(level);
  const titles = getBookTitles(level);
  return books.map((b) => {
    const pages = pool.filter((p) => p.book === b);
    const entries: AnswerEntry[] = [];
    for (const p of pages) {
      if (p.content.kind === 'T2') {
        const unit = getGrammarUnit((p.content as T2Content).unitId);
        if (unit) entries.push({ heading: p.title, body: deriveAnswers(unit) });
      }
      if (p.content.kind === 'T9') {
        const c = p.content as T9Content;
        entries.push({
          heading: 'Listen and write',
          body: c.sentences.map((s, i) => `${i + 1}. ${s.text}`).join(' '),
        });
      }
      if (p.content.kind === 'T10') {
        entries.push({ heading: 'Spelling test', body: 'Word list to come.', pending: true });
      }
    }
    return { title: titles[b], entries };
  });
}

function closingSections(level: number): AnswerSection[] {
  const pool = getPool(level);
  const entries: AnswerEntry[] = [];
  for (const p of pool.filter((x) => x.strand === 'SWYK')) {
    const c = p.content as T6Content;
    const answers = c.blocks.flatMap((b) => b.items.map((it) => it.answer.replace(/\.$/, '')));
    entries.push({ heading: `Show what you know (${p.id.endsWith('A') ? 'first page' : 'second page'})`, body: answers.join('; ') + '.' });
  }
  const stht = pool.find((x) => x.id.endsWith('ST-HT'));
  if (stht) entries.push({ heading: 'Half-term spelling test', body: 'Word list to come.', pending: true });
  return [{ title: 'Show what you know', entries }];
}

export default function T7Answers({ pool, page }: { pool: PoolObject; page: number }) {
  const theme = getLevelTheme(6);
  const part = (pool.content as { part: 'A' | 'B' }).part;
  const sections = part === 'A' ? bookSections(6, [1, 2]) : [...bookSections(6, [3, 4]), ...closingSections(6)];

  return (
    <MatterPage theme={theme} title="Answers" page={page}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: mm(3), paddingTop: mm(3) }}>
        {sections.map((s) => (
          <div key={s.title}>
            <div style={{ color: theme.primary, ...gType('instruction'), marginBottom: mm(1) }}>{s.title}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: mm(1.5) }}>
              {s.entries.map((e, i) => (
                <div key={i}>
                  <span style={{ color: theme.accentText, ...gType('instruction') }}>{e.heading} </span>
                  <span style={{ color: e.pending ? INK.faint : INK.text, ...gType('instruction') }}>{e.body}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </MatterPage>
  );
}
