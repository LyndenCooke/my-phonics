import { notFound } from 'next/navigation';
import W2Booklet from '@/components/workbook2/W2Booklet';
import { w2Levels } from '@/data/workbook2/registry';

// One whole-level workbook per render:
//   npm run pdf workbook2 6   ->   /print/workbook2/6

export function generateStaticParams() {
  return w2Levels().map((n) => ({ spec: String(n) }));
}

export default function PrintWorkbook2({ params }: { params: { spec: string } }) {
  const level = Number(params.spec);
  if (!Number.isFinite(level) || !w2Levels().includes(level)) notFound();
  return <W2Booklet level={level} />;
}
