import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import TraceLine from '@/components/TraceLine';
import { WbPage, Heading, SectionLabel, DottedDivider, GoalChips, WordCard, Line, TYPE2, type Theme } from '@/components/workbook2/BookStyle';

// ---------------------------------------------------------------------------
// W2 skills pages — Spell it (practise + test on ONE page), Sentences (hold +
// dictation on one page) and Handwriting (a grey model starts EVERY row and
// the child continues along the same row; uniform pitch). All in the book
// back-matter design language (BookStyle).
// ---------------------------------------------------------------------------

// ---- Spell it ---------------------------------------------------------------
// Top half: the book's own Word Workshop pattern — LOOK · COVER · WRITE ·
// CHECK columns, a shaded cover cell, dashed write/check cells. Bottom half:
// the spelling test as two columns of five short numbered lines (the child
// covers the top half; a grown-up reads the words). Replaces the three old
// pages (two LCWC sheets + a full-page test).

const COL_HEADS = ['1. Look', '2. Cover', '3. Write', '4. Check'];

function ColHeads() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44mm 1fr 1fr 30mm', columnGap: mm(4), marginBottom: mm(1.5) }}>
      {COL_HEADS.map((h) => (
        <span key={h} style={{ color: INK.muted, fontSize: TYPE2.small, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: h === '1. Look' ? 'left' : 'center' }}>{h}</span>
      ))}
    </div>
  );
}

function LcwcRow({ word, theme }: { word: string; theme: Theme }) {
  const cell: React.CSSProperties = { border: `0.4mm dashed ${INK.rule}`, borderRadius: mm(2.5), height: mm(11) };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '44mm 1fr 1fr 30mm', columnGap: mm(4), alignItems: 'center', marginBottom: mm(3) }}>
      <WordCard word={word} theme={theme} />
      {/* the shaded cover cell — fold the routine into the page furniture */}
      <div style={{ ...cell, border: 'none', background: '#ECECEC' }} />
      <div style={cell} />
      <div style={cell} />
    </div>
  );
}

export function SpellItPage({
  page,
  practise,
  theme,
}: {
  page: number;
  practise: string[];
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Spell it" sub="Look at the word, cover it, write it, then tick the check box." />
      <SectionLabel text="Practise — look, cover, write, check" theme={theme} />
      <ColHeads />
      <div>
        {practise.map((w) => <LcwcRow key={w} word={w} theme={theme} />)}
      </div>

      <DottedDivider />

      <SectionLabel text="Spelling test — a grown-up reads the words" theme={theme} />
      <div style={{ color: INK.muted, fontSize: TYPE2.sub, marginBottom: mm(2) }}>
        Cover the practise words first. Write each word your grown-up reads.
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: mm(12), alignContent: 'space-evenly' }}>
        {Array.from({ length: 10 }).map((_, i) => {
          // column-major order: 1-5 down the left, 6-10 down the right
          const n = (i % 2) * 5 + Math.floor(i / 2) + 1;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(3) }}>
              <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right' }}>{n}.</span>
              <div style={{ flex: 1 }}><Line heightMm={10} /></div>
            </div>
          );
        })}
      </div>
    </WbPage>
  );
}

// ---- Sentences --------------------------------------------------------------
// Top: HOLD THE SENTENCE (two printed sentences, write from memory below).
// Bottom: LISTEN AND WRITE (two dictation slots — the sentences are never
// printed here; they live in the Answers and the sequence doc).

export function SentencesPage({
  page,
  hold,
  listenSlots,
  theme,
}: {
  page: number;
  hold: string[];
  listenSlots: number;
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Sentences" sub="Read it, say it, hide it, then write it from memory." />
      <SectionLabel text="Hold the sentence" theme={theme} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(4) }}>
        {hold.map((s, i) => (
          <div key={i}>
            <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(2)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
              {s}
            </div>
            <Line heightMm={12} />
          </div>
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Listen and write — a grown-up reads the sentence" theme={theme} />
      <div style={{ color: INK.muted, fontSize: TYPE2.sub, marginBottom: mm(2) }}>
        Say it back, tap the words, then write it.
      </div>
      <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: mm(7), paddingTop: mm(2) }}>
        {Array.from({ length: listenSlots }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: mm(3) }}>
            <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right', alignSelf: 'flex-end', paddingBottom: mm(13) }}>{i + 1}.</span>
            <div style={{ flex: 1 }}>
              <Line heightMm={12} />
              <Line heightMm={13} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: '0 0 auto', marginTop: mm(6) }}>
        <GoalChips theme={theme} />
      </div>
      <div style={{ flex: 1 }} />
    </WbPage>
  );
}

// ---- Handwriting ------------------------------------------------------------
// A grey model starts EVERY row; the child traces it and continues along the
// same row to the end. Uniform row pitch — no orphan blank pairs. Two
// sections (patterns and words · phrases), models on every line.

function HwRow({ model, theme }: { model: string; theme: Theme }) {
  return (
    <TraceLine
      text={model}
      xHeightMm={5.5}
      widthMm={182}
      color={INK.trace}
      midlineColor={theme.border}
      startXMm={3}
    />
  );
}

export function HandwritingPage({
  page,
  patterns,
  phrases,
  theme,
}: {
  page: number;
  patterns: string[];
  phrases: string[];
  theme: Theme;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Handwriting" sub="Trace the grey words, then keep writing them to the end of the line." />
      <SectionLabel text="Patterns and words" theme={theme} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
        {patterns.map((m) => <HwRow key={m} model={m} theme={theme} />)}
      </div>

      <DottedDivider />

      <SectionLabel text="Phrases" theme={theme} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(6) }}>
        {phrases.map((m) => <HwRow key={m} model={m} theme={theme} />)}
      </div>
    </WbPage>
  );
}
