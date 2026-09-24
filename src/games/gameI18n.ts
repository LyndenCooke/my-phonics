/**
 * Game UI chrome i18n helpers.
 *
 * Game roots are `dir="ltr" lang="en"` islands (the words a child reads stay
 * English and the layout never flips). Translated chrome inside the island
 * gets `{...tx}` so Arabic/Urdu/Persian lines still read right-to-left.
 * English words inside a translated sentence go in `<en>` → `<bdi lang="en">`.
 */
import { useRef } from 'react';
import type { TFunction } from 'i18next';

/** Fallback stack so canvas UI labels render Arabic, Devanagari, Bengali, CJK… */
export const CANVAS_FONT_FALLBACK =
  'system-ui, "Segoe UI", Tahoma, "Noto Sans", "Noto Sans Arabic", "Noto Naskh Arabic", ' +
  '"Noto Sans Devanagari", "Noto Sans Bengali", "Noto Sans SC", "PingFang SC", ' +
  '"Microsoft YaHei", "Hiragino Sans", sans-serif';

/** Font family for canvas-drawn UI labels (display font first, then fallbacks). */
export const labelFont = (ready: boolean) => (ready ? `Outfit, ${CANVAS_FONT_FALLBACK}` : CANVAS_FONT_FALLBACK);

/** Wrap an English word/grapheme so it stays LTR inside a translated canvas line. */
const FSI = String.fromCharCode(0x2068); // first-strong isolate
const PDI = String.fromCharCode(0x2069); // pop directional isolate
export const isolate = (s: string | number) => `${FSI}${s}${PDI}`;

type ListFormatCtor = new (lang: string, opts: { type: 'conjunction' }) => { format(items: string[]): string };

/** "Pip and Zed" in the viewer's language; each English name stays isolated LTR. */
export function joinNames(lang: string, names: string[]) {
  const iso = names.map(isolate);
  const LF = (Intl as unknown as { ListFormat?: ListFormatCtor }).ListFormat;
  try {
    if (LF) return new LF(lang, { type: 'conjunction' }).format(iso);
  } catch { /* unsupported locale */ }
  return iso.join(', ');
}

type I18nLike = { language: string; resolvedLanguage?: string; dir: (lng?: string) => 'ltr' | 'rtl' };

/** Props for a translated text element inside the English game island. */
export function gameTx(i18n: I18nLike) {
  const lang = i18n.resolvedLanguage ?? i18n.language;
  return { lang, dir: i18n.dir(lang) } as { lang: string; dir: 'ltr' | 'rtl' };
}

/**
 * For canvas games whose draw loop lives in a mount-once effect: a ref that
 * always holds the current `t` and text direction.
 */
export function useLiveT(t: TFunction<'games'>, i18n: I18nLike) {
  const dir = gameTx(i18n).dir;
  const ref = useRef({ t, dir });
  ref.current = { t, dir };
  return ref;
}

/**
 * Draw a translated UI line on a canvas: sets the text direction, shrinks
 * the font if the line is wider than `maxW`, then restores direction.
 */
export function fillLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: { weight: number; size: number; family: string; dir: 'ltr' | 'rtl'; maxW?: number },
) {
  let size = opts.size;
  ctx.font = `${opts.weight} ${size}px ${opts.family}`;
  if (opts.maxW) {
    const w = ctx.measureText(text).width;
    if (w > opts.maxW) {
      size = Math.max(9, Math.floor(size * (opts.maxW / w)));
      ctx.font = `${opts.weight} ${size}px ${opts.family}`;
    }
  }
  const prev = ctx.direction;
  ctx.direction = opts.dir;
  ctx.fillText(text, x, y);
  ctx.direction = prev;
}
