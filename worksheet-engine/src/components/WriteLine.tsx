import React from 'react';
import { WRITE_LINE_GAP } from '@/design/grammarTokens';

// ---------------------------------------------------------------------------
// WriteLine — the ONE shared ruled-line component, imported by every strand.
//
// Plain black ruled lines for grammar / sentence answers. This is deliberately
// NOT the 3-zone handwriting guide (faint top line, dashed x-height, descender):
// that guide is reserved for the handwriting strand and never appears on a
// grammar sheet.
//
// Ink #1A1A1A, stroke 0.4 mm. The gap is the booklet token `--write-line-gap`
// (9 mm), so the line-to-line gap and the instruction-to-first-line gap are
// constant and identical on every sheet across the whole booklet.
// ---------------------------------------------------------------------------

export function WriteLine({
  lines = 1,
  gap = WRITE_LINE_GAP,
  color = '#1A1A1A',
}: {
  lines?: number;
  /** Line-to-line gap (each line sits at the bottom of one gap-tall row).
   *  Defaults to the booklet `--write-line-gap` token. */
  gap?: string;
  color?: string;
}) {
  return (
    <div style={{ width: '100%' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} style={{ height: gap, borderBottom: `0.4mm solid ${color}` }} />
      ))}
    </div>
  );
}

export default WriteLine;
