import React from 'react';
import type {
  GrammarUnit, BuildUnit, TickGridUnit, ClozeUnit, CircleUnit, MatchUnit, RewriteUnit, ReviewUnit,
} from '@/data/grammarSchema';
import { getLevelTheme } from '@/design/levelThemes';
import { INK } from '@/design/tokens';
import Clipart, { hasClipart } from '@/components/Clipart';
import { mm } from '@/components/SheetShell';
import { WriteLine } from '@/components/WriteLine';
import { FlowyLayout } from '@/components/grammar/FlowyLayout';
import { gType, CLOZE_GAP_WIDTH, CLOZE_GAP_PAD, WRITE_LINE_GAP } from '@/design/grammarTokens';
import { resolveReviewText } from '@/lib/grammarRegistry';

// FlowySheet — renders ONE grammar unit's activity body in the locked flowy
// style. FlowyLayout owns all chrome (header, Watch-first, instruction, apply,
// footer, page badge, decorations). Each body fills only the activity area, on
// the ONE type scale, NO bold, plain black writing lines at --write-line-gap.

const INK_LINE = '#1A1A1A';

// ---- tickgrid --------------------------------------------------------------
// Flexing sentence column + four fixed 28 mm tick columns. 6 mm tick boxes,
// hairline row separators, category headers at instruction role (no subtitles).
function TickGridBody({ unit }: { unit: TickGridUnit }) {
  const theme = getLevelTheme(unit.level);
  const categories = unit.tickgrid.categories ?? unit.tickgrid.columns;
  const rows = unit.tickgrid.rows;
  // The four category columns are a right-aligned 30 mm block ending at the
  // content edge (headers at instruction size, no wrap, "Exclamation" clears the
  // margin); the flexing sentence column takes the remaining ~78 mm and wraps
  // the few longest L6 sentences, each row's auto height centring its tick boxes.
  const cols = `1fr repeat(${categories.length}, 30mm)`;
  const sep = `0.3mm solid ${theme.primary}1F`; // level colour at ~12%
  const tick: React.CSSProperties = {
    width: mm(6), height: mm(6), border: `0.4mm solid ${INK_LINE}`, borderRadius: mm(1), flex: '0 0 auto',
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* header row: empty sentence cell + the four category words */}
      <div style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'end', paddingBottom: mm(1) }}>
        <span />
        {categories.map((c) => (
          <span key={c} style={{ textAlign: 'center', whiteSpace: 'nowrap', color: theme.accentText, ...gType('instruction') }}>{c}</span>
        ))}
      </div>
      {/* one row per sentence: auto height (min 12 mm) so a wrapped sentence
          grows its own row and the tick boxes stay vertically centred. */}
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, alignItems: 'center', minHeight: mm(12), borderTop: sep, paddingTop: mm(0.5), paddingBottom: mm(0.5) }}>
          <span style={{ color: INK.text, ...gType('body') }}>{r.text}</span>
          {categories.map((c) => (
            <span key={c} style={{ display: 'flex', justifyContent: 'center' }}><span style={tick} /></span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ---- build -----------------------------------------------------------------
// Tinted 4×2 word bank, then rows: line-art icon + base phrase + centred arrow +
// one ruled line.
function BuildBody({ unit }: { unit: BuildUnit }) {
  const theme = getLevelTheme(unit.level);
  const { wordBank, rows } = unit.build;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', background: theme.light, borderRadius: mm(6), padding: `${mm(4)} ${mm(6)}` }}>
        <div style={{ ...gType('instruction'), color: theme.accentText, marginBottom: mm(2) }}>Choose a word</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', rowGap: mm(2), columnGap: mm(3), ...gType('body'), color: INK.text }}>
          {wordBank.map((w) => (
            <span key={w} style={{ textAlign: 'center' }}>{w}</span>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', paddingTop: mm(2) }}>
        {rows.map((r, i) => {
          // rowArt pattern: one asset key per row (overrides the per-row icon).
          const icon = unit.rowArt?.[i] ?? r.icon;
          return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: mm(4) }}>
            {/* the reserved row-art column: fixed box, clipped — art cannot
                leave it and the row content starts after it. */}
            <span style={{ flex: '0 0 auto', width: mm(18), height: mm(18), overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
              {hasClipart(icon) && <Clipart imageKey={icon!} word={r.base} fill multiply />}
            </span>
            <span style={{ flex: '0 0 auto', width: mm(34), color: INK.text, paddingBottom: mm(1.5), ...gType('body') }}>{r.base}</span>
            <span style={{ flex: '0 0 auto', color: theme.primary, paddingBottom: mm(1.5), ...gType('body') }}>→</span>
            <div style={{ flex: 1 }}><WriteLine color={INK_LINE} /></div>
          </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- cloze -----------------------------------------------------------------
// Bank chips (level-stroke outline, no fill), then sentence rows with a fixed
// 26 mm gap (3 mm even padding) and NO per-row ruled lines.
function ClozeBody({ unit }: { unit: ClozeUnit }) {
  const theme = getLevelTheme(unit.level);
  const { wordBank, rows } = unit.cloze;
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', gap: mm(6), flexWrap: 'wrap', paddingBottom: mm(4) }}>
        {wordBank.map((w) => (
          <span key={w} style={{ color: theme.accentText, border: `0.4mm solid ${theme.primary}`, borderRadius: mm(1), padding: `${mm(1)} ${mm(6)}`, ...gType('body') }}>{w}</span>
        ))}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', color: INK.text, ...gType('body') }}>
            <span>{r.before}</span>
            <span style={{ display: 'inline-block', width: CLOZE_GAP_WIDTH, borderBottom: `0.4mm solid ${INK_LINE}`, margin: `0 ${CLOZE_GAP_PAD}`, height: '0.9em' }} />
            <span>{r.after}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- circle ----------------------------------------------------------------
// The marking convention is taught in the Watch-first box; here just the
// sentences, no legend, no ruled lines.
function CircleBody({ unit }: { unit: CircleUnit }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
      {unit.circle.rows.map((r, i) => (
        <div key={i} style={{ color: INK.text, ...gType('body') }}>{r.text}</div>
      ))}
    </div>
  );
}

// ---- match -----------------------------------------------------------------
// Two chip columns (level-stroke outline, no fill); right column shuffled;
// connect dots on the inner edges. Vertical gap = --write-line-gap.
function rotate<T>(arr: T[], by: number): T[] {
  const n = arr.length; const k = ((by % n) + n) % n;
  return [...arr.slice(k), ...arr.slice(0, k)];
}
function MatchBody({ unit }: { unit: MatchUnit }) {
  const theme = getLevelTheme(unit.level);
  const left = unit.match.pairs.map((p) => p.left);
  const right = unit.match.rightShuffled ?? rotate(unit.match.pairs.map((p) => p.right), 2);
  const chip: React.CSSProperties = {
    border: `0.4mm solid ${theme.primary}`, borderRadius: mm(2), display: 'flex', alignItems: 'center',
    padding: `0 ${mm(4)}`, height: mm(14), color: INK.text, ...gType('body'),
  };
  const dot: React.CSSProperties = { width: mm(2.4), height: mm(2.4), borderRadius: '50%', background: theme.primary, flex: '0 0 auto' };
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: WRITE_LINE_GAP }}>
      {left.map((l, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 24mm 1fr', alignItems: 'center' }}>
          <div style={{ ...chip, justifyContent: 'space-between' }}><span>{l}</span><span style={dot} /></div>
          <div />
          <div style={{ ...chip, gap: mm(3) }}><span style={dot} /><span>{right[i]}</span></div>
        </div>
      ))}
    </div>
  );
}

// ---- rewrite ---------------------------------------------------------------
// Tinted source strip + two plain ruled lines per row. Inter-row gap 5 mm.
function RewriteBody({ unit }: { unit: RewriteUnit }) {
  const theme = getLevelTheme(unit.level);
  const lines = unit.rewrite.rowWriteLines ?? 2;
  // flex-start with a fixed inter-row gap so the dense rewrite rows pack from the
  // top and leave clean slack above the apply block (no crowding).
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', gap: mm(2) }}>
      {unit.rewrite.rows.map((r, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: mm(1) }}>
          {/* source strip: one body line plus a little padding (the rewrite is the
              densest page, so strip padding and gaps stay tight to fit one page) */}
          <div style={{ background: theme.light, borderRadius: mm(4), padding: `${mm(1.5)} ${mm(4)}`, color: INK.text, ...gType('body') }}>{r.text}</div>
          <WriteLine lines={lines} color={INK_LINE} />
        </div>
      ))}
    </div>
  );
}

// ---- review ----------------------------------------------------------------
// Show what you know. Each item reuses an approved row by pointer; the display
// sentence is resolved from the source unit, so no new decodable text is added.
function ReviewBody({ unit }: { unit: ReviewUnit }) {
  const theme = getLevelTheme(unit.level);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
      {unit.review.items.map((it, i) => {
        const text = resolveReviewText(it.sourceUnit, it.rowRef);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: mm(1) }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: mm(4) }}>
              <span style={{ flex: '0 0 auto', color: theme.accentText, ...gType('instruction') }}>{it.task}</span>
              <span style={{ color: INK.text, ...gType('body') }}>{text}</span>
            </div>
            <WriteLine color={INK_LINE} />
          </div>
        );
      })}
    </div>
  );
}

const BODY: Record<GrammarUnit['format'], (p: { unit: any }) => React.JSX.Element> = {
  tickgrid: TickGridBody,
  build: BuildBody,
  cloze: ClozeBody,
  circle: CircleBody,
  match: MatchBody,
  rewrite: RewriteBody,
  review: ReviewBody,
};

export default function FlowySheet({ unit, page }: { unit: GrammarUnit; page: number }) {
  const Body = BODY[unit.format];
  return (
    <FlowyLayout unit={unit} page={page}>
      <Body unit={unit} />
    </FlowyLayout>
  );
}
