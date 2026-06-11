import { notFound } from 'next/navigation';
import WorkbookDocument from '@/components/workbook/WorkbookDocument';

// Render a full workbook for one (level, edition) build profile, e.g.
//   npm run pdf workbook 6b   ->   /print/workbook/6b
// Edition B is the primary build; the Edition A path exists for the dry-run
// test only and is not rendered in this pass (so no static param for it).

export function generateStaticParams() {
  return [{ spec: '6b' }];
}

export default function PrintWorkbook({ params }: { params: { spec: string } }) {
  const m = /^([1-8])(a|b)$/.exec(params.spec);
  if (!m) notFound();
  const level = Number(m[1]);
  const edition = m[2].toUpperCase() as 'A' | 'B';
  try {
    return <WorkbookDocument level={level} edition={edition} />;
  } catch {
    notFound();
  }
}
