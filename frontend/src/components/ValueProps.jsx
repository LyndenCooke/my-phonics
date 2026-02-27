import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Heart, GraduationCap, Printer } from 'lucide-react';

const FEATURES = [
  {
    icon: <ShieldCheck size={24} />,
    title: 'Phonics-verified',
    desc: 'Every single word is checked against your child\'s reading level. No guessing, no gaps.',
    color: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  {
    icon: <Heart size={24} />,
    title: 'Personalised',
    desc: 'Your child is the hero. Their name, their friends, their favourite things \u2014 woven into every story.',
    color: 'bg-pink-50 text-pink-600',
    border: 'border-pink-100',
  },
  {
    icon: <GraduationCap size={24} />,
    title: 'Curriculum-aligned',
    desc: 'Based on Letters and Sounds \u2014 the same phonics framework used in thousands of UK schools.',
    color: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
  {
    icon: <Printer size={24} />,
    title: 'Print at home',
    desc: 'A proper A5 book \u2014 not a worksheet. Print on A4, fold and staple. Real book, real reading.',
    color: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
];

export default function ValueProps() {
  return (
    <section className="py-20 px-4 bg-white/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-slate-900 mb-4">
            Why parents love it
          </h2>
          <p className="text-lg text-slate-600 max-w-lg mx-auto">
            Books that actually match what your child can read &mdash; not what someone thinks they should.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`bg-white/80 backdrop-blur-sm p-6 flex gap-4 rounded-2xl border ${feat.border} shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className={`shrink-0 w-12 h-12 rounded-xl ${feat.color} flex items-center justify-center`}>
                {feat.icon}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{feat.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
