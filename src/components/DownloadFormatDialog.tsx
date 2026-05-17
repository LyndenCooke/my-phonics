import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { BookOpen, FileText, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import type { Book } from '@/lib/types';

// The edge function still keys off the SOURCE paper size:
//   'a4' -> bucket book-pdfs/a4/{slug}.pdf  = the 2-up landscape imposition
//                                              (prints on A4, folds into an A5 booklet)
//   'a5' -> bucket book-pdfs/a5/{slug}.pdf  = the sequential 16-page A5 portrait file
//                                              (one page per sheet — useful as A4 singles)
// Parents think about the OUTPUT size — what they hold in their hand. So
// the picker labels the imposed file as "A5 Booklet" and the sequential
// file as "A4 Sheets" even though the internal format codes look swapped.
export type DownloadFormat = 'a5' | 'a4';

export function formatDisplayLabel(format: DownloadFormat): string {
  return format === 'a4' ? 'A5 Booklet' : 'A4 Sheets';
}

const VARIANTS: Array<{
  format: DownloadFormat;
  label: string;
  description: string;
  icon: typeof BookOpen;
  iconWrap: string;
  iconColor: string;
}> = [
  {
    format: 'a4',
    label: 'A5 Booklet',
    description: 'Print on A4 double-sided, fold + staple to make a proper A5 booklet. Last + first page sit on the same sheet.',
    icon: BookOpen,
    iconWrap: 'bg-tint-pink',
    iconColor: 'text-primary-ink',
  },
  {
    format: 'a5',
    label: 'A4 Sheets',
    description: 'Each page on its own sheet. Good for large-format reading or classroom use.',
    icon: FileText,
    iconWrap: 'bg-amber-50 border border-amber-200',
    iconColor: 'text-amber-700',
  },
];

type Stage = 'choose' | 'downloading' | 'success' | 'error';

interface Props {
  book: Book | null;
  onClose: () => void;
  /**
   * Trigger the actual blob download. The dialog handles all UI state
   * (spinner, success card, error retry) — the caller just resolves
   * success/error.
   */
  onDownload: (format: DownloadFormat) => Promise<{ success: boolean; error?: string }>;
}

export default function DownloadFormatDialog({ book, onClose, onDownload }: Props) {
  const navigate = useNavigate();
  const [stage, setStage] = useState<Stage>('choose');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pickedFormat, setPickedFormat] = useState<DownloadFormat | null>(null);

  // Reset the wizard whenever a new book is opened so a previous
  // success/error doesn't bleed into the next download.
  useEffect(() => {
    if (book) {
      setStage('choose');
      setErrorMsg(null);
      setPickedFormat(null);
    }
  }, [book?.id]);

  const handlePick = async (format: DownloadFormat) => {
    setPickedFormat(format);
    setStage('downloading');
    const result = await onDownload(format);
    if (result.success) {
      setStage('success');
    } else {
      setStage('error');
      setErrorMsg(result.error ?? 'Download failed');
    }
  };

  const goToHistory = () => {
    onClose();
    navigate('/profile/downloads');
  };

  return (
    <Dialog open={!!book} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        {stage === 'choose' && book && (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">
                Download {book.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                Pick the format that suits how you'll use it.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 pt-2">
              {VARIANTS.map((v) => {
                const Icon = v.icon;
                return (
                  <button
                    key={v.format}
                    onClick={() => handlePick(v.format)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border border-border hover:border-primary/40 hover:bg-tint-pink/40 transition-colors text-left active:scale-[0.99]"
                  >
                    <div className={`w-11 h-11 rounded-xl ${v.iconWrap} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${v.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{v.label}</p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                        {v.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
            </div>
          </>
        )}

        {stage === 'downloading' && book && (
          <div className="py-6 text-center">
            <Loader2 className="w-8 h-8 text-primary mx-auto animate-spin" />
            <p className="text-sm font-bold text-foreground mt-3">
              Preparing {pickedFormat ? formatDisplayLabel(pickedFormat) : 'PDF'}…
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {book.title}
            </p>
          </div>
        )}

        {stage === 'success' && book && (
          <>
            <div className="py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7 text-emerald-700" />
              </div>
              <p className="text-base font-extrabold text-foreground mt-3">
                Saved to your downloads
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {book.title} ({pickedFormat ? formatDisplayLabel(pickedFormat) : ''}) is in your Download History — open it from there any time.
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={goToHistory}
                className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button active:scale-[0.97] transition-transform"
              >
                Go to Download History
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}

        {stage === 'error' && (
          <>
            <div className="py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7 text-rose-700" />
              </div>
              <p className="text-base font-extrabold text-foreground mt-3">
                Download didn't go through
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">
                {errorMsg}
              </p>
            </div>
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setStage('choose')}
                className="w-full py-3 rounded-xl font-bold text-sm gradient-primary text-primary-foreground shadow-button active:scale-[0.97] transition-transform"
              >
                Try again
              </button>
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
