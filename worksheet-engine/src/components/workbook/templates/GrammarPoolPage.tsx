import React from 'react';
import type { PoolObject, T2Content, ArtSlot } from '@/data/pool/schema';
import type { GrammarUnit, PageIllustration } from '@/data/grammarSchema';
import FlowySheet from '@/components/grammar/FlowySheet';
import { getGrammarUnit } from '@/lib/grammarRegistry';

// ---------------------------------------------------------------------------
// GrammarPoolPage — T2 through the pool/assembly pipeline. The approved unit
// is reused VERBATIM (rows, examples, apply, banks — nothing is touched); the
// pool object supplies only what assembly owns: the page number, the header
// title (B4's revisit page is titled "Fix and answer" per the teacher
// sequence) and the ART SLOT ASSIGNMENTS from the workbook plan, which map
// onto the same reserved zones the benchmark booklet uses:
//
//   grounded-box        → the Watch-first box's right rail (watchArt)
//   perch/grounded-foot → the apply right rail (applyRail), or the full-width
//                         foot band (footScene) when the plan sizes it ≥30 mm
//
// Rendering goes through the locked FlowySheet, so a unit that keeps its
// booklet art placements renders byte-identical to the benchmark.
// ---------------------------------------------------------------------------

function illustrationFor(art: ArtSlot[] | undefined, fallback?: PageIllustration): PageIllustration | undefined {
  const slot = (art ?? []).find((a) => a.placement === 'perch' || a.placement === 'grounded-foot');
  if (!slot) return fallback;
  const pattern = (slot.sizeMm ?? 0) >= 30 ? 'footScene' : 'applyRail';
  return { pattern, assets: [slot.key], relatesTo: `workbook plan slot: ${slot.key} ${slot.placement}` };
}

export default function GrammarPoolPage({ pool, page }: { pool: PoolObject; page: number }) {
  const c = pool.content as T2Content;
  const base = getGrammarUnit(c.unitId);
  if (!base) throw new Error(`Unknown grammar unit ${c.unitId} for pool page ${pool.id}.`);

  // The workbook revisit page reuses the approved review unit verbatim but is
  // titled "Fix and answer"; its instruction keeps the approved wording's
  // doing part ("Do one of each.") without re-announcing "Show what you know"
  // (that title belongs to the closing assessment pages).
  const isRecastReview = base.format === 'review' && pool.title !== base.name;

  const unit: GrammarUnit = {
    ...base,
    name: pool.title,
    doInstruction: isRecastReview ? 'Do one of each.' : base.doInstruction,
    illustration: illustrationFor(pool.art, base.illustration),
    watchArt: c.watchArt ?? base.watchArt,
  };

  return <FlowySheet unit={unit} page={page} />;
}
