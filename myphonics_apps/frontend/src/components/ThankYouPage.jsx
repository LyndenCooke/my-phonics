import React from 'react';
import { motion } from 'framer-motion';
import { useLocation, Link } from 'react-router-dom';
import { Download, Printer, BookOpen, ArrowRight, PartyPopper, Layers } from 'lucide-react';

const PRINT_STEPS = [
  'Open the PDF and select "Print"',
  'Choose A4 paper, double-sided (flip on short edge)',
  'Print all pages',
  'Fold each sheet in half, stack and staple along the spine',
];

export default function ThankYouPage() {
  const location = useLocation();
  const { childName, level, downloadUrl } = location.state || {};

  const levelColors = {
    1: '#E84B8A', 2: '#F59E0B', 3: '#22C55E',
    4: '#3B82F6', 5: '#8B5CF6', 6: '#14B8A6',
  };

  return (
    <div className="min-h-screen bg-amber-50/30 font-sans relative overflow-hidden">
      {/* Background */}
      <div className="absolute -top-[15%] -right-[10%] w-[45%] h-[45%] rounded-full bg-pink-200/30 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] -left-[10%] w-[35%] h-[35%] rounded-full bg-amber-200/20 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="p-4 sm:p-6">
        <div className="max-w-3xl mx-auto flex items-center gap-2">
          <div className="w-9 h-9 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-pink-500/20">
            <BookOpen size={18} />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-slate-800">
            MyPhonicsBooks
          </span>
        </div>
      </header>

      <main className="relative z-10 px-4 pb-20 pt-8">
        <div className="max-w-lg mx-auto">
          {/* Success card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-6 sm:p-8 text-center mb-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: levelColors[level] || '#6366f1' }}
            >
              <PartyPopper size={36} />
            </motion.div>

            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mb-3">
              {childName ? `${childName}'s templates are ready!` : 'Your templates are ready!'}
            </h1>

            <p className="text-slate-600 mb-8">
              Download the PDF below and follow the print guide to make a real book at home.
            </p>

            {/* Download button */}
            <motion.a
              href={downloadUrl || '#'}
              download
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl flex items-center justify-center gap-2 mb-4 inline-block"
            >
              <Download size={20} />
              Download Templates
            </motion.a>
          </motion.div>

          {/* Print guide */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 mb-6"
          >
            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Printer size={18} className="text-pink-500" />
              How to print and fold
            </h2>
            <ol className="space-y-3">
              {PRINT_STEPS.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="shrink-0 w-6 h-6 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.div>

          {/* Upsell */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-panel p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-4 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Layers size={24} />
            </div>
            <h2 className="font-bold text-lg text-slate-900 mb-2">
              Want a personalised book for {childName || 'your child'}?
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              Get a fully customised book with {childName ? `${childName}'s` : 'their'} name in every story — personalised characters, interests, and phonics-verified words throughout.
            </p>
            <Link
              to="/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-800 hover:border-pink-300 hover:bg-pink-50 transition-all"
            >
              Create a personalised book
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
