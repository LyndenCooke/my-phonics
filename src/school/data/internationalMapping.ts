/**
 * International curriculum equivalents for the 8-level school structure.
 *
 * Used on the assessment results screen (so a US/Australian/IB family sees
 * their familiar curriculum tier) and on the school dashboard for
 * international school imports.
 */

export interface InternationalLevelMapping {
  level: number;
  name: string;
  ukLetterSounds: string;
  ukRwi: string;
  ukYearGroup: string;
  australia: string;
  usCommonCore: string;
  ibPyp: string;
}

export const INTERNATIONAL_MAPPING: InternationalLevelMapping[] = [
  { level: 1, name: 'Ditties',           ukLetterSounds: 'Phase 2 (early)',                       ukRwi: 'Early Set 1',     ukYearGroup: 'Reception (Autumn)', australia: 'Foundation',            usCommonCore: 'Pre-K / K',    ibPyp: 'EY1' },
  { level: 2, name: 'First Sounds',      ukLetterSounds: 'Phase 2 (late) + Phase 3 singles',      ukRwi: 'Set 1 (singles)', ukYearGroup: 'Reception',          australia: 'Foundation',            usCommonCore: 'Kindergarten', ibPyp: 'EY1' },
  { level: 3, name: 'Special Friends',   ukLetterSounds: 'Phase 3 (consonant digraphs) + Phase 4', ukRwi: 'Set 1 (digraphs)', ukYearGroup: 'Reception (late)',  australia: 'Foundation / Year 1',   usCommonCore: 'Kindergarten', ibPyp: 'EY2' },
  { level: 4, name: 'Longer Sounds',     ukLetterSounds: 'Phase 3 (vowel digraphs)',              ukRwi: 'Set 2',           ukYearGroup: 'Reception–Year 1',   australia: 'Year 1',                usCommonCore: 'Grade 1',      ibPyp: 'EY2' },
  { level: 5, name: 'New Spellings',     ukLetterSounds: 'Phase 5 (split digraphs)',              ukRwi: 'Early Set 3',     ukYearGroup: 'Year 1',             australia: 'Year 1–2',              usCommonCore: 'Grade 1',      ibPyp: 'Grade 1' },
  { level: 6, name: 'Building Fluency',  ukLetterSounds: 'Phase 5 (alternatives)',                ukRwi: 'Set 3 continued', ukYearGroup: 'Year 1–2',           australia: 'Year 2',                usCommonCore: 'Grade 1–2',    ibPyp: 'Grade 1–2' },
  { level: 7, name: 'Reading Together',  ukLetterSounds: 'Phase 5 (late) – Phase 6',              ukRwi: 'Grey (final sounds)', ukYearGroup: 'Year 2',         australia: 'Year 2–3',              usCommonCore: 'Grade 2',      ibPyp: 'Grade 2' },
  { level: 8, name: 'Reading Champion',  ukLetterSounds: 'Phase 6 (morphology)',                  ukRwi: 'Grey (suffixes)', ukYearGroup: 'Year 2–3',           australia: 'Year 3',                usCommonCore: 'Grade 2–3',    ibPyp: 'Grade 2–3' },
];

export function getInternationalMapping(level: number): InternationalLevelMapping | undefined {
  return INTERNATIONAL_MAPPING.find((m) => m.level === level);
}
