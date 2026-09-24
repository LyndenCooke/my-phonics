import { SoundMatsResources } from '@/components/SoundMatsResources';
import { JOURNEY_LEVELS, journeyPlacement } from '@/lib/levels8';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, FileText, Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';

// Force a real PDF file save instead of letting the browser navigate to the
// URL. A plain `<a href="/worksheets/….pdf" target="_blank">` is unreliable:
// on the installed PWA / mobile the SPA navigation (and Vercel's index.html
// catch-all) can intercept the request and hand back the app's HTML shell
// instead of the PDF — which is exactly the "opens as HTML, not PDF" bug.
// Fetching the file as a blob and clicking a hidden <a download> mirrors how
// book PDFs are saved in Index.tsx and guarantees the actual binary.
async function downloadPdf(href: string, filename: string) {
  try {
    const res = await fetch(href);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') ?? '';
    const blob = await res.blob();
    // If the catch-all served the SPA shell, we got text/html, not a PDF.
    if (type.includes('text/html') || blob.type.includes('text/html')) {
      throw new Error('not a pdf');
    }
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    toast.error(i18n.t('library:worksheets.downloadError'));
  }
}

function pdfFilename(title: string): string {
  const base = title.replace(/[^\w\s-]/g, '').trim() || 'worksheet';
  return `${base}.pdf`;
}

// The panel follows the 8-level reading journey (Curriculum Ledger), the same
// scale the library and the reader use. Worksheet packs on disk are still
// filed under their legacy 6-level book numbers ("1.3" = The Fish in the
// Tank), so each folder is PLACED on the journey via journeyPlacement().
// Labels are translated at render time (library:worksheets.category*).
const CATEGORIES: Array<{ id: string; level: number | null }> = [
  { id: 'sound-mats', level: null },
  ...JOURNEY_LEVELS.map((l) => ({ id: `level-${l.level}-worksheets`, level: l.level })),
];

// Ledger banner colour per journey level (the bg-level-N CSS tokens are still
// the legacy 6-level palette, so tiles take the hex inline).
const levelHex = (level: number) => JOURNEY_LEVELS.find((l) => l.level === level)?.hex ?? '#E84B8A';

// `title` / `label` stay English: they build the saved PDF filename and
// worksheet titles are printed in English on the sheets themselves. What the
// grown-up reads on screen is translated from `sound` / `kind`.
type Sheet = {
  href: string;
  title: string;
  /** Single-sound sheet: shown as "Sound {{sound}}" (translated). */
  sound?: string;
  thumb?: string;
};

type SheetGroup = {
  label: string;
  /** Which translated heading to show (library:worksheets.groups.*). */
  kind: 'book' | 'singleSound' | 'singleSoundRest' | 'singleSoundSpecial';
  /** Graphemes for the singleSound heading, e.g. "s a t p i n". */
  sounds?: string;
  bundleHref?: string;
  sheets: Sheet[];
};

type BookFolder = {
  id: string;
  bookNumber: string;       // "1.1"
  title: string;
  /** Whole-level pack: title is shown translated ("Level {{level}} single-sound sheets"). */
  packLevel?: number;
  focusSounds: string[];
  status: 'ready' | 'coming-soon';
  groups: SheetGroup[];
};

const L2_SOUNDS = ['c', 'k', 'ck', 'e', 'u', 'r', 'h', 'b', 'f', 'ff', 'l', 'll', 'ss', 'j', 'v', 'w', 'x', 'y', 'z'];
const L3_SOUNDS = ['sh', 'nk', 'ch', 'th', 'ng', 'qu', 'zz'];

/** Whole-level single-sound packs (one sheet per grapheme), shown at the top
 *  of their journey level ahead of the per-book folders. */
