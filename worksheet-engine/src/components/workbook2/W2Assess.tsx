import React from 'react';
import { getGrammarUnitByCode, getGrammarUnit } from '@/lib/grammarRegistry';
import { deriveAnswers } from '@/components/grammar/booklet/deriveAnswers';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, Line, TYPE2, type Theme } from '@/components/workbook2/BookStyle';
import { stripGap } from '@/components/workbook2/W2Writing';
import type { W2LevelData, SwykGroup } from '@/data/workbook2/levels';

// ---------------------------------------------------------------------------
// W2 assessment + the grown-up back matter, data-driven for every level. The
// week-6 event is Show what you know A/B (page B carries the half-term
// spelling test). Every assessment item is an approved row reused BY POINTER
// (SwykGroup refs) — these pages can carry no new decodable text. The back
// of the booklet is three adult pages: Answers, Spelling words, For
// grown-ups — so a parent never needs a separate teacher booklet.
// ---------------------------------------------------------------------------

type Ref = { sourceUnit: string; rowRef: number };

// ---- pointer resolvers -------------------------------------------------------

function tickData(refs: Ref[]): { cats: readonly string[]; rows: { text: string }[] } {
  const u = getGrammarUnitByCode(refs[0]?.sourceUnit ?? '');
  if (u?.format !== 'tickgrid') return { cats: [], rows: [] };
  const cats = u.tickgrid.categories ?? u.tickgrid.columns;
  return { cats, rows: refs.map((r) => u.tickgrid.rows[r.rowRef]).filter(Boolean) };
}
function matchData(refs: Ref[]): { left: string; right: string }[] {
  return refs
    .map((r) => {
      const u = getGrammarUnitByCode(r.sourceUnit);
      return u?.format === 'match' ? u.match.pairs[r.rowRef] : undefined;
    })
    .filter((p): p is { left: string; right: string } => !!p);
}
function buildData(refs: Ref[]): { bank: string[]; rows: { base: string }[] } {
  const u = getGrammarUnitByCode(refs[0]?.sourceUnit ?? '');
  if (u?.format !== 'build') return { bank: [], rows: [] };
  return { bank: u.build.wordBank, rows: refs.map((r) => u.build.rows[r.rowRef]).filter(Boolean) };
}
function clozeData(refs: Ref[]): { bank: string[]; rows: { before: string; after: string }[] } {
  const rows: { before: string; after: string }[] = [];
  const bank: string[] = [];
  for (const r of refs) {
    const u = getGrammarUnitByCode(r.sourceUnit);
    if (u?.format !== 'cloze') continue;
    const row = u.cloze.rows[r.rowRef];
    if (row) rows.push(row);
    for (const w of u.cloze.wordBank) if (!bank.includes(w)) bank.push(w);
  }
  return { bank, rows };
}
function rewriteData(refs: Ref[]): { text: string }[] {
  return refs
    .map((r) => {
      const u = getGrammarUnitByCode(r.sourceUnit);
      return u?.format === 'rewrite' ? u.rewrite.rows[r.rowRef] : undefined;
    })
    .filter((row): row is { text: string; answer: string } => !!row);
}
function circleData(refs: Ref[]): { text: string }[] {
  return refs
    .map((r) => {
      const u = getGrammarUnitByCode(r.sourceUnit);
      return u?.format === 'circle' ? u.circle.rows[r.rowRef] : undefined;
    })
    .filter((row): row is { text: string; finds: { word: string; target: string }[] } => !!row);
}

// ---- the generic group renderer ----------------------------------------------

