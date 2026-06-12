import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { getGrammarUnit } from '@/lib/grammarRegistry';
import type { GrammarUnit } from '@/data/grammarSchema';
import { FONT, INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, TYPE2, type Theme } from '@/components/workbook2/BookStyle';
import { SpellItPage, SentencesPage, HandwritingPage } from '@/components/workbook2/W2Skills';
import { GrammarPage, GrammarUsePage, AnswerItPage, BigWritePage } from '@/components/workbook2/W2Writing';
import { SwykAPage, SwykBPage, AnswersPage, SpellingWordsPage, GrownUpsPage } from '@/components/workbook2/W2Assess';
import { W2_L6_BOOKS, type W2Book } from '@/data/workbook2/l6';

// ---------------------------------------------------------------------------
// W2Booklet — the whole-level workbook, one booklet that lives with the child
// for all of Level 6: four book sections in teaching order, the week-6
// assessment (Show what you know A/B with the half-term test), then the
// grown-up back matter (Answers · Spelling words · For grown-ups — three
// pages, so a parent never needs a separate teacher booklet). Page numbers
// and the contents lines are computed here, never stored.
//
// Per-book page order (one ~5-minute page per day; spelling sits at the END
// of the book's run — practise, then the test the day before the big write):
//   grammar A · Sentences · [Answer it] · grammar B · [grammar C]
//   · Use your grammar · Spell it · Big write · Handwriting
// ---------------------------------------------------------------------------

function bookPages(book: W2Book): string[] {
  const pages = ['gr0', 'sentences'];
  if (book.questions) pages.push('answerit');
  for (let i = 1; i < book.grammar.length; i += 1) pages.push(`gr${i}`);
  pages.push('usegrammar', 'spell', 'bigwrite', 'handwriting');
  return pages;
}

/** The B4 revisit unit renders under its sequence-doc title. */
function unitFor(book: W2Book, idx: number): GrammarUnit {
  const unit = getGrammarUnit(book.grammar[idx]);
  if (!unit) throw new Error(`Unknown grammar unit ${book.grammar[idx]}`);
  if (unit.format === 'review') {
    return { ...unit, name: 'Fix and answer', doInstruction: 'Do one of each' };
  }
  return unit;
}

/** Child-facing page name per kind, for the contents sub-lines. */
function pageName(book: W2Book, kind: string): string {
  if (kind === 'spell') return 'Spell it';
  if (kind === 'sentences') return 'Sentences';
  if (kind === 'answerit') return 'Answer it in a sentence';
  if (kind === 'usegrammar') return 'Use your grammar';
  if (kind === 'bigwrite') return 'Big write';
  if (kind === 'handwriting') return 'Handwriting';
  if (kind.startsWith('gr')) return unitFor(book, Number(kind.slice(2))).name;
  return '';
}

function CoverPlaceholder({ theme }: { theme: Theme }) {
  return (
    <div
      className="page"
      style={{
        position: 'relative', width: mm(210), height: mm(297), background: theme.primary,
        overflow: 'hidden', fontFamily: FONT.body, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: mm(6),
      }}
    >
      <div style={{ color: '#fff', fontSize: '44pt', fontWeight: 700 }}>Workbook</div>
      <div style={{ color: '#fff', fontSize: TYPE2.heading }}>Level 6 · Building Fluency</div>
    </div>
  );
}

interface ContentsLine { label: string; pages: string; sub?: string }

function ContentsPage({ lines, theme }: { lines: ContentsLine[]; theme: Theme }) {
  return (
    <WbPage page={2}>
      <Heading title="Contents" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {lines.map((l, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'baseline', color: INK.text, fontSize: TYPE2.word }}>
              <span>{l.label}</span>
              <span style={{ flex: 1, margin: `0 ${mm(3)}`, borderBottom: `0.3mm dotted ${INK.rule}`, transform: 'translateY(-1mm)' }} />
              <span style={{ color: theme.accentText }}>{l.pages}</span>
            </div>
            {l.sub && (
              <div style={{ marginTop: mm(1.5), paddingLeft: mm(6), color: INK.muted, fontSize: '12pt', lineHeight: 1.5 }}>
                {l.sub}
              </div>
            )}
          </div>
        ))}
      </div>
    </WbPage>
  );
}

export default function W2Booklet({ level }: { level: number }) {
  if (level !== 6) throw new Error(`W2 booklet data exists for level 6 only (got ${level}).`);
  const theme = getLevelTheme(level);

  // assembly: compute page numbers
  let page = 3;
  const sections: { book: W2Book; start: number; pages: string[] }[] = [];
  for (const book of W2_L6_BOOKS) {
    const pages = bookPages(book);
    sections.push({ book, start: page, pages });
    page += pages.length;
  }
  const swykA = page;
  const swykB = page + 1;
  const answers = page + 2;
  const spellings = page + 3;
  const grownUps = page + 4;

  const contents: ContentsLine[] = [
    ...sections.map((s) => ({
      label: s.book.title,
      pages: `${s.start}-${s.start + s.pages.length - 1}`,
      sub: s.pages.map((k) => pageName(s.book, k)).join(' · '),
    })),
    { label: 'Show what you know', pages: `${swykA}-${swykB}`, sub: 'Two pages and the half-term spelling test' },
    { label: 'Answers', pages: String(answers) },
    { label: 'Spelling words', pages: String(spellings) },
    { label: 'For grown-ups', pages: String(grownUps) },
  ];

  return (
    <>
      <CoverPlaceholder theme={theme} />
      <ContentsPage lines={contents} theme={theme} />
      {sections.map(({ book, start, pages }) => (
        <React.Fragment key={book.num}>
          {pages.map((kind, i) => {
            const p = start + i;
            if (kind === 'spell') return <SpellItPage key={kind} page={p} practise={book.spellPractise} theme={theme} />;
            if (kind === 'sentences') return <SentencesPage key={kind} page={p} hold={book.hold} listenSlots={2} theme={theme} />;
            if (kind === 'answerit') return <AnswerItPage key={kind} page={p} questions={book.questions!} theme={theme} />;
            if (kind.startsWith('gr')) return <GrammarPage key={kind} page={p} unit={unitFor(book, Number(kind.slice(2)))} theme={theme} />;
            if (kind === 'usegrammar') return <GrammarUsePage key={kind} page={p} sceneSrc={book.useGrammar.scene} scenePos={book.useGrammar.pos} chips={book.useGrammar.chips} lines={6} theme={theme} />;
            if (kind === 'bigwrite') return <BigWritePage key={kind} page={p} prompt={book.bigWrite.prompt} sceneSrc={book.bigWrite.scene} scenePos={book.bigWrite.pos} lines={9} theme={theme} />;
            if (kind === 'handwriting') return <HandwritingPage key={kind} page={p} ladders={book.ladders} theme={theme} />;
            return null;
          })}
        </React.Fragment>
      ))}
      <SwykAPage page={swykA} theme={theme} />
      <SwykBPage page={swykB} theme={theme} />
      <AnswersPage page={answers} theme={theme} />
      <SpellingWordsPage page={spellings} theme={theme} />
      <GrownUpsPage page={grownUps} theme={theme} />
    </>
  );
}
