import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { SheetPage, mm } from '@/components/SheetShell';
import Clipart, { hasClipart } from '@/components/Clipart';
import FlowySheet from '@/components/grammar/FlowySheet';
import { FlowyBackground, FooterStrapline } from '@/components/grammar/FlowyLayout';
import { MatterPage } from '@/components/grammar/booklet/MatterChrome';
import { deriveAnswers } from '@/components/grammar/booklet/deriveAnswers';
import { GRAMMAR_LAYOUT_VARS, gType } from '@/design/grammarTokens';
import {
  getBookletMeta, getBookletUnits, getBackMatterPages, FRONT_MATTER,
} from '@/lib/grammarRegistry';
import type { GrammarBookletMeta } from '@/data/grammarSchema';

// GrammarBooklet — the assembler. Driven by bookletMeta + the level's units, it
// emits the pages in order: cover, contents, how-to, the units, the review, the
// answers. The booklet ends on Answers (no certificate). The route holds no
// copy.

type Theme = ReturnType<typeof getLevelTheme>;

// ---- Cover (page 1) --------------------------------------------------------
// Header band with the title block, then the cover scene as ONE full-width
// illustration panel (a scene lifted straight off a shipped book page — the
// hook), then Worksheet Pack and the skills line. Clear, professional, no
// small type, no objects on bare ruled lines (there are none).
function Cover({ theme, meta }: { theme: Theme; meta: GrammarBookletMeta }) {
  return (
    <SheetPage>
      <FlowyBackground theme={theme} />
      <div style={{ position: 'absolute', inset: 0, ...GRAMMAR_LAYOUT_VARS, fontWeight: 400, color: INK.text, display: 'flex', flexDirection: 'column' }}>
        {/* title block inside the header band */}
        <div style={{ flex: '0 0 ' + mm(40), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start' }}>
          <div style={{ marginTop: mm(5), color: '#fff', lineHeight: 1, ...gType('display') }}>Grammar</div>
          <div style={{ marginTop: mm(2), color: '#fff', ...gType('instruction') }}>Level {meta.level} · {meta.levelLabel}</div>
        </div>
        {/* the full-width illustration panel — one scene from the books */}
        <div style={{ flex: '0 0 auto', margin: `${mm(8)} ${mm(12)} 0`, height: mm(150), borderRadius: mm(6), overflow: 'hidden', background: theme.light }}>
          {hasClipart('cover_scene') && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/clipart/cover_scene.png" alt="From The Brown Owl" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 45%' }} />
          )}
        </div>
        {/* what this is, clearly, with the type kept large */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: mm(5), textAlign: 'center', paddingBottom: mm(14) }}>
          <div style={{ color: INK.text, ...gType('title') }}>Worksheet Pack</div>
          <div style={{ color: theme.accentText, ...gType('instruction') }}>{meta.coverSkills.join(' · ')}</div>
        </div>
      </div>
      <FooterStrapline theme={theme} />
    </SheetPage>
  );
}

// ---- Contents (page 2) -----------------------------------------------------
function Contents({ theme, level, meta }: { theme: Theme; level: number; meta: GrammarBookletMeta }) {
  const units = getBookletUnits(level);
  const back = getBackMatterPages(level);
  const lines: { label: string; page: number }[] = [
    { label: 'How this pack works', page: FRONT_MATTER },
    ...units.map((u, i) => ({ label: u.name, page: FRONT_MATTER + 1 + i })),
    { label: 'Answers', page: back.answers },
  ];
  return (
    <MatterPage theme={theme} title="Contents" page={2}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: mm(5) }}>
        {lines.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', color: INK.text, ...gType('body') }}>
            <span>{l.label}</span>
            <span style={{ flex: 1, margin: `0 ${mm(3)}`, borderBottom: `0.3mm dotted ${theme.border}`, transform: 'translateY(-1mm)' }} />
            <span style={{ color: theme.accentText }}>{l.page}</span>
          </div>
        ))}
      </div>
    </MatterPage>
  );
}

// ---- How this pack works (page 3) ------------------------------------------
function HowTo({ theme, meta }: { theme: Theme; meta: GrammarBookletMeta }) {
  return (
    <MatterPage theme={theme} title="How this pack works" page={3}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: mm(8) }}>
        {meta.howTo.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: mm(4) }}>
            <span
              style={{
                flex: '0 0 auto', width: mm(9), height: mm(9), borderRadius: '50%', background: theme.primary,
                color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                alignSelf: 'flex-start', ...gType('instruction'),
              }}
            >
              {i + 1}
            </span>
            <div>
              <div style={{ color: theme.accentText, ...gType('instruction') }}>{step.title}</div>
              <div style={{ color: INK.text, ...gType('body') }}>{step.body}</div>
            </div>
          </div>
        ))}
        <div style={{ color: theme.accentText, marginTop: mm(4), ...gType('instruction') }}>{meta.howToClosing}</div>
        {meta.howToNote && <div style={{ color: INK.text, ...gType('body') }}>{meta.howToNote}</div>}
      </div>
    </MatterPage>
  );
}

// ---- Answers (page = back.answers) -----------------------------------------
function Answers({ theme, level, page }: { theme: Theme; level: number; page: number }) {
  const units = getBookletUnits(level);
  return (
    <MatterPage theme={theme} title="Answers" page={page}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: mm(4), paddingTop: mm(4) }}>
        {units.map((u) => (
          <div key={u.id}>
            <div style={{ color: theme.accentText, ...gType('instruction') }}>{u.name}</div>
            <div style={{ color: INK.text, ...gType('body') }}>{deriveAnswers(u)}</div>
          </div>
        ))}
      </div>
    </MatterPage>
  );
}

export default function GrammarBooklet({ level }: { level: number }) {
  const meta = getBookletMeta(level);
  if (!meta) throw new Error(`No grammar booklet meta for level ${level}.`);
  const theme = getLevelTheme(level);
  const units = getBookletUnits(level);
  const back = getBackMatterPages(level);

  return (
    <>
      <Cover theme={theme} meta={meta} />
      <Contents theme={theme} level={level} meta={meta} />
      <HowTo theme={theme} meta={meta} />
      {units.map((u, i) => (
        <FlowySheet key={u.id} unit={u} page={FRONT_MATTER + 1 + i} />
      ))}
      <Answers theme={theme} level={level} page={back.answers} />
    </>
  );
}
