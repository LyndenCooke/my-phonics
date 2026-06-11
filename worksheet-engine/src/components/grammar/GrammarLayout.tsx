import React from 'react';
import type { GrammarUnit } from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { FONT, INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { WriteLine } from '@/components/WriteLine';
import {
  SheetPage,
  SheetHeader,
  SheetFooter,
  SectionHead,
  panelStyle,
  M,
  W,
  PAD,
  mm,
  abs,
} from '@/components/SheetShell';

// ---------------------------------------------------------------------------
// GrammarLayout — the shared 2-panel grammar page, built on the locked sound_a
// chrome (SheetShell). A Grammar sheet and a Sound sheet read as one scheme:
// same level header bar, same bordered panels, same numbered section heads,
// same grey footer.
//
// LAYOUT MAP (mm):
//   header   6,6    198x26   level bar (tile · topic · pills)
//   terms    6,33   198x5    NC link (left) + statutory terms (right)
//   §1       6,39   198x30   "Watch first" (I do) — the worked example
//   §2       6,72   198x207  the doing instruction + activity (We do / You do)
//   footer   6,285  198x7    grey caption bar
//
// Each format template fills only the §2 ACTIVITY area (passed as children).
// The §1 example, terminology strip and optional apply task are rendered here
// so every grammar sheet shares them. All writing rows use TraceLine.
// ---------------------------------------------------------------------------

const INNER_W = W - 2 * PAD; // 186
const TERM = { y: 33, h: 5 };
const S1 = { y: 38, h: 34 };
const S2 = { y: 74, h: 205 };
const HEAD_H1 = 9;
const HEAD_H2 = 16;
const APPLY_H = 16;

// Shared type scale for grammar sheets, so letter sizing is CONSISTENT within a
// sheet (don't hard-code ad-hoc sizes in templates — pull from here). `sentence`
// is the activity body text; `label` is in-panel labels like "Word bank".
export const GRAMMAR_PT = { sentence: 16, label: 11 } as const;

export function GrammarLayout({ unit, children }: { unit: GrammarUnit; children: React.ReactNode }) {
  const theme = getLevelTheme(unit.level);
  const accent = theme.primary;
  const border = theme.border;
  const panel = panelStyle(border);

  const childrenH = S2.h - (PAD + HEAD_H2) - PAD - (unit.apply ? APPLY_H + 2 : 0);

  // Long worked examples (full sentences, e.g. the rewrite sheet) must shrink so
  // they stay inside the fixed-height §1 panel instead of colliding with it.
  const exPt = unit.s1.prompt.length + unit.s1.answer.length > 56 ? 11.5 : 14;

  // Gap-fill formats (cloze) model the answer by filling it into the blank,
  // shown as a complete sentence — not "prompt → answer" with a dangling gap.
  const gapFill = unit.s1.prompt.includes('___');

  return (
    <SheetPage>
      <SheetHeader
        theme={theme}
        title={unit.name}
        titlePt={unit.name.length > 26 ? 22 : 26}
        levelLabel={unit.levelLabel}
        strand={unit.strand}
        strandPill={{ bg: theme.light, color: theme.accentText }}
        mascotImageKey={hasClipart('abc') ? 'abc' : undefined}
        mascotWord="abc"
        tileGlyph="abc"
      />

      {/* terminology strip */}
      <div
        style={{
          ...abs(M + 1, TERM.y, W - 2, TERM.h),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '8.5pt',
          color: INK.muted,
        }}
      >
        <span style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{unit.ncLink}</span>
        <span style={{ display: 'flex', gap: mm(2), alignItems: 'center' }}>
          <span style={{ color: INK.faint }}>Grammar words:</span>
          {unit.terminology.map((t) => (
            <span key={t} style={{ fontWeight: 700, color: theme.accentText }}>
              {t}
            </span>
          ))}
        </span>
      </div>

      {/* §1 — Watch first (I do) */}
      <div style={{ ...abs(M, S1.y, W, S1.h), ...panel }}>
        <SectionHead n={1} title="Watch first" subtitle="I do it. You watch." inlineSubtitle accent={accent} />
        <div style={{ ...abs(PAD, PAD + HEAD_H1, INNER_W, S1.h - (PAD + HEAD_H1) - PAD), display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: mm(1.5) }}>
          {gapFill ? (
            // Gap-fill model (cloze): show the COMPLETE sentence with the answer
            // written on the line, so it reads as a correct worked example.
            <div style={{ fontFamily: FONT.hand, fontSize: `${GRAMMAR_PT.sentence}pt`, color: INK.text, lineHeight: 1.35 }}>
              {unit.s1.prompt.split('___')[0]}
              <span style={{ color: theme.accentText, fontWeight: 700, borderBottom: `0.6mm solid ${border}`, padding: '0 2mm' }}>{unit.s1.answer}</span>
              {unit.s1.prompt.split('___')[1]}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: mm(3), flexWrap: 'wrap' }}>
              <S1Term text={unit.s1.prompt} tag={unit.s1.tags?.prompt} color={INK.muted} tagColor={INK.faint} pt={exPt} />
              <span style={{ color: accent, fontWeight: 700, fontSize: '13pt', alignSelf: 'center' }}>→</span>
              <S1Term text={unit.s1.answer} tag={unit.s1.tags?.answer} color={theme.accentText} tagColor={theme.accentText} bold tagBg={theme.light} pt={exPt} />
              {hasClipart(unit.s1.image) && (
                <span style={{ marginLeft: mm(4), width: mm(16), height: mm(16), flex: '0 0 auto' }}>
                  <Clipart imageKey={unit.s1.image!} word={unit.s1.answer} fill multiply />
                </span>
              )}
            </div>
          )}
          {unit.s1.note && (
            <div style={{ fontSize: '9pt', color: INK.muted, lineHeight: 1.2 }}>{unit.s1.note}</div>
          )}
        </div>
      </div>

      {/* §2 — the activity (We do / You do) */}
      <div style={{ ...abs(M, S2.y, W, S2.h), ...panel }}>
        <SectionHead n={2} title={unit.doInstruction} subtitle={unit.objective} accent={accent} />
        <div style={{ ...abs(PAD, PAD + HEAD_H2, INNER_W, childrenH) }}>{children}</div>
        {unit.apply && (
          <div style={{ ...abs(PAD, S2.h - PAD - APPLY_H, INNER_W, APPLY_H), borderTop: `0.3mm solid ${INK.rule}`, paddingTop: mm(1.5) }}>
            <div style={{ fontSize: '9.5pt', fontWeight: 700, color: theme.accentText }}>Now you write: {unit.apply.prompt}</div>
            <div style={{ marginTop: mm(4) }}>
              <WriteLine />
            </div>
          </div>
        )}
      </div>

      <SheetFooter theme={theme} right={`Grammar · ${unit.code}`} />
    </SheetPage>
  );
}

