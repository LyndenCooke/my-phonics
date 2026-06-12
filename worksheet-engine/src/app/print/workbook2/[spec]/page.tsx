import { notFound } from 'next/navigation';
import React from 'react';
import { getLevelTheme } from '@/design/levelThemes';
import { getGrammarUnit } from '@/lib/grammarRegistry';
import { SpellItPage, SentencesPage, HandwritingPage } from '@/components/workbook2/W2Skills';
import { GrammarPage, AnswerItPage, BigWritePage } from '@/components/workbook2/W2Writing';

// ---------------------------------------------------------------------------
// WORKBOOK REDESIGN EXEMPLAR — one fortnight (The Purple Purse) in the book
// back-matter design language, for Lynden's design decision. SEVEN pages
// replace the old eleven: Spell it (practise + test on one page), grammar A,
// Sentences (hold + dictation on one page), Answer it, grammar B, Big write
// (scene + lines, no plan box), Handwriting (model on every row).
//
//   npm run pdf workbook2 6b1   ->   /print/workbook2/6b1
//
// Content provenance is unchanged from the pilot: approved unit data
// verbatim, selections per L6_SELECTIONS.md, SW2 questions still an
// authoring dependency. If this direction is approved the pages get wired
// into the pool/assembly pipeline (the assembler and pool schema stand).
// ---------------------------------------------------------------------------

export function generateStaticParams() {
  return [{ spec: '6b1' }];
}

// Dictation sentences for this fortnight live in the pool data and Answers;
// repeated here as a comment for traceability only (never printed):
//   1. Dad came with me to search. (Book L6.1 p2)
//   2. We walked up and down the street. (Book L6.1 p2)

export default function PrintWorkbook2({ params }: { params: { spec: string } }) {
  if (params.spec !== '6b1') notFound();
  const theme = getLevelTheme(6);
  const contractions = getGrammarUnit('g-l6-6');
  const tense = getGrammarUnit('g-l6-7');
  if (!contractions || !tense) notFound();

  return (
    <>
      <SpellItPage
        page={3}
        theme={theme}
        practise={['purple', 'purse', 'church', 'fern', 'their', 'oh']}
      />
      <GrammarPage page={4} unit={contractions} theme={theme} />
      <SentencesPage
        page={5}
        theme={theme}
        hold={[
          'I turned my pockets inside out, but it was not there.',
          'Then a market lady held up a purple purse!',
        ]}
        listenSlots={2}
      />
      <AnswerItPage page={6} theme={theme} questions={[null, null, null]} />
      <GrammarPage page={7} unit={tense} theme={theme} />
      <BigWritePage
        page={8}
        theme={theme}
        prompt="Look at this moment from the book. Write what happens next."
        sceneSrc="/storyart/l6_1/page6.png"
        lines={10}
      />
      <HandwritingPage
        page={9}
        theme={theme}
        patterns={['ur er ur er', 'purse purple turn', 'her fern never', 'church burst hurt']}
        phrases={['the soft purple purse', 'their oh could']}
      />
    </>
  );
}
