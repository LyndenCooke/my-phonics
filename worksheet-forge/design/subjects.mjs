// ---------------------------------------------------------------------------
// Subjects — what a sheet is ABOUT, and the chrome that follows from it.
//
// The forge started phonics-only, so "phonics" was baked into the header title,
// the pill, the footer and the colour scheme. A maths sheet wearing that chrome
// is wrong on its face. Everything subject-specific about a sheet's FRAMING
// lives here; blocks and layout stay subject-neutral.
//
// `theme` is how a sheet gets its colours. Phonics uses the curriculum ledger
// level colours (L1 pink … L8 teal) — that mapping is pedagogy, not decoration,
// so it must never leak onto a subject that has no levels. Other subjects carry
// their own single palette.
// ---------------------------------------------------------------------------
import { getLevelTheme } from './tokens.mjs';

/**
 * brand    — the name in the footer's bottom-left.
 * tagline  — the line beside it.
 * pill     — default label in the header's second pill (a sheet may override
 *            it with its own strand).
 * levelled — true if sheets carry a curriculum level (drives the "Level N" pill
 *            and the ledger colours).
 * titleFor — how the default sheet title reads when nothing better is supplied.
 */
export const SUBJECTS = {
  phonics: {
    id: 'phonics',
    brand: 'MyPhonicsBooks',
    tagline: 'decodable phonics practice',
    pill: 'Phonics',
    levelled: true,
    titleFor: (spec) => (spec.grapheme ? `The Sound ${spec.grapheme}` : 'Phonics practice'),
  },
  maths: {
    id: 'maths',
    // NOTE: placeholder brand — change this one line when the name is decided.
    brand: 'MyMathsBooks',
    tagline: 'practice that adds up',
    pill: 'Maths',
    levelled: false,
    palette: { primary: '#0F766E', light: '#E4FBF7', border: '#8EE6DB', accentText: '#0F766E' },
    titleFor: (spec) => spec.topic ?? 'Maths practice',
  },
  literacy: {
    id: 'literacy',
    brand: 'MyPhonicsBooks',
    tagline: 'reading and writing practice',
    pill: 'Literacy',
    levelled: false,
    palette: { primary: '#6D28D9', light: '#F1EBFE', border: '#C9B6FB', accentText: '#6D28D9' },
    titleFor: (spec) => spec.topic ?? 'Literacy practice',
  },
  // Anything we can lay out but can't name: keeps the chrome honest rather than
  // claiming a subject we haven't actually modelled.
  general: {
    id: 'general',
    brand: 'MyPhonicsBooks',
    tagline: 'classroom practice',
    pill: 'Practice',
    levelled: false,
    palette: { primary: '#1D4ED8', light: '#E9F1FE', border: '#A8C7FB', accentText: '#1D4ED8' },
    titleFor: (spec) => spec.topic ?? 'Practice sheet',
  },
};

export const getSubject = (id) => SUBJECTS[id] ?? SUBJECTS.phonics;

/** The colours a spec renders in: ledger level theme for phonics, else the
 *  subject's own palette. Never silently falls back to a level colour. */
export function themeForSpec(spec) {
  const subject = getSubject(spec.subject);
  if (subject.levelled) return getLevelTheme(spec.level);
  return { level: null, name: subject.pill, ...subject.palette };
}

/** Header pills, left to right. A non-levelled sheet has no "Level N" to show,
 *  so it gets its year/stage if one was supplied, or nothing. */
export function pillsForSpec(spec) {
  const subject = getSubject(spec.subject);
  const pills = [];
  if (subject.levelled && spec.level) pills.push(`Level ${spec.level}`);
  else if (spec.stage) pills.push(spec.stage); // e.g. "Year 3"
  pills.push(spec.strand ?? subject.pill);
  return pills;
}

/** Footer caption: strand · level/stage · topic — whichever of those exist. */
export function footerCaptionFor(spec) {
  const subject = getSubject(spec.subject);
  const bits = [spec.strand ?? subject.pill];
  if (subject.levelled && spec.level) bits.push(`Level ${spec.level}`);
  else if (spec.stage) bits.push(spec.stage);
  if (subject.levelled && spec.grapheme) bits.push(spec.grapheme);
  else if (spec.topic) bits.push(spec.topic);
  return bits.join(' · ');
}
