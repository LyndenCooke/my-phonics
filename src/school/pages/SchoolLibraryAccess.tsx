import { useMemo, useState } from 'react';
import { BookOpen, Download, FileText, Grid3x3, KeySquare, Layers, Loader2, Sparkles } from 'lucide-react';
import { SCHOOL_BOOKS, type SchoolBook } from '../data/bookCatalog';
import { SOUND_BOOKS, SOUND_BOOK_TOTAL, type SoundBook } from '../data/soundBooks';
import { BLENDING_BOOKS, BLENDING_BOOK_TOTAL, type BlendingBook } from '../data/blendingBooks';
import { SCHOOL_LEVELS } from '../data/levels';
import { blockForResource, programmeTotals } from '../data/pathway';
import { useToast } from '@/hooks/use-toast';

function storageKey(subLevel: string): string {
  return subLevel.replace(/^L/, '').replace('.', '_');
}
function pdfUrl(parent6: string, format: 'a4' | 'a5'): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/book-pdfs/${format}/${storageKey(parent6)}.pdf`;
}
function worksheetPackUrl(parent6: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/worksheet-pdfs/${storageKey(parent6)}.pdf`;
}
function soundBookUrl(id: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/sound-book-pdfs/${id.replace(/^SD-L/, '').replace('.', '_')}.pdf`;
}
function coverUrl(parent6: string): string {
  return `/covers/${storageKey(parent6)}_cover.jpg`;
}

async function downloadBlob(url: string, filename: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: `Not found (${res.status})` };
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));
const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

type Category =
  | 'sound_books' | 'blending_books' | 'storybooks' | 'interactive'
  | 'sound_worksheets' | 'story_packs' | 'sound_mats' | 'tricky_cards';

export default function SchoolLibraryAccess() {
  const { toast } = useToast();
  const totals = useMemo(() => programmeTotals(), []);
  const [cat, setCat] = useState<Category>('sound_books');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const matchesLevel = (lvl: number) => levelFilter === 'all' || lvl === levelFilter;
  const soundBooks = useMemo(() => SOUND_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const blendingBooks = useMemo(() => BLENDING_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const storybooks = useMemo(() => SCHOOL_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const levels = useMemo(() => SCHOOL_LEVELS.filter((l) => matchesLevel(l.level)), [levelFilter]);

  const run = async (key: string, url: string, filename: string) => {
    setBusy(key);
    const r = await downloadBlob(url, filename);
    setBusy(null);
    if (!r.ok) toast({ title: 'Download failed', description: r.error, variant: 'destructive' });
  };

  const CATS: { id: Category; label: string; count: number }[] = [
    { id: 'sound_books', label: 'Sound Books', count: totals.soundBooks },
    { id: 'blending_books', label: 'Blending Books', count: totals.blendingBooks },
    { id: 'storybooks', label: 'Storybooks', count: totals.storybooks },
    { id: 'interactive', label: 'Interactive Books', count: totals.interactiveBooks },
    { id: 'sound_worksheets', label: 'Sound Book worksheets', count: totals.soundBookWorksheets },
    { id: 'story_packs', label: 'Storybook worksheet packs', count: totals.storybookWorksheetPacks },
    { id: 'sound_mats', label: 'Sound mats', count: totals.soundMats },
    { id: 'tricky_cards', label: 'Tricky word cards', count: totals.trickyWordCards },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Library</h1>
        <p className="text-slate-600">
          {totals.totalResources}+ linked resources across 8 levels — every Sound Book, Blending Book, Storybook,
          interactive version, worksheet, sound mat and tricky word set, organised by type.
        </p>
      </header>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCat(c.id)}
            className={['px-3 py-1.5 rounded-full text-sm font-semibold border', cat === c.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'].join(' ')}
          >
            {c.label} <span className="opacity-70 text-xs">({c.count})</span>
          </button>
        ))}
      </div>

      {/* Level filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Level:</span>
        <button onClick={() => setLevelFilter('all')} className={['px-3 py-1 rounded-full text-sm font-semibold', levelFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'].join(' ')}>All</button>
        {SCHOOL_LEVELS.map((l) => (
          <button key={l.level} onClick={() => setLevelFilter(l.level)} data-school-level={l.level}
            className={['px-3 py-1 rounded-full text-sm font-bold', levelFilter === l.level ? 's-bg-level text-white' : 's-bg-tint s-text-ink hover:opacity-80'].join(' ')}>
            L{l.level}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cat === 'sound_books' && soundBooks.map((b) => <SoundBookCard key={b.id} book={b} busy={busy} run={run} />)}
        {cat === 'sound_worksheets' && soundBooks.map((b) => <SoundWorksheetCard key={b.id} book={b} />)}
        {cat === 'blending_books' && blendingBooks.map((b) => <BlendingCard key={b.id} book={b} />)}
        {cat === 'storybooks' && storybooks.map((b) => <StorybookCard key={b.id} book={b} busy={busy} run={run} />)}
        {cat === 'interactive' && storybooks.map((b) => <InteractiveCard key={b.id} book={b} />)}
        {cat === 'story_packs' && storybooks.map((b) => <StoryPackCard key={b.id} book={b} busy={busy} run={run} />)}
        {cat === 'sound_mats' && levels.map((l) => <LevelResourceCard key={l.level} level={l.level} kind="mat" />)}
        {cat === 'tricky_cards' && levels.map((l) => <LevelResourceCard key={l.level} level={l.level} kind="tricky" />)}
      </div>
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ backgroundColor: HEX[level] }}>L{level} {LEVEL_NAME[level]}</span>;
}

function BlockLine({ id }: { id: string }) {
  const b = blockForResource(id);
  if (!b) return null;
  return <div className="text-[11px] text-slate-500">{b.isReview ? 'Review · level gate' : `Block ${b.blockNumber} of ${b.totalTeachingBlocks}`}</div>;
}

function Shell({ level, children }: { level: number; children: React.ReactNode }) {
  return <article className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col" data-school-level={level}>{children}</article>;
}

function DownloadBtn({ label, loading, onClick, icon, primary }: { label: string; loading: boolean; onClick: () => void; icon?: React.ReactNode; primary?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className={['inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-60', primary ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'].join(' ')}>
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (icon ?? <Download className="w-3.5 h-3.5" />)} {label}
    </button>
  );
}

function ComingSoon({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">{icon} {label}</span>;
}

function SoundBookCard({ book, busy, run }: { book: SoundBook; busy: string | null; run: (k: string, u: string, f: string) => void }) {
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-2">Focus: {book.graphemes.join(' / ')}{book.sampleWords.length ? ` · e.g. ${book.sampleWords.slice(0, 3).join(', ')}` : ''}</p>
      <div className="text-[11px] text-slate-500 mb-3">Companion: <span className="font-semibold">Sound Book worksheet</span></div>
      <div className="mt-auto grid grid-cols-2 gap-1.5">
        <DownloadBtn primary label="Print booklet" loading={busy === `snd-${book.id}`} onClick={() => run(`snd-${book.id}`, soundBookUrl(book.id), `${book.title}.pdf`)} />
        <ComingSoon icon={<FileText className="w-3 h-3" />} label="Worksheet soon" />
      </div>
    </Shell>
  );
}

function SoundWorksheetCard({ book }: { book: SoundBook }) {
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">Worksheet: {book.graphemes.join(' / ')}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">Sound formation, word building and sound sorting. Companion to the {book.title}.</p>
      <div className="mt-auto"><ComingSoon icon={<FileText className="w-3 h-3" />} label="Coming soon" /></div>
    </Shell>
  );
}

function BlendingCard({ book }: { book: BlendingBook }) {
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">{book.focus} · A6 word-reveal booklet. No separate worksheet — the blending practice is the resource.</p>
      <div className="mt-auto"><ComingSoon icon={<Layers className="w-3 h-3" />} label="Coming soon" /></div>
    </Shell>
  );
}

function StorybookCard({ book, busy, run }: { book: SchoolBook; busy: string | null; run: (k: string, u: string, f: string) => void }) {
  const [imgOk, setImgOk] = useState(true);
  const p6 = book.parent6SubLevel;
  return (
    <Shell level={book.level}>
      <div className="flex gap-3 mb-2">
        {imgOk ? (
          <img src={coverUrl(p6)} alt="" onError={() => setImgOk(false)} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-100" draggable={false} />
        ) : (
          <div className="w-14 h-14 rounded-lg s-bg-tint flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 s-text-ink" /></div>
        )}
        <div className="min-w-0">
          <div className="mb-0.5"><LevelBadge level={book.level} /></div>
          <h3 className="font-bold leading-tight">{book.title}</h3>
          <BlockLine id={book.id} />
        </div>
      </div>
      <div className="text-[11px] text-slate-500 mb-2">Focus: {book.focusSounds.join(', ')}</div>
      <div className="text-[11px] text-slate-500 mb-3">Companions: built-in practice · 5-page worksheet pack · interactive version</div>
      <div className="mt-auto grid grid-cols-2 gap-1.5">
        <a href={`/library?book=${book.slug}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"><BookOpen className="w-3.5 h-3.5" /> Read online</a>
        <DownloadBtn label="A5 booklet" loading={busy === `${p6}-a4`} onClick={() => run(`${p6}-a4`, pdfUrl(p6, 'a4'), `${book.title} (A5 Booklet).pdf`)} />
        <DownloadBtn label="A4 sheets" loading={busy === `${p6}-a5`} onClick={() => run(`${p6}-a5`, pdfUrl(p6, 'a5'), `${book.title} (A4 Sheets).pdf`)} />
        <DownloadBtn label="Worksheet pack" icon={<FileText className="w-3.5 h-3.5" />} loading={busy === `${p6}-ws`} onClick={() => run(`${p6}-ws`, worksheetPackUrl(p6), `${book.title} — Worksheets.pdf`)} />
      </div>
    </Shell>
  );
}

