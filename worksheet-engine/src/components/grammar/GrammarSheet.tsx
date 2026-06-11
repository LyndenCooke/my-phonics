import React from 'react';
import type { GrammarUnit } from '@/data/grammarSchema';
import GrammarTickGrid from '@/components/grammar/GrammarTickGrid';
import GrammarBuild from '@/components/grammar/GrammarBuild';
import GrammarCloze from '@/components/grammar/GrammarCloze';
import GrammarCircle from '@/components/grammar/GrammarCircle';
import GrammarMatch from '@/components/grammar/GrammarMatch';
import GrammarRewrite from '@/components/grammar/GrammarRewrite';

// Dispatch a grammar unit to the template for its format. The discriminated
// union narrows each case, so the wrong payload can't reach the wrong template.

export default function GrammarSheet({ unit }: { unit: GrammarUnit }) {
  switch (unit.format) {
    case 'tickgrid':
      return <GrammarTickGrid unit={unit} />;
    case 'build':
      return <GrammarBuild unit={unit} />;
    case 'cloze':
      return <GrammarCloze unit={unit} />;
    case 'circle':
      return <GrammarCircle unit={unit} />;
    case 'match':
      return <GrammarMatch unit={unit} />;
    case 'rewrite':
      return <GrammarRewrite unit={unit} />;
  }
}
