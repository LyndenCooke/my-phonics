import React from 'react';
import type { PoolObject, T6Content, SwykItem } from '@/data/pool/schema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import { mm } from '@/components/SheetShell';
import { gType } from '@/design/grammarTokens';
import { WriteLine } from '@/components/WriteLine';
import { CheckStrip } from '@/components/grammar/Illustration';
import { getGrammarUnitByCode } from '@/lib/grammarRegistry';
import { TICKGRID_CATEGORIES } from '@/data/grammarSchema';
import { FlowyPage, FootArt, footArtSlot } from '@/components/workbook/WorkbookChrome';

// ---------------------------------------------------------------------------
// T6 — SHOW WHAT YOU KNOW (the week-6 assessment event, with ST-HT and the
// oral reading check). Two task blocks maximum per page; every item is an
// approved row REUSED BY POINTER (sourceUnit + rowRef) — this page can carry
// no new decodable text. The B page closes with the foot write task + check
// strip. Tests the ledger exit criteria.
// ---------------------------------------------------------------------------

type Theme = ReturnType<typeof getLevelTheme>;
const INK_LINE = '#1A1A1A';

function TickItems({ items, theme }: { items: SwykItem[]; theme: Theme }) {
  const tick: React.CSSProperties = { width: mm(6), height: mm(6), border: `0.4mm solid ${INK_LINE}`, borderRadius: mm(1) };
  const cols = `1fr repeat(${TICKGRID_CATEGORIES.length}, 30mm)`;
  const sep = `0.3mm solid ${theme.primary}1F`;
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* one header row of category words, like the unit tickgrid */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', paddingBottom: mm(1) }}>
        <span />
        {TICKGRID_CATEGORIES.map((c) => (
          <span key={c} style={{ textAlign: 'center', whiteSpace: 'nowrap', color: theme.accentText, ...gType('instruction') }}>{c}</span>
        ))}
      </div>
      {items.map((item, i) => {
        const u = getGrammarUnitByCode(item.sourceUnit);
        const text = u?.format === 'tickgrid' ? u.tickgrid.rows[item.rowRef]?.text ?? '' : '';
        return (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', minHeight: mm(11), borderTop: sep }}>
            <span style={{ color: INK.text, ...gType('body') }}>{text}</span>
            {TICKGRID_CATEGORIES.map((c) => (
              <span key={c} style={{ display: 'flex', justifyContent: 'center' }}><span style={tick} /></span>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MatchItems({ items, theme }: { items: SwykItem[]; theme: Theme }) {
  const pairs = items.map((it) => {
    const u = getGrammarUnitByCode(it.sourceUnit);
    return u?.format === 'match' ? u.match.pairs[it.rowRef] : undefined;
  }).filter((p): p is { left: string; right: string } => !!p);
  // shuffle the right column deterministically (rotate by one)
  const rights = pairs.length > 1 ? [...pairs.slice(1), pairs[0]].map((p) => p.right) : pairs.map((p) => p.right);
  const chip: React.CSSProperties = {
    border: `0.4mm solid ${theme.primary}`, borderRadius: mm(2), display: 'flex', alignItems: 'center',
    padding: `0 ${mm(4)}`, height: mm(11), color: INK.text, ...gType('body'),
  };
  const dot: React.CSSProperties = { width: mm(2.2), height: mm(2.2), borderRadius: '50%', background: theme.primary, flex: '0 0 auto' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(3) }}>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 20mm 1fr', alignItems: 'center' }}>
          <div style={{ ...chip, justifyContent: 'space-between' }}><span>{p.left}</span><span style={dot} /></div>
          <div />
          <div style={{ ...chip, gap: mm(3) }}><span style={dot} /><span>{rights[i]}</span></div>
        </div>
      ))}
    </div>
  );
}

function BuildItem({ item, theme }: { item: SwykItem; theme: Theme }) {
  const u = getGrammarUnitByCode(item.sourceUnit);
  if (u?.format !== 'build') return null;
  const row = u.build.rows[item.rowRef];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(2) }}>
      <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap' }}>
        {u.build.wordBank.map((w) => (
          <span key={w} style={{ color: theme.accentText, border: `0.4mm solid ${theme.primary}`, borderRadius: mm(1), padding: `${mm(0.5)} ${mm(3)}`, ...gType('instruction') }}>{w}</span>
        ))}
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
        <span style={{ flex: '0 0 auto', color: INK.text, paddingBottom: mm(1), ...gType('body') }}>{row?.base}</span>
        <span style={{ flex: '0 0 auto', color: theme.primary, paddingBottom: mm(1), ...gType('body') }}>→</span>
        <div style={{ flex: 1 }}><WriteLine color={INK_LINE} /></div>
      </div>
    </div>
  );
}

