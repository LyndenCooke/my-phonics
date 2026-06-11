import { notFound } from 'next/navigation';
import { getGrammarUnit, getGrammarPage, allGrammarSheets } from '@/lib/grammarRegistry';
import FlowySheet from '@/components/grammar/FlowySheet';

// Render a single grammar worksheet (one A4 page) by unit id, in the locked
// "flowy" style. A STATIC `grammar` segment, so /print/grammar/g-l6-1 resolves
// here, not the dynamic /print/[book]/[sheet] book route.

export function generateStaticParams() {
  return allGrammarSheets().map(({ sheet }) => ({ unit: sheet }));
}

export default function PrintGrammarSheet({ params }: { params: { unit: string } }) {
  const unit = getGrammarUnit(params.unit);
  if (!unit) notFound();
  return <FlowySheet unit={unit} page={getGrammarPage(params.unit)} />;
}
