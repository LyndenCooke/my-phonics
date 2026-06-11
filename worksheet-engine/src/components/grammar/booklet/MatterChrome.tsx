import React from 'react';
import type { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { SheetPage, mm } from '@/components/SheetShell';
import { FlowyBackground, FooterStrapline, PageBadge } from '@/components/grammar/FlowyLayout';
import { GRAMMAR_LAYOUT_VARS, gType } from '@/design/grammarTokens';

type Theme = ReturnType<typeof getLevelTheme>;

// MatterChrome — the shared shell for the booklet's front/back matter (contents,
// how-to, answers) so they read as the same flowy scheme as the unit sheets:
// the wavy header band, the one type scale, the ground wave, footer and page
// badge. The cover builds its own body but reuses this shell. No motif band —
// the header wave and the foot ground wave carry the flowy identity.

export function MatterPage({
  theme,
  title,
  page,
  showBadge = true,
  children,
}: {
  theme: Theme;
  /** white centred header-band title (omit on the cover / certificate). */
  title?: string;
  page: number;
  showBadge?: boolean;
  children: React.ReactNode;
}) {
  return (
    <SheetPage>
      <FlowyBackground theme={theme} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...GRAMMAR_LAYOUT_VARS,
          fontWeight: 400,
          color: INK.text,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ flex: '0 0 ' + mm(40), display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {title && (
            <div style={{ marginTop: mm(13), textAlign: 'center', color: '#fff', lineHeight: 1.05, padding: `0 ${mm(16)}`, ...gType('title') }}>
              {title}
            </div>
          )}
        </div>
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', padding: `0 ${mm(10)} ${mm(33)}` }}>
          {children}
        </div>
      </div>
      <FooterStrapline theme={theme} />
      {showBadge && <PageBadge page={page} theme={theme} />}
    </SheetPage>
  );
}
