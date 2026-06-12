import React from 'react';
import type { GrammarUnit, MatchUnit, RewriteUnit, TickGridUnit, ClozeUnit, BuildUnit, CircleUnit, ReviewUnit } from '@/data/grammarSchema';
import { TICKGRID_CATEGORIES } from '@/data/grammarSchema';
import { resolveReviewText } from '@/lib/grammarRegistry';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, StoryScene, SeatedText, SeatedTextLines, Line, TYPE2, RULE_W, type Theme } from '@/components/workbook2/BookStyle';

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
const ROW_H = 16;
const ROW_GAP = 15;
const CHIP_W = 56;

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
  // NON-NEGOTIABLE: the example line runs dot centre to dot centre. The SVG
  // viewBox must equal the REAL column height (rows + gaps, no trailing gap)
  // or the line scales short of the dots.
  const columnH = pairs.length * ROW_H + (pairs.length - 1) * ROW_GAP;
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
        viewBox={`0 0 182 ${columnH}`}
        preserveAspectRatio="none"
        style={{ position: 'absolute', left: 0, top: 0, width: mm(182), height: mm(columnH), pointerEvents: 'none' }}
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
  // each block = source strip + ITS write line tucked close beneath; the
  // blocks spread evenly down the page. The worked answer SITS ON its lines.
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: mm(8) }}>
      {unit.rewrite.rows.map((r, i) => (
        <div key={i}>
          <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(1.5)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
            {r.text}
          </div>
          {/* clear air between the prompt strip and the writing — the line
              is the main thing in the block */}
          <div style={{ marginTop: mm(4) }}>
            {i === 0 ? (
              <SeatedTextLines text={r.answer} color={theme.accentText} />
            ) : (
              <Line />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- grammar: tickgrid (four kinds of sentence) -------------------------------
// One header row of category words; the first row's correct box carries the
// worked tick in accent.

function TickRows({ unit, theme, from, to }: { unit: TickGridUnit; theme: Theme; from: number; to: number }) {
  const cats = unit.tickgrid.categories ?? unit.tickgrid.columns;
  const cols = `1fr repeat(${cats.length}, 28mm)`;
  const sep = `0.3mm solid ${theme.primary}1F`;
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: cols, alignItems: 'end', paddingBottom: mm(1.5) }}>
        <span />
        {cats.map((c) => (
          <span key={c} style={{ textAlign: 'center', whiteSpace: 'nowrap', color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700 }}>{c}</span>
        ))}
      </div>
      {unit.tickgrid.rows.slice(from, to).map((r, idx) => {
        const i = from + idx;
        return (
          <div key={i} style={{ flex: 1, display: 'grid', gridTemplateColumns: cols, alignItems: 'center', borderTop: sep }}>
            <span style={{ color: INK.text, fontSize: TYPE2.word, padding: `${mm(1)} 0`, lineHeight: 1.35 }}>{r.text}</span>
            {cats.map((c) => (
              <span key={c} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <span style={{ width: mm(6.5), height: mm(6.5), border: `0.45mm solid ${INK.text}`, borderRadius: mm(1.2), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i === 0 && r.answer === c && (
                    <svg width={mm(5)} height={mm(5)} viewBox="0 0 5 5"><path d="M0.8,2.6 L2,3.9 L4.3,1" stroke={theme.accentText} strokeWidth={0.7} fill="none" strokeLinecap="round" /></svg>
                  )}
                </span>
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

/** One page at the 24pt middle size: all six rows. */
function TickBody({ unit, theme }: { unit: TickGridUnit; theme: Theme }) {
  return <TickRows unit={unit} theme={theme} from={0} to={unit.tickgrid.rows.length} />;
}

// ---- grammar: cloze (joining words) -------------------------------------------
// Word-bank chips, then sentences with a write-in gap; the first gap carries
// its answer in accent, seated on the gap line.

function ClozeBody({ unit, theme }: { unit: ClozeUnit; theme: Theme }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', gap: mm(4), flexWrap: 'wrap', justifyContent: 'center', marginBottom: mm(4) }}>
        {unit.cloze.wordBank.map((w) => (
          <span key={w} style={{ border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(1)} ${mm(5)}`, fontSize: TYPE2.word, color: INK.text }}>{w}</span>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {unit.cloze.rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, fontSize: TYPE2.word, lineHeight: 1.6 }}>
            <span>{r.before}</span>
            <span style={{ position: 'relative', display: 'inline-block', minWidth: mm(30), height: '1em', borderBottom: `${RULE_W} solid ${INK.text}`, margin: `0 ${mm(3)}` }}>
              {/* the worked answer SITS ON the gap line, at the example size */}
              {i === 0 && (
                <span style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translate(-50%, 4%)', fontSize: TYPE2.example, lineHeight: 1, color: theme.accentText, whiteSpace: 'nowrap' }}>{r.answer}</span>
              )}
            </span>
            <span>{r.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- grammar: build (grow the noun phrase) -------------------------------------
// Word-bank chips, then base phrase → write line; the first row's grown
// phrase is written on its line in accent.

function BuildBody({ unit, theme }: { unit: BuildUnit; theme: Theme }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', gap: mm(4), flexWrap: 'wrap', justifyContent: 'center', marginBottom: mm(4) }}>
        {unit.build.wordBank.map((w) => (
          <span key={w} style={{ border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(1)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>{w}</span>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(9) }}>
        {unit.build.rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
            <span style={{ flex: '0 0 auto', width: mm(62), color: INK.text, fontSize: TYPE2.word, paddingBottom: mm(1) }}>{r.base}</span>
            <span style={{ flex: '0 0 auto', color: theme.primary, fontSize: TYPE2.word, paddingBottom: mm(1) }}>→</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {i === 0 ? <SeatedText text={r.answer} color={theme.accentText} widthMm={105} /> : <Line />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- grammar: circle (adjectives and adverbs) -----------------------------------
// The first row is marked for the child: adjective circled, adverb underlined.

function CircleBody({ unit, theme }: { unit: CircleUnit; theme: Theme }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
      {unit.circle.rows.map((r, i) => {
        if (i !== 0) {
          return <div key={i} style={{ color: INK.text, fontSize: TYPE2.word }}>{r.text}</div>;
        }
        const adj = r.finds.find((f) => f.target === 'adjective')?.word;
        const adv = r.finds.find((f) => f.target === 'adverb')?.word;
        return (
          <div key={i} style={{ color: INK.text, fontSize: TYPE2.word, lineHeight: 1.5 }}>
            {r.text.split(/(\s+)/).map((tk, j) => {
              const bare = tk.replace(/[.,!?]/g, '');
              if (adj && bare === adj) {
                return <span key={j} style={{ border: `0.6mm solid ${theme.accentText}`, borderRadius: '50%', padding: `0 ${mm(2)}`, color: theme.accentText }}>{tk}</span>;
              }
              if (adv && bare === adv) {
                return <span key={j} style={{ borderBottom: `0.8mm solid ${theme.accentText}`, color: theme.accentText }}>{tk}</span>;
              }
              return <span key={j}>{tk}</span>;
            })}
          </div>
        );
      })}
    </div>
  );
}

// ---- grammar: review (fix and answer, B4) ----------------------------------------
// One of each skill, items reused by pointer; task label + item + write line.

function ReviewBody({ unit, theme }: { unit: ReviewUnit; theme: Theme }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(7) }}>
      {unit.review.items.map((it, i) => (
        <div key={i}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: mm(4), marginBottom: mm(0.5) }}>
            <span style={{ flex: '0 0 auto', color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{it.task}</span>
            <span style={{ color: INK.text, fontSize: TYPE2.word }}>{resolveReviewText(it.sourceUnit, it.rowRef)}</span>
          </div>
          <Line />
        </div>
      ))}
    </div>
  );
}

export function GrammarPage({ page, unit, theme }: { page: number; unit: GrammarUnit; theme: Theme }) {
  const worked = unit.format !== 'review';
  const instruction = unit.doInstruction.replace(/\.$/, '');
  return (
    <WbPage page={page}>
      <Heading title={unit.name} sub={worked ? `${instruction}. The first one is done for you.` : `${instruction}.`} />
      {/* the activity fills the page: stretching formats (cloze, circle,
          build) spread their rows down it; fixed-geometry formats (match,
          tickgrid, rewrite, review) sit with even cushions — either way the
          write section lands at the foot with no dead space */}
      <div style={{ flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingTop: mm(2) }}>
        {unit.format === 'match' && <MatchBody unit={unit} theme={theme} />}
        {unit.format === 'rewrite' && <RewriteBody unit={unit} theme={theme} />}
        {unit.format === 'tickgrid' && <TickBody unit={unit} theme={theme} />}
        {unit.format === 'cloze' && <ClozeBody unit={unit} theme={theme} />}
        {unit.format === 'build' && <BuildBody unit={unit} theme={theme} />}
        {unit.format === 'circle' && <CircleBody unit={unit} theme={theme} />}
        {unit.format === 'review' && <ReviewBody unit={unit} theme={theme} />}
      </div>

      <DottedDivider />

      <SectionLabel text="Now you write" theme={theme} />
      {unit.apply && <div style={{ color: INK.text, fontSize: TYPE2.body, marginBottom: mm(1) }}>{unit.apply.prompt}</div>}
      <Line />
      <Line />
      <Line />
      <div style={{ marginTop: mm(3.5) }}>
        <GoalChips theme={theme} />
      </div>
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
            {/* the writing is the focus: clear air after the question card */}
            <div style={{ marginTop: mm(5) }}>
              <Line />
              <Line />
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

// ---- use your grammar ---------------------------------------------------------
// The learn-to-use bridge (RWI Get Writing's move): the fortnight's grammar
// comes back as WORDS TO USE in the child's own sentences about the story.
// Every chip word is reused verbatim from the approved units (contractions
// from G-L6.6, corrected past-tense verbs from G-L6.7) — no new content.

export function GrammarUsePage({
  page,
  sceneSrc,
  scenePos,
  chips,
  lines,
  theme,
}: {
  page: number;
  sceneSrc: string;
  scenePos?: string;
  /** approved words to use, by pointer (unit answers, verbatim). */
  chips: string[];
  lines: number;
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Use your grammar" />
      <div style={{ fontSize: TYPE2.word, color: INK.text, margin: `0 0 ${mm(3.5)}` }}>
        Write about the story. Use these words in your sentences.
      </div>
      <div style={{ display: 'flex', gap: mm(4), flexWrap: 'wrap', marginBottom: mm(4) }}>
        {chips.map((w) => (
          <span key={w} style={{ border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(1)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
            {w}
          </span>
        ))}
      </div>
      <StoryScene src={sceneSrc} pos={scenePos} heightMm={94} />
      <div style={{ margin: `${mm(3.5)} 0` }}>
        <GoalChips theme={theme} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {Array.from({ length: lines }).map((_, i) => <Line key={i} />)}
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
  scenePos,
  lines,
  theme,
}: {
  page: number;
  prompt: string;
  sceneSrc: string;
  scenePos?: string;
  lines: number;
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Big write" />
      {/* the task itself is the biggest text on the page after the heading */}
      <div style={{ fontSize: TYPE2.word, color: INK.text, margin: `0 0 ${mm(3.5)}` }}>{prompt}</div>
      <StoryScene src={sceneSrc} pos={scenePos} heightMm={88} />
      <div style={{ margin: `${mm(3.5)} 0` }}>
        <GoalChips theme={theme} />
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
        {Array.from({ length: lines }).map((_, i) => <Line key={i} />)}
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
              {Array.from({ length: 4 }).map((_, j) => <Line key={j} />)}
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
