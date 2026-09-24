/**
 * PhysicalShop: the parent-facing physical product catalogue at /shop.
 *
 * Sells the printed range: Level Starter Bundles (hero offer), readers
 * (singles, level sets, boxed library), wipe-clean workbooks, card decks,
 * the family bundle and pen packs. Checkout is deliberately out of scope:
 * every buy button opens a register-interest modal that stores email + SKU
 * in funnel_leads so demand can be gauged per product before stock is
 * printed.
 *
 * Design language: "paper & stickers" shared with LandingPage: sticker
 * cards, 3D pressable buttons, journey-level colours. Copy follows the
 * brand voice guidelines (British English, no em dashes, no hard sell).
 */
import { useMemo, useState, FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, ChevronRight, Loader2, Sparkles, X, Eye,
  Droplets, Layers, GraduationCap, RefreshCcw, PenLine, AlertTriangle,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { syncToGHL } from '@/lib/ghlClient';
import { JOURNEY_LEVELS, getJourneyLevel } from '@/lib/levels8';
import {
  SHOP_PRODUCTS, ShopProduct, bySection, getProduct, getPreview, formatPrice,
} from '@/lib/shopCatalogue';
import ProductPreview from '@/components/shop/ProductPreview';
import { useShopText } from '@/components/shop/useShopText';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation, Trans } from 'react-i18next';

const STICKER = '0 1px 2px rgba(40,30,40,0.10), 0 8px 20px rgba(40,30,40,0.10)';
const PINK = '#E84B8A';
const PINK_INK = '#BE1862';
const INDIGO = '#4F46E5';
const INDIGO_INK = '#3730A3';

// Pre-order campaign: fulfilment (Bookvault/ISBN setup) isn't ready yet, so
// this is a no-payment reservation, not real checkout — funnel_leads still
// captures email + SKU, now framed as "lock in a discount" rather than a
// vague waitlist. TODO(Lynden): confirm this percentage before the real
// launch email goes out; picked as a placeholder pre-order incentive.
const PREORDER_DISCOUNT_PCT = 15;

/* ── Shared bits ─────────────────────────────────────────────────────── */

function PushButton({ onClick, children, tone = 'pink', className = '' }: {
  onClick: () => void; children: React.ReactNode; tone?: 'pink' | 'white' | 'indigo'; className?: string;
}) {
  if (tone === 'white') {
    return (
      <button
        onClick={onClick}
        className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-display font-extrabold text-base bg-white text-foreground transition-all active:translate-y-[3px] ${className}`}
        style={{ boxShadow: `0 4px 0 rgba(40,30,40,0.10), ${STICKER}`, border: '1px solid rgba(40,30,40,0.06)' }}
      >
        {children}
      </button>
    );
  }
  const bg = tone === 'indigo' ? INDIGO : PINK;
  const ink = tone === 'indigo' ? INDIGO_INK : PINK_INK;
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px] ${className}`}
      style={{ background: bg, boxShadow: `0 5px 0 ${ink}, 0 14px 28px -10px ${bg}80` }}
    >
      {children}
    </button>
  );
}

function LevelBadge({ level }: { level: number }) {
  const { t } = useTranslation('shop');
  const l = getJourneyLevel(level);
  if (!l) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white whitespace-nowrap"
      style={{ background: l.hex }}
    >
      {t('common.levelBadge', { level: l.level, name: `\u2068${l.name}\u2069` })}
    </span>
  );
}

function PriceBlock({ p, size = 'md' }: { p: ShopProduct; size?: 'md' | 'lg' }) {
  const tr = useShopText();
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      {p.compareAt && p.compareAt > p.price && (
        <span className="text-sm text-muted-foreground line-through font-semibold">
          {formatPrice(p.compareAt)}
        </span>
      )}
      <span className={`font-display font-extrabold text-foreground ${size === 'lg' ? 'text-4xl' : 'text-2xl'}`}>
        {formatPrice(p.price)}
      </span>
      {p.valueNote && (
        <span className="text-xs font-bold text-primary-ink w-full">{tr(p.valueNote)}</span>
      )}
    </div>
  );
}

