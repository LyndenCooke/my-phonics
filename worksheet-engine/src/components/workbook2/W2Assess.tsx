import React from 'react';
import { getGrammarUnitByCode, getGrammarUnit } from '@/lib/grammarRegistry';
import { TICKGRID_CATEGORIES } from '@/data/grammarSchema';
import { deriveAnswers } from '@/components/grammar/booklet/deriveAnswers';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, Line, TYPE2, type Theme } from '@/components/workbook2/BookStyle';
import { W2_L6_BOOKS, W2_L6_SWYK, W2_L6_SPELLINGS } from '@/data/workbook2/l6';

// ---------------------------------------------------------------------------
// W2 assessment + the grown-up back matter. The week-6 event is Show what
// you know A/B (page B carries the half-term spelling test). The back of the
// booklet is ADULT-FACING and deliberately small — three pages, so a parent
// never needs a separate teacher booklet:
//   Answers (one page, two columns, headed by book)
//   Spelling words (the test lists, read aloud by the grown-up)
//   For grown-ups (how the booklet works, in eight short points)
// Every assessment item is an approved row reused BY POINTER.
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
      {/* the four task groups spread evenly down the page — equal cushions
          around each dotted divider, no crowding and no dead foot space */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
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
        </div>

        <DottedDivider />

        <div>
          <SectionLabel text="Draw a line to join each pair to its short form" theme={theme} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
            {matches.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ ...chip, justifyContent: 'space-between' }}><span>{p.left}</span><span style={dot} /></div>
                <div style={{ ...chip, gap: mm(2.5) }}><span style={dot} /><span>{rights[i]}</span></div>
              </div>
            ))}
          </div>
        </div>

        <DottedDivider />

        <div>
          <SectionLabel text="Write the noun phrase again, grown bigger" theme={theme} />
          <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
            {b.bank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
            <span style={{ flex: '0 0 auto', color: INK.text, fontSize: TYPE2.word, paddingBottom: mm(1) }}>{b.base}</span>
            <span style={{ flex: '0 0 auto', color: theme.primary, fontSize: TYPE2.word, paddingBottom: mm(1) }}>→</span>
            <div style={{ flex: 1 }}><Line heightMm={10} /></div>
          </div>
        </div>

        <DottedDivider />

        <div>
          <SectionLabel text="Write the best joining word in each gap" theme={theme} />
          <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
            {clozeBank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: mm(7) }}>
            {clozes.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, fontSize: TYPE2.word, lineHeight: 1.55 }}>
                <span>{c.before}</span>
                <span style={{ display: 'inline-block', minWidth: mm(30), borderBottom: `0.5mm solid ${INK.text}`, margin: `0 ${mm(3)}` }} />
                <span>{c.after}</span>
              </div>
            ))}
          </div>
        </div>
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

// ---- The grown-up back matter ----------------------------------------------
// Adult-facing pages are exempt from the child type scale; they use a compact
// 12pt so the whole key fits one two-column page.

const ADULT = '12pt';

interface AnswerEntry { heading: string; body: string }

function bookEntries(): { title: string; entries: AnswerEntry[] }[] {
  const sections = W2_L6_BOOKS.map((b) => {
    const entries: AnswerEntry[] = [];
    for (const id of b.grammar) {
      const u = getGrammarUnit(id);
      if (u) entries.push({ heading: u.format === 'review' ? 'Fix and answer' : u.name, body: deriveAnswers(u) });
    }
    entries.push({ heading: 'Listen and write', body: b.listen.map((s, i) => `${i + 1}. ${s}`).join(' ') });
    return { title: b.title, entries };
  });
  sections.push({
    title: 'Show what you know',
    entries: [
      { heading: 'Pages A and B', body: "Statement; Command; I'm; we're; the bare, brown branch; and; if; gave; slipped." },
    ],
  });
  return sections;
}

/** Answers — ONE adult page, two columns, headed by book so pages and
 *  questions line up at a glance. Spelling lists live on the next page. */
export function AnswersPage({ page, theme }: { page: number; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title="Answers" sub="For grown-ups. Sections follow the order of the book." />
      <div style={{ columnCount: 2, columnGap: mm(10), columnFill: 'balance' }}>
        {bookEntries().map((s) => (
          <div key={s.title} style={{ breakInside: 'avoid', marginBottom: mm(5) }}>
            <SectionLabel text={s.title} theme={theme} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: mm(2) }}>
              {s.entries.map((e, i) => (
                <div key={i} style={{ fontSize: ADULT, lineHeight: 1.45 }}>
                  <span style={{ color: theme.accentText }}>{e.heading} </span>
                  <span style={{ color: INK.text }}>{e.body}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </WbPage>
  );
}

/** Spelling words — the test lists the grown-up reads aloud. The child's
 *  test pages never show these. */
export function SpellingWordsPage({ page, theme }: { page: number; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title="Spelling words" sub="For grown-ups. Read the ten words aloud, one at a time, on the test day." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {W2_L6_SPELLINGS.map((s) => (
          <div key={s.title}>
            <SectionLabel text={s.title} theme={theme} />
            <div style={{ fontSize: TYPE2.word, color: INK.text, lineHeight: 1.6 }}>
              {s.words.join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </WbPage>
  );
}

const GROWN_UP_POINTS: { title: string; body: string }[] = [
  { title: 'Little and often', body: 'One page a day, about five minutes, after the day\'s reading or sound book. Never push on to a second page.' },
  { title: 'The order matters', body: 'Each book\'s pages run in teaching order: grammar, Sentences, Answer it, more grammar, Use your grammar, Spell it, Big write, then Handwriting in its own slot.' },
  { title: 'Spell it works twice', body: 'Practise the words the day before the test. On test day, cover the top half and read the words from the Spelling words page.' },
  { title: 'The first one is done', body: 'On grammar pages the first item is completed in purple. Talk it through together before the child does the rest.' },
  { title: 'Listen and write', body: 'Read the sentence aloud twice. The child says it back, taps a finger per word, then writes it. The sentences are in the Answers.' },
  { title: 'The big write is the win', body: 'The picture is the prompt. Spelling mistakes are fine here; ideas first, then check against the writing goals together.' },
  { title: 'Handwriting', body: 'The child traces the grey writing and keeps going to the end of each line. Little and neat beats lots and rushed.' },
  { title: 'The last week', body: 'Show what you know and the half-term test are a check, not an exam. Secure here means ready for Level 7.' },
];

/** For grown-ups — the whole teacher guide on one page. */
export function GrownUpsPage({ page, theme }: { page: number; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title="For grown-ups" sub="How this workbook fits the six weeks of Level 6." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {GROWN_UP_POINTS.map((p) => (
          <div key={p.title}>
            <span style={{ color: theme.accentText, fontSize: ADULT, fontWeight: 700 }}>{p.title}. </span>
            <span style={{ color: INK.text, fontSize: ADULT, lineHeight: 1.5 }}>{p.body}</span>
          </div>
        ))}
      </div>
    </WbPage>
  );
}
