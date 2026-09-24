import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trans, useTranslation } from 'react-i18next';
import { BookOpen, Download, FileText, Grid3x3, KeySquare, Layers, Loader2, MonitorPlay, Sparkles } from 'lucide-react';
import { SCHOOL_BOOKS, type SchoolBook } from '../data/bookCatalog';
import { SOUND_BOOKS, SOUND_BOOK_TOTAL, type SoundBook } from '../data/soundBooks';
import { BLENDING_BOOKS, BLENDING_BOOK_TOTAL, type BlendingBook } from '../data/blendingBooks';
import { SCHOOL_LEVELS } from '../data/levels';
import { blockForResource, programmeTotals } from '../data/pathway';
import { useToast } from '@/hooks/use-toast';
import { downloadSchoolResource, viewSchoolResource } from '../lib/schoolClient';
import PdfPresenter, { type PresentResource } from '../components/PdfPresenter';
import SoundBookSlides from '../components/SoundBookSlides';
import { SOUND_BOOK_CONTENT_IDS } from '../components/soundbook/engine';

type DLResource =
  | { resourceType: 'storybook'; resourceKey: string; format: 'a4' | 'a5' }
  | { resourceType: 'worksheet_pack'; resourceKey: string }
  | { resourceType: 'sound_book'; resourceKey: string };

function storageKey(subLevel: string): string {
  return subLevel.replace(/^L/, '').replace('.', '_');
}
function soundBookKey(id: string): string {
  return id.replace(/^SD-L/, '').replace('.', '_');
}
function coverUrl(parent6: string): string {
  return `/covers/${storageKey(parent6)}_cover.jpg`;
}
// 8-level realignment: storybook assets (PDFs + covers) are staged under a
// SCHOOL-ONLY key prefix so they never collide with the public site's files.
// e.g. school sub-level "L3.1" -> "s8_3_1".
function s8Key(subLevel: string): string {
  return `s8_${subLevel.replace(/^L/, '').replace('.', '_')}`;
}
function s8CoverUrl(subLevel: string): string {
  return `/covers/${s8Key(subLevel)}_cover.jpg`;
}

const HEX: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.hex]));
const LEVEL_NAME: Record<number, string> = Object.fromEntries(SCHOOL_LEVELS.map((l) => [l.level, l.name]));

type Category =
  | 'sound_books' | 'blending_books' | 'storybooks' | 'interactive'
  | 'sound_worksheets' | 'story_packs' | 'sound_mats' | 'tricky_cards';

