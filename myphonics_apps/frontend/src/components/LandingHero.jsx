import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* Floating phonics letters for primary school feel */
const FLOATING_LETTERS = [
  { letter: 's', top: '15%', left: '5%', delay: 0, color: '#E84B8A', size: 'text-3xl' },
  { letter: 'a', top: '25%', right: '8%', delay: 0.5, color: '#F59E0B', size: 'text-4xl' },
  { letter: 't', bottom: '30%', left: '8%', delay: 1, color: '#22C55E', size: 'text-2xl' },
  { letter: 'p', top: '60%', right: '5%', delay: 1.5, color: '#3B82F6', size: 'text-3xl' },
  { letter: '\u2605', top: '10%', left: '20%', delay: 0.3, color: '#F59E0B', size: 'text-xl' },
  { letter: '\u2605', bottom: '20%', right: '15%', delay: 0.8, color: '#E84B8A', size: 'text-lg' },
  { letter: '\u2605', top: '45%', left: '3%', delay: 1.2, color: '#22C55E', size: 'text-sm' },
];

export default function LandingHero() {
  const [childName, setChildName] = useState('');
  const navigate = useNavigate();

  const handleStart = (e) => {
    e.preventDefault();
    navigate('/free-book', { state: { childName } });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 pt-20 pb-16 overflow-hidden">
      {/* Warm colourful background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-pink-200/40 blur-[120px]" />
        <div className="absolute top-[30%] -left-[10%] w-[40%] h-[40%] rounded-full bg-amber-200/30 blur-[120px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[30%] h-[30%] rounded-full bg-green-200/20 blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-amber-50/30 to-transparent" />
      </div>

      {/* Floating letters & stars */}
      {FLOATING_LETTERS.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.15, scale: 1 }}
          transition={{ delay: item.delay, duration: 0.8 }}
          className={`absolute ${item.size} font-display font-bold pointer-events-none select-none ${i % 2 === 0 ? 'animate-float' : 'animate-float-slow'}`}
          style={{
            top: item.top,
            bottom: item.bottom,
            left: item.left,
            right: item.right,
            color: item.color,
          }}
        >
          {item.letter}
        </motion.div>
      ))}

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-50 to-amber-50 text-pink-700 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-pink-100/50"
        >
          <Sparkles size={16} className="text-amber-500" />
          Aligned with the UK phonics curriculum
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-slate-900 mb-6 leading-tight"
        >
          Phonics books made{' '}
          <span className="text-gradient">just for {childName || 'your child'}</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg sm:text-xl text-slate-600 mb-10 max-w-lg mx-auto"
        >
          Free printable templates matched to their exact phonics level. Or get a fully personalised book with their name in every story.
        </motion.p>

        {/* Name input + CTA */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          onSubmit={handleStart}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="text"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Your child's first name"
            className="flex-1 px-5 py-4 rounded-xl border-2 border-pink-200 bg-white text-slate-900 text-lg placeholder:text-slate-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-500/10 outline-none transition-all"
            required
          />
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-pink-500/30 hover:shadow-xl hover:shadow-pink-500/40 transition-all flex items-center justify-center gap-2"
          >
            Get Free Templates
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </motion.form>

        {/* Sub-CTA trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-slate-500 mt-4 flex items-center justify-center gap-1"
        >
          <span className="text-amber-400">&#11088;</span> Free templates &mdash; no card required. Based on Letters and Sounds.
        </motion.p>
      </div>
    </section>
  );
}
