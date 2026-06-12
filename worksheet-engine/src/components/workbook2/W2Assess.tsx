import React from 'react';
import { getGrammarUnitByCode, getGrammarUnit } from '@/lib/grammarRegistry';
import { TICKGRID_CATEGORIES } from '@/data/grammarSchema';
import { deriveAnswers } from '@/components/grammar/booklet/deriveAnswers';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, Line, TYPE2, type Theme } from '@/components/workbook2/BookStyle';
import { W2_L6_BOOKS, W2_L6_SWYK } from '@/data/workbook2/l6';

// ---------------------------------------------------------------------------
// W2 assessment + answers — the week-6 event (Show what you know A/B, with
// the half-term spelling test as the bottom half of page B) and the Answers
// pages, all in the book back-matter style. Every assessment item is an
// approved row reused BY POINTER; the half-term word list is an authoring
// dependency (the page needs none of it — a grown-up reads the words).
// ---------------------------------------------------------------------------

type Ref = { sourceUnit: string; rowRef: number };

function tickRow(r: Ref): { text: string; answer: string } {
  const u = getGrammarUnitByCode(r.sourceUnit);
  return u?.format === 'tickgrid' ? u.tickgrid.rows[r.rowRef] : { text: '', answer: '' };
}
function matchPair(r: Ref): { left: string; right: string } {
  const u = getGrammarUnitByCode(r.sourceUnit);
  return u?.format === 'match' ? u.match.pairs[r.rowRef] : { left: '', right: '' };
}
function buildRow(r: Ref): { base: string; answer: string; bank: string[] } {
  const u = getGrammarUnitByCode(r.sourceUnit);
  return u?.format === 'build'
    ? { ...u.build.rows[r.rowRef], bank: u.build.wordBank }
    : { base: '', answer: '', bank: [] };
}
function clozeRow(r: Ref): { before: string; after: string; answer: string; bank: string[] } {
  const u = getGrammarUnitByCode(r.sourceUnit);
  return u?.format === 'cloze'
    ? { ...u.cloze.rows[r.rowRef], bank: u.cloze.wordBank }
    : { before: '', after: '', answer: '', bank: [] };
}
function rewriteRow(r: Ref): { text: string; answer: string } {
  const u = getGrammarUnitByCode(r.sourceUnit);
  return u?.format === 'rewrite' ? u.rewrite.rows[r.rowRef] : { text: '', answer: '' };
}

