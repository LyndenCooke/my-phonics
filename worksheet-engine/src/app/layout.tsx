import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MyPhonicsBooks — Worksheet Engine',
  description: 'Locked-layout, level-themed, code-generated phonics worksheets.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <body>{children}</body>
    </html>
  );
}
