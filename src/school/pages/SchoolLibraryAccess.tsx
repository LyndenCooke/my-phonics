import { useMemo, useState } from 'react';
import { BookOpen, Camera, Download, FileText, Loader2 } from 'lucide-react';
import { SCHOOL_BOOKS, type SchoolBook } from '../data/bookCatalog';
import { SOUND_BOOKS, SOUND_BOOK_TOTAL } from '../data/soundBooks';
import { BLENDING_BOOKS, BLENDING_BOOK_TOTAL } from '../data/blendingBooks';
import { SCHOOL_LEVELS } from '../data/levels';
import { useToast } from '@/hooks/use-toast';

function storageKey(subLevel: string): string {
  return subLevel.replace(/^L/, '').replace('.', '_');
}

function pdfUrl(parent6SubLevel: string, format: 'a4' | 'a5'): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/book-pdfs/${format}/${storageKey(parent6SubLevel)}.pdf`;
}

function worksheetUrl(parent6SubLevel: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/worksheet-pdfs/${storageKey(parent6SubLevel)}.pdf`;
}

function coverUrl(parent6SubLevel: string): string {
  return `/covers/${storageKey(parent6SubLevel)}_cover.jpg`;
}

async function downloadBlob(url: string, filename: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(url);
    if (!res.ok) return { ok: false, error: `Not found (${res.status})` };
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));

type Tab = 'storybooks' | 'sound' | 'blending';

export default function SchoolLibraryAccess() {
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>('storybooks');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const handleDownload = async (parent6: string, title: string, kind: 'a4' | 'a5' | 'ws') => {
    const id = `${parent6}-${kind}`;
    setBusy(id);
    const url = kind === 'ws' ? worksheetUrl(parent6) : pdfUrl(parent6, kind);
    const suffix = kind === 'a4' ? '(A5 Booklet)' : kind === 'a5' ? '(A4 Sheets)' : '— Worksheets';
    const result = await downloadBlob(url, `${title} ${suffix}.pdf`);
    setBusy(null);
    if (!result.ok) toast({ title: 'Download failed', description: result.error, variant: 'destructive' });
  };

  const matchesLevel = (lvl: number) => levelFilter === 'all' || lvl === levelFilter;

  const storybooks = useMemo(() => SCHOOL_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const soundBooks = useMemo(() => SOUND_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const blendingBooks = useMemo(() => BLENDING_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Library</h1>
        <p className="text-slate-600">118 books across three types. Read online, print PDFs, or download worksheets for your class.</p>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200">
        <TabButton active={tab === 'storybooks'} onClick={() => setTab('storybooks')} label="Storybooks" count={SCHOOL_BOOKS.length} />
        <TabButton active={tab === 'sound'} onClick={() => setTab('sound')} label="Sound Books" count={SOUND_BOOK_TOTAL} />
        <TabButton active={tab === 'blending'} onClick={() => setTab('blending')} label="Blending Books" count={BLENDING_BOOK_TOTAL} />
      </div>

      {/* Level filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Level:</span>
        <button
          onClick={() => setLevelFilter('all')}
          className={['px-3 py-1 rounded-full text-sm font-semibold', levelFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'].join(' ')}
        >
          All
        </button>
        {SCHOOL_LEVELS.map((l) => (
          <button
            key={l.level}
            onClick={() => setLevelFilter(l.level)}
            data-school-level={l.level}
            className={['px-3 py-1 rounded-full text-sm font-bold', levelFilter === l.level ? 's-bg-level text-white' : 's-bg-tint s-text-ink hover:opacity-80'].join(' ')}
          >
            L{l.level}
          </button>
        ))}
      </div>

      {/* Storybooks */}
      {tab === 'storybooks' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {storybooks.map((b) => (
            <StorybookCard key={b.id} book={b} busy={busy} onDownload={handleDownload} />
          ))}
        </div>
      )}

      {/* Sound Books */}
      {tab === 'sound' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {soundBooks.map((b) => (
            <article key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4" data-school-level={b.level}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold leading-tight">{b.title}</h3>
                <LevelBadge level={b.level} />
              </div>
              <p className="text-xs text-slate-500 mb-3">e.g. {b.sampleWords.slice(0, 3).join(', ')}</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                <Camera className="w-3 h-3" /> Coming soon
              </span>
            </article>
          ))}
        </div>
      )}

      {/* Blending Books */}
      {tab === 'blending' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {blendingBooks.map((b) => (
            <article key={b.id} className="bg-white border border-slate-200 rounded-2xl p-4" data-school-level={b.level}>
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-bold leading-tight">{b.title}</h3>
                <LevelBadge level={b.level} />
              </div>
              <p className="text-xs text-slate-500 mb-3">{b.focus}</p>
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold">
                <FileText className="w-3 h-3" /> Coming soon
              </span>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StorybookCard({
  book,
  busy,
  onDownload,
}: {
  book: SchoolBook;
  busy: string | null;
  onDownload: (parent6: string, title: string, kind: 'a4' | 'a5' | 'ws') => void;
}) {
  const p6 = book.parent6SubLevel;
  const [imgOk, setImgOk] = useState(true);
  return (
    <article className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col" data-school-level={book.level}>
      <div className="flex gap-3 p-4">
        {imgOk ? (
          <img
            src={coverUrl(p6)}
            alt=""
            onError={() => setImgOk(false)}
            className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-slate-100"
            draggable={false}
          />
        ) : (
          <div className="w-16 h-16 rounded-lg s-bg-tint flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-6 h-6 s-text-ink" />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <LevelBadge level={book.level} />
            <span className="text-[11px] font-semibold text-slate-400">{book.subLevel}</span>
          </div>
          <h3 className="font-bold leading-tight">{book.title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Focus: {book.focusSounds.join(', ')}</p>
        </div>
      </div>
      <div className="mt-auto grid grid-cols-2 gap-1.5 p-4 pt-0">
        <a
          href={`/library?book=${book.slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
        >
          <BookOpen className="w-3.5 h-3.5" /> Read
        </a>
        <DownloadButton label="A5 Booklet" loading={busy === `${p6}-a4`} onClick={() => onDownload(p6, book.title, 'a4')} />
        <DownloadButton label="A4 Sheets" loading={busy === `${p6}-a5`} onClick={() => onDownload(p6, book.title, 'a5')} />
        <DownloadButton label="Worksheets" icon={<FileText className="w-3.5 h-3.5" />} loading={busy === `${p6}-ws`} onClick={() => onDownload(p6, book.title, 'ws')} />
      </div>
    </article>
  );
}

function DownloadButton({ label, loading, onClick, icon }: { label: string; loading: boolean; onClick: () => void; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (icon ?? <Download className="w-3.5 h-3.5" />)} {label}
    </button>
  );
}

function LevelBadge({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-white text-[10px] font-bold"
      style={{ backgroundColor: HEX[level] }}
    >
      L{level}
    </span>
  );
}

function TabButton({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) {
  return (
    <button
      onClick={onClick}
      className={['px-4 py-2 text-sm font-bold -mb-px border-b-2 transition-colors', active ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-800'].join(' ')}
    >
      {label} <span className="text-xs font-semibold opacity-70">({count})</span>
    </button>
  );
}