export function SwykAPage({ page, theme }: { page: number; theme: Theme }) {
  const s = W2_L6_SWYK;
  const cols = `1fr repeat(${TICKGRID_CATEGORIES.length}, 28mm)`;
  const tick: React.CSSProperties = { width: mm(6.5), height: mm(6.5), border: `0.45mm solid ${INK.text}`, borderRadius: mm(1.2) };
  const chip: React.CSSProperties = {
    border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), display: 'flex', alignItems: 'center',
    width: mm(44), padding: `0 ${mm(3.5)}`, height: mm(12), color: INK.text, fontSize: TYPE2.word,
  };
  const dot: React.CSSProperties = { width: mm(2.6), height: mm(2.6), borderRadius: '50%', background: theme.primary, flex: '0 0 auto' };
  const bankChip: React.CSSProperties = { border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(0.5)} ${mm(3.5)}`, fontSize: TYPE2.word, color: INK.text };
  const matches = s.matches.map(matchPair);
  const rights = [matches[1].right, matches[0].right]; // shuffled
  const b = buildRow(s.build);
  const clozes = s.clozes.map(clozeRow);
  const clozeBank = [...new Set(clozes.flatMap((c) => c.bank))];

  return (
    <WbPage page={page}>
      <Heading title="Show what you know" sub="Do one of each. Take your time." />

      <SectionLabel text="Tick the kind" theme={theme} />
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', paddingBottom: mm(1) }}>
        <span />
        {TICKGRID_CATEGORIES.map((c) => (
          <span key={c} style={{ textAlign: 'center', whiteSpace: 'nowrap', color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700 }}>{c}</span>
        ))}
      </div>
      {s.ticks.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', minHeight: mm(12), borderTop: `0.3mm solid ${theme.primary}1F` }}>
          <span style={{ color: INK.text, fontSize: TYPE2.word }}>{tickRow(r).text}</span>
          {TICKGRID_CATEGORIES.map((c) => (
            <span key={c} style={{ display: 'flex', justifyContent: 'center' }}><span style={tick} /></span>
          ))}
        </div>
      ))}

      <DottedDivider />

      <SectionLabel text="Draw a line to join each pair to its short form" theme={theme} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
        {matches.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ ...chip, justifyContent: 'space-between' }}><span>{p.left}</span><span style={dot} /></div>
            <div style={{ ...chip, gap: mm(2.5) }}><span style={dot} /><span>{rights[i]}</span></div>
          </div>
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Write the noun phrase again, grown bigger" theme={theme} />
      <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
        {b.bank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
        <span style={{ flex: '0 0 auto', color: INK.text, fontSize: TYPE2.word, paddingBottom: mm(1) }}>{b.base}</span>
        <span style={{ flex: '0 0 auto', color: theme.primary, fontSize: TYPE2.word, paddingBottom: mm(1) }}>→</span>
        <div style={{ flex: 1 }}><Line heightMm={10} /></div>
      </div>

      <DottedDivider />

      <SectionLabel text="Write the best joining word in each gap" theme={theme} />
      <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
        {clozeBank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
        {clozes.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, fontSize: TYPE2.word, lineHeight: 1.55 }}>
            <span>{c.before}</span>
            <span style={{ display: 'inline-block', minWidth: mm(26), borderBottom: `0.4mm solid ${INK.text}`, margin: `0 ${mm(3)}` }} />
            <span>{c.after}</span>
          </div>
        ))}
      </div>
    </WbPage>
  );
}

export function SwykBPage({ page, theme }: { page: number; theme: Theme }) {
  const s = W2_L6_SWYK;
  return (
    <WbPage page={page}>
      <Heading title="Show what you know" sub="Rewrite each one all in the past tense." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(9) }}>
        {s.rewrites.map((r, i) => (
          <div key={i}>
            <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(1.8)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
              {rewriteRow(r).text}
            </div>
            <Line heightMm={11} />
          </div>
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Now you write" theme={theme} />
      <div style={{ fontSize: TYPE2.word, color: INK.text, marginBottom: mm(1) }}>{s.writeTask}</div>
      <Line heightMm={12} />
      <Line heightMm={12} />
      <Line heightMm={12} />
      <div style={{ margin: `${mm(3.5)} 0` }}>
        <GoalChips theme={theme} />
      </div>

      <DottedDivider />

      <SectionLabel text="Half-term spelling test — a grown-up reads the words" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: mm(12), alignContent: 'space-evenly' }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const n = (i % 2) * 5 + Math.floor(i / 2) + 1;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(3) }}>
              <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right' }}>{n}.</span>
              <div style={{ flex: 1 }}><Line heightMm={9} /></div>
            </div>
          );
        })}
      </div>
    </WbPage>
  );
}

// ---- Answers -------------------------------------------------------------------

interface AnswerEntry { heading: string; body: string; pending?: boolean }

function bookEntries(bookNums: number[]): { title: string; entries: AnswerEntry[] }[] {
  return W2_L6_BOOKS.filter((b) => bookNums.includes(b.num)).map((b) => {
    const entries: AnswerEntry[] = [];
    for (const id of b.grammar) {
      const u = getGrammarUnit(id);
      // the revisit unit renders in the booklet as "Fix and answer"
      if (u) entries.push({ heading: u.format === 'review' ? 'Fix and answer' : u.name, body: deriveAnswers(u) });
    }
    entries.push({ heading: 'Listen and write', body: b.listen.map((s, i) => `${i + 1}. ${s}`).join(' ') });
    entries.push({ heading: 'Spelling test', body: 'Word list to come.', pending: true });
    return { title: b.title, entries };
  });
}

export function AnswersPage({ page, part, theme }: { page: number; part: 'A' | 'B'; theme: Theme }) {
  const sections = part === 'A' ? bookEntries([1, 2]) : bookEntries([3, 4]);
  const closing: AnswerEntry[] = part === 'B'
    ? [
        { heading: 'Show what you know', body: 'Statement; Command; I\'m; we\'re; the bare brown branch; and; if; gave; slipped.' },
        { heading: 'Half-term spelling test', body: 'Word list to come.', pending: true },
      ]
    : [];
  return (
    <WbPage page={page}>
      <Heading title="Answers" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(5) }}>
        {sections.map((s) => (
          <div key={s.title}>
            <SectionLabel text={s.title} theme={theme} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: mm(2) }}>
              {s.entries.map((e, i) => (
                <div key={i} style={{ fontSize: TYPE2.body, lineHeight: 1.45 }}>
                  <span style={{ color: theme.accentText }}>{e.heading} </span>
                  <span style={{ color: e.pending ? INK.faint : INK.text }}>{e.body}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {closing.length > 0 && (
          <div>
            <SectionLabel text="Show what you know" theme={theme} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: mm(2) }}>
              {closing.map((e, i) => (
                <div key={i} style={{ fontSize: TYPE2.body, lineHeight: 1.45 }}>
                  <span style={{ color: theme.accentText }}>{e.heading} </span>
                  <span style={{ color: e.pending ? INK.faint : INK.text }}>{e.body}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </WbPage>
  );
}
