import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="font-display text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: April 2026
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          <section>
            <h2 className="text-xl font-bold">1. About these terms</h2>
            <p>
              These terms govern your use of MyPhonicsBooks. By creating an
              account, taking the assessment, or buying any product, you
              agree to them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">2. Who can sign up</h2>
            <p>
              Accounts must be created by a parent or guardian on behalf of
              a child. You must be 18 or older to enter into this
              agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">3. Your content</h2>
            <p>
              You retain ownership of anything your child creates inside
              the hub (drawings, quiz answers, progress data). You grant us
              a limited licence to store and display it inside your account
              so that the learning hub can function.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">4. Our content</h2>
            <p>
              All books, illustrations, audio, and assessment material are
              the copyright of MyPhonicsBooks. You may download PDFs for
              personal family use only. Please don't redistribute, resell,
              or share with other families.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">5. Subscriptions and refunds</h2>
            <p>
              Monthly and annual subscriptions renew automatically until
              cancelled. You can cancel at any time from your Profile — you
              keep access until the end of your paid period. One-time
              purchases (individual books, bundles) are non-refundable once
              the PDF has been downloaded, unless required by UK consumer
              law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">6. Free trials</h2>
            <p>
              Where a free trial is offered, you will not be charged during
              the trial. We'll send a reminder before the trial ends. If
              you don't cancel, the subscription begins and your card is
              charged.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">7. Acceptable use</h2>
            <p>
              Please don't attempt to reverse-engineer the site, scrape
              content, use the service to harass anyone, or access other
              users' accounts. We may suspend accounts that do.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">8. Educational outcomes</h2>
            <p>
              MyPhonicsBooks is a supportive reading resource. We don't
              guarantee any specific educational outcome or replace the
              role of a qualified teacher.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">9. Liability</h2>
            <p>
              We provide the service "as is" and our liability is limited
              to the amount you've paid us in the past 12 months, except
              where law requires otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">10. Changes</h2>
            <p>
              We may update these terms. Material changes will be
              communicated by email or in-app notice before they take
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">11. Governing law</h2>
            <p>
              These terms are governed by the laws of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">12. Contact</h2>
            <p>
              Questions? Email{' '}
              <a href="mailto:hello@myphonicsbooks.com" className="text-primary underline">
                hello@myphonicsbooks.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
