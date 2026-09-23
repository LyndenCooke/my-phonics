/**
 * i18n bootstrap — react-i18next with browser-language detection.
 *
 * Detection order: ?lang= in the URL → the parent's saved choice
 * (localStorage `mpb:lang`) → the browser/phone language → English.
 * `ar-SA`, `zh-CN`, `hi-IN` … all resolve to their base language.
 *
 * Every namespace is its own JSON file (src/i18n/locales/<lng>/<ns>.json)
 * and is code-split, so a parent only downloads the language + pages they
 * actually open. English `common` is bundled so the app shell never waits.
 * Missing keys fall back to English, so a half-translated page still works.
 */
import i18n, { type BackendModule, type ReadCallback } from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from './locales/en/common.json';
import { LANGUAGE_CODES, getLanguage } from './languages';

export const LANG_STORAGE_KEY = 'mpb:lang';

const loaders = import.meta.glob<{ default: Record<string, unknown> }>('./locales/*/*.json');

const lazyBackend: BackendModule = {
  type: 'backend',
  init() {},
  read(language: string, namespace: string, callback: ReadCallback) {
    const load = loaders[`./locales/${language}/${namespace}.json`];
    if (!load) {
      // Not translated (yet) — i18next falls back to English per key.
      callback(null, {});
      return;
    }
    load()
      .then((mod) => callback(null, mod.default))
      .catch((err) => callback(err, null));
  },
};

/** Script-specific web fonts, loaded only when that language is active. */
const LANGUAGE_FONTS: Record<string, string> = {
  ar: 'Noto+Sans+Arabic:wght@400;500;600;700;800',
  fa: 'Noto+Sans+Arabic:wght@400;500;600;700;800',
  ur: 'Noto+Nastaliq+Urdu:wght@400;500;600;700',
  hi: 'Noto+Sans+Devanagari:wght@400;500;600;700;800',
  bn: 'Noto+Sans+Bengali:wght@400;500;600;700;800',
};

function ensureFont(code: string) {
  const family = LANGUAGE_FONTS[code];
  if (!family || typeof document === 'undefined') return;
  const id = `mpb-font-${code}`;
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${family}&display=swap`;
  document.head.appendChild(link);
}

function applyDocumentLanguage(code: string) {
  if (typeof document === 'undefined') return;
  const lang = getLanguage(code);
  document.documentElement.lang = lang.locale;
  document.documentElement.dir = lang.dir;
  ensureFont(lang.code);
}

i18n.on('languageChanged', applyDocumentLanguage);

/**
 * True when nobody has chosen a language yet and we picked one from the
 * browser. Read before init() because the detector caches its pick into
 * localStorage straight away. Drives the one-time "showing this in …" toast.
 */
export const languageWasAutoDetected = (() => {
  try {
    if (new URLSearchParams(window.location.search).has('lang')) return false;
    return !window.localStorage.getItem(LANG_STORAGE_KEY);
  } catch {
    return false;
  }
})();

void i18n
  .use(lazyBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: LANGUAGE_CODES,
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    fallbackLng: 'en',
    ns: ['common'],
    defaultNS: 'common',
    partialBundledLanguages: true,
    resources: { en: { common: enCommon } },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    react: { useSuspense: true },
    returnNull: false,
  });

applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? 'en');

/** Current language as one of ours (never a raw `ar-SA`). */
export function currentLanguage() {
  return getLanguage(i18n.resolvedLanguage ?? i18n.language);
}

/** Switch language and remember it (localStorage via the detector cache). */
export function setLanguage(code: string) {
  return i18n.changeLanguage(getLanguage(code).code);
}

export default i18n;
