// ---------------------------------------------------------------------------
// Layout-faithful remake: a structural reading of an uploaded sheet (see
// vision.analyzeWorksheetLayout) -> a WorksheetSpec built from the generic
// layouts, wearing our header and footer.
//
// The phonics remake path asks "which of our phonics activities is this?" and
// can only handle sheets that have a phonics equivalent. This path rebuilds the
// SHAPE of any sheet — write-about-the-picture, answer-the-questions, fill-the-
// table — and fills it with our content where we have an engine for the subject,
// or leaves honest blanks where we don't.
//
// Never copies the source's words or artwork: the vision pass reports counts and
// shapes, and rewrites the heading in its own words.
// ---------------------------------------------------------------------------
import { CATALOG } from '../blocks/blocks.mjs';
import { getSubject } from '../design/subjects.mjs';
import { pickPictureWords } from '../content/content.mjs';
import { rng } from '../content/content.mjs';

const clamp = (v, lo, hi, dflt) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.trunc(n))) : dflt;
};

/** Turn one reported section into a block, or null if we can't honour it. */
function sectionToBlock(section, { subject, level, grapheme, rand }) {
  const type = String(section?.type ?? '').trim();
  const cat = CATALOG[type];

  // Pictures: only from our own clipart, and only when the sheet is phonics
  // (that's the only content engine we have). Otherwise the slot stays an empty
  // frame — an honest blank beats a wrong picture.
  const pictures = (count) => {
    if (subject !== 'phonics') return Array.from({ length: count }, () => ({}));
    const words = pickPictureWords({ level, grapheme, count, rand });
    return Array.from({ length: count }, (_, i) => (words[i] ? { picture: words[i] } : {}));
  };

  switch (type) {
    case 'illustrated_write': {
      const count = clamp(section.count, 2, 5, 4);
      return { type, items: pictures(count), linesPerItem: clamp(section.linesPerItem, 1, 6, 3) };
    }
    case 'prompt_grid': {
      const count = clamp(section.count, 2, 12, 6);
      return {
        type, items: pictures(count),
        perRow: clamp(section.perRow, 2, 4, 3),
        answer: section.answer === 'box' ? 'box' : 'line',
      };
    }
    case 'question_rows': {
      const count = clamp(section.count, 2, 10, 5);
      // No content engine for the subject => numbered blanks the teacher fills.
      return {
        type, items: Array.from({ length: count }, () => ({ prompt: '' })),
        answer: section.answer === 'box' ? 'box' : 'line',
      };
    }
    case 'write_lines': {
      // Plain ruled lines are illustrated_write with no picture column.
      return { type: 'illustrated_write', items: [{}], linesPerItem: clamp(section.count, 2, 12, 6), artWidthMm: 0 };
    }
    case 'check_strip': {
      const labels = Array.isArray(section.labels) && section.labels.length
        ? section.labels.filter((l) => typeof l === 'string').slice(0, 4)
        : ['capital letters', 'gaps', 'full stops'];
      return { type, items: labels };
    }
    case 'fill_table': {
      const rows = clamp(section.rows, 2, 8, 3);
      const cols = clamp(section.cols, 2, 8, 4);
      return { type, rows: Array.from({ length: rows }, () => Array.from({ length: cols }, () => null)) };
    }
    case 'match_columns': {
      // Pairs need content we don't have for a non-phonics sheet; skip rather
      // than emit an unsolvable puzzle.
      return null;
    }
    default:
      return cat ? null : null;
  }
}

/**
 * @param analysis  output of analyzeWorksheetLayout
 * @returns a WorksheetSpec, or null if nothing usable was reported.
 */
export function planFromLayout(analysis, { seed = 42, level = null, grapheme = null } = {}) {
  const sections = Array.isArray(analysis?.sections) ? analysis.sections : [];
  if (!sections.length) return null;

  const subjectId = getSubject(analysis?.subject).id;
  const rand = rng(seed);
  const blocks = sections
    .map((s) => sectionToBlock(s, { subject: subjectId, level, grapheme, rand }))
    .filter(Boolean);
  if (!blocks.length) return null;

  const title = typeof analysis?.title === 'string' && analysis.title.trim()
    ? analysis.title.trim().slice(0, 70)
    : 'Have a go';
  const task = typeof analysis?.task === 'string' ? analysis.task.trim().slice(0, 90) : '';

  // The sheet heading already says what this is. Repeating it as the section
  // title prints the same sentence twice, so the lead block keeps the
  // instruction only.
  if (blocks[0]) {
    if (!blocks[0].instr && task) blocks[0].instr = task;
    blocks[0].title = '';
  }

  return {
    subject: subjectId,
    title,
    subtitle: null,
    level: subjectId === 'phonics' ? (level ?? 1) : null,
    stage: typeof analysis?.stage === 'string' ? analysis.stage.slice(0, 12) : null,
    grapheme: subjectId === 'phonics' ? grapheme : null,
    topic: subjectId === 'phonics' ? null : title,
    strand: null,
    seed,
    slug: `remake-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${seed}`,
    blocks,
    spare: [],
  };
}
