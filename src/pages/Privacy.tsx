import { Link } from 'react-router-dom';
import { ArrowLeft, Info } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import { setLanguage } from '@/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const CONTACT_EMAIL = 'hello@myphonicsbooks.com';

const COLLECT_ITEMS = ['email', 'child', 'activity', 'payment', 'analytics'] as const;
const PROCESSORS = [
  { id: 'supabase', name: 'Supabase' },
  { id: 'stripe', name: 'Stripe' },
  { id: 'vercel', name: 'Vercel' },
  { id: 'elevenlabs', name: 'ElevenLabs' },
] as const;

export default function Privacy() {
  const { t, i18n } = useTranslation('legal');
  const isEnglish = (i18n.resolvedLanguage ?? i18n.language ?? 'en').startsWith('en');
  const emailLink = (
    <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary underline" dir="ltr" />
  );

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
          {t('privacy.title')}
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          {t('privacy.lastUpdated')}
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          <section>
            <h2 className="text-xl font-bold">{t('privacy.whoWeAre.title')}</h2>
            <p>{t('privacy.whoWeAre.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.collect.title')}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {COLLECT_ITEMS.map((id) => (
                <li key={id}>
                  <Trans
                    t={t}
                    i18nKey={`privacy.collect.items.${id}`}
                    components={{ b: <strong /> }}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.use.title')}</h2>
            <p>{t('privacy.use.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.processors.title')}</h2>
            <ul className="list-disc ps-5 space-y-1">
              {PROCESSORS.map((p) => (
                <li key={p.id}>
                  <span dir="ltr">{p.name}</span> — {t(`privacy.processors.items.${p.id}`)}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.rights.title')}</h2>
            <p>
              <Trans
                t={t}
                i18nKey="privacy.rights.body"
                values={{ email: CONTACT_EMAIL }}
                components={{ email: emailLink }}
              />
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.children.title')}</h2>
            <p>{t('privacy.children.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.cookies.title')}</h2>
            <p>{t('privacy.cookies.body')}</p>
          </section>

          <section>
            <h2 className="text-xl font-bold">{t('privacy.contact.title')}</h2>
            <p>
              <Trans
                t={t}
                i18nKey="privacy.contact.body"
                values={{ email: CONTACT_EMAIL }}
                components={{ email: emailLink }}
              />
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
