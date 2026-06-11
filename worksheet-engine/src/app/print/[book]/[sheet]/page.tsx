import { notFound } from 'next/navigation';
import type { ActivityType } from '@/data/schema';
import { getBook, getTemplate, allSheets } from '@/lib/registry';

// Render a single worksheet (one A4 page) by book + activity type.
// This is the route Puppeteer prints to PDF.

export function generateStaticParams() {
  return allSheets();
}

export default function PrintWorksheet({ params }: { params: { book: string; sheet: string } }) {
  const book = getBook(params.book);
  if (!book) notFound();

  const activity = params.sheet as ActivityType;
  if (!book.activityTypes.includes(activity)) notFound();

  const Template = getTemplate(activity);
  if (!Template) notFound();

  return <Template book={book} />;
}
