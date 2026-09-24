/**
 * HelpSupport — FAQs + contact + policy links.
 *
 * No backend wiring needed for the FAQ accordion; the contact button uses
 * a mailto: link so the user's mail client handles delivery without us
 * standing up a contact-form endpoint.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { ArrowLeft, ChevronDown, Mail, FileText, Shield, MessageCircle } from 'lucide-react';

const SUPPORT_EMAIL = 'support@myphonicsbooks.com';

// FAQ copy lives in the `profile` namespace (help.faq.<id>.q / .a).
const FAQ_IDS = ['assessment', 'progress', 'stamps', 'unlock', 'refunds', 'pwa'] as const;

export default function HelpSupport() {
  const { t } = useTranslation('profile');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label={t('backToProfile')}
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground rtl:-scale-x-100" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">{t('links.help')}</h1>
        </div>

        {/* Contact card */}
        <section className="rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 text-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-extrabold">{t('help.talkTitle')}</h2>
          </div>
          <p className="text-sm text-white/90 leading-relaxed mb-3">
            {t('help.talkBody')}
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=MyPhonicsBooks%20support`}
            className="w-full block text-center py-3 rounded-xl bg-white text-fuchsia-700 text-sm font-extrabold active:scale-[0.97] transition-transform"
          >
            <Mail className="w-4 h-4 inline me-1.5" />
            {t('help.emailUs')} <span dir="ltr">{SUPPORT_EMAIL}</span>
          </a>
        </section>

        {/* FAQs */}
        <section className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 pt-5 pb-2">
            {t('help.faqTitle')}
          </p>
          <div className="divide-y divide-border">
            {FAQ_IDS.map((id, i) => {
              const open = openIdx === i;
              return (
                <div key={id}>
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-start hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm font-bold text-foreground leading-snug">{t(`help.faq.${id}.q`)}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <p className="text-xs text-muted-foreground leading-relaxed px-5 pb-4">{t(`help.faq.${id}.a`)}</p>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Policies */}
        <section className="bg-card rounded-3xl border border-border divide-y divide-border shadow-card overflow-hidden">
          <Link
            to="/privacy"
            className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t('help.privacy')}</span>
            </div>
          </Link>
          <Link
            to="/terms"
            className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t('help.terms')}</span>
            </div>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
