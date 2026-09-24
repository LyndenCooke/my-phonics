import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { languageWasAutoDetected, setLanguage } from '@/i18n';
import { getLanguage } from '@/i18n/languages';

/**
 * One-time heads-up when we've switched the site to the parent's browser
 * language by ourselves: "Showing MyPhonicsBooks in العربية" with a
 * one-tap way back to English. Never shown once a language was chosen.
 */
export default function LanguageNotice() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!languageWasAutoDetected) return;
    const lang = getLanguage(i18n.language ?? i18n.resolvedLanguage);
    if (lang.code === 'en') return;
    const id = window.setTimeout(() => {
      toast(t('language.autoDetected', { language: lang.nativeName }), {
        description: t('language.autoDetectedHint'),
        duration: 9000,
        action: { label: 'English', onClick: () => { void setLanguage('en'); } },
      });
    }, 800);
    return () => window.clearTimeout(id);
    // Once per page load, on first mount only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