// WriteLine now lives in the shared module `@/components/WriteLine` (one ruled-
// line component for every strand). Re-exported here so legacy boxed components
// (GrammarBuild / GrammarRewrite) keep their existing import path.
export { WriteLine };

/** A §1 example term with an optional tiny scaffold chip beneath it. */
function S1Term({ text, tag, color, tagColor, bold = false, tagBg, pt = 14 }: { text: string; tag?: string; color: string; tagColor: string; bold?: boolean; tagBg?: string; pt?: number }) {
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: mm(0.6) }}>
      <span style={{ fontFamily: FONT.hand, fontSize: `${pt}pt`, fontWeight: bold ? 700 : 400, color }}>{text}</span>
      {tag && (
        <span style={{ fontSize: '7.5pt', fontWeight: 700, color: tagColor, background: tagBg ?? 'transparent', borderRadius: mm(2), padding: tagBg ? '0.3mm 1.6mm' : 0 }}>
          {tag}
        </span>
      )}
    </span>
  );
}

/** The shared circular numbered row badge (filled level colour, white number).
 *  Used on every grammar activity row so the sheets read as one creative. */
export function NumBadge({ n, accent, size = 6.5 }: { n: number; accent: string; size?: number }) {
  return (
    <span
      style={{
        width: mm(size),
        height: mm(size),
        borderRadius: '50%',
        background: accent,
        color: '#fff',
        fontWeight: 700,
        fontSize: '10.5pt',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: '0 0 auto',
      }}
    >
      {n}
    </span>
  );
}
