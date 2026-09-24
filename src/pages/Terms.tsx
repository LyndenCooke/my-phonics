import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { setLanguage } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const CONTACT_EMAIL = 'hello@myphonicsbooks.com';

// Sections 1–11 are plain text; section 12 (contact) carries the email link.
const TEXT_SECTIONS = [
  'about',
  'signup',
  'yourContent',
  'ourContent',
  'subscriptions',
  'trials',
  'acceptableUse',
  'outcomes',
  'liability',
  'changes',
  'law',
] as const;

export default function Terms() {
  const { t, i18n } = useTranslation('legal');
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('en');

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-trust-ink hover:text-trust-ink/80"
          >
            <ArrowLeft className="w-4 h-4 rtl:-scale-x-100" /> {t('backHome')}
          </Link>
          <LanguageSwitcher variant="compact" />
        </div>

        {!isEnglish && (
          <div className="mb-6 flex items-start gap-2 rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" aria-hidden />
            <p>
              {t('notice.text')}{' '}
              <button
                type="button"
                onClick={() => { void setLanguage('en'); }}
                className="font-semibold text-primary underline"
              >
                {t('notice.switch')}
              </button>
            </p>
          </div>
        )}

        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-2">
          {t('terms.title')}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t('terms.lastUpdated')}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          {TEXT_SECTIONS.map((id, i) => (
            <section key={id}>
              <h2 className="text-xl font-bold">
                {i + 1}. {t(`terms.${id}.title`)}
              </h2>
              <p>{t(`terms.${id}.body`)}</p>
            </section>
          ))}

          <section>
            <h2 className="text-xl font-bold">
              {TEXT_SECTIONS.length + 1}. {t('terms.contact.title')}
            </h2>
            <p>
              <Trans
                t={t}
                i18nKey="terms.contact.body"
                values={{ email: CONTACT_EMAIL }}
                components={{
                  email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline" dir="ltr" />,
                }}
              />
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
