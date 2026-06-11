import { notFound } from 'next/navigation';
import GrammarBooklet from '@/components/grammar/booklet/GrammarBooklet';
import { getBookletMeta } from '@/lib/grammarRegistry';

// Render a full grammar booklet (all pages: cover, contents, how-to, the units,
// the review, answers, certificate) for one level, in the locked flowy style.
// A STATIC `grammar-booklet` segment so the two-arg PDF script can hit it as
//   npm run pdf grammar-booklet 6   ->   /print/grammar-booklet/6
// and Chrome prints each `.page` as one A4 page (page-break-after: always).

export function generateStaticParams() {
  return [{ level: '6' }];
}

export default function PrintGrammarBooklet({ params }: { params: { level: string } }) {
  const level = Number(params.level);
  if (!Number.isFinite(level) || !getBookletMeta(level)) notFound();
  return <GrammarBooklet level={level} />;
}
