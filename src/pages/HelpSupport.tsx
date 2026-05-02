/**
 * HelpSupport — FAQs + contact + policy links.
 *
 * No backend wiring needed for the FAQ accordion; the contact button uses
 * a mailto: link so the user's mail client handles delivery without us
 * standing up a contact-form endpoint.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, ChevronDown, Mail, FileText, Shield, MessageCircle } from 'lucide-react';

const SUPPORT_EMAIL = 'support@myphonicsbooks.com';

const FAQS: Array<{ q: string; a: string }> = [
  {
    q: 'How does the assessment work?',
    a: "Pick the Quick Check (~3 min) for a fast level read, or the Full Test (~10 min) for a deeper picture covering sounds, real words, alien words and tricky words at every level. Results show your child's recommended level plus what they already know.",
  },
  {
    q: 'How does my child progress through the books?',
    a: 'Each book is read 5 times to build fluency, with a quick Check at the end. Pass the Check and the next book unlocks. Master every book in a level and the Level Check appears, which moves your child to the next level when passed.',
  },
  {
    q: 'What are "stamps" and "Checks"?',
    a: "A stamp is awarded for each unique day your child reads the current book — you can't earn two stamps in one day, the system gently asks them to come back tomorrow. Stamps 3, 4 and 5 each include a brief readiness check to confirm fluency, not just rote re-reading.",
  },
  {
    q: 'Can I unlock the next book manually?',
    a: 'Manual unlock is on the Parent Dashboard but currently shows "Coming soon" — we want to make sure overrides don\'t accidentally skip phonics gaps. If you genuinely need a book unlocked early, email us and we\'ll do it for you.',
  },
  {
    q: 'How do refunds work?',
    a: "Subscriptions can be cancelled any time from your account — you keep access until the period ends. For one-time purchases (Founders Club, full bundle), email us within 14 days for a full refund.",
  },
  {
    q: 'Why does my widget / home-screen app look out of date?',
    a: "PWAs cache aggressively. Force-close the app and reopen it. If it still looks old, open the site in your browser and pull-to-refresh — the next launch will pick up the new version.",
  },
];

export default function HelpSupport() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto space-y-5">
        <div className="flex items-center gap-3">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Help & Support</h1>
        </div>

        {/* Contact card */}
        <section className="rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 text-white p-5 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <h2 className="font-display text-lg font-extrabold">Talk to us</h2>
          </div>
          <p className="text-sm text-white/90 leading-relaxed mb-3">
            We read every email personally. Most replies arrive within one working day.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=MyPhonicsBooks%20support`}
            className="w-full block text-center py-3 rounded-xl bg-white text-fuchsia-700 text-sm font-extrabold active:scale-[0.97] transition-transform"
          >
            <Mail className="w-4 h-4 inline mr-1.5" />
            Email {SUPPORT_EMAIL}
          </a>
        </section>

        {/* FAQs */}
        <section className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-5 pt-5 pb-2">
            Frequently asked
          </p>
          <div className="divide-y divide-border">
            {FAQS.map((f, i) => {
              const open = openIdx === i;
              return (
                <div key={i}>
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    className="w-full flex items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                  >
                    <span className="text-sm font-bold text-foreground leading-snug">{f.q}</span>
                    <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
                  </button>
                  {open && (
                    <p className="text-xs text-muted-foreground leading-relaxed px-5 pb-4">{f.a}</p>
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
              <span className="text-sm font-medium text-foreground">Privacy Policy</span>
            </div>
          </Link>
          <Link
            to="/terms"
            className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Terms of Service</span>
            </div>
          </Link>
        </section>
      </div>
    </Layout>
  );
}
