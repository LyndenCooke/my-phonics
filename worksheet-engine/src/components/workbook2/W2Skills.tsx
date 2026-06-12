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
        <span key={h} style={{ color: INK.muted, fontSize: TYPE2.label, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', textAlign: h === '1. Look' ? 'left' : 'center' }}>{h}</span>
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
  pitch = 11,
  testWords = 10,
}: {
  page: number;
  practise: string[];
  theme: Theme;
  pitch?: number;
  testWords?: number;
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
      <div style={{ color: INK.muted, fontSize: TYPE2.body, marginBottom: mm(2) }}>
        Cover the practise words first. Write each word your grown-up reads.
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: mm(12), alignContent: 'space-evenly' }}>
        {Array.from({ length: testWords }).map((_, i) => {
          // column-major order: down the left column, then down the right
          const half = Math.ceil(testWords / 2);
          const n = (i % 2) * half + Math.floor(i / 2) + 1;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(3) }}>
              <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right' }}>{n}.</span>
              <div style={{ flex: 1 }}><Line heightMm={pitch} /></div>
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
  pitch = 11,
}: {
  page: number;
  hold: string[];
  listenSlots: number;
  theme: Theme;
  pitch?: number;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Sentences" sub="Read it, say it, hide it, then write it from memory." />
      <SectionLabel text="Hold the sentence" theme={theme} />
      {/* each block = the sentence strip with ITS line tucked close beneath;
          a clear, definite gap separates one block from the next */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: mm(12) }}>
        {hold.map((s, i) => (
          <div key={i}>
            <div style={{ background: '#F6F6F8', borderLeft: `1mm solid ${theme.primary}`, borderRadius: mm(1.5), padding: `${mm(2)} ${mm(4)}`, fontSize: TYPE2.word, color: INK.text }}>
              {s}
            </div>
            <div style={{ marginTop: mm(4) }}><Line heightMm={pitch} /></div>
          </div>
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Listen and write — a grown-up reads the sentence" theme={theme} />
      <div style={{ color: INK.muted, fontSize: TYPE2.body, marginBottom: mm(2) }}>
        Say it back, tap the words, then write it.
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {Array.from({ length: listenSlots }).map((_, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: mm(3) }}>
            <span style={{ color: theme.accentText, fontSize: TYPE2.body, fontWeight: 700, width: mm(7), textAlign: 'right', alignSelf: 'flex-end', paddingBottom: mm(pitch - 2) }}>{i + 1}.</span>
            <div style={{ flex: 1 }}>
              <Line heightMm={pitch} />
              <Line heightMm={pitch} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ flex: '0 0 auto', marginTop: mm(5) }}>
        <GoalChips theme={theme} />
      </div>
    </WbPage>
  );
}

// ---- Handwriting ------------------------------------------------------------
// The ladder: SOUND → WORD → SENTENCE, six lines, one thing per line. The
// grey model starts every row and the child continues to the end. Every row
// runs the FULL content width — no badges or furniture stealing line space.

function HwRow({ model, theme, xMm = 5.5 }: { model: string; theme: Theme; xMm?: number }) {
  return (
    <TraceLine
      text={model}
      xHeightMm={xMm}
      widthMm={182}
      color={INK.trace}
      midlineColor={theme.border}
      startXMm={3}
    />
  );
}

export interface HwLadder {
  sound: string;
  word: string;
  sentence: string;
}

export function HandwritingPage({
  page,
  ladders,
  theme,
  hwX = 5.5,
}: {
  page: number;
  /** one ladder per focus sound (two at L6): sound row, word row, sentence row. */
  ladders: HwLadder[];
  theme: Theme;
  hwX?: number;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Handwriting" sub="Trace the grey writing, then keep going to the end of the line." />

      <SectionLabel text="Sounds" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {ladders.map((l) => (
          <HwRow key={l.sound} model={`${l.sound} ${l.sound} ${l.sound}`} theme={theme} xMm={hwX} />
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Words" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {ladders.map((l) => (
          <HwRow key={l.word} model={`${l.word} ${l.word}`} theme={theme} xMm={hwX} />
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Sentences" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {ladders.map((l) => (
          <HwRow key={l.sentence} model={l.sentence} theme={theme} xMm={hwX} />
        ))}
      </div>
    </WbPage>
  );
}

// ---- Sounds (L1-L3) ----------------------------------------------------------
// The sound_a pattern in the book style: trace the sound, trace the words
// (approved clipart beside a word only where it exists), then write the
// missing sound. Everything traces — all content comes from the book's
// approved word lists; the trace glyphs are the writing model.

function MissingCard({ word, hide, theme, xMm }: { word: string; hide: string; theme: Theme; xMm: number }) {
  const at = word.indexOf(hide);
  const before = at >= 0 ? word.slice(0, at) : word;
  const after = at >= 0 ? word.slice(at + hide.length) : '';
  return (
    <div style={{ border: `0.5mm solid ${theme.primary}`, borderRadius: mm(2.5), padding: `${mm(2)} ${mm(2)}`, display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%' }}>
        <TraceLine
          segments={[
            { text: before, fill: INK.text },
            { text: hide, fill: 'transparent' },
            { text: after, fill: INK.text },
          ]}
          xHeightMm={xMm}
          widthMm={54}
          align="middle"
          midlineColor={theme.border}
        />
      </div>
    </div>
  );
}

export function SoundsPage({
  page,
  graphemes,
  words,
  missing,
  theme,
  hwX = 7,
}: {
  page: number;
  graphemes: string[];
  words: string[];
  missing: { word: string; hide: string }[];
  theme: Theme;
  hwX?: number;
}) {
  return (
    <WbPage page={page}>
      <Heading title="Sounds" sub="Trace the sounds and the words, then write in the missing sound." />

      <SectionLabel text="Trace the sounds" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {graphemes.map((g) => (
          <HwRow key={g} model={Array.from({ length: 4 }).map(() => g).join(' ')} theme={theme} xMm={hwX} />
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Trace the words" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {words.map((w) => (
          <HwRow key={w} model={`${w} ${w}`} theme={theme} xMm={hwX} />
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text="Write the missing sound" theme={theme} />
      <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: `repeat(${Math.min(missing.length, 3)}, 1fr)`, gap: mm(5), paddingBottom: mm(2) }}>
        {missing.map((c) => (
          <MissingCard key={c.word} word={c.word} hide={c.hide} theme={theme} xMm={Math.min(hwX, 7)} />
        ))}
      </div>
    </WbPage>
  );
}
