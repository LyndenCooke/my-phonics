/**
 * Site languages for GROWN-UP text (parents, teachers, carers).
 *
 * The reading content itself — books, sounds, green/tricky words, game
 * words, anything a child decodes — is always English: that's the product.
 * Only the chrome around it is translated. See src/i18n/README.md.
 *
 * The ten non-English languages are the most widely spoken across the
 * Middle East, Asia and Africa (by total speakers, with regional spread).
 */
export type LanguageCode =
  | 'en' | 'ar' | 'zh' | 'hi' | 'bn' | 'ur' | 'id' | 'fa' | 'tr' | 'sw' | 'ha';

export interface SiteLanguage {
  code: LanguageCode;
  /** Name in the language itself — what the switcher shows. */
  nativeName: string;
  /** English name — shown underneath so staff can find a language too. */
  englishName: string;
  dir: 'ltr' | 'rtl';
  /** BCP-47 tag for <html lang> and Intl formatting. */
  locale: string;
}

export const LANGUAGES: SiteLanguage[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', locale: 'en-GB' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl', locale: 'ar' },
  { code: 'zh', nativeName: '中文（简体）', englishName: 'Chinese', dir: 'ltr', locale: 'zh-CN' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr', locale: 'hi-IN' },
  { code: 'bn', nativeName: 'বাংলা', englishName: 'Bengali', dir: 'ltr', locale: 'bn' },
  { code: 'ur', nativeName: 'اردو', englishName: 'Urdu', dir: 'rtl', locale: 'ur' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', dir: 'ltr', locale: 'id-ID' },
  { code: 'fa', nativeName: 'فارسی', englishName: 'Persian', dir: 'rtl', locale: 'fa' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', dir: 'ltr', locale: 'tr-TR' },
  { code: 'sw', nativeName: 'Kiswahili', englishName: 'Swahili', dir: 'ltr', locale: 'sw' },
  { code: 'ha', nativeName: 'Hausa', englishName: 'Hausa', dir: 'ltr', locale: 'ha' },
];

export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);

export function getLanguage(code: string | undefined | null): SiteLanguage {
  const base = (code ?? 'en').toLowerCase().split('-')[0];
  return LANGUAGES.find((l) => l.code === base) ?? LANGUAGES[0];
}
