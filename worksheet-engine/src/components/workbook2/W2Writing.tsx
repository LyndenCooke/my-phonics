import React from 'react';
import type { GrammarUnit, MatchUnit, RewriteUnit } from '@/data/grammarSchema';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, StoryScene, SeatedText, Line, TYPE2, type Theme } from '@/components/workbook2/BookStyle';

// ---------------------------------------------------------------------------
// W2 writing pages — grammar (NO Watch-first box: the FIRST ITEM is shown
// done, in the accent colour, and the instruction line says so), answer-it
// (comprehension card layout, questions still an authoring dependency) and
// the big write (one colour story scene + writing goals + lines; no plan
// box). Approved unit content renders verbatim.
// ---------------------------------------------------------------------------

// ---- grammar: match (contractions) ------------------------------------------
// Two chip columns; the first pair is pre-joined with an accent line so the
// example lives inside the task itself.

// Narrow chips at the page edges with the join dots tight against the words,
// leaving the whole middle of the page as the child's drawing space.
const ROW_H = 14;
const ROW_GAP = 17;
const CHIP_W = 44;

function MatchBody({ unit, theme }: { unit: MatchUnit; theme: Theme }) {
  const pairs = unit.match.pairs;
  const rights = unit.match.rightShuffled ?? pairs.map((p) => p.right);
  const exampleRightRow = rights.indexOf(pairs[0].right);

  const chip: React.CSSProperties = {
    border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), display: 'flex', alignItems: 'center',
    width: mm(CHIP_W), padding: `0 ${mm(3.5)}`, height: mm(ROW_H), color: INK.text, fontSize: TYPE2.word, background: '#fff',
  };
  const dot: React.CSSProperties = { width: mm(2.6), height: mm(2.6), borderRadius: '50%', background: theme.primary, flex: '0 0 auto' };

  // dot CENTRES, exactly: chip padding 3.5 + dot radius 1.3
  const yOf = (row: number) => row * (ROW_H + ROW_GAP) + ROW_H / 2;
  const x1 = CHIP_W - 3.5 - 1.3; // the left chips' dot centres
  const x2 = 182 - CHIP_W + 3.5 + 1.3; // the right chips' dot centres

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(ROW_GAP) }}>
        {pairs.map((p, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ ...chip, justifyContent: 'space-between' }}><span>{p.left}</span><span style={dot} /></div>
            <div style={{ ...chip, gap: mm(2.5) }}><span style={dot} /><span>{rights[i]}</span></div>
          </div>
        ))}
      </div>
      {/* the worked example: pair 1 joined for the child, accent colour */}
      <svg
        viewBox={`0 0 182 ${pairs.length * (ROW_H + ROW_GAP)}`}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <line x1={x1} y1={yOf(0)} x2={x2} y2={yOf(exampleRightRow)} stroke={theme.accentText} strokeWidth={0.8} strokeLinecap="round" />
      </svg>
    </div>
  );
}

// ---- grammar: rewrite (tense) -----------------------------------------------
// Source strip + one line per row; row 1's line carries the corrected
// sentence in the accent colour — the example sits on the line itself.

function RewriteBody({ unit, theme }: { unit: RewriteUnit; theme: Theme }) {
  // each block = source strip + ITS write line tucked close beneath; a clear,
  // definite gap separates the blocks. The worked answer SITS ON its line.
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(11) }}>
      {unit.rewrite.rows.map((r, i) => (
        <div key={i}>
          <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(1.8)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
            {r.text}
          </div>
          {i === 0 ? (
            <SeatedText text={r.answer} color={theme.accentText} heightMm={11} />
          ) : (
            <Line heightMm={11} />
          )}
        </div>
      ))}
    </div>
  );
}

export function GrammarPage({ page, unit, theme }: { page: number; unit: GrammarUnit; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title={unit.name} sub={`${unit.doInstruction}. The first one is done for you.`} />
      <div style={{ flex: '0 0 auto', paddingTop: mm(2) }}>
        {unit.format === 'match' && <MatchBody unit={unit} theme={theme} />}
        {unit.format === 'rewrite' && <RewriteBody unit={unit} theme={theme} />}
      </div>

      <DottedDivider />

      <SectionLabel text="Now you write" theme={theme} />
      {unit.apply && <div style={{ color: INK.text, fontSize: TYPE2.body, marginBottom: mm(1) }}>{unit.apply.prompt}</div>}
      <Line heightMm={12} />
      <Line heightMm={12} />
      <Line heightMm={12} />
      <div style={{ marginTop: mm(3.5) }}>
        <GoalChips theme={theme} />
      </div>
      {/* remaining white space lives at the foot, book-style */}
      <div style={{ flex: 1 }} />
    </WbPage>
  );
}

// ---- answer it in a sentence -------------------------------------------------
// The book's Talk About It card (accent left bar + small-caps category) with
// write lines. The questions remain an authoring dependency; the slot is the
// card itself, clearly flagged.

export function AnswerItPage({
  page,
  questions,
  theme,
}: {
  page: number;
  /** approved question text, or null while the set is awaited. */
  questions: (string | null)[];
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Answer it in a sentence" sub="Read the question, then answer it in a full sentence." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {questions.map((q, i) => (
          <div key={i}>
            <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(2.5)} ${mm(4)}` }}>
              <div style={{ color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: mm(1) }}>
                Question {i + 1}
              </div>
              <div style={{ fontSize: TYPE2.word, color: q ? INK.text : INK.faint }}>
                {q ?? 'Question to come.'}
              </div>
            </div>
            <Line heightMm={12} />
            <Line heightMm={12} />
          </div>
        ))}
      </div>
      <div style={{ flex: '0 0 auto', marginTop: mm(3) }}>
        <GoalChips theme={theme} />
      </div>
    </WbPage>
  );
}

// ---- big write ----------------------------------------------------------------
// One colour story scene in a framed panel, the writing goals, then the
// lines. A paragraph variant takes two scenes with four lines each.

export function BigWritePage({
  page,
  prompt,
  sceneSrc,
  lines,
  theme,
}: {
  page: number;
  prompt: string;
  sceneSrc: string;
  lines: number;
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Big write" />
      {/* the task itself is the biggest text on the page after the heading */}
      <div style={{ fontSize: TYPE2.word, color: INK.text, margin: `0 0 ${mm(3.5)}` }}>{prompt}</div>
      <StoryScene src={sceneSrc} heightMm={62} />
      <div style={{ margin: `${mm(3.5)} 0` }}>
        <GoalChips theme={theme} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {Array.from({ length: lines }).map((_, i) => <Line key={i} heightMm={12.5} />)}
      </div>
    </WbPage>
  );
}

/** The paragraph variant: scene + four lines, then scene + four lines. */
export function BigWriteParagraphPage({
  page,
  prompt,
  scenes,
  theme,
}: {
  page: number;
  prompt: string;
  scenes: string[];
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Big write" sub={prompt} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {scenes.slice(0, 2).map((src, i) => (
          <div key={i}>
            <StoryScene src={src} heightMm={46} />
            <div style={{ marginTop: mm(1) }}>
              {Array.from({ length: 4 }).map((_, j) => <Line key={j} heightMm={12} />)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: '0 0 auto', marginTop: mm(3) }}>
        <GoalChips theme={theme} />
      </div>
    </WbPage>
  );
}
