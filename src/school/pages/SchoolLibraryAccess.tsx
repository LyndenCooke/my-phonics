import { useMemo, useState } from 'react';
import { BookOpen, Download, FileText, Loader2 } from 'lucide-react';
import { BOOK_CATALOG } from '@/lib/bookCatalog';
import { useToast } from '@/hooks/use-toast';

function storageKey(subLevel: string): string {
  return subLevel.replace(/^L/, '').replace('.', '_');
}

function pdfUrl(subLevel: string, format: 'a4' | 'a5'): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/book-pdfs/${format}/${storageKey(subLevel)}.pdf`;
}

function worksheetUrl(subLevel: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL as string;
  return `${base}/storage/v1/object/public/worksheet-pdfs/${storageKey(subLevel)}.pdf`;
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

export default function SchoolLibraryAccess() {
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const booksByLevel = useMemo(() => {
    const groups = new Map<number, typeof BOOK_CATALOG>();
    for (const b of BOOK_CATALOG.filter((b) => b.is_published)) {
      const list = groups.get(b.level) ?? [];
      list.push(b);
      groups.set(b.level, list);
    }
    return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
  }, []);

  const handleDownload = async (subLevel: string, title: string, kind: 'a4' | 'a5' | 'ws') => {
    const id = `${subLevel}-${kind}`;
    setBusy(id);
    const url = kind === 'ws' ? worksheetUrl(subLevel) : pdfUrl(subLevel, kind);
    const suffix = kind === 'a4' ? '(A5 Booklet)' : kind === 'a5' ? '(A4 Sheets)' : '— Worksheets';
    const result = await downloadBlob(url, `${title} ${suffix}.pdf`);
    setBusy(null);
    if (!result.ok) {
      toast({ title: 'Download failed', description: result.error, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">Library</h1>
        <p className="text-slate-600">All MyPhonicsBooks titles. Read online, print PDFs, or download worksheets for your class.</p>
      </header>

      {[...booksByLevel.entries()].map(([level, books]) => (
        <section key={level}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" data-school-level={level}>
            <span className="inline-block px-2 py-0.5 rounded-md s-bg-level text-white">Level {level}</span>
            <span className="ml-2 text-slate-500">— {books.length} book{books.length === 1 ? '' : 's'}</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {books.map((b) => (
              <article key={b.sub_level} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col">
                <div className="flex items-baseline justify-between gap-2 mb-2">
                  <h3 className="font-bold leading-tight">{b.title}</h3>
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">{b.sub_level}</span>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Focus: {b.focus_sounds.join(', ')}
                </p>
                <div className="mt-auto grid grid-cols-2 gap-1.5">
                  <a
                    href={`/library?book=${b.slug}`}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Read
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDownload(b.sub_level, b.title, 'a4')}
                    disabled={busy === `${b.sub_level}-a4`}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60"
                    title="Saddle-stitch A5 booklet (2 pages per A4 sheet)"
                  >
                    {busy === `${b.sub_level}-a4` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} A5 Booklet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(b.sub_level, b.title, 'a5')}
                    disabled={busy === `${b.sub_level}-a5`}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60"
                    title="Sequential A4 sheets"
                  >
                    {busy === `${b.sub_level}-a5` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} A4 Sheets
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload(b.sub_level, b.title, 'ws')}
                    disabled={busy === `${b.sub_level}-ws`}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 disabled:opacity-60"
                    title="5-sheet worksheet pack for this book"
                  >
                    {busy === `${b.sub_level}-ws` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />} Worksheets
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