/* ── Pre-order modal (register interest + discount incentive) ───────── */

function RegisterInterestModal({ product, onClose }: { product: ShopProduct; onClose: () => void }) {
  const { t } = useTranslation('shop');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const canSubmit = email.trim() && consent && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError('');
    try {
      // Same lead store as the marketing funnels; the SKU rides in `source`
      // so demand can be counted per product before any stock is printed.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: dbError } = await (supabase as any).from('funnel_leads').insert({
        email: email.trim(),
        source: `shop-interest:${product.sku}`,
      });
      if (dbError) throw new Error(dbError.message);
      syncToGHL('contact.created', { email: email.trim(), source: `shop-interest:${product.sku}` });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('interest.error'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    // Portal to body: an ancestor motion.div (AnimatedRoutes) sets
    // will-change, which would otherwise make position:fixed resolve against
    // that transformed box instead of the viewport.
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={t('interest.dialogLabel', { name: product.name })}>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label={t('common.close')} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-6 sm:p-8" style={{ boxShadow: STICKER }}>
        <button onClick={onClose} className="absolute top-4 end-4 p-2 rounded-full hover:bg-muted transition-colors" aria-label={t('common.close')}>
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h3 className="mt-4 font-display text-xl font-extrabold text-foreground">{t('interest.doneTitle')}</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('interest.doneBody', { name: `\u2068${product.name}\u2069`, pct: PREORDER_DISCOUNT_PCT })}
            </p>
            <PushButton onClick={onClose} className="mt-6 w-full">{t('interest.done')}</PushButton>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white" style={{ background: PINK }}>
              {t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}
            </span>
            <h3 className="mt-3 font-display text-xl font-extrabold text-foreground"><bdi lang="en">{product.name}</bdi></h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('interest.body', { pct: PREORDER_DISCOUNT_PCT })}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-lg text-foreground">
                {formatPrice(Math.round(product.price * (1 - PREORDER_DISCOUNT_PCT / 100) * 100) / 100)}
              </span>
              <span className="text-sm text-muted-foreground line-through">{formatPrice(product.price)}</span>
              <span className="text-xs font-bold text-primary-ink">{t('interest.preorderPrice')}</span>
            </div>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('interest.emailPlaceholder')}
              dir="ltr"
              required
              className="mt-4 w-full px-4 py-3.5 rounded-xl border-2 border-pink-200 bg-white text-foreground placeholder:text-muted-foreground focus:border-[hsl(var(--primary))] focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
            />
            <label className="mt-3 flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-pink-300 text-[hsl(var(--primary))] focus:ring-pink-500/20"
              />
              <span>{t('interest.consent')}</span>
            </label>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-4 w-full py-3.5 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px] disabled:opacity-50"
              style={{ background: PINK, boxShadow: `0 5px 0 ${PINK_INK}` }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : t('interest.submit', { pct: PREORDER_DISCOUNT_PCT })}
            </button>
            <p className="mt-3 text-xs text-muted-foreground text-center">
              <Trans t={t} i18nKey="interest.noPayment" components={{ link: <Link to="/privacy" className="underline" /> }} />
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

/* ── Product detail modal ────────────────────────────────────────────── */

