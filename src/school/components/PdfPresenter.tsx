import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { viewSchoolResource } from '../lib/schoolClient';

export type PresentResource =
  | { resourceType: 'storybook'; resourceKey: string; format: 'a4' | 'a5' }
  | { resourceType: 'worksheet_pack'; resourceKey: string }
  | { resourceType: 'sound_book'; resourceKey: string };

/**
 * PdfPresenter — full-screen, no-print "slides" view of any school PDF.
 *
 * Mints a short-lived signed URL via the school-download edge function, fetches
 * the whole PDF as a blob immediately (so the 2-minute signed-URL expiry can't
 * break later pages mid-lesson), and shows it in the browser's native page-by-
 * page PDF viewer. Lets teachers project Sound Books / Storybooks on the board
 * without printing. Esc or the close button exits.
 */
export default function PdfPresenter({
  resource, title, onClose,
}: { resource: PresentResource; title: string; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      const r = await viewSchoolResource(resource);
      if (cancelled) return;
      if (!r.ok || !r.url) { setError(r.error ?? 'Could not open this book.'); return; }
      try {
        const res = await fetch(r.url);
        if (!res.ok) throw new Error(`Not found (${res.status})`);
        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setUrl(objectUrl);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelled = true;
      window.removeEventListener('keydown', onKey);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [resource, onClose]);

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 text-white flex-shrink-0">
        <span className="font-semibold text-sm truncate">{title} — on screen</span>
        <button onClick={onClose} aria-label="Close" className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-sm">
          <X className="w-4 h-4" /> Close (Esc)
        </button>
      </div>
      <div className="flex-1 relative">
        {!url && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-6 gap-3">
            <p>{error}</p>
            <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white text-slate-900 text-sm font-semibold">Close</button>
          </div>
        )}
        {url && <iframe title={title} src={`${url}#view=FitH`} className="w-full h-full border-0 bg-white" />}
      </div>
    </div>
  );
}