const LEVEL_PACKS: BookFolder[] = [
  {
    id: 'l2-sound-pack',
    bookNumber: 'L2',
    title: 'Level 2 single-sound sheets',
    packLevel: 2,
    focusSounds: L2_SOUNDS,
    status: 'ready',
    groups: [
      {
        label: 'Single-sound sheets — the rest of the alphabet',
        kind: 'singleSoundRest',
        bundleHref: '/worksheets/Sound_Pack_L2/L2_Sound_Pack.pdf',
        sheets: L2_SOUNDS.map((g) => ({
          href: `/worksheets/Sound_Pack_L2/sound_${g}.pdf`, title: `Sound ${g}`, sound: g, thumb: `/worksheets/Sound_Pack_L2/sound_${g}.png`,
        })),
      },
    ],
  },
  {
    id: 'l3-sound-pack',
    bookNumber: 'L3',
    title: 'Level 3 single-sound sheets',
    packLevel: 3,
    focusSounds: L3_SOUNDS,
    status: 'ready',
    groups: [
      {
        label: 'Single-sound sheets — special friends',
        kind: 'singleSoundSpecial',
        bundleHref: '/worksheets/Level_3_Pack/L3_Complete_Pack.pdf',
        sheets: L3_SOUNDS.map((g, i) => ({
          href: `/worksheets/Level_3_Pack/${String(i + 1).padStart(2, '0')}_sound_${g}.pdf`,
          title: `Sound ${g}`,
          sound: g,
          thumb: `/worksheets/Level_3_Pack/${String(i + 1).padStart(2, '0')}_sound_${g}.png`,
        })),
      },
    ],
  },
];