function InteractiveCard({ book }: { book: SchoolBook }) {
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">Tappable words, phoneme pop-ups, audio, spelling, story ordering, comprehension{book.level >= 2 ? ', grammar word-order' : ''} and writing practice.</p>
      <div className="mt-auto">
        <a href={`/library?book=${book.slug}`} target="_blank" rel="noopener" className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700"><Sparkles className="w-3.5 h-3.5" /> Open interactive</a>
      </div>
    </Shell>
  );
}

function StoryPackCard({ book, busy, run }: { book: SchoolBook; busy: string | null; run: (k: string, u: string, f: string) => void }) {
  const p6 = book.parent6SubLevel;
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">{book.title} — pack</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">5-page A4 pack: sound hunt, trace and write, read and do, alien words, story-and-draw.</p>
      <div className="mt-auto"><DownloadBtn primary label="Print worksheet pack" icon={<FileText className="w-3.5 h-3.5" />} loading={busy === `${p6}-ws`} onClick={() => run(`${p6}-ws`, worksheetPackUrl(p6), `${book.title} — Worksheets.pdf`)} /></div>
    </Shell>
  );
}

function LevelResourceCard({ level, kind }: { level: number; kind: 'mat' | 'tricky' }) {
  const Icon = kind === 'mat' ? Grid3x3 : KeySquare;
  const title = kind === 'mat' ? `L${level} Sound Mat` : `L${level} Tricky Word Cards`;
  const desc = kind === 'mat'
    ? 'Cumulative GPC chart showing the sounds taught at this level and earlier levels.'
    : 'Tricky word cards for the words introduced at this level.';
  return (
    <Shell level={level}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-bold leading-tight flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</h3>
        <LevelBadge level={level} />
      </div>
      <p className="text-xs text-slate-500 mt-1 mb-3">{desc} Used throughout the level.</p>
      <div className="mt-auto"><ComingSoon icon={<Icon className="w-3 h-3" />} label="Coming soon" /></div>
    </Shell>
  );
}