export default function SchoolLibraryAccess() {
  const { t } = useTranslation('schoolApp');
  const { toast } = useToast();
  const totals = useMemo(() => programmeTotals(), []);
  const [cat, setCat] = useState<Category>('sound_books');
  const [levelFilter, setLevelFilter] = useState<number | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [presenting, setPresenting] = useState<{ resource: PresentResource; title: string } | null>(null);
  const onPresent = (resource: PresentResource, title: string) => setPresenting({ resource, title });
  const [slideBook, setSlideBook] = useState<SoundBook | null>(null);

  const matchesLevel = (lvl: number) => levelFilter === 'all' || lvl === levelFilter;
  const soundBooks = useMemo(() => SOUND_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const blendingBooks = useMemo(() => BLENDING_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const storybooks = useMemo(() => SCHOOL_BOOKS.filter((b) => matchesLevel(b.level)), [levelFilter]);
  const levels = useMemo(() => SCHOOL_LEVELS.filter((l) => matchesLevel(l.level)), [levelFilter]);

  const run = async (key: string, resource: DLResource, filename: string) => {
    setBusy(key);
    const r = await downloadSchoolResource({ ...resource, filename });
    setBusy(null);
    if (!r.ok) toast({ title: t('library.downloadFailed'), description: r.error, variant: 'destructive' });
  };

  // Open a storybook PDF in a new tab for viewing / screen-recording.
  const view = async (key: string, resource: DLResource) => {
    const w = window.open('', '_blank');   // open synchronously to dodge popup blockers
    setBusy(key);
    const r = await viewSchoolResource(resource);
    setBusy(null);
    if (r.ok && r.url && w) { w.location.href = r.url; }
    else { w?.close(); toast({ title: t('library.openFailed'), description: r.error, variant: 'destructive' }); }
  };

  const CATS: { id: Category; label: string; count: number }[] = [
    { id: 'sound_books', label: t('library.cats.soundBooks'), count: totals.soundBooks },
    { id: 'blending_books', label: t('library.cats.blendingBooks'), count: totals.blendingBooks },
    { id: 'storybooks', label: t('library.cats.storybooks'), count: totals.storybooks },
    { id: 'interactive', label: t('library.cats.interactive'), count: totals.interactiveBooks },
    { id: 'sound_worksheets', label: t('library.cats.soundWorksheets'), count: totals.soundBookWorksheets },
    { id: 'story_packs', label: t('library.cats.storyPacks'), count: totals.storybookWorksheetPacks },
    { id: 'sound_mats', label: t('library.cats.soundMats'), count: totals.soundMats },
    { id: 'tricky_cards', label: t('library.cats.trickyCards'), count: totals.trickyWordCards },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-extrabold tracking-tight mb-1">{t('library.title')}</h1>
        <p className="text-slate-600">
          {t('library.intro', { count: totals.totalResources })}
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
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('library.levelLabel')}</span>
        <button onClick={() => setLevelFilter('all')} className={['px-3 py-1 rounded-full text-sm font-semibold', levelFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'].join(' ')}>{t('library.all')}</button>
        {SCHOOL_LEVELS.map((l) => (
          <button key={l.level} onClick={() => setLevelFilter(l.level)} data-school-level={l.level}
            className={['px-3 py-1 rounded-full text-sm font-bold', levelFilter === l.level ? 's-bg-level text-white' : 's-bg-tint s-text-ink hover:opacity-80'].join(' ')}>
            L{l.level}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cat === 'sound_books' && soundBooks.map((b) => <SoundBookCard key={b.id} book={b} busy={busy} run={run} onPresent={onPresent} onPlay={setSlideBook} />)}
        {cat === 'sound_worksheets' && soundBooks.map((b) => <SoundWorksheetCard key={b.id} book={b} />)}
        {cat === 'blending_books' && blendingBooks.map((b) => <BlendingCard key={b.id} book={b} />)}
        {cat === 'storybooks' && storybooks.map((b) => <StorybookCard key={b.id} book={b} busy={busy} run={run} view={view} />)}
        {cat === 'interactive' && storybooks.map((b) => <InteractiveCard key={b.id} book={b} />)}
        {cat === 'story_packs' && storybooks.map((b) => <StoryPackCard key={b.id} book={b} busy={busy} run={run} />)}
        {cat === 'sound_mats' && levels.map((l) => <LevelResourceCard key={l.level} level={l.level} kind="mat" />)}
        {cat === 'tricky_cards' && levels.map((l) => <LevelResourceCard key={l.level} level={l.level} kind="tricky" />)}
      </div>

      {presenting && (
        <PdfPresenter resource={presenting.resource} title={presenting.title} onClose={() => setPresenting(null)} />
      )}
      {slideBook && (
        <SoundBookSlides book={slideBook} onClose={() => setSlideBook(null)} />
      )}
    </div>
  );
}

function LevelBadge({ level }: { level: number }) {
  return <span dir="ltr" lang="en" className="inline-flex items-center px-1.5 py-0.5 rounded text-white text-[10px] font-bold" style={{ backgroundColor: HEX[level] }}>L{level} {LEVEL_NAME[level]}</span>;
}

function BlockLine({ id }: { id: string }) {
  const { t } = useTranslation('schoolApp');
  const b = blockForResource(id);
  if (!b) return null;
  return <div className="text-[11px] text-slate-500">{b.isReview ? t('block.reviewGate') : t('block.blockOf', { n: b.blockNumber, total: b.totalTeachingBlocks })}</div>;
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

function SoundBookCard({ book, busy, run, onPresent, onPlay }: { book: SoundBook; busy: string | null; run: (k: string, u: string, f: string) => void; onPresent: (r: PresentResource, title: string) => void; onPlay: (b: SoundBook) => void }) {
  const { t } = useTranslation('schoolApp');
  const interactive = SOUND_BOOK_CONTENT_IDS.has(book.id);
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 dir="ltr" lang="en" className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-2">{t('library.focus')} <bdi dir="ltr" lang="en">{book.graphemes.join(' / ')}</bdi>{book.sampleWords.length ? <> · {t('library.eg')} <bdi dir="ltr" lang="en">{book.sampleWords.slice(0, 3).join(', ')}</bdi></> : null}</p>
      <div className="text-[11px] text-slate-500 mb-3">{t('library.companion')} <span className="font-semibold">{t('library.soundBookWorksheet')}</span></div>
      <div className="mt-auto space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          {interactive ? (
            <button type="button" onClick={() => onPlay(book)}
              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700">
              <Sparkles className="w-3.5 h-3.5" /> {t('library.playSlides')}
            </button>
          ) : (
            <button type="button" onClick={() => onPresent({ resourceType: 'sound_book', resourceKey: soundBookKey(book.id) }, book.title)}
              className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-semibold rounded-lg bg-violet-600 text-white hover:bg-violet-700">
              <MonitorPlay className="w-3.5 h-3.5" /> {t('library.onScreen')}
            </button>
          )}
          <DownloadBtn label={t('library.printBooklet')} loading={busy === `snd-${book.id}`} onClick={() => run(`snd-${book.id}`, { resourceType: 'sound_book', resourceKey: soundBookKey(book.id) }, `${book.title}.pdf`)} />
        </div>
        <ComingSoon icon={<FileText className="w-3 h-3" />} label={t('library.worksheetSoon')} />
      </div>
    </Shell>
  );
}

function SoundWorksheetCard({ book }: { book: SoundBook }) {
  const { t } = useTranslation('schoolApp');
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight">{t('library.worksheetTitle')} <bdi dir="ltr" lang="en">{book.graphemes.join(' / ')}</bdi></h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3"><Trans t={t} i18nKey="library.soundWorksheetDesc" values={{ title: book.title }} components={{ book: <bdi dir="ltr" lang="en" /> }} /></p>
      <div className="mt-auto"><ComingSoon icon={<FileText className="w-3 h-3" />} label={t('library.comingSoon')} /></div>
    </Shell>
  );
}

function BlendingCard({ book }: { book: BlendingBook }) {
  const { t } = useTranslation('schoolApp');
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 dir="ltr" lang="en" className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3"><bdi dir="ltr" lang="en">{book.focus}</bdi> · {t('library.blendingDesc')}</p>
      <div className="mt-auto"><ComingSoon icon={<Layers className="w-3 h-3" />} label={t('library.comingSoon')} /></div>
    </Shell>
  );
}

function StorybookCard({ book, busy, run, view }: { book: SchoolBook; busy: string | null; run: (k: string, u: string, f: string) => void; view: (k: string, r: { resourceType: 'storybook'; resourceKey: string; format: 'a4' | 'a5' }) => void }) {
  const { t } = useTranslation('schoolApp');
  const [imgOk, setImgOk] = useState(true);
  const p6 = book.parent6SubLevel;
  const sk = s8Key(book.subLevel);   // school-only key for the new 8-level assets
  return (
    <Shell level={book.level}>
      <div className="flex gap-3 mb-2">
        {imgOk ? (
          <img src={s8CoverUrl(book.subLevel)} alt="" onError={() => setImgOk(false)} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-slate-100" draggable={false} />
        ) : (
          <div className="w-14 h-14 rounded-lg s-bg-tint flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 s-text-ink" /></div>
        )}
        <div className="min-w-0">
          <div className="mb-0.5"><LevelBadge level={book.level} /></div>
          <h3 dir="ltr" lang="en" className="font-bold leading-tight">{book.title}</h3>
          <BlockLine id={book.id} />
        </div>
      </div>
      <div className="text-[11px] text-slate-500 mb-2">{t('library.focus')} <bdi dir="ltr" lang="en">{book.focusSounds.join(', ')}</bdi> · <span className="font-mono">{t('libraryPreview.was')} <bdi dir="ltr">{p6}</bdi></span></div>
      <div className="mt-auto grid grid-cols-2 gap-1.5">
        <button onClick={() => view(`${sk}-view`, { resourceType: 'storybook', resourceKey: sk, format: 'a5' })} disabled={busy === `${sk}-view`} className="inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 disabled:opacity-50">
          {busy === `${sk}-view` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookOpen className="w-3.5 h-3.5" />} {t('library.viewBook')}
        </button>
        <DownloadBtn label={t('library.a5Booklet')} loading={busy === `${sk}-a4`} onClick={() => run(`${sk}-a4`, { resourceType: 'storybook', resourceKey: sk, format: 'a4' }, `${book.title} (A5 Booklet).pdf`)} />
        <DownloadBtn label={t('library.a4Sheets')} loading={busy === `${sk}-a5`} onClick={() => run(`${sk}-a5`, { resourceType: 'storybook', resourceKey: sk, format: 'a5' }, `${book.title} (A4 Sheets).pdf`)} />
        <DownloadBtn label={t('library.worksheetPack')} icon={<FileText className="w-3.5 h-3.5" />} loading={busy === `${p6}-ws`} onClick={() => run(`${p6}-ws`, { resourceType: 'worksheet_pack', resourceKey: storageKey(p6) }, `${book.title} — Worksheets.pdf`)} />
      </div>
    </Shell>
  );
}

function InteractiveCard({ book }: { book: SchoolBook }) {
  const { t } = useTranslation('schoolApp');
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 dir="ltr" lang="en" className="font-bold leading-tight">{book.title}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">{book.level >= 2 ? t('library.interactiveDescGrammar') : t('library.interactiveDesc')}</p>
      <div className="mt-auto">
        <Link to={`/school/app/read/${book.parent6SubLevel}`} className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-violet-600 text-white text-xs font-semibold rounded-lg hover:bg-violet-700"><Sparkles className="w-3.5 h-3.5" /> {t('library.openInteractive')}</Link>
      </div>
    </Shell>
  );
}

