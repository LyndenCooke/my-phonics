import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground tracking-tight mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Last updated: April 2026
        </p>

        <div className="prose prose-sm max-w-none text-foreground space-y-5">
          <section>
            <h2 className="text-xl font-bold">Who we are</h2>
            <p>
              MyPhonicsBooks is operated by Lynden Cooke. This policy
              explains what information we collect, why we collect it, and
              how you can exercise your rights under UK GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Information we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <strong>Parent email address</strong> — so we can send your
                child's assessment results, account access, and purchase
                receipts.
              </li>
              <li>
                <strong>Child's first name and age</strong> — used inside
                the assessment and learning hub to personalise the
                experience. We do not share this with third parties.
              </li>
              <li>
                <strong>Assessment answers and reading activity</strong> —
                so we can recommend the right reading level and show
                progress over time.
              </li>
              <li>
                <strong>Payment details</strong> — handled by Stripe. We
                never see or store full card numbers.
              </li>
              <li>
                <strong>Basic analytics</strong> — anonymised page-view and
                funnel data so we can improve the product.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">How we use your data</h2>
            <p>
              We use your information only to provide the service:
              delivering books, saving progress, processing payments, and
              sending account-related emails. We do not sell your data and
              we do not share it with marketing partners.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Processors we use</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Supabase — database, authentication, file storage</li>
              <li>Stripe — payment processing</li>
              <li>Vercel — hosting</li>
              <li>ElevenLabs — audio synthesis for reading support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold">Your rights</h2>
            <p>
              You can request a copy of your data, ask us to correct it, or
              ask us to delete your account at any time. Email{' '}
              <a href="mailto:hello@myphonicsbooks.com" className="text-primary underline">
                hello@myphonicsbooks.com
              </a>{' '}
              and we'll respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Children</h2>
            <p>
              Accounts are created by parents or guardians. We never ask
              children to register themselves, and we never send marketing
              emails about one child to another family.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Cookies</h2>
            <p>
              We use a small number of essential cookies to keep you signed
              in. We do not use third-party advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold">Contact</h2>
            <p>
              Questions about this policy? Email{' '}
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