const L1_BOOKS: BookFolder[] = [
  {
    id: 'l1-1',
    bookNumber: '1.1',
    title: 'Tap! Tap! Tap!',
    focusSounds: ['s', 'a', 't', 'p', 'i', 'n'],
    status: 'ready',
    groups: [
      {
        label: 'Book worksheets',
        kind: 'book',
        bundleHref: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/Tap_Tap_Tap_Pack.pdf',
        sheets: [
          { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/01_sound_hunt.pdf',         title: 'Sound Hunt',          thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/01_sound_hunt.png' },
          { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/02_tap_the_sounds.pdf',     title: 'Tap the Sounds',      thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/02_tap_the_sounds.png' },
          { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/03_read_and_do.pdf',        title: 'Read and Do',         thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/03_read_and_do.png' },
          { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/04_alien_word_mission.pdf', title: 'Alien Word Mission',  thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/04_alien_word_mission.png' },
          { href: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/05_story_and_draw.pdf',     title: 'Story and Draw',      thumb: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/05_story_and_draw.png' },
        ],
      },
      {
        label: 'Single-sound sheets — s a t p i n',
        kind: 'singleSound',
        sounds: 's a t p i n',
        bundleHref: '/worksheets/Sound_Pack/SATPIN_Sound_Pack.pdf',
        sheets: [
          { href: '/worksheets/Sound_Pack/sound_s.pdf', title: 'Sound s', sound: 's', thumb: '/worksheets/Sound_Pack/sound_s.png' },
          { href: '/worksheets/Sound_Pack/sound_a.pdf', title: 'Sound a', sound: 'a', thumb: '/worksheets/Sound_Pack/sound_a.png' },
          { href: '/worksheets/Sound_Pack/sound_t.pdf', title: 'Sound t', sound: 't', thumb: '/worksheets/Sound_Pack/sound_t.png' },
          { href: '/worksheets/Sound_Pack/sound_p.pdf', title: 'Sound p', sound: 'p', thumb: '/worksheets/Sound_Pack/sound_p.png' },
          { href: '/worksheets/Sound_Pack/sound_i.pdf', title: 'Sound i', sound: 'i', thumb: '/worksheets/Sound_Pack/sound_i.png' },
          { href: '/worksheets/Sound_Pack/sound_n.pdf', title: 'Sound n', sound: 'n', thumb: '/worksheets/Sound_Pack/sound_n.png' },
        ],
      },
    ],
  },
  {
    id: 'l1-2',
    bookNumber: '1.2',
    title: 'The Mud on the Dog',
    focusSounds: ['m', 'd', 'g', 'o'],
    status: 'ready',
    groups: [
      {
        label: 'Book worksheets',
        kind: 'book',
        bundleHref: '/worksheets/L1/1_2_Mud_on_Dog_Pack/Mud_on_Dog_Pack.pdf',
        sheets: [
          { href: '/worksheets/L1/1_2_Mud_on_Dog_Pack/01_sound_hunt.pdf',         title: 'Sound Hunt',         thumb: '/worksheets/L1/1_2_Mud_on_Dog_Pack/01_sound_hunt.png' },
          { href: '/worksheets/L1/1_2_Mud_on_Dog_Pack/02_trace_and_write.pdf',    title: 'Trace and Write',    thumb: '/worksheets/L1/1_2_Mud_on_Dog_Pack/02_trace_and_write.png' },
          { href: '/worksheets/L1/1_2_Mud_on_Dog_Pack/03_read_and_do.pdf',        title: 'Read and Do',        thumb: '/worksheets/L1/1_2_Mud_on_Dog_Pack/03_read_and_do.png' },
          { href: '/worksheets/L1/1_2_Mud_on_Dog_Pack/04_alien_word_mission.pdf', title: 'Alien Word Mission', thumb: '/worksheets/L1/1_2_Mud_on_Dog_Pack/04_alien_word_mission.png' },
          { href: '/worksheets/L1/1_2_Mud_on_Dog_Pack/05_story_and_draw.pdf',     title: 'Story and Draw',     thumb: '/worksheets/L1/1_2_Mud_on_Dog_Pack/05_story_and_draw.png' },
        ],
      },
      {
        label: 'Single-sound sheets — m d g o',
        kind: 'singleSound',
        sounds: 'm d g o',
        bundleHref: '/worksheets/Sound_Pack_MDGO/MDGO_Sound_Pack.pdf',
        sheets: [
          { href: '/worksheets/Sound_Pack_MDGO/sound_m.pdf', title: 'Sound m', sound: 'm', thumb: '/worksheets/Sound_Pack_MDGO/sound_m.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_d.pdf', title: 'Sound d', sound: 'd', thumb: '/worksheets/Sound_Pack_MDGO/sound_d.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_g.pdf', title: 'Sound g', sound: 'g', thumb: '/worksheets/Sound_Pack_MDGO/sound_g.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_o.pdf', title: 'Sound o', sound: 'o', thumb: '/worksheets/Sound_Pack_MDGO/sound_o.png' },
        ],
      },
    ],
  },
  {
    id: 'l1-3',
    bookNumber: '1.3',
    title: 'The Fish in the Tank',
    focusSounds: ['sh', 'nk'],
    status: 'ready',
    groups: [
      {
        label: 'Book worksheets',
        kind: 'book',
        bundleHref: '/worksheets/L1/1_3_Fish_in_Tank_Pack/Fish_in_Tank_Pack.pdf',
        sheets: [
          { href: '/worksheets/L1/1_3_Fish_in_Tank_Pack/01_sound_hunt.pdf',         title: 'Sound Hunt',         thumb: '/worksheets/L1/1_3_Fish_in_Tank_Pack/01_sound_hunt.png' },
          { href: '/worksheets/L1/1_3_Fish_in_Tank_Pack/02_trace_and_write.pdf',    title: 'Trace and Write',    thumb: '/worksheets/L1/1_3_Fish_in_Tank_Pack/02_trace_and_write.png' },
          { href: '/worksheets/L1/1_3_Fish_in_Tank_Pack/03_read_and_do.pdf',        title: 'Read and Do',        thumb: '/worksheets/L1/1_3_Fish_in_Tank_Pack/03_read_and_do.png' },
          { href: '/worksheets/L1/1_3_Fish_in_Tank_Pack/04_alien_word_mission.pdf', title: 'Alien Word Mission', thumb: '/worksheets/L1/1_3_Fish_in_Tank_Pack/04_alien_word_mission.png' },
          { href: '/worksheets/L1/1_3_Fish_in_Tank_Pack/05_sound_sort.pdf',         title: 'Sound Sort',         thumb: '/worksheets/L1/1_3_Fish_in_Tank_Pack/05_sound_sort.png' },
        ],
      },
      {
        label: 'Single-sound sheets — sh nk',
        kind: 'singleSound',
        sounds: 'sh nk',
        bundleHref: '/worksheets/Sound_Pack_SHNK/SHNK_Sound_Pack.pdf',
        sheets: [
          { href: '/worksheets/Sound_Pack_SHNK/sound_sh.pdf', title: 'Sound sh', sound: 'sh', thumb: '/worksheets/Sound_Pack_SHNK/sound_sh.png' },
          { href: '/worksheets/Sound_Pack_SHNK/sound_nk.pdf', title: 'Sound nk', sound: 'nk', thumb: '/worksheets/Sound_Pack_SHNK/sound_nk.png' },
        ],
      },
    ],
  },
  { id: 'l1-4',  bookNumber: '1.4',  title: 'The Red Socks',         focusSounds: ['c', 'k', 'ck', 'e'],  status: 'coming-soon', groups: [] },
  { id: 'l1-5',  bookNumber: '1.5',  title: 'Run, Pup, Run!',        focusSounds: ['u', 'r', 'h', 'b'],   status: 'coming-soon', groups: [] },
  { id: 'l1-6',  bookNumber: '1.6',  title: 'Fox Fell Off!',         focusSounds: ['f', 'l', 'ff', 'll'], status: 'coming-soon', groups: [] },
  { id: 'l1-7',  bookNumber: '1.7',  title: 'The Jam Jug',           focusSounds: ['j', 'v', 'w'],        status: 'coming-soon', groups: [] },
  { id: 'l1-8',  bookNumber: '1.8',  title: 'The Yak and the Box',   focusSounds: ['x', 'y', 'z'],        status: 'coming-soon', groups: [] },
  { id: 'l1-9',  bookNumber: '1.9',  title: 'Chop, Chop, Chop!',     focusSounds: ['ch', 'th'],           status: 'coming-soon', groups: [] },
  { id: 'l1-10', bookNumber: '1.10', title: 'Buzz and Sing!',        focusSounds: ['ng', 'qu', 'ss', 'zz'], status: 'coming-soon', groups: [] },
];

