import { SoundMatsResources } from '@/components/SoundMatsResources';
import { LEVELS } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Download, FileText, Package, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

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
    toast.error("That worksheet couldn't be downloaded. Please try again.");
  }
}

function pdfFilename(title: string): string {
  const base = title.replace(/[^\w\s-]/g, '').trim() || 'worksheet';
  return `${base}.pdf`;
}

const CATEGORIES = [
  { id: 'sound-mats', label: 'Sound mats' },
  ...LEVELS.map((l) => ({ id: `level-${l.level}-worksheets`, label: `L${l.level} worksheets` })),
];

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

type Sheet = {
  href: string;
  title: string;
  thumb?: string;
};

type SheetGroup = {
  label: string;
  bundleHref?: string;
  bundleLabel?: string;
  sheets: Sheet[];
};

type BookFolder = {
  id: string;
  bookNumber: string;       // "1.1"
  title: string;
  focusSounds: string[];
  status: 'ready' | 'coming-soon';
  groups: SheetGroup[];
};

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
        bundleHref: '/worksheets/L1/1_1_Tap_Tap_Tap_Pack/Tap_Tap_Tap_Pack.pdf',
        bundleLabel: 'Download all 5 sheets',
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
        bundleHref: '/worksheets/Sound_Pack/SATPIN_Sound_Pack.pdf',
        bundleLabel: 'Download all 6 sheets',
        sheets: [
          { href: '/worksheets/Sound_Pack/sound_s.pdf', title: 'Sound s', thumb: '/worksheets/Sound_Pack/sound_s.png' },
          { href: '/worksheets/Sound_Pack/sound_a.pdf', title: 'Sound a', thumb: '/worksheets/Sound_Pack/sound_a.png' },
          { href: '/worksheets/Sound_Pack/sound_t.pdf', title: 'Sound t', thumb: '/worksheets/Sound_Pack/sound_t.png' },
          { href: '/worksheets/Sound_Pack/sound_p.pdf', title: 'Sound p', thumb: '/worksheets/Sound_Pack/sound_p.png' },
          { href: '/worksheets/Sound_Pack/sound_i.pdf', title: 'Sound i', thumb: '/worksheets/Sound_Pack/sound_i.png' },
          { href: '/worksheets/Sound_Pack/sound_n.pdf', title: 'Sound n', thumb: '/worksheets/Sound_Pack/sound_n.png' },
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
        bundleHref: '/worksheets/L1/1_2_Mud_on_Dog_Pack/Mud_on_Dog_Pack.pdf',
        bundleLabel: 'Download all 5 sheets',
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
        bundleHref: '/worksheets/Sound_Pack_MDGO/MDGO_Sound_Pack.pdf',
        bundleLabel: 'Download all 4 sheets',
        sheets: [
          { href: '/worksheets/Sound_Pack_MDGO/sound_m.pdf', title: 'Sound m', thumb: '/worksheets/Sound_Pack_MDGO/sound_m.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_d.pdf', title: 'Sound d', thumb: '/worksheets/Sound_Pack_MDGO/sound_d.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_g.pdf', title: 'Sound g', thumb: '/worksheets/Sound_Pack_MDGO/sound_g.png' },
          { href: '/worksheets/Sound_Pack_MDGO/sound_o.pdf', title: 'Sound o', thumb: '/worksheets/Sound_Pack_MDGO/sound_o.png' },
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
        bundleHref: '/worksheets/L1/1_3_Fish_in_Tank_Pack/Fish_in_Tank_Pack.pdf',
        bundleLabel: 'Download all 5 sheets',
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
        bundleHref: '/worksheets/Sound_Pack_SHNK/SHNK_Sound_Pack.pdf',
        bundleLabel: 'Download all 2 sheets',
        sheets: [
          { href: '/worksheets/Sound_Pack_SHNK/sound_sh.pdf', title: 'Sound sh', thumb: '/worksheets/Sound_Pack_SHNK/sound_sh.png' },
          { href: '/worksheets/Sound_Pack_SHNK/sound_nk.pdf', title: 'Sound nk', thumb: '/worksheets/Sound_Pack_SHNK/sound_nk.png' },
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
  return (
    <button
      type="button"
      onClick={() => download(sheet.href, pdfFilename(sheet.title))}
      className="group bg-background rounded-xl overflow-hidden border border-border hover:shadow-md transition-all active:scale-[0.97] flex flex-col text-left w-full"
    >
      <div className="aspect-[1/1.4142] overflow-hidden bg-muted">
        {sheet.thumb ? (
          <img
            src={sheet.thumb}
            alt={`${sheet.title} preview`}
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
        <p className="text-[11px] font-bold text-foreground truncate flex-1">{sheet.title}</p>
        <Download className="w-3 h-3 text-muted-foreground opacity-60 group-hover:opacity-100 shrink-0" />
      </div>
    </button>
  );
}

function BookFolderItem({ book, accent }: { book: BookFolder; accent: string }) {
  const totalSheets = book.groups.reduce((n, g) => n + g.sheets.length, 0);
  const download = useGatedDownload();

  return (
    <AccordionItem
      value={book.id}
      className="bg-card border border-border rounded-2xl shadow-card overflow-hidden data-[state=open]:shadow-lg transition-shadow"
    >
      <AccordionTrigger className="px-5 py-4 hover:no-underline">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`${accent} w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-sm`}>
            {book.bookNumber}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-extrabold text-foreground">{book.title}</p>
              {book.status === 'coming-soon' && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">
                  Coming soon
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span className="text-[11px] text-muted-foreground">Focus sounds:</span>
              {book.focusSounds.map((s) => (
                <span key={s} className="text-[11px] font-mono font-bold bg-muted px-1.5 rounded">{s}</span>
              ))}
              {book.status === 'ready' && (
                <span className="text-[11px] text-muted-foreground ml-1">· {totalSheets} sheets</span>
              )}
            </div>
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-5 pb-5 pt-1">
        {book.status === 'coming-soon' ? (
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-background/50 border border-dashed border-border rounded-xl p-4">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p>Printable worksheets for this book are coming soon — handwriting drills, alien-word reading, tricky words and single-sound sheets for {book.focusSounds.join(', ')}.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {book.groups.map((g, gi) => (
              <div key={gi}>
                <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wider">{g.label}</p>
                  {g.bundleHref && (
                    <button
                      type="button"
                      onClick={() => download(g.bundleHref!, pdfFilename(`${book.title} - ${g.label}`))}
                      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-full hover:opacity-90 active:scale-[0.97] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {g.bundleLabel ?? 'Download all'}
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
              <Package className="w-3 h-3 inline-block -mt-0.5 mr-1" />
              Download the whole pack as one PDF, or grab single sheets to print as needed.
            </p>
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

export default function WorksheetsPanel() {
  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-sm text-muted-foreground mb-5 max-w-2xl">
        Free printable phonics resources for parents and teachers. Sound mats, posters, and worksheets — all aligned with the UK Letters and Sounds curriculum.
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
        aria-label="Resource categories"
        className="flex gap-2 overflow-x-auto pb-1 mb-8 scrollbar-hide sticky top-[64px] md:top-[68px] lg:top-0 z-30 bg-background/85 backdrop-blur-md -mx-4 px-4 lg:-mx-8 lg:px-8 py-2 border-b border-border"
      >
        {CATEGORIES.map((c) => (
          <a
            key={c.id}
            href={`#${c.id}`}
            className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
          >
            {c.label}
          </a>
        ))}
      </nav>

      <div id="sound-mats" className="scroll-mt-32">
        <SoundMatsResources />
      </div>

      {LEVELS.map((l) => {
        const books = l.level === 1 ? L1_BOOKS : [];
        return (
          <section
            key={l.level}
            id={`level-${l.level}-worksheets`}
            className="scroll-mt-32 mb-10"
          >
            <div className="mb-4">
              <h2 className="font-display text-xl font-extrabold text-foreground tracking-tight">
                Level {l.level} worksheets
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {l.name} — {l.ageRange} · click a book to see its worksheet pack
              </p>
            </div>

            {books.length > 0 ? (
              <Accordion type="single" collapsible defaultValue={books[0].id} className="space-y-3">
                {books.map((b) => (
                  <BookFolderItem key={b.id} book={b} accent={levelBgs[l.level]} />
                ))}
              </Accordion>
            ) : (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card flex items-start gap-4">
                <div className={`${levelBgs[l.level]} w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Coming soon
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Printable handwriting, decoding and tricky-word worksheets for Level {l.level}. Bookmark this page — new sheets land here regularly.
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
