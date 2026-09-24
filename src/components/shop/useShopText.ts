import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { ShopText, Tx } from '@/lib/shopCatalogue';

/**
 * Unicode first-strong isolate: keeps an English title / sound list reading
 * left-to-right when it is dropped into an Arabic, Urdu or Persian sentence.
 */
const isolate = (s: string) => `⁨${s}⁩`;

/** Resolves catalogue copy (`ShopText`) in the parent's language. */
export function useShopText() {
  const { t } = useTranslation('shop');
  const resolve = useCallback(
    (text: ShopText | undefined): string => {
      if (text === undefined) return '';
      if (typeof text === 'string') return text;
      const vars: Record<string, string | number> = {};
      for (const [k, v] of Object.entries((text as Tx).vars ?? {})) {
        vars[k] = typeof v === 'number' ? v : isolate(typeof v === 'string' ? v : resolve(v));
      }
      return t(text.key, vars);
    },
    [t],
  );
  return resolve;
}
