import Link from 'next/link';
import { allSheets, getBook } from '@/lib/registry';

// Dev index: every renderable worksheet, linked to its print route.
export default function Home() {
  const sheets = allSheets();
  return (
    <main style={{ maxWidth: 760, margin: '40px auto', fontFamily: 'system-ui', color: '#1f1f1f' }}>
      <h1>MyPhonicsBooks — Worksheet Engine</h1>
      <p style={{ color: '#555' }}>Locked layout, level-themed, deterministic. Click a sheet to preview the print page.</p>
      <ul style={{ lineHeight: 2 }}>
        {sheets.map(({ book, sheet }) => (
          <li key={`${book}/${sheet}`}>
            <Link href={`/print/${book}/${sheet}`}>
              {getBook(book)?.bookTitle} — {sheet}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
