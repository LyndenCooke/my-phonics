import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import TraceLine from '@/components/TraceLine';
import type { SoundPageData } from '@/data/workbook2/levels';
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

// ---- The sound X (L1-L3) ------------------------------------------------------
// ONE sound per page — the approved Sound Pack sheet pattern (trace the
// letter, trace the words with a picture cue beside each, write the missing
// sound with a picture cue on every card) in the W2 book style. Words and
// clipart come from the approved sheets; a word without approved art keeps
// an EMPTY picture slot (house rule), never substitute art.

function SoundArt({ grapheme, word, heightMm }: { grapheme: string; word: string; heightMm: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/soundart/${grapheme}/${word.replace(/ /g, '_')}.png`}
      alt=""
      style={{ height: mm(heightMm), width: mm(heightMm), objectFit: 'contain', flex: '0 0 auto' }}
    />
  );
}

function MissingCard({ data, grapheme, theme, xMm, widthMm }: { data: { word: string; shown: string; img: boolean }; grapheme: string; theme: Theme; xMm: number; widthMm: number }) {
  const gap = data.shown.indexOf('_');
  const before = gap >= 0 ? data.shown.slice(0, gap) : '';
  const after = gap >= 0 ? data.shown.slice(gap + 1) : data.shown;
  const hidden = data.word.slice(before.length, data.word.length - after.length || undefined);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: mm(2) }}>
      <div style={{ height: mm(25), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {data.img && <SoundArt grapheme={grapheme} word={data.word} heightMm={25} />}
      </div>
      <TraceLine
        segments={[
          { text: before, fill: INK.text },
          { text: hidden, fill: 'transparent' },
          { text: after, fill: INK.text },
        ]}
        xHeightMm={xMm}
        widthMm={widthMm}
        align="middle"
        midlineColor={theme.border}
      />
    </div>
  );
}

export function SoundPage({
  page,
  data,
  theme,
  hwX = 7,
}: {
  page: number;
  data: SoundPageData;
  theme: Theme;
  hwX?: number;
}) {
  const g = data.grapheme;
  return (
    <WbPage page={page}>
      <Heading title={`The sound ${g}`} sub="Trace the sound and the words, then write in the missing sound." />

      <SectionLabel text={`Trace the sound ${g}`} theme={theme} />
      <div style={{ flex: '0 0 auto', paddingTop: mm(2) }}>
        <HwRow model={Array.from({ length: 4 }).map(() => g).join(' ')} theme={theme} xMm={hwX} />
      </div>

      <DottedDivider />

      <SectionLabel text="Trace the words" theme={theme} />
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {data.trace.map((t) => (
          <div key={t.word} style={{ display: 'flex', alignItems: 'center', gap: mm(3) }}>
            <div style={{ width: mm(22), height: mm(22), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
              {t.img && <SoundArt grapheme={g} word={t.word} heightMm={22} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <TraceLine
                text={`${t.word} ${t.word}`}
                xHeightMm={hwX}
                widthMm={157}
                color={INK.trace}
                midlineColor={theme.border}
                startXMm={3}
              />
            </div>
          </div>
        ))}
      </div>

      <DottedDivider />

      <SectionLabel text={`Write the missing ${g}`} theme={theme} />
      {/* the word size is uniform across the page's cards and shrinks so the
          LONGEST word fits its card (glyph advance ~1.06 x the x-height) */}
      {(() => {
        const cardW = data.missing.length <= 3 ? 52 : 40;
        const maxLen = Math.max(...data.missing.map((c) => c.word.length));
        const xMm = Math.min(hwX, 6.5, (cardW - 2) / (1.06 * maxLen));
        return (
          <div style={{ flex: '0 0 auto', display: 'grid', gridTemplateColumns: `repeat(${data.missing.length}, 1fr)`, gap: mm(5), paddingBottom: mm(2) }}>
            {data.missing.map((c) => (
              <MissingCard key={c.word} data={c} grapheme={g} theme={theme} xMm={xMm} widthMm={cardW} />
            ))}
          </div>
        );
      })()}
    </WbPage>
  );
}
