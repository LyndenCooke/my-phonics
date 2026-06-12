import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { getGrammarUnit } from '@/lib/grammarRegistry';
import type { GrammarUnit } from '@/data/grammarSchema';
import { FONT, INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, type Theme } from '@/components/workbook2/BookStyle';
import { SpellItPage, SentencesPage, HandwritingPage, SoundPage } from '@/components/workbook2/W2Skills';
import { GrammarPage, GrammarUsePage, AnswerItPage, BigWritePage, BigWriteSequencePage } from '@/components/workbook2/W2Writing';
import { SwykAPage, SwykBPage, AnswersPage, SpellingWordsPage, GrownUpsPage, RevisitPage } from '@/components/workbook2/W2Assess';
import { getW2Level } from '@/data/workbook2/registry';
import type { W2BookData, W2LevelSpec } from '@/data/workbook2/levels';

// ---------------------------------------------------------------------------
// W2Booklet — the whole-level workbook for ANY level: book sections in
// teaching order, the week-6 assessment (Show what you know A/B with the
// half-term test), then the grown-up back matter (Answers · Spelling words ·
// For grown-ups). Page numbers and contents lines are computed here, never
// stored.
//
// Per-book page order (one ~5-minute page per day; spelling sits at the END
// of the book's run — practise, then the test the day before the big write):
//   grammar A · Sentences · [Answer it] · grammar B · [grammar C]
//   · [Use your grammar] · [Fix and answer] · Spell it · Big write · Handwriting
// Square-bracketed pages appear per the level spec and the book's data.
// At L1-L3 the book's single-sound pages WEAVE through that order — sound
// first, then a writing page, then the next sound (per Lynden 2026-06-12):
//   sound 1 · grammar A · sound 2 · Sentences · sound 3 · Spell it · ...
// ---------------------------------------------------------------------------

function bookPages(book: W2BookData, spec: W2LevelSpec): string[] {
  const pages: string[] = [];
  if (book.grammar.length > 0) pages.push('gr0');
  pages.push('sentences');
  if (spec.answerIt && book.questions) pages.push('answerit');
  for (let i = 1; i < book.grammar.length; i += 1) pages.push(`gr${i}`);
  if (book.useGrammar) pages.push('usegrammar');
  if (book.revisit) pages.push('revisit');
  pages.push('spell', 'bigwrite', 'handwriting');

  // weave the single-sound pages in: one sound, one writing page, repeat
  const sounds = (spec.soundsPage && book.soundPages) ? book.soundPages : [];
  if (!sounds.length) return pages;
  const woven: string[] = [];
  const n = Math.max(sounds.length, pages.length);
  for (let i = 0; i < n; i += 1) {
    if (i < sounds.length) woven.push(`sound${i}`);
    if (i < pages.length) woven.push(pages[i]);
  }
  return woven;
}

/** A revisit unit renders under its sequence-doc title. */
function unitFor(book: W2BookData, idx: number): GrammarUnit {
  const unit = getGrammarUnit(book.grammar[idx]);
  if (!unit) throw new Error(`Unknown grammar unit ${book.grammar[idx]}`);
  if (unit.format === 'review') {
    return { ...unit, name: 'Fix and answer', doInstruction: 'Do one of each' };
  }
  return unit;
}

/** Child-facing page name per kind, for the contents sub-lines. */
function pageName(book: W2BookData, kind: string): string {
  if (kind.startsWith('sound')) return `The sound ${book.soundPages![Number(kind.slice(5))].grapheme}`;
  if (kind === 'spell') return 'Spell it';
  if (kind === 'sentences') return 'Sentences';
  if (kind === 'answerit') return 'Answer it in a sentence';
  if (kind === 'usegrammar') return 'Use your grammar';
  if (kind === 'revisit') return 'Fix and answer';
  if (kind === 'bigwrite') return 'Big write';
  if (kind === 'handwriting') return 'Handwriting';
  if (kind.startsWith('gr')) return unitFor(book, Number(kind.slice(2))).name;
  return '';
}

function CoverPlaceholder({ theme, level }: { theme: Theme; level: number }) {
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
      <div style={{ color: '#fff', fontSize: '21pt' }}>Level {level} · {theme.name}</div>
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
            <div style={{ display: 'flex', alignItems: 'baseline', color: INK.text, fontSize: '17pt' }}>
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
  const data = getW2Level(level);
  const spec = data.spec;
  const theme = getLevelTheme(level);

  // assembly: compute page numbers
  let page = 3;
  const sections: { book: W2BookData; start: number; pages: string[] }[] = [];
  for (const book of data.books) {
    const pages = bookPages(book, spec);
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
      <CoverPlaceholder theme={theme} level={level} />
      <ContentsPage lines={contents} theme={theme} />
      {sections.map(({ book, start, pages }) => (
        <React.Fragment key={book.num}>
          {pages.map((kind, i) => {
            const p = start + i;
            if (kind.startsWith('sound')) return <SoundPage key={kind} page={p} data={book.soundPages![Number(kind.slice(5))]} theme={theme} hwX={spec.hwXMm} />;
            if (kind === 'spell') return <SpellItPage key={kind} page={p} practise={book.spellPractise} theme={theme} pitch={spec.pitchMm} testWords={spec.testWords} />;
            if (kind === 'sentences') return <SentencesPage key={kind} page={p} hold={book.hold} listenSlots={2} theme={theme} pitch={spec.pitchMm} />;
            if (kind === 'answerit') return <AnswerItPage key={kind} page={p} questions={book.questions!} theme={theme} pitch={spec.pitchMm} />;
            if (kind === 'revisit') return <RevisitPage key={kind} page={p} groups={book.revisit!} theme={theme} pitch={spec.pitchMm} />;
            if (kind.startsWith('gr')) return <GrammarPage key={kind} page={p} unit={unitFor(book, Number(kind.slice(2)))} theme={theme} pitch={spec.pitchMm} />;
            if (kind === 'usegrammar') return <GrammarUsePage key={kind} page={p} sceneSrc={book.useGrammar!.scene} scenePos={book.useGrammar!.pos} chips={book.useGrammar!.chips} lines={6} theme={theme} pitch={spec.pitchMm} />;
            if (kind === 'bigwrite') {
              return book.bigWrite.scenes
                ? <BigWriteSequencePage key={kind} page={p} prompt={book.bigWrite.prompt} scenes={book.bigWrite.scenes} lines={spec.bigWriteLines} theme={theme} pitch={spec.pitchMm} />
                : <BigWritePage key={kind} page={p} prompt={book.bigWrite.prompt} sceneSrc={book.bigWrite.scene} scenePos={book.bigWrite.pos} lines={spec.bigWriteLines} theme={theme} pitch={spec.pitchMm} />;
            }
            if (kind === 'handwriting') return <HandwritingPage key={kind} page={p} ladders={book.ladders} theme={theme} hwX={spec.hwXMm} />;
            return null;
          })}
        </React.Fragment>
      ))}
      <SwykAPage page={swykA} data={data} theme={theme} />
      <SwykBPage page={swykB} data={data} theme={theme} />
      <AnswersPage page={answers} data={data} theme={theme} />
      <SpellingWordsPage page={spellings} data={data} theme={theme} />
      <GrownUpsPage page={grownUps} data={data} theme={theme} />
    </>
  );
}
