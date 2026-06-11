import React from 'react';
import type { getLevelTheme } from '@/design/levelThemes';
import type { PageIllustration, CheckItem } from '@/data/grammarSchema';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import Clipart, { hasClipart } from '@/components/Clipart';
import { gType } from '@/design/grammarTokens';

// ---------------------------------------------------------------------------
// Grammar art zones (worksheet-design SKILL.md):
//   COMPOSE, DO NOT DECORATE — and the layout owns the geometry. Art lives
//   ONLY inside a zone the layout component reserves: the foot band, the apply
//   right rail, or the per-row art column. Every zone clips its art
//   (overflow hidden) and holds no content, so art over text, lines, boxes or
//   the grid is structurally impossible — not just absent. There is NO
//   watermark / background art at any opacity, and no motif band.
//
//   - FootSceneBand: a reserved full-width band (42 mm) BELOW the apply block,
//     showing one pre-composed line-art scene.
//   - ApplyRail: a reserved right-rail column BESIDE the apply lines (a flex
//     sibling of the lines column — the lines physically end where it begins),
//     showing one grounded character or small scene on a ground shadow.
//   - rowArt is composed in the format body (a reserved left column per row).
//   - CheckStrip: the self-check device above the apply lines.
// ---------------------------------------------------------------------------

type Theme = ReturnType<typeof getLevelTheme>;

/** Width of the reserved apply rail (the apply lines column ends where this
 *  begins — geometry owned here, not by unit data). */
export const APPLY_RAIL_MM = 40;

/** Whether a page renders the reserved foot band. */
export function hasFootBand(illustration?: PageIllustration): boolean {
  return illustration?.pattern === 'footScene';
}

/** The asset key for the apply rail, when this page reserves one. */
export function applyRailKey(illustration?: PageIllustration): string | undefined {
  if (illustration?.pattern !== 'applyRail') return undefined;
  return illustration.assets[0];
}

/** The reserved foot-band scene: full content width, fixed 42 mm height,
 *  BELOW the apply block. Holds no content; the art never leaves it (clipped),
 *  and nothing else can enter it (a dedicated in-flow band). */
export function FootSceneBand({ illustration }: { illustration: PageIllustration }) {
  const key = illustration.assets[0];
  return (
    <div style={{ flex: '0 0 auto', height: mm(42), overflow: 'hidden', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      {hasClipart(key) && (
        <div style={{ width: '100%', height: '100%' }}>
          <Clipart imageKey={key} word={key} fill multiply />
        </div>
      )}
    </div>
  );
}

/** The reserved apply rail: a fixed-width clipped column rendered as a flex
 *  SIBLING of the apply lines column, so the lines end where the rail begins.
 *  One grounded character or small scene, bottom-aligned on a ground shadow. */
export function ApplyRail({ imageKey, heightMm = 36 }: { imageKey: string; heightMm?: number }) {
  return (
    <div
      style={{
        flex: `0 0 ${mm(APPLY_RAIL_MM)}`,
        width: mm(APPLY_RAIL_MM),
        alignSelf: 'flex-end',
        height: mm(heightMm),
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {hasClipart(imageKey) && (
        <>
          <div style={{ width: '100%', flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Clipart imageKey={imageKey} word={imageKey} fill multiply />
          </div>
          <div style={{ flex: '0 0 auto', width: '60%', height: mm(2.5), background: INK.text, opacity: 0.12, borderRadius: '50%', marginTop: mm(0.5) }} />
        </>
      )}
    </div>
  );
}

// ---- check device ----------------------------------------------------------

const CHECK_LABEL: Record<CheckItem, string> = {
  capitalLetter: 'capital letter',
  fingerSpaces: 'finger spaces',
  fullStop: 'full stop',
};
const CHECK_MARK: Record<CheckItem, string> = {
  capitalLetter: 'A',
  fingerSpaces: '⌄',
  fullStop: '•',
};

/** The slim self-check strip above the apply ruled lines. UK terms, instruction
 *  size, no tiny grey text. */
export function CheckStrip({ items, theme }: { items: CheckItem[]; theme: Theme }) {
  return (
    <div style={{ background: theme.light, borderRadius: mm(3), padding: `0 ${mm(5)}`, height: mm(10), display: 'flex', alignItems: 'center', gap: mm(7), overflow: 'hidden' }}>
      <span style={{ color: theme.accentText, ...gType('instruction') }}>Check</span>
      {items.map((it) => (
        <span key={it} style={{ display: 'flex', alignItems: 'center', gap: mm(2), color: INK.text, ...gType('instruction') }}>
          <span style={{ color: theme.accentText }}>{CHECK_MARK[it]}</span>
          {CHECK_LABEL[it]}
        </span>
      ))}
    </div>
  );
}
