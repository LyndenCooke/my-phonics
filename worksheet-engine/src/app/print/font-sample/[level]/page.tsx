import { notFound } from 'next/navigation';
import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import TraceLine from '@/components/TraceLine';
import { JOINED_METRICS } from '@/design/handwriting';
import { FlowyPage } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// JOINED FONT SAMPLE — one page for Lynden's approval BEFORE any workbook
// handwriting page prints joined models. Shows Playwrite GB J ("Playwrite
// England Joined", TypeTogether via Google Fonts, SIL OFL) on the L6
// tramlines at the workbook model size: join families, focus-sound words,
// tricky words, the ligature stress words and one approved phrase. This page
// is NOT part of any workbook — it is a hand-back artefact only.
//   npm run pdf font-sample 6   ->   /print/font-sample/6
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [{ level: '6' }];
}

const ROWS: { label: string; text: string }[] = [
  { label: 'Join families (no lead-ins)', text: 'ur er ow ew ue' },
  { label: 'Focus-sound words', text: 'turn her brown down new glue' },
  { label: 'Tricky words', text: 'looked called asked could their' },
  { label: 'Ligature stress words', text: 'first off fluffy finger flew' },
  { label: 'Approved phrase', text: 'the soft fluffy owlets' },
];

export default function FontSample({ params }: { params: { level: string } }) {
  const level = Number(params.level);
  if (level !== 6) notFound();
  const theme = getLevelTheme(level);
  return (
    <FlowyPage theme={theme} title="Joined font sample" page={1}>
      <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: mm(6), ...gType('instruction'), color: INK.text, lineHeight: 1.4 }}>
        Playwrite England Joined (Playwrite GB J), SIL Open Font Licence, TypeTogether via Google
        Fonts. UK joined modern cursive from the Primarium research model: diagonal and horizontal
        joins, no lead-in entry strokes. Proposed for the grey joined model rows on the L6+
        handwriting practice sheets. Model x-height 6 mm on the standard tramlines.
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingTop: mm(2) }}>
        {ROWS.map((r) => (
          <div key={r.label} style={{ display: 'flex', flexDirection: 'column', gap: mm(1.5) }}>
            <div style={{ ...gType('instruction'), color: theme.accentText }}>{r.label}</div>
            <TraceLine
              text={r.text}
              xHeightMm={6}
              widthMm={198}
              metrics={JOINED_METRICS}
              color={INK.trace}
              midlineColor={theme.primary}
              joined
            />
            <TraceLine
              model={r.text}
              modelWeight={400}
              xHeightMm={6}
              widthMm={198}
              metrics={JOINED_METRICS}
              midlineColor={theme.primary}
              joined
            />
          </div>
        ))}
      </div>
    </FlowyPage>
  );
}