/** Downloads need a free account (launch 2026-09-05) — reading and
 *  browsing never do. Returns a click handler that either downloads or
 *  sends the guest to sign up and back to the Library. */
function useGatedDownload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (href: string, filename: string) => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent('/library')}`);
      return;
    }
    void downloadPdf(href, filename);
  };
}

function SheetCard({ sheet }: { sheet: Sheet }) {
  const download = useGatedDownload();
  const { t } = useTranslation('library');
  const shownTitle = sheet.sound ? t('worksheets.soundSheet', { sound: sheet.sound }) : sheet.title;
  return (
    <button
      type="button"
      onClick={() => download(sheet.href, pdfFilename(sheet.title))}
      className="group bg-background rounded-xl overflow-hidden border border-border hover:shadow-md transition-all active:scale-[0.97] flex flex-col text-start w-full"
    >
      <div className="aspect-[1/1.4142] overflow-hidden bg-muted">
        {sheet.thumb ? (
          <img
            src={sheet.thumb}
            alt={t('worksheets.preview', { title: shownTitle })}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FileText className="w-6 h-6 text-muted-foreground/60" />
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <p lang={sheet.sound ? undefined : 'en'} className="text-[11px] font-bold text-foreground truncate flex-1">{shownTitle}</p>
        <Download className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
      </div>
    </button>
  );
}

function BookFolderItem({ book, accent }: { book: BookFolder; accent: string /* hex */ }) {
  const totalSheets = book.groups.reduce((n, g) => n + g.sheets.length, 0);
  const download = useGatedDownload();
  const { t } = useTranslation('library');
  const groupLabel = (g: SheetGroup) => t(`worksheets.groups.${g.kind}`, { sounds: g.sounds ?? '' });

  return (
    <AccordionItem
      value={book.id}
      className="bg-card border border-border rounded-2xl shadow-card overflow-hidden data-[state=open]:shadow-lg transition-shadow"
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div dir="ltr" className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-sm" style={{ backgroundColor: accent }}>
            {book.bookNumber}
          </div>
          <div className="flex-1 min-w-0 text-start">
            <div className="flex items-center gap-2 flex-wrap">
              {book.packLevel ? (
                <p className="text-sm font-extrabold text-foreground">{t('worksheets.levelPackTitle', { level: book.packLevel })}</p>
              ) : (
                <p dir="ltr" lang="en" className="text-sm font-extrabold text-foreground">{book.title}</p>
              )}
              {book.status === 'coming-soon' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  {t('worksheets.comingSoon')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">{t('worksheets.focusSounds')}</span>
              <span dir="ltr" lang="en" className="inline-flex items-center gap-1.5 flex-wrap">
                {book.focusSounds.map((s) => (
                  <span key={s} className="text-[11px] font-mono font-bold bg-muted px-1.5 rounded">{s}</span>
                ))}
              </span>
              {book.status === 'ready' && (
                <span className="text-[11px] text-muted-foreground ms-1">· {t('worksheets.sheetCount', { count: totalSheets })}</span>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5 pt-1">
        {book.status === 'coming-soon' ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 border border-dashed border-border rounded-xl p-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p>{t('worksheets.bookComingSoon', { sounds: book.focusSounds.join(', ') })}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {book.groups.map((g, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">{groupLabel(g)}</p>
                  {g.bundleHref && (
                    <button
                      type="button"
                      onClick={() => download(g.bundleHref!, pdfFilename(`${book.title} - ${g.label}`))}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t('worksheets.downloadAllCount', { count: g.sheets.length })}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {g.sheets.map((sheet) => (
                    <SheetCard key={sheet.href} sheet={sheet} />
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[11px] text-muted-foreground">
              <Package className="w-3 h-3 inline-block -mt-0.5 me-1" />
              {t('worksheets.packHint')}
            </p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

/** Per-book folders placed on the 8-level journey. The legacy "1.3" number
 *  becomes its journey number ("3.1"); the pack files keep their paths. */
const BOOKS_BY_JOURNEY_LEVEL: Record<number, BookFolder[]> = (() => {
  const out: Record<number, BookFolder[]> = {};
  for (const pack of LEVEL_PACKS) {
    const level = Number(pack.bookNumber.replace(/^L/, ''));
    (out[level] ??= []).push(pack);
  }
  for (const b of L1_BOOKS) {
    const placed = journeyPlacement(`L${b.bookNumber}`);
    const level = placed?.level ?? 1;
    (out[level] ??= []).push(placed ? { ...b, bookNumber: placed.subLevel.replace(/^L/, '') } : b);
  }
  return out;
})();

export default function WorksheetsPanel() {
  const { t } = useTranslation('library');
  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        {t('worksheets.intro')}
      </p>

      {/* Category jump bar. Sticks directly under the app header on mobile
       *  (header ~64px) and tablet (~68px). On lg+ there is NO top header
       *  (the chrome is a left sidebar), so it must pin to the very top of
       *  the viewport — otherwise it floats ~68px down with page content
       *  scrolling through the gap above it (the "half-stuck strip" bug).
       *  The negative margins are matched to each breakpoint's container
       *  padding (px-4 on mobile/tablet, lg:px-8) so the blurred strip spans
       *  the full content width instead of leaving an inset edge. */}
      <nav
        aria-label={t('worksheets.categoriesAria')}
        className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide sticky top-[64px] md:top-[68px] lg:top-0 z-30 bg-background/85 backdrop-blur-md -mx-4 px-4 lg:-mx-8 lg:px-8 py-2 border-b border-border"
      >
        {CATEGORIES.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {c.level === null
              ? t('worksheets.categorySoundMats')
              : t('worksheets.categoryLevel', { level: c.level })}
          </a>
        ))}
      </nav>

      <div id="sound-mats" className="scroll-mt-32">
        <SoundMatsResources />
      </div>

      {JOURNEY_LEVELS.map((l) => {
        const books = BOOKS_BY_JOURNEY_LEVEL[l.level] ?? [];
        return (
          <section
            key={l.level}
            id={`level-${l.level}-worksheets`}
            className="scroll-mt-32 mb-10"
          >
            <div className="mb-4">
              <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">
                {t('worksheets.levelHeading', { level: l.level })}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {t('worksheets.levelSub', {
                  name: l.name,
                  ages: t('agesRange', { range: l.ageRange.replace(/^Ages\s*/, '') }),
                })}
              </p>
            </div>

            {books.length > 0 ? (
              <Accordion type="single" collapsible defaultValue={books[0].id} className="space-y-3">
                {books.map((b) => (
                  <BookFolderItem key={b.id} book={b} accent={levelHex(l.level)} />
                ))}
              </Accordion>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: levelHex(l.level) }}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {t('worksheets.comingSoon')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {t('worksheets.levelComingSoon', { level: l.level })}
                  </p>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