function ProductDetail({ product, onInterest, onOpen, onPreview, onClose }: {
  product: ShopProduct;
  onInterest: (p: ShopProduct) => void;
  onOpen: (sku: string) => void;
  onPreview: (sku: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation('shop');
  const tr = useShopText();
  const crossSells = (product.crossSellSkus ?? [])
    .map(getProduct)
    .filter((p): p is ShopProduct => Boolean(p));
  const hasPreview = getPreview(product.sku) !== null;

  return createPortal(
    // Portal to body: see RegisterInterestModal for why.
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label={product.name}>
      <button className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} aria-label={t('common.close')} />
      <div className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl" style={{ boxShadow: STICKER }}>
        <button onClick={onClose} className="absolute top-4 end-4 z-10 p-2 rounded-full bg-white/90 hover:bg-muted transition-colors" style={{ boxShadow: STICKER }} aria-label={t('common.close')}>
          <X className="w-4 h-4" />
        </button>

        <div className="grid sm:grid-cols-2 gap-0">
          <div className="relative bg-[#FAFAF8] flex items-center justify-center p-6 sm:min-h-[380px]">
            <img src={product.images[0]} alt={product.name} className="max-w-full max-h-[320px] sm:max-h-[420px] object-contain rounded-xl" loading="lazy" />
            {hasPreview && (
              <button
                onClick={() => onPreview(product.sku)}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-display font-extrabold text-sm bg-white text-foreground transition-all active:translate-y-[2px] whitespace-nowrap"
                style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.08)' }}
              >
                <Eye className="w-4 h-4" style={{ color: PINK_INK }} /> {t('common.takeAPeekInside')}
              </button>
            )}
          </div>
          <div className="p-6 sm:p-8">
            {product.level && <LevelBadge level={product.level} />}
            <h2 className="mt-2 font-display text-2xl font-extrabold text-foreground leading-tight"><bdi lang="en">{product.name}</bdi></h2>
            <div className="mt-3"><PriceBlock p={product} size="lg" /></div>

            <div className="mt-4 space-y-3">
              {product.description.map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">{tr(para)}</p>
              ))}
            </div>

            <button
              onClick={() => onInterest(product)}
              className="mt-6 w-full py-3.5 rounded-2xl font-display font-extrabold text-base text-white transition-all active:translate-y-[4px]"
              style={{ background: PINK, boxShadow: `0 5px 0 ${PINK_INK}, 0 14px 28px -10px ${PINK}80` }}
            >
              {t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}
            </button>
            {/* TODO(Lynden): confirm the returns policy wording before launch */}
            <p className="mt-2 text-xs text-muted-foreground text-center">{t('detail.returns')}</p>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-8 grid sm:grid-cols-2 gap-6">
          <div>
            <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-wide">{t('detail.inTheBox')}</h3>
            <ul className="mt-3 space-y-2">
              {product.contents.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {tr(c)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-wide">{t('detail.details')}</h3>
            <dl className="mt-3 space-y-1.5">
              {product.spec.map((s, i) => (
                <div key={i} className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{tr(s.label)}</dt>
                  <dd className="font-semibold text-foreground text-end">{tr(s.value)}</dd>
                </div>
              ))}
            </dl>
          </div>

          {crossSells.length > 0 && (
            <div className="sm:col-span-2">
              <h3 className="font-display font-extrabold text-sm text-foreground uppercase tracking-wide">{t('detail.goesWellWith')}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {crossSells.map((c) => (
                  <button
                    key={c.sku}
                    onClick={() => onOpen(c.sku)}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white text-sm font-bold text-foreground transition-all active:translate-y-[2px]"
                    style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
                  >
                    <bdi lang="en">{c.name}</bdi> <span className="text-primary-ink">{formatPrice(c.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ── Product card ────────────────────────────────────────────────────── */

function ProductCard({ p, onOpen, onInterest, onPreview, compact = false }: {
  p: ShopProduct;
  onOpen: (sku: string) => void;
  onInterest: (p: ShopProduct) => void;
  onPreview?: (sku: string) => void;
  compact?: boolean;
}) {
  const { t } = useTranslation('shop');
  const tr = useShopText();
  const level = p.level ? getJourneyLevel(p.level) : null;
  const hasPreview = onPreview && getPreview(p.sku) !== null;
  return (
    <div
      className="relative rounded-[1.5rem] bg-white overflow-hidden flex flex-col transition-transform hover:-translate-y-1"
      style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
    >
      {/* level accent strip */}
      <div className="h-1.5 w-full shrink-0" style={{ background: level?.hex ?? INDIGO }} />
      {p.badge && (
        <span
          className="absolute top-4 end-3 rotate-2 inline-block rounded-full bg-white px-3 py-1 text-[11px] font-extrabold text-primary-ink"
          style={{ boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${level?.hex ?? PINK}30` }}
        >
          {tr(p.badge)}
        </span>
      )}
      <div className="relative group">
        <button onClick={() => onOpen(p.sku)} className="block w-full bg-[#FAFAF8] text-start" aria-label={t('common.viewProduct', { name: p.name })}>
          <img
            src={p.images[0]}
            alt={p.name}
            className={`w-full object-contain ${compact ? 'h-40' : 'h-48 sm:h-56'}`}
            loading="lazy"
            decoding="async"
          />
        </button>
        {hasPreview && (
          <button
            onClick={() => onPreview!(p.sku)}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-xs font-extrabold text-foreground transition-all active:translate-y-[1px] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.08)' }}
          >
            <Eye className="w-3.5 h-3.5" style={{ color: PINK_INK }} /> {t('common.peekInside')}
          </button>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {level && <div className="mb-2"><LevelBadge level={level.level} /></div>}
        <button onClick={() => onOpen(p.sku)} className="text-start">
          <h3 className="font-display font-extrabold text-foreground leading-snug"><bdi lang="en">{p.name}</bdi></h3>
        </button>
        {!compact && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed flex-1">{tr(p.blurb)}</p>}
        <div className={compact ? 'mt-2' : 'mt-3'}><PriceBlock p={p} /></div>
        <button
          onClick={() => onInterest(p)}
          className="mt-3 w-full py-2.5 rounded-xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
          style={{ background: PINK, boxShadow: `0 4px 0 ${PINK_INK}` }}
        >
          {t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}
        </button>
      </div>
    </div>
  );
}

/* ── Section shell ───────────────────────────────────────────────────── */

function Section({ id, eyebrow, title, intro, children }: {
  id: string; eyebrow: string; title: string; intro: string; children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3"
          style={{ background: 'rgba(232,75,138,0.10)', color: PINK_INK }}
        >
          {eyebrow}
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{title}</h2>
        <p className="mt-2 text-muted-foreground max-w-2xl">{intro}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */

export default function PhysicalShop() {
  const { t } = useTranslation('shop');
  const tr = useShopText();
  const navigate = useNavigate();
  const [detailSku, setDetailSku] = useState<string | null>(null);
  const [interestProduct, setInterestProduct] = useState<ShopProduct | null>(null);
  const [previewSku, setPreviewSku] = useState<string | null>(null);
  const [readersLevel, setReadersLevel] = useState<number>(1);

  const detail = detailSku ? getProduct(detailSku) : undefined;
  const previewProduct = previewSku ? getProduct(previewSku) : undefined;
  const preview = previewSku ? getPreview(previewSku) : null;
  const bundles = useMemo(() => bySection('bundle'), []);
  const sets = useMemo(() => bySection('reader-set'), []);
  const singles = useMemo(() => bySection('reader-single'), []);
  const workbooks = useMemo(() => bySection('workbook'), []);
  const wordDecks = useMemo(() => bySection('card-deck').filter((p) => p.level !== null), []);
  const soundDeck = getProduct('SC-FULL')!;
  const library = getProduct('R-LIB')!;
  const family = getProduct('BN-FAM')!;
  const pens = getProduct('PEN-3')!;
  const featuredBundle = getProduct('BN-L4')!;

  const openDetail = (sku: string) => setDetailSku(sku);
  const openInterest = (p: ShopProduct) => {
    setDetailSku(null);
    setInterestProduct(p);
  };
  const openPreview = (sku: string) => setPreviewSku(sku);

  const visibleSingles = singles.filter((p) => p.level === readersLevel);

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <a href="#main" className="skip-link">{t('meta.skipToMain')}</a>

      {/* ── Nav ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl shadow-card border-b border-border safe-top">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <Link to="/landing" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 min-w-0" aria-label={t('meta.homeAria')}>
            <img src="/logo/mpb-mark-transparent.png" alt="" className="w-9 h-9 sm:w-10 sm:h-10 object-contain shrink-0" draggable={false} />
            <span dir="ltr" className="font-display text-base sm:text-lg font-extrabold text-foreground tracking-tight truncate hidden xs:inline">
              My<span className="text-primary-ink">Phonics</span>Books
            </span>
          </Link>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link to="/library" className="text-xs sm:text-sm font-bold text-foreground hover:text-primary-ink transition-colors whitespace-nowrap items-center gap-1 hidden sm:inline-flex">
              <BookOpen className="w-4 h-4" /> {t('nav.readOnline')}
            </Link>
            <Link to="/school" className="text-xs sm:text-sm font-bold text-foreground hover:text-primary-ink transition-colors whitespace-nowrap inline-flex items-center gap-1">
              <GraduationCap className="w-4 h-4" />
              <span className="hidden xs:inline">{t('common:nav.forSchools')}</span>
              <span className="xs:hidden">{t('common:nav.schools')}</span>
            </Link>
            <button
              onClick={() => navigate('/assessment')}
              className="text-xs sm:text-sm font-display font-extrabold text-white px-3 sm:px-4 py-2 rounded-xl transition-all active:translate-y-[2px] whitespace-nowrap"
              style={{ background: PINK, boxShadow: `0 3px 0 ${PINK_INK}` }}
            >
              <span className="sm:hidden">{t('nav.freeCheck')}</span>
              <span className="hidden sm:inline">{t('nav.checkLevelFree')}</span>
            </button>
            <LanguageSwitcher variant="compact" />
          </div>
        </div>
      </header>

      <main id="main">
        {/* ── Hero ── */}
        <section className="relative pt-28 pb-12 md:pt-36 md:pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(338,78%,96%)] via-background to-[hsl(142,60%,97%)]" />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="text-center md:text-start">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold text-white"
                  style={{ background: PINK }}
                >
                  {t('hero.pill', { pct: PREORDER_DISCOUNT_PCT })}
                </span>
                <h1 className="mt-4 font-display text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight leading-[1.05]">
                  {t('hero.title')}{' '}
                  <span className="text-primary-ink">{t('hero.titleAccent')}</span>
                </h1>
                <p className="mt-5 text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto md:mx-0">
                  {t('hero.body', { pct: PREORDER_DISCOUNT_PCT })}
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <PushButton onClick={() => navigate('/assessment')}>
                    <Sparkles className="w-5 h-5" /> {t('common.findLevelFree')}
                  </PushButton>
                  <PushButton
                    tone="white"
                    onClick={() => document.getElementById('bundles')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    {t('hero.seeBundles')} <ChevronRight className="w-4 h-4 rtl:-scale-x-100" />
                  </PushButton>
                </div>
                <p className="mt-4 text-xs text-muted-foreground font-semibold">
                  {t('hero.notSure')}
                </p>
              </div>

              {/* Bundle spotlight */}
              <div
                className="relative rounded-[2rem] bg-white p-5 sm:p-6"
                style={{ boxShadow: STICKER, border: `2px solid ${INDIGO}`, outline: `4px solid ${INDIGO}20` }}
              >
                <span
                  className="absolute -top-3 start-6 rotate-1 inline-block rounded-full bg-white px-4 py-1.5 text-xs font-extrabold text-primary-ink"
                  style={{ boxShadow: STICKER, border: '2px solid #fff', outline: `2px solid ${PINK}30` }}
                >
                  {t('hero.spotlightSticker')}
                </span>
                <button onClick={() => openDetail(featuredBundle.sku)} className="block w-full text-start">
                  <img src={featuredBundle.images[0]} alt={featuredBundle.name} className="w-full h-52 sm:h-64 object-contain rounded-xl bg-[#FAFAF8]" />
                  <h2 className="mt-4 font-display text-xl font-extrabold text-foreground"><bdi lang="en">{featuredBundle.name}</bdi></h2>
                  <p className="mt-1 text-sm text-muted-foreground">{tr(featuredBundle.blurb)}</p>
                </button>
                <div className="mt-3 flex items-end justify-between gap-3">
                  <PriceBlock p={featuredBundle} size="lg" />
                  <button
                    onClick={() => openInterest(featuredBundle)}
                    className="shrink-0 px-5 py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
                    style={{ background: PINK, boxShadow: `0 4px 0 ${PINK_INK}` }}
                  >
                    {t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}
                  </button>
                </div>
                {/* Price anchors: the big-ticket items, visible from the first screen */}
                <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <button onClick={() => openDetail('R-LIB')} className="hover:text-primary-ink font-semibold transition-colors">
                    {t('hero.anchorLibrary')}
                  </button>
                  <button onClick={() => openDetail('BN-FAM')} className="hover:text-primary-ink font-semibold transition-colors">
                    {t('hero.anchorFamily')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust strip ── */}
        <section className="py-6 border-y border-border bg-card/60">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-start">
            {[
              { icon: BookOpen, text: t('trust.decodable') },
              { icon: GraduationCap, text: t('trust.teacher') },
              { icon: RefreshCcw, text: t('trust.returns') /* TODO(Lynden): confirm the returns policy wording */ },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-start gap-3 justify-center sm:justify-start">
                <Icon className="w-5 h-5 text-primary-ink shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Level Starter Bundles ── */}
        <Section
          id="bundles"
          eyebrow={t('bundles.eyebrow')}
          title={t('bundles.title')}
          intro={t('bundles.intro')}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {bundles.map((p) => (
              <ProductCard key={p.sku} p={p} onOpen={openDetail} onInterest={openInterest} onPreview={openPreview} />
            ))}
          </div>
          {/* <!-- testimonial slot: bundle buyer quote goes here --> */}
        </Section>

        {/* ── Readers ── */}
        <Section
          id="readers"
          eyebrow={t('readers.eyebrow')}
          title={t('readers.title')}
          intro={t('readers.intro')}
        >
          {/* Level sets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sets.map((p) => (
              <ProductCard key={p.sku} p={p} onOpen={openDetail} onInterest={openInterest} onPreview={openPreview} />
            ))}
          </div>

          {/* Full library feature card */}
          <div
            className="mt-8 rounded-[2rem] bg-white overflow-hidden grid md:grid-cols-2"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
          >
            <button onClick={() => openDetail(library.sku)} className="bg-[#FAFAF8] flex items-center justify-center p-6">
              <img src={library.images[0]} alt={library.name} className="w-full max-h-64 object-contain" loading="lazy" />
            </button>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-ink">{t('readers.libraryEyebrow')}</span>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-foreground"><bdi lang="en">{library.name}</bdi></h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tr(library.blurb)}</p>
              <div className="mt-4"><PriceBlock p={library} size="lg" /></div>
              <div className="mt-5 flex gap-3">
                <PushButton onClick={() => openInterest(library)} className="!py-3 text-sm">{t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}</PushButton>
                <PushButton tone="white" onClick={() => openDetail(library.sku)} className="!py-3 text-sm">{t('common.seeDetails')}</PushButton>
              </div>
            </div>
          </div>

          {/* Singles, filtered by level */}
          <h3 className="mt-12 font-display text-xl font-extrabold text-foreground">{t('readers.singlesTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('readers.singlesIntro')}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {JOURNEY_LEVELS.map((l) => {
              const active = readersLevel === l.level;
              return (
                <button
                  key={l.level}
                  onClick={() => setReadersLevel(l.level)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-extrabold border-2 transition-all"
                  style={active
                    ? { background: l.hex, borderColor: l.hex, color: '#fff' }
                    : { background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: l.inkHex }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: active ? '#fff' : l.hex }} />
                  {t('common.levelChip', { level: l.level, name: `\u2068${l.name}\u2069` })}
                </button>
              );
            })}
          </div>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {visibleSingles.map((p) => (
              <ProductCard key={p.sku} p={p} onOpen={openDetail} onInterest={openInterest} onPreview={openPreview} compact />
            ))}
          </div>
        </Section>

        {/* ── Wipe-clean workbooks ── */}
        <Section
          id="workbooks"
          eyebrow={t('workbooks.eyebrow')}
          title={t('workbooks.title')}
          intro={t('workbooks.intro')}
        >
          <div
            className="rounded-[2rem] bg-white p-6 sm:p-8 grid md:grid-cols-3 gap-6"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
          >
            {[
              { icon: RefreshCcw, title: t('workbooks.f1Title'), text: t('workbooks.f1Text') },
              { icon: Layers, title: t('workbooks.f2Title'), text: t('workbooks.f2Text') },
              { icon: Droplets, title: t('workbooks.f3Title'), text: t('workbooks.f3Text') },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(232,75,138,0.10)' }}>
                  <Icon className="w-5 h-5 text-primary-ink" />
                </div>
                <h3 className="mt-3 font-display font-extrabold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-3 rounded-2xl px-5 py-4" style={{ background: 'rgba(245,158,11,0.10)' }}>
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#92600A' }} />
            <p className="text-sm font-semibold" style={{ color: '#92600A' }}>
              {t('workbooks.warning')}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {workbooks.map((p) => (
              <ProductCard key={p.sku} p={p} onOpen={openDetail} onInterest={openInterest} onPreview={openPreview} />
            ))}
          </div>

          {/* Pen cross-sell on the same section */}
          <div
            className="mt-8 rounded-[2rem] bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
          >
            <img src={pens.images[0]} alt={pens.name} className="w-40 h-40 object-contain bg-[#FAFAF8] rounded-2xl" loading="lazy" />
            <div className="flex-1 text-center sm:text-start">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary-ink">
                <PenLine className="w-4 h-4" /> {t('workbooks.penEyebrow')}
              </div>
              <h3 className="mt-1 font-display text-xl font-extrabold text-foreground"><bdi lang="en">{pens.name}</bdi></h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-lg">{tr(pens.blurb)}</p>
            </div>
            <div className="text-center">
              <div className="font-display text-3xl font-extrabold text-foreground">{formatPrice(pens.price)}</div>
              <button
                onClick={() => openInterest(pens)}
                className="mt-2 px-6 py-3 rounded-2xl font-display font-extrabold text-sm text-white transition-all active:translate-y-[3px]"
                style={{ background: PINK, boxShadow: `0 4px 0 ${PINK_INK}` }}
              >
                {t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}
              </button>
            </div>
          </div>
          {/* <!-- testimonial slot: workbook parent quote goes here --> */}
        </Section>

        {/* ── Card decks ── */}
        <Section
          id="cards"
          eyebrow={t('cards.eyebrow')}
          title={t('cards.title')}
          intro={t('cards.intro')}
        >
          {/* Sound deck feature */}
          <div
            className="rounded-[2rem] bg-white overflow-hidden grid md:grid-cols-2 mb-8"
            style={{ boxShadow: STICKER, border: '1px solid rgba(40,30,40,0.06)' }}
          >
            <button onClick={() => openDetail(soundDeck.sku)} className="bg-[#FAFAF8] flex items-center justify-center p-6">
              <img src={soundDeck.images[0]} alt={soundDeck.name} className="w-full max-h-64 object-contain" loading="lazy" />
            </button>
            <div className="p-6 sm:p-8 flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-ink">{t('cards.soundEyebrow')}</span>
              <h3 className="mt-1 font-display text-2xl font-extrabold text-foreground"><bdi lang="en">{soundDeck.name}</bdi></h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{tr(soundDeck.blurb)}</p>
              <div className="mt-4"><PriceBlock p={soundDeck} size="lg" /></div>
              <div className="mt-5 flex gap-3">
                <PushButton onClick={() => openInterest(soundDeck)} className="!py-3 text-sm">{t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}</PushButton>
                <PushButton tone="white" onClick={() => openDetail(soundDeck.sku)} className="!py-3 text-sm">{t('common.seeDetails')}</PushButton>
              </div>
            </div>
          </div>

          <h3 className="font-display text-xl font-extrabold text-foreground">{t('cards.wordTitle')}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('cards.wordIntro')}
          </p>
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {wordDecks.map((p) => (
              <ProductCard key={p.sku} p={p} onOpen={openDetail} onInterest={openInterest} onPreview={openPreview} compact />
            ))}
          </div>
        </Section>

        {/* ── Family bundle ── */}
        <Section
          id="family"
          eyebrow={t('family.eyebrow')}
          title={t('family.title')}
          intro={t('family.intro')}
        >
          <div
            className="rounded-[2.5rem] bg-white overflow-hidden grid md:grid-cols-2"
            style={{ boxShadow: STICKER, border: `2px solid ${INDIGO}`, outline: `4px solid ${INDIGO}20` }}
          >
            <button onClick={() => openDetail(family.sku)} className="bg-[#FAFAF8] flex items-center justify-center p-6">
              <img src={family.images[0]} alt={family.name} className="w-full max-h-72 object-contain" loading="lazy" />
            </button>
            <div className="p-6 sm:p-10 flex flex-col justify-center">
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground"><bdi lang="en">{family.name}</bdi></h3>
              <ul className="mt-4 space-y-2.5">
                {family.contents.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {tr(c)}
                  </li>
                ))}
              </ul>
              <div className="mt-5"><PriceBlock p={family} size="lg" /></div>
              <div className="mt-6 flex gap-3">
                <PushButton onClick={() => openInterest(family)} className="!py-3 text-sm">{t('common.preorderSave', { pct: PREORDER_DISCOUNT_PCT })}</PushButton>
                <PushButton tone="white" onClick={() => openDetail(family.sku)} className="!py-3 text-sm">{t('common.seeDetails')}</PushButton>
              </div>
            </div>
          </div>
          {/* <!-- testimonial slot: family bundle quote goes here --> */}
        </Section>

        {/* ── Closing CTA ── */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
            <div className="bg-gradient-to-br from-primary/10 via-background to-[hsl(var(--level-5))]/10 rounded-[2.5rem] p-10 md:p-14 border border-primary/20">
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
                {t('closing.title')}
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-lg mx-auto">
                {t('closing.body')}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <PushButton onClick={() => navigate('/assessment')}>
                  <Sparkles className="w-5 h-5" /> {t('common.findLevelFree')}
                </PushButton>
                <PushButton tone="white" onClick={() => navigate('/library')}>
                  <BookOpen className="w-5 h-5" /> {t('closing.readOnline')}
                </PushButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-indigo-100 py-8 bg-gradient-to-b from-card to-indigo-50/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo/mpb-mark-transparent.png" alt="" className="w-8 h-8 object-contain" draggable={false} />
            <span dir="ltr" className="font-display text-sm font-bold text-foreground">MyPhonicsBooks</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/love" className="hover:text-trust-ink transition-colors">{t('footer.wallOfLove')}</Link>
            <a href="/privacy" className="hover:text-trust-ink transition-colors">{t('footer.privacy')}</a>
            <a href="/terms" className="hover:text-trust-ink transition-colors">{t('footer.terms')}</a>
            <a href="mailto:hello@myphonicsbooks.co.uk" className="hover:text-trust-ink transition-colors">{t('footer.contact')}</a>
          </div>
          <p className="text-xs text-muted-foreground">{t('footer.madeInUk')}</p>
        </div>
      </footer>

      {/* ── Modals ── */}
      {detail && (
        <ProductDetail
          product={detail}
          onOpen={openDetail}
          onInterest={openInterest}
          onPreview={openPreview}
          onClose={() => setDetailSku(null)}
        />
      )}
      {preview && previewProduct && (
        <ProductPreview
          preview={preview}
          accentHex={previewProduct.level ? (getJourneyLevel(previewProduct.level)?.hex ?? PINK) : PINK}
          onClose={() => setPreviewSku(null)}
          onReadOnline={() => navigate('/library')}
          onRegister={() => {
            const p = previewProduct;
            setPreviewSku(null);
            openInterest(p);
          }}
        />
      )}
      {interestProduct && (
        <RegisterInterestModal product={interestProduct} onClose={() => setInterestProduct(null)} />
      )}
    </div>
  );
}
