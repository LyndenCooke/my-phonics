import { NextResponse } from 'next/server';
import { allSheets } from '@/lib/registry';
import { allSoundSheets } from '@/lib/soundRegistry';
import { allGrammarSheets } from '@/lib/grammarRegistry';

// Single source of truth for "what can be printed", consumed by the PDF script.
export const dynamic = 'force-static';

// Workbook build profiles (level + edition). Edition B is the primary build;
// Edition A exists as a dry-run-tested code path only and is not listed.
const WORKBOOKS = [{ book: 'workbook', sheet: '6b' }];

export function GET() {
  return NextResponse.json([...allSheets(), ...allSoundSheets(), ...allGrammarSheets(), ...WORKBOOKS]);
}
