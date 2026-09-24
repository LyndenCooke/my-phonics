import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Marks a block as child-reading content: always English, always
 * left-to-right — even when the page around it is Arabic, Urdu or Persian.
 * Wrap book pages, word lists, sound cards and in-game play areas in this.
 */
export default function EnglishOnly({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'span' | 'section';
}) {
  return (
    <Tag dir="ltr" lang="en" className={cn('text-left', className)}>
      {children}
    </Tag>
  );
}
