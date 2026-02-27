import React from 'react';
import { BookOpen } from 'lucide-react';
import LandingHero from '../components/LandingHero';
import TrustBar from '../components/TrustBar';
import HowItWorks from '../components/HowItWorks';
import ValueProps from '../components/ValueProps';
import LevelPreview from '../components/LevelPreview';
import FAQ from '../components/FAQ';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-amber-50/30 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-pink-100/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <BookOpen size={18} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-800">
            MyPhonicsBooks
          </span>
        </div>
      </header>

      {/* Page sections */}
      <LandingHero />
      <TrustBar />
      <HowItWorks />
      <ValueProps />
      <LevelPreview />
      <FAQ />

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-pink-100/50 bg-gradient-to-t from-pink-50/50 to-white/50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-rose-500 rounded-lg flex items-center justify-center text-white">
              <BookOpen size={16} />
            </div>
            <span className="font-display font-bold text-slate-800">MyPhonicsBooks</span>
          </div>
          <p className="text-sm text-slate-500 mb-2">
            Personalised phonics books for children aged 4-8.
          </p>
          <p className="text-xs text-slate-400">
            Based on Letters and Sounds (DfE 2007). Not affiliated with Read Write Inc, Oxford Reading Tree, or any commercial phonics programme.
          </p>
        </div>
      </footer>
    </div>
  );
}
