import { notFound } from 'next/navigation';
import { getSoundSheet, allSoundSheets } from '@/lib/soundRegistry';
import SingleSound from '@/components/templates/SingleSound';

// Render a single-grapheme worksheet (one A4 page) by grapheme id.
// A STATIC `sound` segment, so /print/sound/t resolves here, not to the
// dynamic /print/[book]/[sheet] book route.

export function generateStaticParams() {
  return allSoundSheets().map(({ sheet }) => ({ sound: sheet }));
}

export default function PrintSoundSheet({ params }: { params: { sound: string } }) {
  const sheet = getSoundSheet(params.sound);
  if (!sheet) notFound();
  return <SingleSound sheet={sheet} />;
}
