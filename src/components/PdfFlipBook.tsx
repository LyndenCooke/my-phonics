import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import * as pdfjs from "pdfjs-dist";
import FlipBook from "@/components/FlipBook";

// The worker ships as its own chunk; Vite resolves this URL at build time.
pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

/**
 * The typeset book, page for page, turned like the sample on the wizard's
 * intro. Rasterises the real book PDF in the browser (pdf.js), so what the
 * family sees is EXACTLY what prints: cover, sound pages, story, activity
 * set, "Meet the star". Costs the server nothing — the PDF already exists.
 *
 * `onUnavailable` fires if the PDF cannot be fetched or parsed, so the
 * caller can fall back to the page-by-page reader instead of a blank.
 */
export default function PdfFlipBook({
  url, pageWidth = 230, autoPlayMs = 0, onUnavailable, onPageCount,
}: {
  url: string;
  pageWidth?: number;
  autoPlayMs?: number;
  onUnavailable?: () => void;
  onPageCount?: (n: number) => void;
}) {
  const [images, setImages] = useState<string[] | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    setImages(null);
    setProgress(0);
    (async () => {
      try {
        const doc = await pdfjs.getDocument({ url }).promise;
        onPageCount?.(doc.numPages);
        const out: string[] = [];
        for (let i = 1; i <= doc.numPages; i++) {
          const page = await doc.getPage(i);
          // Render at ~2.4× the displayed width so the spread stays crisp on
          // retina screens without a multi-megabyte canvas per page.
          const base = page.getViewport({ scale: 1 });
          const scale = (pageWidth * 2.4) / base.width;
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas unavailable");
          await page.render({ canvasContext: ctx, viewport }).promise;
          out.push(canvas.toDataURL("image/jpeg", 0.86));
          if (!alive) return;
          setProgress(i / doc.numPages);
        }
        if (alive) setImages(out);
      } catch (e) {
        console.warn("[PdfFlipBook] could not render the PDF:", (e as Error).message);
        if (alive) onUnavailable?.();
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, pageWidth]);

  if (!images) {
    return (
      <div className="mx-auto flex flex-col items-center gap-2 py-6 text-sm text-slate-500" style={{ maxWidth: pageWidth * 2 }}>
        <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
        <span>Laying out the printed pages… {Math.round(progress * 100)}%</span>
      </div>
    );
  }

  return (
    <FlipBook
      pages={images.map((src, i) => (
        <img key={i} src={src} alt={i === 0 ? "Book cover" : `Page ${i}`} draggable={false} className="h-full w-full object-cover" />
      ))}
      pageWidth={pageWidth}
      autoPlayMs={autoPlayMs}
      showCounter
    />
  );
}