function ClozeItems({ items, theme }: { items: SwykItem[]; theme: Theme }) {
  const rows = items.map((it) => {
    const u = getGrammarUnitByCode(it.sourceUnit);
    return u?.format === 'cloze' ? { row: u.cloze.rows[it.rowRef], bank: u.cloze.wordBank } : undefined;
  }).filter((r): r is { row: { before: string; after: string; answer: string }; bank: string[] } => !!r?.row);
  const bank = [...new Set(rows.flatMap((r) => r.bank))];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(3) }}>
      <div style={{ display: 'flex', gap: mm(3), flexWrap: 'wrap' }}>
        {bank.map((w) => (
          <span key={w} style={{ color: theme.accentText, border: `0.4mm solid ${theme.primary}`, borderRadius: mm(1), padding: `${mm(0.5)} ${mm(3)}`, ...gType('instruction') }}>{w}</span>
        ))}
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, ...gType('body') }}>
          <span>{r.row.before}</span>
          <span style={{ display: 'inline-block', width: mm(24), borderBottom: `0.4mm solid ${INK_LINE}`, margin: `0 ${mm(3)}`, height: '0.9em' }} />
          <span>{r.row.after}</span>
        </div>
      ))}
    </div>
  );
}

function RewriteItem({ item, theme }: { item: SwykItem; theme: Theme }) {
  const u = getGrammarUnitByCode(item.sourceUnit);
  if (u?.format !== 'rewrite') return null;
  const row = u.rewrite.rows[item.rowRef];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(1) }}>
      <div style={{ background: theme.light, borderRadius: mm(4), padding: `${mm(1.5)} ${mm(4)}`, color: INK.text, ...gType('body') }}>{row?.text}</div>
      <WriteLine lines={2} color={INK_LINE} />
    </div>
  );
}

/** Render one block's items, grouped by task type so paired tasks (two tick
 *  rows, two match pairs, two cloze gaps) read as one mini-activity. */
function BlockBody({ items, theme }: { items: SwykItem[]; theme: Theme }) {
  const ticks = items.filter((i) => i.task === 'Tick the kind');
  const matches = items.filter((i) => i.task === 'Match the short form');
  const builds = items.filter((i) => i.task === 'Grow the noun phrase');
  const clozes = items.filter((i) => i.task === 'Choose the joining word');
  const rewrites = items.filter((i) => i.task === 'Rewrite in the past');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: mm(4) }}>
      {ticks.length > 0 && (
        <div>
          <div style={{ color: theme.accentText, marginBottom: mm(1), ...gType('instruction') }}>Tick the kind</div>
          <TickItems items={ticks} theme={theme} />
        </div>
      )}
      {matches.length > 0 && (
        <div>
          <div style={{ color: theme.accentText, marginBottom: mm(1), ...gType('instruction') }}>Draw a line to join each pair to its short form</div>
          <MatchItems items={matches} theme={theme} />
        </div>
      )}
      {builds.length > 0 && (
        <div>
          <div style={{ color: theme.accentText, marginBottom: mm(1), ...gType('instruction') }}>Write the noun phrase again, grown bigger</div>
          {builds.map((it, i) => <BuildItem key={i} item={it} theme={theme} />)}
        </div>
      )}
      {clozes.length > 0 && (
        <div>
          <div style={{ color: theme.accentText, marginBottom: mm(1), ...gType('instruction') }}>Write the best joining word in each gap</div>
          <ClozeItems items={clozes} theme={theme} />
        </div>
      )}
      {rewrites.length > 0 && (
        <div>
          <div style={{ color: theme.accentText, marginBottom: mm(1), ...gType('instruction') }}>Rewrite each one all in the past tense</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: mm(3) }}>
            {rewrites.map((it, i) => <RewriteItem key={i} item={it} theme={theme} />)}
          </div>
        </div>
      )}
    </div>
  );
}

export default function T6Swyk({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T6Content;
  const theme = getLevelTheme(6);

  return (
    <FlowyPage theme={theme} title={pool.title} page={page}>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: mm(4) }}>
        {c.blocks.map((b, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column' }}>
            <BlockBody items={b.items} theme={theme} />
          </div>
        ))}
        {c.writeTask && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...gType('instruction'), color: INK.text }}>{c.writeTask.prompt}</div>
              <div style={{ marginTop: mm(3), marginBottom: mm(2) }}>
                <CheckStrip items={['capitalLetter', 'fingerSpaces', 'fullStop']} theme={theme} />
              </div>
              <WriteLine lines={c.writeTask.lines} color={INK_LINE} />
            </div>
          </div>
        )}
      </div>
      <FootArt slot={footArtSlot(pool.art)} heightMm={18} />
    </FlowyPage>
  );
}
