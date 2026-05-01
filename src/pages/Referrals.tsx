/**
 * Referrals — dedicated /profile/referrals page.
 *
 * Reuses the existing ReferralPanel component (which has full Stripe-backed
 * earnings logic) but presents it as a standalone page with a hero header
 * and back button, matching the mobile-app spec. The panel itself starts
 * collapsed by design on Profile; here the user has already navigated to
 * the referrals page so we want it open.
 */
import { Link } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, Gift } from 'lucide-react';
import { ReferralPanel } from '@/components/profile/ReferralPanel';

export default function Referrals() {
  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link
            to="/profile"
            aria-label="Back to Profile"
            className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted/50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <h1 className="font-display text-xl font-extrabold text-foreground">Refer & Earn</h1>
        </div>

        {/* Hero — sets the tone before the stats */}
        <div className="rounded-3xl bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 text-white p-6 mb-6 shadow-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <h2 className="font-display text-xl font-extrabold">Invite friends, earn rewards</h2>
          </div>
          <p className="text-sm text-white/90 leading-relaxed">
            Share MyPhonicsBooks and earn 50% on every Founders Club spot you bring in. Friends get a free book,
            you get credit — everyone wins.
          </p>
        </div>

        {/* Lift the existing panel — has Stripe-backed stats + share buttons */}
        <ReferralPanel />
      </div>
    </Layout>
  );
}