function StoryPackCard({ book, busy, run }: { book: SchoolBook; busy: string | null; run: (k: string, u: string, f: string) => void }) {
  const { t } = useTranslation('schoolApp');
  const p6 = book.parent6SubLevel;
  return (
    <Shell level={book.level}>
      <div className="flex items-center justify-between gap-2 mb-1"><h3 className="font-bold leading-tight"><bdi dir="ltr" lang="en">{book.title}</bdi> — {t('library.pack')}</h3><LevelBadge level={book.level} /></div>
      <BlockLine id={book.id} />
      <p className="text-xs text-slate-500 mt-1 mb-3">{t('library.packDesc')}</p>
      <div className="mt-auto"><DownloadBtn primary label={t('library.printWorksheetPack')} icon={<FileText className="w-3.5 h-3.5" />} loading={busy === `${p6}-ws`} onClick={() => run(`${p6}-ws`, { resourceType: 'worksheet_pack', resourceKey: storageKey(p6) }, `${book.title} — Worksheets.pdf`)} /></div>
    </Shell>
  );
}

function LevelResourceCard({ level, kind }: { level: number; kind: 'mat' | 'tricky' }) {
  const { t } = useTranslation('schoolApp');
  const Icon = kind === 'mat' ? Grid3x3 : KeySquare;
  const title = kind === 'mat' ? t('library.soundMatTitle', { level: `L${level}` }) : t('library.trickyCardsTitle', { level: `L${level}` });
  const desc = kind === 'mat' ? t('library.soundMatDesc') : t('library.trickyCardsDesc');
  return (
    <Shell level={level}>
      <div className="flex items-center justify-between gap-2 mb-1">
        <h3 className="font-bold leading-tight flex items-center gap-1.5"><Icon className="w-4 h-4 text-slate-400" /> {title}</h3>
        <LevelBadge level={level} />
      </div>
      <p className="text-xs text-slate-500 mt-1 mb-3">{desc} {t('library.usedThroughout')}</p>
      <div className="mt-auto"><ComingSoon icon={<Icon className="w-3 h-3" />} label={t('library.comingSoon')} /></div>
    </Shell>
  );
}
