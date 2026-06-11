import type { PoolObject } from '@/data/pool/schema';
import { L6_POOL, L6_BOOKS } from '@/data/pool/l6';

// ---------------------------------------------------------------------------
// WORKBOOK ASSEMBLER — a build profile takes (level, edition) and emits a
// document: pool objects in teaching order (the pool data files are authored
// in TEACHER_SEQUENCE order, which the plans define as page order), page
// numbers, the child-facing contents lines ("Book → pages", navigation only)
// and Answers last. Page numbers, contents lines and answer-key pagination
// are ASSEMBLY OUTPUTS — never stored in pool objects.
//
// Edition B (Keepable) is the primary build: every pool object binds in.
// Edition A (Classic) drops the pages the shipped books already carry
// (editions.A === 'book') — the code path exists and is dry-run tested, but
// no Edition A document is rendered in this pass.
// ---------------------------------------------------------------------------

export type Edition = 'A' | 'B';

export interface AssembledPage {
  /** 1-based page number in this edition's document. */
  page: number;
  kind: 'cover' | 'contents' | 'pool';
  pool?: PoolObject;
}

export interface ContentsLine {
  label: string;
  /** "3-13" or "47" — child-facing navigation only. */
  pages: string;
}

export interface AssembledWorkbook {
  level: number;
  edition: Edition;
  title: string;
  pages: AssembledPage[];
  contents: ContentsLine[];
  /** page number of the first Answers page (for cross-checks). */
  answersPage: number;
}

const POOL_BY_LEVEL: Record<number, PoolObject[]> = { 6: L6_POOL };
const BOOKS_BY_LEVEL: Record<number, Record<number, string>> = { 6: L6_BOOKS };

export function getPool(level: number): PoolObject[] {
  const pool = POOL_BY_LEVEL[level];
  if (!pool) throw new Error(`No workbook pool for level ${level}.`);
  return pool;
}

export function getBookTitles(level: number): Record<number, string> {
  return BOOKS_BY_LEVEL[level] ?? {};
}

function range(first: number, last: number): string {
  return first === last ? String(first) : `${first}-${last}`;
}

export function assembleWorkbook(level: number, edition: Edition): AssembledWorkbook {
  const pool = getPool(level);
  const books = getBookTitles(level);

  // Edition filter: B binds every object; A drops the book-carried pages.
  const bound = pool.filter((p) => (edition === 'B' ? true : p.editions.A === 'wb'));

  // Answers must close the document. The pool is in teaching order with the
  // ANS objects last; enforce rather than assume.
  const answers = bound.filter((p) => p.strand === 'ANS');
  const body = bound.filter((p) => p.strand !== 'ANS');

  const pages: AssembledPage[] = [
    { page: 1, kind: 'cover' },
    { page: 2, kind: 'contents' },
    ...body.map((p, i): AssembledPage => ({ page: 3 + i, kind: 'pool', pool: p })),
    ...answers.map((p, i): AssembledPage => ({ page: 3 + body.length + i, kind: 'pool', pool: p })),
  ];

  // Contents: one line per book ("Book → pages"), then the closing pages.
  const contents: ContentsLine[] = [];
  for (const bookNum of Object.keys(books).map(Number)) {
    const bookPages = pages.filter((pg) => pg.pool?.book === bookNum).map((pg) => pg.page);
    if (bookPages.length) {
      contents.push({ label: books[bookNum], pages: range(Math.min(...bookPages), Math.max(...bookPages)) });
    }
  }
  const swyk = pages.filter((pg) => pg.pool?.strand === 'SWYK').map((pg) => pg.page);
  if (swyk.length) contents.push({ label: 'Show what you know', pages: range(Math.min(...swyk), Math.max(...swyk)) });
  const stht = pages.find((pg) => pg.pool?.id.endsWith('ST-HT'));
  if (stht) contents.push({ label: 'Half-term spelling test', pages: String(stht.page) });
  const ansPages = pages.filter((pg) => pg.pool?.strand === 'ANS').map((pg) => pg.page);
  if (ansPages.length) contents.push({ label: 'Answers', pages: range(Math.min(...ansPages), Math.max(...ansPages)) });

  return {
    level,
    edition,
    title: 'Workbook',
    pages,
    contents,
    answersPage: ansPages.length ? Math.min(...ansPages) : 0,
  };
}

/** Dry-run validation used by the Edition A test and `npm run validate`:
 *  checks the assembly produces a coherent page list without rendering. */
export function validateAssembly(doc: AssembledWorkbook): string[] {
  const issues: string[] = [];
  const last = doc.pages[doc.pages.length - 1];
  if (!last || last.pool?.strand !== 'ANS') issues.push('Answers is not the final page.');
  doc.pages.forEach((pg, i) => {
    if (pg.page !== i + 1) issues.push(`Page numbering gap at index ${i} (page ${pg.page}).`);
  });
  const ids = doc.pages.filter((p) => p.pool).map((p) => p.pool!.id);
  if (new Set(ids).size !== ids.length) issues.push('Duplicate pool ids in the assembly.');
  if (doc.edition === 'B') {
    const poolSize = getPool(doc.level).length;
    if (doc.pages.length !== poolSize + 2) {
      issues.push(`Edition B page count ${doc.pages.length} != pool ${poolSize} + 2 front matter.`);
    }
  }
  if (doc.edition === 'A') {
    const carried = getPool(doc.level).filter((p) => p.editions.A === 'book');
    for (const c of carried) {
      if (ids.includes(c.id)) issues.push(`Edition A includes book-carried page ${c.id}.`);
    }
  }
  return issues;
}