export function SwykGroupBlock({ group, theme, pitch }: { group: SwykGroup; theme: Theme; pitch: number }) {
  const bankChip: React.CSSProperties = { border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(0.5)} ${mm(3.5)}`, fontSize: TYPE2.word, color: INK.text };
  const chip: React.CSSProperties = {
    border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), display: 'flex', alignItems: 'center',
    width: mm(56), padding: `0 ${mm(3.5)}`, height: mm(16), color: INK.text, fontSize: TYPE2.word,
  };
  const dot: React.CSSProperties = { width: mm(2.6), height: mm(2.6), borderRadius: '50%', background: theme.primary, flex: '0 0 auto' };
  const tick: React.CSSProperties = { width: mm(6.5), height: mm(6.5), border: `0.45mm solid ${INK.text}`, borderRadius: mm(1.2) };

  if (group.kind === 'tick') {
    const { cats, rows } = tickData(group.refs);
    const cols = `1fr repeat(${cats.length}, 28mm)`;
    return (
      <div>
        <SectionLabel text={group.label} theme={theme} />
        <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', paddingBottom: mm(1) }}>
          <span />
          {cats.map((c) => (
            <span key={c} style={{ textAlign: 'center', whiteSpace: 'nowrap', color: theme.accentText, fontSize: TYPE2.label, fontWeight: 700 }}>{c}</span>
          ))}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', minHeight: mm(13), borderTop: `0.3mm solid ${theme.primary}1F` }}>
            <span style={{ color: INK.text, fontSize: TYPE2.word, lineHeight: 1.35 }}>{r.text}</span>
            {cats.map((c) => (
              <span key={c} style={{ display: 'flex', justifyContent: 'center' }}><span style={tick} /></span>
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (group.kind === 'match') {
    const pairs = matchData(group.refs);
    const rights = pairs.length > 1 ? [...pairs.slice(1), pairs[0]].map((p) => p.right) : pairs.map((p) => p.right);
    // sentence-length pairs need wider chips that can take two lines; there is
    // no worked join line here, so the height can flex per chip
    const maxLen = Math.max(...pairs.map((p) => p.left.length), ...rights.map((r) => r.length));
    const matchChip: React.CSSProperties = maxLen > 12
      ? { ...chip, width: mm(72), height: 'auto', minHeight: mm(16), padding: `${mm(1.5)} ${mm(3.5)}`, lineHeight: 1.2 }
      : chip;
    return (
      <div>
        <SectionLabel text={group.label} theme={theme} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
          {pairs.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...matchChip, justifyContent: 'space-between' }}><span>{p.left}</span><span style={dot} /></div>
              <div style={{ ...matchChip, gap: mm(2.5) }}><span style={dot} /><span>{rights[i]}</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group.kind === 'build') {
    const { bank, rows } = buildData(group.refs);
    return (
      <div>
        <SectionLabel text={group.label} theme={theme} />
        <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
          {bank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
            <span style={{ flex: '0 0 auto', color: INK.text, fontSize: TYPE2.word, paddingBottom: mm(1) }}>{r.base}</span>
            <span style={{ flex: '0 0 auto', color: theme.primary, fontSize: TYPE2.word, paddingBottom: mm(1) }}>→</span>
            <div style={{ flex: 1 }}><Line heightMm={pitch} /></div>
          </div>
        ))}
      </div>
    );
  }

  if (group.kind === 'cloze') {
    const { bank, rows } = clozeData(group.refs);
    return (
      <div>
        <SectionLabel text={group.label} theme={theme} />
        <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap', marginBottom: mm(3) }}>
          {bank.map((w) => <span key={w} style={bankChip}>{w}</span>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
          {rows.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, fontSize: TYPE2.word, lineHeight: 1.55 }}>
              <span>{stripGap(c.before)}</span>
              <span style={{ display: 'inline-block', minWidth: mm(30), borderBottom: `0.5mm solid ${INK.text}`, margin: `0 ${mm(3)}` }} />
              <span>{stripGap(c.after)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (group.kind === 'rewrite') {
    const rows = rewriteData(group.refs);
    return (
      <div>
        <SectionLabel text={group.label} theme={theme} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: mm(7) }}>
          {rows.map((r, i) => (
            <div key={i}>
              <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(1.5)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
                {r.text}
              </div>
              <div style={{ marginTop: mm(3) }}><Line heightMm={pitch} /></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // circle
  const rows = circleData(group.refs);
  return (
    <div>
      <SectionLabel text={group.label} theme={theme} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
        {rows.map((r, i) => (
          <div key={i} style={{ color: INK.text, fontSize: TYPE2.word, lineHeight: 1.4 }}>{r.text}</div>
        ))}
      </div>
    </div>
  );
}

// ---- the assessment pages ------------------------------------------------------

export function SwykAPage({ page, data, theme }: { page: number; data: W2LevelData; theme: Theme }) {
  const pitch = data.spec.pitchMm;
  return (
    <WbPage page={page}>
      <Heading title="Show what you know" sub="Do one of each. Take your time." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {data.swykA.map((g, i) => (
          <React.Fragment key={i}>
            {i > 0 && <DottedDivider />}
            <SwykGroupBlock group={g} theme={theme} pitch={pitch} />
          </React.Fragment>
        ))}
      </div>
    </WbPage>
  );
}

export function SwykBPage({ page, data, theme }: { page: number; data: W2LevelData; theme: Theme }) {
  const pitch = data.spec.pitchMm;
  const testWords = data.spec.testWords;
  const half = Math.ceil(testWords / 2);
  return (
    <WbPage page={page}>
      <Heading title="Show what you know" sub="Nearly there. Do one of each, then write." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {data.swykB.groups.map((g, i) => (
          <React.Fragment key={i}>
            {i > 0 && <DottedDivider />}
            <SwykGroupBlock group={g} theme={theme} pitch={pitch} />
          </React.Fragment>
        ))}

        <DottedDivider />

        <div>
          <SectionLabel text="Now you write" theme={theme} />
          <div style={{ fontSize: TYPE2.word, color: INK.text, marginBottom: mm(1), lineHeight: 1.35 }}>{data.swykB.writeTask}</div>
          {Array.from({ length: data.swykB.writeLines }).map((_, i) => <Line key={i} heightMm={pitch} />)}
          <div style={{ margin: `${mm(3)} 0 0` }}>
            <GoalChips theme={theme} />
          </div>
        </div>

        <DottedDivider />

        <div>
          <SectionLabel text="Half-term spelling test — a grown-up reads the words" theme={theme} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: mm(12), rowGap: mm(1) }}>
            {Array.from({ length: testWords }).map((_, i) => {
              const n = (i % 2) * half + Math.floor(i / 2) + 1;
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(3) }}>
                  <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right' }}>{n}.</span>
                  <div style={{ flex: 1 }}><Line heightMm={Math.max(pitch - 2, 8)} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WbPage>
  );
}

// ---- The grown-up back matter ----------------------------------------------
// Adult-facing pages are exempt from the child type scale; compact 12pt so
// the whole key fits one two-column page.

const ADULT = '12pt';

export function AnswersPage({ page, data, theme }: { page: number; data: W2LevelData; theme: Theme }) {
  const sections = data.books.map((b) => {
    const entries: { heading: string; body: string }[] = [];
    for (const id of b.grammar) {
      const u = getGrammarUnit(id);
      if (u) entries.push({ heading: u.format === 'review' ? 'Fix and answer' : u.name, body: deriveAnswers(u) });
    }
    if (b.listen.length) {
      entries.push({ heading: 'Listen and write', body: b.listen.map((s, i) => `${i + 1}. ${s}`).join(' ') });
    }
    return { title: b.title, entries };
  });
  return (
    <WbPage page={page}>
      <Heading title="Answers" sub="For grown-ups. Sections follow the order of the book." />
      <div style={{ columnCount: 2, columnGap: mm(10), columnFill: 'balance' }}>
        {sections.map((s) => (
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
        <div style={{ breakInside: 'avoid', marginBottom: mm(5) }}>
          <SectionLabel text="Show what you know" theme={theme} />
          <div style={{ fontSize: ADULT, lineHeight: 1.45, color: INK.text }}>{data.swykAnswers}</div>
        </div>
      </div>
    </WbPage>
  );
}

export function SpellingWordsPage({ page, data, theme }: { page: number; data: W2LevelData; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title="Spelling words" sub="For grown-ups. Read the words aloud, one at a time, on the test day." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {data.spellings.map((s) => (
          <div key={s.title}>
            <SectionLabel text={s.title} theme={theme} />
            <div style={{ fontSize: '17pt', color: INK.text, lineHeight: 1.6 }}>
              {s.words.join(' · ')}
            </div>
          </div>
        ))}
      </div>
    </WbPage>
  );
}

export function GrownUpsPage({ page, data, theme }: { page: number; data: W2LevelData; theme: Theme }) {
  return (
    <WbPage page={page}>
      <Heading title="For grown-ups" sub={`How this workbook fits the six weeks of Level ${data.spec.level}.`} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {data.grownUps.map((p) => (
          <div key={p.title}>
            <span style={{ color: theme.accentText, fontSize: ADULT, fontWeight: 700 }}>{p.title}. </span>
            <span style={{ color: INK.text, fontSize: ADULT, lineHeight: 1.5 }}>{p.body}</span>
          </div>
        ))}
      </div>
    </WbPage>
  );
}

/** A revisit page for the round-up books (L2 B5, L4 B6): pointer-reused task
 *  groups, one of each, in place of new grammar. */
export function RevisitPage({ page, groups, theme, pitch }: { page: number; groups: SwykGroup[]; theme: Theme; pitch: number }) {
  return (
    <WbPage page={page}>
      <Heading title="Fix and answer" sub="Do one of each." />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {groups.map((g, i) => (
          <React.Fragment key={i}>
            {i > 0 && <DottedDivider />}
            <SwykGroupBlock group={g} theme={theme} pitch={pitch} />
          </React.Fragment>
        ))}
      </div>
    </WbPage>
  );
}
